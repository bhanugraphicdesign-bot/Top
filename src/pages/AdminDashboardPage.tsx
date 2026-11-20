import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useApps } from '../context/AppsContext';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '../context/NavigationContext';
import { notifySiteSettingsUpdated } from '../hooks/useSiteContact';
import { AndroidApp, BlogPost, EnterpriseInvoice, ServiceItem } from '../types';
import { AdminAppManagerModal } from '../components/admin/AdminAppManagerModal';
import { CustomerManagerModal } from '../components/admin/CustomerManagerModal';
import { ProjectManagerModal } from '../components/admin/ProjectManagerModal';
import { ServiceManagerModal } from '../components/admin/ServiceManagerModal';
import { QuotationManagerModal } from '../components/admin/QuotationManagerModal';
import { BlogManagerModal } from '../components/admin/BlogManagerModal';
import {
  seedInitialDatabaseIfEmpty,
  fetchAllUsers,
  updateUserRole,
  fetchAllProjects,
  deleteProject,
  fetchServicesCatalog,
  deleteServiceItem,
  fetchAllQuotations,
  deleteQuotation,
  updateQuotationStatus,
  fetchBlogPosts,
  deleteBlogPost,
  fetchSiteSettings,
  saveSiteSettings,
  getAuditLogs,
  fetchSupportTickets,
  updateSupportTicketStatus,
  addTicketResponse,
  authenticatedFetch,
} from '../firebase/services';
import { SERVICES_DATA } from '../data/content';
import { BLOG_POSTS } from '../data/blogData';
import { formatQuotationService, formatQuotationBudget } from '../data/quotationOptions';
import {
  Smartphone,
  Plus,
  Edit2,
  Trash2,
  Users,
  Cpu,
  Activity,
  CheckCircle,
  Terminal,
  Search,
  ExternalLink,
  RotateCcw,
  RefreshCw,
  Lock,
  FileText,
  Layers,
  BookOpen,
  Check,
  X,
  ShieldAlert,
  ArrowRight,
  LifeBuoy,
  MessageSquare,
  Send,
  Paperclip,
  Download,
  ShieldCheck,
  Receipt,
  AlertTriangle,
  Copy,
  LogOut,
} from 'lucide-react';

interface InboundLead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  service: string;
  serviceHi: string;
  budget: string;
  receivedDate: string;
  status: 'New' | 'Contacted' | 'In Discussion' | 'Converted';
  statusHi: 'नई पूछताछ' | 'संपर्क स्थापित' | 'चर्चा जारी' | 'सफल ग्राहक';
  notes: string;
}

