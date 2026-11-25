import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Cloud,
  CreditCard,
  Globe,
  Info,
  Mail,
  Menu,
  MessageCircle,
  Network,
  Phone,
  Search,
  Share2,
  Smartphone,
  X,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { DemoPriceBar } from '../components/DemoPriceBar';
import { DemoLanguageToggle } from '../components/common/DemoLanguageToggle';

interface WebEcosystemDemoProps {
  onBackToHome: () => void;
  onRequestQuote: () => void;
}

interface AgencyService {
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

interface PortfolioItem {
  id: string;
  category: 'website' | 'app';
  image: string;
  titleHi: string;
  titleEn: string;
  typeHi: string;
  typeEn: string;
  summaryHi: string;
  summaryEn: string;
  highlightsHi: string[];
  highlightsEn: string[];
}

interface EcosystemNode {
  id: string;
  labelHi: string;
  labelEn: string;
  detailHi: string;
  detailEn: string;
  icon: 'globe' | 'smartphone' | 'cloud' | 'search' | 'share' | 'card';
  angleDeg: number;
}

interface SamplePackage {
  id: string;
  nameHi: string;
  nameEn: string;
  price: string;
  budgetValue: string;
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

const SERVICES: AgencyService[] = [
  {
    id: 'website',
    number: '01',
    image: '/demo/web-ecosystem/website.jpg',
    titleHi: 'वेबसाइट डेवलपमेंट',
    titleEn: 'Website Development',
    shortDescHi: 'तेज़, सुरक्षित और मोबाइल-फ़्रेंडली कॉर्पोरेट व बिज़नेस वेबसाइट्स जो हर स्क्रीन पर साफ़ खुलें।',
    shortDescEn: 'Fast, secure, and mobile-responsive corporate and business websites built for every screen.',
    scopeHi: [
      'कस्टम होम, सेवाएँ, पोर्टफ़ोलियो और संपर्क पेज संरचना',
      'मोबाइल, टैबलेट और डेस्कटॉप के लिए पूर्ण रेस्पॉन्सिव लेआउट',
      'तेज़ पेज लोडिंग, इमेज ऑप्टिमाइज़ेशन और साफ़ नेविगेशन',
      'संपर्क फ़ॉर्म, लोकेशन मैप और सोशल लिंक इंटीग्रेशन',
    ],
    scopeEn: [
      'Custom home, services, portfolio, and contact page architecture',
      'Fully responsive layouts tuned for mobile, tablet, and desktop',
      'Fast page load speed, image optimization, and clean navigation',
      'Contact forms, map embeds, and social channel integration',
    ],
    idealForHi: 'स्थानीय व्यवसाय, कंपनियाँ, स्टार्टअप्स और सर्विस प्रोवाइडर्स',
    idealForEn: 'Local businesses, companies, startups, and service providers',
  },
  {
    id: 'app',
    number: '02',
    image: '/demo/web-ecosystem/app.jpg',
    titleHi: 'मोबाइल ऐप',
    titleEn: 'Mobile App Development',
    shortDescHi: 'Android और iOS के लिए सहज मोबाइल एप्लिकेशन, आसान यूज़र फ़्लो और लाइव नोटिफ़िकेशन के साथ।',
    shortDescEn: 'Smooth Android and iOS mobile apps designed with intuitive user flows and push notifications.',
    scopeHi: [
      'Android और iOS के लिए क्रॉस-प्लेटफ़ॉर्म ऐप डेवलपमेंट',
      'लॉगिन, प्रोफ़ाइल, बुकिंग या ऑर्डर ट्रैकिंग स्क्रीन',
      'पुश नोटिफ़िकेशन और ऑफ़लाइन-रेडी स्क्रीन हैंडलिंग',
      'वेब डैशबोर्ड के साथ डेटा सिंक की व्यवस्था',
    ],
    scopeEn: [
      'Cross-platform mobile app builds for Android and iOS',
      'Login, profile, booking, and order tracking modules',
      'Push notifications and resilient offline screen states',
      'Synchronized backend APIs paired with a web admin panel',
    ],
    idealForHi: 'डिलीवरी ब्रांड्स, फ़िटनेस स्टूडियो, एडटेक और सर्विस नेटवर्क्स',
    idealForEn: 'Delivery brands, fitness studios, edtech, and service networks',
  },
  {
    id: 'hosting',
    number: '03',
    image: '/demo/web-ecosystem/hosting.jpg',
    titleHi: 'क्लाउड होस्टिंग और डोमेन',
    titleEn: 'Cloud Hosting & Domain',
    shortDescHi: 'डोमेन पंजीकरण, SSL सुरक्षा, क्लाउड सर्वर सेटअप और नियमित बैकअप का पूरा प्रबंधन।',
    shortDescEn: 'End-to-end domain setup, SSL certificates, cloud server configuration, and scheduled backups.',
    scopeHi: [
      'डोमेन नेम चयन, DNS सेटअप और बिज़नेस ईमेल कनेक्शन',
      'HTTPS / SSL प्रमाणपत्र और बुनियादी सुरक्षा फ़ायरवॉल',
      'क्लाउड सर्वर डिप्लॉयमेंट और तेज़ CDN डिलीवरी',
      'नियमित डेटा बैकअप और तकनीकी रखरखाव सहायता',
    ],
    scopeEn: [
      'Domain registration, DNS routing, and business email setup',
      'HTTPS / SSL encryption and baseline security hardening',
      'Cloud deployment with global edge caching for low latency',
      'Scheduled automated backups and ongoing server upkeep',
    ],
    idealForHi: 'सभी वेबसाइट्स और वेब एप्लिकेशन्स जो भरोसेमंद ऑनलाइन उपस्थिति चाहते हैं',
    idealForEn: 'Any website or web platform requiring dependable cloud hosting',
  },
  {
    id: 'seo',
    number: '04',
    image: '/demo/web-ecosystem/seo.jpg',
    titleHi: 'SEO और डिजिटल मार्केटिंग',
    titleEn: 'SEO & Digital Marketing',
    shortDescHi: 'सर्च इंजन में बेहतर दृश्यता के लिए ऑन-पेज SEO, कीवर्ड संरचना और लोकल सर्च सेटअप।',
    shortDescEn: 'On-page SEO, clean metadata structure, and local search readiness to help customers find you.',
    scopeHi: [
      'टाइटल टैग, मेटा विवरण, साइटमैप और रोबोट्स सेटअप',
      'स्थानीय सर्च प्रोफ़ाइल और कीवर्ड-अनुकूल कंटेंट संरचना',
      'पेज स्पीड और मोबाइल यूज़ेबिलिटी ऑडिट',
      'मासिक ट्रैफ़िक और सर्च प्रदर्शन रिपोर्टिंग ढाँचा',
    ],
    scopeEn: [
      'Title tags, meta descriptions, XML sitemaps, and crawl setup',
      'Local search profile alignment and structured content hierarchy',
      'Core Web Vitals speed and mobile usability tuning',
      'Clear traffic and search visibility reporting setup',
    ],
    idealForHi: 'नए ग्राहकों तक ऑनलाइन पहुँच बढ़ाने वाले सभी व्यवसाय',
    idealForEn: 'Businesses aiming to expand organic discovery and inquiries',
  },
  {
    id: 'ecommerce',
    number: '05',
    image: '/demo/web-ecosystem/ecommerce.jpg',
    titleHi: 'ई-कॉमर्स स्टोर',
    titleEn: 'E-Commerce Store',
    shortDescHi: 'प्रोडक्ट कैटलॉग, कार्ट, ऑनलाइन पेमेंट गेटवे और आसान ऑर्डर मैनेजमेंट वाला ऑनलाइन स्टोर।',
    shortDescEn: 'Complete online storefront with product catalog, shopping cart, payment gateway, and order panel.',
    scopeHi: [
      'श्रेणी फ़िल्टर, सर्च और वेरिएंट चयन के साथ प्रोडक्ट पेज',
      'शॉपिंग कार्ट, कूपन और स्टेप-बाय-स्टेप चेकआउट फ़्लो',
      'UPI, कार्ड और COD जैसे पेमेंट विकल्पों का एकीकरण',
      'इन्वेंटरी और ऑर्डर स्टेटस अपडेट के लिए एडमिन पैनल',
    ],
    scopeEn: [
      'Product catalog with category filters, search, and variant selectors',
      'Shopping cart, discount codes, and multi-step checkout flow',
      'Integration readiness for UPI, cards, net banking, and COD',
      'Merchant admin dashboard for inventory and order tracking',
    ],
    idealForHi: 'रिटेल दुकानें, D2C ब्रांड्स, बुटीक और थोक विक्रेता',
    idealForEn: 'Retail shops, D2C brands, boutiques, and wholesale sellers',
  },
  {
    id: 'uiux',
    number: '06',
    image: '/demo/web-ecosystem/uiux.jpg',
    titleHi: 'UI/UX डिज़ाइन',
    titleEn: 'UI/UX Design',
    shortDescHi: 'वायरफ़्रेम, ब्रांड रंग प्रणाली और स्पष्ट यूज़र जर्नी के साथ आधुनिक व सहज इंटरफ़ेस डिज़ाइन।',
    shortDescEn: 'Wireframes, cohesive brand design systems, and clear user journeys built for effortless usability.',
    scopeHi: [
      'यूज़र फ़्लो मैपिंग और लो-फ़िडेलिटी वायरफ़्रेमिंग',
      'मोबाइल और डेस्कटॉप के लिए इंटरैक्टिव स्क्रीन प्रोटोटाइप',
      'रंग पैलेट, टाइपोग्राफ़ी और रीयूज़ेबल कॉम्पोनेंट किट',
      'डेवलपर्स के लिए स्पष्ट डिज़ाइन हैंडऑफ़ गाइड',
    ],
    scopeEn: [
      'User journey mapping and structured wireframe blueprints',
      'Interactive high-fidelity prototypes for mobile and desktop',
      'Cohesive color tokens, typography scale, and component kits',
      'Developer-ready layout specifications and spacing guides',
    ],
    idealForHi: 'नए डिजिटल प्रोडक्ट्स और पुरानी वेबसाइट्स का आधुनिक रीडिज़ाइन',
    idealForEn: 'New digital products and modern redesigns of existing platforms',
  },
];

const ECOSYSTEM_NODES: EcosystemNode[] = [
  {
    id: 'website',
    labelHi: 'वेबसाइट',
    labelEn: 'Website',
    detailHi: 'आपका मुख्य डिजिटल शोरूम जो 24×7 सेवाओं और उत्पादों की जानकारी देता है।',
    detailEn: 'Your central digital storefront presenting services and products around the clock.',
    icon: 'globe',
    angleDeg: -90,
  },
  {
    id: 'app',
    labelHi: 'ऐप',
    labelEn: 'Mobile App',
    detailHi: 'ग्राहकों के फ़ोन में सीधी पहुँच, तेज़ बुकिंग और दोबारा ऑर्डर की सुविधा।',
    detailEn: 'Direct pocket access for customers with instant booking and repeat orders.',
    icon: 'smartphone',
    angleDeg: -30,
  },
  {
    id: 'hosting',
    labelHi: 'होस्टिंग',
    labelEn: 'Hosting',
    detailHi: 'सुरक्षित क्लाउड सर्वर, SSL और तेज़ लोडिंग जो हर विज़िटर को बेहतर अनुभव दे।',
    detailEn: 'Secure cloud infrastructure, SSL encryption, and reliable page delivery.',
    icon: 'cloud',
    angleDeg: 30,
  },
  {
    id: 'seo',
    labelHi: 'SEO',
    labelEn: 'SEO',
    detailHi: 'सर्च परिणामों में सही कीवर्ड और संरचना ताकि नए ग्राहक आपको आसानी से खोजें।',
    detailEn: 'Structured search visibility so prospective customers discover you organically.',
    icon: 'search',
    angleDeg: 90,
  },
  {
    id: 'social',
    labelHi: 'सोशल मीडिया',
    labelEn: 'Social Media',
    detailHi: 'ब्रांड अपडेट्स और कैंपेन जो सीधे आपकी वेबसाइट और फ़ॉर्म तक ट्रैफ़िक लाएँ।',
    detailEn: 'Consistent brand touchpoints driving engaged visitors to your web hub.',
    icon: 'share',
    angleDeg: 150,
  },
  {
    id: 'payment',
    labelHi: 'पेमेंट',
    labelEn: 'Payments',
    detailHi: 'UPI, कार्ड और ऑटोमैटिक इनवॉइस के साथ सुरक्षित ऑनलाइन लेन-देन प्रणाली।',
    detailEn: 'Seamless digital checkout via UPI, cards, and automated receipt flows.',
    icon: 'card',
    angleDeg: -150,
  },
];

const PORTFOLIO_ITEMS: PortfolioItem[] = [
  {
    id: 'work-restaurant',
    category: 'website',
    image: '/demo/web-ecosystem/work-restaurant.jpg',
    titleHi: 'रेस्टोरेंट वेबसाइट',
    titleEn: 'Restaurant Website',
    typeHi: 'वेबसाइट',
    typeEn: 'Website',
    summaryHi: 'डिजिटल मेन्यू, टेबल रिज़र्वेशन फ़्लो और शेफ़ स्पेशल गैलरी के साथ रेस्टोरेंट वेबसाइट का नमूना डिज़ाइन।',
    summaryEn: 'Sample fine-dining website layout featuring an interactive menu, table booking flow, and dish showcase.',
    highlightsHi: ['ऑनलाइन टेबल बुकिंग सेक्शन', 'मोबाइल-फ़्रेंडली डिजिटल मेन्यू', 'लोकेशन और टाइमिंग कार्ड'],
    highlightsEn: ['Online table reservation section', 'Mobile-friendly digital menu', 'Location & opening hours panel'],
  },
  {
    id: 'work-school',
    category: 'website',
    image: '/demo/web-ecosystem/work-school.jpg',
    titleHi: 'स्कूल पोर्टल',
    titleEn: 'School Portal',
    typeHi: 'वेबसाइट',
    typeEn: 'Website',
    summaryHi: 'एडमिशन पूछताछ, नोटिस बोर्ड, टाइमटेबल और कैंपस गैलरी के साथ शैक्षणिक पोर्टल का नमूना।',
    summaryEn: 'Sample academic institution portal covering admissions inquiries, notice boards, schedules, and campus media.',
    highlightsHi: ['एडमिशन इंक्वायरी फ़ॉर्म', 'नोटिस और कैलेंडर सेक्शन', 'अभिभावक व छात्र जानकारी पेज'],
    highlightsEn: ['Admissions inquiry workflow', 'Notice board & academic calendar', 'Parent and student resource pages'],
  },
  {
    id: 'work-fitness',
    category: 'app',
    image: '/demo/web-ecosystem/work-fitness.jpg',
    titleHi: 'फ़िटनेस ऐप',
    titleEn: 'Fitness App',
    typeHi: 'मोबाइल ऐप',
    typeEn: 'Mobile App',
    summaryHi: 'डेली वर्कआउट प्लान, प्रोग्रेस ट्रैकर और क्लास शेड्यूल के साथ डार्क-मोड फ़िटनेस मोबाइल ऐप का नमूना।',
    summaryEn: 'Sample dark-mode workout app concept featuring daily training plans, progress rings, and class scheduling.',
    highlightsHi: ['वर्कआउट और डाइट रूटीन कार्ड', 'डेली एक्टिविटी ट्रैकिंग व्यू', 'ट्रेनर सेशन बुकिंग स्क्रीन'],
    highlightsEn: ['Workout & routine cards', 'Daily activity tracking view', 'Trainer session booking screen'],
  },
  {
    id: 'work-realestate',
    category: 'website',
    image: '/demo/web-ecosystem/work-realestate.jpg',
    titleHi: 'रियल एस्टेट वेबसाइट',
    titleEn: 'Real Estate Website',
    typeHi: 'वेबसाइट',
    typeEn: 'Website',
    summaryHi: 'प्रॉपर्टी फ़िल्टर, फ़्लोर प्लान व्यू और साइट विज़िट बुकिंग के साथ रियल एस्टेट वेबसाइट का नमूना।',
    summaryEn: 'Sample property showcase platform with search filters, architectural galleries, and site-visit booking.',
    highlightsHi: ['शहर और बजट आधारित फ़िल्टर', 'हाई-क्वालिटी प्रॉपर्टी गैलरी', 'साइट विज़िट रिक्वेस्ट फ़ॉर्म'],
    highlightsEn: ['Location & budget property filters', 'High-resolution property galleries', 'Site-visit booking form'],
  },
];

const PACKAGES: SamplePackage[] = [
  {
    id: 'starter',
    nameHi: 'स्टार्टर',
    nameEn: 'Starter',
    price: '₹9,999',
    budgetValue: 'starter-9999',
    subtitleHi: 'नए व्यवसाय और प्रोफ़ेशनल पहचान के लिए',
    subtitleEn: 'For emerging businesses launching online',
    featuresHi: [
      '5 पेज वेबसाइट (होम, परिचय, सेवाएँ, गैलरी, संपर्क)',
      'मोबाइल फ़्रेंडली रेस्पॉन्सिव डिज़ाइन',
      'संपर्क फ़ॉर्म और लोकेशन मैप',
      'बुनियादी SSL सुरक्षा सेटअप',
    ],
    featuresEn: [
      '5-page website (Home, About, Services, Gallery, Contact)',
      'Mobile-friendly responsive layout',
      'Contact inquiry form & map embed',
      'Standard SSL security setup',
    ],
  },
  {
    id: 'business',
    nameHi: 'बिज़नेस',
    nameEn: 'Business',
    price: '₹24,999',
    budgetValue: 'business-24999',
    highlighted: true,
    subtitleHi: 'तेज़ी से बढ़ते ब्रांड्स के लिए संतुलित पैकेज',
    subtitleEn: 'Balanced suite for growing brands',
    featuresHi: [
      '10 पेज कस्टम बिज़नेस वेबसाइट',
      'ऑन-पेज SEO सेटअप और साइटमैप',
      'WhatsApp चैट बटन इंटीग्रेशन',
      '1 साल क्लाउड होस्टिंग शामिल',
    ],
    featuresEn: [
      '10-page custom business website',
      'On-page SEO setup & sitemap',
      'Direct WhatsApp chat integration',
      '1 year managed cloud hosting included',
    ],
  },
  {
    id: 'ecommerce',
    nameHi: 'ई-कॉमर्स',
    nameEn: 'E-Commerce',
    price: '₹49,999',
    budgetValue: 'ecommerce-49999',
    subtitleHi: 'ऑनलाइन बिक्री शुरू करने वाले स्टोर के लिए',
    subtitleEn: 'Complete digital store for online selling',
    featuresHi: [
      'प्रोडक्ट कैटलॉग और कार्ट वाला ऑनलाइन स्टोर',
      'पेमेंट गेटवे (UPI / कार्ड / COD) एकीकरण',
      'प्रोडक्ट व ऑर्डर के लिए एडमिन पैनल',
      'मोबाइल-फ़र्स्ट चेकआउट और ऑर्डर नोटिफ़िकेशन',
    ],
    featuresEn: [
      'Full online store with product catalog & cart',
      'Payment gateway (UPI / Card / COD) integration',
      'Admin panel for inventory & order management',
      'Mobile-first checkout & order alerts',
    ],
  },
];

const PROCESS_STEPS: ProcessStep[] = [
  {
    step: '01',
    titleHi: 'बातचीत',
    titleEn: 'Discovery',
    descHi: 'आपके व्यवसाय, लक्ष्य और ग्राहकों की ज़रूरतों को गहराई से समझना।',
    descEn: 'Understanding your business goals, target audience, and core needs.',
  },
  {
    step: '02',
    titleHi: 'प्लानिंग',
    titleEn: 'Planning',
    descHi: 'पेज संरचना, फ़ीचर सूची और समय-सीमा का स्पष्ट रोडमैप तैयार करना।',
    descEn: 'Mapping sitemap, feature scope, technology stack, and clear milestones.',
  },
  {
    step: '03',
    titleHi: 'डिज़ाइन',
    titleEn: 'Design',
    descHi: 'ब्रांड के अनुरूप आधुनिक UI/UX स्क्रीन और मोबाइल लेआउट तैयार करना।',
    descEn: 'Crafting brand-aligned UI/UX screens and responsive mobile layouts.',
  },
  {
    step: '04',
    titleHi: 'डेवलपमेंट',
    titleEn: 'Development',
    descHi: 'साफ़ कोड, तेज़ परफ़ॉर्मेंस, फ़ॉर्म और सुरक्षा के साथ निर्माण व परीक्षण।',
    descEn: 'Building with clean code, fast performance, integrations, and QA checks.',
  },
  {
    step: '05',
    titleHi: 'लॉन्च और सपोर्ट',
    titleEn: 'Launch & Support',
    descHi: 'डोमेन-होस्टिंग पर लाइव डिप्लॉयमेंट और आगे के अपडेट्स में सहयोग।',
    descEn: 'Going live on domain & cloud hosting with ongoing guidance and upkeep.',
  },
];

const TYPING_WORDS_HI = ['वेबसाइट…', 'ऐप…', 'ऑनलाइन स्टोर…', 'ब्रांडिंग…'];
const TYPING_WORDS_EN = ['Website…', 'Mobile App…', 'Online Store…', 'Branding…'];

const TECH_CHIPS = ['React', 'Node.js', 'Firebase', 'Flutter', 'WordPress', 'Tailwind'];

const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'timeline',
    qHi: 'वेबसाइट कितने दिन में बनती है?',
    qEn: 'How many days does it take to build a website?',
    aHi: 'डेमो उदाहरण के तौर पर, एक सामान्य बिज़नेस वेबसाइट लगभग 7 से 15 कार्यदिवसों में और ई-कॉमर्स या कस्टम ऐप प्रोजेक्ट ज़रूरत के दायरे के अनुसार 3 से 6 सप्ताह में तैयार हो सकता है। वास्तविक समय-सीमा चर्चा के बाद तय होती है।',
    aEn: 'As a general demo reference, a standard business website typically takes 7 to 15 working days, while e-commerce stores or custom apps take 3 to 6 weeks depending on scope. Final timelines are confirmed during consultation.',
  },
  {
    id: 'domain-hosting',
    qHi: 'डोमेन और होस्टिंग कौन देगा?',
    qEn: 'Who provides the domain and hosting?',
    aHi: 'यह पूरी तरह क्लाइंट की पसंद पर निर्भर करता है। आप अपना मौजूदा डोमेन/होस्टिंग उपयोग कर सकते हैं या प्रोजेक्ट सेटअप के साथ नया डोमेन और क्लाउड होस्टिंग आपके ही नाम पर पंजीकृत कराया जा सकता है। (यह जानकारी डेमो के लिए है।)',
    aEn: 'It depends on your preference — you can connect your existing domain and hosting, or have a new domain and cloud hosting registered directly under your ownership during setup. (Demo reference information.)',
  },
  {
    id: 'changes-later',
    qHi: 'क्या बाद में बदलाव होंगे?',
    qEn: 'Can changes or updates be made later?',
    aHi: 'हाँ, वेबसाइट लाइव होने के बाद भी टेक्स्ट, फ़ोटो, नए पेज या नए फ़ीचर जोड़े जा सकते हैं। ज़रूरत के अनुसार आसान एडमिन कंट्रोल या सपोर्ट प्लान चुना जा सकता है। (यह एक नमूना उत्तर है।)',
    aEn: 'Yes, text, photos, new pages, or additional features can be updated even after launch via an admin panel or scheduled maintenance support. (Sample demo response.)',
  },
  {
    id: 'payments',
    qHi: 'पेमेंट कैसे करें?',
    qEn: 'How do payments work?',
    aHi: 'यह एक डेमो वेबसाइट है, इसलिए यहाँ कोई वास्तविक पेमेंट नहीं लिया जाता। सामान्य एजेंसी प्रक्रिया में प्रोजेक्ट की राशि काम के चरणों (जैसे शुरुआत, डिज़ाइन स्वीकृति और लॉन्च) में विभाजित की जाती है।',
    aEn: 'Because this is a demo website, no real payments are processed here. In a standard agency engagement, payments are typically split across project milestones such as kickoff, design sign-off, and final launch.',
  },
];

