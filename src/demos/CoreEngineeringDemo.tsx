import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { DemoPriceBar } from '../components/DemoPriceBar';
import {
  ArrowLeft,
  ArrowRight,
  Cog,
  Menu,
  X,
  CheckCircle2,
  ShieldCheck,
  Clock,
  FileSpreadsheet,
  Users,
  Phone,
  Mail,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  MessageCircle,
} from 'lucide-react';

interface CoreEngineeringDemoProps {
  onBackToHome: () => void;
  onRequestQuote: () => void;
}

type ProjectCategory = 'all' | 'industrial' | 'infra' | 'commercial';

interface EngineeringService {
  id: string;
  image: string;
  titleHi: string;
  titleEn: string;
  shortDescHi: string;
  shortDescEn: string;
  scopeHi: string[];
  scopeEn: string[];
}

interface EngineeringProject {
  id: string;
  category: Exclude<ProjectCategory, 'all'>;
  image: string;
  titleHi: string;
  titleEn: string;
  categoryLabelHi: string;
  categoryLabelEn: string;
  summaryHi: string;
  summaryEn: string;
}

interface QuoteFormState {
  name: string;
  mobile: string;
  city: string;
  service: string;
  details: string;
}

interface QuoteFormErrors {
  name?: string;
  mobile?: string;
  city?: string;
  service?: string;
  details?: string;
}

const SERVICES: EngineeringService[] = [
  {
    id: 'civil',
    image: '/demo/core-engineering/civil.jpg',
    titleHi: 'सिविल कंस्ट्रक्शन',
    titleEn: 'Civil Construction',
    shortDescHi:
      'औद्योगिक फ़ाउंडेशन, आरसीसी ढाँचे, सड़कें और कमर्शियल बिल्डिंग का मज़बूत निर्माण।',
    shortDescEn:
      'Heavy RCC foundations, industrial structures, site development, and commercial building works.',
    scopeHi: [
      'मिट्टी जाँच, खुदाई और आरसीसी फ़ाउंडेशन कार्य',
      'औद्योगिक शेड, फ़्लोरिंग और भारी मशीन बेड निर्माण',
      'बाउंड्री वॉल, ड्रेनेज और आंतरिक रोड विकास',
      'गुणवत्ता नियंत्रण और स्ट्रक्चरल सुरक्षा निरीक्षण',
    ],
    scopeEn: [
      'Excavation, reinforcement, and heavy RCC foundation works',
      'Industrial sheds, VDF concrete flooring, and machine foundations',
      'Boundary walls, drainage networks, and internal plant roads',
      'On-site material testing and structural safety checks',
    ],
  },
  {
    id: 'mechanical',
    image: '/demo/core-engineering/mechanical.jpg',
    titleHi: 'मैकेनिकल फ़ैब्रिकेशन और CNC',
    titleEn: 'Mechanical Fabrication & CNC',
    shortDescHi:
      'सटीक सीएनसी मशीनिंग, भारी स्टील स्ट्रक्चर फ़ैब्रिकेशन और औद्योगिक पाइपिंग कार्य।',
    shortDescEn:
      'Precision CNC machining, heavy structural steel fabrication, and industrial process piping.',
    scopeHi: [
      'स्टील ट्रस, प्लेटफॉर्म, सीढ़ियाँ और भारी फ़्रेम फ़ैब्रिकेशन',
      'उच्च सटीकता के साथ सीएनसी टर्निंग और मिलिंग पुर्ज़े',
      'औद्योगिक टैंक, हॉपर, डक्ट और पाइपलाइन असेंबली',
      'वेल्डिंग निरीक्षण, सैंडब्लास्टिंग और एंटी-रस्ट कोटिंग',
    ],
    scopeEn: [
      'Structural steel trusses, platforms, walkways, and heavy frames',
      'High-tolerance CNC milling and turning of precision parts',
      'Industrial tanks, hoppers, chutes, and process piping assembly',
      'Weld inspection, surface preparation, and industrial coating',
    ],
  },
  {
    id: 'electrical',
    image: '/demo/core-engineering/electrical.jpg',
    titleHi: 'इलेक्ट्रिकल पैनल और वायरिंग',
    titleEn: 'Electrical Panels & Wiring',
    shortDescHi:
      'LT/HT कंट्रोल पैनल, फ़ैक्टरी पावर डिस्ट्रीब्यूशन, केबल ट्रे और सुरक्षित अर्थिंग सिस्टम।',
    shortDescEn:
      'LT/HT switchgear panels, plant power distribution, cable trays, and compliant earthing systems.',
    scopeHi: [
      'PCC, MCC और ऑटोमेशन कंट्रोल पैनल निर्माण व इंस्टॉलेशन',
      'औद्योगिक और कमर्शियल केबल ट्रे व आर्मर्ड केबलिंग',
      'अर्थिंग पिट, लाइटनिंग अरेस्टर और सर्ज प्रोटेक्शन',
      'लोड बैलेंसिंग, टेस्टिंग और सुरक्षित कमिशनिंग',
    ],
    scopeEn: [
      'PCC, MCC, and automation control panel assembly and installation',
      'Industrial cable tray routing and armored power cabling',
      'Dedicated earthing pits, lightning arresters, and surge safety',
      'Load testing, insulation checks, and safe commissioning',
    ],
  },
  {
    id: 'hvac',
    image: '/demo/core-engineering/hvac.jpg',
    titleHi: 'HVAC और डक्टिंग',
    titleEn: 'HVAC & Ducting',
    shortDescHi:
      'कमर्शियल बिल्डिंग और प्लांट के लिए चिलर, वेंटिलेशन और इंसुलेटेड एयर डक्ट सिस्टम।',
    shortDescEn:
      'Commercial chillers, industrial ventilation, air handling units, and insulated GI ducting.',
    scopeHi: [
      'हीट-लोड गणना और एयरफ़्लो सिस्टम डिज़ाइन',
      'GI डक्ट फ़ैब्रिकेशन, थर्मल इंसुलेशन और ग्रिल फ़िटिंग',
      'चिलर, AHU, VRF और एग्ज़ॉस्ट वेंटिलेशन इंस्टॉलेशन',
      'एयर बैलेंसिंग, प्रेशर टेस्ट और नियमित मेंटेनेंस',
    ],
    scopeEn: [
      'Thermal heat-load calculation and airflow layout design',
      'Galvanized steel duct fabrication, acoustic & thermal insulation',
      'Chiller, AHU, VRF, and industrial exhaust installation',
      'Airflow balancing, pressure testing, and scheduled upkeep',
    ],
  },
  {
    id: 'solar',
    image: '/demo/core-engineering/solar.jpg',
    titleHi: 'सोलर इंस्टॉलेशन',
    titleEn: 'Solar Installation',
    shortDescHi:
      'फ़ैक्टरी छत और कमर्शियल परिसरों के लिए उच्च-दक्षता ऑन-ग्रिड व हाइब्रिड सोलर प्लांट।',
    shortDescEn:
      'High-efficiency rooftop on-grid and hybrid solar photovoltaic plants for factories and offices.',
    scopeHi: [
      'शैडो एनालिसिस और सोलर उत्पादन क्षमता आकलन',
      'गैल्वेनाइज़्ड मॉड्यूल माउंटिंग स्ट्रक्चर और पैनल फ़िटिंग',
      'इन्वर्टर, ACDB/DCDB प्रोटेक्शन और नेट-मीटरिंग तैयारी',
      'सिस्टम टेस्टिंग, मॉनिटरिंग सेटअप और हैंडओवर प्रशिक्षण',
    ],
    scopeEn: [
      'Site shadow analysis and solar generation feasibility layout',
      'Wind-rated galvanized mounting structures and panel arrays',
      'Inverter integration, ACDB/DCDB protection, and net-metering prep',
      'Commissioning tests, monitoring setup, and handover training',
    ],
  },
  {
    id: 'design',
    image: '/demo/core-engineering/design.jpg',
    titleHi: 'CAD डिज़ाइन और ड्रॉइंग',
    titleEn: 'CAD Design & Drawings',
    shortDescHi:
      'निर्माण से पहले सटीक 2D/3D CAD मॉडल, स्ट्रक्चरल लेआउट और मटेरियल बिल (BOQ) तैयारी।',
    shortDescEn:
      'Detailed 2D/3D CAD engineering models, structural GA drawings, and bill of quantities (BOQ).',
    scopeHi: [
      '2D वर्किंग ड्रॉइंग और 3D स्ट्रक्चरल/मैकेनिकल मॉडलिंग',
      'सिविल, इलेक्ट्रिकल और HVAC कोऑर्डिनेशन लेआउट',
      'अनुमानित सामग्री सूची (BOQ) और कटिंग प्लान',
      'निर्माण के बाद As-Built फ़ाइनल ड्रॉइंग दस्तावेज़',
    ],
    scopeEn: [
      '2D working blueprints and 3D structural/mechanical CAD models',
      'Multi-discipline civil, electrical, and HVAC clash coordination',
      'Detailed Bill of Quantities (BOQ) and fabrication cutting plans',
      'Complete As-Built final documentation at project handover',
    ],
  },
];

