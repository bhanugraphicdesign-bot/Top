import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App instance singleton
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// CRITICAL: Must pass firestoreDatabaseId explicitly to bind to provisioned instance
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

// Configure Google Auth provider options
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

export interface FirestoreConnectionHealth {
  connected: boolean;
  checkedAt: string;
  authLocked?: boolean;
  error?: string;
}

export let lastFirestoreHealth: FirestoreConnectionHealth = {
  connected: false,
  checkedAt: '',
};

/**
 * Validate Live Cloud Firestore Connection.
 * Since /test/{docId} enforces admin-only access (Zero Public Access),
 * a server-returned 'permission-denied' confirms Cloud Firestore is online and rules are enforced,
 * while 'unavailable' / offline errors accurately report connectivity failure.
 */
export async function validateFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    lastFirestoreHealth = {
      connected: true,
      authLocked: false,
      checkedAt: new Date().toISOString(),
    };
    return true;
  } catch (error: any) {
    const code = error?.code || '';
    const msg = error instanceof Error ? error.message : String(error);

    if (code === 'permission-denied' || msg.includes('Missing or insufficient permissions')) {
      lastFirestoreHealth = {
        connected: true,
        authLocked: true,
        checkedAt: new Date().toISOString(),
      };
      return true;
    }

    console.warn('[Firebase] Live Cloud Firestore check failed:', msg);
    lastFirestoreHealth = {
      connected: false,
      checkedAt: new Date().toISOString(),
      error: msg,
    };
    return false;
  }
}

// Auto-run connection health check asynchronously on boot
validateFirestoreConnection().catch((err) => {
  console.warn('[Firebase Handshake]', err?.message || err);
});

export default app;
