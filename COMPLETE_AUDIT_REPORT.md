# COMPLETE SOURCE-CODE & PRODUCTION READINESS AUDIT REPORT

**Project:** POWER WEB STUDIO AI — Enterprise Digital Platform  
**Company:** BHANU RAM BARIHA DIGITAL TECHNOLOGIES  
**Firebase Project:** `turnkey-invention-70z9n`  
**Cloud Firestore Database (Enterprise Edition):** `ai-studio-powerwebstudioai-4b6a19ad-e6d7-4bd0-a968-9c08eb07a897`  
**Audit Scope:** Full read-only source-code, configuration, security, SEO/performance, dependency, and test verification audit (Phase 1 pre-remediation baseline)  
**Audit Date:** 2026-11-16  

---

## 1. Executive Summary & Production Readiness Verdict

**Overall Verdict: NOT READY FOR PRODUCTION DEPLOYMENT (Code Hardened in Core Infrastructure, Multiple P0/P1 Functional, Schema, Rules-Parity, & External Ops Blockers Identified)**

The application compiles cleanly with zero TypeScript (`tsc --noEmit`), ESLint (`eslint .`), or Vite (`vite build`) errors, and its core Express + Helmet + Firebase Admin + Firestore ABAC foundation is well-structured. However, a full codebase inspection and live local server verification uncovered **confirmed functional defects**, **client-to-rules permission mismatches**, **hardcoded sample/tenant data leaking into authenticated Client Dashboard sessions**, **live Admin SDK IAM permission failures (`HTTP 503`) in the current runtime container**, **missing Firebase CLI/emulator configuration (`firebase.json`)**, **schema drift against `firebase-blueprint.json`**, and **unconfigured production environment variables (`GCS_BUCKET`, `SITE_URL`, `VITE_RECAPTCHA_SITE_KEY`, `ENFORCE_APP_CHECK`, `STRICT_PRODUCTION_ENV`)**.

No source or configuration files were modified during this audit. Only this report (`/COMPLETE_AUDIT_REPORT.md`) was created (plus `npm run build` populated the gitignored `dist/` directory for bundle and production verification).

---

## 2. Complete Inspection Manifest

All project directories and key source/configuration files were inspected:

| Area | Files Inspected |
|---|---|
| **Entry & Config** | `package.json`, `tsconfig.json`, `vite.config.ts`, `eslint.config.mjs`, `metadata.json`, `.env.example`, `.dockerignore`, `Dockerfile`, `index.html`, `firebase-applet-config.json`, `firebase-blueprint.json`, `DEPLOYMENT_AUDIT.md` |
| **Frontend Core & Context** | `src/App.tsx`, `src/context/AuthContext.tsx`, `src/context/NavigationContext.tsx`, `src/context/LanguageContext.tsx`, `src/context/NotificationContext.tsx`, `src/context/AppsContext.tsx`, `src/types.ts` |
| **Frontend Components** | `src/components/common/{Header,MobileMenu,Footer,SEO,ValidatedFileUploader,NotificationDropdown,OptimizedImage,ErrorBoundary,PageLoadingFallback,NetworkStatusAlert,PWAInstallButton,ToastContainer}.tsx`, `src/components/home/{HeroSection,CompanyIntroSection,ServicesSection,AndroidPortfolioSection,AiSolutionsSection,WhyChooseUsSection,ProcessSection,ContactCtaSection}.tsx`, `src/components/modals/{ConsultationModal,ServiceDetailModal,AppDetailModal}.tsx`, `src/components/client/{NewTicketModal,DocumentDetailModal}.tsx`, `src/components/admin/{AdminAppManagerModal,BlogManagerModal,CustomerManagerModal,ProjectManagerModal,QuotationManagerModal,ServiceManagerModal}.tsx`, `src/components/auth/AuthModal.tsx` |
| **Frontend Pages** | `src/pages/{AboutPage,ServicesPage,AiSolutionsPage,AndroidPortfolioPage,AppDetailPage,ProcessPage,ContactPage,BlogPage,PrivacyPolicyPage,TermsPage,ClientDashboardPage,AdminDashboardPage}.tsx` |
| **Data, Hooks, i18n, Utils** | `src/data/{content,blogData}.ts`, `src/hooks/{usePWAInstall,useSiteContact}.ts`, `src/i18n/{en,hi,formatters,types}.ts`, `src/utils/formProtection.ts` |
| **Firebase Client & Rules** | `src/firebase/{config,appCheck,errorHandler,analytics,services}.ts`, `firestore.rules`, `scripts/create-admin.ts` |
| **Backend Server** | `server.ts` (all 2,785 lines) |
| **Public / PWA / SEO** | `public/{manifest.json,robots.txt,sitemap.xml,sw.js,og-image.jpg,favicon.ico,favicon-16x16.png,favicon-32x32.png,apple-touch-icon.png,pwa-192x192.png,pwa-512x512.png,pwa-maskable-512x512.png}`, `src/assets/images/*` |
| **Tests** | `tests/qa_audit_runner.ts`, `tests/security_audit_test.ts`, `tests/phase8_test_suite.ts` |

