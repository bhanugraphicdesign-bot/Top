import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useNavigation } from '../context/NavigationContext';
import { formatIndianMrp, getDemoSiteBySlug } from '../data/demoSites';
import { useGstStatus } from '../hooks/useGstStatus';

interface DemoPriceBarProps {
  slug: string;
}

export const DemoPriceBar: React.FC<DemoPriceBarProps> = ({ slug }) => {
  const { language } = useLanguage();
  const { navigate } = useNavigation();
  const { status: gstStatus } = useGstStatus();
  const site = getDemoSiteBySlug(slug);

  if (!site) return null;

  const isHi = language === 'hi';
  const formattedMrp = formatIndianMrp(site.mrp);
  const isGstRegistered = gstStatus.gstRegistered;

  const handleRequestSimilar = () => {
    const inquiryText = isHi
      ? `डेमो: ${site.nameHi} जैसी वेबसाइट`
      : `Demo: Website like ${site.nameEn}`;

    navigate('contact', {
      demo: site.slug,
      inquiry: inquiryText,
    });
  };

  return (
    <div className="w-full bg-white border-b border-slate-200 text-slate-900">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <p className="text-xs sm:text-[13px] font-medium text-slate-800 leading-snug min-w-0">
          {isHi ? (
            <>
              इस जैसी पूरी चालू वेबसाइट (एडमिन पैनल सहित) का MRP:{' '}
              <span className="font-extrabold text-blue-950 font-mono tabular-nums whitespace-nowrap">
                {formattedMrp}
              </span>{' '}
              {isGstRegistered ? 'से शुरू + 18% GST' : 'से शुरू • GST लागू नहीं'}
            </>
          ) : (
            <>
              Complete live website like this (with Admin Panel) MRP:{' '}
              <span className="font-extrabold text-blue-950 font-mono tabular-nums whitespace-nowrap">
                {formattedMrp}
              </span>{' '}
              {isGstRegistered ? 'starting + 18% GST' : 'starting • GST Not Applicable'}
            </>
          )}
        </p>

        <button
          type="button"
          onClick={handleRequestSimilar}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-md bg-amber-400 hover:bg-amber-500 active:bg-amber-600 text-slate-950 font-bold text-xs transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-amber-600"
        >
          <span>{isHi ? 'इस जैसी वेबसाइट बनवाएँ' : 'Build a Website Like This'}</span>
          <ArrowRight className="w-3.5 h-3.5 shrink-0" />
        </button>
      </div>
    </div>
  );
};