const PROJECTS: EngineeringProject[] = [
  {
    id: 'warehouse',
    category: 'industrial',
    image: '/demo/core-engineering/project-warehouse.jpg',
    titleHi: 'स्टील वेयरहाउस',
    titleEn: 'Steel Warehouse',
    categoryLabelHi: 'औद्योगिक',
    categoryLabelEn: 'Industrial',
    summaryHi:
      'वाइड-स्पैन प्री-इंजीनियर्ड स्टील ट्रस, हाई-बे लाइटिंग और इंडस्ट्रियल फ़्लोरिंग वाला आधुनिक गोदाम।',
    summaryEn:
      'Wide-span pre-engineered steel warehouse with skylight bays, high-bay lighting, and polished concrete flooring.',
  },
  {
    id: 'bridge',
    category: 'infra',
    image: '/demo/core-engineering/project-bridge.jpg',
    titleHi: 'नदी पुल',
    titleEn: 'River Bridge',
    categoryLabelHi: 'इन्फ्रा',
    categoryLabelEn: 'Infrastructure',
    summaryHi:
      'मज़बूत आरसीसी पियर्स और मल्टी-स्पैन बॉक्स-गर्डर डेक संरचना के साथ आधुनिक नदी सेतु निर्माण।',
    summaryEn:
      'Multi-span concrete and steel box-girder river crossing engineered with reinforced piers and highway approaches.',
  },
  {
    id: 'factory',
    category: 'industrial',
    image: '/demo/core-engineering/project-factory.jpg',
    titleHi: 'फ़ैक्टरी प्रोडक्शन लाइन',
    titleEn: 'Factory Production Line',
    categoryLabelHi: 'औद्योगिक',
    categoryLabelEn: 'Industrial',
    summaryHi:
      'स्वचालित कन्वेयर, पावर डिस्ट्रीब्यूशन, वेंटिलेशन और सुरक्षित वॉकवे के साथ इंडस्ट्रियल प्लांट सेटअप।',
    summaryEn:
      'Turnkey industrial production floor integrating machinery bays, overhead utilities, power distribution, and safety walkways.',
  },
  {
    id: 'building',
    category: 'commercial',
    image: '/demo/core-engineering/project-building.jpg',
    titleHi: 'कमर्शियल बिल्डिंग',
    titleEn: 'Commercial Building',
    categoryLabelHi: 'कमर्शियल',
    categoryLabelEn: 'Commercial',
    summaryHi:
      'बहुमंज़िला कॉर्पोरेट कार्यालय भवन — सिविल फ्रेम, ग्लास फ़साड, सेंट्रल HVAC और इलेक्ट्रिकल सिस्टम।',
    summaryEn:
      'Multi-story commercial office complex combining structural concrete frame, glass curtain wall, central HVAC, and electrical works.',
  },
];