---

## 3. Area-by-Area Detailed Audit

### A. Frontend (React, TypeScript, Routing, Forms, Dashboards, Accessibility)
- **TypeScript & Code Splitting:** `tsconfig.json` and `tsc --noEmit` pass cleanly. All 12 secondary pages in `src/App.tsx` (`lines 31–42`) are lazy-loaded via `React.lazy` + `Suspense` wrapped in `ErrorBoundary`.
- **Routing & Navigation:** `NavigationContext.tsx` uses History API paths (`/`, `/services`, `/ai-solutions`, `/android-portfolio`, `/apps/:id`, `/process`, `/about`, `/contact`, `/blog`, `/privacy`, `/terms`, `/client-dashboard`, `/admin-dashboard`) and redirects legacy `#/...` hashes. However, unknown paths silently render the `home` view (`src/App.tsx:141–142`, `NavigationContext.tsx:117`) without a dedicated 404 view or `<meta name="robots" content="noindex">`.
- **Client Portal (`src/pages/ClientDashboardPage.tsx`):** Hardcoded sample arrays (`sprintTasks`, `milestonesList`, `projectUpdates`, `enterpriseDocuments`, plus the 4th KPI card `"Sample Sandbox Placeholder"`) render unconditionally even for real authenticated Firebase clients. Support ticket status toggling calls `updateSupportTicketStatus()` even though `firestore.rules` blocks non-admin `status` mutations.
- **Admin Portal (`src/pages/AdminDashboardPage.tsx`):** `Inbound Leads` tab renders `[]` and performs only in-memory updates for real admins. Invoice generator omits client `uid` (`clientId`), defaulting to `'client-custom'` on the server. UI layout uses `lg:grid-cols-6` for 7 metric cards and hardcodes `"17 Collections"` vs 21 matched collections in `firestore.rules`.
- **Forms & Parity:** `ConsultationModal.tsx` displays a client-side `Math.random()` reference ID instead of the persisted `quoteId` returned by `submitQuotation()`. Service/timeline `<select>` values diverge slightly between `ContactCtaSection.tsx` (`api-gateway`, `urgent`) and `ConsultationModal.tsx` (`api-integration`, `immediate`). AI estimator logic is duplicated across `AiSolutionsSection.tsx` and `AiSolutionsPage.tsx`.
- **Accessibility:** Only 6 dialogs (`MobileMenu.tsx`, `PWAInstallButton.tsx`, `ConsultationModal.tsx`, `NewTicketModal.tsx`, `AuthModal.tsx`, and `AdminDashboardPage.tsx` invoice modal) set `role="dialog"` and `aria-modal="true"`. Nine other modals (`AppDetailModal.tsx`, `ServiceDetailModal.tsx`, `DocumentDetailModal.tsx`, and the 6 `src/components/admin/*ManagerModal.tsx` files) lack `role="dialog"` / `aria-modal="true"`, and zero components implement `Escape` key closing or focus trapping. `NotificationDropdown.tsx:119` and `ServicesSection.tsx:99` use clickable `<div>` elements instead of semantic `<button>` elements.

