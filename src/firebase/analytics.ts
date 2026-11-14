import { Analytics, getAnalytics, isSupported, logEvent } from 'firebase/analytics';
import { firebaseApp, MEASUREMENT_ID } from './config';

type AnalyticsParamValue = string | number | boolean | undefined;

let analyticsPromise: Promise<Analytics | null> | null = null;

function isProductionBrowser(): boolean {
  return Boolean(import.meta.env?.PROD) && typeof window !== 'undefined';
}

export function isAnalyticsEnabled(): boolean {
  return isProductionBrowser() && Boolean(MEASUREMENT_ID);
}

/**
 * Lazily initializes Firebase Analytics only in production browser environments
 * when a valid GA4 Measurement ID is configured and browser APIs are supported.
 */
export function initFirebaseAnalytics(): Promise<Analytics | null> {
  if (!isProductionBrowser() || !MEASUREMENT_ID) {
    return Promise.resolve(null);
  }

  if (!analyticsPromise) {
    analyticsPromise = isSupported()
      .then((supported) => {
        if (!supported) return null;
        return getAnalytics(firebaseApp);
      })
      .catch(() => null);
  }

  return analyticsPromise;
}

export async function trackEvent(
  eventName: string,
  params?: Record<string, AnalyticsParamValue>
): Promise<void> {
  if (!isProductionBrowser() || !MEASUREMENT_ID) return;

  try {
    const analytics = await initFirebaseAnalytics();
    if (!analytics) return;

    const cleanParams: Record<string, string | number | boolean> = {};
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== '') {
          cleanParams[key] = value;
        }
      }
    }

    logEvent(analytics, eventName, cleanParams);
  } catch {
    // Analytics errors must never disrupt application workflows
  }
}

export function trackPageView(route: string, language?: string): void {
  const normalizedPath = route === 'home' ? '/' : `/${route}`;
  void trackEvent('page_view', {
    page_path: normalizedPath,
    page_title: typeof document !== 'undefined' ? document.title : route,
    page_location: typeof window !== 'undefined' ? window.location.href : undefined,
    language,
  });
}

export function trackConsultationFormOpen(serviceDomain?: string): void {
  void trackEvent('consultation_form_open', {
    service_domain: serviceDomain || 'enterprise-software',
  });
}

export function trackConsultationFormSubmit(params: {
  source: 'consultation_modal' | 'contact_cta_form';
  serviceType: string;
  timeline: string;
  hasAttachment: boolean;
}): void {
  void trackEvent('consultation_form_submit', {
    form_source: params.source,
    service_type: params.serviceType,
    timeline: params.timeline,
    has_attachment: params.hasAttachment,
  });
}

export function trackCtaClick(ctaLabel: string, serviceDomain?: string): void {
  void trackEvent('cta_click', {
    cta_label: ctaLabel,
    service_domain: serviceDomain || 'enterprise-software',
  });
}

export function trackLanguageSwitch(fromLang: string, toLang: string): void {
  void trackEvent('language_switch', {
    from_language: fromLang,
    to_language: toLang,
  });
}

export function trackAppError(params: {
  errorName: string;
  errorMessage: string;
  route?: string;
}): void {
  void trackEvent('app_render_error', {
    error_name: params.errorName.slice(0, 80),
    error_message: params.errorMessage.slice(0, 150),
    route: params.route || (typeof window !== 'undefined' ? window.location.pathname : '/'),
  });
}