export const AdminDashboardPage: React.FC = () => {
  const { language, t, dict, formatDate, showToast } = useLanguage();
  const { apps, deleteApp, resetToDefaults } = useApps();
  const {
    currentUser,
    userRole,
    isAdmin,
    isSuperAdmin,
    roleDocExists,
    roleCheckError,
    isAuthReady,
    isRoleChecking,
    refreshUserRole,
    openAuthModal,
    logout,
  } = useAuth();
  const { navigate } = useNavigation();

  const [checkingRoleManual, setCheckingRoleManual] = useState(false);
  const [copiedUid, setCopiedUid] = useState(false);

  // Strict real Admin access gate: verified Firebase Auth UID + Firestore user_roles / custom claims ONLY
  useEffect(() => {
    try {
      sessionStorage.removeItem('pws_demo_admin');
    } catch {
      // Ignore storage access errors
    }
  }, []);

  const isRealAdmin = Boolean(currentUser) && isAdmin;
  const isAuthorizedAdmin = isRealAdmin;

  const handleRecheckAdminRole = async () => {
    if (!currentUser) {
      openAuthModal('login');
      return;
    }
    setCheckingRoleManual(true);
    try {
      try {
        await authenticatedFetch(
          '/api/admin/bootstrap',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
          },
          { user: currentUser }
        );
      } catch {
        // Non-owner accounts receive 403; role verification below determines access
      }
      const verified = await refreshUserRole();
      if (verified) {
        showToast(
          t(
            'Administrator role verified in Firestore user_roles. Welcome!',
            'Firestore user_roles में एडमिन रोल सत्यापित हो गया है।'
          ),
          'success'
        );
      } else {
        showToast(
          t(
            `Access Denied: No Admin role found in Firestore user_roles/${currentUser.uid}.`,
            `त्रुटि: Firestore user_roles/${currentUser.uid} में इस खाते के लिए Admin Role नहीं मिला।`
          ),
          'alert'
        );
      }
    } finally {
      setCheckingRoleManual(false);
    }
  };

  const handleSwitchAdminAccount = async () => {
    try {
      await logout();
    } catch {
      // Ignore logout failure and still allow login
    }
    openAuthModal('login');
  };

  const handleCopyUid = async () => {
    if (!currentUser?.uid || typeof navigator === 'undefined' || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(currentUser.uid);
      setCopiedUid(true);
      setTimeout(() => setCopiedUid(false), 2000);
      showToast(t('Firebase UID copied to clipboard.', 'Firebase UID क्लिपबोर्ड पर कॉपी हो गया।'), 'info');
    } catch {
      // Ignore clipboard permission errors
    }
  };

  const [activeTab, setActiveTab] = useState<
    'customers' | 'leads' | 'projects' | 'services' | 'portfolio' | 'quotations' | 'billing' | 'support' | 'content' | 'telemetry'
  >('customers');

  const [searchTerm, setSearchTerm] = useState('');
  const [isSeeding, setIsSeeding] = useState(false);
  const [serverHealth, setServerHealth] = useState<any>(null);
  const [telemetryData, setTelemetryData] = useState<any>(null);

  // Invoices & Billing Generator state
  const [invoicesList, setInvoicesList] = useState<EnterpriseInvoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [creatingInvoice, setCreatingInvoice] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({
    clientId: '',
    clientName: '',
    clientEmail: '',
    clientCompany: '',
    clientGstin: '',
    projectName: '',
    milestoneTitle: '',
    subtotal: '',
  });

  // Modals state
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);

  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any | null>(null);

  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);

  const [appModalOpen, setAppModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<AndroidApp | null>(null);

  const [quotationModalOpen, setQuotationModalOpen] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState<any | null>(null);

  const [blogModalOpen, setBlogModalOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<BlogPost | null>(null);

  const [pendingDelete, setPendingDelete] = useState<{
    type: 'project' | 'service' | 'quotation' | 'blog' | 'app';
    id: string;
    label: string;
  } | null>(null);
  const [deletingItem, setDeletingItem] = useState(false);

  useEffect(() => {
    if (!pendingDelete) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !deletingItem) {
        setPendingDelete(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [pendingDelete, deletingItem]);

  // Live Firestore collections state (loaded strictly for verified Firebase Administrators)
  const [usersList, setUsersList] = useState<any[]>([]);
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [servicesList, setServicesList] = useState<ServiceItem[]>(SERVICES_DATA);
  const [quotationsList, setQuotationsList] = useState<any[]>([]);

  // Live Inbound Leads derived strictly from Cloud Firestore quotations
  const leads: InboundLead[] = useMemo(() => {
    return quotationsList.map((q: any) => {
      const qStatus = String(q.status || 'pending').toLowerCase();
      const status: InboundLead['status'] =
        qStatus === 'approved' || qStatus === 'accepted'
          ? 'Converted'
          : qStatus === 'reviewed'
          ? 'In Discussion'
          : qStatus === 'under_review'
          ? 'Contacted'
          : 'New';
      const statusHi: InboundLead['statusHi'] =
        status === 'Converted'
          ? 'सफल ग्राहक'
          : status === 'In Discussion'
          ? 'चर्चा जारी'
          : status === 'Contacted'
          ? 'संपर्क स्थापित'
          : 'नई पूछताछ';
      return {
        id: q.id,
        name: q.clientName || 'Enterprise Inquiry',
        company: q.company || 'Enterprise Organization',
        email: q.clientEmail || '',
        phone: q.phone || 'Not provided',
        service: q.serviceType || '',
        serviceHi: q.serviceType || '',
        budget: q.estimatedBudget ?? '',
        receivedDate: q.createdAt || new Date().toISOString(),
        status,
        statusHi,
        notes: q.brief || 'Submitted via enterprise scoping form.',
      };
    });
  }, [quotationsList]);
  const [blogList, setBlogList] = useState<BlogPost[]>(BLOG_POSTS);
  const [contentSubTab, setContentSubTab] = useState<'articles' | 'settings'>('articles');

  const [siteSettings, setSiteSettings] = useState({
    companyName: 'BHANU RAM BARIHA DIGITAL TECHNOLOGIES',
    brandName: 'POWER WEB STUDIO AI',
    companyRegistration: '',
    contactEmail: 'powerusertopuser@gmail.com',
    contactPhone: '+91 8305457717',
    maintenanceMode: false,
    slaTarget: 'SOW Scoped',
    headquarters: 'Fingeshwar Borid Mod, Rajim Subdistrict, Gariaband District, Chhattisgarh - 493992',
  });
  const [savingSettings, setSavingSettings] = useState(false);

  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Support Tickets & SLA Triage state
  const [ticketsList, setTicketsList] = useState<any[]>([]);
  const [ticketSearchTerm, setTicketSearchTerm] = useState('');
  const [ticketPriorityFilter, setTicketPriorityFilter] = useState<string>('all');
  const [ticketStatusFilter, setTicketStatusFilter] = useState<string>('all');
  const [activeTicketIdForReply, setActiveTicketIdForReply] = useState<string | null>(null);
  const [adminReplyTexts, setAdminReplyTexts] = useState<Record<string, string>>({});
  const [adminReplyStatuses, setAdminReplyStatuses] = useState<Record<string, 'open' | 'in_progress' | 'resolved'>>({});
  const [submittingAdminReply, setSubmittingAdminReply] = useState<Record<string, boolean>>({});

  // Load telemetry and live Firestore records on mount
  useEffect(() => {
    let isCancelled = false;

    fetch('/api/health')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isCancelled && data) setServerHealth(data);
      })
      .catch(() => {});

    fetchServicesCatalog()
      .then((services) => {
        if (!isCancelled && services && services.length > 0) setServicesList(services);
      })
      .catch(() => {});

    fetchBlogPosts()
      .then((posts) => {
        if (!isCancelled && posts && posts.length > 0) setBlogList(posts);
      })
      .catch(() => {});

    fetchSiteSettings()
      .then((settings) => {
        if (!isCancelled && settings) {
          setSiteSettings((prev) => ({
            ...prev,
            companyName: settings.companyName ?? prev.companyName,
            brandName: settings.brandName ?? prev.brandName,
            companyRegistration: settings.companyRegistration ?? '',
            contactEmail: settings.contactEmail ?? prev.contactEmail,
            contactPhone: settings.contactPhone ?? prev.contactPhone,
            maintenanceMode: Boolean(settings.maintenanceMode),
            slaTarget: settings.slaTarget ?? prev.slaTarget,
            headquarters: settings.headquarters ?? prev.headquarters,
          }));
        }
      })
      .catch(() => {});

    // Only load protected admin collections if user is a real verified Firebase Admin
    if (!currentUser || !isRealAdmin) {
      setTelemetryData(null);
      setInvoicesList([]);
      setUsersList([]);
      setProjectsList([]);
      setQuotationsList([]);
      setAuditLogs([]);
      setTicketsList([]);
      setActiveTicketIdForReply(null);
      return () => {
        isCancelled = true;
      };
    }

    setLoadingInvoices(true);
    authenticatedFetch('/api/telemetry', {}, { user: currentUser })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isCancelled && data) setTelemetryData(data);
      })
      .catch(() => {});

    authenticatedFetch('/api/invoices', {}, { user: currentUser })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isCancelled) {
          setInvoicesList(data && Array.isArray(data.invoices) ? data.invoices : []);
        }
      })
      .catch(() => {
        if (!isCancelled) setInvoicesList([]);
      })
      .finally(() => {
        if (!isCancelled) setLoadingInvoices(false);
      });

    // Load authoritative Firestore data for verified admin (never mix demo rows into real admin session)
    fetchAllUsers()
      .then((users) => {
        if (!isCancelled) setUsersList(Array.isArray(users) ? users : []);
      })
      .catch(() => {
        if (!isCancelled) setUsersList([]);
      });

    fetchAllProjects()
      .then((projs) => {
        if (!isCancelled) setProjectsList(Array.isArray(projs) ? projs : []);
      })
      .catch(() => {
        if (!isCancelled) setProjectsList([]);
      });

    fetchAllQuotations()
      .then((quotes) => {
        if (!isCancelled) setQuotationsList(Array.isArray(quotes) ? quotes : []);
      })
      .catch(() => {
        if (!isCancelled) setQuotationsList([]);
      });

    fetchSupportTickets()
      .then((tickets) => {
        if (isCancelled) return;
        const list = Array.isArray(tickets) ? tickets : [];
        setTicketsList(list);
        setActiveTicketIdForReply(list.length > 0 ? list[0]?.id || null : null);
      })
      .catch(() => {
        if (!isCancelled) {
          setTicketsList([]);
          setActiveTicketIdForReply(null);
        }
      });

    getAuditLogs(15)
      .then((logs) => {
        if (!isCancelled) setAuditLogs(Array.isArray(logs) ? logs : []);
      })
      .catch(() => {
        if (!isCancelled) setAuditLogs([]);
      });

    return () => {
      isCancelled = true;
    };
  }, [currentUser, isRealAdmin]);

  useEffect(() => {
    if (!pendingDelete) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !deletingItem) {
        setPendingDelete(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pendingDelete, deletingItem]);

  const handleSeedDatabase = async () => {
    try {
      setIsSeeding(true);
      const res = await seedInitialDatabaseIfEmpty();
      showToast(
        language === 'hi'
          ? `Cloud Firestore संग्रह सफलतापूर्वक सिंक्रनाइज़ हुए (${res.count} ऐप्स)`
          : `Cloud Firestore collections synchronized (${res.count} apps)`,
        'success'
      );
    } catch (err: any) {
      showToast(err.message || 'Seeding error', 'alert');
    } finally {
      setIsSeeding(false);
    }
  };

  // Customers: assign non-privileged roles strictly via server-side /api/admin/roles/update
  const handleRoleChange = async (userId: string, newRole: 'client' | 'architect' | 'manager') => {
    const target = usersList.find((u) => u.uid === userId);
    if (target?.role === 'owner' || target?.isOwner === true) {
      return;
    }
    try {
      await updateUserRole(userId, newRole);
      setUsersList((prev) =>
        prev.map((u) => (u.uid === userId ? { ...u, role: newRole } : u))
      );
      showToast(
        language === 'hi'
          ? `उपयोगकर्ता भूमिका को "${newRole}" में सफलतापूर्वक अपडेट किया गया।`
          : `User role updated to "${newRole}" successfully.`,
        'success'
      );
    } catch (err: any) {
      showToast(err.message || 'Failed to update role', 'alert');
    }
  };

  // Leads: cycle status (persists via server-side /api/admin/quotations/:id/status)
  const handleToggleLeadStatus = async (leadId: string) => {
    const currentQuote = quotationsList.find((q) => q.id === leadId);
    const currentStatus = String(currentQuote?.status || 'pending').toLowerCase();
    const nextQuoteStatus =
      currentStatus === 'pending'
        ? 'under_review'
        : currentStatus === 'under_review'
        ? 'reviewed'
        : currentStatus === 'reviewed'
        ? 'approved'
        : 'under_review';

    try {
      await updateQuotationStatus(leadId, nextQuoteStatus);
      setQuotationsList((prev) =>
        prev.map((q) => (q.id === leadId ? { ...q, status: nextQuoteStatus } : q))
      );
      showToast(
        language === 'hi' ? 'लीड की स्थिति Cloud Firestore में अपडेट की गई।' : 'Lead status persisted to Cloud Firestore.',
        'success'
      );
    } catch (err: any) {
      showToast(err?.message || 'Failed to update lead status', 'alert');
    }
  };

  // Convert Lead to Quotation
  const handleConvertLeadToQuote = (lead: InboundLead) => {
    const existingQuote = quotationsList.find((q) => q.id === lead.id) || null;
    if (existingQuote) {
      setEditingQuotation(existingQuote);
    } else {
      setEditingQuotation({
        id: `quote-${Date.now()}`,
        clientName: lead.name,
        clientEmail: lead.email,
        phone: lead.phone,
        company: lead.company,
        serviceType: lead.service,
        estimatedBudget: lead.budget,
        timeline: '3-6 Months',
        brief: lead.notes,
        status: 'pending',
      });
    }
    setQuotationModalOpen(true);
  };

  // Delete Handlers using accessible in-app confirmation modal
  const handleDeleteProject = (id: string, name: string) => {
    setPendingDelete({ type: 'project', id, label: name });
  };

  const handleDeleteService = (id: string, title: string) => {
    setPendingDelete({ type: 'service', id, label: title });
  };

  const handleDeleteQuotation = (id: string) => {
    setPendingDelete({ type: 'quotation', id, label: id });
  };

  const handleDeleteBlogPost = (id: string, title: string) => {
    setPendingDelete({ type: 'blog', id, label: title });
  };

  const handleQuickQuotationStatus = async (quoteId: string, status: 'approved' | 'rejected') => {
    try {
      await updateQuotationStatus(quoteId, status);
      setQuotationsList((prev) =>
        prev.map((q) => (q.id === quoteId ? { ...q, status } : q))
      );
      showToast(
        language === 'hi'
          ? `कोटेशन स्थिति को "${status}" में अपडेट किया गया।`
          : `Quotation marked as ${status}.`,
        'success'
      );
    } catch (err: any) {
      showToast(err?.message || 'Failed to update quotation status', 'alert');
    }
  };

  const executePendingDelete = async () => {
    if (!pendingDelete) return;
    const { type, id } = pendingDelete;
    setDeletingItem(true);

    try {
      if (type === 'app') {
        await deleteApp(id);
        showToast(dict.notifications.appDeleted, 'info');
      } else if (type === 'project') {
        await deleteProject(id);
        setProjectsList((prev) => prev.filter((p) => p.id !== id));
        showToast(language === 'hi' ? 'प्रोजेक्ट हटाया गया।' : 'Project removed.', 'info');
      } else if (type === 'service') {
        await deleteServiceItem(id);
        setServicesList((prev) => prev.filter((s) => s.id !== id));
        showToast(language === 'hi' ? 'सेवा हटाई गई।' : 'Service removed from catalog.', 'info');
      } else if (type === 'quotation') {
        await deleteQuotation(id);
        setQuotationsList((prev) => prev.filter((q) => q.id !== id));
        showToast(language === 'hi' ? 'कोटेशन हटाई गई।' : 'Quotation deleted.', 'info');
      } else if (type === 'blog') {
        await deleteBlogPost(id);
        setBlogList((prev) => prev.filter((b) => b.id !== id));
        showToast(language === 'hi' ? 'लेख हटाया गया।' : 'Article removed.', 'info');
      }
      setPendingDelete(null);
    } catch (err: any) {
      showToast(err?.message || 'Delete failed', 'alert');
    } finally {
      setDeletingItem(false);
    }
  };

  const handleSaveSiteSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await saveSiteSettings(siteSettings);
      notifySiteSettingsUpdated(siteSettings);
      showToast(
        language === 'hi'
          ? 'ग्लोबल प्लेटफ़ॉर्म सेटिंग्स सफलतापूर्वक सहेज ली गईं।'
          : 'Global platform settings saved to Cloud Firestore.',
        'success'
      );
    } catch (err: any) {
      showToast(err.message || 'Failed to save settings', 'alert');
    } finally {
      setSavingSettings(false);
    }
  };

  // Authenticated attachment download helper (sends Bearer ID token for /api/files/*)
  const handleAdminDownloadAttachment = async (url?: string, fileName?: string) => {
    if (!url || url === '#') return;
    try {
      const res =
        currentUser && url.startsWith('/api/files/')
          ? await authenticatedFetch(url, {}, { user: currentUser })
          : await fetch(url);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Download failed (HTTP ${res.status})`);
      }
      const blob = await res.blob();
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objUrl;
      a.download = fileName || 'enterprise-artifact';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objUrl);
    } catch (err: any) {
      showToast(err?.message || t('Unable to download attachment.', 'संलग्नक डाउनलोड विफल।'), 'alert');
    }
  };

  // Issue Official GST Invoice (server calculates 18% GST and persists)
  const handleGenerateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericSubtotal = Number(invoiceForm.subtotal);
    if (!Number.isFinite(numericSubtotal) || numericSubtotal <= 0) {
      showToast(t('Enter a valid positive subtotal in INR.', 'कृपया INR में मान्य सकारात्मक राशि दर्ज करें।'), 'alert');
      return;
    }

    if (!currentUser) {
      openAuthModal('login');
      return;
    }

    setCreatingInvoice(true);
    try {
      const res = await authenticatedFetch(
        '/api/invoices/generate',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...invoiceForm,
            clientId: invoiceForm.clientId.trim() || undefined,
            subtotal: numericSubtotal,
          }),
        },
        { user: currentUser }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `Invoice generation failed (HTTP ${res.status})`);
      }
      if (data.invoice) {
        setInvoicesList((prev) => [data.invoice, ...prev]);
      }
      showToast(
        t(
          `Official GST Invoice ${data.invoice?.invoiceNumber} issued (Total: INR ${data.invoice?.totalAmount?.toLocaleString('en-IN')}).`,
          `आधिकारिक GST चालान ${data.invoice?.invoiceNumber} जारी किया गया।`
        ),
        'success'
      );
    } catch (err: any) {
      showToast(err?.message || t('Invoice generation failed.', 'चालान निर्माण विफल रहा।'), 'alert');
    } finally {
      setCreatingInvoice(false);
    }
  };

  // Filtered lists
  const filteredApps = useMemo(() => {
    return apps.filter(
      (app) =>
        app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.architecture.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [apps, searchTerm]);

  const filteredUsers = useMemo(() => {
    return usersList.filter(
      (u) =>
        (u.displayName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.companyName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.role || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [usersList, searchTerm]);

  const filteredProjects = useMemo(() => {
    return projectsList.filter(
      (p) =>
        (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.clientName || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [projectsList, searchTerm]);

  const filteredServices = useMemo(() => {
    return servicesList.filter(
      (s) =>
        (s.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.category || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [servicesList, searchTerm]);

  const filteredQuotes = useMemo(() => {
    const qLower = searchTerm.toLowerCase();
    return quotationsList.filter(
      (q) =>
        (q.clientName || '').toLowerCase().includes(qLower) ||
        (q.clientEmail || '').toLowerCase().includes(qLower) ||
        (q.company || '').toLowerCase().includes(qLower) ||
        (q.serviceType || '').toLowerCase().includes(qLower) ||
        formatQuotationService(q.serviceType, language).toLowerCase().includes(qLower) ||
        formatQuotationBudget(q.estimatedBudget, language).toLowerCase().includes(qLower)
    );
  }, [quotationsList, searchTerm, language]);

  const filteredBlogs = useMemo(() => {
    return blogList.filter(
      (b) =>
        (b.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.author || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.category || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [blogList, searchTerm]);

  const filteredTicketsAdmin = useMemo(() => {
    return ticketsList.filter((ticket) => {
      const matchesSearch =
        !ticketSearchTerm ||
        (ticket.subject || '').toLowerCase().includes(ticketSearchTerm.toLowerCase()) ||
        (ticket.id || '').toLowerCase().includes(ticketSearchTerm.toLowerCase()) ||
        (ticket.clientEmail || '').toLowerCase().includes(ticketSearchTerm.toLowerCase()) ||
        (ticket.projectCode || '').toLowerCase().includes(ticketSearchTerm.toLowerCase());

      const matchesPriority =
        ticketPriorityFilter === 'all' || ticket.priority === ticketPriorityFilter;

      const matchesStatus =
        ticketStatusFilter === 'all' || ticket.status === ticketStatusFilter;

      return matchesSearch && matchesPriority && matchesStatus;
    });
  }, [ticketsList, ticketSearchTerm, ticketPriorityFilter, ticketStatusFilter]);

  const handleAdminTicketReply = async (ticketId: string) => {
    const text = (adminReplyTexts[ticketId] || '').trim();
    if (!text) {
      showToast(language === 'hi' ? 'कृपया उत्तर संदेश लिखें।' : 'Please enter reply message.', 'info');
      return;
    }
    const statusChange = adminReplyStatuses[ticketId] || 'in_progress';
    const author = currentUser?.displayName || 'Er. Bhanu Ram Bariha (Lead Architect)';

    setSubmittingAdminReply((prev) => ({ ...prev, [ticketId]: true }));
    try {
      const reply = await addTicketResponse(ticketId, {
        author,
        authorRole: 'Lead Platform Architect',
        message: text,
        statusChange,
      });

      const replyObj = reply || {
        id: `resp-${Date.now()}`,
        author,
        authorRole: 'Lead Platform Architect',
        message: text,
        timestamp: new Date().toISOString(),
      };

      setTicketsList((prev) =>
        prev.map((t) => {
          if (t.id === ticketId) {
            const existing = t.responses || [];
            return {
              ...t,
              status: statusChange,
              responses: [...existing, replyObj],
            };
          }
          return t;
        })
      );

      setAdminReplyTexts((prev) => ({ ...prev, [ticketId]: '' }));
      showToast(
        language === 'hi'
          ? `आर्किटेक्ट जवाब क्लाइंट को प्रेषित हुआ। स्थिति: ${statusChange}`
          : `Architect response dispatched to client. Status: ${statusChange}`,
        'success'
      );
    } catch (err: any) {
      showToast(err.message || 'Failed to dispatch reply', 'alert');
    } finally {
      setSubmittingAdminReply((prev) => ({ ...prev, [ticketId]: false }));
    }
  };

  const handleAdminChangeTicketStatus = async (ticketId: string, newStatus: 'open' | 'in_progress' | 'resolved') => {
    try {
      await updateSupportTicketStatus(ticketId, newStatus);
      setTicketsList((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t))
      );
      showToast(
        language === 'hi'
          ? `टिकट स्थिति को "${newStatus}" में अपडेट किया गया।`
          : `Ticket status updated to "${newStatus}".`,
        'success'
      );
    } catch (err: any) {
      showToast(err.message || 'Failed to update ticket status', 'alert');
    }
  };

  /* =========================================================================
     VERIFICATION LOADER (WHILE CHECKING FIREBASE AUTH & FIRESTORE user_roles)
     ========================================================================= */
  if (!isAuthorizedAdmin && (!isAuthReady || (Boolean(currentUser) && isRoleChecking))) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6 text-white">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-10 shadow-2xl text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-blue-900/40 border border-blue-500/40 text-blue-400 flex items-center justify-center mx-auto">
            <RefreshCw className="w-7 h-7 animate-spin text-blue-400" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-extrabold text-white tracking-tight">
              {t('Verifying Administrator Privileges...', 'प्रशासक अधिकार सत्यापित हो रहे हैं...')}
            </h1>
            <p className="text-xs text-slate-400">
              {t(
                'Checking Firebase Authentication UID and Firestore user_roles collection.',
                'Firebase Authentication UID और Firestore user_roles की जांच की जा रही है।'
              )}
            </p>
          </div>
          {currentUser && (
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-left text-xs font-mono text-slate-300 space-y-1">
              <div className="truncate">Email: {currentUser.email || '—'}</div>
              <div className="truncate text-slate-400">UID: {currentUser.uid}</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* =========================================================================
     RESTRICTED ACCESS BARRIER (IF NOT AUTHORIZED & NOT IN DEMO MODE)
     ========================================================================= */
  if (!isAuthorizedAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6 text-white">
        <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-10 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-blue-900/40 border border-blue-500/40 text-blue-400 flex items-center justify-center mx-auto shadow-inner">
            <ShieldAlert className="w-8 h-8 text-blue-400" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 text-xs font-bold uppercase tracking-widest text-blue-300 bg-blue-950 border border-blue-800 rounded-md">
              {t('Secure Restricted Zone', 'संरक्षित प्रतिबंधित क्षेत्र')}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {t('Enterprise Administration Console', 'एंटरप्राइज प्रशासन कंसोल')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
              {t(
                'Access to this terminal is strictly restricted to authenticated platform architects and executives of BHANU RAM BARIHA DIGITAL TECHNOLOGIES.',
                'इस कंसोल तक पहुंच केवल भानु राम बरीहा डिजिटल टेक्नोलॉजीज के अधिकृत सिस्टम वास्तुकारों एवं प्रशासकों के लिए आरक्षित है।'
              )}
            </p>
          </div>

          {/* Explicit RBAC Error Banner when signed in without Admin Role */}
          {currentUser && (
            <div
              role="alert"
              className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/40 text-left space-y-1.5"
            >
              <div className="flex items-center gap-2 text-rose-300 font-bold text-xs sm:text-sm">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>
                  {t(
                    'Access Denied: Administrator Role Not Found',
                    'प्रवेश अस्वीकृत: एडमिन रोल (Admin Role) सत्यापित नहीं हुआ'
                  )}
                </span>
              </div>
              <p className="text-xs text-rose-200/90 leading-relaxed">
                {roleCheckError
                  ? roleCheckError
                  : t(
                      `Account "${currentUser.email || currentUser.uid}" does not have role "admin" or "super_admin" in Firestore user_roles/${currentUser.uid}. Normal accounts cannot self-assign admin roles; create the role record via Firebase Console or secure server-side Super Admin bootstrap.`,
                      `खाता "${currentUser.email || currentUser.uid}" के लिए Firestore user_roles/${currentUser.uid} में "admin" या "super_admin" भूमिका नहीं मिली। सामान्य यूज़र स्वयं अपना Admin Role नहीं बदल सकते — Admin Role केवल Firebase Console या सुरक्षित Server-Side Bootstrap से सेट किया जा सकता है।`
                    )}
              </p>
            </div>
          )}

          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-left space-y-2.5 text-xs font-mono text-slate-300">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-slate-400">{t('Required Privilege:', 'आवश्यक अधिकार:')}</span>
              <span className="text-emerald-400 font-bold text-right">
                {t('Firestore user_roles/{uid} (admin)', 'Firestore user_roles/{uid} (admin)')}
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-slate-400">{t('Security Policy:', 'सुरक्षा नीति:')}</span>
              <span className="text-blue-400 font-bold text-right">Role-Based RBAC / Server-Only Grant</span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-slate-400">{t('Firebase Email:', 'फायरबेस ईमेल:')}</span>
              <span className="text-amber-300 font-bold break-all text-right">
                {currentUser
                  ? `${currentUser.email || '—'} (${currentUser.emailVerified ? t('Verified', 'सत्यापित') : t('Unverified', 'असत्यापित')})`
                  : t('Unauthenticated Guest', 'अनाधिकृत आगंतुक')}
              </span>
            </div>
            {currentUser && (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-slate-400">{t('Firebase UID:', 'फायरबेस UID:')}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-200 font-semibold break-all text-right">{currentUser.uid}</span>
                    <button
                      type="button"
                      onClick={handleCopyUid}
                      title={t('Copy UID', 'UID कॉपी करें')}
                      aria-label={t('Copy Firebase UID', 'फायरबेस UID कॉपी करें')}
                      className="p-1 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded cursor-pointer transition-colors"
                    >
                      {copiedUid ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-slate-400">{t('Firestore Role Check:', 'Firestore रोल जांच:')}</span>
                  <span className="text-rose-400 font-bold text-right">
                    {roleDocExists
                      ? t(`Found "${userRole}" (Admin required)`, `"${userRole}" मिला (Admin आवश्यक)`)
                      : t('No user_roles document for UID', 'इस UID के लिए user_roles दस्तावेज़ नहीं मिला')}
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 pt-2">
            {!currentUser ? (
              <button
                onClick={() => openAuthModal('login')}
                type="button"
                className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>{t('Sign In as Administrator', 'प्रशासक के रूप में लॉगिन करें')}</span>
              </button>
            ) : (
              <>
                <button
                  onClick={handleRecheckAdminRole}
                  disabled={checkingRoleManual || isRoleChecking}
                  type="button"
                  className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${checkingRoleManual || isRoleChecking ? 'animate-spin' : ''}`} />
                  <span>{t('Recheck Admin Role', 'एडमिन रोल पुनः जांचें')}</span>
                </button>
                <button
                  onClick={handleSwitchAdminAccount}
                  type="button"
                  className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4 text-blue-400" />
                  <span>{t('Switch Admin Account', 'अन्य एडमिन खाते से लॉगिन करें')}</span>
                </button>
                <button
                  onClick={() => logout()}
                  type="button"
                  className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-rose-200 bg-rose-950/60 hover:bg-rose-900/70 border border-rose-800/70 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t('Sign Out', 'लॉग आउट करें')}</span>
                </button>
              </>
            )}
          </div>

          <div className="pt-2">
            <button
              onClick={() => navigate('home')}
              type="button"
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors flex items-center justify-center gap-1 mx-auto cursor-pointer"
            >
              <span>{t('Return to Public Portal', 'सार्वजनिक पोर्टल पर वापस जाएं')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================================
     AUTHORIZED ADMIN CONSOLE (STRICTLY VERIFIED FIREBASE ADMIN ONLY)
     ========================================================================= */
  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Studio Admin Header Banner */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 sm:p-8 text-white shadow-md mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-blue-900/60 text-blue-300 border border-blue-700/60 uppercase tracking-wider">
                  {t('Studio Admin Console', 'स्टूडियो एडमिनिस्ट्रेशन कंसोल')}
                </span>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                  {isSuperAdmin
                    ? t('Verified Firebase Super Admin', 'सत्यापित फायरबेस सुपर एडमिन')
                    : t('Verified Firebase Admin Session', 'सत्यापित फायरबेस एडमिन सत्र')}
                </span>
                {currentUser?.email && (
                  <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                    ({currentUser.email} • UID: {currentUser.uid.slice(0, 8)}…)
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {dict.adminDashboard.title}
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-300 max-w-2xl">
                {dict.adminDashboard.subtitle}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={handleSeedDatabase}
                disabled={isSeeding}
                type="button"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-lg shadow-xs transition-colors cursor-pointer"
                title="Populate Cloud Firestore Collections"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSeeding ? 'animate-spin' : ''}`} />
                <span>{isSeeding ? t('Syncing...', 'सिंक जारी...') : t('Sync Cloud Firestore', 'क्लाउड डेटाबेस सिंक')}</span>
              </button>

              <button
                onClick={resetToDefaults}
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                title="Reset local fallback records"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t('Reset Defaults', 'डिफ़ॉल्ट')}</span>
              </button>
            </div>
          </div>

          {/* 7 High-Density Enterprise Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 mt-6">
            <div className="p-3.5 bg-slate-800/60 rounded-lg border border-slate-800">
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-semibold uppercase tracking-wider mb-1">
                <Users className="w-3.5 h-3.5 text-blue-400" />
                <span>{t('Customers', 'ग्राहक')}</span>
              </div>
              <div className="text-xl font-black text-white">{usersList.length}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{t('Accounts', 'खाते')}</div>
            </div>

            <div className="p-3.5 bg-slate-800/60 rounded-lg border border-slate-800">
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-semibold uppercase tracking-wider mb-1">
                <Activity className="w-3.5 h-3.5 text-amber-400" />
                <span>{t('Inbound Leads', 'लीड्स')}</span>
              </div>
              <div className="text-xl font-black text-white">{leads.length}</div>
              <div className="text-[11px] text-amber-400 mt-0.5">{t('Active Pipeline', 'सक्रिय')}</div>
            </div>

            <div className="p-3.5 bg-slate-800/60 rounded-lg border border-slate-800">
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-semibold uppercase tracking-wider mb-1">
                <Layers className="w-3.5 h-3.5 text-blue-400" />
                <span>{t('Projects', 'प्रोजेक्ट्स')}</span>
              </div>
              <div className="text-xl font-black text-white">{projectsList.length}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{t('In Delivery', 'प्रगति पर')}</div>
            </div>

            <div className="p-3.5 bg-slate-800/60 rounded-lg border border-slate-800">
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-semibold uppercase tracking-wider mb-1">
                <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                <span>{t('Services', 'सेवाएं')}</span>
              </div>
              <div className="text-xl font-black text-white">{servicesList.length}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{t('Catalog Offerings', 'कैटलॉग')}</div>
            </div>

            <div className="p-3.5 bg-slate-800/60 rounded-lg border border-slate-800">
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-semibold uppercase tracking-wider mb-1">
                <Smartphone className="w-3.5 h-3.5 text-blue-400" />
                <span>{t('Android Apps', 'एंड्रॉइड ऐप्स')}</span>
              </div>
              <div className="text-xl font-black text-white">{apps.length}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{t('7 Categories', '7 श्रेणियां')}</div>
            </div>

            <div className="p-3.5 bg-slate-800/60 rounded-lg border border-slate-800">
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-semibold uppercase tracking-wider mb-1">
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t('Quotations', 'कोटेशन')}</span>
              </div>
              <div className="text-xl font-black text-emerald-400">{quotationsList.length}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{t('Commercial Bids', 'प्रस्ताव')}</div>
            </div>

            <div className="p-3.5 bg-slate-800/60 rounded-lg border border-slate-800">
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-semibold uppercase tracking-wider mb-1">
                <LifeBuoy className="w-3.5 h-3.5 text-rose-400" />
                <span>{t('SLA Tickets', 'SLA टिकट')}</span>
              </div>
              <div className="text-xl font-black text-rose-400">{ticketsList.length}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{t('Active Triage', 'सक्रिय ट्राइएज')}</div>
            </div>
          </div>
        </div>

        {/* 10 Primary Tabs Navigation */}
        <div role="tablist" aria-label={t('Admin Console Sections', 'एडमिन कंसोल अनुभाग')} className="flex items-center gap-2 border-b border-slate-200 mb-6 overflow-x-auto pb-1 scrollbar-thin">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'customers'}
            onClick={() => setActiveTab('customers')}
            className={`px-3.5 py-2.5 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-blue-700 ${
              activeTab === 'customers'
                ? 'border-blue-700 text-blue-700'
                : 'border-transparent text-slate-600 hover:text-slate-950'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{t('Customers & Users', 'ग्राहक एवं उपयोगकर्ता')}</span>
            <span className="text-[10px] bg-slate-200 text-slate-800 px-1.5 py-0.2 rounded-full font-bold">
              {usersList.length}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'leads'}
            onClick={() => setActiveTab('leads')}
            className={`px-3.5 py-2.5 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-blue-700 ${
              activeTab === 'leads'
                ? 'border-blue-700 text-blue-700'
                : 'border-transparent text-slate-600 hover:text-slate-950'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>{t('Inbound Leads', 'इनबाउंड लीड्स')}</span>
            <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-full font-bold">
              {leads.length}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'projects'}
            onClick={() => setActiveTab('projects')}
            className={`px-3.5 py-2.5 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-blue-700 ${
              activeTab === 'projects'
                ? 'border-blue-700 text-blue-700'
                : 'border-transparent text-slate-600 hover:text-slate-950'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>{t('Client Projects', 'क्लाइंट प्रोजेक्ट्स')}</span>
            <span className="text-[10px] bg-slate-200 text-slate-800 px-1.5 py-0.2 rounded-full font-bold">
              {projectsList.length}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'services'}
            onClick={() => setActiveTab('services')}
            className={`px-3.5 py-2.5 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-blue-700 ${
              activeTab === 'services'
                ? 'border-blue-700 text-blue-700'
                : 'border-transparent text-slate-600 hover:text-slate-950'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>{t('Service Catalog', 'सेवा कैटलॉग')}</span>
            <span className="text-[10px] bg-slate-200 text-slate-800 px-1.5 py-0.2 rounded-full font-bold">
              {servicesList.length}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'portfolio'}
            onClick={() => setActiveTab('portfolio')}
            className={`px-3.5 py-2.5 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-blue-700 ${
              activeTab === 'portfolio'
                ? 'border-blue-700 text-blue-700'
                : 'border-transparent text-slate-600 hover:text-slate-950'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>{t('Android Apps', 'एंड्रॉइड पोर्टफोलियो')}</span>
            <span className="text-[10px] bg-slate-200 text-slate-800 px-1.5 py-0.2 rounded-full font-bold">
              {apps.length}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'quotations'}
            onClick={() => setActiveTab('quotations')}
            className={`px-3.5 py-2.5 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-blue-700 ${
              activeTab === 'quotations'
                ? 'border-blue-700 text-blue-700'
                : 'border-transparent text-slate-600 hover:text-slate-950'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{t('Quotations', 'प्रस्ताव एवं कोटेशन')}</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold tabular-nums">
              {quotationsList.length}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'billing'}
            onClick={() => setActiveTab('billing')}
            className={`px-3.5 py-2.5 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-blue-700 ${
              activeTab === 'billing'
                ? 'border-blue-700 text-blue-700'
                : 'border-transparent text-slate-600 hover:text-slate-950'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>{t('GST Billing & Invoices', 'GST बिलिंग एवं चालान')}</span>
            <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-bold tabular-nums">
              {invoicesList.length}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'support'}
            onClick={() => setActiveTab('support')}
            className={`px-3.5 py-2.5 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-blue-700 ${
              activeTab === 'support'
                ? 'border-blue-700 text-blue-700'
                : 'border-transparent text-slate-600 hover:text-slate-950'
            }`}
          >
            <LifeBuoy className="w-4 h-4" />
            <span>{t('Support & SLA', 'SLA सहायता एवं ट्राइएज')}</span>
            <span className="text-[10px] bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded-full font-bold">
              {ticketsList.length}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'content'}
            onClick={() => setActiveTab('content')}
            className={`px-3.5 py-2.5 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-blue-700 ${
              activeTab === 'content'
                ? 'border-blue-700 text-blue-700'
                : 'border-transparent text-slate-600 hover:text-slate-950'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>{t('Content & Site', 'कंटेंट एवं सेटिंग्स')}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'telemetry'}
            onClick={() => setActiveTab('telemetry')}
            className={`px-3.5 py-2.5 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-blue-700 ${
              activeTab === 'telemetry'
                ? 'border-blue-700 text-blue-700'
                : 'border-transparent text-slate-600 hover:text-slate-950'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>{t('Telemetry & Audit', 'टेलीमेट्री एवं ऑडिट')}</span>
          </button>
        </div>

        {/* =====================================================================
           TAB 1: CUSTOMERS & USER MANAGEMENT
           ===================================================================== */}
        {activeTab === 'customers' && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-950">
                  {t('Enterprise Customer & User Management', 'एंटरप्राइज ग्राहक एवं उपयोगकर्ता प्रबंधन')}
                </h3>
                <p className="text-xs text-slate-500">
                  {t(
                    'Manage client corporate accounts, RBAC privileges, and enterprise tenant access.',
                    'क्लाइंट कॉर्पोरेट खाते, आरबीएसी (RBAC) अनुमतियां और टेनेंट क्रेडेंशियल प्रबंधित करें।'
                  )}
                </p>
              </div>

              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                <div className="relative max-w-xs w-full">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={t('Search users...', 'उपयोगकर्ता खोजें...')}
                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-md bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-700"
                  />
                </div>
                <button
                  onClick={() => {
                    setEditingCustomer(null);
                    setCustomerModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t('Add Client', 'ग्राहक जोड़ें')}</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider bg-slate-50/50">
                    <th className="py-3 px-4">{t('User & Email', 'उपयोगकर्ता एवं ईमेल')}</th>
                    <th className="py-3 px-4">{t('Company / Organization', 'कंपनी / संगठन')}</th>
                    <th className="py-3 px-4">{t('Assigned Role', 'नियुक्त भूमिका')}</th>
                    <th className="py-3 px-4">{t('Last Activity', 'अंतिम सक्रियता')}</th>
                    <th className="py-3 px-4 text-right">{t('Role Elevation', 'भूमिका नियंत्रण')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((user) => {
                    const isOwnerRow = user.role === 'owner' || user.isOwner === true;
                    const nonOwnerRole =
                      user.role === 'architect' || user.role === 'manager' ? user.role : 'client';
                    return (
                      <tr key={user.uid} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{user.displayName || 'Enterprise User'}</div>
                          <div className="text-[11px] font-mono text-slate-500">{user.email}</div>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-700">
                          {isOwnerRow
                            ? user.companyName || t('Owner', 'मालिक')
                            : user.companyName || t('Independent Client', 'स्वतंत्र ग्राहक')}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                              isOwnerRow
                                ? 'bg-amber-50 text-amber-800 border-amber-300'
                                : user.role === 'admin'
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : user.role === 'architect'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : user.role === 'manager'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {isOwnerRow
                              ? t('OWNER', 'मालिक / सुपर एडमिन')
                              : user.role || 'client'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                          {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Recently active'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isOwnerRow ? (
                              <select
                                value="owner"
                                disabled
                                aria-label={t('Owner role locked', 'मालिक भूमिका लॉक है')}
                                className="text-[11px] font-medium border border-slate-200 rounded px-2 py-1 bg-slate-100 text-slate-500 cursor-not-allowed opacity-70"
                              >
                                <option value="owner">{t('OWNER', 'मालिक / सुपर एडमिन')}</option>
                              </select>
                            ) : (
                              <select
                                value={nonOwnerRole}
                                onChange={(e) =>
                                  handleRoleChange(
                                    user.uid,
                                    e.target.value as 'client' | 'architect' | 'manager'
                                  )
                                }
                                className="text-[11px] font-medium border border-slate-200 rounded px-2 py-1 bg-white focus:outline-none focus:border-blue-700 cursor-pointer"
                              >
                                <option value="client">Client</option>
                                <option value="architect">Architect</option>
                                <option value="manager">Manager</option>
                              </select>
                            )}
                            <button
                              type="button"
                              disabled={isOwnerRow}
                              onClick={() => {
                                if (isOwnerRow) return;
                                setEditingCustomer(user);
                                setCustomerModalOpen(true);
                              }}
                              className={`p-1.5 rounded transition-colors ${
                                isOwnerRow
                                  ? 'text-slate-300 cursor-not-allowed opacity-50'
                                  : 'text-slate-600 hover:text-blue-700 hover:bg-blue-50 cursor-pointer'
                              }`}
                              title={
                                isOwnerRow
                                  ? t('Owner account cannot be edited', 'मालिक खाता संपादित नहीं किया जा सकता')
                                  : t('Edit Client Record', 'ग्राहक विवरण संपादित करें')
                              }
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =====================================================================
           TAB 2: INBOUND LEADS
           ===================================================================== */}
        {activeTab === 'leads' && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-950">{t('Inbound Enterprise Leads Pipeline', 'इनबाउंड लीड्स पाइपलाइन')}</h3>
                <p className="text-xs text-slate-500">
                  {t('Direct consultation inquiries submitted through the platform.', 'प्लेटफ़ॉर्म से प्राप्त सीधी व्यावसायिक पूछताछ।')}
                </p>
              </div>

              <div className="text-xs font-mono text-slate-500">
                {t('Active Inquiries:', 'सक्रिय पूछताछ:')} {leads.length}
              </div>
            </div>

            <div className="space-y-3">
              {leads.map((lead) => (
                <div
                  key={lead.id}
                  className="p-5 rounded-lg border border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-950">{lead.name}</span>
                      <span className="text-xs text-slate-500 font-medium">({lead.company})</span>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                          lead.status === 'New'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : lead.status === 'Contacted'
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : lead.status === 'In Discussion'
                            ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}
                      >
                        {language === 'hi' ? lead.statusHi : lead.status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 flex flex-wrap gap-x-4 gap-y-1">
                      <span><strong>{t('Service:', 'सेवा:')}</strong> {formatQuotationService(lead.service, language)}</span>
                      <span><strong>{t('Budget:', 'बजट:')}</strong> {formatQuotationBudget(lead.budget, language)}</span>
                      <span><strong>{t('Date:', 'दिनांक:')}</strong> {formatDate(lead.receivedDate)}</span>
                      <span><strong>{t('Email:', 'ईमेल:')}</strong> {lead.email}</span>
                      <span><strong>{t('Phone:', 'फ़ोन:')}</strong> {lead.phone}</span>
                    </div>

                    <p className="text-xs text-slate-600 italic bg-white p-2 rounded border border-slate-100">
                      &quot;{lead.notes}&quot;
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleToggleLeadStatus(lead.id)}
                      className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md transition-colors cursor-pointer"
                    >
                      {dict.adminDashboard.markContacted}
                    </button>
                    <button
                      onClick={() => handleConvertLeadToQuote(lead)}
                      className="px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-md transition-colors cursor-pointer"
                    >
                      {t('Convert to Quote', 'कोटेशन बनाएं')}
                    </button>
                    <a
                      href={`mailto:${lead.email}?subject=Consultation Follow-up - BHANU RAM BARIHA DIGITAL TECHNOLOGIES`}
                      className="px-3 py-1.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-md transition-colors"
                    >
                      {t('Send Brief', 'संक्षिप्त उत्तर भेजें')}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =====================================================================
           TAB 3: CLIENT PROJECTS & SPRINTS
           ===================================================================== */}
        {activeTab === 'projects' && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-950">
                  {t('Enterprise Software Client Engagements', 'एंटरप्राइज सॉफ्टवेयर प्रोजेक्ट्स एवं अनुबंध')}
                </h3>
                <p className="text-xs text-slate-500">
                  {t('Track development sprints, milestone deliverables, and architectural SLA health.', 'स्प्रिंट्स, माइलस्टोन प्रगति और एसएलए (SLA) स्वास्थ्य ट्रैक करें।')}
                </p>
              </div>

              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                <div className="relative max-w-xs w-full">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={t('Search projects...', 'प्रोजेक्ट खोजें...')}
                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-md bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-700"
                  />
                </div>
                <button
                  onClick={() => {
                    setEditingProject(null);
                    setProjectModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t('New Project', 'नया प्रोजेक्ट')}</span>
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {filteredProjects.map((proj) => (
                <div
                  key={proj.id}
                  className="p-5 rounded-lg border border-slate-200 bg-white hover:border-blue-300 transition-colors space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                          {proj.code}
                        </span>
                        <h4 className="text-sm font-bold text-slate-950">
                          {language === 'hi' && proj.nameHi ? proj.nameHi : proj.name}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        <strong>{t('Client:', 'क्लाइंट:')}</strong> {proj.clientName} ({proj.clientEmail})
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setEditingProject(proj);
                          setProjectModalOpen(true);
                        }}
                        className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                        title={t('Edit Project', 'प्रोजेक्ट संपादित करें')}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProject(proj.id, proj.name)}
                        className="p-1.5 text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                        title={t('Delete Project', 'प्रोजेक्ट हटाएं')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar & Velocity */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-600 font-medium">
                        {language === 'hi' && proj.sprintHi ? proj.sprintHi : proj.sprint}
                      </span>
                      <span className="font-bold font-mono text-blue-700">{proj.completion}% Completed</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-700 rounded-full transition-all"
                        style={{ width: `${proj.completion}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">{t('Lead Architect:', 'प्रमुख वास्तुकार:')}</span>
                      <span className="font-semibold text-slate-800">{proj.leadArchitect}</span>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {(proj.techStack || proj.stack || []).map((t: string) => (
                        <span key={t} className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =====================================================================
           TAB 4: SERVICE CATALOG
           ===================================================================== */}
        {activeTab === 'services' && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-950">
                  {t('Corporate Technology Services Catalog', 'कॉर्पोरेट प्रौद्योगिकी सेवा कैटलॉग')}
                </h3>
                <p className="text-xs text-slate-500">
                  {t(
                    'Configure public service offerings, engineering deliverables, and performance SLAs.',
                    'सार्वजनिक प्रौद्योगिकी सेवाएं, डिलीवरेबल्स और परफॉर्मेंस SLA कॉन्फ़िगर करें।'
                  )}
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingService(null);
                  setServiceModalOpen(true);
                }}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('Add Service', 'नई सेवा जोड़ें')}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredServices.map((svc) => (
                <div
                  key={svc.id}
                  className="p-5 rounded-lg border border-slate-200 bg-white hover:border-blue-300 transition-colors space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {svc.number}
                      </span>
                      <div>
                        <h4 className="text-sm font-bold text-slate-950">
                          {language === 'hi' && svc.titleHi ? svc.titleHi : svc.title}
                        </h4>
                        <span className="text-[11px] font-medium text-blue-700">
                          {language === 'hi' && svc.categoryHi ? svc.categoryHi : svc.category}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingService(svc);
                          setServiceModalOpen(true);
                        }}
                        className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                        title={t('Edit Service', 'सेवा संपादित करें')}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteService(svc.id, svc.title)}
                        className="p-1.5 text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                        title={t('Delete Service', 'सेवा हटाएं')}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2">
                    {language === 'hi' && svc.shortDescHi ? svc.shortDescHi : svc.shortDesc}
                  </p>

                  <div className="text-xs space-y-1 pt-1">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                      {t('Key Deliverables', 'मुख्य डिलीवरेबल्स')}
                    </span>
                    <ul className="list-disc pl-4 space-y-0.5 text-slate-700 text-xs">
                      {(svc.deliverables || []).slice(0, 2).map((del, i) => (
                        <li key={i}>{del}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                    <span className="font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">
                      {svc.metric} ({svc.metricLabel})
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {(svc.techStack || []).slice(0, 3).map((tech) => (
                        <span key={tech} className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-100 rounded text-slate-600">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =====================================================================
           TAB 5: ANDROID APPS PORTFOLIO MANAGEMENT
           ===================================================================== */}
        {activeTab === 'portfolio' && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="relative max-w-sm w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={dict.common.search}
                  className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-md bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-700"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setEditingApp(null);
                    setAppModalOpen(true);
                  }}
                  className="px-3.5 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-md transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{dict.adminDashboard.addNewApp}</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase tracking-wider bg-slate-50/50">
                    <th className="py-3 px-4">{t('App Identifier & Name', 'ऐप पहचान एवं नाम')}</th>
                    <th className="py-3 px-4">{t('Category', 'श्रेणी')}</th>
                    <th className="py-3 px-4">{t('Architecture', 'आर्किटेक्चर')}</th>
                    <th className="py-3 px-4">{t('Version', 'संस्करण')}</th>
                    <th className="py-3 px-4">{t('Release Channel', 'रिलीज चैनल')}</th>
                    <th className="py-3 px-4 text-right">{t('Actions', 'क्रियाएं')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredApps.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-950">
                          {language === 'hi' ? app.nameHi : app.name}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500">
                          {app.id}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        {language === 'hi' ? app.categoryHi : app.category}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">
                        {app.architecture}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">
                        {app.version}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          {language === 'hi' ? app.statusLabelHi : app.statusLabelEn}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => navigate('app-detail', { id: app.id })}
                            className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                            title={t('View Public Page', 'सार्वजनिक पेज देखें')}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingApp(app);
                              setAppModalOpen(true);
                            }}
                            className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                            title={dict.adminDashboard.editApp}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setPendingDelete({ type: 'app', id: app.id, label: app.name })}
                            className="p-1.5 text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                            title={dict.adminDashboard.deleteApp}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =====================================================================
           TAB 6: COMMERCIAL QUOTATIONS & PROPOSALS
           ===================================================================== */}
        {activeTab === 'quotations' && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-950">
                  {t('Commercial Scoping Proposals & Quotations', 'व्यावसायिक प्रस्ताव एवं कोटेशन')}
                </h3>
                <p className="text-xs text-slate-500">
                  {t('Manage technical bids, contract values, and client budget proposals.', 'तकनीकी बोलियां, अनुबंध मूल्य और बजट प्रस्ताव प्रबंधित करें।')}
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingQuotation(null);
                  setQuotationModalOpen(true);
                }}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('New Quotation', 'नया कोटेशन')}</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider bg-slate-50/50">
                    <th className="py-3 px-4">{t('Quote Ref & Client', 'कोटेशन संदर्भ एवं ग्राहक')}</th>
                    <th className="py-3 px-4">{t('Company', 'कंपनी')}</th>
                    <th className="py-3 px-4">{t('Service Scope', 'सेवा दायरा')}</th>
                    <th className="py-3 px-4">{t('Estimated Value', 'अनुमानित मूल्य')}</th>
                    <th className="py-3 px-4">{t('Status', 'स्थिति')}</th>
                    <th className="py-3 px-4 text-right">{t('Actions', 'क्रियाएं')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredQuotes.map((q) => (
                    <tr key={q.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{q.clientName}</div>
                        <div className="text-[11px] font-mono text-slate-500">{q.id} · {q.clientEmail}</div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700">{q.company || '-'}</td>
                      <td className="py-3.5 px-4 text-slate-700">
                        <div className="font-medium text-slate-800">{formatQuotationService(q.serviceType, language)}</div>
                        {(q.attachedFileName || q.attachment?.fileName) && (
                          <div className="pt-1">
                            <button
                              type="button"
                              onClick={() =>
                                handleAdminDownloadAttachment(
                                  q.attachedFileUrl || q.attachment?.fileUrl || q.attachment?.downloadUrl,
                                  q.attachedFileName || q.attachment?.fileName
                                )
                              }
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded hover:bg-blue-100 transition-colors cursor-pointer"
                            >
                              <Paperclip className="w-3 h-3" />
                              <span className="truncate max-w-[130px]">{q.attachedFileName || q.attachment?.fileName}</span>
                              <Download className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-blue-700">
                        {formatQuotationBudget(q.estimatedBudget, language)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                            q.status === 'approved' || q.status === 'accepted'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : q.status === 'under_review' || q.status === 'reviewed'
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : q.status === 'rejected'
                              ? 'bg-rose-50 text-rose-800 border-rose-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {q.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {q.status !== 'approved' && q.status !== 'accepted' && (
                            <button
                              onClick={() => handleQuickQuotationStatus(q.id, 'approved')}
                              className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                              title={t('Approve Quotation', 'कोटेशन स्वीकृत करें')}
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {q.status !== 'rejected' && (
                            <button
                              onClick={() => handleQuickQuotationStatus(q.id, 'rejected')}
                              className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded transition-colors cursor-pointer"
                              title={t('Reject Quotation', 'कोटेशन अस्वीकार करें')}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setEditingQuotation(q);
                              setQuotationModalOpen(true);
                            }}
                            className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                            title={t('Edit Quotation', 'कोटेशन संपादित करें')}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteQuotation(q.id)}
                            className="p-1.5 text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                            title={t('Delete Quotation', 'कोटेशन हटाएं')}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =====================================================================
           TAB 6B: GST BILLING & TAX INVOICE LEDGER
           ===================================================================== */}
        {activeTab === 'billing' && (
          <div className="space-y-6">
            {/* Revenue & Tax Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  {t('Total Billed Value (Incl. 18% GST)', 'कुल बिल राशि (18% GST सहित)')}
                </div>
                <div className="mt-1.5 text-2xl font-black font-mono text-slate-950 tabular-nums">
                  ₹{invoicesList.reduce((acc, inv) => acc + (inv.totalAmount || 0), 0).toLocaleString('en-IN')}
                </div>
                <div className="mt-1 text-[11px] text-slate-500 font-mono">
                  HSN/SAC 998313 · {invoicesList.length} {t('Invoices', 'चालान')}
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                  {t('Verified Escrow Settled', 'सत्यापित भुगतान प्राप्त')}
                </div>
                <div className="mt-1.5 text-2xl font-black font-mono text-emerald-700 tabular-nums">
                  ₹
                  {invoicesList
                    .filter((i) => i.status === 'paid')
                    .reduce((acc, inv) => acc + (inv.totalAmount || 0), 0)
                    .toLocaleString('en-IN')}
                </div>
                <div className="mt-1 text-[11px] text-slate-500">
                  {t('HMAC-SHA256 Server Verified', 'HMAC-SHA256 सर्वर सत्यापित')}
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                <div className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                  {t('Outstanding Receivables', 'बकाया प्राप्य राशि')}
                </div>
                <div className="mt-1.5 text-2xl font-black font-mono text-amber-700 tabular-nums">
                  ₹
                  {invoicesList
                    .filter((i) => i.status !== 'paid' && i.status !== 'cancelled')
                    .reduce((acc, inv) => acc + (inv.totalAmount || 0), 0)
                    .toLocaleString('en-IN')}
                </div>
                <div className="mt-1 text-[11px] text-slate-500">
                  {t('Awaiting Client Settlement', 'ग्राहक भुगतान प्रतीक्षित')}
                </div>
              </div>
            </div>

            {/* Issue GST Invoice Form */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-950 flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-blue-700" />
                    <span>{t('Issue Authoritative GST Tax Invoice', 'आधिकारिक GST कर चालान जारी करें')}</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    {t(
                      'Server automatically computes 18% IGST/CGST+SGST, assigns HSN/SAC 998313, and commits cryptographic verification hash.',
                      'सर्वर स्वतः 18% GST और HSN/SAC 998313 की गणना करता है और सत्यापन हैश दर्ज करता है।'
                    )}
                  </p>
                </div>
                <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  POST /api/invoices/generate
                </span>
              </div>

              <form onSubmit={handleGenerateInvoice} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    {t('Select Registered Client (Auto-Fills UID & Email)', 'पंजीकृत ग्राहक चुनें (UID स्वतः भरें)')}
                  </label>
                  <select
                    value={invoiceForm.clientId}
                    onChange={(e) => {
                      const selectedUid = e.target.value;
                      const matched = usersList.find((u) => u.uid === selectedUid);
                      if (matched) {
                        setInvoiceForm((prev) => ({
                          ...prev,
                          clientId: matched.uid,
                          clientName: matched.displayName || prev.clientName,
                          clientEmail: matched.email || prev.clientEmail,
                          clientCompany: matched.companyName || prev.clientCompany,
                        }));
                      } else {
                        setInvoiceForm((prev) => ({ ...prev, clientId: selectedUid }));
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white focus:border-blue-700 focus:outline-none"
                  >
                    <option value="">{t('-- Select Client Account or Enter Manually Below --', '-- ग्राहक खाता चुनें या नीचे विवरण दर्ज करें --')}</option>
                    {usersList.map((u) => (
                      <option key={u.uid} value={u.uid}>
                        {u.displayName || 'User'} ({u.email}) — {u.uid.slice(0, 8)}...
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    {t('Target Client Firebase UID (Optional / Resolved via Email)', 'ग्राहक Firebase UID (वैकल्पिक)')}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Firebase Auth UID"
                    value={invoiceForm.clientId}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, clientId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:border-blue-700 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{t('Client Name', 'ग्राहक का नाम')}</label>
                  <input
                    type="text"
                    required
                    value={invoiceForm.clientName}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, clientName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:border-blue-700 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{t('Client Email', 'ग्राहक ईमेल')}</label>
                  <input
                    type="email"
                    required
                    value={invoiceForm.clientEmail}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, clientEmail: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:border-blue-700 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{t('Client Organization', 'संस्था का नाम')}</label>
                  <input
                    type="text"
                    required
                    value={invoiceForm.clientCompany}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, clientCompany: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:border-blue-700 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{t('Client GSTIN', 'ग्राहक GSTIN')}</label>
                  <input
                    type="text"
                    value={invoiceForm.clientGstin}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, clientGstin: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:border-blue-700 focus:outline-none font-mono"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">{t('Project Engagement', 'प्रोजेक्ट नाम')}</label>
                  <input
                    type="text"
                    required
                    value={invoiceForm.projectName}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, projectName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:border-blue-700 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{t('Milestone Deliverable', 'माइलस्टोन विवरण')}</label>
                  <input
                    type="text"
                    required
                    value={invoiceForm.milestoneTitle}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, milestoneTitle: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:border-blue-700 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{t('Base Amount (INR, Excl. GST)', 'मूल राशि (INR)')}</label>
                  <input
                    type="number"
                    min={100}
                    required
                    value={invoiceForm.subtotal}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, subtotal: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:border-blue-700 focus:outline-none font-mono tabular-nums"
                  />
                </div>

                <div className="sm:col-span-2 lg:col-span-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
                  <div className="text-xs text-slate-600 font-mono tabular-nums">
                    {t('Calculated Preview:', 'अनुमानित गणना:')} ₹{Number(invoiceForm.subtotal || 0).toLocaleString('en-IN')} + 18% GST (₹
                    {Math.round(Number(invoiceForm.subtotal || 0) * 0.18).toLocaleString('en-IN')}) ={' '}
                    <strong className="text-slate-950">
                      ₹{Math.round(Number(invoiceForm.subtotal || 0) * 1.18).toLocaleString('en-IN')}
                    </strong>
                  </div>
                  <button
                    type="submit"
                    disabled={creatingInvoice}
                    className="px-4 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-50 rounded-md transition-colors cursor-pointer inline-flex items-center gap-1.5 self-start sm:self-auto"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{creatingInvoice ? t('Issuing Invoice...', 'चालान जारी हो रहा है...') : t('Issue Official GST Invoice', 'आधिकारिक GST चालान जारी करें')}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Invoices Registry Table */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-950">
                  {t('Enterprise GST Tax Invoice Ledger', 'एंटरप्राइज GST कर चालान बहीखाता')}
                </h3>
                {loadingInvoices && (
                  <span className="text-xs text-slate-500 font-mono">{t('Syncing ledger...', 'सिंक हो रहा है...')}</span>
                )}
              </div>

              {serverHealth?.storage?.ephemeralDiskWarning && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <span>{serverHealth.storage.ephemeralDiskWarning}</span>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-3">{t('Invoice #', 'चालान #')}</th>
                      <th className="py-3 px-3">{t('Client & GSTIN', 'ग्राहक एवं GSTIN')}</th>
                      <th className="py-3 px-3">{t('Project / Milestone', 'प्रोजेक्ट / माइलस्टोन')}</th>
                      <th className="py-3 px-3 text-right">{t('Total (Incl. 18% GST)', 'कुल राशि (GST सहित)')}</th>
                      <th className="py-3 px-3">{t('Status & Settlement', 'स्थिति एवं निपटान')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoicesList.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                          <div>{inv.invoiceNumber}</div>
                          <div className="text-[10px] font-normal text-slate-500">{formatDate(inv.issuedAt)}</div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900">{inv.clientCompany}</div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {inv.clientEmail} · {inv.clientGstin || 'N/A'}
                          </div>
                        </td>
                        <td className="py-3 px-3 max-w-xs">
                          <div className="font-semibold text-slate-800 truncate">{inv.projectName}</div>
                          <div className="text-[11px] text-slate-500 truncate">{inv.milestoneTitle}</div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums whitespace-nowrap">
                          <div className="font-black text-slate-950">₹{inv.totalAmount.toLocaleString('en-IN')}</div>
                          <div className="text-[10px] text-slate-500">
                            Base ₹{inv.subtotal.toLocaleString('en-IN')} + ₹{inv.gstAmount.toLocaleString('en-IN')} GST
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                              inv.status === 'paid'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}
                          >
                            {inv.status}
                          </span>
                          {inv.paymentTxnId && (
                            <div className="text-[10px] font-mono text-slate-500 mt-1">{inv.paymentTxnId}</div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
           TAB 7: SLA SUPPORT TICKETS & ARCHITECT TRIAGE
           ===================================================================== */}
        {activeTab === 'support' && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-950 flex items-center gap-2">
                  <LifeBuoy className="w-5 h-5 text-blue-700" />
                  <span>{t('SLA Support Tickets & Architect Triage Console', 'SLA सहायता टिकट एवं आर्किटेक्ट ट्राइएज कंसोल')}</span>
                </h3>
                <p className="text-xs text-slate-500">
                  {t(
                    'Review inbound client incidents, verify telemetry attachments, and dispatch official architect responses.',
                    'इनबाउंड ग्राहक घटनाओं की समीक्षा करें, टेलीमेट्री संलग्नकों को सत्यापित करें और आधिकारिक आर्किटेक्ट प्रतिक्रियाएं भेजें।'
                  )}
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-700 font-bold border border-slate-200">
                  {t('SLA Scope:', 'SLA नीति:')} SOW Scoped
                </span>
                <span className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                  {t('MTTR:', 'समाधान समय:')} &lt; 18 min
                </span>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="relative max-w-sm w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={ticketSearchTerm}
                  onChange={(e) => setTicketSearchTerm(e.target.value)}
                  placeholder={t('Search by ticket ID, subject, client email...', 'टिकट ID, विषय, क्लाइंट ईमेल द्वारा खोजें...')}
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-md bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-700"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                {/* Priority filter */}
                <select
                  value={ticketPriorityFilter}
                  onChange={(e) => setTicketPriorityFilter(e.target.value)}
                  className="px-2.5 py-1.5 border border-slate-200 rounded-md bg-white text-slate-700 font-medium focus:outline-none focus:border-blue-700"
                >
                  <option value="all">{t('All Priorities', 'सभी प्राथमिकताएं')}</option>
                  <option value="P1_Critical">P1 Critical</option>
                  <option value="P2_High">P2 High</option>
                  <option value="P3_Normal">P3 Normal</option>
                  <option value="P4_Low">P4 Low</option>
                </select>

                {/* Status filter */}
                <select
                  value={ticketStatusFilter}
                  onChange={(e) => setTicketStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 border border-slate-200 rounded-md bg-white text-slate-700 font-medium focus:outline-none focus:border-blue-700"
                >
                  <option value="all">{t('All Statuses', 'सभी स्थितियां')}</option>
                  <option value="open">{t('Open', 'सक्रिय')}</option>
                  <option value="in_progress">{t('In Progress', 'प्रगति पर')}</option>
                  <option value="resolved">{t('Resolved', 'हल')}</option>
                </select>
              </div>
            </div>

            {/* Tickets List */}
            <div className="space-y-4">
              {filteredTicketsAdmin.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  {t('No support tickets found matching current filters.', 'वर्तमान फ़िल्टर से मेल खाते कोई सहायता टिकट नहीं मिले।')}
                </div>
              ) : (
                filteredTicketsAdmin.map((ticket) => {
                  const isReplying = activeTicketIdForReply === ticket.id;
                  const responses = ticket.responses || [];
                  const attachment = ticket.attachment;

                  return (
                    <div
                      key={ticket.id}
                      className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden transition-all hover:border-slate-300"
                    >
                      {/* Ticket Summary Header */}
                      <div className="p-4 sm:p-5 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                              {ticket.id}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border ${
                                ticket.priority === 'P1_Critical'
                                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                                  : ticket.priority === 'P2_High'
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : 'bg-blue-50 text-blue-800 border-blue-200'
                              }`}
                            >
                              {ticket.priority ? ticket.priority.replace('_', ' ') : 'P3 NORMAL'}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                ticket.status === 'resolved'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : ticket.status === 'in_progress'
                                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                                  : 'bg-amber-50 text-amber-800 border-amber-200'
                              }`}
                            >
                              {ticket.status === 'resolved'
                                ? t('Resolved', 'हल')
                                : ticket.status === 'in_progress'
                                ? t('In Progress / Triage', 'सक्रिय विश्लेषण')
                                : t('Open', 'सक्रिय')}
                            </span>
                            {ticket.category && (
                              <span className="text-[10px] font-medium text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                                {ticket.category}
                              </span>
                            )}
                            {ticket.projectCode && (
                              <span className="text-[10px] font-mono text-slate-500">
                                {ticket.projectCode}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                handleAdminChangeTicketStatus(
                                  ticket.id,
                                  ticket.status === 'resolved' ? 'open' : 'resolved'
                                )
                              }
                              className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 transition-colors cursor-pointer"
                            >
                              {ticket.status === 'resolved' ? t('Re-open', 'पुनः खोलें') : t('Mark Resolved', 'हल चिह्नित करें')}
                            </button>
                            <button
                              onClick={() =>
                                setActiveTicketIdForReply(isReplying ? null : ticket.id)
                              }
                              className="px-3 py-1 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded transition-colors cursor-pointer flex items-center gap-1.5"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>{isReplying ? t('Close Console', 'कंसोल बंद करें') : t('Triage & Reply', 'ट्राइएज एवं जवाब')}</span>
                            </button>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-bold text-slate-950">
                            {ticket.subject}
                          </h4>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed whitespace-pre-wrap">
                            {ticket.details}
                          </p>
                        </div>

                        {/* Attachment display if present */}
                        {attachment && (attachment.fileName || attachment.downloadUrl || attachment.fileUrl) && (
                          <div className="mt-2 p-2.5 rounded-lg bg-blue-50/50 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded bg-blue-100 border border-blue-200 flex items-center justify-center shrink-0 text-blue-700">
                                <Paperclip className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-slate-900 truncate">
                                  {attachment.fileName || t('Attached Specification / Log File', 'संलग्न विनिर्देश / लॉग फाइल')}
                                </div>
                                <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                                  {attachment.fileSizeFormatted && <span>{attachment.fileSizeFormatted}</span>}
                                  {attachment.sha256 && (
                                    <span className="flex items-center gap-1 text-emerald-700 font-bold" title={`Full SHA-256: ${attachment.sha256}`}>
                                      <ShieldCheck className="w-3 h-3" />
                                      <span>SHA: {attachment.sha256.substring(0, 10)}...</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {(attachment.downloadUrl || attachment.fileUrl) && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleAdminDownloadAttachment(
                                    attachment.downloadUrl || attachment.fileUrl,
                                    attachment.fileName
                                  )
                                }
                                className="px-3 py-1.5 text-xs font-bold text-blue-700 bg-white hover:bg-blue-50 border border-blue-300 rounded transition-colors inline-flex items-center gap-1.5 shrink-0 self-start sm:self-auto cursor-pointer"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>{t('Download Attached Diagnostic', 'संलग्न डायग्नोस्टिक डाउनलोड करें')}</span>
                              </button>
                            )}
                          </div>
                        )}

                        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600 font-mono pt-1 border-t border-slate-100">
                          <div>
                            {t('Client:', 'क्लाइंट:')}{' '}
                            <span className="text-slate-700 font-bold">{ticket.clientEmail || 'enterprise-client'}</span>
                            {ticket.environment && ` · Env: ${ticket.environment}`}
                          </div>
                          <div>
                            {t('Logged:', 'दिनांक:')} {formatDate(ticket.createdAt)}
                          </div>
                        </div>
                      </div>

                      {/* Replying and Conversation Console */}
                      {isReplying && (
                        <div className="border-t border-slate-200 bg-slate-50/80 p-4 sm:p-5 space-y-4">
                          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                              <MessageSquare className="w-3.5 h-3.5 text-blue-700" />
                              <span>{t('Consultation Thread & Architect Log', 'परामर्श वार्ता एवं आर्किटेक्ट लॉग')}</span>
                            </span>
                            <span className="text-[11px] text-slate-500 font-mono">
                              {responses.length} {t('responses on record', 'उत्तर दर्ज')}
                            </span>
                          </div>

                          {/* Existing Responses */}
                          {responses.length === 0 ? (
                            <div className="p-3 rounded-lg bg-white border border-slate-200 text-xs text-slate-500 italic">
                              {t('No prior responses. Submit the first response below.', 'कोई पूर्व उत्तर नहीं। नीचे पहला जवाब दर्ज करें।')}
                            </div>
                          ) : (
                            <div className="space-y-2.5">
                              {responses.map((resp: any, idx: number) => {
                                const isArchitect = (resp.role || resp.authorRole) !== 'client';
                                return (
                                  <div
                                    key={resp.id || idx}
                                    className={`p-3.5 rounded-lg border text-xs space-y-1.5 ${
                                      isArchitect
                                        ? 'bg-blue-50/70 border-blue-200/80 ml-2 sm:ml-4'
                                        : 'bg-white border-slate-200 mr-2 sm:mr-4'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-1.5">
                                        <span className="font-bold text-slate-900">{resp.authorName || resp.author}</span>
                                        <span
                                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                                            isArchitect
                                              ? 'bg-blue-100 text-blue-800 border-blue-200'
                                              : 'bg-slate-100 text-slate-700 border-slate-200'
                                          }`}
                                        >
                                          {isArchitect
                                            ? t('Lead Platform Architect', 'प्रधान वास्तुकार')
                                            : t('Enterprise Client', 'एंटरप्राइज क्लाइंट')}
                                        </span>
                                      </div>
                                      <span className="text-[11px] font-mono text-slate-600">
                                        {formatDate(resp.timestamp)}
                                      </span>
                                    </div>
                                    <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                                      {resp.message}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Architect Quick Response Templates */}
                          <div className="space-y-1.5">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                              {t('Architect Quick Templates:', 'आर्किटेक्ट त्वरित प्रतिक्रिया टेम्पलेट्स:')}
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {[
                                'Telemetry logs analyzed on Sambalpur cluster. P99 latency within 28ms baseline.',
                                'Hotfix verified and released to Google Play Internal Track for testing.',
                                'NPCI webhook payload validated. Cryptographic verification passed without discrepancies.',
                                'Disaster recovery RPO/RTO validated. Failover simulation completed successfully.',
                              ].map((template) => (
                                <button
                                  key={template}
                                  type="button"
                                  onClick={() =>
                                    setAdminReplyTexts((prev) => ({ ...prev, [ticket.id]: template }))
                                  }
                                  className="text-[11px] text-slate-600 bg-white hover:bg-blue-50 hover:text-blue-700 border border-slate-200 rounded px-2.5 py-1 text-left transition-colors cursor-pointer"
                                >
                                  {template.substring(0, 50)}...
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Reply Box */}
                          <div className="bg-white border border-slate-200 rounded-lg p-3.5 space-y-3">
                            <label className="block text-xs font-bold text-slate-800">
                              {t('Official Lead Architect Reply & Client Dispatch', 'आधिकारिक मुख्य वास्तुकार उत्तर एवं प्रेषण')}
                            </label>
                            <textarea
                              rows={3}
                              value={adminReplyTexts[ticket.id] || ''}
                              onChange={(e) =>
                                setAdminReplyTexts((prev) => ({ ...prev, [ticket.id]: e.target.value }))
                              }
                              placeholder={t(
                                'Provide root-cause analysis, mitigation patch details, or deployment timeline...',
                                'मूल-कारण विश्लेषण, सुधारात्मक पैच विवरण या परिनियोजन समयरेखा प्रदान करें...'
                              )}
                              className="w-full text-xs p-2.5 border border-slate-200 rounded-md focus:outline-none focus:border-blue-700 font-sans"
                            />

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                              <div className="flex items-center gap-2 text-xs">
                                <span className="font-semibold text-slate-600">{t('Update Status to:', 'स्थिति अपडेट:')}</span>
                                <select
                                  value={adminReplyStatuses[ticket.id] || 'in_progress'}
                                  onChange={(e) =>
                                    setAdminReplyStatuses((prev) => ({
                                      ...prev,
                                      [ticket.id]: e.target.value as any,
                                    }))
                                  }
                                  className="px-2.5 py-1 border border-slate-200 rounded bg-slate-50 text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-700"
                                >
                                  <option value="in_progress">{t('In Progress / Triage', 'सक्रिय विश्लेषण')}</option>
                                  <option value="resolved">{t('Mark Resolved', 'हल')}</option>
                                  <option value="open">{t('Open', 'सक्रिय')}</option>
                                </select>
                              </div>

                              <button
                                onClick={() => handleAdminTicketReply(ticket.id)}
                                disabled={
                                  submittingAdminReply[ticket.id] ||
                                  !(adminReplyTexts[ticket.id] || '').trim()
                                }
                                className="px-4 py-1.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 rounded transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                              >
                                {submittingAdminReply[ticket.id] ? (
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Send className="w-3.5 h-3.5" />
                                )}
                                <span>{t('Dispatch Architect Response', 'आर्किटेक्ट जवाब भेजें')}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* =====================================================================
           TAB 8: CONTENT & GLOBAL SITE SETTINGS
           ===================================================================== */}
        {activeTab === 'content' && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
              <button
                onClick={() => setContentSubTab('articles')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors cursor-pointer ${
                  contentSubTab === 'articles'
                    ? 'bg-blue-700 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {t('Technical Articles & Publications', 'तकनीकी श्वेतपत्र एवं लेख')} ({blogList.length})
              </button>
              <button
                onClick={() => setContentSubTab('settings')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors cursor-pointer ${
                  contentSubTab === 'settings'
                    ? 'bg-blue-700 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Company Settings / कंपनी सेटिंग्स
              </button>
            </div>

            {/* Sub-tab A: Blog Articles */}
            {contentSubTab === 'articles' && (
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-bold text-slate-950">
                      {t('Engineering Whitepapers & Articles', 'इंजीनियरिंग श्वेतपत्र एवं प्रकाशन')}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {t('Publish technical insights, Android system architecture, and sovereign AI whitepapers.', 'तकनीकी शोध, एंड्रॉइड आर्किटेक्चर और संप्रभु एआई लेख प्रकाशित करें।')}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setEditingBlog(null);
                      setBlogModalOpen(true);
                    }}
                    className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{t('Publish Article', 'नया लेख प्रकाशित करें')}</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {filteredBlogs.map((post) => (
                    <div
                      key={post.id}
                      className="p-5 rounded-lg border border-slate-200 bg-white hover:border-blue-300 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                            {language === 'hi' && post.categoryHi ? post.categoryHi : post.category}
                          </span>
                          <span className="text-xs text-slate-600 font-mono">
                            {language === 'hi' && post.dateHi ? post.dateHi : post.date} · {post.readTime}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-950">
                          {language === 'hi' && post.titleHi ? post.titleHi : post.title}
                        </h4>
                        <p className="text-xs text-slate-600 line-clamp-1">
                          {language === 'hi' && post.excerptHi ? post.excerptHi : post.excerpt}
                        </p>
                        <div className="text-[11px] text-slate-500">
                          <strong>{t('Author:', 'लेखक:')}</strong> {post.author} ({post.authorRole})
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => {
                            setEditingBlog(post);
                            setBlogModalOpen(true);
                          }}
                          className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                          title={t('Edit Article', 'लेख संपादित करें')}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteBlogPost(post.id, post.title)}
                          className="p-1.5 text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                          title={t('Delete Article', 'लेख हटाएं')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sub-tab B: Site Settings Form */}
            {contentSubTab === 'settings' && (
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
                <div>
                  <h3 className="text-base font-bold text-slate-950">
                    {t('Global Enterprise Platform Configuration', 'ग्लोबल एंटरप्राइज प्लेटफ़ॉर्म विन्यास')}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {t('Corporate identity, optional registration details, official communications, and operational parameters.', 'कंपनी पहचान, वैकल्पिक पंजीकरण विवरण और आधिकारिक परिचालन विवरण।')}
                  </p>
                </div>

                <form onSubmit={handleSaveSiteSettings} className="space-y-4 max-w-3xl">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {t('Company Legal Entity Name', 'कंपनी का कानूनी नाम')}
                      </label>
                      <input
                        type="text"
                        required
                        value={siteSettings.companyName}
                        onChange={(e) => setSiteSettings({ ...siteSettings, companyName: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:border-blue-700 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {t('Platform Brand Identity', 'प्लेटफ़ॉर्म ब्रांड पहचान')}
                      </label>
                      <input
                        type="text"
                        required
                        value={siteSettings.brandName}
                        onChange={(e) => setSiteSettings({ ...siteSettings, brandName: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:border-blue-700 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {t('Company Registration (Optional — hidden until filled)', 'कंपनी पंजीकरण विवरण (वैकल्पिक — भरने तक छिपा रहता है)')}
                      </label>
                      <input
                        type="text"
                        value={siteSettings.companyRegistration}
                        onChange={(e) => setSiteSettings({ ...siteSettings, companyRegistration: e.target.value })}
                        placeholder={t('Leave blank to hide on public pages', 'सार्वजनिक पृष्ठों पर छिपाने के लिए खाली छोड़ें')}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:border-blue-700 focus:outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {t('Availability Benchmark Target (SOW)', 'उपलब्धता लक्ष्य (SOW अनुसार)')}
                      </label>
                      <input
                        type="text"
                        value={siteSettings.slaTarget}
                        onChange={(e) => setSiteSettings({ ...siteSettings, slaTarget: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:border-blue-700 focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {t('Executive Contact Email', 'आधिकारिक संपर्क ईमेल')}
                      </label>
                      <input
                        type="email"
                        required
                        value={siteSettings.contactEmail}
                        onChange={(e) => setSiteSettings({ ...siteSettings, contactEmail: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:border-blue-700 focus:outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {t('Switchboard Phone Line', 'टेलीफोन संपर्क')}
                      </label>
                      <input
                        type="text"
                        value={siteSettings.contactPhone}
                        onChange={(e) => setSiteSettings({ ...siteSettings, contactPhone: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:border-blue-700 focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {t('Engineering Campus / Registered Office Address', 'इंजीनियरिंग कैंपस / पंजीकृत कार्यालय')}
                    </label>
                    <input
                      type="text"
                      value={siteSettings.headquarters}
                      onChange={(e) => setSiteSettings({ ...siteSettings, headquarters: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:border-blue-700 focus:outline-none"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={savingSettings}
                      className="px-4 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-50 rounded-md transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{savingSettings ? t('Saving...', 'सहेजा जा रहा है...') : t('Save Global Settings', 'ग्लोबल सेटिंग्स सहेजें')}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* =====================================================================
           TAB 8: SYSTEM TELEMETRY & IMMUTABLE AUDIT LOGS
           ===================================================================== */}
        {activeTab === 'telemetry' && (
          <div className="space-y-6">
            {/* Live Node.js Diagnostics */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 font-mono text-xs text-slate-300 shadow-lg space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2 text-emerald-400">
                  <Terminal className="w-4 h-4" />
                  <span className="font-bold">BHANU_RAM_BARIHA_TECH // SYSTEM_TELEMETRY_DAEMON</span>
                </div>
                <span className="text-[11px] text-slate-400">
                  HEALTH: {serverHealth?.status || 'POLLING'} · BEARER: {serverHealth?.security?.bearerTokenVerification || 'FIREBASE_RS256'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-slate-400">
                <div className="bg-slate-900/60 p-3 rounded border border-slate-800">
                  <span className="text-slate-500 block text-[10px] uppercase">Node Runtime</span>
                  <span className="text-emerald-400 font-bold tabular-nums">
                    {telemetryData?.nodeVersion || serverHealth?.deployment?.nodeVersion || 'Checking...'}
                  </span>
                </div>
                <div className="bg-slate-900/60 p-3 rounded border border-slate-800">
                  <span className="text-slate-500 block text-[10px] uppercase">Memory RSS / Heap</span>
                  <span className="text-blue-400 font-bold tabular-nums">
                    {telemetryData?.memory?.rssMb != null
                      ? `${telemetryData.memory.rssMb} MB (Heap ${telemetryData.memory.heapUsedMb} MB)`
                      : 'Checking...'}
                  </span>
                </div>
                <div className="bg-slate-900/60 p-3 rounded border border-slate-800">
                  <span className="text-slate-500 block text-[10px] uppercase">Firestore Status</span>
                  <span
                    className={`font-bold tabular-nums ${
                      serverHealth?.database?.status === 'CONNECTED' ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {serverHealth?.database?.status || 'CHECKING'} · 21 Collections
                    {serverHealth?.database?.probeLatencyMs != null ? ` (${serverHealth.database.probeLatencyMs}ms)` : ''}
                  </span>
                </div>
                <div className="bg-slate-900/60 p-3 rounded border border-slate-800">
                  <span className="text-slate-500 block text-[10px] uppercase">Security & Storage</span>
                  <span className="text-purple-400 font-bold">
                    RBAC Default Deny · {serverHealth?.security?.paymentSecretConfigured ? 'PAYMENT_SECRET SET' : 'EPHEMERAL HMAC'}
                  </span>
                </div>
              </div>

              {serverHealth?.storage?.ephemeralDiskWarning && (
                <div className="p-3 rounded bg-amber-950/50 border border-amber-800/70 text-amber-200 text-[11px] leading-relaxed">
                  <strong>[CLOUD RUN STORAGE NOTICE]</strong> {serverHealth.storage.ephemeralDiskWarning}
                </div>
              )}
            </div>

            {/* Immutable Firestore Audit Log Stream */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-950">
                    {t('Cloud Firestore Immutable Audit Trail', 'क्लाउड फायरस्टोर अपरिवर्तनीय ऑडिट ट्रेल')}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {t('Zero-trust record of all administrative actions and security mutations.', 'सभी प्रशासनिक क्रियाओं और सुरक्षा परिवर्तनों का ज़ीरो-ट्रस्ट रिकॉर्ड।')}
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-100 text-slate-700">
                  /audit_logs
                </span>
              </div>

              <div className="space-y-2">
                {auditLogs.map((log, idx) => (
                  <div
                    key={log.id || idx}
                    className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 font-bold text-[10px]">
                          {log.action}
                        </span>
                        <span className="text-slate-800 font-bold">{log.resource}</span>
                      </div>
                      <p className="text-slate-600 font-sans text-xs">{log.details}</p>
                    </div>

                    <div className="text-left sm:text-right text-[11px] text-slate-600 shrink-0">
                      <div>{log.actorEmail}</div>
                      <div>{log.timestamp ? formatDate(log.timestamp) : 'Recent'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* =======================================================================
         ADMINISTRATION MODALS
         ======================================================================= */}
      {/* 1. App Manager Modal */}
      <AdminAppManagerModal
        isOpen={appModalOpen}
        onClose={() => setAppModalOpen(false)}
        editingApp={editingApp}
      />

      {/* 2. Customer Manager Modal */}
      <CustomerManagerModal
        isOpen={customerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
        onSuccess={() => {
          fetchAllUsers().then((u) => u && setUsersList(u));
        }}
        customer={editingCustomer}
      />

      {/* 3. Project Manager Modal */}
      <ProjectManagerModal
        isOpen={projectModalOpen}
        onClose={() => setProjectModalOpen(false)}
        onSuccess={() => {
          fetchAllProjects().then((p) => p && setProjectsList(p));
        }}
        project={editingProject}
        usersList={usersList}
      />

      {/* 4. Service Manager Modal */}
      <ServiceManagerModal
        isOpen={serviceModalOpen}
        onClose={() => setServiceModalOpen(false)}
        onSuccess={() => {
          fetchServicesCatalog().then((s) => s && setServicesList(s));
        }}
        service={editingService}
      />

      {/* 5. Quotation Manager Modal */}
      <QuotationManagerModal
        isOpen={quotationModalOpen}
        onClose={() => setQuotationModalOpen(false)}
        onSuccess={() => {
          fetchAllQuotations().then((q) => q && setQuotationsList(q));
        }}
        quotation={editingQuotation}
      />

      {/* 6. Blog Manager Modal */}
      <BlogManagerModal
        isOpen={blogModalOpen}
        onClose={() => setBlogModalOpen(false)}
        onSuccess={() => {
          fetchBlogPosts().then((b) => b && setBlogList(b));
        }}
        post={editingBlog}
      />

      {/* 7. In-App Delete Confirmation Modal (replaces native window.confirm) */}
      {pendingDelete && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-delete-confirm-title"
          onClick={(e) => {
            if (e.target === e.currentTarget && !deletingItem) {
              setPendingDelete(null);
            }
          }}
        >
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0 text-rose-700">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 id="admin-delete-confirm-title" className="text-sm font-bold text-slate-950">
                  {t('Confirm Deletion', 'हटाने की पुष्टि करें')}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {language === 'hi'
                    ? `क्या आप वाकई "${pendingDelete.label}" को हटाना चाहते हैं? यह क्रिया पूर्ववत नहीं की जा सकती।`
                    : `Are you sure you want to remove "${pendingDelete.label}"? This action cannot be undone.`}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={deletingItem}
                onClick={() => setPendingDelete(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
              >
                {t('Cancel', 'रद्द करें')}
              </button>
              <button
                type="button"
                disabled={deletingItem}
                onClick={executePendingDelete}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 disabled:opacity-50 rounded-md transition-colors cursor-pointer"
              >
                {deletingItem ? t('Removing...', 'हटाया जा रहा है...') : t('Confirm Delete', 'हटाएं')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