### B. Backend (`server.ts`)
- **Middleware & Security Headers:** `X-Powered-By` disabled; `helmet` enabled with strict CSP (`unsafe-inline` / `unsafe-eval` removed from `script-src` in `NODE_ENV=production`), `script-src-attr 'none'`, `object-src 'none'`, `Cross-Origin-Opener-Policy: same-origin-allow-popups`, `HSTS`, `nosniff`, and bounded `trust proxy` (`TRUST_PROXY_HOPS` clamped `0–5`, default `1`).
- **CORS & Body Limits:** Strict origin allowlist via `SITE_URL`, `CORS_ALLOWED_ORIGINS`, localhost, and `https://*.run.app` (untrusted origins return HTTP 403). Global JSON body parser capped at `1mb`, with a `15mb` route-scoped parser on `POST /api/files/upload`.
- **Authentication & Authorization:** `requireAuth` and `requireAdmin` verify Bearer JWTs via Firebase Admin SDK (with an RS256 Google x509 fallback verifier if Admin credentials are unavailable), checking both custom claims and `user_roles/{uid}` in Firestore.
- **App Check Coverage Gap:** App Check middleware is applied to `/api/inquiries/validate`, `/api/quotations`, and `/api/newsletter/subscribe`, but omitted on `/api/files/upload`, `/api/payments/*`, and `/api/audit-events` (and `ValidatedFileUploader.tsx` never sends `X-Firebase-AppCheck`).
- **Storage & Payments:** Upload path enforces `GCS_BUCKET`-only persistence (returns HTTP `503 STORAGE_NOT_CONFIGURED` when unset), magic-byte signature verification, extension allowlist (`pdf`, `png`, `jpg`, `docx`), 10 MB binary limit, and `uploadedBy == uid` ownership checks on download/delete. Payment signatures require `PAYMENT_SECRET` >= 32 characters and non-placeholder validation.
- **Invoice Number Collisions & Rate Limiting:** Invoice numbers use `Math.random()` 4-digit suffixes (`1000–9999`) without Firestore uniqueness verification. Rate-limit maps (`rateLimitMap`, `uploadRateMap`, `formRateMap`) reside strictly in instance memory.

### C. Firebase (`firestore.rules`, `src/firebase/*`, `firebase-blueprint.json`, `scripts/create-admin.ts`)
- **Client SDK Connectivity (`src/firebase/config.ts`):** Binds explicitly to named DB `ai-studio-powerwebstudioai-4b6a19ad-e6d7-4bd0-a968-9c08eb07a897`, enforces XHR WebChannel long-polling (`experimentalForceLongPolling: true`, `useFetchStreams: false`) with a 4s REST pre-probe and 8s failsafe (`disableNetwork(db)`) to prevent the 10s `OnlineStateTimeout` error in proxied/iframe environments.
- **Firestore Security Rules (`firestore.rules`):** Enforces default deny at root (`match /{document=**} { allow read, write: if false; }`), zero hardcoded admin emails, locked `user_roles`, server-only `quotations` create / `audit_logs` writes, and append-only client replies on `support_tickets`. ESLint (`@firebase/eslint-plugin-security-rules`) passes cleanly.
- **Live IAM Gap Observed in Container:** Live `/api/health` reports `firebaseAdminMode: "gcp_adc"` (`firebaseAdminCredentialsPresent: true`), yet `POST /api/quotations` returned `HTTP 503` during `phase8_test_suite.ts`, confirming the container's default ADC service account lacks Firestore read/write IAM permissions on `turnkey-invention-70z9n`.
- **Blueprint & Tooling Drift:** No `/firebase.json` or `/firestore.indexes.json` exists in the repo root (blocking standard `firebase deploy` / `firebase emulators:start` commands without manual flags). `firebase-blueprint.json` has schema mismatches with actual runtime documents (`Notification`, `Quotation`, `SiteSetting`, `Invoice`, `User`).
- **N+1 Query (`src/firebase/services.ts:668–674`):** `fetchAllUsers()` executes sequential `await fetchUserRole(d.id)` reads inside a `for` loop (`O(N)` sequential roundtrips).

### D. Google Cloud, Container & Deployment (`Dockerfile`, `.dockerignore`, `.env.example`, `DEPLOYMENT_AUDIT.md`)
- **Docker Multi-Stage Setup (`Dockerfile`):** Uses `node:24-slim`, runs `npm ci`, builds Vite `/dist`, prunes devDependencies (`npm prune --omit=dev`), runs as non-root `USER node`, exposes `8080`, configures `HEALTHCHECK` on `/api/health`, and executes `CMD ["node", "server.ts"]`.
- **Live Execution Blocked:** `docker` CLI is not installed in the audit container, so `Dockerfile` build and Cloud Run execution were not executed live.
- **Unused Capability Declaration:** `metadata.json` declares `MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API`, `.env.example` documents `GEMINI_API_KEY`, `/api/health` reports `geminiApiConfigured: true`, and `package.json` includes `@google/genai@^2.4.0` (`2.32.0` installed), yet zero routes or frontend files import `@google/genai` or invoke Gemini.

