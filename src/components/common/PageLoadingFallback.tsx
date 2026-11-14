import React from 'react';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface PageLoadingFallbackProps {
  variant?: 'skeleton' | 'spinner';
  labelEn?: string;
  labelHi?: string;
}

export const PageLoadingFallback: React.FC<PageLoadingFallbackProps> = ({
  variant = 'skeleton',
  labelEn = 'Loading page content...',
  labelHi = 'पृष्ठ सामग्री लोड हो रही है...',
}) => {
  const { t } = useLanguage();

  if (variant === 'spinner') {
    return (
      <div
        role="status"
        aria-live="polite"
        className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-12 text-slate-600"
      >
        <div className="bg-white border border-slate-200 rounded-2xl px-8 py-7 shadow-xs flex flex-col items-center text-center max-w-sm w-full">
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-4">
            <Loader2 className="w-6 h-6 text-blue-700 motion-safe:animate-spin" aria-hidden="true" />
          </div>
          <p className="text-sm font-semibold text-slate-900">{t(labelEn, labelHi)}</p>
          <p className="text-xs text-slate-500 mt-1">
            {t('Preparing workspace view', 'कार्यक्षेत्र तैयार किया जा रहा है')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={t(labelEn, labelHi)}
      className="min-h-[65vh] bg-slate-50/70"
    >
      {/* Subtle Top Progress Indicator */}
      <div className="w-full h-0.5 bg-slate-200 overflow-hidden">
        <div className="h-full w-1/3 bg-blue-700 motion-safe:animate-pulse" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-10">
        {/* Status Indicator */}
        <div className="flex items-center gap-2.5 text-sm font-medium text-slate-600">
          <Loader2 className="w-4 h-4 text-blue-700 motion-safe:animate-spin shrink-0" aria-hidden="true" />
          <span>{t(labelEn, labelHi)}</span>
        </div>

        {/* Hero / Header Skeleton Block */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 space-y-5 motion-safe:animate-pulse">
          <div className="h-3.5 w-32 bg-blue-100 rounded" />
          <div className="space-y-3 max-w-2xl">
            <div className="h-8 sm:h-9 w-3/4 bg-slate-200 rounded-lg" />
            <div className="h-4 w-full bg-slate-100 rounded" />
            <div className="h-4 w-5/6 bg-slate-100 rounded" />
          </div>
          <div className="pt-2 flex flex-wrap gap-3">
            <div className="h-11 w-40 bg-blue-100 rounded-lg" />
            <div className="h-11 w-32 bg-slate-100 rounded-lg" />
          </div>
        </div>

        {/* 3-Column Content Card Skeletons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 motion-safe:animate-pulse">
          {[0, 1, 2].map((idx) => (
            <div
              key={idx}
              className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100" />
              <div className="space-y-2.5">
                <div className="h-5 w-2/3 bg-slate-200 rounded" />
                <div className="h-3.5 w-full bg-slate-100 rounded" />
                <div className="h-3.5 w-4/5 bg-slate-100 rounded" />
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div className="h-3 w-20 bg-slate-100 rounded" />
                <div className="h-3 w-12 bg-blue-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
