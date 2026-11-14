import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { AI_SOLUTIONS } from '../data/content';
import { Bot, Search, FileText, TrendingUp, Check, ArrowRight, ShieldCheck, Cpu, Calculator } from 'lucide-react';
import { OptimizedImage } from '../components/common/OptimizedImage';

interface AiSolutionsPageProps {
  onOpenConsultation: () => void;
}

export const AiSolutionsPage: React.FC<AiSolutionsPageProps> = ({ onOpenConsultation }) => {
  const { language, t } = useLanguage();

  const [calcIndustry, setCalcIndustry] = useState('fintech');
  const [calcWorkload, setCalcWorkload] = useState('rag');
  const [calcScale, setCalcScale] = useState('mid');

  const getEstimation = () => {
    let speedGain = '75%';
    let processingHours = '1,400+ hrs/mo';
    let targetLatency = '<850ms';
    let blueprint = 'Hybrid Qdrant + Gemini 2.5 Flash + Private Cloud VPC';

    if (calcWorkload === 'agents') {
      speedGain = '84%';
      processingHours = '2,800+ hrs/mo';
      targetLatency = '<1.2s';
      blueprint = 'LangGraph State Bus + Redis + Deterministic JSON Tooling';
    } else if (calcWorkload === 'vision') {
      speedGain = '92%';
      processingHours = '3,200+ hrs/mo';
      targetLatency = '<450ms';
      blueprint = 'Multi-lingual OCR Engine + PyTorch + Fast Inference Pods';
    } else if (calcWorkload === 'predictive') {
      speedGain = '68%';
      processingHours = '950+ hrs/mo';
      targetLatency = '<200ms';
      blueprint = 'ClickHouse + Time-series Neural Pipeline + Grafana Hub';
    }

    if (calcScale === 'enterprise') {
      processingHours = '8,500+ hrs/mo';
    } else if (calcScale === 'startup') {
      processingHours = '450+ hrs/mo';
    }

    return { speedGain, processingHours, targetLatency, blueprint };
  };

  const est = getEstimation();

  return (
    <div className="bg-white">
      {/* Header */}
      <section className="bg-slate-50 border-b border-slate-200 py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="text-xs font-bold text-blue-700 tracking-wider uppercase mb-2">
              {t('SOVEREIGN ARTIFICIAL INTELLIGENCE', 'संप्रभु आर्टिफिशियल इंटेलिजेंस')}
            </div>
            <h1
              className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-950 tracking-tight leading-tight"
              style={{ textWrap: 'balance' }}
            >
              {language === 'hi' ? (
                <>
                  सत्यापित संदर्भों के साथ <span className="text-blue-700">एंटरप्राइज एआई</span> और स्वायत्त वर्कफ़्लो
                </>
              ) : (
                <>
                  Deterministic <span className="text-blue-700">Enterprise AI</span> & Sovereign Agentic Workflows
                </>
              )}
            </h1>
            <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
              {t(
                'We engineer zero-hallucination vector architectures, multi-agent task swarms, and on-premise neural inference pipelines for regulated industries.',
                'हम विनियमित उद्योगों के लिए शून्य-भ्रांति वेक्टर आर्किटेक्चर, मल्टी-एजेंट टास्क और निजी इंफरेंस पाइपलाइनों का निर्माण करते हैं।'
              )}
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 space-y-16">
        {/* Core AI Solutions 4-Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {AI_SOLUTIONS.map((sol) => (
            <div
              key={sol.id}
              className="p-6 sm:p-8 rounded-xl border border-slate-200 bg-white shadow-xs hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="text-xs font-mono font-bold text-blue-700 uppercase tracking-wider mb-1">
                  Enterprise Suite
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1">
                  {language === 'hi' ? sol.titleHi : sol.title}
                </h3>
                <p className="text-xs text-slate-500 font-medium mb-4">
                  {language === 'hi' ? sol.subtitleHi : sol.subtitle}
                </p>

                <p className="text-sm text-slate-600 leading-relaxed mb-6">
                  {language === 'hi' ? sol.descriptionHi : sol.description}
                </p>

                <div className="space-y-2 mb-6">
                  {(language === 'hi' ? sol.coreCapabilitiesHi : sol.coreCapabilities).map(
                    (c, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-slate-700">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{c}</span>
                      </div>
                    )
                  )}
                </div>
              </div>

              <div>
                <div className="p-3 bg-blue-50/70 border border-blue-200/60 rounded-md text-xs text-blue-900 mb-4">
                  <span className="font-bold">{t('Measured Impact: ', 'मापा गया प्रभाव: ')}</span>
                  <span>{language === 'hi' ? sol.businessImpactHi : sol.businessImpact}</span>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-3 border-t border-slate-100">
                  {sol.techStack.map((tech) => (
                    <span
                      key={tech}
                      className="px-2 py-0.5 rounded bg-slate-100 font-mono text-[11px] text-slate-700"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Interactive Scope & ROI Estimator Component */}
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            <div className="lg:col-span-5 relative bg-slate-900 p-6 sm:p-8 flex flex-col justify-between overflow-hidden">
              <OptimizedImage
                assetKey="aiImage"
                alt="Enterprise AI Neural Architecture and Sovereign Model Engineering Studio"
                altHi="एंटरप्राइज एआई न्यूरल आर्किटेक्चर और सॉवरेन मॉडल इंजीनियरिंग स्टूडियो"
                width={1200}
                height={896}
                loading="lazy"
                sizes="(max-width: 1024px) 100vw, 42vw"
                className="absolute inset-0 w-full h-full object-cover opacity-35"
              />
              <div className="relative z-10">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-400 tracking-wider uppercase mb-2">
                  <Calculator className="w-4 h-4" />
                  <span>{t('INTERACTIVE ARCHITECTURE ESTIMATOR', 'आर्किटेक्चर अनुमानक')}</span>
                </div>
                <h3 className="text-2xl font-bold text-white tracking-tight">
                  {t('Project Your Enterprise AI Footprint', 'अपने एंटरप्राइज एआई पदचिह्न का अनुमान लगाएं')}
                </h3>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  {t(
                    'Select your operational parameters to project workload efficiency gains, latency boundaries, and cloud blueprint.',
                    'दक्षता लाभ, लेटेंसी और अनुशंसित क्लाउड ब्लूप्रिंट का तुरंत अनुमान लगाने के लिए अपने पैरामीटर चुनें।'
                  )}
                </p>
              </div>

              <div className="relative z-10 mt-8 p-4 rounded-lg bg-slate-950/80 border border-slate-800 backdrop-blur-md text-white space-y-3">
                <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                  <span className="text-slate-400">{t('Efficiency Gain:', 'दक्षता वृद्धि:')}</span>
                  <span className="font-mono text-emerald-400 font-extrabold text-base tabular-nums">
                    +{est.speedGain}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                  <span className="text-slate-400">{t('Hours Saved Monthly:', 'मासिक समय बचत:')}</span>
                  <span className="font-mono text-blue-400 font-extrabold text-base tabular-nums">
                    {est.processingHours}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">{t('Target Latency:', 'लक्षित लेटेंसी:')}</span>
                  <span className="font-mono text-white font-extrabold text-sm tabular-nums">
                    {est.targetLatency}
                  </span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 p-6 sm:p-8 space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  1. {t('Industry Sector', 'उद्योग क्षेत्र')}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'fintech', label: 'FinTech', labelHi: 'फिनटेक' },
                    { id: 'healthcare', label: 'Healthcare', labelHi: 'स्वास्थ्य' },
                    { id: 'logistics', label: 'Logistics', labelHi: 'लॉजिस्टिक्स' },
                    { id: 'retail', label: 'Retail & POS', labelHi: 'खुदरा व बिक्री' },
                  ].map((ind) => (
                    <button
                      key={ind.id}
                      onClick={() => setCalcIndustry(ind.id)}
                      className={`p-2.5 rounded-md text-xs font-semibold text-center border cursor-pointer transition-colors ${
                        calcIndustry === ind.id
                          ? 'bg-blue-700 text-white border-blue-700 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {language === 'hi' ? ind.labelHi : ind.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  2. {t('Select Primary AI Workload', 'प्राथमिक एआई वर्कलोड चुनें')}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { id: 'rag', label: 'Private Knowledge RAG', labelHi: 'प्राइवेट नॉलेज आरएजी' },
                    { id: 'agents', label: 'Multi-Agent Task Workflows', labelHi: 'मल्टी-एजेंट कार्यप्रणाली' },
                    { id: 'vision', label: 'Vision OCR & KYC Documents', labelHi: 'विजन ओसीआर और दस्तावेज़' },
                    { id: 'predictive', label: 'Predictive Anomaly Engine', labelHi: 'पूर्वानुमानित विसंगति इंजन' },
                  ].map((w) => (
                    <button
                      key={w.id}
                      onClick={() => setCalcWorkload(w.id)}
                      className={`p-2.5 rounded-md text-xs font-semibold text-left border cursor-pointer transition-colors ${
                        calcWorkload === w.id
                          ? 'bg-blue-700 text-white border-blue-700 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {language === 'hi' ? w.labelHi : w.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  3. {t('Monthly Processing Scale', 'मासिक प्रसंस्करण का पैमाना')}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'startup', label: '<10K requests/mo', labelHi: '<10,000 अनुरोध/माह' },
                    { id: 'mid', label: '10K - 250K requests/mo', labelHi: '10K - 250K अनुरोध/माह' },
                    { id: 'enterprise', label: '1M+ high-load requests', labelHi: '1M+ उच्च-लोड अनुरोध' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setCalcScale(s.id)}
                      className={`p-2.5 rounded-md text-xs font-semibold text-center border cursor-pointer transition-colors ${
                        calcScale === s.id
                          ? 'bg-blue-700 text-white border-blue-700 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {language === 'hi' ? s.labelHi : s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="text-xs font-bold text-slate-900">
                  {t('Recommended Production Topology:', 'अनुशंसित प्रोडक्शन टोपोलॉजी:')}
                </div>
                <div className="text-xs font-mono text-blue-700 font-semibold">
                  {est.blueprint}
                </div>
              </div>

              <button
                onClick={onOpenConsultation}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-md transition-all cursor-pointer shadow-xs"
              >
                <span>{t('Deploy This Enterprise AI Architecture', 'यह एंटरप्राइज एआई आर्किटेक्चर तैनात करें')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
