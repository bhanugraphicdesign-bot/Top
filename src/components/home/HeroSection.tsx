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
    <section className="pws-hero-surface relative overflow-hidden pt-8 pb-16 sm:pt-12 sm:pb-24 border-b border-slate-200/80">
      {/* Subtle architectural background grid + drifting aurora orbs */}
      <div className="pws-hero-grid" aria-hidden="true" />
      <div className="pws-hero-aurora" aria-hidden="true">
        <div className="pws-aurora-orb pws-aurora-orb-1" />
        <div className="pws-aurora-orb pws-aurora-orb-2" />
        <div className="pws-aurora-orb pws-aurora-orb-3" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Editorial Subtitle / Trust Kicker (Natural unboxed text with separator) */}
        <div className="pws-home-kicker-bar flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500 mb-5">
          <span className="text-blue-700 tracking-wider uppercase font-bold">
            {COMPANY_INFO.name}
          </span>
          <span aria-hidden="true" className="text-slate-300">·</span>
          <span>{t('Enterprise Technology Division', 'एंटरप्राइज टेक्नोलॉजी डिवीजन')}</span>
          <span aria-hidden="true" className="text-slate-300">·</span>
          <span>{t('Chhattisgarh, India & Global Delivery', 'छत्तीसगढ़, भारत व ग्लोबल डिलीवरी')}</span>
        </div>

        {/* 2-Column Desktop Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Value Proposition & CTAs (7 Cols) */}
          <div className="pws-home-surface-dark lg:col-span-7 space-y-6">
            <h1
              className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-950 tracking-tight leading-[1.12]"
              style={{ textWrap: 'balance' }}
            >
              {language === 'hi' ? (
                <>
                  अगली पीढ़ी के <span className="pws-gradient-text">एंटरप्राइज सॉफ्टवेयर</span>, एंड्रॉइड इकोसिस्टम और <span className="pws-gradient-text">एआई इंजन</span> का निर्माण।
                </>
              ) : (
                <>
                  Architecting <span className="pws-gradient-text">Mission-Critical</span> Enterprise Software, Android Ecosystems & <span className="pws-gradient-text">AI Engines</span>.
                </>
              )}
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
              {language === 'hi'
                ? 'भानु राम बरीहा डिजिटल टेक्नोलॉजीज छोटे-बड़े व्यापारों और संस्थाओं के लिए उच्च-पैमाने के वितरित बैकएंड, नेटिव एंड्रॉइड एप्लिकेशन और सुरक्षित ऑटोनॉमस एआई पाइपलाइनों का निर्माण करती है।'
                : 'Bhanu Ram Bariha Digital Technologies crafts resilient distributed architectures, enterprise Android ecosystems, and sovereign AI workflow engines for businesses of all sizes and organizations.'}
            </p>

            {/* Primary & Secondary Actions */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-2">
              <button
                onClick={onOpenConsultation}
                type="button"
                className="pws-btn-3d w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-3.5 text-sm font-bold text-white rounded-lg cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-600"
              >
                <span>{t('Book Free Consultation', 'मुफ़्त परामर्श बुक करें')}</span>
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
                className="pws-btn-glass w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 text-sm font-semibold text-slate-800 hover:text-blue-700 rounded-lg cursor-pointer"
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
            <div className="pws-card-3d-dark relative rounded-2xl overflow-hidden bg-[#0B1220] group">
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
                  <span>{t('Our Engineering Services', 'हमारी इंजीनियरिंग सेवाएं')}</span>
                  <span className="font-mono text-blue-700 tabular-nums">{t('Dedicated Support', 'समर्पित सहयोग')}</span>
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
        <div className="pws-stagger-grid pws-home-divider mt-12 sm:mt-14 pt-8 border-t border-slate-200/80 grid grid-cols-1 min-[360px]:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
          <div className="pws-card-3d rounded-xl p-4 sm:p-5">
            <div className="text-xl sm:text-3xl lg:text-4xl font-extrabold pws-gradient-text font-mono tabular-nums">
              HA Design
            </div>
            <div className="text-xs font-semibold text-slate-900 mt-1">
              {t('Target Availability Architecture', 'लक्षित उच्च उपलब्धता डिज़ाइन')}
            </div>
            <div className="text-xs text-slate-600 mt-0.5">
              {t('Custom SLA defined per SOW', 'प्रोजेक्ट अनुबंध के अनुसार निर्धारित')}
            </div>
          </div>

          <div className="pws-card-3d rounded-xl p-4 sm:p-5">
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

          <div className="pws-card-3d rounded-xl p-4 sm:p-5">
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

          <div className="pws-card-3d rounded-xl p-4 sm:p-5">
            <div className="text-xl sm:text-3xl lg:text-4xl font-extrabold pws-gradient-text font-mono tabular-nums">
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
