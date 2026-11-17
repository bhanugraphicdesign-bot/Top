# POWER WEB STUDIO AI — ENTERPRISE PENETRATION TEST & FIREBASE SECURITY AUDIT REPORT

**Company:** BHANU RAM BARIHA DIGITAL TECHNOLOGIES  
**Project:** POWER WEB STUDIO AI — Enterprise Digital Platform  
**Firebase Project ID:** `turnkey-invention-70z9n`  
**Cloud Firestore Database (Enterprise Edition):** `ai-studio-powerwebstudioai-4b6a19ad-e6d7-4bd0-a968-9c08eb07a897`  
**Audit Role:** Independent Enterprise Application Penetration-Testing & Firebase Security Engineering Team  
**Audit Date:** 2026-11-16  

---

## 1. EXECUTIVE SUMMARY

An end-to-end source-code audit, threat-model penetration assessment, live Express HTTP security probe, Firestore Security Rules hardening audit, and client/server verification pass was performed across all 9 required security domains without weakening any security controls.

### Overall Security Verdict
- **Confirmed Code & Control Defects Repaired:** 10 verified defects across payment anti-fake-settlement, CORS/CSRF defense, App Check token rejection, JWT `sub` validation, file download CSP sandboxing, canonical upload MIME typing, expired Firebase ID token auto-refresh, and Firestore Security Rules schema/value-poisoning guards.
- **Automated Security Suite (`npx tsx tests/security_audit_test.ts`):** **12 PASS, 0 FAIL, 2 BLOCKED** (`SEC-07` Multi-Tenant Live Tokens/Emulator, `SEC-08` Live GCS Bucket Round-Trip).
- **QA & Security Runner (`npm test` / `tests/qa_audit_runner.ts`):** **8 PASS, 0 FAIL, 3 NOT VERIFIED** (`TEST 3` Headless Viewport Rendering, `TEST 6` Interactive Google OAuth Popup, `TEST 8` Live Dual-Account Cross-Tenant Runtime).
- **Phase 8 Comprehensive Suite (`npx tsx tests/phase8_test_suite.ts`):** **24 PASS, 0 FAIL**.
- **Dependency Advisory Audit (`npm audit --json`):** **0 Critical, 0 High**, 11 Moderate (all inside dev/lint tooling: `eslint`, `@typescript-eslint/*`, `@firebase/eslint-plugin-security-rules`, `minimatch`), 1 Low (`esbuild`).

---

## 2. SECURITY REPAIRS APPLIED IN THIS ENGAGEMENT

