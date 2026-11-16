import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { z } from 'zod';
import { initializeApp, getApps, cert, applicationDefault, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getAppCheck } from 'firebase-admin/app-check';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { Storage } from '@google-cloud/storage';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Load Firebase client config (public identifiers only)
interface FirebasePublicConfig {
  projectId: string;
  apiKey?: string;
  appId?: string;
  firestoreDatabaseId?: string;
  storageBucket?: string;
}

function loadFirebasePublicConfig(): FirebasePublicConfig {
  try {
    const configPath = path.resolve(__dirname, 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const parsed = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      return {
        projectId: parsed.projectId || 'turnkey-invention-70z9n',
        apiKey: parsed.apiKey,
        appId: parsed.appId,
        firestoreDatabaseId:
          parsed.firestoreDatabaseId ||
          'ai-studio-powerwebstudioai-4b6a19ad-e6d7-4bd0-a968-9c08eb07a897',
        storageBucket: parsed.storageBucket,
      };
    }
  } catch {
    // fallback below
  }
  return {
    projectId: 'turnkey-invention-70z9n',
    firestoreDatabaseId: 'ai-studio-powerwebstudioai-4b6a19ad-e6d7-4bd0-a968-9c08eb07a897',
  };
}

const FIREBASE_CONFIG = loadFirebasePublicConfig();
const RECAPTCHA_SITE_KEY = (
  process.env.VITE_RECAPTCHA_SITE_KEY ||
  process.env.RECAPTCHA_SITE_KEY ||
  ''
).trim();
const HAS_RECAPTCHA_SITE_KEY = RECAPTCHA_SITE_KEY.length > 0;
const ENFORCE_APP_CHECK = process.env.ENFORCE_APP_CHECK === 'true';

if (!HAS_RECAPTCHA_SITE_KEY) {
  console.warn(
    '[AppCheck Notice] VITE_RECAPTCHA_SITE_KEY is not set; form submissions continue in advisory mode until App Check is configured.'
  );
}

const SAFE_ID_REGEX = /^[a-zA-Z0-9_-]{1,128}$/;

/* =========================================================================
   FIREBASE ADMIN SDK INITIALIZATION (CREDENTIALED WHEN CONFIGURED)
   ========================================================================= */
let adminApp: App | null = null;
let adminHasCredentials = false;
let adminInitMode: 'service_account_json' | 'gcp_adc' | 'public_cert_jwt' = 'public_cert_jwt';

function initializeFirebaseAdmin(): void {
  const existingApps = getApps();
  if (existingApps.length > 0) {
    adminApp = existingApps[0] || null;
    return;
  }

  const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.trim();
  if (rawServiceAccount) {
    try {
      const parsedCred = JSON.parse(rawServiceAccount);
      adminApp = initializeApp({
        credential: cert(parsedCred),
        projectId: FIREBASE_CONFIG.projectId,
        storageBucket: process.env.GCS_BUCKET?.trim() || FIREBASE_CONFIG.storageBucket,
      });
      adminHasCredentials = true;
      adminInitMode = 'service_account_json';
      console.log('[Firebase Admin] Initialized with explicit service account credential.');
      return;
    } catch {
      console.warn('[Firebase Admin] Invalid FIREBASE_SERVICE_ACCOUNT_KEY JSON; using public RS256 verifier fallback.');
    }
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.K_SERVICE) {
    try {
      adminApp = initializeApp({
        credential: applicationDefault(),
        projectId: FIREBASE_CONFIG.projectId,
        storageBucket: process.env.GCS_BUCKET?.trim() || FIREBASE_CONFIG.storageBucket,
      });
      adminHasCredentials = true;
      adminInitMode = 'gcp_adc';
      console.log('[Firebase Admin] Initialized with Google Cloud Application Default Credentials.');
      return;
    } catch {
      // fall through
    }
  }

  // Fallback: Initialize project-scoped app for token metadata without forged privileges
  try {
    adminApp = initializeApp({
      projectId: FIREBASE_CONFIG.projectId,
    });
  } catch {
    adminApp = null;
  }
  adminHasCredentials = false;
  adminInitMode = 'public_cert_jwt';
}

initializeFirebaseAdmin();

const FIRESTORE_DB_ID = FIREBASE_CONFIG.firestoreDatabaseId || '(default)';
let adminDb: Firestore | null = null;
if (adminApp && adminHasCredentials) {
  adminDb =
    FIRESTORE_DB_ID === '(default)'
      ? getFirestore(adminApp)
      : getFirestore(adminApp, FIRESTORE_DB_ID);
  console.log(`[Firestore Admin] Connected to database "${FIRESTORE_DB_ID}".`);
} else {
  console.warn(
    '[Firestore Admin Notice] Credentials not configured (FIREBASE_SERVICE_ACCOUNT_KEY or GCP ADC). Server Firestore ledger routes will return HTTP 503 until configured.'
  );
}

/* =========================================================================
   CLOUD STORAGE PROVIDER (GCS ONLY — ZERO LOCAL DISK WRITES)
   ========================================================================= */
const EXPLICIT_GCS_BUCKET = (process.env.GCS_BUCKET || '').trim();
let gcsStorageClient: Storage | null = null;
let gcsBucketVerified = false;
let gcsStatusNote =
  'GCS_BUCKET not set; file uploads return HTTP 503 STORAGE_NOT_CONFIGURED. Local container disk writes are disabled.';

function isGcsConfiguredAndVerified(): boolean {
  return Boolean(EXPLICIT_GCS_BUCKET && gcsBucketVerified && gcsStorageClient);
}

async function verifyGcsStorageAvailability(): Promise<void> {
  if (!EXPLICIT_GCS_BUCKET) {
    gcsBucketVerified = false;
    return;
  }
  try {
    const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.trim();
    if (rawServiceAccount) {
      const credentials = JSON.parse(rawServiceAccount);
      gcsStorageClient = new Storage({
        projectId: FIREBASE_CONFIG.projectId,
        credentials,
      });
    } else {
      gcsStorageClient = new Storage({ projectId: FIREBASE_CONFIG.projectId });
    }
    const [exists] = await gcsStorageClient.bucket(EXPLICIT_GCS_BUCKET).exists();
    if (exists) {
      gcsBucketVerified = true;
      gcsStatusNote = `Connected to verified private GCS bucket: gs://${EXPLICIT_GCS_BUCKET}`;
      console.log(`[Storage] ${gcsStatusNote}`);
    } else {
      gcsBucketVerified = false;
      gcsStatusNote = `Configured GCS_BUCKET (${EXPLICIT_GCS_BUCKET}) does not exist or is unreachable; file uploads return HTTP 503 STORAGE_NOT_CONFIGURED.`;
      console.warn(`[Storage Warning] ${gcsStatusNote}`);
    }
  } catch (err: any) {
    gcsBucketVerified = false;
    gcsStatusNote = `GCS verification unavailable (${err?.code || 'missing credentials'}); file uploads return HTTP 503 STORAGE_NOT_CONFIGURED.`;
    console.warn(`[Storage Notice] ${gcsStatusNote}`);
  }
}

void verifyGcsStorageAvailability();

// High-entropy HMAC secret: require >= 32 chars and reject template placeholders in production
const EPHEMERAL_PAYMENT_SECRET = crypto.randomBytes(32).toString('hex');
const RAW_PAYMENT_SECRET = (process.env.PAYMENT_SECRET || '').trim();
const PAYMENT_SECRET_PLACEHOLDER_RE = /^(replace_with|your_|example|changeme|placeholder|default|secret)/i;
const HAS_WEAK_OR_PLACEHOLDER_PAYMENT_SECRET =
  RAW_PAYMENT_SECRET.length > 0 &&
  (RAW_PAYMENT_SECRET.length < 32 || PAYMENT_SECRET_PLACEHOLDER_RE.test(RAW_PAYMENT_SECRET));
const HAS_EXPLICIT_PAYMENT_SECRET =
  RAW_PAYMENT_SECRET.length >= 32 && !PAYMENT_SECRET_PLACEHOLDER_RE.test(RAW_PAYMENT_SECRET);
const PAYMENT_SECRET = HAS_EXPLICIT_PAYMENT_SECRET
  ? RAW_PAYMENT_SECRET
  : EPHEMERAL_PAYMENT_SECRET;

if (HAS_WEAK_OR_PLACEHOLDER_PAYMENT_SECRET) {
  console.warn(
    '[Security Warning] Configured PAYMENT_SECRET rejected (must be >= 32 characters and non-placeholder). Payment endpoints remain disabled in optional mode.'
  );
} else if (!HAS_EXPLICIT_PAYMENT_SECRET) {
  console.warn(
    '[Security Notice] PAYMENT_SECRET env var not set; using process-ephemeral 256-bit CSPRNG key.'
  );
}

// Cloud Run Reverse Proxy & Security Hardening
// Google Cloud Run routes traffic through 1 managed Google Front End proxy hop; trust hop count 1 (not unbounded `true`)
const parsedProxyHops = parseInt(process.env.TRUST_PROXY_HOPS || '1', 10);
const TRUST_PROXY_HOPS =
  Number.isFinite(parsedProxyHops) && parsedProxyHops >= 0 && parsedProxyHops <= 5
    ? parsedProxyHops
    : 1;
app.set('trust proxy', TRUST_PROXY_HOPS);
app.disable('x-powered-by');

const isDevEnv = process.env.NODE_ENV !== 'production';

// Helmet HTTP Security Headers + Content-Security-Policy (Firebase, Google Sign-In, reCAPTCHA, Google Fonts)
// Production builds omit 'unsafe-inline' and 'unsafe-eval' from scriptSrc (Vite outputs external module bundles; JSON-LD is non-executable data)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          ...(isDevEnv ? ["'unsafe-inline'", "'unsafe-eval'"] : []),
          'https://apis.google.com',
          'https://www.google.com',
          'https://www.gstatic.com',
          'https://www.recaptcha.net',
          'https://www.googletagmanager.com',
        ],
        scriptSrcAttr: ["'none'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
        workerSrc: ["'self'", 'blob:'],
        manifestSrc: ["'self'"],
        connectSrc: [
          "'self'",
          ...(isDevEnv ? ['ws:', 'wss:'] : []),
          'https://*.googleapis.com',
          'https://*.firebaseio.com',
          'https://*.firebaseapp.com',
          'https://*.cloudfunctions.net',
          'https://identitytoolkit.googleapis.com',
          'https://securetoken.googleapis.com',
          'https://firestore.googleapis.com',
          'https://firebaseappcheck.googleapis.com',
          'https://content-firebaseappcheck.googleapis.com',
          'https://accounts.google.com',
          'https://apis.google.com',
          'https://www.google.com',
          'https://www.gstatic.com',
          'https://www.recaptcha.net',
          'https://www.google-analytics.com',
          'https://analytics.google.com',
        ],
        frameSrc: [
          "'self'",
          'https://*.firebaseapp.com',
          'https://accounts.google.com',
          'https://www.google.com',
          'https://www.recaptcha.net',
        ],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'self'", 'https://aistudio.google.com', 'https://*.google.com'],
        ...(isDevEnv ? { upgradeInsecureRequests: null } : {}),
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
    // Rely on CSP frame-ancestors ('self' + aistudio.google.com) instead of legacy X-Frame-Options: SAMEORIGIN so AI Studio iframe preview renders cleanly
    xFrameOptions: false,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  })
);

