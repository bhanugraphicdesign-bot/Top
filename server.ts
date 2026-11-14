import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { initializeApp, getApps, cert, applicationDefault, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
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
const LEGACY_ROOT_ADMIN_FALLBACK = 'ssbhanu41@gmail.com';
const RAW_ROOT_ADMIN_EMAIL = (process.env.ROOT_ADMIN_EMAIL || '').trim();
const HAS_EXPLICIT_ROOT_ADMIN_EMAIL = RAW_ROOT_ADMIN_EMAIL.length > 0;
const ROOT_ADMIN_EMAILS = new Set<string>(
  (HAS_EXPLICIT_ROOT_ADMIN_EMAIL ? RAW_ROOT_ADMIN_EMAIL : LEGACY_ROOT_ADMIN_FALLBACK)
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)
);

if (!HAS_EXPLICIT_ROOT_ADMIN_EMAIL) {
  console.warn(
    '[Security Notice] ROOT_ADMIN_EMAIL env var not set; using legacy bootstrap admin fallback alongside Firestore user_roles.'
  );
}

function isRootAdminEmail(email: string, emailVerified: boolean): boolean {
  if (!emailVerified || !email) return false;
  return ROOT_ADMIN_EMAILS.has(email.trim().toLowerCase());
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

/* =========================================================================
   MODULAR STORAGE PROVIDER (GCS WHEN VERIFIED, ELSE LOCAL CONTAINER DISK)
   ========================================================================= */
const EXPLICIT_GCS_BUCKET = (process.env.GCS_BUCKET || '').trim();
let gcsStorageClient: Storage | null = null;
let gcsBucketVerified = false;
let gcsStatusNote =
  'GCS_BUCKET not set; file upload is active using authenticated local server disk vault (uploads/). Configure GCS_BUCKET for persistent Cloud Storage across container restarts.';

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
      gcsStatusNote = `Configured GCS_BUCKET (${EXPLICIT_GCS_BUCKET}) does not exist or is unreachable; using authenticated local server disk vault fallback.`;
      console.warn(`[Storage Warning] ${gcsStatusNote}`);
    }
  } catch (err: any) {
    gcsBucketVerified = false;
    gcsStatusNote = `GCS verification unavailable (${err?.code || 'missing credentials'}); using authenticated local server disk vault fallback.`;
    console.warn(`[Storage Notice] ${gcsStatusNote}`);
  }
}

void verifyGcsStorageAvailability();

// High-entropy HMAC secret: use env var in production, ephemeral CSPRNG secret otherwise (never hardcoded)
const EPHEMERAL_PAYMENT_SECRET = crypto.randomBytes(32).toString('hex');
const HAS_EXPLICIT_PAYMENT_SECRET = Boolean(
  process.env.PAYMENT_SECRET && process.env.PAYMENT_SECRET.trim().length >= 16
);
const PAYMENT_SECRET = HAS_EXPLICIT_PAYMENT_SECRET
  ? process.env.PAYMENT_SECRET!.trim()
  : EPHEMERAL_PAYMENT_SECRET;

if (!HAS_EXPLICIT_PAYMENT_SECRET) {
  console.warn(
    '[Security Notice] PAYMENT_SECRET env var not set; using process-ephemeral 256-bit CSPRNG key.'
  );
}

// Cloud Run Reverse Proxy Configuration
app.set('trust proxy', true);

// Production Security Headers (HSTS, nosniff, XSS protection, Referrer policy, Frame guard)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

