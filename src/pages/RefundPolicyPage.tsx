import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useSiteContact } from '../hooks/useSiteContact';

export const RefundPolicyPage: React.FC = () => {
  const { language, t } = useLanguage();
  const siteContact = useSiteContact();

  return (
    <div className="bg-white">
      {/* Header */}
      <section className="pws-hero-surface border-b border-slate-200 py-16 sm:py-20">
        <div className="pws-hero-grid" aria-hidden="true" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="pws-reveal max-w-3xl">
            <div className="text-xs font-bold text-blue-700 tracking-wider uppercase mb-2">
              {t('REFUND & CANCELLATION POLICY', 'रिफंड एवं रद्दीकरण नीति')}
            </div>
            <h1
              className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-950 tracking-tight leading-tight"
              style={{ textWrap: 'balance' }}
            >
              {language === 'hi' ? 'रिफंड एवं रद्दीकरण नीति' : 'Refund & Cancellation Policy'}
            </h1>
            <div className="mt-4 text-xs text-slate-500 font-mono">
              {[
                siteContact.name,
                siteContact.companyRegistration,
                t('Updated: November 2026', 'अपडेट: नवंबर 2026'),
              ]
                .filter(Boolean)
                .join(' · ')}
            </div>
          </div>
        </div>
      </section>

      {/* Refund & Cancellation Policy Content */}
      <div className="pws-reveal max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8 text-slate-700 leading-relaxed text-sm sm:text-base">
        <section className="space-y-4">
          <ul className="list-disc pl-5 space-y-3">
            <li>
              {language === 'hi'
                ? 'काम शुरू करने के लिए 50% एडवांस लिया जाता है।'
                : 'A 50% advance payment is collected to start work.'}
            </li>
            <li>
              {language === 'hi'
                ? 'काम शुरू होने से पहले रद्द करने पर पूरा एडवांस वापस।'
                : 'Full advance is refunded if cancelled before work begins.'}
            </li>
            <li>
              {language === 'hi'
                ? 'काम के दौरान रद्द करने पर हो चुके काम की लागत काटकर बाकी राशि वापस।'
                : 'If cancelled during development, the remaining balance is refunded after deducting the cost of completed work.'}
            </li>
            <li>
              {language === 'hi'
                ? 'डिलीवरी और ग्राहक की स्वीकृति के बाद रिफंड नहीं।'
                : 'No refunds are issued after final delivery and client approval.'}
            </li>
            <li>
              {language === 'hi'
                ? 'डोमेन, होस्टिंग, Play Store फ़ीस जैसे तीसरे पक्ष के खर्च वापस नहीं होते।'
                : 'Third-party expenses such as domain, hosting, and Play Store fees are non-refundable.'}
            </li>
            <li>
              {language === 'hi' ? (
                <>
                  स्वीकृत रिफंड 7 कार्य दिवस में उसी UPI/खाते में। अनुरोध:{' '}
                  <a
                    href="mailto:powerusertopuser@gmail.com"
                    className="text-blue-700 hover:underline font-medium"
                  >
                    powerusertopuser@gmail.com
                  </a>{' '}
                  या{' '}
                  <a
                    href="tel:+918305457717"
                    className="text-blue-700 hover:underline font-medium"
                  >
                    +91 8305457717
                  </a>
                  , UTR नंबर के साथ।
                </>
              ) : (
                <>
                  Approved refunds are credited within 7 working days to the same UPI/bank account.
                  Request via{' '}
                  <a
                    href="mailto:powerusertopuser@gmail.com"
                    className="text-blue-700 hover:underline font-medium"
                  >
                    powerusertopuser@gmail.com
                  </a>{' '}
                  or{' '}
                  <a
                    href="tel:+918305457717"
                    className="text-blue-700 hover:underline font-medium"
                  >
                    +91 8305457717
                  </a>{' '}
                  with your UTR number.
                </>
              )}
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
};
