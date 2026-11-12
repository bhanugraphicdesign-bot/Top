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
import { syncUserAccount, fetchUserRole, logAuditEvent, seedInitialDatabaseIfEmpty } from '../firebase/services';

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

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          await syncUserAccount({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
          });

          // Check if admin: either root admin email or stored role
          const isRootEmail = user.email === 'ssbhanu41@gmail.com';
          const role = await fetchUserRole(user.uid);
          setUserRole(isRootEmail || role === 'admin' ? 'admin' : 'client');
        } catch (err) {
          console.warn('[Auth Sync Warning]', err);
          const isRootEmail = user.email === 'ssbhanu41@gmail.com';
          setUserRole(isRootEmail ? 'admin' : 'client');
        }
      } else {
        setUserRole('client');
      }
      setIsAuthReady(true);
    });

    // Seed database on boot in background if empty
    seedInitialDatabaseIfEmpty().catch(console.warn);

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
    const result = await signInWithEmailAndPassword(auth, email, pass);
    if (result.user) {
      await logAuditEvent('AUTH_LOGIN_EMAIL', `users/${result.user.uid}`, `Signed in with Email: ${email}`);
    }
    closeAuthModal();
  }, []);

  const registerWithEmail = useCallback(async (email: string, pass: string, name?: string) => {
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    if (result.user) {
      if (name) {
        await updateProfile(result.user, { displayName: name });
      }
      await logAuditEvent('AUTH_REGISTER', `users/${result.user.uid}`, `Registered new account: ${email}`);
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
    await sendPasswordResetEmail(auth, email);
    await logAuditEvent('AUTH_RESET_PASSWORD', 'auth', `Password reset email sent to: ${email}`);
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