| # | Vulnerability / Defect Identified | Severity | Root Cause & Exploit Path | Repair Implemented | Changed Files |
|---|---|---|---|---|---|
| 1 | **Client Self-Signed Fake Payment Settlement** | **CRITICAL** | When `PAYMENT_SECRET` was configured (as in this runtime where `paymentGatewayEnabled: true`), `POST /api/payments/create-intent` returned `checksum` to the browser and `ClientDashboardPage.tsx` immediately echoed it back to `POST /api/payments/verify`, letting any invoice owner settle an unpaid invoice (`status: 'paid'`) with a fabricated UTR without real payment confirmation. | Split external gateway attestation into `PAYMENT_WEBHOOK_SECRET` (`>= 32` chars); bound `expiresAt` into intent HMAC; blocked non-admin callers on `POST /api/payments/verify` unless a valid `X-Payment-Gateway-Signature` HMAC over `${orderId}:${invoice.id}:${invoice.totalAmount}:${normalizedTxnRef}` and `normalizedTxnRef` are provided (returning `403 PAYMENT_GATEWAY_VERIFICATION_REQUIRED` + audit log `PAYMENT_FAKE_SETTLEMENT_BLOCKED`); updated `ClientDashboardPage.tsx` to never attempt self-signed browser settlement when webhook verification is unconfigured. | `server.ts`, `src/pages/ClientDashboardPage.tsx`, `.env.example` |
| 2 | **Duplicate Transaction Reference Replay** | **HIGH** | `POST /api/payments/verify` lacked atomic uniqueness locking on `transactionRef`, allowing duplicate UTR strings across payment retries or races. | Added atomic Firestore transaction lock document `payment_intents/TXN_${sha256(normalizedTxnRef.toLowerCase())}` inside `runTransaction`, rejecting duplicate transaction refs with `HTTP 409` while guaranteeing single-use payment intents (`intent.used`). | `server.ts` |
| 3 | **Silent App Check Bypass & Ignored Invalid Headers** | **HIGH** | `verifyAppCheckForForm` skipped verification of invalid `X-Firebase-AppCheck` headers when `ENFORCE_APP_CHECK` was unset, and `!HAS_RECAPTCHA_SITE_KEY` prevented `ENFORCE_APP_CHECK=true` enforcement if the site key was only baked into the Vite client bundle. | Any supplied `X-Firebase-AppCheck` header is now **always verified** and rejected with `403 APP_CHECK_INVALID` (or `503 APP_CHECK_NOT_CONFIGURED` if Admin SDK is absent) regardless of `ENFORCE_APP_CHECK`. Missing tokens are permitted only when `!HAS_RECAPTCHA_SITE_KEY && !ENFORCE_APP_CHECK`. | `server.ts` |
| 4 | **CORS Credentials & Missing Non-JSON CSRF Guard** | **MEDIUM** | CORS allowed `credentials: true` even though API authentication relies exclusively on explicit `Authorization: Bearer` headers (never cookies), and `express.urlencoded` was enabled globally while JSON POST endpoints lacked explicit `application/json` content-type validation. | Changed CORS to `credentials: false` (exposing `X-Payment-Gateway-Signature` in `allowedHeaders`); removed global `express.urlencoded`; added `requireJsonContentType` middleware (`HTTP 415 Unsupported Media Type`) across all POST mutation routes (`/api/inquiries/validate`, `/api/quotations`, `/api/newsletter/subscribe`, `/api/files/upload`, `/api/audit-events`, `/api/payments/create-intent`, `/api/payments/verify`, `/api/invoices/generate`). | `server.ts` |
| 5 | **Permissive JWT `sub` & Synthetic MIME / Download Headers** | **MEDIUM** | Fallback RS256 JWT verifier accepted arbitrary non-empty `sub` strings; file downloads lacked strict CSP execution sandboxing; upload metadata fell back to synthetic `application/${ext}` if MIME differed. | Enforced `SAFE_ID_REGEX.test(payload.sub)` in JWT fallback; mapped upload content type cleanly through `EXTENSION_CANONICAL_MIME`; added `Content-Security-Policy: default-src 'none'; sandbox` alongside `X-Content-Type-Options: nosniff` and `Content-Disposition: attachment` on `GET /api/files/:fileId`. | `server.ts` |
| 6 | **Firestore Rules Email Spoofing & Timestamp / Metadata Poisoning** | **MEDIUM** | `isValidUserCreate` did not bind `data.email` to `request.auth.token.email`; `isValidTicketClientUpdate` omitted `updatedAt` type/time checks; `notifications` lacked `linkParams` size cap and immutable `userId` / valid `readAt` checks on mark-as-read updates. | Hardened `isValidUserCreate` (`!('email' in request.auth.token) || data.email == request.auth.token.email`), `isValidTicketClientUpdate` (`updatedAt` check), `isValidUserNotificationCreate` (`linkParams.size() <= 10`), and `notifications` update (`userId` unchanged + `readAt` validation). Verified cleanly with `npm run lint` (`@firebase/eslint-plugin-security-rules`). | `firestore.rules` |
| 7 | **Expired Firebase ID Token Handling Gap Across Frontend Callers** | **MEDIUM** | Only `ValidatedFileUploader.tsx` forced `getIdToken(true)` on `401`. Other callers (`AuthContext`, `services.ts`, `ClientDashboardPage`, `AdminDashboardPage`) failed immediately when a short-lived ID token expired mid-session. | Added shared `authenticatedFetch()` helper in `src/firebase/services.ts` that automatically forces `targetUser.getIdToken(true)` and retries once on `HTTP 401`, wired into `AuthContext.tsx`, `isCurrentUserVerifiedAdmin`, `logAuditEvent`, `getAuditLogs`, `submitQuotation`, `ClientDashboardPage.tsx`, and `AdminDashboardPage.tsx`. | `src/firebase/services.ts`, `src/context/AuthContext.tsx`, `src/pages/ClientDashboardPage.tsx`, `src/pages/AdminDashboardPage.tsx` |

