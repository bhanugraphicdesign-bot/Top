# POWER WEB STUDIO AI — Google Cloud Run & Firebase Production Deployment Plan

**Company:** BHANU RAM BARIHA DIGITAL TECHNOLOGIES  
**Brand / Platform:** POWER WEB STUDIO AI  
**Target Platform:** Google Cloud Run (Managed Container)  
**Target Firebase / GCP Project ID:** `turnkey-invention-70z9n` (Project Number from Firebase config: `724375766901`)  
**Firestore Named Database ID:** `ai-studio-powerwebstudioai-4b6a19ad-e6d7-4bd0-a968-9c08eb07a897`  
**Plan Status:** **STOPPED PRIOR TO DEPLOYMENT — AWAITING EXTERNAL VERIFICATION, MANUAL CONSOLE ACTIONS & EXPLICIT USER APPROVAL**

> **Strict Integrity Rule Applied:** This plan records only verified repository facts and direct runtime observations. Unverified Google Cloud attributes — specifically **Firestore `locationId`**, **target Cloud Run region**, **GCS bucket name**, **production domain (`SITE_URL`)**, **Artifact Registry repository**, and **runtime service account email** — are intentionally represented as `<PLACEHOLDER>` parameters to be populated only after inspecting `turnkey-invention-70z9n` in Google Cloud / Firebase Console.

---

## Task 1: Runtime, Build, Express & Container Verification

| Check Item | Verification Method & Ground Truth | Status | Findings / Evidence |
|---|---|---|---|
| **Node.js 24 Runtime** | Inspected `Dockerfile`, `package.json`, and ran native Node execution tests (`node server.ts`). | **VERIFIED IN CONFIG (Docker runtime unbuilt locally)** | `Dockerfile` uses `FROM node:24-slim` across all 3 stages (`builder`, `prod-deps`, `runner`). `package.json` specifies `"engines": { "node": "^22.23.2 || >=24.12.0", "npm": ">=10.0.0" }`. Sandbox runs `v22.23.2`; Cloud Build / Docker will run Node 24 LTS cleanly without `tsx` or TypeScript compilation of `server.ts`. |
| **npm Dependency Installation** | Ran `npm ls --depth=0 --omit=dev` and `npm audit --omit=dev --json`. | **PASS (0 Prod Advisories)** | `package-lock.json` resolves cleanly with `13` production packages (`express`, `cors`, `helmet`, `dotenv`, `zod`, `firebase-admin`, `@google-cloud/storage`, `@google/genai`, `firebase`, `react`, `react-dom`, `lucide-react`, `motion`). Production dependency audit returned **0 vulnerabilities** (`critical: 0, high: 0, moderate: 0, low: 0`). Dev-only advisories do not ship in Stage 3 (`runner`). Note: `bun.lock` is ignored by `.dockerignore` and unused by `npm ci`. |
| **Docker Multi-Stage Build** | Audited `Dockerfile` (53 lines) and `.dockerignore` (28 lines). Live `docker build` blocked (`docker` CLI absent in container). | **VALIDATED BY INSPECTION (Live Build BLOCKED)** | Stage 1 (`builder`): `npm ci` + `npm run build` -> `/app/dist`. Stage 2 (`prod-deps`): `npm ci --omit=dev --ignore-scripts` (drops `vite`, `tsx`, `eslint`, `typescript`). Stage 3 (`runner`): `node:24-slim`, `USER node` (non-root), copies `/dist`, `node_modules`, `server.ts`, `firebase-applet-config.json`, `package*.json`, `public/{robots.txt,sitemap.xml}`. `.dockerignore` excludes `.env*`, `*.key`, `*.pem`, `*service-account*.json`, `tests/`, `scripts/`, `*.md`. |
| **Production Static Assets** | Verified `npm run build` (`vite build`) and live HTTP serving with `NODE_ENV=production` on isolated port `8091`. | **PASS** | `dist/` built cleanly (`35` assets, root + `assets/` chunks, `sw.js`, `manifest.json`, icons, `robots.txt`, `sitemap.xml`). Express served `/` (`HTTP 200`, `text/html`), `/assets/index-*.js` (`HTTP 200`, `application/javascript`), `/about` SPA fallback (`HTTP 200`), strict CSP (without `'unsafe-inline'`/`'unsafe-eval'` in `script-src`), `HSTS`, `nosniff`, and `no-cache` headers on `sw.js`. |
| **Express Server (`server.ts`)** | Verified `NODE_ENV=production node server.ts` startup, middleware order, CSP, CORS, rate limiting, and `/api` 404/error handlers. | **PASS** | Starts cleanly on `0.0.0.0:${PORT}` without importing `vite` or `tsx` (`vite` dynamic import only occurs when `NODE_ENV !== 'production'`). |
| **`PORT 8080` Support** | Checked `Dockerfile` (`ENV PORT=8080`, `EXPOSE 8080`) and `server.ts:22` (`parseInt(process.env.PORT \|\| '3000', 10)`). | **PASS** | Container defaults `PORT=8080` and honors Cloud Run's injected `PORT` env var dynamically. *(Note: In the AI Studio dev sandbox, TCP `8080` is occupied by an internal proxy daemon, causing `EADDRINUSE` locally; testing succeeded cleanly on port `8091`, and Cloud Run containers have an isolated network namespace.)* |
| **Health Checks** | Audited `Dockerfile:49-50` & `server.ts:1169-1267`; tested `GET /api/health` in `NODE_ENV=production`. | **PASS** | Returns `HTTP 200 OK` JSON with `status` (`ONLINE` / `DEGRADED`), Firestore connectivity probe, `firebaseAdminMode`, `storage` verification state, and environment summary without leaking secrets. Docker `HEALTHCHECK` runs native Node `fetch` against `127.0.0.1:${PORT:-8080}/api/health`. |
| **Graceful Shutdown** | Tested `kill -TERM` against live `NODE_ENV=production node server.ts`. | **PASS** | `server.ts:2954-2968` handles `SIGTERM` and `SIGINT`, calls `server.close(...)`, enforces a `15s` forced-exit fallback timer (`unref()`), and terminated cleanly with exit status `0`. |

