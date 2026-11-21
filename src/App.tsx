import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { NavigationProvider, useNavigation } from './context/NavigationContext';
import { AppsProvider } from './context/AppsContext';
import { Header } from './components/common/Header';
import { MobileMenu } from './components/common/MobileMenu';
import { Footer } from './components/common/Footer';
import { HeroSection } from './components/home/HeroSection';
import { BrandShowcaseSection } from './components/home/BrandShowcaseSection';
import { DemoWebsitesSection } from './components/home/DemoWebsitesSection';
import { CompanyIntroSection } from './components/home/CompanyIntroSection';
import { ServicesSection } from './components/home/ServicesSection';
import { AndroidPortfolioSection } from './components/home/AndroidPortfolioSection';
import { AiSolutionsSection } from './components/home/AiSolutionsSection';
import { WhyChooseUsSection } from './components/home/WhyChooseUsSection';
import { ProcessSection } from './components/home/ProcessSection';
import { ContactCtaSection } from './components/home/ContactCtaSection';
import { ConsultationModal } from './components/modals/ConsultationModal';
import { ServiceDetailModal } from './components/modals/ServiceDetailModal';
import { AppDetailModal } from './components/modals/AppDetailModal';
import { ToastContainer } from './components/common/ToastContainer';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { AuthModal } from './components/auth/AuthModal';
import { ProfileModal } from './components/auth/ProfileModal';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { PageLoadingFallback } from './components/common/PageLoadingFallback';
import { NetworkStatusAlert } from './components/common/NetworkStatusAlert';
import { RouteSEO } from './components/common/SEO';
import { trackPageView, trackCtaClick } from './firebase/analytics';
import { ServiceItem, AndroidApp } from './types';

// Code-split secondary pages and protected portals to minimize initial JS payload
const AboutPage = lazy(() => import('./pages/AboutPage').then((m) => ({ default: m.AboutPage })));
const ServicesPage = lazy(() => import('./pages/ServicesPage').then((m) => ({ default: m.ServicesPage })));
const AiSolutionsPage = lazy(() => import('./pages/AiSolutionsPage').then((m) => ({ default: m.AiSolutionsPage })));
const AndroidPortfolioPage = lazy(() => import('./pages/AndroidPortfolioPage').then((m) => ({ default: m.AndroidPortfolioPage })));
const AppDetailPage = lazy(() => import('./pages/AppDetailPage').then((m) => ({ default: m.AppDetailPage })));
const ProcessPage = lazy(() => import('./pages/ProcessPage').then((m) => ({ default: m.ProcessPage })));
const ContactPage = lazy(() => import('./pages/ContactPage').then((m) => ({ default: m.ContactPage })));
const PayPage = lazy(() => import('./pages/PayPage').then((m) => ({ default: m.PayPage })));
const BlogPage = lazy(() => import('./pages/BlogPage').then((m) => ({ default: m.BlogPage })));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage').then((m) => ({ default: m.PrivacyPolicyPage })));
const TermsPage = lazy(() => import('./pages/TermsPage').then((m) => ({ default: m.TermsPage })));
const ClientDashboardPage = lazy(() => import('./pages/ClientDashboardPage').then((m) => ({ default: m.ClientDashboardPage })));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage })));
const ShoppingDemo = lazy(() => import('./demos/ShoppingDemo').then((m) => ({ default: m.ShoppingDemo })));
const CoreEngineeringDemo = lazy(() =>
  import('./demos/CoreEngineeringDemo').then((m) => ({ default: m.CoreEngineeringDemo }))
);
const WebEcosystemDemo = lazy(() =>
  import('./demos/WebEcosystemDemo').then((m) => ({ default: m.WebEcosystemDemo }))
);
const MobileSystemDemo = lazy(() =>
  import('./demos/MobileSystemDemo').then((m) => ({ default: m.MobileSystemDemo }))
);
const ArtificialIntelligenceDemo = lazy(() =>
  import('./demos/ArtificialIntelligenceDemo').then((m) => ({
    default: m.ArtificialIntelligenceDemo,
  }))
);
const CloudEngineeringDemo = lazy(() =>
  import('./demos/CloudEngineeringDemo').then((m) => ({
    default: m.CloudEngineeringDemo,
  }))
);
const IntegrationSuiteDemo = lazy(() =>
  import('./demos/IntegrationSuiteDemo').then((m) => ({
    default: m.IntegrationSuiteDemo,
  }))
);
const MahaBazaarDemo = lazy(() =>
  import('./demos/MahaBazaarDemo').then((m) => ({
    default: m.MahaBazaarDemo,
  }))
);

