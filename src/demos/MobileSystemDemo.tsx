import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Cloud,
  Code2,
  CreditCard,
  Info,
  Languages,
  Mail,
  Menu,
  MessageCircle,
  Palette,
  Phone,
  Rocket,
  Smartphone,
  Tablet,
  Watch,
  WifiOff,
  X,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface MobileSystemDemoProps {
  onBackToHome: () => void;
  onRequestQuote: () => void;
}

interface AndroidService {
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

interface AppPortfolioItem {
  id: string;
  image: string;
  titleHi: string;
  titleEn: string;
  categoryHi: string;
  categoryEn: string;
  summaryHi: string;
  summaryEn: string;
  chipsHi: string[];
  chipsEn: string[];
}

interface AndroidNode {
  id: string;
  labelHi: string;
  labelEn: string;
  detailHi: string;
  detailEn: string;
  icon: 'tablet' | 'watch' | 'cloud' | 'payment' | 'bell' | 'offline';
  angleDeg: number;
}

interface AppFeature {
  id: string;
  icon: 'code' | 'palette' | 'offline' | 'bell' | 'lang' | 'rocket';
  titleHi: string;
  titleEn: string;
  descHi: string;
  descEn: string;
}

interface AppPackage {
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

interface RippleCircle {
  id: number;
  x: number;
  y: number;
  size: number;
}

const SERVICES: AndroidService[] = [
  {
    id: 'native-app',
    number: '01',
    image: '/demo/mobile-system/native-app.jpg',
    titleHi: 'नेटिव एंड्रॉइड ऐप',
    titleEn: 'Native Android App',
    shortDescHi: 'Kotlin और Jetpack Compose में बने तेज़, सहज और आधुनिक Material You नेटिव एंड्रॉइड ऐप्स।',
    shortDescEn: 'Fast, responsive native Android applications built with Kotlin, Jetpack Compose, and Material You.',
    scopeHi: [
      'क्लीन Kotlin और Jetpack Compose आर्किटेक्चर',
      'कम रैम वाले फ़ोन से लेकर फ़्लैगशिप डिवाइस तक स्मूथ परफ़ॉर्मेंस',
      'डार्क व लाइट Material You थीम सपोर्ट',
      'बायोमेट्रिक लॉगिन और सुरक्षित लोकल स्टोरेज',
    ],
    scopeEn: [
      'Clean Kotlin and Jetpack Compose native architecture',
      'Smooth rendering across entry-level and flagship Android devices',
      'Material You light and dark adaptive color surfaces',
      'Biometric authentication and encrypted local storage',
    ],
    idealForHi: 'रिटेल ब्रांड्स, लोकल डिलीवरी, शिक्षा और सर्विस व्यवसाय',
    idealForEn: 'Retail brands, local delivery, education, and service businesses',
  },
  {
    id: 'development',
    number: '02',
    image: '/demo/mobile-system/development.jpg',
    titleHi: 'ऐप डेवलपमेंट और टेस्टिंग',
    titleEn: 'App Development & Testing',
    shortDescHi: 'मज़बूत कोड संरचना, कई स्क्रीन साइज़ पर डिवाइस टेस्टिंग और क्रैश-मुक्त स्थिरता जांच।',
    shortDescEn: 'Structured engineering, multi-screen Android device testing, and reliability checks before release.',
    scopeHi: [
      'मॉड्यूलर MVVM कोड संरचना और आसान मेंटेनेंस',
      'विभिन्न स्क्रीन साइज़ और एंड्रॉइड वर्ज़न पर टेस्टिंग',
      'बैटरी और मोबाइल डेटा खपत का ऑप्टिमाइज़ेशन',
      'रिलीज़ से पहले बग-फ़िक्स और परफ़ॉर्मेंस जाँच',
    ],
    scopeEn: [
      'Modular MVVM codebase built for long-term maintainability',
      'Cross-device testing across screen ratios and Android versions',
      'Battery, memory, and mobile network usage optimization',
      'Pre-release QA checks and crash diagnostics setup',
    ],
    idealForHi: 'नए ऐप लॉन्च और मौजूदा ऐप्स को अपग्रेड करने वाले व्यवसाय',
    idealForEn: 'New mobile launches and modernization of existing apps',
  },
  {
    id: 'wearable',
    number: '03',
    image: '/demo/mobile-system/wearable.jpg',
    titleHi: 'स्मार्टवॉच / Wear OS ऐप',
    titleEn: 'Smartwatch / Wear OS App',
    shortDescHi: 'कलाई पर झटपट अलर्ट, टाइल्स और फ़ोन ऐप से जुड़े हल्के स्मार्टवॉच कंपैनियन अनुभव।',
    shortDescEn: 'Lightweight Wear OS companion experiences with glanceable tiles and instant wrist alerts.',
    scopeHi: [
      'गोल स्मार्टवॉच स्क्रीन के अनुरूप साफ़ इंटरफ़ेस',
      'फ़ोन ऐप के साथ रीयल-टाइम सिंक और क्विक एक्शन',
      'ऑर्डर स्टेटस, रिमाइंडर या फ़िटनेस टाइल सपोर्ट',
      'कम बैटरी उपयोग के लिए हल्का बैकग्राउंड सिंक',
    ],
    scopeEn: [
      'Circular watch-first layouts designed for quick glances',
      'Companion sync with your main Android phone app',
      'Order updates, reminders, and activity tile modules',
      'Low-power background refresh tailored for wearables',
    ],
    idealForHi: 'फ़िटनेस, हेल्थकेयर, डिलीवरी ट्रैकिंग और उत्पादकता ऐप्स',
    idealForEn: 'Fitness, wellness, delivery status, and productivity apps',
  },
  {
    id: 'payment',
    number: '04',
    image: '/demo/mobile-system/payment.jpg',
    titleHi: 'पेमेंट और UPI इंटीग्रेशन',
    titleEn: 'Payment & UPI Integration',
    shortDescHi: 'UPI इंटेंट, QR स्कैन, कार्ड और वॉलेट के साथ सरल व सुरक्षित इन-ऐप भुगतान अनुभव।',
    shortDescEn: 'Smooth in-app checkout architecture supporting UPI intent, QR flows, cards, and digital receipts.',
    scopeHi: [
      'UPI ऐप चयन और झटपट भुगतान पुष्टि स्क्रीन',
      'ऑर्डर रसीद और ट्रांज़ैक्शन हिस्ट्री सेक्शन',
      'विफल भुगतान पर सुरक्षित री-ट्राई और स्पष्ट संदेश',
      'एडमिन पैनल के साथ पेमेंट स्टेटस अपडेट',
    ],
    scopeEn: [
      'UPI app intent handoff and instant confirmation screens',
      'Clean digital receipts and transaction history views',
      'Graceful retry handling and clear user status messages',
      'Synchronized payment status inside the admin dashboard',
    ],
    idealForHi: 'ई-कॉमर्स, फ़ूड डिलीवरी, सब्सक्रिप्शन और बुकिंग ऐप्स',
    idealForEn: 'E-commerce, food delivery, subscription, and booking apps',
  },
  {
    id: 'dashboard',
    number: '05',
    image: '/demo/mobile-system/dashboard.jpg',
    titleHi: 'एडमिन डैशबोर्ड और टैबलेट ऐप',
    titleEn: 'Admin Dashboard & Tablet App',
    shortDescHi: 'बड़ी टैबलेट स्क्रीन के लिए टू-पैन लेआउट और ऑर्डर, यूज़र व कंटेंट प्रबंधन का एडमिन पैनल।',
    shortDescEn: 'Adaptive two-pane tablet layouts and merchant admin panels to manage orders, users, and catalogs.',
    scopeHi: [
      'टैबलेट व फ़ोल्डेबल स्क्रीन के लिए मल्टी-कॉलम लेआउट',
      'प्रोडक्ट, कीमत, बैनर और ऑर्डर स्टेटस का आसान नियंत्रण',
      'स्टाफ़ और मैनेजर के लिए भूमिका आधारित एक्सेस',
      'दैनिक रिपोर्ट और तुरंत खोज (सर्च व फ़िल्टर)',
    ],
    scopeEn: [
      'Adaptive multi-column layouts for tablets and foldables',
      'Simple controls for products, pricing, banners, and orders',
      'Role-based views for store staff and business owners',
      'Quick search, filters, and daily operational summaries',
    ],
    idealForHi: 'स्टोर मालिक, रेस्टोरेंट काउंटर, स्कूल और वेयरहाउस टीमें',
    idealForEn: 'Store owners, restaurant counters, schools, and ops teams',
  },
  {
    id: 'cloud-sync',
    number: '06',
    image: '/demo/mobile-system/cloud-sync.jpg',
    titleHi: 'क्लाउड सिंक और नोटिफिकेशन',
    titleEn: 'Cloud Sync & Notifications',
    shortDescHi: 'फ़ायरबेस व क्लाउड बैकएंड के साथ लाइव डेटा सिंक, पुश अलर्ट और ऑफ़लाइन कैशिंग।',
    shortDescEn: 'Real-time cloud synchronization, targeted push notifications, and resilient local offline caching.',
    scopeHi: [
      'नए ऑफ़र, ऑर्डर अपडेट और रिमाइंडर के लिए पुश नोटिफिकेशन',
      'Room लोकल डेटाबेस के साथ ऑफ़लाइन डेटा एक्सेस',
      'इंटरनेट लौटते ही अपने-आप क्लाउड सिंक',
      'सुरक्षित API और यूज़र डेटा बैकअप संरचना',
    ],
    scopeEn: [
      'Targeted push alerts for order updates, offers, and reminders',
      'Room local database caching for reliable offline viewing',
      'Automatic background sync when connectivity returns',
      'Secure backend APIs and structured cloud backup workflows',
    ],
    idealForHi: 'फ़ील्ड टीमें, ग्राहक ऐप और मल्टी-डिवाइस व्यवसाय',
    idealForEn: 'Field teams, consumer apps, and multi-device businesses',
  },
];

const ANDROID_NODES: AndroidNode[] = [
  {
    id: 'tablet',
    labelHi: 'टैबलेट',
    labelEn: 'Tablet',
    detailHi: 'बड़ी स्क्रीन पर टू-पैन एडमिन और बिलिंग व्यू, जो सीधे फ़ोन ऐप के डेटा के साथ जुड़ा रहता है।',
    detailEn: 'Adaptive two-pane tablet dashboards synchronized directly with your mobile phone experience.',
    icon: 'tablet',
    angleDeg: -90,
  },
  {
    id: 'watch',
    labelHi: 'स्मार्टवॉच',
    labelEn: 'Smartwatch',
    detailHi: 'Wear OS पर लाइव ऑर्डर अलर्ट, क्विक रिप्लाई और ज़रूरी स्टेटस बिना फ़ोन निकाले।',
    detailEn: 'Glanceable Wear OS notifications, live status tiles, and quick wrist actions.',
    icon: 'watch',
    angleDeg: -30,
  },
  {
    id: 'cloud',
    labelHi: 'क्लाउड',
    labelEn: 'Cloud Sync',
    detailHi: 'सुरक्षित क्लाउड बैकएंड जो सभी डिवाइस पर यूज़र प्रोफ़ाइल और ऑर्डर हमेशा अपडेट रखता है।',
    detailEn: 'Reliable cloud backend keeping user profiles, orders, and catalogs synced across devices.',
    icon: 'cloud',
    angleDeg: 30,
  },
  {
    id: 'payment',
    labelHi: 'पेमेंट',
    labelEn: 'UPI & Payments',
    detailHi: 'UPI, QR और डिजिटल इनवॉइस का सहज जुड़ाव ताकि ग्राहक सेकंडों में भुगतान पूरा कर सकें।',
    detailEn: 'Streamlined UPI, QR, and card checkout flows built for smooth mobile transactions.',
    icon: 'payment',
    angleDeg: 90,
  },
  {
    id: 'bell',
    labelHi: 'नोटिफिकेशन',
    labelEn: 'Notifications',
    detailHi: 'सही समय पर ऑर्डर अपडेट, क्लास रिमाइंडर या नए ऑफ़र की सूचना सीधे स्क्रीन पर।',
    detailEn: 'Timely push notifications for order status, class schedules, and important updates.',
    icon: 'bell',
    angleDeg: 150,
  },
  {
    id: 'offline',
    labelHi: 'ऑफ़लाइन मोड',
    labelEn: 'Offline Mode',
    detailHi: 'कम नेटवर्क वाले इलाकों में भी ऐप सुचारू चले और कनेक्शन मिलते ही डेटा सिंक हो जाए।',
    detailEn: 'Room local storage keeps key screens accessible on weak networks and syncs automatically.',
    icon: 'offline',
    angleDeg: -150,
  },
];

const APP_PORTFOLIO: AppPortfolioItem[] = [
  {
    id: 'work-food',
    image: '/demo/mobile-system/work-food.jpg',
    titleHi: 'फ़ूड डिलीवरी ऐप',
    titleEn: 'Food Delivery App',
    categoryHi: 'फ़ूड और रेस्टोरेंट',
    categoryEn: 'Food & Dining',
    summaryHi: 'रेस्टोरेंट मेन्यू ब्राउज़िंग, कस्टमाइज़ेबल कार्ट, UPI पेमेंट और स्टेप-बाय-स्टेप ऑर्डर स्टेटस के साथ नमूना एंड्रॉइड ऐप डिज़ाइन।',
    summaryEn: 'Sample Android food ordering interface with rich dish browsing, smart cart, UPI checkout, and step-by-step order tracking.',
    chipsHi: ['डिजिटल मेन्यू', 'UPI चेकआउट', 'लाइव स्टेटस'],
    chipsEn: ['Digital Menu', 'UPI Checkout', 'Order Status'],
  },
  {
    id: 'work-learning',
    image: '/demo/mobile-system/work-learning.jpg',
    titleHi: 'ऑनलाइन क्लास ऐप',
    titleEn: 'Online Classes App',
    categoryHi: 'शिक्षा और कोचिंग',
    categoryEn: 'Education & Coaching',
    summaryHi: 'वीडियो लेक्चर, अध्याय प्रोग्रेस कार्ड, नोट्स डाउनलोड और क्लास रिमाइंडर के साथ कोचिंग व स्कूल ऐप का नमूना डिज़ाइन।',
    summaryEn: 'Sample learning app concept featuring structured video chapters, study notes, progress modules, and schedule reminders.',
    chipsHi: ['वीडियो लेक्चर', 'ऑफ़लाइन नोट्स', 'प्रोग्रेस कार्ड'],
    chipsEn: ['Video Lessons', 'Offline Notes', 'Progress View'],
  },
  {
    id: 'work-grocery',
    image: '/demo/mobile-system/work-grocery.jpg',
    titleHi: 'ग्रोसरी शॉपिंग ऐप',
    titleEn: 'Grocery Shopping App',
    categoryHi: 'रिटेल और सुपरमार्केट',
    categoryEn: 'Retail & Supermarket',
    summaryHi: 'ताज़ी सब्ज़ियों व रोज़मर्रा के सामान की कैटेगरी, वन-टैप कार्ट और डिलीवरी स्लॉट चयन वाला नमूना स्टोर ऐप।',
    summaryEn: 'Sample neighborhood supermarket app with fresh produce categories, one-tap cart controls, and scheduled delivery slots.',
    chipsHi: ['तेज़ कैटेगरी', 'वन-टैप कार्ट', 'स्लॉट डिलीवरी'],
    chipsEn: ['Quick Categories', 'One-Tap Cart', 'Slot Delivery'],
  },
  {
    id: 'work-ride',
    image: '/demo/mobile-system/work-ride.jpg',
    titleHi: 'टैक्सी बुकिंग ऐप',
    titleEn: 'Taxi Booking App',
    categoryHi: 'ट्रैवल और मोबिलिटी',
    categoryEn: 'Travel & Mobility',
    summaryHi: 'डार्क-मोड रूट मैप, पिकअप-ड्रॉप चयन, वाहन श्रेणी और अनुमानित किराया कार्ड के साथ कैब बुकिंग ऐप का नमूना।',
    summaryEn: 'Sample dark-mode ride booking interface with route preview map, pickup/drop pins, cab tiers, and fare estimates.',
    chipsHi: ['रूट मैप व्यू', 'किराया अनुमान', 'त्वरित बुकिंग'],
    chipsEn: ['Route Map View', 'Fare Estimate', 'Quick Booking'],
  },
];

const APP_FEATURES: AppFeature[] = [
  {
    id: 'kotlin',
    icon: 'code',
    titleHi: 'Kotlin नेटिव कोड',
    titleEn: 'Kotlin Native Code',
    descHi: 'एंड्रॉइड के लिए आधुनिक, सुरक्षित और तेज़ Kotlin व Jetpack Compose संरचना।',
    descEn: 'Modern, type-safe native Android development powered by Kotlin and Jetpack Compose.',
  },
  {
    id: 'material-you',
    icon: 'palette',
    titleHi: 'Material You डिज़ाइन',
    titleEn: 'Material You Design',
    descHi: 'बड़े गोल किनारे, स्पष्ट टाइपोग्राफ़ी और आँखों को सुकून देने वाला डार्क व लाइट इंटरफ़ेस।',
    descEn: 'Generous rounded geometry, crisp hierarchy, and comfortable adaptive dark & light surfaces.',
  },
  {
    id: 'offline',
    icon: 'offline',
    titleHi: 'ऑफ़लाइन सपोर्ट',
    titleEn: 'Offline Support',
    descHi: 'Room डेटाबेस कैशिंग से धीमे या बंद इंटरनेट में भी मुख्य जानकारी खुलती रहे।',
    descEn: 'Local Room caching keeps essential screens usable even on weak mobile connections.',
  },
  {
    id: 'push',
    icon: 'bell',
    titleHi: 'पुश नोटिफिकेशन',
    titleEn: 'Push Notifications',
    descHi: 'ऑर्डर स्टेटस, बुकिंग पुष्टि और ज़रूरी सूचनाएँ सीधे यूज़र के फ़ोन तक।',
    descEn: 'Deliver timely order updates, reminders, and announcements directly to users.',
  },
  {
    id: 'bilingual',
    icon: 'lang',
    titleHi: 'हिंदी/English भाषा',
    titleEn: 'Hindi / English Support',
    descHi: 'स्थानीय ग्राहकों के लिए आसान हिंदी और अंग्रेज़ी भाषा स्विच की सुविधा।',
    descEn: 'Built-in bilingual readiness so local customers can navigate comfortably in Hindi or English.',
  },
  {
    id: 'release',
    icon: 'rocket',
    titleHi: 'APK और Play Store रिलीज़ में मदद',
    titleEn: 'APK & Play Store Release Help',
    descHi: 'साइन्ड APK / AAB बिल्ड तैयार करने और Play Console लिस्टिंग प्रक्रिया में मार्गदर्शन।',
    descEn: 'Guidance on preparing signed APK / AAB builds and organizing store listing assets.',
  },
];

const PACKAGES: AppPackage[] = [
  {
    id: 'basic-app',
    nameHi: 'बेसिक ऐप',
    nameEn: 'Basic App',
    price: '₹14,999',
    budgetValue: 'basic-14999',
    subtitleHi: 'शुरुआती व्यवसाय और सरल मोबाइल उपस्थिति के लिए',
    subtitleEn: 'Ideal starter Android build for emerging businesses',
    featuresHi: [
      '5 कस्टम Material You स्क्रीन',
      'रेडी-टू-इंस्टॉल साइन्ड APK बिल्ड',
      'संपर्क व इंक्वायरी फ़ॉर्म स्क्रीन',
      'हिंदी / English टेक्स्ट सपोर्ट',
    ],
    featuresEn: [
      '5 custom Material You Android screens',
      'Ready-to-install signed APK build',
      'Built-in contact & inquiry screen',
      'Hindi / English language readiness',
    ],
  },
  {
    id: 'business-app',
    nameHi: 'बिज़नेस ऐप',
    nameEn: 'Business App',
    price: '₹39,999',
    budgetValue: 'business-39999',
    highlighted: true,
    subtitleHi: 'ग्राहक लॉगिन और एडमिन नियंत्रण वाले व्यवसायों के लिए',
    subtitleEn: 'Complete mobile suite with login & admin control',
    featuresHi: [
      'यूज़र लॉगिन और प्रोफ़ाइल प्रबंधन',
      'कंटेंट व ऑर्डर के लिए एडमिन पैनल',
      'पुश नोटिफिकेशन और क्लाउड डेटाबेस',
      'ऑफ़लाइन कैशिंग और मल्टी-स्क्रीन टेस्टिंग',
    ],
    featuresEn: [
      'User authentication & profile modules',
      'Admin panel for content & order control',
      'Push notifications & cloud database sync',
      'Offline caching & multi-device QA testing',
    ],
  },
  {
    id: 'premium-app',
    nameHi: 'प्रीमियम ऐप',
    nameEn: 'Premium App',
    price: '₹79,999',
    budgetValue: 'premium-79999',
    subtitleHi: 'पूर्ण एंड्रॉइड इकोसिस्टम और ऑनलाइन पेमेंट के लिए',
    subtitleEn: 'Full Android ecosystem with payments & multi-device support',
    featuresHi: [
      'UPI और ऑनलाइन पेमेंट गेटवे इंटीग्रेशन',
      'टैबलेट लेआउट और Wear OS वॉच सपोर्ट',
      'Play Store रिलीज़ (AAB) में पूरी सहायता',
      'एडवांस्ड एडमिन डैशबोर्ड और प्राथमिकता सपोर्ट',
    ],
    featuresEn: [
      'UPI and online payment gateway integration',
      'Adaptive tablet layout & Wear OS support',
      'Play Store release (AAB) submission guidance',
      'Advanced admin dashboard & rollout support',
    ],
  },
];

const PROCESS_STEPS: ProcessStep[] = [
  {
    step: '01',
    titleHi: 'आइडिया',
    titleEn: 'Idea',
    descHi: 'आपके ऐप का उद्देश्य, मुख्य यूज़र फ़्लो और ज़रूरी फ़ीचर्स तय करना।',
    descEn: 'Defining your app objective, target users, and essential feature scope.',
  },
  {
    step: '02',
    titleHi: 'डिज़ाइन',
    titleEn: 'Design',
    descHi: 'आधुनिक Material You स्क्रीन वायरफ़्रेम और आसान नेविगेशन तैयार करना।',
    descEn: 'Crafting intuitive Material You screens, touch targets, and clear flows.',
  },
  {
    step: '03',
    titleHi: 'डेवलपमेंट',
    titleEn: 'Development',
    descHi: 'Kotlin / Jetpack Compose, क्लाउड बैकएंड और API के साथ ऐप निर्माण।',
    descEn: 'Engineering native modules, cloud APIs, offline storage, and integrations.',
  },
  {
    step: '04',
    titleHi: 'टेस्टिंग',
    titleEn: 'Testing',
    descHi: 'अलग-अलग एंड्रॉइड फ़ोन और स्क्रीन साइज़ पर स्पीड व सुरक्षा की जाँच।',
    descEn: 'Verifying speed, layouts, offline handling, and stability on real screen sizes.',
  },
  {
    step: '05',
    titleHi: 'रिलीज़ और सपोर्ट',
    titleEn: 'Release & Support',
    descHi: 'APK / AAB बिल्ड डिलीवरी, रिलीज़ मार्गदर्शन और आगे के अपडेट्स में सहयोग।',
    descEn: 'Delivering signed APK / AAB builds, launch guidance, and post-launch care.',
  },
];

const TECH_CHIPS = ['Kotlin', 'Jetpack Compose', 'Java', 'Flutter', 'Firebase', 'Room'];

const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'days',
    qHi: 'ऐप कितने दिन में बनता है?',
    qEn: 'How many days does it take to build an app?',
    aHi: 'डेमो संदर्भ के रूप में, एक बेसिक 5-स्क्रीन एंड्रॉइड ऐप लगभग 2 से 3 सप्ताह में और लॉगिन, एडमिन पैनल व पेमेंट वाला पूर्ण बिज़नेस ऐप 4 से 8 सप्ताह में तैयार हो सकता है। वास्तविक समय प्रोजेक्ट के दायरे पर निर्भर करता है।',
    aEn: 'As a general demo reference, a basic 5-screen Android app typically takes 2 to 3 weeks, while a full business app with login, admin panel, and payments takes 4 to 8 weeks depending on scope.',
  },
  {
    id: 'playstore',
    qHi: 'क्या Play Store पर डालेंगे?',
    qEn: 'Will you help publish it on Google Play Store?',
    aHi: 'हाँ, रिलीज़ पैकेज के साथ साइन्ड AAB फ़ाइल, स्क्रीनशॉट गाइड और आपके अपने Google Play Console खाते पर पब्लिश करने की प्रक्रिया में तकनीकी मदद दी जाती है। (यह केवल डेमो जानकारी है।)',
    aEn: 'Yes, release support covers preparing the signed AAB package, store listing checklists, and technical guidance for publishing under your own Google Play Console account. (Demo reference only.)',
  },
  {
    id: 'updates',
    qHi: 'क्या बाद में अपडेट होंगे?',
    qEn: 'Can new features and updates be added later?',
    aHi: 'जी हाँ, ऐप लॉन्च होने के बाद भी नए फ़ीचर, स्क्रीन बदलाव और नए एंड्रॉइड वर्ज़न के अनुसार अपडेट्स जोड़े जा सकते हैं। मॉड्यूलर कोड इसे आसान बनाता है। (नमूना उत्तर)',
    aEn: 'Yes, additional screens, new features, and Android OS compatibility updates can be rolled out anytime after launch thanks to modular architecture. (Sample response.)',
  },
  {
    id: 'source-code',
    qHi: 'सोर्स कोड किसका होगा?',
    qEn: 'Who owns the source code?',
    aHi: 'यह एक डेमो वेबसाइट है। सामान्य प्रोजेक्ट अनुबंध में पूर्ण भुगतान और हैंडओवर के बाद प्रोजेक्ट का सोर्स कोड और बिल्ड फ़ाइलें क्लाइंट के स्वामित्व में रहती हैं।',
    aEn: 'This is a demo showcase. In a standard development engagement, complete source code and release build files are handed over to the client upon project completion.',
  },
];

