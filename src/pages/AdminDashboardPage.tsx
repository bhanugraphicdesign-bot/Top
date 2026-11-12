import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useApps } from '../context/AppsContext';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '../context/NavigationContext';
import { AndroidApp, BlogPost, ServiceItem } from '../types';
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
} from '../firebase/services';
import { SERVICES_DATA } from '../data/content';
import { BLOG_POSTS } from '../data/blogData';
import {
  Smartphone,
  Plus,
  Edit2,
  Trash2,
  Users,
  Cpu,
  Activity,
  CheckCircle,
  Clock,
  Terminal,
  Shield,
  Search,
  ExternalLink,
  RotateCcw,
  AlertCircle,
  Database,
  Server,
  RefreshCw,
  Lock,
  FileText,
  Layers,
  BookOpen,
  Settings,
  Check,
  X,
  UserCheck,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  Building2,
  Mail,
  Phone,
  Code2,
  LifeBuoy,
  MessageSquare,
  Send,
  Paperclip,
  Download,
  ShieldCheck,
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
  const { currentUser, isAdmin, openAuthModal } = useAuth();
  const { navigate } = useNavigation();

  // Admin access gate: allow root email, isAdmin from Firestore, or demo evaluation mode
  const [demoAdminMode, setDemoAdminMode] = useState<boolean>(() => {
    return sessionStorage.getItem('pws_demo_admin') === 'true';
  });

  const isAuthorizedAdmin =
    isAdmin ||
    currentUser?.email === 'ssbhanu41@gmail.com' ||
    demoAdminMode;

  const [activeTab, setActiveTab] = useState<
    'customers' | 'leads' | 'projects' | 'services' | 'portfolio' | 'quotations' | 'support' | 'content' | 'telemetry'
  >('customers');

  const [searchTerm, setSearchTerm] = useState('');
  const [isSeeding, setIsSeeding] = useState(false);
  const [serverHealth, setServerHealth] = useState<any>(null);

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

  // Data collections state
  const [usersList, setUsersList] = useState<any[]>([
    {
      uid: 'user-root',
      displayName: 'Er. Bhanu Ram Bariha',
      email: 'ssbhanu41@gmail.com',
      companyName: 'BHANU RAM BARIHA DIGITAL TECHNOLOGIES',
      role: 'admin',
      lastLoginAt: '2026-11-10T11:45:00Z',
    },
    {
      uid: 'user-002',
      displayName: 'Rajiv Sengupta',
      email: 'r.sengupta@kalingalogistics.in',
      companyName: 'Kalinga Logistics Infrastructure Ltd.',
      role: 'client',
      lastLoginAt: '2026-11-09T08:20:00Z',
    },
    {
      uid: 'user-003',
      displayName: 'Dr. Anita Mohanty',
      email: 'anita.m@utkalhealth.org',
      companyName: 'Utkal Health Sciences Foundation',
      role: 'client',
      lastLoginAt: '2026-11-08T16:10:00Z',
    },
    {
      uid: 'user-004',
      displayName: 'Er. Somnath Patel',
      email: 's.patel@barihadigital.com',
      companyName: 'Bariha Digital Technologies',
      role: 'architect',
      lastLoginAt: '2026-11-10T09:30:00Z',
    },
  ]);

  const [leads, setLeads] = useState<InboundLead[]>([
    {
      id: 'lead-101',
      name: 'Rajiv Sengupta',
      company: 'Kalinga Logistics Infrastructure Ltd.',
      email: 'r.sengupta@kalingalogistics.in',
      phone: '+91 94370 12890',
      service: 'Enterprise Android Engineering',
      serviceHi: 'एंटरप्राइज एंड्रॉइड इंजीनियरिंग',
      budget: '₹25,00,000 - ₹50,00,000',
      receivedDate: '2026-11-09',
      status: 'New',
      statusHi: 'नई पूछताछ',
      notes: 'Requires 4,000-device fleet rollout with offline geofencing.',
    },
    {
      id: 'lead-102',
      name: 'Dr. Anita Mohanty',
      company: 'Utkal Health Sciences Foundation',
      email: 'anita.m@utkalhealth.org',
      phone: '+91 98610 44521',
      service: 'Autonomous AI Workflows',
      serviceHi: 'ऑटोनॉमस एआई वर्कफ़्लो',
      budget: '₹15,00,000 - ₹25,00,000',
      receivedDate: '2026-11-08',
      status: 'Contacted',
      statusHi: 'संपर्क स्थापित',
      notes: 'Diagnostic document OCR pipeline in Hindi and Odia.',
    },
    {
      id: 'lead-103',
      name: 'Sunil Kumar Pradhan',
      company: 'Barbil Minerals & Power Corp',
      email: 'spradhan@barbilpower.com',
      phone: '+91 97771 90812',
      service: 'Mission-Critical Backend Architectures',
      serviceHi: 'वितरित बैकएंड आर्किटेक्चर',
      budget: '₹50,00,000+',
      receivedDate: '2026-11-06',
      status: 'In Discussion',
      statusHi: 'चर्चा जारी',
      notes: 'SCADA telemetry ingestion microservice with Go and Kafka.',
    },
  ]);

  const [projectsList, setProjectsList] = useState<any[]>([
    {
      id: 'proj-1',
      code: 'PRJ-FLT-2026',
      name: 'Bharat Fleet ERP & Distributed Telematics',
      nameHi: 'भारत फ्लीट ईआरपी एवं वितरित टेलीमैटिक्स सिस्टम',
      clientName: 'Kalinga Logistics Infrastructure Ltd.',
      clientEmail: 'r.sengupta@kalingalogistics.in',
      sprint: 'Sprint 14 of 16',
      sprintHi: 'स्प्रिंट 14 / 16',
      completion: 88,
      status: 'In Sprints',
      statusHi: 'सक्रिय स्प्रिंट',
      health: 'Nominal (P99: 38ms)',
      leadArchitect: 'Bhanu Ram Bariha',
      techStack: ['Kotlin Multiplatform', 'Go 1.23', 'PostgreSQL', 'Kafka'],
    },
    {
      id: 'proj-2',
      code: 'PRJ-COLD-2026',
      name: 'Odisha Cold-Chain Offline-First Android Core',
      nameHi: 'ओडिशा कोल्ड-चेन ऑफलाइन-फर्स्ट एंड्रॉइड कोर',
      clientName: 'Utkal Health Sciences Foundation',
      clientEmail: 'anita.m@utkalhealth.org',
      sprint: 'Sprint 9 of 10',
      sprintHi: 'स्प्रिंट 9 / 10',
      completion: 94,
      status: 'Testing',
      statusHi: 'अंतिम परीक्षण',
      health: 'Optimal (Zero Sync Drop)',
      leadArchitect: 'Senior Mobility Squad Alpha',
      techStack: ['Jetpack Compose', 'Room DB', 'gRPC-Web', 'TLS 1.3'],
    },
    {
      id: 'proj-3',
      code: 'PRJ-MIN-2026',
      name: 'Industrial SCADA Telemetry Stream Gateway',
      nameHi: 'औद्योगिक स्काडा टेलीमेट्री गेटवे',
      clientName: 'Barbil Minerals & Power Corp',
      clientEmail: 'spradhan@barbilpower.com',
      sprint: 'Sprint 3 of 12',
      sprintHi: 'स्प्रिंट 3 / 12',
      completion: 25,
      status: 'In Sprints',
      statusHi: 'सक्रिय स्प्रिंट',
      health: 'Nominal',
      leadArchitect: 'Bhanu Ram Bariha',
      techStack: ['Rust', 'Apache Kafka', 'ClickHouse', 'Docker'],
    },
  ]);

  const [servicesList, setServicesList] = useState<ServiceItem[]>(SERVICES_DATA);
  const [quotationsList, setQuotationsList] = useState<any[]>([
    {
      id: 'quote-2026-081',
      clientName: 'Rajiv Sengupta',
      clientEmail: 'r.sengupta@kalingalogistics.in',
      company: 'Kalinga Logistics Infrastructure Ltd.',
      serviceType: 'Enterprise Android Engineering',
      estimatedBudget: '₹38,50,000',
      timeline: '4 Months',
      status: 'approved',
      createdAt: '2026-11-09T14:30:00Z',
    },
    {
      id: 'quote-2026-082',
      clientName: 'Dr. Anita Mohanty',
      clientEmail: 'anita.m@utkalhealth.org',
      company: 'Utkal Health Sciences Foundation',
      serviceType: 'Autonomous AI Workflows',
      estimatedBudget: '₹22,00,000',
      timeline: '3 Months',
      status: 'pending',
      createdAt: '2026-11-08T10:15:00Z',
    },
    {
      id: 'quote-2026-083',
      clientName: 'Sunil Kumar Pradhan',
      clientEmail: 'spradhan@barbilpower.com',
      company: 'Barbil Minerals & Power Corp',
      serviceType: 'Mission-Critical Backend Architectures',
      estimatedBudget: '₹65,00,000',
      timeline: '6 Months',
      status: 'under_review',
      createdAt: '2026-11-06T18:40:00Z',
    },
  ]);

  const [blogList, setBlogList] = useState<BlogPost[]>(BLOG_POSTS);
  const [contentSubTab, setContentSubTab] = useState<'articles' | 'settings'>('articles');

  const [siteSettings, setSiteSettings] = useState({
    companyName: 'BHANU RAM BARIHA DIGITAL TECHNOLOGIES',
    brandName: 'POWER WEB STUDIO AI',
    cin: 'CIN: U72900OR2024PTC045812',
    contactEmail: 'contact@powerwebstudio.ai',
    contactPhone: '+91 (0674) 298-4412',
    maintenanceMode: false,
    slaTarget: '99.98%',
    headquarters: 'Bhubaneswar / Sambalpur Tech Corridor, Odisha, India',
  });
  const [savingSettings, setSavingSettings] = useState(false);

  const [auditLogs, setAuditLogs] = useState<any[]>([
    {
      id: 'log-001',
      actorEmail: 'ssbhanu41@gmail.com',
      action: 'SYSTEM_BOOTSTRAP',
      resource: 'firestore/all_collections',
      details: 'SOC-2 ABAC rules verified & 15 collections synchronized',
      timestamp: '2026-11-10T12:00:00Z',
    },
    {
      id: 'log-002',
      actorEmail: 'ssbhanu41@gmail.com',
      action: 'APP_CATALOG_SYNC',
      resource: 'apps/bariha-pay',
      details: 'Updated BarihaPay release v3.4.2 signature',
      timestamp: '2026-11-10T11:50:00Z',
    },
    {
      id: 'log-003',
      actorEmail: 'system_anonymous',
      action: 'QUOTATION_SUBMITTED',
      resource: 'quotations/quote-2026-081',
      details: 'Inbound quotation submitted from enterprise portal',
      timestamp: '2026-11-09T14:30:00Z',
    },
  ]);

  // Support Tickets & SLA Triage state
  const [ticketsList, setTicketsList] = useState<any[]>([
    {
      id: 'TKT-2026-904',
      subject: 'BLE Soundbox latency validation report request for Odisha deployment',
      priority: 'P2_High',
      category: 'Hardware Telemetry',
      projectCode: 'PRJ-FLT-2026',
      environment: 'Android 14 / Teltonika FMB920',
      clientEmail: 'r.sengupta@kalingalogistics.in',
      clientId: 'user-002',
      status: 'in_progress',
      createdAt: '2026-11-08T10:15:00Z',
      details: 'Requesting certified latency logs across 500 field terminals prior to district rollout.',
      attachment: {
        fileName: 'telemetry_sampling_odisha_v2.json',
        fileSizeFormatted: '1.4 MB',
        sha256: '9f83c12a4b821703e456efc829107412ab34cd56ef781290ab1234567890cdef',
        downloadUrl: '/api/files/telemetry_sampling_odisha_v2.json',
      },
      responses: [
        {
          id: 'resp-001',
          author: 'Er. Bhanu Ram Bariha',
          authorRole: 'Lead Platform Architect',
          message: 'Telemetry simulation successfully completed on Sambalpur cluster. BLE P99 latency measured at 24ms across 500 nodes. Cryptographic verification report attached.',
          timestamp: '2026-11-08T13:45:00Z',
        },
      ],
    },
    {
      id: 'TKT-2026-882',
      subject: 'Add 2 new authorized client tester emails to Google Play Internal Track',
      priority: 'P3_Normal',
      category: 'Release & Distribution',
      projectCode: 'PRJ-FLT-2026',
      environment: 'Google Play Console / Production Track',
      clientEmail: 'r.sengupta@kalingalogistics.in',
      clientId: 'user-002',
      status: 'resolved',
      createdAt: '2026-11-04T14:20:00Z',
      details: 'Added r.sengupta@kalingalogistics.in and devops@kalingalogistics.in to staging track.',
      responses: [
        {
          id: 'resp-002',
          author: 'DevOps & Release Team',
          authorRole: 'Platform Architect',
          message: 'Both tester accounts provisioned and invites dispatched with internal app-sharing certificate.',
          timestamp: '2026-11-04T15:10:00Z',
        },
      ],
    },
    {
      id: 'TKT-2026-871',
      subject: 'Emergency Architect escalation: Scrutinize NPCI UPI 2.0 dual-webhook payload',
      priority: 'P1_Critical',
      category: 'Payment Core',
      projectCode: 'PRJ-MED-2026',
      environment: 'PCI-DSS Bare-metal Cluster',
      clientEmail: 'anita.m@utkalhealth.org',
      clientId: 'user-003',
      status: 'resolved',
      createdAt: '2026-10-29T08:00:00Z',
      details: 'Lead Architect resolved within 18 minutes. Verified idempotent ledger keys.',
    },
  ]);

  const [ticketSearchTerm, setTicketSearchTerm] = useState('');
  const [ticketPriorityFilter, setTicketPriorityFilter] = useState<string>('all');
  const [ticketStatusFilter, setTicketStatusFilter] = useState<string>('all');
  const [activeTicketIdForReply, setActiveTicketIdForReply] = useState<string | null>('TKT-2026-904');
  const [adminReplyTexts, setAdminReplyTexts] = useState<Record<string, string>>({});
  const [adminReplyStatuses, setAdminReplyStatuses] = useState<Record<string, 'open' | 'in_progress' | 'resolved'>>({});
  const [submittingAdminReply, setSubmittingAdminReply] = useState<Record<string, boolean>>({});

  // Load telemetry and live Firestore records on mount
  useEffect(() => {
    fetch('/api/health')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setServerHealth(data);
      })
      .catch(() => {});

    fetchServicesCatalog()
      .then((services) => {
        if (services && services.length > 0) setServicesList(services);
      })
      .catch(() => {});

    fetchBlogPosts()
      .then((posts) => {
        if (posts && posts.length > 0) setBlogList(posts);
      })
      .catch(() => {});

    fetchSiteSettings()
      .then((settings) => {
        if (settings) setSiteSettings((prev) => ({ ...prev, ...settings }));
      })
      .catch(() => {});

    // Only load protected admin collections if user is an authorized authenticated administrator
    if (!currentUser || !isAuthorizedAdmin) {
      return;
    }

    // Attempt to load Firestore data for authorized admin
    fetchAllUsers()
      .then((users) => {
        if (users && users.length > 0) setUsersList(users);
      })
      .catch(() => {});

    fetchAllProjects()
      .then((projs) => {
        if (projs && projs.length > 0) setProjectsList(projs);
      })
      .catch(() => {});

    fetchAllQuotations()
      .then((quotes) => {
        if (quotes && quotes.length > 0) setQuotationsList(quotes);
      })
      .catch(() => {});

    fetchSupportTickets()
      .then((tickets) => {
        if (tickets && tickets.length > 0) {
          setTicketsList((prev) => {
            const combined = [...tickets];
            for (const p of prev) {
              if (!combined.some((c) => c.id === p.id)) {
                combined.push(p);
              }
            }
            return combined;
          });
        }
      })
      .catch(() => {});

    getAuditLogs(15)
      .then((logs) => {
        if (logs && logs.length > 0) setAuditLogs(logs);
      })
      .catch(() => {});
  }, [currentUser, isAuthorizedAdmin]);

  // Enter / Exit Demo Admin Mode
  const handleToggleDemoMode = (enable: boolean) => {
    setDemoAdminMode(enable);
    if (enable) {
      sessionStorage.setItem('pws_demo_admin', 'true');
      showToast(
        language === 'hi'
          ? 'डेमो एडमिन मोड सक्रिय: सभी 7 प्रबंधन मॉड्यूल पूरी तरह से क्रियाशील हैं।'
          : 'Demo Admin Mode Activated: All 7 management modules fully functional.',
        'success'
      );
    } else {
      sessionStorage.removeItem('pws_demo_admin');
      showToast(
        language === 'hi' ? 'डेमो एडमिन मोड बंद कर दिया गया।' : 'Demo Admin Mode Deactivated.',
        'info'
      );
    }
  };

  const handleSeedDatabase = async () => {
    try {
      setIsSeeding(true);
      const res = await seedInitialDatabaseIfEmpty();
      showToast(
        language === 'hi'
          ? `Cloud Firestore 15 संग्रह सफलतापूर्वक सिंक्रनाइज़ हुए (${res.count} ऐप्स)`
          : `Cloud Firestore 15 collections synchronized (${res.count} apps)`,
        'success'
      );
    } catch (err: any) {
      showToast(err.message || 'Seeding error', 'alert');
    } finally {
      setIsSeeding(false);
    }
  };

  // Customers: promote/demote role
  const handleRoleChange = async (userId: string, newRole: 'admin' | 'client' | 'architect' | 'manager') => {
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

  // Leads: cycle status
  const handleToggleLeadStatus = (leadId: string) => {
    setLeads((prev) =>
      prev.map((lead) => {
        if (lead.id === leadId) {
          const nextStatus =
            lead.status === 'New'
              ? 'Contacted'
              : lead.status === 'Contacted'
              ? 'In Discussion'
              : lead.status === 'In Discussion'
              ? 'Converted'
              : 'Contacted';

          const nextStatusHi =
            nextStatus === 'Contacted'
              ? 'संपर्क स्थापित'
              : nextStatus === 'In Discussion'
              ? 'चर्चा जारी'
              : nextStatus === 'Converted'
              ? 'सफल ग्राहक'
              : 'संपर्क स्थापित';

          return {
            ...lead,
            status: nextStatus,
            statusHi: nextStatusHi,
          };
        }
        return lead;
      })
    );
    showToast(
      language === 'hi' ? 'लीड की स्थिति सफलतापूर्वक अपडेट की गई।' : 'Lead pipeline status updated.',
      'success'
    );
  };

  // Convert Lead to Quotation
  const handleConvertLeadToQuote = (lead: InboundLead) => {
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
    setQuotationModalOpen(true);
  };

  // Delete Handlers with confirmation
  const handleDeleteProject = async (id: string, name: string) => {
    if (window.confirm(language === 'hi' ? `क्या आप प्रोजेक्ट "${name}" को हटाना चाहते हैं?` : `Delete project "${name}"?`)) {
      try {
        await deleteProject(id);
        setProjectsList((prev) => prev.filter((p) => p.id !== id));
        showToast(language === 'hi' ? 'प्रोजेक्ट हटाया गया।' : 'Project removed.', 'info');
      } catch (err: any) {
        showToast(err.message || 'Delete failed', 'alert');
      }
    }
  };

  const handleDeleteService = async (id: string, title: string) => {
    if (window.confirm(language === 'hi' ? `क्या आप सेवा "${title}" को कैटलॉग से हटाना चाहते हैं?` : `Delete service "${title}"?`)) {
      try {
        await deleteServiceItem(id);
        setServicesList((prev) => prev.filter((s) => s.id !== id));
        showToast(language === 'hi' ? 'सेवा हटाई गई।' : 'Service removed from catalog.', 'info');
      } catch (err: any) {
        showToast(err.message || 'Delete failed', 'alert');
      }
    }
  };

  const handleDeleteQuotation = async (id: string) => {
    if (window.confirm(language === 'hi' ? `क्या आप कोटेशन "${id}" को हटाना चाहते हैं?` : `Delete quotation "${id}"?`)) {
      try {
        await deleteQuotation(id);
        setQuotationsList((prev) => prev.filter((q) => q.id !== id));
        showToast(language === 'hi' ? 'कोटेशन हटाई गई।' : 'Quotation deleted.', 'info');
      } catch (err: any) {
        showToast(err.message || 'Delete failed', 'alert');
      }
    }
  };

  const handleDeleteBlogPost = async (id: string, title: string) => {
    if (window.confirm(language === 'hi' ? `क्या आप लेख "${title}" को हटाना चाहते हैं?` : `Delete article "${title}"?`)) {
      try {
        await deleteBlogPost(id);
        setBlogList((prev) => prev.filter((b) => b.id !== id));
        showToast(language === 'hi' ? 'लेख हटाया गया।' : 'Article removed.', 'info');
      } catch (err: any) {
        showToast(err.message || 'Delete failed', 'alert');
      }
    }
  };

  const handleSaveSiteSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await saveSiteSettings(siteSettings);
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
    return quotationsList.filter(
      (q) =>
        (q.clientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (q.clientEmail || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (q.company || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (q.serviceType || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [quotationsList, searchTerm]);

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
    setSubmittingAdminReply((prev) => ({ ...prev, [ticketId]: true }));
    try {
      const author = currentUser?.displayName || 'Er. Bhanu Ram Bariha (Lead Architect)';
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
     RESTRICTED ACCESS BARRIER (IF NOT AUTHORIZED & NOT IN DEMO MODE)
     ========================================================================= */
  if (!isAuthorizedAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6 text-white">
        <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-10 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-blue-900/40 border border-blue-500/40 text-blue-400 flex items-center justify-center mx-auto shadow-inner">
            <ShieldAlert className="w-8 h-8 text-blue-400 animate-pulse" />
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

          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-left space-y-2 text-xs font-mono text-slate-300">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">{t('Authorized Root Admin:', 'अधिकृत रूट एडमिन:')}</span>
              <span className="text-emerald-400 font-bold">ssbhanu41@gmail.com</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">{t('Security Policy:', 'सुरक्षा नीति:')}</span>
              <span className="text-blue-400 font-bold">SOC-2 ABAC / Default Deny</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">{t('Current Session:', 'वर्तमान सत्र:')}</span>
              <span className="text-amber-400 font-bold">
                {currentUser ? currentUser.email : t('Unauthenticated Guest', 'अनाधिकृत आगंतुक')}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => openAuthModal('login')}
              type="button"
              className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              <span>{t('Sign In as Administrator', 'प्रशासक के रूप में लॉगिन करें')}</span>
            </button>

            <button
              onClick={() => handleToggleDemoMode(true)}
              type="button"
              className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>{t('Enter Demo Admin Mode', 'डेमो एडमिन मोड में प्रवेश करें')}</span>
            </button>
          </div>

          <div className="pt-2">
            <button
              onClick={() => navigate('home')}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors flex items-center justify-center gap-1 mx-auto"
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
     AUTHORIZED ADMIN CONSOLE
     ========================================================================= */
  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Demo Mode Notice Banner if enabled */}
        {demoAdminMode && (
          <div className="mb-6 p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900">
            <div className="flex items-center gap-2 font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-600 animate-ping"></span>
              <span>
                <strong>{t('DEMO ADMIN EVALUATION ACTIVE:', 'डेमो एडमिन मूल्यांकन सक्रिय:')}</strong>{' '}
                {t(
                  'All 7 management modules (Customers, Leads, Projects, Services, Apps, Quotes, Content) are unlocked with full CRUD capabilities.',
                  'सभी 7 प्रबंधन मॉड्यूल (ग्राहक, लीड्स, प्रोजेक्ट्स, सेवाएं, ऐप्स, कोट्स, कंटेंट) पूर्ण संपादन के साथ सक्रिय हैं।'
                )}
              </span>
            </div>
            <button
              onClick={() => handleToggleDemoMode(false)}
              className="px-2.5 py-1 text-xs font-bold text-amber-950 bg-amber-200/80 hover:bg-amber-300 rounded border border-amber-400/50 transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
            >
              {t('Exit Demo Mode', 'डेमो मोड से बाहर निकलें')}
            </button>
          </div>
        )}

        {/* Studio Admin Header Banner */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 sm:p-8 text-white shadow-md mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-blue-900/60 text-blue-300 border border-blue-700/60 uppercase tracking-wider">
                  {t('Studio Admin Console', 'स्टूडियो एडमिनिस्ट्रेशन कंसोल')}
                </span>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  {t('Production Node: BBSR-DC-01', 'उत्पादन नोड: BBSR-DC-01')}
                </span>
                {currentUser?.email && (
                  <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                    ({currentUser.email})
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

          {/* 6 High-Density Enterprise Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6">
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

        {/* 9 Primary Tabs Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 mb-6 overflow-x-auto pb-1 scrollbar-thin">
          <button
            onClick={() => setActiveTab('customers')}
            className={`px-3.5 py-2.5 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'customers'
                ? 'border-blue-700 text-blue-700'
                : 'border-transparent text-slate-600 hover:text-slate-950'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{t('Customers & Users', 'ग्राहक एवं उपयोगकर्ता')}</span>
            <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-full font-bold">
              {usersList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('leads')}
            className={`px-3.5 py-2.5 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
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
            onClick={() => setActiveTab('projects')}
            className={`px-3.5 py-2.5 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'projects'
                ? 'border-blue-700 text-blue-700'
                : 'border-transparent text-slate-600 hover:text-slate-950'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>{t('Client Projects', 'क्लाइंट प्रोजेक्ट्स')}</span>
            <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-full font-bold">
              {projectsList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('services')}
            className={`px-3.5 py-2.5 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'services'
                ? 'border-blue-700 text-blue-700'
                : 'border-transparent text-slate-600 hover:text-slate-950'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>{t('Service Catalog', 'सेवा कैटलॉग')}</span>
            <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-full font-bold">
              {servicesList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('portfolio')}
            className={`px-3.5 py-2.5 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'portfolio'
                ? 'border-blue-700 text-blue-700'
                : 'border-transparent text-slate-600 hover:text-slate-950'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>{t('Android Apps', 'एंड्रॉइड पोर्टफोलियो')}</span>
            <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-full font-bold">
              {apps.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('quotations')}
            className={`px-3.5 py-2.5 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'quotations'
                ? 'border-blue-700 text-blue-700'
                : 'border-transparent text-slate-600 hover:text-slate-950'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{t('Quotations', 'प्रस्ताव एवं कोटेशन')}</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full font-bold">
              {quotationsList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('support')}
            className={`px-3.5 py-2.5 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
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
            onClick={() => setActiveTab('content')}
            className={`px-3.5 py-2.5 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'content'
                ? 'border-blue-700 text-blue-700'
                : 'border-transparent text-slate-600 hover:text-slate-950'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>{t('Content & Site', 'कंटेंट एवं सेटिंग्स')}</span>
          </button>

          <button
            onClick={() => setActiveTab('telemetry')}
            className={`px-3.5 py-2.5 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
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

              <div className="flex items-center gap-2">
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
                  {filteredUsers.map((user) => (
                    <tr key={user.uid} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{user.displayName || 'Enterprise User'}</div>
                        <div className="text-[11px] font-mono text-slate-500">{user.email}</div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">
                        {user.companyName || t('Independent Client', 'स्वतंत्र ग्राहक')}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                            user.role === 'admin'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : user.role === 'architect'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {user.role || 'client'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                        {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Recently active'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <select
                            value={user.role || 'client'}
                            onChange={(e) => handleRoleChange(user.uid, e.target.value as any)}
                            className="text-[11px] font-medium border border-slate-200 rounded px-2 py-1 bg-white focus:outline-none focus:border-blue-700 cursor-pointer"
                          >
                            <option value="client">Client</option>
                            <option value="architect">Architect</option>
                            <option value="manager">Manager</option>
                            <option value="admin">Admin</option>
                          </select>
                          <button
                            onClick={() => {
                              setEditingCustomer(user);
                              setCustomerModalOpen(true);
                            }}
                            className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                            title={t('Edit Client Record', 'ग्राहक विवरण संपादित करें')}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
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
                      <span><strong>{t('Service:', 'सेवा:')}</strong> {language === 'hi' ? lead.serviceHi : lead.service}</span>
                      <span><strong>{t('Budget:', 'बजट:')}</strong> {lead.budget}</span>
                      <span><strong>{t('Date:', 'दिनांक:')}</strong> {formatDate(lead.receivedDate)}</span>
                      <span><strong>{t('Email:', 'ईमेल:')}</strong> {lead.email}</span>
                      <span><strong>{t('Phone:', 'फ़ोन:')}</strong> {lead.phone}</span>
                    </div>

                    <p className="text-xs text-slate-600 italic bg-white p-2 rounded border border-slate-100">
                      &quot;{lead.notes}&quot;
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
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

              <div className="flex items-center gap-2">
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
                      {(proj.techStack || []).map((t: string) => (
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

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <span className="font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">
                      {svc.metric} ({svc.metricLabel})
                    </span>
                    <div className="flex gap-1">
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
                            onClick={() => {
                              if (window.confirm(language === 'hi' ? `क्या आप "${app.name}" को हटाना चाहते हैं?` : `Delete "${app.name}"?`)) {
                                deleteApp(app.id);
                                showToast(dict.notifications.appDeleted, 'info');
                              }
                            }}
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
                        <div>{q.serviceType}</div>
                        {(q.attachedFileName || q.attachment?.fileName) && (
                          <div className="pt-1">
                            <a
                              href={q.attachedFileUrl || q.attachment?.fileUrl || q.attachment?.downloadUrl || '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded hover:bg-blue-100 transition-colors"
                            >
                              <Paperclip className="w-3 h-3" />
                              <span className="truncate max-w-[130px]">{q.attachedFileName || q.attachment?.fileName}</span>
                              <Download className="w-2.5 h-2.5" />
                            </a>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-bold font-mono text-blue-700">{q.estimatedBudget}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                            q.status === 'approved'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : q.status === 'under_review'
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {q.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
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
                  {t('SLA Target:', 'SLA लक्ष्य:')} 99.98%
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
                              <a
                                href={attachment.downloadUrl || attachment.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 text-xs font-bold text-blue-700 bg-white hover:bg-blue-50 border border-blue-300 rounded transition-colors inline-flex items-center gap-1.5 shrink-0 self-start sm:self-auto cursor-pointer"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>{t('Download Attached Diagnostic', 'संलग्न डायग्नोस्टिक डाउनलोड करें')}</span>
                              </a>
                            )}
                          </div>
                        )}

                        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 font-mono pt-1 border-t border-slate-100">
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
                                const isArchitect = resp.authorRole !== 'client';
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
                                        <span className="font-bold text-slate-900">{resp.author}</span>
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
                                      <span className="text-[11px] font-mono text-slate-400">
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
                {t('Global Enterprise Settings & CIN', 'ग्लोबल एंटरप्राइज सेटिंग्स एवं CIN')}
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
                          <span className="text-xs text-slate-400 font-mono">
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
                    {t('Corporate identity, CIN registration, official communications, and operational parameters.', 'कंपनी पहचान, सीआईएन (CIN) पंजीकरण और आधिकारिक परिचालन विवरण।')}
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
                        {t('Corporate Identification Number (CIN)', 'कॉर्पोरेट पहचान संख्या (CIN)')}
                      </label>
                      <input
                        type="text"
                        required
                        value={siteSettings.cin}
                        onChange={(e) => setSiteSettings({ ...siteSettings, cin: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:border-blue-700 focus:outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {t('Target SLA Uptime Guarantee', 'लक्ष्य SLA अपटाइम गारंटी')}
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
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2 text-emerald-400">
                  <Terminal className="w-4 h-4" />
                  <span className="font-bold">BHANU_RAM_BARIHA_TECH // SYSTEM_TELEMETRY_DAEMON</span>
                </div>
                <span className="text-[11px] text-slate-500">HEALTH_POLL: 200 OK · TLS 1.3</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-slate-400">
                <div className="bg-slate-900/60 p-3 rounded border border-slate-800">
                  <span className="text-slate-500 block text-[10px] uppercase">Node Runtime</span>
                  <span className="text-emerald-400 font-bold">{serverHealth?.runtime || 'Node.js v22.x'}</span>
                </div>
                <div className="bg-slate-900/60 p-3 rounded border border-slate-800">
                  <span className="text-slate-500 block text-[10px] uppercase">Memory RSS</span>
                  <span className="text-blue-400 font-bold">{serverHealth?.memory?.rss || '48.2 MB'}</span>
                </div>
                <div className="bg-slate-900/60 p-3 rounded border border-slate-800">
                  <span className="text-slate-500 block text-[10px] uppercase">Firestore Status</span>
                  <span className="text-emerald-400 font-bold">15 / 15 Collections</span>
                </div>
                <div className="bg-slate-900/60 p-3 rounded border border-slate-800">
                  <span className="text-slate-500 block text-[10px] uppercase">Security Policy</span>
                  <span className="text-purple-400 font-bold">SOC-2 ABAC Rules</span>
                </div>
              </div>
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

                    <div className="text-right text-[11px] text-slate-400 shrink-0">
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
    </div>
  );
};
