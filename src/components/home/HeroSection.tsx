import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { COMPANY_INFO } from '../../data/content';
import { ArrowRight, ShieldCheck, ChevronRight, Activity } from 'lucide-react';
import { OptimizedImage } from '../common/OptimizedImage';

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
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
          <span className="text-blue-700 tracking-wider uppercase font-bold">
            {COMPANY_INFO.name}
          </span>
          <span aria-hidden="true" className="text-slate-300">·</span>
          <span>{t('Enterprise Technology Division', 'एंटरप्राइज टेक्नोलॉजी डिवीजन')}</span>
          <span aria-hidden="true" className="text-slate-300">·</span>
          <span>{t('Chhattisgarh, India & Global Delivery', 'छत्तीसगढ़, भारत व ग्लोबल डिलीवरी')}</span>
        </div>

        {/* Scoped Lightweight CSS Animations for Home Banner (transform & opacity only) */}
        <style>{`
          @keyframes pwsBannerEnter {
            from {
              opacity: 0;
              transform: scale(0.96);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          @keyframes pwsBannerZoom {
            from {
              transform: scale(1);
            }
            to {
              transform: scale(1.04);
            }
          }
          @keyframes pwsBannerShine {
            0% {
              transform: translateX(-160%) skewX(-22deg);
              opacity: 0;
            }
            12% {
              opacity: 0.3;
            }
            42% {
              transform: translateX(340%) skewX(-22deg);
              opacity: 0.3;
            }
            48%, 100% {
              transform: translateX(340%) skewX(-22deg);
              opacity: 0;
            }
          }
          @keyframes pwsBannerGlow {
            from {
              opacity: 0.35;
            }
            to {
              opacity: 1;
            }
          }
          @keyframes pwsBannerFloat {
            0% {
              transform: translateY(0);
              opacity: 0;
            }
            20% {
              opacity: 0.9;
            }
            80% {
              opacity: 0.75;
            }
            100% {
              transform: translateY(-72px);
              opacity: 0;
            }
          }
          .pws-banner-enter {
            animation: pwsBannerEnter 0.8s ease-out forwards;
          }
          .pws-banner-zoom {
            animation: pwsBannerZoom 12s ease-in-out infinite alternate;
            will-change: transform;
          }
          .pws-banner-shine {
            animation: pwsBannerShine 4s ease-in-out infinite;
            will-change: transform, opacity;
          }
          .pws-banner-glow {
            box-shadow: 0 0 28px 4px rgba(37, 99, 235, 0.52), 0 10px 26px -6px rgba(14, 165, 233, 0.35);
            animation: pwsBannerGlow 3s ease-in-out infinite alternate;
            will-change: opacity;
          }
          .pws-banner-dot {
            animation-name: pwsBannerFloat;
            animation-timing-function: ease-in-out;
            animation-iteration-count: infinite;
            will-change: transform, opacity;
          }
          @media (prefers-reduced-motion: reduce) {
            .pws-banner-enter,
            .pws-banner-zoom,
            .pws-banner-glow {
              animation: none !important;
              opacity: 1 !important;
              transform: none !important;
            }
            .pws-banner-shine,
            .pws-banner-dot {
              animation: none !important;
              opacity: 0 !important;
            }
          }
        `}</style>

        {/* Home Wide Banner (16px below kicker lines, 20px above hero heading) */}
        <div className="w-full max-w-[1100px] mx-auto mt-4 mb-5 pws-banner-enter">
          <div className="relative rounded-xl">
            {/* Pulsing blue glow layer (opacity-only animation) */}
            <div
              aria-hidden="true"
              className="absolute inset-0 rounded-xl pointer-events-none pws-banner-glow"
            />

            {/* Clipped Banner Frame */}
            <div className="relative overflow-hidden rounded-xl bg-blue-950">
              <img
                src="/home-banner.jpg"
                alt="Power Web Studio AI बैनर"
                loading="eager"
                className="block w-full h-auto object-contain rounded-xl pws-banner-zoom"
              />

              {/* Diagonal Translucent White Shine Sweep (every 4s) */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 left-0 w-1/3 pws-banner-shine"
                style={{
                  background:
                    'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.95) 50%, rgba(255,255,255,0) 100%)',
                }}
              />

              {/* 8 Subtle Rising Glowing Dots on Outer Edges & Right Side Only */}
              <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
                <span
                  className="pws-banner-dot absolute rounded-full bg-sky-200"
                  style={{ left: '1.5%', bottom: '8%', width: '3px', height: '3px', animationDuration: '5.5s', animationDelay: '0s' }}
                />
                <span
                  className="pws-banner-dot absolute rounded-full bg-white"
                  style={{ left: '3.2%', bottom: '18%', width: '2px', height: '2px', animationDuration: '6.8s', animationDelay: '1.4s' }}
                />
                <span
                  className="pws-banner-dot absolute rounded-full bg-sky-100"
                  style={{ right: '22%', bottom: '6%', width: '3px', height: '3px', animationDuration: '5.2s', animationDelay: '0.6s' }}
                />
                <span
                  className="pws-banner-dot absolute rounded-full bg-white"
                  style={{ right: '17%', bottom: '14%', width: '4px', height: '4px', animationDuration: '6.4s', animationDelay: '2.1s' }}
                />
                <span
                  className="pws-banner-dot absolute rounded-full bg-sky-200"
                  style={{ right: '12%', bottom: '5%', width: '2px', height: '2px', animationDuration: '4.9s', animationDelay: '0.9s' }}
                />
                <span
                  className="pws-banner-dot absolute rounded-full bg-white"
                  style={{ right: '8%', bottom: '16%', width: '3px', height: '3px', animationDuration: '6.1s', animationDelay: '1.8s' }}
                />
                <span
                  className="pws-banner-dot absolute rounded-full bg-sky-100"
                  style={{ right: '4.5%', bottom: '10%', width: '4px', height: '4px', animationDuration: '5.7s', animationDelay: '0.3s' }}
                />
                <span
                  className="pws-banner-dot absolute rounded-full bg-white"
                  style={{ right: '1.8%', bottom: '22%', width: '2px', height: '2px', animationDuration: '4.6s', animationDelay: '2.5s' }}
                />
              </div>
            </div>
          </div>
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
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-2">
              <button
                onClick={onOpenConsultation}
                type="button"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-3.5 text-sm font-bold text-white bg-blue-700 hover:bg-blue-800 active:bg-blue-900 rounded-md transition-all shadow-xs cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-600"
              >
                <span>{t('Schedule Architecture Review', 'आर्किटेक्चर समीक्षा बुक करें')}</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </button>

              <a
                href="/services"
                onClick={(e) => {
                  e.preventDefault();
                  const el = document.getElementById('services');
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 text-sm font-semibold text-slate-700 hover:text-blue-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md transition-colors cursor-pointer"
              >
                <span>{t('Explore Capabilities', 'तकनीकी क्षमताएं देखें')}</span>
                <ChevronRight className="w-4 h-4 shrink-0" />
              </a>
            </div>

            {/* Trust Signatures (Clean inline text) */}
            <div className="pt-4 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-slate-500 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0" />
                <span>{t('Security-First & DPDP Aligned Architecture (Uncertified)', 'सुरक्षा-प्रथम व DPDP अनुरूप डिज़ाइन (अप्रमाणित)')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{t('High-Availability Target Design (Contract Scoped)', 'उच्च-उपलब्धता डिज़ाइन लक्ष्य (अनुबंधानुसार)')}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Visual Container (5 Cols) */}
          <div className="lg:col-span-5">
            <div className="relative rounded-xl overflow-hidden border border-slate-200 shadow-lg bg-slate-900 group">
              <OptimizedImage
                assetKey="heroImage"
                alt="Power Web Studio AI Enterprise Software Engineering and Command Studio"
                altHi="पावर वेब स्टूडियो एआई एंटरप्राइज सॉफ्टवेयर इंजीनियरिंग एवं कमांड स्टूडियो"
                width={1376}
                height={768}
                loading="eager"
                sizes="(max-width: 1024px) 100vw, 42vw"
                priority
                className="w-full h-80 sm:h-96 lg:h-[420px] object-cover transition-transform duration-500 group-hover:scale-102"
              />
              {/* Subtle gradient overlay at bottom for legible contrast */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent pointer-events-none" />

              {/* Bottom Card Context */}
              <div className="absolute bottom-4 left-4 right-4 p-4 rounded-lg bg-white/95 backdrop-blur-md border border-slate-200 text-slate-900 text-xs shadow-md">
                <div className="flex flex-wrap items-center justify-between gap-1 font-bold text-slate-900 mb-1">
                  <span>{t('Principal Engineering Pods Active', 'सक्रिय मुख्य इंजीनियरिंग पॉड्स')}</span>
                  <span className="font-mono text-blue-700 tabular-nums">Dedicated Pods</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-tight">
                  {t(
                    'Full-stack pods architecting fault-tolerant distributed systems.',
                    'लचीले और सुरक्षित वितरित सिस्टम बनाने वाले समर्पित इंजीनियरिंग दल।'
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 4-Column Full-Width Enterprise KPI Strip Below Hero */}
        <div className="mt-12 sm:mt-14 pt-8 border-t border-slate-200 grid grid-cols-1 min-[360px]:grid-cols-2 md:grid-cols-4 gap-5 sm:gap-6 lg:gap-8">
          <div>
            <div className="text-xl sm:text-3xl lg:text-4xl font-extrabold text-blue-700 font-mono tabular-nums">
              HA Design
            </div>
            <div className="text-xs font-semibold text-slate-900 mt-1">
              {t('Target Availability Architecture', 'लक्षित उच्च उपलब्धता डिज़ाइन')}
            </div>
            <div className="text-xs text-slate-600 mt-0.5">
              {t('Custom SLA defined per SOW', 'प्रोजेक्ट अनुबंध के अनुसार निर्धारित')}
            </div>
          </div>

          <div>
            <div className="text-xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 font-mono tabular-nums">
              Modular Core
            </div>
            <div className="text-xs font-semibold text-slate-900 mt-1">
              {t('Low-Latency Service Design', 'कम लेटेंसी सर्विस डिज़ाइन')}
            </div>
            <div className="text-xs text-slate-600 mt-0.5">
              {t('Idempotent API & event-driven workers', 'आइडमपोटेंट एपीआई और इवेंट-ड्रिवेन वर्कर्स')}
            </div>
          </div>

          <div>
            <div className="text-xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 font-mono tabular-nums">
              Client IP
            </div>
            <div className="text-xs font-semibold text-slate-900 mt-1">
              {t('Full Code & IP Handover', 'पूर्ण कोड व आईपी स्वामित्व')}
            </div>
            <div className="text-xs text-slate-600 mt-0.5">
              {t('Zero proprietary vendor lock-in', 'शून्य मालिकाना वेंडर लॉक-इन')}
            </div>
          </div>

          <div>
            <div className="text-xl sm:text-3xl lg:text-4xl font-extrabold text-blue-700 font-mono tabular-nums">
              Web + AI
            </div>
            <div className="text-xs font-semibold text-slate-900 mt-1">
              {t('Full-Stack Delivery Focus', 'फुल-स्टैक डिलीवरी फोकस')}
            </div>
            <div className="text-xs text-slate-600 mt-0.5">
              {t('Android, Cloud & Sovereign AI', 'एंड्रॉइड, क्लाउड एवं एआई')}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
