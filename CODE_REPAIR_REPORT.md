# CODE REPAIR & VERIFICATION REPORT

**Project:** POWER WEB STUDIO AI — Enterprise Digital Platform  
**Company:** BHANU RAM BARIHA DIGITAL TECHNOLOGIES  
**Firebase Project:** `turnkey-invention-70z9n`  
**Cloud Firestore Database (Enterprise Edition):** `ai-studio-powerwebstudioai-4b6a19ad-e6d7-4bd0-a968-9c08eb07a897`  
**Baseline Reference:** `/COMPLETE_AUDIT_REPORT.md`  
**Repair Date:** 2026-11-16

---

## 1. Executive Summary

All confirmed code, security-parity, tenant-isolation UI, routing/SEO, accessibility, schema, and dependency advisories identified in `/COMPLETE_AUDIT_REPORT.md` have been systematically repaired without weakening `firestore.rules`, bypassing authentication, hardcoding secrets, redesigning the application UI, or deleting `bun.lock`.

- **Build & Static Analysis:** `npm run typecheck` (`tsc --noEmit`), `npm run lint` (`eslint .` including `@firebase/eslint-plugin-security-rules`), and `npm run build` (`vite build`, 34 production assets in `1.29s`) all exited `0`.
- **Automated Test Suites:** `npm test` (`8/8` automated checks pass; `3` browser/interactive multi-user checks `NOT VERIFIED`), `tests/security_audit_test.ts` (`9/9` executable checks pass; `SEC-07` and `SEC-08` `BLOCKED` by missing JRE, GCS bucket, and test user tokens), and `tests/phase8_test_suite.ts` (`24/24` assertions pass, with `HTTP 503` noted on Admin write probes due to external container IAM).
- **Dependency Vulnerabilities:** Overriding `@grpc/grpc-js` to `^1.14.7` (matching `firebase-admin@14.5.1`) eliminated all **4 High** security advisories (`GHSA-m9gg-hp2v-232j` and `GHSA-f596-whhp-79r4` in `@firebase/firestore` -> `@grpc/grpc-js@1.9.16`) while preserving `firebase` + `firebase-admin` compatibility.

---

## 2. Systematic Repairs by Defect Category

### Repair 1 — Client Support Ticket Rules Parity & Real Client Tenant Isolation (P0)
- **Root Cause:**
  1. `ClientDashboardPage.tsx` invoked `updateSupportTicketStatus()` (`src/firebase/services.ts`) for non-admin client users to toggle ticket `status` (`open` ↔ `resolved`), violating `firestore.rules` (`isValidTicketClientUpdate`), which enforces `incoming.status == existing.status` and restricts client updates to append-only `responses`, `lastRepliedAt`, and `updatedAt`.
  2. `ClientDashboardPage.tsx` initialized `sprintTasks`, `milestonesList`, `projectUpdates`, `enterpriseDocuments`, and the 4th KPI card (`Sample Sandbox Placeholder`, `'2026-11-20'`, `Kalinga Logistics`, `Rajiv Sengupta`) unconditionally, leaking sample sandbox tenant data into live authenticated client sessions. Additionally, `handleSignOffMilestone` only mutated local React state without Firestore persistence, and `DocumentDetailModal.tsx` omitted `'DOCX' | 'PNG' | 'JPG'` from its document format union.
- **Changed Files:**
  - `/src/pages/ClientDashboardPage.tsx`
  - `/src/firebase/services.ts`
  - `/src/components/client/DocumentDetailModal.tsx`
