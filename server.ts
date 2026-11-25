import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { z } from 'zod';
import { initializeApp, getApps, applicationDefault, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getAppCheck } from 'firebase-admin/app-check';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { Storage } from '@google-cloud/storage';
import { GoogleGenAI, Type } from '@google/genai';
import {
  CANONICAL_SITE_URL,
  DEFAULT_SITEMAP_APP_IDS,
  PLACEHOLDER_SITE_URL,
  buildRobotsTxt,
  buildSitemapXml,
  resolveCanonicalSiteOrigin,
} from './src/config/siteConfig.ts';
import { DEMO_SITES, getDemoSiteBySlug } from './src/data/demoSites.ts';
import { BLOG_POSTS } from './src/data/blogData.ts';

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
   ENVIRONMENT PROFILE SEPARATION (PREVIEW vs PRODUCTION)
   ========================================================================= */
type AppRuntimeEnv = 'preview' | 'production';

function resolveAppRuntimeEnv(): AppRuntimeEnv {
  const explicit = (process.env.APP_ENV || '').trim().toLowerCase();
  if (explicit === 'production') return 'production';
  if (explicit === 'preview') return 'preview';
  const kService = (process.env.K_SERVICE || '').trim();
  if (/^ais-(dev|pre|mob)-/i.test(kService)) {
    return 'preview';
  }
  return process.env.NODE_ENV === 'production' ? 'production' : 'preview';
}

const APP_ENV: AppRuntimeEnv = resolveAppRuntimeEnv();
const IS_PREVIEW_ENV = APP_ENV === 'preview';
const IS_PRODUCTION_ENV = APP_ENV === 'production';

/* =========================================================================
   FIREBASE ADMIN SDK INITIALIZATION (ADC ONLY — ZERO PRIVATE KEYS)
   ========================================================================= */
let adminApp: App | null = null;
let adminHasCredentials = false;
let adminInitMode: 'gcp_adc' | 'public_cert_jwt' = 'public_cert_jwt';

function initializeFirebaseAdmin(): void {
  const existingApps = getApps();
  if (existingApps.length > 0) {
    adminApp = existingApps[0] || null;
    return;
  }

  // Strictly use Google Cloud Application Default Credentials (ADC) — never private key JSON files
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.K_SERVICE) {
    try {
      adminApp = initializeApp({
        credential: applicationDefault(),
        projectId: FIREBASE_CONFIG.projectId,
        storageBucket: process.env.GCS_BUCKET?.trim() || FIREBASE_CONFIG.storageBucket,
      });
      adminHasCredentials = true;
      adminInitMode = 'gcp_adc';
      console.log(
        `[Firebase Admin] Initialized via Application Default Credentials (APP_ENV=${APP_ENV}).`
      );
      return;
    } catch {
      // fall through to public certificate JWT verification
    }
  }

  // Fallback: project-scoped app for token verification (verifyIdToken requires no IAM)
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
  console.log(`[Firestore Admin] Bound to database "${FIRESTORE_DB_ID}" (APP_ENV=${APP_ENV}).`);
} else {
  console.warn(
    `[Firestore Admin Notice] GCP ADC not active (APP_ENV=${APP_ENV}). ID token verification remains active; privileged Admin SDK operations require Cloud Run ADC.`
  );
}

