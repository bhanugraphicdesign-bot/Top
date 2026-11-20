import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Check,
  CheckCircle2,
  Copy,
  Database,
  FileSpreadsheet,
  Globe,
  KeyRound,
  Lock,
  Mail,
  Menu,
  MessageSquare,
  Network,
  Phone,
  Play,
  Plug2,
  RefreshCw,
  ScrollText,
  Send,
  Shield,
  ShieldCheck,
  Smartphone,
  CreditCard,
  Gauge,
  Webhook,
  Workflow,
  X,
  Building2,
  Code2,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface IntegrationSuiteDemoProps {
  onBackToHome: () => void;
  onRequestQuote: () => void;
}

interface ServiceDetail {
  id: string;
  titleHi: string;
  titleEn: string;
  shortDescHi: string;
  shortDescEn: string;
  image: string;
  scopeHi: string[];
  scopeEn: string[];
  architectureNoteHi: string;
  architectureNoteEn: string;
}

interface IndustryUseCase {
  id: string;
  sectorHi: string;
  sectorEn: string;
  titleHi: string;
  titleEn: string;
  summaryHi: string;
  summaryEn: string;
  image: string;
  flowHi: string[];
  flowEn: string[];
}

interface ConnectorItem {
  id: string;
  name: string;
  categoryHi: string;
  categoryEn: string;
  roleHi: string;
  roleEn: string;
}

interface SampleEndpoint {
  id: 'orders' | 'invoice' | 'shipment';
  method: 'GET' | 'POST';
  path: string;
  label: string;
  descriptionHi: string;
  descriptionEn: string;
  sampleRequestBody?: string;
  sampleLatencyMs: number;
  responseJson: string;
}

interface PackageTier {
  id: string;
  nameHi: string;
  nameEn: string;
  priceHi: string;
  priceEn: string;
  popular?: boolean;
  summaryHi: string;
  summaryEn: string;
  featuresHi: string[];
  featuresEn: string[];
}

interface FaqItem {
  id: string;
  questionHi: string;
  questionEn: string;
  answerHi: string;
  answerEn: string;
}

const SERVICES: ServiceDetail[] = [
  {
    id: 'api-gateway',
    titleHi: 'API गेटवे और मैनेजमेंट',
    titleEn: 'API Gateway & Management',
    shortDescHi:
      'सभी इंटरनल व एक्सटर्नल APIs के लिए केंद्रीकृत रूटिंग, वर्ज़निंग और ट्रैफ़िक नियंत्रण।',
    shortDescEn:
      'Centralized routing, request validation, versioning, and traffic governance across every business API.',
    image: '/demo/integration-suite/api-gateway.jpg',
    scopeHi: [
      'यूनिफ़ाइड API एंट्री पॉइंट और साफ़ एंडपॉइंट वर्ज़निंग',
      'रिक्वेस्ट/रिस्पॉन्स ट्रांसफ़ॉर्मेशन और स्कीमा वैलिडेशन',
      'रूट-लेवल थ्रॉटलिंग, कोटा नियम और एरर स्टैंडर्डाइज़ेशन',
      'डेवलपर डॉक्यूमेंटेशन और सैंडबॉक्स टेस्टिंग स्ट्रक्चर',
    ],
    scopeEn: [
      'Unified API entry point with structured endpoint versioning',
      'Request/response payload transformation and schema validation',
      'Route-level throttling, quota rules, and standardized error responses',
      'Clear developer documentation and sandbox testing structure',
    ],
    architectureNoteHi:
      'एकल गेटवे लेयर के ज़रिए बैकएंड सेवाओं को सुरक्षित रूप से व्यवस्थित किया जाता है ताकि अलग-अलग ऐप्स एक ही नियम से जुड़ सकें।',
    architectureNoteEn:
      'A single gateway layer organizes backend services cleanly so web, mobile, and partner apps connect through uniform rules.',
  },
  {
    id: 'security-auth',
    titleHi: 'सुरक्षा और ऑथेंटिकेशन',
    titleEn: 'Security & Authentication',
    shortDescHi:
      'OAuth 2.0, API Key प्रबंधन, रेट लिमिट और रोल-आधारित एक्सेस नियंत्रण की सुरक्षित संरचना।',
    shortDescEn:
      'Structured OAuth 2.0 flows, scoped API keys, rate limiting, and role-based access policies.',
    image: '/demo/integration-suite/security-auth.jpg',
    scopeHi: [
      'स्कोप्ड API Key जारी करना, रोटेशन और एक्सपायरी नीति',
      'OAuth 2.0 और JWT टोकन वेरिफ़िकेशन फ़्लो',
      'प्रति-यूज़र और प्रति-IP रेट लिमिटिंग नियम',
      'ऑडिट ट्रेल के लिए स्ट्रक्चर्ड एक्सेस लॉगिंग',
    ],
    scopeEn: [
      'Scoped API key issuance, rotation schedules, and revocation rules',
      'OAuth 2.0 and JWT token verification flows',
      'Per-client and per-IP rate limiting protection',
      'Structured access logging for operational traceability',
    ],
    architectureNoteHi:
      'हर अनुरोध को बैकएंड तक पहुँचने से पहले गेटवे स्तर पर सत्यापित और फ़िल्टर किया जाता है।',
    architectureNoteEn:
      'Every incoming request is authenticated, authorized, and validated at the gateway edge before touching core services.',
  },
  {
    id: 'data-pipeline',
    titleHi: 'डेटा पाइपलाइन और ETL',
    titleEn: 'Data Pipeline & ETL',
    shortDescHi:
      'विभिन्न डेटाबेस और स्प्रेडशीट से डेटा निकालना, साफ़ करना और तय शेड्यूल पर लोड करना।',
    shortDescEn:
      'Automated extract, transform, and load workflows connecting operational databases and reporting stores.',
    image: '/demo/integration-suite/data-pipeline.jpg',
    scopeHi: [
      'मल्टी-सोर्स डेटा एक्सट्रैक्शन और डुप्लिकेट हटाने के नियम',
      'फ़ील्ड मैपिंग, मुद्रा/तिथि फ़ॉर्मेटिंग और डेटा वैलिडेशन',
      'इंक्रीमेंटल सिंक और विफल जॉब के लिए ऑटोमैटिक रीट्राई',
      'रिपोर्टिंग व एनालिटिक्स के लिए स्वच्छ डेटा टेबल संरचना',
    ],
    scopeEn: [
      'Multi-source extraction with deduplication rules',
      'Field mapping, currency/date normalization, and schema checks',
      'Incremental sync schedules with automated retry handling',
      'Clean destination tables structured for reporting and analytics',
    ],
    architectureNoteHi:
      'मैनुअल CSV एक्सपोर्ट-इम्पोर्ट की जगह भरोसेमंद और दोहराने योग्य डेटा पाइपलाइन तैयार की जाती है।',
    architectureNoteEn:
      'Replaces error-prone manual CSV exports with repeatable, schema-checked data pipelines.',
  },
  {
    id: 'app-connect',
    titleHi: 'बिज़नेस ऐप कनेक्शन',
    titleEn: 'Business App Connections',
    shortDescHi:
      'CRM, अकाउंटिंग, इन्वेंटरी और बिलिंग टूल्स को आपस में जोड़कर दोहरी एंट्री खत्म करना।',
    shortDescEn:
      'Connect CRM, accounting, inventory, and billing software to eliminate repetitive manual entry.',
    image: '/demo/integration-suite/app-connect.jpg',
    scopeHi: [
      'CRM लीड्स और ग्राहक रिकॉर्ड का दो-तरफ़ा सिंक्रोनाइज़ेशन',
      'ऑर्डर कन्फ़र्म होते ही अकाउंटिंग और GST इनवॉइस एंट्री',
      'मल्टी-वेयरहाउस या स्टोर इन्वेंटरी का एकीकृत अपडेट',
      'असफल सिंक होने पर स्पष्ट अलर्ट और री-क्यू मैकेनिज़्म',
    ],
    scopeEn: [
      'Two-way synchronization of CRM leads and customer profiles',
      'Automated accounting and invoice creation upon order confirmation',
      'Unified stock updates across storefronts and warehouses',
      'Clear exception alerts with safe re-queue recovery',
    ],
    architectureNoteHi:
      'आपकी मौजूदा टीम उन्हीं टूल्स में काम करती रहती है, जबकि डेटा पृष्ठभूमि में सटीकता से सिंक होता रहता है।',
    architectureNoteEn:
      'Your teams continue working in familiar tools while records stay synchronized accurately in the background.',
  },
  {
    id: 'webhooks',
    titleHi: 'वेबहुक और इवेंट',
    titleEn: 'Webhooks & Event Streams',
    shortDescHi:
      'पेमेंट, ऑर्डर या फॉर्म सबमिशन जैसे इवेंट्स पर तुरंत सिग्नेचर-वेरिफ़ाइड वेबहुक ट्रिगर।',
    shortDescEn:
      'Signature-verified event webhooks triggered instantly on payments, orders, and status updates.',
    image: '/demo/integration-suite/webhooks.jpg',
    scopeHi: [
      'HMAC सिग्नेचर वेरिफ़िकेशन के साथ सुरक्षित वेबहुक रिसीवर',
      'इवेंट क्यूइंग और डेड-लेटर रीट्राई हैंडलिंग',
      'कस्टम बिज़नेस नियम के अनुसार नोटिफ़िकेशन व एक्शन ट्रिगर',
      'डिलीवरी हिस्ट्री और पेलोड इंस्पेक्शन लॉग्स',
    ],
    scopeEn: [
      'HMAC signature-verified webhook receivers and dispatchers',
      'Buffered event queues with dead-letter retry handling',
      'Rule-based downstream actions and customer notifications',
      'Structured delivery history and payload inspection logs',
    ],
    architectureNoteHi:
      'पोलिंग के बजाय इवेंट-ड्रिवन आर्किटेक्चर से सिस्टम तुरंत प्रतिक्रिया देता है और अनावश्यक लोड घटता है।',
    architectureNoteEn:
      'Event-driven delivery replaces heavy polling loops so downstream apps respond immediately with minimal overhead.',
  },
  {
    id: 'realtime-sync',
    titleHi: 'रियल-टाइम डेटा सिंक',
    titleEn: 'Real-Time Data Sync',
    shortDescHi:
      'वेबसाइट, मोबाइल ऐप और बैक-ऑफ़िस डेटाबेस के बीच तेज़, सुसंगत और कन्फ़्लिक्ट-फ़्री अपडेट।',
    shortDescEn:
      'Low-latency synchronization keeping web portals, mobile apps, and back-office databases aligned.',
    image: '/demo/integration-suite/realtime-sync.jpg',
    scopeHi: [
      'चेंज-डेटा कैप्चर और डेल्टा अपडेट सिंक्रोनाइज़ेशन',
      'कन्फ़्लिक्ट रेज़ोल्यूशन और आइडम्पोटेंट राइट प्रोटेक्शन',
      'ऑफ़लाइन या नेटवर्क ब्रेक के बाद सुरक्षित री-सिंक',
      'डेटा संगति की नियमित जाँच और रीकन्सिलिएशन रिपोर्ट',
    ],
    scopeEn: [
      'Change-data capture and delta-only synchronization',
      'Conflict resolution rules and idempotent write protection',
      'Resilient catch-up sync after temporary network interruptions',
      'Scheduled consistency checks and reconciliation logs',
    ],
    architectureNoteHi:
      'हर चैनल पर ग्राहकों और स्टाफ़ को हमेशा एक जैसा और अद्यतन डेटा दिखाई देता है।',
    architectureNoteEn:
      'Customers and operations teams view consistent, up-to-date records across every channel.',
  },
];

