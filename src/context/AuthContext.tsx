import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
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
  isLegacyOrEnvRootAdminEmail,
  ensureBootstrapAdminRoleDoc,
} from '../firebase/services';

interface AuthContextType {
  currentUser: User | null;
  userRole: 'admin' | 'client';
  isAdmin: boolean;
  isAuthReady: boolean;
  loginWithGoogle: () => Promise<void>;
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
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'client'>('client');
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register' | 'forgot'>('login');

  const openAuthModal = (tab: 'login' | 'register' | 'forgot' = 'login') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  // Listen to Firebase Auth state (never grants admin without verified email or Firestore role)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const isClientBootstrapAdmin =
          user.emailVerified === true &&
          isLegacyOrEnvRootAdminEmail(user.email, user.emailVerified);

        try {
          await syncUserAccount({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
          });

          const role = await fetchUserRole(user.uid);
          let resolvedAdmin = role === 'admin' || isClientBootstrapAdmin;

          if (!resolvedAdmin) {
            try {
              const idToken = await user.getIdToken();
              const statusRes = await fetch('/api/auth/status', {
                headers: { Authorization: `Bearer ${idToken}` },
              });
              if (statusRes.ok) {
                const statusData = await statusRes.json();
                resolvedAdmin = statusData?.isAdmin === true;
              }
            } catch {
              // Offline fallback keeps client role strict
            }
          }

          if (resolvedAdmin && role !== 'admin') {
            await ensureBootstrapAdminRoleDoc({ uid: user.uid, email: user.email });
          }

          setUserRole(resolvedAdmin ? 'admin' : 'client');
        } catch (err) {
          console.warn('[Auth Sync Warning]', err);
          setUserRole(isClientBootstrapAdmin ? 'admin' : 'client');
        }
      } else {
        setUserRole('client');
      }
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = useCallback(async () => {
    const result = await signInWithPopup(auth, googleProvider);
    if (result.user) {
      await logAuditEvent('AUTH_LOGIN_GOOGLE', `users/${result.user.uid}`, `Signed in with Google: ${result.user.email}`);
    }
    closeAuthModal();
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
