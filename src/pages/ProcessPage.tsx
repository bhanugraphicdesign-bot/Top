import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { PROCESS_STEPS } from '../data/content';
import { Clock, Check, ShieldCheck, Activity, Award } from 'lucide-react';

interface ProcessPageProps {
  onOpenConsultation: () => void;
}

export const ProcessPage: React.FC<ProcessPageProps> = ({ onOpenConsultation }) => {
  const { language, t } = useLanguage();

  return (
    <div className="bg-white">
      {/* Header */}
      <section className="pws-hero-surface border-b border-slate-200 py-16 sm:py-20">
        <div className="pws-hero-grid" aria-hidden="true" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="pws-reveal max-w-3xl">
            <div className="text-xs font-bold text-blue-700 tracking-wider uppercase mb-2">
              {t('RIGOROUS ENGINEERING METHODOLOGY', 'सख्त इंजीनियरिंग कार्यप्रणाली')}
            </div>
            <h1
              className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-950 tracking-tight leading-tight"
              style={{ textWrap: 'balance' }}
            >
              {language === 'hi' ? (
                <>
                  अनुशासित <span className="pws-gradient-text">6-चरणीय विकास चक्र</span> और शून्य-त्रुटि परिनियोजन
                </>
              ) : (
                <>
                  Our Disciplined <span className="pws-gradient-text">6-Phase Engineering Lifecycle</span> & QA
                </>
              )}
            </h1>
            <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
              {t(
                'How Bhanu Ram Bariha Digital Technologies transforms ambiguous technical objectives into mathematically verified, production-hardened software systems.',
                'भानु राम बरीहा डिजिटल टेक्नोलॉजीज कैसे जटिल तकनीकी उद्देश्यों को सत्यापित, सुरक्षित और मजबूत सॉफ्टवेयर सिस्टम में बदलती है।'
              )}
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 space-y-16">
        {/* Methodological Assurance Trio */}
        <div className="pws-stagger-grid grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="pws-card-3d p-6 rounded-2xl">
            <ShieldCheck className="w-6 h-6 text-blue-700 mb-3" />
            <h3 className="text-base font-bold text-slate-900 mb-1">
              {t('Security & OWASP Checklist Reviews', 'सुरक्षा एवं OWASP चेकलिस्ट समीक्षा')}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {t(
                'Codebases undergo internal TypeScript strict checks, dependency audits, and OWASP security checklist reviews prior to release.',
                'रिलीज़ से पहले कोडबेस की आंतरिक TypeScript जांच, डिपेंडेंसी ऑडिट और OWASP सुरक्षा चेकलिस्ट समीक्षा की जाती है।'
              )}
            </p>
          </div>

          <div className="pws-card-3d p-6 rounded-2xl">
            <Activity className="w-6 h-6 text-emerald-600 mb-3" />
            <h3 className="text-base font-bold text-slate-900 mb-1">
              {t('Bi-Weekly Staging Releases', 'द्वि-साप्ताहिक स्टेजिंग रिलीज़')}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {t(
                'Zero black-box surprises. You review deployed, working features every 14 days in live testing environments.',
                'कोई छिपी प्रक्रिया नहीं। आप हर 14 दिन में लाइव टेस्टिंग वातावरण में काम करने वाले फीचर्स की समीक्षा करते हैं।'
              )}
            </p>
          </div>

          <div className="pws-card-3d p-6 rounded-2xl">
            <Award className="w-6 h-6 text-blue-700 mb-3" />
            <h3 className="text-base font-bold text-slate-900 mb-1">
              {t('100% IP Handover', '100% आईपी हस्तांतरण')}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {t(
                'All git repositories, Docker manifests, and infrastructure Terraform state locks belong completely to you.',
                'सभी गिट रिपॉजिटरी, डॉकर मैनिफेस्ट और टेराफॉर्म कॉन्फ़िगरेशन पूरी तरह से आपके नियंत्रण में होते हैं।'
              )}
            </p>
          </div>
        </div>

        {/* 6 Phases Deep Dive */}
        <div className="pws-stagger-grid space-y-8">
          {PROCESS_STEPS.map((step) => (
            <div
              key={step.number}
              className="pws-card-3d pws-no-tilt p-6 sm:p-8 rounded-2xl space-y-5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-4">
                  <span className="font-mono text-2xl font-extrabold text-blue-700 tabular-nums">
                    {step.number}
                  </span>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      {language === 'hi' ? step.titleHi : step.title}
                    </h2>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-blue-700" />
                      <span>{language === 'hi' ? step.durationHi : step.duration}</span>
                    </div>
                  </div>
                </div>

                <span className="text-xs font-mono font-bold text-slate-600 bg-slate-50 px-3 py-1 rounded-md border border-slate-200 self-start sm:self-auto">
                  Phase {step.number} of 06
                </span>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed">
                {language === 'hi' ? step.descriptionHi : step.description}
              </p>

              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5">
                  {t('Verified Deliverables for this Phase', 'इस चरण के प्रमुख परिणाम')}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(language === 'hi' ? step.deliverablesHi : step.deliverables).map((d, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 p-2.5 rounded-md bg-slate-50 border border-slate-200/70 text-xs text-slate-700"
                    >
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{d}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="pws-reveal pws-card-3d-dark pws-no-tilt p-8 rounded-2xl bg-[#0B1220] text-white flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-bold">
              {t('Have a Technical Blueprint to Review?', 'क्या आपके पास समीक्षा के लिए कोई ब्लूप्रिंट है?')}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {t(
                'Engage with our Principal Engineering Architects for a zero-cost 45-minute discovery session.',
                '45 मिनट के नि:शुल्क तकनीकी परामर्श सत्र के लिए हमारे मुख्य सॉफ्टवेयर आर्किटेक्ट से जुड़ें।'
              )}
            </p>
          </div>
          <button
            onClick={onOpenConsultation}
            className="pws-btn-3d px-5 py-2.5 text-xs font-bold text-white rounded-lg cursor-pointer shrink-0"
          >
            {t('Schedule Discovery Session', 'परामर्श सत्र बुक करें')}
          </button>
        </div>
      </div>
    </div>
  );
};