- **Solution:**
  - Added an admin guard (`isCurrentUserVerifiedAdmin()`) to `updateSupportTicketStatus` in `src/firebase/services.ts`.
  - Updated `handleToggleTicketStatus` in `ClientDashboardPage.tsx` so non-sandbox clients append a structured `[Client Request]` message via `addTicketResponse` (compliant with append-only `firestore.rules`) and relabeled the action button to `Request Re-open` / `Request Close`.
  - Isolated `DEMO_SPRINT_TASKS`, `DEMO_MILESTONES`, `DEMO_PROJECT_UPDATES`, `DEMO_ENTERPRISE_DOCUMENTS`, and sandbox KPI labels strictly behind `isDemoSandbox === true`.
  - Added `fetchProjectTasksForClient` in `src/firebase/services.ts`, wired live client sessions to real Firestore tasks (`project_tasks`), project `rawMilestones` / `rawUpdates`, and authenticated `GET /api/files/list` vault artifacts with real download handling, plus bilingual empty states when live client projects have zero records.
  - Updated `handleSignOffMilestone` for live clients to route sign-off approvals through the auditable Support / Change Request workflow rather than simulating false persistence.
  - Expanded `EnterpriseDocument['format']` in `DocumentDetailModal.tsx` to accept `'PDF' | 'APK' | 'ZIP' | 'JSON' | 'DOCX' | 'PNG' | 'JPG'`.
- **Test Evidence:** `npm run typecheck` (exit 0), `npm run lint` (exit 0, `@firebase/eslint-plugin-security-rules` clean), `tests/security_audit_test.ts` (`SEC-05` & `SEC-06` PASS). Runtime live authenticated dual-client UI sign-off remains `NOT VERIFIED` without live client Firebase Auth ID tokens.

---

