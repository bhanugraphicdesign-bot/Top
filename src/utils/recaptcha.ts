export const RECAPTCHA_SITE_KEY = '6LflRSsuAAAAAJHVpuPKz3AVn0B9WBau9fC0V8K_';

const RECAPTCHA_SCRIPT_SRC = `https://www.google.com/recaptcha/enterprise.js?render=${RECAPTCHA_SITE_KEY}`;

interface GrecaptchaEnterprise {
  ready: (callback: () => void) => void;
  execute: (siteKey: string, options: { action: string }) => Promise<string>;
}

declare global {
  interface Window {
    grecaptcha?: {
      enterprise?: GrecaptchaEnterprise;
    };
  }
}

function waitForEnterpriseApi(timeoutMs = 4000): Promise<GrecaptchaEnterprise | null> {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (window.grecaptcha?.enterprise) {
    return Promise.resolve(window.grecaptcha.enterprise);
  }

  // Ensure the script exists once if not already present in <head>
  if (
    typeof document !== 'undefined' &&
    !document.querySelector('script[src*="google.com/recaptcha/enterprise.js"]')
  ) {
    const script = document.createElement('script');
    script.src = RECAPTCHA_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }

  return new Promise((resolve) => {
    const startedAt = Date.now();
    const interval = window.setInterval(() => {
      if (window.grecaptcha?.enterprise) {
        window.clearInterval(interval);
        resolve(window.grecaptcha.enterprise);
        return;
      }
      if (Date.now() - startedAt >= timeoutMs) {
        window.clearInterval(interval);
        resolve(null);
      }
    }, 60);
  });
}

/**
 * Executes invisible score-based Google reCAPTCHA Enterprise for a given form action.
 * Never throws or blocks form submission if Google's script cannot be reached.
 */
export async function executeRecaptchaEnterprise(
  action: string
): Promise<{ recaptchaToken: string; recaptchaAction: string }> {
  const cleanAction = action.trim();
  try {
    const enterprise = await waitForEnterpriseApi(4000);
    if (!enterprise) {
      return { recaptchaToken: '', recaptchaAction: cleanAction };
    }

    const token = await new Promise<string>((resolve) => {
      let settled = false;
      const timer = window.setTimeout(() => {
        if (!settled) {
          settled = true;
          resolve('');
        }
      }, 5000);

      enterprise.ready(() => {
        enterprise
          .execute(RECAPTCHA_SITE_KEY, { action: cleanAction })
          .then((result) => {
            if (!settled) {
              settled = true;
              window.clearTimeout(timer);
              resolve(typeof result === 'string' ? result : '');
            }
          })
          .catch(() => {
            if (!settled) {
              settled = true;
              window.clearTimeout(timer);
              resolve('');
            }
          });
      });
    });

    return { recaptchaToken: token, recaptchaAction: cleanAction };
  } catch {
    return { recaptchaToken: '', recaptchaAction: cleanAction };
  }
}