/* =========================================================================
   CLOUD STORAGE PROVIDER (GCS ONLY VIA ADC — ZERO LOCAL DISK WRITES)
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
    gcsStorageClient = new Storage({ projectId: FIREBASE_CONFIG.projectId });
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

const RAW_PAYMENT_WEBHOOK_SECRET = (process.env.PAYMENT_WEBHOOK_SECRET || '').trim();
const HAS_PAYMENT_WEBHOOK_SECRET =
  RAW_PAYMENT_WEBHOOK_SECRET.length >= 32 &&
  !PAYMENT_SECRET_PLACEHOLDER_RE.test(RAW_PAYMENT_WEBHOOK_SECRET);

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
          'https://*.google-analytics.com',
          'https://analytics.google.com',
          'https://*.analytics.google.com',
          'https://*.googletagmanager.com',
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
    'https://power-web-studio-ai-enterprise-digital-platform.ai.studio',
    (process.env.SITE_URL || '').trim().replace(/\/+$/, ''),
    ...configuredOrigins,
  ].filter(Boolean)
);

function isAllowedCorsOrigin(origin?: string, requestHost?: string): boolean {
  if (!origin) return true; // Requests without an Origin header (curl, server-to-server)
  const normalizedOrigin = origin.trim();
  if (staticAllowedOrigins.has(normalizedOrigin)) return true;
  try {
    const parsed = new URL(normalizedOrigin);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }
    if (requestHost) {
      const cleanReqHost = (requestHost.split(',')[0] || '')
        .trim()
        .toLowerCase()
        .replace(parsed.protocol === 'https:' ? /:443$/ : /:80$/, '');
      if (cleanReqHost && parsed.host.toLowerCase() === cleanReqHost) {
        return true;
      }
    }
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
  cors((req, callback) => {
    const rawOrigin = req.headers.origin;
    const rawHost = req.headers.host;
    const reqOrigin = Array.isArray(rawOrigin) ? rawOrigin[0] : rawOrigin;
    const reqHost = Array.isArray(rawHost) ? rawHost[0] : rawHost;
    if (isAllowedCorsOrigin(reqOrigin, reqHost)) {
      callback(null, {
        origin: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Firebase-AppCheck', 'X-Payment-Gateway-Signature'],
        credentials: false,
        maxAge: 600,
      });
    } else {
      const corsErr: any = new Error('Forbidden: Origin not permitted by CORS policy.');
      corsErr.status = 403;
      callback(corsErr);
    }
  })
);

function requireJsonContentType(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    if (!req.is('application/json')) {
      return res.status(415).json({
        code: 'UNSUPPORTED_MEDIA_TYPE',
        error: 'Requests must use Content-Type: application/json.',
      });
    }
  }
  return next();
}

// Route-scoped body limits: 15mb for base64 file uploads, strict 1mb everywhere else
app.use('/api/files/upload', express.json({ limit: '15mb' }));
app.use(express.json({ limit: '1mb' }));

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
const OWNER_EMAIL = 'powerusertopuser@gmail.com';

function isVerifiedOwnerEmail(email: string | undefined | null, emailVerified: boolean): boolean {
  return emailVerified === true && String(email || '').trim().toLowerCase() === OWNER_EMAIL;
}

interface VerifiedAuthUser {
  uid: string;
  email: string;
  emailVerified: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  roleDocExists: boolean;
  roleSource: 'user_roles' | 'custom_claim' | 'owner_email' | 'client';
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
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    const dbId = FIREBASE_CONFIG.firestoreDatabaseId || '(default)';
    const keySuffix = FIREBASE_CONFIG.apiKey
      ? `?key=${encodeURIComponent(FIREBASE_CONFIG.apiKey)}`
      : '';
    const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/${dbId}/documents/${collectionName}/${encodeURIComponent(docId)}${keySuffix}`;
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

function toFirestoreRestValue(val: unknown): Record<string, unknown> {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'string') return { stringValue: val };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  }
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map((item) => toFirestoreRestValue(item)) } };
  }
  if (typeof val === 'object') {
    const fields: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
      if (v !== undefined) {
        fields[k] = toFirestoreRestValue(v);
      }
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

function fromFirestoreRestValue(val: any): unknown {
  if (!val || typeof val !== 'object') return null;
  if ('nullValue' in val) return null;
  if ('stringValue' in val) return val.stringValue;
  if ('booleanValue' in val) return val.booleanValue;
  if ('integerValue' in val) return Number(val.integerValue);
  if ('doubleValue' in val) return Number(val.doubleValue);
  if ('timestampValue' in val) return val.timestampValue;
  if ('arrayValue' in val) {
    const values = Array.isArray(val.arrayValue?.values) ? val.arrayValue.values : [];
    return values.map((v: any) => fromFirestoreRestValue(v));
  }
  if ('mapValue' in val) {
    return fromFirestoreRestFields(val.mapValue?.fields || {});
  }
  return null;
}

function fromFirestoreRestFields(fields: Record<string, any> | undefined): Record<string, any> {
  const out: Record<string, any> = {};
  if (!fields) return out;
  for (const [k, v] of Object.entries(fields)) {
    out[k] = fromFirestoreRestValue(v);
  }
  return out;
}

async function runFirestoreQueryRest(
  collectionId: string,
  filters: Array<{ field: string; value: string }>,
  idToken: string
): Promise<Record<string, any>[] | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3500);
  try {
    const dbId = FIREBASE_CONFIG.firestoreDatabaseId || '(default)';
    const keySuffix = FIREBASE_CONFIG.apiKey
      ? `?key=${encodeURIComponent(FIREBASE_CONFIG.apiKey)}`
      : '';
    const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/${dbId}/documents:runQuery${keySuffix}`;
    const structuredQuery: Record<string, any> = {
      from: [{ collectionId }],
    };
    if (filters.length === 1) {
      structuredQuery.where = {
        fieldFilter: {
          field: { fieldPath: filters[0].field },
          op: 'EQUAL',
          value: { stringValue: filters[0].value },
        },
      };
    } else if (filters.length > 1) {
      structuredQuery.where = {
        compositeFilter: {
          op: 'AND',
          filters: filters.map((f) => ({
            fieldFilter: {
              field: { fieldPath: f.field },
              op: 'EQUAL',
              value: { stringValue: f.value },
            },
          })),
        },
      };
    }
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ structuredQuery }),
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const rows = (await res.json()) as any[];
    if (!Array.isArray(rows)) return [];
    return rows
      .filter((r) => r?.document?.fields)
      .map((r) => {
        const parsed = fromFirestoreRestFields(r.document.fields);
        const docName = typeof r?.document?.name === 'string' ? r.document.name : '';
        const docId = docName ? docName.split('/').pop() || '' : '';
        if (docId && !parsed.id) {
          parsed.id = docId;
        }
        return parsed;
      });
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function createFirestoreDocumentRest(
  collectionName: string,
  docId: string,
  data: Record<string, unknown>,
  idToken: string
): Promise<{ ok: boolean; status: number }> {
  if (!SAFE_ID_REGEX.test(docId)) return { ok: false, status: 400 };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3500);
  try {
    const dbId = FIREBASE_CONFIG.firestoreDatabaseId || '(default)';
    const params = new URLSearchParams();
    params.set('currentDocument.exists', 'false');
    if (FIREBASE_CONFIG.apiKey) {
      params.set('key', FIREBASE_CONFIG.apiKey);
    }
    const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/${dbId}/documents/${collectionName}/${encodeURIComponent(docId)}?${params.toString()}`;
    const fields: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data)) {
      if (v !== undefined) {
        fields[k] = toFirestoreRestValue(v);
      }
    }
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ fields }),
      signal: controller.signal,
    });
    return { ok: res.ok, status: res.status };
  } catch {
    return { ok: false, status: 500 };
  } finally {
    clearTimeout(timeout);
  }
}

async function patchFirestoreDocumentRest(
  collectionName: string,
  docId: string,
  data: Record<string, unknown>,
  idToken: string
): Promise<{ ok: boolean; status: number }> {
  if (!SAFE_ID_REGEX.test(docId)) return { ok: false, status: 400 };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    const dbId = FIREBASE_CONFIG.firestoreDatabaseId || '(default)';
    const params = new URLSearchParams();
    const fields: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data)) {
      if (v !== undefined) {
        fields[k] = toFirestoreRestValue(v);
        params.append('updateMask.fieldPaths', k);
      }
    }
    if (FIREBASE_CONFIG.apiKey) {
      params.set('key', FIREBASE_CONFIG.apiKey);
    }
    const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/${dbId}/documents/${collectionName}/${encodeURIComponent(docId)}?${params.toString()}`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ fields }),
      signal: controller.signal,
    });
    return { ok: res.ok, status: res.status };
  } catch {
    return { ok: false, status: 500 };
  } finally {
    clearTimeout(timeout);
  }
}

async function deleteFirestoreDocumentRest(
  collectionName: string,
  docId: string,
  idToken: string
): Promise<{ ok: boolean; status: number }> {
  if (!SAFE_ID_REGEX.test(docId)) return { ok: false, status: 400 };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    const dbId = FIREBASE_CONFIG.firestoreDatabaseId || '(default)';
    const keySuffix = FIREBASE_CONFIG.apiKey
      ? `?key=${encodeURIComponent(FIREBASE_CONFIG.apiKey)}`
      : '';
    const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/${dbId}/documents/${collectionName}/${encodeURIComponent(docId)}${keySuffix}`;
    const res = await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
      signal: controller.signal,
    });
    return { ok: res.ok, status: res.status };
  } catch {
    return { ok: false, status: 500 };
  } finally {
    clearTimeout(timeout);
  }
}

interface FirestoreAdminRoleCheck {
  isAdmin: boolean;
  isSuperAdmin: boolean;
  exists: boolean;
}

async function checkFirestoreAdminRole(uid: string, idToken: string): Promise<FirestoreAdminRoleCheck> {
  if (adminDb && SAFE_ID_REGEX.test(uid)) {
    try {
      const snap = await adminDb.collection('user_roles').doc(uid).get();
      if (snap.exists) {
        const data = snap.data();
        const roleVal = typeof data?.role === 'string' ? data.role : '';
        const isSuperAdmin = Boolean(data?.isSuperAdmin === true || data?.tier === 'super_admin' || roleVal === 'super_admin');
        return {
          isAdmin: roleVal === 'admin' || roleVal === 'super_admin',
          isSuperAdmin,
          exists: true,
        };
      }
    } catch {
      // Fall back to REST API check below
    }
  }
  const doc = await fetchFirestoreDocumentRest('user_roles', uid, idToken);
  if (!doc || !doc.fields) {
    return { isAdmin: false, isSuperAdmin: false, exists: false };
  }
  const restRole = doc.fields?.role?.stringValue || '';
  const restIsSuper =
    doc.fields?.isSuperAdmin?.booleanValue === true ||
    doc.fields?.tier?.stringValue === 'super_admin' ||
    restRole === 'super_admin';
  return {
    isAdmin: restRole === 'admin' || restRole === 'super_admin',
    isSuperAdmin: restIsSuper,
    exists: true,
  };
}

async function resolveServerAdminStatus(params: {
  uid: string;
  email: string;
  emailVerified: boolean;
  idToken: string;
  hasCustomClaimAdmin: boolean;
  hasCustomClaimSuperAdmin?: boolean;
}): Promise<{
  isAdmin: boolean;
  isSuperAdmin: boolean;
  roleDocExists: boolean;
  roleSource: VerifiedAuthUser['roleSource'];
}> {
  const verifiedOwner = isVerifiedOwnerEmail(params.email, params.emailVerified);

  // 1. Primary RBAC source of truth: Firestore `user_roles/{uid}` document
  const firestoreRole = await checkFirestoreAdminRole(params.uid, params.idToken);
  if (firestoreRole.isAdmin) {
    return {
      isAdmin: true,
      isSuperAdmin: Boolean(firestoreRole.isSuperAdmin || params.hasCustomClaimSuperAdmin || verifiedOwner),
      roleDocExists: firestoreRole.exists,
      roleSource: 'user_roles',
    };
  }

  // 2. Verified Firebase Auth custom claim (`admin: true` or `role: "admin"`)
  if (params.hasCustomClaimAdmin) {
    return {
      isAdmin: true,
      isSuperAdmin: Boolean(params.hasCustomClaimSuperAdmin || verifiedOwner),
      roleDocExists: firestoreRole.exists,
      roleSource: 'custom_claim',
    };
  }

  // 3. Server-side verified OWNER_EMAIL check (grants Admin even before user_roles/{uid} exists)
  if (verifiedOwner) {
    return {
      isAdmin: true,
      isSuperAdmin: true,
      roleDocExists: firestoreRole.exists,
      roleSource: 'owner_email',
    };
  }

  return {
    isAdmin: false,
    isSuperAdmin: false,
    roleDocExists: firestoreRole.exists,
    roleSource: 'client',
  };
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
    // Try Firebase Admin SDK signature verification (default checkRevoked=false needs no IAM)
    if (adminApp && adminHasCredentials) {
      try {
        const decoded = await getAuth(adminApp).verifyIdToken(token);
        const email = typeof decoded.email === 'string' ? decoded.email : '';
        const emailVerified = Boolean(decoded.email_verified);
        const { isAdmin, isSuperAdmin, roleDocExists, roleSource } = await resolveServerAdminStatus({
          uid: decoded.uid,
          email,
          emailVerified,
          idToken: token,
          hasCustomClaimAdmin:
            decoded.admin === true ||
            decoded.superAdmin === true ||
            decoded.role === 'admin' ||
            decoded.role === 'super_admin',
          hasCustomClaimSuperAdmin: decoded.superAdmin === true || decoded.role === 'super_admin',
        });

        return {
          rawToken: token,
          user: {
            uid: decoded.uid,
            email,
            emailVerified,
            isAdmin,
            isSuperAdmin,
            roleDocExists,
            roleSource,
          },
        };
      } catch (adminVerifyErr: any) {
        const errCode = String(adminVerifyErr?.code || '');
        if (errCode.startsWith('auth/')) {
          return null;
        }
      }
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
      !SAFE_ID_REGEX.test(payload.sub)
    ) {
      return null;
    }

    const email = typeof payload.email === 'string' ? payload.email : '';
    const emailVerified = Boolean(payload.email_verified);
    const { isAdmin, isSuperAdmin, roleDocExists, roleSource } = await resolveServerAdminStatus({
      uid: payload.sub,
      email,
      emailVerified,
      idToken: token,
      hasCustomClaimAdmin:
        payload.admin === true ||
        payload.superAdmin === true ||
        payload.role === 'admin' ||
        payload.role === 'super_admin',
      hasCustomClaimSuperAdmin: payload.superAdmin === true || payload.role === 'super_admin',
    });

    return {
      rawToken: token,
      user: {
        uid: payload.sub,
        email,
        emailVerified,
        isAdmin,
        isSuperAdmin,
        roleDocExists,
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

// Dedicated rate limit bucket for public lead submissions: max 5 requests per IP per 1 hour
const leadRateMap = new Map<string, { count: number; resetTime: number }>();
const LEAD_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_LEADS_PER_HOUR = 5;

// Dedicated rate limit bucket for public UPI payment creation: max 10 requests per IP per 1 hour
const paymentCreateRateMap = new Map<string, { count: number; resetTime: number }>();
const PAYMENT_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_PAYMENTS_PER_HOUR = 10;

// Dedicated rate limit bucket for public UPI UTR submission: max 20 requests per IP per 1 hour
const paymentUtrRateMap = new Map<string, { count: number; resetTime: number }>();
const MAX_PAYMENT_UTR_UPDATES_PER_HOUR = 20;

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
  pruneExpiredRateBuckets(leadRateMap);
  pruneExpiredRateBuckets(paymentCreateRateMap);
  pruneExpiredRateBuckets(paymentUtrRateMap);
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

function createLeadRateLimiter() {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const clientIp = getClientIp(req);
    const bucketKey = `lead:${clientIp}`;
    const check = checkRateBucket(
      leadRateMap,
      bucketKey,
      MAX_LEADS_PER_HOUR,
      LEAD_RATE_LIMIT_WINDOW_MS
    );

    const retryAfterSeconds = Math.ceil(check.retryAfterMs / 1000);
    res.setHeader('X-RateLimit-Limit', String(MAX_LEADS_PER_HOUR));
    res.setHeader('X-RateLimit-Remaining', String(check.remaining));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(check.resetTime / 1000)));

    if (!check.allowed) {
      const waitMinutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));
      const errorEn = `Too many inquiries from your IP address (max 5 per hour). Please wait ${waitMinutes} minute(s) before trying again.`;
      const errorHi = `एक घंटे में अधिकतम 5 पूछताछ की सीमा पूरी हो गई है। कृपया ${waitMinutes} मिनट बाद पुनः प्रयास करें।`;
      const lang = resolveRequestedLanguage(req);

      appendServerAuditEvent({
        action: 'LEAD_RATE_LIMIT_EXCEEDED',
        actorUid: 'anonymous',
        actorEmail: typeof req.body?.email === 'string' ? req.body.email.trim().slice(0, 120) : 'guest',
        resource: req.originalUrl,
        outcome: 'DENIED',
        ip: clientIp,
        details: `Blocked lead submission: exceeded ${MAX_LEADS_PER_HOUR} requests per 1 hour window`,
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
  scope: 'validate' | 'quotation' | 'newsletter' | 'lead' | 'payment'
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
  scope: 'inquiry' | 'newsletter' | 'upload' | 'audit' | 'payment'
): Promise<boolean> {
  const token = (req.header('x-firebase-appcheck') || '').trim();
  const lang = resolveRequestedLanguage(req);
  const mustEnforce = ENFORCE_APP_CHECK;
  const isMonitorMode = HAS_RECAPTCHA_SITE_KEY && !ENFORCE_APP_CHECK;

  if (mustEnforce && !adminApp) {
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

  // Enforce missing token ONLY when ENFORCE_APP_CHECK=true; monitor mode logs and allows
  if (!token) {
    if (!mustEnforce) {
      if (isMonitorMode) {
        console.warn(
          `[AppCheck Monitor] Missing X-Firebase-AppCheck token for ${scope}; allowing request in monitor mode.`
        );
      }
      return true;
    }
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
    if (isMonitorMode) {
      console.warn(
        `[AppCheck Monitor] Firebase Admin SDK unavailable to verify ${scope} App Check token; allowing request in monitor mode.`
      );
      return true;
    }
    console.warn('[AppCheck Warning] Firebase Admin App not initialized; denying App Check verification request.');
    res.status(503).json({
      code: 'APP_CHECK_NOT_CONFIGURED',
      error: 'App Check verification unavailable without Firebase Admin initialization.',
    });
    return false;
  }

  try {
    await getAppCheck(adminApp).verifyToken(token);
    return true;
  } catch (err) {
    if (isMonitorMode) {
      console.warn(
        `[AppCheck Monitor] App Check token verification failed for ${scope}; allowing request in monitor mode:`,
        err
      );
      return true;
    }
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

const RECAPTCHA_ENTERPRISE_SITE_KEY = '6LflRSsuAAAAAJHVpuPKz3AVn0B9WBau9fC0V8K_';
const RECAPTCHA_ENTERPRISE_PROJECT_ID = 'gen-lang-client-0641950103';
const RECAPTCHA_ENTERPRISE_MIN_SCORE = 0.5;
const RECAPTCHA_FAIL_MESSAGE =
  'सुरक्षा जांच विफल रही, कृपया दोबारा कोशिश करें। / Security check failed, please try again.';

async function verifyRecaptchaEnterprise(
  req: express.Request,
  res: express.Response,
  allowedActions: readonly string[]
): Promise<boolean> {
  const apiKey = (process.env.RECAPTCHA_API_KEY || '').trim();
  if (!apiKey) {
    console.warn(
      '[reCAPTCHA Enterprise] RECAPTCHA_API_KEY is not set; accepting form submission without assessment.'
    );
    return true;
  }

  const rawToken = typeof req.body?.recaptchaToken === 'string' ? req.body.recaptchaToken.trim() : '';
  const rawAction = typeof req.body?.recaptchaAction === 'string' ? req.body.recaptchaAction.trim() : '';
  const expectedAction = allowedActions.includes(rawAction) ? rawAction : allowedActions[0];

  if (!rawToken || rawToken.length > 4096) {
    console.warn(`[reCAPTCHA Enterprise] Missing or invalid token for action "${expectedAction}".`);
    res.status(403).json({
      code: 'RECAPTCHA_FAILED',
      error: RECAPTCHA_FAIL_MESSAGE,
      errorHi: RECAPTCHA_FAIL_MESSAGE,
      errorEn: RECAPTCHA_FAIL_MESSAGE,
    });
    return false;
  }

  const assessmentEndpoint = `https://recaptchaenterprise.googleapis.com/v1/projects/${RECAPTCHA_ENTERPRISE_PROJECT_ID}/assessments?key=${encodeURIComponent(apiKey)}`;

  try {
    const response = await fetch(assessmentEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event: {
          token: rawToken,
          siteKey: RECAPTCHA_ENTERPRISE_SITE_KEY,
          expectedAction,
        },
      }),
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      console.warn(
        `[reCAPTCHA Enterprise] Google API returned HTTP ${response.status} for action "${expectedAction}"; accepting submission so forms do not break.`
      );
      return true;
    }

    const assessment = (await response.json()) as {
      tokenProperties?: {
        valid?: boolean;
        action?: string;
        invalidReason?: string;
      };
      riskAnalysis?: {
        score?: number;
      };
    };

    const isValid = assessment?.tokenProperties?.valid === true;
    const actionMatches = assessment?.tokenProperties?.action === expectedAction;
    const score = typeof assessment?.riskAnalysis?.score === 'number' ? assessment.riskAnalysis.score : -1;

    if (isValid && actionMatches && score >= RECAPTCHA_ENTERPRISE_MIN_SCORE) {
      return true;
    }

    console.warn(
      `[reCAPTCHA Enterprise] Rejected submission (expectedAction=${expectedAction}, valid=${isValid}, actualAction=${assessment?.tokenProperties?.action || 'none'}, score=${score}, reason=${assessment?.tokenProperties?.invalidReason || 'none'}).`
    );
    res.status(403).json({
      code: 'RECAPTCHA_FAILED',
      error: RECAPTCHA_FAIL_MESSAGE,
      errorHi: RECAPTCHA_FAIL_MESSAGE,
      errorEn: RECAPTCHA_FAIL_MESSAGE,
    });
    return false;
  } catch (err: any) {
    const safeReason =
      typeof err?.name === 'string' && err.name
        ? err.name
        : 'network_error';
    console.warn(
      `[reCAPTCHA Enterprise] Unable to reach Google API (${safeReason}) for action "${expectedAction}"; accepting submission so forms do not break.`
    );
    return true;
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

function normalizeIndianPhone(raw: string): string {
  const digits = String(raw || '').replace(/[^\d]/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return digits.slice(1);
  }
  return digits;
}

const leadInputSchema = z.object({
  fullName: z.string().trim().min(1, 'REQUIRED_NAME').max(160, 'MAX_NAME'),
  phone: z
    .string()
    .trim()
    .min(1, 'REQUIRED_PHONE')
    .max(40, 'INVALID_PHONE')
    .transform(normalizeIndianPhone)
    .refine((val) => /^\d{10}$/.test(val), 'INVALID_PHONE'),
  email: z
    .string()
    .trim()
    .max(160, 'MAX_EMAIL')
    .optional()
    .default('')
    .refine((val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), 'INVALID_EMAIL'),
  company: z.string().trim().max(160).optional().default(''),
  serviceType: z.string().trim().min(1, 'REQUIRED_SERVICE').max(160, 'MAX_SERVICE'),
  timeline: z.string().trim().max(64).optional().default('3-6-months'),
  budget: z.string().trim().max(80).optional().default(''),
  brief: z.string().trim().max(3000).optional().default(''),
  source: z.string().trim().max(64).optional().default('contact_form'),
  language: z.enum(['en', 'hi']).optional().default('hi'),
  attachment: attachmentSchema,
});

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
  } else if (firstCode === 'REQUIRED_PHONE' || firstCode === 'INVALID_PHONE' || field === 'phone') {
    errorEn = 'Please enter a valid 10-digit mobile number.';
    errorHi = 'कृपया 10 अंकों का मान्य मोबाइल नंबर दर्ज करें।';
  } else if (firstCode === 'INVALID_EMAIL' || firstCode === 'MAX_EMAIL' || field === 'email') {
    errorEn = 'Please enter a valid email address.';
    errorHi = 'कृपया एक मान्य ईमेल पता दर्ज करें।';
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
const RAW_SITE_URL = resolveCanonicalSiteOrigin(process.env.SITE_URL);
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
  if (!HAS_RECAPTCHA_SITE_KEY) {
    warnings.push('VITE_RECAPTCHA_SITE_KEY is not set (App Check unconfigured)');
  } else if (!ENFORCE_APP_CHECK) {
    warnings.push('ENFORCE_APP_CHECK is false (App Check running in monitor mode)');
  }
  if (!adminHasCredentials) warnings.push('Firebase Admin credentials unavailable (server writes return 503)');

  const appCheckMode = ENFORCE_APP_CHECK
    ? 'enforced'
    : HAS_RECAPTCHA_SITE_KEY
    ? 'monitor'
    : 'advisory_until_configured';

  return {
    appEnv: APP_ENV,
    nodeEnv: process.env.NODE_ENV || 'development',
    strictMode: process.env.STRICT_PRODUCTION_ENV === 'true',
    siteUrlConfigured: HAS_PRODUCTION_SITE_URL,
    gcsBucketConfigured: Boolean(EXPLICIT_GCS_BUCKET),
    paymentSecretValid: HAS_EXPLICIT_PAYMENT_SECRET,
    paymentSecretMinLength: 32,
    appCheckConfigured: HAS_RECAPTCHA_SITE_KEY,
    appCheckEnforced: ENFORCE_APP_CHECK,
    appCheckMode,
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
      const keySuffix = FIREBASE_CONFIG.apiKey
        ? `?key=${encodeURIComponent(FIREBASE_CONFIG.apiKey)}`
        : '';
      const probeUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/${dbId}/documents/site_settings/global_config${keySuffix}`;
      const probeRes = await fetch(probeUrl, { signal: controller.signal });
      probeHttpStatus = probeRes.status;
      probeLatencyMs = Date.now() - start;
      // Only 200 or 404 confirms authenticated/open read; 403 must never report CONNECTED
      if (probeRes.status === 200 || probeRes.status === 404) {
        databaseStatus = 'CONNECTED';
      } else {
        databaseStatus = 'DEGRADED';
      }
    } catch {
      databaseStatus = 'DEGRADED';
    } finally {
      clearTimeout(timeout);
    }
  }

  let serverWrites: 'available' | 'unavailable_iam' | 'unconfigured' | 'error' = 'unconfigured';
  if (adminDb) {
    try {
      await adminDb.collection('site_settings').doc('global').get();
      serverWrites = 'available';
    } catch (adminErr: any) {
      serverWrites = isFirestoreAdminCredentialError(adminErr) ? 'unavailable_iam' : 'error';
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
    serverWrites,
    database: {
      provider: 'Google Cloud Firestore',
      projectId: FIREBASE_CONFIG.projectId,
      databaseId: dbId,
      edition: 'Enterprise',
      status: databaseStatus,
      serverWrites,
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
      appCheckEnforced: ENFORCE_APP_CHECK,
      appCheckMode: envSummary.appCheckMode,
      helmetCspEnabled: true,
      cspStrictScriptSrcInProd: !isDevEnv,
      corsStrictAllowlist: true,
      unauthenticatedUploadsDisabled: true,
      paymentSecretConfigured: HAS_EXPLICIT_PAYMENT_SECRET,
      paymentWebhookSecretConfigured: HAS_PAYMENT_WEBHOOK_SECRET,
      paymentGatewayMode:
        HAS_EXPLICIT_PAYMENT_SECRET && HAS_PAYMENT_WEBHOOK_SECRET
          ? 'configured_verified'
          : HAS_EXPLICIT_PAYMENT_SECRET
          ? 'configured'
          : 'optional_mode',
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
      appEnv: APP_ENV,
      platform: process.env.K_SERVICE ? 'Google Cloud Run' : 'Containerized Express + Node.js',
      serviceName: process.env.K_SERVICE || 'powerwebstudioai-service',
      revision: process.env.K_REVISION || 'rev-2026-phase1-sec',
      port: PORT,
      httpsTerminated: req.secure || req.headers['x-forwarded-proto'] === 'https',
      nodeVersion: process.version,
    },
  });
});

// 1a. Honest Readiness Probe (real Firestore Admin SDK read check)
app.get('/api/health/ready', async (_req, res) => {
  if (!adminDb) {
    return res.status(503).json({
      ready: false,
      reason: 'FIREBASE_ADMIN_NOT_INITIALIZED',
    });
  }
  try {
    await adminDb.collection('site_settings').doc('global').get();
    return res.status(200).json({ ready: true });
  } catch (err: any) {
    const errMsg = String(err?.message || 'FIRESTORE_READ_FAILED');
    const safeReason =
      err?.code === 7 || /PERMISSION_DENIED/i.test(errMsg)
        ? 'FIRESTORE_PERMISSION_DENIED'
        : err?.code === 16 || /UNAUTHENTICATED|Could not load the default credentials/i.test(errMsg)
        ? 'FIRESTORE_UNAUTHENTICATED'
        : err?.code === 14 || /UNAVAILABLE/i.test(errMsg)
        ? 'FIRESTORE_UNAVAILABLE'
        : 'FIRESTORE_READ_FAILED';
    return res.status(503).json({
      ready: false,
      reason: safeReason,
    });
  }
});

// 1b. Public Safe System Capabilities Endpoint (Exposes non-sensitive feature flags only)
app.get('/api/system/capabilities', (_req, res) => {
  res.json({
    appEnv: APP_ENV,
    fileUploadEnabled: isGcsConfiguredAndVerified(),
    storageMode: isGcsConfiguredAndVerified() ? 'google_cloud_storage' : 'storage_not_configured',
    gcsBucketVerified,
    firestoreAdminReady: Boolean(adminDb),
    appCheckConfigured: HAS_RECAPTCHA_SITE_KEY,
    appCheckEnforced: ENFORCE_APP_CHECK,
    appCheckMode: ENFORCE_APP_CHECK
      ? 'enforced'
      : HAS_RECAPTCHA_SITE_KEY
      ? 'monitor'
      : 'advisory_until_configured',
    paymentGatewayEnabled: HAS_EXPLICIT_PAYMENT_SECRET,
    paymentWebhookConfigured: HAS_PAYMENT_WEBHOOK_SECRET,
    paymentMode: HAS_EXPLICIT_PAYMENT_SECRET ? 'configured' : 'optional_mode',
    geminiApiConfigured: HAS_GEMINI_API_KEY,
    authProvider: 'Firebase Authentication',
    adminRbacMode: 'user_roles_and_custom_claims',
  });
});

// 1c. Authenticated Caller Role Status Endpoint (Never leaks other users' admin emails)
app.get('/api/auth/status', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.authUser!;
  res.json({
    appEnv: APP_ENV,
    verificationMode: IS_PRODUCTION_ENV && adminDb ? 'server_admin_sdk' : 'client_rules_and_token',
    uid: user.uid,
    email: user.email || null,
    emailVerified: user.emailVerified,
    isAdmin: user.isAdmin,
    isSuperAdmin: user.isSuperAdmin,
    role: user.isAdmin ? 'admin' : 'client',
    roleSource: user.roleSource,
    roleDocExists: user.roleDocExists,
  });
});

// Helper: execute Admin Firestore merge write (Production Dedicated ADC or Preview Rules-Enforced Admin Token)
async function adminMergeFirestoreDoc(
  collectionName: string,
  docId: string,
  data: Record<string, unknown>,
  adminIdToken: string
): Promise<{ ok: boolean; mode: 'admin_sdk_adc' | 'preview_rules_enforced'; status: number }> {
  if (adminDb) {
    try {
      await adminDb.collection(collectionName).doc(docId).set(data, { merge: true });
      return { ok: true, mode: 'admin_sdk_adc', status: 200 };
    } catch (err: any) {
      const msg = String(err?.message || err);
      const isIamMissing =
        err?.code === 7 || /PERMISSION_DENIED|Could not load the default credentials/i.test(msg);
      if (!isIamMissing || IS_PRODUCTION_ENV) {
        return { ok: false, mode: 'admin_sdk_adc', status: isIamMissing ? 503 : 500 };
      }
    }
  }

  if (IS_PREVIEW_ENV && adminIdToken) {
    const restRes = await patchFirestoreDocumentRest(collectionName, docId, data, adminIdToken);
    return {
      ok: restRes.ok,
      mode: 'preview_rules_enforced',
      status: restRes.ok ? 200 : restRes.status,
    };
  }

  return { ok: false, mode: 'admin_sdk_adc', status: 503 };
}

// Helper: execute Admin Firestore delete (Production Dedicated ADC or Preview Rules-Enforced Admin Token)
async function adminDeleteFirestoreDoc(
  collectionName: string,
  docId: string,
  adminIdToken: string
): Promise<{ ok: boolean; mode: 'admin_sdk_adc' | 'preview_rules_enforced'; status: number }> {
  if (adminDb) {
    try {
      await adminDb.collection(collectionName).doc(docId).delete();
      return { ok: true, mode: 'admin_sdk_adc', status: 200 };
    } catch (err: any) {
      const msg = String(err?.message || err);
      const isIamMissing =
        err?.code === 7 || /PERMISSION_DENIED|Could not load the default credentials/i.test(msg);
      if (!isIamMissing || IS_PRODUCTION_ENV) {
        return { ok: false, mode: 'admin_sdk_adc', status: isIamMissing ? 503 : 500 };
      }
    }
  }

  if (IS_PREVIEW_ENV && adminIdToken) {
    const restRes = await deleteFirestoreDocumentRest(collectionName, docId, adminIdToken);
    return {
      ok: restRes.ok,
      mode: 'preview_rules_enforced',
      status: restRes.ok ? 200 : restRes.status,
    };
  }

  return { ok: false, mode: 'admin_sdk_adc', status: 503 };
}

// 1c-i-b. Server-Side Owner Admin Bootstrap (No secret/env required; strictly verified OWNER_EMAIL ONLY; ADC + same Firestore DB)
app.post('/api/admin/bootstrap', requireAuth, async (req: AuthenticatedRequest, res) => {
  const caller = req.authUser!;

  if (!isVerifiedOwnerEmail(caller.email, caller.emailVerified)) {
    void appendServerAuditEvent({
      action: 'ADMIN_BOOTSTRAP_DENIED',
      actorUid: caller.uid,
      actorEmail: caller.email || caller.uid,
      resource: '/api/admin/bootstrap',
      outcome: 'DENIED',
      ip: getClientIp(req),
      details: 'Non-owner or unverified account attempted POST /api/admin/bootstrap',
    });
    return res.status(403).json({
      error: 'Forbidden: Only the verified owner account can bootstrap admin privileges.',
    });
  }

  const nowIso = new Date().toISOString();
  const roleDoc = {
    uid: caller.uid,
    email: caller.email,
    role: 'admin',
    isSuperAdmin: true,
    tier: 'super_admin',
    emailVerified: true,
    assignedBy: 'server_bootstrap',
    assignedAt: nowIso,
  };

  let persisted = false;
  let mode: 'admin_sdk_adc' | 'firestore_rest_verified_owner' | 'owner_email_verified' =
    'owner_email_verified';

  // Primary write path: Firebase Admin SDK (ADC, zero private key) to the exact same Firestore DB used for quotations
  if (adminDb) {
    try {
      await adminDb.collection('user_roles').doc(caller.uid).set(roleDoc, { merge: true });
      persisted = true;
      mode = 'admin_sdk_adc';
    } catch (err) {
      if (!isFirestoreAdminCredentialError(err)) {
        console.error('[POST /api/admin/bootstrap Admin SDK Write Error]', err);
      }
    }
  }

  // Fallback when AI Studio Preview sandbox SA has no IAM: write to exact same DB using verified owner's Bearer ID token under firestore.rules
  if (!persisted && req.authToken) {
    const restWrite = await patchFirestoreDocumentRest('user_roles', caller.uid, roleDoc, req.authToken);
    if (restWrite.ok) {
      persisted = true;
      mode = 'firestore_rest_verified_owner';
    }
  }

  void appendServerAuditEvent({
    action: 'OWNER_ADMIN_BOOTSTRAPPED',
    actorUid: caller.uid,
    actorEmail: caller.email,
    resource: `user_roles/${caller.uid}`,
    outcome: 'SUCCESS',
    ip: getClientIp(req),
    details: `Owner admin bootstrap completed (persisted=${persisted}, mode=${mode})`,
  });

  return res.json({
    ok: true,
    persisted,
    mode,
    ...roleDoc,
  });
});

// 1c-ii. Strictly ONE-TIME Server-Side Super Admin Bootstrap (Production Dedicated ADC + Server Secret ONLY)
app.post(
  '/api/admin/super-admin/bootstrap',
  requireAuth,
  requireJsonContentType,
  async (req: AuthenticatedRequest, res) => {
    const caller = req.authUser!;

    if (IS_PREVIEW_ENV) {
      return res.status(403).json({
        error:
          'Forbidden: One-time Super Admin bootstrap is disabled in Preview mode and may only execute on the dedicated Production Cloud Run runtime.',
        code: 'BOOTSTRAP_DISABLED_IN_PREVIEW',
      });
    }

    const configuredSecret = (process.env.ADMIN_BOOTSTRAP_SECRET || '').trim();
    const headerSecret = String(req.headers['x-admin-bootstrap-secret'] || '').trim();
    const configuredOwnerEmail = (
      process.env.SUPER_ADMIN_EMAIL || 'powerusertopuser@gmail.com'
    )
      .trim()
      .toLowerCase();

    const callerEmail = (caller.email || '').trim().toLowerCase();
    const isTargetOwner =
      caller.emailVerified === true &&
      Boolean(callerEmail) &&
      callerEmail === configuredOwnerEmail;

    const secretIsNonPlaceholder =
      configuredSecret.length >= 32 && !PAYMENT_SECRET_PLACEHOLDER_RE.test(configuredSecret);
    let hasValidBootstrapSecret = false;
    if (secretIsNonPlaceholder && headerSecret.length === configuredSecret.length) {
      try {
        hasValidBootstrapSecret = crypto.timingSafeEqual(
          Buffer.from(headerSecret, 'utf8'),
          Buffer.from(configuredSecret, 'utf8')
        );
      } catch {
        hasValidBootstrapSecret = false;
      }
    }

    if (!isTargetOwner || !hasValidBootstrapSecret) {
      void appendServerAuditEvent({
        action: 'SUPER_ADMIN_BOOTSTRAP_DENIED',
        actorUid: caller.uid,
        actorEmail: caller.email || caller.uid,
        resource: '/api/admin/super-admin/bootstrap',
        outcome: 'DENIED',
        ip: getClientIp(req),
        details: 'Unauthorized attempt to invoke one-time Super Admin bootstrap',
      });
      return res.status(403).json({
        error:
          'Forbidden: Verified owner email and valid high-entropy server bootstrap secret are required.',
      });
    }

    if (!adminApp || !adminDb) {
      return res.status(503).json({
        error: 'Firebase Admin SDK (ADC) is not initialized on this server.',
        code: 'ADMIN_SDK_CREDENTIALS_UNAVAILABLE',
      });
    }

    try {
      const lockRef = adminDb.collection('system_security').doc('super_admin_bootstrap');
      const existingLock = await lockRef.get();
      if (existingLock.exists && existingLock.data()?.completed === true) {
        void appendServerAuditEvent({
          action: 'SUPER_ADMIN_BOOTSTRAP_REPLAY_BLOCKED',
          actorUid: caller.uid,
          actorEmail: caller.email || caller.uid,
          resource: 'system_security/super_admin_bootstrap',
          outcome: 'DENIED',
          ip: getClientIp(req),
          details: 'Blocked repeat invocation of one-time Super Admin bootstrap',
        });
        return res.status(409).json({
          error: 'Super Admin bootstrap has already been completed once and is permanently locked.',
          code: 'BOOTSTRAP_ALREADY_COMPLETED',
        });
      }

      const adminAuth = getAuth(adminApp);
      const userRecord = await adminAuth.getUser(caller.uid);
      if (!userRecord.emailVerified || (userRecord.email || '').toLowerCase() !== configuredOwnerEmail) {
        return res.status(403).json({
          error: 'Forbidden: Firebase Auth account must be verified and match the authorized owner email.',
        });
      }

      const nowIso = new Date().toISOString();

      // Atomic one-time lock creation (fails with ALREADY_EXISTS under concurrent requests)
      try {
        await lockRef.create({
          completed: true,
          bootstrappedUid: caller.uid,
          bootstrappedEmail: userRecord.email || configuredOwnerEmail,
          bootstrappedAt: nowIso,
          method: 'server_bootstrap_adc',
        });
      } catch (lockErr: any) {
        if (lockErr?.code === 6 || /ALREADY_EXISTS/i.test(String(lockErr?.message || ''))) {
          return res.status(409).json({
            error: 'Super Admin bootstrap has already been completed once and is permanently locked.',
            code: 'BOOTSTRAP_ALREADY_COMPLETED',
          });
        }
        throw lockErr;
      }

      const existingClaims = userRecord.customClaims || {};
      await adminAuth.setCustomUserClaims(caller.uid, {
        ...existingClaims,
        admin: true,
        role: 'admin',
        superAdmin: true,
      });

      await adminDb
        .collection('user_roles')
        .doc(caller.uid)
        .set(
          {
            uid: caller.uid,
            role: 'admin',
            isSuperAdmin: true,
            tier: 'super_admin',
            email: userRecord.email || configuredOwnerEmail,
            emailVerified: true,
            assignedBy: 'server_one_time_bootstrap',
            assignedAt: nowIso,
          },
          { merge: true }
        );

      void appendServerAuditEvent({
        action: 'SUPER_ADMIN_PROVISIONED',
        actorUid: caller.uid,
        actorEmail: userRecord.email || caller.uid,
        resource: `user_roles/${caller.uid}`,
        outcome: 'SUCCESS',
        ip: getClientIp(req),
        details: 'One-time Super Admin custom claims and Firestore user_roles document provisioned via ADC',
      });

      return res.json({
        ok: true,
        oneTimeLocked: true,
        uid: caller.uid,
        email: userRecord.email || configuredOwnerEmail,
        role: 'admin',
        isSuperAdmin: true,
      });
    } catch (err: any) {
      const msg = String(err?.message || err);
      const isIamMissing =
        err?.code === 7 ||
        /PERMISSION_DENIED|Could not load the default credentials|identitytoolkit|auth\/internal-error/i.test(msg);
      return res.status(isIamMissing ? 503 : 500).json({
        error: isIamMissing
          ? 'Dedicated Cloud Run Service Account lacks required IAM permissions (roles/datastore.user, roles/firebaseauth.admin).'
          : 'Failed to provision Super Admin via Firebase Admin SDK.',
        code: isIamMissing ? 'ADMIN_SDK_CREDENTIALS_UNAVAILABLE' : 'PROVISION_FAILED',
      });
    }
  }
);

// 1c-iii-a. Server-Authoritative Admin Users & Roles List (Computes "owner" strictly on server — OWNER_EMAIL never sent to client bundle)
app.get('/api/admin/users', requireAdmin, async (req: AuthenticatedRequest, res) => {
  const caller = req.authUser!;

  const enrichUsersWithRoles = async (
    rawUsers: Record<string, any>[],
    rawRoles: Record<string, any>[]
  ) => {
    const rolesByUid = new Map<string, Record<string, any>>();
    for (const r of rawRoles) {
      const uid = String(r.uid || r.id || '').trim();
      if (uid) rolesByUid.set(uid, r);
    }

    const enriched = await Promise.all(
      rawUsers.map(async (u) => {
        const uid = String(u.uid || u.id || '').trim();
        const emailLower = String(u.email || '').trim().toLowerCase();
        const roleDoc = uid ? rolesByUid.get(uid) : undefined;
        const roleFromDoc = typeof roleDoc?.role === 'string' ? roleDoc.role.trim().toLowerCase() : '';
        const isSuperAdminFromDoc = Boolean(
          roleDoc?.isSuperAdmin === true ||
            roleDoc?.tier === 'super_admin' ||
            roleFromDoc === 'super_admin' ||
            roleFromDoc === 'owner'
        );

        let isVerifiedOwnerAccount = false;
        if (emailLower === OWNER_EMAIL) {
          if (uid && uid === caller.uid && caller.emailVerified) {
            isVerifiedOwnerAccount = true;
          } else if (roleDoc?.emailVerified === true) {
            isVerifiedOwnerAccount = true;
          } else if (adminApp && uid && SAFE_ID_REGEX.test(uid)) {
            try {
              const authUserRecord = await getAuth(adminApp).getUser(uid);
              if (
                authUserRecord.emailVerified === true &&
                (authUserRecord.email || '').trim().toLowerCase() === OWNER_EMAIL
              ) {
                isVerifiedOwnerAccount = true;
              }
            } catch {
              // Ignore IAM / lookup errors in Preview
            }
          }
        }

        const isOwner = isVerifiedOwnerAccount || isSuperAdminFromDoc;
        const resolvedRole = isOwner ? 'owner' : roleFromDoc || 'client';

        return {
          ...u,
          uid,
          role: resolvedRole,
          isOwner,
          isSuperAdmin: isOwner,
        };
      })
    );

    return enriched;
  };

  if (adminDb) {
    try {
      const [usersSnap, rolesSnap] = await Promise.all([
        adminDb.collection('users').get(),
        adminDb.collection('user_roles').get(),
      ]);
      const rawUsers = usersSnap.docs.map((d) => ({ id: d.id, uid: d.id, ...d.data() }));
      const rawRoles = rolesSnap.docs.map((d) => ({ id: d.id, uid: d.id, ...d.data() }));
      const users = await enrichUsersWithRoles(rawUsers, rawRoles);
      return res.json({ ok: true, count: users.length, users, mode: 'admin_sdk_adc' });
    } catch (err) {
      if (!isFirestoreAdminCredentialError(err)) {
        console.error('[GET /api/admin/users Admin SDK Error]', err);
      }
    }
  }

  if (req.authToken) {
    const [restUsers, restRoles] = await Promise.all([
      runFirestoreQueryRest('users', [], req.authToken),
      runFirestoreQueryRest('user_roles', [], req.authToken),
    ]);
    if (Array.isArray(restUsers)) {
      const users = await enrichUsersWithRoles(restUsers, Array.isArray(restRoles) ? restRoles : []);
      return res.json({
        ok: true,
        count: users.length,
        users,
        mode: 'firestore_rest_verified_admin',
      });
    }
  }

  return res.status(503).json({
    error: 'Unable to fetch users from Firestore.',
  });
});

// 1c-iii. Admin-Only Server-Side Role Assignment (Strictly Non-Privileged Roles Only: client | architect | manager; 403 on admin/super_admin/owner or owner target)
app.post(
  '/api/admin/roles/update',
  requireAdmin,
  requireJsonContentType,
  async (req: AuthenticatedRequest, res) => {
    const caller = req.authUser!;
    const targetUid = typeof req.body?.uid === 'string' ? req.body.uid.trim() : '';
    const requestedRoleRaw = typeof req.body?.role === 'string' ? req.body.role.trim() : '';
    const requestedRole = requestedRoleRaw.toLowerCase();
    const grantSuperAdmin = req.body?.isSuperAdmin === true;

    if (!SAFE_ID_REGEX.test(targetUid)) {
      return res.status(400).json({ error: 'Invalid target UID.' });
    }
    if (['admin', 'super_admin', 'owner'].includes(requestedRole) || grantSuperAdmin) {
      void appendServerAuditEvent({
        action: 'ADMIN_ROLE_ESCALATION_BLOCKED',
        actorUid: caller.uid,
        actorEmail: caller.email || caller.uid,
        resource: `user_roles/${targetUid}`,
        outcome: 'DENIED',
        ip: getClientIp(req),
        details: `Blocked attempt to assign privileged role "${requestedRole || 'super_admin'}" to ${targetUid}`,
      });
      return res.status(403).json({
        error: 'Forbidden: Assigning admin, super_admin, or owner roles to other accounts is prohibited.',
      });
    }
    if (!['client', 'architect', 'manager'].includes(requestedRole)) {
      return res.status(400).json({ error: 'Invalid role specified. Allowed roles: client, architect, manager.' });
    }
    if (targetUid === caller.uid) {
      return res.status(403).json({
        error: 'Forbidden: Administrators cannot modify their own role or privilege level.',
      });
    }

    const nowIso = new Date().toISOString();

    // Production path: Dedicated Service Account ADC updates Auth Custom Claims + Firestore user_roles
    if (adminApp && adminDb) {
      try {
        const [existingRoleSnap, existingUserSnap] = await Promise.all([
          adminDb.collection('user_roles').doc(targetUid).get(),
          adminDb.collection('users').doc(targetUid).get(),
        ]);
        const existingRoleData = existingRoleSnap.exists ? existingRoleSnap.data() : null;
        const existingUserData = existingUserSnap.exists ? existingUserSnap.data() : null;
        const targetEmailFromDoc = String(existingUserData?.email || existingRoleData?.email || '')
          .trim()
          .toLowerCase();

        if (
          existingRoleData?.isSuperAdmin === true ||
          existingRoleData?.role === 'super_admin' ||
          existingRoleData?.role === 'owner' ||
          targetEmailFromDoc === OWNER_EMAIL
        ) {
          return res.status(403).json({
            error: 'Forbidden: The owner / super admin account role cannot be modified.',
          });
        }

        const adminAuth = getAuth(adminApp);
        const targetUser = await adminAuth.getUser(targetUid);
        if ((targetUser.email || '').trim().toLowerCase() === OWNER_EMAIL) {
          return res.status(403).json({
            error: 'Forbidden: The owner account role cannot be modified.',
          });
        }

        const existingClaims = targetUser.customClaims || {};
        await adminAuth.setCustomUserClaims(targetUid, {
          ...existingClaims,
          admin: false,
          role: requestedRole,
          superAdmin: false,
        });

        await adminDb
          .collection('user_roles')
          .doc(targetUid)
          .set(
            {
              uid: targetUid,
              role: requestedRole,
              isSuperAdmin: false,
              email: targetUser.email || '',
              assignedBy: caller.email || caller.uid,
              assignedAt: nowIso,
            },
            { merge: true }
          );

        void appendServerAuditEvent({
          action: 'ADMIN_ROLE_UPDATED',
          actorUid: caller.uid,
          actorEmail: caller.email || caller.uid,
          resource: `user_roles/${targetUid}`,
          outcome: 'SUCCESS',
          ip: getClientIp(req),
          details: `Updated role for ${targetUid} to ${requestedRole} (claimsSynced=true)`,
        });

        return res.json({
          ok: true,
          uid: targetUid,
          role: requestedRole,
          isSuperAdmin: false,
          claimsSynced: true,
          mode: 'admin_sdk_adc',
        });
      } catch (err: any) {
        const msg = String(err?.message || err);
        const isIamMissing =
          err?.code === 7 ||
          /PERMISSION_DENIED|Could not load the default credentials|identitytoolkit|auth\/internal-error/i.test(msg);
        if (!isIamMissing || IS_PRODUCTION_ENV) {
          return res.status(isIamMissing ? 503 : 500).json({
            error: isIamMissing
              ? 'Dedicated Cloud Run Service Account lacks required IAM permissions for role updates.'
              : 'Failed to update user role via Firebase Admin SDK.',
            code: isIamMissing ? 'ADMIN_SDK_CREDENTIALS_UNAVAILABLE' : 'ROLE_UPDATE_FAILED',
          });
        }
      }
    }

    // Preview path (shared ais-sandbox intentionally has ZERO IAM):
    // Server verifies Admin token and writes user_roles/{targetUid} via Firestore REST under firestore.rules (isAdmin())
    if (IS_PREVIEW_ENV && req.authToken) {
      const [existingRestRole, existingRestUser] = await Promise.all([
        fetchFirestoreDocumentRest('user_roles', targetUid, req.authToken),
        fetchFirestoreDocumentRest('users', targetUid, req.authToken),
      ]);
      const restRoleVal = String(existingRestRole?.fields?.role?.stringValue || '').toLowerCase();
      const restUserEmail = String(
        existingRestUser?.fields?.email?.stringValue ||
          existingRestRole?.fields?.email?.stringValue ||
          ''
      )
        .trim()
        .toLowerCase();

      if (
        existingRestRole?.fields?.isSuperAdmin?.booleanValue === true ||
        restRoleVal === 'super_admin' ||
        restRoleVal === 'owner' ||
        restUserEmail === OWNER_EMAIL
      ) {
        return res.status(403).json({
          error: 'Forbidden: The owner / super admin account role cannot be modified.',
        });
      }

      const restWrite = await patchFirestoreDocumentRest(
        'user_roles',
        targetUid,
        {
          uid: targetUid,
          role: requestedRole,
          isSuperAdmin: false,
          assignedBy: caller.email || caller.uid,
          assignedAt: nowIso,
        },
        req.authToken
      );

      if (!restWrite.ok) {
        return res.status(restWrite.status === 403 ? 403 : 502).json({
          error: 'Firestore security rules rejected role update.',
        });
      }

      void appendServerAuditEvent({
        action: 'ADMIN_ROLE_UPDATED',
        actorUid: caller.uid,
        actorEmail: caller.email || caller.uid,
        resource: `user_roles/${targetUid}`,
        outcome: 'SUCCESS',
        ip: getClientIp(req),
        details: `Updated role for ${targetUid} to ${requestedRole} (preview_rules_enforced)`,
      });

      return res.json({
        ok: true,
        uid: targetUid,
        role: requestedRole,
        isSuperAdmin: false,
        claimsSynced: false,
        mode: 'preview_rules_enforced',
      });
    }

    return res.status(503).json({
      error: 'Firebase Admin SDK (ADC) is unavailable in this runtime.',
      code: 'ADMIN_SDK_CREDENTIALS_UNAVAILABLE',
    });
  }
);

// Preview-only in-memory leads buffer (used ONLY when IS_PREVIEW_ENV and Admin SDK ADC lacks IAM; never used in production)
const previewLeadsStore = new Map<string, Record<string, any>>();
const MAX_PREVIEW_LEADS = 500;

function mergePreviewLeads(rows: Record<string, any>[]): Record<string, any>[] {
  if (!IS_PREVIEW_ENV || previewLeadsStore.size === 0) {
    return rows;
  }
  const merged = new Map<string, Record<string, any>>();
  for (const row of rows) {
    if (row?.id) merged.set(String(row.id), row);
  }
  for (const [id, lead] of previewLeadsStore.entries()) {
    if (!merged.has(id)) {
      merged.set(id, lead);
    }
  }
  return Array.from(merged.values()).sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );
}

// 1c-iv. Server-Side Admin Quotations List, Status Update & Deletion
app.get('/api/admin/quotations', requireAdmin, async (req: AuthenticatedRequest, res) => {
  if (adminDb) {
    try {
      const snap = await adminDb.collection('quotations').get();
      const quotations = mergePreviewLeads(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      return res.json({ ok: true, count: quotations.length, quotations, mode: 'admin_sdk_adc' });
    } catch (err) {
      if (!isFirestoreAdminCredentialError(err)) {
        console.error('[GET /api/admin/quotations Admin SDK Error]', err);
      }
    }
  }

  if (req.authToken) {
    const rows = await runFirestoreQueryRest('quotations', [], req.authToken);
    if (Array.isArray(rows)) {
      const merged = mergePreviewLeads(rows);
      return res.json({
        ok: true,
        count: merged.length,
        quotations: merged,
        mode: 'firestore_rest_verified_admin',
      });
    }
  }

  if (IS_PREVIEW_ENV && previewLeadsStore.size > 0) {
    const quotations = mergePreviewLeads([]);
    return res.json({
      ok: true,
      count: quotations.length,
      quotations,
      mode: 'preview_memory',
    });
  }

  return res.status(503).json({
    error: 'Unable to fetch quotations from Firestore.',
  });
});

const adminQuotationStatusSchema = z.object({
  status: z.enum(['pending', 'under_review', 'reviewed', 'approved', 'rejected']),
});

app.patch(
  '/api/admin/quotations/:quotationId/status',
  requireAdmin,
  requireJsonContentType,
  async (req: AuthenticatedRequest, res) => {
    const quotationId = String(req.params.quotationId || '').trim();
    if (!SAFE_ID_REGEX.test(quotationId)) {
      return res.status(400).json({ error: 'Invalid quotation ID.' });
    }
    const parsed = adminQuotationStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid quotation status value.' });
    }
    const caller = req.authUser!;
    const nowIso = new Date().toISOString();
    if (IS_PREVIEW_ENV && previewLeadsStore.has(quotationId)) {
      const existing = previewLeadsStore.get(quotationId)!;
      previewLeadsStore.set(quotationId, {
        ...existing,
        status: parsed.data.status,
        updatedAt: nowIso,
        updatedBy: caller.uid,
      });
      return res.json({ ok: true, id: quotationId, status: parsed.data.status, mode: 'preview_memory' });
    }
    const writeRes = await adminMergeFirestoreDoc(
      'quotations',
      quotationId,
      {
        status: parsed.data.status,
        updatedAt: nowIso,
        updatedBy: caller.uid,
      },
      req.authToken || ''
    );
    if (!writeRes.ok) {
      return res.status(writeRes.status).json({ error: 'Unable to update quotation status.' });
    }
    void appendServerAuditEvent({
      action: 'QUOTATION_STATUS_CHANGE',
      actorUid: caller.uid,
      actorEmail: caller.email || caller.uid,
      resource: `quotations/${quotationId}`,
      outcome: 'SUCCESS',
      ip: getClientIp(req),
      details: `Status updated to ${parsed.data.status} (${writeRes.mode})`,
    });
    return res.json({ ok: true, id: quotationId, status: parsed.data.status, mode: writeRes.mode });
  }
);

app.delete(
  '/api/admin/quotations/:quotationId',
  requireAdmin,
  async (req: AuthenticatedRequest, res) => {
    const quotationId = String(req.params.quotationId || '').trim();
    if (!SAFE_ID_REGEX.test(quotationId)) {
      return res.status(400).json({ error: 'Invalid quotation ID.' });
    }
    const caller = req.authUser!;
    if (IS_PREVIEW_ENV && previewLeadsStore.has(quotationId)) {
      previewLeadsStore.delete(quotationId);
      return res.json({ ok: true, id: quotationId, mode: 'preview_memory' });
    }
    const delRes = await adminDeleteFirestoreDoc('quotations', quotationId, req.authToken || '');
    if (!delRes.ok) {
      return res.status(delRes.status).json({ error: 'Unable to delete quotation.' });
    }
    void appendServerAuditEvent({
      action: 'QUOTATION_DELETED',
      actorUid: caller.uid,
      actorEmail: caller.email || caller.uid,
      resource: `quotations/${quotationId}`,
      outcome: 'SUCCESS',
      ip: getClientIp(req),
      details: `Deleted quotation ${quotationId} (${delRes.mode})`,
    });
    return res.json({ ok: true, id: quotationId, mode: delRes.mode });
  }
);

// 1c-v. Server-Side Admin Support Ticket Status Update
const adminTicketStatusSchema = z.object({
  status: z.enum(['open', 'in_progress', 'resolved']),
});

app.patch(
  '/api/admin/support-tickets/:ticketId/status',
  requireAdmin,
  requireJsonContentType,
  async (req: AuthenticatedRequest, res) => {
    const ticketId = String(req.params.ticketId || '').trim();
    if (!SAFE_ID_REGEX.test(ticketId)) {
      return res.status(400).json({ error: 'Invalid ticket ID.' });
    }
    const parsed = adminTicketStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid ticket status value.' });
    }
    const caller = req.authUser!;
    const nowIso = new Date().toISOString();
    const writeRes = await adminMergeFirestoreDoc(
      'support_tickets',
      ticketId,
      {
        status: parsed.data.status,
        updatedAt: nowIso,
      },
      req.authToken || ''
    );
    if (!writeRes.ok) {
      return res.status(writeRes.status).json({ error: 'Unable to update ticket status.' });
    }
    void appendServerAuditEvent({
      action: 'TICKET_STATUS_UPDATED',
      actorUid: caller.uid,
      actorEmail: caller.email || caller.uid,
      resource: `support_tickets/${ticketId}`,
      outcome: 'SUCCESS',
      ip: getClientIp(req),
      details: `Ticket status changed to ${parsed.data.status} (${writeRes.mode})`,
    });
    return res.json({ ok: true, id: ticketId, status: parsed.data.status, mode: writeRes.mode });
  }
);

// 1c-vi. Server-Side Admin Site Settings Update
const adminSiteSettingsSchema = z.object({
  companyName: z.string().trim().min(1).max(160),
  brandName: z.string().trim().min(1).max(120),
  companyRegistration: z.string().trim().max(120).optional().default(''),
  contactEmail: z.string().trim().email().max(160),
  contactPhone: z.string().trim().max(40).optional().default(''),
  maintenanceMode: z.boolean().optional().default(false),
  slaTarget: z.string().trim().max(80).optional().default('SOW Scoped'),
  headquarters: z.string().trim().max(300).optional().default(''),
});

app.put(
  '/api/admin/site-settings',
  requireAdmin,
  requireJsonContentType,
  async (req: AuthenticatedRequest, res) => {
    const parsed = adminSiteSettingsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid site settings payload.' });
    }
    const caller = req.authUser!;
    const nowIso = new Date().toISOString();
    const writeRes = await adminMergeFirestoreDoc(
      'site_settings',
      'global_config',
      {
        id: 'global_config',
        ...parsed.data,
        updatedAt: nowIso,
        updatedBy: caller.uid,
      },
      req.authToken || ''
    );
    if (!writeRes.ok) {
      return res.status(writeRes.status).json({ error: 'Unable to persist site settings.' });
    }
    cachedPublicCatalog = null;
    void appendServerAuditEvent({
      action: 'SETTINGS_SAVED',
      actorUid: caller.uid,
      actorEmail: caller.email || caller.uid,
      resource: 'site_settings/global_config',
      outcome: 'SUCCESS',
      ip: getClientIp(req),
      details: `Updated platform site settings (${writeRes.mode})`,
    });
    return res.json({ ok: true, mode: writeRes.mode });
  }
);

// 1c-vii. Server-Side Admin Project Deletion
app.delete(
  '/api/admin/projects/:projectId',
  requireAdmin,
  async (req: AuthenticatedRequest, res) => {
    const projectId = String(req.params.projectId || '').trim();
    if (!SAFE_ID_REGEX.test(projectId)) {
      return res.status(400).json({ error: 'Invalid project ID.' });
    }
    const caller = req.authUser!;
    const delRes = await adminDeleteFirestoreDoc('projects', projectId, req.authToken || '');
    if (!delRes.ok) {
      return res.status(delRes.status).json({ error: 'Unable to delete project.' });
    }
    void appendServerAuditEvent({
      action: 'PROJECT_DELETED',
      actorUid: caller.uid,
      actorEmail: caller.email || caller.uid,
      resource: `projects/${projectId}`,
      outcome: 'SUCCESS',
      ip: getClientIp(req),
      details: `Deleted project ${projectId} (${delRes.mode})`,
    });
    return res.json({ ok: true, id: projectId, mode: delRes.mode });
  }
);

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
let publicCatalogIamUnavailable = false;

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
  if (!adminDb || publicCatalogIamUnavailable) {
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
    if (isFirestoreAdminCredentialError(err)) {
      publicCatalogIamUnavailable = true;
    } else {
      console.warn('[Public Catalog Fallback]', err?.message || err);
    }
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

// 3. Server-side Inbound Scoping Validator (Rate-limited per IP + JSON CSRF guard + anti-bot + App Check + Zod)
app.post('/api/inquiries/validate', requireJsonContentType, createFormRateLimiter('validate'), async (req, res) => {
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

// 3a-0. Public Guest & Authenticated Lead Submission Endpoint (No login required; 5 req/IP/hour + Honeypot + App Check + Zod -> server-side Firestore)
app.post('/api/leads', requireJsonContentType, createLeadRateLimiter(), async (req, res) => {
  if (!validateAntiBotFields(req, res, 'lead')) {
    return;
  }
  if (!(await verifyAppCheckForForm(req, res, 'inquiry'))) {
    return;
  }
  if (!(await verifyRecaptchaEnterprise(req, res, ['contact_submit', 'consultation_submit']))) {
    return;
  }

  const lang = resolveRequestedLanguage(req);
  const parsed = leadInputSchema.safeParse(req.body || {});
  if (!parsed.success) {
    const mapped = mapFormZodError(parsed.error, lang);
    return res.status(400).json({
      code: 'VALIDATION_ERROR',
      ...mapped,
    });
  }

  // Optional authentication: attach verified Firebase UID if user is signed in
  const verifiedAuth = await verifyFirebaseBearerToken(req);

  const data = parsed.data;
  const leadId = `lead-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  const createdAt = new Date().toISOString();
  const normalizedEmail = data.email ? data.email.toLowerCase() : '';
  const payload = {
    id: leadId,
    uid: verifiedAuth?.user.uid || null,
    clientName: data.fullName,
    clientEmail: normalizedEmail,
    phone: data.phone,
    company: data.company,
    serviceType: data.serviceType,
    timeline: data.timeline,
    estimatedBudget: data.budget,
    brief: data.brief,
    source: data.source,
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

  const msgHi = 'धन्यवाद! आपकी पूछताछ मिल गई है, हम जल्द संपर्क करेंगे।';
  const msgEn = 'Thank you! We have received your inquiry and will contact you soon.';

  try {
    if (!adminDb) {
      throw Object.assign(new Error('PERMISSION_DENIED'), { code: 7 });
    }
    await adminDb.collection('quotations').doc(leadId).set(payload);

    void appendServerAuditEvent({
      action: 'LEAD_SUBMITTED',
      actorUid: verifiedAuth?.user.uid || 'guest',
      actorEmail: verifiedAuth?.user.email || normalizedEmail || `phone:${data.phone}`,
      resource: `quotations/${leadId}`,
      outcome: 'SUCCESS',
      ip: getClientIp(req),
      details: `Lead submitted (${data.serviceType}) by ${verifiedAuth ? 'authenticated user' : 'guest'}`,
    });

    return res.status(201).json({
      success: true,
      leadId,
      quoteId: leadId,
      storageMode: 'firestore_admin',
      message: lang === 'en' ? msgEn : msgHi,
      messageEn: msgEn,
      messageHi: msgHi,
    });
  } catch (err) {
    if (isFirestoreAdminCredentialError(err)) {
      if (verifiedAuth?.rawToken && normalizedEmail) {
        const restWrite = await createFirestoreDocumentRest(
          'quotations',
          leadId,
          payload,
          verifiedAuth.rawToken
        );
        if (restWrite.ok) {
          return res.status(201).json({
            success: true,
            leadId,
            quoteId: leadId,
            storageMode: 'firestore_rest',
            message: lang === 'en' ? msgEn : msgHi,
            messageEn: msgEn,
            messageHi: msgHi,
          });
        }
      }
      if (IS_PREVIEW_ENV) {
        if (previewLeadsStore.size >= MAX_PREVIEW_LEADS) {
          const oldestKey = previewLeadsStore.keys().next().value;
          if (oldestKey) previewLeadsStore.delete(oldestKey);
        }
        previewLeadsStore.set(leadId, payload);
        return res.status(201).json({
          success: true,
          leadId,
          quoteId: leadId,
          storageMode: 'preview_memory',
          message: lang === 'en' ? msgEn : msgHi,
          messageEn: msgEn,
          messageHi: msgHi,
        });
      }
    }
    console.error('[Lead Submit Error]', err);
    return sendFirestoreRouteError(res, err, 'Unable to save inquiry right now.', lang);
  }
});

// 3a. Authoritative Server-Side Quotation Submission Endpoint (Rate-limited + JSON CSRF guard + Honeypot + App Check + Zod -> firebase-admin)
app.post('/api/quotations', requireJsonContentType, createFormRateLimiter('quotation'), async (req, res) => {
  if (!validateAntiBotFields(req, res, 'quotation')) {
    return;
  }
  if (!(await verifyAppCheckForForm(req, res, 'inquiry'))) {
    return;
  }
  if (
    !(await verifyRecaptchaEnterprise(req, res, [
      'quotation_submit',
      'consultation_submit',
      'contact_submit',
    ]))
  ) {
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

  const verifiedAuth = await verifyFirebaseBearerToken(req);
  if (!verifiedAuth?.rawToken) {
    const errorHi = 'कृपया कोटेशन अनुरोध सबमिट करने के लिए पहले लॉगिन करें।';
    const errorEn = 'कृपया पहले लॉगिन करें — Please sign in first to submit a quotation request.';
    return res.status(401).json({
      code: 'AUTH_REQUIRED',
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
    uid: verifiedAuth.user.uid,
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
    if (!adminDb) {
      throw Object.assign(new Error('PERMISSION_DENIED'), { code: 7 });
    }
    await adminDb.collection('quotations').doc(quoteId).set(payload);

    void appendServerAuditEvent({
      action: 'QUOTATION_SUBMITTED',
      actorUid: verifiedAuth.user.uid,
      actorEmail: verifiedAuth.user.email || payload.clientEmail,
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
    if (isFirestoreAdminCredentialError(err) && verifiedAuth?.rawToken) {
      const restWrite = await createFirestoreDocumentRest(
        'quotations',
        quoteId,
        payload,
        verifiedAuth.rawToken
      );
      if (restWrite.ok) {
        const msgEn = 'Architectural scoping request securely submitted.';
        const msgHi = 'तकनीकी परामर्श अनुरोध सफलतापूर्वक दर्ज किया गया।';
        return res.status(201).json({
          success: true,
          quoteId,
          message: lang === 'hi' ? msgHi : msgEn,
          messageEn: msgEn,
          messageHi: msgHi,
        });
      }
    }
    console.error('[Quotation Submit Error]', err);
    return sendFirestoreRouteError(res, err, 'Unable to save architectural scoping request.', lang);
  }
});

// 3b. Newsletter Dispatch Subscription Endpoint (Firestore via firebase-admin + ID-token REST fallback + rate limit + JSON CSRF guard + anti-bot + App Check + Zod)
app.post('/api/newsletter/subscribe', requireJsonContentType, createFormRateLimiter('newsletter'), async (req, res) => {
  if (!validateAntiBotFields(req, res, 'newsletter')) {
    return;
  }
  if (!(await verifyAppCheckForForm(req, res, 'newsletter'))) {
    return;
  }
  if (!(await verifyRecaptchaEnterprise(req, res, ['newsletter_submit']))) {
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

  const verifiedAuth = await verifyFirebaseBearerToken(req);
  if (!verifiedAuth?.rawToken) {
    const errorHi = 'कृपया न्यूज़लेटर सदस्यता के लिए पहले लॉगिन करें।';
    const errorEn = 'कृपया पहले लॉगिन करें — Please sign in first to subscribe to the newsletter.';
    return res.status(401).json({
      code: 'AUTH_REQUIRED',
      error: lang === 'hi' ? errorHi : errorEn,
      errorEn,
      errorHi,
    });
  }

  const { email, language } = parsed.data;
  const normalized = email.toLowerCase();
  const subscriberHash = crypto.createHash('sha256').update(normalized).digest('hex').slice(0, 32);
  const subId = `sub-${subscriberHash}`;
  const entry = {
    id: subId,
    uid: verifiedAuth.user.uid,
    email: normalized,
    language: language === 'hi' ? 'hi' : 'en',
    subscribedAt: new Date().toISOString(),
  };

  try {
    if (!adminDb) {
      throw Object.assign(new Error('PERMISSION_DENIED'), { code: 7 });
    }
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
    if (isFirestoreAdminCredentialError(err) && verifiedAuth?.rawToken) {
      const restWrite = await createFirestoreDocumentRest(
        'newsletter_subscribers',
        subId,
        entry,
        verifiedAuth.rawToken
      );
      if (restWrite.ok) {
        const msgEn = 'Subscribed to Quarterly Architectural Dispatch.';
        const msgHi = 'त्रैमासिक आर्किटेक्चर डिस्पैच में सदस्यता सफल।';
        return res.status(201).json({
          success: true,
          alreadySubscribed: false,
          message: lang === 'hi' ? msgHi : msgEn,
          messageEn: msgEn,
          messageHi: msgHi,
        });
      }
      if (restWrite.status === 409 || restWrite.status === 412) {
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
    }
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

const EXTENSION_CANONICAL_MIME: Record<string, string> = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
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

app.post('/api/files/upload', requireAuth, requireJsonContentType, async (req: AuthenticatedRequest, res) => {
  if (!(await verifyAppCheckForForm(req, res, 'upload'))) {
    return;
  }
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

    const canonicalMime = EXTENSION_CANONICAL_MIME[ext] || 'application/octet-stream';

    await gcsStorageClient
      .bucket(EXPLICIT_GCS_BUCKET)
      .file(gcsObjectPath)
      .save(buffer, {
        contentType: canonicalMime,
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
      mimeType: canonicalMime,
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

  if (!adminDb && !req.authToken) {
    return res.status(503).json({
      code: 'FIRESTORE_ADMIN_NOT_CONFIGURED',
      error: 'Firestore Admin SDK is not configured to list stored files.',
    });
  }

  try {
    if (!adminDb) {
      throw Object.assign(new Error('PERMISSION_DENIED'), { code: 7 });
    }
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
    if (isFirestoreAdminCredentialError(err) && req.authToken) {
      const filters = user.isAdmin ? [] : [{ field: 'ownerUid', value: user.uid }];
      const restFiles = await runFirestoreQueryRest('file_records', filters, req.authToken);
      if (restFiles !== null) {
        let filtered = restFiles;
        if (projectId && typeof projectId === 'string' && SAFE_ID_REGEX.test(projectId)) {
          filtered = filtered.filter((f) => f.projectId === projectId);
        }
        filtered.sort(
          (a: any, b: any) => new Date(b.uploadedAt || 0).getTime() - new Date(a.uploadedAt || 0).getTime()
        );
        return res.json({
          count: filtered.length,
          files: filtered.map(toSafeFileDto),
        });
      }
    }
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
    res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
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
app.post('/api/audit-events', requireAuth, requireJsonContentType, async (req: AuthenticatedRequest, res) => {
  if (!(await verifyAppCheckForForm(req, res, 'audit'))) {
    return;
  }
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
app.get('/api/audit-events', requireAdmin, async (req: AuthenticatedRequest, res) => {
  if (!adminDb && !req.authToken) {
    return res.status(503).json({
      code: 'FIRESTORE_ADMIN_NOT_CONFIGURED',
      error: 'Firestore Admin SDK is not configured to read audit logs.',
    });
  }
  try {
    if (!adminDb) {
      throw Object.assign(new Error('PERMISSION_DENIED'), { code: 7 });
    }
    const snap = await adminDb
      .collection('audit_logs')
      .orderBy('timestamp', 'desc')
      .limit(200)
      .get();
    const events = snap.docs.map((d) => d.data());
    return res.json({ count: events.length, events });
  } catch (err) {
    if (isFirestoreAdminCredentialError(err) && req.authToken) {
      const restEvents = await runFirestoreQueryRest('audit_logs', [], req.authToken);
      if (restEvents !== null) {
        restEvents.sort(
          (a: any, b: any) =>
            new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
        );
        return res.json({
          count: Math.min(restEvents.length, 200),
          events: restEvents.slice(0, 200),
        });
      }
    }
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

  if (!adminDb && !req.authToken) {
    return res.status(503).json({
      code: 'FIRESTORE_ADMIN_NOT_CONFIGURED',
      error: 'Firestore Admin SDK is not configured to load invoices.',
    });
  }

  try {
    if (!adminDb) {
      throw Object.assign(new Error('PERMISSION_DENIED'), { code: 7 });
    }
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
    if (isFirestoreAdminCredentialError(err) && req.authToken) {
      let restInvoices: any[] | null = null;
      if (user.isAdmin) {
        const filters = clientId
          ? [{ field: 'clientId', value: clientId }]
          : clientEmail
          ? [{ field: 'clientEmail', value: clientEmail.toLowerCase() }]
          : [];
        restInvoices = await runFirestoreQueryRest('invoices', filters, req.authToken);
      } else {
        const byUid = await runFirestoreQueryRest(
          'invoices',
          [{ field: 'clientId', value: user.uid }],
          req.authToken
        );
        if (byUid !== null) {
          restInvoices = byUid.filter((inv) => canAccessInvoice(user, inv));
        }
      }
      if (restInvoices !== null) {
        restInvoices.sort(
          (a: any, b: any) => new Date(b.issuedAt || 0).getTime() - new Date(a.issuedAt || 0).getTime()
        );
        return res.json({
          count: restInvoices.length,
          invoices: restInvoices,
        });
      }
    }
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
  if (!adminDb && !req.authToken) {
    return res.status(503).json({
      code: 'FIRESTORE_ADMIN_NOT_CONFIGURED',
      error: 'Firestore Admin SDK is not configured to load invoice details.',
    });
  }

  try {
    if (adminDb) {
      const docSnap = await findInvoiceDocByIdOrNumber(invoiceId);
      if (!docSnap) {
        return res.status(404).json({ error: 'Invoice not found in billing ledger' });
      }
      const invoice = docSnap.data()!;

      if (!canAccessInvoice(user, invoice)) {
        return res.status(403).json({ error: 'Forbidden: You cannot access another tenant invoice.' });
      }

      return res.json(invoice);
    }
    throw Object.assign(new Error('PERMISSION_DENIED'), { code: 7 });
  } catch (err) {
    if (isFirestoreAdminCredentialError(err) && req.authToken) {
      let restInvoice: Record<string, any> | null = null;
      const directRest = await fetchFirestoreDocumentRest('invoices', invoiceId, req.authToken);
      if (directRest?.fields) {
        restInvoice = fromFirestoreRestFields(directRest.fields);
      } else {
        const byNum = await runFirestoreQueryRest(
          'invoices',
          [{ field: 'invoiceNumber', value: invoiceId }],
          req.authToken
        );
        if (byNum && byNum.length > 0) {
          restInvoice = byNum[0];
        } else if (byNum !== null) {
          return res.status(404).json({ error: 'Invoice not found in billing ledger' });
        }
      }
      if (restInvoice) {
        if (!canAccessInvoice(user, restInvoice)) {
          return res.status(403).json({ error: 'Forbidden: You cannot access another tenant invoice.' });
        }
        return res.json(restInvoice);
      }
    }
    console.error('[Invoice Detail Error]', err);
    return sendFirestoreRouteError(res, err, 'Unable to retrieve invoice.');
  }
});

// 10. Secure Payment Intent Creator (Authenticated + Optional Mode Guard + Firestore Persistence)
app.post('/api/payments/create-intent', requireAuth, requireJsonContentType, async (req: AuthenticatedRequest, res) => {
  if (!(await verifyAppCheckForForm(req, res, 'payment'))) {
    return;
  }
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
    const expiresAt = Date.now() + 30 * 60 * 1000;
    const orderId = `ORDER_${Date.now()}_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const checksum = crypto
      .createHmac('sha256', PAYMENT_SECRET)
      .update(`${orderId}:${invoice.id}:${authoritativeAmount}:${user.uid}:${expiresAt}`)
      .digest('hex');

    await adminDb.collection('payment_intents').doc(orderId).set({
      orderId,
      invoiceId: invoice.id,
      amount: authoritativeAmount,
      uid: user.uid,
      expiresAt,
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
      expiresAt,
      checksum,
      gatewayVerificationRequired: !user.isAdmin,
      paymentGateway: HAS_PAYMENT_WEBHOOK_SECRET
        ? 'NPCI UPI 2.0 / Server-Verified Webhook Settlement'
        : 'Escrow Ledger (Requires Gateway Webhook or Verified Admin Settlement)',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Payment Intent Error]', err);
    return sendFirestoreRouteError(res, err, 'Failed to create payment intent.');
  }
});

// 11. Cryptographic Payment Verification & Transactional Settlement in Firestore (Zero Fake Success)
app.post('/api/payments/verify', requireAuth, requireJsonContentType, async (req: AuthenticatedRequest, res) => {
  if (!(await verifyAppCheckForForm(req, res, 'payment'))) {
    return;
  }
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

  const normalizedTxnRef =
    typeof transactionRef === 'string' && transactionRef.trim().length > 4
      ? transactionRef.trim().substring(0, 64)
      : '';

  // Prevent fake client self-settlement: non-admin callers must supply a valid external gateway HMAC signature
  if (!user.isAdmin) {
    if (!HAS_PAYMENT_WEBHOOK_SECRET) {
      void appendServerAuditEvent({
        action: 'PAYMENT_FAKE_SETTLEMENT_BLOCKED',
        actorUid: user.uid,
        actorEmail: user.email || user.uid,
        resource: `invoices/${invoiceId}`,
        outcome: 'DENIED',
        ip: getClientIp(req),
        details: 'Blocked client settlement attempt without configured gateway webhook verifier',
      });
      return res.status(403).json({
        code: 'PAYMENT_GATEWAY_VERIFICATION_REQUIRED',
        error:
          'Direct client payment confirmation is disabled. Settlements require verified bank/gateway webhook signature or verified Administrator reconciliation.',
      });
    }
    const gatewaySig = (req.header('x-payment-gateway-signature') || '').trim();
    if (!gatewaySig || !normalizedTxnRef) {
      return res.status(403).json({
        code: 'PAYMENT_GATEWAY_SIGNATURE_REQUIRED',
        error: 'Valid gateway signature and external transaction reference are required to settle payment.',
      });
    }
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
        .update(`${orderId}:${invoice.id}:${invoice.totalAmount}:${intent.uid}:${intent.expiresAt}`)
        .digest('hex');

      const providedBuf = Buffer.from(checksum, 'utf8');
      const expectedBuf = Buffer.from(expectedChecksum, 'utf8');
      if (providedBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(providedBuf, expectedBuf)) {
        return {
          errorStatus: 400,
          error: 'Cryptographic Checksum Mismatch: Payment payload has been tampered with or expired.',
        };
      }

      if (!user.isAdmin) {
        const gatewaySig = (req.header('x-payment-gateway-signature') || '').trim();
        const expectedGatewaySig = crypto
          .createHmac('sha256', RAW_PAYMENT_WEBHOOK_SECRET)
          .update(`${orderId}:${invoice.id}:${invoice.totalAmount}:${normalizedTxnRef}`)
          .digest('hex');
        const sigBuf = Buffer.from(gatewaySig, 'utf8');
        const expSigBuf = Buffer.from(expectedGatewaySig, 'utf8');
        if (sigBuf.length !== expSigBuf.length || !crypto.timingSafeEqual(sigBuf, expSigBuf)) {
          return {
            errorStatus: 403,
            error: 'Invalid payment gateway settlement signature.',
          };
        }
      }

      const allowedMethods = new Set(['UPI', 'NEFT_RTGS', 'Corporate_Card', 'Escrow']);
      const safeMethod = allowedMethods.has(method) ? method : 'UPI';

      const paymentId = `PAY_${Date.now()}_${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      const verifiedTxnRef =
        normalizedTxnRef || `TXN_NPCI_${Date.now()}_${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      const txnLockHash = crypto
        .createHash('sha256')
        .update(verifiedTxnRef.toLowerCase())
        .digest('hex');
      const txnLockRef = adminDb!.collection('payment_intents').doc(`TXN_${txnLockHash}`);
      const existingTxnSnap = await tx.get(txnLockRef);
      if (existingTxnSnap.exists) {
        return {
          errorStatus: 409,
          error: 'Duplicate transaction reference detected; replay settlement rejected.',
        };
      }

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

      tx.set(txnLockRef, {
        paymentId,
        invoiceId: invoice.id,
        orderId,
        used: true,
        expiresAt: Date.now() + 365 * 86400 * 1000,
        createdAt: paidAt,
      });
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
// Automatically respects owner's saved GST settings: Bill of Supply (0% GST) when unregistered,
// or Tax Invoice (CGST 9%+SGST 9% intra-state / IGST 18% inter-state, SAC 998313) when registered.
app.post('/api/invoices/generate', requireAdmin, requireJsonContentType, async (req: AuthenticatedRequest, res) => {
  if (!adminDb && !req.authToken) {
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
    clientStateCode,
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

  const cleanedClientGstin =
    typeof clientGstin === 'string' ? clientGstin.trim().toUpperCase() : '';
  if (cleanedClientGstin && !GSTIN_REGEX.test(cleanedClientGstin)) {
    return res.status(400).json({
      code: 'INVALID_CLIENT_GSTIN',
      error: 'अमान्य ग्राहक GSTIN। कृपया 15 अक्षरों का सही GSTIN दर्ज करें या खाली छोड़ दें।',
    });
  }

  let gstSettings: StoredGstSettings;
  try {
    gstSettings = await readGstSettings();
  } catch (err) {
    console.error('[Invoice Generate GST Settings Read Error]', err);
    gstSettings = { ...DEFAULT_GST_SETTINGS };
  }

  const gstRegistered = isStoredGstRegistered(gstSettings);
  const supplierStateCode = gstSettings.stateCode || DEFAULT_GST_STATE_CODE;
  const supplierStateName =
    INDIAN_GST_STATE_MAP[supplierStateCode] || gstSettings.stateName || 'Chhattisgarh';
  const supplierLegalName = gstSettings.legalName || DEFAULT_UPI_PAYEE_NAME;

  let resolvedClientStateCode = supplierStateCode;
  if (typeof clientStateCode === 'string' && INDIAN_GST_STATE_MAP[clientStateCode.trim()]) {
    resolvedClientStateCode = clientStateCode.trim();
  }
  if (cleanedClientGstin) {
    const gstinPrefix = cleanedClientGstin.slice(0, 2);
    if (!INDIAN_GST_STATE_MAP[gstinPrefix]) {
      return res.status(400).json({
        code: 'INVALID_CLIENT_GSTIN_STATE',
        error: 'ग्राहक GSTIN के पहले 2 अंक मान्य भारतीय राज्य कोड नहीं हैं।',
      });
    }
    resolvedClientStateCode = gstinPrefix;
  }
  const resolvedClientStateName = INDIAN_GST_STATE_MAP[resolvedClientStateCode] || supplierStateName;

  let documentType: 'tax_invoice' | 'bill_of_supply' = 'bill_of_supply';
  let taxType: 'none' | 'cgst_sgst' | 'igst' = 'none';
  let gstRate = 0;
  let cgstRate = 0;
  let sgstRate = 0;
  let igstRate = 0;
  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;
  let gstAmount = 0;
  let totalAmount = numSubtotal;
  let hsnSac = '';
  let supplierGstin = '';

  if (gstRegistered) {
    documentType = 'tax_invoice';
    gstRate = 18;
    hsnSac = '998313';
    supplierGstin = gstSettings.gstin;
    const isIntraState = resolvedClientStateCode === supplierStateCode;
    if (isIntraState) {
      taxType = 'cgst_sgst';
      cgstRate = 9;
      sgstRate = 9;
      cgstAmount = Math.round((numSubtotal * 9) / 100);
      sgstAmount = Math.round((numSubtotal * 9) / 100);
      gstAmount = cgstAmount + sgstAmount;
    } else {
      taxType = 'igst';
      igstRate = 18;
      igstAmount = Math.round((numSubtotal * 18) / 100);
      gstAmount = igstAmount;
    }
    totalAmount = numSubtotal + gstAmount;
  }

  const randSuffix = String(1000 + (crypto.randomBytes(2).readUInt16BE(0) % 9000));
  const uniqueTag = crypto.randomBytes(2).toString('hex').toUpperCase();
  const docPrefix = documentType === 'tax_invoice' ? 'INV' : 'BOS';
  const invoiceNumber = `${docPrefix}-${new Date().getFullYear()}-${randSuffix}-${uniqueTag}`;
  const invoiceId = `inv-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  const normalizedClientEmail = clientEmail.trim().toLowerCase();

  let resolvedClientId =
    typeof clientId === 'string' && SAFE_ID_REGEX.test(clientId.trim()) ? clientId.trim() : '';
  if (!resolvedClientId && adminDb) {
    try {
      const userSnap = await adminDb
        .collection('users')
        .where('email', '==', normalizedClientEmail)
        .limit(1)
        .get();
      if (!userSnap.empty) {
        resolvedClientId = userSnap.docs[0].id;
      }
    } catch (lookupErr) {
      console.warn('[Invoice Client Lookup Notice]', lookupErr);
    }
  }
  if (!resolvedClientId && req.authToken) {
    try {
      const restUsers = await runFirestoreQueryRest(
        'users',
        [{ field: 'email', value: normalizedClientEmail }],
        req.authToken
      );
      if (restUsers && restUsers.length > 0 && typeof restUsers[0].uid === 'string') {
        resolvedClientId = restUsers[0].uid;
      }
    } catch {
      // Optional REST lookup fallback
    }
  }
  if (!resolvedClientId) {
    resolvedClientId = 'client-custom';
  }

  const verificationHash = crypto
    .createHash('sha256')
    .update(`${invoiceNumber}:${totalAmount}:${new Date().toISOString()}`)
    .digest('hex');

  const newInvoice = {
    id: invoiceId,
    invoiceNumber,
    documentType,
    gstRegistered,
    supplierGstin,
    supplierLegalName,
    supplierStateCode,
    supplierStateName,
    projectId: typeof projectId === 'string' && projectId.trim() ? projectId.trim() : 'proj-custom',
    projectName:
      typeof projectName === 'string' && projectName.trim()
        ? projectName.trim().substring(0, 160)
        : 'Enterprise Architecture Engagement',
    projectNameHi: 'उद्यम सॉफ्टवेयर इंजीनियरिंग अनुबंध',
    clientId: resolvedClientId,
    clientName:
      typeof clientName === 'string' && clientName.trim()
        ? clientName.trim().substring(0, 120)
        : 'Enterprise Partner',
    clientEmail: normalizedClientEmail,
    clientCompany:
      typeof clientCompany === 'string' && clientCompany.trim()
        ? clientCompany.trim().substring(0, 160)
        : 'Enterprise Client Ltd.',
    clientGstin: cleanedClientGstin,
    clientStateCode: resolvedClientStateCode,
    clientStateName: resolvedClientStateName,
    milestoneTitle:
      typeof milestoneTitle === 'string' && milestoneTitle.trim()
        ? milestoneTitle.trim().substring(0, 200)
        : 'Sprint Milestone Delivery',
    milestoneTitleHi: 'स्प्रिंट माइलस्टोन डिलीवरी',
    subtotal: numSubtotal,
    gstRate,
    gstAmount,
    taxType,
    cgstRate,
    sgstRate,
    igstRate,
    cgstAmount,
    sgstAmount,
    igstAmount,
    totalAmount,
    currency: 'INR',
    hsnSac,
    status: 'issued',
    issuedAt: new Date().toISOString(),
    dueAt: new Date(Date.now() + 15 * 86400 * 1000).toISOString(),
    issuedByAdmin: req.authUser!.email,
    verificationHash,
  };

  const successMessage =
    documentType === 'tax_invoice'
      ? 'Official GST Tax Invoice generated and committed to Cloud Firestore.'
      : 'Bill of Supply (0% GST — unregistered) generated and committed to Cloud Firestore.';

  try {
    if (adminDb) {
      await adminDb.collection('invoices').doc(invoiceId).set(newInvoice);
    } else if (req.authToken) {
      const restWrite = await createFirestoreDocumentRest('invoices', invoiceId, newInvoice, req.authToken);
      if (!restWrite.ok) {
        return sendFirestoreRouteError(
          res,
          { code: restWrite.status === 403 ? 7 : 13, message: 'PERMISSION_DENIED' },
          'Unable to persist generated invoice to Firestore.'
        );
      }
    } else {
      return res.status(503).json({
        code: 'FIRESTORE_ADMIN_NOT_CONFIGURED',
        error: 'Firestore Admin SDK is not configured to generate invoices.',
      });
    }

    void appendServerAuditEvent({
      action: 'INVOICE_GENERATED',
      actorUid: req.authUser!.uid,
      actorEmail: req.authUser!.email || req.authUser!.uid,
      resource: `invoices/${invoiceId}`,
      outcome: 'SUCCESS',
      ip: getClientIp(req),
      details: `Generated ${documentType} ${invoiceNumber} for ${newInvoice.clientEmail} (INR ${totalAmount}, GST ${gstRate}%)`,
    });

    return res.status(201).json({
      success: true,
      message: successMessage,
      invoice: newInvoice,
    });
  } catch (err) {
    if (isFirestoreAdminCredentialError(err) && req.authToken) {
      const restWrite = await createFirestoreDocumentRest('invoices', invoiceId, newInvoice, req.authToken);
      if (restWrite.ok) {
        return res.status(201).json({
          success: true,
          message: successMessage,
          invoice: newInvoice,
        });
      }
    }
    console.error('[Invoice Generate Error]', err);
    return sendFirestoreRouteError(res, err, 'Unable to persist generated invoice to Firestore.');
  }
});

/* =========================================================================
   13. REAL UPI PAYMENT SETTINGS & SERVER-TRACKED UPI PAYMENTS (NO HARDCODED UPI)
   ========================================================================= */
