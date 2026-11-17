import React, { useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { PageRoute } from '../../types';
import { OPTIMIZED_ASSETS } from '../../data/content';

export const PLACEHOLDER_SITE_URL = 'https://YOUR-DOMAIN.com';
export const DEFAULT_OG_IMAGE_PATH = '/og-image.jpg';
export const SITE_NAME = 'POWER WEB STUDIO AI';

export function resolveSiteOrigin(): string {
  const buildSiteUrl = (import.meta.env.VITE_SITE_URL || '').trim().replace(/\/+$/, '');
  if (/^https?:\/\//i.test(buildSiteUrl) && buildSiteUrl !== PLACEHOLDER_SITE_URL) {
    return buildSiteUrl;
  }
  if (typeof document !== 'undefined') {
    const metaSiteUrl = document.head
      .querySelector<HTMLMetaElement>('meta[name="site-url"]')
      ?.getAttribute('content')
      ?.trim()
      .replace(/\/+$/, '');
    if (metaSiteUrl && /^https?:\/\//i.test(metaSiteUrl) && metaSiteUrl !== PLACEHOLDER_SITE_URL) {
      return metaSiteUrl;
    }
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin.replace(/\/+$/, '');
  }
  return PLACEHOLDER_SITE_URL;
}

export interface SEOProps {
  titleEn: string;
  titleHi?: string;
  descriptionEn: string;
  descriptionHi?: string;
  ogTitleEn?: string;
  ogTitleHi?: string;
  ogDescriptionEn?: string;
  ogDescriptionHi?: string;
  ogImage?: string;
  ogImageAltEn?: string;
  ogImageAltHi?: string;
  ogType?: 'website' | 'article' | 'product';
  canonicalPath?: string;
  noIndex?: boolean;
  structuredDataExtra?: Record<string, unknown>[];
}

function upsertMetaTag(attrName: 'name' | 'property', attrValue: string, content: string): void {
  if (typeof document === 'undefined' || !content) return;
  const selector = `meta[${attrName}="${attrValue}"]`;
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attrName, attrValue);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function upsertCanonicalLink(href: string): void {
  if (typeof document === 'undefined' || !href) return;
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

function upsertStructuredData(
  origin: string,
  canonicalUrl: string,
  pageTitle: string,
  extraNodes?: Record<string, unknown>[]
): void {
  if (typeof document === 'undefined') return;
  let script = document.head.querySelector<HTMLScriptElement>('#pws-structured-data');
  if (!script) {
    script =
      document.head.querySelector<HTMLScriptElement>('script[type="application/ld+json"]') ||
      document.createElement('script');
    script.id = 'pws-structured-data';
    script.type = 'application/ld+json';
    if (!script.parentNode) {
      document.head.appendChild(script);
    }
  }

  const graph: Record<string, unknown>[] = [
    {
      '@type': 'Organization',
      name: 'BHANU RAM BARIHA DIGITAL TECHNOLOGIES',
      alternateName: SITE_NAME,
      url: `${origin}/`,
      logo: `${origin}/apple-touch-icon.png`,
      image: `${origin}${DEFAULT_OG_IMAGE_PATH}`,
      email: 'powerusertopuser@gmail.com',
      telephone: '+91-8305457717',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Fingeshwar Borid Mod, Rajim Subdistrict',
        addressLocality: 'Gariaband District',
        addressRegion: 'Chhattisgarh',
        postalCode: '493992',
        addressCountry: 'IN',
      },
    },
    {
      '@type': 'WebApplication',
      name: SITE_NAME,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web, Android',
      url: `${origin}/`,
      image: `${origin}${DEFAULT_OG_IMAGE_PATH}`,
    },
  ];

  if (canonicalUrl !== `${origin}/`) {
    graph.push({
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: SITE_NAME,
          item: `${origin}/`,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: pageTitle,
          item: canonicalUrl,
        },
      ],
    });
  }

  if (Array.isArray(extraNodes) && extraNodes.length > 0) {
    graph.push(...extraNodes);
  }

  script.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': graph,
  });
}