/**
 * Material You Ripple Button: spawns a smooth pointer-origin radial ripple
 * using transform & opacity only.
 */
const RippleButton: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    rippleColor?: string;
  }
> = ({ children, className = '', onClick, rippleColor = 'rgba(255,255,255,0.32)', ...rest }) => {
  const [ripples, setRipples] = useState<RippleCircle[]>([]);
  const nextId = useRef(0);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (!reduced) {
      const rect = e.currentTarget.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 1.9;
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      const id = ++nextId.current;
      setRipples((prev) => [...prev, { id, x, y, size }]);
      window.setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id));
      }, 520);
    }
    onClick?.(e);
  };

  return (
    <button
      {...rest}
      onClick={handleClick}
      className={`relative overflow-hidden ${className}`}
    >
      {ripples.map((r) => (
        <span
          key={r.id}
          aria-hidden="true"
          style={{
            left: r.x,
            top: r.y,
            width: r.size,
            height: r.size,
            backgroundColor: rippleColor,
          }}
          className="pointer-events-none absolute rounded-full animate-[mobRipple_500ms_ease-out_forwards]"
        />
      ))}
      <span className="relative z-10 inline-flex items-center justify-center gap-2">
        {children}
      </span>
    </button>
  );
};

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

export const MobileSystemDemo: React.FC<MobileSystemDemoProps> = ({
  onBackToHome,
  onRequestQuote,
}) => {
  const { language, toggleLanguage } = useLanguage();
  const isHi = language === 'hi';

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeServiceModal, setActiveServiceModal] = useState<AndroidService | null>(null);
  const [activeNodeId, setActiveNodeId] = useState<string>('tablet');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [openFaqId, setOpenFaqId] = useState<string>('days');
  const [demoToast, setDemoToast] = useState<string | null>(null);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  // Local-only consultation form state (ZERO Firestore / ZERO API calls)
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    appType: '',
    budget: '',
    message: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);

  useEffect(() => {
    if (!demoToast) return;
    const timer = window.setTimeout(() => setDemoToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [demoToast]);

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

  const activeNode =
    ANDROID_NODES.find((n) => n.id === activeNodeId) || ANDROID_NODES[0];

  const handleSelectPackage = (pkg: AppPackage) => {
    setFormData((prev) => ({
      ...prev,
      budget: pkg.budgetValue,
      message: isHi
        ? `${pkg.nameHi} (${pkg.price}) के लिए ऐप डेवलपमेंट की जानकारी चाहिए।`
        : `Interested in the ${pkg.nameEn} (${pkg.price}) Android app package.`,
    }));
    setFormError(null);
    setFormSuccess(false);
    scrollToSection('mob-contact');
  };

  const handleServiceConsult = (service: AndroidService) => {
    setActiveServiceModal(null);
    setFormData((prev) => ({
      ...prev,
      message: isHi
        ? `${service.titleHi} सेवा के बारे में फ़्री कंसल्टेशन चाहिए।`
        : `I would like a free consultation regarding ${service.titleEn}.`,
    }));
    setFormError(null);
    setFormSuccess(false);
    scrollToSection('mob-contact');
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(false);

    const trimmedName = formData.name.trim();
    const digitsOnly = formData.mobile.replace(/\D/g, '');
    const trimmedMessage = formData.message.trim();

    if (trimmedName.length < 2) {
      setFormError(isHi ? 'कृपया अपना सही नाम लिखें।' : 'Please enter your full name.');
      return;
    }
    if (digitsOnly.length < 10) {
      setFormError(
        isHi ? 'कृपया 10 अंकों का सही मोबाइल नंबर दर्ज करें।' : 'Please enter a valid 10-digit mobile number.'
      );
      return;
    }
    if (!formData.appType) {
      setFormError(isHi ? 'कृपया ऐप का प्रकार चुनें।' : 'Please select the type of app.');
      return;
    }
    if (!formData.budget) {
      setFormError(isHi ? 'कृपया अनुमानित बजट चुनें।' : 'Please select an estimated budget.');
      return;
    }
    if (trimmedMessage.length < 5) {
      setFormError(
        isHi ? 'कृपया अपने ऐप आइडिया के बारे में संक्षिप्त संदेश लिखें।' : 'Please enter a short message about your app idea.'
      );
      return;
    }

    // Strictly local state — NO Firestore write and NO API call
    setFormSuccess(true);
  };

  const renderNodeIcon = (icon: AndroidNode['icon'], className = 'w-5 h-5') => {
    switch (icon) {
      case 'tablet':
        return <Tablet className={className} />;
      case 'watch':
        return <Watch className={className} />;
      case 'cloud':
        return <Cloud className={className} />;
      case 'payment':
        return <CreditCard className={className} />;
      case 'bell':
        return <Bell className={className} />;
      case 'offline':
        return <WifiOff className={className} />;
    }
  };

  const renderFeatureIcon = (icon: AppFeature['icon']) => {
    const cls = 'w-5 h-5';
    switch (icon) {
      case 'code':
        return <Code2 className={cls} />;
      case 'palette':
        return <Palette className={cls} />;
      case 'offline':
        return <WifiOff className={cls} />;
      case 'bell':
        return <Bell className={cls} />;
      case 'lang':
        return <Languages className={cls} />;
      case 'rocket':
        return <Rocket className={cls} />;
    }
  };

  const navLinks = [
    { id: 'mob-home', hi: 'होम', en: 'Home' },
    { id: 'mob-services', hi: 'सेवाएँ', en: 'Services' },
    { id: 'mob-apps', hi: 'ऐप्स', en: 'Apps' },
    { id: 'mob-packages', hi: 'पैकेज', en: 'Packages' },
    { id: 'mob-process', hi: 'प्रक्रिया', en: 'Process' },
    { id: 'mob-contact', hi: 'संपर्क', en: 'Contact' },
  ];

  return (
    <div className="min-h-screen bg-[#0b1114] text-slate-100 antialiased selection:bg-[#3DDC84] selection:text-[#06140d]">
      {/* Scoped keyframes for Material Ripple and Hero Phone Float */}
      <style>{`
        @keyframes mobRipple {
          0% { transform: scale(0); opacity: 0.65; }
          100% { transform: scale(1); opacity: 0; }
        }
        @keyframes mobPhoneFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .mob-float-phone { animation: none !important; }
        }
      `}</style>

      {/* Unified Sticky Top Wrapper (DEMO Strip + Material You Header) */}
      <div className="sticky top-0 z-40">
        {/* Top DEMO Disclaimer Bar */}
        <div className="bg-[#0e191e] border-b border-[#3DDC84]/25 px-3 sm:px-6 py-2">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="inline-block px-2 py-0.5 rounded-md bg-[#3DDC84]/15 border border-[#3DDC84]/35 text-[10px] font-bold tracking-wider text-[#3DDC84] uppercase shrink-0">
                DEMO
              </span>
              <p className="text-[11px] sm:text-xs font-medium text-slate-200 truncate">
                {isHi
                  ? 'DEMO वेबसाइट — यह केवल नमूना है'
                  : 'DEMO Website — This is a sample preview only'}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={toggleLanguage}
                className="px-2.5 py-1 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-[11px] font-semibold text-slate-100 transition-colors cursor-pointer whitespace-nowrap"
                aria-label={isHi ? 'Switch to English' : 'हिंदी में बदलें'}
              >
                {isHi ? 'EN' : 'हिन्दी'}
              </button>
              <button
                type="button"
                onClick={onBackToHome}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] sm:text-xs font-semibold text-white transition-colors cursor-pointer whitespace-nowrap"
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

        {/* Agency Navigation Bar */}
        <header className="bg-[#0b1114]/90 backdrop-blur-xl border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
            {/* Brand Wordmark (Generic Smartphone icon — zero third-party logo) */}
            <button
              type="button"
              onClick={() => scrollToSection('mob-home')}
              className="flex items-center gap-2.5 text-left cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3DDC84] rounded-xl"
            >
              <span className="w-9 h-9 rounded-2xl bg-[#3DDC84] text-[#06140d] flex items-center justify-center shadow-[0_0_18px_rgba(61,220,132,0.3)]">
                <Smartphone className="w-5 h-5" />
              </span>
              <span className="text-base sm:text-lg font-extrabold tracking-tight text-white">
                MOBILE SYSTEM
              </span>
            </button>

            {/* Desktop Nav Links */}
            <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-300">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => scrollToSection(link.id)}
                  className="hover:text-[#3DDC84] transition-colors cursor-pointer whitespace-nowrap shrink-0 py-1"
                >
                  {isHi ? link.hi : link.en}
                </button>
              ))}
            </nav>

            {/* Right CTA & Mobile Menu Toggle */}
            <div className="flex items-center gap-2.5 shrink-0">
              <RippleButton
                type="button"
                rippleColor="rgba(6,20,13,0.22)"
                onClick={() => scrollToSection('mob-contact')}
                className="hidden sm:inline-flex px-5 py-2.5 rounded-full bg-[#3DDC84] hover:bg-[#52e695] text-[#06140d] text-xs sm:text-sm font-bold transition-colors cursor-pointer whitespace-nowrap"
              >
                {isHi ? 'ऐप बनवाएँ' : 'Build an App'}
              </RippleButton>
              <button
                type="button"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                className="lg:hidden w-10 h-10 rounded-2xl border border-white/15 bg-white/5 hover:bg-white/10 flex items-center justify-center text-white cursor-pointer"
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Drawer */}
          {mobileMenuOpen && (
            <div className="lg:hidden border-t border-white/10 bg-[#0e171b] px-4 py-4 space-y-2">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => scrollToSection(link.id)}
                  className="block w-full text-left px-3.5 py-2.5 rounded-2xl text-sm font-medium text-slate-200 hover:bg-white/10 hover:text-[#3DDC84] transition-colors cursor-pointer"
                >
                  {isHi ? link.hi : link.en}
                </button>
              ))}
              <RippleButton
                type="button"
                rippleColor="rgba(6,20,13,0.22)"
                onClick={() => scrollToSection('mob-contact')}
                className="w-full mt-2 px-4 py-3 rounded-full bg-[#3DDC84] text-[#06140d] text-sm font-bold cursor-pointer"
              >
                {isHi ? 'ऐप बनवाएँ' : 'Build an App'}
              </RippleButton>
            </div>
          )}
        </header>
      </div>

      {/* 1. HERO SECTION (hero.jpg dark overlay + floating CSS Phone Frame with work-food.jpg) */}
      <section
        id="mob-home"
        className="relative overflow-hidden border-b border-white/10 py-16 sm:py-24"
      >
        <div className="absolute inset-0">
          {!brokenImages['hero'] ? (
            <img
              src="/demo/mobile-system/hero.jpg"
              alt={isHi ? 'मोबाइल सिस्टम एंड्रॉइड ऐप स्टूडियो' : 'Mobile System Android App Studio'}
              referrerPolicy="no-referrer"
              onError={() => markImageBroken('hero')}
              className="w-full h-full object-cover object-center"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#0b1114] via-[#102026] to-[#0c1a2e]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0b1114]/96 via-[#0b1114]/86 to-[#0b1724]/75" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b1114] via-transparent to-[#0b1114]/45" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Copy Column */}
          <div className="lg:col-span-7 space-y-6">
            <p className="text-xs sm:text-sm font-semibold tracking-wide text-[#3DDC84]">
              {isHi
                ? 'नेटिव और आधुनिक एंड्रॉइड इकोसिस्टम'
                : 'Native & Modern Android Ecosystem'}
            </p>

            <h1 className="text-3xl sm:text-5xl lg:text-[3.5rem] font-extrabold tracking-tight text-white leading-[1.12] [text-wrap:balance]">
              {isHi
                ? 'आपके बिज़नेस का अपना एंड्रॉइड ऐप'
                : "Your Business's Own Android App"}
            </h1>

            <p className="text-base sm:text-xl font-medium text-slate-200 max-w-2xl leading-relaxed">
              {isHi
                ? 'तेज़, सुरक्षित, नेटिव — फ़ोन, टैबलेट और वॉच तक'
                : 'Fast, Secure, Native — Across Phone, Tablet & Watch'}
            </p>

            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <RippleButton
                type="button"
                rippleColor="rgba(6,20,13,0.25)"
                onClick={() => scrollToSection('mob-contact')}
                className="px-6 py-3.5 rounded-full bg-[#3DDC84] hover:bg-[#52e695] text-[#06140d] text-sm sm:text-base font-bold transition-all shadow-[0_0_24px_rgba(61,220,132,0.28)] cursor-pointer whitespace-nowrap"
              >
                {isHi ? 'फ़्री कंसल्टेशन' : 'Free Consultation'}
                <ArrowRight className="w-4 h-4" />
              </RippleButton>

              <RippleButton
                type="button"
                onClick={() => scrollToSection('mob-services')}
                className="px-6 py-3.5 rounded-full bg-white/[0.07] hover:bg-white/[0.14] backdrop-blur-md border border-white/15 text-white text-sm sm:text-base font-semibold transition-colors cursor-pointer whitespace-nowrap"
              >
                {isHi ? 'हमारी सेवाएँ' : 'Our Services'}
              </RippleButton>
            </div>
          </div>

          {/* Right Floating CSS Phone Frame displaying work-food.jpg */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <button
              type="button"
              onClick={() => setLightboxIndex(0)}
              aria-label={isHi ? 'फ़ूड डिलीवरी नमूना ऐप प्रीव्यू देखें' : 'Preview sample food delivery app'}
              className="mob-float-phone group relative w-[250px] sm:w-[276px] rounded-[42px] p-3 bg-[#151e24] border-[3px] border-slate-600/70 shadow-[0_24px_60px_rgba(0,0,0,0.65),0_0_40px_rgba(61,220,132,0.16)] transition-transform duration-300 hover:scale-[1.02] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3DDC84]"
              style={{ animation: 'mobPhoneFloat 4.6s ease-in-out infinite' }}
            >
              {/* Side Hardware Accent Bars */}
              <span
                aria-hidden="true"
                className="absolute -right-[5px] top-24 w-[3px] h-12 rounded-r bg-slate-500/80"
              />
              <span
                aria-hidden="true"
                className="absolute -right-[5px] top-40 w-[3px] h-8 rounded-r bg-slate-500/80"
              />

              {/* Inner Phone Screen */}
              <div className="relative rounded-[32px] overflow-hidden bg-[#0a0f12] aspect-[9/17.5] border border-white/10">
                {/* Punch-hole camera & clean top status bar */}
                <div className="absolute top-0 inset-x-0 z-20 px-4 pt-2.5 pb-1.5 flex items-center justify-between text-[10px] font-semibold text-white/90 bg-gradient-to-b from-black/75 to-transparent">
                  <span className="tabular-nums">9:41</span>
                  <span aria-hidden="true" className="w-3 h-3 rounded-full bg-black border border-slate-700" />
                  <span className="text-[#3DDC84] font-bold">5G</span>
                </div>

                {!brokenImages['hero-phone'] ? (
                  <img
                    src="/demo/mobile-system/work-food.jpg"
                    alt={isHi ? 'फ़ूड डिलीवरी एंड्रॉइड ऐप स्क्रीन' : 'Food Delivery Android App Preview'}
                    referrerPolicy="no-referrer"
                    onError={() => markImageBroken('hero-phone')}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#121d23] text-[#3DDC84] text-xs font-semibold p-4 text-center">
                    {isHi ? 'फ़ूड डिलीवरी नमूना ऐप' : 'Sample Food Delivery App'}
                  </div>
                )}

                {/* Bottom Overlay Label + Material Gesture Pill */}
                <div className="absolute inset-x-0 bottom-0 z-20 p-3.5 pt-10 bg-gradient-to-t from-[#0b1114]/95 via-[#0b1114]/65 to-transparent text-left">
                  <p className="text-[10px] font-semibold text-[#3DDC84]">
                    {isHi ? 'नमूना डिज़ाइन' : 'Sample Design'}
                  </p>
                  <p className="text-xs font-bold text-white mt-0.5">
                    {isHi ? 'फ़ूड डिलीवरी एंड्रॉइड ऐप' : 'Food Delivery Android App'}
                  </p>
                  <div aria-hidden="true" className="mt-2.5 mx-auto w-20 h-1 rounded-full bg-white/60" />
                </div>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* 2. SERVICES SECTION (6 Real Photo Cards — Material You Large Radius) */}
      <RevealSection id="mob-services" className="py-16 sm:py-24 px-4 sm:px-6 border-b border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl mb-12 space-y-3">
            <p className="text-xs sm:text-sm font-semibold text-[#3DDC84]">
              {isHi ? 'एंड्रॉइड डेवलपमेंट सेवाएँ' : 'Android Development Services'}
            </p>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white [text-wrap:balance]">
              {isHi
                ? 'फ़ोन, टैबलेट और स्मार्टवॉच के लिए संपूर्ण ऐप समाधान'
                : 'End-to-End Mobile Solutions Across Phone, Tablet & Watch'}
            </h2>
            <p className="text-sm sm:text-base text-slate-300">
              {isHi
                ? 'किसी भी सेवा पर “और जानें” दबाकर काम का पूरा दायरा देखें।'
                : 'Tap “Learn More” on any card to inspect the full technical scope.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.map((service) => (
              <article
                key={service.id}
                className="group rounded-[28px] bg-[#131d22] border border-white/10 hover:border-[#3DDC84]/45 overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-0.5"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-[#0e161a]">
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
                    <div className="w-full h-full flex items-center justify-center bg-[#122026] text-[#3DDC84] text-sm font-semibold">
                      {isHi ? service.titleHi : service.titleEn}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#131d22]/75 via-transparent to-transparent" />
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between gap-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-white tracking-tight">
                      {service.number}. {isHi ? service.titleHi : service.titleEn}
                    </h3>
                    <p className="text-sm text-slate-300 leading-relaxed line-clamp-2">
                      {isHi ? service.shortDescHi : service.shortDescEn}
                    </p>
                  </div>

                  <div>
                    <RippleButton
                      type="button"
                      onClick={() => setActiveServiceModal(service)}
                      className="px-4 py-2 rounded-full bg-white/[0.06] hover:bg-[#3DDC84]/15 border border-white/10 hover:border-[#3DDC84]/40 text-xs sm:text-sm font-semibold text-[#3DDC84] transition-colors cursor-pointer"
                    >
                      {isHi ? 'और जानें' : 'Learn More'}
                      <ArrowRight className="w-4 h-4" />
                    </RippleButton>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* 3. INTERACTIVE "एंड्रॉइड इकोसिस्टम" HUB */}
      <RevealSection
        id="mob-ecosystem"
        className="py-16 sm:py-24 px-4 sm:px-6 border-b border-white/10 bg-[#0e161a]"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <p className="text-xs sm:text-sm font-semibold text-[#3DDC84]">
              {isHi ? 'एंड्रॉइड इकोसिस्टम' : 'Android Ecosystem'}
            </p>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white [text-wrap:balance]">
              {isHi
                ? 'एक फ़ोन ऐप से जुड़ा पूरा मल्टी-डिवाइस नेटवर्क'
                : 'One Core Phone App Connected Across Every Device Layer'}
            </h2>
            <p className="text-sm sm:text-base text-slate-300">
              {isHi
                ? 'किसी भी नोड पर टैप करें और देखें कि वह आपके एंड्रॉइड ऐप के साथ कैसे काम करता है।'
                : 'Select any connected node to inspect how it syncs with your Android app.'}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Desktop / Tablet Orbital Diagram */}
            <div className="lg:col-span-7">
              <div className="relative mx-auto w-full max-w-[520px] aspect-square hidden sm:block">
                <svg
                  viewBox="0 0 500 500"
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  aria-hidden="true"
                >
                  <defs>
                    <linearGradient id="mobEcoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#3DDC84" />
                      <stop offset="100%" stopColor="#38BDF8" />
                    </linearGradient>
                  </defs>
                  <circle
                    cx="250"
                    cy="250"
                    r="172"
                    fill="none"
                    stroke="rgba(61, 220, 132, 0.18)"
                    strokeWidth="1.25"
                    strokeDasharray="4 6"
                  />
                  {ANDROID_NODES.map((node) => {
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
                          stroke={isSelected ? 'url(#mobEcoGrad)' : 'rgba(148, 163, 184, 0.24)'}
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
                          fill={isSelected ? '#3DDC84' : '#475569'}
                        />
                      </g>
                    );
                  })}
                </svg>

                {/* Center Phone Icon Hub */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-36 rounded-[36px] bg-gradient-to-br from-[#3DDC84] to-[#2563EB] border border-white/25 shadow-[0_0_45px_rgba(61,220,132,0.32)] flex flex-col items-center justify-center text-center px-3 text-[#06140d]">
                  <Smartphone className="w-8 h-8 mb-1.5" />
                  <span className="text-sm font-extrabold leading-tight">
                    {isHi ? 'एंड्रॉइड फ़ोन' : 'Android Phone'}
                  </span>
                </div>

                {/* 6 Connected Orbital Nodes */}
                {ANDROID_NODES.map((node) => {
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
                      className={`absolute -translate-x-1/2 -translate-y-1/2 px-4 py-2.5 rounded-full border transition-all duration-200 flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                        isSelected
                          ? 'bg-[#3DDC84]/20 border-[#3DDC84] text-white shadow-[0_0_24px_rgba(61,220,132,0.35)] scale-105'
                          : 'bg-[#131d22]/95 border-white/15 text-slate-200 hover:border-[#3DDC84]/50 hover:text-white'
                      }`}
                    >
                      <span className="text-[#3DDC84]">{renderNodeIcon(node.icon, 'w-4 h-4')}</span>
                      <span className="text-xs sm:text-sm font-semibold">
                        {isHi ? node.labelHi : node.labelEn}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Mobile Compact Hub */}
              <div className="sm:hidden space-y-4">
                <div className="mx-auto w-32 h-32 rounded-[32px] bg-gradient-to-br from-[#3DDC84] to-[#2563EB] flex flex-col items-center justify-center text-center px-3 text-[#06140d] shadow-[0_0_32px_rgba(61,220,132,0.28)]">
                  <Smartphone className="w-7 h-7 mb-1" />
                  <span className="text-xs font-extrabold">
                    {isHi ? 'एंड्रॉइड फ़ोन' : 'Android Phone'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  {ANDROID_NODES.map((node) => {
                    const isSelected = node.id === activeNode.id;
                    return (
                      <button
                        key={node.id}
                        type="button"
                        onClick={() => setActiveNodeId(node.id)}
                        className={`px-3.5 py-3 rounded-2xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#3DDC84]/20 border-[#3DDC84] text-white'
                            : 'bg-[#131d22] border-white/10 text-slate-200'
                        }`}
                      >
                        <span className="text-[#3DDC84] shrink-0">
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
              <div className="rounded-[28px] bg-[#131d22] border border-white/10 p-6 sm:p-8 space-y-5">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-[#3DDC84]/15 border border-[#3DDC84]/35 flex items-center justify-center text-[#3DDC84]">
                    {renderNodeIcon(activeNode.icon, 'w-6 h-6')}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#38BDF8]">
                      {isHi ? 'जुड़ा हुआ मॉड्यूल' : 'Connected Module'}
                    </p>
                    <h3 className="text-xl font-bold text-white">
                      {isHi ? activeNode.labelHi : activeNode.labelEn}
                    </h3>
                  </div>
                </div>

                <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
                  {isHi ? activeNode.detailHi : activeNode.detailEn}
                </p>

                <div className="pt-4 border-t border-white/10 text-xs sm:text-sm text-slate-400 leading-relaxed">
                  {isHi
                    ? 'एंड्रॉइड फ़ोन, टैबलेट, स्मार्टवॉच, क्लाउड और ऑफ़लाइन कैश एक साथ जुड़कर ग्राहक व स्टाफ़ दोनों को तेज़ अनुभव देते हैं।'
                    : 'Phone, tablet, Wear OS, cloud backend, and offline storage operate together for a unified user and operator workflow.'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </RevealSection>

      {/* 4. "हमारे ऐप्स" PORTFOLIO (4 Apps, 3 Feature Chips each, "नमूना डिज़ाइन" tag, Lightbox — NO Play Store availability claims) */}
      <RevealSection id="mob-apps" className="py-16 sm:py-24 px-4 sm:px-6 border-b border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl mb-12 space-y-3">
            <p className="text-xs sm:text-sm font-semibold text-[#3DDC84]">
              {isHi ? 'हमारे ऐप्स (पोर्टफ़ोलियो)' : 'Our Sample Apps'}
            </p>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white [text-wrap:balance]">
              {isHi ? 'विभिन्न व्यवसायों के लिए नमूना एंड्रॉइड ऐप्स' : 'Sample Android App Concepts Across Industries'}
            </h2>
            <p className="text-sm sm:text-base text-slate-300">
              {isHi
                ? 'किसी भी कार्ड पर टैप करके बड़ा प्रीव्यू और स्क्रीन विशेषताएँ देखें।'
                : 'Tap any app showcase card to view the full preview and feature highlights.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {APP_PORTFOLIO.map((app, index) => (
              <button
                key={app.id}
                type="button"
                onClick={() => setLightboxIndex(index)}
                className="group text-left rounded-[28px] bg-[#131d22] border border-white/10 hover:border-[#3DDC84]/45 overflow-hidden transition-all duration-200 hover:-translate-y-0.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3DDC84]"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-[#0e161a]">
                  {!brokenImages[app.id] ? (
                    <img
                      src={app.image}
                      alt={isHi ? app.titleHi : app.titleEn}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      onError={() => markImageBroken(app.id)}
                      className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#122026] text-[#3DDC84] text-sm font-semibold">
                      {isHi ? app.titleHi : app.titleEn}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#131d22]/85 via-transparent to-transparent" />
                  <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-[#0b1114]/85 backdrop-blur-md border border-[#3DDC84]/35 text-[11px] font-semibold text-[#3DDC84]">
                    {isHi ? 'नमूना डिज़ाइन' : 'Sample Design'}
                  </div>
                </div>

                <div className="p-6 space-y-3.5">
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
                    <span>{isHi ? app.categoryHi : app.categoryEn}</span>
                    <span className="text-[#38BDF8] font-medium">
                      {isHi ? 'प्रीव्यू खोलें →' : 'Open Preview →'}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white">
                    {isHi ? app.titleHi : app.titleEn}
                  </h3>

                  <p className="text-sm text-slate-300 leading-relaxed">
                    {isHi ? app.summaryHi : app.summaryEn}
                  </p>

                  {/* 3 Feature Chips per Card */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {(isHi ? app.chipsHi : app.chipsEn).map((chip) => (
                      <span
                        key={chip}
                        className="px-3 py-1 rounded-full bg-white/[0.06] border border-white/10 text-xs font-medium text-slate-200"
                      >
                        {chip}
                      </span>
                    ))}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* 5. FEATURE GRID (6 Material You Icon Cards) */}
      <RevealSection className="py-16 sm:py-24 px-4 sm:px-6 border-b border-white/10 bg-[#0e161a]">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl mb-12 space-y-3">
            <p className="text-xs sm:text-sm font-semibold text-[#38BDF8]">
              {isHi ? 'तकनीकी खूबियाँ' : 'Built-In Capabilities'}
            </p>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white [text-wrap:balance]">
              {isHi ? 'आधुनिक एंड्रॉइड ऐप की हर ज़रूरी सुविधा' : 'Everything Expected in a Modern Android App'}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {APP_FEATURES.map((feat) => (
              <div
                key={feat.id}
                className="rounded-[28px] bg-[#131d22] border border-white/10 p-6 space-y-3.5"
              >
                <div className="w-11 h-11 rounded-2xl bg-[#3DDC84]/15 border border-[#3DDC84]/30 text-[#3DDC84] flex items-center justify-center">
                  {renderFeatureIcon(feat.icon)}
                </div>
                <h3 className="text-lg font-bold text-white">
                  {isHi ? feat.titleHi : feat.titleEn}
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {isHi ? feat.descHi : feat.descEn}
                </p>
              </div>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* 6. SAMPLE PACKAGES (3 Cards, middle "लोकप्रिय", top "नमूना कीमतें — डेमो") */}
      <RevealSection id="mob-packages" className="py-16 sm:py-24 px-4 sm:px-6 border-b border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <p className="text-xs sm:text-sm font-semibold text-amber-300">
              {isHi ? 'नमूना कीमतें — डेमो' : 'Sample Pricing — Demo Only'}
            </p>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white [text-wrap:balance]">
              {isHi ? 'एंड्रॉइड ऐप पैकेज विकल्प' : 'Sample Android App Packages'}
            </h2>
            <p className="text-sm sm:text-base text-slate-300">
              {isHi
                ? 'यहाँ दिखाई गई दरें केवल डेमो उदाहरण हैं। वास्तविक बजट ऐप के फ़ीचर्स के आधार पर तय होता है।'
                : 'Figures below are sample demo prices only. Real project quotes depend on custom requirements.'}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            {PACKAGES.map((pkg) => (
              <div
                key={pkg.id}
                className={`rounded-[28px] p-6 sm:p-8 flex flex-col justify-between transition-all duration-200 ${
                  pkg.highlighted
                    ? 'bg-gradient-to-b from-[#132924] to-[#111b22] border-2 border-[#3DDC84]/75 shadow-[0_0_36px_rgba(61,220,132,0.16)]'
                    : 'bg-[#131d22] border border-white/10'
                }`}
              >
                <div className="space-y-5">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xl font-bold text-white">
                      {isHi ? pkg.nameHi : pkg.nameEn}
                    </h3>
                    {pkg.highlighted && (
                      <span className="px-3 py-1 rounded-full bg-[#3DDC84] text-[#06140d] text-[11px] font-extrabold whitespace-nowrap">
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
                      {isHi ? 'नमूना कीमतें — डेमो' : 'Sample Pricing — Demo'}
                    </p>
                  </div>

                  <ul className="space-y-3">
                    {(isHi ? pkg.featuresHi : pkg.featuresEn).map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-200">
                        <Check className="w-4 h-4 text-[#3DDC84] shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-8">
                  <RippleButton
                    type="button"
                    rippleColor={pkg.highlighted ? 'rgba(6,20,13,0.22)' : 'rgba(255,255,255,0.25)'}
                    onClick={() => handleSelectPackage(pkg)}
                    className={`w-full py-3.5 px-5 rounded-full text-sm font-bold transition-colors cursor-pointer ${
                      pkg.highlighted
                        ? 'bg-[#3DDC84] hover:bg-[#52e695] text-[#06140d]'
                        : 'bg-white/[0.08] hover:bg-white/[0.15] border border-white/15 text-white'
                    }`}
                  >
                    {isHi ? 'इस पैकेज पर चर्चा करें' : 'Discuss This Package'}
                  </RippleButton>
                </div>
              </div>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* 7. 5-STEP PROCESS TIMELINE */}
      <RevealSection
        id="mob-process"
        className="py-16 sm:py-24 px-4 sm:px-6 border-b border-white/10 bg-[#0e161a]"
      >
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl mb-12 space-y-3">
            <p className="text-xs sm:text-sm font-semibold text-[#3DDC84]">
              {isHi ? 'ऐप निर्माण प्रक्रिया' : 'App Delivery Process'}
            </p>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white [text-wrap:balance]">
              {isHi ? 'आइडिया से ऐप लॉन्च तक 5 स्पष्ट चरण' : 'Five Structured Stages from Idea to Release'}
            </h2>
          </div>

          <div className="relative">
            <div
              aria-hidden="true"
              className="hidden lg:block absolute top-6 left-10 right-10 h-[2px] bg-gradient-to-r from-[#3DDC84]/45 via-[#38BDF8]/55 to-[#3DDC84]/45"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
              {PROCESS_STEPS.map((step) => (
                <div
                  key={step.step}
                  className="relative rounded-[26px] bg-[#131d22] border border-white/10 p-5 space-y-3"
                >
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#3DDC84] to-[#2563EB] flex items-center justify-center text-sm font-extrabold text-[#06140d] tabular-nums">
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

      {/* 8. TECHNOLOGY STRIP (Text Chips Only — No Logo Images) */}
      <RevealSection className="py-12 sm:py-16 px-4 sm:px-6 border-b border-white/10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-[#38BDF8]">
              {isHi ? 'एंड्रॉइड टेक्नोलॉजी स्टैक' : 'Android Technology Stack'}
            </p>
            <h2 className="text-lg sm:text-xl font-bold text-white">
              {isHi ? 'आधुनिक टूल्स और लाइब्रेरीज़' : 'Modern Native Tools & Libraries'}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            {TECH_CHIPS.map((tech) => (
              <span
                key={tech}
                className="px-4 py-2 rounded-full bg-[#131d22] border border-white/12 text-sm font-semibold text-slate-100"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* 9. FAQ ACCORDION (4 Questions) */}
      <RevealSection className="py-16 sm:py-24 px-4 sm:px-6 border-b border-white/10 bg-[#0e161a]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10 space-y-3">
            <p className="text-xs sm:text-sm font-semibold text-[#3DDC84]">
              {isHi ? 'सामान्य प्रश्न (FAQ)' : 'Frequently Asked Questions'}
            </p>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white [text-wrap:balance]">
              {isHi ? 'एंड्रॉइड ऐप बनवाने से जुड़े ज़रूरी सवाल' : 'Common Android App Development Questions'}
            </h2>
          </div>

          <div className="space-y-3">
            {FAQ_ITEMS.map((faq) => {
              const isOpen = openFaqId === faq.id;
              return (
                <div
                  key={faq.id}
                  className="rounded-3xl bg-[#131d22] border border-white/10 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqId(isOpen ? '' : faq.id)}
                    aria-expanded={isOpen}
                    className="w-full px-6 py-4.5 flex items-center justify-between gap-4 text-left cursor-pointer hover:bg-white/[0.03] transition-colors"
                  >
                    <span className="text-sm sm:text-base font-semibold text-white">
                      {isHi ? faq.qHi : faq.qEn}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-[#3DDC84] shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 pt-1 text-sm text-slate-300 leading-relaxed border-t border-white/5">
                      {isHi ? faq.aHi : faq.aEn}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </RevealSection>

      {/* 10. CONSULTATION FORM + DEMO CONTACT DETAILS */}
      <RevealSection id="mob-contact" className="py-16 sm:py-24 px-4 sm:px-6 border-b border-white/10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Contact Details Column */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-3">
              <p className="text-xs sm:text-sm font-semibold text-[#3DDC84]">
                {isHi ? 'कंसल्टेशन और संपर्क' : 'Consultation & Contact'}
              </p>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white [text-wrap:balance]">
                {isHi ? 'अपने एंड्रॉइड ऐप की योजना बनाएँ' : 'Plan Your Android App Today'}
              </h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                {isHi
                  ? 'यह फ़ॉर्म केवल डेमो अनुभव के लिए है। सबमिट करने पर कोई भी डेटा Firestore या किसी सर्वर में सेव नहीं होता।'
                  : 'This form is strictly for interactive demo preview. No submissions are saved to Firestore or any server.'}
              </p>
            </div>

            <div className="rounded-[28px] bg-[#131d22] border border-white/10 p-6 space-y-5">
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
                  <Phone className="w-5 h-5 text-[#3DDC84] shrink-0 mt-0.5" />
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
                  <Mail className="w-5 h-5 text-[#38BDF8] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-400">
                      {isHi ? 'ईमेल (डेमो जानकारी)' : 'Email (Demo Information)'}
                    </p>
                    <p className="text-sm sm:text-base font-semibold text-white break-all">
                      hello@mobile-system.example
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-start gap-2 text-xs text-slate-400">
                <Info className="w-4 h-4 text-[#3DDC84] shrink-0 mt-0.5" />
                <span>
                  {isHi
                    ? 'असली वेबसाइट या ऐप बनवाने के लिए नीचे दिए “ऐसी वेबसाइट अपने बिज़नेस के लिए बनवाएँ” बटन पर क्लिक करें।'
                    : 'To request a real project for your business, use the CTA button at the bottom of this page.'}
                </span>
              </div>
            </div>
          </div>

          {/* Local Consultation Form */}
          <div className="lg:col-span-7">
            <form
              onSubmit={handleFormSubmit}
              noValidate
              className="rounded-[28px] bg-[#131d22] border border-white/10 p-6 sm:p-8 space-y-5"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="mob-name" className="block text-xs sm:text-sm font-medium text-slate-200">
                    {isHi ? 'नाम *' : 'Full Name *'}
                  </label>
                  <input
                    id="mob-name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={isHi ? 'आपका नाम लिखें' : 'Enter your name'}
                    className="w-full px-4 py-3 rounded-2xl bg-[#0b1114] border border-white/15 focus:border-[#3DDC84] focus:outline-none text-sm text-white placeholder:text-slate-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="mob-mobile" className="block text-xs sm:text-sm font-medium text-slate-200">
                    {isHi ? 'मोबाइल नंबर *' : 'Mobile Number *'}
                  </label>
                  <input
                    id="mob-mobile"
                    type="tel"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    placeholder={isHi ? '10 अंकों का मोबाइल नंबर' : '10-digit mobile number'}
                    className="w-full px-4 py-3 rounded-2xl bg-[#0b1114] border border-white/15 focus:border-[#3DDC84] focus:outline-none text-sm text-white placeholder:text-slate-500 tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="mob-app-type" className="block text-xs sm:text-sm font-medium text-slate-200">
                    {isHi ? 'ऐप का प्रकार *' : 'App Type *'}
                  </label>
                  <select
                    id="mob-app-type"
                    value={formData.appType}
                    onChange={(e) => setFormData({ ...formData, appType: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-[#0b1114] border border-white/15 focus:border-[#3DDC84] focus:outline-none text-sm text-white"
                  >
                    <option value="">{isHi ? 'ऐप का प्रकार चुनें' : 'Select app type'}</option>
                    <option value="food-grocery">{isHi ? 'फ़ूड / ग्रोसरी डिलीवरी ऐप' : 'Food / Grocery Delivery App'}</option>
                    <option value="ecommerce">{isHi ? 'ऑनलाइन शॉपिंग / स्टोर ऐप' : 'E-Commerce / Store App'}</option>
                    <option value="education">{isHi ? 'ऑनलाइन क्लास / स्कूल ऐप' : 'Online Class / School App'}</option>
                    <option value="booking">{isHi ? 'टैक्सी / सर्विस बुकिंग ऐप' : 'Taxi / Service Booking App'}</option>
                    <option value="admin-tablet">{isHi ? 'एडमिन डैशबोर्ड / टैबलेट ऐप' : 'Admin Dashboard / Tablet App'}</option>
                    <option value="wearable">{isHi ? 'स्मार्टवॉच / Wear OS कंपैनियन' : 'Smartwatch / Wear OS App'}</option>
                    <option value="custom">{isHi ? 'अन्य कस्टम एंड्रॉइड ऐप' : 'Other Custom Android App'}</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="mob-budget" className="block text-xs sm:text-sm font-medium text-slate-200">
                    {isHi ? 'अनुमानित बजट *' : 'Estimated Budget *'}
                  </label>
                  <select
                    id="mob-budget"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-[#0b1114] border border-white/15 focus:border-[#3DDC84] focus:outline-none text-sm text-white"
                  >
                    <option value="">{isHi ? 'बजट चुनें' : 'Select budget range'}</option>
                    <option value="basic-14999">
                      {isHi ? 'बेसिक ऐप — लगभग ₹14,999 (डेमो)' : 'Basic App — Approx. ₹14,999 (Demo)'}
                    </option>
                    <option value="business-39999">
                      {isHi ? 'बिज़नेस ऐप — लगभग ₹39,999 (डेमो)' : 'Business App — Approx. ₹39,999 (Demo)'}
                    </option>
                    <option value="premium-79999">
                      {isHi ? 'प्रीमियम ऐप — लगभग ₹79,999 (डेमो)' : 'Premium App — Approx. ₹79,999 (Demo)'}
                    </option>
                    <option value="custom">
                      {isHi ? 'कस्टम आवश्यकता / चर्चा से तय' : 'Custom Scope / Discuss'}
                    </option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="mob-message" className="block text-xs sm:text-sm font-medium text-slate-200">
                  {isHi ? 'संदेश *' : 'Message *'}
                </label>
                <textarea
                  id="mob-message"
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder={
                    isHi
                      ? 'बताएँ आपके ऐप में कौन-कौन से फ़ीचर्स और स्क्रीन चाहिए…'
                      : 'Describe the screens and features you want in your Android app…'
                  }
                  className="w-full px-4 py-3 rounded-2xl bg-[#0b1114] border border-white/15 focus:border-[#3DDC84] focus:outline-none text-sm text-white placeholder:text-slate-500 resize-y"
                />
              </div>

              {formError && (
                <div
                  role="alert"
                  className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-400/35 text-xs sm:text-sm text-rose-200"
                >
                  {formError}
                </div>
              )}

              {formSuccess && (
                <div
                  role="status"
                  className="p-4 rounded-2xl bg-[#3DDC84]/15 border border-[#3DDC84]/40 flex items-start gap-2.5 text-xs sm:text-sm text-emerald-100"
                >
                  <CheckCircle2 className="w-5 h-5 text-[#3DDC84] shrink-0 mt-0.5" />
                  <span>
                    {isHi
                      ? 'डेमो: फ़ॉर्म ठीक से भरा गया। यह नमूना है, कोई संदेश नहीं भेजा गया।'
                      : 'Demo: Form filled out properly. This is a sample preview — no message was sent.'}
                  </span>
                </div>
              )}

              <RippleButton
                type="submit"
                rippleColor="rgba(6,20,13,0.25)"
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#3DDC84] hover:bg-[#52e695] text-[#06140d] text-sm sm:text-base font-bold transition-colors cursor-pointer"
              >
                {isHi ? 'कंसल्टेशन भेजें (डेमो)' : 'Submit Consultation (Demo)'}
              </RippleButton>
            </form>
          </div>
        </div>
      </RevealSection>

      {/* 11. FOOTER + BOTTOM MAIN-SITE QUOTE CTA */}
      <footer className="bg-[#080d10] text-slate-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 border-b border-white/10">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-2xl bg-[#3DDC84] text-[#06140d] flex items-center justify-center">
                <Smartphone className="w-4 h-4" />
              </span>
              <span className="text-base font-extrabold text-white tracking-tight">
                MOBILE SYSTEM
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              {isHi
                ? 'नेटिव और आधुनिक एंड्रॉइड इकोसिस्टम — फ़ोन, टैबलेट और स्मार्टवॉच ऐप डेवलपमेंट का नमूना डिज़ाइन।'
                : 'Native and modern Android ecosystem — sample agency website for phone, tablet, and wearable apps.'}
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
                    className="hover:text-[#3DDC84] transition-colors cursor-pointer"
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
                    className="hover:text-[#3DDC84] transition-colors cursor-pointer"
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
                  className="px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-[#3DDC84]/15 border border-white/10 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
                  aria-label={network}
                >
                  {network.slice(0, 2)}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 pt-2">© Mobile System (Demo)</p>
          </div>
        </div>

        {/* Bottom Conversion Strip -> Main Site Quote Form */}
        <div className="bg-gradient-to-r from-[#0d1c1d] via-[#11242b] to-[#0d1c1d] border-t border-[#3DDC84]/25 px-4 sm:px-6 py-8">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-[#3DDC84]">POWER WEB STUDIO AI</p>
              <h3 className="text-lg sm:text-xl font-extrabold text-white">
                {isHi
                  ? 'अपने बिज़नेस के लिए ऐसी आधुनिक वेबसाइट या ऐप बनवाएँ'
                  : 'Want a Modern Website or App Built for Your Business?'}
              </h3>
            </div>
            <RippleButton
              type="button"
              rippleColor="rgba(6,20,13,0.25)"
              onClick={onRequestQuote}
              className="px-6 py-3.5 rounded-full bg-[#3DDC84] hover:bg-[#52e695] text-[#06140d] text-sm font-extrabold transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              {isHi
                ? 'ऐसी वेबसाइट अपने बिज़नेस के लिए बनवाएँ'
                : 'Build a Website Like This for Your Business'}
              <ArrowRight className="w-4 h-4" />
            </RippleButton>
          </div>
        </div>
      </footer>

      {/* Floating Bottom-Right Demo Button */}
      <RippleButton
        type="button"
        rippleColor="rgba(6,20,13,0.25)"
        onClick={() =>
          showDemoToast(
            'डेमो बटन — यह केवल नमूना संपर्क बटन है।',
            'Demo Button — This is a sample quick-chat button.'
          )
        }
        aria-label={isHi ? 'डेमो संपर्क बटन' : 'Demo Quick Contact Button'}
        className="fixed bottom-5 right-5 z-40 w-13 h-13 rounded-2xl bg-[#3DDC84] hover:bg-[#52e695] text-[#06140d] shadow-[0_8px_24px_rgba(61,220,132,0.4)] flex items-center justify-center transition-transform duration-200 hover:scale-105 cursor-pointer"
      >
        <MessageCircle className="w-6 h-6" />
      </RippleButton>

      {/* Local Demo Toast */}
      {demoToast && (
        <div
          role="status"
          className="fixed bottom-20 right-5 z-50 max-w-xs px-4 py-3 rounded-2xl bg-[#131d22]/95 backdrop-blur-md border border-[#3DDC84]/40 text-xs sm:text-sm font-medium text-white shadow-xl"
        >
          {demoToast}
        </div>
      )}

      {/* SERVICE SCOPE MODAL */}
      {activeServiceModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="mob-service-modal-title"
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setActiveServiceModal(null)}
        >
          <div
            className="w-full max-w-xl rounded-[32px] bg-[#131d22] border border-white/15 overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-48 sm:h-56 bg-[#0b1114] shrink-0">
              <img
                src={activeServiceModal.image}
                alt={isHi ? activeServiceModal.titleHi : activeServiceModal.titleEn}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#131d22] via-transparent to-black/30" />
              <button
                type="button"
                onClick={() => setActiveServiceModal(null)}
                aria-label={isHi ? 'बंद करें' : 'Close'}
                className="absolute top-3.5 right-3.5 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              <div>
                <p className="text-xs font-semibold text-[#3DDC84]">
                  {isHi ? 'सेवा का कार्य-दायरा (डेमो)' : 'Service Scope (Demo)'}
                </p>
                <h3 id="mob-service-modal-title" className="text-xl sm:text-2xl font-bold text-white mt-1">
                  {isHi ? activeServiceModal.titleHi : activeServiceModal.titleEn}
                </h3>
                <p className="text-sm text-slate-300 mt-1.5">
                  {isHi ? activeServiceModal.shortDescHi : activeServiceModal.shortDescEn}
                </p>
              </div>

              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {isHi ? 'इसमें क्या शामिल रहता है' : 'Key Deliverables'}
                </h4>
                <ul className="space-y-2">
                  {(isHi ? activeServiceModal.scopeHi : activeServiceModal.scopeEn).map((line, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-slate-200">
                      <Check className="w-4 h-4 text-[#3DDC84] shrink-0 mt-0.5" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 text-xs sm:text-sm text-slate-300">
                <span className="font-semibold text-white">
                  {isHi ? 'उपयुक्त किसके लिए: ' : 'Best suited for: '}
                </span>
                {isHi ? activeServiceModal.idealForHi : activeServiceModal.idealForEn}
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveServiceModal(null)}
                  className="px-4 py-2.5 rounded-full border border-white/15 text-sm font-semibold text-slate-200 hover:bg-white/10 cursor-pointer"
                >
                  {isHi ? 'बंद करें' : 'Close'}
                </button>
                <RippleButton
                  type="button"
                  rippleColor="rgba(6,20,13,0.22)"
                  onClick={() => handleServiceConsult(activeServiceModal)}
                  className="px-5 py-2.5 rounded-full bg-[#3DDC84] hover:bg-[#52e695] text-sm font-bold text-[#06140d] cursor-pointer"
                >
                  {isHi ? 'फ़्री कंसल्टेशन लें' : 'Get Free Consultation'}
                </RippleButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PORTFOLIO LIGHTBOX MODAL */}
      {lightboxIndex !== null && APP_PORTFOLIO[lightboxIndex] && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="mob-lightbox-title"
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setLightboxIndex(null)}
        >
          <div
            className="w-full max-w-3xl rounded-[32px] bg-[#131d22] border border-white/15 overflow-hidden shadow-2xl max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative bg-[#0b1114]">
              <img
                src={APP_PORTFOLIO[lightboxIndex].image}
                alt={
                  isHi
                    ? APP_PORTFOLIO[lightboxIndex].titleHi
                    : APP_PORTFOLIO[lightboxIndex].titleEn
                }
                referrerPolicy="no-referrer"
                className="w-full max-h-[55vh] object-cover"
              />
              <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-[#0b1114]/85 border border-[#3DDC84]/35 text-xs font-semibold text-[#3DDC84]">
                {isHi ? 'नमूना डिज़ाइन' : 'Sample Design'}
              </div>
              <button
                type="button"
                onClick={() => setLightboxIndex(null)}
                aria-label={isHi ? 'बंद करें' : 'Close'}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/65 hover:bg-black/85 text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() =>
                  setLightboxIndex(
                    (lightboxIndex - 1 + APP_PORTFOLIO.length) % APP_PORTFOLIO.length
                  )
                }
                aria-label={isHi ? 'पिछला' : 'Previous'}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => setLightboxIndex((lightboxIndex + 1) % APP_PORTFOLIO.length)}
                aria-label={isHi ? 'अगला' : 'Next'}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 id="mob-lightbox-title" className="text-xl font-bold text-white">
                  {isHi
                    ? APP_PORTFOLIO[lightboxIndex].titleHi
                    : APP_PORTFOLIO[lightboxIndex].titleEn}
                </h3>
                <span className="text-xs font-medium text-[#38BDF8]">
                  {isHi
                    ? APP_PORTFOLIO[lightboxIndex].categoryHi
                    : APP_PORTFOLIO[lightboxIndex].categoryEn}
                </span>
              </div>

              <p className="text-sm text-slate-300 leading-relaxed">
                {isHi
                  ? APP_PORTFOLIO[lightboxIndex].summaryHi
                  : APP_PORTFOLIO[lightboxIndex].summaryEn}
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                {(isHi
                  ? APP_PORTFOLIO[lightboxIndex].chipsHi
                  : APP_PORTFOLIO[lightboxIndex].chipsEn
                ).map((chip) => (
                  <span
                    key={chip}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/[0.06] border border-white/10 text-xs font-medium text-slate-100"
                  >
                    <Check className="w-3.5 h-3.5 text-[#3DDC84]" />
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