const DEFAULT_UPI_PAYEE_NAME = 'BHANU RAM BARIHA DIGITAL TECHNOLOGIES';
const UPI_ID_REGEX = /^[a-zA-Z0-9._-]{2,128}@[a-zA-Z][a-zA-Z0-9]{1,63}$/;
const UPI_PAYMENT_SETTINGS_DOC_ID = 'upi';

interface StoredUpiPaymentSettings {
  upiId: string;
  payeeName: string;
  enabled: boolean;
  updatedAt: string | null;
  updatedBy: string | null;
}

interface StoredUpiPaymentRecord {
  id: string;
  referenceNumber: string;
  name: string;
  mobile: string;
  purpose: string;
  amount: number;
  currency: 'INR';
  upiId: string;
  payeeName: string;
  utr: string;
  status: 'pending' | 'submitted' | 'paid' | 'rejected';
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
  verifiedAt: string | null;
  verifiedBy: string | null;
  clientIp?: string;
}

// Preview-only fallback stores used strictly when running in AI Studio Preview without Cloud Run IAM on Admin SDK
let previewUpiPaymentSettings: StoredUpiPaymentSettings = {
  upiId: '',
  payeeName: DEFAULT_UPI_PAYEE_NAME,
  enabled: false,
  updatedAt: null,
  updatedBy: null,
};
const previewUpiPaymentsStore = new Map<string, StoredUpiPaymentRecord>();
const previewUpiDailyCounters = new Map<string, number>();
const MAX_PREVIEW_UPI_PAYMENTS = 500;

