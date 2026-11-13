import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { COMPANY_INFO, ASSETS } from '../../data/content';
import { Shield, Award, MapPin, Building2, Check, ArrowRight } from 'lucide-react';

interface CompanyIntroSectionProps {
  onOpenConsultation: () => void;
}

export const CompanyIntroSection: React.FC<CompanyIntroSectionProps> = ({
  onOpenConsultation,
}) => {
  const { language, t } = useLanguage();

  return (
    <section id="company" className="py-20 sm:py-28 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-14">
          <div className="text-xs font-bold text-blue-700 tracking-wider uppercase mb-2">
            {t('ABOUT THE ENTERPRISE', 'कंपनी परिचय')}
          </div>
          <h2
            className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight"
            style={{ textWrap: 'balance' }}
          >
            {language === 'hi' ? (
              <>
                भारतीय इंजीनियरिंग प्रतिभा का वैश्विक मंच: <span className="text-blue-700">भानु राम बरीहा डिजिटल टेक्नोलॉजीज</span>
              </>
            ) : (
              <>
                Indian Engineering Precision Delivering to Global Benchmarks: <span className="text-blue-700">{COMPANY_INFO.name}</span>
              </>
            )}
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            {language === 'hi'
              ? 'पावर वेब स्टूडियो एआई (Power Web Studio AI) भानु राम बरीहा डिजिटल टेक्नोलॉजीज का प्रमुख डिजिटल इनोवेशन और सॉफ्टवेयर इंजीनियरिंग प्लेटफॉर्म है। हम संस्थागत विश्वसनीयता, उन्नत एआई इंजनों और त्रुटिहीन कोड गुणवत्ता के साथ आधुनिक उद्यमों को सशक्त बनाते हैं।'
              : 'Power Web Studio AI is the flagship digital engineering and technology brand of Bhanu Ram Bariha Digital Technologies. We unite deep mathematical modeling, distributed software architecture, and sovereign artificial intelligence to solve critical industry problems.'}
          </p>
        </div>

        {/* 2-Column Story & Campus Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left: Campus Image & Facility Credentials */}
          <div className="lg:col-span-6 space-y-4">
            <div className="relative rounded-xl overflow-hidden border border-slate-200 shadow-md group">
              <img
                src={ASSETS.campusImage}
                alt="Bhanu Ram Bariha Digital Technologies Innovation Campus"
                loading="lazy"
                decoding="async"
                className="w-full h-80 sm:h-96 object-cover transition-transform duration-500 group-hover:scale-102"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-300">
                  {t('Innovation Campus & Delivery Center', 'इनोवेशन कैंपस और डिलीवरी सेंटर')}
                </p>
                <p className="text-sm font-bold mt-0.5">
                  {COMPANY_INFO.headquarters}
                </p>
              </div>
            </div>

            {/* Corporate Registration Strip (Unboxed metadata) */}
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
              <div className="flex items-center gap-2 min-w-0">
                <Building2 className="w-4 h-4 text-blue-700 shrink-0" />
                <span className="font-semibold text-slate-900 break-words">{COMPANY_INFO.registration}</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-blue-700 shrink-0" />
                <span>{t('Security-First Engineering Practices (Uncertified)', 'सुरक्षा-प्रथम इंजीनियरिंग अभ्यास (अप्रमाणित)')}</span>
              </div>
            </div>
          </div>

          {/* Right: Core Values & Strategic Pillars */}
          <div className="lg:col-span-6 space-y-6">
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
              {t('Our Engineering Operating Philosophy', 'हमारा इंजीनियरिंग संचालन दर्शन')}
            </h3>

            <div className="space-y-4">
              <div className="p-4 rounded-lg border border-slate-200 bg-white hover:border-blue-300 transition-colors">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-700" />
                  {t('Zero-Loss Architectural Discipline', 'शून्य-हानि आर्किटेक्चर अनुशासन')}
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                  {t(
                    'We treat concurrency, race conditions, and network partitions as inevitable reality. Every database transaction and API invocation is hardened with idempotency keys and active state reconciliation.',
                    'हम नेटवर्क बाधाओं को वास्तविक मानकर काम करते हैं। हर डेटाबेस लेनदेन और एपीआई कॉल को सख्त आइडमपोटेंसी कुंजियों के साथ सुरक्षित किया जाता है।'
                  )}
                </p>
              </div>

              <div className="p-4 rounded-lg border border-slate-200 bg-white hover:border-blue-300 transition-colors">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-700" />
                  {t('Complete Sovereign IP Ownership', 'संपूर्ण संप्रभु आईपी स्वामित्व')}
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                  {t(
                    'Your business critical software belongs to you. We write clean, documented, self-hosting codebases free of proprietary runtime lock-in. Full git history, CI/CD scripts, and Docker images are transferred directly to your organization.',
                    'आपका सॉफ्टवेयर पूरी तरह आपका है। हम बिना किसी मालिकाना लॉक-इन के स्वच्छ, प्रलेखित कोडबेस लिखते हैं। पूरा गिट इतिहास और सीआई/सीडी स्क्रिप्ट सीधे आपकी कंपनी को सौंपी जाती हैं।'
                  )}
                </p>
              </div>

              <div className="p-4 rounded-lg border border-slate-200 bg-white hover:border-blue-300 transition-colors">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-700" />
                  {t('Deterministic AI Grounding', 'विश्वसनीय व सत्यापित एआई इंटीग्रेशन')}
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                  {t(
                    'We ban ungrounded AI hallucinations in enterprise settings. Our vector pipelines pair semantic embeddings with strict lexical re-rankers, providing auditable mathematical confidence scores for every generative inference.',
                    'हम व्यावसायिक कार्यों में बिना आधार वाले एआई अनुमानों को रोकते हैं। हमारे वेक्टर सिस्टम हर जेनेरेटिव परिणाम के लिए सत्यापन योग्य संदर्भ प्रदान करते हैं।'
                  )}
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={onOpenConsultation}
                className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 text-xs font-bold text-blue-700 hover:text-white bg-blue-50 hover:bg-blue-700 rounded-md transition-colors cursor-pointer border border-blue-200 text-left"
              >
                <span>{t('Meet Our Leadership & Engineering Architects', 'हमारे लीडरशिप और आर्किटेक्ट्स से जुड़ें')}</span>
                <ArrowRight className="w-3.5 h-3.5 shrink-0" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