### E. SEO, PWA & Performance
- **Bundle Metrics (`npm run build`):** Built cleanly in `1.96s` (`dist/` total `8.1M` across 34 files). Largest chunks: `vendor-react` (`441.97 kB` / `135.24 kB` gzip), `vendor-firestore` (`266.23 kB` / `76.16 kB` gzip), `index` (`260.52 kB` / `52.24 kB` gzip), `AdminDashboardPage` (`216.79 kB` / `36.42 kB` gzip), `ClientDashboardPage` (`142.01 kB` / `30.78 kB` gzip), `vendor-core` (`150.07 kB`), `vendor-auth` (`108.17 kB`), `content` (`87.57 kB`), `vendor-firebase` (`85.57 kB`), `index.css` (`68.01 kB` / `11.76 kB` gzip).
- **Image Optimization:** All 5 image pairs in `src/assets/images/` exist in both `.webp` (`49K–182K`) and `.jpg` (`108K–923K`) fallback formats and are served via `<OptimizedImage>` `<picture>`. Notice the `.jpg` fallbacks account for ~3.3 MB of `dist/` and `public/pwa-512x512.png` is `335 KB`.
- **Dynamic SEO Endpoints (`server.ts:2572–2634`):** Live probes confirmed `GET /robots.txt` and `GET /sitemap.xml` currently output `https://YOUR-DOMAIN.com` because `SITE_URL` is unset (`resolveSeoBaseUrl()` does not fall back to `req.get('host')`, unlike `app.get('*')`). Additionally, `/apps/:id` dynamic routes are absent from `/sitemap.xml`.
- **PWA Assets:** `manifest.json`, `sw.js`, `og-image.jpg`, `favicon.*`, `apple-touch-icon.png`, and `pwa-*.png` all exist in `public/` and return `HTTP 200`.

### F. Dependencies & Lockfiles
- **Conflicting Lockfiles:** Both `bun.lock` (`90,762` bytes) and `package-lock.json` (`173,761` bytes) exist at workspace root (`Dockerfile` uses `npm ci` against `package-lock.json`).
- **Vulnerabilities (`npm audit --json`):** **16 total (0 critical, 4 high, 11 moderate, 1 low):**
  - **4 High:** `@grpc/grpc-js <1.13.6` (`GHSA-m9gg-hp2v-232j`, CVSS 7.4 improper certificate validation in `getAuthContext`; plus low `GHSA-f596-whhp-79r4`), resolved transitively via `firebase@13.2.0` -> `@firebase/firestore@4.19.1` -> `@grpc/grpc-js@1.9.16`. Meanwhile `firebase-admin@14.5.1` already uses `@grpc/grpc-js@1.14.7`. Browser bundles do not include `@grpc/grpc-js`.
  - **11 Moderate:** `minimatch >=7.0.0 <11.0.1` (`GHSA-g3hv-75wg-m249` ReDoS) inside `eslint`, `typescript-eslint`, and `@firebase/eslint-plugin-security-rules` (devDependencies only).
  - **1 Low:** `esbuild 0.27.3–0.28.0` (`GHSA-g7r4-m6w7-qqqr` Windows dev-server only, devDependency).

### G. Existing Test Suites
- Executed all three existing test suites (`tests/qa_audit_runner.ts`, `tests/security_audit_test.ts`, `tests/phase8_test_suite.ts`). Results are recorded truthfully in Section 8 below. Notable observation: `tests/phase8_test_suite.ts` relies on soft `|| 503` assertions for `/api/quotations` and `/api/newsletter/subscribe` (both returned `503` against the current container IAM context while passing the assertion), and marks `"All 17 Firestore collections mapped in firebase-blueprint.json"` even though `firestore.rules` defines 21 `match` paths and `firebase-blueprint.json` defines 20 entities.

---

## 4. Confirmed Defects (Verified in Source Code & Live Checks)

1. **[P0] Support Ticket Status Toggle Violates `firestore.rules` (`ClientDashboardPage.tsx:1048–1078` vs `firestore.rules:152–169, 292–295`):**
   - `handleToggleTicketStatus` calls `updateSupportTicketStatus()` (`src/firebase/services.ts:591–605`) to toggle `open` ↔ `resolved`. `isValidTicketClientUpdate` strictly enforces `incoming.status == existing.status` and restricts changed keys to `['responses', 'lastRepliedAt', 'updatedAt']`, guaranteeing a `permission-denied` error for all non-admin clients.