function getIstDateStamp(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const y = parts.find((p) => p.type === 'year')?.value || '2026';
  const m = parts.find((p) => p.type === 'month')?.value || '01';
  const d = parts.find((p) => p.type === 'day')?.value || '01';
  return `${y}${m}${d}`;
}

function toSafePublicPaymentDto(rec: StoredUpiPaymentRecord) {
  return {
    id: rec.id,
    referenceNumber: rec.referenceNumber,
    name: rec.name,
    mobile: rec.mobile,
    purpose: rec.purpose,
    amount: rec.amount,
    currency: rec.currency,
    upiId: rec.upiId,
    payeeName: rec.payeeName,
    utr: rec.utr,
    status: rec.status,
    createdAt: rec.createdAt,
    updatedAt: rec.updatedAt,
    submittedAt: rec.submittedAt,
    verifiedAt: rec.verifiedAt,
    verifiedBy: rec.verifiedBy,
  };
}

async function readUpiPaymentSettings(): Promise<StoredUpiPaymentSettings> {
  if (adminDb) {
    try {
      const snap = await adminDb
        .collection('payment_settings')
        .doc(UPI_PAYMENT_SETTINGS_DOC_ID)
        .get();
      if (snap.exists) {
        const data = snap.data() || {};
        return {
          upiId: typeof data.upiId === 'string' ? data.upiId.trim() : '',
          payeeName:
            typeof data.payeeName === 'string' && data.payeeName.trim().length >= 2
              ? data.payeeName.trim()
              : DEFAULT_UPI_PAYEE_NAME,
          enabled: Boolean(data.enabled),
          updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : null,
          updatedBy: typeof data.updatedBy === 'string' ? data.updatedBy : null,
        };
      }
      return {
        upiId: '',
        payeeName: DEFAULT_UPI_PAYEE_NAME,
        enabled: false,
        updatedAt: null,
        updatedBy: null,
      };
    } catch (err) {
      if (IS_PREVIEW_ENV && isFirestoreAdminCredentialError(err)) {
        return { ...previewUpiPaymentSettings };
      }
      throw err;
    }
  }
  if (IS_PREVIEW_ENV) {
    return { ...previewUpiPaymentSettings };
  }
  throw Object.assign(new Error('PERMISSION_DENIED'), { code: 7 });
}

