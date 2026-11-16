import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  enableNetwork,
  disableNetwork,
  doc,
  getDocFromServer,
  Firestore,
  type FirestoreSettings,
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';
import { initFirebaseAppCheck } from './appCheck';

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
export const appCheck = initFirebaseAppCheck(app);

// CRITICAL: Pass firestoreDatabaseId explicitly to bind to provisioned instance.
// Force XHR WebChannel long-polling in browser environments so Fetch ReadableStream stalls,
// buffering proxies, mobile carriers, and sandboxed iframes do not trip Firestore's 10s OnlineStateTimeout.
function createFirestoreInstance(): Firestore {
  const useXhrTransport = typeof XMLHttpRequest !== 'undefined';
  const settings: FirestoreSettings & { useFetchStreams?: boolean } =
    typeof window !== 'undefined'
      ? {
          experimentalForceLongPolling: true,
          experimentalLongPollingOptions: { timeoutSeconds: 20 },
          ...(useXhrTransport ? { useFetchStreams: false } : {}),
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

const FIRESTORE_HEALTH_TTL_MS = 30_000;
const DIRECT_REST_PROBE_TIMEOUT_MS = 4000;
const WEBCHANNEL_FAILSAFE_MS = 8000;

let inFlightValidation: Promise<boolean> | null = null;
let lastHealthCheckAtMs = 0;

async function probeFirestoreRestReachability(
  timeoutMs = DIRECT_REST_PROBE_TIMEOUT_MS
): Promise<boolean> {
  if (typeof fetch === 'undefined') return true;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return false;
  }

  const dbId = (firebaseConfig.firestoreDatabaseId || '(default)').trim();
  const projectId = (firebaseConfig.projectId || '').trim();
  const apiKey = (firebaseConfig.apiKey || '').trim();
  if (!projectId) return false;

  const querySuffix = apiKey ? `?key=${encodeURIComponent(apiKey)}` : '';
  const probeUrl = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/${encodeURIComponent(dbId)}/documents/test/connection${querySuffix}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(probeUrl, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
    });
    // HTTP 200, 403 (Rules active), or 404 confirm live reachability to Cloud Firestore
    return res.status > 0;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Validate Live Cloud Firestore Connection.
 * 1) Fast stateless REST probe confirms direct browser-to-Firestore reachability before starting Watch streams.
 * 2) getDocFromServer('/test/connection') verifies live SDK transport & Default-Deny rules with an 8s failsafe
 *    so stalled WebChannel proxies disable network cleanly before Firestore's 10s OnlineStateTimeout error fires.
 */
export async function validateFirestoreConnection(): Promise<boolean> {
  if (inFlightValidation) {
    return inFlightValidation;
  }

  inFlightValidation = (async () => {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      await disableNetwork(db).catch(() => undefined);
      lastHealthCheckAtMs = Date.now();
      lastFirestoreHealth = {
        connected: false,
        checkedAt: new Date().toISOString(),
        error: 'Browser is offline',
      };
      return false;
    }

    const restReachable = await probeFirestoreRestReachability(DIRECT_REST_PROBE_TIMEOUT_MS);
    if (!restReachable) {
      await disableNetwork(db).catch(() => undefined);
      lastHealthCheckAtMs = Date.now();
      lastFirestoreHealth = {
        connected: false,
        checkedAt: new Date().toISOString(),
        error: 'Direct Cloud Firestore endpoint unreachable within client probe timeout',
      };
      return false;
    }

    await enableNetwork(db).catch(() => undefined);

    let failsafeTripped = false;
    const failsafeTimer = setTimeout(() => {
      failsafeTripped = true;
      void disableNetwork(db).catch(() => undefined);
      console.warn(
        '[Firestore Connectivity] WebChannel handshake exceeded 8s; switched client SDK to safe fallback mode.'
      );
    }, WEBCHANNEL_FAILSAFE_MS);

    try {
      await getDocFromServer(doc(db, 'test', 'connection'));
      clearTimeout(failsafeTimer);
      lastHealthCheckAtMs = Date.now();
      lastFirestoreHealth = {
        connected: true,
        authLocked: false,
        checkedAt: new Date().toISOString(),
      };
      return true;
    } catch (error: any) {
      clearTimeout(failsafeTimer);
      const code = error?.code || '';
      const msg = error instanceof Error ? error.message : String(error);

      if (
        !failsafeTripped &&
        (code === 'permission-denied' || msg.includes('Missing or insufficient permissions'))
      ) {
        lastHealthCheckAtMs = Date.now();
        lastFirestoreHealth = {
          connected: true,
          authLocked: true,
          checkedAt: new Date().toISOString(),
        };
        return true;
      }

      if (failsafeTripped || code === 'unavailable' || msg.toLowerCase().includes('offline')) {
        await disableNetwork(db).catch(() => undefined);
      }

      lastHealthCheckAtMs = Date.now();
      lastFirestoreHealth = {
        connected: false,
        checkedAt: new Date().toISOString(),
        error: msg,
      };
      return false;
    }
  })().finally(() => {
    inFlightValidation = null;
  });

  return inFlightValidation;
}

/**
 * Shared connectivity gate for Firestore client SDK callers.
 * Coalesces with the boot-time connection probe and refreshes after TTL expiry.
 */
export async function ensureClientFirestoreOnline(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return false;
  }
  if (inFlightValidation) {
    return inFlightValidation;
  }
  if (lastHealthCheckAtMs > 0 && Date.now() - lastHealthCheckAtMs < FIRESTORE_HEALTH_TTL_MS) {
    return lastFirestoreHealth.connected;
  }
  return validateFirestoreConnection();
}

// Auto-run connection health check asynchronously on boot (and re-enable/re-check on reconnect)
if (typeof window !== 'undefined') {
  if (typeof navigator === 'undefined' || navigator.onLine !== false) {
    void validateFirestoreConnection();
  }
  window.addEventListener('online', () => {
    lastHealthCheckAtMs = 0;
    void validateFirestoreConnection();
  });
}

export default app;
