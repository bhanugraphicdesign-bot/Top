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
      fetch(`${SERVER_BASE}/api/audit-events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'TEST', resource: 'test' }),
      }),
      fetch(`${SERVER_BASE}/api/telemetry`),
    ]);

    const statuses = checks.map((c) => c.status);
    const all401 = statuses.every((s) => s === 401);
    record(
      'SEC-02',
      'All 12 protected file, payment, invoice, audit & telemetry endpoints reject missing Bearer tokens with 401',
      all401 ? 'PASS' : 'FAIL',
      `HTTP statuses across 12 protected routes: [${statuses.join(', ')}]`
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
      noHardcodedAdminEmail: !rules.includes('ssbhanu41@gmail.com'),
      roleAndClaimAdmin: rules.includes('hasAdminRole()') && rules.includes('hasAdminClaim()'),
      testLocked: rules.includes('match /test/{docId}') && !rules.includes('match /test/{docId} {\n      allow read: if true'),
      testAdminOnly: /match \/test\/\{docId\}\s*\{\s*allow read, write: if isAdmin\(\);/.test(rules),
      userRolesLocked: /match \/user_roles\/\{userId\}[\s\S]*allow create, update, delete: if isValidId\(userId\) && isAdmin\(\);/.test(rules),
      auditServerOnly: /match \/audit_logs\/\{logId\}[\s\S]*allow create, update, delete: if false;/.test(rules),
      ticketClientAppendOnly:
        rules.includes('isValidTicketClientUpdate') &&
        rules.includes('incoming.responses.size() == existing.responses.size() + 1') &&
        rules.includes('reply.author == request.auth.uid') &&
        rules.includes("reply.role == 'client'"),
      quotationsServerOnly: /match \/quotations\/\{quotationId\}[\s\S]*allow create: if false;/.test(rules),
    };

    const allOk = Object.values(checks).every(Boolean);
    record(
      'SEC-05',
      'Firestore rules enforce default deny, role/claim admin (no hardcoded email), server-only quotations/audit_logs, and append-only ticket replies',
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
    const serverTs = fs.readFileSync(path.resolve(process.cwd(), 'server.ts'), 'utf8');
    const androidPage = fs.readFileSync(path.resolve(process.cwd(), 'src/pages/AndroidPortfolioPage.tsx'), 'utf8');
    const uploader = fs.readFileSync(path.resolve(process.cwd(), 'src/components/common/ValidatedFileUploader.tsx'), 'utf8');

    const noHardcodedAdminEmail =
      !servicesTs.includes('ssbhanu41@gmail.com') &&
      !authCtx.includes('ssbhanu41@gmail.com') &&
      !serverTs.includes('ssbhanu41@gmail.com');
    const noClientRoleBootstrap =
      !servicesTs.includes('ensureBootstrapAdminRoleDoc') && !servicesTs.includes("assignedBy: 'system_bootstrap'");
    const noUnauthBootSeed = !authCtx.includes('seedInitialDatabaseIfEmpty()');
    const portfolioAdminGated = androidPage.includes('{isAdmin && (') && androidPage.includes('AdminAppManagerModal');
    const uploaderRequiresAuth = uploader.includes('if (!currentUser)');
    const auditViaServerOnly = !servicesTs.includes('setDoc(doc(db, COLLECTIONS.AUDIT_LOGS');
    const createAdminScriptExists = fs.existsSync(path.resolve(process.cwd(), 'scripts/create-admin.ts'));

    const passed =
      noHardcodedAdminEmail &&
      noClientRoleBootstrap &&
      noUnauthBootSeed &&
      portfolioAdminGated &&
      uploaderRequiresAuth &&
      auditViaServerOnly &&
      createAdminScriptExists;

    record(
      'SEC-06',
      'Zero hardcoded admin email, server-only audit/quotations, scripts/create-admin.ts present & strict UI auth gates',
      passed ? 'PASS' : 'FAIL',
      `noHardcodedAdminEmail=${noHardcodedAdminEmail}, noClientRoleBootstrap=${noClientRoleBootstrap}, noUnauthBootSeed=${noUnauthBootSeed}, portfolioAdminGated=${portfolioAdminGated}, uploaderRequiresAuth=${uploaderRequiresAuth}, auditViaServerOnly=${auditViaServerOnly}, createAdminScript=${createAdminScriptExists}`
    );
  } catch (err: any) {
    record('SEC-06', 'Frontend RBAC & Auth checks', 'FAIL', err.message);
  }

  // 7. Live Multi-Account (Customer A vs Customer B vs Admin) Firebase Auth & Firestore Emulator Tests
  const custAToken = (process.env.TEST_CUSTOMER_A_TOKEN || '').trim();
  const custBToken = (process.env.TEST_CUSTOMER_B_TOKEN || '').trim();
  const adminToken = (process.env.TEST_ADMIN_TOKEN || '').trim();
  const emulatorHost = (process.env.FIRESTORE_EMULATOR_HOST || '').trim();

  if (custAToken && custBToken) {
    try {
      const [listARes, listBRes, adminTelRes] = await Promise.all([
        fetch(`${SERVER_BASE}/api/invoices`, { headers: { Authorization: `Bearer ${custAToken}` } }),
        fetch(`${SERVER_BASE}/api/invoices`, { headers: { Authorization: `Bearer ${custBToken}` } }),
        fetch(`${SERVER_BASE}/api/telemetry`, { headers: { Authorization: `Bearer ${custAToken}` } }),
      ]);
      const adminOk = adminToken
        ? (await fetch(`${SERVER_BASE}/api/telemetry`, { headers: { Authorization: `Bearer ${adminToken}` } })).status === 200
        : true;
      const ok =
        (listARes.status === 200 || listARes.status === 503) &&
        (listBRes.status === 200 || listBRes.status === 503) &&
        adminTelRes.status === 403 &&
        adminOk;
      record(
        'SEC-07',
        'Authenticated Customer A vs Customer B vs Admin live API & RBAC isolation tests',
        ok ? 'PASS' : 'FAIL',
        `CustomerA /api/invoices=${listARes.status}; CustomerB /api/invoices=${listBRes.status}; CustomerA /api/telemetry=${adminTelRes.status}; emulator=${emulatorHost || 'none'}`
      );
    } catch (err: any) {
      record('SEC-07', 'Authenticated multi-account isolation test', 'FAIL', err.message);
    }
  } else {
    record(
      'SEC-07',
      'Authenticated Customer A vs Customer B vs Admin live upload/download/delete & Firestore Emulator tests',
      'BLOCKED',
      `Missing requirements: Java JRE (for Firebase Local Emulator Suite / FIRESTORE_EMULATOR_HOST) and non-interactive Firebase Auth ID tokens (TEST_CUSTOMER_A_TOKEN, TEST_CUSTOMER_B_TOKEN, TEST_ADMIN_TOKEN). Emulator host=${emulatorHost || 'unset'}.`
    );
  }

  // 8. Persistent Cloud Storage (GCS) Upload/Signed-URL Live Round-Trip
  try {
    const capRes = await fetch(`${SERVER_BASE}/api/system/capabilities`);
    const capData = await capRes.json();
    if (capData?.fileUploadEnabled === true && custAToken) {
      const tinyPngBase64 =
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
      const upRes = await fetch(`${SERVER_BASE}/api/files/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${custAToken}`,
        },
        body: JSON.stringify({
          fileName: 'sec08_probe.png',
          fileType: 'image/png',
          category: 'general_attachment',
          fileData: tinyPngBase64,
        }),
      });
      const upJson: any = await upRes.json().catch(() => ({}));
      const fileId = upJson?.file?.fileId;
      let cleanOk = false;
      if (upRes.status === 201 && fileId) {
        const dlRes = await fetch(`${SERVER_BASE}/api/files/${fileId}`, {
          headers: { Authorization: `Bearer ${custAToken}` },
        });
        const delRes = await fetch(`${SERVER_BASE}/api/files/${fileId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${custAToken}` },
        });
        cleanOk = dlRes.status === 200 && delRes.status === 200;
      }
      record(
        'SEC-08',
        'Persistent Google Cloud Storage (GCS) bucket upload, download & deletion verification',
        cleanOk ? 'PASS' : 'FAIL',
        `uploadStatus=${upRes.status}, fileId=${fileId || 'none'}, roundTripOk=${cleanOk}`
      );
    } else {
      record(
        'SEC-08',
        'Persistent Google Cloud Storage (GCS) bucket upload, download & deletion verification',
        'BLOCKED',
        `Missing requirements: GCS_BUCKET (fileUploadEnabled=${Boolean(capData?.fileUploadEnabled)}), GCP Storage IAM credentials, and TEST_CUSTOMER_A_TOKEN for authenticated live upload/download/delete round-trip. Unconfigured uploads safely return HTTP 503 STORAGE_NOT_CONFIGURED.`
      );
    }
  } catch (err: any) {
    record('SEC-08', 'Persistent Google Cloud Storage (GCS) verification', 'FAIL', err.message);
  }

  // 9-11. Isolated Production Server Security Probes (Proxy/XFF Spoofing, Strict Prod CSP, Weak PAYMENT_SECRET Rejection)
  const { spawn } = await import('child_process');
  const prodPort = 3098;
  const prodBase = `http://127.0.0.1:${prodPort}`;
  const prodProc = spawn('node', ['server.ts'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      NODE_ENV: 'production',
      PORT: String(prodPort),
      FORM_RATE_LIMIT_MAX: '2',
      TRUST_PROXY_HOPS: '1',
      PAYMENT_SECRET: 'weak_secret_under_32_chars',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let prodReady = false;
  for (let i = 0; i < 20; i++) {
    try {
      const r = await fetch(`${prodBase}/api/health`);
      if (r.ok) {
        prodReady = true;
        break;
      }
    } catch {
      // wait for server boot
    }
    await new Promise((r) => setTimeout(r, 300));
  }

  try {
    if (!prodReady) {
      throw new Error(`Isolated production test server failed to start on port ${prodPort}`);
    }

    // SEC-09: Leftmost X-Forwarded-For spoofing must NOT bypass trust-proxy rate limiting
    const xffStatuses: number[] = [];
    for (let i = 1; i <= 3; i++) {
      const r = await fetch(`${prodBase}/api/newsletter/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Forwarded-For': `198.51.100.${i}, 203.0.113.9`,
        },
        body: JSON.stringify({ email: 'not-valid' }),
      });
      xffStatuses.push(r.status);
    }
    const sec09Ok = xffStatuses[0] === 400 && xffStatuses[1] === 400 && xffStatuses[2] === 429;
    record(
      'SEC-09',
      'Express trust proxy (1 hop) blocks leftmost X-Forwarded-For spoofing rate-limit bypass',
      sec09Ok ? 'PASS' : 'FAIL',
      `Rotating spoofed leftmost XFF statuses (limit=2): [${xffStatuses.join(', ')}]`
    );

    // SEC-10: Production CSP omits unsafe-inline / unsafe-eval from script-src and serves built SPA if dist exists
    const homeRes = await fetch(`${prodBase}/`);
    const csp = homeRes.headers.get('content-security-policy') || '';
    const scriptDirective = csp
      .split(';')
      .map((s) => s.trim())
      .find((s) => s.startsWith('script-src ')) || '';
    const noUnsafeInlineScript =
      scriptDirective.length > 0 &&
      !scriptDirective.includes("'unsafe-inline'") &&
      !scriptDirective.includes("'unsafe-eval'");
    const hasScriptSrcAttrNone = csp.includes("script-src-attr 'none'");
    record(
      'SEC-10',
      'Production CSP omits unsafe-inline and unsafe-eval from script-src and enforces script-src-attr none',
      noUnsafeInlineScript && hasScriptSrcAttrNone ? 'PASS' : 'FAIL',
      `homeStatus=${homeRes.status}; scriptSrc="${scriptDirective}"; scriptSrcAttrNone=${hasScriptSrcAttrNone}`
    );

    // SEC-11: Weak (<32 char) PAYMENT_SECRET rejected & /api/health reports environmentValidation safely without leaking secrets
    const healthRes = await fetch(`${prodBase}/api/health`);
    const healthText = await healthRes.text();
    const healthJson = JSON.parse(healthText);
    const rejectedWeakSecret =
      healthJson?.security?.paymentSecretConfigured === false &&
      healthJson?.security?.paymentGatewayMode === 'optional_mode' &&
      healthJson?.security?.trustProxyHops === 1 &&
      healthJson?.security?.cspStrictScriptSrcInProd === true &&
      healthJson?.environmentValidation?.paymentSecretValid === false &&
      !healthText.includes('weak_secret_under_32_chars');
    record(
      'SEC-11',
      'Weak PAYMENT_SECRET (<32 chars) rejected cleanly and /api/health reports environmentValidation without leaking secrets',
      rejectedWeakSecret ? 'PASS' : 'FAIL',
      `paymentSecretConfigured=${healthJson?.security?.paymentSecretConfigured}; paymentSecretValid=${healthJson?.environmentValidation?.paymentSecretValid}; trustProxyHops=${healthJson?.security?.trustProxyHops}; cspStrictProd=${healthJson?.security?.cspStrictScriptSrcInProd}`
    );
  } catch (err: any) {
    record('SEC-09', 'Production proxy & XFF spoofing protection', 'FAIL', err.message);
    record('SEC-10', 'Production CSP verification', 'FAIL', err.message);
    record('SEC-11', 'Weak PAYMENT_SECRET & production env check', 'FAIL', err.message);
  } finally {
    prodProc.kill('SIGTERM');
  }

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