> **Important Note on Live Rules Parity:** `firestore.rules` has been hardened and linted locally (`eslint .`), but was **not** deployed to the live Firebase project `turnkey-invention-70z9n` during this audit so production cloud configuration remains untouched pending deployment approval.

---

## 3. VERIFICATION MATRIX ACROSS ALL 9 SECURITY REQUIREMENTS

### Requirement 1: Firebase Authentication
| Control | Status | Verification Method & Exact Evidence |
|---|---|---|
| Google Sign-In (`signInWithPopup` + COOP `same-origin-allow-popups`) | **BLOCKED** (Static **PASS**) | `src/context/AuthContext.tsx` uses `signInWithPopup(auth, googleProvider)` and logs `AUTH_LOGIN_GOOGLE`; Express sets `Cross-Origin-Opener-Policy: same-origin-allow-popups` (confirmed via `curl -i http://localhost:3000/api/health`). Live interactive OAuth popup flow requires real user browser session (`TEST 6: NOT VERIFIED`). |
| Session Persistence | **PASS** (Static) | Firebase Auth `onAuthStateChanged` listener in `src/context/AuthContext.tsx` synchronizes `currentUser` and resolves RBAC role (`user_roles/{uid}` + token claims + `/api/auth/status`) cleanly before setting `isAuthReady = true`. |
| Logout | **PASS** (Static) | `logout()` in `src/context/AuthContext.tsx` logs `AUTH_LOGOUT` audit event and calls Firebase `signOut(auth)`, resetting user role to `'client'`. |
| Token Verification (Admin SDK + RS256 Google X.509 Fallback) | **PASS** | `server.ts` verifies `Authorization: Bearer <JWT>` via `adminAuth.verifyIdToken(token, true)` (with revocation check) when ADC/SA is initialized, and falls back to strict Google SecureToken X.509 RS256 verification checking `aud`, `iss`, `sub` (`SAFE_ID_REGEX`), `iat`, `exp`. All 12 protected endpoints return `401` on missing/forged tokens (`SEC-02`, `SEC-03`). |
| Expired Token Handling | **PASS** | Server rejects expired JWT (`exp` in past) and `alg: "none"` JWT with `HTTP 401` (`SEC-14`). Frontend `authenticatedFetch()` & `ValidatedFileUploader.tsx` automatically invoke `getIdToken(true)` and retry once on `401`. |

### Requirement 2: User & Admin Authorization
| Control | Status | Verification Method & Exact Evidence |
|---|---|---|
| Admin-Only Operations | **PASS** | `/api/telemetry`, `/api/invoices/generate`, `/api/audit-events` (`GET`), and `/api/auth/status` verify Firebase Auth; admin routes enforce `requireAdmin` (`403` non-admin, `401` unauth). UI hides admin mutation triggers behind `{isAdmin && ...}` (`SEC-06`, `TEST 7`). |
| Client-Only Permissions | **PASS** | `/users/{uid}` creation/update omits `role`; `user_roles/{uid}` writes are denied to non-admins in `firestore.rules`; non-admin ticket updates cannot alter `status`, `priority`, `clientId`, or `clientEmail`. |
| Role Validation & Custom Claims | **PASS** | `server.ts` derives `isAdmin` exclusively from verified custom claims (`claims.admin === true || claims.role === 'admin'`) or Firestore `user_roles/{uid}.role === 'admin'` (`SEC-05`, `SEC-06`). |
| Admin Provisioning | **PASS** | CLI script `scripts/create-admin.ts` uses Firebase Admin SDK (`adminAuth.setCustomUserClaims` + `/user_roles/{uid}`) rather than hardcoded emails or unauthenticated client seeding (`SEC-06`). Zero hardcoded admin emails exist in `firestore.rules`, `server.ts`, or `src/`. |

