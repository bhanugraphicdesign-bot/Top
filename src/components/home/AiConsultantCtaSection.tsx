import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Calendar, MessageSquareText } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface AiConsultantCtaSectionProps {
  onStartAiConsultant: () => void;
  onOpenConsultation: () => void;
}

export const AiConsultantCtaSection: React.FC<AiConsultantCtaSectionProps> = ({
  onStartAiConsultant,
  onOpenConsultation,
}) => {
  const { language } = useLanguage();
  const isHi = language === 'hi';
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [cardAnimState, setCardAnimState] = useState<'static' | 'waiting' | 'popped'>('static');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const node = cardRef.current;

    if (reducedMotion || !node || typeof IntersectionObserver === 'undefined') {
      setCardAnimState('static');
      return;
    }

    const rect = node.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.92 && rect.bottom > 0) {
      setCardAnimState('popped');
      return;
    }

    setCardAnimState('waiting');

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        if (entry.isIntersecting || entry.boundingClientRect.top < window.innerHeight) {
          setCardAnimState('popped');
          observer.disconnect();
        }
      },
      { threshold: 0.08 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const cardAnimClass =
    cardAnimState === 'waiting'
      ? 'pws-ai-cta-card-waiting'
      : cardAnimState === 'popped'
      ? 'pws-ai-cta-card-pop'
      : '';

  return (
    <section
      aria-labelledby="ai-consultant-cta-heading"
      className="bg-gradient-to-b from-[#F4F8FF] to-white py-12 sm:py-16 border-b border-slate-200/80"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          ref={cardRef}
          className={`pws-home-light-card ${cardAnimClass} rounded-2xl bg-white border border-blue-100 shadow-sm p-6 sm:p-10 lg:p-12`.trim()}
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-700">
                <MessageSquareText className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>
                  {isHi
                    ? 'Power Web Studio AI Consultant · 8-चरणीय गाइडेड प्लानिंग'
                    : 'Power Web Studio AI Consultant · 8-Step Guided Planning'}
                </span>
              </div>

              <h2
                id="ai-consultant-cta-heading"
                className="text-2xl sm:text-3xl lg:text-[2rem] font-extrabold text-slate-950 tracking-tight leading-tight"
                style={{ textWrap: 'balance' }}
              >
                {isHi
                  ? 'अपनी वेबसाइट का आइडिया नहीं है? AI से पूछें!'
                  : 'No website idea yet? Ask our AI!'}
              </h2>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
                {isHi
                  ? 'अपने बिजनेस के बारे में बताइए। हमारा AI Consultant आपकी जरूरतों के अनुसार वेबसाइट का प्लान तैयार करने में मदद करेगा।'
                  : 'Tell us about your business. Our AI Consultant will help plan a website tailored to your needs.'}
              </p>
            </div>

            <div className="lg:col-span-5 relative z-10 flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-3.5 sm:gap-4 lg:justify-end">
              <button
                type="button"
                onClick={onStartAiConsultant}
                className="pws-ai-cta-btn-primary relative z-10 w-full sm:w-auto min-h-[48px] px-5 sm:px-6 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold inline-flex items-center justify-center gap-2 cursor-pointer touch-manipulation select-none text-center whitespace-normal sm:whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
              >
                <span>{isHi ? 'AI से वेबसाइट प्लान बनाएं' : 'Plan My Website with AI'}</span>
                <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={onOpenConsultation}
                className="pws-ai-cta-btn-secondary relative z-10 w-full sm:w-auto min-h-[48px] px-5 sm:px-6 py-3 rounded-xl bg-white hover:bg-blue-50/70 text-slate-900 border border-slate-300 hover:border-blue-300 text-sm font-semibold inline-flex items-center justify-center gap-2 cursor-pointer touch-manipulation select-none text-center whitespace-normal sm:whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
              >
                <Calendar className="w-4 h-4 text-blue-700 shrink-0" aria-hidden="true" />
                <span>{isHi ? 'कंसल्टेशन बुक करें' : 'Book Consultation'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
