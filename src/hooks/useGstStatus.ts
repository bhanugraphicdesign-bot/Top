import { useEffect, useState } from 'react';
import { DEFAULT_GST_LEGAL_NAME, DEFAULT_GST_STATE_CODE } from '../data/indianStates';
import { PublicGstStatus } from '../types';

const DEFAULT_PUBLIC_GST_STATUS: PublicGstStatus = {
  gstRegistered: false,
  gstin: '',
  legalName: DEFAULT_GST_LEGAL_NAME,
  stateCode: DEFAULT_GST_STATE_CODE,
  stateName: 'Chhattisgarh',
};

let cachedGstStatus: PublicGstStatus | null = null;
let inFlightGstFetch: Promise<PublicGstStatus> | null = null;

export function notifyGstSettingsUpdated(status: PublicGstStatus) {
  cachedGstStatus = {
    gstRegistered: Boolean(status.gstRegistered),
    gstin: status.gstRegistered ? String(status.gstin || '') : '',
    legalName: status.legalName || DEFAULT_GST_LEGAL_NAME,
    stateCode: status.stateCode || DEFAULT_GST_STATE_CODE,
    stateName: status.stateName || 'Chhattisgarh',
  };
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent<PublicGstStatus>('pws-gst-settings-updated', { detail: cachedGstStatus })
    );
  }
}

async function fetchPublicGstStatus(): Promise<PublicGstStatus> {
  try {
    const res = await fetch('/api/gst-settings');
    if (!res.ok) return DEFAULT_PUBLIC_GST_STATUS;
    const data = await res.json().catch(() => null);
    if (!data || typeof data !== 'object') return DEFAULT_PUBLIC_GST_STATUS;
    return {
      gstRegistered: Boolean(data.gstRegistered),
      gstin: data.gstRegistered && typeof data.gstin === 'string' ? data.gstin : '',
      legalName:
        typeof data.legalName === 'string' && data.legalName.trim()
          ? data.legalName.trim()
          : DEFAULT_GST_LEGAL_NAME,
      stateCode:
        typeof data.stateCode === 'string' && data.stateCode.trim()
          ? data.stateCode.trim()
          : DEFAULT_GST_STATE_CODE,
      stateName:
        typeof data.stateName === 'string' && data.stateName.trim()
          ? data.stateName.trim()
          : 'Chhattisgarh',
    };
  } catch {
    return DEFAULT_PUBLIC_GST_STATUS;
  }
}

export function useGstStatus(): { status: PublicGstStatus; loading: boolean } {
  const [status, setStatus] = useState<PublicGstStatus>(
    cachedGstStatus || DEFAULT_PUBLIC_GST_STATUS
  );
  const [loading, setLoading] = useState<boolean>(!cachedGstStatus);

  useEffect(() => {
    let active = true;

    const handleUpdate = (event: Event) => {
      const detail = (event as CustomEvent<PublicGstStatus>).detail;
      if (active && detail) {
        setStatus(detail);
        setLoading(false);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('pws-gst-settings-updated', handleUpdate);
    }

    if (!cachedGstStatus) {
      if (!inFlightGstFetch) {
        inFlightGstFetch = fetchPublicGstStatus()
          .then((result) => {
            cachedGstStatus = result;
            return result;
          })
          .finally(() => {
            inFlightGstFetch = null;
          });
      }
      inFlightGstFetch.then((result) => {
        if (active) {
          setStatus(result);
          setLoading(false);
        }
      });
    }

    return () => {
      active = false;
      if (typeof window !== 'undefined') {
        window.removeEventListener('pws-gst-settings-updated', handleUpdate);
      }
    };
  }, []);

  return { status, loading };
}