### Requirement 3: Multi-Tenant Isolation
| Control | Status | Verification Method & Exact Evidence |
|---|---|---|
| Projects, Invoices, Payments, Files & Support Tickets (Rules + API Queries) | **PASS** (Rules/Server) / **BLOCKED** (Live Dual-Account Runtime) | `firestore.rules` scopes `projects`, `project_tasks`, `orders`, `invoices`, `payments`, `support_tickets`, `notifications`, and `user_profiles` strictly to `resource.data.clientId == request.auth.uid` (or `userId == request.auth.uid`), with `isAdmin()` override. `server.ts` checks `canAccessInvoice(user, invoice)` and file ownership before reading/downloading/deleting. |
| Customer A vs Customer B Cross-Tenant Runtime Isolation & Controlled Admin Access | **BLOCKED** | `SEC-07` & `TEST 8`: Missing `java` binary for Firebase Local Emulator Suite (`FIRESTORE_EMULATOR_HOST`) and missing `TEST_CUSTOMER_A_TOKEN`, `TEST_CUSTOMER_B_TOKEN`, `TEST_ADMIN_TOKEN` credentials in CLI container. |

### Requirement 4: Cloud Firestore Security
| Control | Status | Verification Method & Exact Evidence |
|---|---|---|
| Global Default Deny | **PASS** | `firestore.rules` ends with `match /{document=**} { allow read, write: if false; }` (`SEC-05`). |
| Unauthorized Read/Write Rejection & Email Binding | **PASS** | Unauthenticated reads blocked on all private/tenant collections; `/users/{uid}` create requires `data.uid == request.auth.uid` and token email match (`SEC-05`, `SEC-13`). Live emulator execution **BLOCKED** (no Java). |
| User Role Protection | **PASS** | `/user_roles/{userId}` restricts `create, update, delete` strictly to `isAdmin()` (`SEC-05`). |
| Audit Log Protection | **PASS** | `/audit_logs/{logId}` sets `allow read: if isAdmin(); allow create, update, delete: if false;` — server-only writes via Admin SDK (`SEC-05`). |
| Server-Only Sensitive Writes (`/quotations`, `/invoices`, `/payments`, `/payment_intents`) | **PASS** | Client creation denied on `quotations`, `invoices`, `payments`, and `payment_intents` (`allow create, update, delete: if false` / `isAdmin()`); handled exclusively through validated Express endpoints (`SEC-05`). |
| Append-Only Support Responses | **PASS** | `isValidTicketClientUpdate` verifies client updates only append `1` reply authored by `request.auth.uid` with `role == 'client'`, `responses.size() == existing.responses.size() + 1`, matching slice prefix `incoming.responses[0:existing.responses.size()] == existing.responses`, and immutable ticket ownership/status fields (`SEC-05`, `SEC-13`). |