/**
 * Reusable scroll-reveal wrapper using compositor-only transform & opacity.
 * Respects prefers-reduced-motion and guarantees content visibility.
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
        if (entries.some((e) => e.isIntersecting)) {
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

export const WebEcosystemDemo: React.FC<WebEcosystemDemoProps> = ({
  onBackToHome,
  onRequestQuote,
}) => {
  const { language, setLanguage } = useLanguage();
  const isHi = language === 'hi';

  // Navigation & UI state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeServiceModal, setActiveServiceModal] = useState<AgencyService | null>(null);
  const [activeNodeId, setActiveNodeId] = useState<string>('website');
  const [portfolioFilter, setPortfolioFilter] = useState<'all' | 'website' | 'app'>('all');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [openFaqId, setOpenFaqId] = useState<string>('timeline');
  const [demoToast, setDemoToast] = useState<string | null>(null);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  // Typing animation state for Hero
  const [typedWord, setTypedWord] = useState('');
  const [wordIdx, setWordIdx] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  // Local-only consultation form state (ZERO Firestore / ZERO API calls)
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    businessType: '',
    budget: '',
    message: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);

  const typingWords = isHi ? TYPING_WORDS_HI : TYPING_WORDS_EN;

  // Reset typing animation cleanly on language switch
  useEffect(() => {
    setWordIdx(0);
    setTypedWord('');
    setIsDeleting(false);
  }, [isHi]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const currentFull = typingWords[wordIdx % typingWords.length];
    if (reduced) {
      setTypedWord(currentFull);
      return;
    }

    if (!isDeleting && typedWord === currentFull) {
      const pauseTimer = window.setTimeout(() => setIsDeleting(true), 1100);
      return () => window.clearTimeout(pauseTimer);
    }

    const speed = isDeleting ? 55 : 95;
    const timer = window.setTimeout(() => {
      if (!isDeleting) {
        setTypedWord(currentFull.slice(0, typedWord.length + 1));
      } else {
        const next = currentFull.slice(0, Math.max(0, typedWord.length - 1));
        setTypedWord(next);
        if (next.length === 0) {
          setIsDeleting(false);
          setWordIdx((prev) => (prev + 1) % typingWords.length);
        }
      }
    }, speed);

    return () => window.clearTimeout(timer);
  }, [typedWord, isDeleting, wordIdx, typingWords]);

  // Toast auto-dismiss
  useEffect(() => {
    if (!demoToast) return;
    const timer = window.setTimeout(() => setDemoToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [demoToast]);

  // Escape key closes modals
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveServiceModal(null);
        setLightboxIndex(null);
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

  const filteredPortfolio =
    portfolioFilter === 'all'
      ? PORTFOLIO_ITEMS
      : PORTFOLIO_ITEMS.filter((item) => item.category === portfolioFilter);

  const activeNode =
    ECOSYSTEM_NODES.find((n) => n.id === activeNodeId) || ECOSYSTEM_NODES[0];

  const handleSelectPackage = (pkg: SamplePackage) => {
    setFormData((prev) => ({
      ...prev,
      budget: pkg.budgetValue,
      message: isHi
        ? `${pkg.nameHi} पैकेज (${pkg.price}) के बारे में जानकारी चाहिए।`
        : `Interested in learning more about the ${pkg.nameEn} package (${pkg.price}).`,
    }));
    setFormSuccess(false);
    setFormError(null);
    scrollToSection('eco-contact');
  };

  const handleServiceConsult = (service: AgencyService) => {
    setActiveServiceModal(null);
    setFormData((prev) => ({
      ...prev,
      message: isHi
        ? `${service.titleHi} सेवा के लिए फ़्री कंसल्टेशन चाहिए।`
        : `I would like a free consultation for ${service.titleEn}.`,
    }));
    setFormSuccess(false);
    setFormError(null);
    scrollToSection('eco-contact');
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(false);

    const trimmedName = formData.name.trim();
    const digitsOnly = formData.mobile.replace(/\D/g, '');
    const trimmedMessage = formData.message.trim();

    if (trimmedName.length < 2) {
      setFormError(isHi ? 'कृपया अपना सही नाम दर्ज करें।' : 'Please enter your full name.');
      return;
    }
    if (digitsOnly.length < 10) {
      setFormError(
        isHi ? 'कृपया 10 अंकों का सही मोबाइल नंबर दर्ज करें।' : 'Please enter a valid 10-digit mobile number.'
      );
      return;
    }
    if (!formData.businessType) {
      setFormError(isHi ? 'कृपया अपने बिज़नेस का प्रकार चुनें।' : 'Please select your business type.');
      return;
    }
    if (!formData.budget) {
      setFormError(isHi ? 'कृपया अनुमानित बजट चुनें।' : 'Please select an estimated budget.');
      return;
    }
    if (trimmedMessage.length < 5) {
      setFormError(
        isHi ? 'कृपया अपनी आवश्यकता के बारे में संक्षिप्त संदेश लिखें।' : 'Please write a short message about your requirement.'
      );
      return;
    }

    // Strictly local state — NO Firestore write and NO API call
    setFormSuccess(true);
  };

  const renderNodeIcon = (icon: EcosystemNode['icon'], className = 'w-5 h-5') => {
    switch (icon) {
      case 'globe':
        return <Globe className={className} />;
      case 'smartphone':
        return <Smartphone className={className} />;
      case 'cloud':
        return <Cloud className={className} />;
      case 'search':
        return <Search className={className} />;
      case 'share':
        return <Share2 className={className} />;
      case 'card':
        return <CreditCard className={className} />;
    }
  };

  const navLinks = [
    { id: 'eco-home', hi: 'होम', en: 'Home' },
    { id: 'eco-services', hi: 'सेवाएँ', en: 'Services' },
    { id: 'eco-portfolio', hi: 'पोर्टफ़ोलियो', en: 'Portfolio' },
    { id: 'eco-packages', hi: 'पैकेज', en: 'Packages' },
    { id: 'eco-process', hi: 'प्रक्रिया', en: 'Process' },
    { id: 'eco-contact', hi: 'संपर्क', en: 'Contact' },
  ];

  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 antialiased selection:bg-indigo-500 selection:text-white">
      {/* Unified Sticky Top Wrapper (DEMO Bar + Agency Header — compact & mobile-safe) */}
      <div className="sticky top-0 z-40">
        {/* Top DEMO Disclaimer Bar */}
        <div className="bg-[#0b1124] border-b border-indigo-500/25 px-3 sm:px-6 py-2">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="inline-block px-2 py-0.5 rounded bg-indigo-500/20 border border-indigo-400/30 text-[10px] font-bold tracking-wider text-indigo-200 uppercase shrink-0">
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
        <DemoPriceBar slug="web-ecosystem" />

        {/* Agency Navigation Bar */}
        <header className="bg-[#060913]/85 backdrop-blur-xl border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
            {/* Brand Wordmark */}
            <button
              type="button"
              onClick={() => scrollToSection('eco-home')}
              className="flex items-center gap-2.5 text-left cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded-md"
            >
              <span className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-[0_0_18px_rgba(99,102,241,0.4)]">
                <Network className="w-5 h-5 text-white" />
              </span>
              <span className="text-base sm:text-lg font-extrabold tracking-tight text-white">
                WEB ECOSYSTEM
              </span>
            </button>

            {/* Desktop Nav Links */}
            <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-300">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => scrollToSection(link.id)}
                  className="hover:text-white transition-colors cursor-pointer whitespace-nowrap shrink-0 py-1 relative after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-[2px] after:w-0 after:bg-gradient-to-r after:from-blue-400 after:to-violet-400 hover:after:w-full after:transition-all"
                >
                  {isHi ? link.hi : link.en}
                </button>
              ))}
            </nav>

            {/* Right CTA & Mobile Menu Toggle */}
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => scrollToSection('eco-contact')}
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white text-xs sm:text-sm font-semibold transition-all duration-200 hover:shadow-[0_0_24px_rgba(99,102,241,0.5)] cursor-pointer whitespace-nowrap"
              >
                {isHi ? 'फ़्री कंसल्टेशन' : 'Free Consultation'}
              </button>
              <button
                type="button"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                className="lg:hidden w-10 h-10 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 flex items-center justify-center text-white cursor-pointer"
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Drawer */}
          {mobileMenuOpen && (
            <div className="lg:hidden border-t border-white/10 bg-[#080d1d] px-4 py-4 space-y-2">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => scrollToSection(link.id)}
                  className="block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-slate-200 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                >
                  {isHi ? link.hi : link.en}
                </button>
              ))}
              <button
                type="button"
                onClick={() => scrollToSection('eco-contact')}
                className="w-full mt-2 px-4 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 text-white text-sm font-semibold cursor-pointer"
              >
                {isHi ? 'फ़्री कंसल्टेशन' : 'Free Consultation'}
              </button>
            </div>
          )}
        </header>
      </div>

      {/* 1. HERO SECTION */}
      <section
        id="eco-home"
        className="relative overflow-hidden border-b border-white/10 min-h-[540px] sm:min-h-[600px] flex items-center"
      >
        {/* Full-bleed Hero Background Image */}
        <div className="absolute inset-0">
          {!brokenImages['hero'] ? (
            <img
              src="/demo/web-ecosystem/hero.jpg"
              alt={isHi ? 'वेब इकोसिस्टम डिजिटल एजेंसी स्टूडियो' : 'Web Ecosystem Digital Agency Studio'}
              referrerPolicy="no-referrer"
              onError={() => markImageBroken('hero')}
              className="w-full h-full object-cover object-center"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#070b18] via-[#111b3a] to-[#1a1338]" />
          )}
          {/* Measured Dark Scrim for >= 4.5:1 Contrast */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#060913]/95 via-[#060913]/82 to-[#0b1026]/70" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#060913] via-transparent to-[#060913]/40" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 w-full">
          <div className="max-w-3xl space-y-6">
            <p className="text-xs sm:text-sm font-medium tracking-wide text-indigo-300">
              {isHi
                ? 'डिजिटल एजेंसी · वेब · मोबाइल · क्लाउड · SEO'
                : 'Digital Agency · Web · Mobile · Cloud · SEO'}
            </p>

            <h1 className="text-3xl sm:text-5xl lg:text-[3.5rem] font-extrabold tracking-tight text-white leading-[1.12] [text-wrap:balance]">
              {isHi
                ? 'आपके बिज़नेस का पूरा डिजिटल इकोसिस्टम'
                : 'Complete Digital Ecosystem for Your Business'}
            </h1>

            <p className="text-base sm:text-xl font-semibold text-slate-200">
              {isHi
                ? 'Website, App, Hosting, SEO — सब एक जगह'
                : 'Website, App, Hosting, SEO — All in One Place'}
            </p>

            {/* Typing Animation Line */}
            <div className="flex flex-wrap items-center gap-2 text-base sm:text-lg text-slate-300 pt-1">
              <span>{isHi ? 'हम तैयार करते हैं:' : 'We craft your:'}</span>
              <span className="inline-flex items-center font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-violet-400 min-w-[140px]">
                {typedWord}
                <span
                  aria-hidden="true"
                  className="inline-block w-[2px] h-5 sm:h-6 bg-indigo-400 ml-1 animate-pulse"
                />
              </span>
            </div>

            {/* Dual CTA Row */}
            <div className="flex flex-wrap items-center gap-3.5 pt-3">
              <button
                type="button"
                onClick={() => scrollToSection('eco-contact')}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white text-sm sm:text-base font-semibold transition-all duration-200 hover:shadow-[0_0_28px_rgba(99,102,241,0.55)] cursor-pointer whitespace-nowrap"
              >
                {isHi ? 'फ़्री कंसल्टेशन' : 'Free Consultation'}
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('eco-services')}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] backdrop-blur-md border border-white/15 text-white text-sm sm:text-base font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap"
              >
                {isHi ? 'हमारी सेवाएँ' : 'Our Services'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SERVICES SECTION (6 Real Photo Cards) */}
      <RevealSection id="eco-services" className="py-16 sm:py-24 px-4 sm:px-6 border-b border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl mb-12 space-y-3">
            <p className="text-xs sm:text-sm font-semibold text-indigo-300">
              {isHi ? 'हमारी मुख्य सेवाएँ' : 'Core Digital Services'}
            </p>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white [text-wrap:balance]">
              {isHi
                ? 'विचार से लॉन्च तक हर डिजिटल समाधान'
                : 'Every Digital Capability from Concept to Launch'}
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              {isHi
                ? 'किसी भी सेवा कार्ड पर “और जानें” दबाकर काम का पूरा दायरा देखें।'
                : 'Select “Learn More” on any service card to inspect the full work scope.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.map((service) => (
              <article
                key={service.id}
                className="group rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/10 hover:border-indigo-400/40 overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-0.5"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-[#0c1328]">
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
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0e1730] to-[#1a1336] text-indigo-300 text-sm font-semibold">
                      {isHi ? service.titleHi : service.titleEn}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#060913]/70 via-transparent to-transparent" />
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
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-300 hover:text-white transition-colors cursor-pointer"
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

      {/* 3. INTERACTIVE DIGITAL ECOSYSTEM HUB */}
      <RevealSection
        id="eco-ecosystem"
        className="py-16 sm:py-24 px-4 sm:px-6 border-b border-white/10 bg-[#080d1c]"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <p className="text-xs sm:text-sm font-semibold text-indigo-300">
              {isHi ? 'जुड़ा हुआ इकोसिस्टम' : 'Connected Architecture'}
            </p>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white [text-wrap:balance]">
              {isHi
                ? 'आपका बिज़नेस केंद्र में, हर डिजिटल माध्यम साथ जुड़ा'
                : 'Your Business at the Center, Every Channel Connected'}
            </h2>
            <p className="text-sm sm:text-base text-slate-300">
              {isHi
                ? 'किसी भी नोड पर क्लिक करें और देखें कि वह आपके बिज़नेस को कैसे जोड़ता है।'
                : 'Select any node below to see how each layer connects to your core business.'}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Desktop / Tablet Orbital Diagram with Animated Connecting Lines */}
            <div className="lg:col-span-7">
              <div className="relative mx-auto w-full max-w-[520px] aspect-square hidden sm:block">
                <svg
                  viewBox="0 0 500 500"
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  aria-hidden="true"
                >
                  <defs>
                    <linearGradient id="ecoLineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                  {/* Subtle Outer Orbit Ring */}
                  <circle
                    cx="250"
                    cy="250"
                    r="172"
                    fill="none"
                    stroke="rgba(129, 140, 248, 0.18)"
                    strokeWidth="1.25"
                    strokeDasharray="4 6"
                  />
                  {/* Connecting Animated Lines from Center to 6 Nodes */}
                  {ECOSYSTEM_NODES.map((node) => {
                    const rad = (node.angleDeg * Math.PI) / 180;
                    const x2 = 250 + 172 * Math.cos(rad);
                    const y2 = 250 + 172 * Math.sin(rad);
                    const isSelected = node.id === activeNode.id;
                    return (
                      <g key={node.id}>
                        <line
                          x1="250"
                          y1="250"
                          x2={x2}
                          y2={y2}
                          stroke={isSelected ? 'url(#ecoLineGrad)' : 'rgba(148, 163, 184, 0.22)'}
                          strokeWidth={isSelected ? '2.5' : '1.5'}
                          strokeDasharray="6 6"
                        >
                          <animate
                            attributeName="stroke-dashoffset"
                            from="24"
                            to="0"
                            dur={isSelected ? '1.2s' : '2.8s'}
                            repeatCount="indefinite"
                          />
                        </line>
                        <circle
                          cx={x2}
                          cy={y2}
                          r={isSelected ? '4.5' : '3'}
                          fill={isSelected ? '#818cf8' : '#475569'}
                        />
                      </g>
                    );
                  })}
                </svg>

                {/* Center Business Core */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-36 rounded-full bg-gradient-to-br from-blue-600/90 via-indigo-600/90 to-violet-600/90 border border-indigo-300/40 shadow-[0_0_45px_rgba(99,102,241,0.45)] flex flex-col items-center justify-center text-center px-3">
                  <Network className="w-7 h-7 text-white mb-1.5" />
                  <span className="text-sm font-extrabold text-white leading-tight">
                    {isHi ? 'आपका बिज़नेस' : 'Your Business'}
                  </span>
                </div>

                {/* 6 Orbital Nodes */}
                {ECOSYSTEM_NODES.map((node) => {
                  const rad = (node.angleDeg * Math.PI) / 180;
                  const leftPct = 50 + (172 / 500) * 100 * Math.cos(rad);
                  const topPct = 50 + (172 / 500) * 100 * Math.sin(rad);
                  const isSelected = node.id === activeNode.id;
                  return (
                    <button
                      key={node.id}
                      type="button"
                      onClick={() => setActiveNodeId(node.id)}
                      onMouseEnter={() => setActiveNodeId(node.id)}
                      style={{ left: `${leftPct}%`, top: `${topPct}%` }}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 px-4 py-2.5 rounded-xl backdrop-blur-md border transition-all duration-200 flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                        isSelected
                          ? 'bg-indigo-600/30 border-indigo-400 text-white shadow-[0_0_24px_rgba(99,102,241,0.45)] scale-105'
                          : 'bg-[#0c1328]/90 border-white/15 text-slate-200 hover:border-indigo-400/50 hover:text-white'
                      }`}
                    >
                      <span className="text-indigo-300">{renderNodeIcon(node.icon, 'w-4 h-4')}</span>
                      <span className="text-xs sm:text-sm font-semibold">
                        {isHi ? node.labelHi : node.labelEn}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Mobile Compact Hub & Connected Nodes */}
              <div className="sm:hidden space-y-4">
                <div className="mx-auto w-36 h-36 rounded-full bg-gradient-to-br from-blue-600 to-violet-600 border border-indigo-300/40 shadow-[0_0_32px_rgba(99,102,241,0.4)] flex flex-col items-center justify-center text-center px-3">
                  <Network className="w-7 h-7 text-white mb-1" />
                  <span className="text-sm font-extrabold text-white">
                    {isHi ? 'आपका बिज़नेस' : 'Your Business'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  {ECOSYSTEM_NODES.map((node) => {
                    const isSelected = node.id === activeNode.id;
                    return (
                      <button
                        key={node.id}
                        type="button"
                        onClick={() => setActiveNodeId(node.id)}
                        className={`px-3 py-3 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600/25 border-indigo-400 text-white'
                            : 'bg-white/[0.04] border-white/10 text-slate-200'
                        }`}
                      >
                        <span className="text-indigo-300 shrink-0">
                          {renderNodeIcon(node.icon, 'w-4 h-4')}
                        </span>
                        <span className="text-xs font-semibold truncate">
                          {isHi ? node.labelHi : node.labelEn}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Active Node Detail Panel */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/10 p-6 sm:p-8 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500/25 to-violet-500/25 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                    {renderNodeIcon(activeNode.icon, 'w-5 h-5')}
                  </div>
                  <div>
                    <p className="text-xs text-indigo-300 font-medium">
                      {isHi ? 'चयनित इकोसिस्टम नोड' : 'Selected Ecosystem Node'}
                    </p>
                    <h3 className="text-xl font-bold text-white">
                      {isHi ? activeNode.labelHi : activeNode.labelEn}
                    </h3>
                  </div>
                </div>

                <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
                  {isHi ? activeNode.detailHi : activeNode.detailEn}
                </p>

                <div className="pt-3 border-t border-white/10 text-xs sm:text-sm text-slate-400 leading-relaxed">
                  {isHi
                    ? 'जब वेबसाइट, मोबाइल ऐप, होस्टिंग, SEO, सोशल मीडिया और पेमेंट एक साथ जुड़ते हैं, तो ग्राहक को हर जगह एक समान और भरोसेमंद अनुभव मिलता है।'
                    : 'When your website, app, cloud hosting, SEO, social channels, and payments operate as one connected system, customers experience consistent reliability at every step.'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </RevealSection>

      {/* 4. PORTFOLIO SECTION (Filterable + Lightbox + "नमूना डिज़ाइन" tag) */}
      <RevealSection id="eco-portfolio" className="py-16 sm:py-24 px-4 sm:px-6 border-b border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div className="space-y-3 max-w-xl">
              <p className="text-xs sm:text-sm font-semibold text-indigo-300">
                {isHi ? 'पोर्टफ़ोलियो शोकेस' : 'Portfolio Showcase'}
              </p>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white [text-wrap:balance]">
                {isHi ? 'विभिन्न उद्योगों के नमूना डिज़ाइन' : 'Sample Designs Across Industries'}
              </h2>
            </div>

            {/* Functional Segmented Filter Controls */}
            <div
              role="tablist"
              aria-label={isHi ? 'पोर्टफ़ोलियो फ़िल्टर' : 'Portfolio Filter'}
              className="inline-flex items-center gap-1 p-1 rounded-xl bg-white/[0.05] border border-white/10 self-start md:self-auto"
            >
              {(
                [
                  { key: 'all', hi: 'सभी', en: 'All' },
                  { key: 'website', hi: 'वेबसाइट', en: 'Website' },
                  { key: 'app', hi: 'ऐप', en: 'App' },
                ] as const
              ).map((tab) => {
                const active = portfolioFilter === tab.key;
                return (
                  <button
                    key={tab.key}
                    role="tab"
                    aria-selected={active}
                    type="button"
                    onClick={() => setPortfolioFilter(tab.key)}
                    className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      active
                        ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-sm'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {isHi ? tab.hi : tab.en}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {filteredPortfolio.map((item) => {
              const masterIdx = PORTFOLIO_ITEMS.findIndex((p) => p.id === item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setLightboxIndex(masterIdx)}
                  className="group text-left rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/10 hover:border-indigo-400/45 overflow-hidden transition-all duration-200 hover:-translate-y-0.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-[#0c1328]">
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
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0e1730] to-[#1a1336] text-indigo-300 text-sm font-semibold">
                        {isHi ? item.titleHi : item.titleEn}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#060913]/85 via-[#060913]/20 to-transparent" />
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-[#060913]/80 backdrop-blur-md border border-white/15 text-[11px] font-semibold text-indigo-200">
                      {isHi ? 'नमूना डिज़ाइन' : 'Sample Design'}
                    </div>
                  </div>

                  <div className="p-5 sm:p-6 space-y-2">
                    <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
                      <span>{isHi ? item.typeHi : item.typeEn}</span>
                      <span className="text-indigo-300 font-medium">
                        {isHi ? 'पूरा प्रीव्यू देखें →' : 'View Preview →'}
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
              );
            })}
          </div>
        </div>
      </RevealSection>

      {/* 5. SAMPLE PACKAGES SECTION (3 Cards, NO monthly/yearly toggle) */}
      <RevealSection
        id="eco-packages"
        className="py-16 sm:py-24 px-4 sm:px-6 border-b border-white/10 bg-[#080d1c]"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <p className="text-xs sm:text-sm font-semibold text-amber-300">
              {isHi ? 'नमूना कीमतें — डेमो' : 'Sample Pricing — Demo Only'}
            </p>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white [text-wrap:balance]">
              {isHi ? 'स्पष्ट और पारदर्शी पैकेज विकल्प' : 'Clear & Transparent Sample Packages'}
            </h2>
            <p className="text-sm sm:text-base text-slate-300">
              {isHi
                ? 'नीचे दी गई कीमतें केवल डेमो प्रदर्शन के लिए हैं। वास्तविक प्रोजेक्ट लागत आवश्यकता के अनुसार तय होती है।'
                : 'Prices shown below are sample demo figures only. Actual project pricing depends on specific requirements.'}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            {PACKAGES.map((pkg) => (
              <div
                key={pkg.id}
                className={`rounded-2xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-200 ${
                  pkg.highlighted
                    ? 'bg-gradient-to-b from-indigo-950/80 to-[#0c1328] border-2 border-indigo-400/70 shadow-[0_0_36px_rgba(99,102,241,0.22)]'
                    : 'bg-white/[0.04] backdrop-blur-md border border-white/10'
                }`}
              >
                <div className="space-y-5">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xl font-bold text-white">
                      {isHi ? pkg.nameHi : pkg.nameEn}
                    </h3>
                    {pkg.highlighted && (
                      <span className="px-2.5 py-1 rounded-md bg-gradient-to-r from-blue-600 to-violet-600 text-[11px] font-bold text-white whitespace-nowrap">
                        {isHi ? 'लोकप्रिय' : 'Popular'}
                      </span>
                    )}
                  </div>

                  <p className="text-xs sm:text-sm text-slate-300">
                    {isHi ? pkg.subtitleHi : pkg.subtitleEn}
                  </p>

                  <div className="pt-2 pb-4 border-b border-white/10">
                    <div className="text-3xl sm:text-4xl font-extrabold text-white tabular-nums">
                      {pkg.price}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {isHi ? 'नमूना कीमत — डेमो' : 'Sample price — Demo'}
                    </p>
                  </div>

                  <ul className="space-y-3">
                    {(isHi ? pkg.featuresHi : pkg.featuresEn).map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-200">
                        <Check className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
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
                        ? 'bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white hover:shadow-[0_0_24px_rgba(99,102,241,0.5)]'
                        : 'bg-white/[0.08] hover:bg-white/[0.15] border border-white/15 text-white'
                    }`}
                  >
                    {isHi ? 'इस पैकेज पर चर्चा करें' : 'Discuss This Package'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* 6. 5-STEP PROCESS TIMELINE */}
      <RevealSection id="eco-process" className="py-16 sm:py-24 px-4 sm:px-6 border-b border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl mb-12 space-y-3">
            <p className="text-xs sm:text-sm font-semibold text-indigo-300">
              {isHi ? 'हमारी कार्य प्रक्रिया' : 'Our Delivery Process'}
            </p>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white [text-wrap:balance]">
              {isHi ? '5 सरल चरणों में प्रोजेक्ट की पूरी यात्रा' : 'Five Clear Steps from Idea to Launch'}
            </h2>
          </div>

          <div className="relative">
            {/* Desktop Horizontal Connector Line */}
            <div
              aria-hidden="true"
              className="hidden lg:block absolute top-6 left-10 right-10 h-[2px] bg-gradient-to-r from-blue-500/40 via-indigo-400/60 to-violet-500/40"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              {PROCESS_STEPS.map((step) => (
                <div
                  key={step.step}
                  className="relative rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/10 p-5 space-y-3"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center text-sm font-extrabold text-white tabular-nums shadow-[0_0_18px_rgba(99,102,241,0.35)]">
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

      {/* 7. TECHNOLOGY STRIP (Text Chips Only — No Logo Images) */}
      <RevealSection className="py-12 sm:py-16 px-4 sm:px-6 border-b border-white/10 bg-[#080d1c]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-indigo-300">
              {isHi ? 'टेक्नोलॉजी स्टैक' : 'Technology Stack'}
            </p>
            <h2 className="text-lg sm:text-xl font-bold text-white">
              {isHi ? 'आधुनिक टूल्स और फ़्रेमवर्क्स' : 'Modern Frameworks & Platforms'}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            {TECH_CHIPS.map((tech) => (
              <span
                key={tech}
                className="px-4 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-sm font-semibold text-slate-100 tracking-wide"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* 8. FAQ ACCORDION (4 Questions) */}
      <RevealSection className="py-16 sm:py-24 px-4 sm:px-6 border-b border-white/10">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10 space-y-3">
            <p className="text-xs sm:text-sm font-semibold text-indigo-300">
              {isHi ? 'सामान्य प्रश्न (FAQ)' : 'Frequently Asked Questions'}
            </p>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white [text-wrap:balance]">
              {isHi ? 'प्रोजेक्ट शुरू करने से पहले ज़रूरी सवाल' : 'Common Questions Before Getting Started'}
            </h2>
          </div>

          <div className="space-y-3">
            {FAQ_ITEMS.map((faq) => {
              const isOpen = openFaqId === faq.id;
              return (
                <div
                  key={faq.id}
                  className="rounded-xl bg-white/[0.04] backdrop-blur-md border border-white/10 overflow-hidden"
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
                      className={`w-5 h-5 text-indigo-300 shrink-0 transition-transform duration-200 ${
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

      {/* 9. CONSULTATION FORM + DEMO CONTACT DETAILS */}
      <RevealSection
        id="eco-contact"
        className="py-16 sm:py-24 px-4 sm:px-6 border-b border-white/10 bg-[#080d1c]"
      >
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Contact Details Column */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-3">
              <p className="text-xs sm:text-sm font-semibold text-indigo-300">
                {isHi ? 'फ़्री कंसल्टेशन और संपर्क' : 'Free Consultation & Contact'}
              </p>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white [text-wrap:balance]">
                {isHi ? 'अपने प्रोजेक्ट की शुरुआत करें' : 'Start Planning Your Digital Project'}
              </h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                {isHi
                  ? 'यह फ़ॉर्म केवल डेमो अनुभव दिखाने के लिए है। सबमिट करने पर कोई भी डेटा सर्वर या डेटाबेस में सेव नहीं होता।'
                  : 'This form demonstrates the client inquiry flow locally. No data is transmitted or stored in any database.'}
              </p>
            </div>

            <div className="rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/10 p-6 space-y-5">
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
                  <Phone className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
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
                  <Mail className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-400">
                      {isHi ? 'ईमेल (डेमो जानकारी)' : 'Email (Demo Information)'}
                    </p>
                    <p className="text-sm sm:text-base font-semibold text-white break-all">
                      hello@web-ecosystem.example
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-start gap-2 text-xs text-slate-400">
                <Info className="w-4 h-4 text-indigo-300 shrink-0 mt-0.5" />
                <span>
                  {isHi
                    ? 'असली वेबसाइट बनवाने के लिए पेज के सबसे नीचे “ऐसी वेबसाइट अपने बिज़नेस के लिए बनवाएँ” बटन का उपयोग करें।'
                    : 'To request a real website for your business, use the “Build a Website Like This” button at the bottom of this page.'}
                </span>
              </div>
            </div>
          </div>

          {/* Local Consultation Form */}
          <div className="lg:col-span-7">
            <form
              onSubmit={handleFormSubmit}
              noValidate
              className="rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/10 p-6 sm:p-8 space-y-5"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="eco-name" className="block text-xs sm:text-sm font-medium text-slate-200">
                    {isHi ? 'नाम *' : 'Full Name *'}
                  </label>
                  <input
                    id="eco-name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={isHi ? 'आपका नाम लिखें' : 'Enter your name'}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#060913]/80 border border-white/15 focus:border-indigo-400 focus:outline-none text-sm text-white placeholder:text-slate-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="eco-mobile" className="block text-xs sm:text-sm font-medium text-slate-200">
                    {isHi ? 'मोबाइल नंबर *' : 'Mobile Number *'}
                  </label>
                  <input
                    id="eco-mobile"
                    type="tel"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    placeholder={isHi ? '10 अंकों का मोबाइल नंबर' : '10-digit mobile number'}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#060913]/80 border border-white/15 focus:border-indigo-400 focus:outline-none text-sm text-white placeholder:text-slate-500 tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="eco-business" className="block text-xs sm:text-sm font-medium text-slate-200">
                    {isHi ? 'बिज़नेस का प्रकार *' : 'Business Type *'}
                  </label>
                  <select
                    id="eco-business"
                    value={formData.businessType}
                    onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#060913] border border-white/15 focus:border-indigo-400 focus:outline-none text-sm text-white"
                  >
                    <option value="">{isHi ? 'प्रकार चुनें' : 'Select business type'}</option>
                    <option value="retail">{isHi ? 'दुकान / रिटेल स्टोर' : 'Retail / Shop'}</option>
                    <option value="restaurant">{isHi ? 'रेस्टोरेंट / कैफ़े' : 'Restaurant / Cafe'}</option>
                    <option value="education">{isHi ? 'स्कूल / कोचिंग संस्थान' : 'School / Coaching'}</option>
                    <option value="realestate">{isHi ? 'रियल एस्टेट / कंस्ट्रक्शन' : 'Real Estate / Construction'}</option>
                    <option value="services">{isHi ? 'सर्विस / कंसल्टिंग कंपनी' : 'Service / Consulting Company'}</option>
                    <option value="startup">{isHi ? 'स्टार्टअप / अन्य' : 'Startup / Other'}</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="eco-budget" className="block text-xs sm:text-sm font-medium text-slate-200">
                    {isHi ? 'अनुमानित बजट *' : 'Estimated Budget *'}
                  </label>
                  <select
                    id="eco-budget"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#060913] border border-white/15 focus:border-indigo-400 focus:outline-none text-sm text-white"
                  >
                    <option value="">{isHi ? 'बजट चुनें' : 'Select budget range'}</option>
                    <option value="starter-9999">
                      {isHi ? 'स्टार्टर — लगभग ₹9,999 (डेमो)' : 'Starter — Approx. ₹9,999 (Demo)'}
                    </option>
                    <option value="business-24999">
                      {isHi ? 'बिज़नेस — लगभग ₹24,999 (डेमो)' : 'Business — Approx. ₹24,999 (Demo)'}
                    </option>
                    <option value="ecommerce-49999">
                      {isHi ? 'ई-कॉमर्स — लगभग ₹49,999 (डेमो)' : 'E-Commerce — Approx. ₹49,999 (Demo)'}
                    </option>
                    <option value="custom">
                      {isHi ? 'कस्टम प्रोजेक्ट / चर्चा से तय' : 'Custom Project / Discuss'}
                    </option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="eco-message" className="block text-xs sm:text-sm font-medium text-slate-200">
                  {isHi ? 'संदेश *' : 'Message *'}
                </label>
                <textarea
                  id="eco-message"
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder={
                    isHi
                      ? 'बताएँ आपको वेबसाइट, ऐप या ई-कॉमर्स में क्या चाहिए…'
                      : 'Tell us whether you need a website, mobile app, or online store…'
                  }
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#060913]/80 border border-white/15 focus:border-indigo-400 focus:outline-none text-sm text-white placeholder:text-slate-500 resize-y"
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
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white text-sm sm:text-base font-semibold transition-all duration-200 hover:shadow-[0_0_26px_rgba(99,102,241,0.5)] cursor-pointer"
              >
                {isHi ? 'फ़्री कंसल्टेशन भेजें (डेमो)' : 'Submit Free Consultation (Demo)'}
              </button>
            </form>
          </div>
        </div>
      </RevealSection>

      {/* 10. FOOTER + BOTTOM MAIN-SITE QUOTE CTA */}
      <footer className="bg-[#050811] text-slate-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 border-b border-white/10">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
                <Network className="w-4 h-4 text-white" />
              </span>
              <span className="text-base font-extrabold text-white tracking-tight">
                WEB ECOSYSTEM
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              {isHi
                ? 'वेबसाइट, मोबाइल ऐप, क्लाउड होस्टिंग और SEO सेवाओं के लिए आधुनिक डिजिटल एजेंसी का नमूना डिज़ाइन।'
                : 'A sample digital agency showcase covering websites, mobile apps, cloud hosting, and SEO.'}
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
                    className="hover:text-white transition-colors cursor-pointer"
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
              {navLinks.map((link) => (
                <li key={link.id}>
                  <button
                    type="button"
                    onClick={() => scrollToSection(link.id)}
                    className="hover:text-white transition-colors cursor-pointer"
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
              {['Instagram', 'LinkedIn', 'YouTube', 'X'].map((network) => (
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
            <p className="text-xs text-slate-500 pt-2">© Web Ecosystem (Demo)</p>
          </div>
        </div>

        {/* Bottom Conversion Strip -> Main Site Quote Form */}
        <div className="bg-gradient-to-r from-[#0c1430] via-[#17163e] to-[#0c1430] border-t border-indigo-500/25 px-4 sm:px-6 py-8">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-indigo-300">POWER WEB STUDIO AI</p>
              <h3 className="text-lg sm:text-xl font-extrabold text-white">
                {isHi
                  ? 'क्या आप भी अपने बिज़नेस के लिए ऐसी आधुनिक वेबसाइट बनवाना चाहते हैं?'
                  : 'Want a Modern Website Like This Built for Your Business?'}
              </h3>
            </div>
            <button
              type="button"
              onClick={onRequestQuote}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white text-sm font-bold transition-all duration-200 hover:shadow-[0_0_26px_rgba(99,102,241,0.55)] cursor-pointer whitespace-nowrap shrink-0"
            >
              {isHi
                ? 'ऐसी वेबसाइट अपने बिज़नेस के लिए बनवाएँ'
                : 'Build a Website Like This for Your Business'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp-Style Demo Button */}
      <button
        type="button"
        onClick={() =>
          showDemoToast(
            'डेमो बटन — यह केवल नमूना WhatsApp चैट बटन है।',
            'Demo Button — This is a sample WhatsApp chat button.'
          )
        }
        aria-label={isHi ? 'डेमो WhatsApp बटन' : 'Demo WhatsApp Button'}
        className="fixed bottom-5 right-5 z-40 w-13 h-13 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white shadow-[0_6px_24px_rgba(16,185,129,0.45)] flex items-center justify-center transition-transform duration-200 hover:scale-105 cursor-pointer"
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {/* Local Demo Toast Notification */}
      {demoToast && (
        <div
          role="status"
          className="fixed bottom-20 right-5 z-50 max-w-xs px-4 py-3 rounded-xl bg-[#0d152e]/95 backdrop-blur-md border border-indigo-400/40 text-xs sm:text-sm font-medium text-white shadow-xl"
        >
          {demoToast}
        </div>
      )}

      {/* SERVICE SCOPE MODAL */}
      {activeServiceModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="eco-service-modal-title"
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setActiveServiceModal(null)}
        >
          <div
            className="w-full max-w-xl rounded-2xl bg-[#0c1328] border border-white/15 overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-48 sm:h-56 bg-[#060913] shrink-0">
              <img
                src={activeServiceModal.image}
                alt={isHi ? activeServiceModal.titleHi : activeServiceModal.titleEn}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0c1328] via-transparent to-black/30" />
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
                <p className="text-xs font-semibold text-indigo-300">
                  {isHi ? 'सेवा का कार्य-दायरा (डेमो)' : 'Service Scope (Demo)'}
                </p>
                <h3 id="eco-service-modal-title" className="text-xl sm:text-2xl font-bold text-white mt-1">
                  {isHi ? activeServiceModal.titleHi : activeServiceModal.titleEn}
                </h3>
                <p className="text-sm text-slate-300 mt-1.5">
                  {isHi ? activeServiceModal.shortDescHi : activeServiceModal.shortDescEn}
                </p>
              </div>

              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {isHi ? 'इसमें क्या शामिल रहता है' : 'What Is Typically Covered'}
                </h4>
                <ul className="space-y-2">
                  {(isHi ? activeServiceModal.scopeHi : activeServiceModal.scopeEn).map((line, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-slate-200">
                      <Check className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
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
                  className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-sm font-semibold text-white cursor-pointer"
                >
                  {isHi ? 'फ़्री कंसल्टेशन लें' : 'Get Free Consultation'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PORTFOLIO LIGHTBOX MODAL */}
      {lightboxIndex !== null && PORTFOLIO_ITEMS[lightboxIndex] && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="eco-lightbox-title"
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setLightboxIndex(null)}
        >
          <div
            className="w-full max-w-3xl rounded-2xl bg-[#0c1328] border border-white/15 overflow-hidden shadow-2xl max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative bg-[#060913]">
              <img
                src={PORTFOLIO_ITEMS[lightboxIndex].image}
                alt={
                  isHi
                    ? PORTFOLIO_ITEMS[lightboxIndex].titleHi
                    : PORTFOLIO_ITEMS[lightboxIndex].titleEn
                }
                referrerPolicy="no-referrer"
                className="w-full max-h-[55vh] object-cover"
              />
              <div className="absolute top-3 left-3 px-3 py-1 rounded-md bg-[#060913]/85 border border-white/15 text-xs font-semibold text-indigo-200">
                {isHi ? 'नमूना डिज़ाइन' : 'Sample Design'}
              </div>
              <button
                type="button"
                onClick={() => setLightboxIndex(null)}
                aria-label={isHi ? 'बंद करें' : 'Close'}
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/65 hover:bg-black/85 text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() =>
                  setLightboxIndex(
                    (lightboxIndex - 1 + PORTFOLIO_ITEMS.length) % PORTFOLIO_ITEMS.length
                  )
                }
                aria-label={isHi ? 'पिछला' : 'Previous'}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => setLightboxIndex((lightboxIndex + 1) % PORTFOLIO_ITEMS.length)}
                aria-label={isHi ? 'अगला' : 'Next'}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 id="eco-lightbox-title" className="text-xl font-bold text-white">
                  {isHi
                    ? PORTFOLIO_ITEMS[lightboxIndex].titleHi
                    : PORTFOLIO_ITEMS[lightboxIndex].titleEn}
                </h3>
                <span className="text-xs font-medium text-indigo-300">
                  {isHi
                    ? PORTFOLIO_ITEMS[lightboxIndex].typeHi
                    : PORTFOLIO_ITEMS[lightboxIndex].typeEn}
                </span>
              </div>

              <p className="text-sm text-slate-300 leading-relaxed">
                {isHi
                  ? PORTFOLIO_ITEMS[lightboxIndex].summaryHi
                  : PORTFOLIO_ITEMS[lightboxIndex].summaryEn}
              </p>

              <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                {(isHi
                  ? PORTFOLIO_ITEMS[lightboxIndex].highlightsHi
                  : PORTFOLIO_ITEMS[lightboxIndex].highlightsEn
                ).map((hl, idx) => (
                  <li
                    key={idx}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/10 text-xs text-slate-200"
                  >
                    <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>{hl}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
