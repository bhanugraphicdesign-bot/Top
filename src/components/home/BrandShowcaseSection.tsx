import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Maximize2, X, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';

interface BrandShowcaseSectionProps {
  onOpenConsultation: () => void;
}

interface BrandPoster {
  id: string;
  src: string;
  width: number;
  height: number;
  titleEn: string;
  titleHi: string;
  metaEn: string;
  metaHi: string;
  altEn: string;
  altHi: string;
}

const BRAND_POSTERS: BrandPoster[] = [
  {
    id: 'power-web-studio-poster',
    src: '/assets/aistudio/file_00000000cc788211898eb2b408d0365b_678b494d.png',
    width: 1122,
    height: 1402,
    titleEn: 'Power Web Studio AI — Full-Stack Digital Solutions',
    titleHi: 'पावर वेब स्टूडियो एआई — संपूर्ण डिजिटल समाधान',
    metaEn: 'Website Design · AI Solutions · 24/7 Support',
    metaHi: 'वेबसाइट डिज़ाइन · एआई समाधान · 24/7 सहायता',
    altEn:
      'Power Web Studio AI promotional poster by Bhanu Ram Bariha Digital Technologies highlighting website design, AI solutions, digital innovation, security, and 24/7 support',
    altHi:
      'भानु राम बरीहा डिजिटल टेक्नोलॉजीज का पावर वेब स्टूडियो एआई पोस्टर — वेबसाइट डिज़ाइन, एआई समाधान, डिजिटल इनोवेशन, सुरक्षा और 24/7 सहायता',
  },
  {
    id: 'ai-website-platform-poster',
    src: '/assets/aistudio/file_00000000b0fc82089d798ee81c3ca317_75a20486.png',
    width: 1254,
    height: 1254,
    titleEn: 'Studio AI Enterprise Digital Platform',
    titleHi: 'स्टूडियो एआई एंटरप्राइज डिजिटल प्लेटफॉर्म',
    metaEn: 'AI Powered Solutions · Modern Web Design · Smart Technology',
    metaHi: 'एआई पावर्ड समाधान · आधुनिक वेब डिज़ाइन · स्मार्ट टेक्नोलॉजी',
    altEn:
      'My AI Website promotional poster for Studio AI Enterprise Digital Platform featuring modern web design, AI powered solutions, and smart technology',
    altHi:
      'स्टूडियो एआई एंटरप्राइज डिजिटल प्लेटफॉर्म पोस्टर — अब डिजिटल दुनिया में बनाएं अपनी पहचान, एआई पावर्ड समाधान और आधुनिक वेब डिज़ाइन',
  },
];