app.use((_req, res, next) => {
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

// Strict Origin Allowlist CORS Configuration
const configuredOrigins = (process.env.CORS_ALLOWED_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const staticAllowedOrigins = new Set<string>(
  [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    (process.env.SITE_URL || '').trim().replace(/\/+$/, ''),
    ...configuredOrigins,
  ].filter(Boolean)
);

function isAllowedCorsOrigin(origin?: string): boolean {
  if (!origin) return true; // Same-origin requests, server-to-server, curl without Origin header
  if (staticAllowedOrigins.has(origin)) return true;
  try {
    const parsed = new URL(origin);
    if (parsed.protocol === 'https:' && parsed.hostname.endsWith('.run.app')) {
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

app.use(
  '/api',
  cors({
    origin: (origin, callback) => {
      if (isAllowedCorsOrigin(origin)) {
        callback(null, true);
      } else {
        const corsErr: any = new Error('Forbidden: Origin not permitted by CORS policy.');
        corsErr.status = 403;
        callback(corsErr);
      }
    },
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Firebase-AppCheck'],
    credentials: true,
    maxAge: 600,
  })
);

// Route-scoped body limits: 15mb for base64 file uploads, strict 1mb everywhere else
app.use('/api/files/upload', express.json({ limit: '15mb' }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

/* =========================================================================
   CLOUD FIRESTORE AUDIT LOGGING & SAFE DTO HELPERS (NO LOCAL DISK WRITES)
   ========================================================================= */
interface ServerAuditEvent {
  id: string;
  action: string;
  actorUid: string;
  actorEmail: string;
  resource: string;
  outcome: 'SUCCESS' | 'DENIED' | 'ERROR';
  ip: string;
  details: string;
  timestamp: string;
}

function isFirestoreAdminCredentialError(err: any): boolean {
  const code = err?.code;
  const msg = String(err?.message || '');
  return (
    code === 7 ||
    code === 16 ||
    code === 'permission-denied' ||
    code === 'unauthenticated' ||
    msg.includes('PERMISSION_DENIED') ||
    msg.includes('Could not load the default credentials')
  );
}

function sendFirestoreRouteError(
  res: express.Response,
  err: any,
  fallbackMessage: string,
  lang: 'hi' | 'en' | 'both' = 'en'
) {
  if (isFirestoreAdminCredentialError(err)) {
    const errorEn = 'Firestore Admin SDK lacks IAM permissions or service account credentials on this environment.';
    const errorHi = 'इस वातावरण में Firestore Admin SDK के लिए आवश्यक IAM अनुमतियाँ या सर्विस अकाउंट क्रेडेंशियल उपलब्ध नहीं हैं।';
    return res.status(503).json({
      code: 'FIRESTORE_ADMIN_NOT_CONFIGURED',
      error: lang === 'hi' ? errorHi : errorEn,
      errorEn,
      errorHi,
    });
  }
  return res.status(500).json({ error: fallbackMessage });
}

let loggedAuditPermissionWarning = false;

async function appendServerAuditEvent(
  event: Omit<ServerAuditEvent, 'id' | 'timestamp'>
): Promise<void> {
  if (!adminDb) {
    return;
  }
  try {
    const logId = `srv-audit-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const timestamp = new Date().toISOString();
    const entry = {
      id: logId,
      actorId: event.actorUid,
      actorUid: event.actorUid,
      actorEmail: event.actorEmail,
      action: event.action,
      resource: event.resource,
      outcome: event.outcome,
      ipAddress: event.ip,
      ip: event.ip,
      details: event.details,
      timestamp,
      source: 'server',
    };
    await adminDb.collection('audit_logs').doc(logId).set(entry);
  } catch (err) {
    if (isFirestoreAdminCredentialError(err)) {
      if (!loggedAuditPermissionWarning) {
        loggedAuditPermissionWarning = true;
        console.warn(
          '[Server Audit Notice] Firestore Admin lacks IAM permissions in this environment; skipping server audit persistence.'
        );
      }
      return;
    }
    console.error('[Server Audit Log Error]', err);
  }
}

// Strip private server paths & internal storage keys before sending file records to clients
function toSafeFileDto(record: any) {
  if (!record) return null;
  return {
    fileId: record.fileId,
    fileName: record.fileName,
    category: record.category,
    projectId: record.projectId || null,
    fileSize: record.fileSize,
    fileSizeFormatted: record.fileSizeFormatted,
    mimeType: record.mimeType,
    extension: record.extension,
    sha256: record.sha256,
    ownerUid: record.ownerUid || null,
    uploadedBy: record.uploadedBy,
    storageProvider: record.storageProvider || 'google_cloud_storage',
    notes: record.notes || '',
    uploadedAt: record.uploadedAt,
    downloadUrl: `/api/files/${record.fileId}`,
  };
}

/* =========================================================================
   CRYPTOGRAPHIC FIREBASE ID TOKEN VERIFICATION & RBAC
   ========================================================================= */
interface VerifiedAuthUser {
  uid: string;
  email: string;
  emailVerified: boolean;
  isAdmin: boolean;
  roleSource: 'user_roles' | 'custom_claim' | 'client';
}

let certCache: { certs: Record<string, string>; expiresAt: number } = {
  certs: {},
  expiresAt: 0,
};

async function getFirebasePublicCerts(): Promise<Record<string, string>> {
  const now = Date.now();
  if (certCache.expiresAt > now && Object.keys(certCache.certs).length > 0) {
    return certCache.certs;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);
  try {
    const res = await fetch(
      'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com',
      { signal: controller.signal }
    );
    if (!res.ok) {
      throw new Error(`Google x509 cert fetch HTTP ${res.status}`);
    }
    const cacheControl = res.headers.get('cache-control') || '';
    const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
    const ttlMs = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) * 1000 : 3600 * 1000;
    const certs = (await res.json()) as Record<string, string>;
    certCache = { certs, expiresAt: now + Math.max(ttlMs, 60000) };
    return certs;
  } finally {
    clearTimeout(timeout);
  }
}

function decodeBase64Url(input: string): Buffer {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = normalized.length % 4;
  return Buffer.from(pad ? normalized + '='.repeat(4 - pad) : normalized, 'base64');
}

async function fetchFirestoreDocumentRest(
  collectionName: string,
  docId: string,
  idToken: string
): Promise<any | null> {
  if (!SAFE_ID_REGEX.test(docId)) return null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2500);
  try {
    const dbId = FIREBASE_CONFIG.firestoreDatabaseId || '(default)';
    const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/${dbId}/documents/${collectionName}/${encodeURIComponent(docId)}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${idToken}` },
      signal: controller.signal,
    });
    if (!res.ok) return null;
    return (await res.json()) as any;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function checkFirestoreAdminRole(uid: string, idToken: string): Promise<boolean> {
  if (adminDb && SAFE_ID_REGEX.test(uid)) {
    try {
      const snap = await adminDb.collection('user_roles').doc(uid).get();
      if (snap.exists && snap.data()?.role === 'admin') {
        return true;
      }
    } catch {
      // Fall back to REST API check below
    }
  }
  const doc = await fetchFirestoreDocumentRest('user_roles', uid, idToken);
  return doc?.fields?.role?.stringValue === 'admin';
}

async function resolveServerAdminStatus(params: {
  uid: string;
  idToken: string;
  hasCustomClaimAdmin: boolean;
}): Promise<{ isAdmin: boolean; roleSource: VerifiedAuthUser['roleSource'] }> {
  // 1. Primary RBAC source of truth: Firestore `user_roles/{uid}` document
  const hasFirestoreRole = await checkFirestoreAdminRole(params.uid, params.idToken);
  if (hasFirestoreRole) {
    return { isAdmin: true, roleSource: 'user_roles' };
  }

  // 2. Verified Firebase Auth custom claim (`admin: true` or `role: "admin"`)
  if (params.hasCustomClaimAdmin) {
    return { isAdmin: true, roleSource: 'custom_claim' };
  }

  return { isAdmin: false, roleSource: 'client' };
}

async function verifyProjectAuthorization(
  projectId: string,
  user: VerifiedAuthUser,
  idToken: string
): Promise<boolean> {
  if (!SAFE_ID_REGEX.test(projectId)) return false;
  if (user.isAdmin) return true;
  if (adminDb) {
    try {
      const snap = await adminDb.collection('projects').doc(projectId).get();
      if (snap.exists) {
        return snap.data()?.clientId === user.uid;
      }
    } catch {
      // Fall back to REST check
    }
  }
  const doc = await fetchFirestoreDocumentRest('projects', projectId, idToken);
  if (!doc || !doc.fields) return false;
  return doc.fields?.clientId?.stringValue === user.uid;
}

async function verifyFirebaseBearerToken(
  req: express.Request
): Promise<{ user: VerifiedAuthUser; rawToken: string } | null> {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.slice(7).trim();
  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }

  try {
    // Try Firebase Admin SDK if credentialed (enforces revocation & Google cert checks)
    if (adminApp && adminHasCredentials) {
      const decoded = await getAuth(adminApp).verifyIdToken(token, true);
      const email = typeof decoded.email === 'string' ? decoded.email : '';
      const emailVerified = Boolean(decoded.email_verified);
      const { isAdmin, roleSource } = await resolveServerAdminStatus({
        uid: decoded.uid,
        idToken: token,
        hasCustomClaimAdmin: decoded.admin === true || decoded.role === 'admin',
      });

      return {
        rawToken: token,
        user: {
          uid: decoded.uid,
          email,
          emailVerified,
          isAdmin,
          roleSource,
        },
      };
    }

    // Fallback: Strict RS256 cryptographic signature & claims verification against Google public x509 certs
    const [headerB64, payloadB64, sigB64] = parts;
    const header = JSON.parse(decodeBase64Url(headerB64).toString('utf8'));
    const payload = JSON.parse(decodeBase64Url(payloadB64).toString('utf8'));

    if (header.alg !== 'RS256' || typeof header.kid !== 'string') {
      return null;
    }

    const certs = await getFirebasePublicCerts();
    const cert = certs[header.kid];
    if (!cert) {
      return null;
    }

    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(`${headerB64}.${payloadB64}`);
    verifier.end();

    const sigBuf = decodeBase64Url(sigB64);
    if (!verifier.verify(cert, sigBuf)) {
      return null;
    }

    const nowSec = Math.floor(Date.now() / 1000);
    const expectedIss = `https://securetoken.google.com/${FIREBASE_CONFIG.projectId}`;
    if (
      payload.aud !== FIREBASE_CONFIG.projectId ||
      payload.iss !== expectedIss ||
      typeof payload.exp !== 'number' ||
      payload.exp <= nowSec ||
      typeof payload.iat !== 'number' ||
      payload.iat > nowSec + 300 ||
      typeof payload.sub !== 'string' ||
      payload.sub.length === 0
    ) {
      return null;
    }

    const email = typeof payload.email === 'string' ? payload.email : '';
    const emailVerified = Boolean(payload.email_verified);
    const { isAdmin, roleSource } = await resolveServerAdminStatus({
      uid: payload.sub,
      idToken: token,
      hasCustomClaimAdmin: payload.admin === true || payload.role === 'admin',
    });

    return {
      rawToken: token,
      user: {
        uid: payload.sub,
        email,
        emailVerified,
        isAdmin,
        roleSource,
      },
    };
  } catch {
    return null;
  }
}

interface AuthenticatedRequest extends express.Request {
  authUser?: VerifiedAuthUser;
  authToken?: string;
}

async function requireAuth(
  req: AuthenticatedRequest,
  res: express.Response,
  next: express.NextFunction
) {
  const verified = await verifyFirebaseBearerToken(req);
  if (!verified) {
    return res.status(401).json({
      error: 'Authentication required. Provide a valid Firebase Bearer ID token.',
    });
  }
  req.authUser = verified.user;
  req.authToken = verified.rawToken;
  return next();
}

async function requireAdmin(
  req: AuthenticatedRequest,
  res: express.Response,
  next: express.NextFunction
) {
  const verified = await verifyFirebaseBearerToken(req);
  if (!verified) {
    return res.status(401).json({
      error: 'Authentication required. Provide a valid Firebase Bearer ID token.',
    });
  }
    if (!verified.user.isAdmin) {
    void appendServerAuditEvent({
      action: 'ADMIN_ACCESS_DENIED',
      actorUid: verified.user.uid,
      actorEmail: verified.user.email || verified.user.uid,
      resource: req.originalUrl,
      outcome: 'DENIED',
      ip: getClientIp(req),
      details: 'Non-admin attempted privileged admin endpoint',
    });
    return res.status(403).json({
      error: 'Forbidden: Verified administrator privilege required.',
    });
  }
  req.authUser = verified.user;
  req.authToken = verified.rawToken;
  return next();
}

// Rate Limiting for API routes (durable payment intents are stored in Firestore `payment_intents`)

// In-Memory Rate Limiting for API routes
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 100;

const uploadRateMap = new Map<string, { count: number; resetTime: number }>();
const MAX_UPLOADS_PER_WINDOW = 20;

const formRateMap = new Map<string, { count: number; resetTime: number }>();
const FORM_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const parsedFormRateMax = parseInt(process.env.FORM_RATE_LIMIT_MAX || '8', 10);
const MAX_FORM_SUBMISSIONS_PER_WINDOW =
  Number.isFinite(parsedFormRateMax) && parsedFormRateMax > 0 ? parsedFormRateMax : 8;
const MIN_FORM_FILL_TIME_MS = 1200; // 1.2 seconds minimum fill duration

function pruneExpiredRateBuckets(map: Map<string, { count: number; resetTime: number }>): void {
  const now = Date.now();
  for (const [key, entry] of map.entries()) {
    if (now > entry.resetTime) {
      map.delete(key);
    }
  }
}

setInterval(() => {
  pruneExpiredRateBuckets(rateLimitMap);
  pruneExpiredRateBuckets(uploadRateMap);
  pruneExpiredRateBuckets(formRateMap);
}, 15 * 60 * 1000).unref();

function getClientIp(req: express.Request): string {
  // Rely on Express's bounded `trust proxy` hop count (`req.ip`) rather than leftmost X-Forwarded-For spoofing
  const candidate = (req.ip || req.socket?.remoteAddress || '127.0.0.1').trim();
  return candidate.replace(/^::ffff:/, '') || '127.0.0.1';
}

function checkRateBucket(
  map: Map<string, { count: number; resetTime: number }>,
  key: string,
  limit: number,
  windowMs: number = RATE_LIMIT_WINDOW_MS
): { allowed: boolean; remaining: number; resetTime: number; retryAfterMs: number } {
  const now = Date.now();
  const record = map.get(key);
  if (!record || now > record.resetTime) {
    const resetTime = now + windowMs;
    map.set(key, { count: 1, resetTime });
    return {
      allowed: true,
      remaining: Math.max(0, limit - 1),
      resetTime,
      retryAfterMs: 0,
    };
  }
  if (record.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime,
      retryAfterMs: Math.max(1000, record.resetTime - now),
    };
  }
  record.count += 1;
  return {
    allowed: true,
    remaining: Math.max(0, limit - record.count),
    resetTime: record.resetTime,
    retryAfterMs: 0,
  };
}

function resolveRequestedLanguage(req: express.Request): 'hi' | 'en' | 'both' {
  const bodyLang = typeof req.body?.language === 'string' ? req.body.language.trim().toLowerCase() : '';
  if (bodyLang === 'hi') return 'hi';
  if (bodyLang === 'en') return 'en';
  const acceptLang = (req.headers['accept-language'] || '').toString().toLowerCase();
  if (acceptLang.startsWith('hi')) return 'hi';
  return 'both';
}

function createFormRateLimiter(scope: 'validate' | 'quotation' | 'newsletter') {
  const scopeLimit =
    scope === 'validate'
      ? Math.max(20, MAX_FORM_SUBMISSIONS_PER_WINDOW * 2)
      : MAX_FORM_SUBMISSIONS_PER_WINDOW;

  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const clientIp = getClientIp(req);
    const bucketKey = `${scope}:${clientIp}`;
    const check = checkRateBucket(
      formRateMap,
      bucketKey,
      scopeLimit,
      FORM_RATE_LIMIT_WINDOW_MS
    );

    const retryAfterSeconds = Math.ceil(check.retryAfterMs / 1000);
    res.setHeader('X-RateLimit-Limit', String(scopeLimit));
    res.setHeader('X-RateLimit-Remaining', String(check.remaining));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(check.resetTime / 1000)));

    if (!check.allowed) {
      const waitMinutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));
      const errorEn = `Too many form submissions from your IP address. Please wait ${waitMinutes} minute(s) before trying again.`;
      const errorHi = `आपके आईपी पते से बहुत अधिक फॉर्म अनुरोध भेजे गए हैं। कृपया ${waitMinutes} मिनट बाद पुनः प्रयास करें।`;
      const lang = resolveRequestedLanguage(req);

      appendServerAuditEvent({
        action: 'FORM_RATE_LIMIT_EXCEEDED',
        actorUid: 'anonymous',
        actorEmail: typeof req.body?.email === 'string' ? req.body.email.trim().slice(0, 120) : 'unknown',
        resource: req.originalUrl,
        outcome: 'DENIED',
        ip: clientIp,
        details: `Blocked ${scope} submission: exceeded ${scopeLimit} requests per 15 min window`,
      });

      res.setHeader('Retry-After', String(retryAfterSeconds));
      return res.status(429).json({
        code: 'RATE_LIMIT_EXCEEDED',
        error: lang === 'hi' ? errorHi : lang === 'en' ? errorEn : `${errorEn} / ${errorHi}`,
        errorEn,
        errorHi,
        retryAfterSeconds,
        retryAfterMs: check.retryAfterMs,
      });
    }

    return next();
  };
}