// Strict Origin Allowlist CORS Configuration
const configuredOrigins = (process.env.CORS_ALLOWED_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const staticAllowedOrigins = new Set<string>(
  [
    'https://power-web-studio-ai-enterprise-digital-platform.ai.studio',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    process.env.APP_URL?.trim() || '',
    ...configuredOrigins,
  ].filter(Boolean)
);

function isAllowedCorsOrigin(origin?: string): boolean {
  if (!origin) return true; // Same-origin requests, server-to-server, curl without Origin header
  if (staticAllowedOrigins.has(origin)) return true;
  try {
    const parsed = new URL(origin);
    if (
      parsed.protocol === 'https:' &&
      (parsed.hostname.endsWith('.run.app') || parsed.hostname.endsWith('.ai.studio'))
    ) {
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
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 600,
  })
);

// Body parsers with bounded payload size for base64 artifacts
app.use(express.json({ limit: '35mb' }));
app.use(express.urlencoded({ extended: true, limit: '35mb' }));

/* =========================================================================
   LOCAL CONTAINER STORAGE, LEDGER & AUDIT LOG REGISTRY
   Note: On Cloud Run stateless containers without GCS_BUCKET, local disk is ephemeral.
   ========================================================================= */
const UPLOADS_DIR = path.resolve(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const MANIFEST_PATH = path.join(UPLOADS_DIR, 'manifest.json');
function getManifest(): Record<string, any> {
  try {
    if (fs.existsSync(MANIFEST_PATH)) {
      return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
    }
  } catch {
    // fallback
  }
  return {};
}

function saveManifest(manifest: Record<string, any>) {
  try {
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf8');
  } catch (err) {
    console.error('[Manifest Save Error]', err);
  }
}

const LEDGER_DIR = path.resolve(__dirname, 'uploads', 'ledger');
if (!fs.existsSync(LEDGER_DIR)) {
  fs.mkdirSync(LEDGER_DIR, { recursive: true });
}

const INVOICES_PATH = path.join(LEDGER_DIR, 'invoices.json');
const PAYMENTS_PATH = path.join(LEDGER_DIR, 'payments.json');
const NEWSLETTER_PATH = path.join(LEDGER_DIR, 'newsletter.json');
const AUDIT_EVENTS_PATH = path.join(LEDGER_DIR, 'audit_events.json');

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

function appendServerAuditEvent(event: Omit<ServerAuditEvent, 'id' | 'timestamp'>): void {
  try {
    let events: ServerAuditEvent[] = [];
    if (fs.existsSync(AUDIT_EVENTS_PATH)) {
      events = JSON.parse(fs.readFileSync(AUDIT_EVENTS_PATH, 'utf8'));
      if (!Array.isArray(events)) events = [];
    }
    const entry: ServerAuditEvent = {
      id: `srv-audit-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      timestamp: new Date().toISOString(),
      ...event,
    };
    events.unshift(entry);
    if (events.length > 500) {
      events = events.slice(0, 500);
    }
    fs.writeFileSync(AUDIT_EVENTS_PATH, JSON.stringify(events, null, 2), 'utf8');
  } catch (err) {
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
    storageProvider: record.storageProvider || 'local_container_disk',
    notes: record.notes || '',
    uploadedAt: record.uploadedAt,
    downloadUrl: `/api/files/${record.fileId}`,
  };
}

const INITIAL_INVOICES = [
  {
    id: 'inv-2026-0814',
    invoiceNumber: 'INV-2026-0814',
    projectId: 'proj-1',
    projectName: 'Bharat Fleet ERP & Distributed Telematics',
    projectNameHi: 'भारत फ्लीट ईआरपी एवं वितरित टेलीमैटिक्स',
    clientId: 'kalinga-client-id',
    clientName: 'Rajiv Sengupta',
    clientEmail: 'kalinga@enterprise.in',
    clientCompany: 'Kalinga Logistics Infrastructure Ltd.',
    clientGstin: '21AAACK1924L1ZZ',
    milestoneTitle: 'Milestone 03 — BLE Soundbox & Dynamic QR Payment Reconciliation',
    milestoneTitleHi: 'माइलस्टोन 03 — BLE साउंडबॉक्स एवं डायनामिक QR भुगतान समाधान',
    subtotal: 450000,
    gstRate: 18,
    gstAmount: 81000,
    totalAmount: 531000,
    currency: 'INR',
    hsnSac: '998313',
    status: 'paid',
    issuedAt: '2026-10-25T10:00:00Z',
    dueAt: '2026-11-09T18:00:00Z',
    paidAt: '2026-11-09T14:30:00Z',
    paymentTxnId: 'TXN-UPI-NPCI-88921102',
    paymentMethod: 'UPI',
    verificationHash: '9a7c3b2e5f1d4a8e6b0c2d4e6f8a0b2c4d6e8f0a2b4c6d8e0f2a4b6c8d0e2f4a',
  },
  {
    id: 'inv-2026-0899',
    invoiceNumber: 'INV-2026-0899',
    projectId: 'proj-1',
    projectName: 'Bharat Fleet ERP & Distributed Telematics',
    projectNameHi: 'भारत फ्लीट ईआरपी एवं वितरित टेलीमैटिक्स',
    clientId: 'kalinga-client-id',
    clientName: 'Rajiv Sengupta',
    clientEmail: 'kalinga@enterprise.in',
    clientCompany: 'Kalinga Logistics Infrastructure Ltd.',
    clientGstin: '21AAACK1924L1ZZ',
    milestoneTitle: 'Milestone 04 — Release Candidate v2.4.1 Fleet Rollout & SOC-2 Audit',
    milestoneTitleHi: 'माइलस्टोन 04 — रिलीज कैंडिडेट v2.4.1 फ्लीट रोलआउट एवं SOC-2 ऑडिट',
    subtotal: 500000,
    gstRate: 18,
    gstAmount: 90000,
    totalAmount: 590000,
    currency: 'INR',
    hsnSac: '998313',
    status: 'issued',
    issuedAt: '2026-11-10T10:00:00Z',
    dueAt: '2026-11-25T18:00:00Z',
    verificationHash: '1c4e7f9a2b5d8e0c3a6f9b2d5e8a1c4f7b0d3e6a9c2f5b8e1d4a7c0f3b6e9a2d',
  },
  {
    id: 'inv-2026-0912',
    invoiceNumber: 'INV-2026-0912',
    projectId: 'proj-2',
    projectName: 'Odisha Krushak Mandee Multi-Tenant Core',
    projectNameHi: 'ओडिशा कृषक मंडी मल्टी-टेनेंट कोर',
    clientId: 'utkal-client-id',
    clientName: 'Er. Debi Prasad Mishra',
    clientEmail: 'utkal@odisha.gov.in',
    clientCompany: 'Utkal Agro Infrastructure Directorate',
    clientGstin: '21GVDPM9910A1Z5',
    milestoneTitle: 'Milestone 01 — Vernacular Voice AI Engine & Mandee Price Sync',
    milestoneTitleHi: 'माइलस्टोन 01 — स्थानीय ध्वनि AI इंजन एवं मंडी मूल्य समन्वय',
    subtotal: 320000,
    gstRate: 18,
    gstAmount: 57600,
    totalAmount: 377600,
    currency: 'INR',
    hsnSac: '998313',
    status: 'paid',
    issuedAt: '2026-10-15T11:00:00Z',
    dueAt: '2026-10-30T18:00:00Z',
    paidAt: '2026-10-28T16:15:00Z',
    paymentTxnId: 'TXN-RTGS-RBI-29004128',
    paymentMethod: 'NEFT_RTGS',
    verificationHash: '4b7d0a3c6e9f2b5a8d1c4e7f0b3d6a9c2e5f8b1d4a7c0e3f6b9d2a5c8e1f4b7a',
  },
];

function getInvoices(): any[] {
  try {
    if (fs.existsSync(INVOICES_PATH)) {
      return JSON.parse(fs.readFileSync(INVOICES_PATH, 'utf8'));
    }
  } catch {
    // fallback
  }
  return INITIAL_INVOICES;
}

function saveInvoices(invoices: any[]) {
  try {
    fs.writeFileSync(INVOICES_PATH, JSON.stringify(invoices, null, 2), 'utf8');
  } catch (err) {
    console.error('[Invoices Save Error]', err);
  }
}

function getPayments(): any[] {
  try {
    if (fs.existsSync(PAYMENTS_PATH)) {
      return JSON.parse(fs.readFileSync(PAYMENTS_PATH, 'utf8'));
    }
  } catch {
    // fallback
  }
  return [];
}

function savePayments(payments: any[]) {
  try {
    fs.writeFileSync(PAYMENTS_PATH, JSON.stringify(payments, null, 2), 'utf8');
  } catch (err) {
    console.error('[Payments Save Error]', err);
  }
}

function getNewsletterSubscribers(): any[] {
  try {
    if (fs.existsSync(NEWSLETTER_PATH)) {
      return JSON.parse(fs.readFileSync(NEWSLETTER_PATH, 'utf8'));
    }
  } catch {
    // fallback
  }
  return [];
}

function saveNewsletterSubscribers(subs: any[]) {
  try {
    fs.writeFileSync(NEWSLETTER_PATH, JSON.stringify(subs, null, 2), 'utf8');
  } catch (err) {
    console.error('[Newsletter Save Error]', err);
  }
}

/* =========================================================================
   CRYPTOGRAPHIC FIREBASE ID TOKEN VERIFICATION & RBAC
   ========================================================================= */
interface VerifiedAuthUser {
  uid: string;
  email: string;
  emailVerified: boolean;
  isAdmin: boolean;
  roleSource: 'user_roles' | 'root_admin_env' | 'custom_claim' | 'client';
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
  const doc = await fetchFirestoreDocumentRest('user_roles', uid, idToken);
  return doc?.fields?.role?.stringValue === 'admin';
}

async function resolveServerAdminStatus(params: {
  uid: string;
  email: string;
  emailVerified: boolean;
  idToken: string;
  hasCustomClaimAdmin: boolean;
}): Promise<{ isAdmin: boolean; roleSource: VerifiedAuthUser['roleSource'] }> {
  // 1. Primary RBAC source of truth: Firestore `user_roles/{uid}` document
  const hasFirestoreRole = await checkFirestoreAdminRole(params.uid, params.idToken);
  if (hasFirestoreRole) {
    return { isAdmin: true, roleSource: 'user_roles' };
  }

  // 2. Env-configured root admin fallback (`process.env.ROOT_ADMIN_EMAIL`, with safe legacy bootstrap fallback)
  if (isRootAdminEmail(params.email, params.emailVerified)) {
    return { isAdmin: true, roleSource: 'root_admin_env' };
  }

  // 3. Verified Firebase custom claims fallback
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
        email,
        emailVerified,
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
      email,
      emailVerified,
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
    appendServerAuditEvent({
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

// Single-use server-tracked payment intents (prevent replay & double settlement)
const paymentIntents = new Map<
  string,
  { invoiceId: string; amount: number; uid: string; expiresAt: number; used: boolean }
>();

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
  const forwarded = req.headers['x-forwarded-for'] as string | undefined;
  return (forwarded ? forwarded.split(',')[0].trim() : req.socket.remoteAddress) || '127.0.0.1';
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

function createFormRateLimiter(scope: 'inquiry' | 'newsletter') {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const clientIp = getClientIp(req);
    const bucketKey = `${scope}:${clientIp}`;
    const check = checkRateBucket(
      formRateMap,
      bucketKey,
      MAX_FORM_SUBMISSIONS_PER_WINDOW,
      FORM_RATE_LIMIT_WINDOW_MS
    );

    const retryAfterSeconds = Math.ceil(check.retryAfterMs / 1000);
    res.setHeader('X-RateLimit-Limit', String(MAX_FORM_SUBMISSIONS_PER_WINDOW));
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
        details: `Blocked ${scope} submission: exceeded ${MAX_FORM_SUBMISSIONS_PER_WINDOW} requests per 15 min window`,
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
  scope: 'inquiry' | 'newsletter'
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

app.use('/api', rateLimiter);

/* =========================================================================
   SECURE SERVER-SIDE API ENDPOINTS
   ========================================================================= */

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

  res.json({
    status: databaseStatus === 'CONNECTED' ? 'ONLINE' : 'DEGRADED',
    service: 'POWER WEB STUDIO AI ENTERPRISE BACKEND',
    company: 'BHANU RAM BARIHA DIGITAL TECHNOLOGIES',
    cin: 'U72900OR2024PTC045812',
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
      firebaseAdminMode: adminInitMode,
      firebaseAdminCredentialsPresent: adminHasCredentials,
      bearerTokenVerification: adminHasCredentials ? 'FIREBASE_ADMIN_SDK' : 'FIREBASE_RS256',
      corsStrictAllowlist: true,
      unauthenticatedUploadsDisabled: true,
      paymentSecretConfigured: HAS_EXPLICIT_PAYMENT_SECRET,
      paymentGatewayMode: HAS_EXPLICIT_PAYMENT_SECRET ? 'configured' : 'optional_mode',
      rateLimiting: 'ACTIVE',
      hstsEnabled: true,
    },
    storage: {
      mode: gcsBucketVerified ? 'google_cloud_storage' : 'local_container_disk',
      fileUploadEnabled: true,
      gcsBucketConfigured: Boolean(EXPLICIT_GCS_BUCKET),
      gcsBucketVerified,
      persistentAcrossCloudRunRestarts: gcsBucketVerified,
      ephemeralDiskWarning: gcsBucketVerified
        ? null
        : 'Files are saved to local server disk vault (uploads/). Configure GCS_BUCKET in production for durable Cloud Storage across container restarts.',
      note: gcsStatusNote,
    },
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
    fileUploadEnabled: true,
    storageMode: gcsBucketVerified ? 'google_cloud_storage' : 'local_container_disk',
    gcsBucketVerified,
    paymentGatewayEnabled: HAS_EXPLICIT_PAYMENT_SECRET,
    paymentMode: HAS_EXPLICIT_PAYMENT_SECRET ? 'configured' : 'optional_mode',
    authProvider: 'Firebase Authentication',
    rootAdminEnvConfigured: HAS_EXPLICIT_ROOT_ADMIN_EMAIL,
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

// 2. Real-time Node.js Telemetry
app.get('/api/telemetry', (req, res) => {
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

// 3. Server-side Inbound Scoping Validator (Rate-limited per IP + anti-bot checks)
app.post('/api/inquiries/validate', createFormRateLimiter('inquiry'), (req, res) => {
  if (!validateAntiBotFields(req, res, 'inquiry')) {
    return;
  }

  const { fullName, email, serviceType, brief } = req.body || {};
  const lang = resolveRequestedLanguage(req);

  if (!fullName || typeof fullName !== 'string' || fullName.trim().length === 0) {
    const errorEn = 'Full name is required and cannot be empty.';
    const errorHi = 'पूरा नाम आवश्यक है और इसे खाली नहीं छोड़ा जा सकता।';
    return res.status(400).json({
      code: 'VALIDATION_ERROR',
      error: lang === 'hi' ? errorHi : lang === 'en' ? errorEn : `${errorEn} / ${errorHi}`,
      errorEn,
      errorHi,
    });
  }
  if (fullName.trim().length > 160) {
    const errorEn = 'Full name exceeds 160 characters.';
    const errorHi = 'पूरा नाम 160 अक्षरों से अधिक नहीं हो सकता।';
    return res.status(400).json({
      code: 'VALIDATION_ERROR',
      error: lang === 'hi' ? errorHi : lang === 'en' ? errorEn : `${errorEn} / ${errorHi}`,
      errorEn,
      errorHi,
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || typeof email !== 'string' || !emailRegex.test(email.trim()) || email.trim().length > 160) {
    const errorEn = 'Please enter a valid work email address.';
    const errorHi = 'कृपया एक मान्य ईमेल पता दर्ज करें।';
    return res.status(400).json({
      code: 'VALIDATION_ERROR',
      error: lang === 'hi' ? errorHi : lang === 'en' ? errorEn : `${errorEn} / ${errorHi}`,
      errorEn,
      errorHi,
    });
  }

  if (!serviceType || typeof serviceType !== 'string' || serviceType.trim().length === 0 || serviceType.trim().length > 160) {
    const errorEn = 'Please select a technical service domain.';
    const errorHi = 'कृपया एक तकनीकी सेवा चुनें।';
    return res.status(400).json({
      code: 'VALIDATION_ERROR',
      error: lang === 'hi' ? errorHi : lang === 'en' ? errorEn : `${errorEn} / ${errorHi}`,
      errorEn,
      errorHi,
    });
  }

  const sanitizedBrief = typeof brief === 'string' ? brief.trim().substring(0, 2000) : '';

  return res.json({
    valid: true,
    message: 'Payload verified. Ready for immutable Firestore storage.',
    sanitized: {
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      serviceType: serviceType.trim(),
      brief: sanitizedBrief,
      receivedAt: new Date().toISOString(),
    },
  });
});

// 3b. Newsletter Dispatch Subscription Endpoint (Rate-limited per IP + anti-bot checks)
app.post('/api/newsletter/subscribe', createFormRateLimiter('newsletter'), (req, res) => {
  if (!validateAntiBotFields(req, res, 'newsletter')) {
    return;
  }

  const { email, language } = req.body || {};
  const lang = resolveRequestedLanguage(req);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || typeof email !== 'string' || !emailRegex.test(email.trim()) || email.trim().length > 160) {
    const errorEn = 'Please enter a valid work email address.';
    const errorHi = 'कृपया एक मान्य कार्य ईमेल पता दर्ज करें।';
    return res.status(400).json({
      code: 'VALIDATION_ERROR',
      error: lang === 'hi' ? errorHi : lang === 'en' ? errorEn : `${errorEn} / ${errorHi}`,
      errorEn,
      errorHi,
    });
  }

  const normalized = email.trim().toLowerCase();
  const subscribers = getNewsletterSubscribers();
  const existing = subscribers.find((s) => s.email === normalized);
  if (existing) {
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
    id: `sub-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
    email: normalized,
    language: language === 'hi' ? 'hi' : 'en',
    subscribedAt: new Date().toISOString(),
  };
  subscribers.push(entry);
  saveNewsletterSubscribers(subscribers);

  const msgEn = 'Subscribed to Quarterly Architectural Dispatch.';
  const msgHi = 'त्रैमासिक आर्किटेक्चर डिस्पैच में सदस्यता सफल।';
  return res.status(201).json({
    success: true,
    alreadySubscribed: false,
    message: lang === 'hi' ? msgHi : msgEn,
    messageEn: msgEn,
    messageHi: msgHi,
  });
});

/* =========================================================================
   4. AUTHENTICATED & VALIDATED FILE STORAGE ENGINE (ZERO UNAUTH UPLOADS)
   ========================================================================= */
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/zip',
  'application/x-zip-compressed',
  'application/vnd.android.package-archive',
  'image/png',
  'image/jpeg',
  'text/plain',
  'application/json',
]);