2. **[P0] Hardcoded Sample Tenant Data ("Kalinga Logistics" / "Rajiv Sengupta") Shown to Real Authenticated Clients (`ClientDashboardPage.tsx:382–717, 1445–1458`):**
   - Even when `isDemoSandbox === false`, real authenticated clients see hardcoded sample sprint tasks, milestones (`Rajiv Sengupta` on line `461`), project updates, documents (`Kalinga Logistics Infrastructure Ltd.`), and the 4th KPI card (`'Sample Sandbox Placeholder'`). `handleSignOffMilestone` (`lines 1018–1045`) only mutates local React state and never writes to Firestore.
3. **[P0] Live `POST /api/quotations` & `POST /api/newsletter/subscribe` Return `HTTP 503` in Current Container Runtime:**
   - Observed directly during `phase8_test_suite.ts` execution (`validStatus=503`). Although `/api/health` detects `gcp_adc`, the runtime service account lacks IAM Firestore write access on `turnkey-invention-70z9n`.
4. **[P1] Admin Inbound Leads Tab Non-Functional for Real Admins (`AdminDashboardPage.tsx:491, 593, 756–808`):**
   - When `isRealAdmin === true`, `leads` is initialized to `[]`, never fetched from Firestore/API, and `handleToggleLeadStatus` only mutates local component state while real inquiries sit in `quotations`.
5. **[P1] Admin-Generated Invoices Default `clientId` to `'client-custom'` (`AdminDashboardPage.tsx:453–461, 1043–1046` & `server.ts:2514`):**
   - `invoiceForm` does not pass the target client's Firebase UID (`clientId`), so direct client Firestore queries (`firestore.rules:275–276`: `resource.data.clientId == request.auth.uid`) and unverified-email accounts cannot retrieve admin-issued invoices.
6. **[P1] Missing `/firebase.json` & Schema Drift in `/firebase-blueprint.json`:**
   - Repo root lacks `firebase.json` (and `firestore.indexes.json`). `firebase-blueprint.json` diverges from runtime code/rules on `Notification` (`body` vs `message`/`messageHi`), `Quotation` (missing `phone`, `company`, `brief`, `attachment`), `SiteSetting` (`cin` vs `companyRegistration`), `Invoice` (`amount`/`taxAmount`/`dueDate` vs `subtotal`/`gstRate`/`gstAmount`/`totalAmount`/`hsnSac`/`dueAt`/`verificationHash`), and `User` (missing `companyName`, `phone`).
7. **[P1] Placeholder `https://YOUR-DOMAIN.com` Served in Live `/robots.txt` & `/sitemap.xml` (`server.ts:2572–2634`):**
   - `resolveSeoBaseUrl()` defaults strictly to `'https://YOUR-DOMAIN.com'` when `SITE_URL` is unset; `/apps/:id` dynamic routes are excluded from `/sitemap.xml`; unknown routes in `NavigationContext.tsx` / `App.tsx` silently render `home` with HTTP 200 instead of a 404/`noindex` view.
8. **[P1] App Check Middleware Omitted on Upload, Payment & Audit API Routes (`server.ts` & `ValidatedFileUploader.tsx:158–171`):**
   - App Check verification is enforced only on inquiry/quotation/newsletter routes, not on `/api/files/upload`, `/api/payments/*`, or `/api/audit-events`, and `ValidatedFileUploader.tsx` never attaches `X-Firebase-AppCheck`.
9. **[P2] Sequential N+1 Firestore Read Loop (`src/firebase/services.ts:668–674`):**
   - `fetchAllUsers()` awaits `fetchUserRole(d.id)` sequentially inside a `for` loop instead of `Promise.all` or batched lookup.
