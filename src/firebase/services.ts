import {
  collection,
  doc,
  getDoc,
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
import { db, auth } from './config';
import { handleFirestoreError, OperationType } from './errorHandler';
import { AndroidApp, BlogPost, ServiceItem, AppNotification } from '../types';
import { INITIAL_ANDROID_APPS, SERVICES_DATA } from '../data/content';
import { BLOG_POSTS } from '../data/blogData';

const ROOT_ADMIN_EMAIL = 'ssbhanu41@gmail.com';

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

async function isCurrentUserVerifiedAdmin(): Promise<boolean> {
  const currentUser = auth.currentUser;
  if (!currentUser) return false;
  if (
    currentUser.emailVerified === true &&
    currentUser.email?.toLowerCase() === ROOT_ADMIN_EMAIL
  ) {
    return true;
  }
  const role = await fetchUserRole(currentUser.uid);
  return role === 'admin';
}

/* =========================================================================
   1. AUDIT LOGGING (SECURITY & ACCOUNTABILITY)
   ========================================================================= */
export async function logAuditEvent(action: string, resource: string, details: string) {
  const path = COLLECTIONS.AUDIT_LOGS;
  const currentUser = auth.currentUser;
  if (!currentUser) {
    return;
  }
  try {
    const logId = `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    await setDoc(doc(db, path, logId), {
      id: logId,
      actorId: currentUser.uid,
      actorEmail: clampStr(currentUser.email || 'verified-user', 160),
      action: clampStr(action, 100),
      resource: clampStr(resource, 200),
      details: clampStr(details, 1000),
      ipAddress: 'client-verified',
      timestamp: new Date().toISOString(),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    // Audit logging should not break primary UX flow if offline or restricted
    console.warn('[Audit Log Failed]', error);
  }
}

export async function getAuditLogs(limitCount = 20) {
  const path = COLLECTIONS.AUDIT_LOGS;
  if (!(await isCurrentUserVerifiedAdmin())) {
    return [];
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
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fetchUserRole(uid: string): Promise<string> {
  const path = COLLECTIONS.USER_ROLES;
  if (!auth.currentUser) return 'client';
  try {
    const roleDoc = await getDoc(doc(db, path, uid));
    if (roleDoc.exists()) {
      return roleDoc.data().role || 'client';
    }
    return 'client';
  } catch (error) {
    console.warn('[fetchUserRole]', error);
    return 'client';
  }
}

/* =========================================================================
   3. APPS & APP CATEGORIES
   ========================================================================= */
export async function fetchFirestoreApps(): Promise<AndroidApp[]> {
  const path = COLLECTIONS.APPS;
  try {
    const snap = await getDocs(collection(db, path));
    if (snap.empty) {
      return [];
    }
    return snap.docs.map((d) => d.data() as AndroidApp);
  } catch (error) {
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
    await logAuditEvent('APP_DELETED', `apps/${appId}`, `Deleted app ${appId}`);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${path}/${appId}`);
  }
}

/* =========================================================================
   4. QUOTATIONS & CONSULTATION INQUIRIES
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
  attachment?: {
    fileUrl?: string;
    fileName?: string;
    sha256?: string;
    fileSizeFormatted?: string;
  };
}) {
  const path = COLLECTIONS.QUOTATIONS;
  try {
    const quoteId = `quote-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const payload = {
      id: quoteId,
      clientName: clampStr(data.fullName, 160),
      clientEmail: clampStr(data.email, 160).toLowerCase(),
      phone: clampStr(data.phone, 40),
      company: clampStr(data.company, 160),
      serviceType: clampStr(data.serviceType, 160),
      timeline: clampStr(data.timeline || '3-6-months', 64),
      estimatedBudget: clampStr(data.budget || 'enterprise', 80),
      brief: clampStr(data.brief, 3000),
      attachment: data.attachment
        ? {
            fileUrl: clampStr(data.attachment.fileUrl, 300),
            fileName: clampStr(data.attachment.fileName, 200),
            sha256: clampStr(data.attachment.sha256, 128),
            fileSizeFormatted: clampStr(data.attachment.fileSizeFormatted, 40),
          }
        : null,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    await setDoc(doc(db, path, quoteId), payload);
    if (auth.currentUser) {
      await logAuditEvent('QUOTATION_SUBMITTED', `quotations/${quoteId}`, `Submitted by ${payload.clientEmail}`);

      await createNotification({
        userId: auth.currentUser.uid,
        title: `New Scoping Proposal: ${payload.clientName}`,
        titleHi: `नया तकनीकी परामर्श अनुरोध: ${payload.clientName}`,
        message: `${payload.serviceType} | ${payload.company || 'Enterprise Client'} (${payload.estimatedBudget || 'Custom'})`,
        messageHi: `${payload.serviceType} | ${payload.company || 'एंटरप्राइज क्लाइंट'}`,
        type: 'quote',
        linkRoute: 'client-dashboard',
      });
    }

    return quoteId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function fetchAllQuotations() {
  const path = COLLECTIONS.QUOTATIONS;
  if (!(await isCurrentUserVerifiedAdmin())) return [];
  try {
    const snap = await getDocs(collection(db, path));
    return snap.docs.map((d) => d.data());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function updateQuotationStatus(quoteId: string, status: string) {
  const path = COLLECTIONS.QUOTATIONS;
  if (!(await isCurrentUserVerifiedAdmin())) {
    throw new Error('Forbidden: Administrator privilege required.');
  }
  try {
    await updateDoc(doc(db, path, quoteId), {
      status,
      updatedAt: serverTimestamp(),
    });
    await logAuditEvent('QUOTATION_STATUS_CHANGE', `quotations/${quoteId}`, `Updated status to ${status}`);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${path}/${quoteId}`);
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
  const path = COLLECTIONS.SUPPORT_TICKETS;
  if (!auth.currentUser) {
    throw new Error('Authentication required.');
  }
  try {
    await updateDoc(doc(db, path, ticketId), {
      status,
      updatedAt: serverTimestamp(),
    });
    await logAuditEvent('TICKET_STATUS_UPDATED', `support_tickets/${ticketId}`, `Status changed to ${status}`);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${path}/${ticketId}`);
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
      cin: 'U72900OR2024PTC045812',
      maintenanceMode: false,
      contactEmail: 'contact@bhanurambariha.tech',
      contactPhone: '+91 674 291 8000',
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
  try {
    const snap = await getDocs(collection(db, path));
    const usersList: any[] = [];
    for (const d of snap.docs) {
      const data = d.data();
      const role = await fetchUserRole(d.id);
      usersList.push({ ...data, role });
    }
    return usersList;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function updateUserRole(userId: string, newRole: 'admin' | 'client' | 'manager' | 'architect') {
  const path = COLLECTIONS.USER_ROLES;
  if (!(await isCurrentUserVerifiedAdmin())) {
    throw new Error('Forbidden: Verified administrator privilege required to modify roles.');
  }
  try {
    await setDoc(doc(db, path, userId), {
      uid: userId,
      role: newRole,
      assignedBy: auth.currentUser?.email || 'admin',
      assignedAt: new Date().toISOString(),
    }, { merge: true });
    await logAuditEvent('USER_ROLE_UPDATED', `user_roles/${userId}`, `Role set to ${newRole}`);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${path}/${userId}`);
  }
}

export async function saveClientRecord(userData: {
  uid: string;
  email: string;
  displayName: string;
  companyName?: string;
  phone?: string;
  role?: 'admin' | 'client';
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
      createdAt: new Date().toISOString(),
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
  const path = COLLECTIONS.PROJECTS;
  if (!(await isCurrentUserVerifiedAdmin())) {
    throw new Error('Forbidden: Administrator privilege required.');
  }
  try {
    await deleteDoc(doc(db, path, projectId));
    await logAuditEvent('PROJECT_DELETED', `projects/${projectId}`, `Deleted project ${projectId}`);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${path}/${projectId}`);
  }
}

/* =========================================================================
   10. SERVICE CATALOG MANAGEMENT
   ========================================================================= */
