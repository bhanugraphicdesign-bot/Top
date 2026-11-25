import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  BrainCircuit,
  Check,
  CheckCircle2,
  ChevronDown,
  Database,
  FileSearch,
  FileText,
  Info,
  Layers,
  Lock,
  Mail,
  Menu,
  MessageSquare,
  Phone,
  RotateCcw,
  Send,
  ShieldCheck,
  UserCheck,
  Users,
  Workflow,
  X,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { DemoPriceBar } from '../components/DemoPriceBar';
import { DemoLanguageToggle } from '../components/common/DemoLanguageToggle';

interface ArtificialIntelligenceDemoProps {
  onBackToHome: () => void;
  onRequestQuote: () => void;
}

interface AiService {
  id: string;
  number: string;
  image: string;
  titleHi: string;
  titleEn: string;
  shortDescHi: string;
  shortDescEn: string;
  scopeHi: string[];
  scopeEn: string[];
  idealForHi: string;
  idealForEn: string;
}

interface AgentStep {
  id: string;
  step: string;
  titleHi: string;
  titleEn: string;
  descHi: string;
  descEn: string;
}

interface ToolNode {
  id: string;
  labelHi: string;
  labelEn: string;
  roleHi: string;
  roleEn: string;
  icon: 'crm' | 'erp' | 'email' | 'whatsapp' | 'database' | 'docs';
}

interface IndustryCase {
  id: string;
  image: string;
  sectorHi: string;
  sectorEn: string;
  titleHi: string;
  titleEn: string;
  summaryHi: string;
  summaryEn: string;
  workflowHi: string[];
  workflowEn: string[];
}

interface SecurityPrinciple {
  id: string;
  icon: 'lock' | 'users' | 'approval' | 'audit';
  titleHi: string;
  titleEn: string;
  descHi: string;
  descEn: string;
}

interface AiPackage {
  id: string;
  nameHi: string;
  nameEn: string;
  priceHi: string;
  priceEn: string;
  highlighted?: boolean;
  subtitleHi: string;
  subtitleEn: string;
  featuresHi: string[];
  featuresEn: string[];
}

interface ProcessStep {
  step: string;
  titleHi: string;
  titleEn: string;
  descHi: string;
  descEn: string;
}

interface FaqItem {
  id: string;
  qHi: string;
  qEn: string;
  aHi: string;
  aEn: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  textHi: string;
  textEn: string;
  isSampleData?: boolean;
}

const SERVICES: AiService[] = [
  {
    id: 'ai-assistant',
    number: '01',
    image: '/demo/artificial-intelligence/ai-assistant.jpg',
    titleHi: 'AI चैट असिस्टेंट',
    titleEn: 'AI Chat Assistant',
    shortDescHi: 'आपकी कंपनी की नीतियों, उत्पाद कैटलॉग और आंतरिक दस्तावेज़ों से जुड़े स्मार्ट चैट असिस्टेंट।',
    shortDescEn: 'Domain-grounded AI chat assistants connected to your internal knowledge base and catalogs.',
    scopeHi: [
      'वेबसाइट, WhatsApp और आंतरिक पोर्टल के लिए चैट इंटरफ़ेस',
      'कंपनी दस्तावेज़ों (RAG) के आधार पर सटीक संदर्भ उत्तर',
      'हिन्दी और अंग्रेज़ी दोनों भाषाओं में स्वाभाविक बातचीत',
      'जटिल प्रश्नों को तुरंत मानव एजेंट को सौंपने की व्यवस्था',
    ],
    scopeEn: [
      'Chat interfaces for websites, WhatsApp, and internal portals',
      'Document-grounded responses powered by structured RAG indexing',
      'Bilingual Hindi and English conversational workflows',
      'Seamless handoff to human specialists for complex cases',
    ],
    idealForHi: 'सेल्स टीमें, हेल्पडेस्क, शिक्षा संस्थान और सर्विस व्यवसाय',
    idealForEn: 'Sales teams, helpdesks, institutions, and service enterprises',
  },
  {
    id: 'analytics',
    number: '02',
    image: '/demo/artificial-intelligence/analytics.jpg',
    titleHi: 'प्रेडिक्टिव एनालिटिक्स',
    titleEn: 'Predictive Analytics',
    shortDescHi: 'ऐतिहासिक सेल्स, इन्वेंटरी और मांग के पैटर्न को समझकर योजना बनाने में मदद करने वाले मॉडल।',
    shortDescEn: 'Forecasting dashboards that analyze historical sales, demand trends, and inventory cycles.',
    scopeHi: [
      'साप्ताहिक और मासिक मांग व स्टॉक अनुमान चार्ट',
      'असामान्य खर्च या गिरावट पर प्रारंभिक चेतावनी संकेत',
      'मौजूदा ERP व डेटाबेस से सुरक्षित डेटा पाइपलाइन',
      'प्रबंधन के लिए सरल और समझने योग्य रिपोर्ट दृश्य',
    ],
    scopeEn: [
      'Weekly and monthly demand and stock forecast views',
      'Early anomaly alerts for unusual dips or spikes',
      'Structured pipelines connected to existing ERP and databases',
      'Clear executive reporting summaries without clutter',
    ],
    idealForHi: 'रिटेल चेन, वितरण नेटवर्क और सप्लाई-चेन टीमें',
    idealForEn: 'Retail chains, distributors, and supply-chain operations',
  },
  {
    id: 'automation',
    number: '03',
    image: '/demo/artificial-intelligence/automation.jpg',
    titleHi: 'ऑटोनॉमस ऑटोमेशन और रोबोटिक्स',
    titleEn: 'Autonomous Automation & Robotics',
    shortDescHi: 'दोहराए जाने वाले मल्टी-स्टेप ऑपरेशन वर्कफ़्लो और इंडस्ट्रियल मॉनिटरिंग का सुरक्षित ऑटोमेशन।',
    shortDescEn: 'Multi-step operational workflow automation and smart telemetry with human review gates.',
    scopeHi: [
      'ईमेल, CRM और ERP के बीच स्वचालित टास्क रूटिंग',
      'महत्वपूर्ण चरणों से पहले मानव स्वीकृति (Approval Gate)',
      'सेंसर और उपकरण डेटा के आधार पर अलर्ट वर्कफ़्लो',
      'हर स्वचालित चरण का स्पष्ट ऑडिट रिकॉर्ड',
    ],
    scopeEn: [
      'Cross-tool task orchestration across email, CRM, and ERP',
      'Explicit human approval checkpoints before critical actions',
      'Sensor and equipment telemetry trigger workflows',
      'Complete trace logs for every automated execution step',
    ],
    idealForHi: 'मैन्युफैक्चरिंग इकाइयाँ, लॉजिस्टिक्स और ऑपरेशंस टीमें',
    idealForEn: 'Manufacturing plants, logistics operators, and back-office teams',
  },
  {
    id: 'support-ai',
    number: '04',
    image: '/demo/artificial-intelligence/support-ai.jpg',
    titleHi: 'कस्टमर सपोर्ट AI',
    titleEn: 'Customer Support AI',
    shortDescHi: 'टिकट वर्गीकरण, त्वरित ड्राफ़्ट उत्तर और ऑर्डर स्टेटस जाँच में सहायता करने वाला सपोर्ट AI।',
    shortDescEn: 'Automated ticket triage, draft replies, and order-status lookup assisting your support desk.',
    scopeHi: [
      'आने वाले टिकट की श्रेणी और प्राथमिकता का स्वचालित चयन',
      'सामान्य प्रश्नों (ऑर्डर, बिल, समय) के तुरंत उत्तर',
      'सपोर्ट स्टाफ़ के लिए संक्षिप्त चैट समरी और ड्राफ़्ट सुझाव',
      'ग्राहक संतुष्टि के लिए स्पष्ट एस्केलेशन नियम',
    ],
    scopeEn: [
      'Automatic ticket categorization and urgency routing',
      'Instant handling of routine order, billing, and FAQ queries',
      'Conversation summaries and suggested replies for human agents',
      'Clear escalation rules when personal assistance is required',
    ],
    idealForHi: 'ई-कॉमर्स, सास कंपनियाँ, टेलीकॉम और हॉस्पिटैलिटी',
    idealForEn: 'E-commerce, SaaS teams, telecom, and hospitality desks',
  },
  {
    id: 'document-ai',
    number: '05',
    image: '/demo/artificial-intelligence/document-ai.jpg',
    titleHi: 'डॉक्यूमेंट AI और OCR',
    titleEn: 'Document AI & OCR',
    shortDescHi: 'इनवॉइस, रसीद, फ़ॉर्म और अनुबंधों से संरचित डेटा निकालने और सत्यापित करने की प्रणाली।',
    shortDescEn: 'Intelligent OCR extraction for invoices, purchase orders, forms, and contracts with verification.',
    scopeHi: [
      'PDF और स्कैन किए गए बिल से आइटम, GST व कुल राशि निकालना',
      'संविदा व नीति दस्तावेज़ों का त्वरित सारांश',
      'अकाउंटिंग या ERP शीट में संरचित एक्सपोर्ट',
      'अस्पष्ट फ़ील्ड पर मानव समीक्षा के लिए हाइलाइट फ्लैग',
    ],
    scopeEn: [
      'Structured extraction of line items, dates, and totals from PDFs',
      'Rapid summarization of contracts and policy documents',
      'Clean structured export to accounting and ERP tables',
      'Review flags highlighting uncertain fields for human verification',
    ],
    idealForHi: 'फ़ाइनेंस विभाग, बैंकिंग, लॉजिस्टिक्स और स्वास्थ्य रिकॉर्ड टीमें',
    idealForEn: 'Finance departments, banking ops, logistics, and clinical records',
  },
  {
    id: 'infrastructure',
    number: '06',
    image: '/demo/artificial-intelligence/infrastructure.jpg',
    titleHi: 'AI इंफ्रास्ट्रक्चर और प्राइवेट मॉडल',
    titleEn: 'AI Infrastructure & Private Models',
    shortDescHi: 'एंटरप्राइज़ गोपनीयता के लिए प्राइवेट क्लाउड डिप्लॉयमेंट, वेक्टर डेटाबेस और एक्सेस नियंत्रण।',
    shortDescEn: 'Private cloud AI deployments, isolated vector databases, and strict enterprise access controls.',
    scopeHi: [
      'क्लाइंट के अपने क्लाउड वातावरण में प्राइवेट मॉडल होस्टिंग',
      'रोल-आधारित अनुमतियों के साथ सुरक्षित Vector DB सेटअप',
      'प्रॉम्प्ट गार्डरेल्स और डेटा लीकेज रोकथाम नीतियाँ',
      'निगरानी, लागत नियंत्रण और मॉडल वर्ज़न प्रबंधन',
    ],
    scopeEn: [
      'Private model deployment inside your designated cloud perimeter',
      'Isolated Vector DB indexing with role-scoped permissions',
      'Guardrails and data governance controls across prompts',
      'Usage monitoring, cost visibility, and controlled updates',
    ],
    idealForHi: 'बड़े एंटरप्राइज़, फ़ाइनेंस और संवेदनशील डेटा वाले संगठन',
    idealForEn: 'Enterprises, finance groups, and privacy-sensitive organizations',
  },
];