function MainApp() {
  const { currentRoute, params, navigate } = useNavigation();
  const { language } = useLanguage();
  const [isConsultationOpen, setIsConsultationOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [selectedApp, setSelectedApp] = useState<AndroidApp | null>(null);
  const [preselectedConsultService, setPreselectedConsultService] = useState('enterprise-software');
  const [prefillConsultMessage, setPrefillConsultMessage] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const languageRef = useRef(language);
  languageRef.current = language;

  useEffect(() => {
    trackPageView(currentRoute, languageRef.current);
  }, [currentRoute]);

  const handleOpenConsultation = (
    serviceType = 'enterprise-software',
    ctaSource = 'schedule_consultation',
    prefillMsg = ''
  ) => {
    trackCtaClick(ctaSource, serviceType);
    setPreselectedConsultService(serviceType);
    setPrefillConsultMessage(prefillMsg);
    setIsConsultationOpen(true);
  };

  const handleSelectServiceForConsult = (serviceId: string) => {
    trackCtaClick('service_detail_consultation', serviceId);
    setPreselectedConsultService(serviceId);
    setPrefillConsultMessage('');
    setIsConsultationOpen(true);
  };

  const handleRequestApkDemo = (appId: string) => {
    trackCtaClick('android_apk_demo', `Android APK Demo (${appId})`);
    setPreselectedConsultService(`Android APK Demo (${appId})`);
    setPrefillConsultMessage('');
    setIsConsultationOpen(true);
  };

  const renderCurrentView = () => {
    switch (currentRoute) {
      case 'about':
        return (
          <AboutPage
            onOpenConsultation={() =>
              handleOpenConsultation('leadership-briefing', 'about_page_consultation')
            }
          />
        );
      case 'services':
        return (
          <ServicesPage
            onSelectService={(service) => setSelectedService(service)}
            onOpenConsultation={() =>
              handleOpenConsultation('enterprise-services', 'services_page_consultation')
            }
          />
        );
      case 'ai-solutions':
        return (
          <AiSolutionsPage
            onOpenConsultation={() =>
              handleOpenConsultation('ai-solutions', 'ai_solutions_page_consultation')
            }
          />
        );
      case 'android-portfolio':
        return (
          <AndroidPortfolioPage
            onOpenConsultation={() =>
              handleOpenConsultation('android-ecosystem', 'android_portfolio_consultation')
            }
          />
        );
      case 'app-detail':
        return (
          <AppDetailPage
            onOpenConsultation={(req) => handleOpenConsultation(req, 'app_detail_consultation')}
          />
        );
      case 'process':
        return (
          <ProcessPage
            onOpenConsultation={() =>
              handleOpenConsultation('process-discovery', 'process_page_consultation')
            }
          />
        );
      case 'contact':
        return <ContactPage />;
      case 'pay':
        return <PayPage />;
      case 'blog':
        return <BlogPage />;
      case 'privacy':
        return <PrivacyPolicyPage />;
      case 'terms':
        return <TermsPage />;
      case 'client-dashboard':
        return <ClientDashboardPage />;
      case 'admin-dashboard':
        return <AdminDashboardPage />;
      case 'demo': {
        const slug = (params.slug || '').toLowerCase();
        const buildDemoMsg = (hiName: string, enName: string) =>
          language === 'hi'
            ? `डेमो: ${hiName} जैसी वेबसाइट बनवानी है`
            : `Demo: Interested in building a website like ${enName}`;
        if (slug === 'shopping') {
          return (
            <ShoppingDemo
              onBackToHome={() => navigate('home')}
              onRequestQuote={() =>
                handleOpenConsultation(
                  'web-platforms',
                  'demo_shopping_build_website',
                  buildDemoMsg('देसी बाज़ार', 'Desi Bazaar')
                )
              }
            />
          );
        }
        if (slug === 'core-engineering') {
          return (
            <CoreEngineeringDemo
              onBackToHome={() => navigate('home')}
              onRequestQuote={() =>
                handleOpenConsultation(
                  'web-platforms',
                  'demo_core_engineering_build_website',
                  buildDemoMsg('कोर इंजीनियरिंग', 'Core Engineering')
                )
              }
            />
          );
        }
        if (slug === 'web-ecosystem') {
          return (
            <WebEcosystemDemo
              onBackToHome={() => navigate('home')}
              onRequestQuote={() =>
                handleOpenConsultation(
                  'web-platforms',
                  'demo_web_ecosystem_build_website',
                  buildDemoMsg('वेब इकोसिस्टम', 'Web Ecosystem')
                )
              }
            />
          );
        }
        if (slug === 'mobile-system') {
          return (
            <MobileSystemDemo
              onBackToHome={() => navigate('home')}
              onRequestQuote={() =>
                handleOpenConsultation(
                  'android-ecosystem',
                  'demo_mobile_system_build_website',
                  buildDemoMsg('मोबाइल सिस्टम', 'Mobile System')
                )
              }
            />
          );
        }
        if (slug === 'artificial-intelligence') {
          return (
            <ArtificialIntelligenceDemo
              onBackToHome={() => navigate('home')}
              onRequestQuote={() =>
                handleOpenConsultation(
                  'ai-solutions',
                  'demo_ai_build_website',
                  buildDemoMsg('आर्टिफिशियल इंटेलिजेंस', 'Artificial Intelligence')
                )
              }
            />
          );
        }
        if (slug === 'cloud-engineering') {
          return (
            <CloudEngineeringDemo
              onBackToHome={() => navigate('home')}
              onRequestQuote={() =>
                handleOpenConsultation(
                  'cloud-devops',
                  'demo_cloud_engineering_build_website',
                  buildDemoMsg('क्लाउड इंजीनियरिंग', 'Cloud Engineering')
                )
              }
            />
          );
        }
        if (slug === 'integration-suite') {
          return (
            <IntegrationSuiteDemo
              onBackToHome={() => navigate('home')}
              onRequestQuote={() =>
                handleOpenConsultation(
                  'api-integration',
                  'demo_integration_suite_build_website',
                  buildDemoMsg('इंटीग्रेशन सुइट', 'Integration Suite')
                )
              }
            />
          );
        }
        if (slug === 'maha-bazaar') {
          return (
            <MahaBazaarDemo
              onBackToHome={() => navigate('home')}
              onRequestQuote={() =>
                handleOpenConsultation(
                  'enterprise-software',
                  'demo_maha_bazaar_build_platform',
                  buildDemoMsg('महा बाज़ार प्लेटफ़ॉर्म', 'Maha Bazaar Platform')
                )
              }
            />
          );
        }
        return (
          <section className="py-24 sm:py-32 bg-slate-50 border-b border-slate-200 min-h-screen flex items-center">
            <div className="max-w-xl mx-auto px-4 text-center space-y-5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950">
                {language === 'hi' ? 'डेमो वेबसाइट उपलब्ध नहीं है' : 'Demo Website Not Found'}
              </h1>
              <p className="text-sm text-slate-600">
                {language === 'hi'
                  ? 'कृपया होम पेज के डेमो वेबसाइट्स सेक्शन से उपलब्ध डेमो चुनें।'
                  : 'Please choose an available preview from the Demo Websites section on the homepage.'}
              </p>
              <button
                type="button"
                onClick={() => navigate('home')}
                className="px-5 py-2.5 rounded-md bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold cursor-pointer"
              >
                {language === 'hi' ? 'मुख्य पृष्ठ पर वापस जाएँ' : 'Back to Home'}
              </button>
            </div>
          </section>
        );
      }
      case 'not-found':
        return (
          <section className="py-24 sm:py-32 bg-slate-50 border-b border-slate-200">
            <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center space-y-6">
              <div className="inline-block px-3 py-1 rounded bg-blue-50 border border-blue-200 text-xs font-mono font-bold text-blue-700">
                HTTP 404 · {language === 'hi' ? 'पृष्ठ उपलब्ध नहीं' : 'RESOURCE NOT FOUND'}
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
                {language === 'hi'
                  ? 'क्षमा करें, अनुरोधित पृष्ठ नहीं मिला'
                  : 'Page Not Found'}
              </h1>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                {language === 'hi'
                  ? 'आप जिस URL तक पहुँचने का प्रयास कर रहे हैं वह या तो स्थानांतरित हो गया है या मौजूद नहीं है।'
                  : 'The URL path you requested does not match an active platform route.'}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => navigate('home')}
                  className="px-5 py-2.5 rounded-md bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  {language === 'hi' ? 'मुख्य पृष्ठ पर जाएं' : 'Return to Home'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('services')}
                  className="px-5 py-2.5 rounded-md bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-semibold transition-colors cursor-pointer"
                >
                  {language === 'hi' ? 'सेवाएं देखें' : 'Explore Services'}
                </button>
              </div>
            </div>
          </section>
        );
      case 'home':
      default:
        return (
          <>
            {/* 1. Hero Section */}
            <HeroSection
              onOpenConsultation={() =>
                handleOpenConsultation('enterprise-software', 'hero_schedule_consultation')
              }
            />

            {/* 1.5 Official Brand & Platform Showcase Posters */}
            <BrandShowcaseSection
              onOpenConsultation={() =>
                handleOpenConsultation('enterprise-software', 'brand_showcase_consultation')
              }
            />

            {/* 1.6 Interactive Client Demo Websites Gallery */}
            <DemoWebsitesSection
              onOpenDemo={(slug) => navigate('demo', { slug })}
            />

            {/* 2. Company Introduction (Bhanu Ram Bariha Digital Technologies) */}
            <CompanyIntroSection
              onOpenConsultation={() =>
                handleOpenConsultation('leadership-briefing', 'company_intro_consultation')
              }
            />

            {/* 3. Core Technology Services */}
            <ServicesSection onSelectService={(service) => setSelectedService(service)} />

            {/* 4. Android Apps Portfolio Preview */}
            <AndroidPortfolioSection
              onSelectApp={(app) => {
                navigate('app-detail', { id: app.id });
              }}
              onRequestApkDemo={handleRequestApkDemo}
            />

            {/* 5. Sovereign Enterprise AI Solutions & Interactive Scope Calculator */}
            <AiSolutionsSection
              onOpenConsultation={() =>
                handleOpenConsultation('ai-solutions', 'ai_solutions_section_consultation')
              }
            />

            {/* 6. Why Choose Us (Quantitative Rigor & Claim-to-Proof) */}
            <WhyChooseUsSection />

            {/* 7. Disciplined 6-Phase Engineering Methodology */}
            <ProcessSection />

            {/* 8. Contact CTA, Squad Estimator & Inquiries */}
            <ContactCtaSection />
          </>
        );
    }
  };

  const isStandaloneDemo = currentRoute === 'demo';

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 selection:bg-blue-600 selection:text-white font-sans">
      <RouteSEO currentRoute={currentRoute} />

      {!isStandaloneDemo && (
        <>
          {/* Header with strict Top Bar Contract & Multi-Page Navigation */}
          <Header
            onOpenConsultation={() =>
              handleOpenConsultation('enterprise-software', 'header_book_consultation')
            }
            mobileMenuOpen={mobileMenuOpen}
            setMobileMenuOpen={setMobileMenuOpen}
          />

          {/* Mobile Navigation Drawer */}
          <MobileMenu
            isOpen={mobileMenuOpen}
            onClose={() => setMobileMenuOpen(false)}
            onOpenConsultation={() =>
              handleOpenConsultation('enterprise-software', 'mobile_menu_consultation')
            }
          />

          {/* Offline / Network Connectivity Alert Banner */}
          <NetworkStatusAlert variant="banner" dismissible />
        </>
      )}

      {/* Main Page Flow depending on currentRoute */}
      <main className="flex-1">
        <ErrorBoundary resetKey={currentRoute} onGoHome={() => navigate('home')}>
          <Suspense fallback={<PageLoadingFallback variant="skeleton" />}>
            {renderCurrentView()}
          </Suspense>
        </ErrorBoundary>
      </main>

      {/* Professional Enterprise Footer */}
      {!isStandaloneDemo && <Footer />}

      {/* Interactive Modals */}
      <ConsultationModal
        isOpen={isConsultationOpen}
        onClose={() => setIsConsultationOpen(false)}
        preselectedService={preselectedConsultService}
        prefillMessage={prefillConsultMessage}
      />

      <ServiceDetailModal
        service={selectedService}
        onClose={() => setSelectedService(null)}
        onSelectForConsult={handleSelectServiceForConsult}
      />

      <AppDetailModal
        app={selectedApp}
        onClose={() => setSelectedApp(null)}
        onRequestApkDemo={handleRequestApkDemo}
      />

      {/* Toast Flash Alerts for Language Changes & Submissions */}
      <ToastContainer />

      {/* Enterprise Authentication & Account Profile Modals */}
      <AuthModal />
      <ProfileModal />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <ErrorBoundary>
        <AuthProvider>
          <NavigationProvider>
            <NotificationProvider>
              <AppsProvider>
                <MainApp />
              </AppsProvider>
            </NotificationProvider>
          </NavigationProvider>
        </AuthProvider>
      </ErrorBoundary>
    </LanguageProvider>
  );
}
