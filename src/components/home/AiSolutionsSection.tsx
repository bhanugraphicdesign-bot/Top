import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { AI_SOLUTIONS } from '../../data/content';
import { Bot, Search, FileText, TrendingUp, Check, ArrowRight, Cpu, Calculator } from 'lucide-react';
import { OptimizedImage } from '../common/OptimizedImage';

interface AiSolutionsSectionProps {
  onOpenConsultation: () => void;
}

export const AiSolutionsSection: React.FC<AiSolutionsSectionProps> = ({
  onOpenConsultation,
}) => {
  const { language, t } = useLanguage();

  // Interactive AI Scope & ROI Calculator State
  const [calcIndustry, setCalcIndustry] = useState('fintech');
  const [calcWorkload, setCalcWorkload] = useState('rag');
  const [calcScale, setCalcScale] = useState('mid');

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'SearchCheck':
        return <Search className="w-5 h-5 text-blue-700" />;
      case 'Bot':
        return <Bot className="w-5 h-5 text-blue-700" />;
      case 'FileSpreadsheet':
        return <FileText className="w-5 h-5 text-blue-700" />;
      case 'TrendingUp':
        return <TrendingUp className="w-5 h-5 text-blue-700" />;
      default:
        return <Cpu className="w-5 h-5 text-blue-700" />;
    }
  };

  // Derive honest architectural blueprint based on workload & volume tier
  const getEstimation = () => {
    let workflowApproach = t('Grounded Citation Pipeline', 'संदर्भ-सत्यापित पाइपलाइन');
    let tierProfile = t('Standard Cloud Pod', 'मानक क्लाउड पॉड');
    const validationMethod = t('Scoped in Discovery Pilot', 'पायलट में सत्यापित');
    let blueprint = 'Hybrid Qdrant + Gemini 2.5 Flash + Private Cloud VPC';

    if (calcWorkload === 'agents') {
      workflowApproach = t('Stateful Tool Orchestration', 'स्टेटफुल टूल ऑर्केस्ट्रेशन');
      blueprint = 'LangGraph State Bus + Redis + Deterministic JSON Tooling';
    } else if (calcWorkload === 'vision') {
      workflowApproach = t('Structured Document Parsing', 'संरचित दस्तावेज़ पार्सिंग');
      blueprint = 'Multi-lingual OCR Engine + PyTorch + Fast Inference Pods';
    } else if (calcWorkload === 'predictive') {
      workflowApproach = t('Streaming Anomaly Scoring', 'स्ट्रीमिंग विसंगति स्कोरिंग');
      blueprint = 'ClickHouse + Time-series Neural Pipeline + Grafana Hub';
    }

    if (calcScale === 'enterprise') {
      tierProfile = t('Dedicated Multi-Node VPC', 'समर्पित मल्टी-नोड VPC');
    } else if (calcScale === 'startup') {
      tierProfile = t('Lean Single-Tenant Pilot', 'सिंगल-टेनेंट पायलट');
    }

    return { workflowApproach, tierProfile, validationMethod, blueprint };
  };

  const est = getEstimation();

  return (
    <section id="ai-solutions" className="py-20 sm:py-28 bg-slate-50/70 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-14">
          <div className="text-xs font-bold text-blue-700 tracking-wider uppercase mb-2">
            {t('POWER WEB STUDIO AI INNOVATION SUITE', 'एआई इनोवेशन सुइट')}
          </div>
          <h2
            className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight"
            style={{ textWrap: 'balance' }}
          >
            {language === 'hi' ? (
              <>
                सुरक्षित <span className="text-blue-700">एंटरप्राइज एआई</span> और स्वायत्त वर्कफ़्लो इंजन
              </>
            ) : (
              <>
                Sovereign <span className="text-blue-700">Enterprise AI</span> & Autonomous Workflow Engines
              </>
            )}
          </h2>
          <p className="mt-3 text-base sm:text-lg text-slate-600 leading-relaxed">
            {t(
              'Grounded generative intelligence engineered for zero hallucinations, mathematical confidence checks, and strict corporate data sovereignty.',
              'शून्य भ्रांति (Zero Hallucination), गणितीय सटीकता और सख्त कॉर्पोरेट डेटा संप्रभुता के साथ निर्मित सुरक्षित एआई समाधान।'
            )}
          </p>
        </div>

        {/* 4 Core AI Solutions Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {AI_SOLUTIONS.map((solution) => (
            <div
              key={solution.id}
              className="bg-white rounded-xl border border-slate-200 p-6 sm:p-7 shadow-xs hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                    {getIcon(solution.icon)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      {language === 'hi' ? solution.titleHi : solution.title}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      {language === 'hi' ? solution.subtitleHi : solution.subtitle}
                    </p>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-5">
                  {language === 'hi' ? solution.descriptionHi : solution.description}
                </p>

                {/* Capabilities list */}
                <div className="space-y-2 mb-6">
                  {(language === 'hi' ? solution.coreCapabilitiesHi : solution.coreCapabilities).map(
                    (cap, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 text-xs text-slate-700"
                      >
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{cap}</span>
                      </div>
                    )
                  )}
                </div>
              </div>

              <div>
                {/* Business Impact Box */}
                <div className="p-3 bg-blue-50/70 border border-blue-200/60 rounded-md text-xs text-blue-900 mb-4">
                  <span className="font-bold">{t('Demonstrated Impact: ', 'मापा गया प्रभाव: ')}</span>
                  <span>{language === 'hi' ? solution.businessImpactHi : solution.businessImpact}</span>
                </div>

                {/* Tech Badges */}
                <div className="flex flex-wrap gap-1.5 pt-3 border-t border-slate-100">
                  {solution.techStack.map((tech) => (
                    <span
                      key={tech}
                      className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Interactive AI Architecture Scope Calculator & Visual Split */}
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* Visual Left (5 cols) */}
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
                  {t('Model Your Enterprise AI Architecture', 'अपने एंटरप्राइज एआई आर्किटेक्चर का मॉडल बनाएं')}
                </h3>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  {t(
                    'Select your operational parameters to project workload efficiency gains, latency boundaries, and cloud blueprint.',
                    'दक्षता लाभ, लेटेंसी और अनुशंसित क्लाउड ब्लूप्रिंट का तुरंत अनुमान लगाने के लिए अपने पैरामीटर चुनें।'
                  )}
                </p>
              </div>

              {/* Honest Architecture Scope Box */}
              <div className="relative z-10 mt-8 p-4 rounded-lg bg-slate-950/80 border border-slate-800 backdrop-blur-md text-white space-y-3">
                <div className="flex items-center justify-between gap-2 text-xs border-b border-slate-800 pb-2">
                  <span className="text-slate-400">{t('Automation Focus:', 'स्वचालन पद्धति:')}</span>
                  <span className="font-mono text-emerald-400 font-bold text-xs text-right">
                    {est.workflowApproach}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 text-xs border-b border-slate-800 pb-2">
                  <span className="text-slate-400">{t('Deployment Tier:', 'परिनियोजन स्तर:')}</span>
                  <span className="font-mono text-blue-400 font-bold text-xs text-right">
                    {est.tierProfile}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-slate-400">{t('Performance Target:', 'प्रदर्शन मानदंड:')}</span>
                  <span className="font-mono text-white font-bold text-xs text-right">
                    {est.validationMethod}
                  </span>
                </div>
              </div>
            </div>

            {/* Interactive Calculator Form (7 cols) */}
            <div className="lg:col-span-7 p-6 sm:p-8 space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  1. {t('Select Your Industry Sector', 'अपना उद्योग क्षेत्र चुनें')}
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
                  3. {t('Scale of Monthly Operations', 'मासिक संचालन का पैमाना')}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'startup', label: '<10,000 queries/mo', labelHi: '<10,000 क्वेरी/माह' },
                    { id: 'mid', label: '10K - 250K queries/mo', labelHi: '10K - 250K क्वेरी/माह' },
                    { id: 'enterprise', label: '1M+ high-load queries', labelHi: '1M+ उच्च-लोड क्वेरी' },
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

              {/* Recommended Architecture Blueprint Result */}
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="text-xs font-bold text-slate-900">
                  {t('Recommended Production Topology:', 'अनुशंसित प्रोडक्शन टोपोलॉजी:')}
                </div>
                <div className="text-xs font-mono text-blue-700 break-words">
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
    </section>
  );
};
