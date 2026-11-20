import {
  collection,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db, auth, ensureClientFirestoreOnline } from './config';
import { getAppCheckTokenHeader } from './appCheck';
import { handleFirestoreError, OperationType } from './errorHandler';
import { extractBilingualApiError } from '../utils/formProtection';
import { AndroidApp, BlogPost, ServiceItem, AppNotification } from '../types';
import { INITIAL_ANDROID_APPS, SERVICES_DATA } from '../data/content';
import { BLOG_POSTS } from '../data/blogData';

interface PublicCatalogCacheEntry {
  expiresAt: number;
  data: {
    configured: boolean;
    apps: AndroidApp[];
    services: ServiceItem[];
    blogPosts: BlogPost[];
    siteSettings: Record<string, any> | null;
  };
}

let publicCatalogCache: PublicCatalogCacheEntry | null = null;
let inFlightPublicCatalog: Promise<PublicCatalogCacheEntry['data'] | null> | null = null;

function invalidatePublicCatalogCache(refreshServer = false) {
  publicCatalogCache = null;
  if (refreshServer && typeof fetch !== 'undefined') {
    void fetch('/api/public/catalog?fresh=1', { cache: 'no-store' }).catch(() => undefined);
  }
}

async function fetchPublicCatalogFromServer(): Promise<PublicCatalogCacheEntry['data'] | null> {
  if (typeof fetch === 'undefined') return null;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return null;

  if (publicCatalogCache && Date.now() < publicCatalogCache.expiresAt) {
    return publicCatalogCache.data;
  }
  if (inFlightPublicCatalog) {
    return inFlightPublicCatalog;
  }

  inFlightPublicCatalog = (async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    try {
      const res = await fetch('/api/public/catalog', {
        method: 'GET',
        signal: controller.signal,
      });
      if (!res.ok) return null;
      const json = await res.json();
      if (!json || typeof json !== 'object' || json.configured !== true) {
        return null;
      }
      const data: PublicCatalogCacheEntry['data'] = {
        configured: true,
        apps: Array.isArray(json.apps) ? (json.apps as AndroidApp[]) : [],
        services: Array.isArray(json.services) ? (json.services as ServiceItem[]) : [],
        blogPosts: Array.isArray(json.blogPosts) ? (json.blogPosts as BlogPost[]) : [],
        siteSettings: json.siteSettings && typeof json.siteSettings === 'object' ? json.siteSettings : null,
      };
      publicCatalogCache = {
        expiresAt: Date.now() + 10_000,
        data,
      };
      return data;
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  })().finally(() => {
    inFlightPublicCatalog = null;
  });

  return inFlightPublicCatalog;
}

export const COLLECTIONS = {
  USERS: 'users',
  USER_ROLES: 'user_roles',
  USER_PROFILES: 'user_profiles',
  APPS: 'apps',
  APP_CATEGORIES: 'app_categories',
  PROJECTS: 'projects',
  PROJECT_TASKS: 'project_tasks',
  ORDERS: 'orders',
  QUOTATIONS: 'quotations',
  INVOICES: 'invoices',
  PAYMENTS: 'payments',
  SUPPORT_TICKETS: 'support_tickets',
  NOTIFICATIONS: 'notifications',
  AUDIT_LOGS: 'audit_logs',
  SITE_SETTINGS: 'site_settings',
} as const;

function clampStr(val: string | undefined | null, maxLen: number): string {
  return String(val || '').trim().slice(0, maxLen);
}

export async function authenticatedFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
  options: {
    includeAppCheck?: boolean;
    user?: User | null;
    optionalAuth?: boolean;
  } = {}
): Promise<Response> {
  const targetUser = options.user !== undefined ? options.user : auth.currentUser;
  if (!targetUser && !options.optionalAuth) {
    throw new Error('Authentication required. Please sign in to continue.');
  }

  const buildHeaders = async (forceRefresh: boolean): Promise<Headers> => {
    const headers = new Headers(init.headers);
    if (options.includeAppCheck) {
      const appCheckHeaders = await getAppCheckTokenHeader();
      for (const [key, value] of Object.entries(appCheckHeaders)) {
        if (value) headers.set(key, value);
      }
    }
    if (targetUser) {
      try {
        const idToken = await targetUser.getIdToken(forceRefresh);
        if (idToken) {
          headers.set('Authorization', `Bearer ${idToken}`);
        }
      } catch (err) {
        if (!options.optionalAuth) {
          throw err;
        }
      }
    }
    return headers;
  };

  let res = await fetch(input, {
    ...init,
    headers: await buildHeaders(false),
  });

  if (res.status === 401 && targetUser) {
    res = await fetch(input, {
      ...init,
      headers: await buildHeaders(true),
    });
  }

  return res;
}