const AGENT_STEPS: AgentStep[] = [
  {
    id: 'understand',
    step: '01',
    titleHi: 'समझे (इनपुट)',
    titleEn: 'Understand (Input)',
    descHi: 'चैट, ईमेल, फ़ॉर्म या दस्तावेज़ से यूज़र के निर्देश और संदर्भ को स्पष्ट रूप से पढ़ता है।',
    descEn: 'Interprets requests and context from chat messages, emails, forms, or uploaded files.',
  },
  {
    id: 'plan',
    step: '02',
    titleHi: 'योजना बनाए',
    titleEn: 'Plan Steps',
    descHi: 'बड़े कार्य को छोटे, तर्कसंगत चरणों में बाँटता है और तय करता है कि कौन-सा टूल चाहिए।',
    descEn: 'Breaks complex goals into ordered steps and selects which business tools to query.',
  },
  {
    id: 'tools',
    step: '03',
    titleHi: 'टूल्स से काम करे',
    titleEn: 'Execute via Tools',
    descHi: 'अनुमति के दायरे में CRM, ERP, डेटाबेस या डॉक्यूमेंट्स से आवश्यक जानकारी लाता है।',
    descEn: 'Reads or prepares updates across permitted CRM, ERP, database, and document connectors.',
  },
  {
    id: 'approve',
    step: '04',
    titleHi: 'इंसान से मंज़ूरी / रिपोर्ट',
    titleEn: 'Human Approval & Report',
    descHi: 'महत्वपूर्ण बदलाव से पहले अधिकृत व्यक्ति की मंज़ूरी लेता है और साफ़ सारांश रिपोर्ट देता है।',
    descEn: 'Requests human sign-off before sensitive actions and delivers a clear audit summary.',
  },
];

const TOOL_NODES: ToolNode[] = [
  {
    id: 'crm',
    labelHi: 'CRM',
    labelEn: 'CRM',
    roleHi: 'लीड्स, ग्राहक इतिहास और फ़ॉलो-अप रिमाइंडर की जानकारी पढ़ना व ड्राफ़्ट करना।',
    roleEn: 'Reads lead status and customer history, and drafts structured follow-ups.',
    icon: 'crm',
  },
  {
    id: 'erp',
    labelHi: 'ERP',
    labelEn: 'ERP',
    roleHi: 'इन्वेंटरी स्तर, परचेज़ ऑर्डर और पेंडिंग इनवॉइस की स्थिति की जाँच करना।',
    roleEn: 'Checks live inventory quantities, purchase orders, and pending invoice statuses.',
    icon: 'erp',
  },
  {
    id: 'email',
    labelHi: 'ईमेल',
    labelEn: 'Email',
    roleHi: 'इनबॉक्स संदेशों का सारांश तैयार करना और मंज़ूरी के लिए उत्तर ड्राफ़्ट करना।',
    roleEn: 'Summarizes incoming threads and prepares clean response drafts for review.',
    icon: 'email',
  },
  {
    id: 'whatsapp',
    labelHi: 'WhatsApp',
    labelEn: 'WhatsApp',
    roleHi: 'ग्राहकों के सामान्य प्रश्नों और ऑर्डर अपडेट अनुरोधों का तुरंत जवाब देना।',
    roleEn: 'Handles routine customer questions and order status updates in real time.',
    icon: 'whatsapp',
  },
  {
    id: 'database',
    labelHi: 'डेटाबेस',
    labelEn: 'Database',
    roleHi: 'रीड-ओनली सुरक्षित क्वेरी द्वारा दैनिक सेल्स और स्टॉक रिपोर्ट तैयार करना।',
    roleEn: 'Runs scoped read-only queries to compile sales and operational summaries.',
    icon: 'database',
  },
  {
    id: 'docs',
    labelHi: 'डॉक्यूमेंट्स',
    labelEn: 'Documents',
    roleHi: 'PDF इनवॉइस, SOP और अनुबंधों में से ज़रूरी तथ्य व तारीखें खोजना।',
    roleEn: 'Searches SOPs, PDF invoices, and contracts to extract verified clauses and dates.',
    icon: 'docs',
  },
];

const SUGGESTED_PROMPTS = [
  {
    id: 'sales',
    labelHi: 'आज की सेल्स रिपोर्ट',
    labelEn: "Today's Sales Report",
    replyHi:
      'आज की नमूना सेल्स समरी:\n• कुल ऑर्डर: 48 (ऑनलाइन: 31 · डायरेक्ट: 17)\n• कुल बिक्री (नमूना): ₹1,42,800\n• शीर्ष श्रेणी: पैकेज्ड गुड्स व एक्सेसरीज़\n• नोट: शाम के शिफ्ट के बाद अंतिम मिलान के लिए मैनेजर अनुमोदन पेंडिंग है।',
    replyEn:
      "Today's Sample Sales Summary:\n• Total Orders: 48 (Online: 31 · Direct: 17)\n• Gross Sample Value: ₹1,42,800\n• Top Category: Packaged Goods & Accessories\n• Note: Final end-of-day reconciliation awaits manager approval.",
  },
  {
    id: 'invoices',
    labelHi: 'पेंडिंग इनवॉइस',
    labelEn: 'Pending Invoices',
    replyHi:
      'पेंडिंग इनवॉइस सूची (नमूना रिकॉर्ड):\n• INV-2041 — ₹28,500 (देय तिथि: कल)\n• INV-2044 — ₹16,200 (3 दिन शेष)\n• INV-2049 — ₹41,000 (समीक्षा में)\n• सुझाव: क्या आप इन ग्राहकों के लिए विनम्र रिमाइंडर ईमेल ड्राफ़्ट तैयार कराना चाहेंगे?',
    replyEn:
      'Pending Invoices List (Sample Records):\n• INV-2041 — ₹28,500 (Due tomorrow)\n• INV-2044 — ₹16,200 (Due in 3 days)\n• INV-2049 — ₹41,000 (Under review)\n• Action: Would you like me to draft polite payment reminder emails for human review?',
  },
  {
    id: 'stock',
    labelHi: 'कल का स्टॉक अनुमान',
    labelEn: "Tomorrow's Stock Forecast",
    replyHi:
      'कल के लिए नमूना स्टॉक अनुमान:\n• कम स्टॉक चेतावनी: SKU-108 (12 यूनिट शेष), SKU-214 (9 यूनिट शेष)\n• सामान्य स्तर: अन्य 34 मुख्य आइटम पर्याप्त उपलब्ध हैं\n• सुझाव: सप्लायर को भेजने से पहले परचेज़ ऑर्डर ड्राफ़्ट की मानव जाँच आवश्यक है।',
    replyEn:
      "Tomorrow's Sample Stock Forecast:\n• Low-Stock Watch: SKU-108 (12 units left), SKU-214 (9 units left)\n• Healthy Coverage: 34 other core SKUs remain within normal thresholds\n• Action: A draft restock order can be queued for human approval before dispatch.",
  },
];

const INDUSTRY_CASES: IndustryCase[] = [
  {
    id: 'work-healthcare',
    image: '/demo/artificial-intelligence/work-healthcare.jpg',
    sectorHi: 'हेल्थकेयर',
    sectorEn: 'Healthcare',
    titleHi: 'अपॉइंटमेंट और रिकॉर्ड सहायता',
    titleEn: 'Appointments & Records Assistance',
    summaryHi: 'मरीज़ों के अपॉइंटमेंट शेड्यूलिंग, रिमाइंडर और स्कैन किए गए मेडिकल दस्तावेज़ों को व्यवस्थित करने का नमूना उपयोग।',
    summaryEn: 'Sample workflow for patient appointment coordination, follow-up reminders, and structured clinical record summaries.',
    workflowHi: [
      'WhatsApp व वेब पर अपॉइंटमेंट स्लॉट सुझाव',
      'स्कैन रिपोर्ट को संरचित फ़ोल्डर में व्यवस्थित करना',
      'चिकित्सकीय फ़ैसले पूरी तरह डॉक्टर के नियंत्रण में',
    ],
    workflowEn: [
      'Appointment slot assistance on web & WhatsApp',
      'Organizing scanned records into structured charts',
      'All clinical decisions strictly remain with doctors',
    ],
  },
  {
    id: 'work-banking',
    image: '/demo/artificial-intelligence/work-banking.jpg',
    sectorHi: 'बैंकिंग और फ़ाइनेंस',
    sectorEn: 'Banking & Finance',
    titleHi: 'फ़्रॉड अलर्ट और दस्तावेज़ जाँच',
    titleEn: 'Fraud Alert Triage & Document Review',
    summaryHi: 'असामान्य लेन-देन पैटर्न को प्राथमिकता के साथ चिह्नित कर रिस्क टीम के सामने समीक्षा हेतु प्रस्तुत करने का नमूना।',
    summaryEn: 'Sample risk monitoring setup flagging unusual transaction patterns for immediate human compliance officer review.',
    workflowHi: [
      'संदिग्ध लेन-देन पैटर्न पर तुरंत अलर्ट फ़्लैग',
      'KYC व इनवॉइस दस्तावेज़ फ़ील्ड की प्रारंभिक जाँच',
      'खाता ब्लॉक या कार्रवाई से पहले अधिकारी की मंज़ूरी',
    ],
    workflowEn: [
      'Immediate triage flags for atypical transaction patterns',
      'Preliminary OCR checks across KYC and billing records',
      'Mandatory officer review before any account restriction',
    ],
  },
  {
    id: 'work-retail',
    image: '/demo/artificial-intelligence/work-retail.jpg',
    sectorHi: 'रिटेल और ई-कॉमर्स',
    sectorEn: 'Retail & E-Commerce',
    titleHi: 'सेल्स फ़ोरकास्ट और स्टॉक प्लानिंग',
    titleEn: 'Sales Forecasting & Stock Planning',
    summaryHi: 'त्योहारों और साप्ताहिक रुझानों के आधार पर स्टॉक री-ऑर्डर योजना और ग्राहक प्रश्नों के त्वरित उत्तर का नमूना।',
    summaryEn: 'Sample retail planning flow analyzing seasonal demand cycles and assisting customers with product discovery.',
    workflowHi: [
      'तेज़ी से बिकने वाले उत्पादों की साप्ताहिक सूची',
      'कम स्टॉक होने पर परचेज़ टीम को चेतावनी',
      'ग्राहक सहायता के लिए ऑर्डर स्टेटस चैट असिस्टेंट',
    ],
    workflowEn: [
      'Weekly visibility into fast-moving product categories',
      'Low-inventory alerts routed to procurement teams',
      'Automated order-status assistant for store customers',
    ],
  },
  {
    id: 'work-manufacturing',
    image: '/demo/artificial-intelligence/work-manufacturing.jpg',
    sectorHi: 'मैन्युफैक्चरिंग',
    sectorEn: 'Manufacturing',
    titleHi: 'मशीन मेंटेनेंस अलर्ट',
    titleEn: 'Machine Maintenance Monitoring',
    summaryHi: 'उपकरणों के तापमान, कंपन लॉग और सर्विस इतिहास के आधार पर रखरखाव शेड्यूल तैयार करने का नमूना उपयोग।',
    summaryEn: 'Sample plant diagnostics workflow tracking service logs and sensor readings to schedule preventive inspections.',
    workflowHi: [
      'मशीन सर्विस इतिहास और चेकलिस्ट का डिजिटल सारांश',
      'असामान्य रीडिंग पर मेंटेनेंस इंजीनियर को सूचना',
      'स्पेयर पार्ट्स स्टॉक और वर्क-ऑर्डर ड्राफ़्ट तैयारी',
    ],
    workflowEn: [
      'Digital summary of equipment logs and service history',
      'Prompt alerts sent to plant engineers on unusual readings',
      'Draft work orders and spare-part checks queued for review',
    ],
  },
];