### Requirement 5: API Security
| Control | Status | Verification Method & Exact Evidence |
|---|---|---|
| Bearer Token Validation & Forged JWT Rejection | **PASS** | `SEC-02` (`12/12` protected routes return `401`), `SEC-03` (forged RS256 admin JWT + malformed token -> `401`), `SEC-14` (`alg: "none"` JWT + expired JWT -> `401`). |
| CORS Allowlist & No Ambient Cookie Credentials | **PASS** | Untrusted `Origin: https://evil.example.com` blocked with `403` (`SEC-04` + live `curl`); trusted `Origin: http://localhost:3000` returns `Access-Control-Allow-Origin: http://localhost:3000` with `Access-Control-Allow-Credentials` omitted (`credentials: false`, `SEC-13`). |
| CSRF Protection | **PASS** | Bearer-only auth (no session cookies) plus `requireJsonContentType` rejects non-JSON HTML `<form>` `POST` (`application/x-www-form-urlencoded`) with `HTTP 415 Unsupported Media Type` (`SEC-13` + live `curl`). |
| Input Validation | **PASS** | Zod schema validation rejects malformed inquiry/quotation/newsletter emails and empty required fields with `HTTP 400` (`TEST 5`, `Phase 8`). Malformed JSON body returns `400` (`SEC-04`). |
| Rate Limiting & Trust Proxy Spoofing Defense | **PASS** | `trust proxy = 1` + rotating spoofed leftmost `X-Forwarded-For` headers triggers `HTTP 429` after `FORM_RATE_LIMIT_MAX=2` (`[400, 400, 429]`, `SEC-09`). |
| Safe Error Responses & Strict Production CSP | **PASS** | Malformed JSON & CORS errors leak zero stack traces or workspace paths (`SEC-04`). Production CSP (`NODE_ENV=production`) omits `'unsafe-inline'` and `'unsafe-eval'` from `script-src` and enforces `script-src-attr 'none'` (`SEC-10`). |

### Requirement 6: Firebase App Check
| Control | Status | Verification Method & Exact Evidence |
|---|---|---|
| Reject Invalid / Forged App Check Tokens | **PASS** | Sending `X-Firebase-AppCheck: forged.invalid.appcheck.token` to `POST /api/quotations` or `POST /api/newsletter/subscribe` is rejected immediately with `HTTP 403 APP_CHECK_INVALID` (`SEC-12` + live `curl`). |
| Enforce Missing Token Rejection When Enabled | **PASS** | Isolated server with `ENFORCE_APP_CHECK=true` rejects requests omitting `X-Firebase-AppCheck` with `HTTP 403` (never silently bypassed) (`SEC-12`). |
| Live Valid App Check Token Verification (`VITE_RECAPTCHA_SITE_KEY`) | **BLOCKED** | Currently `appCheckMode: "advisory_until_configured"` because `VITE_RECAPTCHA_SITE_KEY` (reCAPTCHA Enterprise/v3 site key registered in Firebase Console) is not provisioned in container environment. |

### Requirement 7: File Storage (`Google Cloud Storage`)
| Control | Status | Verification Method & Exact Evidence |
|---|---|---|
| Authenticated Uploads, File Type, Magic Bytes, Size & Path Traversal Guards | **PASS** | All `/api/files/*` routes return `401` unauthenticated / forged JWT (`SEC-02`, `TEST 9`, `Phase 8`). Server enforces `pdf/png/jpg/docx` allowlist, canonical MIME mapping, binary magic-byte header validation, strict Base64 checks, 10MB byte cap, and randomized UUID storage paths. |
| Private Bucket Access & Secure Download Isolation | **PASS** (Code) | Files upload to private GCS prefix (`uploads/${user.uid}/...`); `GET /api/files/:fileId` checks ownership/admin and sets `Content-Security-Policy: default-src 'none'; sandbox`, `X-Content-Type-Options: nosniff`, and `Content-Disposition: attachment` (`SEC-13`). Without `GCS_BUCKET`, server safely disables uploads with `503 STORAGE_NOT_CONFIGURED`. |
| Live GCS Bucket Upload / Download / Delete Round-Trip | **BLOCKED** | `SEC-08`: Requires `GCS_BUCKET` (`gcsBucketVerified=false`), Cloud Storage IAM credentials, and `TEST_CUSTOMER_A_TOKEN`. |