async function isCurrentUserVerifiedAdmin(): Promise<boolean> {
  const currentUser = auth.currentUser;
  if (!currentUser) return false;

  // 1. Primary RBAC source: Firestore `user_roles/{uid}`
  const role = await fetchUserRole(currentUser.uid);
  if (role === 'admin') {
    return true;
  }

  // 2. Verified Firebase Auth custom claim
  try {
    const tokenResult = await currentUser.getIdTokenResult();
    if (
      tokenResult?.claims?.admin === true ||
      tokenResult?.claims?.superAdmin === true ||
      tokenResult?.claims?.role === 'admin' ||
      tokenResult?.claims?.role === 'super_admin'
    ) {
      return true;
    }
  } catch {
    // Continue to server check below
  }

  // 3. Server-verified RBAC (checks `user_roles/{uid}` + custom claims, refreshes expired token on 401)
  if (typeof fetch !== 'undefined' && (typeof navigator === 'undefined' || navigator.onLine !== false)) {
    try {
      const statusRes = await authenticatedFetch('/api/auth/status', {}, { user: currentUser });
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        if (statusData?.isAdmin === true) {
          return true;
        }
      }
    } catch {
      // Offline/network fallback keeps strict client role
    }
  }

  return false;
}

/* =========================================================================
   1. AUDIT LOGGING (SERVER-AUTHORITATIVE — CLIENT NEVER SETS IP OR WRITES DIRECTLY)
   ========================================================================= */
export async function logAuditEvent(action: string, resource: string, details: string) {
  const currentUser = auth.currentUser;
  if (!currentUser || typeof fetch === 'undefined') {
    return;
  }
  try {
    await authenticatedFetch(
      '/api/audit-events',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: clampStr(action, 100),
          resource: clampStr(resource, 200),
          details: clampStr(details, 1000),
        }),
      },
      { includeAppCheck: true, user: currentUser }
    );
  } catch (error) {
    // Audit logging should not break primary UX flow if offline or unavailable
    console.warn('[Audit Log Failed]', error);
  }
}

export async function getAuditLogs(limitCount = 20) {
  const path = COLLECTIONS.AUDIT_LOGS;
  if (!(await isCurrentUserVerifiedAdmin())) {
    return [];
  }
  const currentUser = auth.currentUser;
  if (currentUser && typeof fetch !== 'undefined') {
    try {
      const res = await authenticatedFetch('/api/audit-events', {}, { user: currentUser });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.events)) {
          return data.events.slice(0, limitCount);
        }
      }
    } catch {
      // Fall back to direct Firestore admin query below
    }
  }
  try {
    const q = query(collection(db, path), orderBy('timestamp', 'desc'), limit(limitCount));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

/* =========================================================================
   2. USERS & ROLES (ZERO CLIENT-SIDE ROLE ESCALATION)
   ========================================================================= */
export async function syncUserAccount(user: {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}) {
  const path = COLLECTIONS.USERS;
  if (!auth.currentUser || auth.currentUser.uid !== user.uid) {
    return;
  }
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return;
  }
  if (!(await ensureClientFirestoreOnline())) {
    return;
  }
  try {
    const userRef = doc(db, path, user.uid);
    const existing = await getDoc(userRef);

    const safeEmail = clampStr(user.email || `${user.uid}@user.local`, 160);
    const safeDisplayName = clampStr(user.displayName || 'Enterprise User', 160);
    const safePhoto = clampStr(user.photoURL, 500);
    const nowIso = new Date().toISOString();

    if (!existing.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        email: safeEmail,
        displayName: safeDisplayName,
        photoURL: safePhoto,
        createdAt: nowIso,
        lastLoginAt: nowIso,
      });
      // NOTE: Never write /user_roles from non-admin client signup.
      // Rules restrict /user_roles to verified Admins; fetchUserRole defaults to 'client'.
    } else {
      await updateDoc(userRef, {
        displayName: safeDisplayName,
        photoURL: safePhoto,
        lastLoginAt: nowIso,
      });
    }

    await logAuditEvent('USER_LOGIN_SYNC', `users/${user.uid}`, `User synced: ${safeEmail}`);
  } catch (error: any) {
    const msg = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
    if (error?.code === 'unavailable' || msg.includes('offline')) {
      console.warn('[syncUserAccount offline fallback]', error);
      return;
    }
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export interface UserRoleDetails {
  role: string;
  exists: boolean;
  isSuperAdmin: boolean;
  error: string | null;
}

export async function fetchUserRoleDetails(
  uid: string,
  forceServer = false
): Promise<UserRoleDetails> {
  const path = COLLECTIONS.USER_ROLES;
  if (!auth.currentUser || !uid) {
    return { role: 'client', exists: false, isSuperAdmin: false, error: null };
  }
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return {
      role: 'client',
      exists: false,
      isSuperAdmin: false,
      error: 'Offline: Cannot verify Firestore user_roles while disconnected.',
    };
  }
  if (!(await ensureClientFirestoreOnline())) {
    return {
      role: 'client',
      exists: false,
      isSuperAdmin: false,
      error: 'Unable to reach Cloud Firestore to verify user_roles.',
    };
  }
  try {
    const roleRef = doc(db, path, uid);
    const roleDoc = forceServer
      ? await getDocFromServer(roleRef).catch(() => getDoc(roleRef))
      : await getDoc(roleRef);
    if (roleDoc.exists()) {
      const data = roleDoc.data() || {};
      const rawRole = typeof data.role === 'string' ? data.role : 'client';
      const isSuperAdmin = Boolean(
        data.isSuperAdmin === true || data.tier === 'super_admin' || rawRole === 'super_admin'
      );
      return {
        role: rawRole === 'super_admin' ? 'admin' : rawRole,
        exists: true,
        isSuperAdmin,
        error: null,
      };
    }
    return { role: 'client', exists: false, isSuperAdmin: false, error: null };
  } catch (error: any) {
    console.warn('[fetchUserRoleDetails]', error);
    const code = String(error?.code || '');
    const msg = error instanceof Error ? error.message : String(error || 'Firestore role lookup error');
    return {
      role: 'client',
      exists: false,
      isSuperAdmin: false,
      error: code ? `${code}: ${msg}` : msg,
    };
  }
}