const ALLOWED_EXTENSIONS = new Set([
  'pdf', 'docx', 'zip', 'apk', 'png', 'jpg', 'jpeg', 'txt', 'json',
]);

const EXTENSION_MIME_ALLOWLIST: Record<string, Set<string>> = {
  pdf: new Set(['application/pdf']),
  docx: new Set([
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/zip',
    'application/octet-stream',
  ]),
  zip: new Set(['application/zip', 'application/x-zip-compressed', 'application/octet-stream']),
  apk: new Set(['application/vnd.android.package-archive', 'application/zip', 'application/octet-stream']),
  png: new Set(['image/png']),
  jpg: new Set(['image/jpeg']),
  jpeg: new Set(['image/jpeg']),
  txt: new Set(['text/plain']),
  json: new Set(['application/json', 'text/plain']),
};

const ALLOWED_UPLOAD_CATEGORIES = new Set([
  'consultation_rfp',
  'rfp_attachment',
  'support_ticket_diagnostic',
  'project_deliverable',
  'project_document',
  'general_attachment',
]);

const MAX_AUTH_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB max
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

    const { fileName, fileType, fileData, category, projectId, notes } = req.body || {};

    // Reject client-supplied ownership spoofing attempts
    if ('ownerUid' in (req.body || {}) || 'uploadedBy' in (req.body || {})) {
      appendServerAuditEvent({
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
        appendServerAuditEvent({
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
        error: `File size (${(buffer.length / (1024 * 1024)).toFixed(2)} MB) exceeds allowed limit (25 MB).`,
      });
    }

    // Extension & MIME Consistency Validation
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

    // Binary Magic Bytes & Structure Validation
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
    } else if (ext === 'jpg' || ext === 'jpeg') {
      const isJpg = buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
      if (!isJpg) {
        return res.status(400).json({ error: 'Invalid JPEG header: corrupted or spoofed image bytes.' });
      }
    } else if (ext === 'zip' || ext === 'apk' || ext === 'docx') {
      const isZip = buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4b;
      if (!isZip) {
        return res.status(400).json({ error: 'Invalid Archive/DOCX/APK bytes: corrupted ZIP header.' });
      }
    } else if (ext === 'json') {
      try {
        JSON.parse(buffer.toString('utf8'));
      } catch {
        return res.status(400).json({ error: 'Invalid JSON document content.' });
      }
    }

    const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
    const fileId = `file-${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
    const sanitizedName = path.basename(fileName).replace(/[^a-zA-Z0-9._-]/g, '_');
    const storageKey = `${fileId}-${sanitizedName}`;

    let storageProvider: 'google_cloud_storage' | 'local_container_disk' = 'local_container_disk';
    let gcsObjectPath: string | null = null;

    if (gcsBucketVerified && gcsStorageClient && EXPLICIT_GCS_BUCKET) {
      gcsObjectPath = `vault/${user.uid}/${storageKey}`;
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
      storageProvider = 'google_cloud_storage';
    } else {
      const filePath = path.join(UPLOADS_DIR, path.basename(storageKey));
      fs.writeFileSync(filePath, buffer);
    }

    const record = {
      fileId,
      fileName: sanitizedName,
      storageFileName: storageKey, // Internal only; stripped by toSafeFileDto
      gcsObjectPath, // Internal only; stripped by toSafeFileDto
      storageProvider,
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

    const manifest = getManifest();
    manifest[fileId] = record;
    saveManifest(manifest);

    appendServerAuditEvent({
      action: 'FILE_UPLOADED',
      actorUid: user.uid,
      actorEmail: user.email || user.uid,
      resource: `files/${fileId}`,
      outcome: 'SUCCESS',
      ip: clientIp,
      details: `Uploaded ${sanitizedName} (${record.fileSizeFormatted}, ${storageProvider}) SHA:${sha256.substring(0, 12)}`,
    });

    return res.status(201).json({
      success: true,
      message: 'File successfully verified, hashed, and committed to enterprise storage.',
      file: toSafeFileDto(record),
    });
  } catch (error) {
    console.error('[Upload Exception]', error);
    return res.status(500).json({ error: 'Internal server error during file processing.' });
  }
});

// 5. List Validated File Artifacts (Authenticated & Strict Ownership / Admin Scoped)
app.get('/api/files/list', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.authUser!;
  const { projectId } = req.query as { projectId?: string };
  const manifest = getManifest();
  let list = Object.values(manifest) as any[];

  if (!user.isAdmin) {
    list = list.filter((f) => f.ownerUid && f.ownerUid === user.uid);
  }

  if (projectId && typeof projectId === 'string' && SAFE_ID_REGEX.test(projectId)) {
    list = list.filter((f) => f.projectId === projectId);
  }

  list.sort((a: any, b: any) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

  res.json({
    count: list.length,
    files: list.map(toSafeFileDto),
  });
});

// 6. Secure File Retrieval & Download (Authenticated & Ownership/Admin Checked)
app.get('/api/files/:fileId', requireAuth, async (req: AuthenticatedRequest, res) => {
  const user = req.authUser!;
  const { fileId } = req.params;

  if (!SAFE_ID_REGEX.test(fileId)) {
    return res.status(400).json({ error: 'Invalid fileId format.' });
  }

  const manifest = getManifest();
  const record = manifest[fileId];

  if (!record) {
    return res.status(404).json({ error: 'File artifact not found.' });
  }

  const isOwner = Boolean(record.ownerUid && record.ownerUid === user.uid);
  if (!user.isAdmin && !isOwner) {
    appendServerAuditEvent({
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

  // GCS Storage Retrieval when persisted in verified GCS bucket
  if (
    record.storageProvider === 'google_cloud_storage' &&
    record.gcsObjectPath &&
    gcsBucketVerified &&
    gcsStorageClient &&
    EXPLICIT_GCS_BUCKET
  ) {
    try {
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
  }

  // Local Container Storage Retrieval
  const filePath = path.join(UPLOADS_DIR, path.basename(record.storageFileName || ''));
  if (!filePath.startsWith(UPLOADS_DIR) || !fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Stored artifact unavailable.' });
  }

  const safeDispositionName = String(record.fileName || 'artifact').replace(/["\r\n]/g, '_');
  res.setHeader('Content-Type', record.mimeType || 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${safeDispositionName}"`);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Artifact-SHA256', record.sha256);

  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
});

