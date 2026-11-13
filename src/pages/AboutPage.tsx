import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useNavigation } from '../context/NavigationContext';
import { COMPANY_INFO, ASSETS } from '../data/content';
import { Building2, Award, ShieldCheck, MapPin, Compass, ArrowRight, Code2, Users, CheckCircle } from 'lucide-react';

interface AboutPageProps {
  onOpenConsultation: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onOpenConsultation }) => {
  const { language, t } = useLanguage();
  const { navigate } = useNavigation();

  return (
    <div className="bg-white">
      {/* Page Header Banner */}
      <section className="bg-slate-50 border-b border-slate-200 py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="text-xs font-bold text-blue-700 tracking-wider uppercase mb-2">
              {t('CORPORATE PROFILE & GOVERNANCE', 'कॉर्पोरेट प्रोफ़ाइल एवं प्रशासन')}
            </div>
            <h1
              className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-950 tracking-tight leading-tight"
              style={{ textWrap: 'balance' }}
            >
              {language === 'hi' ? (
                <>
                  भारतीय इंजीनियरिंग प्रतिभा का वैश्विक मंच: <span className="text-blue-700">भानु राम बरीहा डिजिटल टेक्नोलॉजीज</span>
                </>
              ) : (
                <>
                  Pioneering Sovereign Engineering Excellence: <span className="text-blue-700">{COMPANY_INFO.name}</span>
                </>
              )}
            </h1>
            <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
              {language === 'hi'
                ? 'पावर वेब स्टूडियो एआई (Power Web Studio AI) भानु राम बरीहा डिजिटल टेक्नोलॉजीज का प्रमुख टेक्नोलॉजी ब्रांड है। हम उच्च-पैमाने के एंटरप्राइज सॉफ्टवेयर, नेटिव एंड्रॉइड इकोसिस्टम और ऑटोनॉमस एआई इंजनों का निर्माण करते हैं।'
                : 'Power Web Studio AI is the flagship digital engineering and technology suite of Bhanu Ram Bariha Digital Technologies, building mathematical-grade software systems for high-growth enterprises worldwide.'}
            </p>
          </div>
        </div>
      </section>

      {/* Main Content Sections */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 space-y-20">
        {/* Campus & Headquarters Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          <div className="lg:col-span-6 space-y-4">
            <div className="relative rounded-xl overflow-hidden border border-slate-200 shadow-md">
              <img
                src={ASSETS.campusImage}
                alt="Bhanu Ram Bariha Digital Technologies Innovation Campus"
                loading="lazy"
                decoding="async"
                className="w-full h-80 sm:h-96 object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
                  {t('Innovation Hub & Delivery Center', 'इनोवेशन हब एवं डिलीवरी सेंटर')}
                </span>
                <p className="text-sm font-semibold mt-0.5">
                  {COMPANY_INFO.headquarters}
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-2">
              <div className="flex items-center justify-between font-mono">
                <span className="font-bold text-slate-900">{COMPANY_INFO.registration}</span>
                <span>Est. {COMPANY_INFO.founded}</span>
              </div>
              <div>{t('Governed under Ministry of Corporate Affairs, Government of India.', 'कॉर्पोरेट कार्य मंत्रालय, भारत सरकार के अंतर्गत पंजीकृत।')}</div>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              {t('Our Foundation & Mission', 'हमारी नींव और मिशन')}
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              {language === 'hi'
                ? 'गरियाबंद जिले (फिंगेश्वर बोरिद मोड़, राजिम उपखंड, छत्तीसगढ़ - 493992) से संचालित, भानु राम बरीहा डिजिटल टेक्नोलॉजीज ने भारतीय इंजीनियरिंग प्रतिभा को वैश्विक स्तर पर स्थापित करने का लक्ष्य रखा है। हम जटिल व्यापारिक समस्याओं को हल करने के लिए वितरित आर्किटेक्चर, मजबूत सुरक्षा अभ्यासों और ऑटोनॉमस एआई का उपयोग करते हैं।'
                : 'Operating from Fingeshwar Borid Mod, Rajim Subdistrict, Gariaband District, Chhattisgarh (493992), India, Bhanu Ram Bariha Digital Technologies was established with an uncompromising mandate: engineering resilient enterprise platforms that run reliably under demanding workloads.'}
            </p>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              {language === 'hi'
                ? 'हम शून्य-वेंडर लॉक-इन और 100% क्लाइंट कोड स्वामित्व में विश्वास करते हैं। हमारा हर आर्किटेक्चरल निर्णय पूर्ण डेटा संप्रभुता (Data Sovereignty) और शून्य-हानि सिद्धांतों पर आधारित होता है।'
                : 'We operate with zero proprietary vendor lock-in. Every client retains full intellectual property rights, verified by formal escrow and reproducible CI/CD pipelines from Sprint 1.'}
            </p>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-2xl font-extrabold text-blue-700 font-mono tabular-nums">18+</div>
                <div className="text-xs font-semibold text-slate-900 mt-0.5">Dedicated Engineering Pods</div>
                <div className="text-[11px] text-slate-500">Go, Kotlin, React, Python</div>
              </div>
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-2xl font-extrabold text-blue-700 font-mono tabular-nums">HA Target</div>
                <div className="text-xs font-semibold text-slate-900 mt-0.5">Availability Design Goal</div>
                <div className="text-[11px] text-slate-500">Custom SLA scoped per SOW</div>
              </div>
            </div>
          </div>
        </div>

        {/* Leadership Values */}
        <div className="border-t border-slate-200 pt-16">
          <div className="max-w-3xl mb-12">
            <div className="text-xs font-bold text-blue-700 tracking-wider uppercase mb-2">
              {t('CORE OPERATIONAL PILLARS', 'मूल परिचालन स्तंभ')}
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              {t('Built on 4 Uncompromised Engineering Values', '4 असम्बद्ध इंजीनियरिंग मूल्यों पर निर्मित')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: 'Data Sovereignty',
                titleHi: 'डेटा संप्रभुता',
                desc: 'Engineered with privacy-by-design practices aligned to Indian DPDP Act 2023 principles within your cloud perimeter (uncertified baseline).',
                descHi: 'भारतीय DPDP अधिनियम 2023 के सिद्धांतों के अनुरूप प्राइवेसी-बाय-डिज़ाइन अभ्यासों के साथ निर्मित (अप्रमाणित आधारभूत डिज़ाइन)।',
              },
              {
                title: 'Zero-Loss Guarantees',
                titleHi: 'शून्य-हानि गारंटी',
                desc: 'Every transactional pipeline is protected with distributed idempotency keys and active-active failover.',
                descHi: 'प्रत्येक लेनदेन पाइपलाइन आइडमपोटेंसी कुंजियों और एक्टिव-एक्टिव फेलओवर द्वारा संरक्षित है।',
              },
              {
                title: 'Deterministic AI',
                titleHi: 'सत्यापित एआई मॉडल',
                desc: 'We strictly ban ungrounded hallucinations in business software. All inferences include cryptographic source citations.',
                descHi: 'व्यावसायिक अनुप्रयोगों में अनियंत्रित भ्रांतियां प्रतिबंधित हैं। सभी परिणाम स्रोत संदर्भों के साथ आते हैं।',
              },
              {
                title: 'Full IP Handover',
                titleHi: 'पूर्ण आईपी स्वामित्व',
                desc: '100% source code, documentation, deployment scripts, and architectural blueprints belong completely to the client.',
                descHi: '100% स्रोत कोड, दस्तावेज़ और डिप्लॉयमेंट स्क्रिप्ट्स पूरी तरह से ग्राहक के स्वामित्व में होते हैं।',
              },
            ].map((pillar, idx) => (
              <div
                key={idx}
                className="p-6 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-xs transition-all"
              >
                <div className="text-xs font-mono font-bold text-blue-700 mb-2">
                  0{idx + 1}.
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">
                  {language === 'hi' ? pillar.titleHi : pillar.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {language === 'hi' ? pillar.descHi : pillar.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Banner */}
        <div className="p-8 sm:p-12 rounded-2xl bg-slate-950 text-white flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
              {t('Ready to Partner with Bhanu Ram Bariha Digital Technologies?', 'भानु राम बरीहा डिजिटल टेक्नोलॉजीज के साथ जुड़ने के लिए तैयार हैं?')}
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1.5 max-w-xl">
              {t(
                'Schedule a direct architecture discovery session with our Lead Engineering Squad.',
                'हमारे प्रमुख इंजीनियरिंग दल के साथ सीधे तकनीकी परामर्श सत्र का समय तय करें।'
              )}
            </p>
          </div>
          <button
            onClick={onOpenConsultation}
            className="px-6 py-3 text-xs font-bold text-white bg-blue-700 hover:bg-blue-600 rounded-md transition-colors cursor-pointer shrink-0 shadow-xs"
          >
            {t('Schedule Consultation', 'परामर्श बुक करें')}
          </button>
        </div>
      </div>
    </div>
  );
};