const CONNECTORS: ConnectorItem[] = [
  {
    id: 'rest',
    name: 'REST',
    categoryHi: 'प्रोटोकॉल',
    categoryEn: 'Protocol',
    roleHi: 'मानक HTTP/JSON API एंडपॉइंट और ओपनAPI डॉक्यूमेंटेशन।',
    roleEn: 'Standard HTTP/JSON endpoints with structured schema documentation.',
  },
  {
    id: 'graphql',
    name: 'GraphQL',
    categoryHi: 'प्रोटोकॉल',
    categoryEn: 'Protocol',
    roleHi: 'सटीक फ़ील्ड क्वेरी के लिए एकीकृत स्कीमा लेयर।',
    roleEn: 'Typed schema layer for querying exact fields across multiple services.',
  },
  {
    id: 'webhook',
    name: 'Webhook',
    categoryHi: 'इवेंट',
    categoryEn: 'Events',
    roleHi: 'इवेंट घटते ही दूसरे सिस्टम को तुरंत HTTP कॉलबैक।',
    roleEn: 'Instant signed HTTP callbacks triggered when business events occur.',
  },
  {
    id: 'google-sheets',
    name: 'Google Sheets',
    categoryHi: 'स्प्रेडशीट',
    categoryEn: 'Spreadsheet',
    roleHi: 'ऑर्डर, लीड या रिपोर्ट डेटा का ऑटोमैटिक शीट सिंक।',
    roleEn: 'Automated row synchronization for leads, reports, and trackers.',
  },
  {
    id: 'firebase',
    name: 'Firebase',
    categoryHi: 'ऐप बैकएंड',
    categoryEn: 'App Backend',
    roleHi: 'मोबाइल व वेब ऐप डेटा का बाहरी सिस्टम से सुरक्षित जोड़।',
    roleEn: 'Structured bridge connecting app collections with ERP and billing.',
  },
  {
    id: 'mysql',
    name: 'MySQL',
    categoryHi: 'डेटाबेस',
    categoryEn: 'Database',
    roleHi: 'रिलेशनल डेटाबेस से सुरक्षित रीड/राइट और ETL पाइपलाइन।',
    roleEn: 'Transactional database synchronization and scheduled ETL pipelines.',
  },
  {
    id: 'postgresql',
    name: 'PostgreSQL',
    categoryHi: 'डेटाबेस',
    categoryEn: 'Database',
    roleHi: 'एंटरप्राइज़ डेटा स्टोर, व्यूज़ और इवेंट सिंक कनेक्टर।',
    roleEn: 'Enterprise relational storage integration with delta sync support.',
  },
  {
    id: 'razorpay',
    name: 'Razorpay',
    categoryHi: 'पेमेंट',
    categoryEn: 'Payments',
    roleHi: 'पेमेंट कन्फ़र्मेशन वेबहुक, रिफ़ंड और रीकन्सिलिएशन सिंक।',
    roleEn: 'Payment capture webhooks, refund tracking, and ledger reconciliation.',
  },
  {
    id: 'shiprocket',
    name: 'Shiprocket',
    categoryHi: 'लॉजिस्टिक्स',
    categoryEn: 'Logistics',
    roleHi: 'ऑटोमैटिक शिपमेंट निर्माण, AWB और ट्रैकिंग अपडेट।',
    roleEn: 'Automated dispatch creation, AWB generation, and tracking updates.',
  },
  {
    id: 'tally',
    name: 'Tally',
    categoryHi: 'अकाउंटिंग',
    categoryEn: 'Accounting',
    roleHi: 'सेल्स वाउचर, लेजर और इनवॉइस डेटा का व्यवस्थित सिंक।',
    roleEn: 'Structured sync for sales vouchers, invoices, and accounting ledgers.',
  },
  {
    id: 'zoho',
    name: 'Zoho',
    categoryHi: 'CRM / सूट',
    categoryEn: 'CRM / Suite',
    roleHi: 'CRM कॉन्टैक्ट, डील्स और बुक्स इनवॉइस का दो-तरफ़ा समन्वय।',
    roleEn: 'Two-way alignment between CRM contacts, deals, and accounting records.',
  },
  {
    id: 'whatsapp-api',
    name: 'WhatsApp API',
    categoryHi: 'मैसेजिंग',
    categoryEn: 'Messaging',
    roleHi: 'ऑर्डर अपडेट, इनवॉइस अलर्ट और अपॉइंटमेंट रिमाइंडर ऑटोमेशन।',
    roleEn: 'Automated order updates, invoice notifications, and appointment reminders.',
  },
];

const SAMPLE_ENDPOINTS: SampleEndpoint[] = [
  {
    id: 'orders',
    method: 'GET',
    path: '/orders',
    label: 'GET /orders',
    descriptionHi: 'हाल के नमूना ऑर्डर और उनके पेमेंट व सिंक स्टेटस देखें।',
    descriptionEn: 'Fetch sample recent orders along with payment and fulfillment sync status.',
    sampleLatencyMs: 136,
    responseJson: JSON.stringify(
      {
        demoNotice: 'Sample payload only — no live API call',
        gatewayRoute: 'v1/orders',
        currency: 'INR',
        items: [
          {
            orderId: 'ORD-DEMO-4021',
            channel: 'Web Storefront',
            customer: 'Aarav Sharma',
            amount: 3490,
            paymentStatus: 'captured',
            erpSynced: true,
          },
          {
            orderId: 'ORD-DEMO-4022',
            channel: 'Mobile App',
            customer: 'Neha Verma',
            amount: 1850,
            paymentStatus: 'captured',
            erpSynced: true,
          },
        ],
      },
      null,
      2
    ),
  },
  {
    id: 'invoice',
    method: 'POST',
    path: '/invoice',
    label: 'POST /invoice',
    descriptionHi: 'कन्फ़र्म ऑर्डर से अकाउंटिंग सिस्टम के लिए नमूना इनवॉइस तैयार करें।',
    descriptionEn: 'Generate a sample accounting invoice entry from a confirmed order payload.',
    sampleRequestBody: JSON.stringify(
      {
        orderId: 'ORD-DEMO-4021',
        ledgerTarget: 'Accounting-Sync',
        taxMode: 'GST-18',
        autoNotify: true,
      },
      null,
      2
    ),
    sampleLatencyMs: 164,
    responseJson: JSON.stringify(
      {
        demoNotice: 'Sample payload only — no live API call',
        invoiceNumber: 'INV-DEMO-2026-089',
        orderId: 'ORD-DEMO-4021',
        subtotal: 2957.63,
        tax: 532.37,
        totalInr: 3490.0,
        accountingSync: 'queued_for_ledger',
        webhookEvent: 'invoice.created',
      },
      null,
      2
    ),
  },
  {
    id: 'shipment',
    method: 'GET',
    path: '/shipment/status',
    label: 'GET /shipment/status',
    descriptionHi: 'नमूना शिपमेंट की वर्तमान स्थिति और नोटिफ़िकेशन इवेंट देखें।',
    descriptionEn: 'Retrieve sample shipment milestone tracking and webhook dispatch state.',
    sampleLatencyMs: 118,
    responseJson: JSON.stringify(
      {
        demoNotice: 'Sample payload only — no live API call',
        shipmentId: 'SHP-DEMO-7710',
        awbCode: 'DEMOAWB90412',
        status: 'in_transit',
        currentHub: 'Nagpur Regional Hub',
        lastEvent: 'Dispatched to destination hub',
        customerAlertSent: true,
      },
      null,
      2
    ),
  },
];

const SECURITY_PRINCIPLES = [
  {
    id: 'https',
    icon: Lock,
    titleHi: 'HTTPS एन्क्रिप्शन',
    titleEn: 'HTTPS Encryption',
    descHi: 'सभी API अनुरोधों और वेबहुक पेलोड के लिए एंड-टू-एंड TLS एन्क्रिप्टेड ट्रांसपोर्ट।',
    descEn: 'End-to-end TLS encrypted transport for all API requests and webhook payloads.',
  },
  {
    id: 'auth',
    icon: KeyRound,
    titleHi: 'API Key और OAuth',
    titleEn: 'API Key & OAuth',
    descHi: 'न्यूनतम अधिकार (least-privilege) स्कोप के साथ टोकन व कुंजी आधारित सत्यापन।',
    descEn: 'Least-privilege scoped API keys and OAuth token verification per client.',
  },
  {
    id: 'rate-limit',
    icon: Gauge,
    titleHi: 'Rate Limiting',
    titleEn: 'Rate Limiting',
    descHi: 'अचानक ट्रैफ़िक स्पाइक और अनधिकृत अनुरोधों से बचाव के लिए तय सीमाएँ।',
    descEn: 'Configurable request quotas that protect upstream systems from traffic spikes.',
  },
  {
    id: 'logs',
    icon: ScrollText,
    titleHi: 'एक्सेस लॉग',
    titleEn: 'Access Logs',
    descHi: 'डिबगिंग और पारदर्शिता के लिए समय, रूट और स्टेटस कोड के संरचित रिकॉर्ड।',
    descEn: 'Structured audit records of timestamps, routes, and status codes for traceability.',
  },
  {
    id: 'ip-allowlist',
    icon: ShieldCheck,
    titleHi: 'IP Allowlist',
    titleEn: 'IP Allowlist',
    descHi: 'संवेदनशील इंटरनल एंडपॉइंट्स को केवल अनुमोदित सर्वर नेटवर्क तक सीमित रखना।',
    descEn: 'Restrict sensitive internal endpoints exclusively to approved server IP ranges.',
  },
];

const USE_CASES: IndustryUseCase[] = [
  {
    id: 'ecommerce',
    sectorHi: 'ई-कॉमर्स',
    sectorEn: 'E-Commerce',
    titleHi: 'ऑर्डर, पेमेंट और शिपिंग सिंक',
    titleEn: 'Order, Payment & Shipping Sync',
    summaryHi:
      'वेबसाइट या ऐप पर ऑर्डर आते ही पेमेंट वेरिफ़ाई होकर वेयरहाउस व शिपिंग पोर्टल में स्वतः अपडेट होता है।',
    summaryEn:
      'Automatically validates payments on storefront orders and syncs inventory and courier dispatch without manual copying.',
    image: '/demo/integration-suite/work-ecommerce.jpg',
    flowHi: [
      'स्टोरफ़्रंट से नया ऑर्डर इवेंट सुरक्षित गेटवे में आता है',
      'पेमेंट कैप्चर वेबहुक की पुष्टि और इन्वेंटरी एडजस्टमेंट',
      'लॉजिस्टिक्स पोर्टल में ऑटोमैटिक शिपमेंट व ट्रैकिंग लिंक तैयार',
    ],
    flowEn: [
      'New storefront order event enters the secure API gateway',
      'Payment capture webhook verifies status and updates stock',
      'Dispatch record and customer tracking link created automatically',
    ],
  },
  {
    id: 'accounting',
    sectorHi: 'अकाउंटिंग',
    sectorEn: 'Accounting',
    titleHi: 'इनवॉइस अपने-आप सिंक',
    titleEn: 'Automated Invoice Sync',
    summaryHi:
      'बिक्री, रिफ़ंड और भुगतान की प्रविष्टियाँ सीधे अकाउंटिंग सॉफ्टवेयर में टैक्स विवरण के साथ दर्ज होती हैं।',
    summaryEn:
      'Sales orders, refunds, and payment settlements flow directly into accounting ledgers with clean tax mapping.',
    image: '/demo/integration-suite/work-accounting.jpg',
    flowHi: [
      'बिलिंग या CRM से कन्फ़र्म ऑर्डर डेटा का एक्सट्रैक्शन',
      'ग्राहक लेजर और टैक्स फ़ील्ड की स्वचालित मैपिंग',
      'अकाउंटिंग सॉफ्टवेयर में वाउचर एंट्री और ईमेल रसीद ट्रिगर',
    ],
    flowEn: [
      'Confirmed billing records extracted from CRM or store',
      'Automatic customer ledger and tax line normalization',
      'Voucher pushed to accounting software with email receipt trigger',
    ],
  },
  {
    id: 'logistics',
    sectorHi: 'लॉजिस्टिक्स',
    sectorEn: 'Logistics',
    titleHi: 'शिपमेंट ट्रैकिंग',
    titleEn: 'Shipment Tracking',
    summaryHi:
      'कूरियर पार्टनर्स के स्टेटस वेबहुक एक डैशबोर्ड में जुड़कर ग्राहकों को समय पर अपडेट भेजते हैं।',
    summaryEn:
      'Consolidates courier partner status webhooks into a single operations view with timely delivery alerts.',
    image: '/demo/integration-suite/work-logistics.jpg',
    flowHi: [
      'अलग-अलग कूरियर API से ट्रैकिंग वेबहुक का एकीकरण',
      'पिकअप, ट्रांज़िट और डिलीवरी माइलस्टोन का एक समान फ़ॉर्मेट',
      'देरी या डिलीवरी पर ग्राहक और सपोर्ट टीम को ऑटोमैटिक अलर्ट',
    ],
    flowEn: [
      'Unified intake of tracking webhooks across courier APIs',
      'Normalized pickup, transit, and delivery milestone statuses',
      'Automatic alerts to customers and support on exceptions or delivery',
    ],
  },
  {
    id: 'clinic',
    sectorHi: 'क्लिनिक',
    sectorEn: 'Clinic',
    titleHi: 'अपॉइंटमेंट और मैसेज रिमाइंडर',
    titleEn: 'Appointments & Message Reminders',
    summaryHi:
      'ऑनलाइन बुकिंग, रिसेप्शन कैलेंडर और रिमाइंडर मैसेज एक ही फ़्लो से जुड़कर नो-शो कम करते हैं।',
    summaryEn:
      'Connects online appointment booking, front-desk calendars, and automated patient reminder messages.',
    image: '/demo/integration-suite/work-clinic.jpg',
    flowHi: [
      'वेबसाइट या ऐप से अपॉइंटमेंट बुकिंग का कैलेंडर सिंक',
      'पेशेंट रिकॉर्ड सिस्टम में स्लॉट व डॉक्टर असाइनमेंट अपडेट',
      'तय समय से पहले स्वचालित रिमाइंडर व री-शेड्यूल विकल्प',
    ],
    flowEn: [
      'Online booking synchronized instantly with clinic schedule',
      'Patient record and doctor slot updated through secure API',
      'Scheduled reminder messages dispatched automatically prior to visit',
    ],
  },
];