const SECURITY_PRINCIPLES: SecurityPrinciple[] = [
  {
    id: 'ownership',
    icon: 'lock',
    titleHi: 'डेटा आपका ही रहेगा',
    titleEn: 'Your Data Stays Yours',
    descHi: 'आपकी कंपनी के दस्तावेज़ और रिकॉर्ड अलग-थलग प्राइवेट स्टोरेज में रहते हैं और किसी सार्वजनिक मॉडल की ट्रेनिंग में साझा नहीं होते।',
    descEn: 'Company records remain inside isolated private environments and are never shared to train public models.',
  },
  {
    id: 'rbac',
    icon: 'users',
    titleHi: 'रोल-आधारित एक्सेस',
    titleEn: 'Role-Based Access Control',
    descHi: 'हर विभाग और कर्मचारी को केवल उसकी भूमिका के अनुसार ही डेटा व AI टूल्स तक पहुँच मिलती है।',
    descEn: 'Each team member and agent only accesses the records and actions permitted by their assigned role.',
  },
  {
    id: 'approval',
    icon: 'approval',
    titleHi: 'ज़रूरी काम पर इंसानी मंज़ूरी',
    titleEn: 'Human Approval on Key Actions',
    descHi: 'भुगतान, ईमेल भेजने या महत्वपूर्ण रिकॉर्ड बदलने से पहले अधिकृत व्यक्ति की स्पष्ट सहमति अनिवार्य रखी जाती है।',
    descEn: 'Sensitive operations such as billing, external dispatch, or record changes pause for explicit human sign-off.',
  },
  {
    id: 'audit',
    icon: 'audit',
    titleHi: 'हर एक्शन का लॉग',
    titleEn: 'Complete Action Audit Log',
    descHi: 'एजेंट ने कब, क्या देखा और क्या सुझाव दिया — हर चरण का पारदर्शी इतिहास समीक्षा के लिए सुरक्षित रहता है।',
    descEn: 'Every query, tool call, and approval step is recorded in a transparent timeline for internal review.',
  },
];

const PACKAGES: AiPackage[] = [
  {
    id: 'starter',
    nameHi: 'स्टार्टर',
    nameEn: 'Starter',
    priceHi: '₹29,999',
    priceEn: '₹29,999',
    subtitleHi: 'ग्राहक पूछताछ और बेसिक ऑटोमेशन की शुरुआत के लिए',
    subtitleEn: 'Ideal starting point for customer chat assistance',
    featuresHi: [
      'एक कस्टम AI चैटबॉट',
      'वेबसाइट या WhatsApp इंटीग्रेशन',
      'कंपनी FAQ व डॉक्यूमेंट नॉलेज सेटअप',
      'हिन्दी / English बातचीत सपोर्ट',
    ],
    featuresEn: [
      'One custom AI chat assistant',
      'Website or WhatsApp channel integration',
      'Company FAQ & document knowledge indexing',
      'Bilingual Hindi / English support',
    ],
  },
  {
    id: 'business',
    nameHi: 'बिज़नेस',
    nameEn: 'Business',
    priceHi: '₹74,999',
    priceEn: '₹74,999',
    highlighted: true,
    subtitleHi: 'सेल्स, सपोर्ट और ऑपरेशंस को जोड़ने वाली टीमों के लिए',
    subtitleEn: 'Connected agents for sales, support, and ops teams',
    featuresHi: [
      '2 विशेषज्ञ AI एजेंट (सपोर्ट + एनालिटिक्स)',
      'CRM व डॉक्यूमेंट कनेक्शन',
      'निगरानी और रिपोर्टिंग डैशबोर्ड',
      'इंसानी मंज़ूरी व रोल-आधारित एक्सेस',
    ],
    featuresEn: [
      '2 specialized AI agents (Support + Analytics)',
      'CRM and document pipeline connections',
      'Operations & reporting dashboard',
      'Human approval gates & role-based access',
    ],
  },
  {
    id: 'enterprise',
    nameHi: 'एंटरप्राइज़',
    nameEn: 'Enterprise',
    priceHi: 'कस्टम कोट',
    priceEn: 'Custom Quote',
    subtitleHi: 'बड़े संगठनों और प्राइवेट AI इंफ्रास्ट्रक्चर के लिए',
    subtitleEn: 'Tailored private AI infrastructure for enterprises',
    featuresHi: [
      'प्राइवेट मॉडल और आइसोलेटेड क्लाउड सेटअप',
      'मल्टी-स्टेप ऑटोनॉमस वर्कफ़्लो (ERP/CRM)',
      'संपूर्ण ऑडिट लॉग और सुरक्षा नीतियाँ',
      'समर्पित टीम ट्रेनिंग और रोलआउट सहयोग',
    ],
    featuresEn: [
      'Private model & isolated cloud architecture',
      'Multi-step autonomous workflows (ERP/CRM)',
      'Full audit logging & governance guardrails',
      'Dedicated team onboarding & training',
    ],
  },
];

const PROCESS_STEPS: ProcessStep[] = [
  {
    step: '01',
    titleHi: 'ज़रूरत समझना',
    titleEn: 'Understand Needs',
    descHi: 'बिज़नेस वर्कफ़्लो, समय लेने वाले कार्य और स्पष्ट लक्ष्य तय करना।',
    descEn: 'Identifying repetitive workflows, goals, and clear boundaries for AI.',
  },
  {
    step: '02',
    titleHi: 'डेटा तैयारी',
    titleEn: 'Data Preparation',
    descHi: 'मौजूदा दस्तावेज़ों, तालिकाओं और एक्सेस अनुमतियों को सुरक्षित ढंग से व्यवस्थित करना।',
    descEn: 'Cleaning documents, structuring knowledge sources, and setting access rules.',
  },
  {
    step: '03',
    titleHi: 'एजेंट बनाना',
    titleEn: 'Build Agent',
    descHi: 'टूल कनेक्टर, RAG पाइपलाइन और इंसानी मंज़ूरी चरणों के साथ एजेंट तैयार करना।',
    descEn: 'Developing the agent, tool connectors, RAG index, and approval checkpoints.',
  },
  {
    step: '04',
    titleHi: 'पायलट टेस्ट',
    titleEn: 'Pilot Testing',
    descHi: 'सीमित टीम के साथ वास्तविक परिदृश्यों पर परीक्षण और सुधार करना।',
    descEn: 'Validating outputs on controlled workflows with real team reviewers.',
  },
  {
    step: '05',
    titleHi: 'लॉन्च और निगरानी',
    titleEn: 'Launch & Monitoring',
    descHi: 'लाइव डिप्लॉयमेंट, लॉग समीक्षा और समय के साथ निरंतर बेहतर बनाना।',
    descEn: 'Production rollout with continuous audit logs and human-guided tuning.',
  },
];

const TECH_CHIPS = ['Python', 'LLM', 'RAG', 'Vector DB', 'Firebase', 'Cloud'];

const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'what-is-agent',
    qHi: 'AI एजेंट क्या है?',
    qEn: 'What is an AI Agent?',
    aHi: 'साधारण चैटबॉट केवल तय सवालों के जवाब देता है, जबकि AI एजेंट निर्देश को समझकर चरणबद्ध योजना बनाता है और अनुमति के अनुसार CRM, डॉक्यूमेंट्स या रिपोर्ट जैसे टूल्स के साथ काम करके सारांश या ड्राफ़्ट तैयार करता है। (यह जानकारी डेमो के लिए है।)',
    aEn: 'Unlike a basic FAQ bot, an AI agent interprets a goal, plans steps, and interacts with approved tools like CRM, documents, or reports to prepare outputs under human supervision. (Demo explanation.)',
  },
  {
    id: 'data-safety',
    qHi: 'मेरा डेटा सुरक्षित रहेगा?',
    qEn: 'Will my business data remain secure?',
    aHi: 'एंटरप्राइज़ डिज़ाइन में आपका डेटा अलग प्राइवेट स्टोरेज और रोल-आधारित एक्सेस के भीतर रखा जाता है। किस उपयोगकर्ता को कौन-सा डेटा दिखेगा, यह पहले से तय रहता है। (यह एक डेमो वेबसाइट है — यहाँ कोई वास्तविक डेटा स्टोर नहीं होता।)',
    aEn: 'In enterprise architectures, business data is kept in isolated storage with role-based permissions so users and agents only access authorized records. (This demo itself stores no data.)',
  },
  {
    id: 'timeline',
    qHi: 'कितना समय लगेगा?',
    qEn: 'How long does implementation take?',
    aHi: 'डेमो उदाहरण के तौर पर, एक बेसिक AI चैट असिस्टेंट लगभग 2 से 3 सप्ताह में और CRM/ERP से जुड़ा कस्टम ऑटोनॉमस वर्कफ़्लो दायरे के अनुसार 4 से 8 सप्ताह में पायलट के लिए तैयार हो सकता है।',
    aEn: 'As a general demo reference, a focused AI assistant typically reaches pilot stage in 2 to 3 weeks, while custom multi-tool enterprise workflows take 4 to 8 weeks depending on scope.',
  },
  {
    id: 'mistakes',
    qHi: 'क्या एजेंट गलती कर सकता है?',
    qEn: 'Can an AI agent make mistakes?',
    aHi: 'हाँ — कोई भी AI मॉडल कभी-कभी अधूरी या गलत जानकारी का अनुमान लगा सकता है। इसी कारण एंटरप्राइज़ सेटअप में स्पष्ट नियम, दस्तावेज़-आधारित उत्तर (RAG), हर एक्शन का लॉग और महत्वपूर्ण फ़ैसलों पर इंसानी निगरानी व मंज़ूरी अनिवार्य रखी जाती है।',
    aEn: 'Yes — AI systems can occasionally misinterpret context or make errors. That is why enterprise setups enforce document grounding (RAG), full audit logs, and mandatory human approval before critical actions.',
  },
];

