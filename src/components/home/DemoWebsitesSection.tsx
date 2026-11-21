import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { DEMO_SITES, DemoSiteItem, formatIndianMrp } from '../../data/demoSites';
import { useGstStatus } from '../../hooks/useGstStatus';
import { ArrowRight, ExternalLink } from 'lucide-react';

interface DemoWebsitesSectionProps {
  onOpenDemo: (slug: string) => void;
}

const DemoCardPreview: React.FC<{ site: DemoSiteItem; isHindi: boolean }> = ({
  site,
  isHindi,
}) => {
  const [imgFailed, setImgFailed] = React.useState(false);

  if (site.previewImage && !imgFailed) {
    return (
      <div className="relative w-full aspect-[16/10] bg-slate-100 border-b border-slate-200 overflow-hidden group">
        <img
          src={site.previewImage}
          alt={
            isHindi
              ? `${site.nameHi} डेमो वेबसाइट प्रीव्यू`
              : `${site.nameEn} demo website preview`
          }
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
    );
  }

  return (
    <div
      className="relative w-full aspect-[16/10] border-b border-slate-200 flex items-center justify-center p-6 text-white"
      style={{
        backgroundImage: `linear-gradient(135deg, ${site.accentFrom}, ${site.accentTo})`,
      }}
    >
      <span className="text-lg font-extrabold tracking-tight">
        {isHindi ? site.nameHi : site.nameEn}
      </span>
    </div>
  );
};

export const DemoWebsitesSection: React.FC<DemoWebsitesSectionProps> = ({ onOpenDemo }) => {
  const { language, t } = useLanguage();
  const { status: gstStatus } = useGstStatus();
  const isHindi = language === 'hi';
  const isGstRegistered = gstStatus.gstRegistered;

  return (
    <section
      id="demo-websites"
      className="py-14 sm:py-20 bg-white border-b border-slate-200 scroll-mt-20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-2xl mb-10">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500 mb-2">
            <span className="text-blue-700 font-bold">
              {t('Interactive Client Previews', 'इंटरैक्टिव क्लाइंट प्रीव्यू')}
            </span>
            <span aria-hidden="true" className="text-slate-300">
              ·
            </span>
            <span>{t('No Login Required', 'बिना लॉगिन के खोलें')}</span>
          </div>
          <h2
            className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-950 tracking-tight"
            style={{ textWrap: 'balance' }}
          >
            {isHindi ? (
              <>
                डेमो <span className="text-blue-700">वेबसाइट्स</span>
              </>
            ) : (
              <>
                Demo <span className="text-blue-700">Websites</span>
              </>
            )}
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
            {t(
              'Explore live sample websites built for different business categories before starting your own project.',
              'अपना प्रोजेक्ट शुरू करने से पहले विभिन्न बिज़नेस श्रेणियों के लिए बनी लाइव नमूना वेबसाइट्स स्वयं चलाकर देखें।'
            )}
          </p>
        </div>

        {/* Demo Card Grid (1 col on mobile, 3 cols on desktop) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {DEMO_SITES.map((site) => (
            <article
              key={site.slug}
              className="flex flex-col rounded-xl bg-white border border-slate-200 shadow-xs hover:shadow-md overflow-hidden transition-transform duration-200 hover:-translate-y-0.5"
            >
              {/* Miniature Preview */}
              <DemoCardPreview site={site} isHindi={isHindi} />

              {/* Card Details */}
              <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-medium text-slate-500 truncate">
                      {isHindi ? site.categoryHi : site.categoryEn}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {(site.badgeHi || site.badgeEn) && (
                        <span className="px-2 py-0.5 rounded bg-indigo-950 text-[10px] font-bold tracking-wide text-orange-300 whitespace-nowrap">
                          {isHindi ? site.badgeHi || site.badgeEn : site.badgeEn || site.badgeHi}
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded bg-amber-100 border border-amber-300 text-[10px] font-extrabold uppercase tracking-wider text-amber-900">
                        DEMO
                      </span>
                    </div>
                  </div>

                  <h3 className="text-lg font-extrabold text-slate-950 tracking-tight">
                    {isHindi ? site.nameHi : site.nameEn}
                  </h3>
                  <p className="mt-1.5 text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-2">
                    {isHindi ? site.descriptionHi : site.descriptionEn}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="pt-3 border-t border-slate-100">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-xs font-medium text-slate-500">
                        {isHindi ? 'MRP से शुरू' : 'Starting MRP'}
                      </span>
                      <span className="text-base sm:text-lg font-extrabold text-blue-950 font-mono tabular-nums">
                        {formatIndianMrp(site.mrp)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      {isGstRegistered
                        ? isHindi
                          ? '+18% GST • डोमेन/होस्टिंग अलग'
                          : '+18% GST • Domain/hosting extra'
                        : isHindi
                        ? 'GST लागू नहीं • डोमेन/होस्टिंग अलग'
                        : 'GST Not Applicable • Domain/hosting extra'}
                    </p>
                  </div>

                  <a
                    href={`/demo/${site.slug}`}
                    onClick={(e) => {
                      e.preventDefault();
                      onOpenDemo(site.slug);
                    }}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-blue-700 hover:bg-blue-800 active:bg-blue-900 rounded-md transition-colors cursor-pointer whitespace-nowrap focus-visible:outline-2 focus-visible:outline-blue-600"
                  >
                    <span>{t('View Demo', 'डेमो देखें')}</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    <ArrowRight className="w-3.5 h-3.5 shrink-0 hidden sm:inline" />
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