const PROCESS_STEPS = [
  {
    step: '01',
    titleHi: 'साइट सर्वे',
    titleEn: 'Site Survey',
    descHi:
      'इंजीनियरिंग टीम द्वारा स्थल निरीक्षण, सटीक माप और तकनीकी आवश्यकताओं का आकलन।',
    descEn:
      'On-site inspection, measurements, load assessment, and technical requirement capture.',
  },
  {
    step: '02',
    titleHi: 'डिज़ाइन और अनुमान',
    titleEn: 'Design & Estimation',
    descHi:
      '2D/3D CAD ड्रॉइंग, स्पष्ट समय-सीमा और पारदर्शी मटेरियल व लागत अनुमान (BOQ)।',
    descEn:
      'Detailed CAD drawings, clear execution schedule, and transparent itemized BOQ estimate.',
  },
  {
    step: '03',
    titleHi: 'निर्माण / इंस्टॉलेशन',
    titleEn: 'Construction / Installation',
    descHi:
      'सुरक्षा मानकों और इंजीनियरिंग सुपरविज़न के साथ चरणबद्ध निर्माण व उपकरण इंस्टॉलेशन।',
    descEn:
      'Supervised execution following strict site safety protocols and milestone quality checks.',
  },
  {
    step: '04',
    titleHi: 'टेस्टिंग और हैंडओवर',
    titleEn: 'Testing & Handover',
    descHi:
      'पूर्ण लोड/सुरक्षा परीक्षण, फ़ाइनल ड्रॉइंग दस्तावेज़ और व्यवस्थित प्रोजेक्ट हैंडओवर।',
    descEn:
      'Full commissioning tests, as-built technical drawings, and clean operational handover.',
  },
];

const WHY_CHOOSE_ITEMS = [
  {
    icon: ShieldCheck,
    titleHi: 'सुरक्षा पहले',
    titleEn: 'Safety First',
    descHi:
      'हर साइट पर PPE, सुरक्षित स्कैफ़ोल्डिंग, इलेक्ट्रिकल लॉकआउट और नियमित सेफ़्टी जाँच अनिवार्य।',
    descEn:
      'Strict PPE compliance, safe scaffolding, electrical isolation, and daily site safety checks on every job.',
  },
  {
    icon: Clock,
    titleHi: 'समय पर काम',
    titleEn: 'On-Time Delivery',
    descHi:
      'स्पष्ट साप्ताहिक माइलस्टोन और मटेरियल प्लानिंग के साथ तय समय-सीमा के भीतर कार्य पूरा।',
    descEn:
      'Clear milestone planning and proactive material scheduling to keep execution aligned with your timeline.',
  },
  {
    icon: FileSpreadsheet,
    titleHi: 'पारदर्शी कोटेशन',
    titleEn: 'Transparent Quotation',
    descHi:
      'बिना किसी छुपे खर्च के हर सामग्री, श्रम और कार्य दायरे का स्पष्ट लिखित विवरण।',
    descEn:
      'Clear itemized breakdown of materials, scope, and terms with zero hidden charges.',
  },
  {
    icon: Users,
    titleHi: 'एक ही टीम से डिज़ाइन से हैंडओवर तक',
    titleEn: 'Single Team: Design to Handover',
    descHi:
      'सिविल, मैकेनिकल, इलेक्ट्रिकल और सोलर कार्यों का एक ही समन्वित टीम द्वारा संपूर्ण संचालन।',
    descEn:
      'One accountable engineering team coordinating CAD design, procurement, site build, and commissioning.',
  },
];

/**
 * Lightweight scroll reveal wrapper respecting prefers-reduced-motion.
 */