---

## Task 2: Google Cloud Architecture & Resource Preparation

### 2.1 Region Selection Rule (Do NOT Use Unverified Examples)

> **CRITICAL CORRECTION TO PRIOR NOTES:** Earlier documentation (`/DEPLOYMENT_AUDIT.md`) included unverified example commands targeting `asia-northeast1` (the AI Studio preview environment region, GCP project number `800238861030`). Those values **must not be assumed** for production project `turnkey-invention-70z9n`.

Inside this sandbox, there is no authenticated `gcloud` CLI session and the preview runtime's service account does not carry `roles/datastore.viewer` management metadata permissions on `turnkey-invention-70z9n`, so the Firestore database `locationId` could not be queried from here *(notably, direct HTTPS REST probes to the Firestore DB from `asia-northeast1` measured `~794–871 ms`, so co-location must be verified explicitly before choosing a Cloud Run region)*.

**Mandatory Step 0 — Verify Firestore Database Location & Project Availability First:**
```bash
gcloud firestore databases describe \
  --database="ai-studio-powerwebstudioai-4b6a19ad-e6d7-4bd0-a968-9c08eb07a897" \
  --project="turnkey-invention-70z9n" \
  --format="table(name,locationId,type,databaseEdition)"
```

**Deterministic Region Mapping Once `locationId` Is Verified:**

| Verified Firestore `locationId` | Recommended Cloud Run & GCS Region (`<VERIFIED_REGION>`) | Rationale |
|---|---|---|
| Single region (e.g., `asia-south1`, `asia-southeast1`, `asia-northeast1`, `us-central1`, `europe-west1`) | **Exact same region** as Firestore `locationId` | Minimum round-trip latency (<5–15ms intra-region) & zero cross-region network egress |
| Multi-region `nam5` (North America) | `us-central1` (or closest supported Cloud Run region in US) | Co-located inside US multi-region backbone |
| Multi-region `eur3` (Europe) | `europe-west1` or `europe-west4` | Co-located inside EU multi-region backbone |
| Regional bucket for `<PRIVATE_GCS_BUCKET>` | Same `<VERIFIED_REGION>` as Cloud Run | Single-region bucket avoids cross-region upload/download latency and transfer fees |

---

### 2.2 Required Google Cloud Services & Resources (To Provision Upon Approval)

1. **Required GCP APIs on `turnkey-invention-70z9n`:**
   - `run.googleapis.com` (Cloud Run Admin API)
   - `artifactregistry.googleapis.com` (Artifact Registry)
   - `cloudbuild.googleapis.com` (Cloud Build — if building image in GCP rather than local Docker)
   - `secretmanager.googleapis.com` (Secret Manager)
   - `storage.googleapis.com` (Cloud Storage)
   - `firestore.googleapis.com` (Cloud Firestore API)
   - `firebaseappcheck.googleapis.com` & `recaptchaenterprise.googleapis.com` / reCAPTCHA v3 (Firebase App Check)

2. **Artifact Registry Repository (`<VERIFIED_REGION>`):**
   - Docker-format repository (e.g., `<ARTIFACT_REPO>` in `<VERIFIED_REGION>`-docker.pkg.dev/`turnkey-invention-70z9n`/`<ARTIFACT_REPO>`).
   - Enable vulnerability scanning and configure a cleanup policy to retain the latest N tagged production images.

