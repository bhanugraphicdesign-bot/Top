import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useNavigation } from '../context/NavigationContext';
import { useApps } from '../context/AppsContext';
import { Smartphone, Check, ArrowLeft, ShieldCheck, Download, Play } from 'lucide-react';
import { OptimizedImage } from '../components/common/OptimizedImage';
import { SEO, ROUTE_SEO_CONFIG } from '../components/common/SEO';
import { OPTIMIZED_ASSETS } from '../data/content';

interface AppDetailPageProps {
  onOpenConsultation: (service: string) => void;
}

export const AppDetailPage: React.FC<AppDetailPageProps> = ({ onOpenConsultation }) => {
  const { language, t } = useLanguage();
  const { params, navigate } = useNavigation();
  const { getAppById, apps } = useApps();

  const appId = params.id || apps[0]?.id;
  const app = getAppById(appId) || apps[0];

  const [activeTab, setActiveTab] = useState<'architecture' | 'features' | 'changelog'>('architecture');
  const [demoSimActive, setDemoSimActive] = useState(false);
  const [simStep, setSimStep] = useState(1);
  const simTimersRef = useRef<number[]>([]);

  const clearSimTimers = () => {
    simTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    simTimersRef.current = [];
  };

  useEffect(() => {
    clearSimTimers();
    setActiveTab('architecture');
    setDemoSimActive(false);
    setSimStep(1);
    return () => clearSimTimers();
  }, [app?.id]);

  if (!app) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <SEO {...ROUTE_SEO_CONFIG['app-detail']} noIndex />
        <h2 className="text-xl font-bold text-slate-900">App not found</h2>
        <button
          onClick={() => navigate('android-portfolio')}
          className="mt-4 px-4 py-2 bg-blue-700 text-white rounded-md text-xs font-bold"
        >
          Return to Portfolio
        </button>
      </div>
    );
  }

  const firstScreenshot = app.screenshots?.[0];
  const appOgImage =
    firstScreenshot && /^https?:\/\//i.test(firstScreenshot) && !/\.webp($|\?)/i.test(firstScreenshot)
      ? firstScreenshot
      : OPTIMIZED_ASSETS.androidImage.jpg;

  const runSimulation = () => {
    clearSimTimers();
    setDemoSimActive(true);
    setSimStep(1);
    const t1 = window.setTimeout(() => setSimStep(2), 800);
    const t2 = window.setTimeout(() => setSimStep(3), 1600);
    simTimersRef.current = [t1, t2];
  };

  return (
    <div className="bg-white">
      <SEO
        titleEn={`${app.name} — ${app.tagline} | POWER WEB STUDIO AI`}
        titleHi={`${app.nameHi || app.name} — ${app.taglineHi || app.tagline} | POWER WEB STUDIO AI`}
        descriptionEn={app.description}
        descriptionHi={app.descriptionHi || app.description}
        ogTitleEn={`${app.name} (${app.category})`}
        ogTitleHi={`${app.nameHi || app.name} (${app.categoryHi || app.category})`}
        ogDescriptionEn={`${app.tagline} — ${app.description}`}
        ogDescriptionHi={`${app.taglineHi || app.tagline} — ${app.descriptionHi || app.description}`}
        ogImage={appOgImage}
        ogImageAltEn={`${app.name} enterprise Android application preview`}
        ogImageAltHi={`${app.nameHi || app.name} एंटरप्राइज एंड्रॉइड एप्लिकेशन पूर्वावलोकन`}
        canonicalPath={`/apps/${encodeURIComponent(app.id)}`}
      />

      {/* Top Breadcrumb & Back Action */}
      <div className="bg-slate-50 border-b border-slate-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <button
            onClick={() => navigate('android-portfolio')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-700 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('Back to Android Portfolio', 'वापस पोर्टफोलियो पर जाएं')}</span>
          </button>

          <div className="text-xs text-slate-500 font-mono">
            {app.category} · {app.version}
          </div>
        </div>
      </div>

      {/* Hero Header for App */}
      <section className="border-b border-slate-200 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Info */}
            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-blue-700 text-white flex items-center justify-center shrink-0 shadow-md">
                  <Smartphone className="w-8 h-8" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-bold uppercase tracking-wide">
                      {t('DEMO / Concept', 'डेमो / कॉन्सेप्ट')}
                    </span>
                    <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                      {language === 'hi' ? app.categoryHi : app.category}
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-950">
                    {language === 'hi' ? app.nameHi : app.name}
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium">
                    {language === 'hi' ? app.taglineHi : app.tagline}
                  </p>
                </div>
              </div>

              {/* Release Status & Authenticity Box */}
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg flex flex-wrap items-center justify-between gap-2 text-xs">
                <div>
                  <span className="font-semibold text-slate-700">{t('Prototype Status: ', 'प्रोटोटाइप स्थिति: ')}</span>
                  <span className="font-mono text-amber-900 font-bold">
                    {language === 'hi' ? app.statusLabelHi : app.statusLabelEn}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-amber-900">{t('Demo coming soon', 'डेमो जल्द उपलब्ध होगा')}</span>
                  <span aria-hidden="true" className="text-amber-300">·</span>
                  <span className="font-mono text-slate-600">{app.targetSdk}</span>
                </div>
              </div>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                {language === 'hi' ? app.descriptionHi : app.description}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={runSimulation}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-md transition-colors cursor-pointer shadow-xs"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>{t('Run Architecture Walkthrough', 'आर्किटेक्चर वॉकथ्रू चलाएं')}</span>
                </button>

                <button
                  onClick={() => onOpenConsultation(`Custom Build Scope: ${app.name}`)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-700 hover:text-blue-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-blue-700" />
                  <span>{t('Demo coming soon · Request Pilot Build', 'डेमो जल्द उपलब्ध होगा · पायलट पूछें')}</span>
                </button>
              </div>
            </div>

            {/* Right Metrics Strip */}
            <div className="lg:col-span-4 space-y-3">
              <div className="p-5 rounded-xl border border-slate-200 bg-slate-50 space-y-4">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block border-b border-slate-200 pb-2">
                  {t('Concept Architecture Targets', 'कॉन्सेप्ट आर्किटेक्चर लक्ष्य')}
                </span>

                {app.metrics.map((m, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">{language === 'hi' ? m.labelHi : m.label}</span>
                    <span className="font-mono font-extrabold text-blue-700 text-sm tabular-nums">
                      {m.value}
                    </span>
                  </div>
                ))}

                <div className="pt-2 border-t border-slate-200 text-xs text-slate-500 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{t('Memory Hardened for 24/7 Terminals', '24/7 टर्मिनलों के लिए मेमोरी अनुकूलित')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Simulator / Screenshots Section */}
      <section className="py-12 border-b border-slate-200 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Screenshots Display */}
            <div className="lg:col-span-7">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-3">
                {t('Device Surface & Screen Architecture', 'डिवाइस स्क्रीन पूर्वावलोकन')}
              </span>
              <div className="rounded-xl overflow-hidden border border-slate-300 shadow-lg bg-slate-900">
                <OptimizedImage
                  assetKey="appMockupImage"
                  customSrc={app.screenshots[0]}
                  alt={`${app.name} enterprise mobile screen architecture preview`}
                  altHi={`${app.nameHi || app.name} एंटरप्राइज मोबाइल स्क्रीन आर्किटेक्चर पूर्वावलोकन`}
                  width={1200}
                  height={896}
                  loading="lazy"
                  sizes="(max-width: 1024px) 100vw, 58vw"
                  className="w-full h-80 sm:h-96 object-cover"
                />
              </div>
            </div>

            {/* Interactive Terminal Sandbox Preview */}
            <div className="lg:col-span-5">
              <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                    {t('Terminal Simulation State', 'टर्मिनल सिमुलेशन स्थिति')}
                  </span>
                  <span className="font-mono text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                    {demoSimActive ? 'Live State' : 'Standby'}
                  </span>
                </div>

                <div className="p-3 bg-slate-900 rounded-lg font-mono text-xs text-slate-200 space-y-1.5">
                  <div className="text-slate-400">// {app.architecture}</div>
                  <div>$ init_mobile_pod --app={app.id}</div>
                  {demoSimActive && simStep >= 1 && (
                    <div className="text-blue-400">✓ SQLiteCipher storage decrypted [AES-256]</div>
                  )}
                  {demoSimActive && simStep >= 2 && (
                    <div className="text-emerald-400">✓ Background WorkManager queue active</div>
                  )}
                  {demoSimActive && simStep >= 3 && (
                    <div className="text-white">✓ Ready: Concept offline-sync sequence complete</div>
                  )}
                </div>

                <p className="text-xs text-slate-500 leading-relaxed">
                  {t(
                    'Simulate how this application synchronizes offline SQLite caches with our cloud microservices.',
                    'देखें कि यह ऐप क्लाउड माइक्रोसर्विस के साथ स्थानीय डेटा को कैसे सुरक्षित सिंक करता है।'
                  )}
                </p>

                <button
                  onClick={runSimulation}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-md transition-colors cursor-pointer"
                >
                  {t('Run Verification Sequence', 'सत्यापन अनुक्रम चलाएं')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs: Architecture vs Features vs Changelog */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-1 overflow-x-auto scrollbar-thin">
            <button
              onClick={() => setActiveTab('architecture')}
              className={`px-4 py-2 text-xs font-bold whitespace-nowrap shrink-0 transition-colors cursor-pointer border-b-2 ${
                activeTab === 'architecture'
                  ? 'border-blue-700 text-blue-700'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              {t('Architecture & Tech Stack', 'आर्किटेक्चर व तकनीकी स्टैक')}
            </button>
            <button
              onClick={() => setActiveTab('features')}
              className={`px-4 py-2 text-xs font-bold whitespace-nowrap shrink-0 transition-colors cursor-pointer border-b-2 ${
                activeTab === 'features'
                  ? 'border-blue-700 text-blue-700'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              {t('Full Feature Specifications', 'विस्तृत विशेषताएं')}
            </button>
            {app.changelog && app.changelog.length > 0 && (
              <button
                onClick={() => setActiveTab('changelog')}
                className={`px-4 py-2 text-xs font-bold whitespace-nowrap shrink-0 transition-colors cursor-pointer border-b-2 ${
                  activeTab === 'changelog'
                    ? 'border-blue-700 text-blue-700'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                {t('Version Changelog', 'संस्करण परिवर्तन सूची')}
              </button>
            )}
          </div>

          {activeTab === 'architecture' && (
            <div className="space-y-6">
              <div className="p-6 rounded-xl border border-slate-200 bg-white space-y-4">
                <h3 className="text-base font-bold text-slate-900">
                  {t('Pattern: ', 'पैटर्न: ')}{app.architecture}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {t(
                    'Built strictly following official Google Android Architecture Guidelines. Unidirectional Data Flow (UDF) prevents state corruption, and Coroutine dispatchers ensure UI threads never drop below 60fps.',
                    'गूगल के आधिकारिक एंड्रॉइड आर्किटेक्चर दिशानिर्देशों के अनुसार निर्मित। यूडीएफ (UDF) डेटा प्रवाह सुनिश्चित करता है कि यूआई कभी लैग न करे।'
                  )}
                </p>

                <div className="pt-2">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block mb-2">
                    {t('Integrated Mobile Tooling', 'एकीकृत मोबाइल टूलिंग')}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {app.techStack.map((tech) => (
                      <span
                        key={tech}
                        className="px-3 py-1 bg-slate-100 rounded-md font-mono text-xs text-slate-800 border border-slate-200 font-semibold"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'features' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(language === 'hi' ? app.keyFeaturesHi : app.keyFeatures).map((feat, i) => (
                <div
                  key={i}
                  className="p-4 rounded-lg border border-slate-200 bg-slate-50/70 flex items-start gap-3 text-xs text-slate-800"
                >
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'changelog' && app.changelog && (
            <div className="space-y-3">
              {app.changelog.map((log, idx) => (
                <div key={idx} className="p-4 rounded-lg border border-slate-200 bg-white">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-mono font-bold text-blue-700">{log.version}</span>
                    <span className="text-slate-400">{log.date}</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    {language === 'hi' ? log.notesHi : log.notes}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