async function saveUpiPaymentSettings(
  next: StoredUpiPaymentSettings
): Promise<{ mode: 'firestore_admin' | 'preview_memory' }> {
  if (adminDb) {
    try {
      await adminDb
        .collection('payment_settings')
        .doc(UPI_PAYMENT_SETTINGS_DOC_ID)
        .set(next, { merge: false });
      return { mode: 'firestore_admin' };
    } catch (err) {
      if (IS_PREVIEW_ENV && isFirestoreAdminCredentialError(err)) {
        previewUpiPaymentSettings = { ...next };
        return { mode: 'preview_memory' };
      }
      throw err;
    }
  }
  if (IS_PREVIEW_ENV) {
    previewUpiPaymentSettings = { ...next };
    return { mode: 'preview_memory' };
  }
  throw Object.assign(new Error('PERMISSION_DENIED'), { code: 7 });
}

async function allocateUpiReferenceNumber(): Promise<{
  referenceNumber: string;
  dateStamp: string;
  mode: 'firestore_admin' | 'preview_memory';
}> {
  const dateStamp = getIstDateStamp();
  if (adminDb) {
    try {
      const counterRef = adminDb.collection('upi_payment_counters').doc(dateStamp);
      const nextSeq = await adminDb.runTransaction(async (tx) => {
        const snap = await tx.get(counterRef);
        const current = snap.exists && typeof snap.data()?.seq === 'number' ? snap.data()!.seq : 0;
        const incremented = current + 1;
        tx.set(
          counterRef,
          { dateKey: dateStamp, seq: incremented, updatedAt: new Date().toISOString() },
          { merge: true }
        );
        return incremented;
      });
      return {
        referenceNumber: `PWS-${dateStamp}-${String(nextSeq).padStart(4, '0')}`,
        dateStamp,
        mode: 'firestore_admin',
      };
    } catch (err) {
      if (!(IS_PREVIEW_ENV && isFirestoreAdminCredentialError(err))) {
        throw err;
      }
    }
  }

  if (IS_PREVIEW_ENV) {
    const current = previewUpiDailyCounters.get(dateStamp) || 0;
    const nextSeq = current + 1;
    previewUpiDailyCounters.set(dateStamp, nextSeq);
    return {
      referenceNumber: `PWS-${dateStamp}-${String(nextSeq).padStart(4, '0')}`,
      dateStamp,
      mode: 'preview_memory',
    };
  }

  throw Object.assign(new Error('PERMISSION_DENIED'), { code: 7 });
}

function createUpiPaymentRateLimiter(kind: 'create' | 'utr') {
  const map = kind === 'create' ? paymentCreateRateMap : paymentUtrRateMap;
  const limit = kind === 'create' ? MAX_PAYMENTS_PER_HOUR : MAX_PAYMENT_UTR_UPDATES_PER_HOUR;

  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const clientIp = getClientIp(req);
    const check = checkRateBucket(map, `upi_${kind}:${clientIp}`, limit, PAYMENT_RATE_LIMIT_WINDOW_MS);
    const retryAfterSeconds = Math.ceil(check.retryAfterMs / 1000);
    res.setHeader('X-RateLimit-Limit', String(limit));
    res.setHeader('X-RateLimit-Remaining', String(check.remaining));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(check.resetTime / 1000)));

    if (!check.allowed) {
      const waitMinutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));
      const errorHi = `एक घंटे में अधिकतम ${limit} भुगतान अनुरोधों की सीमा पूरी हो गई है। कृपया ${waitMinutes} मिनट बाद पुनः प्रयास करें।`;
      const errorEn = `Too many payment requests from your IP (max ${limit} per hour). Please wait ${waitMinutes} minute(s).`;
      const lang = resolveRequestedLanguage(req);
      res.setHeader('Retry-After', String(retryAfterSeconds));
      return res.status(429).json({
        code: 'RATE_LIMIT_EXCEEDED',
        error: lang === 'en' ? errorEn : errorHi,
        errorEn,
        errorHi,
        retryAfterSeconds,
      });
    }
    return next();
  };
}

const adminPaymentSettingsSchema = z
  .object({
    upiId: z
      .string()
      .trim()
      .max(193, 'UPI ID बहुत लंबा है।')
      .optional()
      .default(''),
    payeeName: z
      .string()
      .trim()
      .max(120, 'पाने वाले का नाम अधिकतम 120 अक्षरों का हो सकता है।')
      .optional()
      .default(DEFAULT_UPI_PAYEE_NAME),
    enabled: z.boolean(),
  })
  .superRefine((val, ctx) => {
    const cleanedUpi = val.upiId.trim();
    if (val.enabled && !cleanedUpi) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['upiId'],
        message: 'भुगतान चालू करने के लिए मान्य UPI ID डालना आवश्यक है।',
      });
      return;
    }
    if (cleanedUpi && !UPI_ID_REGEX.test(cleanedUpi)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['upiId'],
        message: 'मान्य UPI ID दर्ज करें (उदाहरण: name@okaxis या business@ybl)।',
      });
    }
    if (val.payeeName && val.payeeName.trim().length > 0 && val.payeeName.trim().length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['payeeName'],
        message: 'पाने वाले का नाम कम से कम 2 अक्षरों का होना चाहिए।',
      });
    }
  });

const createUpiPaymentSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'कृपया अपना पूरा नाम लिखें (कम से कम 2 अक्षर)।')
    .max(120, 'नाम अधिकतम 120 अक्षरों का हो सकता है।'),
  mobile: z
    .string()
    .trim()
    .regex(/^\d{10}$/, 'कृपया 10 अंकों का सही मोबाइल नंबर दर्ज करें।'),
  purpose: z
    .string()
    .trim()
    .min(2, 'कृपया बताएं कि यह भुगतान किस काम/सेवा/इनवॉइस के लिए है।')
    .max(200, 'विवरण अधिकतम 200 अक्षरों का हो सकता है।'),
  amount: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() !== '' ? Number(v) : v),
    z
      .number({ message: 'कृपया सही रकम (₹) दर्ज करें।' })
      .finite('कृपया सही रकम (₹) दर्ज करें।')
      .min(1, 'न्यूनतम भुगतान राशि ₹1 होनी चाहिए।')
      .max(10000000, 'अधिकतम एकल UPI भुगतान सीमा पार हो गई है।')
  ),
  language: z.enum(['hi', 'en']).optional(),
});

const submitUpiUtrSchema = z.object({
  utr: z
    .string()
    .trim()
    .regex(/^\d{12}$/, 'कृपया 12 अंकों का मान्य UTR / रेफ़रेंस नंबर दर्ज करें।'),
});

const adminUpiPaymentStatusSchema = z.object({
  status: z.enum(['paid', 'rejected']),
});

// 13a. Public Payment Settings (returns ONLY enabled, upiId, payeeName; hides upiId when disabled)
app.get('/api/payment-settings', async (_req, res) => {
  try {
    const settings = await readUpiPaymentSettings();
    const isActive = Boolean(settings.enabled && settings.upiId && UPI_ID_REGEX.test(settings.upiId));
    return res.json({
      enabled: isActive,
      upiId: isActive ? settings.upiId : '',
      payeeName: settings.payeeName || DEFAULT_UPI_PAYEE_NAME,
    });
  } catch (err) {
    if (isFirestoreAdminCredentialError(err)) {
      return res.json({
        enabled: false,
        upiId: '',
        payeeName: DEFAULT_UPI_PAYEE_NAME,
      });
    }
    console.error('[GET /api/payment-settings Error]', err);
    return res.status(500).json({ error: 'Unable to load payment settings.' });
  }
});

// 13b. Owner/Admin Read Payment Settings (full stored values including when disabled)
app.get('/api/admin/payment-settings', requireAdmin, async (_req: AuthenticatedRequest, res) => {
  try {
    const settings = await readUpiPaymentSettings();
    return res.json({
      ok: true,
      settings: {
        upiId: settings.upiId,
        payeeName: settings.payeeName || DEFAULT_UPI_PAYEE_NAME,
        enabled: Boolean(settings.enabled),
        updatedAt: settings.updatedAt,
        updatedBy: settings.updatedBy,
      },
    });
  } catch (err) {
    console.error('[GET /api/admin/payment-settings Error]', err);
    return sendFirestoreRouteError(res, err, 'Unable to load payment settings.');
  }
});

// 13c. Owner/Admin Save Payment Settings (PUT /api/admin/payment-settings)
app.put(
  '/api/admin/payment-settings',
  requireAdmin,
  requireJsonContentType,
  async (req: AuthenticatedRequest, res) => {
    const parsed = adminPaymentSettingsSchema.safeParse(req.body || {});
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        error: firstIssue?.message || 'अमान्य भुगतान सेटिंग्स।',
        field: firstIssue?.path?.[0] ? String(firstIssue.path[0]) : undefined,
      });
    }

    const caller = req.authUser!;
    const nowIso = new Date().toISOString();
    const nextSettings: StoredUpiPaymentSettings = {
      upiId: parsed.data.upiId.trim(),
      payeeName: (parsed.data.payeeName || '').trim() || DEFAULT_UPI_PAYEE_NAME,
      enabled: parsed.data.enabled,
      updatedAt: nowIso,
      updatedBy: caller.email || caller.uid,
    };

    try {
      const saved = await saveUpiPaymentSettings(nextSettings);
      void appendServerAuditEvent({
        action: 'PAYMENT_SETTINGS_UPDATED',
        actorUid: caller.uid,
        actorEmail: caller.email || caller.uid,
        resource: `payment_settings/${UPI_PAYMENT_SETTINGS_DOC_ID}`,
        outcome: 'SUCCESS',
        ip: getClientIp(req),
        details: `UPI payments ${nextSettings.enabled ? 'ENABLED' : 'DISABLED'} (${saved.mode})`,
      });

      return res.json({
        ok: true,
        mode: saved.mode,
        settings: nextSettings,
      });
    } catch (err) {
      console.error('[PUT /api/admin/payment-settings Error]', err);
      return sendFirestoreRouteError(res, err, 'Unable to save payment settings.');
    }
  }
);

/* =========================================================================
   13B. CONDITIONAL GST SETTINGS (FIRESTORE payment_settings/gst — OWNER ONLY WRITE)
   ========================================================================= */
const GST_SETTINGS_DOC_ID = 'gst';
const DEFAULT_GST_STATE_CODE = '22';
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

const INDIAN_GST_STATE_MAP: Record<string, string> = {
  '01': 'Jammu and Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '11': 'Sikkim',
  '12': 'Arunachal Pradesh',
  '13': 'Nagaland',
  '14': 'Manipur',
  '15': 'Mizoram',
  '16': 'Tripura',
  '17': 'Meghalaya',
  '18': 'Assam',
  '19': 'West Bengal',
  '20': 'Jharkhand',
  '21': 'Odisha',
  '22': 'Chhattisgarh',
  '23': 'Madhya Pradesh',
  '24': 'Gujarat',
  '26': 'Dadra and Nagar Haveli and Daman and Diu',
  '27': 'Maharashtra',
  '29': 'Karnataka',
  '30': 'Goa',
  '31': 'Lakshadweep',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '34': 'Puducherry',
  '35': 'Andaman and Nicobar Islands',
  '36': 'Telangana',
  '37': 'Andhra Pradesh',
  '38': 'Ladakh',
};

interface StoredGstSettings {
  gstin: string;
  legalName: string;
  stateCode: string;
  stateName: string;
  updatedAt: string | null;
  updatedBy: string | null;
}

const DEFAULT_GST_SETTINGS: StoredGstSettings = {
  gstin: '',
  legalName: DEFAULT_UPI_PAYEE_NAME,
  stateCode: DEFAULT_GST_STATE_CODE,
  stateName: INDIAN_GST_STATE_MAP[DEFAULT_GST_STATE_CODE],
  updatedAt: null,
  updatedBy: null,
};

let previewGstSettings: StoredGstSettings = { ...DEFAULT_GST_SETTINGS };

function isStoredGstRegistered(settings: StoredGstSettings): boolean {
  const gstin = String(settings.gstin || '').trim().toUpperCase();
  const stateCode = String(settings.stateCode || DEFAULT_GST_STATE_CODE).trim();
  return Boolean(
    gstin &&
      GSTIN_REGEX.test(gstin) &&
      Boolean(INDIAN_GST_STATE_MAP[stateCode]) &&
      gstin.slice(0, 2) === stateCode
  );
}

async function readGstSettings(): Promise<StoredGstSettings> {
  if (adminDb) {
    try {
      const snap = await adminDb
        .collection('payment_settings')
        .doc(GST_SETTINGS_DOC_ID)
        .get();
      if (snap.exists) {
        const data = snap.data() || {};
        const rawCode =
          typeof data.stateCode === 'string' && INDIAN_GST_STATE_MAP[data.stateCode.trim()]
            ? data.stateCode.trim()
            : DEFAULT_GST_STATE_CODE;
        const rawGstin =
          typeof data.gstin === 'string' ? data.gstin.trim().toUpperCase() : '';
        return {
          gstin: rawGstin,
          legalName:
            typeof data.legalName === 'string' && data.legalName.trim().length >= 2
              ? data.legalName.trim()
              : DEFAULT_UPI_PAYEE_NAME,
          stateCode: rawCode,
          stateName: INDIAN_GST_STATE_MAP[rawCode],
          updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : null,
          updatedBy: typeof data.updatedBy === 'string' ? data.updatedBy : null,
        };
      }
      return { ...DEFAULT_GST_SETTINGS };
    } catch (err) {
      if (IS_PREVIEW_ENV && isFirestoreAdminCredentialError(err)) {
        return { ...previewGstSettings };
      }
      throw err;
    }
  }
  if (IS_PREVIEW_ENV) {
    return { ...previewGstSettings };
  }
  throw Object.assign(new Error('PERMISSION_DENIED'), { code: 7 });
}

