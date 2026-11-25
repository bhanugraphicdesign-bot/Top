import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  CloudCog,
  Cpu,
  Database,
  GitBranch,
  Globe,
  HardDrive,
  Info,
  Mail,
  Menu,
  Network,
  Pause,
  Phone,
  Play,
  RotateCcw,
  Server,
  ShieldCheck,
  Terminal,
  Users,
  X,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { DemoPriceBar } from '../components/DemoPriceBar';
import { DemoLanguageToggle } from '../components/common/DemoLanguageToggle';

interface CloudEngineeringDemoProps {
  onBackToHome: () => void;
  onRequestQuote: () => void;
}

interface CloudService {
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

interface PipelineStage {
  id: string;
  labelHi: string;
  labelEn: string;
  cmd: string;
  descHi: string;
  descEn: string;
}

interface ArchNode {
  id: string;
  titleHi: string;
  titleEn: string;
  subHi: string;
  subEn: string;
  detailHi: string;
  detailEn: string;
  icon: 'users' | 'cdn' | 'lb' | 'app' | 'db';
}

interface CloudUseCase {
  id: string;
  image: string;
  sectorHi: string;
  sectorEn: string;
  titleHi: string;
  titleEn: string;
  summaryHi: string;
  summaryEn: string;
  highlightsHi: string[];
  highlightsEn: string[];
}

interface CloudPackage {
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

const HERO_TERMINAL_LINES = [
  { cmd: '$ git push origin main', status: 'pushed', hi: 'कोड रिपॉज़िटरी में भेजा गया' },
  { cmd: '→ pipeline: build', status: '✓', hi: 'कंटेनर इमेज बिल्ड सफल' },
  { cmd: '→ pipeline: test', status: '✓', hi: 'ऑटोमेटेड टेस्ट पास' },
  { cmd: '→ pipeline: deploy', status: '✓', hi: 'रोलिंग डिप्लॉय पूरा (डेमो)' },
];

const SERVICES: CloudService[] = [
  {
    id: 'architecture',
    number: '01',
    image: '/demo/cloud-engineering/architecture.jpg',
    titleHi: 'क्लाउड आर्किटेक्चर डिज़ाइन',
    titleEn: 'Cloud Architecture Design',
    shortDescHi: 'संतुलित ट्रैफ़िक वितरण, ऑटो-स्केलिंग और बैकअप के साथ भरोसेमंद क्लाउड ब्लूप्रिंट।',
    shortDescEn: 'Resilient cloud blueprints with load distribution, auto-scaling, and structured backups.',
    scopeHi: [
      'ऐप और डेटाबेस टियर का स्पष्ट आर्किटेक्चर डिज़ाइन',
      'CDN, लोड बैलेंसर और मल्टी-ज़ोन उपलब्धता योजना',
      'संसाधन साइजिंग और क्लाउड लागत दृश्यता संरचना',
      'डिज़ास्टर रिकवरी और नियमित स्नैपशॉट रणनीति',
    ],
    scopeEn: [
      'Clean multi-tier application and database topology design',
      'CDN, load balancing, and regional availability planning',
      'Right-sizing compute resources with transparent cost controls',
      'Disaster recovery and scheduled snapshot procedures',
    ],
    idealForHi: 'नए वेब प्लेटफ़ॉर्म, SaaS उत्पाद और बढ़ते ऑनलाइन व्यवसाय',
    idealForEn: 'New web platforms, SaaS products, and scaling digital businesses',
  },
  {
    id: 'devops-cicd',
    number: '02',
    image: '/demo/cloud-engineering/devops-cicd.jpg',
    titleHi: 'DevOps और CI/CD ऑटोमेशन',
    titleEn: 'DevOps & CI/CD Automation',
    shortDescHi: 'कोड पुश से ऑटोमेटेड बिल्ड, टेस्टिंग और सुरक्षित रोलिंग डिप्लॉयमेंट तक पूरी पाइपलाइन।',
    shortDescEn: 'Automated pipelines from git push to container builds, test checks, and smooth rollouts.',
    scopeHi: [
      'GitHub Actions या GitLab पर CI/CD पाइपलाइन सेटअप',
      'स्टेजिंग और प्रोडक्शन एनवायरनमेंट का पृथक्करण',
      'रोलबैक-रेडी डिप्लॉयमेंट और इन्फ़्रास्ट्रक्चर-एज़-कोड (Terraform)',
      'बिल्ड अलर्ट और रिलीज़ वर्ज़न ट्रैकिंग',
    ],
    scopeEn: [
      'CI/CD workflow automation with GitHub Actions or GitLab',
      'Separated staging, preview, and production environments',
      'Rollback-ready releases and Infrastructure as Code (Terraform)',
      'Automated build checks and structured release history',
    ],
    idealForHi: 'सॉफ़्टवेयर टीमें जो तेज़ और सुरक्षित अपडेट रिलीज़ करना चाहती हैं',
    idealForEn: 'Engineering teams shipping frequent, low-risk application updates',
  },
  {
    id: 'networking',
    number: '03',
    image: '/demo/cloud-engineering/networking.jpg',
    titleHi: 'नेटवर्किंग और माइग्रेशन',
    titleEn: 'Networking & Cloud Migration',
    shortDescHi: 'पुरानी शेयर होस्टिंग या लोकल सर्वर से आधुनिक क्लाउड व VPC नेटवर्किंग में सुरक्षित स्थानांतरण।',
    shortDescEn: 'Planned migration from legacy hosting or on-premise servers into structured cloud VPC networks.',
    scopeHi: [
      'DNS, SSL/TLS प्रमाणपत्र और कस्टम डोमेन रूटिंग',
      'प्राइवेट सबनेट, VPC पीयरिंग और फ़ायरवॉल नियम',
      'स्टेप-बाय-स्टेप डेटाबेस व फ़ाइल माइग्रेशन चेकलिस्ट',
      'कटओवर के दौरान न्यूनतम रुकावट की पूर्व-योजना',
    ],
    scopeEn: [
      'DNS routing, SSL/TLS certificates, and custom domain setup',
      'Private subnets, VPC isolation, and clean ingress rules',
      'Staged database and asset migration checklists',
      'Low-disruption cutover planning and rollback rehearsals',
    ],
    idealForHi: 'वेबसाइट्स और ERP जो धीमी होस्टिंग से क्लाउड पर जाना चाहते हैं',
    idealForEn: 'Websites and portals moving from constrained legacy servers',
  },
  {
    id: 'security',
    number: '04',
    image: '/demo/cloud-engineering/security.jpg',
    titleHi: 'क्लाउड सुरक्षा',
    titleEn: 'Cloud Security Hardening',
    shortDescHi: 'फ़ायरवॉल, न्यूनतम-विशेषाधिकार IAM एक्सेस, सीक्रेट मैनेजमेंट और एन्क्रिप्शन सेटअप।',
    shortDescEn: 'Firewall policies, least-privilege IAM roles, secret vaults, and encryption at rest and in transit.',
    scopeHi: [
      'रोल-आधारित IAM नीतियाँ और मल्टी-फ़ैक्टर एक्सेस',
      'HTTPS एन्क्रिप्शन और सीक्रेट मैनेजर कॉन्फ़िगरेशन',
      'वेब एप्लिकेशन फ़ायरवॉल (WAF) और रेट-लिमिटिंग',
      'नियमित पोर्ट, पैच और कॉन्फ़िगरेशन समीक्षा',
    ],
    scopeEn: [
      'Least-privilege IAM roles and multi-factor console policies',
      'End-to-end TLS encryption and managed secret storage',
      'Web Application Firewall (WAF) and API rate limiting',
      'Routine configuration reviews and OS patch hygiene',
    ],
    idealForHi: 'हेल्थकेयर, फ़ाइनेंस, ई-कॉमर्स और संवेदनशील डेटा वाले प्लेटफ़ॉर्म',
    idealForEn: 'Healthcare, fintech, e-commerce, and data-sensitive platforms',
  },
  {
    id: 'monitoring',
    number: '05',
    image: '/demo/cloud-engineering/monitoring.jpg',
    titleHi: 'मॉनिटरिंग और अलर्ट',
    titleEn: 'Monitoring & Alerting',
    shortDescHi: 'CPU, मेमोरी, एरर रेट और रिस्पॉन्स टाइम की निरंतर निगरानी व समय पर सूचनाएँ।',
    shortDescEn: 'Observability dashboards tracking CPU, memory, error rates, and latency with timely alerts.',
    scopeHi: [
      'केंद्रीकृत सर्वर और एप्लिकेशन लॉग डैशबोर्ड',
      'CPU, मेमोरी और डिस्क सीमा पार होने पर तुरंत अलर्ट',
      'धीमे API एंडपॉइंट्स की पहचान के लिए ट्रेसिंग',
      'साप्ताहिक हेल्थ सारांश और क्षमता नियोजन',
    ],
    scopeEn: [
      'Centralized infrastructure and application log dashboards',
      'Threshold alerts for CPU, memory, disk, and error spikes',
      'Latency tracing to pinpoint slow database or API paths',
      'Periodic health reviews and capacity planning insights',
    ],
    idealForHi: 'सभी प्रोडक्शन ऐप्स जिन्हें 24×7 स्पष्ट दृश्यता चाहिए',
    idealForEn: 'Production applications requiring continuous operational visibility',
  },
  {
    id: 'containers',
    number: '06',
    image: '/demo/cloud-engineering/containers.jpg',
    titleHi: 'कंटेनर और Kubernetes',
    titleEn: 'Containers & Kubernetes',
    shortDescHi: 'Docker कंटेनराइज़ेशन और Kubernetes क्लस्टर द्वारा एकसमान बिल्ड व ऑटो-हीलिंग सेवाएँ।',
    shortDescEn: 'Docker containerization and Kubernetes orchestration for consistent builds and self-healing workloads.',
    scopeHi: [
      'मल्टी-स्टेज हल्के Dockerfiles और इमेज स्कैनिंग',
      'Kubernetes डिप्लॉयमेंट, सर्विस और इन्ग्रेस सेटअप',
      'ट्रैफ़िक के अनुसार हॉरिज़ॉन्टल पॉड ऑटो-स्केलिंग',
      'क्लीन हेल्थ प्रोब्स और ज़ीरो-डाउनटाइम रोलिंग अपडेट्स',
    ],
    scopeEn: [
      'Slim multi-stage Dockerfiles and container registry setup',
      'Kubernetes deployments, services, and ingress controllers',
      'Horizontal pod autoscaling tied to real workload signals',
      'Readiness probes and controlled rolling container updates',
    ],
    idealForHi: 'माइक्रोसर्विस ऐप्स और हाई-ट्रैफ़िक वेब प्लेटफ़ॉर्म',
    idealForEn: 'Microservice architectures and high-traffic web platforms',
  },
];

const PIPELINE_STAGES: PipelineStage[] = [
  {
    id: 'code',
    labelHi: 'Code',
    labelEn: 'Code',
    cmd: 'git checkout main && lint',
    descHi: 'स्रोत कोड जाँच और फ़ॉर्मेटिंग सत्यापन',
    descEn: 'Source commit pull and static lint checks',
  },
  {
    id: 'build',
    labelHi: 'Build',
    labelEn: 'Build',
    cmd: 'docker build -t app:demo .',
    descHi: 'प्रोडक्शन बंडल और कंटेनर इमेज निर्माण',
    descEn: 'Compile production bundle & container image',
  },
  {
    id: 'test',
    labelHi: 'Test',
    labelEn: 'Test',
    cmd: 'npm test -- --ci',
    descHi: 'यूनिट और इंटीग्रेशन परीक्षण',
    descEn: 'Automated unit & integration verification',
  },
  {
    id: 'deploy',
    labelHi: 'Deploy',
    labelEn: 'Deploy',
    cmd: 'kubectl rollout status',
    descHi: 'क्लाउड क्लस्टर पर सुरक्षित रोलिंग डिप्लॉय',
    descEn: 'Controlled rolling deploy to cloud cluster',
  },
  {
    id: 'monitor',
    labelHi: 'Monitor',
    labelEn: 'Monitor',
    cmd: 'health-check /status → OK',
    descHi: 'हेल्थ प्रोब और लॉग मॉनिटरिंग सक्रिय',
    descEn: 'Health probes & telemetry alerts active',
  },
];

const ARCH_NODES: ArchNode[] = [
  {
    id: 'users',
    titleHi: 'यूज़र',
    titleEn: 'Users',
    subHi: 'वेब / मोबाइल',
    subEn: 'Web / Mobile',
    detailHi: 'देश-विदेश के ग्राहक HTTPS के सुरक्षित कनेक्शन से आपकी वेबसाइट या ऐप खोलते हैं।',
    detailEn: 'End users on mobile or desktop connect over encrypted HTTPS sessions.',
    icon: 'users',
  },
  {
    id: 'cdn',
    titleHi: 'CDN',
    titleEn: 'CDN Edge',
    subHi: 'कैश और WAF',
    subEn: 'Cache & WAF',
    detailHi: 'इमेज व स्टैटिक फ़ाइलें पास के एज लोकेशन से तेज़ी से सर्व होती हैं और संदिग्ध ट्रैफ़िक छनता है।',
    detailEn: 'Delivers static assets from nearby edge locations while filtering abusive traffic.',
    icon: 'cdn',
  },
  {
    id: 'lb',
    titleHi: 'लोड बैलेंसर',
    titleEn: 'Load Balancer',
    subHi: 'ट्रैफ़िक वितरण',
    subEn: 'Traffic Routing',
    detailHi: 'आने वाले अनुरोधों को स्वस्थ ऐप सर्वरों के बीच समान रूप से बाँटता है ताकि एक सर्वर पर भार न बढ़े।',
    detailEn: 'Distributes incoming requests evenly across healthy application instances.',
    icon: 'lb',
  },
  {
    id: 'app',
    titleHi: 'ऐप सर्वर',
    titleEn: 'App Servers',
    subHi: 'ऑटो-स्केल पॉड्स',
    subEn: 'Auto-Scale Pods',
    detailHi: 'बिज़नेस लॉजिक व API चलाते हैं और ट्रैफ़िक बढ़ने या घटने पर क्षमता समायोजित करते हैं।',
    detailEn: 'Runs your core application APIs and scales capacity cleanly with traffic changes.',
    icon: 'app',
  },
  {
    id: 'db',
    titleHi: 'डेटाबेस + बैकअप',
    titleEn: 'Database + Backup',
    subHi: 'प्राइवेट सबनेट',
    subEn: 'Private Subnet',
    detailHi: 'प्राइवेट नेटवर्क के भीतर एन्क्रिप्टेड डेटा स्टोरेज और नियमित स्वचालित बैकअप स्नैपशॉट।',
    detailEn: 'Encrypted private database layer paired with scheduled automated backup snapshots.',
    icon: 'db',
  },
];

const USE_CASES: CloudUseCase[] = [
  {
    id: 'work-ecommerce',
    image: '/demo/cloud-engineering/work-ecommerce.jpg',
    sectorHi: 'ई-कॉमर्स',
    sectorEn: 'E-Commerce',
    titleHi: 'सेल के समय ऑटो-स्केलिंग',
    titleEn: 'Auto-Scaling for Festive Sales',
    summaryHi: 'त्योहारों व फ़्लैश सेल में अचानक बढ़ने वाले ट्रैफ़िक को संभालने के लिए CDN, कैशिंग और ऑटो-स्केलिंग का नमूना उपयोग।',
    summaryEn: 'Sample cloud setup combining edge caching and horizontal auto-scaling to handle festive traffic surges.',
    highlightsHi: [
      'इमेज और कैटलॉग के लिए तेज़ CDN कैश लेयर',
      'ट्रैफ़िक बढ़ने पर अतिरिक्त ऐप इंस्टेंस की तैयारी',
      'चेकआउट API पर अलग प्राथमिकता और अलर्ट',
    ],
    highlightsEn: [
      'Fast edge CDN caching for storefront imagery',
      'Automated instance scaling during peak traffic windows',
      'Dedicated alerts around checkout service latency',
    ],
  },
  {
    id: 'work-education',
    image: '/demo/cloud-engineering/work-education.jpg',
    sectorHi: 'शिक्षा',
    sectorEn: 'Education',
    titleHi: 'ऑनलाइन लर्निंग पोर्टल',
    titleEn: 'Scalable Online Learning Portal',
    summaryHi: 'ऑनलाइन कक्षाओं, परीक्षा पोर्टल और वीडियो/PDF सामग्री को एक साथ कई छात्रों तक सुचारू पहुँचाने का नमूना।',
    summaryEn: 'Sample architecture supporting concurrent student logins, exam portals, and smooth media delivery.',
    highlightsHi: [
      'वीडियो और नोट्स के लिए ऑब्जेक्ट स्टोरेज + CDN',
      'परीक्षा समय के लिए पहले से शेड्यूल स्केलिंग',
      'छात्र रिकॉर्ड का दैनिक एन्क्रिप्टेड बैकअप',
    ],
    highlightsEn: [
      'Object storage paired with CDN for lectures and PDFs',
      'Scheduled capacity scaling ahead of exam hours',
      'Daily encrypted backups for academic records',
    ],
  },
  {
    id: 'work-startup',
    image: '/demo/cloud-engineering/work-startup.jpg',
    sectorHi: 'स्टार्टअप',
    sectorEn: 'Startups',
    titleHi: 'तेज़ ऐप डिप्लॉय और CI/CD',
    titleEn: 'Rapid App Deployments & CI/CD',
    summaryHi: 'छोटी इंजीनियरिंग टीम के लिए ऑटोमेटेड प्रीव्यू एनवायरनमेंट, कंटेनर बिल्ड और वन-क्लिक रोलबैक का नमूना।',
    summaryEn: 'Sample DevOps setup giving lean teams automated staging previews, container builds, and safe rollbacks.',
    highlightsHi: [
      'हर Pull Request पर स्वचालित स्टेजिंग प्रीव्यू',
      'Docker और Terraform से एकसमान सेटअप',
      'लागत बजट अलर्ट ताकि क्लाउड बिल नियंत्रण में रहे',
    ],
    highlightsEn: [
      'Automated staging preview per code update',
      'Reproducible Docker & Terraform environments',
      'Cloud billing alerts to avoid unexpected spend',
    ],
  },
  {
    id: 'work-healthcare',
    image: '/demo/cloud-engineering/work-healthcare.jpg',
    sectorHi: 'हेल्थकेयर',
    sectorEn: 'Healthcare',
    titleHi: 'बैकअप और डेटा सुरक्षा',
    titleEn: 'Encrypted Backups & Data Protection',
    summaryHi: 'क्लिनिक और अस्पताल पोर्टल के लिए प्राइवेट नेटवर्किंग, रोल-आधारित एक्सेस और नियमित ऑफ़-साइट बैकअप का नमूना।',
    summaryEn: 'Sample private VPC design enforcing role-based access, encryption, and scheduled multi-region backups.',
    highlightsHi: [
      'प्राइवेट सबनेट में अलग डेटाबेस लेयर',
      'डेटा एन्क्रिप्शन और सख्त IAM रोल नियंत्रण',
      'स्वचालित बैकअप और रिकवरी ड्रिल योजना',
    ],
    highlightsEn: [
      'Isolated database layer inside private subnets',
      'Encryption at rest/transit with strict IAM roles',
      'Automated backup vaults with tested restore plans',
    ],
  },
];

const PACKAGES: CloudPackage[] = [
  {
    id: 'starter',
    nameHi: 'स्टार्टर',
    nameEn: 'Starter',
    priceHi: '₹19,999',
    priceEn: '₹19,999',
    subtitleHi: 'एकल वेबसाइट या ऐप को सुरक्षित क्लाउड पर लाने के लिए',
    subtitleEn: 'Clean cloud foundation for a business website or app',
    featuresHi: [
      'क्लाउड सर्वर व प्राइवेट नेटवर्क सेटअप',
      'कस्टम डोमेन, DNS और HTTPS / SSL सुरक्षा',
      'दैनिक बेसिक डेटाबेस बैकअप कॉन्फ़िगरेशन',
      'बुनियादी फ़ायरवॉल और हैंडओवर डॉक्यूमेंटेशन',
    ],
    featuresEn: [
      'Cloud server & clean network baseline setup',
      'Custom domain, DNS, and HTTPS / SSL setup',
      'Scheduled daily basic database backup rules',
      'Baseline firewall hardening & handover notes',
    ],
  },
  {
    id: 'business',
    nameHi: 'बिज़नेस',
    nameEn: 'Business',
    priceHi: '₹59,999',
    priceEn: '₹59,999',
    highlighted: true,
    subtitleHi: 'ऑटोमेशन, स्केलिंग और 24×7 निगरानी वाले ग्रोइंग ऐप्स के लिए',
    subtitleEn: 'Automated DevOps & scaling suite for growing products',
    featuresHi: [
      'पूर्ण CI/CD पाइपलाइन (स्टेजिंग + प्रोडक्शन)',
      'CPU, मेमोरी और एरर अलर्ट के साथ मॉनिटरिंग',
      'लोड बैलेंसर और ऑटो-स्केलिंग कॉन्फ़िगरेशन',
      'Docker कंटेनराइज़ेशन और लागत अलर्ट सेटअप',
    ],
    featuresEn: [
      'End-to-end CI/CD pipeline (staging + production)',
      'Observability dashboards & proactive alert rules',
      'Load balancer & horizontal auto-scaling setup',
      'Docker containerization & budget alert guardrails',
    ],
  },
  {
    id: 'enterprise',
    nameHi: 'एंटरप्राइज़',
    nameEn: 'Enterprise',
    priceHi: 'कस्टम कोट',
    priceEn: 'Custom Quote',
    subtitleHi: 'मल्टी-क्लाउड, Kubernetes और उच्च सुरक्षा वाले संगठनों के लिए',
    subtitleEn: 'Tailored multi-cloud & Kubernetes architecture for enterprises',
    featuresHi: [
      'मल्टी-क्लाउड या हाइब्रिड आर्किटेक्चर डिज़ाइन',
      'मैनेज्ड Kubernetes क्लस्टर व Terraform IaC',
      'व्यापक क्लाउड सुरक्षा ऑडिट व VPC सेगमेंटेशन',
      'डिज़ास्टर रिकवरी प्लान और टीम DevOps ट्रेनिंग',
    ],
    featuresEn: [
      'Multi-cloud or hybrid infrastructure architecture',
      'Managed Kubernetes clusters & Terraform IaC',
      'In-depth cloud security review & VPC segmentation',
      'Disaster recovery blueprints & team handover training',
    ],
  },
];

const PROCESS_STEPS: ProcessStep[] = [
  {
    step: '01',
    titleHi: 'क्लाउड ऑडिट',
    titleEn: 'Cloud Audit',
    descHi: 'मौजूदा सर्वर, ट्रैफ़िक पैटर्न, सुरक्षा और खर्च की स्पष्ट समीक्षा।',
    descEn: 'Reviewing current hosting, traffic patterns, security gaps, and spend.',
  },
  {
    step: '02',
    titleHi: 'आर्किटेक्चर प्लान',
    titleEn: 'Architecture Plan',
    descHi: 'नेटवर्क, डेटाबेस, बैकअप और स्केलिंग का व्यावहारिक रोडमैप बनाना।',
    descEn: 'Designing practical network, database, backup, and scaling topologies.',
  },
  {
    step: '03',
    titleHi: 'माइग्रेशन',
    titleEn: 'Migration',
    descHi: 'स्टेजिंग परीक्षण के बाद चरणबद्ध और सुरक्षित क्लाउड स्थानांतरण।',
    descEn: 'Staged migration verified in preview environments before live cutover.',
  },
  {
    step: '04',
    titleHi: 'ऑटोमेशन',
    titleEn: 'Automation',
    descHi: 'CI/CD पाइपलाइन, कंटेनर बिल्ड और Terraform स्क्रिप्ट सक्रिय करना।',
    descEn: 'Enabling CI/CD pipelines, container builds, and reproducible IaC scripts.',
  },
  {
    step: '05',
    titleHi: 'मॉनिटरिंग और सपोर्ट',
    titleEn: 'Monitoring & Support',
    descHi: 'डैशबोर्ड, अलर्ट, बैकअप जाँच और निरंतर तकनीकी सहायता।',
    descEn: 'Live observability alerts, backup verification, and ongoing ops support.',
  },
];

const TECH_CHIPS = [
  'AWS',
  'Google Cloud',
  'Azure',
  'Docker',
  'Kubernetes',
  'Terraform',
  'GitHub Actions',
  'Linux',
];

const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'duration',
    qHi: 'क्लाउड पर जाने में कितना समय लगता है?',
    qEn: 'How long does it take to move to the cloud?',
    aHi: 'डेमो उदाहरण के तौर पर, एक सामान्य वेबसाइट या वेब ऐप का क्लाउड सेटअप 3 से 7 कार्यदिवसों में और बड़े डेटाबेस व CI/CD के साथ पूर्ण माइग्रेशन दायरे के अनुसार 2 से 4 सप्ताह में किया जा सकता है।',
    aEn: 'As a general demo reference, a standard website or app cloud setup can take 3 to 7 working days, while full multi-service migrations with CI/CD typically take 2 to 4 weeks depending on complexity.',
  },
  {
    id: 'data-security',
    qHi: 'क्या मेरा डेटा सुरक्षित रहेगा?',
    qEn: 'Will my data stay secure on the cloud?',
    aHi: 'सही कॉन्फ़िगरेशन (HTTPS एन्क्रिप्शन, प्राइवेट सबनेट, रोल-आधारित एक्सेस और नियमित बैकअप) के साथ आपका डेटा आपके अपने क्लाउड खाते के नियंत्रण में सुरक्षित रहता है। (यह जानकारी डेमो के लिए है।)',
    aEn: 'With proper architecture — TLS encryption, private subnets, least-privilege IAM roles, and automated backups — your data remains under your direct cloud account ownership. (Demo reference.)',
  },
  {
    id: 'monthly-cost',
    qHi: 'क्लाउड का मासिक खर्च कौन देगा?',
    qEn: 'Who pays the monthly cloud provider charges?',
    aHi: 'सामान्य प्रक्रिया में क्लाउड खाता (जैसे AWS, Google Cloud या Azure) सीधे क्लाइंट के नाम पर बनता है, इसलिए सर्वर का मासिक बिल सीधे क्लाउड प्रदाता को जाता है और पूरा नियंत्रण आपके पास रहता है। (नमूना उत्तर)',
    aEn: 'In a standard setup, the cloud account is owned directly by the client so monthly infrastructure usage is billed transparently by the cloud provider with full ownership on your side. (Sample answer.)',
  },
  {
    id: 'downtime',
    qHi: 'क्या माइग्रेशन में वेबसाइट बंद होगी?',
    qEn: 'Will the website go offline during migration?',
    aHi: 'पहले नए क्लाउड एनवायरनमेंट पर पूरा सेटअप और टेस्टिंग की जाती है, फिर कम ट्रैफ़िक वाले समय में DNS स्विच किया जाता है ताकि रुकावट न्यूनतम रहे या न के बराबर हो। (डेमो मार्गदर्शन)',
    aEn: 'The new cloud environment is built and verified in parallel first, followed by a planned DNS cutover during low-traffic hours to keep disruption minimal. (Demo guidance.)',
  },
];