3. **Cloud Build Pipeline (Optional / Recommended for Reproducible Zero-Laptop Builds):**
   - Builds `Dockerfile` passing **only public build arguments** (`SITE_URL`, `VITE_RECAPTCHA_SITE_KEY`, `VITE_FIREBASE_MEASUREMENT_ID`) via `--build-arg`.
   - Never pass `PAYMENT_SECRET`, `PAYMENT_WEBHOOK_SECRET`, `GEMINI_API_KEY`, or service account keys in `cloudbuild.yaml` build args or substitutions exposed in frontend bundles.

4. **Cloud Storage Private Bucket (`<PRIVATE_GCS_BUCKET>`):**
   - Location: `<VERIFIED_REGION>` (matching Cloud Run).
   - **Uniform bucket-level access:** ENABLED (`--uniform-bucket-level-access`).
   - **Public Access Prevention:** ENFORCED (`--public-access-prevention`).
   - Storage class: `STANDARD`. Versioning: recommended (`enabled`) to recover accidental deletions.
   - All objects written under `vault/<uid>/<uuid>.<ext>` by `server.ts:1833` via authenticated backend upload only.

5. **Google Secret Manager Secrets (Never in Env Var Literals or Source Files):**

   | Secret Name | Purpose | Validation Constraints in `server.ts` |
   |---|---|---|
   | `<SECRET_PAYMENT>` (`payment-secret`) | HMAC-SHA256 signing of `/api/payments/create-intent` and timing-safe `/api/payments/verify` checksums | Required when payments enabled (`>= 32` chars high-entropy hex/random; placeholder prefixes rejected; required by `STRICT_PRODUCTION_ENV=true`). |
   | `<SECRET_PAYMENT_WEBHOOK>` (`payment-webhook-secret`) | Optional HMAC-SHA256 verification of bank/NPCI gateway callback header `X-Payment-Gateway-Signature` for non-admin client settlements | Optional unless automated non-admin gateway settlement webhooks are active (`>= 32` chars). |
   | `<SECRET_GEMINI_API>` (`gemini-api-key`) | Server-side Gemini API key (`GEMINI_API_KEY`) checked by `/api/system/capabilities` and reserved for server-side `@google/genai` routes (`metadata.json` capability) | Must not be prefixed `VITE_`; must never appear in frontend bundles. Note: currently `server.ts` declares no active AI route and `STRICT_PRODUCTION_ENV=true` does not fail if omitted. |

6. **Least-Privilege IAM Service Account (`<CLOUD_RUN_SA>@turnkey-invention-70z9n.iam.gserviceaccount.com`):**
   - Create a dedicated Cloud Run runtime service account rather than using the default Compute Engine service account (`-compute@developer.gserviceaccount.com`, which typically carries overly broad `Editor` rights).
   - **Required IAM Bindings (Minimal Privilege Only):**
     - **Project-level Firestore access:** `roles/datastore.user` on `turnkey-invention-70z9n` (allows Admin SDK Firestore reads/writes for `quotations`, `invoices`, `payments`, `payment_intents`, `file_records`, `audit_logs`, `newsletter_subscribers`, `user_roles`).
     - **Bucket-scoped GCS access (NOT project-wide):** `roles/storage.objectAdmin` granted **only on `gs://<PRIVATE_GCS_BUCKET>`** (supports upload `.save()`, `.exists()`, `.createReadStream()`, `.delete()`, and object inspection; if using V4 `signed_url` mode in `server.ts:1988`, also grant `roles/iam.serviceAccountTokenCreator` to the SA on itself so IAM `signBlob` works via ADC without a static JSON private key!).
     - **Secret-scoped Secret Manager access (NOT project-wide):** `roles/secretmanager.secretAccessor` granted **only on the specific secrets** mounted to Cloud Run.
     - **Observability:** `roles/logging.logWriter` and `roles/monitoring.metricWriter`.
     - **Cloud Run Service Agent / Deployer:** Cloud Build / CI deployer SA needs `roles/run.developer`, `roles/artifactregistry.writer`, and `roles/iam.serviceAccountUser` on `<CLOUD_RUN_SA>`.

7. **Firebase Admin SDK Using Application Default Credentials (ADC):**
   - Verified in `server.ts:106-143`:
     - Cloud Run automatically sets `K_SERVICE`, triggering `initializeApp({ credential: applicationDefault(), projectId: 'turnkey-invention-70z9n', storageBucket: process.env.GCS_BUCKET || ... })`.
     - Connects explicitly to named Firestore DB: `getFirestore(adminApp, 'ai-studio-powerwebstudioai-4b6a19ad-e6d7-4bd0-a968-9c08eb07a897')`.
     - Token verification (`getAuth(adminApp).verifyIdToken(token, true)`) and App Check verification (`getAppCheck(adminApp).verifyToken(token)`) work natively via ADC with no static JSON key (`FIREBASE_SERVICE_ACCOUNT_KEY` stays unset in Cloud Run).