async function saveGstSettings(
  next: StoredGstSettings
): Promise<{ mode: 'firestore_admin' | 'preview_memory' }> {
  if (adminDb) {
    try {
      await adminDb
        .collection('payment_settings')
        .doc(GST_SETTINGS_DOC_ID)
        .set(next, { merge: false });
      return { mode: 'firestore_admin' };
    } catch (err) {
      if (IS_PREVIEW_ENV && isFirestoreAdminCredentialError(err)) {
        previewGstSettings = { ...next };
        return { mode: 'preview_memory' };
      }
      throw err;
    }
  }
  if (IS_PREVIEW_ENV) {
    previewGstSettings = { ...next };
    return { mode: 'preview_memory' };
  }
  throw Object.assign(new Error('PERMISSION_DENIED'), { code: 7 });
}

const adminGstSettingsSchema = z
  .object({
    gstin: z
      .string()
      .trim()
      .max(15, 'GSTIN ठीक 15 अक्षरों का होना चाहिए।')
      .optional()
      .default(''),
    legalName: z
      .string()
      .trim()
      .max(160, 'कानूनी नाम अधिकतम 160 अक्षरों का हो सकता है।')
      .optional()
      .default(DEFAULT_UPI_PAYEE_NAME),
    stateCode: z
      .string()
      .trim()
      .regex(/^[0-9]{2}$/, 'कृपया मान्य 2 अंकों का राज्य कोड चुनें।')
      .optional()
      .default(DEFAULT_GST_STATE_CODE),
  })
  .superRefine((val, ctx) => {
    const stateCode = val.stateCode || DEFAULT_GST_STATE_CODE;
    if (!INDIAN_GST_STATE_MAP[stateCode]) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['stateCode'],
        message: 'चुना गया भारतीय राज्य कोड मान्य नहीं है।',
      });
      return;
    }
    const cleanedGstin = val.gstin.trim().toUpperCase();
    if (cleanedGstin) {
      if (cleanedGstin.length !== 15 || !GSTIN_REGEX.test(cleanedGstin)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['gstin'],
          message: 'अमान्य GSTIN। कृपया 15 अक्षरों का मान्य GSTIN दर्ज करें (फ़ॉर्मेट: 22AAAAA0000A1Z5)।',
        });
        return;
      }
      if (cleanedGstin.slice(0, 2) !== stateCode) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['gstin'],
          message: `GSTIN के पहले 2 अंक (${cleanedGstin.slice(0, 2)}) चुने गए राज्य कोड (${stateCode} - ${INDIAN_GST_STATE_MAP[stateCode]}) से मेल नहीं खाते।`,
        });
      }
    }
    if (val.legalName && val.legalName.trim().length > 0 && val.legalName.trim().length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['legalName'],
        message: 'कानूनी नाम कम से कम 2 अक्षरों का होना चाहिए।',
      });
    }
  });

// Public GST registration status (used by MRP price bars & cards to display "+18% GST" vs "GST लागू नहीं")
app.get('/api/gst-settings', async (_req, res) => {
  try {
    const settings = await readGstSettings();
    const gstRegistered = isStoredGstRegistered(settings);
    return res.json({
      gstRegistered,
      gstin: gstRegistered ? settings.gstin : '',
      legalName: settings.legalName || DEFAULT_UPI_PAYEE_NAME,
      stateCode: settings.stateCode || DEFAULT_GST_STATE_CODE,
      stateName: settings.stateName || INDIAN_GST_STATE_MAP[DEFAULT_GST_STATE_CODE],
    });
  } catch (err) {
    if (isFirestoreAdminCredentialError(err)) {
      return res.json({
        gstRegistered: false,
        gstin: '',
        legalName: DEFAULT_UPI_PAYEE_NAME,
        stateCode: DEFAULT_GST_STATE_CODE,
        stateName: INDIAN_GST_STATE_MAP[DEFAULT_GST_STATE_CODE],
      });
    }
    console.error('[GET /api/gst-settings Error]', err);
    return res.status(500).json({ error: 'Unable to load GST settings.' });
  }
});

// Admin Read GST Settings (includes canEdit flag computed strictly on server via OWNER_EMAIL)
app.get('/api/admin/gst-settings', requireAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const settings = await readGstSettings();
    const gstRegistered = isStoredGstRegistered(settings);
    const caller = req.authUser!;
    const canEdit = isVerifiedOwnerEmail(caller.email, caller.emailVerified);
    return res.json({
      ok: true,
      settings: {
        ...settings,
        gstRegistered,
        canEdit,
      },
    });
  } catch (err) {
    console.error('[GET /api/admin/gst-settings Error]', err);
    return sendFirestoreRouteError(res, err, 'Unable to load GST settings.');
  }
});

// Owner-Only Save GST Settings (strictly requires verified OWNER_EMAIL on server)
app.put(
  '/api/admin/gst-settings',
  requireAdmin,
  requireJsonContentType,
  async (req: AuthenticatedRequest, res) => {
    const caller = req.authUser!;
    if (!isVerifiedOwnerEmail(caller.email, caller.emailVerified)) {
      return res.status(403).json({
        code: 'OWNER_ONLY_FORBIDDEN',
        error: 'केवल वेबसाइट मालिक ही GST सेटिंग बदल सकते हैं।',
      });
    }

    const parsed = adminGstSettingsSchema.safeParse(req.body || {});
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        error: firstIssue?.message || 'अमान्य GST सेटिंग्स।',
        field: firstIssue?.path?.[0] ? String(firstIssue.path[0]) : undefined,
      });
    }

    const stateCode = parsed.data.stateCode || DEFAULT_GST_STATE_CODE;
    const nowIso = new Date().toISOString();
    const nextSettings: StoredGstSettings = {
      gstin: parsed.data.gstin.trim().toUpperCase(),
      legalName: (parsed.data.legalName || '').trim() || DEFAULT_UPI_PAYEE_NAME,
      stateCode,
      stateName: INDIAN_GST_STATE_MAP[stateCode],
      updatedAt: nowIso,
      updatedBy: caller.email || caller.uid,
    };

    try {
      const saved = await saveGstSettings(nextSettings);
      const gstRegistered = isStoredGstRegistered(nextSettings);
      void appendServerAuditEvent({
        action: 'GST_SETTINGS_UPDATED',
        actorUid: caller.uid,
        actorEmail: caller.email || caller.uid,
        resource: `payment_settings/${GST_SETTINGS_DOC_ID}`,
        outcome: 'SUCCESS',
        ip: getClientIp(req),
        details: `GST ${gstRegistered ? 'REGISTERED' : 'UNREGISTERED'} (State ${stateCode}, ${saved.mode})`,
      });

      return res.json({
        ok: true,
        mode: saved.mode,
        settings: {
          ...nextSettings,
          gstRegistered,
          canEdit: true,
        },
      });
    } catch (err) {
      console.error('[PUT /api/admin/gst-settings Error]', err);
      return sendFirestoreRouteError(res, err, 'Unable to save GST settings.');
    }
  }
);

// 13d. Public Create UPI Payment Record (POST /api/payments — Zod + 10/hr IP limit + honeypot -> status "pending")
app.post(
  '/api/payments',
  requireJsonContentType,
  createUpiPaymentRateLimiter('create'),
  async (req, res) => {
    if (!validateAntiBotFields(req, res, 'payment')) {
      return;
    }
    if (!(await verifyRecaptchaEnterprise(req, res, ['payment_submit']))) {
      return;
    }

    const lang = resolveRequestedLanguage(req);
    const parsed = createUpiPaymentSchema.safeParse(req.body || {});
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      const msg = firstIssue?.message || 'कृपया सभी विवरण सही-सही भरें।';
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        error: msg,
        errorHi: msg,
        errorEn: msg,
        field: firstIssue?.path?.[0] ? String(firstIssue.path[0]) : undefined,
      });
    }

    let settings: StoredUpiPaymentSettings;
    try {
      settings = await readUpiPaymentSettings();
    } catch (err) {
      return sendFirestoreRouteError(res, err, 'Unable to check payment availability.', lang);
    }

    if (!settings.enabled || !settings.upiId || !UPI_ID_REGEX.test(settings.upiId)) {
      return res.status(503).json({
        code: 'PAYMENTS_DISABLED',
        error: 'ऑनलाइन भुगतान अभी उपलब्ध नहीं, कृपया संपर्क करें',
        errorHi: 'ऑनलाइन भुगतान अभी उपलब्ध नहीं, कृपया संपर्क करें',
        errorEn: 'Online payment is currently unavailable. Please contact us.',
      });
    }

    const roundedAmount = Math.round(parsed.data.amount * 100) / 100;
    const nowIso = new Date().toISOString();

    try {
      const refAlloc = await allocateUpiReferenceNumber();
      const paymentId = `pay-${refAlloc.dateStamp}-${crypto.randomBytes(6).toString('hex')}`;
      const record: StoredUpiPaymentRecord = {
        id: paymentId,
        referenceNumber: refAlloc.referenceNumber,
        name: parsed.data.name,
        mobile: parsed.data.mobile,
        purpose: parsed.data.purpose,
        amount: roundedAmount,
        currency: 'INR',
        upiId: settings.upiId,
        payeeName: settings.payeeName || DEFAULT_UPI_PAYEE_NAME,
        utr: '',
        status: 'pending',
        createdAt: nowIso,
        updatedAt: nowIso,
        submittedAt: null,
        verifiedAt: null,
        verifiedBy: null,
        clientIp: getClientIp(req),
      };

      let storageMode: 'firestore_admin' | 'preview_memory' = 'firestore_admin';
      if (adminDb && refAlloc.mode === 'firestore_admin') {
        try {
          await adminDb.collection('upi_payments').doc(paymentId).set(record);
        } catch (err) {
          if (IS_PREVIEW_ENV && isFirestoreAdminCredentialError(err)) {
            storageMode = 'preview_memory';
          } else {
            throw err;
          }
        }
      } else if (IS_PREVIEW_ENV) {
        storageMode = 'preview_memory';
      } else {
        throw Object.assign(new Error('PERMISSION_DENIED'), { code: 7 });
      }

      if (storageMode === 'preview_memory') {
        if (previewUpiPaymentsStore.size >= MAX_PREVIEW_UPI_PAYMENTS) {
          const oldestKey = previewUpiPaymentsStore.keys().next().value;
          if (oldestKey) previewUpiPaymentsStore.delete(oldestKey);
        }
        previewUpiPaymentsStore.set(paymentId, record);
      }

      void appendServerAuditEvent({
        action: 'UPI_PAYMENT_INITIATED',
        actorUid: 'guest',
        actorEmail: `mobile:${record.mobile}`,
        resource: `upi_payments/${paymentId}`,
        outcome: 'SUCCESS',
        ip: getClientIp(req),
        details: `Created UPI payment ${record.referenceNumber} for INR ${record.amount} (${storageMode})`,
      });

      return res.status(201).json({
        ok: true,
        storageMode,
        payment: toSafePublicPaymentDto(record),
      });
    } catch (err) {
      console.error('[POST /api/payments Error]', err);
      return sendFirestoreRouteError(res, err, 'भुगतान रिकॉर्ड बनाने में समस्या आई। कृपया पुनः प्रयास करें।', lang);
    }
  }
);

// 13e. Public Submit 12-Digit UTR Number (PATCH /api/payments/:id -> status "submitted")
app.patch(
  '/api/payments/:id',
  requireJsonContentType,
  createUpiPaymentRateLimiter('utr'),
  async (req, res) => {
    const paymentId = String(req.params.id || '').trim();
    if (!SAFE_ID_REGEX.test(paymentId)) {
      return res.status(400).json({ error: 'अमान्य भुगतान आईडी।' });
    }
    if (!(await verifyRecaptchaEnterprise(req, res, ['payment_utr_submit']))) {
      return;
    }

    const parsed = submitUpiUtrSchema.safeParse(req.body || {});
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message || 'कृपया 12 अंकों का मान्य UTR नंबर दर्ज करें।';
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        error: msg,
        errorHi: msg,
        errorEn: 'Please enter a valid 12-digit UTR / reference number.',
      });
    }

    const nowIso = new Date().toISOString();
    const utr = parsed.data.utr;
    const msgHi = 'धन्यवाद! हम आपका भुगतान जाँचकर पुष्टि करेंगे।';
    const msgEn = 'Thank you! We will verify your payment and confirm shortly.';

    try {
      if (adminDb) {
        try {
          const docRef = adminDb.collection('upi_payments').doc(paymentId);
          const snap = await docRef.get();
          if (snap.exists) {
            const existing = snap.data() as StoredUpiPaymentRecord;
            if (existing.status === 'paid' || existing.status === 'rejected') {
              return res.status(409).json({
                code: 'PAYMENT_ALREADY_FINALIZED',
                error: 'इस भुगतान की स्थिति पहले ही तय की जा चुकी है।',
                errorHi: 'इस भुगतान की स्थिति पहले ही तय की जा चुकी है।',
                errorEn: 'This payment status has already been finalized.',
              });
            }
            const updates = {
              utr,
              status: 'submitted' as const,
              submittedAt: nowIso,
              updatedAt: nowIso,
            };
            await docRef.set(updates, { merge: true });
            const updated: StoredUpiPaymentRecord = { ...existing, ...updates };

            void appendServerAuditEvent({
              action: 'UPI_PAYMENT_UTR_SUBMITTED',
              actorUid: 'guest',
              actorEmail: `mobile:${existing.mobile}`,
              resource: `upi_payments/${paymentId}`,
              outcome: 'SUCCESS',
              ip: getClientIp(req),
              details: `UTR submitted for ${existing.referenceNumber} (status=submitted)`,
            });

            return res.json({
              ok: true,
              payment: toSafePublicPaymentDto(updated),
              message: msgHi,
              messageHi: msgHi,
              messageEn: msgEn,
            });
          }
          if (!IS_PREVIEW_ENV) {
            return res.status(404).json({ error: 'भुगतान रिकॉर्ड नहीं मिला।' });
          }
        } catch (err) {
          if (!(IS_PREVIEW_ENV && isFirestoreAdminCredentialError(err))) {
            throw err;
          }
        }
      }

      if (IS_PREVIEW_ENV && previewUpiPaymentsStore.has(paymentId)) {
        const existing = previewUpiPaymentsStore.get(paymentId)!;
        if (existing.status === 'paid' || existing.status === 'rejected') {
          return res.status(409).json({
            code: 'PAYMENT_ALREADY_FINALIZED',
            error: 'इस भुगतान की स्थिति पहले ही तय की जा चुकी है।',
            errorHi: 'इस भुगतान की स्थिति पहले ही तय की जा चुकी है।',
            errorEn: 'This payment status has already been finalized.',
          });
        }
        const updated: StoredUpiPaymentRecord = {
          ...existing,
          utr,
          status: 'submitted',
          submittedAt: nowIso,
          updatedAt: nowIso,
        };
        previewUpiPaymentsStore.set(paymentId, updated);
        return res.json({
          ok: true,
          payment: toSafePublicPaymentDto(updated),
          message: msgHi,
          messageHi: msgHi,
          messageEn: msgEn,
        });
      }

      return res.status(404).json({ error: 'भुगतान रिकॉर्ड नहीं मिला।' });
    } catch (err) {
      console.error('[PATCH /api/payments/:id Error]', err);
      return sendFirestoreRouteError(res, err, 'UTR दर्ज करने में समस्या आई। कृपया पुनः प्रयास करें।');
    }
  }
);

// 13f. Owner/Admin List All UPI Payments (GET /api/admin/payments)
app.get('/api/admin/payments', requireAdmin, async (_req: AuthenticatedRequest, res) => {
  try {
    const merged = new Map<string, StoredUpiPaymentRecord>();

    if (adminDb) {
      try {
        const snap = await adminDb.collection('upi_payments').get();
        for (const docSnap of snap.docs) {
          const data = docSnap.data() as StoredUpiPaymentRecord;
          merged.set(docSnap.id, { ...data, id: data.id || docSnap.id });
        }
      } catch (err) {
        if (!(IS_PREVIEW_ENV && isFirestoreAdminCredentialError(err))) {
          throw err;
        }
      }
    } else if (!IS_PREVIEW_ENV) {
      throw Object.assign(new Error('PERMISSION_DENIED'), { code: 7 });
    }

    if (IS_PREVIEW_ENV) {
      for (const [id, rec] of previewUpiPaymentsStore.entries()) {
        if (!merged.has(id)) {
          merged.set(id, rec);
        }
      }
    }

    const payments = Array.from(merged.values())
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .map(toSafePublicPaymentDto);

    return res.json({
      ok: true,
      count: payments.length,
      payments,
    });
  } catch (err) {
    console.error('[GET /api/admin/payments Error]', err);
    return sendFirestoreRouteError(res, err, 'Unable to load UPI payments list.');
  }
});

// 13g. Owner/Admin Confirm or Reject UPI Payment (PATCH /api/admin/payments/:id/status)
app.patch(
  '/api/admin/payments/:id/status',
  requireAdmin,
  requireJsonContentType,
  async (req: AuthenticatedRequest, res) => {
    const paymentId = String(req.params.id || '').trim();
    if (!SAFE_ID_REGEX.test(paymentId)) {
      return res.status(400).json({ error: 'Invalid payment ID.' });
    }

    const parsed = adminUpiPaymentStatusSchema.safeParse(req.body || {});
    if (!parsed.success) {
      return res.status(400).json({ error: 'Status must be "paid" or "rejected".' });
    }

    const caller = req.authUser!;
    const nowIso = new Date().toISOString();
    const nextStatus = parsed.data.status;

    try {
      if (adminDb) {
        try {
          const docRef = adminDb.collection('upi_payments').doc(paymentId);
          const snap = await docRef.get();
          if (snap.exists) {
            const existing = snap.data() as StoredUpiPaymentRecord;
            const updates = {
              status: nextStatus,
              verifiedAt: nowIso,
              verifiedBy: caller.email || caller.uid,
              updatedAt: nowIso,
            };
            await docRef.set(updates, { merge: true });
            const updated: StoredUpiPaymentRecord = { ...existing, ...updates };

            void appendServerAuditEvent({
              action: 'UPI_PAYMENT_STATUS_UPDATED',
              actorUid: caller.uid,
              actorEmail: caller.email || caller.uid,
              resource: `upi_payments/${paymentId}`,
              outcome: 'SUCCESS',
              ip: getClientIp(req),
              details: `Marked ${existing.referenceNumber} as ${nextStatus}`,
            });

            return res.json({ ok: true, payment: toSafePublicPaymentDto(updated) });
          }
          if (!IS_PREVIEW_ENV) {
            return res.status(404).json({ error: 'Payment record not found.' });
          }
        } catch (err) {
          if (!(IS_PREVIEW_ENV && isFirestoreAdminCredentialError(err))) {
            throw err;
          }
        }
      }

      if (IS_PREVIEW_ENV && previewUpiPaymentsStore.has(paymentId)) {
        const existing = previewUpiPaymentsStore.get(paymentId)!;
        const updated: StoredUpiPaymentRecord = {
          ...existing,
          status: nextStatus,
          verifiedAt: nowIso,
          verifiedBy: caller.email || caller.uid,
          updatedAt: nowIso,
        };
        previewUpiPaymentsStore.set(paymentId, updated);
        return res.json({ ok: true, payment: toSafePublicPaymentDto(updated) });
      }

      return res.status(404).json({ error: 'Payment record not found.' });
    } catch (err) {
      console.error('[PATCH /api/admin/payments/:id/status Error]', err);
      return sendFirestoreRouteError(res, err, 'Unable to update payment status.');
    }
  }
);

/* =========================================================================
   AI WEBSITE CONSULTANT CHAT (SERVER-SIDE GEMINI + AUTHENTICATED RATE LIMIT)
   ========================================================================= */

const AI_CONSULTANT_MODEL = 'gemini-3.1-flash-lite';
const AI_CONSULTANT_FALLBACK_MODEL = 'gemini-4-hydrogen';
const AI_CONSULTANT_TIMEOUT_MS = 20_000;
const AI_CONSULTANT_TOTAL_BUDGET_MS = 28_000;
const AI_CONSULTANT_RATE_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const AI_CONSULTANT_MAX_REQUESTS_PER_WINDOW = 30;
const AI_CONSULTANT_QUOTA_COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes
const aiConsultantRateMap = new Map<string, number[]>();
const aiConsultantModelCooldownUntil = new Map<string, number>();

function isAiConsultantModelOnCooldown(model: string): boolean {
  const until = aiConsultantModelCooldownUntil.get(model);
  if (!until) return false;
  if (Date.now() >= until) {
    aiConsultantModelCooldownUntil.delete(model);
    return false;
  }
  return true;
}

function markAiConsultantModelCooldown(model: string): void {
  aiConsultantModelCooldownUntil.set(model, Date.now() + AI_CONSULTANT_QUOTA_COOLDOWN_MS);
}

