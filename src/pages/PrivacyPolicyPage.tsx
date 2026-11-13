import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { COMPANY_INFO } from '../data/content';
import { ShieldCheck, Lock, FileText, CheckCircle } from 'lucide-react';

export const PrivacyPolicyPage: React.FC = () => {
  const { language, t } = useLanguage();

  return (
    <div className="bg-white">
      {/* Header */}
      <section className="bg-slate-50 border-b border-slate-200 py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="text-xs font-bold text-blue-700 tracking-wider uppercase mb-2">
              {t('DATA PRIVACY & SOVEREIGNTY CHARTER', 'डेटा गोपनीयता एवं संप्रभुता चार्टर')}
            </div>
            <h1
              className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-950 tracking-tight leading-tight"
              style={{ textWrap: 'balance' }}
            >
              {language === 'hi' ? 'गोपनीयता नीति एवं डेटा संप्रभुता' : 'Enterprise Privacy Policy & Data Sovereignty'}
            </h1>
            <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
              {t(
                'Operational privacy and data-handling practices aligned with the Digital Personal Data Protection (DPDP) Act 2023 (India). No external ISO/IEC 27001 or SOC-2 certification is claimed.',
                'डिजिटल पर्सनल डेटा प्रोटेक्शन (DPDP) अधिनियम 2023 (भारत) के सिद्धांतों के अनुरूप डेटा गोपनीयता अभ्यास। कोई बाह्य ISO/IEC 27001 या SOC-2 प्रमाणन का दावा नहीं किया जाता।'
              )}
            </p>
            <div className="mt-4 text-xs text-slate-500 font-mono">
              {COMPANY_INFO.name} · CIN: {COMPANY_INFO.registration} · Effective Date: November 2026
            </div>
          </div>
        </div>
      </section>

      {/* Policy Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12 text-slate-700 leading-relaxed text-sm sm:text-base">
        <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
          <div>
            <strong className="block text-sm font-bold text-blue-950 mb-0.5">
              {t('Zero Third-Party Telemetry Guarantee', 'शून्य थर्ड-पार्टी टेलीमेट्री गारंटी')}
            </strong>
            {t(
              'Power Web Studio AI does not sell, broker, or monetize client corporate telemetry, source code repositories, or customer behavioral data.',
              'पावर वेब स्टूडियो एआई कभी भी क्लाइंट का कोड, टेलीमेट्री या व्यावसायिक डेटा तीसरे पक्ष को नहीं बेचती है।'
            )}
          </div>
        </div>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900">
            {t('1. Identity of the Data Fiduciary', '1. डेटा फिड्यूशियरी की पहचान')}
          </h2>
          <p>
            {language === 'hi'
              ? `यह गोपनीयता नीति भानु राम बरीहा डिजिटल टेक्नोलॉजीज (${COMPANY_INFO.registration}) द्वारा संचालित प्लेटफॉर्म 'पावर वेब स्टूडियो एआई' पर लागू होती है। हमारा पंजीकृत कार्यालय ${COMPANY_INFO.headquarters} में स्थित है।`
              : `This Privacy Policy governs the operations of Bhanu Ram Bariha Digital Technologies (${COMPANY_INFO.registration}), operating the Power Web Studio AI platform. Our registered delivery hub is situated in ${COMPANY_INFO.headquarters}.`}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900">
            {t('2. Indian DPDP Act 2023 Alignment', '2. भारतीय DPDP अधिनियम 2023 अनुपालन')}
          </h2>
          <p>
            {language === 'hi'
              ? 'हम भारतीय डिजिटल पर्सनल डेटा प्रोटेक्शन एक्ट 2023 के प्रावधानों का पूर्णतः पालन करते हैं। उपयोगकर्ताओं और उद्यम ग्राहकों को उनके व्यक्तिगत डेटा पर पूर्ण नियंत्रण, सहमति वापसी और डेटा हटाने का अधिकार प्राप्त है।'
              : 'In strict conformance with the Digital Personal Data Protection Act 2023 of India, we process personal and corporate data solely for legitimate, contracted purposes with explicit verifiable consent.'}
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm text-slate-600">
            <li>{t('Right to access and correct personal data records.', 'व्यक्तिगत डेटा तक पहुंच और सुधार का अधिकार।')}</li>
            <li>{t('Right to grievance redressal within 48 hours.', '48 घंटे के भीतर शिकायत निवारण का अधिकार।')}</li>
            <li>{t('Right to immediate erasure upon contract completion.', 'अनुबंध समाप्ति पर डेटा को तुरंत मिटाने का अधिकार।')}</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900">
            {t('3. Artificial Intelligence & Vector Processing Safety', '3. एआई और वेक्टर प्रोसेसिंग सुरक्षा')}
          </h2>
          <p>
            {language === 'hi'
              ? 'हमारे एंटरप्राइज RAG और AI समाधानों में उपयोग किया जाने वाला क्लाइंट डेटा कभी भी सार्वजनिक AI मॉडल को प्रशिक्षित करने के लिए उपयोग नहीं किया जाता है। सभी वेक्टर एम्बेडिंग निजी वर्चुअल प्राइवेट क्लाउड (VPC) में सुरक्षित रहते हैं।'
              : 'Client datasets ingested into our enterprise RAG engines or autonomous agent pipelines are strictly air-gapped. Client proprietary information is never utilized to train foundation public models.'}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900">
            {t('4. Security & Cryptographic Storage', '4. सुरक्षा और क्रिप्टोग्राफ़िक भंडारण')}
          </h2>
          <p>
            {language === 'hi'
              ? 'सभी संवेदनशील डेटा को AES-256 एन्क्रिप्शन के साथ संग्रहीत किया जाता है और नेटवर्क पर TLS 1.3 के माध्यम से प्रेषित किया जाता है। मोबाइल ऐप्स में SQLiteCipher का उपयोग किया जाता है।'
              : 'All data at rest is secured using AES-256 cipher suites. Data in transit is mandatorily encrypted via TLS 1.3 with automated certificate renewal.'}
          </p>
        </section>

        <section className="space-y-3 border-t border-slate-200 pt-6">
          <h2 className="text-xl font-bold text-slate-900">
            {t('5. Data Protection Officer (DPO) Contact', '5. डेटा संरक्षण अधिकारी (DPO) संपर्क')}
          </h2>
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 font-mono space-y-1">
            <div>Office of the Data Protection Officer</div>
            <div>Bhanu Ram Bariha Digital Technologies</div>
            <div>Email: {COMPANY_INFO.email}</div>
            <div>Mobile: {COMPANY_INFO.phone}</div>
            <div>Address: {COMPANY_INFO.headquarters}</div>
          </div>
        </section>
      </div>
    </div>
  );
};
