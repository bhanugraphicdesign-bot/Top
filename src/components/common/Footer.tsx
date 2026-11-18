import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useNavigation } from '../../context/NavigationContext';
import { useSiteContact } from '../../hooks/useSiteContact';
import { Phone, Mail, MapPin, Send, CheckCircle, ShieldCheck, Award, ArrowUp } from 'lucide-react';
import { PageRoute } from '../../types';
import { PWAInstallButton } from './PWAInstallButton';
import { extractBilingualApiError } from '../../utils/formProtection';
import { authenticatedFetch } from '../../firebase/services';

export const Footer: React.FC = () => {
  const { language, t, showToast } = useLanguage();
  const { navigate } = useNavigation();
  const siteContact = useSiteContact();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [subscribeError, setSubscribeError] = useState('');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypot.trim().length > 0) {
      const msg =
        language === 'hi'
          ? 'स्वचालित बॉट अनुरोध अवरुद्ध कर दिया गया है। कृपया पृष्ठ रीफ़्रेश करें और पुनः प्रयास करें।'
          : 'Automated submission blocked. Please refresh the page and try again.';
      setSubscribeError(msg);
      showToast(msg, 'alert');
      return;
    }
    const trimmed = newsletterEmail.trim();
    if (!trimmed) return;
    setSubscribeError('');
    setSubscribing(true);
    try {
      const res = await authenticatedFetch(
        '/api/newsletter/subscribe',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: trimmed, language, _hp: honeypot }),
        },
        { includeAppCheck: true, optionalAuth: true }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          extractBilingualApiError(
            res.status,
            data,
            language,
            `Subscription failed (HTTP ${res.status})`,
            `सदस्यता विफल रही (HTTP ${res.status})`
          )
        );
      }
      setSubscribed(true);
      showToast(
        language === 'hi'
          ? data?.messageHi || 'तकनीकी डिस्पैच में सदस्यता सफल।'
          : data?.messageEn || 'Subscribed to Technical Dispatch.',
        'success'
      );
    } catch (err: any) {
      const msg = err?.message || t('Subscription failed. Try again.', 'सदस्यता विफल रही। पुनः प्रयास करें।');
      setSubscribeError(msg);
      showToast(msg, 'alert');
    } finally {
      setSubscribing(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRouteClick = (e: React.MouseEvent, route: PageRoute) => {
    e.preventDefault();
    navigate(route);
  };

  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-12 pb-12 border-b border-slate-800">
          {/* Brand & Corporate Entity (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <button
              onClick={(e) => handleRouteClick(e, 'home')}
              className="text-xl sm:text-2xl font-extrabold tracking-tight text-white text-left cursor-pointer"
            >
              <span className="text-blue-500">POWER</span> WEB STUDIO{' '}
              <span className="text-blue-400">AI</span>
            </button>

            <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              {siteContact.name}
            </p>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm">
              {language === 'hi'
                ? 'भारत और वैश्विक उद्यमों के लिए उच्च-स्तरीय वितरित सॉफ्टवेयर, नेटिव एंड्रॉइड इकोसिस्टम और सॉवरेन आर्टिफिशियल इंटेलिजेंस इंजनों का निर्माण।'
                : 'Engineering high-concurrency enterprise architectures, native Android mobility ecosystems, and sovereign AI engines for global organizations.'}
            </p>

            <div className="text-xs text-slate-300 space-y-2 pt-2 break-words">
              {siteContact.companyRegistration && (
                <div className="font-mono text-slate-400">{siteContact.companyRegistration}</div>
              )}
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                <span>{siteContact.location}</span>
              </div>
              <div className="flex items-center gap-2 font-mono">
                <Phone className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <a
                  href={`tel:${siteContact.phone.replace(/\s+/g, '')}`}
                  className="hover:text-blue-400 transition-colors"
                >
                  {siteContact.phone}
                </a>
              </div>
              <div className="flex items-center gap-2 font-mono">
                <Mail className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <a
                  href={`mailto:${siteContact.email}`}
                  className="hover:text-blue-400 transition-colors break-all"
                >
                  {siteContact.email}
                </a>
              </div>
            </div>
          </div>

          {/* Quick Navigation: Public Pages (2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              {t('Solutions', 'समाधान')}
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button
                  onClick={(e) => handleRouteClick(e, 'services')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  {t('Our Services', 'हमारी सेवाएं')}
                </button>
              </li>
              <li>
                <button
                  onClick={(e) => handleRouteClick(e, 'android-portfolio')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  {t('Android Apps (7 Categories)', 'एंड्रॉइड पोर्टफोलियो')}
                </button>
              </li>
              <li>
                <button
                  onClick={(e) => handleRouteClick(e, 'ai-solutions')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  {t('Enterprise AI Suite', 'एआई सॉल्यूशंस')}
                </button>
              </li>
              <li>
                <button
                  onClick={(e) => handleRouteClick(e, 'process')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  {t('6-Phase Process', 'विकास प्रक्रिया')}
                </button>
              </li>
            </ul>
          </div>

          {/* Company & Legal (2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              {t('Enterprise', 'कंपनी व नीति')}
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button
                  onClick={(e) => handleRouteClick(e, 'about')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  {t('About Company', 'कंपनी परिचय')}
                </button>
              </li>
              <li>
                <button
                  onClick={(e) => handleRouteClick(e, 'blog')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  {t('Technical Blog & Insights', 'ब्लॉग एवं शोध')}
                </button>
              </li>
              <li>
                <button
                  onClick={(e) => handleRouteClick(e, 'contact')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  {t('Contact & Discovery', 'संपर्क करें')}
                </button>
              </li>
              <li>
                <button
                  onClick={(e) => handleRouteClick(e, 'privacy')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  {t('Privacy Policy (DPDP Act)', 'गोपनीयता नीति')}
                </button>
              </li>
              <li>
                <button
                  onClick={(e) => handleRouteClick(e, 'terms')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  {t('Terms & Conditions (MSA)', 'नियम और शर्तें')}
                </button>
              </li>
              <li className="pt-2 border-t border-slate-800/80">
                <button
                  onClick={(e) => handleRouteClick(e, 'client-dashboard')}
                  className="hover:text-blue-400 text-blue-300 font-semibold transition-colors cursor-pointer text-left flex items-center gap-1.5"
                >
                  <span>{t('Client Portal (SLA & APKs)', 'क्लाइंट पोर्टल (SLA व बिल्ड)')}</span>
                </button>
              </li>
              <li>
                <button
                  onClick={(e) => handleRouteClick(e, 'admin-dashboard')}
                  className="hover:text-blue-400 text-slate-400 transition-colors cursor-pointer text-left"
                >
                  <span>{t('Admin Console', 'एडमिन कंसोल')}</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Architectural Briefing & Newsletter (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              {t('Quarterly Architectural Dispatch', 'त्रैमासिक आर्किटेक्चर समाचार')}
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              {t(
                'Curated technical whitepapers on distributed consensus, Kotlin multiplatform, and LLM evaluations. Zero marketing spam.',
                'वितरित प्रणालियों, कोटलिन मल्टीप्लेटफ़ॉर्म और एआई मूल्यांकन पर तकनीकी शोध पत्र। शून्य स्पैम।'
              )}
            </p>

            {subscribed ? (
              <div className="p-3 rounded-md bg-slate-900 border border-emerald-500/40 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{t('Subscribed to Technical Dispatch.', 'तकनीकी डिस्पैच में सदस्यता सफल।')}</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-2 relative">
                <div
                  aria-hidden="true"
                  className="pointer-events-none fixed -left-[9999px] top-auto h-px w-px overflow-hidden opacity-0"
                >
                  <label htmlFor="newsletter-hp-code">Leave this field blank</label>
                  <input
                    id="newsletter-hp-code"
                    name="newsletter_hp_code"
                    type="text"
                    tabIndex={-1}
                    autoComplete="new-password"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <input
                    type="email"
                    required
                    disabled={subscribing}
                    aria-label={t('Work email address', 'कार्य ईमेल पता')}
                    value={newsletterEmail}
                    onChange={(e) => {
                      setNewsletterEmail(e.target.value);
                      if (subscribeError) setSubscribeError('');
                    }}
                    placeholder="architect@enterprise.com"
                    className="flex-1 min-w-0 px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-md text-white placeholder-slate-400 focus:outline-hidden focus:border-blue-500 disabled:opacity-60"
                  />
                  <button
                    type="submit"
                    disabled={subscribing}
                    aria-label={t('Subscribe to dispatch', 'सदस्यता लें')}
                    className="min-w-[40px] min-h-[38px] flex items-center justify-center px-3.5 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-600 disabled:opacity-60 rounded-md transition-colors cursor-pointer shrink-0 focus-visible:outline-2 focus-visible:outline-blue-400"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
                {subscribeError && (
                  <div role="alert" className="text-[11px] text-rose-400">
                    {subscribeError}
                  </div>
                )}
                <div className="text-[11px] text-slate-400">
                  {t('Strictly confidential. Unsubscribe at any time.', 'सख्ती से गोपनीय। किसी भी समय रद्द करें।')}
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Bottom Bar: Copyright & Compliance Signatures */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            © {new Date().getFullYear()} {siteContact.name}. {t('All Rights Reserved.', 'सर्वाधिकार सुरक्षित।')}
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <span className="flex items-center gap-1.5 text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span>{t('Security-First Design Practices', 'सुरक्षा-प्रथम इंजीनियरिंग अभ्यास')}</span>
            </span>
            <span aria-hidden="true" className="text-slate-700">·</span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <Award className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span>{t('DPDP Aligned Architecture (Uncertified)', 'DPDP अनुरूप डिज़ाइन (अप्रमाणित)')}</span>
            </span>
            <PWAInstallButton />
            <span aria-hidden="true" className="text-slate-700">·</span>
            <button
              onClick={scrollToTop}
              className="inline-flex items-center gap-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Back to top"
            >
              <span>{t('Back to Top', 'शीर्ष पर जाएं')}</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