---

## Task 3: Complete Environment Configuration Specification

### Critical Build-Time vs Runtime Pairing Rules
- **NEVER put secrets in `Dockerfile` `ARG`s or `VITE_*` variables.** Any `VITE_*` variable is embedded into public browser JS inside `dist/`.
- **Dual-Injection Requirement for Public Config (`VITE_RECAPTCHA_SITE_KEY` & `SITE_URL`):**
  1. `VITE_RECAPTCHA_SITE_KEY` **must** be supplied both as a Docker `--build-arg` (so `src/firebase/appCheck.ts` initializes ReCaptchaV3Provider in `dist/`) **AND** as a Cloud Run runtime env var (or paired with `ENFORCE_APP_CHECK=true`, because `server.ts:59-64` checks `process.env.VITE_RECAPTCHA_SITE_KEY || process.env.RECAPTCHA_SITE_KEY`). Passing `ENFORCE_APP_CHECK=true` at runtime without baking `VITE_RECAPTCHA_SITE_KEY` into the frontend build will cause legitimate users' browser form submissions to fail with `HTTP 403 APP_CHECK_REQUIRED`.
  2. `SITE_URL` **must** be supplied both as `--build-arg SITE_URL=...` (baked into `vite.config.ts` `import.meta.env.VITE_SITE_URL` for client `<SEO />` canonical/OG URLs) **AND** as a Cloud Run runtime env var (used by `server.ts` for `/robots.txt`, `/sitemap.xml`, SSR HTML canonical substitution, and CORS origin allowlist).

### Environment Variables Matrix

| Variable | Classification | Injection Point | Recommended Production Value | Server Verification / Behavior (`server.ts`) |
|---|---|---|---|---|
| `NODE_ENV` | Public Runtime Var | Cloud Run Env (also `ENV` in `Dockerfile`) | `production` | Serves `/dist`, enables strict CSP (drops `'unsafe-inline'`/`'unsafe-eval'` in `script-src`), activates `STRICT_PRODUCTION_ENV` check at boot. |
| `PORT` | Public Runtime Var | Cloud Run Reserved / `Dockerfile` | `8080` | Binds Express listener on `0.0.0.0:8080`. |
| `SITE_URL` | Public Build Arg & Runtime Env | Docker `--build-arg` + Cloud Run `--set-env-vars` | Exact live HTTPS origin (`https://<VERIFIED_DOMAIN>`, no trailing slash) | Must start with `http(s)://` and not contain `YOUR-DOMAIN.com`; required when `STRICT_PRODUCTION_ENV=true`. Added to `CORS_ALLOWED_ORIGINS` set automatically (`server.ts:317`). |
| `GCS_BUCKET` | Server Runtime Var | Cloud Run `--set-env-vars` | `<PRIVATE_GCS_BUCKET>` (name only, without `gs://`) | Verified on boot with `gcsStorageClient.bucket(...).exists()`; `/api/files/*` fails closed with `HTTP 503 STORAGE_NOT_CONFIGURED` if missing/unverified. Required by `STRICT_PRODUCTION_ENV=true`. |
| `GEMINI_API_KEY` | **Confidential Secret** | Cloud Run `--set-secrets` (Secret Manager) | `<SECRET_GEMINI_API>:latest` | Read server-side only; reported via boolean `geminiApiConfigured` in `/api/system/capabilities` (value never exposed). Optional unless activating server-side Gemini features. |
| `PAYMENT_SECRET` | **Confidential Secret** | Cloud Run `--set-secrets` (Secret Manager) | High-entropy random hex >=32 chars (e.g. `openssl rand -hex 32`) | Validated length `>= 32` & non-placeholder (`server.ts:200-209`). Required when `STRICT_PRODUCTION_ENV=true` (exits `1` if missing/weak). |
| `PAYMENT_WEBHOOK_SECRET` *(Recommended)* | **Confidential Secret** | Cloud Run `--set-secrets` (only if gateway webhooks enabled) | Separate random hex >=32 chars | Enables client-side gateway-signed settlements via `X-Payment-Gateway-Signature`; without it, only Admins can settle invoices in verified mode. |
| `VITE_RECAPTCHA_SITE_KEY` | Public Client Key | Docker `--build-arg` **AND** Cloud Run `--set-env-vars` | Live reCAPTCHA v3 Site Key registered in Firebase App Check | Client initializes App Check; server enforces `X-Firebase-AppCheck` when set or when `ENFORCE_APP_CHECK=true`. Required by `STRICT_PRODUCTION_ENV=true`. |
| `VITE_FIREBASE_MEASUREMENT_ID` *(Optional)* | Public Client Key | Docker `--build-arg` | Live GA4 Measurement ID (`G-...`) or `""` | Optional client Firebase Analytics tag. |
| `ENFORCE_APP_CHECK` | Security Runtime Flag | Cloud Run `--set-env-vars` | `"true"` (ONLY once `VITE_RECAPTCHA_SITE_KEY` is baked & registered in App Check!) | Causes `verifyAppCheckForForm` to reject requests missing `X-Firebase-AppCheck` (`HTTP 403 APP_CHECK_REQUIRED`) or unconfigured Admin App Check (`503`). |
| `STRICT_PRODUCTION_ENV` | Security Runtime Flag | Cloud Run `--set-env-vars` | `"true"` | Aborts container startup (`process.exit(1)`) if `SITE_URL`, `GCS_BUCKET`, `PAYMENT_SECRET`, `VITE_RECAPTCHA_SITE_KEY`, or Admin ADC credentials fail validation (`server.ts:2857-2867`). Verified returning exit `1` locally when unset! |
| `TRUST_PROXY_HOPS` | Network Runtime Config | Cloud Run `--set-env-vars` | `"1"` | Bounded `[0..5]` (`server.ts:228-233`); `1` accurately unwraps the single Google Front End proxy hop in Cloud Run for `req.ip` rate limiting & HTTPS detection. |
| `CORS_ALLOWED_ORIGINS` | Security Runtime Config | Cloud Run `--set-env-vars` | Comma-separated origins if using multiple custom domains (e.g. apex + `www.` URL), else `""` | Merged with `SITE_URL`, `localhost:3000`, and `https://*.run.app`; untrusted cross-origins receive `HTTP 403`. *(Note: If you want ONLY your custom domain and not arbitrary `.run.app` preview origins in strict mode, note `server.ts:327` currently permits `https://*.run.app` — review whether `--ingress=all` behind LB should restrict `.run.app`.)* |

