import React, { useState, useEffect } from 'react';
import { Download, Share, X } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { useLanguage } from '../../context/LanguageContext';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const { t } = useLanguage();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    if (!showIOSGuide) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowIOSGuide(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showIOSGuide]);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={() => void install()}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-700 hover:bg-blue-600 text-white text-xs font-semibold transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-400"
      >
        <Download className="w-3.5 h-3.5" aria-hidden="true" />
        <span>{t('Install App', 'ऐप इंस्टॉल करें')}</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-400"
        >
          <Download className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{t('Install App', 'ऐप इंस्टॉल करें')}</span>
        </button>

        {showIOSGuide && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="ios-pwa-title"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowIOSGuide(false);
            }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4"
          >
            <div className="w-full max-w-sm rounded-2xl bg-white border border-slate-200 p-6 shadow-xl text-slate-900">
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <h3 id="ios-pwa-title" className="text-base font-bold text-slate-900">
                  {t('Install Power Web Studio on iOS', 'iOS पर ऐप इंस्टॉल करें')}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  aria-label={t('Close', 'बंद करें')}
                  className="p-2 text-slate-600 hover:text-slate-900 rounded-lg cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-600"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
              <ol className="mt-4 space-y-2.5 text-sm text-slate-600 list-decimal list-inside">
                <li>
                  {t(
                    'Tap the Share icon in the Safari toolbar.',
                    'Safari टूलबार में Share आइकन पर टैप करें।'
                  )}{' '}
                  <Share className="inline w-4 h-4 text-blue-700 align-text-bottom" aria-hidden="true" />
                </li>
                <li>
                  {t(
                    'Scroll down and tap "Add to Home Screen".',
                    'नीचे स्क्रॉल करें और "Add to Home Screen" पर टैप करें।'
                  )}
                </li>
              </ol>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full min-h-[42px] rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold transition-colors cursor-pointer"
              >
                {t('Got it', 'समझ गया')}
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
