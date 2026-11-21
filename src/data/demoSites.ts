export interface DemoSiteItem {
  slug: string;
  nameEn: string;
  nameHi: string;
  descriptionEn: string;
  descriptionHi: string;
  categoryEn: string;
  categoryHi: string;
  previewImage: string;
  accentFrom: string;
  accentTo: string;
  mrp: number;
  badgeEn?: string;
  badgeHi?: string;
}

const INR_FORMATTER = new Intl.NumberFormat('en-IN');

export function formatIndianMrp(mrp: number): string {
  return `₹${INR_FORMATTER.format(mrp)}`;
}

/**
 * Registry of interactive client demo websites.
 * Designed to scale easily as additional industry demos (up to 10+) are added.
 */
export const DEMO_SITES: DemoSiteItem[] = [
  {
    slug: 'shopping',
    nameEn: 'Desi Bazaar',
    nameHi: 'देसी बाज़ार',
    descriptionEn:
      'Complete Indian handcrafted online store with live search, category filters, wishlist, cart, and demo checkout.',
    descriptionHi:
      'लाइव सर्च, कैटेगरी फ़िल्टर, विशलिस्ट, कार्ट और डेमो चेकआउट के साथ भारतीय ऑनलाइन शॉपिंग स्टोर।',
    categoryEn: 'Online Shopping',
    categoryHi: 'ऑनलाइन शॉपिंग',
    previewImage: '/demo/shopping/hero.jpg',
    accentFrom: '#9d174d',
    accentTo: '#c2592b',
    mrp: 149999,
  },
  {
    slug: 'core-engineering',
    nameEn: 'Core Engineering',
    nameHi: 'कोर इंजीनियरिंग',
    descriptionEn:
      'Corporate engineering & construction website showcasing civil, mechanical, electrical, HVAC, solar, and CAD services.',
    descriptionHi:
      'सिविल, मैकेनिकल, इलेक्ट्रिकल, HVAC, सोलर और CAD सेवाओं के साथ आधुनिक इंजीनियरिंग कंपनी वेबसाइट।',
    categoryEn: 'Company / Engineering',
    categoryHi: 'कंपनी / इंजीनियरिंग',
    previewImage: '/demo/core-engineering/hero.jpg',
    accentFrom: '#0f1f3d',
    accentTo: '#ea580c',
    mrp: 79999,
  },
  {
    slug: 'web-ecosystem',
    nameEn: 'Web Ecosystem',
    nameHi: 'वेब इकोसिस्टम',
    descriptionEn:
      'Modern dark-theme digital agency website showcasing websites, mobile apps, cloud hosting, SEO, interactive ecosystem hub, and sample packages.',
    descriptionHi:
      'वेबसाइट, मोबाइल ऐप, क्लाउड होस्टिंग, SEO, इंटरैक्टिव इकोसिस्टम और सैंपल पैकेज के साथ आधुनिक डिजिटल एजेंसी वेबसाइट।',
    categoryEn: 'Digital Agency / IT',
    categoryHi: 'डिजिटल एजेंसी / IT',
    previewImage: '/demo/web-ecosystem/hero.jpg',
    accentFrom: '#070b18',
    accentTo: '#6366f1',
    mrp: 99999,
  },
  {
    slug: 'mobile-system',
    nameEn: 'Mobile System',
    nameHi: 'मोबाइल सिस्टम',
    descriptionEn:
      'Native and modern Android ecosystem agency showcasing Kotlin apps, Wear OS, tablet dashboards, UPI payments, and sample packages.',
    descriptionHi:
      'नेटिव और आधुनिक एंड्रॉइड इकोसिस्टम — Kotlin ऐप्स, Wear OS, टैबलेट डैशबोर्ड, UPI पेमेंट और सैंपल पैकेज के साथ।',
    categoryEn: 'Mobile App / Android',
    categoryHi: 'मोबाइल ऐप / एंड्रॉइड',
    previewImage: '/demo/mobile-system/hero.jpg',
    accentFrom: '#0b1416',
    accentTo: '#3ddc84',
    mrp: 99999,
  },
  {
    slug: 'artificial-intelligence',
    nameEn: 'Artificial Intelligence',
    nameHi: 'आर्टिफिशियल इंटेलिजेंस',
    descriptionEn:
      'Enterprise AI & autonomous agents platform featuring interactive sample agent chat, workflows, industry use cases, and governance principles.',
    descriptionHi:
      'एंटरप्राइज़ एआई और ऑटोनॉमस एजेंट्स — इंटरैक्टिव डेमो एजेंट चैट, वर्कफ़्लो, उद्योग उपयोग और सुरक्षा सिद्धांतों के साथ।',
    categoryEn: 'AI / Enterprise',
    categoryHi: 'AI / एंटरप्राइज़',
    previewImage: '/demo/artificial-intelligence/hero.jpg',
    accentFrom: '#050814',
    accentTo: '#06b6d4',
    mrp: 299999,
  },
  {
    slug: 'cloud-engineering',
    nameEn: 'Cloud Engineering',
    nameHi: 'क्लाउड इंजीनियरिंग',
    descriptionEn:
      'Cloud architecture & DevOps automation agency featuring interactive CI/CD pipeline runner, sample observability dashboard, and architecture diagram.',
    descriptionHi:
      'क्लाउड आर्किटेक्चर और डेवऑप्स ऑटोमेशन — इंटरैक्टिव CI/CD पाइपलाइन, नमूना मॉनिटरिंग डैशबोर्ड और क्लाउड आर्किटेक्चर के साथ।',
    categoryEn: 'Cloud / DevOps',
    categoryHi: 'क्लाउड / DevOps',
    previewImage: '/demo/cloud-engineering/hero.jpg',
    accentFrom: '#060d18',
    accentTo: '#14b8a6',
    mrp: 199999,
  },
  {
    slug: 'integration-suite',
    nameEn: 'Integration Suite',
    nameHi: 'इंटीग्रेशन सुइट',
    descriptionEn:
      'Secure API gateway & data integration showcasing animated data flow, connector directory, sample API tester, and enterprise security principles.',
    descriptionHi:
      'सुरक्षित एपीआई गेटवे और डेटा इंटीग्रेशन — डेटा फ़्लो, कनेक्टर सूची, नमूना API टेस्टर और ऑटोमेशन के साथ।',
    categoryEn: 'API / Integration',
    categoryHi: 'API / इंटीग्रेशन',
    previewImage: '/demo/integration-suite/hero.jpg',
    accentFrom: '#070c14',
    accentTo: '#10b981',
    mrp: 249999,
  },
  {
    slug: 'maha-bazaar',
    nameEn: 'Maha Bazaar Platform',
    nameHi: 'महा बाज़ार प्लेटफ़ॉर्म',
    descriptionEn:
      'Enterprise multi-vendor marketplace with 4 interactive role portals: Customer Storefront, Seller Panel, Delivery Tracking, and Admin Dashboard.',
    descriptionHi:
      'विक्रेता, ग्राहक, डिलीवरी और एडमिन — एक ही एंटरप्राइज़ मल्टी-वेंडर मार्केटप्लेस प्लेटफ़ॉर्म पर।',
    categoryEn: 'Enterprise Marketplace',
    categoryHi: 'एंटरप्राइज़ मार्केटप्लेस',
    previewImage: '/demo/maha-bazaar/hero.jpg',
    accentFrom: '#1e1b4b',
    accentTo: '#ea580c',
    mrp: 1499999,
    badgeEn: 'Flagship Demo',
    badgeHi: 'फ़्लैगशिप डेमो',
  },
];

export function getDemoSiteBySlug(slug?: string): DemoSiteItem | undefined {
  if (!slug) return undefined;
  return DEMO_SITES.find((site) => site.slug === slug.toLowerCase());
}
