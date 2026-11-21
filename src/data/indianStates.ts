export interface IndianStateOption {
  code: string;
  nameEn: string;
  nameHi: string;
}

export const DEFAULT_GST_STATE_CODE = '22';
export const DEFAULT_GST_LEGAL_NAME = 'BHANU RAM BARIHA DIGITAL TECHNOLOGIES';
export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

export const INDIAN_STATES: IndianStateOption[] = [
  { code: '01', nameEn: 'Jammu and Kashmir', nameHi: 'जम्मू और कश्मीर' },
  { code: '02', nameEn: 'Himachal Pradesh', nameHi: 'हिमाचल प्रदेश' },
  { code: '03', nameEn: 'Punjab', nameHi: 'पंजाब' },
  { code: '04', nameEn: 'Chandigarh', nameHi: 'चंडीगढ़' },
  { code: '05', nameEn: 'Uttarakhand', nameHi: 'उत्तराखंड' },
  { code: '06', nameEn: 'Haryana', nameHi: 'हरियाणा' },
  { code: '07', nameEn: 'Delhi', nameHi: 'दिल्ली' },
  { code: '08', nameEn: 'Rajasthan', nameHi: 'राजस्थान' },
  { code: '09', nameEn: 'Uttar Pradesh', nameHi: 'उत्तर प्रदेश' },
  { code: '10', nameEn: 'Bihar', nameHi: 'बिहार' },
  { code: '11', nameEn: 'Sikkim', nameHi: 'सिक्किम' },
  { code: '12', nameEn: 'Arunachal Pradesh', nameHi: 'अरुणाचल प्रदेश' },
  { code: '13', nameEn: 'Nagaland', nameHi: 'नागालैंड' },
  { code: '14', nameEn: 'Manipur', nameHi: 'मणिपुर' },
  { code: '15', nameEn: 'Mizoram', nameHi: 'मिज़ोरम' },
  { code: '16', nameEn: 'Tripura', nameHi: 'त्रिपुरा' },
  { code: '17', nameEn: 'Meghalaya', nameHi: 'मेघालय' },
  { code: '18', nameEn: 'Assam', nameHi: 'असम' },
  { code: '19', nameEn: 'West Bengal', nameHi: 'पश्चिम बंगाल' },
  { code: '20', nameEn: 'Jharkhand', nameHi: 'झारखंड' },
  { code: '21', nameEn: 'Odisha', nameHi: 'ओडिशा' },
  { code: '22', nameEn: 'Chhattisgarh', nameHi: 'छत्तीसगढ़' },
  { code: '23', nameEn: 'Madhya Pradesh', nameHi: 'मध्य प्रदेश' },
  { code: '24', nameEn: 'Gujarat', nameHi: 'गुजरात' },
  { code: '26', nameEn: 'Dadra and Nagar Haveli and Daman and Diu', nameHi: 'दादरा और नगर हवेली एवं दमन और दीव' },
  { code: '27', nameEn: 'Maharashtra', nameHi: 'महाराष्ट्र' },
  { code: '29', nameEn: 'Karnataka', nameHi: 'कर्नाटक' },
  { code: '30', nameEn: 'Goa', nameHi: 'गोवा' },
  { code: '31', nameEn: 'Lakshadweep', nameHi: 'लक्षद्वीप' },
  { code: '32', nameEn: 'Kerala', nameHi: 'केरल' },
  { code: '33', nameEn: 'Tamil Nadu', nameHi: 'तमिलनाडु' },
  { code: '34', nameEn: 'Puducherry', nameHi: 'पुदुच्चेरी' },
  { code: '35', nameEn: 'Andaman and Nicobar Islands', nameHi: 'अंडमान और निकोबार द्वीप समूह' },
  { code: '36', nameEn: 'Telangana', nameHi: 'तेलंगाना' },
  { code: '37', nameEn: 'Andhra Pradesh', nameHi: 'आंध्र प्रदेश' },
  { code: '38', nameEn: 'Ladakh', nameHi: 'लद्दाख' },
];

export function getIndianStateByCode(code?: string | null): IndianStateOption | undefined {
  if (!code) return undefined;
  const normalized = String(code).trim().padStart(2, '0');
  return INDIAN_STATES.find((st) => st.code === normalized);
}

export function validateGstinForState(
  rawGstin: string,
  stateCode: string
): { valid: boolean; normalized: string; errorHi?: string; errorEn?: string } {
  const normalized = rawGstin.trim().toUpperCase();
  if (!normalized) {
    return { valid: true, normalized: '' };
  }
  if (normalized.length !== 15 || !GSTIN_REGEX.test(normalized)) {
    return {
      valid: false,
      normalized,
      errorHi: 'अमान्य GSTIN। कृपया 15 अक्षरों का सही GSTIN दर्ज करें (उदाहरण: 22AAAAA0000A1Z5)।',
      errorEn: 'Invalid GSTIN. Enter a valid 15-character GSTIN (e.g. 22AAAAA0000A1Z5).',
    };
  }
  const normalizedState = String(stateCode || DEFAULT_GST_STATE_CODE).trim().padStart(2, '0');
  if (normalized.slice(0, 2) !== normalizedState) {
    const state = getIndianStateByCode(normalizedState);
    return {
      valid: false,
      normalized,
      errorHi: `GSTIN के पहले 2 अंक (${normalized.slice(0, 2)}) चुने गए राज्य कोड (${normalizedState}${state ? ` - ${state.nameHi}` : ''}) से मेल नहीं खाते।`,
      errorEn: `First 2 digits of GSTIN (${normalized.slice(0, 2)}) must match the selected state code (${normalizedState}${state ? ` - ${state.nameEn}` : ''}).`,
    };
  }
  return { valid: true, normalized };
}

/**
 * Returns the start date (in UTC ms) of the current Indian Financial Year (April 1, 00:00:00 IST)
 * along with its label (e.g. "2026-27").
 */
export function getCurrentIndianFinancialYearInfo(now: Date = new Date()): {
  fyLabel: string;
  fyStartMs: number;
  fyStartIso: string;
} {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const year = Number(parts.find((p) => p.type === 'year')?.value || now.getUTCFullYear());
  const month = Number(parts.find((p) => p.type === 'month')?.value || now.getUTCMonth() + 1);
  const fyStartYear = month >= 4 ? year : year - 1;
  const fyEndYearShort = String((fyStartYear + 1) % 100).padStart(2, '0');
  const fyStartIso = `${fyStartYear}-04-01T00:00:00+05:30`;
  const fyStartMs = new Date(fyStartIso).getTime();
  return {
    fyLabel: `${fyStartYear}-${fyEndYearShort}`,
    fyStartMs,
    fyStartIso,
  };
}
