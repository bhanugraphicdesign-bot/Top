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
  Timestamp,
} from 'firebase/firestore';
import { db, auth } from './config';
import { handleFirestoreError, OperationType } from './errorHandler';
import { AndroidApp, BlogPost, ServiceItem, AppNotification } from '../types';
import { INITIAL_ANDROID_APPS, SERVICES_DATA } from '../data/content';
import { BLOG_POSTS } from '../data/blogData';

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

/* =========================================================================
   1. AUDIT LOGGING (SECURITY & ACCOUNTABILITY)
   ========================================================================= */
export async function logAuditEvent(action: string, resource: string, details: string) {
  const path = COLLECTIONS.AUDIT_LOGS;
  try {
    const logId = `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const currentUser = auth.currentUser;
    await setDoc(doc(db, path, logId), {
      id: logId,
      actorId: currentUser?.uid || 'system_anonymous',
      actorEmail: currentUser?.email || 'anonymous@guest.io',
      action,
      resource,
      details,
      ipAddress: 'client-verified',
      timestamp: new Date().toISOString(),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    // Audit logging should not crash the primary UX flow if permissions deny
    console.warn('[Audit Log Failed]', error);
  }
}

export async function getAuditLogs(limitCount = 20) {
  const path = COLLECTIONS.AUDIT_LOGS;
  if (!auth.currentUser) {
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
   2. USERS & ROLES
   ========================================================================= */
export async function syncUserAccount(user: {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}) {
  const path = COLLECTIONS.USERS;
  try {
    const userRef = doc(db, path, user.uid);
    const existing = await getDoc(userRef);

    const payload = {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || 'Enterprise User',
      photoURL: user.photoURL || '',
      lastLoginAt: new Date().toISOString(),
    };

    if (!existing.exists()) {
      await setDoc(userRef, {
        ...payload,
        createdAt: new Date().toISOString(),
      });
      // Check if root admin bootstrap
      const isAdminEmail = user.email === 'ssbhanu41@gmail.com';
      await setDoc(doc(db, COLLECTIONS.USER_ROLES, user.uid), {
        uid: user.uid,
        role: isAdminEmail ? 'admin' : 'client',
        assignedBy: 'system_bootstrap',
        assignedAt: new Date().toISOString(),
      });
    } else {
      await updateDoc(userRef, payload);
    }

    await logAuditEvent('USER_LOGIN_SYNC', `users/${user.uid}`, `User synced: ${user.email}`);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fetchUserRole(uid: string): Promise<string> {
  const path = COLLECTIONS.USER_ROLES;
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
      clientName: data.fullName,
      clientEmail: data.email,
      phone: data.phone || '',
      company: data.company || '',
      serviceType: data.serviceType,
      timeline: data.timeline || '3-6-months',
      estimatedBudget: data.budget || 'enterprise',
      brief: data.brief || '',
      attachment: data.attachment || null,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    await setDoc(doc(db, path, quoteId), payload);
    await logAuditEvent('QUOTATION_SUBMITTED', `quotations/${quoteId}`, `Submitted by ${data.email}`);

    // Dispatch real-time in-app notification to administrators
    await createNotification({
      title: `New Scoping Proposal: ${data.fullName}`,
      titleHi: `नया तकनीकी परामर्श अनुरोध: ${data.fullName}`,
      message: `${data.serviceType} | ${data.company || 'Enterprise Client'} (${data.budget || 'Custom'})`,
      messageHi: `${data.serviceType} | ${data.company || 'एंटरप्राइज क्लाइंट'}`,
      type: 'quote',
      linkRoute: 'admin-dashboard',
    });

    return quoteId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function fetchAllQuotations() {
  const path = COLLECTIONS.QUOTATIONS;
  if (!auth.currentUser) return [];
  try {
    const snap = await getDocs(collection(db, path));
    return snap.docs.map((d) => d.data());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function updateQuotationStatus(quoteId: string, status: string) {
  const path = COLLECTIONS.QUOTATIONS;
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
  if (!auth.currentUser) return [];
  try {
    const q = query(collection(db, path), where('clientId', '==', clientId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function fetchAllProjects() {
  const path = COLLECTIONS.PROJECTS;
  if (!auth.currentUser) return [];
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
  try {
    const ticketId = `tkt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const currentUser = auth.currentUser;
    const payload = {
      id: ticketId,
      clientId: currentUser?.uid || 'client_anonymous',
      clientEmail: currentUser?.email || 'enterprise-client@kalingalogistics.in',
      subject: data.subject,
      priority: data.priority,
      category: data.category || 'General SLA Support',
      projectCode: data.projectCode || 'PRJ-FLT-2026',
      environment: data.environment || 'Android 14 / Enterprise Fleet',
      details: data.details,
      attachment: data.attachment || null,
      responses: [],
      status: 'open',
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, path, ticketId), payload);
    await logAuditEvent('TICKET_CREATED', `support_tickets/${ticketId}`, `Created ticket ${data.subject}`);

    // Dispatch real-time SLA notification
    await createNotification({
      title: `[${data.priority}] Priority Ticket: ${data.subject}`,
      titleHi: `[${data.priority}] प्राथमिकता टिकट: ${data.subject}`,
      message: `${data.category || 'Technical Support'} | Project ${data.projectCode || 'Enterprise'}`,
      messageHi: `${data.category || 'तकनीकी सहायता'} | प्रोजेक्ट ${data.projectCode || 'एंटरप्राइज'}`,
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
    const isRootAdmin = currentUser.email === 'ssbhanu41@gmail.com';
    const effectiveClientId = clientId || (!isRootAdmin ? currentUser.uid : undefined);

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
   7. INITIAL DATABASE SEEDER (POPULATE 15 COLLECTIONS IF EMPTY)
   ========================================================================= */
export async function seedInitialDatabaseIfEmpty() {
  try {
    const appsSnap = await getDocs(collection(db, COLLECTIONS.APPS));
    if (!appsSnap.empty) {
      return { seeded: false, count: appsSnap.size };
    }

    // 1. Seed Android Apps
    for (const app of INITIAL_ANDROID_APPS) {
      await setDoc(doc(db, COLLECTIONS.APPS, app.id), {
        ...app,
        createdAt: new Date().toISOString(),
      });
    }

    // 2. Seed Categories
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

    // 3. Seed Site Settings
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

    // 4. Seed Root Admin Role
    await setDoc(doc(db, COLLECTIONS.USER_ROLES, 'root-admin'), {
      uid: 'root-admin',
      role: 'admin',
      assignedBy: 'system_bootstrap',
      assignedAt: new Date().toISOString(),
      targetEmail: 'ssbhanu41@gmail.com',
    });

    await logAuditEvent('DATABASE_SEEDED', 'system', 'Populated initial 15 collections');
    return { seeded: true, count: INITIAL_ANDROID_APPS.length };
  } catch (error) {
    console.warn('[Database Seeding Warning]', error);
    return { seeded: false, error };
  }
}

/* =========================================================================
   8. CUSTOMER & USER MANAGEMENT
   ========================================================================= */
export async function fetchAllUsers(): Promise<any[]> {
  const path = COLLECTIONS.USERS;
  if (!auth.currentUser) return [];
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
  try {
    await setDoc(doc(db, path, userData.uid), {
      uid: userData.uid,
      email: userData.email,
      displayName: userData.displayName,
      companyName: userData.companyName || '',
      phone: userData.phone || '',
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
   9. PROJECT & SPRINT MANAGEMENT
   ========================================================================= */
export async function saveProject(project: any) {
  const path = COLLECTIONS.PROJECTS;
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
  try {
    await deleteDoc(doc(db, path, serviceId));
    await logAuditEvent('SERVICE_DELETED', `services/${serviceId}`, `Deleted service ${serviceId}`);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${path}/${serviceId}`);
  }
}

/* =========================================================================
   11. QUOTATION & COMMERCIAL ESTIMATES MANAGEMENT
   ========================================================================= */
export async function saveQuotation(quote: any) {
  const path = COLLECTIONS.QUOTATIONS;
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
  try {
    const notifId = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const payload = {
      id: notifId,
      userId: notif.userId || 'broadcast_all',
      title: notif.title,
      titleHi: notif.titleHi,
      message: notif.message,
      messageHi: notif.messageHi,
      type: notif.type,
      read: false,
      linkRoute: notif.linkRoute || 'home',
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
  try {
    const snap = await getDocs(query(collection(db, path), orderBy('createdAt', 'desc'), limit(30)));
    if (snap.empty) {
      return [];
    }
    return snap.docs
      .map((d) => d.data() as AppNotification)
      .filter((n) => !userId || n.userId === 'broadcast_all' || n.userId === userId);
  } catch (error) {
    console.warn('[fetchNotifications fallback]', error);
    return [];
  }
}

export async function markNotificationAsRead(notifId: string) {
  const path = COLLECTIONS.NOTIFICATIONS;
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
  try {
    const notifs = await fetchNotifications(userId);
    for (const n of notifs) {
      if (!n.read) {
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
  try {
    const ticketRef = doc(db, path, ticketId);
    const snap = await getDoc(ticketRef);
    if (!snap.exists()) {
      throw new Error(`Ticket ${ticketId} not found`);
    }
    const currentData = snap.data();
    const existingReplies = currentData.responses || [];
    const newReply = {
      id: `resp-${Date.now()}`,
      author: reply.author,
      authorRole: reply.authorRole,
      message: reply.message,
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
    await logAuditEvent('TICKET_REPLIED', `support_tickets/${ticketId}`, `Reply by ${reply.author}`);

    await createNotification({
      userId: currentData.clientId,
      title: `Architect Response on Ticket #${ticketId}`,
      titleHi: `टिकट #${ticketId} पर आर्किटेक्ट का जवाब`,
      message: `${reply.author}: "${reply.message.substring(0, 80)}..."`,
      messageHi: `${reply.author}: "${reply.message.substring(0, 80)}..."`,
      type: 'ticket',
      linkRoute: 'client-dashboard',
    });

    return newReply;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${path}/${ticketId}`);
  }
}

