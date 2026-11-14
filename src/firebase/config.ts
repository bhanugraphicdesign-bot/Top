import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  doc,
  getDocFromServer,
  Firestore,
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

const resolvedMeasurementId =
  (import.meta.env?.VITE_FIREBASE_MEASUREMENT_ID as string | undefined)?.trim() ||
  (firebaseConfig.measurementId || '').trim();

const resolvedFirebaseConfig = {
  ...firebaseConfig,
  ...(resolvedMeasurementId ? { measurementId: resolvedMeasurementId } : {}),
};

// Initialize Firebase App instance singleton
const app = getApps().length === 0 ? initializeApp(resolvedFirebaseConfig) : getApp();

export const firebaseApp = app;
export const MEASUREMENT_ID = resolvedMeasurementId;

// CRITICAL: Pass firestoreDatabaseId explicitly to bind to provisioned instance.
// Use experimentalForceLongPolling in browser environments so iframe/proxy WebChannel buffering
// never stalls streams for 10 seconds ("Could not reach Cloud Firestore backend").
function createFirestoreInstance(): Firestore {
  const settings =
    typeof window !== 'undefined'
      ? {
          experimentalForceLongPolling: true,
          ignoreUndefinedProperties: true,
        }
      : {
          ignoreUndefinedProperties: true,
        };

  try {
    return initializeFirestore(app, settings, firebaseConfig.firestoreDatabaseId);
  } catch {
    return getFirestore(app, firebaseConfig.firestoreDatabaseId);
  }
}

export const db = createFirestoreInstance();
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
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    lastFirestoreHealth = {
      connected: false,
      checkedAt: new Date().toISOString(),
      error: 'Browser is offline',
    };
    return false;
  }

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

    lastFirestoreHealth = {
      connected: false,
      checkedAt: new Date().toISOString(),
      error: msg,
    };
    return false;
  }
}

// Auto-run connection health check asynchronously on boot (and retry when coming back online)
if (typeof window !== 'undefined') {
  if (typeof navigator === 'undefined' || navigator.onLine !== false) {
    void validateFirestoreConnection();
  }
  window.addEventListener(
    'online',
    () => {
      void validateFirestoreConnection();
    },
    { once: true }
  );
}

export default app;
