import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useApps } from '../../context/AppsContext';
import { AndroidApp } from '../../types';
import { Smartphone, Check, ArrowRight, ExternalLink, ShieldCheck, Zap } from 'lucide-react';
import { OptimizedImage } from '../common/OptimizedImage';

interface AndroidPortfolioSectionProps {
  onSelectApp: (app: AndroidApp) => void;
  onRequestApkDemo: (appId: string) => void;
}

export const AndroidPortfolioSection: React.FC<AndroidPortfolioSectionProps> = ({
  onSelectApp,
  onRequestApkDemo,
}) => {
  const { language, t } = useLanguage();
  const { apps } = useApps();
  const [activeAppIndex, setActiveAppIndex] = useState(0);

  const displayApps = apps.slice(0, 4);
  const activeApp = displayApps[activeAppIndex] || displayApps[0];

  if (!activeApp) return null;

  return (
    <section id="android-portfolio" className="py-20 sm:py-28 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-14">
          <div className="text-xs font-bold text-blue-700 tracking-wider uppercase mb-2">
            {t('MOBILE ENGINEERING EXCELLENCE', 'मोबाइल इंजीनियरिंग उत्कृष्टता')}
          </div>
          <h2
            className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight"
            style={{ textWrap: 'balance' }}
          >
            {language === 'hi' ? (
              <>
                मिशन-क्रिटिकल <span className="text-blue-700">नेटिव एंड्रॉइड</span> एप्लिकेशन्स और इकोसिस्टम
              </>
            ) : (
              <>
                Mission-Critical <span className="text-blue-700">Native Android</span> Applications & Ecosystems
              </>
            )}
          </h2>
          <p className="mt-3 text-base sm:text-lg text-slate-600 leading-relaxed">
            {t(
              'High-concurrency mobile software built with modern Kotlin, Jetpack Compose, and offline-first data sync for Indian and global enterprise fleets.',
              'आधुनिक कोटलिन, जेटपैक कम्पोज़ और ऑफलाइन-फर्स्ट डेटा सिंक के साथ निर्मित उच्च-समवर्ती मोबाइल सॉफ्टवेयर।'
            )}
          </p>
        </div>

        {/* 2-Column Interactive Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Interactive App Selector Tabs & Deep Specs (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* App Selector Tab Buttons (Interactive Buttons) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {displayApps.map((app: AndroidApp, index: number) => (
                <button
                  key={app.id}
                  onClick={() => setActiveAppIndex(index)}
                  className={`p-3 rounded-lg text-left transition-all cursor-pointer border ${
                    activeAppIndex === index
                      ? 'bg-blue-50 border-blue-600 shadow-xs ring-1 ring-blue-600'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-[11px] font-bold text-slate-400 font-mono">
                    0{index + 1}
                  </div>
                  <div className="text-xs font-bold text-slate-900 truncate mt-1">
                    {language === 'hi' ? app.nameHi : app.name}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate mt-0.5">
                    {language === 'hi' ? app.categoryHi : app.category}
                  </div>
                </button>
              ))}
            </div>

            {/* Active App Detailed Card */}
            <div className="p-6 sm:p-8 rounded-xl border border-slate-200 bg-white shadow-xs space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <div className="text-xs font-bold text-blue-700 tracking-wider uppercase">
                    {language === 'hi' ? activeApp.categoryHi : activeApp.category} · {activeApp.version}
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">
                    {language === 'hi' ? activeApp.nameHi : activeApp.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {language === 'hi' ? activeApp.taglineHi : activeApp.tagline}
                  </p>
                </div>

                <button
                  onClick={() => onSelectApp(activeApp)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors cursor-pointer"
                >
                  <span>{t('Architecture Specs', 'आर्किटेक्चर विवरण')}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Architecture Badge */}
              <div className="text-xs text-slate-700 font-mono bg-slate-50 p-2.5 rounded-md border border-slate-200">
                <span className="font-bold text-slate-900">Pattern: </span>
                {activeApp.architecture}
              </div>

              {/* Narrative */}
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {language === 'hi' ? activeApp.descriptionHi : activeApp.description}
              </p>

              {/* Key Features */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  {t('Flagship Architectural Capabilities', 'प्रमुख तकनीकी क्षमताएं')}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(language === 'hi' ? activeApp.keyFeaturesHi : activeApp.keyFeatures).map(
                    (feat: string, i: number) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 text-xs text-slate-700 bg-slate-50/70 p-2 rounded-md border border-slate-200/60"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Performance Metrics Trio */}
              <div className="pt-4 border-t border-slate-100 grid grid-cols-1 min-[360px]:grid-cols-3 gap-2 sm:gap-3">
                {activeApp.metrics.map((m: { label: string; labelHi: string; value: string }, i: number) => (
                  <div key={i} className="text-center p-2 rounded bg-slate-50 border border-slate-100 min-w-0">
                    <div className="text-sm sm:text-base font-extrabold text-blue-700 font-mono tabular-nums break-words">
                      {m.value}
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium break-words">
                      {language === 'hi' ? m.labelHi : m.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA button */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-1.5">
                  {activeApp.techStack.slice(0, 3).map((tech: string) => (
                    <span
                      key={tech}
                      className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => onRequestApkDemo(activeApp.id)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-md transition-colors cursor-pointer shadow-xs shrink-0"
                >
                  <span>{t('Request Demo APK', 'डेमो एपीके का अनुरोध करें')}</span>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: High-Impact Android Hardware Showcase (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="relative rounded-xl overflow-hidden border border-slate-200 shadow-md bg-slate-50 group">
              <OptimizedImage
                assetKey="androidImage"
                alt="Bhanu Ram Bariha Digital Technologies Enterprise Android Applications Showcase"
                altHi="भानु राम बरीहा डिजिटल टेक्नोलॉजीज एंटरप्राइज एंड्रॉइड ऐप्स शोकेस"
                width={1200}
                height={896}
                loading="lazy"
                sizes="(max-width: 1024px) 100vw, 42vw"
                className="w-full h-80 sm:h-96 lg:h-[480px] object-cover transition-transform duration-500 group-hover:scale-102"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent pointer-events-none" />
              <div className="absolute bottom-5 left-5 right-5 text-white">
                <span className="text-[11px] font-bold tracking-wider text-blue-300 uppercase block">
                  {t('Enterprise Mobility Ecosystem', 'एंटरप्राइज मोबिलिटी इकोसिस्टम')}
                </span>
                <p className="text-sm font-semibold mt-1">
                  {t(
                    'Built for real-world field resiliency across 1,000+ Android device profiles.',
                    '1,000+ एंड्रॉइड डिवाइस प्रोफाइल पर विश्वसनीय संचालन के लिए निर्मित।'
                  )}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-slate-300">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                    <span>{t('Memory Hardened', 'मेमोरी अनुकूलित')}</span>
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-yellow-400" />
                    <span>{t('Offline Resilient', 'ऑफलाइन सुदृढ़')}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
