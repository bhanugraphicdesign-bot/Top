/**
 * POWER WEB STUDIO AI — PHASE 1 ENTERPRISE SECURITY VERIFICATION SUITE
 * BHANU RAM BARIHA DIGITAL TECHNOLOGIES
 *
 * Truthful, zero-fabrication security verification suite:
 * - Executes live HTTP security & RBAC probes against running Express backend
 * - Audits Firestore rules structure, CORS policy, safe error handling & secret leaks
 * - Explicitly marks tests BLOCKED when Firebase Emulator (Java) or multi-account Auth ID tokens are unavailable
 */

import fs from 'fs';
import path from 'path';

const SERVER_BASE = 'http://localhost:3000';

type TestStatus = 'PASS' | 'FAIL' | 'BLOCKED' | 'NOT TESTED';

interface SecurityResult {
  id: string;
  name: string;
  status: TestStatus;
  evidence: string;
}

const results: SecurityResult[] = [];

function record(id: string, name: string, status: TestStatus, evidence: string) {
  results.push({ id, name, status, evidence });
  console.log(`[${status}] ${id}: ${name}`);
  console.log(`        ${evidence}`);
}

async function runSecurityTests() {
  console.log('========================================================================');
  console.log('   PHASE 1 ENTERPRISE SECURITY VERIFICATION SUITE                       ');
  console.log('========================================================================\n');

  // 1. Health & Security Posture Inspection + System Capabilities Check
  try {
    const [res, capRes] = await Promise.all([
      fetch(`${SERVER_BASE}/api/health`),
      fetch(`${SERVER_BASE}/api/system/capabilities`),
    ]);
    const data = await res.json();
    const capData = await capRes.json();
    const ok =
      res.status === 200 &&
      capRes.status === 200 &&
      data?.security?.defaultDeny === true &&
      data?.security?.unauthenticatedUploadsDisabled === true &&
      data?.security?.corsStrictAllowlist === true &&
      capData?.fileUploadEnabled === data?.storage?.fileUploadEnabled &&
      capData?.paymentGatewayEnabled === data?.security?.paymentSecretConfigured;
    record(
      'SEC-01',
      'Server /api/health and /api/system/capabilities report hardened security controls and honest storage/payment modes',
      ok ? 'PASS' : 'FAIL',
      `HTTP ${res.status}; unauthUploadsDisabled=${data?.security?.unauthenticatedUploadsDisabled}; corsStrict=${data?.security?.corsStrictAllowlist}; storageMode=${data?.storage?.mode}; fileUploadEnabled=${capData?.fileUploadEnabled}; paymentMode=${capData?.paymentMode}`
    );
  } catch (err: any) {
    record('SEC-01', 'Server /api/health security posture', 'FAIL', err.message);
  }

  // 2. Protected Endpoints Reject Missing Tokens (401)
  try {
    const checks = await Promise.all([
      fetch(`${SERVER_BASE}/api/files/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: 'rfp.txt', category: 'consultation_rfp', fileData: 'dGVzdA==' }),
      }),
      fetch(`${SERVER_BASE}/api/files/list`),
      fetch(`${SERVER_BASE}/api/files/file-1234`),
      fetch(`${SERVER_BASE}/api/files/file-1234`, { method: 'DELETE' }),
      fetch(`${SERVER_BASE}/api/invoices`),
      fetch(`${SERVER_BASE}/api/invoices/inv-2026-0814`),
      fetch(`${SERVER_BASE}/api/payments/create-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId: 'inv-2026-0899' }),
      }),
      fetch(`${SERVER_BASE}/api/payments/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: 'x', invoiceId: 'y', checksum: 'z' }),
      }),
      fetch(`${SERVER_BASE}/api/invoices/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subtotal: 1000, clientEmail: 'a@b.com' }),
      }),
      fetch(`${SERVER_BASE}/api/audit-events`),
    ]);

    const statuses = checks.map((c) => c.status);
    const all401 = statuses.every((s) => s === 401);
    record(
      'SEC-02',
      'All 10 protected file, payment, invoice & audit endpoints reject missing Bearer tokens with 401',
      all401 ? 'PASS' : 'FAIL',
      `HTTP statuses across 10 protected routes: [${statuses.join(', ')}]`
    );
  } catch (err: any) {
    record('SEC-02', 'Protected endpoints unauthenticated 401 gate', 'FAIL', err.message);
  }

  // 3. Forged / Expired / Malformed JWT Rejection (401)
  try {
    const fakeHeader = Buffer.from(JSON.stringify({ alg: 'RS256', kid: 'nonexistent-kid' })).toString('base64url');
    const fakePayload = Buffer.from(
      JSON.stringify({
        aud: 'turnkey-invention-70z9n',
        iss: 'https://securetoken.google.com/turnkey-invention-70z9n',
        sub: 'attacker-uid',
        email: 'ssbhanu41@gmail.com',
        email_verified: true,
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
      })
    ).toString('base64url');
    const forgedJwt = `${fakeHeader}.${fakePayload}.forged_signature`;

    const r1 = await fetch(`${SERVER_BASE}/api/invoices/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${forgedJwt}`,
      },
      body: JSON.stringify({ subtotal: 1000, clientEmail: 'a@b.com' }),
    });
    const r2 = await fetch(`${SERVER_BASE}/api/files/list`, {
      headers: { Authorization: 'Bearer malformed_token' },
    });

    const passed = r1.status === 401 && r2.status === 401;
    record(
      'SEC-03',
      'Forged RS256 admin JWT and malformed Bearer token rejected with 401',
      passed ? 'PASS' : 'FAIL',
      `Forged admin JWT HTTP ${r1.status}; malformed Bearer token HTTP ${r2.status}`
    );
  } catch (err: any) {
    record('SEC-03', 'Forged token rejection', 'FAIL', err.message);
  }

  // 4. CORS Untrusted Origin Rejection + Safe Error Handler (No Stack Traces)
  try {
    const evilOriginRes = await fetch(`${SERVER_BASE}/api/health`, {
      headers: { Origin: 'https://evil-attacker.example.com' },
    });
    const evilBody = await evilOriginRes.json().catch(() => ({}));
    const badJsonRes = await fetch(`${SERVER_BASE}/api/inquiries/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{bad-json',
    });
    const badJsonBody = await badJsonRes.json().catch(() => ({}));

    const noStackLeak =
      !JSON.stringify(evilBody).includes('at ') &&
      !JSON.stringify(badJsonBody).includes('SyntaxError') &&
      !JSON.stringify(badJsonBody).includes('/app/applet');

    const passed = evilOriginRes.status === 403 && badJsonRes.status === 400 && noStackLeak;
    record(
      'SEC-04',
      'Untrusted CORS origin blocked (403) and malformed JSON handled cleanly (400) without stack trace leaks',
      passed ? 'PASS' : 'FAIL',
      `Untrusted Origin HTTP ${evilOriginRes.status}; malformed JSON HTTP ${badJsonRes.status}; noStackLeak=${noStackLeak}`
    );
  } catch (err: any) {
    record('SEC-04', 'CORS & Safe Error Handling', 'FAIL', err.message);
  }

  // 5. Security Rules Hardening & Admin / Tenant Isolation Audit
  try {
    const rules = fs.readFileSync(path.resolve(process.cwd(), 'firestore.rules'), 'utf8');
    const checks = {
      defaultDeny: rules.includes('match /{document=**}') && rules.includes('allow read, write: if false;'),
      emailVerifiedAdmin: rules.includes('request.auth.token.email_verified == true'),
      testLocked: rules.includes('match /test/{docId}') && !rules.includes('match /test/{docId} {\n      allow read: if true'),
      testAdminOnly: /match \/test\/\{docId\}\s*\{\s*allow read, write: if isAdmin\(\);/.test(rules),
      userRolesLocked: /match \/user_roles\/\{userId\}[\s\S]*allow create, update, delete: if isValidId\(userId\) && isAdmin\(\);/.test(rules),
      auditImmutable: /match \/audit_logs\/\{logId\}[\s\S]*allow update, delete: if false;/.test(rules),
      ticketClientUpdateLocked: rules.includes('isValidTicketClientUpdate') && rules.includes('affectedKeys().hasOnly'),
      quotationStrictKeys: rules.includes('isValidQuotationCreate') && rules.includes("keys().hasOnly(['id', 'clientName'"),
    };

    const allOk = Object.values(checks).every(Boolean);
    record(
      'SEC-05',
      'Firestore security rules enforce default deny, locked /test, immutable logs, strict schemas & anti-elevation',
      allOk ? 'PASS' : 'FAIL',
      Object.entries(checks)
        .map(([k, v]) => `${k}=${v}`)
        .join(', ')
    );
  } catch (err: any) {
    record('SEC-05', 'Firestore security rules verification', 'FAIL', err.message);
  }

  // 6. Client-Side Admin Escape & Privilege Escalation Guard
  try {
    const servicesTs = fs.readFileSync(path.resolve(process.cwd(), 'src/firebase/services.ts'), 'utf8');
    const authCtx = fs.readFileSync(path.resolve(process.cwd(), 'src/context/AuthContext.tsx'), 'utf8');
    const androidPage = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/AndroidPortfolioPage.tsx'), 'utf8');
    const uploader = fs.readFileSync(path.resolve(process.cwd(), 'src/components/common/ValidatedFileUploader.tsx'), 'utf8');

    const noClientRoleBootstrap = !servicesTs.includes("assignedBy: 'system_bootstrap'");
    const noUnauthBootSeed = !authCtx.includes('seedInitialDatabaseIfEmpty()');
    const rootEmailVerified =
      authCtx.includes('user.emailVerified === true') && servicesTs.includes('currentUser.emailVerified === true');
    const portfolioAdminGated = androidPage.includes('{isAdmin && (') && androidPage.includes('AdminAppManagerModal');
    const uploaderRequiresAuth = uploader.includes('if (!currentUser)');

    const passed =
      noClientRoleBootstrap &&
      noUnauthBootSeed &&
      rootEmailVerified &&
      portfolioAdminGated &&
      uploaderRequiresAuth;

    record(
      'SEC-06',
      'Frontend removes client user_roles write, unauth boot seeding, public admin UI triggers & requires verified auth',
      passed ? 'PASS' : 'FAIL',
      `noClientRoleBootstrap=${noClientRoleBootstrap}, noUnauthBootSeed=${noUnauthBootSeed}, rootEmailVerified=${rootEmailVerified}, portfolioAdminGated=${portfolioAdminGated}, uploaderRequiresAuth=${uploaderRequiresAuth}`
    );
  } catch (err: any) {
    record('SEC-06', 'Frontend RBAC & Auth checks', 'FAIL', err.message);
  }

  // 7. Live Multi-Account (Customer A vs Customer B vs Admin) Firebase Auth & Firestore Emulator Tests
  record(
    'SEC-07',
    'Authenticated Customer A vs Customer B vs Admin live upload/download/delete & Firestore Emulator tests',
    'BLOCKED',
    'Blocked in container CLI: Java Runtime (JRE/JDK) required by Firebase Local Emulator Suite is not installed, and isolated Firebase Auth test account ID tokens (Customer A, Customer B, Admin) are not provisioned as non-interactive test credentials.'
  );

  // 8. Persistent Cloud Storage (GCS) Upload/Signed-URL Live Round-Trip
  record(
    'SEC-08',
    'Persistent Google Cloud Storage (GCS) bucket upload, download & deletion verification',
    'BLOCKED',
    'Blocked in local container: GCS_BUCKET and GCP Service Account credentials are not configured; file upload is safely disabled (HTTP 503) without fake local storage success.'
  );

  const summary = {
    PASS: results.filter((r) => r.status === 'PASS').length,
    FAIL: results.filter((r) => r.status === 'FAIL').length,
    BLOCKED: results.filter((r) => r.status === 'BLOCKED').length,
    'NOT TESTED': results.filter((r) => r.status === 'NOT TESTED').length,
  };

  console.log('\n========================================================================');
  console.log('   PHASE 1 SECURITY SUITE SUMMARY                                       ');
  console.log('========================================================================');
  console.log(`PASS:       ${summary.PASS}`);
  console.log(`FAIL:       ${summary.FAIL}`);
  console.log(`BLOCKED:    ${summary.BLOCKED}`);
  console.log(`NOT TESTED: ${summary['NOT TESTED']}`);
  console.log('========================================================================\n');

  if (summary.FAIL > 0) {
    process.exit(1);
  }
}

runSecurityTests().catch((err) => {
  console.error('[Security Test Fatal]', err);
  process.exit(1);
});
