import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { COMPANY_INFO, ASSETS } from '../../data/content';
import { ArrowRight, ShieldCheck, ChevronRight, Activity } from 'lucide-react';

interface HeroSectionProps {
  onOpenConsultation: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onOpenConsultation }) => {
  const { language, t } = useLanguage();

  return (
    <section className="relative overflow-hidden bg-white pt-8 pb-16 sm:pt-12 sm:pb-24 border-b border-slate-200">
      {/* Subtle architectural background grid */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#1E40AF 1px, transparent 1px)`,
          backgroundSize: '28px 28px',
        }}
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Editorial Subtitle / Trust Kicker (Natural unboxed text with separator) */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500 mb-6">
          <span className="text-blue-700 tracking-wider uppercase font-bold">
            {COMPANY_INFO.name}
          </span>
          <span aria-hidden="true" className="text-slate-300">·</span>
          <span>{t('Enterprise Technology Division', 'एंटरप्राइज टेक्नोलॉजी डिवीजन')}</span>
          <span aria-hidden="true" className="text-slate-300">·</span>
          <span>{t('Odisha Tech Corridor & Global Delivery', 'ओडिशा टेक कॉरिडोर व ग्लोबल डिलीवरी')}</span>
        </div>

        {/* 2-Column Desktop Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Value Proposition & CTAs (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            <h1
              className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-950 tracking-tight leading-[1.12]"
              style={{ textWrap: 'balance' }}
            >
              {language === 'hi' ? (
                <>
                  अगली पीढ़ी के <span className="text-blue-700">एंटरप्राइज सॉफ्टवेयर</span>, एंड्रॉइड इकोसिस्टम और <span className="text-blue-600">एआई इंजन</span> का निर्माण।
                </>
              ) : (
                <>
                  Architecting <span className="text-blue-700">Mission-Critical</span> Enterprise Software, Android Ecosystems & <span className="text-blue-600">AI Engines</span>.
                </>
              )}
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
              {language === 'hi'
                ? 'भानु राम बरीहा डिजिटल टेक्नोलॉजीज भारत के सबसे आधुनिक उद्यमों और वैश्विक निगमों के लिए उच्च-पैमाने के वितरित बैकएंड, नेटिव एंड्रॉइड एप्लिकेशन और सुरक्षित ऑटोनॉमस एआई पाइपलाइनों का निर्माण करती है।'
                : 'Bhanu Ram Bariha Digital Technologies crafts resilient distributed architectures, enterprise Android ecosystems, and sovereign AI workflow engines for high-growth enterprises and global institutions.'}
            </p>

            {/* Primary & Secondary Actions */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={onOpenConsultation}
                type="button"
                className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-bold text-white bg-blue-700 hover:bg-blue-800 active:bg-blue-900 rounded-md transition-all shadow-xs cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-600"
              >
                <span>{t('Schedule Architecture Review', 'आर्किटेक्चर समीक्षा बुक करें')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <a
                href="#services"
                className="inline-flex items-center gap-2 px-5 py-3.5 text-sm font-semibold text-slate-700 hover:text-blue-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md transition-colors cursor-pointer"
              >
                <span>{t('Explore Capabilities', 'तकनीकी क्षमताएं देखें')}</span>
                <ChevronRight className="w-4 h-4" />
              </a>
            </div>

            {/* Trust Signatures (Clean inline text) */}
            <div className="pt-4 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-slate-500 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-700" />
                <span>{t('SOC-2 & DPDP Act Ready Architecture', 'एसओसी-2 और डीपीडीपी अनुपालन')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" />
                <span>{t('Guaranteed 99.98% High Availability SLA', 'गारंटीकृत 99.98% अपटाइम अनुबंध')}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Visual Container (5 Cols) */}
          <div className="lg:col-span-5">
            <div className="relative rounded-xl overflow-hidden border border-slate-200 shadow-lg bg-slate-900 group">
              <img
                src={ASSETS.heroImage}
                alt="Power Web Studio AI Enterprise Command Studio"
                className="w-full h-80 sm:h-96 lg:h-[420px] object-cover transition-transform duration-500 group-hover:scale-102"
                referrerPolicy="no-referrer"
              />
              {/* Subtle gradient overlay at bottom for legible contrast */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent pointer-events-none" />

              {/* Bottom Card Context */}
              <div className="absolute bottom-4 left-4 right-4 p-4 rounded-lg bg-white/95 backdrop-blur-md border border-slate-200 text-slate-900 text-xs shadow-md">
                <div className="flex items-center justify-between font-bold text-slate-900 mb-1">
                  <span>{t('Principal Engineering Pods Active', 'सक्रिय मुख्य इंजीनियरिंग पॉड्स')}</span>
                  <span className="font-mono text-blue-700 tabular-nums">18 Squads</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-tight">
                  {t(
                    'Full-stack pods architecting distributed systems with zero-loss guarantees.',
                    'शून्य-हानि गारंटी के साथ वितरित सिस्टम बनाने वाले समर्पित इंजीनियरिंग दल।'
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 4-Column Full-Width Enterprise KPI Strip Below Hero */}
        <div className="mt-14 pt-8 border-t border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
          <div>
            <div className="text-3xl sm:text-4xl font-extrabold text-blue-700 font-mono tabular-nums">
              99.98%
            </div>
            <div className="text-xs font-semibold text-slate-900 mt-1">
              {t('High Availability SLA', 'उच्च उपलब्धता अनुबंध')}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {t('Contractual financial backing', 'वित्तीय गारंटी द्वारा समर्थित')}
            </div>
          </div>

          <div>
            <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-mono tabular-nums">
              &lt;150ms
            </div>
            <div className="text-xs font-semibold text-slate-900 mt-1">
              {t('P99 Production Latency', 'पी99 प्रोडक्शन लेटेंसी')}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {t('High-concurrency microservices', 'उच्च समवर्ती माइक्रोसर्विस')}
            </div>
          </div>

          <div>
            <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-mono tabular-nums">
              100%
            </div>
            <div className="text-xs font-semibold text-slate-900 mt-1">
              {t('Client IP Ownership', 'ग्राहक कोड व आईपी स्वामित्व')}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {t('Zero proprietary vendor lock-in', 'शून्य मालिकाना वेंडर लॉक-इन')}
            </div>
          </div>

          <div>
            <div className="text-3xl sm:text-4xl font-extrabold text-blue-700 font-mono tabular-nums">
              4.9 / 5.0
            </div>
            <div className="text-xs font-semibold text-slate-900 mt-1">
              {t('Enterprise CSAT Score', 'एंटरप्राइज ग्राहक संतुष्टि')}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {t('Across 40+ deployed platforms', '40+ तैनात प्लेटफॉर्मों में')}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
