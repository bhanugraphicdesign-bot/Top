import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, browserPopupRedirectResolver } from 'firebase/auth';
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
export { browserPopupRedirectResolver };

// Configure Google Auth provider options
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Narrow guard for upstream @firebase/auth v13.x PopupOperation.onAuthEvent race:
// When a Google Sign-In popup closes right as an auth event settles, Firebase Auth's
// unawaited async onAuthEvent() can throw "INTERNAL ASSERTION FAILED: Pending promise was never set".
if (typeof window !== 'undefined') {
  const PENDING_PROMISE_ASSERTION = 'INTERNAL ASSERTION FAILED: Pending promise was never set';
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const msg = typeof reason === 'string' ? reason : reason?.message || '';
    if (typeof msg === 'string' && msg.includes(PENDING_PROMISE_ASSERTION)) {
      event.preventDefault();
    }
  });
}

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

const FIRESTORE_HEALTHY_TTL_MS = 5 * 60 * 1000;
const FIRESTORE_UNHEALTHY_RETRY_MS = 12_000;
const DIRECT_REST_PROBE_TIMEOUT_MS = 3500;
const WEBCHANNEL_FAILSAFE_MS = 6500;
const DEFAULT_FIRESTORE_OP_TIMEOUT_MS = 7500;

let inFlightValidation: Promise<boolean> | null = null;
let lastHealthCheckAtMs = 0;

export function markFirestoreConnectionHealthy(): void {
  lastHealthCheckAtMs = Date.now();
  lastFirestoreHealth = {
    connected: true,
    authLocked: lastFirestoreHealth.authLocked ?? false,
    checkedAt: new Date().toISOString(),
  };
}

export async function markFirestoreConnectionDegraded(reason: string): Promise<void> {
  lastHealthCheckAtMs = Date.now();
  lastFirestoreHealth = {
    connected: false,
    checkedAt: new Date().toISOString(),
    error: reason,
  };
  await disableNetwork(db).catch(() => undefined);
}

/**
 * Race a live Firestore SDK call against a timeout shorter than Firestore's internal 10s
 * OnlineStateTimeout. If the backend silently stalls mid-session, disableNetwork(db) runs
 * before the 10s SDK error can fire and rejects cleanly with code 'unavailable'.
 */
export async function withFirestoreTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs = DEFAULT_FIRESTORE_OP_TIMEOUT_MS
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let timedOut = false;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      timedOut = true;
      void markFirestoreConnectionDegraded(
        `Cloud Firestore operation exceeded ${timeoutMs}ms timeout`
      );
      const err = new Error('Cloud Firestore backend did not respond in time.') as Error & {
        code?: string;
      };
      err.code = 'unavailable';
      reject(err);
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([operation(), timeoutPromise]);
    if (timer) clearTimeout(timer);
    if (!timedOut) {
      markFirestoreConnectionHealthy();
    }
    return result;
  } catch (err) {
    if (timer) clearTimeout(timer);
    throw err;
  }
}

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
  const probeUrl = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/${encodeURIComponent(dbId)}/documents:runQuery${querySuffix}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(probeUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'site_settings' }],
          limit: 1,
        },
      }),
      cache: 'no-store',
      signal: controller.signal,
    });
    // Publicly allowed site_settings query returns HTTP 200 when Firestore is reachable
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Validate Live Cloud Firestore Connection.
 * 1) Fast stateless REST probe confirms direct browser-to-Firestore reachability before starting Watch streams.
 * 2) getDocFromServer('site_settings/global_config') verifies live SDK transport with a 6.5s failsafe
 *    so stalled WebChannel proxies disable network cleanly before Firestore's 10s OnlineStateTimeout error fires.
 */
export async function validateFirestoreConnection(): Promise<boolean> {
  if (inFlightValidation) {
    return inFlightValidation;
  }

  inFlightValidation = (async () => {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      await markFirestoreConnectionDegraded('Browser is offline');
      return false;
    }

    const restReachable = await probeFirestoreRestReachability(DIRECT_REST_PROBE_TIMEOUT_MS);
    if (!restReachable) {
      await markFirestoreConnectionDegraded(
        'Direct Cloud Firestore endpoint unreachable within client probe timeout'
      );
      return false;
    }

    await enableNetwork(db).catch(() => undefined);

    let failsafeTripped = false;
    let failsafeTimer: ReturnType<typeof setTimeout> | null = null;

    const failsafePromise = new Promise<never>((_, reject) => {
      failsafeTimer = setTimeout(() => {
        failsafeTripped = true;
        void disableNetwork(db).catch(() => undefined);
        console.warn(
          '[Firestore Connectivity] WebChannel handshake exceeded 6.5s; switched client SDK to safe fallback mode.'
        );
        const err = new Error('WebChannel handshake timed out') as Error & { code?: string };
        err.code = 'unavailable';
        reject(err);
      }, WEBCHANNEL_FAILSAFE_MS);
    });

    try {
      await Promise.race([
        getDocFromServer(doc(db, 'site_settings', 'global_config')),
        failsafePromise,
      ]);
      if (failsafeTimer) clearTimeout(failsafeTimer);
      lastHealthCheckAtMs = Date.now();
      lastFirestoreHealth = {
        connected: true,
        authLocked: false,
        checkedAt: new Date().toISOString(),
      };
      return true;
    } catch (error: any) {
      if (failsafeTimer) clearTimeout(failsafeTimer);
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
 * Coalesces with the boot-time connection probe and uses separate TTLs for healthy vs degraded states.
 */
export async function ensureClientFirestoreOnline(options?: {
  forceCheck?: boolean;
}): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return false;
  }
  if (inFlightValidation) {
    return inFlightValidation;
  }
  if (!options?.forceCheck && lastHealthCheckAtMs > 0) {
    const ttl = lastFirestoreHealth.connected
      ? FIRESTORE_HEALTHY_TTL_MS
      : FIRESTORE_UNHEALTHY_RETRY_MS;
    if (Date.now() - lastHealthCheckAtMs < ttl) {
      return lastFirestoreHealth.connected;
    }
  }
  return validateFirestoreConnection();
}

// Keep network paused until the initial REST reachability probe succeeds so no early SDK call
// can start a 10s WebChannel OnlineStateTimeout before connectivity is verified.
if (typeof window !== 'undefined') {
  void disableNetwork(db).catch(() => undefined);
  if (typeof navigator === 'undefined' || navigator.onLine !== false) {
    void validateFirestoreConnection();
  }
  window.addEventListener('offline', () => {
    void markFirestoreConnectionDegraded('Browser is offline');
  });
  window.addEventListener('online', () => {
    lastHealthCheckAtMs = 0;
    void validateFirestoreConnection();
  });
}

export default app;