const INITIAL_SERIES = [38, 42, 40, 47, 45, 52, 49, 44, 48, 51, 46, 43];

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

export const CloudEngineeringDemo: React.FC<CloudEngineeringDemoProps> = ({
  onBackToHome,
  onRequestQuote,
}) => {
  const { language, setLanguage } = useLanguage();
  const isHi = language === 'hi';

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeServiceModal, setActiveServiceModal] = useState<CloudService | null>(null);
  const [activeUseCaseModal, setActiveUseCaseModal] = useState<CloudUseCase | null>(null);
  const [activeArchId, setActiveArchId] = useState<string>('lb');
  const [openFaqId, setOpenFaqId] = useState<string>('duration');
  const [demoToast, setDemoToast] = useState<string | null>(null);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  // Hero lightweight terminal animation state (cycles 1..4 lines cleanly)
  const [heroTerminalStep, setHeroTerminalStep] = useState<number>(4);

  // Interactive 5-stage DevOps Pipeline runner state (100% local, zero API)
  const [pipelineRunning, setPipelineRunning] = useState(false);
  const [pipelineCompletedCount, setPipelineCompletedCount] = useState(0);
  const [pipelineActiveIdx, setPipelineActiveIdx] = useState<number | null>(null);
  const [pipelineDoneMsg, setPipelineDoneMsg] = useState(false);
  const pipelineTimersRef = useRef<number[]>([]);

  // Sample Monitoring Dashboard state (random sample values — NOT live)
  const [monitoringPaused, setMonitoringPaused] = useState(false);
  const [sampleMetrics, setSampleMetrics] = useState({
    cpu: 43,
    memory: 58,
    rpm: 612,
    latency: 64,
    series: INITIAL_SERIES,
  });

  // Local-only Cloud Audit Form state (ZERO Firestore / ZERO API calls)
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    mobile: '',
    currentHosting: '',
    requirement: '',
    message: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);

  // Hero terminal step reveal loop (respects prefers-reduced-motion)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setHeroTerminalStep(HERO_TERMINAL_LINES.length);
      return;
    }
    setHeroTerminalStep(1);
    const interval = window.setInterval(() => {
      setHeroTerminalStep((prev) =>
        prev >= HERO_TERMINAL_LINES.length ? 1 : prev + 1
      );
    }, 1500);
    return () => window.clearInterval(interval);
  }, []);

  // Cleanup pipeline timers on unmount
  useEffect(() => {
    return () => {
      pipelineTimersRef.current.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  // Sample monitoring random updates every 2.8s (local demo only)
  useEffect(() => {
    if (typeof window === 'undefined' || monitoringPaused) return;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const interval = window.setInterval(() => {
      setSampleMetrics((prev) => {
        const nextCpu = Math.min(76, Math.max(22, prev.cpu + Math.floor(Math.random() * 13) - 6));
        const nextMem = Math.min(78, Math.max(42, prev.memory + Math.floor(Math.random() * 9) - 4));
        const nextRpm = Math.min(960, Math.max(310, prev.rpm + Math.floor(Math.random() * 110) - 55));
        const nextLat = Math.min(125, Math.max(38, prev.latency + Math.floor(Math.random() * 19) - 9));
        return {
          cpu: nextCpu,
          memory: nextMem,
          rpm: nextRpm,
          latency: nextLat,
          series: [...prev.series.slice(1), nextCpu],
        };
      });
    }, 2800);

    return () => window.clearInterval(interval);
  }, [monitoringPaused]);

  useEffect(() => {
    if (!demoToast) return;
    const timer = window.setTimeout(() => setDemoToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [demoToast]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveServiceModal(null);
        setActiveUseCaseModal(null);
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

  const handleRunPipeline = () => {
    pipelineTimersRef.current.forEach((t) => window.clearTimeout(t));
    pipelineTimersRef.current = [];
    setPipelineRunning(true);
    setPipelineCompletedCount(0);
    setPipelineDoneMsg(false);
    setPipelineActiveIdx(0);

    PIPELINE_STAGES.forEach((_, idx) => {
      const startTimer = window.setTimeout(() => {
        setPipelineActiveIdx(idx);
      }, idx * 620);

      const finishTimer = window.setTimeout(() => {
        setPipelineCompletedCount(idx + 1);
        if (idx === PIPELINE_STAGES.length - 1) {
          setPipelineActiveIdx(null);
          setPipelineRunning(false);
          setPipelineDoneMsg(true);
        }
      }, idx * 620 + 520);

      pipelineTimersRef.current.push(startTimer, finishTimer);
    });
  };

  const handleResetPipeline = () => {
    pipelineTimersRef.current.forEach((t) => window.clearTimeout(t));
    pipelineTimersRef.current = [];
    setPipelineRunning(false);
    setPipelineCompletedCount(0);
    setPipelineActiveIdx(null);
    setPipelineDoneMsg(false);
  };

  const handleSelectPackage = (pkg: CloudPackage) => {
    setFormData((prev) => ({
      ...prev,
      message: isHi
        ? `${pkg.nameHi} पैकेज (${pkg.priceHi}) के लिए फ़्री क्लाउड ऑडिट चाहिए।`
        : `Requesting a free cloud audit regarding the ${pkg.nameEn} package (${pkg.priceEn}).`,
    }));
    setFormError(null);
    setFormSuccess(false);
    scrollToSection('cloud-contact');
  };

  const handleServiceConsult = (service: CloudService) => {
    setActiveServiceModal(null);
    setFormData((prev) => ({
      ...prev,
      message: isHi
        ? `${service.titleHi} के लिए क्लाउड ऑडिट और सलाह चाहिए।`
        : `I would like a cloud audit and consultation for ${service.titleEn}.`,
    }));
    setFormError(null);
    setFormSuccess(false);
    scrollToSection('cloud-contact');
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
      setFormError(isHi ? 'कृपया कंपनी का नाम लिखें।' : 'Please enter your company name.');
      return;
    }
    if (digitsOnly.length < 10) {
      setFormError(
        isHi ? 'कृपया 10 अंकों का सही मोबाइल नंबर दर्ज करें।' : 'Please enter a valid 10-digit mobile number.'
      );
      return;
    }
    if (!formData.currentHosting) {
      setFormError(
        isHi ? 'कृपया चुनें कि अभी होस्टिंग कहाँ है।' : 'Please select your current hosting setup.'
      );
      return;
    }
    if (!formData.requirement) {
      setFormError(
        isHi ? 'कृपया चुनें कि आपको कौन-सी क्लाउड सेवा चाहिए।' : 'Please select what you need.'
      );
      return;
    }
    if (trimmedMessage.length < 5) {
      setFormError(
        isHi ? 'कृपया अपनी आवश्यकता के बारे में संक्षिप्त संदेश लिखें।' : 'Please provide a brief message about your workload.'
      );
      return;
    }

    // Strictly local state — NO Firestore write and NO API call
    setFormSuccess(true);
  };

  const activeArchNode = ARCH_NODES.find((n) => n.id === activeArchId) || ARCH_NODES[0];

  const renderArchIcon = (icon: ArchNode['icon'], cls = 'w-5 h-5') => {
    switch (icon) {
      case 'users':
        return <Users className={cls} />;
      case 'cdn':
        return <Globe className={cls} />;
      case 'lb':
        return <Network className={cls} />;
      case 'app':
        return <Server className={cls} />;
      case 'db':
        return <Database className={cls} />;
    }
  };

  // Build crisp lightweight SVG polyline points for sample monitoring chart
  const chartPoints = sampleMetrics.series
    .map((val, idx) => {
      const x = (idx / (sampleMetrics.series.length - 1)) * 300;
      const y = 76 - ((val - 15) / 70) * 64;
      return `${x.toFixed(1)},${Math.max(6, Math.min(74, y)).toFixed(1)}`;
    })
    .join(' ');

  const chartAreaPoints = `0,78 ${chartPoints} 300,78`;

  const navLinks = [
    { id: 'cloud-home', hi: 'होम', en: 'Home' },
    { id: 'cloud-services', hi: 'सेवाएँ', en: 'Services' },
    { id: 'cloud-devops', hi: 'DevOps', en: 'DevOps' },
    { id: 'cloud-monitoring', hi: 'मॉनिटरिंग', en: 'Monitoring' },
    { id: 'cloud-usecases', hi: 'उपयोग', en: 'Use Cases' },
    { id: 'cloud-packages', hi: 'पैकेज', en: 'Packages' },
    { id: 'cloud-contact', hi: 'संपर्क', en: 'Contact' },
  ];

  return (
    <div
      className="min-h-screen bg-[#060d18] text-slate-100 antialiased selection:bg-teal-400 selection:text-[#041016]"
      style={{
        backgroundImage: 'radial-gradient(rgba(148, 163, 184, 0.12) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
    >
      {/* Unified Sticky Top Wrapper (DEMO Disclaimer Bar + Cloud Engineering Header) */}
      <div className="sticky top-0 z-40">
        {/* Top DEMO Disclaimer Bar */}
        <div className="bg-[#0a1626] border-b border-sky-400/25 px-3 sm:px-6 py-2">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="inline-block px-2 py-0.5 rounded bg-teal-400/15 border border-teal-400/35 text-[10px] font-bold tracking-wider text-teal-200 uppercase shrink-0">
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
        <DemoPriceBar slug="cloud-engineering" />

        {/* Navigation Header */}
        <header className="bg-[#060d18]/90 backdrop-blur-xl border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
            {/* Brand Wordmark (Generic Cloud + Circuit icon) */}
            <button
              type="button"
              onClick={() => scrollToSection('cloud-home')}
              className="flex items-center gap-2.5 text-left cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 rounded-lg"
            >
              <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-teal-500 flex items-center justify-center shadow-[0_0_18px_rgba(20,184,166,0.35)]">
                <CloudCog className="w-5 h-5 text-[#041016]" />
              </span>
              <span className="text-sm sm:text-base font-extrabold tracking-tight text-white">
                CLOUD ENGINEERING
              </span>
            </button>

            {/* Desktop Nav */}
            <nav className="hidden xl:flex items-center gap-5 text-sm font-medium text-slate-300">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => scrollToSection(link.id)}
                  className="hover:text-sky-300 transition-colors cursor-pointer whitespace-nowrap shrink-0 py-1"
                >
                  {isHi ? link.hi : link.en}
                </button>
              ))}
            </nav>

            {/* Right CTA & Mobile Menu Toggle */}
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => scrollToSection('cloud-contact')}
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-400 hover:to-teal-400 text-[#041016] text-xs sm:text-sm font-bold transition-all duration-200 hover:shadow-[0_0_24px_rgba(56,189,248,0.45)] cursor-pointer whitespace-nowrap"
              >
                {isHi ? 'फ़्री क्लाउड ऑडिट' : 'Free Cloud Audit'}
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
            <div className="xl:hidden border-t border-white/10 bg-[#091322] px-4 py-4 space-y-1.5">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => scrollToSection(link.id)}
                  className="block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-slate-200 hover:bg-white/10 hover:text-sky-300 transition-colors cursor-pointer"
                >
                  {isHi ? link.hi : link.en}
                </button>
              ))}
              <button
                type="button"
                onClick={() => scrollToSection('cloud-contact')}
                className="w-full mt-2 px-4 py-3 rounded-lg bg-gradient-to-r from-sky-500 to-teal-500 text-[#041016] text-sm font-bold cursor-pointer"
              >
                {isHi ? 'फ़्री क्लाउड ऑडिट' : 'Free Cloud Audit'}
              </button>
            </div>
          )}
        </header>
      </div>

      {/* 1. HERO SECTION (hero.jpg + dark overlay + lightweight typing terminal box) */}
      <section
        id="cloud-home"
        className="relative overflow-hidden border-b border-white/10 py-16 sm:py-24"
      >
        <div className="absolute inset-0">
          {!brokenImages['hero'] ? (
            <img
              src="/demo/cloud-engineering/hero.jpg"
              alt={isHi ? 'क्लाउड इंजीनियरिंग और डेवऑप्स ऑपरेशन सेंटर' : 'Cloud Engineering & DevOps Operations Center'}
              referrerPolicy="no-referrer"
              onError={() => markImageBroken('hero')}
              className="w-full h-full object-cover object-center"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#060d18] via-[#0c1d33] to-[#08262e]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-[#060d18]/96 via-[#060d18]/86 to-[#071a29]/72" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#060d18] via-transparent to-[#060d18]/40" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Copy Column */}
          <div className="lg:col-span-7 space-y-6">
            <p className="text-xs sm:text-sm font-semibold tracking-wide text-teal-300">
              {isHi
                ? 'क्लाउड आर्किटेक्चर और डेवऑप्स ऑटोमेशन'
                : 'Cloud Architecture & DevOps Automation'}
            </p>

            <h1 className="text-3xl sm:text-5xl lg:text-[3.4rem] font-extrabold tracking-tight text-white leading-[1.12] [text-wrap:balance]">
              {isHi
                ? 'आपका बिज़नेस, क्लाउड पर — तेज़, सुरक्षित और ऑटोमेटेड'
                : 'Your Business on the Cloud — Fast, Secure & Automated'}
            </h1>

            <p className="text-base sm:text-xl font-medium text-slate-200 max-w-2xl leading-relaxed">
              {isHi
                ? 'आर्किटेक्चर, माइग्रेशन, CI/CD और 24x7 मॉनिटरिंग सेटअप'
                : 'Architecture, migration, CI/CD, and 24x7 monitoring setup'}
            </p>

            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <button
                type="button"
                onClick={() => scrollToSection('cloud-contact')}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-400 hover:to-teal-400 text-[#041016] text-sm sm:text-base font-bold transition-all duration-200 hover:shadow-[0_0_28px_rgba(56,189,248,0.45)] cursor-pointer whitespace-nowrap"
              >
                {isHi ? 'फ़्री क्लाउड ऑडिट' : 'Free Cloud Audit'}
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('cloud-services')}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.13] backdrop-blur-md border border-white/15 text-white text-sm sm:text-base font-semibold transition-colors cursor-pointer whitespace-nowrap"
              >
                {isHi ? 'सेवाएँ देखें' : 'Explore Services'}
              </button>
            </div>
          </div>

          {/* Right Monospace Demo Terminal Box */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl bg-[#07111f]/90 backdrop-blur-md border border-sky-400/25 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
              <div className="px-4 py-2.5 bg-[#0b182b] border-b border-white/10 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
                  <Terminal className="w-3.5 h-3.5 text-teal-400" />
                  <span>ci-deploy-demo</span>
                </div>
                <span className="text-[11px] font-mono text-amber-300">
                  {isHi ? 'नमूना टर्मिनल' : 'sample output'}
                </span>
              </div>

              <div className="p-5 font-mono text-xs sm:text-sm space-y-3 min-h-[210px]">
                {HERO_TERMINAL_LINES.slice(0, heroTerminalStep).map((line, idx) => (
                  <div key={line.cmd} className="space-y-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className={idx === 0 ? 'text-sky-300 font-semibold' : 'text-slate-200'}>
                        {line.cmd}
                      </span>
                      <span className="text-teal-400 font-bold shrink-0">{line.status}</span>
                    </div>
                    {isHi && (
                      <p className="text-[11px] font-sans text-slate-400 pl-3">{line.hi}</p>
                    )}
                  </div>
                ))}

                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
                  <span>git push → build ✓ → test ✓ → deploy ✓</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SERVICES SECTION (6 Real Photo Cards + Scope Modal) */}
      <RevealSection id="cloud-services" className="py-16 sm:py-24 px-4 sm:px-6 border-b border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl mb-12 space-y-3">
            <p className="text-xs sm:text-sm font-semibold text-teal-300">
              {isHi ? 'क्लाउड और DevOps सेवाएँ' : 'Cloud & DevOps Services'}
            </p>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white [text-wrap:balance]">
              {isHi
                ? 'डिज़ाइन से डिप्लॉयमेंट और मॉनिटरिंग तक संपूर्ण इंफ्रास्ट्रक्चर'
                : 'Complete Cloud Infrastructure from Design to Observability'}
            </h2>
            <p className="text-sm sm:text-base text-slate-300">
              {isHi
                ? 'किसी भी सेवा पर “और जानें” दबाकर कार्य-दायरा विस्तार से देखें।'
                : 'Select “Learn More” on any service card to inspect technical deliverables.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.map((service) => (
              <article
                key={service.id}
                className="group rounded-2xl bg-white/[0.035] backdrop-blur-md border border-white/10 hover:border-sky-400/45 overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-0.5"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-[#0a1628]">
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
                    <div className="w-full h-full flex items-center justify-center bg-[#0c1a2e] text-sky-300 text-sm font-semibold">
                      {isHi ? service.titleHi : service.titleEn}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#060d18]/75 via-transparent to-transparent" />
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
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-sky-300 hover:text-teal-300 transition-colors cursor-pointer"
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

      {/* 3. INTERACTIVE DEVOPS PIPELINE RUNNER (Code → Build → Test → Deploy → Monitor) */}
      <RevealSection
        id="cloud-devops"
        className="py-16 sm:py-24 px-4 sm:px-6 border-b border-white/10 bg-[#081222]/90"
      >
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <p className="text-xs sm:text-sm font-semibold text-sky-300">
                {isHi ? 'इंटरैक्टिव CI/CD डेमो' : 'Interactive CI/CD Preview'}
              </p>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white [text-wrap:balance]">
                {isHi ? 'DevOps पाइपलाइन कैसे चलती है' : 'How an Automated DevOps Pipeline Runs'}
              </h2>
              <p className="text-sm sm:text-base text-slate-300">
                {isHi
                  ? '“पाइपलाइन चलाएँ” दबाएँ और देखें हर स्टेज बारी-बारी कैसे सत्यापित होता है। (कोई असली सर्वर कॉल नहीं)'
                  : 'Click “Run Pipeline” to watch each stage verify in sequence locally with zero external API calls.'}
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                disabled={pipelineRunning}
                onClick={handleRunPipeline}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-400 hover:to-teal-400 text-[#041016] text-sm font-bold transition-all hover:shadow-[0_0_24px_rgba(20,184,166,0.45)] disabled:opacity-55 cursor-pointer whitespace-nowrap"
              >
                <Play className="w-4 h-4" />
                {pipelineRunning
                  ? isHi
                    ? 'पाइपलाइन चल रही है…'
                    : 'Running Pipeline…'
                  : isHi
                  ? 'पाइपलाइन चलाएँ'
                  : 'Run Pipeline'}
              </button>
              <button
                type="button"
                onClick={handleResetPipeline}
                className="inline-flex items-center gap-1.5 px-3.5 py-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-xs sm:text-sm font-semibold text-slate-200 transition-colors cursor-pointer"
                aria-label={isHi ? 'रीसेट करें' : 'Reset'}
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 5 Pipeline Stages */}
          <div className="relative">
            <div
              aria-hidden="true"
              className="hidden lg:block absolute top-10 left-10 right-10 h-[2px] bg-white/10"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {PIPELINE_STAGES.map((stage, idx) => {
                const isCompleted = idx < pipelineCompletedCount;
                const isRunning = idx === pipelineActiveIdx;
                return (
                  <div
                    key={stage.id}
                    className={`relative rounded-2xl p-5 backdrop-blur-md border transition-all duration-300 ${
                      isCompleted
                        ? 'bg-emerald-500/12 border-emerald-400/60 shadow-[0_0_20px_rgba(16,185,129,0.18)]'
                        : isRunning
                        ? 'bg-sky-500/15 border-sky-400/70 shadow-[0_0_20px_rgba(56,189,248,0.22)]'
                        : 'bg-white/[0.035] border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-slate-400">
                        <GitBranch className="w-3.5 h-3.5 text-sky-400" />
                        0{idx + 1}
                      </span>
                      <span
                        className={`text-xs font-mono font-bold ${
                          isCompleted
                            ? 'text-emerald-400'
                            : isRunning
                            ? 'text-sky-300'
                            : 'text-slate-500'
                        }`}
                      >
                        {isCompleted ? '✓ PASS' : isRunning ? 'RUN…' : 'IDLE'}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white">
                      {isHi ? stage.labelHi : stage.labelEn}
                    </h3>
                    <p className="text-xs font-mono text-teal-300/90 mt-1.5 truncate">
                      {stage.cmd}
                    </p>
                    <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                      {isHi ? stage.descHi : stage.descEn}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {pipelineDoneMsg && (
            <div
              role="status"
              className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-400/45 flex items-center gap-3 text-sm font-semibold text-emerald-200"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>
                {isHi
                  ? 'डेमो: नमूना डिप्लॉय पूरा — सभी 5 CI/CD चरण सफलतापूर्वक सत्यापित हुए (कोई असली सर्वर कॉल नहीं)।'
                  : 'Demo: Sample deployment completed — all 5 CI/CD stages verified locally with zero server calls.'}
              </span>
            </div>
          )}
        </div>
      </RevealSection>

      {/* 4. SAMPLE MONITORING DASHBOARD (4 Tiles + Line Chart — Explicitly "नमूना डेटा — लाइव नहीं") */}
      <RevealSection id="cloud-monitoring" className="py-16 sm:py-24 px-4 sm:px-6 border-b border-white/10">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-2">
              <p className="text-xs sm:text-sm font-semibold text-amber-300">
                {isHi ? 'नमूना डेटा — लाइव नहीं' : 'Sample Data — Not Live'}
              </p>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white [text-wrap:balance]">
                {isHi ? 'नमूना मॉनिटरिंग डैशबोर्ड' : 'Sample Observability Dashboard'}
              </h2>
              <p className="text-sm text-slate-300">
                {isHi
                  ? 'नीचे दिखाए गए मान केवल डेमो के लिए हर कुछ सेकंड में रैंडम रूप से बदलते हैं।'
                  : 'Metrics below cycle through bounded random sample values for demonstration only.'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setMonitoringPaused((prev) => !prev)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-xs sm:text-sm font-semibold text-slate-200 cursor-pointer self-start sm:self-auto"
            >
              {monitoringPaused ? <Play className="w-4 h-4 text-teal-300" /> : <Pause className="w-4 h-4 text-sky-300" />}
              {monitoringPaused
                ? isHi
                  ? 'अपडेट चालू करें'
                  : 'Resume Sample'
                : isHi
                ? 'रोकें'
                : 'Pause Sample'}
            </button>
          </div>

          {/* 4 Metric Tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl bg-white/[0.035] backdrop-blur-md border border-white/10 p-5 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>{isHi ? 'CPU उपयोग' : 'CPU Utilization'}</span>
                <Cpu className="w-4 h-4 text-sky-400" />
              </div>
              <div className="text-3xl font-mono font-extrabold text-white tabular-nums">
                {sampleMetrics.cpu}%
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-sky-400 to-teal-400 transition-all duration-500"
                  style={{ width: `${sampleMetrics.cpu}%` }}
                />
              </div>
            </div>

            <div className="rounded-2xl bg-white/[0.035] backdrop-blur-md border border-white/10 p-5 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>{isHi ? 'मेमोरी उपयोग' : 'Memory Usage'}</span>
                <HardDrive className="w-4 h-4 text-teal-400" />
              </div>
              <div className="text-3xl font-mono font-extrabold text-white tabular-nums">
                {sampleMetrics.memory}%
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-teal-400 to-sky-400 transition-all duration-500"
                  style={{ width: `${sampleMetrics.memory}%` }}
                />
              </div>
            </div>

            <div className="rounded-2xl bg-white/[0.035] backdrop-blur-md border border-white/10 p-5 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>{isHi ? 'रिक्वेस्ट / मिनट' : 'Requests / Min'}</span>
                <Activity className="w-4 h-4 text-sky-400" />
              </div>
              <div className="text-3xl font-mono font-extrabold text-white tabular-nums">
                {sampleMetrics.rpm}
              </div>
              <p className="text-[11px] font-mono text-slate-400">
                {isHi ? 'नमूना ट्रैफ़िक दर' : 'sample throughput'}
              </p>
            </div>

            <div className="rounded-2xl bg-white/[0.035] backdrop-blur-md border border-white/10 p-5 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>{isHi ? 'रिस्पॉन्स टाइम' : 'Response Time'}</span>
                <Terminal className="w-4 h-4 text-teal-400" />
              </div>
              <div className="text-3xl font-mono font-extrabold text-white tabular-nums">
                {sampleMetrics.latency} ms
              </div>
              <p className="text-[11px] font-mono text-slate-400">
                {isHi ? 'नमूना API लेटेंसी' : 'sample p95 latency'}
              </p>
            </div>
          </div>

          {/* Lightweight SVG Line Chart */}
          <div className="rounded-2xl bg-white/[0.035] backdrop-blur-md border border-white/10 p-5 sm:p-6 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-mono font-semibold text-sky-300">
                {isHi ? 'CPU लोड ट्रेंड (नमूना लाइन चार्ट)' : 'CPU Load Trend (Sample Line Chart)'}
              </span>
              <span className="font-mono text-amber-300">
                {isHi ? 'नमूना डेटा — लाइव नहीं' : 'Sample Data — Not Live'}
              </span>
            </div>
            <div className="w-full overflow-hidden">
              <svg
                viewBox="0 0 300 82"
                preserveAspectRatio="none"
                className="w-full h-24 sm:h-28"
                role="img"
                aria-label={isHi ? 'नमूना CPU लाइन चार्ट' : 'Sample CPU Line Chart'}
              >
                <defs>
                  <linearGradient id="cloudChartFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.32" />
                    <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.02" />
                  </linearGradient>
                </defs>
                <line x1="0" y1="20" x2="300" y2="20" stroke="rgba(148,163,184,0.12)" strokeDasharray="3 3" />
                <line x1="0" y1="48" x2="300" y2="48" stroke="rgba(148,163,184,0.12)" strokeDasharray="3 3" />
                <polygon points={chartAreaPoints} fill="url(#cloudChartFill)" />
                <polyline
                  fill="none"
                  stroke="#2dd4bf"
                  strokeWidth="2.2"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  points={chartPoints}
                />
              </svg>
            </div>
          </div>
        </div>
      </RevealSection>

      {/* 5. SIMPLE CLOUD ARCHITECTURE DIAGRAM (Hover/Tap Interactive HTML/CSS Flow) */}
      <RevealSection className="py-16 sm:py-24 px-4 sm:px-6 border-b border-white/10 bg-[#081222]/90">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <p className="text-xs sm:text-sm font-semibold text-teal-300">
              {isHi ? 'क्लाउड आर्किटेक्चर डायग्राम' : 'Reference Cloud Architecture'}
            </p>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white [text-wrap:balance]">
              {isHi
                ? 'यूज़र से डेटाबेस तक अनुरोध की सुरक्षित यात्रा'
                : 'How Requests Flow Safely from User to Database'}
            </h2>
            <p className="text-sm text-slate-300">
              {isHi
                ? 'किसी भी बॉक्स पर होवर या टैप करके उसकी भूमिका पढ़ें।'
                : 'Hover or tap any architecture block to inspect its responsibility.'}
            </p>
          </div>

          {/* HTML/CSS Connected Architecture Boxes */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {ARCH_NODES.map((node, idx) => {
              const selected = node.id === activeArchNode.id;
              return (
                <React.Fragment key={node.id}>
                  <button
                    type="button"
                    onMouseEnter={() => setActiveArchId(node.id)}
                    onFocus={() => setActiveArchId(node.id)}
                    onClick={() => setActiveArchId(node.id)}
                    className={`flex-1 rounded-2xl p-5 border text-left transition-all duration-200 cursor-pointer ${
                      selected
                        ? 'bg-sky-500/15 border-sky-400 shadow-[0_0_24px_rgba(56,189,248,0.22)] -translate-y-0.5'
                        : 'bg-white/[0.035] border-white/10 hover:border-white/25'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-teal-500/15 border border-teal-400/30 text-teal-300 flex items-center justify-center mb-3">
                      {renderArchIcon(node.icon)}
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-white">
                      {isHi ? node.titleHi : node.titleEn}
                    </h3>
                    <p className="text-xs font-mono text-sky-300 mt-1">
                      {isHi ? node.subHi : node.subEn}
                    </p>
                  </button>

                  {idx < ARCH_NODES.length - 1 && (
                    <div
                      aria-hidden="true"
                      className="flex items-center justify-center text-teal-400/75 py-1 lg:py-0 shrink-0"
                    >
                      <ArrowRight className="w-5 h-5 rotate-90 lg:rotate-0" />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Selected Node Explanation Box */}
          <div className="rounded-2xl bg-[#060d18] border border-sky-400/25 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3 shrink-0">
              <span className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-400/35 text-sky-300 flex items-center justify-center">
                {renderArchIcon(activeArchNode.icon)}
              </span>
              <div>
                <p className="text-[11px] font-mono text-teal-300">
                  {isHi ? activeArchNode.subHi : activeArchNode.subEn}
                </p>
                <p className="text-base font-bold text-white">
                  {isHi ? activeArchNode.titleHi : activeArchNode.titleEn}
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed sm:border-l sm:border-white/10 sm:pl-5">
              {isHi ? activeArchNode.detailHi : activeArchNode.detailEn}
            </p>
          </div>
        </div>
      </RevealSection>

      {/* 6. INDUSTRY USE CASES (4 Real Photo Cards — "नमूना उपयोग" tag) */}
      <RevealSection id="cloud-usecases" className="py-16 sm:py-24 px-4 sm:px-6 border-b border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl mb-12 space-y-3">
            <p className="text-xs sm:text-sm font-semibold text-sky-300">
              {isHi ? 'उद्योग उपयोग (नमूना)' : 'Industry Use Cases (Sample)'}
            </p>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white [text-wrap:balance]">
              {isHi ? 'हर क्षेत्र के लिए अनुकूल क्लाउड सेटअप' : 'Cloud Blueprints Tailored to Different Industries'}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {USE_CASES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveUseCaseModal(item)}
                className="group text-left rounded-2xl bg-white/[0.035] backdrop-blur-md border border-white/10 hover:border-teal-400/45 overflow-hidden transition-all duration-200 hover:-translate-y-0.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-[#0a1628]">
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
                    <div className="w-full h-full flex items-center justify-center bg-[#0c1a2e] text-teal-300 text-sm font-semibold">
                      {isHi ? item.titleHi : item.titleEn}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#060d18]/85 via-transparent to-transparent" />
                  <div className="absolute top-3.5 left-3.5 px-2.5 py-1 rounded-md bg-[#060d18]/85 border border-teal-400/35 text-[11px] font-semibold text-teal-200">
                    {isHi ? 'नमूना उपयोग' : 'Sample Use Case'}
                  </div>
                </div>

                <div className="p-6 space-y-2.5">
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
                    <span className="text-sky-300 font-semibold">
                      {isHi ? item.sectorHi : item.sectorEn}
                    </span>
                    <span className="text-teal-300 font-medium">
                      {isHi ? 'विवरण देखें →' : 'View Details →'}
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

      {/* 7. SAMPLE PACKAGES (3 Cards, middle "लोकप्रिय" highlighted, "नमूना कीमतें — डेमो") */}
      <RevealSection
        id="cloud-packages"
        className="py-16 sm:py-24 px-4 sm:px-6 border-b border-white/10 bg-[#081222]/90"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <p className="text-xs sm:text-sm font-semibold text-amber-300">
              {isHi ? 'नमूना कीमतें — डेमो' : 'Sample Pricing — Demo Only'}
            </p>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white [text-wrap:balance]">
              {isHi ? 'क्लाउड और DevOps पैकेज (नमूना)' : 'Sample Cloud & DevOps Packages'}
            </h2>
            <p className="text-sm sm:text-base text-slate-300">
              {isHi
                ? 'दिखाई गई कीमतें केवल डेमो प्रदर्शन के लिए हैं। वास्तविक सेटअप शुल्क सर्वर संख्या और आर्किटेक्चर के अनुसार तय होता है।'
                : 'Figures shown are sample demo references only. Actual project quotes depend on architecture and workload scope.'}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            {PACKAGES.map((pkg) => (
              <div
                key={pkg.id}
                className={`rounded-2xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-200 ${
                  pkg.highlighted
                    ? 'bg-gradient-to-b from-[#0d2236] to-[#091826] border-2 border-teal-400/70 shadow-[0_0_36px_rgba(20,184,166,0.18)]'
                    : 'bg-white/[0.035] backdrop-blur-md border border-white/10'
                }`}
              >
                <div className="space-y-5">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xl font-bold text-white">
                      {isHi ? pkg.nameHi : pkg.nameEn}
                    </h3>
                    {pkg.highlighted && (
                      <span className="px-2.5 py-1 rounded-md bg-gradient-to-r from-sky-500 to-teal-500 text-[11px] font-extrabold text-[#041016] whitespace-nowrap">
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
                        <Check className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-8">
                  <button
                    type="button"
                    onClick={() => handleSelectPackage(pkg)}
                    className={`w-full py-3 px-4 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer ${
                      pkg.highlighted
                        ? 'bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-400 hover:to-teal-400 text-[#041016] hover:shadow-[0_0_24px_rgba(20,184,166,0.45)]'
                        : 'bg-white/[0.08] hover:bg-white/[0.15] border border-white/15 text-white'
                    }`}
                  >
                    {isHi ? 'फ़्री क्लाउड ऑडिट लें' : 'Request Free Audit'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* 8. 5-STEP PROCESS TIMELINE */}
      <RevealSection className="py-16 sm:py-24 px-4 sm:px-6 border-b border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl mb-12 space-y-3">
            <p className="text-xs sm:text-sm font-semibold text-teal-300">
              {isHi ? 'क्लाउड कार्य प्रक्रिया' : 'Delivery Process'}
            </p>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white [text-wrap:balance]">
              {isHi ? '5 चरणों में सुरक्षित क्लाउड ट्रांसफ़ॉर्मेशन' : 'Five Structured Steps to Automated Cloud Ops'}
            </h2>
          </div>

          <div className="relative">
            <div
              aria-hidden="true"
              className="hidden lg:block absolute top-6 left-10 right-10 h-[2px] bg-gradient-to-r from-sky-500/40 via-teal-400/55 to-sky-500/40"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
              {PROCESS_STEPS.map((step) => (
                <div
                  key={step.step}
                  className="relative rounded-2xl bg-white/[0.035] backdrop-blur-md border border-white/10 p-5 space-y-3"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-teal-500 flex items-center justify-center text-sm font-mono font-extrabold text-[#041016] tabular-nums">
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

      {/* 9. TECHNOLOGY STRIP (Text Chips Only — No Logo Images, No Partner Claims) */}
      <RevealSection className="py-12 sm:py-16 px-4 sm:px-6 border-b border-white/10 bg-[#081222]/90">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-sky-300">
              {isHi ? 'क्लाउड और DevOps टूल्स' : 'Cloud & DevOps Stack'}
            </p>
            <h2 className="text-lg sm:text-xl font-bold text-white">
              {isHi ? 'प्रमुख प्लेटफ़ॉर्म और ऑटोमेशन टूल्स' : 'Core Platforms & Automation Tooling'}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            {TECH_CHIPS.map((tech) => (
              <span
                key={tech}
                className="px-3.5 py-2 rounded-lg bg-white/[0.05] border border-white/12 text-xs sm:text-sm font-mono font-semibold text-slate-100"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* 10. FAQ ACCORDION (4 Questions) */}
      <RevealSection className="py-16 sm:py-24 px-4 sm:px-6 border-b border-white/10">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10 space-y-3">
            <p className="text-xs sm:text-sm font-semibold text-teal-300">
              {isHi ? 'सामान्य प्रश्न (FAQ)' : 'Frequently Asked Questions'}
            </p>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white [text-wrap:balance]">
              {isHi ? 'क्लाउड माइग्रेशन और होस्टिंग से जुड़े सवाल' : 'Common Cloud & Migration Questions'}
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
                      className={`w-5 h-5 text-sky-300 shrink-0 transition-transform duration-200 ${
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

      {/* 11. CLOUD AUDIT FORM + DEMO CONTACT DETAILS */}
      <RevealSection
        id="cloud-contact"
        className="py-16 sm:py-24 px-4 sm:px-6 border-b border-white/10 bg-[#081222]/90"
      >
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Contact Details Column */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-3">
              <p className="text-xs sm:text-sm font-semibold text-teal-300">
                {isHi ? 'फ़्री क्लाउड ऑडिट और संपर्क' : 'Free Cloud Audit & Contact'}
              </p>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white [text-wrap:balance]">
                {isHi ? 'अपने क्लाउड सेटअप की समीक्षा कराएँ' : 'Request a Sample Cloud Architecture Audit'}
              </h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                {isHi
                  ? 'यह फ़ॉर्म केवल डेमो अनुभव के लिए है। सबमिट करने पर कोई भी डेटा Firestore या किसी सर्वर में सेव नहीं होता।'
                  : 'This form is a local demo preview. Submitting does not transmit or save data to Firestore or any API.'}
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
                  <Phone className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-400">
                      {isHi ? 'फ़ोन (डेमो जानकारी)' : 'Phone (Demo Information)'}
                    </p>
                    <p className="text-sm sm:text-base font-mono font-semibold text-white tabular-nums">
                      +91 90000 00000
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-400">
                      {isHi ? 'ईमेल (डेमो जानकारी)' : 'Email (Demo Information)'}
                    </p>
                    <p className="text-sm sm:text-base font-mono font-semibold text-white break-all">
                      hello@cloud-engineering.example
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-start gap-2 text-xs text-slate-400">
                <Info className="w-4 h-4 text-sky-300 shrink-0 mt-0.5" />
                <span>
                  {isHi
                    ? 'असली वेबसाइट या क्लाउड प्रोजेक्ट के लिए पेज के सबसे नीचे “ऐसी वेबसाइट अपने बिज़नेस के लिए बनवाएँ” बटन दबाएँ।'
                    : 'To request a real website or cloud project, use the CTA button at the bottom of this page.'}
                </span>
              </div>
            </div>
          </div>

          {/* Local Cloud Audit Form */}
          <div className="lg:col-span-7">
            <form
              onSubmit={handleFormSubmit}
              noValidate
              className="rounded-2xl bg-white/[0.035] backdrop-blur-md border border-white/10 p-6 sm:p-8 space-y-5"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="cloud-name" className="block text-xs sm:text-sm font-medium text-slate-200">
                    {isHi ? 'नाम *' : 'Full Name *'}
                  </label>
                  <input
                    id="cloud-name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={isHi ? 'आपका नाम लिखें' : 'Enter your name'}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#060d18]/90 border border-white/15 focus:border-sky-400 focus:outline-none text-sm text-white placeholder:text-slate-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="cloud-company" className="block text-xs sm:text-sm font-medium text-slate-200">
                    {isHi ? 'कंपनी *' : 'Company *'}
                  </label>
                  <input
                    id="cloud-company"
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder={isHi ? 'कंपनी का नाम लिखें' : 'Enter company name'}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#060d18]/90 border border-white/15 focus:border-sky-400 focus:outline-none text-sm text-white placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="cloud-mobile" className="block text-xs sm:text-sm font-medium text-slate-200">
                    {isHi ? 'मोबाइल नंबर *' : 'Mobile Number *'}
                  </label>
                  <input
                    id="cloud-mobile"
                    type="tel"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    placeholder={isHi ? '10 अंकों का नंबर' : '10-digit number'}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#060d18]/90 border border-white/15 focus:border-sky-400 focus:outline-none text-sm text-white placeholder:text-slate-500 tabular-nums"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="cloud-hosting" className="block text-xs sm:text-sm font-medium text-slate-200">
                    {isHi ? 'अभी कहाँ होस्टिंग है *' : 'Current Hosting *'}
                  </label>
                  <select
                    id="cloud-hosting"
                    value={formData.currentHosting}
                    onChange={(e) => setFormData({ ...formData, currentHosting: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#060d18] border border-white/15 focus:border-sky-400 focus:outline-none text-sm text-white"
                  >
                    <option value="">{isHi ? 'होस्टिंग चुनें' : 'Select hosting'}</option>
                    <option value="shared">{isHi ? 'शेयर्ड होस्टिंग (cPanel आदि)' : 'Shared Hosting'}</option>
                    <option value="vps">{isHi ? 'VPS / डेडिकेटेड सर्वर' : 'VPS / Dedicated Server'}</option>
                    <option value="on-premise">{isHi ? 'ऑफ़िस / लोकल सर्वर' : 'On-Premise Server'}</option>
                    <option value="cloud">{isHi ? 'AWS / Google Cloud / Azure' : 'AWS / Google Cloud / Azure'}</option>
                    <option value="none">{isHi ? 'अभी कोई होस्टिंग नहीं' : 'Not hosted yet'}</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="cloud-req" className="block text-xs sm:text-sm font-medium text-slate-200">
                    {isHi ? 'क्या चाहिए *' : 'What Do You Need *'}
                  </label>
                  <select
                    id="cloud-req"
                    value={formData.requirement}
                    onChange={(e) => setFormData({ ...formData, requirement: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#060d18] border border-white/15 focus:border-sky-400 focus:outline-none text-sm text-white"
                  >
                    <option value="">{isHi ? 'सेवा चुनें' : 'Select requirement'}</option>
                    <option value="new-setup">{isHi ? 'नया क्लाउड सेटअप' : 'New Cloud Setup'}</option>
                    <option value="migration">{isHi ? 'क्लाउड माइग्रेशन' : 'Cloud Migration'}</option>
                    <option value="cicd">{isHi ? 'DevOps और CI/CD ऑटोमेशन' : 'DevOps & CI/CD'}</option>
                    <option value="security">{isHi ? 'सुरक्षा, बैकअप और SSL' : 'Security, Backup & SSL'}</option>
                    <option value="k8s">{isHi ? 'Docker / Kubernetes स्केलिंग' : 'Docker / Kubernetes Scaling'}</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="cloud-message" className="block text-xs sm:text-sm font-medium text-slate-200">
                  {isHi ? 'संदेश *' : 'Message *'}
                </label>
                <textarea
                  id="cloud-message"
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder={
                    isHi
                      ? 'बताएँ आपका ऐप/वेबसाइट अभी किस तकनीक पर है और क्या समस्या आ रही है…'
                      : 'Tell us about your current stack, traffic, or cloud goals…'
                  }
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#060d18]/90 border border-white/15 focus:border-sky-400 focus:outline-none text-sm text-white placeholder:text-slate-500 resize-y"
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
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-400 hover:to-teal-400 text-[#041016] text-sm sm:text-base font-bold transition-all duration-200 hover:shadow-[0_0_26px_rgba(56,189,248,0.45)] cursor-pointer"
              >
                {isHi ? 'फ़्री क्लाउड ऑडिट भेजें (डेमो)' : 'Submit Cloud Audit (Demo)'}
              </button>
            </form>
          </div>
        </div>
      </RevealSection>

      {/* 12. FOOTER + BOTTOM MAIN-SITE QUOTE CTA */}
      <footer className="bg-[#040a14] text-slate-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 border-b border-white/10">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-teal-500 flex items-center justify-center">
                <CloudCog className="w-4 h-4 text-[#041016]" />
              </span>
              <span className="text-sm font-extrabold text-white tracking-tight">
                CLOUD ENGINEERING
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              {isHi
                ? 'क्लाउड आर्किटेक्चर, DevOps CI/CD ऑटोमेशन और सुरक्षित इंफ्रास्ट्रक्चर कंसल्टिंग का नमूना डिज़ाइन।'
                : 'Sample cloud architecture, DevOps CI/CD automation, and infrastructure consulting showcase.'}
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
                    className="hover:text-sky-300 transition-colors cursor-pointer"
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
                    className="hover:text-sky-300 transition-colors cursor-pointer"
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
              {['GitHub', 'LinkedIn', 'YouTube', 'X'].map((network) => (
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
            <p className="text-xs text-slate-500 pt-2">© Cloud Engineering (Demo)</p>
          </div>
        </div>

        {/* Bottom Conversion Strip -> Main Site Quote Form */}
        <div className="bg-gradient-to-r from-[#081628] via-[#0c2336] to-[#081628] border-t border-teal-400/25 px-4 sm:px-6 py-8">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-teal-300">POWER WEB STUDIO AI</p>
              <h3 className="text-lg sm:text-xl font-extrabold text-white">
                {isHi
                  ? 'अपने बिज़नेस के लिए ऐसी आधुनिक क्लाउड या टेक वेबसाइट बनवाएँ'
                  : 'Want a Modern Cloud or Tech Website Built for Your Business?'}
              </h3>
            </div>
            <button
              type="button"
              onClick={onRequestQuote}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-400 hover:to-teal-400 text-[#041016] text-sm font-extrabold transition-all duration-200 hover:shadow-[0_0_26px_rgba(56,189,248,0.45)] cursor-pointer whitespace-nowrap shrink-0"
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
          className="fixed bottom-6 right-5 z-50 max-w-xs px-4 py-3 rounded-xl bg-[#0a1626]/95 backdrop-blur-md border border-teal-400/40 text-xs sm:text-sm font-medium text-white shadow-xl"
        >
          {demoToast}
        </div>
      )}

      {/* SERVICE SCOPE MODAL */}
      {activeServiceModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cloud-service-modal-title"
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setActiveServiceModal(null)}
        >
          <div
            className="w-full max-w-xl rounded-2xl bg-[#0a1626] border border-white/15 overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-48 sm:h-56 bg-[#060d18] shrink-0">
              <img
                src={activeServiceModal.image}
                alt={isHi ? activeServiceModal.titleHi : activeServiceModal.titleEn}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a1626] via-transparent to-black/30" />
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
                <p className="text-xs font-semibold text-teal-300">
                  {isHi ? 'सेवा का कार्य-दायरा (डेमो)' : 'Service Scope (Demo)'}
                </p>
                <h3 id="cloud-service-modal-title" className="text-xl sm:text-2xl font-bold text-white mt-1">
                  {isHi ? activeServiceModal.titleHi : activeServiceModal.titleEn}
                </h3>
                <p className="text-sm text-slate-300 mt-1.5">
                  {isHi ? activeServiceModal.shortDescHi : activeServiceModal.shortDescEn}
                </p>
              </div>

              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {isHi ? 'मुख्य कार्य-दायरा' : 'Key Scope'}
                </h4>
                <ul className="space-y-2">
                  {(isHi ? activeServiceModal.scopeHi : activeServiceModal.scopeEn).map((line, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-slate-200">
                      <Check className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
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
                  className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-400 hover:to-teal-400 text-sm font-bold text-[#041016] cursor-pointer"
                >
                  {isHi ? 'फ़्री क्लाउड ऑडिट' : 'Free Cloud Audit'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* USE CASE DETAIL MODAL */}
      {activeUseCaseModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cloud-usecase-modal-title"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setActiveUseCaseModal(null)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl bg-[#0a1626] border border-white/15 overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-56 sm:h-64 bg-[#060d18] shrink-0">
              <img
                src={activeUseCaseModal.image}
                alt={isHi ? activeUseCaseModal.titleHi : activeUseCaseModal.titleEn}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3.5 left-3.5 px-3 py-1 rounded-md bg-[#060d18]/85 border border-teal-400/35 text-xs font-semibold text-teal-200">
                {isHi ? 'नमूना उपयोग' : 'Sample Use Case'}
              </div>
              <button
                type="button"
                onClick={() => setActiveUseCaseModal(null)}
                aria-label={isHi ? 'बंद करें' : 'Close'}
                className="absolute top-3.5 right-3.5 w-9 h-9 rounded-full bg-black/65 hover:bg-black/85 text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              <div>
                <p className="text-xs font-semibold text-sky-300">
                  {isHi ? activeUseCaseModal.sectorHi : activeUseCaseModal.sectorEn}
                </p>
                <h3 id="cloud-usecase-modal-title" className="text-xl sm:text-2xl font-bold text-white mt-1">
                  {isHi ? activeUseCaseModal.titleHi : activeUseCaseModal.titleEn}
                </h3>
                <p className="text-sm text-slate-300 mt-1.5 leading-relaxed">
                  {isHi ? activeUseCaseModal.summaryHi : activeUseCaseModal.summaryEn}
                </p>
              </div>

              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-teal-400" />
                  {isHi ? 'नमूना आर्किटेक्चर मुख्य बिंदु' : 'Sample Architecture Highlights'}
                </h4>
                <ul className="space-y-2">
                  {(isHi ? activeUseCaseModal.highlightsHi : activeUseCaseModal.highlightsEn).map(
                    (line, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-200">
                        <Check className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                        <span>{line}</span>
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