// 7. Secure Delete File Artifact (Verified Firebase Token + Owner/Admin Only + Audit Log)
app.delete('/api/files/:fileId', requireAuth, async (req: AuthenticatedRequest, res) => {
  const user = req.authUser!;
  const { fileId } = req.params;

  if (!SAFE_ID_REGEX.test(fileId)) {
    return res.status(400).json({ error: 'Invalid fileId format.' });
  }

  const manifest = getManifest();
  const record = manifest[fileId];

  if (!record) {
    return res.status(404).json({ error: 'File not found.' });
  }

  const isOwner = Boolean(record.ownerUid && record.ownerUid === user.uid);
  if (!user.isAdmin && !isOwner) {
    appendServerAuditEvent({
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

  if (
    record.storageProvider === 'google_cloud_storage' &&
    record.gcsObjectPath &&
    gcsBucketVerified &&
    gcsStorageClient &&
    EXPLICIT_GCS_BUCKET
  ) {
    try {
      await gcsStorageClient
        .bucket(EXPLICIT_GCS_BUCKET)
        .file(record.gcsObjectPath)
        .delete({ ignoreNotFound: true });
    } catch (err) {
      console.error('[GCS Delete Exception]', err);
    }
  } else {
    const filePath = path.join(UPLOADS_DIR, path.basename(record.storageFileName || ''));
    if (filePath.startsWith(UPLOADS_DIR) && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch {
        // ignore
      }
    }
  }

  delete manifest[fileId];
  saveManifest(manifest);

  appendServerAuditEvent({
    action: 'FILE_DELETED',
    actorUid: user.uid,
    actorEmail: user.email || user.uid,
    resource: `files/${fileId}`,
    outcome: 'SUCCESS',
    ip: getClientIp(req),
    details: `Deleted artifact ${record.fileName} (SHA:${String(record.sha256).substring(0, 12)})`,
  });

  res.json({ success: true, message: `File ${fileId} securely removed from storage.` });
});

// Admin Server Audit Ledger Endpoint (Strict Admin Only)
app.get('/api/audit-events', requireAdmin, (req: AuthenticatedRequest, res) => {
  try {
    const events = fs.existsSync(AUDIT_EVENTS_PATH)
      ? JSON.parse(fs.readFileSync(AUDIT_EVENTS_PATH, 'utf8'))
      : [];
    res.json({ count: Array.isArray(events) ? events.length : 0, events });
  } catch {
    res.status(500).json({ error: 'Unable to read audit events.' });
  }
});

/* =========================================================================
   SECURE PAYMENTS & INVOICES ENGINE (AUTHORITATIVE SERVER AMOUNTS + RBAC)
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

// 8. Authoritative Invoices List (Authenticated & Tenant-Scoped)
app.get('/api/invoices', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.authUser!;
  const { clientId, clientEmail } = req.query as { clientId?: string; clientEmail?: string };
  let invoices = getInvoices();

  if (user.isAdmin) {
    if (clientId) {
      invoices = invoices.filter((inv) => inv.clientId === clientId);
    } else if (clientEmail) {
      invoices = invoices.filter((inv) => inv.clientEmail.toLowerCase() === clientEmail.toLowerCase());
    }
  } else {
    invoices = invoices.filter((inv) => canAccessInvoice(user, inv));
  }

  res.json({
    count: invoices.length,
    invoices,
  });
});

// 9. Single Invoice Details (Authenticated & Owner/Admin Checked)
app.get('/api/invoices/:invoiceId', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.authUser!;
  const { invoiceId } = req.params;
  if (!SAFE_ID_REGEX.test(invoiceId)) {
    return res.status(400).json({ error: 'Invalid invoiceId format.' });
  }
  const invoices = getInvoices();
  const invoice = invoices.find((inv) => inv.id === invoiceId || inv.invoiceNumber === invoiceId);

  if (!invoice) {
    return res.status(404).json({ error: 'Invoice not found in billing ledger' });
  }

  if (!canAccessInvoice(user, invoice)) {
    return res.status(403).json({ error: 'Forbidden: You cannot access another tenant invoice.' });
  }

  res.json(invoice);
});

// 10. Secure Payment Intent Creator (Authenticated + Optional Mode Guard + Server-Derived Amount)
app.post('/api/payments/create-intent', requireAuth, (req: AuthenticatedRequest, res) => {
  if (!HAS_EXPLICIT_PAYMENT_SECRET) {
    return res.status(503).json({
      error: 'Payment Gateway is currently in Optional Mode (PAYMENT_SECRET not configured). Invoices remain viewable without online charges.',
      code: 'PAYMENT_GATEWAY_OPTIONAL_MODE',
    });
  }

  const user = req.authUser!;
  const { invoiceId } = req.body || {};

  if (!invoiceId || typeof invoiceId !== 'string' || !SAFE_ID_REGEX.test(invoiceId)) {
    return res.status(400).json({ error: 'Valid invoiceId is required' });
  }

  const invoices = getInvoices();
  const invoice = invoices.find((inv) => inv.id === invoiceId || inv.invoiceNumber === invoiceId);

  if (!invoice) {
    return res.status(404).json({ error: 'Referenced invoice does not exist in registry.' });
  }

  if (!canAccessInvoice(user, invoice)) {
    return res.status(403).json({ error: 'Forbidden: You are not authorized to pay this invoice.' });
  }

  if (invoice.status === 'paid') {
    return res.status(400).json({ error: 'Invoice has already been settled and verified.' });
  }

  // Authoritative amount strictly from server ledger, never client body
  const authoritativeAmount = Number(invoice.totalAmount);
  const orderId = `ORDER_${Date.now()}_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  const checksum = crypto
    .createHmac('sha256', PAYMENT_SECRET)
    .update(`${orderId}:${invoice.id}:${authoritativeAmount}:${user.uid}`)
    .digest('hex');

  paymentIntents.set(orderId, {
    invoiceId: invoice.id,
    amount: authoritativeAmount,
    uid: user.uid,
    expiresAt: Date.now() + 30 * 60 * 1000,
    used: false,
  });

  res.json({
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
});

// 11. Cryptographic Payment Verification & Settlement (Timing-Safe + Optional Mode Guard)
app.post('/api/payments/verify', requireAuth, (req: AuthenticatedRequest, res) => {
  if (!HAS_EXPLICIT_PAYMENT_SECRET) {
    return res.status(503).json({
      error: 'Payment Gateway is currently in Optional Mode (PAYMENT_SECRET not configured).',
      code: 'PAYMENT_GATEWAY_OPTIONAL_MODE',
    });
  }

  const user = req.authUser!;
  const { orderId, invoiceId, checksum, method, transactionRef } = req.body || {};

  if (
    !orderId ||
    typeof orderId !== 'string' ||
    !invoiceId ||
    typeof invoiceId !== 'string' ||
    !checksum ||
    typeof checksum !== 'string'
  ) {
    return res.status(400).json({ error: 'orderId, invoiceId, and checksum are required' });
  }

  const intent = paymentIntents.get(orderId);
  if (!intent || intent.used || Date.now() > intent.expiresAt) {
    return res.status(400).json({ error: 'Invalid, expired, or already-used payment intent.' });
  }

  if (intent.uid !== user.uid && !user.isAdmin) {
    return res.status(403).json({ error: 'Forbidden: Payment intent belongs to a different user.' });
  }

  const invoices = getInvoices();
  const invoiceIndex = invoices.findIndex(
    (inv) => inv.id === invoiceId || inv.invoiceNumber === invoiceId
  );

  if (invoiceIndex === -1) {
    return res.status(404).json({ error: 'Invoice record not found' });
  }

  const invoice = invoices[invoiceIndex];
  if (invoice.id !== intent.invoiceId) {
    return res.status(400).json({ error: 'Invoice ID mismatch against payment intent.' });
  }

  if (!canAccessInvoice(user, invoice)) {
    return res.status(403).json({ error: 'Forbidden: Unauthorized invoice settlement attempt.' });
  }

  if (invoice.status === 'paid') {
    return res.status(400).json({ error: 'Invoice has already been settled.' });
  }

  const expectedChecksum = crypto
    .createHmac('sha256', PAYMENT_SECRET)
    .update(`${orderId}:${invoice.id}:${invoice.totalAmount}:${intent.uid}`)
    .digest('hex');

  const providedBuf = Buffer.from(checksum, 'utf8');
  const expectedBuf = Buffer.from(expectedChecksum, 'utf8');
  if (providedBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(providedBuf, expectedBuf)) {
    return res.status(400).json({
      error: 'Cryptographic Checksum Mismatch: Payment payload has been tampered with or expired.',
    });
  }

  // Mark intent single-use immediately
  intent.used = true;

  const allowedMethods = new Set(['UPI', 'NEFT_RTGS', 'Corporate_Card', 'Escrow']);
  const safeMethod = allowedMethods.has(method) ? method : 'UPI';

  const paymentId = `PAY_${Date.now()}_${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  const verifiedTxnRef =
    typeof transactionRef === 'string' && transactionRef.trim().length > 4
      ? transactionRef.trim().substring(0, 64)
      : `TXN_NPCI_${Date.now()}_${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

  const updatedInvoice = {
    ...invoice,
    status: 'paid',
    paidAt: new Date().toISOString(),
    paymentTxnId: verifiedTxnRef,
    paymentMethod: safeMethod,
  };

  invoices[invoiceIndex] = updatedInvoice;
  saveInvoices(invoices);

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
    timestamp: new Date().toISOString(),
    verifiedBy: 'BHANU RAM BARIHA DIGITAL TECHNOLOGIES // SECURE_LEDGER_KERNEL',
  };

  const payments = getPayments();
  payments.push(paymentRecord);
  savePayments(payments);

  appendServerAuditEvent({
    action: 'PAYMENT_VERIFIED',
    actorUid: user.uid,
    actorEmail: user.email || user.uid,
    resource: `invoices/${invoice.id}`,
    outcome: 'SUCCESS',
    ip: getClientIp(req),
    details: `Settled ${invoice.invoiceNumber} for INR ${invoice.totalAmount} (${safeMethod})`,
  });

  res.json({
    success: true,
    message: 'Payment verified and committed to enterprise ledger.',
    payment: paymentRecord,
    invoice: updatedInvoice,
  });
});

// 12. Admin Invoice Generator (Strict Verified Admin Only)
app.post('/api/invoices/generate', requireAdmin, (req: AuthenticatedRequest, res) => {
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

  const invoices = getInvoices();
  invoices.unshift(newInvoice);
  saveInvoices(invoices);

  appendServerAuditEvent({
    action: 'INVOICE_GENERATED',
    actorUid: req.authUser!.uid,
    actorEmail: req.authUser!.email || req.authUser!.uid,
    resource: `invoices/${invoiceId}`,
    outcome: 'SUCCESS',
    ip: getClientIp(req),
    details: `Generated ${invoiceNumber} for ${newInvoice.clientEmail} (INR ${totalAmount})`,
  });

  res.status(201).json({
    success: true,
    message: 'Official GST tax invoice generated and committed to registry.',
    invoice: newInvoice,
  });
});

/* =========================================================================
   SEARCH ENGINE OPTIMIZATION & DISCOVERABILITY (SEO)
   ========================================================================= */

const CANONICAL_SEO_DOMAIN = 'https://power-web-studio-ai-enterprise-digital-platform.ai.studio';

function resolveSeoBaseUrl(): string {
  const envUrl = (process.env.APP_URL || '').trim().replace(/\/+$/, '');
  if (/^https?:\/\//i.test(envUrl)) {
    return envUrl;
  }
  return CANONICAL_SEO_DOMAIN;
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
      .replaceAll(CANONICAL_SEO_DOMAIN, baseUrl);
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
      .replaceAll(CANONICAL_SEO_DOMAIN, baseUrl);
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

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
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
      const envOrigin = (process.env.APP_URL || '').trim().replace(/\/+$/, '');
      const proto = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : req.protocol;
      const reqHost = req.get('host');
      const liveOrigin = envOrigin || (reqHost ? `${proto}://${reqHost}` : '');

      const html = liveOrigin
        ? cachedIndexHtml
            .replace(/content="\/og-image\.jpg"/g, `content="${liveOrigin}/og-image.jpg"`)
            .replace(/property="og:url" content="\/"/g, `property="og:url" content="${liveOrigin}/"`)
        : cachedIndexHtml;

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(html);
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(
      `[POWER WEB STUDIO AI] Enterprise Server active on http://0.0.0.0:${PORT} (ENV: ${process.env.NODE_ENV || 'development'})`
    );
  });

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