10. **[P2] UI, Form & Copy Bugs Across Admin, Consultation & Components:**
    - `AdminDashboardPage.tsx:1421–1484`: `lg:grid-cols-6` grid renders **7** metric cards (orphaning card #7); line `3156` hardcodes `"17 Collections"` (actual rules define 21); lines `2459, 3168` inspect `ephemeralDiskWarning` which `server.ts:1233` hardcodes to `null`.
    - `ConsultationModal.tsx:242–243`: renders random `PWS-xxxxxx` reference instead of the server-generated `quoteId`.
    - `ContactCtaSection.tsx:384, 397` vs `ConsultationModal.tsx:375, 387`: mismatched `<option>` keys (`api-gateway` / `urgent` vs `api-integration` / `immediate`).
    - Duplicate AI estimator logic between `AiSolutionsSection.tsx` and `AiSolutionsPage.tsx`.
    - Accessibility defects: 9 modals lack `role="dialog"` / `aria-modal="true"`, zero dialogs handle `Escape` key dismissal, and `NotificationDropdown.tsx:119` & `ServicesSection.tsx:99` use interactive `<div>` elements instead of buttons.
11. **[P2] Random 4-Digit Invoice Number Suffix (`server.ts:1453, 1540, 2497`):**
    - `Math.random()` 4-digit suffixes (`1000–9999`) are generated without collision checking.
12. **[P2] Unused `GEMINI_API_KEY` / `@google/genai` Declaration (`metadata.json`, `package.json`):**
    - `@google/genai@^2.4.0` (`2.32.0`) and `MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API` are declared without any active runtime implementation.

---

## 5. Potential Security & Operational Risks (Unconfirmed at Runtime or Architecture-Level)

1. **In-Memory Rate Limiting (`server.ts:746–773`):** `rateLimitMap`, `uploadRateMap`, and `formRateMap` are per-container memory structures; horizontal scaling across multiple Cloud Run instances multiplies effective client limits per IP.
2. **Fallback RS256 Verifier When Admin Credentials Absent (`server.ts:630–686`):** Validates Google x509 signatures, `aud`, `iss`, `exp`, and `iat`, but does not perform `verifyIdToken(..., true)` token revocation checks and relies on runtime REST calls to `firestore.googleapis.com` for admin verification.
3. **High Severity Transitive `@grpc/grpc-js@1.9.16` Advisory (`GHSA-m9gg-hp2v-232j`):** Resides in `firebase` (`@firebase/firestore`) dependency tree; while browser bundles strip it, any server-side script importing client `firebase/firestore` uses `1.9.16` until overridden/upgraded and tested for compatibility.
4. **Live `firestore.rules` Deployment Parity Cannot Be Verified Locally:** Cannot confirm from read-only source inspection whether `firestore.rules` on disk matches the currently deployed rules on `turnkey-invention-70z9n` / DB `ai-studio-powerwebstudioai-4b6a19ad-e6d7-4bd0-a968-9c08eb07a897`, nor has 2-user cross-tenant isolation (`SEC-07`) been tested against a live rules engine.
5. **15 MB Base64 JSON Upload Buffering (`server.ts:351, 1739`):** Decoding 10 MB Base64 files in JSON request bodies allocates ~24 MB of concurrent heap per upload on default `512Mi` Cloud Run instances; direct signed GCS upload URLs or multipart streaming would reduce memory pressure.
6. **Admin-Created Customer Docs Without Auth UIDs (`CustomerManagerModal.tsx`):** `saveClientRecord()` creates synthetic `uid: 'user-...'` records that cannot match real Firebase Auth `request.auth.uid` until reconciled with actual Auth accounts.
7. **Dual Lockfiles (`bun.lock` + `package-lock.json`):** Risk of dependency drift between `bun` and `npm ci` (`Dockerfile` uses `npm ci`).
8. **`STRICT_PRODUCTION_ENV` & `ENFORCE_APP_CHECK` Default to `false`:** Allows misconfigured production containers to boot in degraded/advisory mode unless explicitly set to `'true'`.

---

## 6. Missing Functionality

1. **Real Firestore Backing for Client Portal Engineering Data:** Live Firestore persistence for sprint tasks (`project_tasks`), milestone sign-off (`milestones`), engineering updates, and client deliverables (including real `.apk` artifact storage/download instead of `.txt` attestation certificates).
2. **Real Persistence for Admin `Inbound Leads` Tab:** Unified inquiry/lead pipeline backed by Firestore instead of in-memory state.
3. **Firebase Project Config Files:** `/firebase.json` and `/firestore.indexes.json` for reproducible CLI deployments and Local Emulator Suite runs.
4. **404 / Not-Found Page & `noindex` SEO State:** Explicit fallback UI and metadata for invalid routes.
5. **Implemented Gemini AI Backend Proxy Route (or Cleanup):** Either implement a real server-side `@google/genai` architectural scoping endpoint matching `metadata.json` (`MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API`) or remove unused capability/dependency declarations (requires user approval).

---

## 7. Deployment Blockers

The following items block safe production launch on Google Cloud Run:

| Blocker | Current State | Required Action Before Deploy |
|---|---|---|
| **Runtime IAM Permissions (`GCP ADC`)** | `POST /api/quotations` returns `HTTP 503` in current container | Grant least-privilege Cloud Run runner service account Firestore (`roles/datastore.user`) & Storage Object Admin IAM roles on `turnkey-invention-70z9n`. |
| **Private Cloud Storage (`GCS_BUCKET`)** | Unset (`storageMode: "storage_not_configured"`, uploads disabled `HTTP 503`) | Provision private GCS bucket, configure IAM, set `GCS_BUCKET`, and verify `SEC-08` round-trip. |
| **Production Domain (`SITE_URL`)** | Unset (`/robots.txt` & `/sitemap.xml` serve `https://YOUR-DOMAIN.com`) | Set canonical `SITE_URL` as both Docker build-arg and Cloud Run env var. |
| **App Check (`VITE_RECAPTCHA_SITE_KEY` + `ENFORCE_APP_CHECK`)** | Unset / `advisory_until_configured` | Provision reCAPTCHA v3 site key, register in Firebase App Check, bake `VITE_RECAPTCHA_SITE_KEY` into Vite build, and set `ENFORCE_APP_CHECK=true`. |
| **Strict Env Guard (`STRICT_PRODUCTION_ENV`)** | `false` | Set `NODE_ENV=production` and `STRICT_PRODUCTION_ENV=true` in Cloud Run. |
| **Client Support Ticket & Sample Data Fixes** | Client ticket status toggle fails rules; sample data visible to real clients | Fix `ClientDashboardPage` sample gating & ticket status rules parity. |
| **Unverified External Gates** | No Docker, Java JRE, or Chromium in current environment | Run `SEC-07` (2-user rules/tenant isolation), Docker image build + smoke run, and real browser OAuth + responsive QA. |

---

## 8. Executed Test & Verification Matrix (Truthful Results)

| Check / Test Suite | Status | Observed Evidence |
|---|---|---|
| **TypeScript Check (`npm run typecheck`)** | **PASS** | `tsc --noEmit` exited `0` (0 errors). |
| **ESLint & Rules Check (`npm run lint`)** | **PASS** | `eslint .` exited `0` (includes `@firebase/eslint-plugin-security-rules`). |
| **Production Vite Build (`npm run build`)** | **PASS** | Built `34` assets into `dist/` (`8.1M`) in `1.96s`; zero secrets detected in bundle. |
| **Asset Integrity Check (`public/` & `src/assets/images/`)** | **PASS** | All `manifest.json` icons, `og-image.jpg`, `robots.txt`, `sitemap.xml`, `sw.js`, and 5 WebP+JPG pairs present. |
| **Live Dev HTTP Probes (`http://127.0.0.1:3000`)** | **PASS (with warnings)** | `GET /`, `/about`, `/services`, `/apps/bariha-pay`, `/api/health`, `/api/system/capabilities`, `/api/public/catalog`, `/robots.txt`, `/sitemap.xml`, `/manifest.json`, `/sw.js` all returned `200`; `/api/health` showed `database.status=CONNECTED` (`probeHttpStatus=403`), `storageMode=storage_not_configured`, `siteUrlConfigured=false`. |
| **QA Audit Runner (`npm test` -> `tests/qa_audit_runner.ts`)** | **PASS (8) / NOT VERIFIED (3)** | `TEST 1,2,4,5,7,9,10,11` **PASS**; `TEST 3` (responsive Chromium viewport), `TEST 6` (live Google OAuth popup flow), `TEST 8` (live 2-user cross-tenant isolation) **NOT VERIFIED**. |
| **Security Audit Suite (`npx tsx tests/security_audit_test.ts`)** | **PASS (9) / BLOCKED (2)** | `SEC-01..SEC-06`, `SEC-09..SEC-11` **PASS**; `SEC-07` (2-user Firestore Emulator/Auth round-trip — missing Java JRE & test user ID tokens) **BLOCKED**; `SEC-08` (live GCS upload/download/delete — `GCS_BUCKET` unset & missing customer token) **BLOCKED**. |
| **Phase 8 Suite (`npx tsx tests/phase8_test_suite.ts`)** | **PASS (24/24 assertions; degraded 503 observed)** | All 24 script assertions passed; note `POST /api/quotations` & `POST /api/newsletter/subscribe` returned `HTTP 503` (Admin write unavailable in container ADC) and were accepted by the script's fallback `|| 503` check. |
| **Dependency Audit (`npm audit --json`)** | **FAIL (16 advisories)** | `4 high` (`@grpc/grpc-js@1.9.16` via `firebase`), `11 moderate` (`minimatch` dev-only), `1 low` (`esbuild` Windows dev-only). |
| **Docker Build & Cloud Run Deploy** | **NOT TESTED** | `docker` CLI not present in audit container; deployment explicitly excluded from audit scope. |
| **Real Browser Google OAuth & Mobile/Desktop UI** | **NOT VERIFIED** | No headless Chromium binary installed; interactive browser session not executed. |

---

## 9. Prioritized Repair Order

### P0 — Critical Functional, Data-Leak & Rules Parity Fixes
1. **Gate/Replace Sample Data in `ClientDashboardPage.tsx`:** Restrict `Kalinga Logistics` / `Rajiv Sengupta` sample arrays (`sprintTasks`, `milestonesList`, `projectUpdates`, `enterpriseDocuments`, 4th KPI card) strictly to `isDemoSandbox === true`; render empty/real Firestore state for authenticated clients and persist milestone sign-offs to Firestore.
2. **Fix Support Ticket Status Parity (`ClientDashboardPage.tsx` &/or `firestore.rules`):** Either remove/disable client-side `status` mutation in `handleToggleTicketStatus` (letting clients submit a close-request reply or restricting status toggles to Admin) or add a narrowly validated `affectedKeys().hasOnly(['status', 'updatedAt'])` rule if clients are permitted to resolve/reopen their own tickets.
3. **Provision Runtime IAM Permissions for Admin SDK:** Ensure the Cloud Run/preview runtime service account has Firestore Data User (`roles/datastore.user`) permissions so `POST /api/quotations` and `POST /api/newsletter/subscribe` return `HTTP 200/201` instead of `HTTP 503`.

### P1 — High-Priority Security, Admin Features & Production Config
4. **Fix Admin `Inbound Leads` Tab & Invoice `clientId` Binding (`AdminDashboardPage.tsx`):** Connect `Inbound Leads` to Firestore or remove unused placeholder state, and include a client UID selector in `invoiceForm` so generated invoices link to actual Firebase UIDs (`clientId`).
5. **Expand App Check Enforcement Coverage:** Add `verifyAppCheckToken` to `/api/files/upload`, `/api/payments/*`, and `/api/audit-events`, and pass `getAppCheckTokenHeader()` in `ValidatedFileUploader.tsx`.
6. **Fix SEO Base URL Fallback & Dynamic Sitemap (`server.ts` & `NavigationContext.tsx`):** Fall back to request host/protocol in `resolveSeoBaseUrl()` when `SITE_URL` is unset (excluding `YOUR-DOMAIN.com` placeholders), include `/apps/:id` routes in `/sitemap.xml`, and add a clean 404/`noindex` fallback view.
7. **Sync `firebase-blueprint.json` & Add `firebase.json`:** Align all entity schemas (`Notification`, `Quotation`, `SiteSetting`, `Invoice`, `User`) with runtime code/`firestore.rules`, add `/firebase.json` + `firestore.indexes.json`, and validate rules against the Firebase Local Emulator (`SEC-07`).

### P2 — Medium-Priority Quality, Dependencies, Accessibility & Performance
8. **Resolve Dependency & Lockfile Hygiene:** Remove unused `bun.lock` (if standardizing on `npm`), and test an `overrides` pin for `@grpc/grpc-js >= 1.13.6` compatible with `firebase@13.2.0` + `firebase-admin@14.5.1` to eliminate the 4 high advisories.
9. **Fix `fetchAllUsers` N+1 Loop & Invoice Suffix Uniqueness:** Parallelize role lookups in `services.ts:668–674` with `Promise.all` and use collision-safe invoice IDs.
10. **Fix Admin Dashboard Grid/Copy Bugs & Consultation Reference ID:** Change `lg:grid-cols-6` (`AdminDashboardPage.tsx:1421`) for 7 cards, update `"17 Collections"` count, pass returned `quoteId` to `ConsultationModal.tsx` success view, unify `<select>` option keys, deduplicate AI estimator helper, and add `role="dialog"` / `aria-modal="true"` / `Escape` handling + semantic `<button>` elements across all remaining modals/cards.
11. **Decide on `@google/genai` / `GEMINI_API_KEY`:** Either implement the server-side Gemini AI scoping endpoint referenced in `metadata.json` and `DEPLOYMENT_AUDIT.md`, or clean up unused dependency/capability declarations.

### Pre-Deployment Verification Gate (Run Before Cloud Run Release)
- Configure `SITE_URL`, `GCS_BUCKET`, `PAYMENT_SECRET` (>= 32 chars), `VITE_RECAPTCHA_SITE_KEY`, `ENFORCE_APP_CHECK=true`, `STRICT_PRODUCTION_ENV=true`.
- Execute `npm run check`, multi-stage `docker build`, live `SEC-07` (2-user rules test) & `SEC-08` (live GCS upload/download/delete), and browser verification (Google OAuth popup + `375px` / `768px` / `1440px` layouts).
