import { useEffect, useState } from 'react';
import { COMPANY_INFO } from '../data/content';
import { useLanguage } from '../context/LanguageContext';
import { fetchSiteSettings } from '../firebase/services';

export interface SiteContactInfo {
  name: string;
  brand: string;
  companyRegistration: string;
  email: string;
  phone: string;
  location: string;
  headquartersEn: string;
}

interface RemoteSiteSettings {
  companyName?: string;
  brandName?: string;
  companyRegistration?: string;
  contactEmail?: string;
  contactPhone?: string;
  headquarters?: string;
}

let cachedSettings: RemoteSiteSettings | null = null;
let inFlightFetch: Promise<RemoteSiteSettings | null> | null = null;

export function notifySiteSettingsUpdated(settings: RemoteSiteSettings) {
  cachedSettings = settings;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('pws-site-settings-updated', { detail: settings }));
  }
}

export function useSiteContact(): SiteContactInfo {
  const { language } = useLanguage();
  const [remote, setRemote] = useState<RemoteSiteSettings | null>(cachedSettings);

  useEffect(() => {
    let active = true;

    const handleUpdate = (event: Event) => {
      const detail = (event as CustomEvent<RemoteSiteSettings>).detail;
      if (active && detail) {
        setRemote(detail);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('pws-site-settings-updated', handleUpdate);
    }

    if (!cachedSettings) {
      if (!inFlightFetch) {
        inFlightFetch = fetchSiteSettings()
          .then((data) => {
            if (data && typeof data === 'object') {
              cachedSettings = data as RemoteSiteSettings;
              return cachedSettings;
            }
            return null;
          })
          .catch(() => null)
          .finally(() => {
            inFlightFetch = null;
          });
      }

      inFlightFetch.then((data) => {
        if (active && data) {
          setRemote(data);
        }
      });
    }

    return () => {
      active = false;
      if (typeof window !== 'undefined') {
        window.removeEventListener('pws-site-settings-updated', handleUpdate);
      }
    };
  }, []);

  const headquartersEn = (remote?.headquarters || '').trim() || COMPANY_INFO.headquarters;
  const isDefaultHq = headquartersEn === COMPANY_INFO.headquarters;

  return {
    name: (remote?.companyName || '').trim() || COMPANY_INFO.name,
    brand: (remote?.brandName || '').trim() || COMPANY_INFO.brand,
    companyRegistration: (remote?.companyRegistration || '').trim() || COMPANY_INFO.companyRegistration,
    email: (remote?.contactEmail || '').trim() || COMPANY_INFO.email,
    phone: (remote?.contactPhone || '').trim() || COMPANY_INFO.phone,
    headquartersEn,
    location:
      language === 'hi' && isDefaultHq
        ? COMPANY_INFO.headquartersHi
        : headquartersEn,
  };
}
