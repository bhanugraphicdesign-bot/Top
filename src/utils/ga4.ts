export const GA4_MEASUREMENT_ID = 'G-FYEH0TXXPB';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

type GaEventParams = Record<string, string | number | boolean>;

let lastTrackedPath: string | null = null;

function callGtag(...args: unknown[]): void {
  if (typeof window === 'undefined') return;
  if (typeof window.gtag === 'function') {
    window.gtag(...args);
    return;
  }
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(args);
}

function sanitizePath(rawPath: string): string {
  const withoutHash = rawPath.split('#')[0] || '/';
  const withoutQuery = withoutHash.split('?')[0] || '/';
  return withoutQuery.startsWith('/') ? withoutQuery : `/${withoutQuery}`;
}

/**
 * Send a GA4 SPA page_view event with clean pathname (no query params) and deduplication
 * so the initial page load is never counted twice.
 */
export function trackGaPageView(pagePath: string, pageTitle?: string): void {
  if (typeof window === 'undefined') return;
  const cleanPath = sanitizePath(pagePath || window.location.pathname || '/');
  if (lastTrackedPath === cleanPath) return;
  lastTrackedPath = cleanPath;

  callGtag('event', 'page_view', {
    page_path: cleanPath,
    page_title: pageTitle || document.title,
    page_location: `${window.location.origin}${cleanPath}`,
  });
}

export function trackGaEvent(eventName: string, params?: GaEventParams): void {
  if (params && Object.keys(params).length > 0) {
    callGtag('event', eventName, params);
  } else {
    callGtag('event', eventName);
  }
}

export function trackGenerateLead(formSource?: string): void {
  trackGaEvent('generate_lead', formSource ? { form_source: formSource } : undefined);
}

export function trackBookConsultation(serviceCategory?: string): void {
  trackGaEvent(
    'book_consultation',
    serviceCategory ? { service_category: serviceCategory } : undefined
  );
}

export function trackViewDemo(demoName: string): void {
  const cleanName = demoName.trim();
  trackGaEvent('view_demo', cleanName ? { demo_name: cleanName } : undefined);
}

/**
 * Tracks payment initiation on /pay.
 * Strictly sends NO personal or payment details (no amount, name, mobile, or UTR).
 */
export function trackPaymentStart(): void {
  trackGaEvent('payment_start');
}

/**
 * Delegated click listener for WhatsApp, tel:, and mailto: links site-wide.
 * Never transmits phone numbers, email addresses, or prefilled message text to GA4.
 */
export function initGa4LinkTracking(): () => void {
  if (typeof document === 'undefined') return () => {};

  const handleClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement | null;
    const anchor = target?.closest?.('a[href]') as HTMLAnchorElement | null;
    if (!anchor) return;

    const rawHref = (anchor.getAttribute('href') || '').trim();
    if (!rawHref) return;

    const lowerHref = rawHref.toLowerCase();
    const cleanPath = sanitizePath(window.location.pathname || '/');

    if (lowerHref.startsWith('tel:')) {
      trackGaEvent('phone_click', { page_path: cleanPath });
      return;
    }

    if (lowerHref.startsWith('mailto:')) {
      trackGaEvent('email_click', { page_path: cleanPath });
      return;
    }

    if (
      lowerHref.startsWith('https://wa.me/') ||
      lowerHref.startsWith('http://wa.me/') ||
      lowerHref.includes('api.whatsapp.com') ||
      lowerHref.includes('whatsapp.com/send')
    ) {
      trackGaEvent('whatsapp_click', { page_path: cleanPath });
    }
  };

  document.addEventListener('click', handleClick, { capture: true });
  return () => {
    document.removeEventListener('click', handleClick, { capture: true });
  };
}
