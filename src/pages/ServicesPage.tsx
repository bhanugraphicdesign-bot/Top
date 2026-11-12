import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useNavigation } from '../context/NavigationContext';
import { SERVICES_DATA } from '../data/content';
import { ServiceItem } from '../types';
import { ArrowUpRight, Check, ArrowRight, Layers, Globe, Smartphone, Cpu, Cloud, ShieldCheck } from 'lucide-react';

interface ServicesPageProps {
  onSelectService: (service: ServiceItem) => void;
  onOpenConsultation: () => void;
}

export const ServicesPage: React.FC<ServicesPageProps> = ({
  onSelectService,
  onOpenConsultation,
}) => {
  const { language, t } = useLanguage();
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'All Services', labelHi: 'सभी सेवाएं' },
    { id: 'Core Engineering', label: 'Core Engineering', labelHi: 'कोर इंजीनियरिंग' },
    { id: 'Mobile Systems', label: 'Mobile Systems', labelHi: 'मोबाइल सिस्टम' },
    { id: 'Artificial Intelligence', label: 'AI Solutions', labelHi: 'एआई समाधान' },
    { id: 'Cloud Engineering', label: 'Cloud & DevOps', labelHi: 'क्लाउड व डेवऑप्स' },
    { id: 'Integration Suite', label: 'Integration & APIs', labelHi: 'एपीआई गेटवे' },
  ];

  const filtered = SERVICES_DATA.filter((s) => {
    if (activeCategory === 'all') return true;
    return s.category === activeCategory;
  });

  return (
    <div className="bg-white">
      {/* Header */}
      <section className="bg-slate-50 border-b border-slate-200 py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="text-xs font-bold text-blue-700 tracking-wider uppercase mb-2">
              {t('ENTERPRISE SERVICES DIRECTORY', 'एंटरप्राइज सेवाएं निर्देशिका')}
            </div>
            <h1
              className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-950 tracking-tight leading-tight"
              style={{ textWrap: 'balance' }}
            >
              {language === 'hi' ? (
                <>
                  मिशन-क्रिटिकल <span className="text-blue-700">सॉफ्टवेयर एवं सिस्टम इंजीनियरिंग</span> सेवाएं
                </>
              ) : (
                <>
                  Mission-Critical <span className="text-blue-700">Software & System Engineering</span> Suite
                </>
              )}
            </h1>
            <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
              {t(
                'Comprehensive full-lifecycle engineering capabilities from distributed consensus architectures to native mobile ecosystems and cloud automation.',
                'वितरित सिस्टम आर्किटेक्चर से लेकर नेटिव मोबाइल इकोसिस्टम और क्लाउड ऑटोमेशन तक संपूर्ण सेवाएं।'
              )}
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 space-y-12">
        {/* Category Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 rounded-lg border border-slate-200 w-fit">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer whitespace-nowrap ${
                activeCategory === cat.id
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              {language === 'hi' ? cat.labelHi : cat.label}
            </button>
          ))}
        </div>

        {/* Services List with Detailed Architecture Cards */}
        <div className="space-y-8">
          {filtered.map((service) => (
            <div
              key={service.id}
              className="p-6 sm:p-8 rounded-xl border border-slate-200 bg-white shadow-xs hover:border-blue-400 hover:shadow-md transition-all space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="text-xs font-mono font-bold text-blue-700 uppercase tracking-wider mb-1">
                    {service.number}. {language === 'hi' ? service.categoryHi : service.category}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                    {language === 'hi' ? service.titleHi : service.title}
                  </h2>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-right">
                    <span className="text-xs font-mono font-extrabold text-blue-700 block tabular-nums">
                      {service.metric}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {language === 'hi' ? service.metricLabelHi : service.metricLabel}
                    </span>
                  </div>
                  <button
                    onClick={() => onSelectService(service)}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-md transition-colors cursor-pointer shadow-xs"
                  >
                    <span>{t('View Full Specs', 'पूर्ण विवरण देखें')}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed">
                {language === 'hi' ? service.fullDescHi : service.fullDesc}
              </p>

              {/* Deliverables Grid */}
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                  {t('Production Deliverables & Artifacts', 'प्रमुख उत्पादन परिणाम व कोड आर्टिफैक्ट्स')}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {(language === 'hi' ? service.deliverablesHi : service.deliverables).map(
                    (d, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 p-2.5 rounded-md bg-slate-50 border border-slate-200/80 text-xs text-slate-700"
                      >
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{d}</span>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Tech Stack Bar */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-semibold text-slate-500 mr-1">{t('Core Stack:', 'स्टैक:')}</span>
                  {service.techStack.map((tech) => (
                    <span
                      key={tech}
                      className="px-2 py-0.5 rounded bg-slate-100 font-mono text-[11px] text-slate-700"
                    >
                      {tech}
                    </span>
                  ))}
                </div>

                <button
                  onClick={onOpenConsultation}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900 cursor-pointer"
                >
                  <span>{t('Schedule Scoping Call', 'परामर्श सत्र बुक करें')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