// Lightweight deterministic particle coordinates (pure CSS transform/opacity)
const HERO_PARTICLES = [
  { left: '8%', top: '22%', size: 4, dur: '9s', delay: '0s' },
  { left: '19%', top: '68%', size: 3, dur: '11s', delay: '1.2s' },
  { left: '31%', top: '30%', size: 5, dur: '12s', delay: '0.5s' },
  { left: '44%', top: '76%', size: 3, dur: '10s', delay: '2s' },
  { left: '56%', top: '18%', size: 4, dur: '13s', delay: '0.8s' },
  { left: '67%', top: '62%', size: 5, dur: '9.5s', delay: '1.5s' },
  { left: '78%', top: '28%', size: 3, dur: '11.5s', delay: '0.3s' },
  { left: '88%', top: '72%', size: 4, dur: '10.5s', delay: '2.2s' },
  { left: '24%', top: '48%', size: 3, dur: '12.5s', delay: '1.8s' },
  { left: '72%', top: '44%', size: 4, dur: '10s', delay: '0.9s' },
  { left: '92%', top: '38%', size: 3, dur: '11s', delay: '1.4s' },
  { left: '13%', top: '82%', size: 4, dur: '13s', delay: '0.6s' },
];

const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: 'welcome',
    sender: 'agent',
    textHi:
      'नमस्ते! मैं एक नमूना एंटरप्राइज़ AI एजेंट हूँ। नीचे दिए गए सुझाव चुनें या कोई संदेश लिखें — यह 100% लोकल डेमो है।',
    textEn:
      'Hello! I am a sample enterprise AI agent preview. Choose a prompt below or type a message — this runs 100% locally with sample data.',
    isSampleData: true,
  },
];

/**
 * Scroll-reveal wrapper using compositor-only transform & opacity.
 */
const RevealSection: React.FC<{
  children: React.ReactNode;
  className?: string;
  id?: string;
}> = ({ children, className = '', id }) => {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      setVisible(true);
      return;
    }
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced || !('IntersectionObserver' in window)) {
      setVisible(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -30px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id={id}
      ref={ref}
      className={`transition-[opacity,transform] duration-500 ease-out will-change-[opacity,transform] ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      } ${className}`}
    >
      {children}
    </section>
  );
};

