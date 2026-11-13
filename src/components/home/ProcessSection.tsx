import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { PROCESS_STEPS } from '../../data/content';
import { Check, Clock, ChevronDown, ChevronUp } from 'lucide-react';

export const ProcessSection: React.FC = () => {
  const { language, t } = useLanguage();
  const [expandedStep, setExpandedStep] = useState<string>('01');

  const toggleStep = (stepNumber: string) => {
    setExpandedStep(expandedStep === stepNumber ? '' : stepNumber);
  };

  return (
    <section id="process" className="py-20 sm:py-28 bg-slate-50/70 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-14">
          <div className="text-xs font-bold text-blue-700 tracking-wider uppercase mb-2">
            {t('ENGINEERING METHODOLOGY', 'विकास कार्यप्रणाली')}
          </div>
          <h2
            className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight"
            style={{ textWrap: 'balance' }}
          >
            {language === 'hi' ? (
              <>
                अनुशासित <span className="text-blue-700">6-चरणीय विकास चक्र</span> और गुणवत्ता नियंत्रण
              </>
            ) : (
              <>
                A Disciplined <span className="text-blue-700">6-Phase Engineering Lifecycle</span> with Zero Surprises
              </>
            )}
          </h2>
          <p className="mt-3 text-base sm:text-lg text-slate-600 leading-relaxed">
            {t(
              'From formal mathematical systems architecture to automated zero-downtime deployment and 24/7 SLA monitoring.',
              'औपचारिक गणितीय सिस्टम आर्किटेक्चर से लेकर स्वचालित परिनियोजन और 24/7 निगरानी तक।'
            )}
          </p>
        </div>

        {/* 6 Process Steps in Clean Editorial Numbered Grid */}
        <div className="space-y-4">
          {PROCESS_STEPS.map((step) => {
            const isExpanded = expandedStep === step.number;
            return (
              <div
                key={step.number}
                className={`rounded-xl border transition-all duration-200 bg-white overflow-hidden ${
                  isExpanded
                    ? 'border-blue-500 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Clickable Header Bar */}
                <button
                  onClick={() => toggleStep(step.number)}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 cursor-pointer"
                  aria-expanded={isExpanded}
                >
                  <div className="flex items-center gap-4 sm:gap-6 min-w-0">
                    <span className="font-mono text-xl sm:text-2xl font-extrabold text-blue-700 shrink-0 tabular-nums">
                      {step.number}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-xs text-slate-500 mb-0.5">
                        <Clock className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                        <span className="font-medium">
                          {language === 'hi' ? step.durationHi : step.duration}
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                        {language === 'hi' ? step.titleHi : step.title}
                      </h3>
                    </div>
                  </div>

                  <div className="p-1.5 rounded-md bg-slate-50 text-slate-500 hover:text-slate-900 shrink-0">
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-blue-700" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-5 pb-6 sm:px-6 sm:pb-6 pt-0 border-t border-slate-100 mt-2 space-y-4">
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-3">
                      {language === 'hi' ? step.descriptionHi : step.description}
                    </p>

                    <div>
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5">
                        {t('Key Deliverables for this Phase', 'इस चरण के प्रमुख परिणाम')}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {(language === 'hi' ? step.deliverablesHi : step.deliverables).map(
                          (del, i) => (
                            <div
                              key={i}
                              className="flex items-start gap-2 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-md border border-slate-200/60"
                            >
                              <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                              <span>{del}</span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