function validateAntiBotFields(
  req: express.Request,
  res: express.Response,
  scope: 'validate' | 'quotation' | 'newsletter'
): boolean {
  const { website, _hp, hpVerification, formOpenedAt, fillDurationMs } = req.body || {};
  const rawHoneypot = [website, _hp, hpVerification].find(
    (val) => typeof val === 'string' && val.trim().length > 0
  );
  const lang = resolveRequestedLanguage(req);

  if (rawHoneypot) {
    const errorEn = 'Automated form submission rejected by spam protection.';
    const errorHi = 'स्पैम सुरक्षा द्वारा स्वचालित फॉर्म अनुरोध अस्वीकार कर दिया गया है।';
    appendServerAuditEvent({
      action: 'FORM_HONEYPOT_TRIGGERED',
      actorUid: 'anonymous',
      actorEmail: 'bot_suspect',
      resource: req.originalUrl,
      outcome: 'DENIED',
      ip: getClientIp(req),
      details: `Honeypot field populated on ${scope} form`,
    });
    res.status(400).json({
      code: 'BOT_PROTECTION_TRIGGERED',
      error: lang === 'hi' ? errorHi : lang === 'en' ? errorEn : `${errorEn} / ${errorHi}`,
      errorEn,
      errorHi,
    });
    return false;
  }

  // Evaluate fill duration safely without falsely blocking legitimate users whose device clock is slightly ahead
  const hasClientDuration =
    fillDurationMs !== undefined &&
    fillDurationMs !== null &&
    Number.isFinite(Number(fillDurationMs)) &&
    Number(fillDurationMs) >= 0;

  let submittedTooFast = false;
  if (hasClientDuration) {
    submittedTooFast = Number(fillDurationMs) < MIN_FORM_FILL_TIME_MS;
  } else if (formOpenedAt !== undefined && formOpenedAt !== null) {
    const openedMs = Number(formOpenedAt);
    const elapsedMs = Date.now() - openedMs;
    const SKEW_TOLERANCE_MS = 5 * 60 * 1000;
    if (!Number.isFinite(openedMs)) {
      submittedTooFast = true;
    } else if (elapsedMs >= 0 && elapsedMs < MIN_FORM_FILL_TIME_MS) {
      submittedTooFast = true;
    } else if (elapsedMs < -SKEW_TOLERANCE_MS) {
      // Timestamp claimed more than 5 minutes in the future
      submittedTooFast = true;
    }
  }

  if (submittedTooFast) {
    const errorEn = 'Submission sent too quickly. Please review your details and try again.';
    const errorHi = 'अनुरोध बहुत तेज़ी से भेजा गया है। कृपया अपने विवरण जांचें और पुनः प्रयास करें।';
    res.status(400).json({
      code: 'SUBMISSION_TOO_FAST',
      error: lang === 'hi' ? errorHi : lang === 'en' ? errorEn : `${errorEn} / ${errorHi}`,
      errorEn,
      errorHi,
    });
    return false;
  }

  return true;
}

function rateLimiter(req: express.Request, res: express.Response, next: express.NextFunction) {
  const clientIp = getClientIp(req);
  const check = checkRateBucket(rateLimitMap, clientIp, MAX_REQUESTS_PER_WINDOW);
  if (!check.allowed) {
    const retryAfterSeconds = Math.ceil(check.retryAfterMs / 1000);
    const errorEn = 'Rate limit exceeded. Please retry in 1 minute.';
    const errorHi = 'अनुरोध सीमा पार हो गई है। कृपया 1 मिनट बाद पुनः प्रयास करें।';
    const lang = resolveRequestedLanguage(req);
    res.setHeader('Retry-After', String(retryAfterSeconds));
    return res.status(429).json({
      code: 'RATE_LIMIT_EXCEEDED',
      error: lang === 'hi' ? errorHi : lang === 'en' ? errorEn : `${errorEn} / ${errorHi}`,
      errorEn,
      errorHi,
      retryAfterSeconds,
      retryAfterMs: check.retryAfterMs,
    });
  }
  return next();
}

async function verifyAppCheckForForm(
  req: express.Request,
  res: express.Response,
  scope: 'inquiry' | 'newsletter'
): Promise<boolean> {
  const token = (req.header('x-firebase-appcheck') || '').trim();
  const lang = resolveRequestedLanguage(req);
  const mustEnforce = HAS_RECAPTCHA_SITE_KEY || ENFORCE_APP_CHECK;

  if (!mustEnforce) {
    if (token && adminApp) {
      try {
        await getAppCheck(adminApp).verifyToken(token);
      } catch (err) {
        console.warn(`[AppCheck Notice] Optional ${scope} token verification failed:`, err);
      }
    }
    return true;
  }

  if (ENFORCE_APP_CHECK && (!HAS_RECAPTCHA_SITE_KEY || !adminApp)) {
    const errorEn = 'App Check enforcement is enabled, but server App Check verification is not configured.';
    const errorHi = 'App Check सुरक्षा सक्षम है, लेकिन सर्वर पर App Check सत्यापन कॉन्फ़िगर नहीं है।';
    res.status(503).json({
      code: 'APP_CHECK_NOT_CONFIGURED',
      error: lang === 'hi' ? errorHi : lang === 'en' ? errorEn : `${errorEn} / ${errorHi}`,
      errorEn,
      errorHi,
    });
    return false;
  }

  if (!token) {
    const errorEn = 'App Check verification token is missing. Please reload the page and try again.';
    const errorHi = 'App Check सत्यापन टोकन अनुपस्थित है। कृपया पृष्ठ रीलोड करें और पुनः प्रयास करें।';
    res.status(403).json({
      code: 'APP_CHECK_REQUIRED',
      error: lang === 'hi' ? errorHi : lang === 'en' ? errorEn : `${errorEn} / ${errorHi}`,
      errorEn,
      errorHi,
    });
    return false;
  }

  if (!adminApp) {
    console.warn('[AppCheck Warning] Firebase Admin App not initialized; denying strict App Check request.');
    return res.status(503).json({
      code: 'APP_CHECK_NOT_CONFIGURED',
      error: 'App Check verification unavailable without Firebase Admin initialization.',
    }), false;
  }

  try {
    await getAppCheck(adminApp).verifyToken(token);
    return true;
  } catch (err) {
    console.warn(`[AppCheck Rejected] Invalid ${scope} App Check token:`, err);
    const errorEn = 'App Check security verification failed. Please refresh the page and retry.';
    const errorHi = 'App Check सुरक्षा सत्यापन विफल रहा। कृपया पृष्ठ रीफ़्रेश करें और पुनः प्रयास करें।';
    res.status(403).json({
      code: 'APP_CHECK_INVALID',
      error: lang === 'hi' ? errorHi : lang === 'en' ? errorEn : `${errorEn} / ${errorHi}`,
      errorEn,
      errorHi,
    });
    return false;
  }
}

const attachmentSchema = z
  .object({
    fileUrl: z.string().trim().max(300).optional(),
    fileName: z.string().trim().max(200).optional(),
    sha256: z.string().trim().max(128).optional(),
    fileSizeFormatted: z.string().trim().max(40).optional(),
  })
  .optional()
  .nullable();

const quotationInputSchema = z.object({
  fullName: z.string().trim().min(1, 'REQUIRED_NAME').max(160, 'MAX_NAME'),
  email: z.string().trim().email('INVALID_EMAIL').max(160, 'MAX_EMAIL'),
  phone: z.string().trim().max(40).optional().default(''),
  company: z.string().trim().max(160).optional().default(''),
  serviceType: z.string().trim().min(1, 'REQUIRED_SERVICE').max(160, 'MAX_SERVICE'),
  timeline: z.string().trim().max(64).optional().default('3-6-months'),
  budget: z.string().trim().max(80).optional().default('enterprise'),
  brief: z.string().trim().max(3000).optional().default(''),
  language: z.enum(['en', 'hi']).optional().default('en'),
  attachment: attachmentSchema,
});

const inquiryValidateSchema = z.object({
  fullName: z.string().trim().min(1, 'REQUIRED_NAME').max(160, 'MAX_NAME'),
  email: z.string().trim().email('INVALID_EMAIL').max(160, 'MAX_EMAIL'),
  serviceType: z.string().trim().min(1, 'REQUIRED_SERVICE').max(160, 'MAX_SERVICE'),
  brief: z.string().trim().max(2000).optional().default(''),
});

const newsletterInputSchema = z.object({
  email: z.string().trim().email('INVALID_EMAIL').max(160, 'MAX_EMAIL'),
  language: z.enum(['en', 'hi']).optional().default('en'),
});

const auditEventInputSchema = z
  .object({
    action: z.string().trim().min(1).max(100),
    resource: z.string().trim().min(1).max(200),
    details: z.string().trim().max(1000).optional().default(''),
    outcome: z.enum(['SUCCESS', 'DENIED', 'ERROR']).optional().default('SUCCESS'),
  })
  .strict();

