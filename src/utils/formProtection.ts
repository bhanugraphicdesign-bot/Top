import { Language } from '../types';

export const MIN_HUMAN_FORM_FILL_MS = 1500;

export interface AntiBotCheckInput {
  honeypotValue: string;
  formOpenedAt: number;
  language: Language;
  minFillMs?: number;
}

export interface AntiBotCheckResult {
  ok: boolean;
  reason?: 'honeypot' | 'too_fast';
  message?: string;
}

export function computeFillDurationMs(formOpenedAt: number): number {
  const elapsed = Date.now() - formOpenedAt;
  return Number.isFinite(elapsed) && elapsed >= 0 ? elapsed : 0;
}

export function validateFormAntiBot({
  honeypotValue,
  formOpenedAt,
  language,
  minFillMs = MIN_HUMAN_FORM_FILL_MS,
}: AntiBotCheckInput): AntiBotCheckResult {
  if (honeypotValue.trim().length > 0) {
    return {
      ok: false,
      reason: 'honeypot',
      message:
        language === 'hi'
          ? 'स्वचालित बॉट अनुरोध अवरुद्ध कर दिया गया है। कृपया पृष्ठ रीफ़्रेश करें और पुनः प्रयास करें।'
          : 'Automated submission blocked. Please refresh the page and try again.',
    };
  }

  if (minFillMs > 0) {
    const elapsedMs = computeFillDurationMs(formOpenedAt);
    if (elapsedMs < minFillMs) {
      return {
        ok: false,
        reason: 'too_fast',
        message:
          language === 'hi'
            ? 'अनुरोध बहुत तेज़ी से सबमिट किया गया। कृपया विवरण जांचने के लिए 2 सेकंड प्रतीक्षा करें और पुनः प्रयास करें।'
            : 'Submission sent too quickly. Please wait a couple of seconds to review your details and try again.',
      };
    }
  }

  return { ok: true };
}

export function extractBilingualApiError(
  status: number,
  data: Record<string, any> | null | undefined,
  language: Language,
  fallbackEn: string,
  fallbackHi: string
): string {
  if (data) {
    const localized = language === 'hi' ? data.errorHi || data.error : data.errorEn || data.error;
    if (typeof localized === 'string' && localized.trim().length > 0) {
      return localized;
    }
  }

  if (status === 429) {
    const retrySeconds = Number(data?.retryAfterSeconds);
    const waitMins =
      Number.isFinite(retrySeconds) && retrySeconds > 0 ? Math.max(1, Math.ceil(retrySeconds / 60)) : 15;
    return language === 'hi'
      ? `बहुत अधिक अनुरोध भेजे गए हैं। कृपया ${waitMins} मिनट बाद पुनः प्रयास करें।`
      : `Too many submissions from your connection. Please wait ${waitMins} minute(s) and try again.`;
  }

  return language === 'hi' ? fallbackHi : fallbackEn;
}