export async function fetchUserRole(uid: string): Promise<string> {
  const details = await fetchUserRoleDetails(uid);
  return details.role;
}

/* =========================================================================
   3. APPS & APP CATEGORIES
   ========================================================================= */
export async function fetchFirestoreApps(): Promise<AndroidApp[]> {
  const path = COLLECTIONS.APPS;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return [];
  }
  const catalog = await fetchPublicCatalogFromServer();
  if (catalog) {
    return catalog.apps;
  }
  if (!(await ensureClientFirestoreOnline())) {
    return [];
  }
  try {
    const snap = await getDocs(collection(db, path));
    if (snap.empty) {
      return [];
    }
    return snap.docs.map((d) => d.data() as AndroidApp);
  } catch (error: any) {
    const msg = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
    if (error?.code === 'unavailable' || msg.includes('offline')) {
      return [];
    }
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function saveFirestoreApp(app: AndroidApp) {
  const path = COLLECTIONS.APPS;
  if (!(await isCurrentUserVerifiedAdmin())) {
    throw new Error('Forbidden: Administrator authentication required to modify portfolio apps.');
  }
  try {
    await setDoc(doc(db, path, app.id), {
      ...app,
      updatedAt: serverTimestamp(),
    });
    invalidatePublicCatalogCache(true);
    await logAuditEvent('APP_SAVED', `apps/${app.id}`, `Saved app ${app.name} (${app.category})`);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${path}/${app.id}`);
  }
}

export async function deleteFirestoreApp(appId: string) {
  const path = COLLECTIONS.APPS;
  if (!(await isCurrentUserVerifiedAdmin())) {
    throw new Error('Forbidden: Administrator authentication required to delete portfolio apps.');
  }
  try {
    await deleteDoc(doc(db, path, appId));
    invalidatePublicCatalogCache(true);
    await logAuditEvent('APP_DELETED', `apps/${appId}`, `Deleted app ${appId}`);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${path}/${appId}`);
  }
}

/* =========================================================================
   4. QUOTATIONS & CONSULTATION INQUIRIES (SERVER-VALIDATED VIA POST /api/quotations)
   ========================================================================= */
export async function submitQuotation(data: {
  fullName: string;
  email: string;
  phone?: string;
  company?: string;
  serviceType: string;
  timeline?: string;
  budget?: string;
  brief?: string;
  language?: 'en' | 'hi';
  user?: User | null;
  _hp?: string;
  formOpenedAt?: number;
  fillDurationMs?: number;
  attachment?: {
    fileUrl?: string;
    fileName?: string;
    sha256?: string;
    fileSizeFormatted?: string;
  };
}) {
  const lang: 'en' | 'hi' = data.language === 'hi' ? 'hi' : 'en';
  const activeUser = auth.currentUser ?? data.user ?? null;
  if (!activeUser) {
    throw new Error('कृपया कोटेशन अनुरोध सबमिट करने के लिए पहले लॉगिन करें।');
  }

  const freshToken = await activeUser.getIdToken(true);
  const appCheckHeaders = await getAppCheckTokenHeader();
  const response = await fetch('/api/quotations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...appCheckHeaders,
      Authorization: `Bearer ${freshToken}`,
    },
    body: JSON.stringify({
      fullName: clampStr(data.fullName, 160),
      email: clampStr(data.email, 160).toLowerCase(),
      phone: clampStr(data.phone, 40),
      company: clampStr(data.company, 160),
      serviceType: clampStr(data.serviceType, 160),
      timeline: clampStr(data.timeline || '3-6-months', 64),
      budget: clampStr(data.budget || 'enterprise', 80),
      brief: clampStr(data.brief, 3000),
      language: lang,
      _hp: data._hp || '',
      formOpenedAt: data.formOpenedAt,
      fillDurationMs: data.fillDurationMs,
      attachment: data.attachment
        ? {
            fileUrl: clampStr(data.attachment.fileUrl, 300),
            fileName: clampStr(data.attachment.fileName, 200),
            sha256: clampStr(data.attachment.sha256, 128),
            fileSizeFormatted: clampStr(data.attachment.fileSizeFormatted, 40),
          }
        : undefined,
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      extractBilingualApiError(
        response.status,
        payload,
        lang,
        `Unable to submit scoping request (HTTP ${response.status}).`,
        `अनुरोध सबमिट करने में असमर्थ (HTTP ${response.status})।`
      )
    );
  }

  if (auth.currentUser) {
    await createNotification({
      userId: auth.currentUser.uid,
      title: `New Scoping Proposal: ${clampStr(data.fullName, 160)}`,
      titleHi: `नया तकनीकी परामर्श अनुरोध: ${clampStr(data.fullName, 160)}`,
      message: `${clampStr(data.serviceType, 160)} | ${clampStr(data.company, 160) || 'Enterprise Client'}`,
      messageHi: `${clampStr(data.serviceType, 160)} | ${clampStr(data.company, 160) || 'एंटरप्राइज क्लाइंट'}`,
      type: 'quote',
      linkRoute: 'client-dashboard',
    });
  }

  return payload?.quoteId as string;
}