### Repair 2 — Admin Inbound Leads Pipeline, Invoice Client UID Binding & Dashboard Layout/Telemetry (P1 / P2)
- **Root Cause:**
  1. In `AdminDashboardPage.tsx`, when `isRealAdmin === true`, `leads` initialized to `[]` and never loaded live inquiries from Firestore; `handleToggleLeadStatus` only toggled in-memory React state.
  2. `invoiceForm` omitted `clientId`, causing all admin-generated invoices to store `clientId: 'client-custom'` (`server.ts`) instead of the customer's Firebase UID, breaking direct UID-scoped `firestore.rules` queries for clients.
  3. The top KPI grid used `lg:grid-cols-6` for 7 metric cards (orphaning card #7) and hardcoded `"17 Collections"` instead of the 21 collections defined in `firestore.rules`. The delete confirmation dialog also lacked `Escape` key handling.
- **Changed Files:**
  - `/src/pages/AdminDashboardPage.tsx`
  - `/server.ts`
- **Solution:**
  - Derived `leads` dynamically via `useMemo` from real Firestore `quotationsList` records when `isRealAdmin` is active (keeping `demoLeads` isolated to `isDemoSandbox`), persisted lead status changes via `updateQuotationStatus`, and linked `handleConvertLeadToQuote` to the existing Firestore quotation record.
  - Added a registered client selector + `clientId` state to `invoiceForm` in `AdminDashboardPage.tsx` with clean blank defaults in live admin mode, passing `clientId` to `POST /api/invoices/generate`.
  - Added a server-side Firestore `users` email lookup fallback inside `POST /api/invoices/generate` in `server.ts` whenever an explicit `clientId` is omitted, before falling back to `'client-custom'`.
  - Fixed the Admin KPI grid to `lg:grid-cols-7`, corrected the collection telemetry badge to `21 Collections`, and added `Escape` key dismissal for `pendingDelete`.
- **Test Evidence:** `npm run typecheck` (exit 0), `npm run lint` (exit 0), `npm run build` (exit 0), `tests/qa_audit_runner.ts` (`TEST 7` PASS: unauthenticated `POST /api/invoices/generate` and `GET /api/invoices` return `401`).

---

### Repair 3 — Server & Client App Check Coverage (P1)
- **Root Cause:**
  - `server.ts` invoked `verifyAppCheckForForm` only on `/api/inquiries/validate`, `/api/quotations`, and `/api/newsletter/subscribe`, leaving `/api/files/upload`, `/api/audit-events`, `/api/payments/create-intent`, and `/api/payments/verify` unchecked.
  - Client callers (`ValidatedFileUploader.tsx`, `logAuditEvent` in `src/firebase/services.ts`, and payment intent/verify requests in `ClientDashboardPage.tsx`) did not attach `X-Firebase-AppCheck` headers.
- **Changed Files:**
  - `/server.ts`
  - `/src/components/common/ValidatedFileUploader.tsx`
  - `/src/firebase/services.ts`
  - `/src/pages/ClientDashboardPage.tsx`
- **Solution:**
  - Expanded `verifyAppCheckForForm` scope to `'inquiry' | 'newsletter' | 'upload' | 'audit' | 'payment'` and enforced it right after `requireAuth` on `/api/files/upload`, `/api/audit-events`, `/api/payments/create-intent`, and `/api/payments/verify` (returning `403 APP_CHECK_REQUIRED` / `APP_CHECK_INVALID` when `VITE_RECAPTCHA_SITE_KEY` or `ENFORCE_APP_CHECK=true` is configured, while returning `401` first for missing/forged Bearer tokens).
  - Attached `getAppCheckTokenHeader()` to `ValidatedFileUploader.tsx`, `logAuditEvent()`, `/api/payments/create-intent`, and `/api/payments/verify`.
- **Test Evidence:** Live `curl` probes and `tests/security_audit_test.ts` (`SEC-02`) confirmed unauthenticated requests to all protected upload/audit/payment endpoints still reject with `HTTP 401` (`UPLOAD_UNAUTH=401`, `AUDIT_UNAUTH=401`, `PAYMENT_UNAUTH=401`). Enforcement with live reCAPTCHA tokens remains dependent on setting `VITE_RECAPTCHA_SITE_KEY` + `ENFORCE_APP_CHECK=true`.

---

### Repair 4 — SEO Base URL Resolution, Dynamic Sitemap & 404 Route Handling (P1)
- **Root Cause:**
  1. `resolveSeoBaseUrl()` in `server.ts` always returned `https://YOUR-DOMAIN.com` when `SITE_URL` was unset instead of inferring the active host/protocol from the incoming HTTP request.
  2. Dynamic catalog routes (`/apps/:id`) were excluded from `public/sitemap.xml` and `GET /sitemap.xml`.
  3. Unknown SPA paths in `NavigationContext.tsx` silently rendered the `home` route without a 404 screen or `noindex` meta directive.
- **Changed Files:**
  - `/server.ts`
  - `/public/sitemap.xml`
  - `/src/types/index.ts`
  - `/src/context/NavigationContext.tsx`
  - `/src/components/common/SEO.tsx`
  - `/src/App.tsx`
- **Solution:**
  - Updated `resolveSeoBaseUrl(req)` in `server.ts` to prefer valid non-placeholder `SITE_URL`, fall back to `req.protocol` / `x-forwarded-proto` + `req.get('host')`, and keep `DEFAULT_SITE_URL` only as a final safe fallback.
  - Added all 8 default catalog `/apps/:id` routes to `public/sitemap.xml` and dynamically merged any additional Firestore `apps` document IDs in `GET /sitemap.xml` (safely guarded against Admin read unavailability and without importing frontend assets into `server.ts`).
  - Added `'not-found'` to `PageRoute` (`src/types/index.ts`), routed unmatched URLs to `'not-found'` in `NavigationContext.tsx`, configured `noIndex: true` for `'not-found'` in `SEO.tsx`, and added a bilingual 404 recovery view in `src/App.tsx`.
- **Test Evidence:**
  - `curl -sS http://localhost:3000/robots.txt` returned `Sitemap: http://localhost:3000/sitemap.xml` (zero `YOUR-DOMAIN.com` or `ai.studio` placeholders).
  - `curl -sS http://localhost:3000/sitemap.xml` returned all 10 core routes + all 8 `/apps/:id` URLs on `http://localhost:3000`.
  - `tests/phase8_test_suite.ts` SEO endpoint assertions PASSED; `tests/qa_audit_runner.ts` (`TEST 2`, `TEST 4`) confirmed all 12 lazy routes preserved with 0 broken nav links.

---

### Repair 5 — Firebase Config, Blueprint Schema Parity, N+1 Query & Invoice Collision Safety (P1 / P2)
- **Root Cause:**
  1. Project root lacked `/firebase.json` and `/firestore.indexes.json`.
  2. `/firebase-blueprint.json` omitted `/test/{docId}` (20 mapped vs 21 rules collections) and diverged from runtime/rules fields on `User`, `Quotation`, `Invoice`, `Notification`, `AuditLog`, and `SiteSetting`.
  3. `fetchAllUsers()` in `src/firebase/services.ts` executed sequential `await fetchUserRole(d.id)` reads inside a loop (`O(N)` sequential latency).
  4. `POST /api/invoices/generate` generated invoice numbers with 4-digit `Math.random()` (`INV-2026-xxxx`) and `inv-${Date.now()}` IDs.
- **Changed Files:**
  - `/firebase.json` *(created)*
  - `/firestore.indexes.json` *(created)*
  - `/firebase-blueprint.json`
  - `/src/firebase/services.ts`
  - `/server.ts`
- **Solution:**
  - Created `/firebase.json` (wiring `firestore.rules`, `firestore.indexes.json`, and Emulator ports `9099`/`8080`) and `/firestore.indexes.json`.
  - Updated `/firebase-blueprint.json` with `TestDoc` -> `/test/{docId}` and added missing runtime/rules properties across `User`, `Quotation`, `Invoice`, `Notification`, `AuditLog`, and `SiteSetting` while retaining all 20 existing collection paths.
  - Replaced the sequential loop in `fetchAllUsers()` with `Promise.all(...)`.
  - Replaced `Math.random()` in `POST /api/invoices/generate` with `crypto.randomBytes()` collision-resistant invoice IDs (`inv-${Date.now()}-<hex>`) and numbers (`INV-<year>-<4digits>-<hex>`), matching `SAFE_ID_REGEX`.
- **Test Evidence:** `npm run lint` (`eslint .`), `tests/security_audit_test.ts` (`SEC-05`), and `tests/phase8_test_suite.ts` (`Blueprint Schema` 17/17 + all rules audits) PASSED.

---

### Repair 6 — Consultation Reference Fidelity, Option Parity, AI Estimator Deduplication & Modal Accessibility (P2)
- **Root Cause:**
  1. `ConsultationModal.tsx` rendered a random `PWS-xxxxxx` reference instead of the `quoteId` persisted by `/api/quotations`.
  2. `ContactCtaSection.tsx` used divergent `<select>` option keys (`api-gateway`, `urgent`) vs `ConsultationModal.tsx` (`api-integration`, `immediate`).
  3. `AiSolutionsSection.tsx` and `AiSolutionsPage.tsx` duplicated architectural budget/timeline calculation logic.
  4. Nine modals lacked `role="dialog"` / `aria-modal="true"` and `Escape` dismissal, and `NotificationDropdown.tsx` & `ServicesSection.tsx` used clickable `<div>` elements instead of semantic `<button>` elements.
- **Changed Files:**
  - `/src/utils/aiEstimator.ts` *(created)*
  - `/src/components/home/AiSolutionsSection.tsx`
  - `/src/pages/AiSolutionsPage.tsx`
  - `/src/components/modals/ConsultationModal.tsx`
  - `/src/components/home/ContactCtaSection.tsx`
  - `/src/components/home/ServicesSection.tsx`
  - `/src/components/common/NotificationDropdown.tsx`
  - `/src/components/modals/AppDetailModal.tsx`
  - `/src/components/modals/ServiceDetailModal.tsx`
  - `/src/components/client/DocumentDetailModal.tsx`
  - `/src/components/admin/AdminAppManagerModal.tsx`
  - `/src/components/admin/BlogManagerModal.tsx`
  - `/src/components/admin/CustomerManagerModal.tsx`
  - `/src/components/admin/ProjectManagerModal.tsx`
  - `/src/components/admin/QuotationManagerModal.tsx`
  - `/src/components/admin/ServiceManagerModal.tsx`
- **Solution:**
  - Extracted shared `getAiArchitectureEstimate()` into `/src/utils/aiEstimator.ts` and updated both AI showcase components.
  - Updated `ConsultationModal.tsx` and `ContactCtaSection.tsx` to display the server-returned `quoteId` and standardized option values (`api-integration`, `immediate`).
  - Converted clickable `<div>` cards/rows in `ServicesSection.tsx` and `NotificationDropdown.tsx` to semantic `<button type="button">` elements with `focus-visible` outlines, and added `role="dialog"`, `aria-modal="true"`, and `Escape` key closing across all listed modals.
- **Test Evidence:** `npm run typecheck`, `npm run lint`, and `npm run build` PASSED cleanly with zero errors.

---

### Repair 7 — Transitive `@grpc/grpc-js` High Security Vulnerability Resolution (P2)
- **Root Cause:** `firebase@13.2.0` -> `@firebase/firestore@4.19.1` required `@grpc/grpc-js@~1.9.0` (`1.9.16`), introducing 4 High-severity advisories (`GHSA-m9gg-hp2v-232j` and `GHSA-f596-whhp-79r4`), whereas `firebase-admin@14.5.1` already used `@grpc/grpc-js@1.14.7`.
- **Changed Files:**
  - `/package.json`
  - `/package-lock.json`
  *(Note: `/bun.lock` was left untouched per prior explicit user instruction.)*
- **Solution:** Added `"overrides": { "@grpc/grpc-js": "^1.14.7" }` in `/package.json` and ran `npm install` to unify both `firebase-admin` and `@firebase/firestore` on `@grpc/grpc-js@1.14.7`.
- **Test Evidence:**
  - `npm ls @grpc/grpc-js` confirmed `@firebase/firestore@4.19.1` resolves `@grpc/grpc-js@1.14.7 overridden` and `firebase-admin@14.5.1` resolves `@grpc/grpc-js@1.14.7 deduped`.
  - Direct ESM import probe via `npx tsx -e` (`firebase/app`, `firebase/firestore`, `firebase-admin/firestore`) printed `FIREBASE_COMPAT_OK function function function`.
  - `npm audit --json` dropped from `16` vulnerabilities (`4 high`, `11 moderate`, `1 low`) to `12` (`0 high`, `0 critical`, `11 moderate` dev-only `minimatch` inside `eslint`/`typescript-eslint`/`@firebase/eslint-plugin-security-rules`, `1 low` Windows dev-only `esbuild`).

---

## 3. Executed Verification Results (Truthful Post-Repair Run)

| Verification Command / Probe | Outcome | Observed Evidence |
|---|---|---|
| `npm run typecheck` | **PASS** | `tsc --noEmit` exited `0` (0 errors). |
| `npm run lint` | **PASS** | `eslint .` exited `0` (includes `@firebase/eslint-plugin-security-rules`). |
| `npm run build` | **PASS** | `vite build` built `1760` modules cleanly into `dist/` in `1.29s`. |
| `npm test` (`tsx tests/qa_audit_runner.ts`) | **PASS (8) / NOT VERIFIED (3)** | `TEST 1,2,4,5,7,9,10,11` PASS (`0` FAIL); `TEST 3, 6, 8` `NOT VERIFIED` (require headless Chromium / interactive OAuth / dual live user ID tokens). |
| `npx tsx tests/security_audit_test.ts` | **PASS (9) / BLOCKED (2)** | `SEC-01..SEC-06`, `SEC-09..SEC-11` PASS (`0` FAIL); `SEC-07` (Java JRE + test user tokens) & `SEC-08` (`GCS_BUCKET` + customer token) `BLOCKED`. |
| `npx tsx tests/phase8_test_suite.ts` | **PASS (24/24; container 503 noted)** | All 24 script assertions passed; `POST /api/quotations` & `POST /api/newsletter/subscribe` still returned `HTTP 503` because container ADC lacks Firestore write IAM on `turnkey-invention-70z9n`. |
| `npm ls @grpc/grpc-js` & `npm audit --json` | **PASS (0 High / 0 Critical)** | Both SDK trees unified on `@grpc/grpc-js@1.14.7`; remaining `12` advisories (`11` moderate `minimatch`, `1` low `esbuild`) are `devDependencies` only. |
| Live HTTP Probes (`http://localhost:3000`) | **PASS** | `/robots.txt` (`200`, `Sitemap: http://localhost:3000/sitemap.xml`), `/sitemap.xml` (`200`, includes `/apps/:id`), unauth `/api/files/upload` (`401`), `/api/audit-events` (`401`), `/api/payments/create-intent` (`401`). |

---

## 4. External Blockers Requiring Account Access, Cloud IAM, or Environment Provisioning

These items cannot be resolved strictly via local source-code edits and require external GCP / Firebase project access or runtime tools:

1. **Container / Cloud Run Service Account Firestore Write IAM (`HTTP 503` on Admin Writes):**
   - **Observed Symptom:** `/api/health` detects `firebaseAdminMode: "gcp_adc"`, yet `POST /api/quotations` and `POST /api/newsletter/subscribe` return `HTTP 503` in this environment because the default runtime ADC identity lacks `roles/datastore.user` (Firestore read/write) permissions on project `turnkey-invention-70z9n` / database `ai-studio-powerwebstudioai-4b6a19ad-e6d7-4bd0-a968-9c08eb07a897`.
   - **Action Needed:** Grant `roles/datastore.user` to the runtime service account in GCP IAM (or provide `FIREBASE_SERVICE_ACCOUNT_KEY` via Secret Manager).
2. **Google Cloud Storage Bucket (`GCS_BUCKET`) & Storage IAM (`SEC-08`):**
   - **Observed Symptom:** File vault uploads safely return `HTTP 503 STORAGE_NOT_CONFIGURED` until a real private GCS bucket is provisioned and `GCS_BUCKET` + `roles/storage.objectAdmin` are configured.
3. **Production Environment Secrets & Build Variables:**
   - Configure `SITE_URL`, `PAYMENT_SECRET` (`>= 32` high-entropy characters), `VITE_RECAPTCHA_SITE_KEY` + `ENFORCE_APP_CHECK=true` (registered in Firebase App Check console), and `STRICT_PRODUCTION_ENV=true` + `NODE_ENV=production` in Cloud Run / Secret Manager.
4. **External Verification Tooling (`SEC-07`, `TEST 3`, `TEST 6`, Docker, Live Rules Deployment):**
   - **Java JRE:** Required locally to run `firebase emulators:start` (`SEC-07` 2-user Firestore rules isolation test).
   - **Test Firebase Auth ID Tokens / Interactive Browser Session:** Required for live 2-user tenant isolation (`TEST 8` / `SEC-07`) and interactive Google OAuth popup + responsive layout checks (`TEST 3`, `TEST 6`).
   - **Docker CLI / Firebase CLI Auth:** Required to run `docker build`, deploy `firestore.rules` / `firestore.indexes.json`, and verify live `turnkey-invention-70z9n` Cloud Run deployment parity.
5. **Unused `@google/genai` / `MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API` Declaration:**
   - Retained untouched per audit scope and runtime capability constraints (`metadata.json` / `package.json`); implementing an actual server-side Gemini AI proxy route or removing the capability declaration should be decided explicitly if/when a real AI endpoint is scoped.
