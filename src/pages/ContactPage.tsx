import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { COMPANY_INFO } from '../data/content';
import { ContactCtaSection } from '../components/home/ContactCtaSection';
import { Phone, Mail, MapPin, Clock, ShieldCheck, Building2 } from 'lucide-react';

export const ContactPage: React.FC = () => {
  const { language, t } = useLanguage();

  return (
    <div className="bg-white">
      {/* Header */}
      <section className="bg-slate-50 border-b border-slate-200 py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="text-xs font-bold text-blue-700 tracking-wider uppercase mb-2">
              {t('DIRECT ARCHITECTURAL ENGAGEMENT', 'सीधा तकनीकी संपर्क')}
            </div>
            <h1
              className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-950 tracking-tight leading-tight"
              style={{ textWrap: 'balance' }}
            >
              {language === 'hi' ? (
                <>
                  हमारे <span className="text-blue-700">प्रमुख आर्किटेक्ट्स</span> से सीधा संपर्क करें
                </>
              ) : (
                <>
                  Engage Directly with Our <span className="text-blue-700">Principal Architects</span>
                </>
              )}
            </h1>
            <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
              {t(
                'No layers of sales representatives. You communicate directly with seasoned enterprise software architects who understand distributed systems, Kotlin mobility, and sovereign AI.',
                'कोई सेल्स प्रतिनिधि नहीं। आप सीधे अनुभवी सॉफ्टवेयर आर्किटेक्ट्स से बात करते हैं जो वितरित सिस्टम और मोबाइल तकनीक को गहराई से समझते हैं।'
              )}
            </p>
          </div>
        </div>
      </section>

      {/* Corporate Offices Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-2">
            <Building2 className="w-6 h-6 text-blue-700 mb-2" />
            <h3 className="text-sm font-bold text-slate-900">
              {t('Headquarters & Innovation Hub', 'मुख्यालय एवं इनोवेशन हब')}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {COMPANY_INFO.name}<br />
              {COMPANY_INFO.headquarters}
            </p>
            <p className="text-[11px] font-mono text-slate-400 pt-1">
              {COMPANY_INFO.registration}
            </p>
          </div>

          <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-2">
            <Phone className="w-6 h-6 text-blue-700 mb-2" />
            <h3 className="text-sm font-bold text-slate-900">
              {t('Mobile & Direct Hotline', 'मोबाइल एवं सीधा संपर्क')}
            </h3>
            <div className="text-xs text-slate-600 font-mono space-y-1">
              <div>
                Mobile:{' '}
                <a
                  href={`tel:${COMPANY_INFO.phone.replace(/\s+/g, '')}`}
                  className="text-blue-700 hover:underline font-semibold"
                >
                  {COMPANY_INFO.phone}
                </a>
              </div>
            </div>
            <p className="text-[11px] text-emerald-700 font-semibold pt-1">
              {t('Direct Inquiry & Support Desk', 'सीधी पूछताछ एवं सहायता डेस्क')}
            </p>
          </div>

          <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-2">
            <Mail className="w-6 h-6 text-blue-700 mb-2" />
            <h3 className="text-sm font-bold text-slate-900">
              {t('Official Corporate Email', 'आधिकारिक ईमेल पता')}
            </h3>
            <div className="text-xs text-slate-600 font-mono space-y-1 break-all">
              <div>
                Email:{' '}
                <a
                  href={`mailto:${COMPANY_INFO.email}`}
                  className="text-blue-700 hover:underline font-semibold"
                >
                  {COMPANY_INFO.email}
                </a>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 pt-1">
              {t('Signed NDA provided upon request', 'अनुरोध पर हस्ताक्षरित एनडीए उपलब्ध')}
            </p>
          </div>
        </div>

        {/* Reusable Contact Form Section */}
        <ContactCtaSection />
      </div>
    </div>
  );
};