export async function fetchAllQuotations() {
  const path = COLLECTIONS.QUOTATIONS;
  if (!(await isCurrentUserVerifiedAdmin())) return [];
  const currentUser = auth.currentUser;
  try {
    const snap = await getDocs(collection(db, path));
    const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    if (docs.length > 0) {
      return docs;
    }
  } catch (clientErr) {
    console.warn('[fetchAllQuotations client fallback]', clientErr);
  }
  if (currentUser && typeof fetch !== 'undefined') {
    try {
      const res = await authenticatedFetch('/api/admin/quotations', {}, { user: currentUser });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.quotations)) {
          return data.quotations;
        }
      }
    } catch {
      // Fall through cleanly
    }
  }
  return [];
}

export async function updateQuotationStatus(quoteId: string, status: string) {
  const currentUser = auth.currentUser;
  if (!currentUser || !(await isCurrentUserVerifiedAdmin())) {
    throw new Error('Forbidden: Administrator privilege required.');
  }
  const res = await authenticatedFetch(
    `/api/admin/quotations/${encodeURIComponent(quoteId)}/status`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    },
    { user: currentUser }
  );
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload?.error || `Failed to update quotation status (HTTP ${res.status})`);
  }
}

/* =========================================================================
   5. PROJECTS & TASKS
   ========================================================================= */