const PACKAGES: PackageTier[] = [
  {
    id: 'starter',
    nameHi: 'स्टार्टर',
    nameEn: 'Starter',
    priceHi: '₹14,999',
    priceEn: '₹14,999',
    summaryHi: 'छोटे बिज़नेस के लिए शुरुआती ऐप कनेक्शन और ऑटोमेशन सेटअप।',
    summaryEn: 'Essential connector setup for growing teams automating core handoffs.',
    featuresHi: [
      '2 ऐप कनेक्शन (जैसे वेबसाइट + Google Sheets / CRM)',
      'बेसिक वेबहुक सेटअप और डेटा मैपिंग',
      'HTTPS व API Key सुरक्षा कॉन्फ़िगरेशन',
      'बुनियादी टेस्टिंग और हैंडओवर डॉक्यूमेंटेशन',
    ],
    featuresEn: [
      '2 app connections (e.g. Website + Sheets / CRM)',
      'Basic webhook routing and payload mapping',
      'HTTPS and scoped API key setup',
      'Verification testing and handover documentation',
    ],
  },
  {
    id: 'business',
    nameHi: 'बिज़नेस',
    nameEn: 'Business',
    priceHi: '₹44,999',
    priceEn: '₹44,999',
    popular: true,
    summaryHi: 'मल्टी-चैनल बिज़नेस के लिए सेंट्रल API गेटवे और ऑटोमैटिक डेटा सिंक।',
    summaryEn: 'Central API gateway and monitored multi-app sync for scaling operations.',
    featuresHi: [
      '5 ऐप कनेक्शन (स्टोर, पेमेंट, अकाउंटिंग, शिपिंग, CRM)',
      'केंद्रीकृत API गेटवे, रेट लिमिटिंग और OAuth सेटअप',
      'ऑटोमैटिक रीट्राई क्यू और सिंक मॉनिटरिंग लॉग्स',
      'डेडिकेटेड स्टेजिंग टेस्टिंग और तकनीकी गाइड',
    ],
    featuresEn: [
      '5 app connections (Store, Payments, Accounting, Shipping, CRM)',
      'Centralized API gateway, rate limiting, and OAuth setup',
      'Automated retry queues and sync monitoring logs',
      'Staging verification and structured technical documentation',
    ],
  },
  {
    id: 'enterprise',
    nameHi: 'एंटरप्राइज़',
    nameEn: 'Enterprise',
    priceHi: 'कस्टम कोट',
    priceEn: 'Custom Quote',
    summaryHi: 'बड़े संगठनों और पुराने ERP सिस्टम के लिए कस्टम इंटीग्रेशन आर्किटेक्चर।',
    summaryEn: 'Tailored integration architecture for complex multi-system and legacy environments.',
    featuresHi: [
      'अनलिमिटेड कनेक्टर और कस्टम API डेवलपमेंट',
      'बड़ी डेटा पाइपलाइन (ETL) और रियल-टाइम सिंक',
      'गहन सुरक्षा ऑडिट, IP Allowlist और एक्सेस पॉलिसी',
      'कस्टम आर्किटेक्चर रिव्यू और लॉन्ग-टर्म सपोर्ट विकल्प',
    ],
    featuresEn: [
      'Unlimited connectors and custom API development',
      'High-volume ETL pipelines and real-time sync architecture',
      'Security configuration review, IP allowlist, and access policies',
      'Dedicated architecture planning and long-term maintenance options',
    ],
  },
];

const PROCESS_STEPS = [
  {
    step: '01',
    titleHi: 'सिस्टम समझना',
    titleEn: 'System Discovery',
    descHi: 'मौजूदा ऐप्स, डेटाबेस फ़ॉर्मेट और मैनुअल बाधाओं की स्पष्ट मैपिंग।',
    descEn: 'Map existing software, data schemas, and manual workflow bottlenecks.',
  },
  {
    step: '02',
    titleHi: 'इंटीग्रेशन प्लान',
    titleEn: 'Integration Plan',
    descHi: 'एंडपॉइंट कॉन्ट्रैक्ट, डेटा फ़्लो, सुरक्षा नियम और फ़ॉल बैक डिज़ाइन।',
    descEn: 'Define endpoint contracts, data flows, auth boundaries, and error handling.',
  },
  {
    step: '03',
    titleHi: 'कनेक्टर बनाना',
    titleEn: 'Connector Build',
    descHi: 'साफ़, मॉड्यूलर API गेटवे, वेबहुक और ट्रांसफ़ॉर्मेशन लेयर का विकास।',
    descEn: 'Engineer modular gateway routes, webhooks, and schema adapters.',
  },
  {
    step: '04',
    titleHi: 'टेस्टिंग',
    titleEn: 'Testing',
    descHi: 'सैंडबॉक्स डेटा, एज केस, रीट्राई लॉजिक और सुरक्षा नीतियों की पूरी जाँच।',
    descEn: 'Validate payloads, edge cases, retry logic, and access controls in staging.',
  },
  {
    step: '05',
    titleHi: 'लॉन्च और मॉनिटरिंग',
    titleEn: 'Launch & Monitoring',
    descHi: 'सुचारु गो-लाइव, एक्सेस लॉग अवलोकन और टीम हैंडओवर।',
    descEn: 'Smooth rollout with structured log monitoring and team handover.',
  },
];

const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'what-is-integration',
    questionHi: 'इंटीग्रेशन क्या है?',
    questionEn: 'What is API and data integration?',
    answerHi:
      'इंटीग्रेशन का अर्थ है आपके अलग-अलग सॉफ़्टवेयर—जैसे वेबसाइट, पेमेंट गेटवे, CRM और अकाउंटिंग—को सुरक्षित API के ज़रिए जोड़ना, ताकि एक जगह दर्ज जानकारी दूसरी जगह अपने-आप पहुँच सके। यह सेक्शन एक डेमो उदाहरण दिखाता है।',
    answerEn:
      'Integration connects your separate business tools—such as your website, payment gateway, CRM, and accounting software—through secure APIs so records sync automatically without repetitive manual entry. This page demonstrates how such a service website can look.',
  },
  {
    id: 'data-security',
    questionHi: 'क्या मेरा डेटा सुरक्षित रहेगा?',
    questionEn: 'How is business data kept secure?',
    answerHi:
      'असली प्रोजेक्ट में HTTPS एन्क्रिप्शन, स्कोप्ड API Key/OAuth, रेट लिमिटिंग और IP Allowlist जैसे सुरक्षा सिद्धांत अपनाए जाते हैं ताकि केवल अधिकृत सिस्टम ही डेटा का आदान-प्रदान कर सकें। इस डेमो पेज पर कोई वास्तविक डेटा स्टोर या ट्रांसमिट नहीं होता।',
    answerEn:
      'In production implementations, engineering principles like HTTPS encryption, scoped API keys/OAuth, rate limiting, and IP allowlisting restrict access strictly to authorized systems. On this demo website, no live data is stored or transmitted.',
  },
  {
    id: 'legacy-software',
    questionHi: 'क्या पुराने सॉफ़्टवेयर से जुड़ सकता है?',
    questionEn: 'Can it connect with older or on-premise software?',
    answerHi:
      'हाँ, यदि पुराने सॉफ़्टवेयर में API, डेटाबेस कनेक्टर या एक्सपोर्ट/इम्पोर्ट ब्रिज की सुविधा है, तो कस्टम एडॉप्टर लेयर बनाकर उसे आधुनिक वेब और मोबाइल ऐप्स से जोड़ा जा सकता है। यह सामान्य तकनीकी जानकारी डेमो संदर्भ में है।',
    answerEn:
      'Yes, whenever legacy software supports an API, database bridge, or structured export/import connector, a custom adapter layer can link it cleanly to modern web and mobile systems. Exact feasibility depends on each software version.',
  },
  {
    id: 'timeline',
    questionHi: 'कितना समय लगेगा?',
    questionEn: 'How long does an integration project typically take?',
    answerHi:
      'समय इस बात पर निर्भर करता है कि कितने ऐप जोड़ने हैं और डेटा कितना जटिल है—साधारण 2-ऐप वेबहुक कनेक्शन कम समय में तैयार हो सकता है, जबकि कस्टम एंटरप्राइज़ गेटवे व ETL के लिए अधिक योजना व टेस्टिंग चरण लगते हैं।',
    answerEn:
      'Timelines depend on the number of systems and payload complexity—straightforward two-app webhook flows take far less time than multi-system custom gateways and ETL pipelines with full staging tests.',
  },
];

const FLOW_SOURCES = [
  { id: 'website', icon: Globe, labelHi: 'वेबसाइट', labelEn: 'Website', proto: 'REST JSON' },
  { id: 'mobile', icon: Smartphone, labelHi: 'मोबाइल ऐप', labelEn: 'Mobile App', proto: 'OAuth 2.0' },
  { id: 'payment', icon: CreditCard, labelHi: 'पेमेंट', labelEn: 'Payments', proto: 'Signed Webhook' },
  { id: 'whatsapp', icon: MessageSquare, labelHi: 'WhatsApp', labelEn: 'WhatsApp', proto: 'Event Hook' },
];

const FLOW_DESTINATIONS = [
  { id: 'crm', icon: Building2, labelHi: 'CRM', labelEn: 'CRM', sync: 'Lead & Order' },
  { id: 'accounting', icon: FileSpreadsheet, labelHi: 'अकाउंटिंग', labelEn: 'Accounting', sync: 'Invoice Ledger' },
  { id: 'database', icon: Database, labelHi: 'डेटाबेस', labelEn: 'Database', sync: 'Normalized Store' },
  { id: 'email', icon: Mail, labelHi: 'ईमेल', labelEn: 'Email', sync: 'Alerts & Receipts' },
];