const RevealSection: React.FC<{
  id?: string;
  className?: string;
  children: React.ReactNode;
}> = ({ id, className = '', children }) => {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setVisible(true);
      return;
    }

    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.08 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id={id}
      ref={ref}
      className={`${className} transition-[opacity,transform] duration-500 ease-out ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      {children}
    </section>
  );
};

export const CoreEngineeringDemo: React.FC<CoreEngineeringDemoProps> = ({
  onBackToHome,
  onRequestQuote,
}) => {
  const { language, setLanguage, t } = useLanguage();
  const isHindi = language === 'hi';

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedServiceModal, setSelectedServiceModal] =
    useState<EngineeringService | null>(null);
  const [projectFilter, setProjectFilter] = useState<ProjectCategory>('all');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const [quoteForm, setQuoteForm] = useState<QuoteFormState>({
    name: '',
    mobile: '',
    city: '',
    service: 'civil',
    details: '',
  });
  const [quoteErrors, setQuoteErrors] = useState<QuoteFormErrors>({});
  const [quoteSubmitted, setQuoteSubmitted] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
  };

  useEffect(() => {
    if (!toastMsg) return;
    const timer = window.setTimeout(() => setToastMsg(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toastMsg]);

  const filteredProjects =
    projectFilter === 'all'
      ? PROJECTS
      : PROJECTS.filter((p) => p.category === projectFilter);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (lightboxIndex !== null) setLightboxIndex(null);
        else if (selectedServiceModal) setSelectedServiceModal(null);
        else if (mobileMenuOpen) setMobileMenuOpen(false);
      }
      if (lightboxIndex !== null && filteredProjects.length > 0) {
        if (e.key === 'ArrowLeft') {
          setLightboxIndex(
            (idx) =>
              idx === null
                ? null
                : (idx - 1 + filteredProjects.length) % filteredProjects.length
          );
        } else if (e.key === 'ArrowRight') {
          setLightboxIndex((idx) =>
            idx === null ? null : (idx + 1) % filteredProjects.length
          );
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [lightboxIndex, selectedServiceModal, mobileMenuOpen, filteredProjects.length]);

  const scrollToId = (id: string) => {
    setMobileMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleQuoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: QuoteFormErrors = {};

    if (quoteForm.name.trim().length < 2) {
      errs.name = t('Please enter your name.', 'कृपया अपना नाम दर्ज करें।');
    }
    if (!/^[6-9]\d{9}$/.test(quoteForm.mobile.replace(/\D/g, ''))) {
      errs.mobile = t(
        'Enter a valid 10-digit mobile number.',
        'कृपया सही 10 अंकों का मोबाइल नंबर दर्ज करें।'
      );
    }
    if (quoteForm.city.trim().length < 2) {
      errs.city = t('Please enter your city.', 'कृपया अपने शहर का नाम लिखें।');
    }
    if (!quoteForm.service) {
      errs.service = t('Please select a service.', 'कृपया सेवा चुनें।');
    }
    if (quoteForm.details.trim().length < 10) {
      errs.details = t(
        'Please share brief project details (min. 10 characters).',
        'कृपया प्रोजेक्ट का संक्षिप्त विवरण लिखें (कम से कम 10 अक्षर)।'
      );
    }

    setQuoteErrors(errs);
    if (Object.keys(errs).length > 0) {
      setQuoteSubmitted(false);
      return;
    }

    // Strictly local React state validation only — zero Firestore or API calls
    setQuoteSubmitted(true);
  };

  const navLinks = [
    { id: 'ce-hero', labelHi: 'होम', labelEn: 'Home' },
    { id: 'ce-services', labelHi: 'सेवाएँ', labelEn: 'Services' },
    { id: 'ce-projects', labelHi: 'प्रोजेक्ट', labelEn: 'Projects' },
    { id: 'ce-about', labelHi: 'हमारे बारे में', labelEn: 'About' },
    { id: 'ce-contact', labelHi: 'संपर्क', labelEn: 'Contact' },
  ];

  const activeLightboxProject =
    lightboxIndex !== null ? filteredProjects[lightboxIndex] ?? null : null;

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 font-sans">
      {/* Unified Sticky Top Shell: DEMO Disclaimer Strip + Corporate Header */}
      <div className="sticky top-0 z-40">
        {/* Top DEMO Strip */}
        <div className="bg-[#081226] text-slate-100 border-b border-slate-800">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 py-1.5 flex items-center justify-between gap-2 text-[11px] sm:text-xs">
            <p className="truncate text-slate-200">
              <span className="font-bold text-orange-400 mr-1.5">DEMO</span>
              {t(
                'DEMO Website — This is only a sample',
                'वेबसाइट — यह केवल नमूना है'
              )}
            </p>
            <button
              type="button"
              onClick={onBackToHome}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold text-[11px] transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <ArrowLeft className="w-3 h-3 shrink-0" />
              <span>{t('Power Web Studio AI', 'Power Web Studio AI पर वापस')}</span>
            </button>
          </div>
        </div>

        {/* MRP Price Bar */}
        <DemoPriceBar slug="core-engineering" />

        {/* Corporate Navigation Header */}
        <header className="bg-white/98 backdrop-blur-md border-b border-slate-200 shadow-2xs">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-4">
            {/* Logo: CORE ENGINEERING + Gear Icon */}
            <button
              type="button"
              onClick={() => scrollToId('ce-hero')}
              className="flex items-center gap-2.5 text-left cursor-pointer shrink-0 focus-visible:outline-2 focus-visible:outline-orange-600 rounded"
            >
              <span className="w-9 h-9 rounded-lg bg-[#0f1f3d] text-orange-500 flex items-center justify-center shrink-0">
                <Cog className="w-5 h-5" />
              </span>
              <span className="leading-none">
                <span className="block text-sm sm:text-base font-black tracking-tight text-[#0f1f3d] whitespace-nowrap">
                  CORE <span className="text-orange-600">ENGINEERING</span>
                </span>
                <span className="block text-[10px] font-semibold text-slate-500 mt-0.5 whitespace-nowrap">
                  {t('Industrial & Infra Solutions', 'इंजीनियरिंग एवं निर्माण')}
                </span>
              </span>
            </button>

            {/* Desktop Menu */}
            <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold text-slate-700">
              {navLinks.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToId(item.id);
                  }}
                  className="hover:text-orange-600 transition-colors whitespace-nowrap shrink-0"
                >
                  {isHindi ? item.labelHi : item.labelEn}
                </a>
              ))}
            </nav>

            {/* Right Actions: Language Toggle + Get Quote CTA + Mobile Hamburger */}
            <div className="flex items-center gap-2 shrink-0">
              <div
                role="radiogroup"
                aria-label={t('Language Selector', 'भाषा चयन')}
                className="flex items-center border border-slate-200 rounded-md p-0.5 bg-slate-100 text-[11px] font-bold"
              >
                <button
                  type="button"
                  role="radio"
                  aria-checked={language === 'hi'}
                  onClick={() => setLanguage('hi')}
                  className={`px-2 py-1 rounded transition-colors cursor-pointer whitespace-nowrap ${
                    language === 'hi'
                      ? 'bg-[#0f1f3d] text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  हिन्दी
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={language === 'en'}
                  onClick={() => setLanguage('en')}
                  className={`px-2 py-1 rounded transition-colors cursor-pointer whitespace-nowrap ${
                    language === 'en'
                      ? 'bg-[#0f1f3d] text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  EN
                </button>
              </div>

              <button
                type="button"
                onClick={() => scrollToId('ce-quote')}
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-orange-600 hover:bg-orange-700 active:scale-[0.98] text-white text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap"
              >
                <span>{t('Get Quote', 'कोटेशन पाएँ')}</span>
                <ArrowRight className="w-3.5 h-3.5 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => setMobileMenuOpen((v) => !v)}
                aria-label={t('Toggle Menu', 'मेन्यू खोलें')}
                aria-expanded={mobileMenuOpen}
                className="lg:hidden p-2 rounded-md text-[#0f1f3d] hover:bg-slate-100 cursor-pointer"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <div className="lg:hidden bg-white border-t border-slate-200 px-4 py-3 space-y-1 shadow-lg">
              {navLinks.map((item) => (
                <button
                  key={`m-${item.id}`}
                  type="button"
                  onClick={() => scrollToId(item.id)}
                  className="w-full text-left py-2.5 px-3 rounded-md text-sm font-semibold text-slate-800 hover:bg-slate-50 hover:text-orange-600 cursor-pointer"
                >
                  {isHindi ? item.labelHi : item.labelEn}
                </button>
              ))}
              <button
                type="button"
                onClick={() => scrollToId('ce-quote')}
                className="w-full mt-2 py-2.5 px-4 rounded-md bg-orange-600 text-white text-sm font-bold text-center cursor-pointer"
              >
                {t('Get Quote', 'कोटेशन पाएँ')}
              </button>
            </div>
          )}
        </header>
      </div>

      {/* =====================================================================
          HERO SECTION (Full-Width Real hero.jpg + Deep Navy Overlay)
         ===================================================================== */}
      <section
        id="ce-hero"
        className="relative w-full min-h-[460px] sm:min-h-[540px] flex items-center bg-[#0a1628] overflow-hidden"
      >
        <img
          src="/demo/core-engineering/hero.jpg"
          alt={
            isHindi
              ? 'कोर इंजीनियरिंग औद्योगिक निर्माण स्थल'
              : 'Core Engineering civil and structural construction site'
          }
          decoding="async"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-[#081226]/92 via-[#0f1f3d]/78 to-[#081226]/45"
          aria-hidden="true"
        />

        <div className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="max-w-2xl space-y-5 text-white">
            <p className="text-xs sm:text-sm font-bold text-orange-400 tracking-wide uppercase">
              {t(
                'Core Engineering · Multi-Discipline Execution',
                'कोर इंजीनियरिंग · बहु-विषयक इंजीनियरिंग समाधान'
              )}
            </p>
            <h1
              className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1]"
              style={{ textWrap: 'balance' }}
            >
              {t(
                'Solid Engineering, Reliable Construction',
                'मज़बूत इंजीनियरिंग, भरोसेमंद निर्माण'
              )}
            </h1>
            <p className="text-base sm:text-xl font-medium text-slate-200 leading-relaxed">
              {t(
                'Civil, Mechanical, Electrical & Solar solutions delivered with discipline and site safety.',
                'Civil, Mechanical, Electrical & Solar solutions — सुरक्षित, सटीक और समयबद्ध निष्पादन।'
              )}
            </p>

            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <button
                type="button"
                onClick={() => scrollToId('ce-services')}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-md bg-orange-600 hover:bg-orange-700 active:scale-[0.98] text-white text-sm font-extrabold transition-all cursor-pointer whitespace-nowrap"
              >
                <span>{t('Our Services', 'हमारी सेवाएँ')}</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </button>
              <button
                type="button"
                onClick={() => scrollToId('ce-quote')}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-md bg-white/10 hover:bg-white/20 border border-white/40 text-white text-sm font-bold backdrop-blur-xs transition-colors cursor-pointer whitespace-nowrap"
              >
                <span>{t('Get Quote', 'कोटेशन पाएँ')}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SERVICES SECTION (6 Photo Cards with Hover Zoom + Scope Modal)
         ===================================================================== */}
      <RevealSection
        id="ce-services"
        className="py-16 sm:py-24 bg-white border-b border-slate-200 scroll-mt-24"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mb-12">
            <p className="text-xs font-extrabold text-orange-600 uppercase tracking-wider mb-2">
              {t('Engineering Capabilities', 'इंजीनियरिंग सेवाएँ')}
            </p>
            <h2 className="text-2xl sm:text-4xl font-black text-[#0f1f3d] tracking-tight">
              {t(
                'End-to-End Industrial & Commercial Services',
                'औद्योगिक और कमर्शियल इंजीनियरिंग सेवाएँ'
              )}
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600">
              {t(
                'Six core engineering divisions working together under unified project supervision.',
                'सिविल, मैकेनिकल, इलेक्ट्रिकल, HVAC, सोलर और CAD डिज़ाइन की छह मुख्य इकाइयाँ।'
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.map((service) => (
              <article
                key={service.id}
                className="rounded-xl bg-white border border-slate-200 overflow-hidden shadow-2xs hover:shadow-md transition-shadow flex flex-col group"
              >
                <div className="aspect-[4/3] bg-slate-100 overflow-hidden">
                  <img
                    src={service.image}
                    alt={isHindi ? service.titleHi : service.titleEn}
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-extrabold text-[#0f1f3d]">
                      {isHindi ? service.titleHi : service.titleEn}
                    </h3>
                    <p className="mt-1.5 text-sm text-slate-600 leading-relaxed line-clamp-2">
                      {isHindi ? service.shortDescHi : service.shortDescEn}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedServiceModal(service)}
                    className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-orange-600 hover:text-orange-700 cursor-pointer self-start"
                  >
                    <span>{t('View Details', 'विवरण देखें')}</span>
                    <ArrowRight className="w-4 h-4 shrink-0" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* =====================================================================
          HOW WE WORK (4-Step Engineering Timeline)
         ===================================================================== */}
      <RevealSection
        id="ce-process"
        className="py-16 sm:py-24 bg-[#0f1f3d] text-white border-b border-slate-800"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mb-12">
            <p className="text-xs font-extrabold text-orange-400 uppercase tracking-wider mb-2">
              {t('Execution Workflow', 'कार्य प्रणाली')}
            </p>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
              {t('How We Work', 'हम काम कैसे करते हैं')}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PROCESS_STEPS.map((item, idx) => (
              <div
                key={item.step}
                className="relative rounded-xl bg-white/5 border border-white/10 p-6 flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black font-mono text-orange-400 tabular-nums">
                    {item.step}
                  </span>
                  {idx < PROCESS_STEPS.length - 1 && (
                    <ArrowRight
                      className="hidden lg:block w-4 h-4 text-slate-400"
                      aria-hidden="true"
                    />
                  )}
                </div>
                <h3 className="text-lg font-extrabold text-white">
                  {isHindi ? item.titleHi : item.titleEn}
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {isHindi ? item.descHi : item.descEn}
                </p>
              </div>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* =====================================================================
          PROJECT GALLERY (Filterable + Lightbox + "नमूना प्रोजेक्ट" Tag)
         ===================================================================== */}
      <RevealSection
        id="ce-projects"
        className="py-16 sm:py-24 bg-slate-50 border-b border-slate-200 scroll-mt-24"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-10">
            <div className="max-w-xl">
              <p className="text-xs font-extrabold text-orange-600 uppercase tracking-wider mb-2">
                {t('Sample Portfolio', 'नमूना कार्य गैलरी')}
              </p>
              <h2 className="text-2xl sm:text-4xl font-black text-[#0f1f3d] tracking-tight">
                {t('Project Gallery', 'प्रोजेक्ट गैलरी')}
              </h2>
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {(
                [
                  { id: 'all', hi: 'सभी', en: 'All' },
                  { id: 'industrial', hi: 'औद्योगिक', en: 'Industrial' },
                  { id: 'infra', hi: 'इन्फ्रा', en: 'Infra' },
                  { id: 'commercial', hi: 'कमर्शियल', en: 'Commercial' },
                ] as const
              ).map((tab) => {
                const active = projectFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setProjectFilter(tab.id);
                      setLightboxIndex(null);
                    }}
                    className={`px-4 py-2 rounded-md text-xs sm:text-sm font-bold transition-colors cursor-pointer whitespace-nowrap ${
                      active
                        ? 'bg-[#0f1f3d] text-white'
                        : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {isHindi ? tab.hi : tab.en}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {filteredProjects.map((project, index) => (
              <article
                key={project.id}
                className="rounded-xl bg-white border border-slate-200 overflow-hidden shadow-2xs hover:shadow-md transition-shadow flex flex-col group"
              >
                <button
                  type="button"
                  onClick={() => setLightboxIndex(index)}
                  aria-label={
                    isHindi
                      ? `${project.titleHi} को बड़ा देखें`
                      : `Open ${project.titleEn} in lightbox`
                  }
                  className="relative aspect-[16/10] bg-slate-100 overflow-hidden cursor-pointer"
                >
                  <img
                    src={project.image}
                    alt={isHindi ? project.titleHi : project.titleEn}
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded bg-[#0f1f3d]/90 text-white text-[11px] font-bold">
                    {t('Sample Project', 'नमूना प्रोजेक्ट')}
                  </span>
                  <span className="absolute bottom-3 right-3 p-2 rounded-md bg-slate-950/75 text-white opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <Maximize2 className="w-4 h-4" />
                  </span>
                </button>
                <div className="p-5">
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500 font-semibold">
                    <span className="text-orange-600">
                      {isHindi ? project.categoryLabelHi : project.categoryLabelEn}
                    </span>
                    <span>{t('Sample Project', 'नमूना प्रोजेक्ट')}</span>
                  </div>
                  <h3 className="mt-1 text-lg font-extrabold text-[#0f1f3d]">
                    {isHindi ? project.titleHi : project.titleEn}
                  </h3>
                  <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
                    {isHindi ? project.summaryHi : project.summaryEn}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* =====================================================================
          WHY CHOOSE US (Strictly Qualitative — Zero Numbers, Zero Fake Stats)
         ===================================================================== */}
      <RevealSection
        id="ce-about"
        className="py-16 sm:py-24 bg-white border-b border-slate-200 scroll-mt-24"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mb-12">
            <p className="text-xs font-extrabold text-orange-600 uppercase tracking-wider mb-2">
              {t('Our Principles', 'हमारी कार्य-प्रतिबद्धता')}
            </p>
            <h2 className="text-2xl sm:text-4xl font-black text-[#0f1f3d] tracking-tight">
              {t('Why Choose Core Engineering', 'हमें क्यों चुनें')}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {WHY_CHOOSE_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.titleEn}
                  className="rounded-xl bg-slate-50 border border-slate-200 p-6 space-y-3"
                >
                  <div className="w-11 h-11 rounded-lg bg-[#0f1f3d] text-orange-400 flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-extrabold text-[#0f1f3d]">
                    {isHindi ? item.titleHi : item.titleEn}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {isHindi ? item.descHi : item.descEn}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </RevealSection>

      {/* =====================================================================
          QUOTATION FORM + CONTACT INFO SECTION (100% Local State — Zero Writes)
         ===================================================================== */}
      <RevealSection
        id="ce-contact"
        className="py-16 sm:py-24 bg-slate-50 border-b border-slate-200 scroll-mt-24"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left: Contact Information (Clearly Marked Demo Information) */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <p className="text-xs font-extrabold text-orange-600 uppercase tracking-wider mb-2">
                {t('Demo Contact Details', 'डेमो जानकारी')}
              </p>
              <h2 className="text-2xl sm:text-3xl font-black text-[#0f1f3d] tracking-tight">
                {t('Discuss Your Engineering Project', 'अपने प्रोजेक्ट पर चर्चा करें')}
              </h2>
              <p className="mt-2.5 text-sm text-slate-600 leading-relaxed">
                {t(
                  'All contact details below are sample placeholders for this demo website.',
                  'नीचे दिए गए सभी संपर्क विवरण इस डेमो वेबसाइट के लिए केवल नमूना जानकारी हैं।'
                )}
              </p>
            </div>

            <div className="rounded-xl bg-white border border-slate-200 p-6 space-y-5">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500">
                    {t('Phone (Demo Info)', 'फ़ोन (डेमो जानकारी)')}
                  </p>
                  <p className="text-sm sm:text-base font-extrabold font-mono text-[#0f1f3d] mt-0.5">
                    +91 90000 00000
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500">
                    {t('Email (Demo Info)', 'ईमेल (डेमो जानकारी)')}
                  </p>
                  <p className="text-sm sm:text-base font-bold font-mono text-[#0f1f3d] mt-0.5 break-all">
                    info@core-engineering.example
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500">
                    {t('Office Address (Demo Info)', 'पता (डेमो जानकारी)')}
                  </p>
                  <p className="text-sm sm:text-base font-bold text-[#0f1f3d] mt-0.5">
                    {t('Your City, India', 'आपका शहर, भारत')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Demo Quotation Form */}
          <div id="ce-quote" className="lg:col-span-7 scroll-mt-28">
            <div className="rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 shadow-xs">
              <h3 className="text-xl font-black text-[#0f1f3d]">
                {t('Request Project Quotation', 'प्रोजेक्ट कोटेशन फ़ॉर्म')}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {t(
                  'Demo form — validates inputs locally without sending or storing data.',
                  'यह डेमो फ़ॉर्म है — कोई डेटा सर्वर पर नहीं भेजा जाता।'
                )}
              </p>

              {quoteSubmitted && (
                <div
                  role="status"
                  className="mt-5 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3"
                >
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="text-sm font-bold leading-snug">
                    {t(
                      'Demo: Form filled properly. This is a sample, no message was sent.',
                      'डेमो: फ़ॉर्म ठीक से भरा गया। यह नमूना है, कोई संदेश नहीं भेजा गया।'
                    )}
                  </div>
                </div>
              )}

              <form onSubmit={handleQuoteSubmit} noValidate className="mt-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="ce-name"
                      className="block text-xs font-bold text-slate-700 mb-1"
                    >
                      {t('Full Name', 'नाम')} *
                    </label>
                    <input
                      id="ce-name"
                      type="text"
                      value={quoteForm.name}
                      onChange={(e) =>
                        setQuoteForm((f) => ({ ...f, name: e.target.value }))
                      }
                      placeholder={t('e.g. Amit Kulkarni', 'जैसे: अमित कुलकर्णी')}
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-orange-600"
                    />
                    {quoteErrors.name && (
                      <p className="mt-1 text-xs text-rose-600">{quoteErrors.name}</p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="ce-mobile"
                      className="block text-xs font-bold text-slate-700 mb-1"
                    >
                      {t('Mobile Number', 'मोबाइल')} *
                    </label>
                    <input
                      id="ce-mobile"
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      value={quoteForm.mobile}
                      onChange={(e) =>
                        setQuoteForm((f) => ({
                          ...f,
                          mobile: e.target.value.replace(/\D/g, '').slice(0, 10),
                        }))
                      }
                      placeholder="9876543210"
                      className="w-full px-3.5 py-2.5 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:border-orange-600"
                    />
                    {quoteErrors.mobile && (
                      <p className="mt-1 text-xs text-rose-600">{quoteErrors.mobile}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="ce-city"
                      className="block text-xs font-bold text-slate-700 mb-1"
                    >
                      {t('City', 'शहर')} *
                    </label>
                    <input
                      id="ce-city"
                      type="text"
                      value={quoteForm.city}
                      onChange={(e) =>
                        setQuoteForm((f) => ({ ...f, city: e.target.value }))
                      }
                      placeholder={t('Your City', 'आपका शहर')}
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-orange-600"
                    />
                    {quoteErrors.city && (
                      <p className="mt-1 text-xs text-rose-600">{quoteErrors.city}</p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="ce-service"
                      className="block text-xs font-bold text-slate-700 mb-1"
                    >
                      {t('Required Service', 'सेवा चुनें')} *
                    </label>
                    <select
                      id="ce-service"
                      value={quoteForm.service}
                      onChange={(e) =>
                        setQuoteForm((f) => ({ ...f, service: e.target.value }))
                      }
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-orange-600"
                    >
                      {SERVICES.map((svc) => (
                        <option key={svc.id} value={svc.id}>
                          {isHindi ? svc.titleHi : svc.titleEn}
                        </option>
                      ))}
                    </select>
                    {quoteErrors.service && (
                      <p className="mt-1 text-xs text-rose-600">{quoteErrors.service}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="ce-details"
                    className="block text-xs font-bold text-slate-700 mb-1"
                  >
                    {t('Project Details', 'प्रोजेक्ट विवरण')} *
                  </label>
                  <textarea
                    id="ce-details"
                    rows={4}
                    value={quoteForm.details}
                    onChange={(e) =>
                      setQuoteForm((f) => ({ ...f, details: e.target.value }))
                    }
                    placeholder={t(
                      'Briefly describe site area, capacity, or work scope...',
                      'कृपया साइट का क्षेत्रफल, कार्य का दायरा या तकनीकी आवश्यकता लिखें...'
                    )}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-orange-600"
                  />
                  {quoteErrors.details && (
                    <p className="mt-1 text-xs text-rose-600">{quoteErrors.details}</p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-5 rounded-lg bg-orange-600 hover:bg-orange-700 active:scale-[0.99] text-white text-sm font-extrabold transition-all cursor-pointer"
                >
                  {t('Submit Demo Quotation Request', 'कोटेशन अनुरोध भेजें (डेमो)')}
                </button>
              </form>
            </div>
          </div>
        </div>
      </RevealSection>

      {/* =====================================================================
          BUSINESS CONVERSION CTA BANNER -> MAIN SITE QUOTE FORM
         ===================================================================== */}
      <section className="bg-orange-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div>
            <p className="text-xs font-bold text-orange-100 uppercase tracking-wider">
              POWER WEB STUDIO AI
            </p>
            <h2 className="text-lg sm:text-2xl font-black tracking-tight mt-1">
              {t(
                'Want a Professional Website Like This for Your Engineering Business?',
                'क्या आप अपने बिज़नेस के लिए ऐसी प्रोफ़ेशनल वेबसाइट बनवाना चाहते हैं?'
              )}
            </h2>
          </div>
          <button
            type="button"
            onClick={onRequestQuote}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-[#0f1f3d] hover:bg-[#081226] text-white text-xs sm:text-sm font-extrabold transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <span>
              {t(
                'Build This Website for Your Business',
                'ऐसी वेबसाइट अपने बिज़नेस के लिए बनवाएँ'
              )}
            </span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </button>
        </div>
      </section>

      {/* =====================================================================
          CORPORATE FOOTER
         ===================================================================== */}
      <footer className="bg-[#081226] text-slate-300 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-xs sm:text-sm">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white font-black text-base">
              <span className="w-8 h-8 rounded bg-orange-600 flex items-center justify-center">
                <Cog className="w-4 h-4 text-white" />
              </span>
              <span>CORE ENGINEERING</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {t(
                'Sample corporate engineering & construction website built by Power Web Studio AI. Demonstration only.',
                'Power Web Studio AI द्वारा निर्मित इंजीनियरिंग कंपनी डेमो वेबसाइट। यह केवल नमूना है।'
              )}
            </p>
          </div>

          {/* Services List */}
          <div>
            <h3 className="text-white font-bold text-xs uppercase tracking-wider mb-3">
              {t('Services', 'हमारी सेवाएँ')}
            </h3>
            <ul className="space-y-2 text-xs">
              {SERVICES.map((svc) => (
                <li key={`f-${svc.id}`}>
                  <button
                    type="button"
                    onClick={() => setSelectedServiceModal(svc)}
                    className="hover:text-orange-400 transition-colors cursor-pointer text-left"
                  >
                    {isHindi ? svc.titleHi : svc.titleEn}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-bold text-xs uppercase tracking-wider mb-3">
              {t('Quick Links', 'क्विक लिंक')}
            </h3>
            <ul className="space-y-2 text-xs">
              {navLinks.map((link) => (
                <li key={`fl-${link.id}`}>
                  <button
                    type="button"
                    onClick={() => scrollToId(link.id)}
                    className="hover:text-orange-400 transition-colors cursor-pointer"
                  >
                    {isHindi ? link.labelHi : link.labelEn}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Social Icons */}
          <div>
            <h3 className="text-white font-bold text-xs uppercase tracking-wider mb-3">
              {t('Connect (Demo)', 'सोशल लिंक (डेमो)')}
            </h3>
            <div className="flex items-center gap-2.5">
              {[
                {
                  label: 'LinkedIn',
                  path: 'M6.5 8.5v9M6.5 5.5v.01M10.5 17.5v-5.2c0-1.6 1.1-2.8 2.7-2.8s2.3 1 2.3 2.8v5.2',
                },
                {
                  label: 'YouTube',
                  path: 'M21 8.5a2.5 2.5 0 00-1.8-1.8C17.6 6.2 12 6.2 12 6.2s-5.6 0-7.2.5A2.5 2.5 0 003 8.5 26 26 0 002.5 12a26 26 0 00.5 3.5 2.5 2.5 0 001.8 1.8c1.6.5 7.2.5 7.2.5s5.6 0 7.2-.5a2.5 2.5 0 001.8-1.8c.3-1.2.5-2.3.5-3.5s-.2-2.3-.5-3.5zM10 15V9l5 3-5 3z',
                },
                {
                  label: 'Instagram',
                  path: 'M7 3h10a4 4 0 014 4v10a4 4 0 01-4 4H7a4 4 0 01-4-4V7a4 4 0 014-4zm5 5a4 4 0 100 8 4 4 0 000-8zm5.2-.8a1 1 0 100 2 1 1 0 000-2z',
                },
              ].map((soc) => (
                <button
                  key={soc.label}
                  type="button"
                  onClick={() =>
                    showToast(
                      isHindi
                        ? `${soc.label} — डेमो बटन`
                        : `${soc.label} — Demo button`
                    )
                  }
                  aria-label={soc.label}
                  className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-700 hover:border-orange-500 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="w-4 h-4"
                    fill={soc.label === 'LinkedIn' ? 'none' : 'currentColor'}
                    stroke={soc.label === 'LinkedIn' ? 'currentColor' : 'none'}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d={soc.path} />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t border-slate-800 py-4 px-4 text-center text-xs text-slate-400">
          © Core Engineering (Demo)
        </div>
      </footer>

      {/* =====================================================================
          FLOATING WHATSAPP-STYLE DEMO BUTTON (Shows "डेमो बटन" Toast)
         ===================================================================== */}
      <button
        type="button"
        onClick={() =>
          showToast(
            t('Demo button — WhatsApp preview only', 'डेमो बटन — यह केवल नमूना है')
          )
        }
        aria-label={t('WhatsApp Demo Button', 'व्हाट्सएप डेमो बटन')}
        className="fixed bottom-5 right-5 z-40 w-13 h-13 rounded-full bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white shadow-xl flex items-center justify-center transition-transform cursor-pointer focus-visible:outline-2 focus-visible:outline-white"
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {/* =====================================================================
          SERVICE SCOPE DETAILS MODAL
         ===================================================================== */}
      {selectedServiceModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={
            isHindi ? selectedServiceModal.titleHi : selectedServiceModal.titleEn
          }
          onClick={() => setSelectedServiceModal(null)}
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
          >
            <div className="relative h-52 bg-slate-900 shrink-0">
              <img
                src={selectedServiceModal.image}
                alt={
                  isHindi ? selectedServiceModal.titleHi : selectedServiceModal.titleEn
                }
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent" />
              <button
                type="button"
                onClick={() => setSelectedServiceModal(null)}
                aria-label={t('Close', 'बंद करें')}
                className="absolute top-3 right-3 p-2 rounded-lg bg-slate-950/70 text-white hover:bg-slate-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="absolute bottom-4 left-5 right-5 text-xl font-black text-white">
                {isHindi ? selectedServiceModal.titleHi : selectedServiceModal.titleEn}
              </h3>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <p className="text-sm text-slate-600 leading-relaxed">
                {isHindi
                  ? selectedServiceModal.shortDescHi
                  : selectedServiceModal.shortDescEn}
              </p>

              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-orange-600 mb-2.5">
                  {t('Scope of Work', 'कार्य का दायरा')}
                </h4>
                <ul className="space-y-2 text-sm text-slate-800">
                  {(isHindi
                    ? selectedServiceModal.scopeHi
                    : selectedServiceModal.scopeEn
                  ).map((point) => (
                    <li key={point} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-3 flex flex-wrap justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedServiceModal(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  {t('Close', 'बंद करें')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const svcId = selectedServiceModal.id;
                    setQuoteForm((f) => ({ ...f, service: svcId }));
                    setSelectedServiceModal(null);
                    scrollToId('ce-quote');
                  }}
                  className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold cursor-pointer"
                >
                  {t('Get Quote for This Service', 'इस सेवा का कोटेशन पाएँ')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          PROJECT GALLERY LIGHTBOX MODAL
         ===================================================================== */}
      {activeLightboxProject && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={
            isHindi ? activeLightboxProject.titleHi : activeLightboxProject.titleEn
          }
          onClick={() => setLightboxIndex(null)}
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl bg-[#081226] border border-slate-700 rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
          >
            <div className="flex items-center justify-between gap-4 px-5 py-3 border-b border-slate-800 text-white">
              <div className="min-w-0">
                <p className="text-sm font-extrabold truncate">
                  {isHindi
                    ? activeLightboxProject.titleHi
                    : activeLightboxProject.titleEn}{' '}
                  ·{' '}
                  <span className="text-orange-400 font-semibold text-xs">
                    {t('Sample Project', 'नमूना प्रोजेक्ट')}
                  </span>
                </p>
                <p className="text-xs text-slate-400 truncate">
                  {isHindi
                    ? activeLightboxProject.summaryHi
                    : activeLightboxProject.summaryEn}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setLightboxIndex(null)}
                aria-label={t('Close preview', 'बंद करें')}
                className="p-2 rounded-md text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative flex-1 min-h-0 flex items-center justify-center p-4">
              {filteredProjects.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setLightboxIndex((idx) =>
                      idx === null
                        ? null
                        : (idx - 1 + filteredProjects.length) %
                          filteredProjects.length
                    )
                  }
                  aria-label={t('Previous project', 'पिछला प्रोजेक्ट')}
                  className="absolute left-3 z-10 p-2.5 rounded-md bg-slate-950/80 hover:bg-slate-900 text-white border border-slate-700 cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}

              <img
                src={activeLightboxProject.image}
                alt={
                  isHindi
                    ? activeLightboxProject.titleHi
                    : activeLightboxProject.titleEn
                }
                referrerPolicy="no-referrer"
                className="max-h-[72vh] max-w-full w-auto h-auto object-contain rounded-lg"
              />

              {filteredProjects.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setLightboxIndex((idx) =>
                      idx === null ? null : (idx + 1) % filteredProjects.length
                    )
                  }
                  aria-label={t('Next project', 'अगला प्रोजेक्ट')}
                  className="absolute right-3 z-10 p-2.5 rounded-md bg-slate-950/80 hover:bg-slate-900 text-white border border-slate-700 cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          FLOATING DEMO TOAST
         ===================================================================== */}
      {toastMsg && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 right-5 z-50 px-4 py-2.5 rounded-xl bg-[#081226] text-white border border-slate-700 text-xs sm:text-sm font-semibold shadow-xl"
        >
          {toastMsg}
        </div>
      )}
    </div>
  );
};
