import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase/config';
import {
  syncUserAccount,
  fetchUserRole,
  logAuditEvent,
  authenticatedFetch,
} from '../firebase/services';
import { useLanguage } from './LanguageContext';

interface AuthContextType {
  currentUser: User | null;
  userRole: 'admin' | 'client';
  isAdmin: boolean;
  isAuthReady: boolean;
  authRedirectError: unknown | null;
  clearAuthRedirectError: () => void;
  loginWithGoogle: () => Promise<'popup' | 'redirect'>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  isAuthModalOpen: boolean;
  authModalTab: 'login' | 'register' | 'forgot';
  openAuthModal: (tab?: 'login' | 'register' | 'forgot') => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { language, showToast } = useLanguage();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'client'>('client');
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [authRedirectError, setAuthRedirectError] = useState<unknown | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register' | 'forgot'>('login');

  const clearAuthRedirectError = useCallback(() => {
    setAuthRedirectError(null);
  }, []);

  const openAuthModal = (tab: 'login' | 'register' | 'forgot' = 'login') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  // Handle Google signInWithRedirect result on initial page load
  useEffect(() => {
    let active = true;
    getRedirectResult(auth)
      .then(async (result) => {
        if (!active || !result?.user) return;
        await logAuditEvent(
          'AUTH_LOGIN_GOOGLE',
          `users/${result.user.uid}`,
          `Signed in with Google redirect: ${result.user.email}`
        );
        closeAuthModal();
        showToast(
          language === 'hi'
            ? 'Google द्वारा सफलतापूर्वक लॉगिन संपन्न हुआ।'
            : 'Signed in with Google successfully.',
          'success'
        );
      })
      .catch((err: any) => {
        if (!active) return;
        console.warn('[Google Redirect Auth Warning]', err);
        setAuthRedirectError(err);
        if (err?.code === 'auth/unauthorized-domain') {
          showToast(
            language === 'hi'
              ? 'यह डोमेन अभी Firebase में अधिकृत नहीं है। This domain is not yet authorized in Firebase.'
              : 'This domain is not yet authorized in Firebase. / यह डोमेन अभी Firebase में अधिकृत नहीं है।',
            'alert'
          );
          setIsAuthModalOpen(true);
        }
      });

    return () => {
      active = false;
    };
    // Intentionally run once on mount to capture any pending OAuth redirect callback
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen to Firebase Auth state (admin derived strictly from user_roles/{uid} or custom claim)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        let resolvedAdmin = false;
        try {
          await syncUserAccount({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
          });

          const role = await fetchUserRole(user.uid);
          if (role === 'admin') {
            resolvedAdmin = true;
          }

          if (!resolvedAdmin) {
            try {
              const tokenResult = await user.getIdTokenResult();
              if (tokenResult?.claims?.admin === true || tokenResult?.claims?.role === 'admin') {
                resolvedAdmin = true;
              }
            } catch {
              // Ignore token claim read failure
            }
          }

          if (!resolvedAdmin) {
            try {
              const statusRes = await authenticatedFetch('/api/auth/status', {}, { user });
              if (statusRes.ok) {
                const statusData = await statusRes.json();
                resolvedAdmin = statusData?.isAdmin === true;
              }
            } catch {
              // Offline fallback keeps client role strict
            }
          }

          setUserRole(resolvedAdmin ? 'admin' : 'client');
        } catch (err) {
          console.warn('[Auth Sync Warning]', err);
          setUserRole('client');
        }
      } else {
        setUserRole('client');
      }
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = useCallback(async (): Promise<'popup' | 'redirect'> => {
    setAuthRedirectError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        await logAuditEvent(
          'AUTH_LOGIN_GOOGLE',
          `users/${result.user.uid}`,
          `Signed in with Google: ${result.user.email}`
        );
      }
      closeAuthModal();
      return 'popup';
    } catch (err: any) {
      const code = err?.code || '';
      if (
        code === 'auth/popup-blocked' ||
        code === 'auth/popup-closed-by-user' ||
        code === 'auth/cancelled-popup-request'
      ) {
        await signInWithRedirect(auth, googleProvider);
        return 'redirect';
      }
      throw err;
    }
  }, []);

  const loginWithEmail = useCallback(async (email: string, pass: string) => {
    const cleanEmail = email.trim();
    const result = await signInWithEmailAndPassword(auth, cleanEmail, pass);
    if (result.user) {
      await logAuditEvent('AUTH_LOGIN_EMAIL', `users/${result.user.uid}`, `Signed in with Email: ${cleanEmail}`);
    }
    closeAuthModal();
  }, []);

  const registerWithEmail = useCallback(async (email: string, pass: string, name?: string) => {
    const cleanEmail = email.trim();
    const cleanName = (name || '').trim();
    const result = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
    if (result.user) {
      if (cleanName) {
        await updateProfile(result.user, { displayName: cleanName });
        await syncUserAccount({
          uid: result.user.uid,
          email: result.user.email,
          displayName: cleanName,
          photoURL: result.user.photoURL,
        });
      }
      await logAuditEvent('AUTH_REGISTER', `users/${result.user.uid}`, `Registered new account: ${cleanEmail}`);
    }
    closeAuthModal();
  }, []);

  const logout = useCallback(async () => {
    if (currentUser) {
      await logAuditEvent('AUTH_LOGOUT', `users/${currentUser.uid}`, `Logged out user: ${currentUser.email}`);
    }
    await signOut(auth);
  }, [currentUser]);

  const resetPassword = useCallback(async (email: string) => {
    const cleanEmail = email.trim();
    await sendPasswordResetEmail(auth, cleanEmail);
    await logAuditEvent('AUTH_RESET_PASSWORD', 'auth', `Password reset email sent to: ${cleanEmail}`);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userRole,
        isAdmin: userRole === 'admin',
        isAuthReady,
        authRedirectError,
        clearAuthRedirectError,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        logout,
        resetPassword,
        isAuthModalOpen,
        authModalTab,
        openAuthModal,
        closeAuthModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