---

## Task 4: Firebase Architecture & Readiness (`turnkey-invention-70z9n`)

1. **Confirmed Project ID:** `turnkey-invention-70z9n` (verified in `firebase-applet-config.json`, `server.ts`, and `scripts/create-admin.ts`).
2. **Confirmed Firestore Database ID:** `ai-studio-powerwebstudioai-4b6a19ad-e6d7-4bd0-a968-9c08eb07a897` (Enterprise Edition; verified in `firebase-applet-config.json`, `src/firebase/config.ts:51`, and live `/api/health`).
   - **Update Made During Audit:** Updated `/firebase.json` so `firestore.database` explicitly specifies `"ai-studio-powerwebstudioai-4b6a19ad-e6d7-4bd0-a968-9c08eb07a897"` (preventing Firebase CLI deployments from targeting `(default)` by mistake).
3. **Database Location:** **UNVERIFIED (Requires GCP/Firebase Console or authenticated `gcloud` lookup)** — no CLI token or management permission exists in this sandbox. Must be checked prior to Cloud Run region provisioning.
4. **Google Authentication Authorized Domains:**
   - Current `firebase-applet-config.json` `authDomain`: `turnkey-invention-70z9n.firebaseapp.com`.
   - Google OAuth client ID present in `firebase-applet-config.json`: `724375766901-q0pbmuh6anduvs27oknqoli2dahopdmc.apps.googleusercontent.com`.
   - **Action Required Before Testing Sign-In:** Add both the deployed Cloud Run service hostname (e.g. `<service>-<hash>-<region-code>.a.run.app` or `<service>-724375766901.<VERIFIED_REGION>.run.app`) and the custom production domain (`SITE_URL` hostname) in **Firebase Console -> Authentication -> Settings -> Authorized domains**. Otherwise `signInWithPopup(auth, googleProvider)` will fail with `auth/unauthorized-domain`.
5. **Firestore Security Rules Deployment Readiness:**
   - `/firestore.rules` (373 lines) defines Default Deny catch-all + 21 matched collections with strict RBAC/ABAC, zero hardcoded admin emails, locked `/user_roles`, immutable `/audit_logs`, server-only `/quotations`, and append-only `/support_tickets` client replies.
   - Passes ESLint `@firebase/eslint-plugin-security-rules` cleanly (`npm run lint` -> exit `0`).
   - **Deployment Readiness:** File & `firebase.json` are ready; live deployment NOT executed in this planning phase. After deploying rules (`firebase deploy --only firestore:rules` or via AI Studio Firebase deploy tool upon approval), verify rules parity and run `ADMIN_EMAIL=<OWNER_EMAIL> npx tsx scripts/create-admin.ts` to grant the initial admin account `user_roles/{uid}` + custom claims.