export const ArtificialIntelligenceDemo: React.FC<ArtificialIntelligenceDemoProps> = ({
  onBackToHome,
  onRequestQuote,
}) => {
  const { language, setLanguage } = useLanguage();
  const isHi = language === 'hi';

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeServiceModal, setActiveServiceModal] = useState<AiService | null>(null);
  const [activeIndustryModal, setActiveIndustryModal] = useState<IndustryCase | null>(null);
  const [activeAgentStep, setActiveAgentStep] = useState<number>(0);
  const [activeToolId, setActiveToolId] = useState<string>('crm');
  const [openFaqId, setOpenFaqId] = useState<string>('what-is-agent');
  const [demoToast, setDemoToast] = useState<string | null>(null);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  // Local-only Sample AI Chat state (ZERO Gemini/OpenAI API calls, ZERO keys, ZERO Firestore)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(INITIAL_CHAT_MESSAGES);
  const [chatInput, setChatInput] = useState('');
  const [isAgentTyping, setIsAgentTyping] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);

  // Local-only Demo Booking Form state (ZERO Firestore / ZERO API calls)
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    mobile: '',
    industry: '',
    aiPurpose: '',
    message: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);

  // Gentle auto-advance on 4-step Agent Flow (respects prefers-reduced-motion)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;
    const interval = window.setInterval(() => {
      setActiveAgentStep((prev) => (prev + 1) % AGENT_STEPS.length);
    }, 3400);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, isAgentTyping]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current !== null) {
        window.clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!demoToast) return;
    const timer = window.setTimeout(() => setDemoToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [demoToast]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveServiceModal(null);
        setActiveIndustryModal(null);
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const showDemoToast = (msgHi: string, msgEn: string) => {
    setDemoToast(isHi ? msgHi : msgEn);
  };

  const scrollToSection = (sectionId: string) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const markImageBroken = (key: string) => {
    setBrokenImages((prev) => ({ ...prev, [key]: true }));
  };

  const activeTool = TOOL_NODES.find((t) => t.id === activeToolId) || TOOL_NODES[0];

  const handleSuggestedPrompt = (prompt: (typeof SUGGESTED_PROMPTS)[number]) => {
    if (isAgentTyping) return;
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      textHi: prompt.labelHi,
      textEn: prompt.labelEn,
    };
    setChatMessages((prev) => [...prev, userMsg]);
    setIsAgentTyping(true);

    if (typingTimeoutRef.current !== null) {
      window.clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = window.setTimeout(() => {
      const botMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        sender: 'agent',
        textHi: prompt.replyHi,
        textEn: prompt.replyEn,
        isSampleData: true,
      };
      setChatMessages((prev) => [...prev, botMsg]);
      setIsAgentTyping(false);
    }, 700);
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = chatInput.trim();
    if (!trimmed || isAgentTyping) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      textHi: trimmed,
      textEn: trimmed,
    };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setIsAgentTyping(true);

    if (typingTimeoutRef.current !== null) {
      window.clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = window.setTimeout(() => {
      const botMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        sender: 'agent',
        textHi: 'यह डेमो है — असली एजेंट आपके डेटा से जुड़कर जवाब देगा।',
        textEn:
          'This is a demo — a live enterprise agent will connect to your business data to answer.',
        isSampleData: true,
      };
      setChatMessages((prev) => [...prev, botMsg]);
      setIsAgentTyping(false);
    }, 650);
  };

  const handleResetChat = () => {
    if (typingTimeoutRef.current !== null) {
      window.clearTimeout(typingTimeoutRef.current);
    }
    setIsAgentTyping(false);
    setChatInput('');
    setChatMessages(INITIAL_CHAT_MESSAGES);
  };

  const handleSelectPackage = (pkg: AiPackage) => {
    setFormData((prev) => ({
      ...prev,
      message: isHi
        ? `${pkg.nameHi} पैकेज (${pkg.priceHi}) के लिए एंटरप्राइज़ AI डेमो बुक करना है।`
        : `Interested in booking a demo for the ${pkg.nameEn} package (${pkg.priceEn}).`,
    }));
    setFormError(null);
    setFormSuccess(false);
    scrollToSection('ai-contact');
  };

  const handleServiceConsult = (service: AiService) => {
    setActiveServiceModal(null);
    setFormData((prev) => ({
      ...prev,
      message: isHi
        ? `${service.titleHi} के लिए डेमो और कार्य-दायरा समझना है।`
        : `I would like a demo and scope discussion for ${service.titleEn}.`,
    }));
    setFormError(null);
    setFormSuccess(false);
    scrollToSection('ai-contact');
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(false);

    const trimmedName = formData.name.trim();
    const trimmedCompany = formData.company.trim();
    const digitsOnly = formData.mobile.replace(/\D/g, '');
    const trimmedMessage = formData.message.trim();

    if (trimmedName.length < 2) {
      setFormError(isHi ? 'कृपया अपना सही नाम लिखें।' : 'Please enter your full name.');
      return;
    }
    if (trimmedCompany.length < 2) {
      setFormError(isHi ? 'कृपया कंपनी या संगठन का नाम लिखें।' : 'Please enter your company or organization name.');
      return;
    }
    if (digitsOnly.length < 10) {
      setFormError(
        isHi ? 'कृपया 10 अंकों का सही मोबाइल नंबर दर्ज करें।' : 'Please enter a valid 10-digit mobile number.'
      );
      return;
    }
    if (!formData.industry) {
      setFormError(isHi ? 'कृपया अपना उद्योग चुनें।' : 'Please select your industry.');
      return;
    }
    if (!formData.aiPurpose) {
      setFormError(isHi ? 'कृपया चुनें कि AI किस काम के लिए चाहिए।' : 'Please select your intended AI use case.');
      return;
    }
    if (trimmedMessage.length < 5) {
      setFormError(
        isHi ? 'कृपया अपनी आवश्यकता के बारे में संक्षिप्त संदेश लिखें।' : 'Please write a brief message describing your requirement.'
      );
      return;
    }

    // Strictly local state — NO Firestore write and NO API call
    setFormSuccess(true);
  };

  const renderToolIcon = (icon: ToolNode['icon'], cls = 'w-4 h-4') => {
    switch (icon) {
      case 'crm':
        return <Users className={cls} />;
      case 'erp':
        return <Layers className={cls} />;
      case 'email':
        return <Mail className={cls} />;
      case 'whatsapp':
        return <MessageSquare className={cls} />;
      case 'database':
        return <Database className={cls} />;
      case 'docs':
        return <FileText className={cls} />;
    }
  };

  const renderSecurityIcon = (icon: SecurityPrinciple['icon']) => {
    const cls = 'w-5 h-5';
    switch (icon) {
      case 'lock':
        return <Lock className={cls} />;
      case 'users':
        return <Users className={cls} />;
      case 'approval':
        return <UserCheck className={cls} />;
      case 'audit':
        return <FileSearch className={cls} />;
    }
  };

  const navLinks = [
    { id: 'ai-home', hi: 'होम', en: 'Home' },
    { id: 'ai-services', hi: 'सेवाएँ', en: 'Services' },
    { id: 'ai-agents', hi: 'एजेंट्स', en: 'Agents' },
    { id: 'ai-industries', hi: 'उद्योग', en: 'Industries' },
    { id: 'ai-security', hi: 'सुरक्षा', en: 'Security' },
    { id: 'ai-process', hi: 'प्रक्रिया', en: 'Process' },
    { id: 'ai-contact', hi: 'संपर्क', en: 'Contact' },
  ];

  return (
    <div
      className="min-h-screen bg-[#040711] text-slate-100 antialiased selection:bg-cyan-400 selection:text-[#040711]"
      style={{
        backgroundImage:
          'linear-gradient(to right, rgba(148,163,184,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.04) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
      }}
    >
      {/* Lightweight CSS particle keyframes (compositor-only, respects reduced motion) */}
      <style>{`
        @keyframes aiParticleDrift {
          0%, 100% { transform: translate3d(0px, 0px, 0); opacity: 0.25; }
          50% { transform: translate3d(10px, -18px, 0); opacity: 0.72; }
        }
        @media (prefers-reduced-motion: reduce) {
          .ai-particle { animation: none !important; }
        }
      `}</style>

      {/* Unified Sticky Top Wrapper (DEMO Disclaimer Bar + Enterprise AI Header) */}
      <div className="sticky top-0 z-40">
        {/* Top DEMO Disclaimer Bar */}
        <div className="bg-[#090e20] border-b border-cyan-400/25 px-3 sm:px-6 py-2">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="inline-block px-2 py-0.5 rounded bg-cyan-400/15 border border-cyan-400/35 text-[10px] font-bold tracking-wider text-cyan-200 uppercase shrink-0">
                DEMO
              </span>
              <p className="text-[11px] sm:text-xs font-medium text-slate-200 truncate">
                {isHi
                  ? 'DEMO वेबसाइट — यह केवल नमूना है'
                  : 'DEMO Website — This is a sample preview only'}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <DemoLanguageToggle
                language={language}
                onChange={setLanguage}
                tone="dark"
              />
              <button
                type="button"
                onClick={onBackToHome}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded bg-white/10 hover:bg-white/20 text-[11px] sm:text-xs font-semibold text-white transition-colors cursor-pointer whitespace-nowrap"
              >
                <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">
                  {isHi ? 'Power Web Studio AI पर वापस' : 'Back to Power Web Studio AI'}
                </span>
                <span className="sm:hidden">{isHi ? 'वापस' : 'Back'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* MRP Price Bar */}
        <DemoPriceBar slug="artificial-intelligence" />

        {/* Navigation Header */}
        <header className="bg-[#040711]/88 backdrop-blur-xl border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
            {/* Brand Wordmark */}
            <button
              type="button"
              onClick={() => scrollToSection('ai-home')}
              className="flex items-center gap-2.5 text-left cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-lg"
            >
              <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center shadow-[0_0_18px_rgba(6,182,212,0.35)]">
                <BrainCircuit className="w-5 h-5 text-white" />
              </span>
              <span className="text-sm sm:text-base font-extrabold tracking-tight text-white">
                ARTIFICIAL INTELLIGENCE
              </span>
            </button>

            {/* Desktop Nav */}
            <nav className="hidden xl:flex items-center gap-5 text-sm font-medium text-slate-300">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => scrollToSection(link.id)}
                  className="hover:text-cyan-300 transition-colors cursor-pointer whitespace-nowrap shrink-0 py-1"
                >
                  {isHi ? link.hi : link.en}
                </button>
              ))}
            </nav>

            {/* Right CTA & Mobile Menu Toggle */}
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => scrollToSection('ai-contact')}
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white text-xs sm:text-sm font-semibold transition-all duration-200 hover:shadow-[0_0_24px_rgba(6,182,212,0.45)] cursor-pointer whitespace-nowrap"
              >
                {isHi ? 'डेमो बुक करें' : 'Book Demo'}
              </button>
              <button
                type="button"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                className="xl:hidden w-10 h-10 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 flex items-center justify-center text-white cursor-pointer"
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Drawer */}
          {mobileMenuOpen && (
            <div className="xl:hidden border-t border-white/10 bg-[#070c1b] px-4 py-4 space-y-1.5">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => scrollToSection(link.id)}
                  className="block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-slate-200 hover:bg-white/10 hover:text-cyan-300 transition-colors cursor-pointer"
                >
                  {isHi ? link.hi : link.en}
                </button>
              ))}
              <button
                type="button"
                onClick={() => scrollToSection('ai-contact')}
                className="w-full mt-2 px-4 py-3 rounded-lg bg-gradient-to-r from-violet-600 to-cyan-500 text-white text-sm font-semibold cursor-pointer"
              >
                {isHi ? 'डेमो बुक करें' : 'Book Demo'}
              </button>
            </div>
          )}
        </header>
      </div>

      {/* 1. HERO SECTION (hero.jpg + dark scrim + slow lightweight CSS particles) */}
      <section
        id="ai-home"
        className="relative overflow-hidden border-b border-white/10 min-h-[550px] sm:min-h-[610px] flex items-center"
      >
        <div className="absolute inset-0">
          {!brokenImages['hero'] ? (
            <img
              src="/demo/artificial-intelligence/hero.jpg"
              alt={isHi ? 'एंटरप्राइज़ एआई और ऑटोनॉमस एजेंट्स' : 'Enterprise AI & Autonomous Agents'}
              referrerPolicy="no-referrer"
              onError={() => markImageBroken('hero')}
              className="w-full h-full object-cover object-center"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#040711] via-[#10132e] to-[#081d2c]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-[#040711]/95 via-[#060a19]/85 to-[#061322]/72" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#040711] via-transparent to-[#040711]/45" />
        </div>

        {/* Subtle lightweight floating particles */}
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden">
          {HERO_PARTICLES.map((p, idx) => (
            <span
              key={idx}
              className="ai-particle absolute rounded-full bg-cyan-300/60"
              style={{
                left: p.left,
                top: p.top,
                width: `${p.size}px`,
                height: `${p.size}px`,
                animation: `aiParticleDrift ${p.dur} ease-in-out ${p.delay} infinite`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 w-full">
          <div className="max-w-3xl space-y-6">
            <p className="text-xs sm:text-sm font-semibold tracking-wide text-cyan-300">
              {isHi
                ? 'एंटरप्राइज़ एआई और ऑटोनॉमस एजेंट्स'
                : 'Enterprise AI & Autonomous Agents'}
            </p>

            <h1 className="text-3xl sm:text-5xl lg:text-[3.5rem] font-extrabold tracking-tight text-white leading-[1.12] [text-wrap:balance]">
              {isHi
                ? 'आपके बिज़नेस के लिए काम करने वाले AI एजेंट'
                : 'AI Agents Built to Work for Your Business'}
            </h1>

            <p className="text-base sm:text-xl font-medium text-slate-200 max-w-2xl leading-relaxed">
              {isHi
                ? 'सोचें, फ़ैसला लें और काम पूरा करें — इंसानी निगरानी के साथ'
                : 'Reason, plan, and execute operational workflows — with human oversight'}
            </p>

            <div className="flex flex-wrap items-center gap-3.5 pt-3">
              <button
                type="button"
                onClick={() => scrollToSection('ai-demo-chat')}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white text-sm sm:text-base font-semibold transition-all duration-200 hover:shadow-[0_0_28px_rgba(6,182,212,0.5)] cursor-pointer whitespace-nowrap"
              >
                {isHi ? 'AI एजेंट आज़माएँ' : 'Try AI Agent'}
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('ai-services')}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.13] backdrop-blur-md border border-white/15 text-white text-sm sm:text-base font-semibold transition-colors cursor-pointer whitespace-nowrap"
              >
                {isHi ? 'सेवाएँ देखें' : 'Explore Services'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SERVICES SECTION (6 Real Photo Cards + Scope Modal) */}
      <RevealSection id="ai-services" className="py-16 sm:py-24 px-4 sm:px-6 border-b border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl mb-12 space-y-3">
            <p className="text-xs sm:text-sm font-semibold text-cyan-300">
              {isHi ? 'एंटरप्राइज़ AI सेवाएँ' : 'Enterprise AI Services'}
            </p>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white [text-wrap:balance]">
              {isHi
                ? 'व्यावहारिक और सुरक्षित एंटरप्राइज़ AI समाधान'
                : 'Practical, Governed AI Capabilities for Modern Teams'}
            </h2>
            <p className="text-sm sm:text-base text-slate-300">
              {isHi
                ? 'किसी भी सेवा पर “और जानें” दबाकर कार्य-दायरा और उपयोग विस्तार से देखें।'
                : 'Select “Learn More” on any service card to review scope and deliverables.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.map((service) => (
              <article
                key={service.id}
                className="group rounded-2xl bg-white/[0.035] backdrop-blur-md border border-white/10 hover:border-cyan-400/45 overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-0.5"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-[#0a1024]">
                  {!brokenImages[service.id] ? (
                    <img
                      src={service.image}
                      alt={isHi ? service.titleHi : service.titleEn}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      onError={() => markImageBroken(service.id)}
                      className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0e132c] to-[#0a2232] text-cyan-300 text-sm font-semibold">
                      {isHi ? service.titleHi : service.titleEn}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#040711]/75 via-transparent to-transparent" />
                </div>

                <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between gap-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-white tracking-tight">
                      {service.number}. {isHi ? service.titleHi : service.titleEn}
                    </h3>
                    <p className="text-sm text-slate-300 leading-relaxed line-clamp-2">
                      {isHi ? service.shortDescHi : service.shortDescEn}
                    </p>
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={() => setActiveServiceModal(service)}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-cyan-300 hover:text-white transition-colors cursor-pointer"
                    >
                      {isHi ? 'और जानें' : 'Learn More'}
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* 3. HOW AN AUTONOMOUS AGENT WORKS (4-Step Animated Flow + 6 Connected Tool Nodes) */}
      <RevealSection
        id="ai-agents"
        className="py-16 sm:py-24 px-4 sm:px-6 border-b border-white/10 bg-[#070b18]/90"
      >
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <p className="text-xs sm:text-sm font-semibold text-violet-300">
              {isHi ? 'ऑटोनॉमस एजेंट आर्किटेक्चर' : 'Autonomous Agent Workflow'}
            </p>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white [text-wrap:balance]">
              {isHi ? 'ऑटोनॉमस एजेंट कैसे काम करता है' : 'How an Autonomous Agent Operates'}
            </h2>
            <p className="text-sm sm:text-base text-slate-300">
              {isHi
                ? 'इनपुट समझने से लेकर इंसान की मंज़ूरी तक — हर चरण स्पष्ट और नियंत्रित रहता है।'
                : 'From understanding an input to human sign-off — every execution stage stays structured and reviewable.'}
            </p>
          </div>

          {/* 4-Step Animated Flow */}
          <div className="relative">
            <div
              aria-hidden="true"
              className="hidden lg:block absolute top-8 left-12 right-12 h-[2px] bg-gradient-to-r from-violet-500/35 via-cyan-400/55 to-violet-500/35"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {AGENT_STEPS.map((item, idx) => {
                const isActive = idx === activeAgentStep;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveAgentStep(idx)}
                    className={`relative text-left rounded-2xl p-6 backdrop-blur-md border transition-all duration-300 cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-b from-violet-950/60 to-cyan-950/35 border-cyan-400/70 shadow-[0_0_28px_rgba(6,182,212,0.2)] -translate-y-0.5'
                        : 'bg-white/[0.035] border-white/10 hover:border-white/25'
                    }`}
                  >
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center text-sm font-extrabold tabular-nums mb-4 transition-colors ${
                        isActive
                          ? 'bg-gradient-to-br from-violet-500 to-cyan-400 text-[#040711]'
                          : 'bg-white/[0.07] text-cyan-300 border border-white/10'
                      }`}
                    >
                      {item.step}
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-white mb-2">
                      {isHi ? item.titleHi : item.titleEn}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      {isHi ? item.descHi : item.descEn}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Connected Tool Nodes (CRM, ERP, Email, WhatsApp, Database, Documents) */}
          <div className="rounded-2xl bg-white/[0.035] backdrop-blur-md border border-white/10 p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <Workflow className="w-5 h-5 text-cyan-300" />
                <h3 className="text-base sm:text-lg font-bold text-white">
                  {isHi ? 'एजेंट से जुड़े बिज़नेस टूल्स' : 'Connected Business Tool Nodes'}
                </h3>
              </div>
              <p className="text-xs text-slate-400">
                {isHi
                  ? 'किसी भी टूल नोड को चुनकर उसका उपयोग देखें'
                  : 'Select any tool node to inspect its connector role'}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {TOOL_NODES.map((tool) => {
                const selected = tool.id === activeTool.id;
                return (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => setActiveToolId(tool.id)}
                    className={`px-3.5 py-3 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                      selected
                        ? 'bg-cyan-500/15 border-cyan-400 text-white shadow-[0_0_18px_rgba(6,182,212,0.22)]'
                        : 'bg-[#060a18] border-white/10 text-slate-300 hover:border-white/25 hover:text-white'
                    }`}
                  >
                    <span className="text-cyan-300 shrink-0">{renderToolIcon(tool.icon)}</span>
                    <span className="text-xs sm:text-sm font-semibold truncate">
                      {isHi ? tool.labelHi : tool.labelEn}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="p-4 rounded-xl bg-[#050915] border border-white/10 flex flex-col sm:flex-row sm:items-center gap-3">
              <span className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-cyan-300 shrink-0">
                {renderToolIcon(activeTool.icon)}
                {isHi ? activeTool.labelHi : activeTool.labelEn}:
              </span>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                {isHi ? activeTool.roleHi : activeTool.roleEn}
              </p>
            </div>
          </div>
        </div>
      </RevealSection>

      {/* 4. INTERACTIVE SAMPLE AI CHAT (100% Local — Zero AI API, Zero Keys, Zero Firestore) */}
      <RevealSection id="ai-demo-chat" className="py-16 sm:py-24 px-4 sm:px-6 border-b border-white/10">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <p className="text-xs sm:text-sm font-semibold text-cyan-300">
              {isHi ? 'इंटरैक्टिव एजेंट प्रीव्यू · नमूना डेटा' : 'Interactive Agent Preview · Sample Data'}
            </p>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white [text-wrap:balance]">
              {isHi ? 'नमूना AI एजेंट चैट आज़माएँ' : 'Try the Sample AI Agent Chat'}
            </h2>
            <p className="text-sm sm:text-base text-slate-300">
              {isHi
                ? 'नीचे दिए गए 3 सुझाव बटनों पर क्लिक करें या कोई प्रश्न लिखें — सभी उत्तर पहले से तैयार नमूना डेटा पर आधारित हैं।'
                : 'Click one of the three suggested prompts or type any message — responses use local sample data with zero external API calls.'}
            </p>
          </div>

          <div className="rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/15 overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
            {/* Chat Header */}
            <div className="px-5 py-3.5 bg-[#090f24] border-b border-white/10 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white truncate">
                    {isHi ? 'एंटरप्राइज़ ऑप्स एजेंट (डेमो)' : 'Enterprise Ops Agent (Demo)'}
                  </p>
                  <p className="text-[11px] text-cyan-300 truncate">
                    {isHi ? 'नमूना डेटा · कोई बाहरी API कॉल नहीं' : 'Sample Data · Local Preview Only'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleResetChat}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-semibold text-slate-200 transition-colors cursor-pointer shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                {isHi ? 'रीसेट' : 'Reset'}
              </button>
            </div>

            {/* 3 Quick Suggestion Buttons */}
            <div className="px-5 py-3 bg-[#070c1c] border-b border-white/10 flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400 mr-1">
                {isHi ? 'सुझाव:' : 'Try:'}
              </span>
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt.id}
                  type="button"
                  disabled={isAgentTyping}
                  onClick={() => handleSuggestedPrompt(prompt)}
                  className="px-3.5 py-1.5 rounded-lg bg-violet-500/15 hover:bg-cyan-500/20 border border-violet-400/35 hover:border-cyan-400/55 text-xs font-semibold text-slate-100 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isHi ? prompt.labelHi : prompt.labelEn}
                </button>
              ))}
            </div>

            {/* Message Feed */}
            <div
              ref={chatScrollRef}
              className="p-5 space-y-4 h-[340px] sm:h-[370px] overflow-y-auto bg-[#050814]/85"
            >
              {chatMessages.map((msg) => {
                const isUser = msg.sender === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] sm:max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
                        isUser
                          ? 'bg-gradient-to-r from-violet-600 to-cyan-600 text-white rounded-br-sm'
                          : 'bg-white/[0.06] border border-white/10 text-slate-100 rounded-bl-sm'
                      }`}
                    >
                      {!isUser && msg.isSampleData && (
                        <div className="mb-1.5 text-[11px] font-semibold text-amber-300">
                          {isHi ? 'नमूना डेटा' : 'Sample Data'}
                        </div>
                      )}
                      <div>{isHi ? msg.textHi : msg.textEn}</div>
                    </div>
                  </div>
                );
              })}

              {isAgentTyping && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-sm px-4 py-3 bg-white/[0.06] border border-white/10 text-xs text-cyan-300 font-medium">
                    {isHi ? 'एजेंट नमूना उत्तर तैयार कर रहा है…' : 'Agent preparing sample response…'}
                  </div>
                </div>
              )}
            </div>

            {/* Free Text Input */}
            <form
              onSubmit={handleChatSubmit}
              className="p-3.5 sm:p-4 bg-[#090f24] border-t border-white/10 flex items-center gap-2.5"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={
                  isHi
                    ? 'कोई भी सवाल लिखें (डेमो चैट)…'
                    : 'Type any question (demo chat)…'
                }
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#040711] border border-white/15 focus:border-cyan-400 focus:outline-none text-sm text-white placeholder:text-slate-500"
              />
              <button
                type="submit"
                disabled={isAgentTyping || !chatInput.trim()}
                className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white text-sm font-semibold transition-all disabled:opacity-45 cursor-pointer shrink-0"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">{isHi ? 'भेजें' : 'Send'}</span>
              </button>
            </form>
          </div>
        </div>
      </RevealSection>

      {/* 5. INDUSTRY USE CASES (4 Real Photo Cards — "नमूना उपयोग" tag) */}
      <RevealSection
        id="ai-industries"
        className="py-16 sm:py-24 px-4 sm:px-6 border-b border-white/10 bg-[#070b18]/90"
      >
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl mb-12 space-y-3">
            <p className="text-xs sm:text-sm font-semibold text-cyan-300">
              {isHi ? 'उद्योग उपयोग (नमूना)' : 'Industry Use Cases (Sample)'}
            </p>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white [text-wrap:balance]">
              {isHi ? 'विभिन्न उद्योगों में एंटरप्राइज़ AI के व्यावहारिक उदाहरण' : 'Practical AI Use Cases Across Key Sectors'}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {INDUSTRY_CASES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveIndustryModal(item)}
                className="group text-left rounded-2xl bg-white/[0.035] backdrop-blur-md border border-white/10 hover:border-cyan-400/45 overflow-hidden transition-all duration-200 hover:-translate-y-0.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-[#0a1024]">
                  {!brokenImages[item.id] ? (
                    <img
                      src={item.image}
                      alt={isHi ? item.titleHi : item.titleEn}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      onError={() => markImageBroken(item.id)}
                      className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#0d152d] text-cyan-300 text-sm font-semibold">
                      {isHi ? item.titleHi : item.titleEn}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#040711]/85 via-transparent to-transparent" />
                  <div className="absolute top-3.5 left-3.5 px-2.5 py-1 rounded-md bg-[#040711]/85 border border-cyan-400/35 text-[11px] font-semibold text-cyan-200">
                    {isHi ? 'नमूना उपयोग' : 'Sample Use Case'}
                  </div>
                </div>

                <div className="p-6 space-y-2.5">
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
                    <span className="text-violet-300 font-semibold">
                      {isHi ? item.sectorHi : item.sectorEn}
                    </span>
                    <span className="text-cyan-300 font-medium">
                      {isHi ? 'वर्कफ़्लो देखें →' : 'View Workflow →'}
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white">
                    {isHi ? item.titleHi : item.titleEn}
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {isHi ? item.summaryHi : item.summaryEn}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* 6. SECURITY & TRUST PRINCIPLES (Principles Only — Zero ISO/SOC Claims) */}
      <RevealSection id="ai-security" className="py-16 sm:py-24 px-4 sm:px-6 border-b border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl mb-12 space-y-3">
            <p className="text-xs sm:text-sm font-semibold text-violet-300">
              {isHi ? 'सुरक्षा और भरोसा' : 'Security & Governance Principles'}
            </p>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white [text-wrap:balance]">
              {isHi ? 'ज़िम्मेदार AI के 4 बुनियादी सिद्धांत' : 'Four Core Principles for Responsible Enterprise AI'}
            </h2>
            <p className="text-sm sm:text-base text-slate-300">
              {isHi
                ? 'एंटरप्राइज़ AI केवल तेज़ नहीं, बल्कि पारदर्शी, सुरक्षित और इंसानी नियंत्रण में होना चाहिए।'
                : 'Enterprise AI should be transparent, scoped by role, and anchored under human accountability.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {SECURITY_PRINCIPLES.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl bg-white/[0.035] backdrop-blur-md border border-white/10 p-6 space-y-3.5"
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 border border-cyan-400/30 text-cyan-300 flex items-center justify-center">
                  {renderSecurityIcon(item.icon)}
                </div>
                <h3 className="text-lg font-bold text-white">
                  {isHi ? item.titleHi : item.titleEn}
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {isHi ? item.descHi : item.descEn}
                </p>
              </div>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* 7. SAMPLE PACKAGES (3 Cards, Middle "लोकप्रिय" Highlighted, "नमूना कीमतें — डेमो") */}
      <RevealSection
        id="ai-packages"
        className="py-16 sm:py-24 px-4 sm:px-6 border-b border-white/10 bg-[#070b18]/90"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <p className="text-xs sm:text-sm font-semibold text-amber-300">
              {isHi ? 'नमूना कीमतें — डेमो' : 'Sample Pricing — Demo Only'}
            </p>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white [text-wrap:balance]">
              {isHi ? 'AI समाधान पैकेज (नमूना)' : 'Sample Enterprise AI Packages'}
            </h2>
            <p className="text-sm sm:text-base text-slate-300">
              {isHi
                ? 'नीचे दी गई कीमतें केवल डेमो प्रदर्शन के लिए हैं। वास्तविक लागत डेटा, एजेंट संख्या और इंटीग्रेशन के अनुसार तय होती है।'
                : 'Prices below are sample demo references only. Real project quotes depend on workflows, models, and integrations.'}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            {PACKAGES.map((pkg) => (
              <div
                key={pkg.id}
                className={`rounded-2xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-200 ${
                  pkg.highlighted
                    ? 'bg-gradient-to-b from-violet-950/65 to-[#091224] border-2 border-cyan-400/70 shadow-[0_0_36px_rgba(6,182,212,0.18)]'
                    : 'bg-white/[0.035] backdrop-blur-md border border-white/10'
                }`}
              >
                <div className="space-y-5">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xl font-bold text-white">
                      {isHi ? pkg.nameHi : pkg.nameEn}
                    </h3>
                    {pkg.highlighted && (
                      <span className="px-2.5 py-1 rounded-md bg-gradient-to-r from-violet-600 to-cyan-500 text-[11px] font-bold text-white whitespace-nowrap">
                        {isHi ? 'लोकप्रिय' : 'Popular'}
                      </span>
                    )}
                  </div>

                  <p className="text-xs sm:text-sm text-slate-300">
                    {isHi ? pkg.subtitleHi : pkg.subtitleEn}
                  </p>

                  <div className="pt-2 pb-4 border-b border-white/10">
                    <div className="text-3xl sm:text-4xl font-extrabold text-white tabular-nums">
                      {isHi ? pkg.priceHi : pkg.priceEn}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {isHi ? 'नमूना कीमतें — डेमो' : 'Sample Pricing — Demo'}
                    </p>
                  </div>

                  <ul className="space-y-3">
                    {(isHi ? pkg.featuresHi : pkg.featuresEn).map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-200">
                        <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-8">
                  <button
                    type="button"
                    onClick={() => handleSelectPackage(pkg)}
                    className={`w-full py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                      pkg.highlighted
                        ? 'bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white hover:shadow-[0_0_24px_rgba(6,182,212,0.45)]'
                        : 'bg-white/[0.08] hover:bg-white/[0.15] border border-white/15 text-white'
                    }`}
                  >
                    {isHi ? 'डेमो बुक करें' : 'Book Demo'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* 8. 5-STEP PROCESS TIMELINE */}
      <RevealSection id="ai-process" className="py-16 sm:py-24 px-4 sm:px-6 border-b border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl mb-12 space-y-3">
            <p className="text-xs sm:text-sm font-semibold text-cyan-300">
              {isHi ? 'क्रियान्वयन प्रक्रिया' : 'Implementation Process'}
            </p>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white [text-wrap:balance]">
              {isHi ? '5 चरणों में सुरक्षित AI रोलआउट' : 'Five Structured Stages to Governed AI Deployment'}
            </h2>
          </div>

          <div className="relative">
            <div
              aria-hidden="true"
              className="hidden lg:block absolute top-6 left-10 right-10 h-[2px] bg-gradient-to-r from-violet-500/40 via-cyan-400/55 to-violet-500/40"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
              {PROCESS_STEPS.map((step) => (
                <div
                  key={step.step}
                  className="relative rounded-2xl bg-white/[0.035] backdrop-blur-md border border-white/10 p-5 space-y-3"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-sm font-extrabold text-white tabular-nums">
                    {step.step}
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    {isHi ? step.titleHi : step.titleEn}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {isHi ? step.descHi : step.descEn}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </RevealSection>

      {/* 9. TECHNOLOGY STRIP (Text Chips Only — No Logo Images) */}
      <RevealSection className="py-12 sm:py-16 px-4 sm:px-6 border-b border-white/10 bg-[#070b18]/90">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-violet-300">
              {isHi ? 'AI टेक्नोलॉजी स्टैक' : 'AI Technology Stack'}
            </p>
            <h2 className="text-lg sm:text-xl font-bold text-white">
              {isHi ? 'आधुनिक एंटरप्राइज़ AI टूल्स' : 'Core Enterprise AI Technologies'}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            {TECH_CHIPS.map((tech) => (
              <span
                key={tech}
                className="px-4 py-2 rounded-lg bg-white/[0.05] border border-white/12 text-sm font-semibold text-slate-100"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* 10. FAQ ACCORDION (4 Questions including honest mistake oversight answer) */}
      <RevealSection className="py-16 sm:py-24 px-4 sm:px-6 border-b border-white/10">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10 space-y-3">
            <p className="text-xs sm:text-sm font-semibold text-cyan-300">
              {isHi ? 'सामान्य प्रश्न (FAQ)' : 'Frequently Asked Questions'}
            </p>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white [text-wrap:balance]">
              {isHi ? 'एंटरप्राइज़ AI से जुड़े स्पष्ट और ईमानदार उत्तर' : 'Clear, Honest Answers About Enterprise AI'}
            </h2>
          </div>

          <div className="space-y-3">
            {FAQ_ITEMS.map((faq) => {
              const isOpen = openFaqId === faq.id;
              return (
                <div
                  key={faq.id}
                  className="rounded-xl bg-white/[0.035] backdrop-blur-md border border-white/10 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqId(isOpen ? '' : faq.id)}
                    aria-expanded={isOpen}
                    className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left cursor-pointer hover:bg-white/[0.03] transition-colors"
                  >
                    <span className="text-sm sm:text-base font-semibold text-white">
                      {isHi ? faq.qHi : faq.qEn}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-cyan-300 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-sm text-slate-300 leading-relaxed border-t border-white/5">
                      {isHi ? faq.aHi : faq.aEn}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </RevealSection>

      {/* 11. DEMO BOOKING FORM + CONTACT DETAILS */}
      <RevealSection
        id="ai-contact"
        className="py-16 sm:py-24 px-4 sm:px-6 border-b border-white/10 bg-[#070b18]/90"
      >
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Contact Details Column */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-3">
              <p className="text-xs sm:text-sm font-semibold text-cyan-300">
                {isHi ? 'डेमो बुकिंग और संपर्क' : 'Book a Demo & Contact'}
              </p>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white [text-wrap:balance]">
                {isHi ? 'अपनी टीम के लिए AI डेमो शेड्यूल करें' : 'Schedule an AI Demo for Your Team'}
              </h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                {isHi
                  ? 'यह फ़ॉर्म केवल डेमो प्रीव्यू के लिए है। सबमिट करने पर कोई भी डेटा सर्वर या Firestore में सेव नहीं होता।'
                  : 'This form is a local demo preview. Submitting does not send or store any data in Firestore or external servers.'}
              </p>
            </div>

            <div className="rounded-2xl bg-white/[0.035] backdrop-blur-md border border-white/10 p-6 space-y-5">
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-white/10">
                <span className="text-sm font-bold text-white">
                  {isHi ? 'संपर्क विवरण' : 'Contact Details'}
                </span>
                <span className="text-xs font-semibold text-amber-300">
                  {isHi ? 'डेमो जानकारी' : 'Demo Information'}
                </span>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-400">
                      {isHi ? 'फ़ोन (डेमो जानकारी)' : 'Phone (Demo Information)'}
                    </p>
                    <p className="text-sm sm:text-base font-semibold text-white tabular-nums">
                      +91 90000 00000
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-400">
                      {isHi ? 'ईमेल (डेमो जानकारी)' : 'Email (Demo Information)'}
                    </p>
                    <p className="text-sm sm:text-base font-semibold text-white break-all">
                      hello@artificial-intelligence.example
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-start gap-2 text-xs text-slate-400">
                <Info className="w-4 h-4 text-cyan-300 shrink-0 mt-0.5" />
                <span>
                  {isHi
                    ? 'असली वेबसाइट या AI समाधान बनवाने के लिए नीचे “ऐसी वेबसाइट अपने बिज़नेस के लिए बनवाएँ” बटन दबाएँ।'
                    : 'To request a real website or AI platform, use the CTA button at the bottom of this page.'}
                </span>
              </div>
            </div>
          </div>

          {/* Local Demo Booking Form */}
          <div className="lg:col-span-7">
            <form
              onSubmit={handleFormSubmit}
              noValidate
              className="rounded-2xl bg-white/[0.035] backdrop-blur-md border border-white/10 p-6 sm:p-8 space-y-5"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="ai-name" className="block text-xs sm:text-sm font-medium text-slate-200">
                    {isHi ? 'नाम *' : 'Full Name *'}
                  </label>
                  <input
                    id="ai-name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={isHi ? 'आपका नाम लिखें' : 'Enter your full name'}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#040711]/90 border border-white/15 focus:border-cyan-400 focus:outline-none text-sm text-white placeholder:text-slate-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="ai-company" className="block text-xs sm:text-sm font-medium text-slate-200">
                    {isHi ? 'कंपनी / संगठन *' : 'Company / Organization *'}
                  </label>
                  <input
                    id="ai-company"
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder={isHi ? 'कंपनी का नाम लिखें' : 'Enter company name'}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#040711]/90 border border-white/15 focus:border-cyan-400 focus:outline-none text-sm text-white placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="ai-mobile" className="block text-xs sm:text-sm font-medium text-slate-200">
                    {isHi ? 'मोबाइल नंबर *' : 'Mobile Number *'}
                  </label>
                  <input
                    id="ai-mobile"
                    type="tel"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    placeholder={isHi ? '10 अंकों का नंबर' : '10-digit number'}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#040711]/90 border border-white/15 focus:border-cyan-400 focus:outline-none text-sm text-white placeholder:text-slate-500 tabular-nums"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="ai-industry" className="block text-xs sm:text-sm font-medium text-slate-200">
                    {isHi ? 'उद्योग *' : 'Industry *'}
                  </label>
                  <select
                    id="ai-industry"
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#040711] border border-white/15 focus:border-cyan-400 focus:outline-none text-sm text-white"
                  >
                    <option value="">{isHi ? 'उद्योग चुनें' : 'Select industry'}</option>
                    <option value="healthcare">{isHi ? 'हेल्थकेयर' : 'Healthcare'}</option>
                    <option value="banking">{isHi ? 'बैंकिंग / फ़ाइनेंस' : 'Banking / Finance'}</option>
                    <option value="retail">{isHi ? 'रिटेल / ई-कॉमर्स' : 'Retail / E-Commerce'}</option>
                    <option value="manufacturing">{isHi ? 'मैन्युफैक्चरिंग' : 'Manufacturing'}</option>
                    <option value="education">{isHi ? 'शिक्षा / एडटेक' : 'Education / EdTech'}</option>
                    <option value="other">{isHi ? 'अन्य उद्योग' : 'Other Sector'}</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="ai-purpose" className="block text-xs sm:text-sm font-medium text-slate-200">
                    {isHi ? 'किस काम के लिए AI *' : 'AI Use Case *'}
                  </label>
                  <select
                    id="ai-purpose"
                    value={formData.aiPurpose}
                    onChange={(e) => setFormData({ ...formData, aiPurpose: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#040711] border border-white/15 focus:border-cyan-400 focus:outline-none text-sm text-white"
                  >
                    <option value="">{isHi ? 'कार्य चुनें' : 'Select use case'}</option>
                    <option value="chatbot">{isHi ? 'AI चैट असिस्टेंट / सपोर्ट' : 'AI Chat / Support'}</option>
                    <option value="analytics">{isHi ? 'सेल्स व स्टॉक एनालिटिक्स' : 'Sales & Stock Analytics'}</option>
                    <option value="document-ocr">{isHi ? 'डॉक्यूमेंट AI और OCR' : 'Document AI & OCR'}</option>
                    <option value="workflow">{isHi ? 'ऑटोनॉमस वर्कफ़्लो ऑटोमेशन' : 'Autonomous Workflow'}</option>
                    <option value="private-model">{isHi ? 'प्राइवेट मॉडल इंफ्रास्ट्रक्चर' : 'Private Model Setup'}</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="ai-message" className="block text-xs sm:text-sm font-medium text-slate-200">
                  {isHi ? 'संदेश *' : 'Message *'}
                </label>
                <textarea
                  id="ai-message"
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder={
                    isHi
                      ? 'बताएँ आप किन कार्यों में AI एजेंट की मदद चाहते हैं…'
                      : 'Describe the business workflows where you want AI assistance…'
                  }
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#040711]/90 border border-white/15 focus:border-cyan-400 focus:outline-none text-sm text-white placeholder:text-slate-500 resize-y"
                />
              </div>

              {formError && (
                <div
                  role="alert"
                  className="p-3.5 rounded-lg bg-rose-500/15 border border-rose-400/35 text-xs sm:text-sm text-rose-200"
                >
                  {formError}
                </div>
              )}

              {formSuccess && (
                <div
                  role="status"
                  className="p-4 rounded-lg bg-emerald-500/15 border border-emerald-400/35 flex items-start gap-2.5 text-xs sm:text-sm text-emerald-200"
                >
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    {isHi
                      ? 'डेमो: फ़ॉर्म ठीक से भरा गया। यह नमूना है, कोई संदेश नहीं भेजा गया।'
                      : 'Demo: Form filled out properly. This is a sample preview — no message was sent.'}
                  </span>
                </div>
              )}

              <button
                type="submit"
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white text-sm sm:text-base font-semibold transition-all duration-200 hover:shadow-[0_0_26px_rgba(6,182,212,0.45)] cursor-pointer"
              >
                {isHi ? 'डेमो बुक करें (डेमो फ़ॉर्म)' : 'Book Demo (Sample Form)'}
              </button>
            </form>
          </div>
        </div>
      </RevealSection>

      {/* 12. FOOTER + BOTTOM MAIN-SITE QUOTE CTA */}
      <footer className="bg-[#03050d] text-slate-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 border-b border-white/10">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center">
                <BrainCircuit className="w-4 h-4 text-white" />
              </span>
              <span className="text-sm font-extrabold text-white tracking-tight">
                ARTIFICIAL INTELLIGENCE
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              {isHi
                ? 'एंटरप्राइज़ एआई और ऑटोनॉमस एजेंट्स — सुरक्षित, नियंत्रित और इंसानी निगरानी वाले AI का नमूना डिज़ाइन।'
                : 'Enterprise AI and autonomous agents — sample corporate showcase built with human-in-the-loop governance.'}
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white">{isHi ? 'सेवाएँ' : 'Services'}</h3>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-400">
              {SERVICES.slice(0, 4).map((svc) => (
                <li key={svc.id}>
                  <button
                    type="button"
                    onClick={() => setActiveServiceModal(svc)}
                    className="hover:text-cyan-300 transition-colors cursor-pointer"
                  >
                    {isHi ? svc.titleHi : svc.titleEn}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white">{isHi ? 'क्विक लिंक' : 'Quick Links'}</h3>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-400">
              {navLinks.slice(0, 6).map((link) => (
                <li key={link.id}>
                  <button
                    type="button"
                    onClick={() => scrollToSection(link.id)}
                    className="hover:text-cyan-300 transition-colors cursor-pointer"
                  >
                    {isHi ? link.hi : link.en}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white">{isHi ? 'सोशल लिंक' : 'Social Links'}</h3>
            <div className="flex items-center gap-2.5">
              {['LinkedIn', 'YouTube', 'GitHub', 'X'].map((network) => (
                <button
                  key={network}
                  type="button"
                  onClick={() =>
                    showDemoToast(
                      `डेमो सोशल लिंक (${network}) — यह केवल नमूना है।`,
                      `Demo social icon (${network}) — sample preview only.`
                    )
                  }
                  className="px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.12] border border-white/10 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
                  aria-label={network}
                >
                  {network.slice(0, 2)}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 pt-2">© Artificial Intelligence (Demo)</p>
          </div>
        </div>

        {/* Bottom Conversion Strip -> Main Site Quote Form */}
        <div className="bg-gradient-to-r from-[#0b0e24] via-[#12163a] to-[#081a2a] border-t border-cyan-400/25 px-4 sm:px-6 py-8">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-cyan-300">POWER WEB STUDIO AI</p>
              <h3 className="text-lg sm:text-xl font-extrabold text-white">
                {isHi
                  ? 'क्या आप अपने बिज़नेस के लिए ऐसी आधुनिक AI वेबसाइट या प्लेटफ़ॉर्म बनवाना चाहते हैं?'
                  : 'Want an Enterprise AI Website or Platform Built for Your Business?'}
              </h3>
            </div>
            <button
              type="button"
              onClick={onRequestQuote}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white text-sm font-bold transition-all duration-200 hover:shadow-[0_0_26px_rgba(6,182,212,0.5)] cursor-pointer whitespace-nowrap shrink-0"
            >
              {isHi
                ? 'ऐसी वेबसाइट अपने बिज़नेस के लिए बनवाएँ'
                : 'Build a Website Like This for Your Business'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </footer>

      {/* Local Demo Toast */}
      {demoToast && (
        <div
          role="status"
          className="fixed bottom-6 right-5 z-50 max-w-xs px-4 py-3 rounded-xl bg-[#0b1126]/95 backdrop-blur-md border border-cyan-400/40 text-xs sm:text-sm font-medium text-white shadow-xl"
        >
          {demoToast}
        </div>
      )}

      {/* SERVICE SCOPE MODAL */}
      {activeServiceModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="ai-service-modal-title"
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setActiveServiceModal(null)}
        >
          <div
            className="w-full max-w-xl rounded-2xl bg-[#0a1024] border border-white/15 overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-48 sm:h-56 bg-[#040711] shrink-0">
              <img
                src={activeServiceModal.image}
                alt={isHi ? activeServiceModal.titleHi : activeServiceModal.titleEn}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a1024] via-transparent to-black/30" />
              <button
                type="button"
                onClick={() => setActiveServiceModal(null)}
                aria-label={isHi ? 'बंद करें' : 'Close'}
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              <div>
                <p className="text-xs font-semibold text-cyan-300">
                  {isHi ? 'सेवा का कार्य-दायरा (डेमो)' : 'Service Scope (Demo)'}
                </p>
                <h3 id="ai-service-modal-title" className="text-xl sm:text-2xl font-bold text-white mt-1">
                  {isHi ? activeServiceModal.titleHi : activeServiceModal.titleEn}
                </h3>
                <p className="text-sm text-slate-300 mt-1.5">
                  {isHi ? activeServiceModal.shortDescHi : activeServiceModal.shortDescEn}
                </p>
              </div>

              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {isHi ? 'मुख्य कार्य-दायरा' : 'Core Scope'}
                </h4>
                <ul className="space-y-2">
                  {(isHi ? activeServiceModal.scopeHi : activeServiceModal.scopeEn).map((line, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-slate-200">
                      <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs sm:text-sm text-slate-300">
                <span className="font-semibold text-white">
                  {isHi ? 'उपयुक्त किसके लिए: ' : 'Best suited for: '}
                </span>
                {isHi ? activeServiceModal.idealForHi : activeServiceModal.idealForEn}
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveServiceModal(null)}
                  className="px-4 py-2.5 rounded-lg border border-white/15 text-sm font-semibold text-slate-200 hover:bg-white/10 cursor-pointer"
                >
                  {isHi ? 'बंद करें' : 'Close'}
                </button>
                <button
                  type="button"
                  onClick={() => handleServiceConsult(activeServiceModal)}
                  className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-sm font-semibold text-white cursor-pointer"
                >
                  {isHi ? 'डेमो बुक करें' : 'Book Demo'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* INDUSTRY USE CASE MODAL */}
      {activeIndustryModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="ai-industry-modal-title"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setActiveIndustryModal(null)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl bg-[#0a1024] border border-white/15 overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-56 sm:h-64 bg-[#040711] shrink-0">
              <img
                src={activeIndustryModal.image}
                alt={isHi ? activeIndustryModal.titleHi : activeIndustryModal.titleEn}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3.5 left-3.5 px-3 py-1 rounded-md bg-[#040711]/85 border border-cyan-400/35 text-xs font-semibold text-cyan-200">
                {isHi ? 'नमूना उपयोग' : 'Sample Use Case'}
              </div>
              <button
                type="button"
                onClick={() => setActiveIndustryModal(null)}
                aria-label={isHi ? 'बंद करें' : 'Close'}
                className="absolute top-3.5 right-3.5 w-9 h-9 rounded-full bg-black/65 hover:bg-black/85 text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              <div>
                <p className="text-xs font-semibold text-violet-300">
                  {isHi ? activeIndustryModal.sectorHi : activeIndustryModal.sectorEn}
                </p>
                <h3 id="ai-industry-modal-title" className="text-xl sm:text-2xl font-bold text-white mt-1">
                  {isHi ? activeIndustryModal.titleHi : activeIndustryModal.titleEn}
                </h3>
                <p className="text-sm text-slate-300 mt-1.5 leading-relaxed">
                  {isHi ? activeIndustryModal.summaryHi : activeIndustryModal.summaryEn}
                </p>
              </div>

              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  {isHi ? 'नमूना कार्य-प्रणाली (इंसानी निगरानी सहित)' : 'Sample Workflow (With Human Oversight)'}
                </h4>
                <ul className="space-y-2">
                  {(isHi ? activeIndustryModal.workflowHi : activeIndustryModal.workflowEn).map(
                    (step, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-200">
                        <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                        <span>{step}</span>
                      </li>
                    )
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
