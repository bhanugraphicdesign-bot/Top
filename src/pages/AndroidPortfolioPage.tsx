import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useNavigation } from '../context/NavigationContext';
import { useApps } from '../context/AppsContext';
import { useAuth } from '../context/AuthContext';
import { AndroidApp, AppCategory } from '../types';
import { Smartphone, Check, ArrowRight, ExternalLink, ShieldCheck, Download, Search, Filter, Settings, Layers } from 'lucide-react';
import { AdminAppManagerModal } from '../components/admin/AdminAppManagerModal';
import { OptimizedImage } from '../components/common/OptimizedImage';

interface AndroidPortfolioPageProps {
  onOpenConsultation: () => void;
}

export const AndroidPortfolioPage: React.FC<AndroidPortfolioPageProps> = ({ onOpenConsultation }) => {
  const { language, t } = useLanguage();
  const { navigate } = useNavigation();
  const { apps } = useApps();
  const { isAdmin } = useAuth();

  const [selectedCategory, setSelectedCategory] = useState<AppCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [adminModalOpen, setAdminModalOpen] = useState(false);

  const categories: (AppCategory | 'all')[] = [
    'all',
    'Business Apps',
    'Education Apps',
    'Productivity Apps',
    'Utility Apps',
    'E-commerce Apps',
    'Enterprise Apps',
    'AI-powered Apps',
  ];

  const categoryTranslations: Record<AppCategory | 'all', { en: string; hi: string }> = {
    all: { en: 'All Apps', hi: 'सभी ऐप्स' },
    'Business Apps': { en: 'Business Apps', hi: 'बिजनेस ऐप्स' },
    'Education Apps': { en: 'Education Apps', hi: 'शिक्षा ऐप्स' },
    'Productivity Apps': { en: 'Productivity Apps', hi: 'उत्पादकता ऐप्स' },
    'Utility Apps': { en: 'Utility Apps', hi: 'उपयोगिता ऐप्स' },
    'E-commerce Apps': { en: 'E-commerce Apps', hi: 'ई-कॉमर्स ऐप्स' },
    'Enterprise Apps': { en: 'Enterprise Apps', hi: 'एंटरप्राइज ऐप्स' },
    'AI-powered Apps': { en: 'AI-powered Apps', hi: 'एआई-पावर्ड ऐप्स' },
  };

  const filteredApps = apps.filter((app) => {
    const matchesCategory = selectedCategory === 'all' || app.category === selectedCategory;
    const matchesSearch =
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.techStack.some((tech) => tech.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="bg-white">
      {/* Header */}
      <section className="bg-slate-50 border-b border-slate-200 py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-3xl">
              <div className="text-xs font-bold text-blue-700 tracking-wider uppercase mb-2">
                {t('ANDROID MOBILITY & APPLICATION PORTFOLIO', 'एंड्रॉइड मोबिलिटी एवं ऐप पोर्टफोलियो')}
              </div>
              <h1
                className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-950 tracking-tight leading-tight"
                style={{ textWrap: 'balance' }}
              >
                {language === 'hi' ? (
                  <>
                    मिशन-क्रिटिकल <span className="text-blue-700">नेटिव एंड्रॉइड ऐप्स</span> और मोबाइल इकोसिस्टम
                  </>
                ) : (
                  <>
                    Mission-Critical <span className="text-blue-700">Native Android Apps</span> & Ecosystems
                  </>
                )}
              </h1>
              <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
                {t(
                  'Explore our production and enterprise applications engineered with modern Kotlin, Jetpack Compose, and offline-first database synchronization across 7 industry categories.',
                  '7 उद्योग श्रेणियों में आधुनिक कोटलिन, जेटपैक कम्पोज़ और ऑफलाइन-फर्स्ट डेटाबेस सिंक के साथ निर्मित हमारे उत्पादन ऐप्स का अन्वेषण करें।'
                )}
              </p>
            </div>

            {/* Admin Management Button (Verified Admin Only) */}
            {isAdmin && (
              <button
                onClick={() => setAdminModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-700 hover:text-blue-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-md transition-colors cursor-pointer shrink-0 shadow-2xs self-start md:self-auto"
              >
                <Settings className="w-3.5 h-3.5 text-blue-700" />
                <span>{t('Admin: Manage Portfolio Apps', 'एडमिन: पोर्टफोलियो ऐप्स प्रबंधित करें')}</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 space-y-10">
        {/* Search & Category Filter Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          {/* 7 Category Filter Buttons (Interactive Tab Buttons) */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-blue-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                {language === 'hi' ? categoryTranslations[cat].hi : categoryTranslations[cat].en}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full lg:w-[300px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('Search by app name, tech, or feature...', 'ऐप नाम या फीचर से खोजें...')}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-600 outline-hidden bg-white text-slate-900"
            />
          </div>
        </div>

        {/* Apps Count indicator */}
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>
            {t(
              `Showing ${filteredApps.length} Android applications`,
              `${filteredApps.length} एंड्रॉइड एप्लिकेशन दिखाए जा रहे हैं`
            )}
          </span>
          <span className="font-mono text-slate-400">Target SDK: Android 14 (API 34)</span>
        </div>

        {/* 2-Column App Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {filteredApps.map((app) => (
            <div
              key={app.id}
              className="rounded-xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs hover:border-blue-500 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* App Card Header: Icon + Name + Category + Status */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-14 h-14 rounded-xl bg-blue-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Smartphone className="w-7 h-7" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                        {app.category}
                      </span>
                      <span className="text-xs font-mono text-slate-500">{app.version}</span>
                    </div>

                    <h2 className="text-xl font-bold text-slate-900 truncate mt-0.5">
                      {language === 'hi' ? app.nameHi : app.name}
                    </h2>

                    <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                      {language === 'hi' ? app.taglineHi : app.tagline}
                    </p>
                  </div>
                </div>

                {/* Release Status Notice (Strictly Honest: No Fake Play Store Links!) */}
                <div className="mb-4 p-2.5 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">
                    {t('Distribution Status:', 'वितरण स्थिति:')}
                  </span>
                  <span className="font-semibold text-blue-800 font-mono text-[11px]">
                    {language === 'hi' ? app.statusLabelHi : app.statusLabelEn}
                  </span>
                </div>

                {/* Short Description */}
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-5">
                  {language === 'hi' ? app.descriptionHi : app.description}
                </p>

                {/* Screenshots Preview (Visual Presentation) */}
                <div className="mb-5">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
                    {t('Interface Preview', 'इंटरफ़ेस पूर्वावलोकन')}
                  </span>
                  <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-900 h-44 sm:h-52">
                    <OptimizedImage
                      assetKey="appMockupImage"
                      customSrc={app.screenshots[0]}
                      alt={`${app.name} enterprise Android interface preview`}
                      altHi={`${app.nameHi || app.name} एंटरप्राइज एंड्रॉइड इंटरफ़ेस पूर्वावलोकन`}
                      width={1200}
                      height={896}
                      loading="lazy"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[11px] text-white">
                      <span>{app.architecture}</span>
                      <span className="font-mono">{app.downloadSize}</span>
                    </div>
                  </div>
                </div>

                {/* Core Features List */}
                <div className="space-y-1.5 mb-6">
                  {(language === 'hi' ? app.keyFeaturesHi : app.keyFeatures).slice(0, 3).map((feat, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-700">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Actions: App Details Button + Demo Link / Play Link Policy */}
              <div>
                <div className="flex flex-wrap items-center gap-1.5 pb-4 mb-4 border-b border-slate-100">
                  {app.techStack.map((tech) => (
                    <span
                      key={tech}
                      className="px-2 py-0.5 rounded bg-slate-100 font-mono text-[11px] text-slate-700"
                    >
                      {tech}
                    </span>
                  ))}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  {/* Google Play / Distribution Info */}
                  <div className="text-[11px] text-slate-500">
                    {app.playStoreUrl ? (
                      <a
                        href={app.playStoreUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-700 font-semibold hover:underline inline-flex items-center gap-1"
                      >
                        <span>Google Play</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-slate-500 italic">
                        {t('Enterprise Private Build', 'एंटरप्राइज प्राइवेट बिल्ड')}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Demo Button */}
                    <button
                      onClick={() => navigate('app-detail', { id: app.id })}
                      className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-blue-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                    >
                      {t('Interactive Demo', 'डेमो पूर्वावलोकन')}
                    </button>

                    {/* App Details Button */}
                    <button
                      onClick={() => navigate('app-detail', { id: app.id })}
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-md transition-colors cursor-pointer shadow-xs"
                    >
                      <span>{t('App Details', 'ऐप विवरण')}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Admin App Manager Modal (Verified Admin Only) */}
      {isAdmin && (
        <AdminAppManagerModal
          isOpen={adminModalOpen}
          onClose={() => setAdminModalOpen(false)}
        />
      )}
    </div>
  );
};
