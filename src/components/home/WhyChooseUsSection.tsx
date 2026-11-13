import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { WHY_CHOOSE_US_PILLARS } from '../../data/content';
import { Shield, Code2, Activity, CheckCircle, Zap, Compass, Check } from 'lucide-react';

export const WhyChooseUsSection: React.FC = () => {
  const { language, t } = useLanguage();

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Shield':
        return <Shield className="w-5 h-5 text-blue-700" />;
      case 'Code2':
        return <Code2 className="w-5 h-5 text-blue-700" />;
      case 'Activity':
        return <Activity className="w-5 h-5 text-blue-700" />;
      case 'CheckCircle':
        return <CheckCircle className="w-5 h-5 text-blue-700" />;
      case 'Zap':
        return <Zap className="w-5 h-5 text-blue-700" />;
      case 'Compass':
        return <Compass className="w-5 h-5 text-blue-700" />;
      default:
        return <CheckCircle className="w-5 h-5 text-blue-700" />;
    }
  };

  return (
    <section id="why-choose-us" className="py-20 sm:py-28 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mb-14">
          <div className="text-xs font-bold text-blue-700 tracking-wider uppercase mb-2">
            {t('ARCHITECTURAL ADVANTAGES', 'एंटरप्राइज विशेषताएं')}
          </div>
          <h2
            className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight"
            style={{ textWrap: 'balance' }}
          >
            {language === 'hi' ? (
              <>
                अग्रणी उद्यम <span className="text-blue-700">पावर वेब स्टूडियो एआई</span> को क्यों चुनते हैं
              </>
            ) : (
              <>
                Why Global Enterprises Choose <span className="text-blue-700">Power Web Studio AI</span>
              </>
            )}
          </h2>
          <p className="mt-3 text-base sm:text-lg text-slate-600 leading-relaxed">
            {t(
              'We replace agency overhead and fragmented freelancers with dedicated, battle-tested software engineering squads.',
              'हम एजेंसी जटिलताओं को दूर कर अनुशासित, अनुभवी सॉफ्टवेयर इंजीनियरिंग स्क्वाड प्रदान करते हैं।'
            )}
          </p>
        </div>

        {/* 6-Grid Pillars with Hairline Borders (Anti-slop compliant) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {WHY_CHOOSE_US_PILLARS.map((pillar) => (
            <div
              key={pillar.id}
              className="p-6 sm:p-7 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-xs transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                    {getIcon(pillar.icon)}
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-extrabold text-blue-700 font-mono tabular-nums block">
                      {pillar.metric}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {language === 'hi' ? pillar.metricLabelHi : pillar.metricLabel}
                    </span>
                  </div>
                </div>

                <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2">
                  {language === 'hi' ? pillar.titleHi : pillar.title}
                </h3>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {language === 'hi' ? pillar.descriptionHi : pillar.description}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs text-blue-700 font-semibold">
                <Check className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                <span>{t('Defined per Project Scope & SOW', 'परियोजना स्कोप एवं अनुबंध के अनुसार')}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
