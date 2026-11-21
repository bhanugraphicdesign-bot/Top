import {
  initializeAppCheck,
  ReCaptchaV3Provider,
  getToken,
  type AppCheck,
} from 'firebase/app-check';
import type { FirebaseApp } from 'firebase/app';

const rawSiteKey = (import.meta.env?.VITE_RECAPTCHA_SITE_KEY as string | undefined) || '';
export const RECAPTCHA_SITE_KEY = rawSiteKey.trim();

let appCheckInstance: AppCheck | null = null;

export function initFirebaseAppCheck(app: FirebaseApp): AppCheck | null {
  if (typeof window === 'undefined') {
    return null;
  }

  if (appCheckInstance) {
    return appCheckInstance;
  }

  if (!RECAPTCHA_SITE_KEY) {
    return null;
  }

  try {
    appCheckInstance = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(RECAPTCHA_SITE_KEY),
      isTokenAutoRefreshEnabled: true,
    });
    return appCheckInstance;
  } catch (err) {
    console.warn('[AppCheck] Failed to initialize Firebase App Check:', err);
    return null;
  }
}

export async function getAppCheckTokenHeader(): Promise<Record<string, string>> {
  if (!appCheckInstance) {
    return {};
  }
  try {
    const result = await getToken(appCheckInstance, false);
    if (result?.token) {
      return { 'X-Firebase-AppCheck': result.token };
    }
  } catch (err) {
    console.warn('[AppCheck] Unable to retrieve App Check token:', err);
  }
  return {};
}
