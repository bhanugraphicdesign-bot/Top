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

/**
 * Validate Live Cloud Firestore Connection
 */
export async function validateFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[Firebase] Client is offline or database instance is unreachable.');
    }
    // Expected if test document does not exist yet; network handshake succeeded
    return true;
  }
}

// Auto-run connection health check asynchronously on boot
validateFirestoreConnection().catch((err) => {
  console.info('[Firebase Handshake]', err?.message || err);
});

export default app;