export async function fetchProjectsForClient(clientId: string) {
  const path = COLLECTIONS.PROJECTS;
  const currentUser = auth.currentUser;
  if (!currentUser) return [];
  const isAdmin = await isCurrentUserVerifiedAdmin();
  const targetClientId = isAdmin ? clientId : currentUser.uid;
  try {
    const q = query(collection(db, path), where('clientId', '==', targetClientId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function fetchProjectTasksForClient(clientId?: string) {
  const path = COLLECTIONS.PROJECT_TASKS;
  const currentUser = auth.currentUser;
  if (!currentUser) return [];
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return [];
  if (!(await ensureClientFirestoreOnline())) return [];
  try {
    const isAdmin = await isCurrentUserVerifiedAdmin();
    const targetClientId = isAdmin && clientId ? clientId : currentUser.uid;
    const q = query(collection(db, path), where('clientId', '==', targetClientId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.warn('[fetchProjectTasksForClient]', error);
    return [];
  }
}

export async function fetchAllProjects() {
  const path = COLLECTIONS.PROJECTS;
  if (!(await isCurrentUserVerifiedAdmin())) return [];
  try {
    const snap = await getDocs(collection(db, path));
    return snap.docs.map((d) => d.data());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

/* =========================================================================
   6. SUPPORT TICKETS
   ========================================================================= */
export async function createSupportTicket(data: {
  subject: string;
  priority: 'P1_Critical' | 'P2_High' | 'P3_Normal' | 'P4_Low';
  details: string;
  category?: string;
  projectCode?: string;
  environment?: string;
  attachment?: {
    fileUrl?: string;
    fileName?: string;
    sha256?: string;
    fileSizeFormatted?: string;
  };
}) {
  const path = COLLECTIONS.SUPPORT_TICKETS;
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Authentication required to dispatch support tickets to Cloud Firestore.');
  }
  try {
    const ticketId = `tkt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const payload = {
      id: ticketId,
      clientId: currentUser.uid,
      clientEmail: clampStr(currentUser.email || 'verified-client@enterprise.in', 160),
      subject: clampStr(data.subject, 240),
      priority: data.priority,
      category: clampStr(data.category || 'General SLA Support', 120),
      projectCode: clampStr(data.projectCode || 'PRJ-FLT-2026', 64),
      environment: clampStr(data.environment || 'Android 14 / Enterprise Fleet', 160),
      details: clampStr(data.details, 5000),
      attachment: data.attachment
        ? {
            fileUrl: clampStr(data.attachment.fileUrl, 300),
            fileName: clampStr(data.attachment.fileName, 200),
            sha256: clampStr(data.attachment.sha256, 128),
            fileSizeFormatted: clampStr(data.attachment.fileSizeFormatted, 40),
          }
        : null,
      responses: [],
      status: 'open',
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, path, ticketId), payload);
    await logAuditEvent('TICKET_CREATED', `support_tickets/${ticketId}`, `Created ticket ${payload.subject}`);

    await createNotification({
      userId: currentUser.uid,
      title: `[${data.priority}] Priority Ticket: ${payload.subject}`,
      titleHi: `[${data.priority}] प्राथमिकता टिकट: ${payload.subject}`,
      message: `${payload.category} | Project ${payload.projectCode}`,
      messageHi: `${payload.category} | प्रोजेक्ट ${payload.projectCode}`,
      type: 'ticket',
      linkRoute: 'client-dashboard',
    });

    return ticketId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function fetchSupportTickets(clientId?: string) {
  const path = COLLECTIONS.SUPPORT_TICKETS;
  const currentUser = auth.currentUser;
  if (!currentUser) {
    return [];
  }

  try {
    const isVerifiedAdmin = await isCurrentUserVerifiedAdmin();
    const effectiveClientId = isVerifiedAdmin ? clientId : currentUser.uid;

    let q;
    if (effectiveClientId) {
      q = query(collection(db, path), where('clientId', '==', effectiveClientId));
    } else {
      q = query(collection(db, path), orderBy('createdAt', 'desc'));
    }
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function updateSupportTicketStatus(ticketId: string, status: 'open' | 'in_progress' | 'resolved') {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Authentication required.');
  }
  if (!(await isCurrentUserVerifiedAdmin())) {
    throw new Error('Forbidden: Administrator privilege required to directly update support ticket status.');
  }
  const res = await authenticatedFetch(
    `/api/admin/support-tickets/${encodeURIComponent(ticketId)}/status`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    },
    { user: currentUser }
  );
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload?.error || `Failed to update ticket status (HTTP ${res.status})`);
  }
}

/* =========================================================================
   7. ADMIN DATABASE SEEDER (VERIFIED ADMIN ONLY — NEVER UNAUTHENTICATED)
   ========================================================================= */
export async function seedInitialDatabaseIfEmpty() {
  if (!(await isCurrentUserVerifiedAdmin())) {
    return { seeded: false, reason: 'admin_auth_required' };
  }
  try {
    const appsSnap = await getDocs(collection(db, COLLECTIONS.APPS));
    if (!appsSnap.empty) {
      return { seeded: false, count: appsSnap.size };
    }

    for (const app of INITIAL_ANDROID_APPS) {
      await setDoc(doc(db, COLLECTIONS.APPS, app.id), {
        ...app,
        createdAt: new Date().toISOString(),
      });
    }

    const categories = [
      { id: 'cat-biz', name: 'Business Apps', nameHi: 'बिजनेस ऐप्स', description: 'Enterprise operations, billing, and sales force automation.' },
      { id: 'cat-edu', name: 'Education Apps', nameHi: 'शिक्षा ऐप्स', description: 'EdTech platforms, offline learning modules, and assessment engines.' },
      { id: 'cat-prod', name: 'Productivity Apps', nameHi: 'उत्पादकता ऐप्स', description: 'Document workflows, digital signatures, and task sync engines.' },
      { id: 'cat-util', name: 'Utility Apps', nameHi: 'उपयोगिता ऐप्स', description: 'Device diagnostics, offline Bluetooth mesh sync, and scanner cores.' },
      { id: 'cat-ecom', name: 'E-commerce Apps', nameHi: 'ई-कॉमर्स ऐप्स', description: 'High-throughput retail mobile apps, catalog sync, and checkout.' },
      { id: 'cat-ent', name: 'Enterprise Apps', nameHi: 'एंटरप्राइज ऐप्स', description: 'ERP mobile companions, distributed telematics, and warehouse tools.' },
      { id: 'cat-ai', name: 'AI-powered Apps', nameHi: 'एआई संचालित ऐप्स', description: 'On-device neural inference, computer vision, and sovereign voice.' },
    ];
    for (const cat of categories) {
      await setDoc(doc(db, COLLECTIONS.APP_CATEGORIES, cat.id), cat);
    }

    await setDoc(doc(db, COLLECTIONS.SITE_SETTINGS, 'global_config'), {
      id: 'global_config',
      companyName: 'BHANU RAM BARIHA DIGITAL TECHNOLOGIES',
      brandName: 'POWER WEB STUDIO AI',
      companyRegistration: '',
      maintenanceMode: false,
      contactEmail: 'powerusertopuser@gmail.com',
      contactPhone: '+91 8305457717',
      headquarters: 'Fingeshwar Borid Mod, Rajim Subdistrict, Gariaband District, Chhattisgarh - 493992',
      updatedAt: new Date().toISOString(),
    });

    await logAuditEvent('DATABASE_SEEDED', 'system', 'Populated initial catalog & settings collections');
    return { seeded: true, count: INITIAL_ANDROID_APPS.length };
  } catch (error) {
    console.warn('[Database Seeding Warning]', error);
    return { seeded: false, error };
  }
}

/* =========================================================================
   8. CUSTOMER & USER MANAGEMENT (ADMIN-ONLY)
   ========================================================================= */
export async function fetchAllUsers(): Promise<any[]> {
  const path = COLLECTIONS.USERS;
  if (!(await isCurrentUserVerifiedAdmin())) return [];
  const currentUser = auth.currentUser;
  if (currentUser && typeof fetch !== 'undefined') {
    try {
      const res = await authenticatedFetch('/api/admin/users', {}, { user: currentUser });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.users)) {
          return data.users;
        }
      }
    } catch (serverErr) {
      console.warn('[fetchAllUsers server fallback]', serverErr);
    }
  }
  try {
    const snap = await getDocs(collection(db, path));
    return await Promise.all(
      snap.docs.map(async (d) => {
        const data = d.data();
        const details = await fetchUserRoleDetails(d.id);
        const isOwner = details.isSuperAdmin;
        return {
          ...data,
          uid: data.uid || d.id,
          role: isOwner ? 'owner' : details.role,
          isOwner,
          isSuperAdmin: isOwner,
        };
      })
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function updateUserRole(userId: string, newRole: 'client' | 'manager' | 'architect') {
  const currentUser = auth.currentUser;
  if (!currentUser || !(await isCurrentUserVerifiedAdmin())) {
    throw new Error('Forbidden: Verified administrator privilege required to modify roles.');
  }
  const res = await authenticatedFetch(
    '/api/admin/roles/update',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid: userId, role: newRole }),
    },
    { user: currentUser }
  );
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload?.error || `Failed to update user role (HTTP ${res.status})`);
  }
}

export async function saveClientRecord(userData: {
  uid: string;
  email: string;
  displayName: string;
  companyName?: string;
  phone?: string;
  role?: 'client' | 'manager' | 'architect';
  createdAt?: string;
}) {
  const path = COLLECTIONS.USERS;
  if (!(await isCurrentUserVerifiedAdmin())) {
    throw new Error('Forbidden: Administrator privilege required.');
  }
  try {
    await setDoc(doc(db, path, userData.uid), {
      uid: userData.uid,
      email: clampStr(userData.email, 160),
      displayName: clampStr(userData.displayName, 160),
      companyName: clampStr(userData.companyName, 160),
      phone: clampStr(userData.phone, 40),
      ...(userData.createdAt ? { createdAt: userData.createdAt } : {}),
      lastLoginAt: new Date().toISOString(),
    }, { merge: true });

    if (userData.role) {
      await updateUserRole(userData.uid, userData.role);
    }
    await logAuditEvent('CLIENT_RECORD_SAVED', `users/${userData.uid}`, `Saved client ${userData.email}`);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${path}/${userData.uid}`);
  }
}

/* =========================================================================
   9. PROJECT & SPRINT MANAGEMENT (ADMIN-ONLY)
   ========================================================================= */
export async function saveProject(project: any) {
  const path = COLLECTIONS.PROJECTS;
  if (!(await isCurrentUserVerifiedAdmin())) {
    throw new Error('Forbidden: Administrator privilege required.');
  }
  try {
    await setDoc(doc(db, path, project.id), {
      ...project,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    await logAuditEvent('PROJECT_SAVED', `projects/${project.id}`, `Saved project ${project.name}`);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${path}/${project.id}`);
  }
}

export async function deleteProject(projectId: string) {
  const currentUser = auth.currentUser;
  if (!currentUser || !(await isCurrentUserVerifiedAdmin())) {
    throw new Error('Forbidden: Administrator privilege required.');
  }
  const res = await authenticatedFetch(
    `/api/admin/projects/${encodeURIComponent(projectId)}`,
    { method: 'DELETE' },
    { user: currentUser }
  );
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload?.error || `Failed to delete project (HTTP ${res.status})`);
  }
}

/* =========================================================================
   10. SERVICE CATALOG MANAGEMENT
   ========================================================================= */
export async function fetchServicesCatalog(): Promise<ServiceItem[]> {
  const path = 'services';
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return SERVICES_DATA;
  }
  const catalog = await fetchPublicCatalogFromServer();
  if (catalog) {
    return catalog.services.length > 0 ? catalog.services : SERVICES_DATA;
  }
  if (!(await ensureClientFirestoreOnline())) {
    return SERVICES_DATA;
  }
  try {
    const snap = await getDocs(collection(db, path));
    if (snap.empty) {
      return SERVICES_DATA;
    }
    return snap.docs.map((d) => d.data() as ServiceItem);
  } catch (error) {
    console.warn('[fetchServicesCatalog fallback]', error);
    return SERVICES_DATA;
  }
}

export async function saveServiceItem(service: ServiceItem) {
  const path = 'services';
  if (!(await isCurrentUserVerifiedAdmin())) {
    throw new Error('Forbidden: Administrator privilege required.');
  }
  try {
    await setDoc(doc(db, path, service.id), {
      ...service,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    invalidatePublicCatalogCache(true);
    await logAuditEvent('SERVICE_SAVED', `services/${service.id}`, `Saved service ${service.title}`);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${path}/${service.id}`);
  }
}

export async function deleteServiceItem(serviceId: string) {
  const path = 'services';
  if (!(await isCurrentUserVerifiedAdmin())) {
    throw new Error('Forbidden: Administrator privilege required.');
  }
  try {
    await deleteDoc(doc(db, path, serviceId));
    invalidatePublicCatalogCache(true);
    await logAuditEvent('SERVICE_DELETED', `services/${serviceId}`, `Deleted service ${serviceId}`);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${path}/${serviceId}`);
  }
}

/* =========================================================================
   11. QUOTATION & COMMERCIAL ESTIMATES MANAGEMENT (ADMIN-ONLY MUTATIONS)
   ========================================================================= */
export async function saveQuotation(quote: any) {
  const path = COLLECTIONS.QUOTATIONS;
  if (!(await isCurrentUserVerifiedAdmin())) {
    throw new Error('Forbidden: Administrator privilege required.');
  }
  try {
    await setDoc(doc(db, path, quote.id), {
      ...quote,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    await logAuditEvent('QUOTATION_SAVED', `quotations/${quote.id}`, `Saved quote for ${quote.clientName}`);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${path}/${quote.id}`);
  }
}

export async function deleteQuotation(quoteId: string) {
  const currentUser = auth.currentUser;
  if (!currentUser || !(await isCurrentUserVerifiedAdmin())) {
    throw new Error('Forbidden: Administrator privilege required.');
  }
  const res = await authenticatedFetch(
    `/api/admin/quotations/${encodeURIComponent(quoteId)}`,
    { method: 'DELETE' },
    { user: currentUser }
  );
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload?.error || `Failed to delete quotation (HTTP ${res.status})`);
  }
}

/* =========================================================================
   12. CONTENT & BLOG MANAGEMENT
   ========================================================================= */
export async function fetchBlogPosts(): Promise<BlogPost[]> {
  const path = 'blog_posts';
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return BLOG_POSTS;
  }
  const catalog = await fetchPublicCatalogFromServer();
  if (catalog) {
    return catalog.blogPosts.length > 0 ? catalog.blogPosts : BLOG_POSTS;
  }
  if (!(await ensureClientFirestoreOnline())) {
    return BLOG_POSTS;
  }
  try {
    const snap = await getDocs(collection(db, path));
    if (snap.empty) {
      return BLOG_POSTS;
    }
    return snap.docs.map((d) => d.data() as BlogPost);
  } catch (error) {
    console.warn('[fetchBlogPosts fallback]', error);
    return BLOG_POSTS;
  }
}

export async function saveBlogPost(post: BlogPost) {
  const path = 'blog_posts';
  if (!(await isCurrentUserVerifiedAdmin())) {
    throw new Error('Forbidden: Administrator privilege required.');
  }
  try {
    await setDoc(doc(db, path, post.id), {
      ...post,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    invalidatePublicCatalogCache(true);
    await logAuditEvent('BLOG_SAVED', `blog_posts/${post.id}`, `Saved blog post ${post.title}`);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${path}/${post.id}`);
  }
}

export async function deleteBlogPost(postId: string) {
  const path = 'blog_posts';
  if (!(await isCurrentUserVerifiedAdmin())) {
    throw new Error('Forbidden: Administrator privilege required.');
  }
  try {
    await deleteDoc(doc(db, path, postId));
    invalidatePublicCatalogCache(true);
    await logAuditEvent('BLOG_DELETED', `blog_posts/${postId}`, `Deleted blog post ${postId}`);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${path}/${postId}`);
  }
}

export async function fetchSiteSettings(): Promise<any> {
  const path = COLLECTIONS.SITE_SETTINGS;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return null;
  }
  const catalog = await fetchPublicCatalogFromServer();
  if (catalog) {
    return catalog.siteSettings;
  }
  if (!(await ensureClientFirestoreOnline())) {
    return null;
  }
  try {
    const snap = await getDoc(doc(db, path, 'global_config'));
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  } catch (error) {
    console.warn('[fetchSiteSettings]', error);
    return null;
  }
}

export async function saveSiteSettings(settings: any) {
  const currentUser = auth.currentUser;
  if (!currentUser || !(await isCurrentUserVerifiedAdmin())) {
    throw new Error('Forbidden: Administrator privilege required.');
  }
  const res = await authenticatedFetch(
    '/api/admin/site-settings',
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    },
    { user: currentUser }
  );
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload?.error || `Failed to save site settings (HTTP ${res.status})`);
  }
  invalidatePublicCatalogCache(true);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('pws-site-settings-updated', { detail: settings }));
  }
}

