import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { COMPANY_INFO } from '../data/content';
import { FileText, CheckCircle, Shield, Award } from 'lucide-react';

export const TermsPage: React.FC = () => {
  const { language, t } = useLanguage();

  return (
    <div className="bg-white">
      {/* Header */}
      <section className="bg-slate-50 border-b border-slate-200 py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="text-xs font-bold text-blue-700 tracking-wider uppercase mb-2">
              {t('MASTER SERVICES AGREEMENT & TERMS', 'मास्टर सेवा अनुबंध एवं शर्तें')}
            </div>
            <h1
              className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-950 tracking-tight leading-tight"
              style={{ textWrap: 'balance' }}
            >
              {language === 'hi' ? 'नियम और सेवा शर्तें' : 'Enterprise Terms & Conditions of Service'}
            </h1>
            <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
              {t(
                'Formal legal operating charter governing software engineering deliverables, intellectual property ownership, and high-availability service level agreements.',
                'सॉफ्टवेयर इंजीनियरिंग परिणामों, बौद्धिक संपदा अधिकारों और एसएलए समझौतों को नियंत्रित करने वाले औपचारिक नियम।'
              )}
            </p>
            <div className="mt-4 text-xs text-slate-500 font-mono">
              {COMPANY_INFO.name} · CIN: {COMPANY_INFO.registration} · Updated: November 2026
            </div>
          </div>
        </div>
      </section>

      {/* Terms Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12 text-slate-700 leading-relaxed text-sm sm:text-base">
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900">
            {t('1. Binding Agreement', '1. बाध्यकारी समझौता')}
          </h2>
          <p>
            {language === 'hi'
              ? `ये नियम और शर्तें भानु राम बरीहा डिजिटल टेक्नोलॉजीज द्वारा प्रदान की जाने वाली कस्टम सॉफ्टवेयर इंजीनियरिंग, मोबाइल ऐप विकास और एआई समाधानों के लिए मास्टर सर्विस एग्रीमेंट का निर्माण करती हैं।`
              : `These Terms and Conditions constitute a legally binding Master Services Agreement (MSA) between Bhanu Ram Bariha Digital Technologies and the contracting enterprise client for custom software engineering and AI deployment services.`}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900">
            {t('2. Complete Intellectual Property Ownership', '2. बौद्धिक संपदा का 100% स्वामित्व')}
          </h2>
          <p>
            {language === 'hi'
              ? 'अनुबंध के तहत तैयार किए गए सभी कस्टम स्रोत कोड, डेटाबेस स्कीमा, एंड्रॉइड ऐप आर्किटेक्चर और दस्तावेज़ीकरण का 100% स्वामित्व क्लाइंट का होता है। हम कोई भी मालिकाना वेंडर लॉक-इन लागू नहीं करते हैं।'
              : 'Unless explicitly agreed otherwise in a Statement of Work, 100% of custom source code, documentation, CI/CD pipelines, and application logic engineered for the client become the sole intellectual property of the client upon invoice settlement.'}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900">
            {t('3. Service Level Agreement (SLA) & Uptime', '3. सेवा स्तर समझौता (SLA) एवं अपटाइम')}
          </h2>
          <p>
            {language === 'hi'
              ? 'प्रबंधित क्लाउड और बैकएंड सेवाओं के लिए हम 99.98% अपटाइम अनुबंध प्रदान करते हैं। किसी भी अप्रत्याशित बाधा की स्थिति में हमारी साइट विश्वसनीयता टीम 15 मिनट के भीतर प्राथमिकता प्रतिक्रिया सुनिश्चित करती है।'
              : 'For managed cloud infrastructure and production APIs, Bhanu Ram Bariha Digital Technologies commits to a contractually backed 99.98% High Availability Uptime SLA with a 15-minute P1 critical incident response window.'}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900">
            {t('4. Confidentiality & Non-Disclosure', '4. गोपनीयता और गैर-प्रकटीकरण')}
          </h2>
          <p>
            {language === 'hi'
              ? 'दोनों पक्ष एक-दूसरे की गोपनीय व्यावसायिक जानकारी, व्यापार रहस्यों और तकनीकी आर्किटेक्चर की रक्षा करने के लिए बाध्य हैं। यह दायित्व अनुबंध समाप्ति के बाद भी 5 वर्षों तक जारी रहता है।'
              : 'Both parties agree to hold all proprietary trade secrets, architecture diagrams, and financial information in strict confidentiality, surviving agreement termination for a period of five (5) years.'}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900">
            {t('5. Governing Law & Dispute Resolution', '5. लागू कानून एवं क्षेत्राधिकार')}
          </h2>
          <p>
            {language === 'hi'
              ? 'यह समझौता भारत के कानूनों के अनुसार शासित और व्याख्यायित किया जाएगा। किसी भी विवाद का निपटारा ओडिशा, भारत के सक्षम न्यायालयों के अनन्य क्षेत्राधिकार में किया जाएगा।'
              : 'This Agreement shall be governed by and construed in accordance with the laws of the Republic of India. Any legal dispute shall be subject to the exclusive jurisdiction of the competent courts in the State of Odisha, India.'}
          </p>
        </section>
      </div>
    </div>
  );
};
