import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { SERVICES_DATA } from '../../data/content';
import { fetchServicesCatalog } from '../../firebase/services';
import { ServiceItem } from '../../types';
import { ArrowUpRight } from 'lucide-react';

interface ServicesSectionProps {
  onSelectService: (service: ServiceItem) => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({ onSelectService }) => {
  const { language, t } = useLanguage();
  const [services, setServices] = useState<ServiceItem[]>(SERVICES_DATA);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  useEffect(() => {
    let mounted = true;
    fetchServicesCatalog()
      .then((cloudServices) => {
        if (mounted && Array.isArray(cloudServices) && cloudServices.length > 0) {
          const sorted = [...cloudServices].sort((a, b) =>
            String(a.number || '').localeCompare(String(b.number || ''), undefined, { numeric: true })
          );
          setServices(sorted);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const categories = [
    { id: 'all', label: 'All Services', labelHi: 'सभी सेवाएं' },
    { id: 'Core Engineering', label: 'Core Engineering', labelHi: 'कोर इंजीनियरिंग' },
    { id: 'Mobile Systems', label: 'Mobile Systems', labelHi: 'मोबाइल सिस्टम' },
    { id: 'Artificial Intelligence', label: 'AI Solutions', labelHi: 'एआई समाधान' },
    { id: 'Cloud Engineering', label: 'Cloud & DevOps', labelHi: 'क्लाउड व डेवऑप्स' },
  ];

  const filteredServices = services.filter((s) => {
    if (activeCategory === 'all') return true;
    return s.category === activeCategory;
  });

  return (
    <section id="services" className="py-20 sm:py-28 bg-slate-50/70 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header & Filter Controls */}
        <div className="pws-reveal flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="pws-home-surface-dark max-w-2xl">
            <div className="text-xs font-bold text-blue-700 tracking-wider uppercase mb-2">
              {t('CORE CAPABILITIES & ENGINEERING SUITE', 'प्रमुख क्षमताएं और सेवाएं')}
            </div>
            <h2
              className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight"
              style={{ textWrap: 'balance' }}
            >
              {language === 'hi' ? (
                <>
                  एंटरप्राइज-ग्रेड <span className="pws-gradient-text">सॉफ्टवेयर व सिस्टम इंजीनियरिंग</span> सेवाएं
                </>
              ) : (
                <>
                  Enterprise-Grade <span className="pws-gradient-text">Software & System Engineering</span> Capabilities
                </>
              )}
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
              {t(
                'Full-lifecycle software engineering from mathematical systems modeling to automated multi-cloud deployment.',
                'गणितीय मॉडलिंग से लेकर स्वचालित मल्टी-क्लाउड परिनियोजन तक संपूर्ण जीवन-चक्र सॉफ्टवेयर इंजीनियरिंग सेवाएं।'
              )}
            </p>
          </div>

          {/* Interactive Filter Segmented Control (Buttons with click handlers) */}
          <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-white/85 backdrop-blur-md border border-blue-100 rounded-xl shadow-sm self-start md:self-end max-w-full">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  activeCategory === cat.id
                    ? 'pws-btn-3d text-white'
                    : 'text-slate-600 hover:text-slate-950 hover:bg-blue-50/70'
                }`}
              >
                {language === 'hi' ? cat.labelHi : cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bento Grid with Asymmetric Hierarchy */}
        <div className="pws-stagger-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <button
              type="button"
              key={service.id}
              onClick={() => onSelectService(service)}
              className="pws-card-3d group rounded-2xl p-6 cursor-pointer flex flex-col justify-between w-full text-left focus-visible:outline-2 focus-visible:outline-blue-600"
            >
              <span className="block w-full">
                {/* Header: Editorial Number & Category (Clean unboxed text) */}
                <span className="flex items-center justify-between text-xs text-slate-500 mb-4 pb-3 border-b border-slate-100">
                  <span className="font-mono font-bold text-blue-700">
                    {service.number}. {language === 'hi' ? (service.categoryHi || service.category) : service.category}
                  </span>
                  <span className="w-8 h-8 rounded-md bg-blue-50 group-hover:bg-blue-700 group-hover:text-white transition-colors flex items-center justify-center shrink-0">
                    <ArrowUpRight className="w-4 h-4 text-blue-700 group-hover:text-white transition-colors" />
                  </span>
                </span>

                {/* Service Title */}
                <span className="block text-lg font-bold text-slate-900 group-hover:text-blue-700 transition-colors mb-2.5">
                  {language === 'hi' ? (service.titleHi || service.title) : service.title}
                </span>

                {/* Short Description */}
                <span className="block text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
                  {language === 'hi'
                    ? (service.shortDescHi || service.shortDesc || service.fullDesc)
                    : (service.shortDesc || service.fullDesc)}
                </span>
              </span>

              <span className="block w-full">
                {/* Metric Strip (Clean Tabular Numbers) */}
                <span className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">
                    {language === 'hi' ? (service.metricLabelHi || service.metricLabel) : service.metricLabel}
                  </span>
                  <span className="font-mono font-extrabold text-blue-700 tabular-nums">
                    {service.metric}
                  </span>
                </span>

                {/* Tech Pills / Tags as quiet font-mono badges */}
                <span className="mt-3 flex flex-wrap gap-1.5">
                  {service.techStack.slice(0, 4).map((tech) => (
                    <span
                      key={tech}
                      className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700"
                    >
                      {tech}
                    </span>
                  ))}
                  {service.techStack.length > 4 && (
                    <span className="text-[11px] font-mono px-1.5 py-0.5 text-slate-600">
                      +{service.techStack.length - 4}
                    </span>
                  )}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