/* =========================================================================
   13. NOTIFICATIONS SYSTEM
   ========================================================================= */
export async function createNotification(notif: {
  userId?: string;
  title: string;
  titleHi: string;
  message: string;
  messageHi: string;
  type: AppNotification['type'];
  linkRoute?: any;
  linkParams?: Record<string, string>;
}) {
  const path = COLLECTIONS.NOTIFICATIONS;
  const currentUser = auth.currentUser;
  if (!currentUser) return undefined;
  try {
    const notifId = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const isAdmin = await isCurrentUserVerifiedAdmin();
    const targetUserId = isAdmin && notif.userId ? notif.userId : currentUser.uid;
    const payload = {
      id: notifId,
      userId: targetUserId,
      title: clampStr(notif.title, 200),
      titleHi: clampStr(notif.titleHi, 200),
      message: clampStr(notif.message, 600),
      messageHi: clampStr(notif.messageHi, 600),
      type: clampStr(notif.type, 40),
      read: false,
      linkRoute: clampStr(notif.linkRoute || 'home', 64),
      linkParams: notif.linkParams || {},
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, path, notifId), payload);
    return notifId;
  } catch (error) {
    console.warn('[createNotification fallback]', error);
  }
}

export async function fetchNotifications(userId?: string): Promise<AppNotification[]> {
  const path = COLLECTIONS.NOTIFICATIONS;
  if (!auth.currentUser) {
    return [];
  }
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return [];
  }
  if (!(await ensureClientFirestoreOnline())) {
    return [];
  }
  try {
    const effectiveUid = auth.currentUser.uid;
    const targetUid = userId === effectiveUid ? effectiveUid : effectiveUid;
    const snap = await getDocs(
      query(collection(db, path), where('userId', 'in', [targetUid, 'broadcast_all']), limit(30))
    );
    if (snap.empty) {
      return [];
    }
    return snap.docs
      .map((d) => d.data() as AppNotification)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.warn('[fetchNotifications fallback]', error);
    return [];
  }
}