const FORM_APP_OPTIONS = [
  'Website / Store',
  'Mobile App',
  'CRM (Zoho / Custom)',
  'Tally / Accounting',
  'Razorpay / Payments',
  'Shiprocket / Logistics',
  'WhatsApp API',
  'Google Sheets',
  'MySQL / PostgreSQL',
];

function DemoImage({
  src,
  alt,
  className,
  eager = false,
}: {
  src: string;
  alt: string;
  className?: string;
  eager?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#0d1929] via-[#0b1322] to-[#0a1d1f] text-slate-300 ${className || ''}`}
        role="img"
        aria-label={alt}
      >
        <Plug2 className="w-8 h-8 text-emerald-400/80 mb-2" />
        <span className="text-xs font-medium text-slate-400 px-4 text-center">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}

export const IntegrationSuiteDemo: React.FC<IntegrationSuiteDemoProps> = ({
  onBackToHome,
  onRequestQuote,
}) => {
  const { language, setLanguage } = useLanguage();
  const isHi = language === 'hi';

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceDetail | null>(null);
  const [selectedUseCase, setSelectedUseCase] = useState<IndustryUseCase | null>(null);
  const [activeConnector, setActiveConnector] = useState<ConnectorItem>(CONNECTORS[0]);
  const [activeSourceId, setActiveSourceId] = useState<string>('website');
  const [openFaqId, setOpenFaqId] = useState<string>(FAQ_ITEMS[0].id);

  // Sample API Tester state (100% local, zero network requests)
  const [selectedEndpointId, setSelectedEndpointId] = useState<'orders' | 'invoice' | 'shipment'>('orders');
  const [isTestingApi, setIsTestingApi] = useState(false);
  const [apiResult, setApiResult] = useState<{
    endpointId: string;
    status: string;
    latencyMs: number;
    timestamp: string;
    json: string;
  } | null>(null);
  const [copiedJson, setCopiedJson] = useState(false);
  const testerTimerRef = useRef<number | null>(null);

  // Local-only Integration Plan Form state (ZERO Firestore / ZERO API calls)
  const [formName, setFormName] = useState('');
  const [formCompany, setFormCompany] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [selectedApps, setSelectedApps] = useState<string[]>(['Website / Store', 'Tally / Accounting']);
  const [formMessage, setFormMessage] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitted, setFormSubmitted] = useState(false);

  // Lightweight scroll reveal visibility state (keeps DOM immediately reachable)
  const [revealedSections, setRevealedSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    return () => {
      if (testerTimerRef.current !== null) {
        window.clearTimeout(testerTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;
    const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const nodes = document.querySelectorAll<HTMLElement>('[data-reveal-section]');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const key = entry.target.getAttribute('data-reveal-section');
            if (key) {
              setRevealedSections((prev) => (prev[key] ? prev : { ...prev, [key]: true }));
            }
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -30px 0px' }
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  const currentEndpoint =
    SAMPLE_ENDPOINTS.find((ep) => ep.id === selectedEndpointId) || SAMPLE_ENDPOINTS[0];

  const scrollToSection = (sectionId: string) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleRunSampleApi = () => {
    if (isTestingApi) return;
    setIsTestingApi(true);
    setCopiedJson(false);

    if (testerTimerRef.current !== null) {
      window.clearTimeout(testerTimerRef.current);
    }

    const endpoint = currentEndpoint;
    testerTimerRef.current = window.setTimeout(() => {
      const now = new Date();
      const timeLabel = now.toTimeString().slice(0, 8);
      setApiResult({
        endpointId: endpoint.id,
        status: '200 OK',
        latencyMs: endpoint.sampleLatencyMs,
        timestamp: timeLabel,
        json: endpoint.responseJson,
      });
      setIsTestingApi(false);
    }, 800);
  };

  const handleCopyResponse = () => {
    if (!apiResult) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(apiResult.json).catch(() => {});
    }
    setCopiedJson(true);
    window.setTimeout(() => setCopiedJson(false), 1800);
  };

  const toggleAppChip = (appName: string) => {
    setFormSubmitted(false);
    setFormError(null);
    setSelectedApps((prev) =>
      prev.includes(appName) ? prev.filter((item) => item !== appName) : [...prev, appName]
    );
  };

  const handleSelectPackage = (pkgName: string) => {
    setFormMessage((prev) =>
      prev.trim()
        ? prev
        : isHi
        ? `${pkgName} नमूना पैकेज के अनुसार इंटीग्रेशन प्लान की जानकारी चाहिए।`
        : `Interested in an integration plan similar to the ${pkgName} sample package.`
    );
    scrollToSection('contact');
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSubmitted(false);

    const trimmedName = formName.trim();
    const trimmedCompany = formCompany.trim();
    const digitsOnly = formPhone.replace(/\D/g, '');

    if (trimmedName.length < 2) {
      setFormError(
        isHi ? 'कृपया अपना सही नाम दर्ज करें।' : 'Please enter your full name.'
      );
      return;
    }
    if (trimmedCompany.length < 2) {
      setFormError(
        isHi ? 'कृपया कंपनी या बिज़नेस का नाम दर्ज करें।' : 'Please enter your company or business name.'
      );
      return;
    }
    if (digitsOnly.length < 10 || digitsOnly.length > 13) {
      setFormError(
        isHi
          ? 'कृपया कम से कम 10 अंकों का वैध मोबाइल नंबर दर्ज करें।'
          : 'Please enter a valid 10-digit mobile number.'
      );
      return;
    }
    if (selectedApps.length === 0) {
      setFormError(
        isHi
          ? 'कृपया जोड़ने के लिए कम से कम एक ऐप चुनें।'
          : 'Please select at least one app to connect.'
      );
      return;
    }
    if (formMessage.trim().length < 5) {
      setFormError(
        isHi
          ? 'कृपया अपनी आवश्यकता के बारे में संक्षिप्त संदेश लिखें।'
          : 'Please enter a short note about your integration requirement.'
      );
      return;
    }

    // Strictly local state — NO Firestore write and NO API call
    setFormSubmitted(true);
  };

  const navLinks = [
    { id: 'hero', hi: 'होम', en: 'Home' },
    { id: 'services', hi: 'सेवाएँ', en: 'Services' },
    { id: 'connectors', hi: 'कनेक्टर', en: 'Connectors' },
    { id: 'api-tester', hi: 'API टेस्टर', en: 'API Tester' },
    { id: 'security', hi: 'सुरक्षा', en: 'Security' },
    { id: 'use-cases', hi: 'उपयोग', en: 'Use Cases' },
    { id: 'packages', hi: 'पैकेज', en: 'Packages' },
    { id: 'contact', hi: 'संपर्क', en: 'Contact' },
  ];

  const revealClass = (key: string) =>
    `transition-all duration-500 ease-out ${
      revealedSections[key] === false ? 'opacity-95 translate-y-2' : 'opacity-100 translate-y-0'
    }`;

  return (
    <div
      className="min-h-screen bg-[#070c14] text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-200 relative overflow-x-clip"
      style={{
        backgroundImage:
          'radial-gradient(rgba(56, 189, 248, 0.08) 1px, transparent 1px)',
        backgroundSize: '26px 26px',
      }}
    >
      {/* Lightweight CSS keyframes for flowing data-flow dots (compositor-only transform) */}
      <style>{`
        @keyframes isuiteFlowX {
          0% { transform: translateX(0%); opacity: 0.15; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { transform: translateX(100%); opacity: 0.15; }
        }
        @keyframes isuiteFlowY {
          0% { transform: translateY(0%); opacity: 0.15; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { transform: translateY(100%); opacity: 0.15; }
        }
        .isuite-dot-x {
          animation: isuiteFlowX 2.4s linear infinite;
        }
        .isuite-dot-x-delay {
          animation: isuiteFlowX 2.4s linear 1.2s infinite;
        }
        .isuite-dot-y {
          animation: isuiteFlowY 2.2s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .isuite-dot-x,
          .isuite-dot-x-delay,
          .isuite-dot-y {
            animation: none !important;
          }
        }
      `}</style>

      {/* Unified Sticky Top Bar: Slim Demo Disclaimer + Brand Navigation */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-[#070c14]/92 border-b border-slate-800/80">
        {/* Top Sticky Demo Strip */}
        <div className="border-b border-emerald-500/20 bg-gradient-to-r from-[#07191a] via-[#091526] to-[#07191a]">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 py-1.5 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <button
                type="button"
                onClick={onBackToHome}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-100 font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isHi ? 'Power Web Studio AI पर वापस' : 'Back to Power Web Studio AI'}</span>
              </button>
              <span className="hidden sm:inline text-slate-300 truncate">
                {isHi
                  ? 'DEMO वेबसाइट — यह केवल नमूना है'
                  : 'DEMO Website — Sample Preview Only'}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="sm:hidden text-[11px] font-medium text-emerald-300 whitespace-nowrap">
                {isHi ? 'DEMO नमूना' : 'DEMO Sample'}
              </span>
              <div
                className="inline-flex items-center rounded-md border border-slate-700/80 bg-slate-900/80 p-0.5"
                role="group"
                aria-label="Language switch"
              >
                <button
                  type="button"
                  onClick={() => setLanguage('hi')}
                  className={`px-2 py-0.5 text-[11px] font-semibold rounded transition-colors cursor-pointer whitespace-nowrap ${
                    isHi
                      ? 'bg-emerald-500 text-slate-950'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  हिंदी
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`px-2 py-0.5 text-[11px] font-semibold rounded transition-colors cursor-pointer whitespace-nowrap ${
                    !isHi
                      ? 'bg-emerald-500 text-slate-950'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  EN
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Header Bar */}
        <header className="max-w-7xl mx-auto px-3 sm:px-6 h-14 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => scrollToSection('hero')}
            className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 cursor-pointer group"
          >
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-sky-500 flex items-center justify-center text-slate-950 shadow-sm shadow-emerald-500/20">
              <Plug2 className="w-4 h-4 stroke-[2.4]" />
            </span>
            <span className="text-sm sm:text-base font-extrabold tracking-tight text-white">
              INTEGRATION <span className="text-emerald-400">SUITE</span>
            </span>
          </button>

          {/* Desktop Nav */}
          <nav
            aria-label="Primary navigation"
            className="hidden lg:flex items-center gap-5 text-[13px] font-medium text-slate-300"
          >
            {navLinks.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollToSection(item.id)}
                className="hover:text-emerald-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1"
              >
                {isHi ? item.hi : item.en}
              </button>
            ))}
          </nav>

          {/* Right Primary Action & Mobile Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => scrollToSection('contact')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-emerald-500 to-sky-500 text-slate-950 hover:shadow-[0_0_22px_rgba(16,185,129,0.45)] transition-all whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>{isHi ? 'फ़्री इंटीग्रेशन प्लान' : 'Free Integration Plan'}</span>
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={isHi ? 'मेन्यू खोलें' : 'Toggle menu'}
              aria-expanded={mobileMenuOpen}
              className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg border border-slate-700/80 bg-slate-900/90 text-slate-100 hover:border-emerald-500/60 transition-colors cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Mobile Drawer Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-800 bg-[#09111d]/98 px-4 py-4 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {navLinks.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => scrollToSection(item.id)}
                  className="text-left px-3 py-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-sm font-medium text-slate-200 hover:border-emerald-500/50 hover:text-emerald-300 transition-colors cursor-pointer"
                >
                  {isHi ? item.hi : item.en}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => scrollToSection('contact')}
              className="w-full py-2.5 px-4 rounded-lg text-sm font-bold bg-gradient-to-r from-emerald-500 to-sky-500 text-slate-950 cursor-pointer"
            >
              {isHi ? 'फ़्री इंटीग्रेशन प्लान' : 'Free Integration Plan'}
            </button>
          </div>
        )}
      </div>

      {/* HERO SECTION */}
      <section id="hero" className="relative overflow-hidden border-b border-slate-800/80">
        <div className="absolute inset-0">
          <DemoImage
            src="/demo/integration-suite/hero.jpg"
            alt={
              isHi
                ? 'इंटीग्रेशन सुइट एंटरप्राइज़ एपीआई गेटवे केंद्र'
                : 'Integration Suite enterprise API gateway center'
            }
            eager
            className="w-full h-full object-cover object-center opacity-45"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#060b13]/96 via-[#070f1d]/88 to-[#06131c]/82" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#070c14] via-transparent to-[#070c14]/60" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <p className="text-xs sm:text-sm font-semibold text-emerald-300 tracking-wide">
                {isHi
                  ? 'इंटीग्रेशन सुइट · सुरक्षित एपीआई गेटवे और डेटा इंटीग्रेशन'
                  : 'Integration Suite · Secure API Gateway & Data Integration'}
              </p>

              <h1 className="text-3xl sm:text-5xl font-extrabold text-white leading-[1.15] tracking-tight text-balance max-w-2xl">
                {isHi
                  ? 'आपके सभी ऐप्स और डेटा, एक सुरक्षित गेटवे से जुड़े'
                  : 'All Your Apps & Data, Connected Through One Secure Gateway'}
              </h1>

              <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl">
                {isHi
                  ? 'API गेटवे, डेटा सिंक, वेबहुक और ऑटोमेशन — बिना मैनुअल काम।'
                  : 'API gateway, real-time data sync, verified webhooks, and workflow automation — without manual effort.'}
              </p>

              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <button
                  type="button"
                  onClick={() => scrollToSection('services')}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-gradient-to-r from-emerald-500 to-sky-500 text-slate-950 font-bold text-sm hover:shadow-[0_0_28px_rgba(16,185,129,0.45)] transition-all whitespace-nowrap cursor-pointer"
                >
                  <span>{isHi ? 'सेवाएँ देखें' : 'Explore Services'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection('api-tester')}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-slate-900/80 hover:bg-slate-800/90 border border-sky-400/40 text-sky-200 font-semibold text-sm hover:shadow-[0_0_24px_rgba(56,189,248,0.28)] transition-all whitespace-nowrap cursor-pointer"
                >
                  <Code2 className="w-4 h-4 text-sky-400" />
                  <span>{isHi ? 'API आज़माएँ' : 'Try Sample API'}</span>
                </button>
              </div>
            </div>

            {/* Clean Monospace Gateway Request Blueprint Card (Sample Blueprint Only) */}
            <div className="lg:col-span-5">
              <div className="rounded-xl backdrop-blur-md bg-[#0b1322]/85 border border-slate-700/70 p-5 sm:p-6 shadow-2xl shadow-black/40 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 text-xs font-mono text-slate-400">
                  <span className="text-emerald-300 font-semibold">gateway.route.config</span>
                  <span>{isHi ? 'नमूना कॉन्फ़िग' : 'Sample Config'}</span>
                </div>

                <pre className="text-xs sm:text-[13px] font-mono leading-relaxed text-slate-200 overflow-x-auto">
                  <code>{`{
  "gateway": "secure-edge-router",
  "transport": "HTTPS / TLS",
  "auth": ["OAuth 2.0", "Scoped API Key"],
  "routes": [
    "GET  /orders          -> ERP + CRM",
    "POST /invoice         -> Accounting",
    "GET  /shipment/status -> Tracking"
  ],
  "delivery": "signed-webhook + retry"
}`}</code>
                </pre>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span>{isHi ? 'इवेंट-ड्रिवन आर्किटेक्चर' : 'Event-driven architecture'}</span>
                  <button
                    type="button"
                    onClick={() => scrollToSection('api-tester')}
                    className="text-sky-300 hover:text-sky-200 font-semibold inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                  >
                    <span>{isHi ? 'टेस्टर खोलें' : 'Open Tester'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES SECTION (6 Photo Cards with Hover Zoom + Scope Modal) */}
      <section
        id="services"
        data-reveal-section="services"
        className={`py-16 sm:py-22 border-b border-slate-800/70 ${revealClass('services')}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mb-10 sm:mb-12 space-y-3">
            <p className="text-xs font-semibold text-emerald-400 tracking-wide">
              {isHi ? '01. प्रमुख सेवाएँ' : '01. Core Capabilities'}
            </p>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight text-balance">
              {isHi
                ? 'एंटरप्राइज़ API और डेटा इंटीग्रेशन सेवाएँ'
                : 'Enterprise API & Data Integration Services'}
            </h2>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
              {isHi
                ? 'हर व्यवसाय के अलग-अलग ऐप्स और डेटाबेस को एक सुरक्षित, व्यवस्थित और विश्वसनीय नेटवर्क में जोड़ने के लिए मॉड्यूलर समाधान।'
                : 'Modular engineering services to connect your web apps, payment systems, ERPs, and databases cleanly.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.map((service) => (
              <article
                key={service.id}
                className="group rounded-xl overflow-hidden backdrop-blur-md bg-[#0c1524]/85 border border-slate-800 hover:border-emerald-500/45 transition-all duration-300 flex flex-col"
              >
                <div className="aspect-[4/3] overflow-hidden bg-slate-950 relative">
                  <DemoImage
                    src={service.image}
                    alt={isHi ? service.titleHi : service.titleEn}
                    className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0c1524] via-transparent to-transparent opacity-70" />
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-white leading-snug">
                      {isHi ? service.titleHi : service.titleEn}
                    </h3>
                    <p className="text-sm text-slate-400 leading-relaxed line-clamp-2">
                      {isHi ? service.shortDescHi : service.shortDescEn}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedService(service)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300 hover:text-emerald-200 transition-colors w-fit cursor-pointer"
                  >
                    <span>{isHi ? 'और जानें' : 'Learn More'}</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* DATA FLOW SECTION (Sources -> Glowing Secure Gateway -> Destinations with CSS flowing dots) */}
      <section
        id="data-flow"
        data-reveal-section="data-flow"
        className={`py-16 sm:py-22 border-b border-slate-800/70 bg-[#09101c]/70 ${revealClass('data-flow')}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mb-10 sm:mb-12 space-y-3">
            <p className="text-xs font-semibold text-sky-400 tracking-wide">
              {isHi ? '02. डेटा फ़्लो आर्किटेक्चर' : '02. Data Flow Architecture'}
            </p>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight text-balance">
              {isHi
                ? 'सोर्स से डेस्टिनेशन तक सुरक्षित डेटा फ़्लो'
                : 'Secure Data Flow from Sources to Destinations'}
            </h2>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
              {isHi
                ? 'किसी भी सोर्स पर क्लिक करें और देखें कैसे सभी इवेंट्स एक ही सुरक्षित गेटवे से होकर आपके बिज़नेस टूल्स तक पहुँचते हैं।'
                : 'Select any source channel below to inspect how events move through one verified gateway into your business tools.'}
            </p>
          </div>

          <div className="rounded-2xl backdrop-blur-md bg-[#0b1423]/90 border border-slate-800 p-5 sm:p-8 lg:p-10">
            <div className="grid grid-cols-1 lg:grid-cols-11 gap-6 lg:gap-4 items-center">
              {/* Left Column: Sources */}
              <div className="lg:col-span-3 space-y-3">
                <div className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  {isHi ? 'सोर्स (Sources)' : 'Sources'}
                </div>
                {FLOW_SOURCES.map((src) => {
                  const Icon = src.icon;
                  const active = activeSourceId === src.id;
                  return (
                    <button
                      key={src.id}
                      type="button"
                      onClick={() => setActiveSourceId(src.id)}
                      className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-left transition-all cursor-pointer ${
                        active
                          ? 'bg-emerald-500/12 border-emerald-400/60 text-white shadow-[0_0_20px_rgba(16,185,129,0.16)]'
                          : 'bg-slate-900/75 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <span className="flex items-center gap-3 min-w-0">
                        <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-emerald-400' : 'text-sky-400'}`} />
                        <span className="text-sm font-semibold truncate">
                          {isHi ? src.labelHi : src.labelEn}
                        </span>
                      </span>
                      <span className="text-[11px] font-mono text-slate-400 whitespace-nowrap shrink-0">
                        {src.proto}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Left Animated Connector Track */}
              <div className="lg:col-span-1 flex lg:flex-col items-center justify-center py-1 lg:py-0" aria-hidden="true">
                {/* Desktop horizontal animated line */}
                <div className="hidden lg:block w-full relative h-8">
                  <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-emerald-500/30 via-emerald-400/70 to-sky-400/70" />
                  <div className="absolute top-1/2 -translate-y-1/2 left-0 right-2 overflow-hidden h-3">
                    <div className="w-full h-full relative">
                      <span className="isuite-dot-x absolute top-0.5 left-0 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#10b981]" />
                      <span className="isuite-dot-x-delay absolute top-0.5 left-0 w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_10px_#38bdf8]" />
                    </div>
                  </div>
                </div>
                {/* Mobile vertical animated line */}
                <div className="lg:hidden relative w-6 h-10 flex justify-center">
                  <div className="w-px h-full bg-gradient-to-b from-emerald-400/40 via-emerald-400 to-sky-400/60" />
                  <div className="absolute top-0 bottom-2 inset-x-0 flex justify-center overflow-hidden">
                    <span className="isuite-dot-y w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
                  </div>
                </div>
              </div>

              {/* Center: Glowing Secure Gateway Box */}
              <div className="lg:col-span-3">
                <div className="rounded-2xl p-6 text-center bg-gradient-to-b from-[#0d2226] via-[#0c1c2e] to-[#0a1424] border border-emerald-400/55 shadow-[0_0_36px_rgba(16,185,129,0.22)] space-y-4">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500/20 to-sky-500/20 border border-emerald-400/50 flex items-center justify-center">
                    <Lock className="w-7 h-7 text-emerald-300" />
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-lg font-extrabold text-white">
                      {isHi ? 'सुरक्षित गेटवे' : 'Secure Gateway'}
                    </h3>
                    <p className="text-xs font-mono text-emerald-300">
                      HTTPS · OAuth · Rate Limit · Schema Check
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-700/70 text-xs text-slate-300 space-y-1">
                    <div>
                      {isHi ? 'सक्रिय सोर्स:' : 'Selected source:'}{' '}
                      <span className="font-semibold text-white">
                        {isHi
                          ? FLOW_SOURCES.find((s) => s.id === activeSourceId)?.labelHi
                          : FLOW_SOURCES.find((s) => s.id === activeSourceId)?.labelEn}
                      </span>
                    </div>
                    <div className="font-mono text-[11px] text-sky-300">
                      {isHi ? 'सत्यापन → मैपिंग → सिंक' : 'Verify → Transform → Dispatch'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Animated Connector Track */}
              <div className="lg:col-span-1 flex lg:flex-col items-center justify-center py-1 lg:py-0" aria-hidden="true">
                <div className="hidden lg:block w-full relative h-8">
                  <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-sky-400/70 via-emerald-400/70 to-emerald-500/30" />
                  <div className="absolute top-1/2 -translate-y-1/2 left-0 right-2 overflow-hidden h-3">
                    <div className="w-full h-full relative">
                      <span className="isuite-dot-x absolute top-0.5 left-0 w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_10px_#38bdf8]" />
                      <span className="isuite-dot-x-delay absolute top-0.5 left-0 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#10b981]" />
                    </div>
                  </div>
                </div>
                <div className="lg:hidden relative w-6 h-10 flex justify-center">
                  <div className="w-px h-full bg-gradient-to-b from-sky-400/60 via-emerald-400 to-emerald-400/40" />
                  <div className="absolute top-0 bottom-2 inset-x-0 flex justify-center overflow-hidden">
                    <span className="isuite-dot-y w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_8px_#38bdf8]" />
                  </div>
                </div>
              </div>

              {/* Right Column: Destinations */}
              <div className="lg:col-span-3 space-y-3">
                <div className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  {isHi ? 'डेस्टिनेशन (Destinations)' : 'Destinations'}
                </div>
                {FLOW_DESTINATIONS.map((dest) => {
                  const Icon = dest.icon;
                  return (
                    <div
                      key={dest.id}
                      className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-slate-800 bg-slate-900/75 text-slate-200"
                    >
                      <span className="flex items-center gap-3 min-w-0">
                        <Icon className="w-4 h-4 shrink-0 text-emerald-400" />
                        <span className="text-sm font-semibold truncate">
                          {isHi ? dest.labelHi : dest.labelEn}
                        </span>
                      </span>
                      <span className="text-[11px] font-mono text-slate-400 whitespace-nowrap shrink-0">
                        {dest.sync}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CONNECTORS GRID (12 Text-Only Chips, No Logo Images, No Partner Claims) */}
      <section
        id="connectors"
        data-reveal-section="connectors"
        className={`py-16 sm:py-22 border-b border-slate-800/70 ${revealClass('connectors')}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 sm:mb-10">
            <div className="space-y-2.5 max-w-2xl">
              <p className="text-xs font-semibold text-emerald-400 tracking-wide">
                {isHi ? '03. नमूना कनेक्टर सूची' : '03. Sample Connector Directory'}
              </p>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                {isHi
                  ? 'प्रमुख प्रोटोकॉल और बिज़नेस टूल्स के साथ संगत'
                  : 'Compatible with Core Protocols & Business Tools'}
              </h2>
            </div>
            <p className="text-xs text-slate-400 md:text-right">
              {isHi
                ? 'नमूना कनेक्टर सूची — केवल उदाहरण, किसी ब्रांड से पार्टनरशिप का दावा नहीं।'
                : 'Sample connector list — illustrative only, no partner endorsement implied.'}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {CONNECTORS.map((connector) => {
              const isSelected = activeConnector.id === connector.id;
              return (
                <button
                  key={connector.id}
                  type="button"
                  onClick={() => setActiveConnector(connector)}
                  className={`px-4 py-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                    isSelected
                      ? 'bg-emerald-500/12 border-emerald-400/60 text-white shadow-[0_0_18px_rgba(16,185,129,0.16)]'
                      : 'bg-[#0c1524]/80 border-slate-800 text-slate-200 hover:border-sky-400/50'
                  }`}
                >
                  <span className="font-mono text-sm font-bold truncate">{connector.name}</span>
                  <span className="text-[11px] text-slate-400 whitespace-nowrap shrink-0">
                    {isHi ? connector.categoryHi : connector.categoryEn}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Selected Connector Detail Bar */}
          <div className="mt-5 rounded-xl bg-[#0b1322]/90 border border-slate-800 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="text-xs font-mono text-sky-300">
                {activeConnector.name} ·{' '}
                {isHi ? activeConnector.categoryHi : activeConnector.categoryEn}
              </div>
              <p className="text-sm text-slate-300">
                {isHi ? activeConnector.roleHi : activeConnector.roleEn}
              </p>
            </div>
            <button
              type="button"
              onClick={() => scrollToSection('contact')}
              className="text-xs font-bold text-emerald-300 hover:text-emerald-200 whitespace-nowrap shrink-0 inline-flex items-center gap-1 cursor-pointer"
            >
              <span>{isHi ? 'कनेक्टर प्लान पूछें' : 'Ask About This Connector'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* SAMPLE API TESTER (100% Interactive Local Simulation — ZERO Live API Calls) */}
      <section
        id="api-tester"
        data-reveal-section="api-tester"
        className={`py-16 sm:py-22 border-b border-slate-800/70 bg-[#09101c]/70 ${revealClass('api-tester')}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 sm:mb-10">
            <div className="space-y-2.5 max-w-2xl">
              <p className="text-xs font-semibold text-sky-400 tracking-wide">
                {isHi ? '04. इंटरैक्टिव API टेस्टर' : '04. Interactive API Tester'}
              </p>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                {isHi ? 'नमूना API रिस्पॉन्स आज़माकर देखें' : 'Try a Sample API Request'}
              </h2>
              <p className="text-sm sm:text-base text-slate-400">
                {isHi
                  ? 'नीचे से कोई भी एंडपॉइंट चुनें और Send दबाकर देखें कि गेटवे से संरचित JSON जवाब कैसे प्राप्त होता है।'
                  : 'Select an endpoint below and click Send to inspect a pre-written structured JSON gateway response.'}
              </p>
            </div>

            <div className="text-xs font-mono text-amber-300 border border-amber-500/35 bg-amber-500/10 px-3 py-1.5 rounded-lg w-fit whitespace-nowrap">
              {isHi ? 'नमूना डेटा — असली API नहीं' : 'Sample Data — Not a Live API'}
            </div>
          </div>

          <div className="rounded-2xl backdrop-blur-md bg-[#0b1322]/92 border border-slate-800 overflow-hidden shadow-2xl shadow-black/30">
            {/* Request Toolbar */}
            <div className="p-4 sm:p-5 border-b border-slate-800 bg-[#0d1729]/90 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <label htmlFor="endpoint-select" className="sr-only">
                  {isHi ? 'API एंडपॉइंट चुनें' : 'Select API Endpoint'}
                </label>
                <div className="relative flex-1">
                  <select
                    id="endpoint-select"
                    value={selectedEndpointId}
                    onChange={(e) => {
                      const val = e.target.value as 'orders' | 'invoice' | 'shipment';
                      setSelectedEndpointId(val);
                      setApiResult(null);
                    }}
                    className="w-full appearance-none rounded-lg bg-[#070c14] border border-slate-700 px-4 py-2.5 pr-10 text-sm font-mono font-semibold text-white focus:outline-none focus:border-emerald-400 cursor-pointer"
                  >
                    {SAMPLE_ENDPOINTS.map((ep) => (
                      <option key={ep.id} value={ep.id}>
                        {ep.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
                </div>

                <div className="hidden md:flex items-center px-3 py-2 rounded-lg bg-[#070c14] border border-slate-800 font-mono text-xs text-slate-400 whitespace-nowrap">
                  sample://gateway{currentEndpoint.path}
                </div>
              </div>

              <button
                type="button"
                onClick={handleRunSampleApi}
                disabled={isTestingApi}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-sky-500 text-slate-950 font-bold text-sm hover:shadow-[0_0_24px_rgba(16,185,129,0.4)] disabled:opacity-70 transition-all whitespace-nowrap shrink-0 cursor-pointer"
              >
                {isTestingApi ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{isHi ? 'प्रोसेस हो रहा है...' : 'Sending...'}</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Send</span>
                  </>
                )}
              </button>
            </div>

            {/* Split Body: Request Blueprint + Response Console */}
            <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
              {/* Left: Endpoint Request Info */}
              <div className="lg:col-span-5 p-5 sm:p-6 space-y-4">
                <div className="flex items-center gap-2.5 font-mono text-xs">
                  <span
                    className={`px-2 py-0.5 rounded font-bold ${
                      currentEndpoint.method === 'POST'
                        ? 'bg-sky-500/20 text-sky-300'
                        : 'bg-emerald-500/20 text-emerald-300'
                    }`}
                  >
                    {currentEndpoint.method}
                  </span>
                  <span className="text-slate-200 font-semibold">{currentEndpoint.path}</span>
                </div>

                <p className="text-sm text-slate-300 leading-relaxed">
                  {isHi ? currentEndpoint.descriptionHi : currentEndpoint.descriptionEn}
                </p>

                <div className="space-y-2">
                  <div className="text-xs font-mono text-slate-400">
                    {isHi ? 'नमूना हेडर (Demo Headers)' : 'Sample Headers'}
                  </div>
                  <div className="rounded-lg bg-[#070c14] border border-slate-800 p-3 font-mono text-xs text-slate-300 space-y-1">
                    <div>Accept: application/json</div>
                    <div>Authorization: Bearer &lt;demo-token-placeholder&gt;</div>
                  </div>
                </div>

                {currentEndpoint.sampleRequestBody && (
                  <div className="space-y-2">
                    <div className="text-xs font-mono text-slate-400">
                      {isHi ? 'नमूना रिक्वेस्ट बॉडी (JSON)' : 'Sample Request Body (JSON)'}
                    </div>
                    <pre className="rounded-lg bg-[#070c14] border border-slate-800 p-3 font-mono text-xs text-sky-200 overflow-x-auto">
                      <code>{currentEndpoint.sampleRequestBody}</code>
                    </pre>
                  </div>
                )}
              </div>

              {/* Right: Sample Response Output */}
              <div className="lg:col-span-7 p-5 sm:p-6 flex flex-col justify-between gap-4 bg-[#080e19]">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-3 font-mono text-xs">
                    <span className="text-slate-400">{isHi ? 'रिस्पॉन्स:' : 'Response:'}</span>
                    {apiResult ? (
                      <>
                        <span className="text-emerald-300 font-bold">{apiResult.status}</span>
                        <span className="text-slate-600">·</span>
                        <span className="text-sky-300 tabular-nums">{apiResult.latencyMs} ms</span>
                        <span className="text-slate-600">·</span>
                        <span className="text-slate-400 tabular-nums">{apiResult.timestamp}</span>
                      </>
                    ) : (
                      <span className="text-slate-500">
                        {isHi ? 'Send दबाने की प्रतीक्षा' : 'Ready — click Send'}
                      </span>
                    )}
                  </div>

                  {apiResult && (
                    <button
                      type="button"
                      onClick={handleCopyResponse}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-slate-700 hover:border-emerald-400/60 text-xs font-mono text-slate-300 hover:text-white transition-colors cursor-pointer"
                    >
                      {copiedJson ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{isHi ? 'कॉपी हुआ' : 'Copied'}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>{isHi ? 'JSON कॉपी करें' : 'Copy JSON'}</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {isTestingApi ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center gap-3">
                    <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin" />
                    <p className="text-xs font-mono text-slate-400">
                      {isHi
                        ? 'स्थानीय नमूना रिस्पॉन्स तैयार किया जा रहा है (0.8 सेकंड)...'
                        : 'Preparing local sample response (0.8s)...'}
                    </p>
                  </div>
                ) : apiResult ? (
                  <pre className="rounded-xl bg-[#050911] border border-slate-800 p-4 font-mono text-xs sm:text-[13px] leading-relaxed text-emerald-200 overflow-x-auto max-h-80">
                    <code>{apiResult.json}</code>
                  </pre>
                ) : (
                  <div className="py-12 flex flex-col items-center justify-center text-center gap-2 border border-dashed border-slate-800 rounded-xl bg-[#060b13]">
                    <Code2 className="w-6 h-6 text-slate-500" />
                    <p className="text-sm text-slate-400 max-w-sm px-4">
                      {isHi
                        ? '"Send" बटन दबाएँ और चुने गए एंडपॉइंट का नमूना JSON रिस्पॉन्स और 200 OK स्टेटस देखें।'
                        : 'Press "Send" to preview the pre-written JSON payload, 200 OK status, and sample timing.'}
                    </p>
                  </div>
                )}

                <p className="text-[11px] text-slate-500">
                  {isHi
                    ? 'यह टेस्टर पूरी तरह ब्राउज़र में स्थानीय नमूना डेटा दिखाता है — कोई बाहरी नेटवर्क अनुरोध या API कुंजी उपयोग नहीं की जाती।'
                    : 'This tester runs entirely with local sample payloads in the browser — zero network requests or API keys are used.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECURITY PRINCIPLES SECTION (Principles Only — Zero Certification Claims) */}
      <section
        id="security"
        data-reveal-section="security"
        className={`py-16 sm:py-22 border-b border-slate-800/70 ${revealClass('security')}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mb-10 sm:mb-12 space-y-3">
            <p className="text-xs font-semibold text-emerald-400 tracking-wide">
              {isHi ? '05. सुरक्षा सिद्धांत' : '05. Security Principles'}
            </p>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight text-balance">
              {isHi
                ? 'हर API कनेक्शन के लिए बुनियादी सुरक्षा मानक'
                : 'Core Security Principles Built Into Every Connection'}
            </h2>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
              {isHi
                ? 'ये मानक इंजीनियरिंग सुरक्षा अभ्यास हैं जिन्हें प्रोडक्शन API गेटवे में लागू किया जाता है।'
                : 'Standard architectural practices applied when configuring production API gateways and data bridges.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {SECURITY_PRINCIPLES.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  className="rounded-xl backdrop-blur-md bg-[#0c1524]/85 border border-slate-800 hover:border-emerald-500/40 transition-colors p-5 space-y-3"
                >
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/12 border border-emerald-500/30 flex items-center justify-center text-emerald-300">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-white">
                    {isHi ? item.titleHi : item.titleEn}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {isHi ? item.descHi : item.descEn}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* INDUSTRY USE CASES (4 Photo Cards — Clearly Labeled "नमूना उपयोग") */}
      <section
        id="use-cases"
        data-reveal-section="use-cases"
        className={`py-16 sm:py-22 border-b border-slate-800/70 bg-[#09101c]/70 ${revealClass('use-cases')}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mb-10 sm:mb-12 space-y-3">
            <p className="text-xs font-semibold text-sky-400 tracking-wide">
              {isHi ? '06. उद्योग उपयोग' : '06. Industry Use Cases'}
            </p>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight text-balance">
              {isHi
                ? 'विभिन्न बिज़नेस क्षेत्रों में नमूना इंटीग्रेशन उपयोग'
                : 'Sample Integration Workflows Across Industries'}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {USE_CASES.map((item) => (
              <article
                key={item.id}
                className="group rounded-xl overflow-hidden backdrop-blur-md bg-[#0c1524]/85 border border-slate-800 hover:border-sky-400/45 transition-all grid grid-cols-1 sm:grid-cols-12"
              >
                <div className="sm:col-span-5 aspect-[4/3] sm:aspect-auto overflow-hidden bg-slate-950">
                  <DemoImage
                    src={item.image}
                    alt={isHi ? item.titleHi : item.titleEn}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="sm:col-span-7 p-5 flex flex-col justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="font-semibold text-emerald-300">
                        {isHi ? item.sectorHi : item.sectorEn}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="text-sky-300 font-medium">
                        {isHi ? 'नमूना उपयोग' : 'Sample Use Case'}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-white leading-snug">
                      {isHi ? item.titleHi : item.titleEn}
                    </h3>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      {isHi ? item.summaryHi : item.summaryEn}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedUseCase(item)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-300 hover:text-sky-200 w-fit cursor-pointer"
                  >
                    <span>{isHi ? 'वर्कफ़्लो विवरण देखें' : 'View Workflow Details'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* SAMPLE PACKAGES (3 Cards, Center "लोकप्रिय", Explicitly Labeled Sample Pricing) */}
      <section
        id="packages"
        data-reveal-section="packages"
        className={`py-16 sm:py-22 border-b border-slate-800/70 ${revealClass('packages')}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 sm:mb-12">
            <div className="space-y-2.5 max-w-2xl">
              <p className="text-xs font-semibold text-emerald-400 tracking-wide">
                {isHi ? '07. नमूना पैकेज' : '07. Sample Packages'}
              </p>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                {isHi ? 'स्पष्ट और लचीले इंटीग्रेशन प्लान' : 'Transparent Sample Integration Plans'}
              </h2>
            </div>
            <div className="text-xs font-mono text-amber-300 border border-amber-500/35 bg-amber-500/10 px-3 py-1.5 rounded-lg w-fit whitespace-nowrap">
              {isHi ? 'नमूना कीमतें — डेमो' : 'Sample Pricing — Demo Only'}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            {PACKAGES.map((pkg) => (
              <div
                key={pkg.id}
                className={`rounded-2xl p-6 sm:p-7 flex flex-col justify-between gap-6 transition-all ${
                  pkg.popular
                    ? 'bg-gradient-to-b from-[#0e2228] via-[#0c1a2c] to-[#0a1322] border border-emerald-400/60 shadow-[0_0_32px_rgba(16,185,129,0.16)]'
                    : 'backdrop-blur-md bg-[#0c1524]/85 border border-slate-800'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xl font-extrabold text-white">
                      {isHi ? pkg.nameHi : pkg.nameEn}
                    </h3>
                    {pkg.popular && (
                      <span className="text-xs font-bold text-emerald-300">
                        {isHi ? 'लोकप्रिय' : 'Popular'}
                      </span>
                    )}
                  </div>

                  <div className="text-3xl font-extrabold text-white font-mono tabular-nums">
                    {isHi ? pkg.priceHi : pkg.priceEn}
                  </div>

                  <p className="text-sm text-slate-400 leading-relaxed">
                    {isHi ? pkg.summaryHi : pkg.summaryEn}
                  </p>

                  <ul className="space-y-2.5 pt-3 border-t border-slate-800/90">
                    {(isHi ? pkg.featuresHi : pkg.featuresEn).map((feat) => (
                      <li key={feat} className="flex items-start gap-2.5 text-sm text-slate-200">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => handleSelectPackage(isHi ? pkg.nameHi : pkg.nameEn)}
                  className={`w-full py-3 px-4 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                    pkg.popular
                      ? 'bg-gradient-to-r from-emerald-500 to-sky-500 text-slate-950 hover:shadow-[0_0_24px_rgba(16,185,129,0.45)]'
                      : 'bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white'
                  }`}
                >
                  {isHi ? 'इंटीग्रेशन प्लान चुनें' : 'Choose Sample Plan'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROCESS TIMELINE (5 Steps) */}
      <section
        id="process"
        data-reveal-section="process"
        className={`py-16 sm:py-22 border-b border-slate-800/70 bg-[#09101c]/70 ${revealClass('process')}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mb-10 sm:mb-12 space-y-3">
            <p className="text-xs font-semibold text-sky-400 tracking-wide">
              {isHi ? '08. कार्य प्रक्रिया' : '08. Delivery Process'}
            </p>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              {isHi ? '5 चरणों में व्यवस्थित इंटीग्रेशन' : 'Structured 5-Step Integration Delivery'}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {PROCESS_STEPS.map((item) => (
              <div
                key={item.step}
                className="rounded-xl bg-[#0c1524]/90 border border-slate-800 p-5 space-y-2.5"
              >
                <div className="text-xs font-mono font-bold text-emerald-400 tabular-nums">
                  {item.step}
                </div>
                <h3 className="text-base font-bold text-white">
                  {isHi ? item.titleHi : item.titleEn}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {isHi ? item.descHi : item.descEn}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ ACCORDION (4 Questions) */}
      <section
        id="faq"
        data-reveal-section="faq"
        className={`py-16 sm:py-22 border-b border-slate-800/70 ${revealClass('faq')}`}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="mb-10 space-y-3">
            <p className="text-xs font-semibold text-emerald-400 tracking-wide">
              {isHi ? '09. सामान्य प्रश्न' : '09. Frequently Asked Questions'}
            </p>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              {isHi ? 'इंटीग्रेशन से जुड़े मुख्य सवाल' : 'Common Questions About Integration'}
            </h2>
          </div>

          <div className="space-y-3">
            {FAQ_ITEMS.map((faq) => {
              const isOpen = openFaqId === faq.id;
              return (
                <div
                  key={faq.id}
                  className="rounded-xl bg-[#0c1524]/85 border border-slate-800 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqId(isOpen ? '' : faq.id)}
                    aria-expanded={isOpen}
                    className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-900/50 transition-colors"
                  >
                    <span className="text-sm sm:text-base font-bold text-white">
                      {isHi ? faq.questionHi : faq.questionEn}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-emerald-400 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 pt-1 text-sm text-slate-300 leading-relaxed border-t border-slate-800/80">
                      {isHi ? faq.answerHi : faq.answerEn}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* INTEGRATION PLAN FORM & DEMO CONTACT */}
      <section
        id="contact"
        data-reveal-section="contact"
        className={`py-16 sm:py-22 border-b border-slate-800/70 bg-[#09101c]/75 ${revealClass('contact')}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            {/* Left: Form */}
            <div className="lg:col-span-7 rounded-2xl backdrop-blur-md bg-[#0c1524]/90 border border-slate-800 p-6 sm:p-8 space-y-6">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-emerald-400 tracking-wide">
                  {isHi ? '10. इंटीग्रेशन प्लान फ़ॉर्म' : '10. Integration Plan Form'}
                </p>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {isHi ? 'फ़्री इंटीग्रेशन प्लान तैयार करवाएँ' : 'Request a Sample Integration Plan'}
                </h2>
                <p className="text-xs text-slate-400">
                  {isHi
                    ? 'यह डेमो फ़ॉर्म केवल वैलिडेशन और अनुभव दिखाने के लिए है — कोई भी जानकारी सर्वर या डेटाबेस में सेव नहीं होती।'
                    : 'Local demo form for preview and validation only — nothing is stored or transmitted.'}
                </p>
              </div>

              <form onSubmit={handleFormSubmit} noValidate className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="isuite-name" className="block text-xs font-semibold text-slate-300">
                      {isHi ? 'नाम *' : 'Full Name *'}
                    </label>
                    <input
                      id="isuite-name"
                      type="text"
                      value={formName}
                      onChange={(e) => {
                        setFormName(e.target.value);
                        setFormSubmitted(false);
                      }}
                      placeholder={isHi ? 'आपका नाम' : 'Your name'}
                      className="w-full rounded-lg bg-[#070c14] border border-slate-700 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="isuite-company" className="block text-xs font-semibold text-slate-300">
                      {isHi ? 'कंपनी *' : 'Company *'}
                    </label>
                    <input
                      id="isuite-company"
                      type="text"
                      value={formCompany}
                      onChange={(e) => {
                        setFormCompany(e.target.value);
                        setFormSubmitted(false);
                      }}
                      placeholder={isHi ? 'कंपनी या बिज़नेस नाम' : 'Company or business name'}
                      className="w-full rounded-lg bg-[#070c14] border border-slate-700 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="isuite-phone" className="block text-xs font-semibold text-slate-300">
                    {isHi ? 'मोबाइल नंबर *' : 'Mobile Number *'}
                  </label>
                  <input
                    id="isuite-phone"
                    type="tel"
                    value={formPhone}
                    onChange={(e) => {
                      setFormPhone(e.target.value);
                      setFormSubmitted(false);
                    }}
                    placeholder="+91 90000 00000"
                    className="w-full rounded-lg bg-[#070c14] border border-slate-700 px-3.5 py-2.5 text-sm font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-400"
                  />
                </div>

                {/* Multi-select App Chips */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-300">
                      {isHi ? 'कौन-से ऐप जोड़ने हैं? *' : 'Which apps do you want to connect? *'}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                      {selectedApps.length} {isHi ? 'चुने गए' : 'selected'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {FORM_APP_OPTIONS.map((app) => {
                      const active = selectedApps.includes(app);
                      return (
                        <button
                          key={app}
                          type="button"
                          onClick={() => toggleAppChip(app)}
                          aria-pressed={active}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                            active
                              ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                              : 'bg-[#070c14] border-slate-700 text-slate-300 hover:border-slate-500'
                          }`}
                        >
                          {active ? '✓ ' : '+ '}
                          {app}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="isuite-message" className="block text-xs font-semibold text-slate-300">
                    {isHi ? 'संदेश *' : 'Message *'}
                  </label>
                  <textarea
                    id="isuite-message"
                    rows={3}
                    value={formMessage}
                    onChange={(e) => {
                      setFormMessage(e.target.value);
                      setFormSubmitted(false);
                    }}
                    placeholder={
                      isHi
                        ? 'संक्षेप में बताएँ कि आप कौन-सा डेटा सिंक या ऑटोमेशन चाहते हैं...'
                        : 'Briefly describe the data sync or automation workflow you need...'
                    }
                    className="w-full rounded-lg bg-[#070c14] border border-slate-700 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-400 resize-y"
                  />
                </div>

                {formError && (
                  <div
                    role="alert"
                    className="rounded-lg bg-rose-500/12 border border-rose-500/40 px-4 py-3 text-xs font-medium text-rose-200"
                  >
                    {formError}
                  </div>
                )}

                {formSubmitted && (
                  <div
                    role="status"
                    className="rounded-lg bg-emerald-500/14 border border-emerald-400/50 px-4 py-3 text-sm font-semibold text-emerald-200 flex items-start gap-2.5"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      {isHi
                        ? 'डेमो: फ़ॉर्म ठीक से भरा गया। यह नमूना है, कोई संदेश नहीं भेजा गया।'
                        : 'Demo: Form validated successfully. This is a sample preview, no message was sent.'}
                    </span>
                  </div>
                )}

                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-emerald-500 to-sky-500 text-slate-950 font-bold text-sm hover:shadow-[0_0_26px_rgba(16,185,129,0.45)] transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{isHi ? 'डेमो फ़ॉर्म जाँचें' : 'Validate Demo Form'}</span>
                </button>
              </form>
            </div>

            {/* Right: Demo Contact Info Card */}
            <div className="lg:col-span-5 space-y-6">
              <div className="rounded-2xl backdrop-blur-md bg-[#0c1524]/90 border border-slate-800 p-6 sm:p-7 space-y-5">
                <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-4">
                  <h3 className="text-lg font-bold text-white">
                    {isHi ? 'संपर्क विवरण' : 'Contact Details'}
                  </h3>
                  <span className="text-xs font-mono text-amber-300">
                    {isHi ? 'डेमो जानकारी' : 'Demo Info'}
                  </span>
                </div>

                <div className="space-y-4 text-sm">
                  <div className="flex items-start gap-3">
                    <Phone className="w-4 h-4 text-emerald-400 shrink-0 mt-1" />
                    <div>
                      <div className="text-xs text-slate-400">{isHi ? 'फ़ोन (डेमो)' : 'Phone (Demo)'}</div>
                      <div className="font-mono font-semibold text-white">+91 90000 00000</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Mail className="w-4 h-4 text-sky-400 shrink-0 mt-1" />
                    <div>
                      <div className="text-xs text-slate-400">{isHi ? 'ईमेल (डेमो)' : 'Email (Demo)'}</div>
                      <div className="font-mono font-semibold text-white break-all">
                        hello@integration-suite.example
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-1" />
                    <div>
                      <div className="text-xs text-slate-400">{isHi ? 'नोट' : 'Notice'}</div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {isHi
                          ? 'ऊपर दिए गए फ़ोन और ईमेल केवल डेमो वेबसाइट के उदाहरण हैं। वास्तविक प्रोजेक्ट के लिए नीचे मुख्य वेबसाइट बटन से संपर्क करें।'
                          : 'The phone and email above are demo placeholders. For a real project quote, use the main website button below.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-gradient-to-br from-[#0e2127] to-[#0b1526] border border-emerald-500/35 p-6 space-y-4">
                <h3 className="text-base font-bold text-white">
                  {isHi
                    ? 'क्या आप अपने बिज़नेस के लिए ऐसी वेबसाइट बनवाना चाहते हैं?'
                    : 'Want a Website Like This for Your Business?'}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {isHi
                    ? 'Power Web Studio AI आपकी कंपनी की ब्रांडिंग, भाषा और सेवाओं के अनुसार कस्टम एंटरप्राइज़ वेबसाइट तैयार करता है।'
                    : 'Power Web Studio AI builds tailored enterprise websites customized to your brand, services, and language.'}
                </p>
                <button
                  type="button"
                  onClick={onRequestQuote}
                  className="w-full py-2.5 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
                >
                  {isHi
                    ? 'ऐसी वेबसाइट अपने बिज़नेस के लिए बनवाएँ'
                    : 'Build a Website Like This for Your Business'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#050910] border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-sky-500 flex items-center justify-center text-slate-950">
                  <Plug2 className="w-4 h-4 stroke-[2.4]" />
                </span>
                <span className="text-sm font-extrabold text-white">INTEGRATION SUITE</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isHi
                  ? 'सुरक्षित एपीआई गेटवे और डेटा इंटीग्रेशन के लिए एक आधुनिक एंटरप्राइज़ डेमो वेबसाइट।'
                  : 'A modern enterprise demo website for secure API gateway and data integration services.'}
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                {isHi ? 'सेवाएँ' : 'Services'}
              </h4>
              <ul className="space-y-2 text-xs text-slate-400">
                {SERVICES.slice(0, 4).map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => scrollToSection('services')}
                      className="hover:text-emerald-300 transition-colors cursor-pointer text-left"
                    >
                      {isHi ? s.titleHi : s.titleEn}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                {isHi ? 'क्विक लिंक' : 'Quick Links'}
              </h4>
              <ul className="space-y-2 text-xs text-slate-400">
                {['data-flow', 'connectors', 'api-tester', 'packages', 'faq'].map((sec) => {
                  const labels: Record<string, { hi: string; en: string }> = {
                    'data-flow': { hi: 'डेटा फ़्लो', en: 'Data Flow' },
                    connectors: { hi: 'कनेक्टर सूची', en: 'Connectors' },
                    'api-tester': { hi: 'नमूना API टेस्टर', en: 'Sample API Tester' },
                    packages: { hi: 'नमूना पैकेज', en: 'Sample Packages' },
                    faq: { hi: 'FAQ', en: 'FAQ' },
                  };
                  return (
                    <li key={sec}>
                      <button
                        type="button"
                        onClick={() => scrollToSection(sec)}
                        className="hover:text-emerald-300 transition-colors cursor-pointer"
                      >
                        {isHi ? labels[sec].hi : labels[sec].en}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                {isHi ? 'कनेक्ट (डेमो)' : 'Connect (Demo)'}
              </h4>
              <div className="flex items-center gap-2.5">
                {[
                  { icon: Globe, label: 'Web' },
                  { icon: Network, label: 'API' },
                  { icon: Webhook, label: 'Events' },
                  { icon: Mail, label: 'Email' },
                ].map((social) => {
                  const Icon = social.icon;
                  return (
                    <button
                      key={social.label}
                      type="button"
                      onClick={() => scrollToSection('contact')}
                      aria-label={social.label}
                      className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 hover:border-emerald-500/50 text-slate-300 hover:text-emerald-300 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Icon className="w-4 h-4" />
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] font-mono text-slate-500">
                +91 90000 00000 · hello@integration-suite.example
              </p>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <span>© Integration Suite (Demo)</span>
            <span>
              {isHi
                ? 'यह केवल डेमो वेबसाइट है — कोई वास्तविक API या व्यावसायिक लेनदेन नहीं।'
                : 'Demo showcase only — no live API calls or commercial transactions.'}
            </span>
          </div>
        </div>
      </footer>

      {/* BOTTOM MAIN-SITE CONVERSION BAR */}
      <section className="bg-gradient-to-r from-[#071a1c] via-[#0a182d] to-[#071a1c] py-8 sm:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left space-y-1">
            <h3 className="text-lg sm:text-xl font-extrabold text-white">
              {isHi
                ? 'अपने बिज़नेस के लिए कस्टम वेबसाइट या इंटीग्रेशन पोर्टल बनवाएँ'
                : 'Launch a Custom Website or Integration Portal for Your Business'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300">
              {isHi
                ? 'Power Web Studio AI के साथ अपने ब्रांड के अनुरूप सुरक्षित और तेज़ डिजिटल प्लेटफ़ॉर्म पाएँ।'
                : 'Partner with Power Web Studio AI for a secure, tailored web platform.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onRequestQuote}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-gradient-to-r from-emerald-500 to-sky-500 text-slate-950 font-bold text-sm hover:shadow-[0_0_26px_rgba(16,185,129,0.45)] transition-all whitespace-nowrap cursor-pointer"
            >
              <span>
                {isHi
                  ? 'ऐसी वेबसाइट अपने बिज़नेस के लिए बनवाएँ'
                  : 'Build a Website Like This for Your Business'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* SERVICE SCOPE MODAL */}
      {selectedService && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="service-modal-title"
          onClick={() => setSelectedService(null)}
        >
          <div
            className="w-full max-w-xl rounded-2xl bg-[#0b1322] border border-slate-700 overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-44 sm:h-52 shrink-0 bg-slate-950">
              <DemoImage
                src={selectedService.image}
                alt={isHi ? selectedService.titleHi : selectedService.titleEn}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b1322] via-[#0b1322]/40 to-transparent" />
              <button
                type="button"
                onClick={() => setSelectedService(null)}
                aria-label={isHi ? 'बंद करें' : 'Close'}
                className="absolute top-3 right-3 w-9 h-9 rounded-lg bg-slate-950/85 border border-slate-700 text-slate-200 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5">
              <div className="space-y-2">
                <span className="text-xs font-mono text-emerald-300">
                  {isHi ? 'सेवा कार्यक्षेत्र (डेमो)' : 'Service Scope (Demo)'}
                </span>
                <h3 id="service-modal-title" className="text-xl font-extrabold text-white">
                  {isHi ? selectedService.titleHi : selectedService.titleEn}
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {isHi ? selectedService.architectureNoteHi : selectedService.architectureNoteEn}
                </p>
              </div>

              <div className="space-y-2.5">
                <div className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  {isHi ? 'काम का दायरा' : 'Scope of Work'}
                </div>
                <ul className="space-y-2">
                  {(isHi ? selectedService.scopeHi : selectedService.scopeEn).map((line) => (
                    <li key={line} className="flex items-start gap-2.5 text-sm text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedService(null)}
                  className="px-4 py-2 rounded-lg border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white cursor-pointer"
                >
                  {isHi ? 'बंद करें' : 'Close'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const title = isHi ? selectedService.titleHi : selectedService.titleEn;
                    setSelectedService(null);
                    setFormMessage(
                      isHi
                        ? `${title} के लिए इंटीग्रेशन प्लान की जानकारी चाहिए।`
                        : `Interested in an integration plan for ${title}.`
                    );
                    scrollToSection('contact');
                  }}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-sky-500 text-slate-950 text-xs font-bold cursor-pointer"
                >
                  {isHi ? 'इंटीग्रेशन प्लान पूछें' : 'Request Plan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* USE CASE WORKFLOW MODAL */}
      {selectedUseCase && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="usecase-modal-title"
          onClick={() => setSelectedUseCase(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-[#0b1322] border border-slate-700 overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-44 shrink-0 bg-slate-950">
              <DemoImage
                src={selectedUseCase.image}
                alt={isHi ? selectedUseCase.titleHi : selectedUseCase.titleEn}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b1322] via-[#0b1322]/40 to-transparent" />
              <button
                type="button"
                onClick={() => setSelectedUseCase(null)}
                aria-label={isHi ? 'बंद करें' : 'Close'}
                className="absolute top-3 right-3 w-9 h-9 rounded-lg bg-slate-950/85 border border-slate-700 text-slate-200 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5">
              <div className="space-y-1.5">
                <div className="text-xs text-sky-300 font-semibold">
                  {isHi ? selectedUseCase.sectorHi : selectedUseCase.sectorEn} ·{' '}
                  {isHi ? 'नमूना उपयोग' : 'Sample Use Case'}
                </div>
                <h3 id="usecase-modal-title" className="text-xl font-extrabold text-white">
                  {isHi ? selectedUseCase.titleHi : selectedUseCase.titleEn}
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {isHi ? selectedUseCase.summaryHi : selectedUseCase.summaryEn}
                </p>
              </div>

              <div className="space-y-2.5">
                <div className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Workflow className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isHi ? 'नमूना ऑटोमेशन क्रम' : 'Sample Automation Steps'}</span>
                </div>
                <ol className="space-y-2">
                  {(isHi ? selectedUseCase.flowHi : selectedUseCase.flowEn).map((step, idx) => (
                    <li key={step} className="flex items-start gap-2.5 text-sm text-slate-300">
                      <span className="font-mono text-xs font-bold text-emerald-400 mt-0.5 tabular-nums">
                        0{idx + 1}.
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedUseCase(null)}
                  className="px-4 py-2 rounded-lg border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white cursor-pointer"
                >
                  {isHi ? 'बंद करें' : 'Close'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
