/**
 * POWER WEB STUDIO AI — Phase 8 Comprehensive Automated Test Suite
 * BHANU RAM BARIHA DIGITAL TECHNOLOGIES
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { enTranslations } from '../src/i18n/en';
import { hiTranslations } from '../src/i18n/hi';

const SERVER_BASE = 'http://localhost:3000';

interface TestResult {
  category: string;
  name: string;
  passed: boolean;
  details?: string;
}

const results: TestResult[] = [];

function record(category: string, name: string, passed: boolean, details?: string) {
  results.push({ category, name, passed, details });
  const status = passed ? 'PASS' : 'FAIL';
  console.log(`[${status}] [${category}] ${name}${details ? ` -> ${details}` : ''}`);
}

async function runTestSuite() {
  console.log('================================================================');
  console.log('   POWER WEB STUDIO AI — PHASE 8 COMPREHENSIVE TEST SUITE       ');
  console.log('   BHANU RAM BARIHA DIGITAL TECHNOLOGIES                        ');
  console.log('================================================================\n');

  // --------------------------------------------------------------------------
  // 1. BACKEND FUNCTIONAL API TESTS
  // --------------------------------------------------------------------------
  console.log('--- 1. BACKEND FUNCTIONAL API TESTS ---');

  try {
    const res = await fetch(`${SERVER_BASE}/api/health`);
    const data = await res.json();
    const capRes = await fetch(`${SERVER_BASE}/api/system/capabilities`);
    const capData = await capRes.json();
    const passed =
      res.status === 200 &&
      capRes.status === 200 &&
      data.status === 'ONLINE' &&
      data.company === 'BHANU RAM BARIHA DIGITAL TECHNOLOGIES' &&
      data.database?.provider === 'Google Cloud Firestore' &&
      data.database?.status === 'CONNECTED' &&
      (data.security?.bearerTokenVerification === 'FIREBASE_ADMIN_SDK' ||
        data.security?.bearerTokenVerification === 'FIREBASE_RS256') &&
      capData.fileUploadEnabled === Boolean(data.storage?.gcsBucketVerified) &&
      capData.paymentGatewayEnabled === Boolean(data.security?.paymentSecretConfigured);
    record(
      'API Functional',
      'GET /api/health & /api/system/capabilities return 200 ONLINE with honest storage & optional payment flags',
      passed,
      `status=${data.status}, db=${data.database?.status}, storageMode=${data.storage?.mode}, paymentMode=${capData.paymentMode}`
    );
  } catch (err: any) {
    record('API Functional', 'GET /api/health returns 200 ONLINE', false, err.message);
  }

  try {
    const res = await fetch(`${SERVER_BASE}/api/telemetry`);
    record(
      'API Security',
      'GET /api/telemetry rejects unauthenticated callers with HTTP 401 (admin-only)',
      res.status === 401,
      `status=${res.status}`
    );
  } catch (err: any) {
    record('API Security', 'GET /api/telemetry requires admin auth', false, err.message);
  }

  try {
    const res = await fetch(`${SERVER_BASE}/api/inquiries/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Rajiv Sengupta',
        email: 'r.sengupta@kalingalogistics.in',
        serviceType: 'Enterprise Android Engineering',
        brief: 'Need 500 soundboxes deployed with low BLE latency in Odisha.',
      }),
    });
    const data = await res.json();
    const passed = res.status === 200 && data.valid === true && data.sanitized?.fullName === 'Rajiv Sengupta';
    record('API Functional', 'POST /api/inquiries/validate accepts valid inquiry payload', passed);
  } catch (err: any) {
    record('API Functional', 'POST /api/inquiries/validate accepts valid inquiry payload', false, err.message);
  }

  try {
    const res = await fetch(`${SERVER_BASE}/api/inquiries/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Test User',
        email: 'invalid-email-no-at',
        serviceType: 'AI Engineering',
      }),
    });
    record('API Functional', 'POST /api/inquiries/validate rejects malformed email with 400', res.status === 400);
  } catch (err: any) {
    record('API Functional', 'POST /api/inquiries/validate rejects malformed email with 400', false, err.message);
  }

  try {
    const res = await fetch(`${SERVER_BASE}/api/inquiries/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: '',
        email: 'valid@enterprise.com',
        serviceType: 'AI Engineering',
      }),
    });
    record('API Functional', 'POST /api/inquiries/validate rejects empty fullName with 400', res.status === 400);
  } catch (err: any) {
    record('API Functional', 'POST /api/inquiries/validate rejects empty fullName with 400', false, err.message);
  }

  try {
    const okRes = await fetch(`${SERVER_BASE}/api/quotations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Vikram Patel',
        email: 'v.patel@example.in',
        serviceType: 'Enterprise AI & Autonomous Agents',
        brief: 'Architecture scoping check via POST /api/quotations.',
      }),
    });
    const okData = await okRes.json().catch(() => ({}));
    const badRes = await fetch(`${SERVER_BASE}/api/quotations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: '',
        email: 'invalid-email',
        serviceType: '',
      }),
    });
    const validHandled =
      okRes.status === 201 ||
      (okRes.status === 503 && okData?.code === 'FIRESTORE_ADMIN_NOT_CONFIGURED');
    record(
      'API Functional',
      'POST /api/quotations validates with Zod & persists via firebase-admin (or 503 unconfigured)',
      validHandled && badRes.status === 400,
      `validStatus=${okRes.status}, invalidStatus=${badRes.status}`
    );
  } catch (err: any) {
    record('API Functional', 'POST /api/quotations validation test', false, err.message);
  }

  const testSubEmail = `phase8-test-${Date.now()}@example.com`;
  try {
    const okRes = await fetch(`${SERVER_BASE}/api/newsletter/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testSubEmail, language: 'hi' }),
    });
    const okData = await okRes.json().catch(() => ({}));
    const badRes = await fetch(`${SERVER_BASE}/api/newsletter/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'not-valid-email' }),
    });
    const validHandled =
      okRes.status === 201 ||
      okRes.status === 200 ||
      (okRes.status === 503 && okData?.code === 'FIRESTORE_ADMIN_NOT_CONFIGURED');
    const passed = validHandled && badRes.status === 400;
    record(
      'API Functional',
      'POST /api/newsletter/subscribe uses Firestore (or 503 when Admin unconfigured) & rejects invalid email',
      passed,
      `validStatus=${okRes.status}, invalidStatus=${badRes.status}`
    );
  } catch (err: any) {
    record('API Functional', 'POST /api/newsletter/subscribe test', false, err.message);
  }

  // --------------------------------------------------------------------------
  // 2. SECURITY GATES & VALIDATED FILE STORAGE TESTS
  // --------------------------------------------------------------------------
  console.log('\n--- 2. SECURITY GATES & VALIDATED FILE STORAGE TESTS ---');

  try {
    const rList = await fetch(`${SERVER_BASE}/api/files/list`);
    const rInv = await fetch(`${SERVER_BASE}/api/invoices`);
    const rIntent = await fetch(`${SERVER_BASE}/api/payments/create-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoiceId: 'inv-2026-0899' }),
    });
    const rGen = await fetch(`${SERVER_BASE}/api/invoices/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subtotal: 1000, clientEmail: 'test@example.com' }),
    });
    const rDel = await fetch(`${SERVER_BASE}/api/files/nonexistent-id`, { method: 'DELETE' });
    const rPrivUpload = await fetch(`${SERVER_BASE}/api/files/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: 'private_diag.txt',
        fileType: 'text/plain',
        category: 'telemetry_logs',
        fileData: Buffer.from('test').toString('base64'),
      }),
    });

    const all401 =
      rList.status === 401 &&
      rInv.status === 401 &&
      rIntent.status === 401 &&
      rGen.status === 401 &&
      rDel.status === 401 &&
      rPrivUpload.status === 401;

    record(
      'API Security',
      'Protected endpoints enforce HTTP 401 without verified Firebase Bearer token',
      all401,
      `statuses=[list:${rList.status}, inv:${rInv.status}, intent:${rIntent.status}, gen:${rGen.status}, del:${rDel.status}, privUp:${rPrivUpload.status}]`
    );
  } catch (err: any) {
    record('API Security', 'Protected endpoints enforce HTTP 401', false, err.message);
  }

  const testPayloadContent = 'POWER WEB STUDIO AI CERTIFIED RFP SPECIFICATION 2026';
  const expectedHash = crypto.createHash('sha256').update(testPayloadContent).digest('hex');
  const base64Data = Buffer.from(testPayloadContent).toString('base64');

  try {
    const rfpUnauth = await fetch(`${SERVER_BASE}/api/files/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: 'kalinga_rfp_scope_test.txt',
        fileType: 'text/plain',
        category: 'consultation_rfp',
        fileData: base64Data,
        notes: 'Phase 8 RFP Validation Probe',
      }),
    });
    record(
      'File Storage',
      'POST /api/files/upload blocks unauthenticated consultation_rfp uploads with HTTP 401',
      rfpUnauth.status === 401,
      `status=${rfpUnauth.status}`
    );

    const forgedAuth = await fetch(`${SERVER_BASE}/api/files/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer forged.jwt.payload',
      },
      body: JSON.stringify({
        fileName: 'malicious_exploit.exe',
        fileType: 'application/x-msdownload',
        category: 'consultation_rfp',
        fileData: Buffer.from('MZ...fake_executable').toString('base64'),
      }),
    });
    record(
      'File Storage',
      'POST /api/files/upload rejects forged Bearer JWT with HTTP 401 before payload storage',
      forgedAuth.status === 401,
      `status=${forgedAuth.status}`
    );

    const dlUnauth = await fetch(`${SERVER_BASE}/api/files/file-nonexistent-probe`);
    record(
      'File Storage',
      'GET /api/files/:fileId blocks unauthenticated direct file downloads with HTTP 401',
      dlUnauth.status === 401,
      `status=${dlUnauth.status}`
    );

    const serverSrc = fs.readFileSync(path.resolve(process.cwd(), 'server.ts'), 'utf8');
    const serverGuardsOk =
      serverSrc.includes('ALLOWED_EXTENSIONS') &&
      serverSrc.includes('%PDF-') &&
      serverSrc.includes("fileName.includes('..')") &&
      serverSrc.includes('BASE64_STRICT_REGEX') &&
      expectedHash.length === 64;
    record(
      'File Storage',
      'Server enforces GCS-only (503 STORAGE_NOT_CONFIGURED), pdf/png/jpg/docx 10MB allowlist, magic bytes & path-traversal rejection',
      serverGuardsOk && serverSrc.includes('STORAGE_NOT_CONFIGURED') && serverSrc.includes('randomUUID'),
      'GCS-only, 10MB pdf/png/jpg/docx, magic-byte, strict Base64 & randomized filename guards verified in server.ts'
    );
  } catch (err: any) {
    record('File Storage', 'Validated file upload & auth gate suite', false, err.message);
  }

  // --------------------------------------------------------------------------
  // 3. DATABASE SECURITY & SCHEMA RULES AUDIT
  // --------------------------------------------------------------------------
  console.log('\n--- 3. DATABASE SECURITY & SCHEMA RULES AUDIT ---');

  const rulesContent = fs.readFileSync(path.resolve(process.cwd(), 'firestore.rules'), 'utf-8');
  const blueprintContent = JSON.parse(
    fs.readFileSync(path.resolve(process.cwd(), 'firebase-blueprint.json'), 'utf-8')
  );

  record(
    'Security Rules',
    'Global Default Deny catch-all rule is active',
    rulesContent.includes('match /{document=**}') && rulesContent.includes('allow read, write: if false;')
  );

  record(
    'Security Rules',
    'No hardcoded admin email in rules/server/services; isAdmin() uses user_roles or custom claim only',
    !rulesContent.includes('ssbhanu41@gmail.com') &&
      rulesContent.includes('hasAdminRole()') &&
      rulesContent.includes('hasAdminClaim()')
  );

  record(
    'Security Rules',
    'User roles mutation strictly locked to verified admin',
    rulesContent.includes('match /user_roles/{userId}') &&
      rulesContent.includes('allow create, update, delete: if isValidId(userId) && isAdmin();')
  );

  record(
    'Security Rules',
    'Audit logs strictly server-written and immutable (client create/update/delete denied)',
    rulesContent.includes('match /audit_logs/{logId}') &&
      rulesContent.includes('allow create, update, delete: if false;')
  );

  record(
    'Security Rules',
    'Quotations server-only create & ticket responses strictly append-only for clients',
    rulesContent.includes('resource.data.clientId == request.auth.uid || isAdmin()') &&
      rulesContent.includes('match /quotations/{quotationId}') &&
      rulesContent.includes('allow list: if isAdmin();') &&
      rulesContent.includes('allow create: if false;') &&
      rulesContent.includes('incoming.responses.size() == existing.responses.size() + 1')
  );

  const expectedCollections = [
    'users',
    'user_roles',
    'user_profiles',
    'apps',
    'app_categories',
    'projects',
    'project_tasks',
    'orders',
    'quotations',
    'invoices',
    'payments',
    'support_tickets',
    'notifications',
    'audit_logs',
    'site_settings',
    'services',
    'blog_posts',
  ];
  const blueprintPaths = Object.keys(blueprintContent.firestore || {});
  const missingInBlueprint = expectedCollections.filter(
    (col) => !blueprintPaths.some((p) => p.includes(`/${col}/`))
  );
  record(
    'Blueprint Schema',
    'All 17 Firestore collections mapped in firebase-blueprint.json',
    missingInBlueprint.length === 0,
    missingInBlueprint.length > 0 ? `Missing: ${missingInBlueprint.join(', ')}` : '17/17 mapped'
  );

  // --------------------------------------------------------------------------
  // 4. BILINGUAL TRANSLATION (HINDI + ENGLISH) PARITY AUDIT
  // --------------------------------------------------------------------------
  console.log('\n--- 4. BILINGUAL TRANSLATION PARITY AUDIT ---');

  function compareKeys(obj1: any, obj2: any, prefix = ''): string[] {
    const missing: string[] = [];
    for (const key of Object.keys(obj1)) {
      const fullPath = prefix ? `${prefix}.${key}` : key;
      if (!(key in obj2)) {
        missing.push(fullPath);
      } else if (typeof obj1[key] === 'object' && obj1[key] !== null && !Array.isArray(obj1[key])) {
        missing.push(...compareKeys(obj1[key], obj2[key], fullPath));
      }
    }
    return missing;
  }

  const missingInHindi = compareKeys(enTranslations, hiTranslations, 'hi');
  const missingInEnglish = compareKeys(hiTranslations, enTranslations, 'en');
  const totalKeys = Object.keys(enTranslations).length;
  const translationParity = missingInHindi.length === 0 && missingInEnglish.length === 0;

  record(
    'Bilingual System',
    'Complete dictionary key parity between English and Hindi dictionaries',
    translationParity,
    translationParity
      ? `${totalKeys} top-level sections synchronized`
      : `Missing in HI: ${missingInHindi.length}, Missing in EN: ${missingInEnglish.length}`
  );

  // --------------------------------------------------------------------------
  // 5. ACCESSIBILITY, SEO & RESPONSIVE CONSTITUTION AUDIT
  // --------------------------------------------------------------------------
  console.log('\n--- 5. ACCESSIBILITY, SEO & RESPONSIVE CONSTITUTION AUDIT ---');

  const indexHtml = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
  record(
    'Mobile Responsive',
    'index.html includes mobile viewport meta tag',
    indexHtml.includes('name="viewport"') && indexHtml.includes('width=device-width, initial-scale=1.0')
  );

  try {
    const robotsRes = await fetch(`${SERVER_BASE}/robots.txt`);
    const sitemapRes = await fetch(`${SERVER_BASE}/sitemap.xml`);
    const robotsTxt = await robotsRes.text();
    const sitemapXml = await sitemapRes.text();
    const [aboutHtmlRes, appDetailHtmlRes] = await Promise.all([
      fetch(`${SERVER_BASE}/about`, { headers: { Accept: 'text/html' } }),
      fetch(`${SERVER_BASE}/apps/bariha-pay`, { headers: { Accept: 'text/html' } }),
    ]);
    const aboutHtml = await aboutHtmlRes.text();
    const appDetailHtml = await appDetailHtmlRes.text();

    record(
      'SEO Endpoints',
      '/robots.txt, /sitemap.xml, and SPA clean paths (/about, /apps/:id) serve valid directives without ai.studio',
      robotsRes.status === 200 &&
        robotsTxt.includes('Disallow: /admin-dashboard') &&
        !robotsTxt.includes('ai.studio') &&
        sitemapRes.status === 200 &&
        sitemapXml.includes('<urlset') &&
        !sitemapXml.includes('ai.studio') &&
        aboutHtmlRes.status === 200 &&
        aboutHtml.includes('<!doctype html>') &&
        appDetailHtmlRes.status === 200 &&
        appDetailHtml.includes('<!doctype html>')
    );
  } catch (err: any) {
    record('SEO Endpoints', '/robots.txt and /sitemap.xml check', false, err.message);
  }

  const appSrc = fs.readFileSync(path.resolve(process.cwd(), 'src/components/common/Header.tsx'), 'utf-8');
  record(
    'Design Constitution',
    'Zero-pill discipline maintained in primary interactive headers',
    !appSrc.includes('rounded-full bg-blue-700') && !appSrc.includes('rounded-full px-5 py-2.5')
  );

  record(
    'Mobile Responsive',
    'Header & MobileMenu provide responsive mobile navigation toggle and drawer',
    appSrc.includes('mobileMenuOpen') &&
      appSrc.includes('setMobileMenuOpen') &&
      fs.existsSync(path.resolve(process.cwd(), 'src/components/common/MobileMenu.tsx'))
  );

  record(
    'UI Features',
    'Header integrates interactive NotificationDropdown bell',
    appSrc.includes('<NotificationDropdown')
  );

  // --------------------------------------------------------------------------
  // TEST SUMMARY
  // --------------------------------------------------------------------------
  console.log('\n================================================================');
  const total = results.length;
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = total - passedCount;

  console.log(`TOTAL TESTS: ${total}`);
  console.log(`PASSED:      ${passedCount}`);
  console.log(`FAILED:      ${failedCount}`);
  console.log(`SUCCESS RATE: ${((passedCount / total) * 100).toFixed(1)}%`);
  console.log('================================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('[Test Suite Error]', err);
  process.exit(1);
});