### Requirement 8: Payments & Anti-Fake Settlement
| Control | Status | Verification Method & Exact Evidence |
|---|---|---|
| Weak `PAYMENT_SECRET` (<32 chars) Rejection | **PASS** | `SEC-11` verified `weak_secret_under_32_chars` is rejected cleanly (`paymentSecretValid=false`, `paymentSecretConfigured=false`) without leaking values. |
| HMAC Payment Intent + Expiry + Authoritative Server Pricing | **PASS** | `POST /api/payments/create-intent` fetches invoice price from Firestore (client never supplies amount), computes HMAC-SHA256 over `${orderId}:${invoice.id}:${authoritativeAmount}:${user.uid}:${expiresAt}`, and persists one-time `payment_intents` record. |
| Replay Protection & Duplicate TXN Ref Prevention | **PASS** | Firestore `runTransaction` validates `!intent.used`, `Date.now() <= expiresAt`, timing-safe HMAC check, `invoice.status !== 'paid'`, and atomic `payment_intents/TXN_${sha256(normalizedTxnRef)}` lock doc (`409` on duplicate UTR). |
| Anti-Fake Settlement (`No Fake Payment Success`) | **PASS** (Server & UI) | `server.ts` blocks non-admin `POST /api/payments/verify` requests without valid `PAYMENT_WEBHOOK_SECRET`-signed `X-Payment-Gateway-Signature` (`403` + `PAYMENT_FAKE_SETTLEMENT_BLOCKED` audit entry, `SEC-13`). `ClientDashboardPage.tsx` suppresses fake checkout completion when `paymentWebhookConfigured=false`. |
| Live Signed Gateway Webhook End-to-End Settlement | **BLOCKED** | Live Firestore write IAM + configured `PAYMENT_WEBHOOK_SECRET` + customer invoice test fixture required for live end-to-end payment transaction execution (`turnkey-invention-70z9n` ADC currently returns `503` on Admin writes). |

### Requirement 9: Secrets & Infrastructure Readiness
| Control | Status | Verification Method & Exact Evidence |
|---|---|---|
| No Secrets in Frontend Bundles or Source Control | **PASS** | `SEC-14` (`src/`, `public/`), `TEST 10` (`src/`, `dist/`), and live `grep` confirm `0` private keys, service accounts, or backend HMAC secrets in bundles or git repo. Only `.env.example` exists on disk (`.gitignore` ignores `.env*`). Public `firebase-applet-config.json` contains only non-secret client Firebase identifiers. |
| Production Secret Manager Architecture & Cloud Readiness | **BLOCKED** | Production `PAYMENT_SECRET`, `PAYMENT_WEBHOOK_SECRET`, `GEMINI_API_KEY`, `GCS_BUCKET`, and App Check `VITE_RECAPTCHA_SITE_KEY` must be bound via **Google Cloud Secret Manager** (`gcloud secrets` -> Cloud Run `--set-secrets`). Container verification (`Dockerfile`) is **BLOCKED** because `docker` and Google Console IAM access are unavailable in this CLI sandbox. |

---

## 4. EXECUTED VERIFICATION EVIDENCE LOG

### Build, Typecheck & Security Rules Linter
```text
> npm run typecheck   -> tsc --noEmit (exit 0)
> npm run lint        -> eslint . (exit 0, includes firestore.rules @firebase/eslint-plugin-security-rules)
> npm run build       -> vite build (exit 0, 1760 modules transformed, dist/ built in 1.44s)
```

### Security Suite (`npx tsx tests/security_audit_test.ts`)
- **PASS (12):** `SEC-01`, `SEC-02`, `SEC-03`, `SEC-04`, `SEC-05`, `SEC-06`, `SEC-09`, `SEC-10`, `SEC-11`, `SEC-12`, `SEC-13`, `SEC-14`.
- **FAIL (0):** None.
- **BLOCKED (2):** `SEC-07` (Java JRE / `FIRESTORE_EMULATOR_HOST` + dual customer tokens unavailable), `SEC-08` (`GCS_BUCKET` + Cloud Storage IAM + auth token unavailable).

