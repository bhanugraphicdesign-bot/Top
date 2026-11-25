import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useNavigation } from '../../context/NavigationContext';
import { useAuth } from '../../context/AuthContext';
import { Menu, X, ArrowRight, User, LogOut } from 'lucide-react';
import { PageRoute } from '../../types';
import { NotificationDropdown } from './NotificationDropdown';

interface HeaderProps {
  onOpenConsultation: () => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenConsultation,
  mobileMenuOpen,
  setMobileMenuOpen,
}) => {
  const { language, setLanguage, t } = useLanguage();
  const { currentRoute, navigate } = useNavigation();
  const { currentUser, isAdmin, openAuthModal, openProfileModal, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    setAvatarError(false);
  }, [currentUser?.photoURL]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (e: React.MouseEvent, route: PageRoute) => {
    e.preventDefault();
    navigate(route);
  };

  const handleDemoSectionClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (currentRoute !== 'home') {
      navigate('home');
      window.setTimeout(() => {
        document.getElementById('demo-websites')?.scrollIntoView({ behavior: 'smooth' });
      }, 120);
    } else {
      document.getElementById('demo-websites')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const navItems: { route: PageRoute; labelEn: string; labelHi: string }[] = [
    { route: 'services', labelEn: 'Services', labelHi: 'सेवाएं' },
    { route: 'android-portfolio', labelEn: 'Android Apps', labelHi: 'एंड्रॉइड ऐप्स' },
    { route: 'ai-solutions', labelEn: 'AI Solutions', labelHi: 'एआई सॉल्यूशंस' },
    { route: 'about', labelEn: 'Company', labelHi: 'कंपनी' },
    { route: 'process', labelEn: 'Process', labelHi: 'प्रक्रिया' },
    { route: 'blog', labelEn: 'Blog', labelHi: 'ब्लॉग' },
  ];

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-300 ${
        scrolled ? 'pws-header-glass' : 'pws-header-top'
      }`}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-2 sm:gap-4 lg:gap-8 h-16 sm:h-20">
          {/* Zone 1: Brand Wordmark (compact 2-line on narrow mobile, single line from sm up) */}
          <button
            onClick={(e) => handleNavClick(e, 'home')}
            type="button"
            className="text-xs leading-[1.15] sm:text-xl lg:text-2xl sm:leading-none font-extrabold tracking-tight text-slate-950 sm:whitespace-nowrap shrink-0 text-left cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-600 rounded-sm py-1"
          >
            <span className="block sm:inline">
              <span className="text-blue-700">POWER</span> WEB{' '}
            </span>
            <span className="block sm:inline">
              STUDIO <span className="text-blue-600">AI</span>
            </span>
          </button>

          {/* Zone 2: Navigation Links (Desktop >= lg) */}
          <nav className="hidden lg:flex items-center gap-4 xl:gap-5 text-sm font-semibold text-slate-800">
            {navItems.map((item) => (
              <a
                key={item.route}
                href={`/${item.route}`}
                aria-current={currentRoute === item.route ? 'page' : undefined}
                onClick={(e) => handleNavClick(e, item.route)}
                className={`transition-colors whitespace-nowrap shrink-0 py-1 rounded-sm focus-visible:outline-2 focus-visible:outline-blue-600 ${
                  currentRoute === item.route
                    ? 'text-blue-700 font-bold'
                    : 'hover:text-blue-700'
                }`}
              >
                {language === 'hi' ? item.labelHi : item.labelEn}
              </a>
            ))}
            <a
              href="/#demo-websites"
              onClick={handleDemoSectionClick}
              className="transition-colors whitespace-nowrap shrink-0 py-1 rounded-sm hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-blue-600"
            >
              {t('Demo Websites', 'डेमो वेबसाइट्स')}
            </a>
            <a
              href="/pay"
              aria-current={currentRoute === 'pay' ? 'page' : undefined}
              onClick={(e) => handleNavClick(e, 'pay')}
              className={`transition-colors whitespace-nowrap shrink-0 py-1 rounded-sm focus-visible:outline-2 focus-visible:outline-blue-600 ${
                currentRoute === 'pay'
                  ? 'text-blue-700 font-bold'
                  : 'text-emerald-700 hover:text-emerald-800 font-bold'
              }`}
            >
              {t('Pay Now', 'भुगतान करें')}
            </a>
          </nav>

          {/* Zone 3: Language Switcher + Notifications + Client Portal + Auth + Primary CTA + Mobile Trigger */}
          <div className="flex items-center gap-1 min-[390px]:gap-1.5 sm:gap-2.5 shrink-0">
            {/* Segmented Bilingual Switcher */}
            <div
              role="radiogroup"
              aria-label="Language Selector"
              className="flex items-center border border-slate-200 rounded-md p-0.5 bg-slate-50 text-[11px] sm:text-xs font-bold shadow-2xs shrink-0"
            >
              <button
                type="button"
                role="radio"
                aria-checked={language === 'hi'}
                onClick={() => setLanguage('hi')}
                className={`min-h-[38px] sm:min-h-0 px-1.5 sm:px-2.5 py-1 rounded transition-all cursor-pointer whitespace-nowrap focus-visible:outline-2 focus-visible:outline-blue-600 ${
                  language === 'hi'
                    ? 'bg-blue-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-blue-700'
                }`}
                title="हिन्दी (Hindi)"
              >
                हिन्दी
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={language === 'en'}
                onClick={() => setLanguage('en')}
                className={`min-h-[38px] sm:min-h-0 px-1.5 sm:px-2.5 py-1 rounded transition-all cursor-pointer whitespace-nowrap focus-visible:outline-2 focus-visible:outline-blue-600 ${
                  language === 'en'
                    ? 'bg-blue-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-blue-700'
                }`}
                title="English"
              >
                EN
              </button>
            </div>

            {/* In-App Enterprise Notifications Dropdown */}
            <NotificationDropdown />

            {/* Client Portal Link (tablet/desktop; also in MobileMenu on small screens) */}
            <button
              onClick={(e) => handleNavClick(e, 'client-dashboard')}
              type="button"
              aria-current={currentRoute === 'client-dashboard' ? 'page' : undefined}
              className={`pws-btn-glass hidden md:inline-flex items-center px-3 py-1.5 text-xs font-bold rounded-md cursor-pointer whitespace-nowrap focus-visible:outline-2 focus-visible:outline-blue-600 ${
                currentRoute === 'client-dashboard'
                  ? 'text-blue-700 border-blue-300'
                  : 'text-slate-700'
              }`}
            >
              <span>{t('Client Portal', 'क्लाइंट पोर्टल')}</span>
            </button>

            {/* Authentication Account Card / Guest Login */}
            {currentUser ? (
              <div className="flex items-center gap-1 sm:gap-1.5 bg-slate-100/80 border border-slate-200 rounded-md p-0.5 sm:px-1.5 sm:py-1 text-xs min-h-[38px] sm:min-h-0">
                <button
                  type="button"
                  onClick={openProfileModal}
                  aria-label={t('View account profile details', 'अकाउंट प्रोफ़ाइल विवरण देखें')}
                  title={
                    currentUser.displayName && currentUser.email
                      ? `${currentUser.displayName} (${currentUser.email})`
                      : currentUser.email || currentUser.displayName || ''
                  }
                  className="flex items-center gap-1.5 px-1.5 py-0.5 rounded hover:bg-white/90 text-left transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-600"
                >
                  {currentUser.photoURL && !avatarError ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || currentUser.email || 'Account'}
                      referrerPolicy="no-referrer"
                      onError={() => setAvatarError(true)}
                      className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover border border-slate-300 shrink-0"
                    />
                  ) : (
                    <User className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                  )}
                  <div className="hidden min-[380px]:flex flex-col leading-tight min-w-0">
                    <span className="font-semibold text-slate-900 max-w-[68px] sm:max-w-[130px] truncate text-[11px] sm:text-xs">
                      {currentUser.displayName || currentUser.email}
                    </span>
                    {currentUser.email && (
                      <span className="hidden md:block text-[10px] font-normal text-slate-500 max-w-[130px] truncate">
                        {currentUser.email}
                      </span>
                    )}
                  </div>
                  {isAdmin && (
                    <span className="hidden sm:inline text-[10px] font-black uppercase tracking-wider bg-blue-700 text-white px-1.5 py-0.2 rounded shrink-0">
                      Admin
                    </span>
                  )}
                </button>
                <button
                  onClick={logout}
                  type="button"
                  aria-label={t('Logout', 'लॉग आउट')}
                  title={t('Logout', 'लॉग आउट')}
                  className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-600 shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => openAuthModal('login')}
                type="button"
                className="pws-btn-glass inline-flex items-center justify-center gap-1 min-h-[38px] sm:min-h-0 px-2 sm:px-3 py-1.5 text-[11px] sm:text-xs font-bold text-slate-700 rounded-md cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-blue-600"
              >
                <User className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                <span className="hidden sm:inline text-slate-500 font-medium">{t('Guest ·', 'गेस्ट ·')}</span>
                <span>{t('Login', 'लॉगिन')}</span>
              </button>
            )}

            {/* Primary Action Button (visible sm+, inside MobileMenu below sm) */}
            <button
              onClick={onOpenConsultation}
              type="button"
              className="pws-btn-3d hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white rounded-md cursor-pointer whitespace-nowrap focus-visible:outline-2 focus-visible:outline-blue-600"
            >
              <span>{t('Book Free Consultation', 'मुफ़्त परामर्श बुक करें')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {/* Mobile Menu Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              type="button"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation-drawer"
              className="lg:hidden min-w-[40px] min-h-[44px] flex items-center justify-center p-1.5 text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer shrink-0 focus-visible:outline-2 focus-visible:outline-blue-600"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