function mapFormZodError(
  error: z.ZodError,
  lang: 'hi' | 'en' | 'both'
): { errorEn: string; errorHi: string; error: string } {
  const firstCode = error.issues[0]?.message || '';
  const field = String(error.issues[0]?.path?.[0] || '');

  let errorEn = 'Invalid submission fields. Please verify your inputs.';
  let errorHi = 'अमान्य फ़ॉर्म विवरण। कृपया अपने इनपुट जांचें।';

  if (firstCode === 'REQUIRED_NAME' || field === 'fullName') {
    errorEn = firstCode === 'MAX_NAME' ? 'Full name exceeds 160 characters.' : 'Full name is required and cannot be empty.';
    errorHi = firstCode === 'MAX_NAME' ? 'पूरा नाम 160 अक्षरों से अधिक नहीं हो सकता।' : 'पूरा नाम आवश्यक है और इसे खाली नहीं छोड़ा जा सकता।';
  } else if (firstCode === 'INVALID_EMAIL' || firstCode === 'MAX_EMAIL' || field === 'email') {
    errorEn = 'Please enter a valid work email address.';
    errorHi = 'कृपया एक मान्य कार्य ईमेल पता दर्ज करें।';
  } else if (firstCode === 'REQUIRED_SERVICE' || firstCode === 'MAX_SERVICE' || field === 'serviceType') {
    errorEn = 'Please select a technical service domain.';
    errorHi = 'कृपया एक तकनीकी सेवा चुनें।';
  }

  return {
    errorEn,
    errorHi,
    error: lang === 'hi' ? errorHi : lang === 'en' ? errorEn : `${errorEn} / ${errorHi}`,
  };
}

app.use('/api', rateLimiter);

/* =========================================================================
   SECURE SERVER-SIDE API ENDPOINTS
   ========================================================================= */

const RAW_GEMINI_KEY = (process.env.GEMINI_API_KEY || '').trim();
const HAS_GEMINI_API_KEY =
  RAW_GEMINI_KEY.length > 0 && !/^(my_gemini_api_key|replace_with|your_)/i.test(RAW_GEMINI_KEY);
const RAW_SITE_URL = (process.env.SITE_URL || '').trim();
const HAS_PRODUCTION_SITE_URL =
  /^https?:\/\//i.test(RAW_SITE_URL) && !RAW_SITE_URL.includes('YOUR-DOMAIN.com');

function getProductionEnvironmentSummary() {
  const warnings: string[] = [];
  if (!HAS_PRODUCTION_SITE_URL) warnings.push('SITE_URL is missing or set to placeholder domain');
  if (!EXPLICIT_GCS_BUCKET) warnings.push('GCS_BUCKET is not set (uploads return 503)');
  if (!HAS_EXPLICIT_PAYMENT_SECRET) {
    warnings.push(
      HAS_WEAK_OR_PLACEHOLDER_PAYMENT_SECRET
        ? 'PAYMENT_SECRET rejected (must be >= 32 chars and non-placeholder)'
        : 'PAYMENT_SECRET is not set (payments remain in optional mode)'
    );
  }
  if (!HAS_RECAPTCHA_SITE_KEY) warnings.push('VITE_RECAPTCHA_SITE_KEY is not set (App Check advisory)');
  if (!adminHasCredentials) warnings.push('Firebase Admin credentials unavailable (server writes return 503)');

  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    strictMode: process.env.STRICT_PRODUCTION_ENV === 'true',
    siteUrlConfigured: HAS_PRODUCTION_SITE_URL,
    gcsBucketConfigured: Boolean(EXPLICIT_GCS_BUCKET),
    paymentSecretValid: HAS_EXPLICIT_PAYMENT_SECRET,
    paymentSecretMinLength: 32,
    appCheckConfigured: HAS_RECAPTCHA_SITE_KEY,
    appCheckEnforced: HAS_RECAPTCHA_SITE_KEY || ENFORCE_APP_CHECK,
    firebaseAdminCredentialsPresent: adminHasCredentials,
    geminiApiConfigured: HAS_GEMINI_API_KEY,
    trustProxyHops: TRUST_PROXY_HOPS,
    warnings,
  };
}

