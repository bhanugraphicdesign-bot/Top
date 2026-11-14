# POWER WEB STUDIO AI — GOOGLE CLOUD RUN PRODUCTION DEPLOYMENT AUDIT
**Company:** BHANU RAM BARIHA DIGITAL TECHNOLOGIES  
**Brand:** POWER WEB STUDIO AI  
**Author:** Senior Enterprise Software Architect & DevOps Lead  
**Timestamp:** 2026-11-14T16:00:00Z  
**Phase:** Production Readiness Review (Parts 1–4 Completed)  
**Deployment State:** **READY FOR PRODUCTION REVIEW (NO DEPLOYMENT EXECUTED PENDING APPROVAL)**

---

## 1. Executive Pre-Flight Checklist

| Deployment Vector | Target / Specification | Production Status | Verified In Code |
|---|---|---|---|
| **Target Runtime** | Google Cloud Run (Fully Managed Serverless Container) | **READY** | Auto-detects `K_SERVICE`, `K_REVISION` |
| **Port Binding** | `process.env.PORT` (defaults to 3000 in dev, 8080 in Cloud Run) | **VERIFIED** | `parseInt(process.env.PORT \|\| '3000', 10)` |
| **Proxy Trust** | Google Cloud Load Balancer (GCLB) upstream proxy | **VERIFIED** | `app.set('trust proxy', true)` |
| **Container Lifecycle** | Graceful shutdown on `SIGTERM` / `SIGINT` | **IMPLEMENTED** | Drains in-flight requests with 15s force-kill safety |
| **Production Command** | `"start": "node server.ts"` in `package.json` | **VERIFIED** | Native TypeScript execution in Node v22+ |
| **Routing & SPA** | Clean History API routes (`/about`, `/services`, `/apps/:id`, etc.) with legacy `#/` redirects | **VERIFIED** | `NavigationContext.tsx` + `server.ts` SPA `index.html` fallback |
| **Verification Gate** | `"check": "npm run typecheck && npm run lint && npm run build"` | **VERIFIED** | ESLint (TS/React/Hooks + Firestore Rules), `tsc --noEmit`, Vite build |
| **Live Database** | Google Cloud Firestore (Enterprise Edition) via `firebase-admin` | **CONNECTED** | Project: `turnkey-invention-70z9n` |
| **Persistent State** | Invoices, payments, audit logs, and newsletter subscribers stored in Firestore | **VERIFIED** | No local ephemeral JSON state; uploads stored solely in GCS |
| **Security Rules** | Attribute-Based Access Control (ABAC) & Default Deny | **DEPLOYED** | Secured via `firestore.rules` (`allow read, write: if false;` root) |

---

## 2. Environment Variables & Secret Management

| Variable Name | Environment Scope | Source / Injection | Security Classification | Purpose |
|---|---|---|---|---|
| `PORT` | Container Runtime | Injected by Cloud Run (8080) | Public Runtime Var | HTTP port for incoming web traffic |
| `NODE_ENV` | Container Runtime | `production` in Cloud Run | Public Runtime Var | Switches from Vite dev middleware to `/dist` static serving |
| `SITE_URL` | Container & Build | Set to live domain (e.g. `https://YOUR-DOMAIN.com`) | Public Runtime Var | Single source of truth for `<link rel="canonical">`, `og:url`, `sitemap.xml`, `robots.txt`, and CORS allowlist |
| `VITE_RECAPTCHA_SITE_KEY` | Client Build Runtime | Google reCAPTCHA v3 Site Key | Public Key | Enables Firebase App Check tokens verified server-side on quotation, contact, and newsletter forms |
| `GCS_BUCKET` | Server-Side Only | Private Cloud Storage Bucket Name | Runtime Configuration | Exclusive persistence backend for `/api/files/*` (returns HTTP 503 `STORAGE_NOT_CONFIGURED` when unset; never writes local disk) |
| `ADMIN_EMAIL` | Local Admin CLI Only | Used by `scripts/create-admin.ts` | Operational Setup Var | Grants initial `user_roles/{uid}` (`role: "admin"`) and custom admin claim via Admin SDK (not hardcoded in runtime code) |
| `GEMINI_API_KEY` | Server-Side Only | AI Studio / Cloud Run Secret | **Confidential Secret** | Proxy route AI calls (`/api/ai/*`, never exposed to client UI) |
| `PAYMENT_SECRET` | Server-Side Only | Cloud Run Secret / Env | **Confidential Secret** | HMAC-SHA256 signing secret for `/api/payments/*` (returns HTTP 503 `PAYMENT_GATEWAY_OPTIONAL_MODE` when unset) |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Server-Side Only | Optional Service Account JSON | **Confidential Secret** | Explicit Admin SDK credentials outside GCP ADC environments |
| `CORS_ALLOWED_ORIGINS` | Server-Side Only | Comma-separated origin allowlist | Runtime Configuration | Additional trusted browser origins beyond `SITE_URL` |
| `VITE_FIREBASE_MEASUREMENT_ID` | Client Build Runtime | Google Analytics 4 ID | Public Key | Optional Firebase Analytics measurement ID |
| `FORM_RATE_LIMIT_MAX` | Server-Side Only | Number (default `8`) | Runtime Configuration | Max form submissions per IP per 15-minute window |
| `K_SERVICE` / `K_REVISION` | Cloud Run Runtime | Injected by Google Cloud Run | System Metadata | Cloud Run service and active revision identifiers |

*Validation Rule:* No secrets, service account keys, or hardcoded administrator emails are stored in frontend bundles, `firestore.rules`, or runtime source files.

---

