import React, { useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { ServiceItem } from '../../types';
import { X, Check, ArrowRight, Layers, Globe, Smartphone, Cpu, Cloud, ShieldCheck } from 'lucide-react';

interface ServiceDetailModalProps {
  service: ServiceItem | null;
  onClose: () => void;
  onSelectForConsult: (serviceId: string) => void;
}

export const ServiceDetailModal: React.FC<ServiceDetailModalProps> = ({
  service,
  onClose,
  onSelectForConsult,
}) => {
  const { language, t } = useLanguage();

  useEffect(() => {
    if (!service) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [service, onClose]);

  if (!service) return null;

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'Layers':
        return <Layers className="w-5 h-5 text-blue-700" />;
      case 'Globe':
        return <Globe className="w-5 h-5 text-blue-700" />;
      case 'Smartphone':
        return <Smartphone className="w-5 h-5 text-blue-700" />;
      case 'Cpu':
        return <Cpu className="w-5 h-5 text-blue-700" />;
      case 'Cloud':
        return <Cloud className="w-5 h-5 text-blue-700" />;
      case 'ShieldCheck':
        return <ShieldCheck className="w-5 h-5 text-blue-700" />;
      default:
        return <Layers className="w-5 h-5 text-blue-700" />;
    }
  };

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
          role="dialog"
          aria-modal="true"
          aria-labelledby="service-detail-modal-title"
          className="relative bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 text-left border border-blue-200/70 transform transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 text-slate-500 hover:text-slate-900 rounded-md hover:bg-slate-100 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-600"
            aria-label={t('Close modal', 'बंद करें')}
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
              {renderIcon(service.icon)}
            </div>
            <div>
              <div className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
                {language === 'hi' ? service.categoryHi : service.category}
              </div>
              <h3 id="service-detail-modal-title" className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
                {language === 'hi' ? service.titleHi : service.title}
              </h3>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-slate-600 leading-relaxed mb-6">
            {language === 'hi' ? service.fullDescHi : service.fullDesc}
          </p>

          {/* Benchmark KPI */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 mb-6 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 block">
                {t('Benchmark SLA / Performance Target', 'बेंचमार्क एसएलए / प्रदर्शन लक्ष्य')}
              </span>
              <span className="text-xs text-slate-700 font-medium">
                {language === 'hi' ? service.metricLabelHi : service.metricLabel}
              </span>
            </div>
            <span className="text-2xl font-extrabold text-blue-700 font-mono tabular-nums">
              {service.metric}
            </span>
          </div>

          {/* Enterprise Deliverables */}
          <div className="mb-6">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              {t('Core Technical Deliverables', 'प्रमुख तकनीकी परिणाम')}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(language === 'hi' ? service.deliverablesHi : service.deliverables).map(
                (item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 text-xs text-slate-700 p-2.5 rounded-md bg-white border border-slate-200"
                  >
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Tech Stack */}
          <div className="mb-6">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5">
              {t('Standard Production Stack', 'मानक प्रोडक्शन स्टैक')}
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {service.techStack.map((tech) => (
                <span
                  key={tech}
                  className="px-2.5 py-1 text-xs font-mono font-medium rounded-md bg-slate-100 text-slate-800 border border-slate-200"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="pws-btn-glass px-4 py-2 text-xs font-semibold text-slate-700 rounded-lg cursor-pointer"
            >
              {t('Close', 'बंद करें')}
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onSelectForConsult(service.id);
              }}
              className="pws-btn-3d flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white rounded-lg cursor-pointer"
            >
              <span>{t('Engage Squad on This Scope', 'इस सेवा के लिए टीम चुनें')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