let cachedAiConsultantClient: GoogleGenAI | null = null;
function getAiConsultantGeminiClient(): GoogleGenAI | null {
  if (!HAS_GEMINI_API_KEY) return null;
  if (!cachedAiConsultantClient) {
    cachedAiConsultantClient = new GoogleGenAI({
      apiKey: RAW_GEMINI_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return cachedAiConsultantClient;
}

function reserveAiConsultantRateLimitSlot(uid: string): {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
  slotTimestamp?: number;
} {
  const now = Date.now();
  const cutoff = now - AI_CONSULTANT_RATE_WINDOW_MS;

  if (aiConsultantRateMap.size > 500) {
    for (const [key, timestamps] of aiConsultantRateMap.entries()) {
      const recent = timestamps.filter((ts) => ts > cutoff);
      if (recent.length === 0) {
        aiConsultantRateMap.delete(key);
      } else if (recent.length !== timestamps.length) {
        aiConsultantRateMap.set(key, recent);
      }
    }
  }

  const recent = (aiConsultantRateMap.get(uid) || []).filter((ts) => ts > cutoff);
  if (recent.length >= AI_CONSULTANT_MAX_REQUESTS_PER_WINDOW) {
    aiConsultantRateMap.set(uid, recent);
    const oldestActive = recent[0] ?? now;
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((oldestActive + AI_CONSULTANT_RATE_WINDOW_MS - now) / 1000)
    );
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  recent.push(now);
  aiConsultantRateMap.set(uid, recent);
  return {
    allowed: true,
    remaining: Math.max(0, AI_CONSULTANT_MAX_REQUESTS_PER_WINDOW - recent.length),
    retryAfterSeconds: 0,
    slotTimestamp: now,
  };
}

function releaseAiConsultantRateLimitSlot(uid: string, slotTimestamp?: number): void {
  if (!slotTimestamp) return;
  const existing = aiConsultantRateMap.get(uid);
  if (!existing || existing.length === 0) return;
  const idx = existing.lastIndexOf(slotTimestamp);
  if (idx !== -1) {
    existing.splice(idx, 1);
  }
  if (existing.length === 0) {
    aiConsultantRateMap.delete(uid);
  }
}

function redactContactPiiForAi(raw: string): string {
  if (!raw) return '';
  let text = raw.replace(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    '[email-redacted]'
  );
  // Redact phone-like sequences (10+ digits or country-coded numbers) while preserving budgets/years
  text = text.replace(
    /(?:\+\d{1,3}[\s.-]?)?(?:\(?\d{2,5}\)?[\s.-]?){2,4}\d{2,5}/g,
    (match) => {
      const digitsOnly = match.replace(/\D/g, '');
      if (digitsOnly.length >= 10 && digitsOnly.length <= 15) {
        return '[phone-redacted]';
      }
      return match;
    }
  );
  return text;
}

function clampAiString(val: unknown, maxLen: number): string {
  if (typeof val !== 'string') return '';
  return val.trim().slice(0, maxLen);
}

function clampAiStringArray(val: unknown, maxItems: number, maxItemLen: number): string[] {
  if (!Array.isArray(val)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of val) {
    if (typeof item !== 'string') continue;
    const clean = item.trim().slice(0, maxItemLen);
    if (!clean || seen.has(clean.toLowerCase())) continue;
    seen.add(clean.toLowerCase());
    out.push(clean);
    if (out.length >= maxItems) break;
  }
  return out;
}

const aiConsultantCollectedSchema = z
  .object({
    businessName: z.string().max(160).optional(),
    businessDescription: z.string().max(600).optional(),
    businessStage: z.string().max(60).optional(),
    websiteType: z.string().max(100).optional(),
    recommendedConcepts: z.array(z.string().max(300)).max(5).optional(),
    targetAudience: z.string().max(300).optional(),
    targetLocation: z.string().max(160).optional(),
    primaryVisitorAction: z.string().max(240).optional(),
    pages: z.array(z.string().max(120)).max(25).optional(),
    designColors: z.string().max(200).optional(),
    designThemeMode: z.string().max(100).optional(),
    designStyle: z.string().max(200).optional(),
    designFonts: z.string().max(200).optional(),
    designButtons: z.string().max(200).optional(),
    designNavigation: z.string().max(200).optional(),
    designHero: z.string().max(200).optional(),
    designMedia: z.string().max(200).optional(),
    designAnimations: z.string().max(200).optional(),
    features: z.array(z.string().max(160)).max(30).optional(),
    featureNotes: z.string().max(1500).optional(),
    budget: z.string().max(120).optional(),
    timeline: z.string().max(120).optional(),
    domainHostingStatus: z.string().max(160).optional(),
    existingAssets: z.string().max(300).optional(),
    summary: z.string().max(3000).optional(),
  })
  .strict();

type AiConsultantCollected = z.infer<typeof aiConsultantCollectedSchema>;

const aiConsultantChatRequestSchema = z.object({
  language: z.enum(['hi', 'en']).default('hi'),
  currentStep: z.number().int().min(1).max(8).default(1),
  message: z.string().trim().min(1, 'Message is required').max(1500, 'Message is too long'),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        text: z.string().trim().min(1).max(2500),
      })
    )
    .max(40)
    .default([]),
  collected: aiConsultantCollectedSchema.optional(),
});

function sanitizeCollectedForAiPrompt(collected?: AiConsultantCollected): AiConsultantCollected {
  if (!collected) return {};
  const clean: AiConsultantCollected = {};
  const strFieldLimits: Array<[keyof AiConsultantCollected, number]> = [
    ['businessName', 160],
    ['businessDescription', 600],
    ['businessStage', 60],
    ['websiteType', 100],
    ['targetAudience', 300],
    ['targetLocation', 160],
    ['primaryVisitorAction', 240],
    ['designColors', 200],
    ['designThemeMode', 100],
    ['designStyle', 200],
    ['designFonts', 200],
    ['designButtons', 200],
    ['designNavigation', 200],
    ['designHero', 200],
    ['designMedia', 200],
    ['designAnimations', 200],
    ['featureNotes', 1500],
    ['budget', 120],
    ['timeline', 120],
    ['domainHostingStatus', 160],
    ['existingAssets', 300],
    ['summary', 3000],
  ];
  for (const [key, maxLen] of strFieldLimits) {
    const val = collected[key];
    if (typeof val === 'string' && val.trim()) {
      (clean as Record<string, unknown>)[key] = redactContactPiiForAi(val.trim()).slice(0, maxLen);
    }
  }
  if (Array.isArray(collected.recommendedConcepts) && collected.recommendedConcepts.length > 0) {
    clean.recommendedConcepts = clampAiStringArray(
      collected.recommendedConcepts.map((c) => redactContactPiiForAi(c)),
      5,
      300
    );
  }
  if (Array.isArray(collected.pages) && collected.pages.length > 0) {
    clean.pages = clampAiStringArray(
      collected.pages.map((p) => redactContactPiiForAi(p)),
      25,
      120
    );
  }
  if (Array.isArray(collected.features) && collected.features.length > 0) {
    clean.features = clampAiStringArray(
      collected.features.map((f) => redactContactPiiForAi(f)),
      30,
      160
    );
  }
  return clean;
}

function mergeAiCollectedFields(
  previous: AiConsultantCollected,
  incoming: Record<string, unknown> | undefined
): AiConsultantCollected {
  const merged: AiConsultantCollected = { ...previous };
  if (!incoming || typeof incoming !== 'object') return merged;

  const strFieldLimits: Array<[keyof AiConsultantCollected, number]> = [
    ['businessName', 160],
    ['businessDescription', 600],
    ['businessStage', 60],
    ['websiteType', 100],
    ['targetAudience', 300],
    ['targetLocation', 160],
    ['primaryVisitorAction', 240],
    ['designColors', 200],
    ['designThemeMode', 100],
    ['designStyle', 200],
    ['designFonts', 200],
    ['designButtons', 200],
    ['designNavigation', 200],
    ['designHero', 200],
    ['designMedia', 200],
    ['designAnimations', 200],
    ['featureNotes', 1500],
    ['budget', 120],
    ['timeline', 120],
    ['domainHostingStatus', 160],
    ['existingAssets', 300],
    ['summary', 3000],
  ];

  for (const [key, maxLen] of strFieldLimits) {
    const nextVal = clampAiString(incoming[key], maxLen);
    if (nextVal) {
      (merged as Record<string, unknown>)[key] = redactContactPiiForAi(nextVal).slice(0, maxLen);
    }
  }

  const nextConcepts = clampAiStringArray(incoming.recommendedConcepts, 5, 300).map((s) =>
    redactContactPiiForAi(s).slice(0, 300)
  );
  if (nextConcepts.length > 0) {
    merged.recommendedConcepts = nextConcepts;
  }

  const nextPages = clampAiStringArray(incoming.pages, 25, 120).map((s) =>
    redactContactPiiForAi(s).slice(0, 120)
  );
  if (nextPages.length > 0) {
    merged.pages = nextPages;
  }

  const nextFeatures = clampAiStringArray(incoming.features, 30, 160).map((s) =>
    redactContactPiiForAi(s).slice(0, 160)
  );
  if (nextFeatures.length > 0) {
    merged.features = nextFeatures;
  }

  return merged;
}

const AI_CONSULTANT_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    reply: {
      type: Type.STRING,
      description:
        'Helpful, concise assistant response in the requested language, asking at most ONE focused question at a time.',
    },
    quickReplies: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '2 to 6 short, tappable quick-reply chip suggestions in the requested language.',
    },
    step: {
      type: Type.INTEGER,
      description: 'Current active consultation step from 1 to 8.',
    },
    isSummaryReady: {
      type: Type.BOOLEAN,
      description: 'True only when Step 8 summary has been presented to the user.',
    },
    collected: {
      type: Type.OBJECT,
      description: 'Cumulative structured website planning fields collected so far.',
      properties: {
        businessName: { type: Type.STRING },
        businessDescription: { type: Type.STRING },
        businessStage: { type: Type.STRING },
        websiteType: { type: Type.STRING },
        recommendedConcepts: { type: Type.ARRAY, items: { type: Type.STRING } },
        targetAudience: { type: Type.STRING },
        targetLocation: { type: Type.STRING },
        primaryVisitorAction: { type: Type.STRING },
        pages: { type: Type.ARRAY, items: { type: Type.STRING } },
        designColors: { type: Type.STRING },
        designThemeMode: { type: Type.STRING },
        designStyle: { type: Type.STRING },
        designFonts: { type: Type.STRING },
        designButtons: { type: Type.STRING },
        designNavigation: { type: Type.STRING },
        designHero: { type: Type.STRING },
        designMedia: { type: Type.STRING },
        designAnimations: { type: Type.STRING },
        features: { type: Type.ARRAY, items: { type: Type.STRING } },
        featureNotes: { type: Type.STRING },
        budget: { type: Type.STRING },
        timeline: { type: Type.STRING },
        domainHostingStatus: { type: Type.STRING },
        existingAssets: { type: Type.STRING },
        summary: { type: Type.STRING },
      },
    },
  },
  required: ['reply', 'quickReplies', 'step', 'isSummaryReady', 'collected'],
};

function buildAiConsultantSystemInstruction(language: 'hi' | 'en'): string {
  const langRule =
    language === 'hi'
      ? 'Respond ONLY in polite, clear, natural Hindi (Devanagari script), using common English tech terms where natural (e.g., E-commerce, SaaS, Hero section, Domain/Hosting). All quickReplies must be in Hindi (or concise Hindi + familiar label).'
      : 'Respond ONLY in clear, warm, professional English. All quickReplies must be in English.';

  return [
    'You are the Power Web Studio AI Consultant. Your job is to guide a client step by step to plan a website—even if they have zero prior website idea.',
    langRule,
    '',
    'CORE CONVERSATION RULES:',
    '1. Ask ONLY ONE focused question per turn. Keep replies concise, friendly, and easy to read on a mobile screen (short paragraphs or brief bullets).',
    '2. Adapt intelligently to earlier answers. Never re-ask information the user already provided.',
    '3. Guide the user smoothly across these 8 steps (stay on a step if needed until the core info for that step is clear, then advance to the next step):',
    '   - Step 1: Business/project name, what it does, and whether it is a new or existing business.',
    '   - Step 2: Website type. Offer these options: Business, E-commerce, School/Education, Portfolio, Agency, Booking/Appointment, Blog/News, AI tool, SaaS, Other/Not sure. If the user picks "Other/Not sure" or is unsure, recommend exactly 3 tailored website concepts with clear reasons for their business (also save them in collected.recommendedConcepts) and ask which concept fits best.',
    '   - Step 3: Target audience, city/state/country, and main action visitors should take (e.g. call/WhatsApp inquiry, book appointment, buy online, sign up).',
    '   - Step 4: Relevant pages only—suggest a tailored shortlist based on their business and website type instead of generic bloat.',
    '   - Step 5: Design preferences covering colors, light/dark mode, overall style, fonts, button style, navigation style, hero section, images/video preference, and animations. If the user is unsure about any design aspect, proactively suggest clean, practical defaults and ask if they want to keep or tweak them.',
    '   - Step 6: Features. Clearly explain which requested features are standard website features vs. which require extra backend development, API keys, paid third-party services, or third-party accounts (for example: payment gateways, SMS/WhatsApp APIs, AI APIs, custom user accounts/dashboards, external booking/CRM integrations). Record those transparency notes in collected.featureNotes.',
    '   - Step 7: Budget (explicitly allow "Not decided" / "अभी तय नहीं"), target timeline, domain & hosting status, and existing logo/content availability.',
    '   - Step 8: Present a clean, structured summary of everything collected so far (and save it in collected.summary), set isSummaryReady to true, and clearly invite the user to edit any section if they want changes. If the user asks to edit any detail during Step 8, update the relevant collected field(s), refresh the summary, and ask if anything else needs changing.',
    '',
    'STRICT GUARDRAILS (NEVER VIOLATE):',
    '- NEVER promise prices, exact quotes, discounts, or guaranteed delivery dates.',
    '- NEVER claim that any feature already works, is live, or is already built for the user.',
    '- Stay strictly on website planning. If the user asks an off-topic question, politely note that you only help with website planning and gently bring them back to the current step.',
    '- NEVER ask for personal email addresses, phone numbers, or payment details.',
    '- Always return valid JSON matching the exact schema, preserving previously collected fields unless the user explicitly edits them.',
  ].join('\n');
}

async function generateConsultantReplyWithTimeout(
  client: GoogleGenAI,
  model: string,
  systemInstruction: string,
  promptPayload: string,
  timeoutMs = AI_CONSULTANT_TIMEOUT_MS
): Promise<string> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      const err = new Error('AI_CONSULTANT_TIMEOUT');
      err.name = 'TimeoutError';
      reject(err);
    }, timeoutMs);
  });

  try {
    const response = await Promise.race([
      client.models.generateContent({
        model,
        contents: promptPayload,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: AI_CONSULTANT_RESPONSE_SCHEMA,
        },
      }),
      timeoutPromise,
    ]);
    return (response.text ?? '').trim();
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

interface ClassifiedGeminiConsultantError {
  category:
    | 'timeout'
    | 'quota_exhausted'
    | 'rate_limit_burst'
    | 'model_not_found'
    | 'auth_error'
    | 'bad_request'
    | 'transient_upstream'
    | 'unknown_upstream';
  httpStatus: number;
  rpcStatus: string;
  retryable: boolean;
  preferFallbackModel: boolean;
  safeReason: string;
}

function classifyGeminiConsultantError(err: unknown): ClassifiedGeminiConsultantError {
  const errObj = (err && typeof err === 'object' ? err : {}) as {
    status?: number | string;
    code?: number | string;
    name?: string;
    message?: string;
  };
  const rawMessage = String(errObj.message || '');
  let httpStatus = Number(errObj.status || errObj.code || 0);
  if (!Number.isFinite(httpStatus)) httpStatus = 0;

  let rpcStatus = '';
  let parsedMessage = rawMessage;

  // @google/genai ApiError often embeds the upstream JSON payload inside err.message
  const jsonStart = rawMessage.indexOf('{');
  if (jsonStart !== -1) {
    try {
      const parsed = JSON.parse(rawMessage.slice(jsonStart));
      const nested = parsed?.error && typeof parsed.error === 'object' ? parsed.error : parsed;
      if (typeof nested?.code === 'number' && !httpStatus) {
        httpStatus = nested.code;
      }
      if (typeof nested?.status === 'string') {
        rpcStatus = nested.status;
      }
      if (typeof nested?.message === 'string' && nested.message.trim()) {
        parsedMessage = nested.message.trim();
      }
    } catch {
      // Keep rawMessage when not valid JSON
    }
  }

  const combined = `${rpcStatus} ${parsedMessage} ${rawMessage}`;
  const safeReason = parsedMessage
    .replace(/AIza[0-9A-Za-z_-]{10,}/g, '[redacted-key]')
    .replace(/\s+/g, ' ')
    .slice(0, 180);

  const isTimeout = errObj.name === 'TimeoutError' || rawMessage === 'AI_CONSULTANT_TIMEOUT';
  if (isTimeout) {
    return {
      category: 'timeout',
      httpStatus: 504,
      rpcStatus: 'DEADLINE_EXCEEDED',
      retryable: false,
      preferFallbackModel: false,
      safeReason: 'Request exceeded server timeout',
    };
  }

  if (
    httpStatus === 404 ||
    rpcStatus === 'NOT_FOUND' ||
    /model[s]?\b.*not found|is not supported for generateContent/i.test(combined)
  ) {
    return {
      category: 'model_not_found',
      httpStatus: httpStatus || 404,
      rpcStatus: rpcStatus || 'NOT_FOUND',
      retryable: true,
      preferFallbackModel: true,
      safeReason,
    };
  }

  if (
    httpStatus === 401 ||
    httpStatus === 403 ||
    rpcStatus === 'PERMISSION_DENIED' ||
    rpcStatus === 'UNAUTHENTICATED' ||
    /API_KEY_INVALID|API key not valid|PERMISSION_DENIED/i.test(combined)
  ) {
    return {
      category: 'auth_error',
      httpStatus: httpStatus || 403,
      rpcStatus: rpcStatus || 'PERMISSION_DENIED',
      retryable: false,
      preferFallbackModel: false,
      safeReason,
    };
  }

  if (httpStatus === 429 || rpcStatus === 'RESOURCE_EXHAUSTED' || /RESOURCE_EXHAUSTED|quota/i.test(combined)) {
    const looksHardQuota =
      /exceeded your current quota|limit:\s*0|PerDay|per day|FreeTier|free_tier|billing|GenerateRequestsPerDay/i.test(
        combined
      );
    return {
      category: looksHardQuota ? 'quota_exhausted' : 'rate_limit_burst',
      httpStatus: 429,
      rpcStatus: rpcStatus || 'RESOURCE_EXHAUSTED',
      retryable: true,
      preferFallbackModel: true,
      safeReason,
    };
  }

  if (httpStatus === 400 || rpcStatus === 'INVALID_ARGUMENT') {
    return {
      category: 'bad_request',
      httpStatus: 400,
      rpcStatus: rpcStatus || 'INVALID_ARGUMENT',
      retryable: false,
      preferFallbackModel: false,
      safeReason,
    };
  }

  if (
    httpStatus === 500 ||
    httpStatus === 502 ||
    httpStatus === 503 ||
    httpStatus === 504 ||
    rpcStatus === 'UNAVAILABLE' ||
    rpcStatus === 'INTERNAL' ||
    rpcStatus === 'DEADLINE_EXCEEDED' ||
    /fetch failed|ECONNRESET|ETIMEDOUT|socket hang up|overloaded|unavailable|high demand/i.test(combined)
  ) {
    return {
      category: 'transient_upstream',
      httpStatus: httpStatus || 503,
      rpcStatus: rpcStatus || 'UNAVAILABLE',
      retryable: true,
      preferFallbackModel: false,
      safeReason,
    };
  }

  return {
    category: 'unknown_upstream',
    httpStatus: httpStatus || 502,
    rpcStatus: rpcStatus || 'UNKNOWN',
    retryable: false,
    preferFallbackModel: false,
    safeReason,
  };
}

