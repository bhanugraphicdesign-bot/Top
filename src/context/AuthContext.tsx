import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from 'firebase/auth';
import { auth, googleProvider, browserPopupRedirectResolver } from '../firebase/config';
import {
  syncUserAccount,
  fetchUserRoleDetails,
  logAuditEvent,
  authenticatedFetch,
} from '../firebase/services';

type RoleSource = 'user_roles' | 'custom_claim' | 'owner_email' | 'client' | null;
type PostLoginTarget = 'client-dashboard' | 'admin-dashboard' | null;

interface AuthContextType {
  currentUser: User | null;
  userRole: 'admin' | 'client';
  isAdmin: boolean;
  isSuperAdmin: boolean;
  roleDocExists: boolean;
  roleSource: RoleSource;
  roleCheckError: string | null;
  isAuthReady: boolean;
  isRoleChecking: boolean;
  isLoggingOut: boolean;
  logoutSeq: number;
  clearLoggingOut: () => void;
  postLoginRedirectTarget: PostLoginTarget;
  consumePostLoginRedirect: () => void;
  refreshUserRole: () => Promise<boolean>;
  loginWithGoogle: (rememberMe?: boolean) => Promise<void>;
  loginWithEmail: (email: string, pass: string, rememberMe?: boolean) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  isAuthModalOpen: boolean;
  authModalTab: 'login' | 'register' | 'forgot';
  openAuthModal: (tab?: 'login' | 'register' | 'forgot') => void;
  closeAuthModal: () => void;
  isProfileModalOpen: boolean;
  openProfileModal: () => void;
  closeProfileModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'client'>('client');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [roleDocExists, setRoleDocExists] = useState(false);
  const [roleSource, setRoleSource] = useState<RoleSource>(null);
  const [roleCheckError, setRoleCheckError] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isRoleChecking, setIsRoleChecking] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutSeq, setLogoutSeq] = useState(0);
  const [postLoginRedirectTarget, setPostLoginRedirectTarget] = useState<PostLoginTarget>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register' | 'forgot'>('login');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const googleSignInInFlightRef = useRef<Promise<void> | null>(null);
  const pendingInteractiveLoginRef = useRef(false);

  const openAuthModal = useCallback((tab: 'login' | 'register' | 'forgot' = 'login') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  const openProfileModal = useCallback(() => {
    setIsProfileModalOpen(true);
  }, []);

  const closeProfileModal = useCallback(() => {
    setIsProfileModalOpen(false);
  }, []);

  const consumePostLoginRedirect = useCallback(() => {
    setPostLoginRedirectTarget(null);
  }, []);

  const clearLoggingOut = useCallback(() => {
    setIsLoggingOut(false);
  }, []);

  const resolveUserRoleState = useCallback(
    async (user: User, forceTokenRefresh = false): Promise<boolean> => {
      setIsRoleChecking(true);
      setRoleCheckError(null);
      let resolvedAdmin = false;
      let resolvedSuperAdmin = false;
      let resolvedSource: RoleSource = 'client';
      let collectedError: string | null = null;

      try {
        try {
          await syncUserAccount({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
          });
        } catch (syncErr) {
          console.warn('[Auth Account Sync Warning]', syncErr);
        }

        // 1. Primary RBAC check: Firestore `user_roles/{uid}` by real Firebase UID
        const details = await fetchUserRoleDetails(user.uid, forceTokenRefresh);
        let resolvedDocExists = details.exists;
        if (details.error) {
          collectedError = details.error;
        }
        if (details.role === 'admin') {
          resolvedAdmin = true;
          resolvedSuperAdmin = details.isSuperAdmin;
          resolvedSource = 'user_roles';
        }

        // 2. Check Firebase Auth custom claims (`admin: true`, `role: "admin"|"super_admin"`, `superAdmin: true`)
        try {
          const tokenResult = await user.getIdTokenResult(forceTokenRefresh);
          if (tokenResult?.claims?.superAdmin === true || tokenResult?.claims?.role === 'super_admin') {
            resolvedSuperAdmin = true;
          }
          if (
            tokenResult?.claims?.admin === true ||
            tokenResult?.claims?.superAdmin === true ||
            tokenResult?.claims?.role === 'admin' ||
            tokenResult?.claims?.role === 'super_admin'
          ) {
            resolvedAdmin = true;
            if (resolvedSource !== 'user_roles') {
              resolvedSource = 'custom_claim';
            }
          }
        } catch {
          // Ignore token claim read failure
        }

        // 3. Authoritative server RBAC verification (owner/admin verified on server)
        try {
          const statusRes = await authenticatedFetch('/api/auth/status', {}, { user });
          if (statusRes.ok) {
            const statusData = await statusRes.json();
            if (typeof statusData?.roleDocExists === 'boolean') {
              resolvedDocExists = resolvedDocExists || statusData.roleDocExists;
            }
            resolvedSuperAdmin = statusData?.isSuperAdmin === true;
            resolvedAdmin = statusData?.isAdmin === true;
            resolvedSource = resolvedAdmin
              ? (statusData?.roleSource || resolvedSource || 'user_roles')
              : 'client';
          }
        } catch {
          // Offline fallback keeps previously checked client claims/role
        }

        if (auth.currentUser && auth.currentUser.uid !== user.uid) {
          return false;
        }

        setUserRole(resolvedAdmin ? 'admin' : 'client');
        setIsSuperAdmin(resolvedAdmin && resolvedSuperAdmin);
        setRoleDocExists(resolvedDocExists);
        setRoleSource(resolvedAdmin ? resolvedSource : 'client');
        setRoleCheckError(!resolvedAdmin ? collectedError : null);
        return resolvedAdmin;
      } catch (err: any) {
        console.warn('[Auth Sync Warning]', err);
        setUserRole('client');
        setIsSuperAdmin(false);
        setRoleDocExists(false);
        setRoleSource('client');
        setRoleCheckError(err instanceof Error ? err.message : 'Unable to verify administrator role.');
        return false;
      } finally {
        setIsRoleChecking(false);
      }
    },
    []
  );

  // Listen to Firebase Auth state (admin derived strictly from user_roles/{uid} or custom claim)
  // Post-login dashboard redirect triggers ONLY after onAuthStateChanged confirms the user & role.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const shouldRedirectAfterLogin = pendingInteractiveLoginRef.current;
        const resolvedAdmin = await resolveUserRoleState(user, shouldRedirectAfterLogin);
        if (auth.currentUser?.uid === user.uid && shouldRedirectAfterLogin) {
          pendingInteractiveLoginRef.current = false;
          setIsAuthModalOpen(false);
          setPostLoginRedirectTarget(resolvedAdmin ? 'admin-dashboard' : 'client-dashboard');
        }
      } else {
        pendingInteractiveLoginRef.current = false;
        setPostLoginRedirectTarget(null);
        setUserRole('client');
        setIsSuperAdmin(false);
        setRoleDocExists(false);
        setRoleSource(null);
        setRoleCheckError(null);
        setIsRoleChecking(false);
        setIsProfileModalOpen(false);
      }
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, [resolveUserRoleState]);

  const refreshUserRole = useCallback(async (): Promise<boolean> => {
    const activeUser = auth.currentUser;
    if (!activeUser) {
      setUserRole('client');
      setIsSuperAdmin(false);
      setRoleDocExists(false);
      setRoleSource(null);
      setIsRoleChecking(false);
      return false;
    }
    return resolveUserRoleState(activeUser, true);
  }, [resolveUserRoleState]);

  const loginWithGoogle = useCallback(async (rememberMe = true): Promise<void> => {
    if (googleSignInInFlightRef.current) {
      return googleSignInInFlightRef.current;
    }

    const run = (async () => {
      let signedInUser: User;
      pendingInteractiveLoginRef.current = true;
      setPostLoginRedirectTarget(null);
      try {
        await setPersistence(
          auth,
          rememberMe ? browserLocalPersistence : browserSessionPersistence
        ).catch(() => undefined);
        const result = await signInWithPopup(auth, googleProvider, browserPopupRedirectResolver);
        signedInUser = result.user;
      } catch (err: any) {
        const code = String(err?.code || '');
        const msg = String(err?.message || '');
        const isPopupCloseRace =
          code === 'auth/popup-closed-by-user' ||
          code === 'auth/cancelled-popup-request' ||
          msg.includes('Pending promise was never set');

        if (isPopupCloseRace) {
          // Brief grace check: in iframe/COOP environments, auth state can settle right as the popup closes
          await new Promise((resolve) => window.setTimeout(resolve, 180));
          if (auth.currentUser) {
            signedInUser = auth.currentUser;
          } else if (msg.includes('Pending promise was never set')) {
            pendingInteractiveLoginRef.current = false;
            setPostLoginRedirectTarget(null);
            const normalized = Object.assign(
              new Error('Google sign-in popup was closed before completing.'),
              { code: 'auth/popup-closed-by-user' }
            );
            throw normalized;
          } else {
            pendingInteractiveLoginRef.current = false;
            setPostLoginRedirectTarget(null);
            throw err;
          }
        } else {
          pendingInteractiveLoginRef.current = false;
          setPostLoginRedirectTarget(null);
          throw err;
        }
      }

      if (signedInUser) {
        try {
          await logAuditEvent(
            'AUTH_LOGIN_GOOGLE',
            `users/${signedInUser.uid}`,
            `Signed in with Google: ${signedInUser.email}`
          );
        } catch {
          // Never block sign-in on audit logging failure
        }
      }
    })();

    googleSignInInFlightRef.current = run;
    try {
      await run;
    } finally {
      if (googleSignInInFlightRef.current === run) {
        googleSignInInFlightRef.current = null;
      }
    }
  }, []);

  const loginWithEmail = useCallback(async (email: string, pass: string, rememberMe = true) => {
    const cleanEmail = email.trim();
    pendingInteractiveLoginRef.current = true;
    setPostLoginRedirectTarget(null);
    try {
      await setPersistence(
        auth,
        rememberMe ? browserLocalPersistence : browserSessionPersistence
      ).catch(() => undefined);
      const result = await signInWithEmailAndPassword(auth, cleanEmail, pass);
      if (result.user) {
        try {
          await logAuditEvent(
            'AUTH_LOGIN_EMAIL',
            `users/${result.user.uid}`,
            `Signed in with Email: ${cleanEmail}`
          );
        } catch {
          // Never block sign-in on audit logging failure
        }
      }
    } catch (err) {
      if (!auth.currentUser) {
        pendingInteractiveLoginRef.current = false;
        setPostLoginRedirectTarget(null);
      }
      throw err;
    }
  }, []);

  const registerWithEmail = useCallback(async (email: string, pass: string, name?: string) => {
    const cleanEmail = email.trim();
    const cleanName = (name || '').trim();
    pendingInteractiveLoginRef.current = true;
    setPostLoginRedirectTarget(null);
    try {
      const result = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
      if (result.user) {
        if (cleanName) {
          await updateProfile(result.user, { displayName: cleanName });
          await result.user.reload();
          if (auth.currentUser) {
            setCurrentUser(auth.currentUser);
          }
          try {
            await syncUserAccount({
              uid: result.user.uid,
              email: result.user.email,
              displayName: cleanName,
              photoURL: result.user.photoURL,
            });
          } catch {
            // Non-fatal sync warning
          }
        }
        try {
          await logAuditEvent(
            'AUTH_REGISTER',
            `users/${result.user.uid}`,
            `Registered new account: ${cleanEmail}`
          );
        } catch {
          // Never block registration on audit logging failure
        }
      }
    } catch (err) {
      if (!auth.currentUser) {
        pendingInteractiveLoginRef.current = false;
        setPostLoginRedirectTarget(null);
      }
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoggingOut(true);
    pendingInteractiveLoginRef.current = false;
    setPostLoginRedirectTarget(null);
    setIsAuthModalOpen(false);
    setIsProfileModalOpen(false);
    try {
      sessionStorage.removeItem('pws_demo_client');
    } catch {
      // Ignore storage access errors
    }
    try {
      if (currentUser) {
        await logAuditEvent(
          'AUTH_LOGOUT',
          `users/${currentUser.uid}`,
          `Logged out user: ${currentUser.email}`
        );
      }
    } catch {
      // Never block sign-out on audit logging failure
    }
    try {
      await signOut(auth);
    } finally {
      setLogoutSeq((prev) => prev + 1);
    }
  }, [currentUser]);

  const resetPassword = useCallback(async (email: string) => {
    const cleanEmail = email.trim();
    await sendPasswordResetEmail(auth, cleanEmail);
    try {
      await logAuditEvent('AUTH_RESET_PASSWORD', 'auth', `Password reset email sent to: ${cleanEmail}`);
    } catch {
      // Ignore audit log failure
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userRole,
        isAdmin: userRole === 'admin',
        isSuperAdmin,
        roleDocExists,
        roleSource,
        roleCheckError,
        isAuthReady,
        isRoleChecking,
        isLoggingOut,
        logoutSeq,
        clearLoggingOut,
        postLoginRedirectTarget,
        consumePostLoginRedirect,
        refreshUserRole,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        logout,
        resetPassword,
        isAuthModalOpen,
        authModalTab,
        openAuthModal,
        closeAuthModal,
        isProfileModalOpen,
        openProfileModal,
        closeProfileModal,
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