6. **App Check Configuration Readiness:**
   - Client SDK (`src/firebase/appCheck.ts`) initializes `ReCaptchaV3Provider(RECAPTCHA_SITE_KEY)` automatically when `VITE_RECAPTCHA_SITE_KEY` is baked at build time and attaches `X-Firebase-AppCheck` via `getAppCheckTokenHeader()`.
   - Server (`server.ts:989-1051`) validates `X-Firebase-AppCheck` via `getAppCheck(adminApp).verifyToken(token)` on `/api/inquiries/validate`, `/api/quotations`, `/api/newsletter/subscribe`, `/api/files/upload`, `/api/audit-events`, `/api/payments/create-intent`, and `/api/payments/verify`.
   - Currently inactive (`appCheckConfigured: false`); becomes strict fail-closed when `VITE_RECAPTCHA_SITE_KEY` + `ENFORCE_APP_CHECK=true` are active AND Firebase Console App Check has registered the web app (`1:724375766901:web:2154bfae8161ee06e0753c`) with the matching reCAPTCHA v3 secret.

---

## Task 5: Production Readiness Validation & Rollback Strategy

### 5.1 Architecture Validation Matrix

| Control Area | Validation Result | Operational Notes |
|---|---|---|
| **Dockerfile** | **VALIDATED (Code/Structure)** | Clean 3-stage `node:24-slim` build, non-root `USER node`, zero devDependencies/npm cache in final image, `CMD ["node", "server.ts"]` verified runnable natively without `tsx`. |
| **Build Args** | **VALIDATED** | Only public identifiers (`SITE_URL`, `VITE_RECAPTCHA_SITE_KEY`, `VITE_FIREBASE_MEASUREMENT_ID`) accepted by `Dockerfile` `builder` stage. Zero secrets baked into JS chunks or image layers. |
| **Secret Injection** | **VALIDATED** | Secrets mounted exclusively at runtime via Cloud Run Secret Manager flags (`--set-secrets`) -> environment variables (`PAYMENT_SECRET`, optional `PAYMENT_WEBHOOK_SECRET`, `GEMINI_API_KEY`). |
| **Cloud Run Startup (`STRICT_PRODUCTION_ENV=true`)** | **TESTED LOCALLY (Verified Fail-Closed)** | Tested `STRICT_PRODUCTION_ENV=true NODE_ENV=production node server.ts` cleanly aborting with `exit code 1` when required vars are missing (`SITE_URL`, `GCS_BUCKET`, `PAYMENT_SECRET`, `VITE_RECAPTCHA_SITE_KEY`). |
| **Cloud Run Health Checks & Scaling** | **TESTED LOCALLY (`HTTP 200`)** | Configure Cloud Run Startup & Liveness HTTP probes on path `/api/health` port `8080`. Recommended initial spec: `--cpu=1`, `--memory=512Mi` (or `1Gi` if frequent concurrent 10 MB uploads occur, since base64 decoding uses ~24 MB burst heap per upload), `--concurrency=80`, `--timeout=300`. **Scaling caveat:** `rateLimitMap` / `formRateMap` are per-instance in-memory (`server.ts:766-777`), so multi-instance horizontal scaling multiplies per-IP rate quotas across instances. |
| **Storage Permissions** | **VALIDATED IN CODE (Live GCS Pending Bucket)** | Returns `503 STORAGE_NOT_CONFIGURED` cleanly until `GCS_BUCKET` exists AND runtime SA holds `roles/storage.objectAdmin` (plus `roles/iam.serviceAccountTokenCreator` on itself if `?mode=signed_url` is invoked). |
| **CORS & HTTPS / Security Headers** | **TESTED LOCALLY (`NODE_ENV=production`)** | Verified `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, strict production CSP (no `'unsafe-inline'`/`'unsafe-eval'` scripts), `COOP: same-origin-allow-popups` (preserves Google OAuth popup), and explicit `cors` allowlist. Note: Configure Cloud Run `--ingress=all` (or Cloud Load Balancer if restricting direct `.run.app` traffic) with `--allow-unauthenticated` for the public website (API endpoints enforce their own Firebase Bearer JWT + RBAC). |

### 5.2 Rollback Strategy (Zero-Downtime Recovery)
1. **Application / Container Revision Rollback (Cloud Run Traffic Splitting):**
   - Cloud Run keeps previous container revisions immutable. Tag or note the previous healthy revision (`REV_PREV`) before deploying (`gcloud run revisions list --service=<SERVICE_NAME> --region=<VERIFIED_REGION>`).
   - Instant <10s traffic rollback:
     ```bash
     gcloud run services update-traffic <SERVICE_NAME> \
       --to-revisions=<PREVIOUS_HEALTHY_REVISION>=100 \
       --region=<VERIFIED_REGION> \
       --project=turnkey-invention-70z9n
     ```
2. **Container Image Digest Pinning:** Deploy Artifact Registry images by immutable SHA256 digest (`@sha256:...`) rather than mutable `:latest` tags so rollback builds match exact artifacts.
3. **Firestore Security Rules Rollback:** Keep previous release snapshots in Git and Firebase Console (**Firestore -> Rules -> Release history**) to restore prior ruleset in 1 click if a rules deployment blocks legitimate client queries.
4. **App Check Safety Toggle:** If a misconfigured reCAPTCHA domain breaks public form submissions immediately post-launch, temporarily set Cloud Run env var `ENFORCE_APP_CHECK=false` (updating a new revision) while keeping `VITE_RECAPTCHA_SITE_KEY` fixed, avoiding service outage while debugging domain allowlists in reCAPTCHA Console.
5. **Payment Gateway Safe Fallback:** Omitting/disabling webhook secret keeps client invoice self-settlement fail-closed while preserving invoice visibility cleanly.

---

## Mandatory External Prerequisites Before Deployment Can Execute

### A. Manual Google Cloud & Firebase Console Actions Required from User
1. **Verify Project & Billing:** Confirm billing account is active on GCP project `turnkey-invention-70z9n` and APIs (`run`, `artifactregistry`, `cloudbuild`, `secretmanager`, `storage`, `firestore`, `firebaseappcheck`) are enabled.
2. **Inspect Firestore Database Location (`locationId`):** Check Firebase Console -> Firestore Database (`ai-studio-powerwebstudioai-4b6a19ad-e6d7-4bd0-a968-9c08eb07a897`) or run the `gcloud firestore databases describe` command above and provide the verified location so `<VERIFIED_REGION>` is chosen accurately.
3. **Create Artifact Registry Repo & Private GCS Bucket in `<VERIFIED_REGION>`:**
   - Artifact Registry Docker repository (`<ARTIFACT_REPO>`).
   - Private Cloud Storage bucket (`<PRIVATE_GCS_BUCKET>`) with Uniform Bucket-Level Access and Public Access Prevention enforced.
4. **Create Least-Privilege Service Account (`<CLOUD_RUN_SA>`) & Bind IAM Roles:**
   - `roles/datastore.user` (project `turnkey-invention-70z9n`).
   - `roles/storage.objectAdmin` (bucket `gs://<PRIVATE_GCS_BUCKET>` only).
   - `roles/iam.serviceAccountTokenCreator` (on `<CLOUD_RUN_SA>` itself, if V4 signed URLs are used).
   - `roles/secretmanager.secretAccessor` (per-secret binding only).
   - `roles/logging.logWriter`, `roles/monitoring.metricWriter`.