export async function markNotificationAsRead(notifId: string) {
  const path = COLLECTIONS.NOTIFICATIONS;
  if (!auth.currentUser) return;
  try {
    await updateDoc(doc(db, path, notifId), {
      read: true,
      readAt: serverTimestamp(),
    });
  } catch (error) {
    console.warn('[markNotificationAsRead fallback]', error);
  }
}

export async function markAllNotificationsAsRead(userId?: string) {
  const path = COLLECTIONS.NOTIFICATIONS;
  if (!auth.currentUser) return;
  try {
    const notifs = await fetchNotifications(userId);
    for (const n of notifs) {
      if (!n.read && n.userId === auth.currentUser.uid) {
        await updateDoc(doc(db, path, n.id), { read: true });
      }
    }
  } catch (error) {
    console.warn('[markAllNotificationsAsRead fallback]', error);
  }
}

/* =========================================================================
   14. BIDIRECTIONAL TICKET RESPONSES & WORKFLOWS
   ========================================================================= */
export async function addTicketResponse(
  ticketId: string,
  reply: {
    author: string;
    authorRole: string;
    message: string;
    statusChange?: 'open' | 'in_progress' | 'resolved';
  }
) {
  const path = COLLECTIONS.SUPPORT_TICKETS;
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Authentication required to reply to support tickets.');
  }
  try {
    const ticketRef = doc(db, path, ticketId);
    const snap = await getDoc(ticketRef);
    if (!snap.exists()) {
      throw new Error(`Ticket ${ticketId} not found`);
    }
    const callerIsAdmin = await isCurrentUserVerifiedAdmin();
    const currentData = snap.data();
    const existingReplies = Array.isArray(currentData.responses) ? currentData.responses : [];
    const displayAuthor =
      clampStr(reply.author, 120) ||
      currentUser.displayName ||
      currentUser.email?.split('@')[0] ||
      (callerIsAdmin ? 'Lead Platform Architect' : 'Enterprise Client');

    const newReply = callerIsAdmin
      ? {
          id: `resp-${Date.now()}`,
          author: currentUser.uid,
          authorName: displayAuthor,
          role: 'admin',
          authorRole: clampStr(reply.authorRole, 120) || 'Lead Platform Architect',
          message: clampStr(reply.message, 2000),
          timestamp: new Date().toISOString(),
        }
      : {
          id: `resp-${Date.now()}`,
          author: currentUser.uid,
          authorName: displayAuthor,
          role: 'client',
          authorRole: 'client',
          message: clampStr(reply.message, 2000),
          timestamp: new Date().toISOString(),
        };

    const updates: any = {
      responses: [...existingReplies, newReply],
      lastRepliedAt: new Date().toISOString(),
      updatedAt: serverTimestamp(),
    };

    if (callerIsAdmin && reply.statusChange) {
      updates.status = reply.statusChange;
    }

    await updateDoc(ticketRef, updates);
    await logAuditEvent('TICKET_REPLIED', `support_tickets/${ticketId}`, `Reply by ${displayAuthor}`);

    await createNotification({
      userId: currentData.clientId,
      title: `Response on Ticket #${ticketId}`,
      titleHi: `टिकट #${ticketId} पर प्रतिक्रिया`,
      message: `${displayAuthor}: "${newReply.message.substring(0, 80)}..."`,
      messageHi: `${displayAuthor}: "${newReply.message.substring(0, 80)}..."`,
      type: 'ticket',
      linkRoute: 'client-dashboard',
    });

    return newReply;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${path}/${ticketId}`);
  }
}
