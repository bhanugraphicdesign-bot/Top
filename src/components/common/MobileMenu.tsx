import React from 'react';
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
  const { currentUser, isAdmin, openAuthModal, logout } = useAuth();
  const siteContact = useSiteContact();

  if (!isOpen) return null;

  const handleRouteClick = (route: PageRoute) => {
    onClose();
    navigate(route);
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
    { route: 'client-dashboard', labelEn: 'Client Portal (SLA & Builds)', labelHi: 'क्लाइंट पोर्टल (SLA व APK)' },
    { route: 'admin-dashboard', labelEn: 'Admin Console (Portfolio)', labelHi: 'एडमिन कंसोल (पोर्टफोलियो)' },
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
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-slate-800 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="p-6 pb-10 flex-1 flex flex-col gap-1">
          {/* User Account State in Drawer */}
          <div className="mb-3 p-3 bg-slate-900 text-white rounded-lg">
            {currentUser ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center font-bold text-xs text-white">
                    {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : 'U'}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white truncate max-w-[150px]">
                      {currentUser.displayName || currentUser.email}
                    </div>
                    <div className="text-[10px] text-blue-300 font-mono flex items-center gap-1">
                      <span>{isAdmin ? 'System Admin' : 'Client Account'}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    logout();
                    onClose();
                  }}
                  className="p-1.5 text-slate-400 hover:text-rose-400 rounded transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="text-xs">
                  <div className="font-bold text-white">{t('Enterprise Access', 'एंटरप्राइज एक्सेस')}</div>
                  <div className="text-[11px] text-slate-400">{t('Sign in to view private builds', 'निजी बिल्ड देखने हेतु लॉगिन करें')}</div>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    openAuthModal('login');
                  }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded transition-colors cursor-pointer"
                >
                  {t('Sign In', 'लॉगिन')}
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

          <p className="text-xs font-bold text-slate-400 tracking-wider mb-2">
            {t('PLATFORM DIRECTORY', 'प्लेटफ़ॉर्म निर्देशिका')}
          </p>

          <div className="space-y-0.5">
            {pages.map((p) => (
              <button
                key={p.route}
                onClick={() => handleRouteClick(p.route)}
                className={`w-full text-left py-2.5 px-3 rounded-md text-sm font-semibold transition-colors cursor-pointer ${
                  currentRoute === p.route
                    ? 'bg-blue-50 text-blue-700 font-bold'
                    : 'text-slate-800 hover:bg-slate-50 hover:text-blue-700'
                }`}
              >
                {language === 'hi' ? p.labelHi : p.labelEn}
              </button>
            ))}
          </div>

          {/* Direct CTA */}
          <div className="mt-4">
            <button
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