5. **Provision Google Secret Manager Secrets:**
   - `<SECRET_PAYMENT>` (min 32 chars random hex/entropy — e.g. `openssl rand -hex 32`).
   - `<SECRET_PAYMENT_WEBHOOK>` (optional, separate min 32 chars random hex if using payment gateway webhooks).
   - `<SECRET_GEMINI_API>` (optional unless Gemini endpoints are enabled; never put in frontend env).
6. **Configure reCAPTCHA v3 & Firebase App Check:**
   - Create a reCAPTCHA v3 key in Google Cloud / reCAPTCHA Admin authorizing your `<VERIFIED_DOMAIN>` and Cloud Run `*.run.app` hostname.
   - Register the reCAPTCHA v3 **secret** in **Firebase Console -> App Check -> Apps** for Web App `1:724375766901:web:2154bfae8161ee06e0753c`.
   - Record the public **Site Key** as `VITE_RECAPTCHA_SITE_KEY`.
7. **Update Firebase Authentication Authorized Domains:**
   - Add `<VERIFIED_DOMAIN>` (and the deployed Cloud Run hostname once created) under **Firebase Console -> Authentication -> Settings -> Authorized domains**.
8. **Custom Domain HTTPS Mapping (If Using Own Domain):**
   - Configure Cloud Run Domain Mapping or HTTPS Load Balancer + Managed SSL Certificate for `<VERIFIED_DOMAIN>` and update DNS `A`/`AAAA`/`CNAME` records.
9. **Deploy Firestore Security Rules & Bootstrap First Admin:**
   - Deploy `firestore.rules` to database `ai-studio-powerwebstudioai-4b6a19ad-e6d7-4bd0-a968-9c08eb07a897` (and grant first admin via `ADMIN_EMAIL=<ADMIN_EMAIL> npx tsx scripts/create-admin.ts` using ADC/authorized workstation credentials).

### B. Required External Credentials / Values Summary Needed From User