function parseConsultantJsonOutput(rawJsonText: string): Record<string, unknown> | null {
  try {
    const cleaned = rawJsonText
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    const parsed = JSON.parse(cleaned);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null;
    }
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

app.post(
  '/api/ai/consultant/chat',
  requireAuth,
  async (req: AuthenticatedRequest, res) => {
    const caller = req.authUser;
    if (!caller?.uid) {
      return res.status(401).json({
        code: 'UNAUTHENTICATED',
        error: 'Authentication required. Please sign in to continue.',
        errorHi: 'आगे बढ़ने के लिए कृपया साइन इन करें।',
      });
    }

    // Validate input and key availability BEFORE consuming the user's 30/10min quota
    const parsedBody = aiConsultantChatRequestSchema.safeParse(req.body);
    if (!parsedBody.success) {
      return res.status(400).json({
        code: 'INVALID_INPUT',
        error: 'Please enter a valid message (up to 1500 characters).',
        errorHi: 'कृपया एक मान्य संदेश लिखें (अधिकतम 1500 अक्षर)।',
      });
    }

    const client = getAiConsultantGeminiClient();
    if (!client) {
      return res.status(503).json({
        code: 'AI_NOT_CONFIGURED',
        error: 'AI Consultant is not configured on the server yet. Please contact the site administrator.',
        errorHi: 'सर्वर पर AI Consultant अभी कॉन्फ़िगर नहीं है। कृपया साइट एडमिन से संपर्क करें।',
      });
    }

    const rateCheck = reserveAiConsultantRateLimitSlot(caller.uid);
    if (!rateCheck.allowed) {
      const waitMins = Math.max(1, Math.ceil(rateCheck.retryAfterSeconds / 60));
      res.setHeader('Retry-After', String(rateCheck.retryAfterSeconds));
      return res.status(429).json({
        code: 'RATE_LIMITED',
        retryAfterSeconds: rateCheck.retryAfterSeconds,
        error: `You have reached the limit of 30 messages per 10 minutes. Please try again in about ${waitMins} minute(s).`,
        errorHi: `आपने पिछले 10 मिनट में 30 संदेशों की सीमा पूरी कर ली है। कृपया लगभग ${waitMins} मिनट बाद दोबारा प्रयास करें।`,
      });
    }

    const { language, currentStep, message, history, collected } = parsedBody.data;
    const sanitizedMessage = redactContactPiiForAi(message).slice(0, 1500);
    const sanitizedHistory = history.slice(-24).map((entry) => ({
      role: entry.role,
      text: redactContactPiiForAi(entry.text).slice(0, 2000),
    }));
    const sanitizedCollected = sanitizeCollectedForAiPrompt(collected);

    const promptPayload = JSON.stringify({
      language,
      currentStep,
      collectedSoFar: sanitizedCollected,
      recentHistory: sanitizedHistory,
      latestUserMessage: sanitizedMessage,
    });

    const systemInstruction = buildAiConsultantSystemInstruction(language);

    const startedAtMs = Date.now();
    // Build bounded attempt plan: primary model (with 1 same-model retry on 503/parse spike) + optional fallback model if not on quota cooldown
    const primaryOnCooldown = isAiConsultantModelOnCooldown(AI_CONSULTANT_MODEL);
    const fallbackOnCooldown = isAiConsultantModelOnCooldown(AI_CONSULTANT_FALLBACK_MODEL);
    let activeModel =
      primaryOnCooldown && !fallbackOnCooldown ? AI_CONSULTANT_FALLBACK_MODEL : AI_CONSULTANT_MODEL;
    let triedFallback = activeModel === AI_CONSULTANT_FALLBACK_MODEL;
    let sameModelRetries = 0;

    let parsedAi: Record<string, unknown> | null = null;
    let reply = '';
    let lastClassifiedError: ClassifiedGeminiConsultantError | null = null;
    let lastParseOrEmptyFailure: 'parse' | 'empty' | null = null;

    for (let attempt = 0; attempt < 3; attempt++) {
      const elapsedMs = Date.now() - startedAtMs;
      const remainingBudgetMs = AI_CONSULTANT_TOTAL_BUDGET_MS - elapsedMs;
      if (attempt > 0 && remainingBudgetMs < 7_000) {
        break;
      }

      const attemptTimeoutMs = Math.min(AI_CONSULTANT_TIMEOUT_MS, Math.max(7_000, remainingBudgetMs));
      try {
        const rawJsonText = await generateConsultantReplyWithTimeout(
          client,
          activeModel,
          systemInstruction,
          promptPayload,
          attemptTimeoutMs
        );

        const candidate = parseConsultantJsonOutput(rawJsonText);
        if (!candidate) {
          lastParseOrEmptyFailure = 'parse';
          lastClassifiedError = null;
          console.error(
            `[POST /api/ai/consultant/chat] Malformed JSON output from Gemini (model=${activeModel}, attempt=${attempt + 1})`
          );
          if (sameModelRetries < 1) {
            sameModelRetries += 1;
            await new Promise((resolve) => setTimeout(resolve, 600));
            continue;
          }
          break;
        }

        const candidateReply = redactContactPiiForAi(clampAiString(candidate.reply, 2400));
        if (!candidateReply) {
          lastParseOrEmptyFailure = 'empty';
          lastClassifiedError = null;
          console.error(
            `[POST /api/ai/consultant/chat] Empty reply field from Gemini (model=${activeModel}, attempt=${attempt + 1})`
          );
          if (sameModelRetries < 1) {
            sameModelRetries += 1;
            await new Promise((resolve) => setTimeout(resolve, 600));
            continue;
          }
          break;
        }

        parsedAi = candidate;
        reply = candidateReply;
        lastClassifiedError = null;
        lastParseOrEmptyFailure = null;
        break;
      } catch (err: unknown) {
        const classified = classifyGeminiConsultantError(err);
        lastClassifiedError = classified;
        lastParseOrEmptyFailure = null;

        console.error(
          `[POST /api/ai/consultant/chat] Gemini call failed (model=${activeModel}, attempt=${attempt + 1}, category=${classified.category}, httpStatus=${classified.httpStatus}, rpcStatus=${classified.rpcStatus}, reason="${classified.safeReason}")`
        );

        if (classified.category === 'quota_exhausted') {
          markAiConsultantModelCooldown(activeModel);
        }

        if (!classified.retryable) {
          break;
        }

        // On quota/model error, switch directly to fallback model if available and not on cooldown
        if (classified.preferFallbackModel) {
          if (!triedFallback && !isAiConsultantModelOnCooldown(AI_CONSULTANT_FALLBACK_MODEL)) {
            triedFallback = true;
            activeModel = AI_CONSULTANT_FALLBACK_MODEL;
            sameModelRetries = 0;
            await new Promise((resolve) => setTimeout(resolve, 800));
            continue;
          }
          break;
        }

        // On transient 503/network spike: first retry the same model once, then fall back once if fallback is healthy
        if (sameModelRetries < 1) {
          sameModelRetries += 1;
          await new Promise((resolve) => setTimeout(resolve, 800));
          continue;
        }
        if (!triedFallback && !isAiConsultantModelOnCooldown(AI_CONSULTANT_FALLBACK_MODEL)) {
          triedFallback = true;
          activeModel = AI_CONSULTANT_FALLBACK_MODEL;
          sameModelRetries = 0;
          await new Promise((resolve) => setTimeout(resolve, 700));
          continue;
        }
        break;
      }
    }

    if (!parsedAi || !reply) {
      // Do not penalize the user's 30/10min rate limit when Gemini fails upstream
      releaseAiConsultantRateLimitSlot(caller.uid, rateCheck.slotTimestamp);

      if (lastClassifiedError) {
        switch (lastClassifiedError.category) {
          case 'timeout':
            return res.status(504).json({
              code: 'AI_TIMEOUT',
              error: 'The AI Consultant took too long to respond. Please try sending your message again.',
              errorHi: 'AI Consultant से जवाब आने में अधिक समय लग गया। कृपया दोबारा प्रयास करें।',
            });
          case 'quota_exhausted':
            return res.status(429).json({
              code: 'AI_QUOTA_EXCEEDED',
              error: 'The AI service API quota is currently exhausted. Please try again later or contact the site administrator.',
              errorHi: 'AI सेवा का वर्तमान API कोटा समाप्त हो गया है। कृपया बाद में प्रयास करें या साइट एडमिन को सूचित करें।',
            });
          case 'rate_limit_burst':
            return res.status(429).json({
              code: 'AI_RATE_LIMITED',
              error: 'The AI service is temporarily receiving too many requests. Please wait a minute and try again.',
              errorHi: 'AI सेवा पर अभी अस्थायी रूप से बहुत अनुरोध आ रहे हैं। कृपया एक मिनट बाद दोबारा प्रयास करें।',
            });
          case 'model_not_found':
            return res.status(502).json({
              code: 'AI_MODEL_ERROR',
              error: 'The configured AI model is currently unavailable. Please contact the site administrator.',
              errorHi: 'चयनित AI मॉडल अभी उपलब्ध नहीं है। कृपया साइट एडमिन को सूचित करें।',
            });
          case 'auth_error':
            return res.status(502).json({
              code: 'AI_AUTH_ERROR',
              error: 'There is a server authentication issue with the AI service. Please contact the site administrator.',
              errorHi: 'AI सेवा की सर्वर प्रमाणीकरण सेटिंग में समस्या है। कृपया साइट एडमिन को सूचित करें।',
            });
          case 'bad_request':
            return res.status(400).json({
              code: 'AI_BAD_REQUEST',
              error: 'The AI could not process this message format. Please shorten or rephrase your message and try again.',
              errorHi: 'AI इस संदेश को संसाधित नहीं कर सका। कृपया संदेश को थोड़ा छोटा या स्पष्ट लिखकर दोबारा भेजें।',
            });
          case 'transient_upstream':
          default:
            return res.status(503).json({
              code: 'AI_UNAVAILABLE',
              error: 'The AI service is temporarily unavailable due to a server or network issue. Please try again in a few seconds.',
              errorHi: 'नेटवर्क या सर्वर समस्या के कारण AI सेवा अस्थायी रूप से उपलब्ध नहीं है। कृपया कुछ सेकंड बाद दोबारा प्रयास करें।',
            });
        }
      }

      if (lastParseOrEmptyFailure === 'empty') {
        return res.status(502).json({
          code: 'AI_EMPTY_RESPONSE',
          error: 'AI Consultant returned an empty response. Please try again.',
          errorHi: 'AI Consultant से खाली उत्तर मिला। कृपया दोबारा प्रयास करें।',
        });
      }

      return res.status(502).json({
        code: 'AI_INVALID_RESPONSE',
        error: 'Received an unexpected response format from AI. Please try sending your message again.',
        errorHi: 'AI से अपेक्षित प्रारूप में उत्तर नहीं मिला। कृपया दोबारा प्रयास करें।',
      });
    }

    const rawStep = typeof parsedAi.step === 'number' ? Math.round(parsedAi.step) : currentStep;
    const nextStep = Math.min(8, Math.max(1, Number.isFinite(rawStep) ? rawStep : currentStep));
    const quickReplies = clampAiStringArray(parsedAi.quickReplies, 6, 100);
    const mergedCollected = mergeAiCollectedFields(
      sanitizedCollected,
      parsedAi.collected as Record<string, unknown> | undefined
    );
    const isSummaryReady = Boolean(parsedAi.isSummaryReady === true && nextStep === 8);

    return res.status(200).json({
      reply,
      quickReplies,
      step: nextStep,
      isSummaryReady,
      collected: mergedCollected,
      remainingQuota: rateCheck.remaining,
    });
  }
);

/* =========================================================================
   SEARCH ENGINE OPTIMIZATION & DISCOVERABILITY (SEO)
   ========================================================================= */

function resolveSeoBaseUrl(): string {
  return resolveCanonicalSiteOrigin(process.env.SITE_URL);
}

app.get('/robots.txt', (_req, res) => {
  const baseUrl = resolveSeoBaseUrl();
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  return res.send(buildRobotsTxt(baseUrl));
});

app.get('/sitemap.xml', async (_req, res) => {
  const baseUrl = resolveSeoBaseUrl();
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');

  const lastMod = new Date().toISOString().split('T')[0];
  let dynamicAppIds = [...DEFAULT_SITEMAP_APP_IDS];
  let dynamicBlogPostIds = BLOG_POSTS.map((post) => post.id);

  if (adminDb) {
    try {
      const appsSnap = await adminDb.collection('apps').select('id').limit(100).get();
      const firestoreIds = appsSnap.docs
        .map((d) => String(d.data()?.id || d.id || '').trim())
        .filter((id) => SAFE_ID_REGEX.test(id));
      dynamicAppIds = Array.from(new Set([...DEFAULT_SITEMAP_APP_IDS, ...firestoreIds]));
    } catch {
      // Fall back safely to default catalog app IDs when Admin Firestore read is unavailable
    }

    try {
      const blogSnap = await adminDb.collection('blog_posts').select('id').limit(200).get();
      const firestorePostIds = blogSnap.docs
        .map((d) => String(d.data()?.id || d.id || '').trim())
        .filter((id) => SAFE_ID_REGEX.test(id));
      dynamicBlogPostIds = Array.from(new Set([...dynamicBlogPostIds, ...firestorePostIds]));
    } catch {
      // Fall back safely to bundled blog posts when Admin Firestore read is unavailable
    }
  }

  const xml = buildSitemapXml({
    siteUrl: baseUrl,
    lastMod,
    appIds: dynamicAppIds,
    blogPostIds: dynamicBlogPostIds,
    demoSlugs: DEMO_SITES.map((demo) => demo.slug),
  });

  return res.send(xml);
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
const STATIC_ROUTE_HTML_META: Record<
  string,
  { title: string; description: string; robots?: string }
> = {
  '/': {
    title: 'POWER WEB STUDIO AI — Enterprise Software & AI Suite',
    description:
      'Bhanu Ram Bariha Digital Technologies (POWER WEB STUDIO AI): Mission-critical distributed backends, native Android apps, and sovereign AI systems.',
  },
  '/about': {
    title: 'About Bhanu Ram Bariha Digital | POWER WEB STUDIO AI',
    description:
      'Registered Indian digital engineering firm founded by Bhanu Ram Bariha delivering enterprise software, native Android ecosystems, and sovereign AI.',
  },
  '/services': {
    title: 'Enterprise Engineering Services | POWER WEB STUDIO AI',
    description:
      'Explore distributed backend systems, native Kotlin Android development, cloud architecture, and custom enterprise AI engineering services.',
  },
  '/ai-solutions': {
    title: 'Sovereign Enterprise AI & RAG | POWER WEB STUDIO AI',
    description:
      'Privacy-first private LLMs, verified RAG pipelines, workflow automation, and sovereign AI orchestration by Bhanu Ram Bariha Digital Technologies.',
  },
  '/ai-website-consultant': {
    title: 'AI Website Consultant | Power Web Studio AI',
    description:
      'Step-by-step AI consultant to plan your business website structure, design preferences, and required features.',
  },
  '/android-portfolio': {
    title: 'Native Android Apps Portfolio | POWER WEB STUDIO AI',
    description:
      'Production-hardened Kotlin, Jetpack Compose, and offline-first SQLiteCipher Android applications engineered for FinTech, GovTech, EdTech, and Commerce.',
  },
  '/process': {
    title: '6-Phase Engineering Methodology | POWER WEB STUDIO AI',
    description:
      'Zero-surprise delivery from architectural blueprint and SOW scoping to automated testing, security hardening, and production SLA governance.',
  },
  '/contact': {
    title: 'Consultation & Contact | POWER WEB STUDIO AI',
    description:
      'Schedule an engineering consultation or submit an RFP/RFQ with Bhanu Ram Bariha Digital Technologies in Chhattisgarh, India.',
  },
  '/pay': {
    title: 'UPI Payment | POWER WEB STUDIO AI',
    description:
      'Pay for services, quotations, or invoices directly via UPI to Bhanu Ram Bariha Digital Technologies.',
    robots: 'noindex, nofollow',
  },
  '/blog': {
    title: 'Engineering Blog & Research | POWER WEB STUDIO AI',
    description:
      'Technical insights written by Principal Architects on distributed systems, offline Kotlin Android engineering, and sovereign enterprise AI.',
  },
  '/privacy': {
    title: 'Privacy Policy & Data Governance | POWER WEB STUDIO AI',
    description:
      'Data processing, DPDP Act compliance, telemetry, and client confidentiality commitments at Bhanu Ram Bariha Digital Technologies.',
  },
  '/terms': {
    title: 'Terms & Conditions of Service | POWER WEB STUDIO AI',
    description:
      'Master service terms, intellectual property rights, and SOW engagement guidelines for POWER WEB STUDIO AI clients.',
  },
  '/refund-policy': {
    title: 'Refund & Cancellation Policy | POWER WEB STUDIO AI',
    description:
      'Advance payment, cancellation, and refund policy for POWER WEB STUDIO AI software and digital services.',
  },
  '/client-dashboard': {
    title: 'Client Engineering Portal | POWER WEB STUDIO AI',
    description:
      'Authenticated client workspace for project milestones, invoices, and support tickets.',
    robots: 'noindex, nofollow',
  },
  '/admin': {
    title: 'Executive Admin Console | POWER WEB STUDIO AI',
    description:
      'Authorized administrator portal for operations, RBAC governance, and lead management.',
    robots: 'noindex, nofollow',
  },
  '/admin-dashboard': {
    title: 'Executive Admin Console | POWER WEB STUDIO AI',
    description:
      'Authorized administrator portal for operations, RBAC governance, and lead management.',
    robots: 'noindex, nofollow',
  },
};

const APP_DETAIL_SEO_META: Record<string, { title: string; description: string }> = {
  'bariha-pay': {
    title: 'BarihaPay — FinTech Payments & Ledger | POWER WEB STUDIO AI',
    description:
      'Offline-resilient UPI, Soundbox BLE telemetry, and multi-ledger settlement Android platform built with Kotlin and SQLiteCipher.',
  },
  'vidyasetu-lms': {
    title: 'VidyaSetu LMS — Sovereign EdTech Android App | POWER WEB STUDIO AI',
    description:
      'Low-bandwidth offline LMS with regional Hindi/English video sync, encrypted assessments, and district-scale analytics.',
  },
  'taskmatrix-pro': {
    title: 'TaskMatrix Pro — Field Workforce Orchestration | POWER WEB STUDIO AI',
    description:
      'Enterprise Kotlin dispatch & geotagged offline checklist suite for infrastructure and distributed engineering teams.',
  },
  'networkpulse-diagnostic': {
    title: 'NetworkPulse — Telecom Edge Diagnostics | POWER WEB STUDIO AI',
    description:
      'Native Android RF/latency telemetry, packet diagnostics, and offline field audit reporting.',
  },
  'bharatbazaar-omnichannel': {
    title: 'BharatBazaar — Omnichannel Commerce Engine | POWER WEB STUDIO AI',
    description:
      'Multi-vendor retail inventory, GST invoicing, and offline POS synchronization built for high-volume merchants.',
  },
  'trackcore-logistics': {
    title: 'TrackCore — Fleet & Supply Chain Telemetry | POWER WEB STUDIO AI',
    description:
      'Real-time logistics dispatching, proof-of-delivery capture, and dead-zone offline buffering for fleet operations.',
  },
  'docusense-vision-ai': {
    title: 'DocuSense Vision AI — On-Device OCR & KYC | POWER WEB STUDIO AI',
    description:
      'Privacy-preserving on-device document extraction, Devanagari/English OCR, and enterprise verification.',
  },
  'retailflow-pos': {
    title: 'RetailFlow POS — High-Throughput Billing App | POWER WEB STUDIO AI',
    description:
      'Offline-first Android POS terminal software with thermal printing, GST compliance, and cloud ledger sync.',
  },
};

function escapeHtmlText(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeHtmlAttr(str: string): string {
  return escapeHtmlText(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function resolveRouteHtmlInfo(
  rawPath: string,
  origin: string,
  rawQuery?: express.Request['query']
): {
  statusCode: 200 | 404;
  title: string;
  description: string;
  canonicalUrl: string;
  ogUrl: string;
  robots: string;
  origin: string;
} {
  const cleanPath = rawPath.length > 1 ? rawPath.replace(/\/+$/, '') : '/';
  const safeBase = resolveCanonicalSiteOrigin(origin || CANONICAL_SITE_URL);

  if (cleanPath === '/blog' && rawQuery && typeof rawQuery.post === 'string' && rawQuery.post.trim()) {
    const postId = rawQuery.post.trim();
    const matchedPost = BLOG_POSTS.find((p) => p.id === postId);
    if (matchedPost) {
      const pageUrl = `${safeBase}/blog?post=${encodeURIComponent(matchedPost.id)}`;
      return {
        statusCode: 200,
        title: `${matchedPost.title} | Blog | POWER WEB STUDIO AI`,
        description: matchedPost.excerpt,
        canonicalUrl: pageUrl,
        ogUrl: pageUrl,
        robots: 'index, follow',
        origin: safeBase,
      };
    }
  }

  const staticMeta = STATIC_ROUTE_HTML_META[cleanPath];
  if (staticMeta) {
    const canonicalPath = cleanPath === '/admin' ? '/admin-dashboard' : cleanPath;
    const pageUrl = `${safeBase}${canonicalPath}`;
    return {
      statusCode: 200,
      title: staticMeta.title,
      description: staticMeta.description,
      canonicalUrl: pageUrl,
      ogUrl: pageUrl,
      robots: staticMeta.robots || 'index, follow',
      origin: safeBase,
    };
  }

  if (/^\/apps\/[^/]+$/.test(cleanPath)) {
    const rawAppId = cleanPath.slice('/apps/'.length);
    let decodedAppId: string;
    try {
      decodedAppId = decodeURIComponent(rawAppId);
    } catch {
      decodedAppId = rawAppId;
    }
    const appMeta = APP_DETAIL_SEO_META[decodedAppId];
    const formattedName = decodedAppId
      .split(/[-_]+/)
      .filter(Boolean)
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(' ');
    const pageUrl = `${safeBase}/apps/${encodeURIComponent(decodedAppId)}`;
    return {
      statusCode: 200,
      title: appMeta?.title || `${formattedName} — Android App Architecture | POWER WEB STUDIO AI`,
      description:
        appMeta?.description ||
        'Detailed mobile architecture, offline SQLite synchronization, performance benchmarks, and changelog for our enterprise Android platforms.',
      canonicalUrl: pageUrl,
      ogUrl: pageUrl,
      robots: 'index, follow',
      origin: safeBase,
    };
  }

  if (/^\/demo\/[a-z0-9-]+$/i.test(cleanPath)) {
    const slug = cleanPath.slice('/demo/'.length).toLowerCase();
    const demoSite = getDemoSiteBySlug(slug);
    const pageUrl = `${safeBase}/demo/${encodeURIComponent(slug)}`;
    return {
      statusCode: 200,
      title: demoSite
        ? `${demoSite.nameEn} — Demo Website | POWER WEB STUDIO AI`
        : 'Interactive Demo Website | POWER WEB STUDIO AI',
      description: demoSite
        ? demoSite.descriptionEn
        : 'Interactive client preview demo website built by Power Web Studio AI.',
      canonicalUrl: pageUrl,
      ogUrl: pageUrl,
      robots: 'index, follow',
      origin: safeBase,
    };
  }

  return {
    statusCode: 404,
    title: 'Page Not Found (404) | POWER WEB STUDIO AI',
    description: 'The requested enterprise page or resource could not be found.',
    canonicalUrl: `${safeBase}/`,
    ogUrl: `${safeBase}${cleanPath}`,
    robots: 'noindex, nofollow',
    origin: safeBase,
  };
}

function injectRouteHtmlMeta(rawHtml: string, req: express.Request): {
  statusCode: 200 | 404;
  html: string;
} {
  const origin = resolveSeoBaseUrl();
  const info = resolveRouteHtmlInfo(req.path || '/', origin, req.query);
  const safeTitle = escapeHtmlText(info.title);
  const safeTitleAttr = escapeHtmlAttr(info.title);
  const safeDescAttr = escapeHtmlAttr(info.description);
  const safeCanonical = escapeHtmlAttr(info.canonicalUrl);
  const safeOgUrl = escapeHtmlAttr(info.ogUrl);
  const safeRobots = escapeHtmlAttr(info.robots);
  const safeOrigin = escapeHtmlAttr(info.origin);

  const html = rawHtml
    .replaceAll(PLACEHOLDER_SITE_URL, info.origin)
    .replaceAll(CANONICAL_SITE_URL, info.origin)
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${safeTitle}</title>`)
    .replace(
      /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="description" content="${safeDescAttr}" />`
    )
    .replace(
      /<meta\s+name="robots"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="robots" content="${safeRobots}" />`
    )
    .replace(
      /<meta\s+name="site-url"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="site-url" content="${safeOrigin}" />`
    )
    .replace(
      /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i,
      `<link rel="canonical" href="${safeCanonical}" />`
    )
    .replace(
      /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i,
      `<meta property="og:title" content="${safeTitleAttr}" />`
    )
    .replace(
      /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i,
      `<meta property="og:description" content="${safeDescAttr}" />`
    )
    .replace(
      /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/i,
      `<meta property="og:url" content="${safeOgUrl}" />`
    )
    .replace(
      /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="twitter:title" content="${safeTitleAttr}" />`
    )
    .replace(
      /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="twitter:description" content="${safeDescAttr}" />`
    )
    .replace(/content="\/og-image\.jpg"/g, `content="${safeOrigin}/og-image.jpg"`);

  return { statusCode: info.statusCode, html };
}

function isSpaDocumentRequest(req: express.Request): boolean {
  if (req.method !== 'GET') return false;
  const p = req.path || '/';
  if (
    p.startsWith('/api') ||
    p.startsWith('/@') ||
    p.startsWith('/src/') ||
    p.startsWith('/node_modules/')
  ) {
    return false;
  }
  const hasFileExtension = /\.[a-zA-Z0-9]{1,8}$/.test(p);
  if (hasFileExtension) return false;
  const accept = (req.headers.accept || '').toLowerCase();
  return accept.includes('text/html') || accept.includes('*/*') || accept === '';
}

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

  let viteServerInstance: {
    middlewares: express.RequestHandler;
    transformIndexHtml: (url: string, html: string) => Promise<string>;
  } | null = null;
  let viteMiddlewarePromise: Promise<express.RequestHandler> | null = null;

  if (isDev) {
    const devIndexPath = path.resolve(__dirname, 'index.html');
    app.get('*', async (req, res, next) => {
      if (!viteServerInstance || !isSpaDocumentRequest(req)) {
        return next();
      }
      try {
        const rawTemplate = fs.readFileSync(devIndexPath, 'utf8');
        const transformed = await viteServerInstance.transformIndexHtml(req.originalUrl, rawTemplate);
        const { statusCode, html } = injectRouteHtmlMeta(transformed, req);
        res.status(statusCode).setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.send(html);
      } catch (err) {
        return next(err);
      }
    });

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
        const routeInfo = resolveRouteHtmlInfo(req.path || '/', resolveSeoBaseUrl(), req.query);
        return res.status(routeInfo.statusCode).sendFile(distIndexPath);
      }
      const { statusCode, html } = injectRouteHtmlMeta(cachedIndexHtml, req);
      res.status(statusCode).setHeader('Content-Type', 'text/html; charset=utf-8');
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
      .then((vite) => {
        viteServerInstance = vite as unknown as typeof viteServerInstance;
        return vite.middlewares as unknown as express.RequestHandler;
      });
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