### QA Runner (`npm test`) & Phase 8 Suite (`npx tsx tests/phase8_test_suite.ts`)
- `npm test`: **8 PASS, 0 FAIL, 3 NOT VERIFIED** (`TEST 3`, `TEST 6`, `TEST 8`).
- `phase8_test_suite.ts`: **24 PASS, 0 FAIL (100.0%)**.

### Live HTTP Penetration Probes (`curl` vs `http://localhost:3000`)
- Untrusted Origin (`Origin: https://evil.example.com` -> `/api/health`): **`HTTP/1.1 403 Forbidden`**
- Cross-site form CSRF (`Content-Type: application/x-www-form-urlencoded` -> `POST /api/newsletter/subscribe`): **`HTTP/1.1 415 Unsupported Media Type`**
- Forged App Check token (`X-Firebase-AppCheck: forged.appcheck` -> `POST /api/newsletter/subscribe`): **`HTTP/1.1 403 Forbidden`**
- Trusted CORS origin headers (`Origin: http://localhost:3000` -> `/api/health`): **`Access-Control-Allow-Origin: http://localhost:3000`**, `Strict-Transport-Security: max-age=31536000; includeSubDomains`, **`Access-Control-Allow-Credentials` omitted (`false`)**.

---

## 5. REMAINING RISKS & ACTION PLAN FOR PRODUCTION SIGN-OFF

1. **Deploy Hardened `firestore.rules` to Live Firebase Project (`turnkey-invention-70z9n`):** Local `firestore.rules` contains newly added email-claim binding, notification immutability, and timestamp-poisoning protections not yet pushed live. Deploy with `firebase deploy --only firestore:rules` (database `ai-studio-powerwebstudioai-4b6a19ad-e6d7-4bd0-a968-9c08eb07a897`) when authorized.
2. **Execute Dual-Account Multi-Tenant & Firestore Emulator Tests (`SEC-07`, `TEST 8`):** Run inside an environment with Java 17+ (`firebase emulators:exec --only firestore ...`) or supply `TEST_CUSTOMER_A_TOKEN`, `TEST_CUSTOMER_B_TOKEN`, and `TEST_ADMIN_TOKEN` to verify runtime isolation on `projects`, `invoices`, `payments`, `files`, and `support_tickets`.
3. **Provision Google Cloud Secret Manager & App Check for Production Cloud Run:**
   - Store `PAYMENT_SECRET` (>=32 chars), `PAYMENT_WEBHOOK_SECRET` (>=32 chars, distinct from `PAYMENT_SECRET`), `GEMINI_API_KEY`, and `GCS_BUCKET` in Google Secret Manager rather than plaintext env files.
   - Set `ENFORCE_APP_CHECK=true` alongside `VITE_RECAPTCHA_SITE_KEY` (registered in Firebase App Check) and verify valid browser tokens against `/api/quotations`.
   - Attach `roles/datastore.user` and `roles/storage.objectAdmin` (bucket-scoped) IAM permissions to the Cloud Run service account.
4. **Verify Live Payment Webhook Reconciliation & GCS Round-Trip (`SEC-08`):** Once IAM + `GCS_BUCKET` + `PAYMENT_WEBHOOK_SECRET` are active, verify an end-to-end signed upload/download/delete and signed payment gateway callback.
5. **Dev Dependency Maintenance (Low Risk):** 11 moderate advisories (`eslint`/`minimatch`/`@typescript-eslint/*`) and 1 low advisory (`esbuild`) exist strictly in dev/build dependencies (`0` critical/high in runtime dependencies). Address on a planned tooling upgrade branch after verifying ESLint v9 compatibility.
