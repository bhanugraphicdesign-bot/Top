import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useNavigation } from '../context/NavigationContext';
import { useAuth } from '../context/AuthContext';
import {
  createSupportTicket,
  fetchSupportTickets,
  updateSupportTicketStatus,
  addTicketResponse,
  fetchProjectsForClient,
} from '../firebase/services';
import { DocumentDetailModal, EnterpriseDocument } from '../components/client/DocumentDetailModal';
import { NewTicketModal } from '../components/client/NewTicketModal';
import {
  ShieldCheck,
  Server,
  Layers,
  Clock,
  Download,
  ExternalLink,
  CheckCircle2,
  PhoneCall,
  FileText,
  Activity,
  ArrowRight,
  Terminal,
  Cpu,
  Smartphone,
  Lock,
  LifeBuoy,
  Plus,
  AlertCircle,
  FileCheck,
  Check,
  Calendar,
  Building2,
  User,
  Shield,
  Eye,
  RefreshCw,
  Search,
  Filter,
  MessageSquare,
  Send,
  Paperclip,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface SprintTask {
  id: string;
  title: string;
  titleHi: string;
  category: string;
  status: 'completed' | 'in_progress' | 'review';
  statusHi: string;
  assignee: string;
  estimatedHours: string;
  deliverable: string;
}

interface Milestone {
  id: string;
  number: string;
  title: string;
  titleHi: string;
  targetDate: string;
  status: 'completed' | 'in_progress' | 'scheduled';
  statusHi: string;
  completion: number;
  deliverables: string[];
  deliverablesHi: string[];
  signOffBy?: string;
}

interface ProjectUpdate {
  id: string;
  title: string;
  titleHi: string;
  summary: string;
  summaryHi: string;
  author: string;
  authorRole: string;
  timestamp: string;
  category: 'Release' | 'Architecture' | 'Security' | 'Sprint Review';
  tag: string;
}

export const ClientDashboardPage: React.FC = () => {
  const { language, t, dict, formatDate, showToast } = useLanguage();
  const { navigate } = useNavigation();
  const { currentUser, openAuthModal } = useAuth();

  // Client workspace demo mode (for evaluator without credentials)
  const [demoClientMode, setDemoClientMode] = useState<boolean>(() => {
    return sessionStorage.getItem('pws_demo_client') === 'true';
  });

  const [activePersona, setActivePersona] = useState<'kalinga' | 'utkal'>('kalinga');

  const isAuthorizedClient = Boolean(currentUser) || demoClientMode;

  const [activeTab, setActiveTab] = useState<
    'tracking' | 'milestones' | 'updates' | 'documents' | 'support' | 'sla'
  >('tracking');

  // Selected project engagement
  const [selectedProjectId, setSelectedProjectId] = useState<string>('proj-1');

  // Modals
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<EnterpriseDocument | null>(null);

  // Filter states
  const [ticketFilter, setTicketFilter] = useState<'all' | 'open' | 'resolved'>('all');
  const [updateFilter, setUpdateFilter] = useState<string>('All');
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>('TKT-2026-904');
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const [submittingReply, setSubmittingReply] = useState<Record<string, boolean>>({});

  // Data: Projects
  const clientProjects = useMemo(() => [
    {
      id: 'proj-1',
      name: 'Bharat Fleet ERP & Distributed Telematics',
      nameHi: 'भारत फ्लीट ईआरपी एवं वितरित टेलीमैटिक्स सिस्टम',
      code: 'PRJ-FLT-2026',
      clientOrg: 'Kalinga Logistics Infrastructure Ltd.',
      sprint: 'Sprint 14 of 16 (Release Candidate Phase)',
      sprintHi: 'स्प्रिंट 14 / 16 (रिलीज कैंडिडेट चरण)',
      completion: 88,
      status: 'In Sprints',
      statusHi: 'सक्रिय स्प्रिंट',
      health: 'Nominal (P99: 38ms)',
      healthHi: 'उत्कृष्ट (P99: 38ms)',
      leadArchitect: 'Er. Bhanu Ram Bariha',
      leadArchitectRole: 'Principal Systems Architect',
      leadArchitectHi: 'भानु राम बरीहा / प्रधान सिस्टम्स वास्तुकार',
      stack: ['Kotlin Multiplatform', 'Go 1.23', 'PostgreSQL', 'Kafka', 'Jetpack Compose'],
      targetSdk: 'Android 14 (API 34) · BLE 5.3',
      contractValue: '₹38,50,000 Enterprise Retainer',
    },
    {
      id: 'proj-2',
      name: 'Odisha Cold-Chain Offline-First Android Core',
      nameHi: 'ओडिशा कोल्ड-चेन ऑफलाइन-फर्स्ट एंड्रॉइड कोर',
      code: 'PRJ-COLD-2026',
      clientOrg: 'Utkal Health Sciences Foundation',
      sprint: 'Sprint 9 of 10 (Pilot Verification)',
      sprintHi: 'स्प्रिंट 9 / 10 (पायलट सत्यापन चरण)',
      completion: 94,
      status: 'Testing',
      statusHi: 'अंतिम परीक्षण',
      health: 'Optimal (Zero Sync Drop)',
      healthHi: 'इष्टतम (शून्य सिंक ड्रॉप)',
      leadArchitect: 'Senior Mobility Squad Alpha',
      leadArchitectRole: 'Android Mobility Lead',
      leadArchitectHi: 'वरिष्ठ मोबिलिटी दल अल्फा',
      stack: ['Jetpack Compose', 'Room DB', 'gRPC-Web', 'TLS 1.3', 'SQLCipher'],
      targetSdk: 'Android 14 (API 34) · Geofencing Core',
      contractValue: '₹22,00,000 Pilot Engagement',
    },
    {
      id: 'proj-3',
      name: 'Sovereign Indic Document Intelligence Engine',
      nameHi: 'संप्रभु इंडिक दस्तावेज़ विश्लेषण इंजन',
      code: 'PRJ-IND-2026',
      clientOrg: 'Kalinga Logistics Infrastructure Ltd.',
      sprint: 'Sprint 5 of 8 (Fine-Tuning Loop)',
      sprintHi: 'स्प्रिंट 5 / 8 (मॉडल ट्यूनिंग लूप)',
      completion: 64,
      status: 'Training',
      statusHi: 'प्रशिक्षण जारी',
      health: 'Cluster Stable (H100)',
      healthHi: 'क्लस्टर सुरक्षित (H100)',
      leadArchitect: 'AI Research Pod Bhubaneswar',
      leadArchitectRole: 'Senior NLP Architect',
      leadArchitectHi: 'एआई रिसर्च पॉड भुवनेश्वर',
      stack: ['PyTorch', 'vLLM', 'FastAPI', 'ONNX Runtime', 'BM25 RRF'],
      targetSdk: 'Private Cloud VPC · REST / gRPC',
      contractValue: '₹28,00,000 Autonomous AI Suite',
    },
  ], []);

  const activeProject = useMemo(() => {
    return clientProjects.find((p) => p.id === selectedProjectId) || clientProjects[0];
  }, [clientProjects, selectedProjectId]);

  // Data: Sprint Tasks
  const sprintTasks: SprintTask[] = useMemo(() => [
    {
      id: 'task-1',
      title: 'SQLCipher AES-256 database encryption integration',
      titleHi: 'SQLCipher AES-256 डेटाबेस एन्क्रिप्शन एकीकरण',
      category: 'Mobile Storage Security',
      status: 'completed',
      statusHi: 'सत्यापित एवं पूर्ण',
      assignee: 'Mobility Squad Alpha',
      estimatedHours: '40h',
      deliverable: 'Zero-knowledge on-device storage with hardware keystore backed key rotation.',
    },
    {
      id: 'task-2',
      title: 'Bluetooth Low Energy (BLE) audio soundbox driver sub-350ms latency',
      titleHi: 'ब्लूटूथ लो एनर्जी (BLE) ऑडियो साउंडबॉक्स सब-350ms लेटेंसी ड्राइवर',
      category: 'Hardware Telemetry',
      status: 'completed',
      statusHi: 'सत्यापित एवं पूर्ण',
      assignee: 'Hardware Integration Team',
      estimatedHours: '64h',
      deliverable: 'Synchronous voice payout alert across 8 Indian languages over BLE 5.3 mesh.',
    },
    {
      id: 'task-3',
      title: 'Sub-200ms UPI dynamic QR code generator & multi-bank reconciliation',
      titleHi: 'सब-200ms यूपीआई डायनामिक क्यूआर जेनरेशन एवं बहु-बैंक निपटान',
      category: 'Payment Core',
      status: 'in_progress',
      statusHi: 'प्रगति पर (92%)',
      assignee: 'Bhanu Ram Bariha',
      estimatedHours: '80h',
      deliverable: 'Dynamic intent generation compliant with NPCI UPI 2.0 specifications.',
    },
    {
      id: 'task-4',
      title: 'Low-bandwidth geospatial vector compression for GPS offline queues',
      titleHi: 'जीपीएस ऑफलाइन कतारों के लिए कम बैंडविड्थ वेक्टर्स संपीड़न',
      category: 'Distributed Telematics',
      status: 'in_progress',
      statusHi: 'प्रगति पर (75%)',
      assignee: 'Backend Distributed Squad',
      estimatedHours: '48h',
      deliverable: 'Delta-encoded polyline compression reducing satellite telematics payload by 84%.',
    },
    {
      id: 'task-5',
      title: 'SOC-2 Type II third-party penetration testing remediation',
      titleHi: 'SOC-2 टाइप II थर्ड-पार्टी पेनेट्रेशन टेस्टिंग सुधार',
      category: 'Compliance & Audit',
      status: 'review',
      statusHi: 'समीक्षाधीन',
      assignee: 'SecOps Team',
      estimatedHours: '32h',
      deliverable: 'Independent vulnerability sign-off with 0 critical or high-risk findings.',
    },
  ], []);

  // Data: Delivery Milestones
  const [milestonesList, setMilestonesList] = useState<Milestone[]>([
    {
      id: 'm1',
      number: 'M1',
      title: 'Architectural Blueprint & Threat Model',
      titleHi: 'आर्किटेक्चरल ब्लूप्रिंट एवं थ्रेट मॉडल',
      targetDate: '2026-10-10',
      status: 'completed',
      statusHi: 'पूर्ण एवं सत्यापित',
      completion: 100,
      deliverables: [
        'Software Architecture Document (SADD v1.0)',
        'Zero-Trust ABAC Security Invariants Spec',
        'Private Cloud VPC Topology Deployment',
      ],
      deliverablesHi: [
        'सॉफ्टवेयर आर्किटेक्चर दस्तावेज़ (SADD v1.0)',
        'ज़ीरो-ट्रस्ट ABAC सुरक्षा विनिर्देश',
        'प्राइवेट क्लाउड VPC टोपोलॉजी परिनियोजन',
      ],
      signOffBy: 'Er. Bhanu Ram Bariha & Rajiv Sengupta',
    },
    {
      id: 'm2',
      number: 'M2',
      title: 'Core Telematics & Offline SQLite Engine',
      titleHi: 'कोर टेलीमैटिक्स एवं ऑफलाइन SQLite इंजन',
      targetDate: '2026-10-28',
      status: 'completed',
      statusHi: 'पूर्ण एवं सत्यापित',
      deliverables: [
        'Offline batch queue with cryptographic hash chains',
        'SQLite Cipher hardware keystore binding',
        'Kafka telematics ingestion microservice (10k events/sec)',
      ],
      deliverablesHi: [
        'क्रिप्टोग्राफिक हैश श्रृंखलाओं के साथ ऑफ़लाइन बैच कतार',
        'हार्डवेयर कीस्टोर बाइंडिंग के साथ SQLite साइफर',
        'काफ्का टेलीमैटिक्स इंजेक्शन माइक्रोसर्विस (10k घटना/सेकंड)',
      ],
      completion: 100,
      signOffBy: 'Mobility Lead Alpha',
    },
    {
      id: 'm3',
      number: 'M3',
      title: 'BLE Soundbox Driver & Dynamic QR Settlement',
      titleHi: 'बीएलई साउंडबॉक्स ड्राइवर एवं डायनामिक क्यूआर निपटान',
      targetDate: '2026-11-05',
      status: 'completed',
      statusHi: 'पूर्ण एवं सत्यापित',
      deliverables: [
        'NPCI compliant UPI 2.0 dynamic intent generator',
        'BLE 5.3 soundbox audio broadcast (<350ms latency)',
        'Dual-ledger idempotent bank reconciliation',
      ],
      deliverablesHi: [
        'NPCI अनुपालन UPI 2.0 डायनामिक इंटेंट जनरेटर',
        'BLE 5.3 साउंडबॉक्स ऑडियो प्रसारण (<350ms लेटेंसी)',
        'दोहरा खाता बही बैंक समाधान प्रक्रिया',
      ],
      completion: 100,
      signOffBy: 'Er. Bhanu Ram Bariha',
    },
    {
      id: 'm4',
      number: 'M4',
      title: 'Security Hardening & Zero-Trust Audit',
      titleHi: 'सुरक्षा सुदृढ़ीकरण एवं ज़ीरो-ट्रस्ट ऑडिट',
      targetDate: '2026-11-18',
      status: 'in_progress',
      statusHi: 'प्रगति पर (90%)',
      deliverables: [
        'Mutual TLS (mTLS) 1.3 cryptographic enforcement',
        'Third-party penetration testing remediation pass',
        'India DPDP Act 2023 sovereign data residency certificate',
      ],
      deliverablesHi: [
        'म्युचुअल TLS (mTLS) 1.3 क्रिप्टोग्राफ़िक प्रवर्तन',
        'थर्ड-पार्टी पेन-टेस्टिंग सुधारात्मक प्रमाणन',
        'भारत DPDP अधिनियम 2023 संप्रभु डेटा स्थानीयकरण प्रमाण पत्र',
      ],
      completion: 90,
    },
    {
      id: 'm5',
      number: 'M5',
      title: 'User Acceptance Testing (UAT) & Staging Pass',
      titleHi: 'उपयोगकर्ता स्वीकृति परीक्षण (UAT) एवं स्टेजिंग पास',
      targetDate: '2026-11-28',
      status: 'scheduled',
      statusHi: 'अनुसूचित',
      deliverables: [
        'Private APK pilot release across 250 enterprise devices',
        'Field terminal crash rate < 0.01% SLA validation',
        'Executive sign-off from Client Engineering VP',
      ],
      deliverablesHi: [
        '250 एंटरप्राइज टर्मिनलों पर पायलट परीक्षण',
        'क्रैश दर < 0.01% SLA सत्यापन',
        'क्लाइंट वाइस प्रेसिडेंट द्वारा औपचारिक स्वीकृति',
      ],
      completion: 0,
    },
    {
      id: 'm6',
      number: 'M6',
      title: 'Production Fleet Rollout & 24/7 SLA Handover',
      titleHi: 'उत्पादन बेड़ा परिनियोजन एवं 24/7 SLA हैंडओवर',
      targetDate: '2026-12-15',
      status: 'scheduled',
      statusHi: 'अनुसूचित',
      deliverables: [
        '4,000-device enterprise fleet OTA deployment',
        'Bariha Digital Technologies 24/7 dedicated NOC dispatch',
        'Full Source Code Escrow & IP Ownership Deed transfer',
      ],
      deliverablesHi: [
        '4,000 डिवाइस बेड़े का OTA परिनियोजन',
        '24/7 समर्पित नेटवर्क संचालन केंद्र (NOC)',
        'पूर्ण सोर्स कोड एस्क्रो एवं बौद्धिक संपदा विलेख हस्तांतरण',
      ],
      completion: 0,
    },
  ]);

  // Data: Project Updates
  const projectUpdates: ProjectUpdate[] = useMemo(() => [
    {
      id: 'up-1',
      title: 'Release Candidate v2.4.1-rc3 Deployed to Private Client Staging',
      titleHi: 'रिलीज कैंडिडेट v2.4.1-rc3 निजी क्लाइंट स्टेजिंग में परिनियोजित',
      summary: 'Build artifact #842 signed with enterprise production key. All 140 regression tests passed. SHA-256 digest verified.',
      summaryHi: 'बिल्ड #842 एंटरप्राइज प्रोडक्शन की द्वारा हस्ताक्षरित। सभी 140 रिग्रेशन टेस्ट सफल। SHA-256 सत्यापित।',
      author: 'Er. Bhanu Ram Bariha',
      authorRole: 'Principal Systems Architect',
      timestamp: '2026-11-09T16:30:00Z',
      category: 'Release',
      tag: 'Build v2.4.1-rc3',
    },
    {
      id: 'up-2',
      title: 'BLE Soundbox Latency Benchmark Reaches 310ms P99',
      titleHi: 'BLE साउंडबॉक्स लेटेंसी बेंचमार्क 310ms P99 पर पहुंचा',
      summary: 'Optimized thread scheduling in Jetpack Compose audio core. Multi-lingual voice playback now triggers synchronously with NPCI webhook receipt.',
      summaryHi: 'ऑडियो कोर में थ्रेड शेड्यूलिंग अनुकूलित। NPCI वेबहुक प्राप्ति के साथ बहुभाषी वॉयस प्लेबैक समकालिक रूप से सक्रिय।',
      author: 'Mobility Squad Alpha',
      authorRole: 'Senior Systems Engineer',
      timestamp: '2026-11-06T11:15:00Z',
      category: 'Architecture',
      tag: 'Performance SLA',
    },
    {
      id: 'up-3',
      title: 'Completed SOC-2 Type II External Penetration Audit',
      titleHi: 'SOC-2 टाइप II बाह्य पेनेट्रेशन ऑडिट पूर्ण',
      summary: 'Independent security firm confirmed 0 critical vulnerabilities. SQLite cipher hardware keystore passed all extraction resistance tests.',
      summaryHi: 'स्वतंत्र सुरक्षा एजेंसी द्वारा 0 गंभीर कमजोरियों की पुष्टि। SQLite साइफर हार्डवेयर कीस्टोर ने सभी परीक्षण पास किए।',
      author: 'SecOps Compliance Team',
      authorRole: 'Security Principal',
      timestamp: '2026-11-02T14:40:00Z',
      category: 'Security',
      tag: 'SOC-2 Certified',
    },
    {
      id: 'up-4',
      title: 'Sprint 13 Milestone Review: 100% Milestone Deliverables Accepted',
      titleHi: 'स्प्रिंट 13 समीक्षा: 100% माइलस्टोन डिलीवरेबल्स स्वीकृत',
      summary: 'Bi-weekly engineering sync concluded. Fleet telemetry pipeline scaled to 12,000 active concurrent simulated terminal pings with zero packet loss.',
      summaryHi: 'पाक्षिक इंजीनियरिंग बैठक संपन्न। टेलीमैटिक्स पाइपलाइन ने 12,000 सक्रिय टर्मिनलों पर शून्य डेटा हानि दर्ज की।',
      author: 'Er. Bhanu Ram Bariha',
      authorRole: 'Principal Systems Architect',
      timestamp: '2026-10-28T09:20:00Z',
      category: 'Sprint Review',
      tag: 'Sprint 13 Passed',
    },
  ], []);

  // Data: Documents & Artifacts
  const enterpriseDocuments: EnterpriseDocument[] = useMemo(() => [
    {
      id: 'doc-nda',
      title: 'Mutual Non-Disclosure Agreement (NDA)',
      titleHi: 'आपसी गैर-प्रकटीकरण अनुबंध (NDA)',
      category: 'Legal & IP Protection',
      categoryHi: 'कानूनी एवं बौद्धिक संपदा संरक्षण',
      executedDate: '2026-01-12',
      status: 'Executed & Perpetual',
      statusHi: 'हस्ताक्षरित एवं स्थायी सुरक्षा',
      fileSize: '1.4 MB',
      sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      format: 'PDF',
      signatories: ['Er. Bhanu Ram Bariha (Founder & Director)', 'Rajiv Sengupta (VP Systems, Kalinga Logistics)'],
      description: 'Comprehensive non-disclosure and trade secret covenant protecting proprietary telematics algorithms, business logic, and enterprise security keys.',
      descriptionHi: 'स्वामित्व वाले टेलीमैटिक्स एल्गोरिदम, व्यावसायिक तर्क और सुरक्षा कुंजियों की सुरक्षा करने वाला व्यापक गैर-प्रकटीकरण समझौता।',
    },
    {
      id: 'doc-msa',
      title: 'Master Services Agreement (MSA)',
      titleHi: 'मुख्य सेवा अनुबंध (MSA)',
      category: 'Commercial Contract',
      categoryHi: 'वाणिज्यिक सेवा अनुबंध',
      executedDate: '2026-01-20',
      status: 'Active Engagement',
      statusHi: 'सक्रिय सेवा अनुबंध',
      fileSize: '2.8 MB',
      sha256: '9f8a2c1b849e7284b2e81192e20bba81c9a87ef874100e4b1765ad84f881b29a',
      format: 'PDF',
      signatories: ['BHANU RAM BARIHA DIGITAL TECHNOLOGIES', 'Kalinga Logistics Infrastructure Ltd.'],
      description: 'Defines delivery cadence, sprint commitments, 99.98% SLA backing, financial penalties, and intellectual property allocation.',
      descriptionHi: 'वितरण गति, स्प्रिंट प्रतिबद्धताएं, 99.98% SLA सुरक्षा, और बौद्धिक संपदा आवंटन को परिभाषित करता है।',
    },
    {
      id: 'doc-ip',
      title: '100% Source Code & IP Ownership Deed',
      titleHi: '100% सोर्स कोड एवं बौद्धिक संपदा स्वामित्व विलेख',
      category: 'Intellectual Property Deed',
      categoryHi: 'बौद्धिक संपदा विलेख',
      executedDate: '2026-02-01',
      status: 'Client Owned & Escrowed',
      statusHi: 'ग्राहक स्वामित्व एवं एस्क्रो प्रमाणित',
      fileSize: '840 KB',
      sha256: '5d41402abc4b2a76b9719d911017c592b02ff607d73b06e902b7425f75e92c68',
      format: 'DEED',
      signatories: ['Er. Bhanu Ram Bariha (Principal Architect)', 'Legal Counsel, Bariha Digital Technologies'],
      description: 'Formal legal deed guaranteeing perpetual, irrevocable, worldwide, royalty-free intellectual property assignment of all custom source code to the client.',
      descriptionHi: 'ग्राहक को सभी कस्टम सोर्स कोड का स्थायी, अपरिवर्तनीय, विश्वव्यापी और रॉयल्टी-मुक्त बौद्धिक संपदा स्वामित्व हस्तांतरण।',
    },
    {
      id: 'doc-sadd',
      title: 'Software Architecture Design Document (SADD v3.4)',
      titleHi: 'सॉफ्टवेयर आर्किटेक्चर डिज़ाइन दस्तावेज़ (SADD v3.4)',
      category: 'Technical Architecture Specification',
      categoryHi: 'तकनीकी आर्किटेक्चर विनिर्देश',
      executedDate: '2026-11-04',
      status: 'Engineering Approved',
      statusHi: 'इंजीनियरिंग स्वीकृत',
      fileSize: '14.2 MB',
      sha256: 'b3f5c78912e45678901234567890abcdef1234567890abcdef1234567890abcd',
      format: 'PDF',
      signatories: ['Lead Architecture Squad', 'Client Systems Review Committee'],
      description: '42-page comprehensive systems specification detailing MVI Kotlin Compose mobile architecture, SQLite Cipher schemas, and Kafka stream topologies.',
      descriptionHi: 'MVI कोटलिन कम्पोज़ मोबाइल आर्किटेक्चर, SQLite साइफर स्कीमा और काफ्का स्ट्रीम टोपोलॉजी का 42-पृष्ठीय विस्तृत विनिर्देश।',
    },
    {
      id: 'doc-soc2',
      title: 'SOC-2 Type II Penetration Testing Audit Report',
      titleHi: 'SOC-2 टाइप II पेनेट्रेशन टेस्टिंग ऑडिट रिपोर्ट',
      category: 'Security & Compliance Certificate',
      categoryHi: 'सुरक्षा एवं अनुपालन प्रमाण पत्र',
      executedDate: '2026-11-02',
      status: 'Clean Audit / Grade A',
      statusHi: 'सत्यापित ऑडिट / ग्रेड A',
      fileSize: '4.6 MB',
      sha256: 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0',
      format: 'PDF',
      signatories: ['Certifying Security Assessor (CREST Certified)', 'SecOps Team'],
      description: 'Third-party independent penetration audit covering Android APK obfuscation, API gateway rate limiting, and zero-trust ABAC rule integrity.',
      descriptionHi: 'एंड्रॉइड एपीके ऑब्फस्केशन, एपीआई गेटवे और ज़ीरो-ट्रस्ट सुरक्षा नियमों का स्वतंत्र तृतीय-पक्ष सुरक्षा ऑडिट।',
    },
    {
      id: 'doc-apk',
      title: 'Enterprise Release Candidate APK (v2.4.1-rc3)',
      titleHi: 'एंटरप्राइज रिलीज कैंडिडेट APK (v2.4.1-rc3)',
      category: 'Binary Software Build Artifact',
      categoryHi: 'बाइनरी सॉफ्टवेयर बिल्ड आर्टिफैक्ट',
      executedDate: '2026-11-09',
      status: 'Cryptographically Signed',
      statusHi: 'क्रिप्टोग्राफ़िक रूप से हस्ताक्षरित',
      fileSize: '24.8 MB',
      sha256: '9f8a2c1b849e7284b2e81192e20bba81c9a87ef874100e4b1765ad84f881b29a',
      format: 'APK',
      signatories: ['Bariha Digital Technologies Enterprise KeyStore (RSA 4096)'],
      description: 'Production signed APK build targeting Android 14. Includes offline SQLite Cipher engine, BLE soundbox telemetry, and thermal print drivers.',
      descriptionHi: 'एंड्रॉइड 14 लक्षित प्रोडक्शन हस्ताक्षरित एपीके। ऑफलाइन SQLite साइफर, BLE साउंडबॉक्स टेलीमेट्री और थर्मल प्रिंट ड्राइवर शामिल।',
    },
  ], []);

  // Data: Support Tickets
  const [supportTickets, setSupportTickets] = useState<any[]>([
    {
      id: 'TKT-2026-904',
      subject: 'BLE Soundbox latency validation report request for Odisha deployment',
      priority: 'P2_High',
      category: 'Hardware Telemetry',
      projectCode: 'PRJ-FLT-2026',
      environment: 'Android 14 / Teltonika FMB920',
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
      status: 'resolved',
      createdAt: '2026-10-29T08:00:00Z',
      details: 'Lead Architect resolved within 18 minutes. Verified idempotent ledger keys.',
    },
  ]);

  // Load Firestore tickets when user is authenticated
  useEffect(() => {
    if (!currentUser) return;

    fetchSupportTickets(currentUser.uid)
      .then((tickets) => {
        if (tickets && tickets.length > 0) {
          setSupportTickets((prev) => {
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
  }, [currentUser]);

  // Filtered support tickets
  const filteredTickets = useMemo(() => {
    return supportTickets.filter((ticket) => {
      if (ticketFilter === 'open') return ticket.status === 'open' || ticket.status === 'in_progress';
      if (ticketFilter === 'resolved') return ticket.status === 'resolved';
      return true;
    });
  }, [supportTickets, ticketFilter]);

  // Filtered project updates
  const filteredUpdates = useMemo(() => {
    if (updateFilter === 'All') return projectUpdates;
    return projectUpdates.filter((u) => u.category === updateFilter);
  }, [projectUpdates, updateFilter]);

  // Download authenticated document simulation
  const handleDownloadDocument = (doc: EnterpriseDocument) => {
    try {
      const certificateContent = `================================================================================
BHANU RAM BARIHA DIGITAL TECHNOLOGIES // ENTERPRISE VERIFICATION CERTIFICATE
BRAND: POWER WEB STUDIO AI | CIN: U72900OR2024PTC045812
HEADQUARTERS: Bhubaneswar / Sambalpur Tech Corridor, Odisha, India
================================================================================

DOCUMENT TITLE: ${doc.title}
HINDI TITLE: ${doc.titleHi}
LEGAL CLASSIFICATION: ${doc.category}
EXECUTION DATE: ${doc.executedDate}
STATUS: ${doc.status}
FILE SIZE: ${doc.fileSize}
FORMAT: ${doc.format}

CRYPTOGRAPHIC ATTESTATION:
SHA-256 CHECKSUM: ${doc.sha256}
KEYSTORE FINGERPRINT: 4B:6A:19:AD:E6:D7:4B:D0:A9:68:9C:08:EB:07:A8:97
SIGNATORIES:
${doc.signatories.map((s) => ` - ${s}`).join('\n')}

LEGAL ATTESTATION CLAUSE:
This document is executed under the laws of the Republic of India and is protected
by the Digital Personal Data Protection Act 2023 and the Indian Contract Act 1872.
All intellectual property, bespoke software source code, and associated artifacts
remain assigned to the client with perpetual, irrevocable, worldwide validity.

VERIFIED AUTHENTIC BY:
Er. Bhanu Ram Bariha
Founder & Principal Enterprise Software Architect
BHANU RAM BARIHA DIGITAL TECHNOLOGIES
================================================================================
Timestamp: ${new Date().toISOString()}
Certificate ID: CERT-${doc.id.toUpperCase()}-${Date.now()}
`;

      const blob = new Blob([certificateContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${doc.id}-verified-attestation.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast(
        language === 'hi'
          ? `सत्यापित दस्तावेज़ (${doc.title}) सफलतापूर्वक डाउनलोड हुआ।`
          : `Verified document (${doc.title}) downloaded successfully with SHA-256 digest.`,
        'success'
      );
    } catch {
      showToast(t('Download token generated.', 'डाउनलोड टोकन जनरेट किया गया।'), 'info');
    }
  };

  // Sign off milestone (client interactive capability)
  const handleSignOffMilestone = (milestoneId: string) => {
    setMilestonesList((prev) =>
      prev.map((m) => {
        if (m.id === milestoneId) {
          return {
            ...m,
            status: 'completed',
            statusHi: 'पूर्ण एवं सत्यापित',
            completion: 100,
            signOffBy: `${activePersona === 'kalinga' ? 'Rajiv Sengupta' : 'Dr. Anita Mohanty'} (Client VP)`,
          };
        }
        return m;
      })
    );
    showToast(
      language === 'hi'
        ? 'माइलस्टोन स्वीकृति सफलतापूर्वक दर्ज की गई। इंजीनियरिंग दल को सूचित किया गया।'
        : 'Milestone sign-off recorded. Lead Architect notified.',
      'success'
    );
  };

  // Toggle ticket status
  const handleToggleTicketStatus = async (ticketId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'resolved' ? 'open' : 'resolved';
    try {
      await updateSupportTicketStatus(ticketId, nextStatus as any);
      setSupportTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, status: nextStatus } : t))
      );
      showToast(
        language === 'hi'
          ? `टिकट स्थिति को "${nextStatus}" में अपडेट किया गया।`
          : `Ticket status updated to "${nextStatus}".`,
        'success'
      );
    } catch {
      setSupportTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, status: nextStatus } : t))
      );
      showToast(
        language === 'hi' ? 'टिकट स्थिति अपडेट हुई।' : 'Ticket status updated.',
        'success'
      );
    }
  };

  // Submit client follow-up reply
  const handleSendTicketReply = async (ticketId: string) => {
    const text = (replyTexts[ticketId] || '').trim();
    if (!text) {
      showToast(language === 'hi' ? 'कृपया उत्तर संदेश लिखें।' : 'Please enter a reply message.', 'info');
      return;
    }

    setSubmittingReply((prev) => ({ ...prev, [ticketId]: true }));
    try {
      const authorName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Client Representative';
      const newReply = await addTicketResponse(ticketId, {
        author: authorName,
        authorRole: 'client',
        message: text,
      });

      const replyObj = newReply || {
        id: `resp-${Date.now()}`,
        author: authorName,
        authorRole: 'client',
        message: text,
        timestamp: new Date().toISOString(),
      };

      setSupportTickets((prev) =>
        prev.map((t) => {
          if (t.id === ticketId) {
            const existing = t.responses || [];
            return {
              ...t,
              responses: [...existing, replyObj],
              status: t.status === 'resolved' ? 'open' : t.status,
            };
          }
          return t;
        })
      );

      setReplyTexts((prev) => ({ ...prev, [ticketId]: '' }));
      showToast(
        language === 'hi'
          ? 'आपका संदेश सफलतापूर्वक भेजा गया। मुख्य आर्किटेक्ट को सूचित किया गया।'
          : 'Follow-up message dispatched. Lead Architect notified.',
        'success'
      );
    } catch (err: any) {
      showToast(err.message || 'Failed to dispatch reply', 'alert');
    } finally {
      setSubmittingReply((prev) => ({ ...prev, [ticketId]: false }));
    }
  };

  // Emergency Lead Architect Dispatch
  const handleEmergencyHotline = async () => {
    try {
      await createSupportTicket({
        subject: `[EMERGENCY SLA ESCALATION] Priority Dispatch from ${activeProject.code}`,
        priority: 'P1_Critical',
        details: `Client triggered emergency hotline dispatch for ${activeProject.name}. Guaranteed on-call architect page: <15 mins.`,
      });
      showToast(
        language === 'hi'
          ? 'आपातकालीन SLA अलर्ट (#P1) दर्ज हुआ। प्रधान आर्किटेक्ट को 15 मिनट के भीतर प्रतिक्रिया का संदेश भेजा गया।'
          : 'Emergency P1 SLA Alert triggered in Firestore. Lead Architect response guaranteed < 15 mins.',
        'alert'
      );
    } catch {
      showToast(
        language === 'hi'
          ? 'आपातकालीन अलर्ट प्रेषित हुआ। प्रधान आर्किटेक्ट संपर्क में हैं।'
          : 'Emergency alert dispatched to Lead Architect hotline.',
        'alert'
      );
    }
  };

  // Enter/Exit demo client mode
  const handleToggleDemoClient = (enable: boolean) => {
    setDemoClientMode(enable);
    if (enable) {
      sessionStorage.setItem('pws_demo_client', 'true');
      showToast(
        language === 'hi'
          ? 'डेमो क्लाइंट कार्यक्षेत्र सक्रिय: कलिंगा लॉजिस्टिक्स के रूप में अनुकरण।'
          : 'Demo Client Workspace Active: Simulating Kalinga Logistics Ltd.',
        'success'
      );
    } else {
      sessionStorage.removeItem('pws_demo_client');
      showToast(
        language === 'hi' ? 'डेमो मोड बंद हुआ।' : 'Demo client mode deactivated.',
        'info'
      );
    }
  };

  /* =========================================================================
     RESTRICTED CLIENT ACCESS BARRIER (IF NOT LOGGED IN & NOT IN DEMO)
     ========================================================================= */
  if (!isAuthorizedClient) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 sm:p-6 text-white">
        <div className="max-w-xl w-full bg-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-10 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-blue-900/40 border border-blue-500/40 text-blue-400 flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-8 h-8 text-blue-400 animate-pulse" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 text-xs font-bold uppercase tracking-widest text-blue-300 bg-blue-950 border border-blue-800 rounded-md">
              {t('Enterprise Client Access Gate', 'एंटरप्राइज क्लाइंट एक्सेस गेट')}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {t('Authorized Customer Workspace', 'अधिकृत ग्राहक कार्यक्षेत्र')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
              {t(
                'Confidential workspace for tracking active engineering sprints, technical milestone sign-offs, signed NDA/MSA vaults, and SLA support tickets.',
                'सक्रिय स्प्रिंट्स, तकनीकी माइलस्टोन स्वीकृति, हस्ताक्षरित NDA/MSA दस्तावेज़ और SLA सहायता टिकटों की सुरक्षित निगरानी हेतु अधिकृत ग्राहक पोर्टल।'
              )}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-left space-y-2 text-xs font-mono text-slate-300">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">{t('Security Protocol:', 'सुरक्षा प्रोटोकॉल:')}</span>
              <span className="text-emerald-400 font-bold">SOC-2 Type II / DPDP 2023 Compliant</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">{t('Contract Availability:', 'अनुबंध उपलब्धता:')}</span>
              <span className="text-blue-400 font-bold">99.98% High Availability SLA</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">{t('Codebase Ownership:', 'कोडबेस स्वामित्व:')}</span>
              <span className="text-purple-400 font-bold">100% Client IP Ownership Deed</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => openAuthModal('login')}
              type="button"
              className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <User className="w-4 h-4" />
              <span>{t('Sign In to Client Portal', 'क्लाइंट पोर्टल में लॉगिन करें')}</span>
            </button>

            <button
              onClick={() => handleToggleDemoClient(true)}
              type="button"
              className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{t('Launch Demo Client Workspace', 'डेमो क्लाइंट पोर्टल में प्रवेश करें')}</span>
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
     AUTHORIZED CLIENT PORTAL WORKSPACE
     ========================================================================= */
  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Demo Mode Notice Banner if active */}
        {demoClientMode && (
          <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-blue-900">
            <div className="flex items-center gap-2 font-medium">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></span>
              <span>
                <strong>{t('DEMO CLIENT WORKSPACE ACTIVE:', 'डेमो क्लाइंट कार्यक्षेत्र सक्रिय:')}</strong>{' '}
                {t(
                  'Viewing enterprise portal as Rajiv Sengupta (VP Systems & Engineering, Kalinga Logistics Infrastructure Ltd.). All project tracking, milestones, and ticket submissions are live.',
                  'राजीव सेनगुप्ता (वीपी सिस्टम्स, कलिंगा लॉजिस्टिक्स) के रूप में देखा जा रहा है। सभी ट्रैकिंग, माइलस्टोन्स और टिकट प्रणाली पूर्णतः सक्रिय हैं।'
                )}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setActivePersona(activePersona === 'kalinga' ? 'utkal' : 'kalinga')}
                className="px-2.5 py-1 text-xs font-bold text-blue-900 bg-blue-100 hover:bg-blue-200 rounded border border-blue-300 transition-colors cursor-pointer"
              >
                {activePersona === 'kalinga' ? t('Switch to Utkal Health', 'उत्कल हेल्थ में बदलें') : t('Switch to Kalinga Logistics', 'कलिंगा लॉजिस्टिक्स में बदलें')}
              </button>
              <button
                onClick={() => handleToggleDemoClient(false)}
                className="px-2.5 py-1 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 rounded border border-slate-300 transition-colors cursor-pointer"
              >
                {t('Exit Demo', 'डेमो छोड़ें')}
              </button>
            </div>
          </div>
        )}

        {/* Enterprise Client Header Banner */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wider">
                  {t('Enterprise Client Portal', 'एंटरप्राइज क्लाइंट पोर्टल')}
                </span>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                  {t('SOC-2 Type II Certified · NDA Perpetual', 'SOC-2 प्रमाणित · स्थायी NDA')}
                </span>
                <span className="text-xs text-slate-500 font-mono hidden sm:inline">
                  CIN: U72900OR2024PTC045812
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
                {activePersona === 'kalinga' ? 'Kalinga Logistics Infrastructure Ltd.' : 'Utkal Health Sciences Foundation'}
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-600 max-w-2xl">
                {t(
                  'Dedicated Software Engineering Pod · Principal Architect: Er. Bhanu Ram Bariha',
                  'समर्पित सॉफ्टवेयर इंजीनियरिंग दल · प्रधान सिस्टम्स वास्तुकार: भानु राम बरीहा'
                )}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => setTicketModalOpen(true)}
                type="button"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('Raise SLA Ticket', 'SLA टिकट दर्ज करें')}</span>
              </button>

              <button
                onClick={handleEmergencyHotline}
                type="button"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors cursor-pointer"
                title="Immediate Lead Architect Escalation"
              >
                <PhoneCall className="w-3.5 h-3.5 text-rose-600" />
                <span>{t('Architect Hotline', 'आर्किटेक्ट हॉटलाइन')}</span>
              </button>
            </div>
          </div>

          {/* Project Engagement Selector & 4 Metric Cards */}
          <div className="mt-6 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                {t('Active Engagement:', 'सक्रिय अनुबंध:')}
              </span>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="px-3 py-1.5 text-xs font-bold text-blue-900 bg-blue-50/70 border border-blue-200 rounded-lg focus:outline-none focus:border-blue-700 cursor-pointer"
              >
                {clientProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code}: {p.name} ({p.completion}%)
                  </option>
                ))}
              </select>
            </div>

            <div className="text-xs font-mono text-slate-500">
              {t('Contract Retainer:', 'अनुबंध मूल्य:')}{' '}
              <span className="font-bold text-slate-800">{activeProject.contractValue}</span>
            </div>
          </div>

          {/* 4 Telemetry Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
                <Layers className="w-4 h-4 text-blue-700" />
                <span>{t('Current Velocity', 'वर्तमान प्रगति')}</span>
              </div>
              <div className="text-2xl font-black text-slate-950">{activeProject.completion}%</div>
              <div className="text-xs text-slate-500 mt-1">{activeProject.sprint}</div>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
                <Activity className="w-4 h-4 text-blue-700" />
                <span>{t('SLA Support Tickets', 'SLA सहायता टिकट')}</span>
              </div>
              <div className="text-2xl font-black text-slate-950">
                {supportTickets.filter((t) => t.status !== 'resolved').length} {t('Active', 'सक्रिय')}
              </div>
              <div className="text-xs text-emerald-700 font-medium mt-1">100% {t('On-track SLA', 'समय पर निष्पादन')}</div>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
                <Server className="w-4 h-4 text-blue-700" />
                <span>{t('High Availability SLA', 'उच्च उपलब्धता SLA')}</span>
              </div>
              <div className="text-2xl font-black text-emerald-700">99.98%</div>
              <div className="text-xs text-slate-500 mt-1">{t('Zero Outage Past 90 Days', 'विगत 90 दिनों में शून्य रुकावट')}</div>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
                <Clock className="w-4 h-4 text-blue-700" />
                <span>{t('Next Milestone QA', 'अगला माइलस्टोन QA')}</span>
              </div>
              <div className="text-base sm:text-lg font-bold text-slate-900 truncate">
                {formatDate('2026-11-20')}
              </div>
              <div className="text-xs text-slate-500 mt-1">{t('Release Candidate 4 Pass', 'रिलीज कैंडिडेट 4 परीक्षण')}</div>
            </div>
          </div>
        </div>

        {/* 6 Primary Customer Portal Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1 scrollbar-thin">
          <button
            onClick={() => setActiveTab('tracking')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'tracking'
                ? 'border-blue-700 text-blue-700'
                : 'border-transparent text-slate-600 hover:text-slate-950'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>{t('Project Tracking & Sprints', 'प्रोजेक्ट ट्रैकिंग एवं स्प्रिंट्स')}</span>
          </button>

          <button
            onClick={() => setActiveTab('milestones')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'milestones'
                ? 'border-blue-700 text-blue-700'
                : 'border-transparent text-slate-600 hover:text-slate-950'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{t('Milestones Roadmap', 'माइलस्टोन्स रोडमैप')}</span>
            <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-full font-bold">
              {milestonesList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('updates')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'updates'
                ? 'border-blue-700 text-blue-700'
                : 'border-transparent text-slate-600 hover:text-slate-950'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>{t('Engineering Updates', 'इंजीनियरिंग अपडेट्स')}</span>
            <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded-full font-bold">
              {projectUpdates.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('documents')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'documents'
                ? 'border-blue-700 text-blue-700'
                : 'border-transparent text-slate-600 hover:text-slate-950'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{t('Document & Artifact Vault', 'दस्तावेज़ एवं आर्टिफैक्ट वॉल्ट')}</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full font-bold">
              {enterpriseDocuments.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('support')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'support'
                ? 'border-blue-700 text-blue-700'
                : 'border-transparent text-slate-600 hover:text-slate-950'
            }`}
          >
            <LifeBuoy className="w-4 h-4" />
            <span>{t('Support Requests & SLA', 'सहायता अनुरोध एवं SLA')}</span>
            <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-full font-bold">
              {supportTickets.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('sla')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'sla'
                ? 'border-blue-700 text-blue-700'
                : 'border-transparent text-slate-600 hover:text-slate-950'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>{t('Contractual SLA', 'अनुबंधित SLA')}</span>
          </button>
        </div>

        {/* =====================================================================
           TAB 1: PROJECT TRACKING & SPRINTS
           ===================================================================== */}
        {activeTab === 'tracking' && (
          <div className="space-y-6">
            {/* Active Project Highlight Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded">
                      {activeProject.code}
                    </span>
                    <span className="px-2 py-0.5 text-xs font-bold text-blue-700 bg-blue-50 rounded border border-blue-200">
                      {language === 'hi' ? activeProject.statusHi : activeProject.status}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-950">
                    {language === 'hi' ? activeProject.nameHi : activeProject.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    <strong>{t('Lead Systems Architect:', 'प्रधान सिस्टम्स वास्तुकार:')}</strong>{' '}
                    {activeProject.leadArchitect} ({activeProject.leadArchitectRole})
                  </p>
                </div>

                <div className="text-left md:text-right space-y-1">
                  <div className="text-sm font-bold text-slate-900">
                    {language === 'hi' ? activeProject.sprintHi : activeProject.sprint}
                  </div>
                  <div className="text-xs font-semibold text-emerald-700">
                    {language === 'hi' ? activeProject.healthHi : activeProject.health}
                  </div>
                  <div className="text-[11px] font-mono text-slate-400">
                    {activeProject.targetSdk}
                  </div>
                </div>
              </div>

              {/* Progress Bar & Velocity Gauge */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span>{t('Total Contract Sprint Completion', 'कुल स्प्रिंट पूर्णता दर')}</span>
                  <span className="font-mono font-bold text-blue-700 text-sm">{activeProject.completion}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-blue-700 h-3 rounded-full transition-all duration-500 shadow-xs"
                    style={{ width: `${activeProject.completion}%` }}
                  />
                </div>
              </div>

              {/* Tech Stack Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-2">
                <span className="text-xs text-slate-500 font-medium mr-2">{t('Verified Tech Stack:', 'सत्यापित तकनीकी स्टैक:')}</span>
                {activeProject.stack.map((tech) => (
                  <span
                    key={tech}
                    className="px-2.5 py-1 text-xs font-mono font-medium bg-slate-50 border border-slate-200 text-slate-700 rounded-md"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            {/* Sprint Deliverables & Task Board */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h4 className="text-base font-bold text-slate-950">
                    {t('Current Sprint Tasks & Deliverables', 'वर्तमान स्प्रिंट कार्य एवं डिलीवरेबल्स')}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {t('Detailed engineering work items tracked in the active sprint cycle.', 'सक्रिय स्प्रिंट चक्र में ट्रैक किए जा रहे विस्तृत कार्य।')}
                  </p>
                </div>
                <span className="text-xs font-mono text-slate-500">
                  {sprintTasks.length} {t('Sprint Work Items', 'स्प्रिंट कार्य')}
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {sprintTasks.map((task) => (
                  <div key={task.id} className="py-3.5 space-y-1 hover:bg-slate-50/50 rounded-lg p-2 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                            task.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : task.status === 'in_progress'
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : 'bg-purple-50 text-purple-800 border-purple-200'
                          }`}
                        >
                          {language === 'hi' ? task.statusHi : task.status.replace('_', ' ')}
                        </span>
                        <h5 className="text-xs font-bold text-slate-900">
                          {language === 'hi' ? task.titleHi : task.title}
                        </h5>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
                        <span>{task.category}</span>
                        <span className="text-slate-400">·</span>
                        <span className="font-semibold text-slate-700">{task.assignee}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 pl-1 pt-0.5">
                      {task.deliverable}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
           TAB 2: MILESTONES ROADMAP
           ===================================================================== */}
        {activeTab === 'milestones' && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-950">
                  {t('Chronological Delivery Roadmap & Sign-Offs', 'कालानुक्रमिक वितरण रोडमैप एवं स्वीकृति')}
                </h3>
                <p className="text-xs text-slate-500">
                  {t(
                    'Formal milestone phases with verified acceptance criteria and client sign-off attestations.',
                    'स्वीकृति मानदंडों और औपचारिक क्लाइंट स्वीकृति के साथ माइलस्टोन चरण।'
                  )}
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                <span className="text-emerald-700 font-bold">
                  {milestonesList.filter((m) => m.status === 'completed').length} / {milestonesList.length} {t('Completed', 'पूर्ण')}
                </span>
              </div>
            </div>

            <div className="space-y-5">
              {milestonesList.map((m, idx) => (
                <div
                  key={m.id}
                  className={`p-5 rounded-xl border transition-all ${
                    m.status === 'completed'
                      ? 'border-emerald-200 bg-emerald-50/20'
                      : m.status === 'in_progress'
                      ? 'border-blue-300 bg-blue-50/20 shadow-xs'
                      : 'border-slate-200 bg-slate-50/40'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs font-mono ${
                          m.status === 'completed'
                            ? 'bg-emerald-600 text-white'
                            : m.status === 'in_progress'
                            ? 'bg-blue-700 text-white'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {m.number}
                      </span>
                      <div>
                        <h4 className="text-sm font-bold text-slate-950">
                          {language === 'hi' ? m.titleHi : m.title}
                        </h4>
                        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2 mt-0.5">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{t('Target:', 'लक्ष्य तिथि:')} {formatDate(m.targetDate)}</span>
                          {m.signOffBy && (
                            <>
                              <span className="text-slate-300">·</span>
                              <span className="text-emerald-700 font-semibold">{t('Signed:', 'स्वीकृत:')} {m.signOffBy}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded border ${
                          m.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : m.status === 'in_progress'
                            ? 'bg-blue-100 text-blue-800 border-blue-300'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {language === 'hi' ? m.statusHi : m.status.replace('_', ' ')}
                      </span>

                      {m.status === 'in_progress' && (
                        <button
                          onClick={() => handleSignOffMilestone(m.id)}
                          className="px-3 py-1 text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded border border-emerald-300 transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{t('Sign Off', 'स्वीकृति दें')}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 space-y-2">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                      {t('Verified Acceptance Deliverables', 'सत्यापित वितरण परिणाम')}
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      {(language === 'hi' ? m.deliverablesHi : m.deliverables).map((del, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-1.5 p-2 bg-white rounded border border-slate-100 text-xs text-slate-700"
                        >
                          <CheckCircle2
                            className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                              m.status === 'completed' ? 'text-emerald-600' : 'text-blue-600'
                            }`}
                          />
                          <span>{del}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =====================================================================
           TAB 3: PROJECT UPDATES & ACTIVITY FEED
           ===================================================================== */}
        {activeTab === 'updates' && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-950">
                  {t('Engineering Updates & Architecture Digests', 'इंजीनियरिंग अपडेट्स एवं आर्किटेक्चर सारांश')}
                </h3>
                <p className="text-xs text-slate-500">
                  {t(
                    'Direct communication stream from Principal Software Architect and Systems Engineering Pod.',
                    'प्रधान सॉफ्टवेयर वास्तुकार एवं सिस्टम्स इंजीनियरिंग दल द्वारा आधिकारिक तकनीकी सूचनाएं।'
                  )}
                </p>
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {['All', 'Release', 'Architecture', 'Security', 'Sprint Review'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setUpdateFilter(cat)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                      updateFilter === cat
                        ? 'bg-blue-700 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {filteredUpdates.map((up) => (
                <div
                  key={up.id}
                  className="p-5 rounded-lg border border-slate-200 bg-white hover:border-blue-300 transition-colors space-y-2"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wider font-mono">
                        {up.tag}
                      </span>
                      <h4 className="text-sm font-bold text-slate-950">
                        {language === 'hi' ? up.titleHi : up.title}
                      </h4>
                    </div>
                    <span className="text-xs font-mono text-slate-400">
                      {formatDate(up.timestamp)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {language === 'hi' ? up.summaryHi : up.summary}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span><strong>{up.author}</strong> ({up.authorRole})</span>
                    </div>
                    <span className="font-mono text-slate-400">{up.category}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =====================================================================
           TAB 4: DOCUMENT ACCESS & ARTIFACT VAULT
           ===================================================================== */}
        {activeTab === 'documents' && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-950">
                  {t('Cryptographically Verified Document Vault', 'सत्यापित कानूनी एवं तकनीकी दस्तावेज़ वॉल्ट')}
                </h3>
                <p className="text-xs text-slate-500">
                  {t(
                    'Perpetual IP Deeds, Master Services Agreements, Penetration Audit Reports, and Signed APK Releases.',
                    'स्थायी बौद्धिक संपदा विलेख, मुख्य अनुबंध, पेन-टेस्टिंग रिपोर्ट और हस्ताक्षरित एपीके बाइनरी।'
                  )}
                </p>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>{t('All 6 Artifacts Cryptographically Signed', 'सभी 6 दस्तावेज़ डिजिटल रूप से हस्ताक्षरित')}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {enterpriseDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="p-5 rounded-lg border border-slate-200 bg-white hover:border-blue-400 hover:shadow-xs transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                        {doc.format} · {doc.fileSize}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {language === 'hi' ? doc.statusHi : doc.status}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-950 line-clamp-1">
                      {language === 'hi' ? doc.titleHi : doc.title}
                    </h4>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {language === 'hi' ? doc.descriptionHi : doc.description}
                    </p>

                    <div className="text-[11px] text-slate-500 font-mono pt-1">
                      {t('Executed:', 'निष्पादन तिथि:')} {formatDate(doc.executedDate)}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        setSelectedDoc(doc);
                        setDocModalOpen(true);
                      }}
                      className="text-xs font-semibold text-slate-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{t('Verify Hash', 'हैश देखें')}</span>
                    </button>

                    <button
                      onClick={() => handleDownloadDocument(doc)}
                      className="px-3 py-1.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{t('Download', 'डाउनलोड')}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =====================================================================
           TAB 5: SUPPORT REQUESTS & SLA TICKETS
           ===================================================================== */}
        {activeTab === 'support' && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-950">
                  {t('Enterprise SLA Priority Support Tickets', 'एंटरप्राइज SLA प्राथमिकता सहायता टिकट')}
                </h3>
                <p className="text-xs text-slate-500">
                  {t(
                    'Direct Firestore integration with contractual SLA turnaround times (P1: <15 mins, P2: <2 hrs).',
                    'अनुबंधित SLA प्रतिक्रिया समय के साथ क्लाउड फायरस्टोर से सीधे जुड़ा सहायता केंद्र।'
                  )}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center border border-slate-200 rounded-md p-0.5 bg-slate-50 text-xs font-semibold">
                  <button
                    onClick={() => setTicketFilter('all')}
                    className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                      ticketFilter === 'all' ? 'bg-white shadow-xs text-blue-700' : 'text-slate-600'
                    }`}
                  >
                    {t('All', 'सभी')}
                  </button>
                  <button
                    onClick={() => setTicketFilter('open')}
                    className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                      ticketFilter === 'open' ? 'bg-white shadow-xs text-blue-700' : 'text-slate-600'
                    }`}
                  >
                    {t('Active', 'सक्रिय')}
                  </button>
                  <button
                    onClick={() => setTicketFilter('resolved')}
                    className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                      ticketFilter === 'resolved' ? 'bg-white shadow-xs text-blue-700' : 'text-slate-600'
                    }`}
                  >
                    {t('Resolved', 'हल किए गए')}
                  </button>
                </div>

                <button
                  onClick={() => setTicketModalOpen(true)}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t('New SLA Ticket', 'नया टिकट दर्ज करें')}</span>
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {filteredTickets.map((ticket) => {
                const isExpanded = expandedTicketId === ticket.id;
                const responses = ticket.responses || [];
                const attachment = ticket.attachment;

                return (
                  <div
                    key={ticket.id}
                    className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden transition-all hover:border-slate-300"
                  >
                    {/* Ticket Header & Summary */}
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
                            <span className="text-[10px] font-medium text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded hidden sm:inline-block">
                              {ticket.category}
                            </span>
                          )}
                          {ticket.projectCode && (
                            <span className="text-[10px] font-mono text-slate-500 hidden md:inline-block">
                              {ticket.projectCode}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleTicketStatus(ticket.id, ticket.status)}
                            className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 transition-colors cursor-pointer"
                          >
                            {ticket.status === 'resolved' ? t('Re-open', 'पुनः खोलें') : t('Mark Resolved', 'हल चिह्नित करें')}
                          </button>
                          <button
                            onClick={() => setExpandedTicketId(isExpanded ? null : ticket.id)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold"
                            title={isExpanded ? t('Collapse details', 'विवरण समेटें') : t('Expand conversation', 'बातचीत देखें')}
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-blue-700" />
                            <span className="hidden sm:inline">
                              {responses.length > 0 ? `${responses.length} ${t('replies', 'जवाब')}` : t('Reply', 'उत्तर')}
                            </span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
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

                      {/* Attached File Diagnostic / Document if present */}
                      {attachment && (attachment.fileName || attachment.downloadUrl || attachment.fileUrl) && (
                        <div className="mt-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
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
                              className="px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded transition-colors inline-flex items-center gap-1.5 shrink-0 self-start sm:self-auto cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>{t('Download Attachment', 'संलग्नक डाउनलोड करें')}</span>
                            </a>
                          )}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 font-mono pt-1 border-t border-slate-100">
                        <div>
                          {t('Logged:', 'दिनांक:')} {formatDate(ticket.createdAt)}
                          {ticket.environment && ` · ${ticket.environment}`}
                        </div>
                        {ticket.clientEmail && (
                          <div className="text-slate-500">
                            {ticket.clientEmail}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Expandable Conversation Thread & Follow-up Composer */}
                    {isExpanded && (
                      <div className="border-t border-slate-200 bg-slate-50/70 p-4 sm:p-5 space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <MessageSquare className="w-3.5 h-3.5 text-blue-700" />
                            <span>{t('Architect SLA Consultation Thread', 'आर्किटेक्ट SLA संवाद एवं प्रगति')}</span>
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono">
                            {responses.length} {t('replies logged', 'उत्तर दर्ज')}
                          </span>
                        </div>

                        {/* Thread history */}
                        {responses.length === 0 ? (
                          <div className="p-3 rounded-lg bg-white border border-slate-200 text-xs text-slate-500 italic">
                            {t(
                              'No architect responses logged yet. Lead architects acknowledge P1/P2 tickets in under 15 minutes.',
                              'अभी तक कोई आर्किटेक्ट जवाब दर्ज नहीं है। प्रधान वास्तुकार P1/P2 टिकटों को 15 मिनट में स्वीकृत करते हैं।'
                            )}
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
                                      ? 'bg-blue-50/60 border-blue-200/70 ml-2 sm:ml-4'
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

                        {/* Follow-up reply box */}
                        <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-2.5">
                          <label className="block text-xs font-bold text-slate-800">
                            {t('Post Follow-up Message / Additional Diagnostic Info', 'अनुवर्ती संदेश या अतिरिक्त निदान जानकारी भेजें')}
                          </label>
                          <textarea
                            rows={3}
                            value={replyTexts[ticket.id] || ''}
                            onChange={(e) =>
                              setReplyTexts((prev) => ({ ...prev, [ticket.id]: e.target.value }))
                            }
                            placeholder={t(
                              'Describe additional observations, crash traces, or request SLA status update...',
                              'अतिरिक्त अवलोकन, क्रैश विवरण या SLA स्थिति अपडेट दर्ज करें...'
                            )}
                            className="w-full text-xs p-2.5 border border-slate-200 rounded-md focus:outline-none focus:border-blue-700 font-sans"
                          />
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] text-slate-400">
                              {t('Guaranteed SLA response under contractual terms.', 'अनुबंधित शर्तों के तहत गारंटीकृत SLA प्रतिक्रिया।')}
                            </span>
                            <button
                              onClick={() => handleSendTicketReply(ticket.id)}
                              disabled={submittingReply[ticket.id] || !(replyTexts[ticket.id] || '').trim()}
                              className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 rounded transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                            >
                              {submittingReply[ticket.id] ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Send className="w-3.5 h-3.5" />
                              )}
                              <span>{t('Send Reply', 'उत्तर भेजें')}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =====================================================================
           TAB 6: CONTRACTUAL SLA & TELEMETRY
           ===================================================================== */}
        {activeTab === 'sla' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-slate-950 font-bold text-base pb-2 border-b border-slate-100">
                <Server className="w-5 h-5 text-blue-700" />
                <span>{t('Contractual High Availability SLA', 'अनुबंधित उच्च उपलब्धता SLA')}</span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {t(
                  'Bhanu Ram Bariha Digital Technologies guarantees 99.98% platform availability with financial penalty backing on enterprise contracts.',
                  'भानु राम बरीहा डिजिटल टेक्नोलॉजीज एंटरप्राइज अनुबंधों पर वित्तीय दंड संरक्षण के साथ 99.98% प्लेटफॉर्म उपलब्धता की गारंटी देती है।'
                )}
              </p>

              <div className="space-y-3 font-mono text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <span className="text-slate-600 font-sans">{t('Current Month Availability', 'वर्तमान माह उपलब्धता')}</span>
                  <span className="font-bold text-emerald-700">99.991%</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <span className="text-slate-600 font-sans">{t('Average P99 API Latency', 'औसत P99 एपीआई लेटेंसी')}</span>
                  <span className="font-bold text-slate-950">38ms</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <span className="text-slate-600 font-sans">{t('Mean Time To Resolution (MTTR)', 'औसत समाधान समय (MTTR)')}</span>
                  <span className="font-bold text-slate-950">&lt; 18 mins</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-sans">{t('Disaster Recovery RPO / RTO', 'आपदा रिकवरी RPO / RTO')}</span>
                  <span className="font-bold text-slate-950">RPO: 0s / RTO: 28s</span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-slate-950 font-bold text-base pb-2 border-b border-slate-100">
                <Lock className="w-5 h-5 text-blue-700" />
                <span>{t('Security & Regulatory Compliance', 'सुरक्षा एवं विनियामक अनुपालन')}</span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {t(
                  'Continuous automated vulnerability audits and cryptographic signature verification on all distributed microservices.',
                  'सभी वितरित माइक्रोसर्विस पर निरंतर स्वचालित भेद्यता ऑडिट और क्रिप्टोग्राफ़िक हस्ताक्षर सत्यापन।'
                )}
              </p>

              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-xs text-slate-700 p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{t('India DPDP Act 2023 Sovereign Data Residency Compliant', 'भारत DPDP अधिनियम 2023 संप्रभु डेटा स्थानीयकरण अनुपालन')}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-700 p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{t('TLS 1.3 Strict Mutual Authentication with Mutual TLS (mTLS)', 'mTLS के साथ TLS 1.3 सख्त दोतरफा प्रमाणीकरण')}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-700 p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{t('Automated Static Code Analysis (SonarQube Grade A)', 'स्वचालित स्थैतिक कोड विश्लेषण (सोनारक्विब ग्रेड A)')}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* =======================================================================
         MODALS
         ======================================================================= */}
      <NewTicketModal
        isOpen={ticketModalOpen}
        onClose={() => setTicketModalOpen(false)}
        defaultProjectCode={activeProject.code}
        onSuccess={(newTkt) => {
          setSupportTickets((prev) => [newTkt, ...prev]);
        }}
      />

      <DocumentDetailModal
        isOpen={docModalOpen}
        onClose={() => setDocModalOpen(false)}
        document={selectedDoc}
        onDownload={handleDownloadDocument}
      />
    </div>
  );
};