export const BrandShowcaseSection: React.FC<BrandShowcaseSectionProps> = ({
  onOpenConsultation,
}) => {
  const { language, t } = useLanguage();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const handleClose = useCallback(() => {
    setActiveIndex(null);
  }, []);

  const handlePrev = useCallback(() => {
    setActiveIndex((prev) =>
      prev === null ? null : (prev - 1 + BRAND_POSTERS.length) % BRAND_POSTERS.length
    );
  }, []);

  const handleNext = useCallback(() => {
    setActiveIndex((prev) => (prev === null ? null : (prev + 1) % BRAND_POSTERS.length));
  }, []);

  useEffect(() => {
    if (activeIndex === null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeIndex, handleClose, handlePrev, handleNext]);

  const activePoster = activeIndex !== null ? BRAND_POSTERS[activeIndex] : null;

  return (
    <section
      id="brand-showcase"
      className="py-12 sm:py-16 bg-slate-50 border-b border-slate-200"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 sm:mb-10">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500 mb-2">
              <span className="text-blue-700 font-bold">
                {t('Power Web Studio AI', 'पावर वेब स्टूडियो एआई')}
              </span>
              <span aria-hidden="true" className="text-slate-300">
                ·
              </span>
              <span>
                {t('Bhanu Ram Bariha Digital Technologies', 'भानु राम बरीहा डिजिटल टेक्नोलॉजीज')}
              </span>
            </div>
            <h2
              className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-950 tracking-tight"
              style={{ textWrap: 'balance' }}
            >
              {language === 'hi' ? (
                <>
                  AI के साथ बनाएं अपनी{' '}
                  <span className="text-blue-700">डिजिटल पहचान</span>
                </>
              ) : (
                <>
                  Build Your <span className="text-blue-700">Digital Identity</span> with AI
                </>
              )}
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
              {t(
                'Modern websites, intelligent AI solutions, and reliable digital platforms designed for businesses and institutions.',
                'व्यापार और संस्थानों के लिए आधुनिक वेबसाइट डिज़ाइन, स्मार्ट एआई समाधान और सुरक्षित व भरोसेमंद डिजिटल प्लेटफॉर्म।'
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenConsultation}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-bold text-white bg-blue-700 hover:bg-blue-800 active:bg-blue-900 rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 self-start md:self-auto focus-visible:outline-2 focus-visible:outline-blue-600"
          >
            <span>{t('Start Your Project', 'अपना प्रोजेक्ट शुरू करें')}</span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </button>
        </div>

        {/* Compact Instagram-Style Poster Row: Snap Scroll on Mobile, Centered Side-by-Side on Desktop */}
        <div className="flex items-stretch gap-5 sm:gap-6 overflow-x-auto snap-x snap-mandatory pb-3 -mx-4 px-4 sm:mx-0 sm:px-0 md:justify-center md:overflow-visible">
          {BRAND_POSTERS.map((poster, index) => {
            const isFailed = failedImages[poster.id];
            return (
              <article
                key={poster.id}
                className="snap-center shrink-0 w-[240px] sm:w-[270px] md:w-[300px] max-w-[300px] flex flex-col rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md overflow-hidden transition-transform duration-200 hover:-translate-y-0.5"
              >
                {/* Uncropped Image Frame (No overlay buttons on top of image) */}
                <button
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  aria-label={
                    language === 'hi'
                      ? `${poster.titleHi} को बड़ा करके देखें`
                      : `View ${poster.titleEn} full size`
                  }
                  className="w-full aspect-[4/5] bg-[#04102b] p-2 flex items-center justify-center cursor-pointer group focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-blue-500"
                >
                  {isFailed ? (
                    <div className="w-full h-full rounded-lg bg-gradient-to-br from-blue-950 via-slate-900 to-blue-900 flex flex-col items-center justify-center p-4 text-center text-white">
                      <p className="text-sm font-bold">
                        {language === 'hi' ? poster.titleHi : poster.titleEn}
                      </p>
                      <p className="mt-1.5 text-[11px] text-blue-200">
                        {language === 'hi' ? poster.metaHi : poster.metaEn}
                      </p>
                    </div>
                  ) : (
                    <img
                      src={poster.src}
                      alt={language === 'hi' ? poster.altHi : poster.altEn}
                      width={poster.width}
                      height={poster.height}
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                      onError={() =>
                        setFailedImages((prev) => ({ ...prev, [poster.id]: true }))
                      }
                      className="w-full h-full object-contain rounded-md transition-transform duration-200 group-hover:scale-[1.015]"
                    />
                  )}
                </button>

                {/* Compact Card Footer: Short Title, 1-Line Meta, and View Full Size Button Below Image */}
                <div className="p-3.5 border-t border-slate-100 flex flex-col gap-2.5 bg-white flex-1 justify-between">
                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                      {language === 'hi' ? poster.titleHi : poster.titleEn}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                      {language === 'hi' ? poster.metaHi : poster.metaEn}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-700 hover:text-blue-800 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap focus-visible:outline-2 focus-visible:outline-blue-600"
                  >
                    <Maximize2 className="w-3.5 h-3.5 shrink-0" />
                    <span>{t('View Full Size', 'पूरा देखें')}</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {/* Accessible Lightbox Modal */}
      {activePoster && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={language === 'hi' ? activePoster.titleHi : activePoster.titleEn}
          onClick={handleClose}
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl max-h-[92vh] bg-[#04102b] border border-slate-700 rounded-xl overflow-hidden flex flex-col shadow-2xl"
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between gap-4 px-4 sm:px-5 py-3 bg-slate-950/90 border-b border-slate-800 text-white">
              <div className="min-w-0">
                <p className="text-sm font-bold truncate">
                  {language === 'hi' ? activePoster.titleHi : activePoster.titleEn}
                </p>
                <p className="text-xs text-slate-400 truncate">
                  {language === 'hi' ? activePoster.metaHi : activePoster.metaEn}
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                aria-label={t('Close preview', 'प्रीव्यू बंद करें')}
                className="p-2 rounded-md text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0 focus-visible:outline-2 focus-visible:outline-blue-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Image Viewport */}
            <div className="relative flex-1 min-h-0 flex items-center justify-center p-3 sm:p-5 overflow-hidden">
              <button
                type="button"
                onClick={handlePrev}
                aria-label={t('Previous poster', 'पिछला पोस्टर')}
                className="absolute left-3 sm:left-4 z-10 p-2.5 rounded-md bg-slate-950/80 hover:bg-slate-900 text-white border border-slate-700 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-500"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <img
                src={activePoster.src}
                alt={language === 'hi' ? activePoster.altHi : activePoster.altEn}
                width={activePoster.width}
                height={activePoster.height}
                referrerPolicy="no-referrer"
                className="max-h-[72vh] max-w-full w-auto h-auto object-contain rounded-md"
              />

              <button
                type="button"
                onClick={handleNext}
                aria-label={t('Next poster', 'अगला पोस्टर')}
                className="absolute right-3 sm:right-4 z-10 p-2.5 rounded-md bg-slate-950/80 hover:bg-slate-900 text-white border border-slate-700 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-500"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Bottom Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 py-3 bg-slate-950/90 border-t border-slate-800 text-xs text-slate-300">
              <span className="font-mono tabular-nums">
                {(activeIndex ?? 0) + 1} / {BRAND_POSTERS.length}
              </span>
              <button
                type="button"
                onClick={() => {
                  handleClose();
                  onOpenConsultation();
                }}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors cursor-pointer whitespace-nowrap"
              >
                <span>{t('Request Consultation', 'परामर्श बुक करें')}</span>
                <ArrowRight className="w-3.5 h-3.5 shrink-0" />
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