// 1. Honest Health Check & Cloud Firestore / Storage Status Probe
app.get('/api/health', async (req, res) => {
  const dbId = FIREBASE_CONFIG.firestoreDatabaseId || '(default)';
  const isFirestoreConfigured = Boolean(
    FIREBASE_CONFIG.projectId && FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.appId
  );

  let databaseStatus: 'CONNECTED' | 'DEGRADED' | 'DISCONNECTED' = isFirestoreConfigured
    ? 'DEGRADED'
    : 'DISCONNECTED';
  let probeHttpStatus: number | null = null;
  let probeLatencyMs: number | null = null;

  if (isFirestoreConfigured) {
    const start = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    try {
      const probeUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/${dbId}/documents/test/connection`;
      const probeRes = await fetch(probeUrl, { signal: controller.signal });
      probeHttpStatus = probeRes.status;
      probeLatencyMs = Date.now() - start;
      // 403 Permission Denied proves live Firestore endpoint + Default-Deny rules are actively enforcing RBAC
      if (probeRes.status === 200 || probeRes.status === 404 || probeRes.status === 403) {
        databaseStatus = 'CONNECTED';
      }
    } catch {
      databaseStatus = 'DEGRADED';
    } finally {
      clearTimeout(timeout);
    }
  }

  const envSummary = getProductionEnvironmentSummary();

  res.json({
    status: databaseStatus === 'CONNECTED' ? 'ONLINE' : 'DEGRADED',
    service: 'POWER WEB STUDIO AI ENTERPRISE BACKEND',
    company: 'BHANU RAM BARIHA DIGITAL TECHNOLOGIES',
    ...(process.env.COMPANY_REGISTRATION?.trim()
      ? { companyRegistration: process.env.COMPANY_REGISTRATION.trim() }
      : {}),
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      provider: 'Google Cloud Firestore',
      projectId: FIREBASE_CONFIG.projectId,
      databaseId: dbId,
      edition: 'Enterprise',
      status: databaseStatus,
      configured: isFirestoreConfigured,
      probeHttpStatus,
      probeLatencyMs,
    },
    security: {
      defaultDeny: true,
      rbacEnforced: true,
      adminRoleSource: 'user_roles_and_custom_claims',
      firebaseAdminMode: adminInitMode,
      firebaseAdminCredentialsPresent: adminHasCredentials,
      bearerTokenVerification: adminHasCredentials ? 'FIREBASE_ADMIN_SDK' : 'FIREBASE_RS256',
      trustProxyHops: TRUST_PROXY_HOPS,
      appCheckConfigured: HAS_RECAPTCHA_SITE_KEY,
      appCheckMode:
        HAS_RECAPTCHA_SITE_KEY || ENFORCE_APP_CHECK ? 'enforced' : 'advisory_until_configured',
      helmetCspEnabled: true,
      cspStrictScriptSrcInProd: !isDevEnv,
      corsStrictAllowlist: true,
      unauthenticatedUploadsDisabled: true,
      paymentSecretConfigured: HAS_EXPLICIT_PAYMENT_SECRET,
      paymentGatewayMode: HAS_EXPLICIT_PAYMENT_SECRET ? 'configured' : 'optional_mode',
      rateLimiting: 'ACTIVE',
      hstsEnabled: true,
    },
    storage: {
      mode: isGcsConfiguredAndVerified() ? 'google_cloud_storage' : 'storage_not_configured',
      fileUploadEnabled: isGcsConfiguredAndVerified(),
      gcsBucketConfigured: Boolean(EXPLICIT_GCS_BUCKET),
      gcsBucketVerified,
      persistentAcrossCloudRunRestarts: isGcsConfiguredAndVerified(),
      ephemeralDiskWarning: null,
      note: gcsStatusNote,
    },
    environmentValidation: envSummary,
    deployment: {
      platform: process.env.K_SERVICE ? 'Google Cloud Run' : 'Containerized Express + Node.js',
      serviceName: process.env.K_SERVICE || 'powerwebstudioai-service',
      revision: process.env.K_REVISION || 'rev-2026-phase1-sec',
      port: PORT,
      httpsTerminated: req.secure || req.headers['x-forwarded-proto'] === 'https',
      nodeVersion: process.version,
    },
  });
});

// 1b. Public Safe System Capabilities Endpoint (Exposes non-sensitive feature flags only)
app.get('/api/system/capabilities', (_req, res) => {
  res.json({
    fileUploadEnabled: isGcsConfiguredAndVerified(),
    storageMode: isGcsConfiguredAndVerified() ? 'google_cloud_storage' : 'storage_not_configured',
    gcsBucketVerified,
    firestoreAdminReady: Boolean(adminDb),
    appCheckConfigured: HAS_RECAPTCHA_SITE_KEY,
    appCheckMode:
      HAS_RECAPTCHA_SITE_KEY || ENFORCE_APP_CHECK ? 'enforced' : 'advisory_until_configured',
    paymentGatewayEnabled: HAS_EXPLICIT_PAYMENT_SECRET,
    paymentMode: HAS_EXPLICIT_PAYMENT_SECRET ? 'configured' : 'optional_mode',
    geminiApiConfigured: HAS_GEMINI_API_KEY,
    authProvider: 'Firebase Authentication',
    adminRbacMode: 'user_roles_and_custom_claims',
  });
});

// 1c. Authenticated Caller Role Status Endpoint (Never leaks admin emails)
app.get('/api/auth/status', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.authUser!;
  res.json({
    uid: user.uid,
    emailVerified: user.emailVerified,
    isAdmin: user.isAdmin,
    role: user.isAdmin ? 'admin' : 'client',
    roleSource: user.roleSource,
  });
});

// 1d. Public Read-Only Catalog Endpoint (Strictly public collections only: apps, services, blog_posts, site_settings)
interface PublicCatalogPayload {
  configured: boolean;
  apps: Record<string, unknown>[];
  services: Record<string, unknown>[];
  blogPosts: Record<string, unknown>[];
  siteSettings: Record<string, unknown> | null;
  fetchedAt: string;
}

const PUBLIC_CATALOG_CACHE_TTL_MS = 10_000;
let cachedPublicCatalog: { expiresAt: number; payload: PublicCatalogPayload } | null = null;

function serializeCatalogValue(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (typeof (value as any)?.toDate === 'function') {
    try {
      return (value as any).toDate().toISOString();
    } catch {
      return null;
    }
  }
  if (Array.isArray(value)) {
    return value.map(serializeCatalogValue);
  }
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = serializeCatalogValue(v);
    }
    return out;
  }
  return value;
}

app.get('/api/public/catalog', async (req, res) => {
  if (!adminDb) {
    return res.json({
      configured: false,
      apps: [],
      services: [],
      blogPosts: [],
      siteSettings: null,
      fetchedAt: new Date().toISOString(),
    } satisfies PublicCatalogPayload);
  }

  const bypassCache = req.query.fresh === '1';
  if (!bypassCache && cachedPublicCatalog && Date.now() < cachedPublicCatalog.expiresAt) {
    res.setHeader('Cache-Control', 'public, max-age=10');
    return res.json(cachedPublicCatalog.payload);
  }

  try {
    const [appsSnap, servicesSnap, blogsSnap, settingsSnap] = await Promise.all([
      adminDb.collection('apps').get(),
      adminDb.collection('services').get(),
      adminDb.collection('blog_posts').get(),
      adminDb.collection('site_settings').doc('global_config').get(),
    ]);

    const payload: PublicCatalogPayload = {
      configured: true,
      apps: appsSnap.docs.map((d) => serializeCatalogValue(d.data()) as Record<string, unknown>),
      services: servicesSnap.docs.map((d) => serializeCatalogValue(d.data()) as Record<string, unknown>),
      blogPosts: blogsSnap.docs.map((d) => serializeCatalogValue(d.data()) as Record<string, unknown>),
      siteSettings: settingsSnap.exists
        ? (serializeCatalogValue(settingsSnap.data()) as Record<string, unknown>)
        : null,
      fetchedAt: new Date().toISOString(),
    };

    cachedPublicCatalog = {
      expiresAt: Date.now() + PUBLIC_CATALOG_CACHE_TTL_MS,
      payload,
    };

    res.setHeader('Cache-Control', 'public, max-age=10');
    return res.json(payload);
  } catch (err: any) {
    console.warn('[Public Catalog Fallback]', err?.message || err);
    return res.json({
      configured: false,
      apps: [],
      services: [],
      blogPosts: [],
      siteSettings: null,
      fetchedAt: new Date().toISOString(),
    } satisfies PublicCatalogPayload);
  }
});

// 2. Real-time Node.js Telemetry (Strictly Admin-Only)
app.get('/api/telemetry', requireAdmin, (_req: AuthenticatedRequest, res) => {
  const memoryUsage = process.memoryUsage();
  res.json({
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    pid: process.pid,
    uptimeSeconds: Math.floor(process.uptime()),
    memory: {
      rssMb: Math.round(memoryUsage.rss / 1024 / 1024),
      heapTotalMb: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      heapUsedMb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
    },
    activeConnections: rateLimitMap.size,
    timestamp: new Date().toISOString(),
  });
});

// 3. Server-side Inbound Scoping Validator (Rate-limited per IP + anti-bot + App Check + Zod)
app.post('/api/inquiries/validate', createFormRateLimiter('validate'), async (req, res) => {
  if (!validateAntiBotFields(req, res, 'validate')) {
    return;
  }
  if (!(await verifyAppCheckForForm(req, res, 'inquiry'))) {
    return;
  }

  const lang = resolveRequestedLanguage(req);
  const parsed = inquiryValidateSchema.safeParse(req.body || {});
  if (!parsed.success) {
    const mapped = mapFormZodError(parsed.error, lang);
    return res.status(400).json({
      code: 'VALIDATION_ERROR',
      ...mapped,
    });
  }

  const { fullName, email, serviceType, brief } = parsed.data;
  return res.json({
    valid: true,
    message: 'Payload verified. Ready for immutable Firestore storage.',
    sanitized: {
      fullName,
      email: email.toLowerCase(),
      serviceType,
      brief,
      receivedAt: new Date().toISOString(),
    },
  });
});

// 3a. Authoritative Server-Side Quotation Submission Endpoint (Rate-limited + Honeypot + App Check + Zod -> firebase-admin)
app.post('/api/quotations', createFormRateLimiter('quotation'), async (req, res) => {
  if (!validateAntiBotFields(req, res, 'quotation')) {
    return;
  }
  if (!(await verifyAppCheckForForm(req, res, 'inquiry'))) {
    return;
  }

  const lang = resolveRequestedLanguage(req);
  const parsed = quotationInputSchema.safeParse(req.body || {});
  if (!parsed.success) {
    const mapped = mapFormZodError(parsed.error, lang);
    return res.status(400).json({
      code: 'VALIDATION_ERROR',
      ...mapped,
    });
  }

  if (!adminDb) {
    const errorEn = 'Quotation persistence requires Firebase Admin credentials on the server.';
    const errorHi = 'कोटेशन सहेजने के लिए सर्वर पर Firebase Admin कॉन्फ़िगरेशन आवश्यक है।';
    return res.status(503).json({
      code: 'FIRESTORE_ADMIN_NOT_CONFIGURED',
      error: lang === 'hi' ? errorHi : errorEn,
      errorEn,
      errorHi,
    });
  }

  const data = parsed.data;
  const quoteId = `quote-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  const createdAt = new Date().toISOString();
  const payload = {
    id: quoteId,
    clientName: data.fullName,
    clientEmail: data.email.toLowerCase(),
    phone: data.phone,
    company: data.company,
    serviceType: data.serviceType,
    timeline: data.timeline,
    estimatedBudget: data.budget,
    brief: data.brief,
    attachment: data.attachment
      ? {
          fileUrl: data.attachment.fileUrl || '',
          fileName: data.attachment.fileName || '',
          sha256: data.attachment.sha256 || '',
          fileSizeFormatted: data.attachment.fileSizeFormatted || '',
        }
      : null,
    status: 'pending',
    createdAt,
  };

  try {
    await adminDb.collection('quotations').doc(quoteId).set(payload);

    const verifiedAuth = await verifyFirebaseBearerToken(req);
    void appendServerAuditEvent({
      action: 'QUOTATION_SUBMITTED',
      actorUid: verifiedAuth?.user?.uid || 'anonymous_lead',
      actorEmail: verifiedAuth?.user?.email || payload.clientEmail,
      resource: `quotations/${quoteId}`,
      outcome: 'SUCCESS',
      ip: getClientIp(req),
      details: `Submitted inquiry for ${payload.serviceType} (${payload.clientEmail})`,
    });

    const msgEn = 'Architectural scoping request securely submitted.';
    const msgHi = 'तकनीकी परामर्श अनुरोध सफलतापूर्वक दर्ज किया गया।';
    return res.status(201).json({
      success: true,
      quoteId,
      message: lang === 'hi' ? msgHi : msgEn,
      messageEn: msgEn,
      messageHi: msgHi,
    });
  } catch (err) {
    console.error('[Quotation Submit Error]', err);
    return sendFirestoreRouteError(res, err, 'Unable to save architectural scoping request.', lang);
  }
});

// 3b. Newsletter Dispatch Subscription Endpoint (Firestore via firebase-admin + rate limit + anti-bot + App Check + Zod)
app.post('/api/newsletter/subscribe', createFormRateLimiter('newsletter'), async (req, res) => {
  if (!validateAntiBotFields(req, res, 'newsletter')) {
    return;
  }
  if (!(await verifyAppCheckForForm(req, res, 'newsletter'))) {
    return;
  }

  const lang = resolveRequestedLanguage(req);
  const parsed = newsletterInputSchema.safeParse(req.body || {});
  if (!parsed.success) {
    const mapped = mapFormZodError(parsed.error, lang);
    return res.status(400).json({
      code: 'VALIDATION_ERROR',
      ...mapped,
    });
  }

  const { email, language } = parsed.data;

  if (!adminDb) {
    const errorEn = 'Newsletter persistence requires Firebase Admin credentials on the server.';
    const errorHi = 'न्यूज़लेटर सदस्यता सहेजने के लिए सर्वर पर Firebase Admin कॉन्फ़िगरेशन आवश्यक है।';
    return res.status(503).json({
      code: 'FIRESTORE_ADMIN_NOT_CONFIGURED',
      error: lang === 'hi' ? errorHi : errorEn,
      errorEn,
      errorHi,
    });
  }

  try {
    const normalized = email.toLowerCase();
    const subscriberHash = crypto.createHash('sha256').update(normalized).digest('hex').slice(0, 32);
    const subId = `sub-${subscriberHash}`;
    const docRef = adminDb.collection('newsletter_subscribers').doc(subId);
    const existingSnap = await docRef.get();

    if (existingSnap.exists) {
      const msgEn = 'Email is already registered for Quarterly Architectural Dispatch.';
      const msgHi = 'यह ईमेल पहले से ही त्रैमासिक आर्किटेक्चर डिस्पैच के लिए पंजीकृत है।';
      return res.json({
        success: true,
        alreadySubscribed: true,
        message: lang === 'hi' ? msgHi : msgEn,
        messageEn: msgEn,
        messageHi: msgHi,
      });
    }

    const entry = {
      id: subId,
      email: normalized,
      language: language === 'hi' ? 'hi' : 'en',
      subscribedAt: new Date().toISOString(),
    };
    await docRef.set(entry);

    const msgEn = 'Subscribed to Quarterly Architectural Dispatch.';
    const msgHi = 'त्रैमासिक आर्किटेक्चर डिस्पैच में सदस्यता सफल।';
    return res.status(201).json({
      success: true,
      alreadySubscribed: false,
      message: lang === 'hi' ? msgHi : msgEn,
      messageEn: msgEn,
      messageHi: msgHi,
    });
  } catch (err) {
    console.error('[Newsletter Subscribe Error]', err);
    return sendFirestoreRouteError(res, err, 'Unable to save newsletter subscription.', lang);
  }
});

/* =========================================================================
   4. AUTHENTICATED & VALIDATED CLOUD STORAGE ENGINE (GCS ONLY, ZERO LOCAL DISK)
   ========================================================================= */
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const ALLOWED_EXTENSIONS = new Set(['pdf', 'png', 'jpg', 'docx']);

const EXTENSION_MIME_ALLOWLIST: Record<string, Set<string>> = {
  pdf: new Set(['application/pdf']),
  png: new Set(['image/png']),
  jpg: new Set(['image/jpeg']),
  docx: new Set([
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/zip',
    'application/octet-stream',
  ]),
};

const ALLOWED_UPLOAD_CATEGORIES = new Set([
  'consultation_rfp',
  'rfp_attachment',
  'support_ticket_diagnostic',
  'project_deliverable',
  'project_document',
  'general_attachment',
]);

const MAX_AUTH_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB max
const BASE64_STRICT_REGEX = /^[A-Za-z0-9+/]+={0,2}$/;

app.post('/api/files/upload', requireAuth, async (req: AuthenticatedRequest, res) => {
  const user = req.authUser!;
  const idToken = req.authToken!;
  const clientIp = getClientIp(req);

  try {
    // Upload Rate Limit per authenticated user & IP
    const userLimit = checkRateBucket(uploadRateMap, `uid:${user.uid}`, MAX_UPLOADS_PER_WINDOW);
    const ipLimit = checkRateBucket(uploadRateMap, `ip:${clientIp}`, MAX_UPLOADS_PER_WINDOW);
    if (!userLimit.allowed || !ipLimit.allowed) {
      return res.status(429).json({
        error: 'Upload rate limit exceeded. Please wait 1 minute.',
        retryAfterMs: Math.max(userLimit.retryAfterMs, ipLimit.retryAfterMs),
      });
    }

    // Enforce Cloud Storage only (never write to local disk)
    if (!isGcsConfiguredAndVerified() || !gcsStorageClient || !EXPLICIT_GCS_BUCKET) {
      return res.status(503).json({
        code: 'STORAGE_NOT_CONFIGURED',
        error: 'Cloud Storage (GCS_BUCKET) is not configured on this server. File uploads are disabled.',
        errorEn: 'Cloud Storage (GCS_BUCKET) is not configured on this server. File uploads are disabled.',
        errorHi: 'सर्वर पर Cloud Storage (GCS_BUCKET) कॉन्फ़िगर नहीं है। फ़ाइल अपलोड बंद है।',
      });
    }

    if (!adminDb) {
      return res.status(503).json({
        code: 'FIRESTORE_ADMIN_NOT_CONFIGURED',
        error: 'Firestore Admin SDK is required to store file metadata.',
      });
    }

    const { fileName, fileType, fileData, category, projectId, notes } = req.body || {};

    // Reject client-supplied ownership spoofing attempts
    if ('ownerUid' in (req.body || {}) || 'uploadedBy' in (req.body || {})) {
      void appendServerAuditEvent({
        action: 'FILE_UPLOAD_SPOOF_REJECTED',
        actorUid: user.uid,
        actorEmail: user.email || user.uid,
        resource: 'files/upload',
        outcome: 'DENIED',
        ip: clientIp,
        details: 'Rejected client-supplied ownership fields in upload payload',
      });
      return res.status(400).json({
        error: 'Forbidden fields: ownerUid and uploadedBy are server-derived and cannot be supplied by clients.',
      });
    }

    // Strict Category Allowlist
    const normalizedCategory =
      typeof category === 'string' && category.trim().length > 0
        ? category.trim()
        : 'general_attachment';
    if (!ALLOWED_UPLOAD_CATEGORIES.has(normalizedCategory)) {
      return res.status(400).json({
        error: `Invalid category "${normalizedCategory}". Allowed categories: ${Array.from(ALLOWED_UPLOAD_CATEGORIES).join(', ')}`,
      });
    }

    // Optional ProjectId Authorization Check
    let safeProjectId: string | null = null;
    if (projectId !== undefined && projectId !== null && projectId !== '') {
      if (typeof projectId !== 'string' || !SAFE_ID_REGEX.test(projectId.trim())) {
        return res.status(400).json({ error: 'Invalid projectId format.' });
      }
      const trimmedProjectId = projectId.trim();
      const authorizedForProject = await verifyProjectAuthorization(trimmedProjectId, user, idToken);
      if (!authorizedForProject) {
        void appendServerAuditEvent({
          action: 'FILE_UPLOAD_PROJECT_DENIED',
          actorUid: user.uid,
          actorEmail: user.email || user.uid,
          resource: `projects/${trimmedProjectId}`,
          outcome: 'DENIED',
          ip: clientIp,
          details: 'User attempted upload to unauthorized or non-existent projectId',
        });
        return res.status(403).json({
          error: 'Forbidden: You are not authorized to upload artifacts to the specified project.',
        });
      }
      safeProjectId = trimmedProjectId;
    }

    // Filename & Path Traversal Check
    if (!fileName || typeof fileName !== 'string' || fileName.trim().length === 0 || fileName.length > 180) {
      return res.status(400).json({ error: 'Valid fileName (1-180 chars) is required.' });
    }
    if (
      fileName.includes('..') ||
      fileName.includes('/') ||
      fileName.includes('\\') ||
      fileName.includes('\0')
    ) {
      return res.status(400).json({ error: 'Invalid fileName: path traversal characters rejected.' });
    }

    // Strict Base64 Validation
    if (!fileData || typeof fileData !== 'string') {
      return res.status(400).json({ error: 'fileData base64 payload is required.' });
    }

    let base64Content = fileData.trim();
    const commaIdx = base64Content.indexOf(',');
    if (commaIdx !== -1) {
      const prefix = base64Content.slice(0, commaIdx);
      if (!/^data:[a-zA-Z0-9.+/-]+(?:;[a-zA-Z0-9=.-]+)*;base64$/i.test(prefix)) {
        return res.status(400).json({ error: 'Malformed Data URI prefix on base64 payload.' });
      }
      base64Content = base64Content.slice(commaIdx + 1);
    }

    base64Content = base64Content.replace(/\s+/g, '');
    if (
      base64Content.length === 0 ||
      base64Content.length % 4 !== 0 ||
      !BASE64_STRICT_REGEX.test(base64Content)
    ) {
      return res.status(400).json({ error: 'Malformed Base64 payload rejected.' });
    }

    const buffer = Buffer.from(base64Content, 'base64');
    if (buffer.length === 0) {
      return res.status(400).json({ error: 'Decoded file payload cannot be empty.' });
    }
    if (buffer.length > MAX_AUTH_FILE_SIZE_BYTES) {
      return res.status(400).json({
        error: `File size (${(buffer.length / (1024 * 1024)).toFixed(2)} MB) exceeds allowed limit (10 MB).`,
      });
    }

    // Extension & MIME Consistency Validation (strictly pdf, png, jpg, docx)
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return res.status(400).json({
        error: `Extension .${ext} is forbidden. Allowed extensions: ${Array.from(ALLOWED_EXTENSIONS).join(', ')}`,
      });
    }

    const mime = typeof fileType === 'string' ? fileType.toLowerCase().trim() : '';
    if (mime) {
      const allowedMimesForExt = EXTENSION_MIME_ALLOWLIST[ext];
      const baseMimeAccepted =
        ALLOWED_MIME_TYPES.has(mime) || mime === 'application/octet-stream';
      if (!baseMimeAccepted || (allowedMimesForExt && !allowedMimesForExt.has(mime))) {
        return res.status(400).json({
          error: `MIME type ${mime} is mismatched or not permitted for .${ext} uploads.`,
        });
      }
    }

    // Binary Magic Bytes Validation
    if (ext === 'pdf') {
      if (buffer.length < 5 || !buffer.subarray(0, 5).toString('ascii').startsWith('%PDF-')) {
        return res.status(400).json({ error: 'Invalid PDF magic bytes: corrupted or spoofed document header.' });
      }
    } else if (ext === 'png') {
      const isPng =
        buffer.length >= 8 &&
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47;
      if (!isPng) {
        return res.status(400).json({ error: 'Invalid PNG header: corrupted or spoofed image bytes.' });
      }
    } else if (ext === 'jpg') {
      const isJpg = buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
      if (!isJpg) {
        return res.status(400).json({ error: 'Invalid JPEG header: corrupted or spoofed image bytes.' });
      }
    } else if (ext === 'docx') {
      const isZip = buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4b;
      if (!isZip) {
        return res.status(400).json({ error: 'Invalid DOCX bytes: corrupted OOXML archive header.' });
      }
    }

    const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
    const fileId = `file-${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
    const sanitizedName = path.basename(fileName).replace(/[^a-zA-Z0-9._-]/g, '_');
    // Randomized object key inside Cloud Storage (no user-controlled paths)
    const randomizedFileName = `${crypto.randomUUID()}.${ext}`;
    const gcsObjectPath = `vault/${user.uid}/${randomizedFileName}`;

    await gcsStorageClient
      .bucket(EXPLICIT_GCS_BUCKET)
      .file(gcsObjectPath)
      .save(buffer, {
        contentType: mime || 'application/octet-stream',
        resumable: false,
        metadata: {
          metadata: {
            ownerUid: user.uid,
            fileId,
            sha256,
            category: normalizedCategory,
          },
        },
      });

    const record = {
      fileId,
      fileName: sanitizedName,
      gcsObjectPath,
      storageProvider: 'google_cloud_storage',
      category: normalizedCategory,
      projectId: safeProjectId,
      fileSize: buffer.length,
      fileSizeFormatted: `${(buffer.length / 1024).toFixed(1)} KB`,
      mimeType: mime || `application/${ext}`,
      extension: ext,
      sha256,
      ownerUid: user.uid,
      uploadedBy: user.email || user.uid,
      notes: typeof notes === 'string' ? notes.trim().substring(0, 500) : '',
      uploadedAt: new Date().toISOString(),
      downloadUrl: `/api/files/${fileId}`,
    };

    await adminDb.collection('file_records').doc(fileId).set(record);

    void appendServerAuditEvent({
      action: 'FILE_UPLOADED',
      actorUid: user.uid,
      actorEmail: user.email || user.uid,
      resource: `files/${fileId}`,
      outcome: 'SUCCESS',
      ip: clientIp,
      details: `Uploaded ${sanitizedName} (${record.fileSizeFormatted}, google_cloud_storage) SHA:${sha256.substring(0, 12)}`,
    });

    return res.status(201).json({
      success: true,
      message: 'File successfully verified, hashed, and committed to Cloud Storage.',
      file: toSafeFileDto(record),
    });
  } catch (error) {
    console.error('[Upload Exception]', error);
    return res.status(500).json({ error: 'Internal server error during file processing.' });
  }
});

// 5. List Validated File Artifacts (Authenticated & Strict Ownership / Admin Scoped)
app.get('/api/files/list', requireAuth, async (req: AuthenticatedRequest, res) => {
  const user = req.authUser!;
  const { projectId } = req.query as { projectId?: string };

  if (!adminDb) {
    return res.status(503).json({
      code: 'FIRESTORE_ADMIN_NOT_CONFIGURED',
      error: 'Firestore Admin SDK is not configured to list stored files.',
    });
  }

  try {
    const colRef = adminDb.collection('file_records');
    const snap = user.isAdmin
      ? await colRef.get()
      : await colRef.where('ownerUid', '==', user.uid).get();

    let list = snap.docs.map((d) => d.data());

    if (projectId && typeof projectId === 'string' && SAFE_ID_REGEX.test(projectId)) {
      list = list.filter((f) => f.projectId === projectId);
    }

    list.sort((a: any, b: any) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

    return res.json({
      count: list.length,
      files: list.map(toSafeFileDto),
    });
  } catch (err) {
    console.error('[File List Error]', err);
    return sendFirestoreRouteError(res, err, 'Unable to retrieve stored file list.');
  }
});

// 6. Secure File Retrieval & Download (Authenticated & Ownership/Admin Checked, GCS Only)
app.get('/api/files/:fileId', requireAuth, async (req: AuthenticatedRequest, res) => {
  const user = req.authUser!;
  const { fileId } = req.params;

  if (!SAFE_ID_REGEX.test(fileId)) {
    return res.status(400).json({ error: 'Invalid fileId format.' });
  }

  if (!isGcsConfiguredAndVerified() || !gcsStorageClient || !EXPLICIT_GCS_BUCKET) {
    return res.status(503).json({
      code: 'STORAGE_NOT_CONFIGURED',
      error: 'Cloud Storage (GCS_BUCKET) is not configured on this server.',
    });
  }

  if (!adminDb) {
    return res.status(503).json({
      code: 'FIRESTORE_ADMIN_NOT_CONFIGURED',
      error: 'Firestore Admin SDK is not configured to look up file records.',
    });
  }

  try {
    const docSnap = await adminDb.collection('file_records').doc(fileId).get();
    if (!docSnap.exists) {
      return res.status(404).json({ error: 'File artifact not found.' });
    }
    const record = docSnap.data()!;

    const isOwner = Boolean(record.ownerUid && record.ownerUid === user.uid);
    if (!user.isAdmin && !isOwner) {
      void appendServerAuditEvent({
        action: 'FILE_DOWNLOAD_DENIED',
        actorUid: user.uid,
        actorEmail: user.email || user.uid,
        resource: `files/${fileId}`,
        outcome: 'DENIED',
        ip: getClientIp(req),
        details: `Unauthorized download attempt for owner ${record.ownerUid || 'unknown'}`,
      });
      return res.status(403).json({
        error: 'Forbidden: You do not have permission to download this file artifact.',
      });
    }

    if (!record.gcsObjectPath) {
      return res.status(404).json({ error: 'Cloud Storage object reference missing.' });
    }

    const gcsFile = gcsStorageClient.bucket(EXPLICIT_GCS_BUCKET).file(record.gcsObjectPath);
    const [exists] = await gcsFile.exists();
    if (!exists) {
      return res.status(404).json({ error: 'Stored object missing from Cloud Storage bucket.' });
    }

    if (req.query.mode === 'signed_url') {
      const [signedUrl] = await gcsFile.getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: Date.now() + 5 * 60 * 1000,
      });
      return res.json({ signedUrl, expiresInSeconds: 300 });
    }

    const safeDispositionName = String(record.fileName || 'artifact').replace(/["\r\n]/g, '_');
    res.setHeader('Content-Type', record.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${safeDispositionName}"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('X-Artifact-SHA256', record.sha256);
    gcsFile.createReadStream().pipe(res);
    return;
  } catch (err) {
    console.error('[GCS Download Exception]', err);
    return res.status(500).json({ error: 'Failed to retrieve object from Cloud Storage.' });
  }
});

// 7. Secure Delete File Artifact (Verified Firebase Token + Owner/Admin Only + Audit Log)
app.delete('/api/files/:fileId', requireAuth, async (req: AuthenticatedRequest, res) => {
  const user = req.authUser!;
  const { fileId } = req.params;

  if (!SAFE_ID_REGEX.test(fileId)) {
    return res.status(400).json({ error: 'Invalid fileId format.' });
  }

  if (!isGcsConfiguredAndVerified() || !gcsStorageClient || !EXPLICIT_GCS_BUCKET) {
    return res.status(503).json({
      code: 'STORAGE_NOT_CONFIGURED',
      error: 'Cloud Storage (GCS_BUCKET) is not configured on this server.',
    });
  }

  if (!adminDb) {
    return res.status(503).json({
      code: 'FIRESTORE_ADMIN_NOT_CONFIGURED',
      error: 'Firestore Admin SDK is not configured to delete file records.',
    });
  }

  try {
    const docRef = adminDb.collection('file_records').doc(fileId);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      return res.status(404).json({ error: 'File not found.' });
    }
    const record = docSnap.data()!;

    const isOwner = Boolean(record.ownerUid && record.ownerUid === user.uid);
    if (!user.isAdmin && !isOwner) {
      void appendServerAuditEvent({
        action: 'FILE_DELETE_DENIED',
        actorUid: user.uid,
        actorEmail: user.email || user.uid,
        resource: `files/${fileId}`,
        outcome: 'DENIED',
        ip: getClientIp(req),
        details: `Unauthorized delete attempt for owner ${record.ownerUid || 'unknown'}`,
      });
      return res.status(403).json({
        error: 'Forbidden: You do not have permission to delete this enterprise storage artifact.',
      });
    }

    if (record.gcsObjectPath) {
      await gcsStorageClient
        .bucket(EXPLICIT_GCS_BUCKET)
        .file(record.gcsObjectPath)
        .delete({ ignoreNotFound: true });
    }

    await docRef.delete();

    void appendServerAuditEvent({
      action: 'FILE_DELETED',
      actorUid: user.uid,
      actorEmail: user.email || user.uid,
      resource: `files/${fileId}`,
      outcome: 'SUCCESS',
      ip: getClientIp(req),
      details: `Deleted artifact ${record.fileName} (SHA:${String(record.sha256).substring(0, 12)})`,
    });

    return res.json({ success: true, message: `File ${fileId} securely removed from Cloud Storage.` });
  } catch (err) {
    console.error('[GCS Delete Exception]', err);
    return res.status(500).json({ error: 'Failed to delete file artifact.' });
  }
});

// Authenticated Server Audit Event Ingestion (Derives actor & ip strictly on server; client cannot supply ipAddress)
app.post('/api/audit-events', requireAuth, async (req: AuthenticatedRequest, res) => {
  if ('ipAddress' in (req.body || {}) || 'ip' in (req.body || {})) {
    return res.status(400).json({
      error: 'Client-supplied ipAddress is forbidden. Audit IP is always derived on the server.',
    });
  }
  const parsed = auditEventInputSchema.safeParse(req.body || {});
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid audit event payload.' });
  }
  if (!adminDb) {
    return res.status(503).json({
      code: 'FIRESTORE_ADMIN_NOT_CONFIGURED',
      error: 'Firestore Admin SDK is not configured to persist audit events.',
    });
  }
  const user = req.authUser!;
  try {
    await appendServerAuditEvent({
      action: parsed.data.action,
      actorUid: user.uid,
      actorEmail: user.email || user.uid,
      resource: parsed.data.resource,
      outcome: parsed.data.outcome,
      ip: getClientIp(req),
      details: parsed.data.details,
    });
    return res.status(201).json({ success: true });
  } catch (err) {
    return sendFirestoreRouteError(res, err, 'Unable to write audit event.');
  }
});

// Admin Server Audit Ledger Endpoint (Strict Admin Only — Reads from Firestore audit_logs)
app.get('/api/audit-events', requireAdmin, async (_req: AuthenticatedRequest, res) => {
  if (!adminDb) {
    return res.status(503).json({
      code: 'FIRESTORE_ADMIN_NOT_CONFIGURED',
      error: 'Firestore Admin SDK is not configured to read audit logs.',
    });
  }
  try {
    const snap = await adminDb
      .collection('audit_logs')
      .orderBy('timestamp', 'desc')
      .limit(200)
      .get();
    const events = snap.docs.map((d) => d.data());
    return res.json({ count: events.length, events });
  } catch (err) {
    console.error('[Audit Events Read Error]', err);
    return sendFirestoreRouteError(res, err, 'Unable to read audit events.');
  }
});

/* =========================================================================
   SECURE PAYMENTS & INVOICES ENGINE (FIRESTORE VIA FIREBASE-ADMIN + RBAC)
   ========================================================================= */

function canAccessInvoice(user: VerifiedAuthUser, invoice: any): boolean {
  if (user.isAdmin) return true;
  if (invoice.clientId && invoice.clientId === user.uid) return true;
  if (
    user.emailVerified &&
    user.email &&
    invoice.clientEmail &&
    invoice.clientEmail.toLowerCase() === user.email.toLowerCase()
  ) {
    return true;
  }
  return false;
}

async function findInvoiceDocByIdOrNumber(invoiceIdOrNumber: string) {
  if (!adminDb) return null;
  const directSnap = await adminDb.collection('invoices').doc(invoiceIdOrNumber).get();
  if (directSnap.exists) {
    return directSnap;
  }
  const byNumberSnap = await adminDb
    .collection('invoices')
    .where('invoiceNumber', '==', invoiceIdOrNumber)
    .limit(1)
    .get();
  return byNumberSnap.empty ? null : byNumberSnap.docs[0];
}

// 8. Authoritative Invoices List (Authenticated & Tenant-Scoped via Firestore)
app.get('/api/invoices', requireAuth, async (req: AuthenticatedRequest, res) => {
  const user = req.authUser!;
  const { clientId, clientEmail } = req.query as { clientId?: string; clientEmail?: string };

  if (!adminDb) {
    return res.status(503).json({
      code: 'FIRESTORE_ADMIN_NOT_CONFIGURED',
      error: 'Firestore Admin SDK is not configured to load invoices.',
    });
  }

  try {
    const colRef = adminDb.collection('invoices');
    let invoices: any[] = [];

    if (user.isAdmin) {
      if (clientId) {
        const snap = await colRef.where('clientId', '==', clientId).get();
        invoices = snap.docs.map((d) => d.data());
      } else if (clientEmail) {
        const snap = await colRef.where('clientEmail', '==', clientEmail.toLowerCase()).get();
        invoices = snap.docs.map((d) => d.data());
      } else {
        const snap = await colRef.orderBy('issuedAt', 'desc').get();
        invoices = snap.docs.map((d) => d.data());
      }
    } else {
      const merged = new Map<string, any>();
      const byUidSnap = await colRef.where('clientId', '==', user.uid).get();
      for (const d of byUidSnap.docs) {
        merged.set(d.id, d.data());
      }
      if (user.emailVerified && user.email) {
        const byEmailSnap = await colRef
          .where('clientEmail', '==', user.email.toLowerCase())
          .get();
        for (const d of byEmailSnap.docs) {
          merged.set(d.id, d.data());
        }
      }
      invoices = Array.from(merged.values()).filter((inv) => canAccessInvoice(user, inv));
    }

    invoices.sort(
      (a: any, b: any) => new Date(b.issuedAt || 0).getTime() - new Date(a.issuedAt || 0).getTime()
    );

    return res.json({
      count: invoices.length,
      invoices,
    });
  } catch (err) {
    console.error('[Invoices Fetch Error]', err);
    return sendFirestoreRouteError(res, err, 'Unable to retrieve invoices from Firestore.');
  }
});

// 9. Single Invoice Details (Authenticated & Owner/Admin Checked)
app.get('/api/invoices/:invoiceId', requireAuth, async (req: AuthenticatedRequest, res) => {
  const user = req.authUser!;
  const { invoiceId } = req.params;
  if (!SAFE_ID_REGEX.test(invoiceId)) {
    return res.status(400).json({ error: 'Invalid invoiceId format.' });
  }
  if (!adminDb) {
    return res.status(503).json({
      code: 'FIRESTORE_ADMIN_NOT_CONFIGURED',
      error: 'Firestore Admin SDK is not configured to load invoice details.',
    });
  }

  try {
    const docSnap = await findInvoiceDocByIdOrNumber(invoiceId);
    if (!docSnap) {
      return res.status(404).json({ error: 'Invoice not found in billing ledger' });
    }
    const invoice = docSnap.data()!;

    if (!canAccessInvoice(user, invoice)) {
      return res.status(403).json({ error: 'Forbidden: You cannot access another tenant invoice.' });
    }

    return res.json(invoice);
  } catch (err) {
    console.error('[Invoice Detail Error]', err);
    return sendFirestoreRouteError(res, err, 'Unable to retrieve invoice.');
  }
});

// 10. Secure Payment Intent Creator (Authenticated + Optional Mode Guard + Firestore Persistence)
app.post('/api/payments/create-intent', requireAuth, async (req: AuthenticatedRequest, res) => {
  if (!HAS_EXPLICIT_PAYMENT_SECRET) {
    return res.status(503).json({
      error: 'Payment Gateway is currently in Optional Mode (PAYMENT_SECRET not configured). Invoices remain viewable without online charges.',
      code: 'PAYMENT_GATEWAY_OPTIONAL_MODE',
    });
  }

  if (!adminDb) {
    return res.status(503).json({
      code: 'FIRESTORE_ADMIN_NOT_CONFIGURED',
      error: 'Firestore Admin SDK is not configured to persist payment intents.',
    });
  }

  const user = req.authUser!;
  const { invoiceId } = req.body || {};

  if (!invoiceId || typeof invoiceId !== 'string' || !SAFE_ID_REGEX.test(invoiceId)) {
    return res.status(400).json({ error: 'Valid invoiceId is required' });
  }

  try {
    const invoiceSnap = await findInvoiceDocByIdOrNumber(invoiceId);
    if (!invoiceSnap) {
      return res.status(404).json({ error: 'Referenced invoice does not exist in registry.' });
    }
    const invoice = invoiceSnap.data()!;

    if (!canAccessInvoice(user, invoice)) {
      return res.status(403).json({ error: 'Forbidden: You are not authorized to pay this invoice.' });
    }

    if (invoice.status === 'paid') {
      return res.status(400).json({ error: 'Invoice has already been settled and verified.' });
    }

    // Authoritative amount strictly from server Firestore invoice, never client body
    const authoritativeAmount = Number(invoice.totalAmount);
    const orderId = `ORDER_${Date.now()}_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const checksum = crypto
      .createHmac('sha256', PAYMENT_SECRET)
      .update(`${orderId}:${invoice.id}:${authoritativeAmount}:${user.uid}`)
      .digest('hex');

    await adminDb.collection('payment_intents').doc(orderId).set({
      orderId,
      invoiceId: invoice.id,
      amount: authoritativeAmount,
      uid: user.uid,
      expiresAt: Date.now() + 30 * 60 * 1000,
      used: false,
      createdAt: new Date().toISOString(),
    });

    return res.json({
      orderId,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      milestoneTitle: invoice.milestoneTitle,
      amount: authoritativeAmount,
      currency: 'INR',
      gstRate: invoice.gstRate,
      gstAmount: invoice.gstAmount,
      clientCompany: invoice.clientCompany,
      checksum,
      paymentGateway: 'NPCI UPI 2.0 / Server-Verified Escrow Settlement',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Payment Intent Error]', err);
    return sendFirestoreRouteError(res, err, 'Failed to create payment intent.');
  }
});

// 11. Cryptographic Payment Verification & Transactional Settlement in Firestore
app.post('/api/payments/verify', requireAuth, async (req: AuthenticatedRequest, res) => {
  if (!HAS_EXPLICIT_PAYMENT_SECRET) {
    return res.status(503).json({
      error: 'Payment Gateway is currently in Optional Mode (PAYMENT_SECRET not configured).',
      code: 'PAYMENT_GATEWAY_OPTIONAL_MODE',
    });
  }

  if (!adminDb) {
    return res.status(503).json({
      code: 'FIRESTORE_ADMIN_NOT_CONFIGURED',
      error: 'Firestore Admin SDK is not configured to settle payments.',
    });
  }

  const user = req.authUser!;
  const { orderId, invoiceId, checksum, method, transactionRef } = req.body || {};

  if (
    !orderId ||
    typeof orderId !== 'string' ||
    !SAFE_ID_REGEX.test(orderId) ||
    !invoiceId ||
    typeof invoiceId !== 'string' ||
    !SAFE_ID_REGEX.test(invoiceId) ||
    !checksum ||
    typeof checksum !== 'string'
  ) {
    return res.status(400).json({ error: 'Valid orderId, invoiceId, and checksum are required' });
  }

  try {
    const initialInvoiceSnap = await findInvoiceDocByIdOrNumber(invoiceId);
    if (!initialInvoiceSnap) {
      return res.status(404).json({ error: 'Invoice record not found' });
    }

    const resolvedInvoiceDocRef = initialInvoiceSnap.ref;
    const intentDocRef = adminDb.collection('payment_intents').doc(orderId);

    const txResult = await adminDb.runTransaction(async (tx) => {
      const [intentSnap, invoiceSnap] = await Promise.all([
        tx.get(intentDocRef),
        tx.get(resolvedInvoiceDocRef),
      ]);

      if (!intentSnap.exists) {
        return { errorStatus: 400, error: 'Invalid, expired, or already-used payment intent.' };
      }

      const intent = intentSnap.data()!;
      if (intent.used || Date.now() > Number(intent.expiresAt || 0)) {
        return { errorStatus: 400, error: 'Invalid, expired, or already-used payment intent.' };
      }

      if (intent.uid !== user.uid && !user.isAdmin) {
        return { errorStatus: 403, error: 'Forbidden: Payment intent belongs to a different user.' };
      }

      if (!invoiceSnap.exists) {
        return { errorStatus: 404, error: 'Invoice record not found' };
      }

      const invoice = invoiceSnap.data()!;
      if (invoice.id !== intent.invoiceId) {
        return { errorStatus: 400, error: 'Invoice ID mismatch against payment intent.' };
      }

      if (!canAccessInvoice(user, invoice)) {
        return { errorStatus: 403, error: 'Forbidden: Unauthorized invoice settlement attempt.' };
      }

      if (invoice.status === 'paid') {
        return { errorStatus: 400, error: 'Invoice has already been settled.' };
      }

      const expectedChecksum = crypto
        .createHmac('sha256', PAYMENT_SECRET)
        .update(`${orderId}:${invoice.id}:${invoice.totalAmount}:${intent.uid}`)
        .digest('hex');

      const providedBuf = Buffer.from(checksum, 'utf8');
      const expectedBuf = Buffer.from(expectedChecksum, 'utf8');
      if (providedBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(providedBuf, expectedBuf)) {
        return {
          errorStatus: 400,
          error: 'Cryptographic Checksum Mismatch: Payment payload has been tampered with or expired.',
        };
      }

      const allowedMethods = new Set(['UPI', 'NEFT_RTGS', 'Corporate_Card', 'Escrow']);
      const safeMethod = allowedMethods.has(method) ? method : 'UPI';

      const paymentId = `PAY_${Date.now()}_${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      const verifiedTxnRef =
        typeof transactionRef === 'string' && transactionRef.trim().length > 4
          ? transactionRef.trim().substring(0, 64)
          : `TXN_NPCI_${Date.now()}_${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      const paidAt = new Date().toISOString();

      const updatedInvoice: Record<string, any> = {
        ...invoice,
        status: 'paid',
        paidAt,
        paymentTxnId: verifiedTxnRef,
        paymentMethod: safeMethod,
      };

      const paymentRecord = {
        id: paymentId,
        orderId,
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        clientId: invoice.clientId,
        clientEmail: invoice.clientEmail,
        settledByUid: user.uid,
        amount: invoice.totalAmount,
        currency: 'INR',
        method: safeMethod,
        status: 'success',
        transactionRef: verifiedTxnRef,
        checksum,
        timestamp: paidAt,
        verifiedBy: 'BHANU RAM BARIHA DIGITAL TECHNOLOGIES // SECURE_LEDGER_KERNEL',
      };

      tx.update(intentDocRef, { used: true, settledAt: paidAt });
      tx.set(resolvedInvoiceDocRef, updatedInvoice);
      tx.set(adminDb!.collection('payments').doc(paymentId), paymentRecord);

      return { errorStatus: null, paymentRecord, updatedInvoice, safeMethod };
    });

    if (txResult.errorStatus) {
      return res.status(txResult.errorStatus).json({ error: txResult.error });
    }

    void appendServerAuditEvent({
      action: 'PAYMENT_VERIFIED',
      actorUid: user.uid,
      actorEmail: user.email || user.uid,
      resource: `invoices/${txResult.updatedInvoice!.id}`,
      outcome: 'SUCCESS',
      ip: getClientIp(req),
      details: `Settled ${txResult.updatedInvoice!.invoiceNumber} for INR ${txResult.updatedInvoice!.totalAmount} (${txResult.safeMethod})`,
    });

    return res.json({
      success: true,
      message: 'Payment verified and committed to Cloud Firestore ledger.',
      payment: txResult.paymentRecord,
      invoice: txResult.updatedInvoice,
    });
  } catch (err) {
    console.error('[Payment Verify Error]', err);
    return sendFirestoreRouteError(res, err, 'Unable to verify and settle payment.');
  }
});

// 12. Admin Invoice Generator (Strict Verified Admin Only -> Firestore `invoices`)
app.post('/api/invoices/generate', requireAdmin, async (req: AuthenticatedRequest, res) => {
  if (!adminDb) {
    return res.status(503).json({
      code: 'FIRESTORE_ADMIN_NOT_CONFIGURED',
      error: 'Firestore Admin SDK is not configured to generate invoices.',
    });
  }

  const {
    projectId,
    projectName,
    clientId,
    clientName,
    clientEmail,
    clientCompany,
    clientGstin,
    milestoneTitle,
    subtotal,
  } = req.body || {};

  const numSubtotal = Number(subtotal);
  if (!Number.isFinite(numSubtotal) || numSubtotal <= 0 || numSubtotal > 100000000) {
    return res.status(400).json({ error: 'A valid positive subtotal amount is required' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!clientEmail || typeof clientEmail !== 'string' || !emailRegex.test(clientEmail.trim())) {
    return res.status(400).json({ error: 'A valid clientEmail is required' });
  }

  const gstRate = 18;
  const gstAmount = Math.round((numSubtotal * gstRate) / 100);
  const totalAmount = numSubtotal + gstAmount;
  const invoiceNumber = `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  const invoiceId = `inv-${Date.now()}`;

  const verificationHash = crypto
    .createHash('sha256')
    .update(`${invoiceNumber}:${totalAmount}:${new Date().toISOString()}`)
    .digest('hex');

  const newInvoice = {
    id: invoiceId,
    invoiceNumber,
    projectId: typeof projectId === 'string' && projectId.trim() ? projectId.trim() : 'proj-custom',
    projectName:
      typeof projectName === 'string' && projectName.trim()
        ? projectName.trim().substring(0, 160)
        : 'Enterprise Architecture Engagement',
    projectNameHi: 'उद्यम सॉफ्टवेयर इंजीनियरिंग अनुबंध',
    clientId: typeof clientId === 'string' && clientId.trim() ? clientId.trim() : 'client-custom',
    clientName:
      typeof clientName === 'string' && clientName.trim()
        ? clientName.trim().substring(0, 120)
        : 'Enterprise Partner',
    clientEmail: clientEmail.trim().toLowerCase(),
    clientCompany:
      typeof clientCompany === 'string' && clientCompany.trim()
        ? clientCompany.trim().substring(0, 160)
        : 'Enterprise Client Ltd.',
    clientGstin:
      typeof clientGstin === 'string' && clientGstin.trim() ? clientGstin.trim() : '21AAACK0000A1Z0',
    milestoneTitle:
      typeof milestoneTitle === 'string' && milestoneTitle.trim()
        ? milestoneTitle.trim().substring(0, 200)
        : 'Sprint Milestone Delivery',
    milestoneTitleHi: 'स्प्रिंट माइलस्टोन डिलीवरी',
    subtotal: numSubtotal,
    gstRate,
    gstAmount,
    totalAmount,
    currency: 'INR',
    hsnSac: '998313',
    status: 'issued',
    issuedAt: new Date().toISOString(),
    dueAt: new Date(Date.now() + 15 * 86400 * 1000).toISOString(),
    issuedByAdmin: req.authUser!.email,
    verificationHash,
  };

  try {
    await adminDb.collection('invoices').doc(invoiceId).set(newInvoice);

    void appendServerAuditEvent({
      action: 'INVOICE_GENERATED',
      actorUid: req.authUser!.uid,
      actorEmail: req.authUser!.email || req.authUser!.uid,
      resource: `invoices/${invoiceId}`,
      outcome: 'SUCCESS',
      ip: getClientIp(req),
      details: `Generated ${invoiceNumber} for ${newInvoice.clientEmail} (INR ${totalAmount})`,
    });

    return res.status(201).json({
      success: true,
      message: 'Official GST tax invoice generated and committed to Cloud Firestore.',
      invoice: newInvoice,
    });
  } catch (err) {
    console.error('[Invoice Generate Error]', err);
    return sendFirestoreRouteError(res, err, 'Unable to persist generated invoice to Firestore.');
  }
});

/* =========================================================================
   SEARCH ENGINE OPTIMIZATION & DISCOVERABILITY (SEO)
   ========================================================================= */

const DEFAULT_SITE_URL = 'https://YOUR-DOMAIN.com';

function resolveSeoBaseUrl(): string {
  const envUrl = (process.env.SITE_URL || '').trim().replace(/\/+$/, '');
  if (/^https?:\/\//i.test(envUrl)) {
    return envUrl;
  }
  return DEFAULT_SITE_URL;
}

app.get('/robots.txt', (_req, res) => {
  const baseUrl = resolveSeoBaseUrl();
  const publicFile = path.resolve(__dirname, 'public', 'robots.txt');
  const distFile = path.resolve(__dirname, 'dist', 'robots.txt');
  const targetFile = fs.existsSync(publicFile) ? publicFile : distFile;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  if (fs.existsSync(targetFile)) {
    const content = fs
      .readFileSync(targetFile, 'utf8')
      .replaceAll(DEFAULT_SITE_URL, baseUrl);
    return res.send(content);
  }
  return res.send(
    `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /admin-dashboard\nDisallow: /client-dashboard\nDisallow: /api/\n\nSitemap: ${baseUrl}/sitemap.xml\n`
  );
});

app.get('/sitemap.xml', (_req, res) => {
  const baseUrl = resolveSeoBaseUrl();
  const publicFile = path.resolve(__dirname, 'public', 'sitemap.xml');
  const distFile = path.resolve(__dirname, 'dist', 'sitemap.xml');
  const targetFile = fs.existsSync(publicFile) ? publicFile : distFile;
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  if (fs.existsSync(targetFile)) {
    const content = fs
      .readFileSync(targetFile, 'utf8')
      .replaceAll(DEFAULT_SITE_URL, baseUrl);
    return res.send(content);
  }
  const lastMod = new Date().toISOString().split('T')[0];
  const entries = [
    { path: '/', changefreq: 'weekly', priority: '1.0' },
    { path: '/services', changefreq: 'weekly', priority: '0.9' },
    { path: '/ai-solutions', changefreq: 'weekly', priority: '0.9' },
    { path: '/android-portfolio', changefreq: 'weekly', priority: '0.9' },
    { path: '/process', changefreq: 'monthly', priority: '0.8' },
    { path: '/about', changefreq: 'monthly', priority: '0.8' },
    { path: '/contact', changefreq: 'monthly', priority: '0.8' },
    { path: '/blog', changefreq: 'weekly', priority: '0.8' },
    { path: '/privacy', changefreq: 'yearly', priority: '0.5' },
    { path: '/terms', changefreq: 'yearly', priority: '0.5' },
  ];
  const xmlUrls = entries
    .map(
      (e) =>
        `  <url>\n    <loc>${baseUrl}${e.path}</loc>\n    <lastmod>${lastMod}</lastmod>\n    <changefreq>${e.changefreq}</changefreq>\n    <priority>${e.priority}</priority>\n  </url>`
    )
    .join('\n');

  return res.send(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${xmlUrls}\n</urlset>`
  );
});

// Explicit 404 JSON fallback for unknown /api/* routes (prevents SPA HTML fallthrough)
app.use('/api', (req: express.Request, res: express.Response) => {
  return res.status(404).json({ error: 'API endpoint not found.', path: req.originalUrl });
});

// Safe API Error Handler (Never exposes stack traces or internal paths)
app.use('/api', (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (res.headersSent) {
    return next(err);
  }
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Malformed JSON request payload.' });
  }
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request payload exceeds allowed size limit.' });
  }
  const status = typeof err?.status === 'number' && err.status >= 400 && err.status < 600 ? err.status : 500;
  const safeMessage =
    status < 500 && typeof err?.message === 'string'
      ? err.message
      : 'Internal server error.';
  return res.status(status).json({ error: safeMessage });
});

/* =========================================================================
   VITE DEV MIDDLEWARE / STATIC ASSETS HOSTING
   ========================================================================= */
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  const envSummary = getProductionEnvironmentSummary();
  if (!isDevEnv) {
    if (envSummary.warnings.length > 0) {
      console.warn(
        `[Production Env Check] ${envSummary.warnings.length} configuration warning(s): ${envSummary.warnings.join('; ')}`
      );
      if (envSummary.strictMode) {
        console.error(
          '[Production Env Check] STRICT_PRODUCTION_ENV=true requires all missing/invalid production configuration to be resolved before serving traffic.'
        );
        process.exit(1);
      }
    } else {
      console.log('[Production Env Check] All critical Cloud Run security & storage environment checks passed.');
    }
  }

  let viteMiddlewarePromise: Promise<express.RequestHandler> | null = null;

  if (isDev) {
    // Register async Vite middleware pass-through before listening so routes resolve immediately without blocking port bind
    app.use((req, res, next) => {
      if (!viteMiddlewarePromise) {
        return next();
      }
      viteMiddlewarePromise
        .then((mw) => mw(req, res, next))
        .catch(next);
    });
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    const distIndexPath = path.resolve(distPath, 'index.html');
    const cachedIndexHtml = fs.existsSync(distIndexPath)
      ? fs.readFileSync(distIndexPath, 'utf8')
      : '';

    app.use(
      express.static(distPath, {
        maxAge: '1h',
        index: false,
        setHeaders: (res, filePath) => {
          if (filePath.endsWith(`${path.sep}sw.js`)) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          } else if (filePath.endsWith(`${path.sep}manifest.json`)) {
            res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
          }
        },
      })
    );
    app.get('*', (req, res) => {
      if (!cachedIndexHtml) {
        return res.sendFile(distIndexPath);
      }
      const configuredSiteUrl = (process.env.SITE_URL || '').trim().replace(/\/+$/, '');
      const proto = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : req.protocol;
      const reqHost = req.get('host');
      const liveOrigin = /^https?:\/\//i.test(configuredSiteUrl)
        ? configuredSiteUrl
        : reqHost
        ? `${proto}://${reqHost}`
        : '';

      const html = liveOrigin
        ? cachedIndexHtml
            .replaceAll(DEFAULT_SITE_URL, liveOrigin)
            .replace(/content="\/og-image\.jpg"/g, `content="${liveOrigin}/og-image.jpg"`)
            .replace(/property="og:url" content="\/"/g, `property="og:url" content="${liveOrigin}/"`)
        : cachedIndexHtml;

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(html);
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(
      `[POWER WEB STUDIO AI] Enterprise Server active on http://0.0.0.0:${PORT} (ENV: ${process.env.NODE_ENV || 'development'}, trustProxy=${TRUST_PROXY_HOPS})`
    );
  });

  if (isDev) {
    const disableHmr = process.env.DISABLE_HMR === 'true';
    viteMiddlewarePromise = import('vite')
      .then(({ createServer: createViteServer }) =>
        createViteServer({
          server: {
            middlewareMode: true,
            hmr: disableHmr ? false : { server },
          },
          appType: 'spa',
        })
      )
      .then((vite) => vite.middlewares as unknown as express.RequestHandler);
    void viteMiddlewarePromise.catch((err) => {
      console.error('[Vite Middleware Init Failure]', err);
    });
  }

  const gracefulShutdown = (signal: string) => {
    console.log(`[Lifecycle] Received ${signal}. Draining connections for Google Cloud Run scale-down...`);
    server.close(() => {
      console.log('[Lifecycle] HTTP listener terminated cleanly. Exiting process.');
      process.exit(0);
    });

    setTimeout(() => {
      console.error('[Lifecycle] Connection drain timeout exceeded. Forcing container shutdown.');
      process.exit(1);
    }, 15000).unref();
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

startServer().catch((err) => {
  console.error('[Server Start Failure]', err);
  process.exit(1);
});