export function resolveOgImageUrl(imageSrc?: string): string {
  const origin = resolveSiteOrigin();

  if (!imageSrc || imageSrc.startsWith('data:')) {
    return `${origin}${DEFAULT_OG_IMAGE_PATH}`;
  }
  if (/^https?:\/\//i.test(imageSrc)) {
    return imageSrc;
  }
  const normalized = imageSrc.startsWith('/') ? imageSrc : `/${imageSrc}`;
  return `${origin}${normalized}`;
}

export function resolveCanonicalUrl(canonicalPath?: string): string {
  const origin = resolveSiteOrigin();
  if (!canonicalPath || canonicalPath === '/') {
    return `${origin}/`;
  }
  if (/^https?:\/\//i.test(canonicalPath)) {
    return canonicalPath;
  }
  const normalized = canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`;
  return `${origin}${normalized}`;
}

export function useSEO(props: SEOProps): void {
  const { language } = useLanguage();
  const {
    titleEn,
    titleHi,
    descriptionEn,
    descriptionHi,
    ogTitleEn,
    ogTitleHi,
    ogDescriptionEn,
    ogDescriptionHi,
    ogImage,
    ogImageAltEn,
    ogImageAltHi,
    ogType = 'website',
    canonicalPath,
    noIndex = false,
    structuredDataExtra,
  } = props;

  useEffect(() => {
    const isHindi = language === 'hi';

    const resolvedTitle = isHindi ? titleHi || titleEn : titleEn;
    const resolvedDescription = isHindi ? descriptionHi || descriptionEn : descriptionEn;
    const resolvedOgTitle = isHindi
      ? ogTitleHi || titleHi || ogTitleEn || titleEn
      : ogTitleEn || titleEn;
    const resolvedOgDescription = isHindi
      ? ogDescriptionHi || descriptionHi || ogDescriptionEn || descriptionEn
      : ogDescriptionEn || descriptionEn;
    const resolvedImageAlt = isHindi
      ? ogImageAltHi || ogImageAltEn || resolvedOgTitle
      : ogImageAltEn || resolvedOgTitle;

    const resolvedOrigin = resolveSiteOrigin();
    const resolvedImage = resolveOgImageUrl(ogImage);
    const resolvedUrl = resolveCanonicalUrl(canonicalPath);

    document.title = resolvedTitle;
    document.documentElement.lang = language;

    upsertMetaTag('name', 'site-url', resolvedOrigin);
    upsertMetaTag('name', 'description', resolvedDescription);
    upsertMetaTag('name', 'robots', noIndex ? 'noindex, nofollow' : 'index, follow');

    // Open Graph
    upsertMetaTag('property', 'og:title', resolvedOgTitle);
    upsertMetaTag('property', 'og:description', resolvedOgDescription);
    upsertMetaTag('property', 'og:type', ogType);
    upsertMetaTag('property', 'og:url', resolvedUrl);
    upsertMetaTag('property', 'og:site_name', SITE_NAME);
    upsertMetaTag('property', 'og:locale', isHindi ? 'hi_IN' : 'en_US');
    upsertMetaTag('property', 'og:image', resolvedImage);
    if (resolvedImage.startsWith('https://')) {
      upsertMetaTag('property', 'og:image:secure_url', resolvedImage);
    } else {
      document.head.querySelector('meta[property="og:image:secure_url"]')?.remove();
    }
    upsertMetaTag('property', 'og:image:alt', resolvedImageAlt);

    // Twitter Card
    upsertMetaTag('name', 'twitter:card', 'summary_large_image');
    upsertMetaTag('name', 'twitter:title', resolvedOgTitle);
    upsertMetaTag('name', 'twitter:description', resolvedOgDescription);
    upsertMetaTag('name', 'twitter:image', resolvedImage);
    upsertMetaTag('name', 'twitter:image:alt', resolvedImageAlt);

    upsertCanonicalLink(resolvedUrl);
    upsertStructuredData(resolvedOrigin, resolvedUrl, resolvedTitle, structuredDataExtra);
  }, [
    language,
    titleEn,
    titleHi,
    descriptionEn,
    descriptionHi,
    ogTitleEn,
    ogTitleHi,
    ogDescriptionEn,
    ogDescriptionHi,
    ogImage,
    ogImageAltEn,
    ogImageAltHi,
    ogType,
    canonicalPath,
    noIndex,
    structuredDataExtra,
  ]);
}

export const SEO: React.FC<SEOProps> = (props) => {
  useSEO(props);
  return null;
};

export const ROUTE_SEO_CONFIG: Record<PageRoute, SEOProps> = {
  home: {
    titleEn: 'POWER WEB STUDIO AI — Enterprise Software & AI Suite',
    titleHi: 'POWER WEB STUDIO AI — एंटरप्राइज सॉफ्टवेयर एवं एआई सुइट',
    descriptionEn:
      'Bhanu Ram Bariha Digital Technologies (POWER WEB STUDIO AI): Mission-critical distributed backends, native Android apps, and sovereign AI systems.',
    descriptionHi:
      'भानु राम बरीहा डिजिटल टेक्नोलॉजीज (POWER WEB STUDIO AI): एंटरप्राइज डिस्ट्रीब्यूटेड बैकएंड, नेटिव एंड्रॉइड ऐप्स और ऑटोनॉमस एआई सिस्टम।',
    ogTitleEn: 'POWER WEB STUDIO AI — Bhanu Ram Bariha Digital Technologies',
    ogTitleHi: 'POWER WEB STUDIO AI — भानु राम बरीहा डिजिटल टेक्नोलॉजीज',
    ogDescriptionEn:
      'Enterprise Digital Technology Platform, Native Android Engineering & Sovereign AI Suite by Bhanu Ram Bariha Digital Technologies.',
    ogDescriptionHi:
      'भानु राम बरीहा डिजिटल टेक्नोलॉजीज द्वारा एंटरप्राइज डिजिटल टेक्नोलॉजी प्लेटफॉर्म, नेटिव एंड्रॉइड इंजीनियरिंग एवं सॉवरेन एआई सूट।',
    ogImage: DEFAULT_OG_IMAGE_PATH,
    canonicalPath: '/',
  },
  services: {
    titleEn: 'Enterprise Engineering Services | POWER WEB STUDIO AI',
    titleHi: 'एंटरप्राइज सॉफ्टवेयर और एआई सेवाएं | POWER WEB STUDIO AI',
    descriptionEn:
      'Explore distributed backend systems, native Kotlin Android development, cloud architecture, and custom enterprise AI engineering services.',
    descriptionHi:
      'वितरित बैकएंड सिस्टम, नेटिव कोटलिन एंड्रॉइड विकास, क्लाउड आर्किटेक्चर और कस्टम एंटरप्राइज एआई इंजीनियरिंग सेवाएं।',
    ogImage: OPTIMIZED_ASSETS.heroImage.jpg,
    canonicalPath: '/services',
  },
  'ai-solutions': {
    titleEn: 'Sovereign Enterprise AI & RAG | POWER WEB STUDIO AI',
    titleHi: 'सॉवरेन एंटरप्राइज एआई और आरएजी | POWER WEB STUDIO AI',
    descriptionEn:
      'Privacy-first private LLMs, verified RAG pipelines, workflow automation, and sovereign AI orchestration by Bhanu Ram Bariha Digital Technologies.',
    descriptionHi:
      'डेटा सुरक्षा के साथ प्राइवेट एलएलएम, सत्यापित आरएजी (RAG) पाइपलाइन और स्वायत्त वर्कफ़्लो ऑटोमेशन समाधान।',
    ogImage: OPTIMIZED_ASSETS.aiImage.jpg,
    canonicalPath: '/ai-solutions',
  },
  'android-portfolio': {
    titleEn: 'Native Android Apps Portfolio | POWER WEB STUDIO AI',
    titleHi: 'नेटिव एंड्रॉइड ऐप पोर्टफोलियो | POWER WEB STUDIO AI',
    descriptionEn:
      'Production-hardened Kotlin, Jetpack Compose, and offline-first SQLiteCipher Android applications engineered for FinTech, GovTech, EdTech, and Commerce.',
    descriptionHi:
      'फिनटेक, एडटेक और एंटरप्राइज संचालन के लिए निर्मित कोटलिन, जेटपैक कंपोज़ और ऑफलाइन-फर्स्ट एंड्रॉइड ऐप्स का पोर्टफोलियो।',
    ogImage: OPTIMIZED_ASSETS.androidImage.jpg,
    canonicalPath: '/android-portfolio',
  },
  'app-detail': {
    titleEn: 'Android App Architecture & Specs | POWER WEB STUDIO AI',
    titleHi: 'एंड्रॉइड ऐप आर्किटेक्चर व विवरण | POWER WEB STUDIO AI',
    descriptionEn:
      'Detailed mobile architecture, offline SQLite synchronization, performance benchmarks, and changelog for our enterprise Android platforms.',
    descriptionHi:
      'हमारे एंटरप्राइज एंड्रॉइड प्लेटफ़ॉर्म का विस्तृत मोबाइल आर्किटेक्चर, प्रदर्शन बेंचमार्क और तकनीकी विनिर्देश।',
    ogImage: OPTIMIZED_ASSETS.androidImage.jpg,
    canonicalPath: '/android-portfolio',
  },
  process: {
    titleEn: '6-Phase Engineering Methodology | POWER WEB STUDIO AI',
    titleHi: '6-चरणीय इंजीनियरिंग कार्यप्रणाली | POWER WEB STUDIO AI',
    descriptionEn:
      'Zero-surprise delivery from architectural blueprint and SOW scoping to automated testing, security hardening, and production SLA governance.',
    descriptionHi:
      'आर्किटेक्चर ब्लूप्रिंट से लेकर सुरक्षा परीक्षण और प्रोडक्शन एसएलए गवर्नेंस तक हमारी पारदर्शी 6-चरणीय इंजीनियरिंग कार्यप्रणाली।',
    ogImage: OPTIMIZED_ASSETS.heroImage.jpg,
    canonicalPath: '/process',
  },
  about: {
    titleEn: 'About Bhanu Ram Bariha Digital | POWER WEB STUDIO AI',
    titleHi: 'भानु राम बरीहा डिजिटल टेक्नोलॉजीज | POWER WEB STUDIO AI',
    descriptionEn:
      'Registered Indian digital engineering firm founded by Bhanu Ram Bariha delivering enterprise software, native Android ecosystems, and sovereign AI.',
    descriptionHi:
      'भानु राम बरीहा द्वारा स्थापित पंजीकृत भारतीय सॉफ्टवेयर इंजीनियरिंग कंपनी — एंटरप्राइज सॉफ्टवेयर, एंड्रॉइड और सॉवरेन एआई।',
    ogImage: OPTIMIZED_ASSETS.campusImage.jpg,
    canonicalPath: '/about',
  },
  contact: {
    titleEn: 'Consultation & Contact | POWER WEB STUDIO AI',
    titleHi: 'तकनीकी परामर्श और संपर्क | POWER WEB STUDIO AI',
    descriptionEn:
      'Schedule an engineering consultation or submit an RFP/RFQ with Bhanu Ram Bariha Digital Technologies in Chhattisgarh, India.',
    descriptionHi:
      'आर्किटेक्चर परामर्श बुक करें या भानु राम बरीहा डिजिटल टेक्नोलॉजीज से अपने सॉफ्टवेयर प्रोजेक्ट के लिए संपर्क करें।',
    ogImage: DEFAULT_OG_IMAGE_PATH,
    canonicalPath: '/contact',
  },
  blog: {
    titleEn: 'Engineering Blog & Research | POWER WEB STUDIO AI',
    titleHi: 'तकनीकी शोध और इंजीनियरिंग ब्लॉग | POWER WEB STUDIO AI',
    descriptionEn:
      'Technical insights written by Principal Architects on distributed systems, offline Kotlin Android engineering, and sovereign enterprise AI.',
    descriptionHi:
      'वितरित सिस्टम, ऑफलाइन कोटलिन एंड्रॉइड इंजीनियरिंग और सॉवरेन एआई पर हमारे प्रमुख आर्किटेक्ट्स के तकनीकी शोध लेख।',
    ogImage: OPTIMIZED_ASSETS.blogImage.jpg,
    canonicalPath: '/blog',
  },
  privacy: {
    titleEn: 'Privacy Policy & Data Governance | POWER WEB STUDIO AI',
    titleHi: 'गोपनीयता नीति और डेटा सुरक्षा | POWER WEB STUDIO AI',
    descriptionEn:
      'Data processing, DPDP Act compliance, telemetry, and client confidentiality commitments at Bhanu Ram Bariha Digital Technologies.',
    descriptionHi:
      'भानु राम बरीहा डिजिटल टेक्नोलॉजीज की डेटा गोपनीयता, अनुपालन और क्लाइंट सुरक्षा नीतियां।',
    canonicalPath: '/privacy',
  },
  terms: {
    titleEn: 'Terms & Conditions of Service | POWER WEB STUDIO AI',
    titleHi: 'सेवा की शर्तें और कानूनी सूचना | POWER WEB STUDIO AI',
    descriptionEn:
      'Master service terms, intellectual property rights, and SOW engagement guidelines for POWER WEB STUDIO AI clients.',
    descriptionHi:
      'POWER WEB STUDIO AI के क्लाइंट्स के लिए सेवा की शर्तें, बौद्धिक संपदा अधिकार और अनुबंध दिशानिर्देश।',
    canonicalPath: '/terms',
  },
  'client-dashboard': {
    titleEn: 'Client Engineering Portal | POWER WEB STUDIO AI',
    titleHi: 'क्लाइंट इंजीनियरिंग पोर्टल | POWER WEB STUDIO AI',
    descriptionEn: 'Authenticated client workspace for project milestones, invoices, and support tickets.',
    descriptionHi: 'प्रोजेक्ट माइलस्टोन, इनवॉइस और सपोर्ट टिकट प्रबंधन के लिए क्लाइंट पोर्टल।',
    canonicalPath: '/client-dashboard',
    noIndex: true,
  },
  'admin-dashboard': {
    titleEn: 'Executive Admin Console | POWER WEB STUDIO AI',
    titleHi: 'प्रशासनिक नियंत्रण कंसोल | POWER WEB STUDIO AI',
    descriptionEn: 'Authorized administrator portal for operations, RBAC governance, and lead management.',
    descriptionHi: 'संचालन, भूमिका प्रबंधन और अनुरोध नियंत्रण के लिए अधिकृत एडमिन कंसोल।',
    canonicalPath: '/admin-dashboard',
    noIndex: true,
  },
  'not-found': {
    titleEn: 'Page Not Found (404) | POWER WEB STUDIO AI',
    titleHi: 'पृष्ठ नहीं मिला (404) | POWER WEB STUDIO AI',
    descriptionEn: 'The requested enterprise page or resource could not be found.',
    descriptionHi: 'अनुरोधित पृष्ठ या संसाधन उपलब्ध नहीं है।',
    canonicalPath: '/',
    noIndex: true,
  },
};

export const RouteSEO: React.FC<{ currentRoute: PageRoute }> = ({ currentRoute }) => {
  // BlogPage and AppDetailPage manage their own dynamic item-level SEO tags cleanly
  if (currentRoute === 'blog' || currentRoute === 'app-detail') {
    return null;
  }
  const config = ROUTE_SEO_CONFIG[currentRoute] || ROUTE_SEO_CONFIG.home;
  return <SEO {...config} />;
};