## 3. Firebase & Cloud Firestore Architecture

- **Project ID:** `turnkey-invention-70z9n`
- **Firestore Database ID:** `ai-studio-powerwebstudioai-4b6a19ad-e6d7-4bd0-a968-9c08eb07a897`
- **Auth Domain:** `turnkey-invention-70z9n.firebaseapp.com`
- **Boot Handshake:** When the app initializes, `validateFirestoreConnection()` performs an end-to-end handshake via `getDocFromServer(doc(db, 'test', 'connection'))`.
- **Admin Provisioning (`scripts/create-admin.ts`):** First admin role is granted via CLI (`ADMIN_EMAIL=owner@domain.com npx tsx scripts/create-admin.ts`), writing `user_roles/{uid}` (`role: "admin"`) and setting Firebase Auth custom claims (`admin: true, role: "admin"`).

---

## 4. Security Rules & Access Control (ABAC Audit)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} { allow read, write: if false; } // DEFAULT DENY
    ...
  }
}
```

1. **Default Deny:** Catch-all root match blocks all unauthenticated and unspecified collection reads/writes.
2. **RBAC / Claims-Only Admin (`isAdmin()`):** Checks Firebase Auth custom claims (`admin: true` or `role == 'admin'`) and `user_roles/{uid}.role == 'admin'`. Zero hardcoded admin emails exist in rules or code.
3. **User Roles Protection (`/user_roles/{userId}`):** Owners can read their own document (`allow get`); all mutations (`create, update, delete`) are strictly limited to verified admins.
4. **Quotations & Server Intake (`/quotations/{quoteId}`):** Client `create` is set to `false`; public submissions route through `POST /api/quotations` (enforcing App Check verification, honeypot validation, IP rate limiting, Zod validation, and Admin SDK persistence).
5. **Support Tickets Append-Only Reply Rule (`/support_tickets/{ticketId}`):** Clients may only append exactly one response (`responses.size() == existing.responses.size() + 1`, prior messages immutable, `author == request.auth.uid`, `role == 'client'`, unchanged `status`).
6. **Server-Authored Audit Logs (`/audit_logs/{logId}`):** Client `create, update, delete` are set to `false`. Events are written strictly via Admin SDK (`POST /api/audit-events` or server routes), deriving `ipAddress` exclusively from trusted server headers.
7. **Tenant Isolation:** Projects, invoices, payments, and support tickets restrict client queries to `resource.data.clientId == request.auth.uid || isAdmin()`.

---

## 5. HTTP Security Headers, Helmet CSP & Payload Bounds

`server.ts` disables `X-Powered-By` and configures `helmet` + custom middleware:
- **Content-Security-Policy (CSP):** Strictly permits Firebase (`*.firebaseio.com`, `*.googleapis.com`, `*.firebaseapp.com`), Google Sign-In (`accounts.google.com`, `apis.google.com`), reCAPTCHA (`www.google.com/recaptcha/`, `www.gstatic.com/recaptcha/`), and Google Fonts (`fonts.googleapis.com`, `fonts.gstatic.com`).
- **Cross-Origin-Opener-Policy:** `same-origin-allow-popups` (preserves Google OAuth popup sign-in compatibility).
- **Security Headers:** `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`.
- **Body Size Limits:** Global JSON/urlencoded limit lowered to **`1mb`**, with an explicit route-scoped **`15mb`** JSON limit solely on `POST /api/files/upload` (for base64 up to 10 MB files).

---

## 6. Logging, Telemetry, SEO & Assets

1. **Admin-Only Telemetry (`GET /api/telemetry`):** Protected by `requireAdmin` (verifying ID token + admin RBAC).
2. **Dynamic SEO & History Routing:** Every route (`/`, `/services`, `/ai-solutions`, `/android-portfolio`, `/apps/:id`, `/process`, `/about`, `/contact`, `/blog`, `/privacy`, `/terms`) dynamically updates `<title>`, `<meta name="description">`, `<link rel="canonical">`, OpenGraph (`og:title`, `og:description`, `og:url`, `og:image`), and Twitter tags using `SITE_URL`. Legacy `#/...` URLs automatically redirect to clean History API paths.
3. **Media Optimization:** Uses WebP assets via `<picture>` with JPG fallbacks and `loading="lazy"` below the fold.
4. **Validated Uploads:** Only `pdf`, `png`, `jpg`, `docx` (max 10 MB binary) with randomized object keys and auth-token `uploadedBy` attribution in private Cloud Storage (`GCS_BUCKET`).

---

## 7. Deployment Health Probe

- **Liveness & Startup Probe:** `GET /api/health`
  Returns `HTTP 200 OK` with company metadata (with `companyRegistration` hidden unless explicitly configured), Firestore status, and runtime info.

---

## 8. Google Cloud Run Deployment Commands (For User Approval)

```bash
# 1. Verify Typecheck, ESLint, and Production Build
npm run check

# 2. Deploy to Google Cloud Run
gcloud run deploy power-web-studio-ai \
  --image gcr.io/turnkey-invention-70z9n/power-web-studio-ai:latest \
  --platform managed \
  --region asia-northeast1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --timeout 300 \
  --set-env-vars NODE_ENV=production,PORT=8080,SITE_URL=https://YOUR-DOMAIN.com,GCS_BUCKET=YOUR_PRIVATE_BUCKET,VITE_RECAPTCHA_SITE_KEY=YOUR_RECAPTCHA_SITE_KEY
```

---

## 9. Approval Gate Status

**GATE STATUS:** **READY FOR USER REVIEW & APPROVAL**  
*No live Cloud Run deployment has been executed automatically.*

