import React, { useState, useEffect } from 'react';
import { WifiOff, AlertCircle, RefreshCw, X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline };
}

interface NetworkStatusAlertProps {
  /** 'banner' for top-level offline notice, 'card' or 'inline' for reusable section/form alerts */
  variant?: 'banner' | 'card' | 'inline';
  /** Optional explicit network/API error message to display even when browser reports online */
  error?: string | null;
  titleEn?: string;
  titleHi?: string;
  messageEn?: string;
  messageHi?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
  dismissible?: boolean;
  onDismiss?: () => void;
  /** Whether to automatically render when navigator.onLine becomes false (default true) */
  autoDetectOffline?: boolean;
  className?: string;
}

export const NetworkStatusAlert: React.FC<NetworkStatusAlertProps> = ({
  variant = 'card',
  error = null,
  titleEn,
  titleHi,
  messageEn,
  messageHi,
  onRetry,
  isRetrying = false,
  dismissible = false,
  onDismiss,
  autoDetectOffline = true,
  className = '',
}) => {
  const { t } = useLanguage();
  const { isOnline } = useNetworkStatus();
  const [dismissedOffline, setDismissedOffline] = useState(false);

  // Reset dismissal whenever connectivity drops again
  useEffect(() => {
    if (!isOnline) {
      setDismissedOffline(false);
    }
  }, [isOnline]);

  const showOffline = autoDetectOffline && !isOnline && !dismissedOffline;
  const showError = Boolean(error);

  if (!showOffline && !showError) {
    return null;
  }

  const isOfflineState = !isOnline;

  const resolvedTitle = isOfflineState
    ? t(
        titleEn || 'You are currently offline',
        titleHi || 'आप वर्तमान में ऑफ़लाइन हैं'
      )
    : t(
        titleEn || 'Network connection issue',
        titleHi || 'नेटवर्क कनेक्शन समस्या'
      );

  const resolvedMessage = isOfflineState
    ? t(
        messageEn || 'Internet connection was lost. Please check your Wi-Fi or mobile network and try again.',
        messageHi || 'इंटरनेट कनेक्शन टूट गया है। कृपया अपना वाई-फ़ाई या मोबाइल नेटवर्क जांचें और पुनः प्रयास करें।'
      )
    : error ||
      t(
        messageEn || 'Unable to reach the server right now. Please check your connection and try again.',
        messageHi || 'अभी सर्वर से संपर्क नहीं हो पा रहा है। कृपया अपना कनेक्शन जांचें और पुनः प्रयास करें।'
      );

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  const handleDismiss = () => {
    if (isOfflineState) {
      setDismissedOffline(true);
    }
    if (onDismiss) {
      onDismiss();
    }
  };

  const Icon = isOfflineState ? WifiOff : AlertCircle;

  if (variant === 'banner') {
    return (
      <div
        role="status"
        aria-live="polite"
        className={`w-full bg-slate-900 text-white border-b border-blue-800 ${className}`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-700/40 border border-blue-500/40 flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4 text-blue-200" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-semibold text-white">
                {resolvedTitle}
              </p>
              <p className="text-xs text-slate-300 truncate sm:whitespace-normal">
                {resolvedMessage}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleRetry}
              disabled={isRetrying}
              className="inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-400"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isRetrying ? 'motion-safe:animate-spin' : ''}`}
                aria-hidden="true"
              />
              <span>{t('Retry', 'पुनः प्रयास')}</span>
            </button>

            {dismissible && (
              <button
                type="button"
                onClick={handleDismiss}
                aria-label={t('Dismiss notification', 'सूचना बंद करें')}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-400"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div
        role="alert"
        aria-live="polite"
        className={`flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 ${className}`}
      >
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 mt-0.5">
            <Icon className="w-4 h-4 text-blue-700" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">{resolvedTitle}</p>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5 leading-relaxed">
              {resolvedMessage}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onRetry && (
            <button
              type="button"
              onClick={handleRetry}
              disabled={isRetrying}
              className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-600"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isRetrying ? 'motion-safe:animate-spin' : ''}`}
                aria-hidden="true"
              />
              <span>{t('Retry', 'पुनः प्रयास करें')}</span>
            </button>
          )}

          {dismissible && (
            <button
              type="button"
              onClick={handleDismiss}
              aria-label={t('Dismiss message', 'संदेश बंद करें')}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-600"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Default 'card' variant
  return (
    <div
      role="alert"
      aria-live="polite"
      className={`bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs max-w-lg mx-auto text-center ${className}`}
    >
      <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto mb-4">
        <Icon className="w-6 h-6 text-blue-700" aria-hidden="true" />
      </div>

      <h2 className="text-lg font-bold text-slate-900">{resolvedTitle}</h2>
      <p className="text-sm text-slate-600 mt-2 leading-relaxed">{resolvedMessage}</p>

      <div className="mt-6 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={handleRetry}
          disabled={isRetrying}
          className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-700"
        >
          <RefreshCw
            className={`w-4 h-4 ${isRetrying ? 'motion-safe:animate-spin' : ''}`}
            aria-hidden="true"
          />
          <span>{t('Try Again', 'पुनः प्रयास करें')}</span>
        </button>

        {dismissible && (
          <button
            type="button"
            onClick={handleDismiss}
            className="inline-flex items-center justify-center min-h-[44px] px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-600"
          >
            {t('Dismiss', 'बंद करें')}
          </button>
        )}
      </div>
    </div>
  );
};
