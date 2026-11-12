import { Language } from './types';

/**
 * Enterprise Formatter Suite for Bilingual Localization (Hindi + English)
 * BHANU RAM BARIHA DIGITAL TECHNOLOGIES
 */

const HINDI_MONTHS = [
  'जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून',
  'जुलाई', 'अगस्त', 'सितम्बर', 'अक्टूबर', 'नवम्बर', 'दिसम्बर'
];

const ENGLISH_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Format date consistently in Hindi and English
 */
export function formatDate(dateInput: Date | string | number, lang: Language): string {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';

  const day = d.getDate();
  const monthIdx = d.getMonth();
  const year = d.getFullYear();

  if (lang === 'hi') {
    return `${day} ${HINDI_MONTHS[monthIdx]} ${year}`;
  }
  return `${ENGLISH_MONTHS[monthIdx]} ${day}, ${year}`;
}

/**
 * Format currency with Indian Rupee (INR) or international standards
 */
export function formatCurrency(amount: number, lang: Language, currency: string = 'INR'): string {
  try {
    const locale = lang === 'hi' ? 'hi-IN' : 'en-IN';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `₹${amount.toLocaleString()}`;
  }
}

/**
 * Format standard numbers with locale-specific grouping
 */
export function formatNumber(num: number, lang: Language): string {
  try {
    const locale = lang === 'hi' ? 'hi-IN' : 'en-IN';
    return new Intl.NumberFormat(locale).format(num);
  } catch {
    return num.toString();
  }
}

/**
 * Format relative time (e.g. "2 hours ago" / "2 घंटे पहले")
 */
export function formatRelativeTime(minutesAgo: number, lang: Language): string {
  if (minutesAgo < 1) {
    return lang === 'hi' ? 'अभी-अभी' : 'Just now';
  }
  if (minutesAgo < 60) {
    return lang === 'hi' ? `${minutesAgo} मिनट पहले` : `${minutesAgo}m ago`;
  }
  const hours = Math.floor(minutesAgo / 60);
  if (hours < 24) {
    return lang === 'hi' ? `${hours} घंटे पहले` : `${hours}h ago`;
  }
  const days = Math.floor(hours / 24);
  return lang === 'hi' ? `${days} दिन पहले` : `${days}d ago`;
}