| Item | Required? | Sensitivity | Notes |
|---|---|---|---|
| Authenticated `gcloud` / GCP Console access to `turnkey-invention-70z9n` | **Yes** | Account Auth | Needed to verify Firestore `locationId`, enable APIs, and run deployment |
| Verified Firestore Database `locationId` & chosen `<VERIFIED_REGION>` | **Yes** | Public Config | Must be inspected, never guessed |
| Production Custom Domain or target `SITE_URL` | **Yes** | Public Config | Required for SEO canonical URLs, `robots.txt`, `sitemap.xml`, CORS, reCAPTCHA, Auth domain |
| Private GCS Bucket Name (`GCS_BUCKET`) | **Yes** (for uploads & `STRICT_PRODUCTION_ENV=true`) | Internal Config | Enforced private bucket in `<VERIFIED_REGION>` |
| reCAPTCHA v3 Site Key (`VITE_RECAPTCHA_SITE_KEY`) | **Yes** (for App Check & `STRICT_PRODUCTION_ENV=true`) | Public Client Key | Paired with secret in Firebase App Check Console |
| `PAYMENT_SECRET` (>= 32-char random secret) | **Yes** (if `STRICT_PRODUCTION_ENV=true` or escrow intents active) | **Confidential Secret** | Store strictly in Google Secret Manager |
| `PAYMENT_WEBHOOK_SECRET` (>= 32-char random secret) | **Optional** | **Confidential Secret** | Needed only for gateway-signed client settlements |
| `GEMINI_API_KEY` | **Optional** | **Confidential Secret** | Store in Secret Manager if enabling server Gemini routes |
| Initial Admin User Email (`ADMIN_EMAIL`) | **Yes** | Operational Input | Signed-in Firebase Auth account to elevate via `scripts/create-admin.ts` |

---

## Reference Deployment Command Template (Execute ONLY After Approval & Value Verification)

```bash
# 1. Verify code & local build gates
npm run typecheck && npm run lint && npm run build

# 2. Deploy Firestore rules explicitly to the named Enterprise database
firebase deploy --only firestore --project turnkey-invention-70z9n

# 3. Build multi-stage container (Cloud Build or Docker) passing PUBLIC build args ONLY
gcloud builds submit \
  --project turnkey-invention-70z9n \
  --region <VERIFIED_REGION> \
  --tag <VERIFIED_REGION>-docker.pkg.dev/turnkey-invention-70z9n/<ARTIFACT_REPO>/power-web-studio-ai:<IMAGE_TAG> \
  .
# NOTE: If passing VITE_RECAPTCHA_SITE_KEY, SITE_URL, VITE_FIREBASE_MEASUREMENT_ID into Docker build,
# invoke docker build (or a dedicated cloudbuild.yaml step) with --build-arg SITE_URL=... --build-arg VITE_RECAPTCHA_SITE_KEY=...

# 4. Deploy to Cloud Run using ADC Service Account + Secret Manager
gcloud run deploy <SERVICE_NAME> \
  --project turnkey-invention-70z9n \
  --region <VERIFIED_REGION> \
  --image <VERIFIED_REGION>-docker.pkg.dev/turnkey-invention-70z9n/<ARTIFACT_REPO>/power-web-studio-ai:<IMAGE_TAG> \
  --service-account <CLOUD_RUN_SA>@turnkey-invention-70z9n.iam.gserviceaccount.com \
  --allow-unauthenticated \
  --port 8080 \
  --cpu 1 \
  --memory 512Mi \
  --min-instances 0 \
  --max-instances 5 \
  --concurrency 80 \
  --timeout 300 \
  --set-env-vars "NODE_ENV=production,SITE_URL=<VERIFIED_SITE_URL>,GCS_BUCKET=<PRIVATE_GCS_BUCKET>,VITE_RECAPTCHA_SITE_KEY=<RECAPTCHA_SITE_KEY>,ENFORCE_APP_CHECK=true,STRICT_PRODUCTION_ENV=true,TRUST_PROXY_HOPS=1,CORS_ALLOWED_ORIGINS=<EXTRA_ORIGINS_OR_EMPTY>" \
  --set-secrets "PAYMENT_SECRET=<SECRET_PAYMENT>:latest,GEMINI_API_KEY=<SECRET_GEMINI_API>:latest"
```

---

## Explicit Stop & Approval Request

**DEPLOYMENT HALTED BY ARCHITECTURE GATE:** Per strict production change control, **no changes have been deployed to Cloud Run, Cloud Storage, Secret Manager, or live Firestore security rules**. Please review `GOOGLE_CLOUD_DEPLOYMENT_PLAN.md`, verify `turnkey-invention-70z9n`'s Firestore `locationId` and manual Google Cloud / Firebase Console prerequisites above, and confirm explicit approval before proceeding with any deployment steps.