export async function fetchServicesCatalog(): Promise<ServiceItem[]> {
  const path = 'services';
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
  const path = COLLECTIONS.QUOTATIONS;
  if (!(await isCurrentUserVerifiedAdmin())) {
    throw new Error('Forbidden: Administrator privilege required.');
  }
  try {
    await deleteDoc(doc(db, path, quoteId));
    await logAuditEvent('QUOTATION_DELETED', `quotations/${quoteId}`, `Deleted quote ${quoteId}`);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${path}/${quoteId}`);
  }
}

/* =========================================================================
   12. CONTENT & BLOG MANAGEMENT
   ========================================================================= */
export async function fetchBlogPosts(): Promise<BlogPost[]> {
  const path = 'blog_posts';
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
    await logAuditEvent('BLOG_DELETED', `blog_posts/${postId}`, `Deleted blog post ${postId}`);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${path}/${postId}`);
  }
}

export async function fetchSiteSettings(): Promise<any> {
  const path = COLLECTIONS.SITE_SETTINGS;
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
  const path = COLLECTIONS.SITE_SETTINGS;
  if (!(await isCurrentUserVerifiedAdmin())) {
    throw new Error('Forbidden: Administrator privilege required.');
  }
  try {
    await setDoc(doc(db, path, 'global_config'), {
      ...settings,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    await logAuditEvent('SETTINGS_SAVED', 'site_settings/global_config', 'Updated platform configuration');
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${path}/global_config`);
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
  if (!auth.currentUser) {
    throw new Error('Authentication required to reply to support tickets.');
  }
  try {
    const ticketRef = doc(db, path, ticketId);
    const snap = await getDoc(ticketRef);
    if (!snap.exists()) {
      throw new Error(`Ticket ${ticketId} not found`);
    }
    const currentData = snap.data();
    const existingReplies = Array.isArray(currentData.responses) ? currentData.responses : [];
    const newReply = {
      id: `resp-${Date.now()}`,
      author: clampStr(reply.author, 120),
      authorRole: clampStr(reply.authorRole, 120),
      message: clampStr(reply.message, 2000),
      timestamp: new Date().toISOString(),
    };

    const updates: any = {
      responses: [...existingReplies, newReply],
      lastRepliedAt: new Date().toISOString(),
      updatedAt: serverTimestamp(),
    };

    if (reply.statusChange) {
      updates.status = reply.statusChange;
    }

    await updateDoc(ticketRef, updates);
    await logAuditEvent('TICKET_REPLIED', `support_tickets/${ticketId}`, `Reply by ${newReply.author}`);

    await createNotification({
      userId: currentData.clientId,
      title: `Response on Ticket #${ticketId}`,
      titleHi: `टिकट #${ticketId} पर प्रतिक्रिया`,
      message: `${newReply.author}: "${newReply.message.substring(0, 80)}..."`,
      messageHi: `${newReply.author}: "${newReply.message.substring(0, 80)}..."`,
      type: 'ticket',
      linkRoute: 'client-dashboard',
    });

    return newReply;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${path}/${ticketId}`);
  }
}
