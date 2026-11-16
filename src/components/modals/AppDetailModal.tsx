import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { AndroidApp } from '../../types';
import { X, Check, Smartphone, ArrowRight, Layers } from 'lucide-react';

interface AppDetailModalProps {
  app: AndroidApp | null;
  onClose: () => void;
  onRequestApkDemo: (appId: string) => void;
}

export const AppDetailModal: React.FC<AppDetailModalProps> = ({
  app,
  onClose,
  onRequestApkDemo,
}) => {
  const { language, t } = useLanguage();

  if (!app) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="min-h-full flex items-center justify-center p-4 sm:p-6 text-center">
        <div
          className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 text-left border border-slate-200 transform transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3.5 mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-700 text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                {language === 'hi' ? app.categoryHi : app.category} · {app.version}
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-950">
                {language === 'hi' ? app.nameHi : app.name}
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {language === 'hi' ? app.taglineHi : app.tagline}
              </p>
            </div>
          </div>

          {/* Architecture Badge */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 mb-5 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-700 shrink-0" />
            <span>
              <strong className="text-slate-900">{t('Architecture Pattern:', 'आर्किटेक्चर पैटर्न:')}</strong>{' '}
              {app.architecture}
            </span>
          </div>

          {/* Narrative */}
          <p className="text-sm text-slate-600 leading-relaxed mb-6">
            {language === 'hi' ? app.descriptionHi : app.description}
          </p>

          {/* Metrics Trio */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {app.metrics.map((m, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-center"
              >
                <div className="text-base sm:text-lg font-extrabold text-blue-700 font-mono tabular-nums">
                  {m.value}
                </div>
                <div className="text-xs text-slate-500 font-medium mt-0.5">
                  {language === 'hi' ? m.labelHi : m.label}
                </div>
              </div>
            ))}
          </div>

          {/* Key Capabilities */}
          <div className="mb-6">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              {t('Enterprise Android Capabilities', 'एंटरप्राइज एंड्रॉइड क्षमताएं')}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(language === 'hi' ? app.keyFeaturesHi : app.keyFeatures).map((feat, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 text-xs text-slate-700 p-2.5 rounded-md bg-white border border-slate-200"
                >
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile Tech Stack */}
          <div className="mb-6">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
              {t('Native Android Tooling', 'नेटिव एंड्रॉइड टूलिंग')}
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {app.techStack.map((tech) => (
                <span
                  key={tech}
                  className="px-2.5 py-1 text-xs font-mono font-medium rounded-md bg-slate-100 text-slate-800 border border-slate-200"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>

          {/* Footer Action */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              {t('Close', 'बंद करें')}
            </button>
            <button
              onClick={() => {
                onClose();
                onRequestApkDemo(app.id);
              }}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-md transition-colors cursor-pointer shadow-xs"
            >
              <span>{t('Request Live APK & Architecture Walkthrough', 'लाइव एपीके और आर्किटेक्चर डेमो का अनुरोध करें')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
