export interface BilingualQuotationOption {
  value: string;
  labelEn: string;
  labelHi: string;
}

export const QUOTE_SERVICE_OPTIONS: readonly BilingualQuotationOption[] = [
  {
    value: 'enterprise-software',
    labelEn: 'Custom Enterprise Software',
    labelHi: 'कस्टम एंटरप्राइज सॉफ्टवेयर',
  },
  {
    value: 'android-ecosystem',
    labelEn: 'Android App Ecosystem',
    labelHi: 'एंड्रॉइड ऐप इकोसिस्टम',
  },
  {
    value: 'ai-solutions',
    labelEn: 'AI & Autonomous Agents',
    labelHi: 'एआई और ऑटोनॉमस एजेंट्स',
  },
  {
    value: 'web-platforms',
    labelEn: 'High-Performance Web Platform',
    labelHi: 'उच्च प्रदर्शन वेब प्लेटफॉर्म',
  },
  {
    value: 'cloud-devops',
    labelEn: 'Cloud DevOps & Kubernetes',
    labelHi: 'क्लाउड डेवऑप्स व कुबेरनेट्स',
  },
  {
    value: 'api-integration',
    labelEn: 'API Gateways & Modernization',
    labelHi: 'एपीआई गेटवे और आधुनिकीकरण',
  },
] as const;

export const QUOTE_BUDGET_OPTIONS: readonly BilingualQuotationOption[] = [
  {
    value: 'enterprise-custom',
    labelEn: 'Custom / Decided on Discussion',
    labelHi: 'कस्टम / चर्चा से तय',
  },
  {
    value: 'mid-tier',
    labelEn: 'Standard / Mid-Tier Scope',
    labelHi: 'मानक / मध्यम दायरा',
  },
  {
    value: 'under-1-lakh',
    labelEn: 'Under ₹1,00,000',
    labelHi: '₹1,00,000 से कम',
  },
  {
    value: '1-to-5-lakh',
    labelEn: '₹1,00,000 – ₹5,00,000',
    labelHi: '₹1,00,000 – ₹5,00,000',
  },
  {
    value: '5-to-15-lakh',
    labelEn: '₹5,00,000 – ₹15,00,000',
    labelHi: '₹5,00,000 – ₹15,00,000',
  },
  {
    value: 'above-15-lakh',
    labelEn: '₹15,00,000+',
    labelHi: '₹15,00,000 से अधिक',
  },
] as const;

const SERVICE_ALIASES: Record<string, string> = {
  'custom-enterprise-software': 'enterprise-software',
  'android-app-ecosystem': 'android-ecosystem',
  'ai-cognitive-engineering': 'ai-solutions',
  'web-app-engineering': 'web-platforms',
  'cloud-devops-infrastructure': 'cloud-devops',
  'api-gateway': 'api-integration',
  'api-security-gateway': 'api-integration',
};

const SERVICE_MAP = new Map<string, BilingualQuotationOption>(
  QUOTE_SERVICE_OPTIONS.map((opt) => [opt.value.toLowerCase(), opt])
);

const BUDGET_MAP = new Map<string, BilingualQuotationOption>(
  QUOTE_BUDGET_OPTIONS.map((opt) => [opt.value.toLowerCase(), opt])
);

export function getOptionLabel(opt: BilingualQuotationOption, language: 'en' | 'hi'): string {
  return language === 'hi' ? opt.labelHi : opt.labelEn;
}

export function formatQuotationService(rawValue: unknown, language: 'en' | 'hi'): string {
  if (rawValue === null || rawValue === undefined) return '—';
  const trimmed = String(rawValue).trim();
  if (!trimmed) return '—';

  const normalizedKey = trimmed.toLowerCase();
  const canonicalKey = SERVICE_ALIASES[normalizedKey] || normalizedKey;
  const matched = SERVICE_MAP.get(canonicalKey);
  if (matched) {
    return getOptionLabel(matched, language);
  }
  return trimmed;
}

export function formatQuotationBudget(rawValue: unknown, language: 'en' | 'hi'): string {
  if (rawValue === null || rawValue === undefined) return '—';

  if (typeof rawValue === 'number') {
    if (!Number.isFinite(rawValue)) return '—';
    return `₹${rawValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  }

  const trimmed = String(rawValue).trim();
  if (!trimmed) return '—';

  const matched = BUDGET_MAP.get(trimmed.toLowerCase());
  if (matched) {
    return getOptionLabel(matched, language);
  }

  // Format pure numeric values (e.g. "150000", "1,50,000", "₹150000", "INR 150000") in Indian INR format
  const numericCandidate = trimmed
    .replace(/^(?:₹|rs\.?|inr)\s*/i, '')
    .replace(/,/g, '')
    .trim();
  if (/^\d+(?:\.\d+)?$/.test(numericCandidate)) {
    const parsed = Number(numericCandidate);
    if (Number.isFinite(parsed)) {
      return `₹${parsed.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
    }
  }

  return trimmed;
}
