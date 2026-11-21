import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useNavigation } from '../../context/NavigationContext';
import { useAuth } from '../../context/AuthContext';
import { useSiteContact } from '../../hooks/useSiteContact';
import { ArrowRight, Phone, Mail, MapPin, X, Languages, LogOut } from 'lucide-react';
import { PageRoute } from '../../types';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenConsultation: () => void;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({
  isOpen,
  onClose,
  onOpenConsultation,
}) => {
  const { language, setLanguage, t } = useLanguage();
  const { currentRoute, navigate } = useNavigation();
  const { currentUser, isAdmin, openAuthModal, openProfileModal, logout } = useAuth();
  const siteContact = useSiteContact();
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    setAvatarError(false);
  }, [currentUser?.photoURL]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleRouteClick = (route: PageRoute) => {
    onClose();
    navigate(route);
  };

  const handleDemoSectionClick = () => {
    onClose();
    if (currentRoute !== 'home') {
      navigate('home');
      window.setTimeout(() => {
        document.getElementById('demo-websites')?.scrollIntoView({ behavior: 'smooth' });
      }, 120);
    } else {
      document.getElementById('demo-websites')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCtaClick = () => {
    onClose();
    onOpenConsultation();
  };

  const pages: { route: PageRoute; labelEn: string; labelHi: string }[] = [
    { route: 'home', labelEn: 'Homepage', labelHi: 'होमपेज' },
    { route: 'about', labelEn: 'About Company', labelHi: 'कंपनी परिचय' },
    { route: 'services', labelEn: 'Our Services', labelHi: 'हमारी सेवाएं' },
    { route: 'ai-solutions', labelEn: 'AI Solutions Suite', labelHi: 'एआई सॉल्यूशंस' },
    { route: 'android-portfolio', labelEn: 'Android Apps Portfolio', labelHi: 'एंड्रॉइड ऐप्स पोर्टफोलियो' },
    { route: 'process', labelEn: 'Development Process', labelHi: 'विकास प्रक्रिया' },
    { route: 'contact', labelEn: 'Contact & Estimation', labelHi: 'संपर्क एवं पूछताछ' },
    { route: 'blog', labelEn: 'Technical Blog & Research', labelHi: 'ब्लॉग एवं शोध' },
    { route: 'privacy', labelEn: 'Privacy Policy (DPDP Act)', labelHi: 'गोपनीयता नीति' },
    { route: 'terms', labelEn: 'Terms & Conditions (MSA)', labelHi: 'नियम और शर्तें' },
    { route: 'client-dashboard', labelEn: 'Client Portal (SLA & Builds)', labelHi: 'क्लाइंट पोर्टल (SLA व बिल्ड)' },
    ...(currentUser && isAdmin
      ? [{ route: 'admin-dashboard' as PageRoute, labelEn: 'Admin Console (Portfolio)', labelHi: 'एडमिन कंसोल (पोर्टफोलियो)' }]
      : []),
  ];

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-out Drawer */}
      <div
        id="mobile-navigation-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Mobile Navigation Menu"
        className="fixed inset-y-0 right-0 max-w-sm w-full bg-white shadow-xl flex flex-col z-10 overflow-y-auto"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <span className="text-lg font-bold text-slate-950">
            <span className="text-blue-700">POWER</span> WEB STUDIO <span className="text-blue-600">AI</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[40px] min-h-[40px] flex items-center justify-center p-2 text-slate-600 hover:text-slate-900 rounded-md hover:bg-slate-100 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-600"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="p-6 pb-10 flex-1 flex flex-col gap-1">
          {/* User Account Card in Drawer */}
          <div className="mb-3 p-3 bg-slate-900 text-white rounded-lg">
            {currentUser ? (
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    openProfileModal();
                  }}
                  aria-label={t('Open profile details', 'प्रोफ़ाइल विवरण खोलें')}
                  className="flex-1 min-w-0 flex items-center gap-2.5 text-left rounded-md p-1 hover:bg-slate-800/80 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-400"
                >
                  {currentUser.photoURL && !avatarError ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || currentUser.email || 'Account'}
                      referrerPolicy="no-referrer"
                      onError={() => setAvatarError(true)}
                      className="w-9 h-9 rounded-full object-cover border border-slate-700 shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-blue-700 flex items-center justify-center font-bold text-xs text-white shrink-0">
                      {(currentUser.displayName || currentUser.email || '?').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-white truncate">
                      {currentUser.displayName || currentUser.email}
                    </div>
                    {currentUser.email && (
                      <div className="text-[11px] text-slate-300 truncate">
                        {currentUser.email}
                      </div>
                    )}
                    <div className="text-[10px] text-blue-300 font-mono flex items-center gap-1.5 mt-0.5">
                      <span>{isAdmin ? 'System Admin' : 'Client Account'}</span>
                      <span aria-hidden="true">·</span>
                      <span className="underline">{t('Profile', 'प्रोफ़ाइल')}</span>
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    onClose();
                  }}
                  className="px-2.5 py-2 text-xs font-bold text-rose-300 hover:text-white hover:bg-rose-600/80 rounded-md transition-colors cursor-pointer shrink-0 flex items-center gap-1"
                  aria-label={t('Logout', 'लॉग आउट')}
                  title={t('Logout', 'लॉग आउट')}
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-[11px]">{t('Logout', 'लॉग आउट')}</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs">
                  <div className="font-bold text-white">{t('Guest', 'गेस्ट')}</div>
                  <div className="text-[11px] text-slate-400">
                    {t('Sign in with Google or Email', 'Google या ईमेल से लॉगिन करें')}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    openAuthModal('login');
                  }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded transition-colors cursor-pointer shrink-0"
                >
                  {t('Login', 'लॉगिन')}
                </button>
              </div>
            )}
          </div>

          {/* Language Switcher in Mobile Drawer */}
          <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Languages className="w-3.5 h-3.5 text-blue-700" />
                <span>{t('Language / भाषा', 'भाषा चयन')}</span>
              </span>
              <span className="text-[11px] font-mono text-slate-500 uppercase">
                {language === 'hi' ? 'हिन्दी सक्रिय' : 'English Active'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLanguage('hi')}
                className={`py-2 px-3 text-xs font-bold rounded-md border text-center transition-all cursor-pointer ${
                  language === 'hi'
                    ? 'bg-blue-700 text-white border-blue-700 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                हिन्दी (Hindi)
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`py-2 px-3 text-xs font-bold rounded-md border text-center transition-all cursor-pointer ${
                  language === 'en'
                    ? 'bg-blue-700 text-white border-blue-700 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                English
              </button>
            </div>
          </div>

          <p className="text-xs font-bold text-slate-600 tracking-wider mb-2">
            {t('PLATFORM DIRECTORY', 'प्लेटफ़ॉर्म निर्देशिका')}
          </p>

          <div className="space-y-0.5">
            {pages.map((p) => (
              <button
                type="button"
                key={p.route}
                aria-current={currentRoute === p.route ? 'page' : undefined}
                onClick={() => handleRouteClick(p.route)}
                className={`w-full text-left py-2.5 px-3 rounded-md text-sm font-semibold transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-600 ${
                  currentRoute === p.route
                    ? 'bg-blue-50 text-blue-700 font-bold'
                    : 'text-slate-800 hover:bg-slate-50 hover:text-blue-700'
                }`}
              >
                {language === 'hi' ? p.labelHi : p.labelEn}
              </button>
            ))}
            <button
              type="button"
              onClick={handleDemoSectionClick}
              className="w-full text-left py-2.5 px-3 rounded-md text-sm font-semibold transition-colors cursor-pointer text-slate-800 hover:bg-slate-50 hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-blue-600"
            >
              {t('Demo Websites', 'डेमो वेबसाइट्स')}
            </button>
          </div>

          {/* Direct Pay & Consultation CTAs */}
          <div className="mt-4 space-y-2.5">
            <button
              type="button"
              aria-current={currentRoute === 'pay' ? 'page' : undefined}
              onClick={() => handleRouteClick('pay')}
              className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold rounded-md border transition-all cursor-pointer ${
                currentRoute === 'pay'
                  ? 'bg-emerald-700 text-white border-emerald-700'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
              }`}
            >
              <span>{t('Pay Now (UPI)', 'भुगतान करें')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleCtaClick}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-md transition-all shadow-xs cursor-pointer"
            >
              <span>{t('Schedule Consultation', 'परामर्श बुक करें')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Contact Info */}
          <div className="mt-6 pt-5 pb-4 border-t border-slate-100 text-xs text-slate-700 space-y-2.5">
            <p className="font-bold text-slate-900">{siteContact.name}</p>
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-blue-700 shrink-0" />
              <a
                href={`tel:${siteContact.phone.replace(/\s+/g, '')}`}
                className="font-mono hover:text-blue-700 transition-colors"
              >
                {siteContact.phone}
              </a>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-blue-700 shrink-0" />
              <a
                href={`mailto:${siteContact.email}`}
                className="font-mono text-blue-700 hover:underline break-all"
              >
                {siteContact.email}
              </a>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="w-3.5 h-3.5 text-blue-700 shrink-0 mt-0.5" />
              <span>{siteContact.location}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
