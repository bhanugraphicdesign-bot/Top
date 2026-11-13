import React, { useState, Suspense, lazy } from 'react';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { NavigationProvider, useNavigation } from './context/NavigationContext';
import { AppsProvider } from './context/AppsContext';
import { Header } from './components/common/Header';
import { MobileMenu } from './components/common/MobileMenu';
import { Footer } from './components/common/Footer';
import { HeroSection } from './components/home/HeroSection';
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
import { ServiceItem, AndroidApp } from './types';

// Code-split secondary pages and protected portals to minimize initial JS payload
const AboutPage = lazy(() => import('./pages/AboutPage').then((m) => ({ default: m.AboutPage })));
const ServicesPage = lazy(() => import('./pages/ServicesPage').then((m) => ({ default: m.ServicesPage })));
const AiSolutionsPage = lazy(() => import('./pages/AiSolutionsPage').then((m) => ({ default: m.AiSolutionsPage })));
const AndroidPortfolioPage = lazy(() => import('./pages/AndroidPortfolioPage').then((m) => ({ default: m.AndroidPortfolioPage })));
const AppDetailPage = lazy(() => import('./pages/AppDetailPage').then((m) => ({ default: m.AppDetailPage })));
const ProcessPage = lazy(() => import('./pages/ProcessPage').then((m) => ({ default: m.ProcessPage })));
const ContactPage = lazy(() => import('./pages/ContactPage').then((m) => ({ default: m.ContactPage })));
const BlogPage = lazy(() => import('./pages/BlogPage').then((m) => ({ default: m.BlogPage })));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage').then((m) => ({ default: m.PrivacyPolicyPage })));
const TermsPage = lazy(() => import('./pages/TermsPage').then((m) => ({ default: m.TermsPage })));
const ClientDashboardPage = lazy(() => import('./pages/ClientDashboardPage').then((m) => ({ default: m.ClientDashboardPage })));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage })));

function PageLoadingFallback() {
  const { t } = useLanguage();
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-slate-600">
      <div className="w-8 h-8 border-3 border-blue-700 border-t-transparent rounded-full animate-spin mb-3" />
      <p className="text-xs font-mono uppercase tracking-wider text-slate-500">
        {t('Loading enterprise module...', 'एंटरप्राइज मॉड्यूल लोड हो रहा है...')}
      </p>
    </div>
  );
}

function MainApp() {
  const { currentRoute, navigate } = useNavigation();
  const [isConsultationOpen, setIsConsultationOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [selectedApp, setSelectedApp] = useState<AndroidApp | null>(null);
  const [preselectedConsultService, setPreselectedConsultService] = useState('enterprise-software');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleOpenConsultation = (serviceType = 'enterprise-software') => {
    setPreselectedConsultService(serviceType);
    setIsConsultationOpen(true);
  };

  const handleSelectServiceForConsult = (serviceId: string) => {
    setPreselectedConsultService(serviceId);
    setIsConsultationOpen(true);
  };

  const handleRequestApkDemo = (appId: string) => {
    setPreselectedConsultService(`Android APK Demo (${appId})`);
    setIsConsultationOpen(true);
  };

  const renderCurrentView = () => {
    switch (currentRoute) {
      case 'about':
        return <AboutPage onOpenConsultation={() => handleOpenConsultation('leadership-briefing')} />;
      case 'services':
        return (
          <ServicesPage
            onSelectService={(service) => setSelectedService(service)}
            onOpenConsultation={() => handleOpenConsultation('enterprise-services')}
          />
        );
      case 'ai-solutions':
        return <AiSolutionsPage onOpenConsultation={() => handleOpenConsultation('ai-solutions')} />;
      case 'android-portfolio':
        return (
          <AndroidPortfolioPage
            onOpenConsultation={() => handleOpenConsultation('android-ecosystem')}
          />
        );
      case 'app-detail':
        return (
          <AppDetailPage
            onOpenConsultation={(req) => handleOpenConsultation(req)}
          />
        );
      case 'process':
        return <ProcessPage onOpenConsultation={() => handleOpenConsultation('process-discovery')} />;
      case 'contact':
        return <ContactPage />;
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
      case 'home':
      default:
        return (
          <>
            {/* 1. Hero Section */}
            <HeroSection onOpenConsultation={() => handleOpenConsultation('enterprise-software')} />

            {/* 2. Company Introduction (Bhanu Ram Bariha Digital Technologies) */}
            <CompanyIntroSection onOpenConsultation={() => handleOpenConsultation('leadership-briefing')} />

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
            <AiSolutionsSection onOpenConsultation={() => handleOpenConsultation('ai-solutions')} />

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

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 selection:bg-blue-600 selection:text-white font-sans">
      {/* Header with strict Top Bar Contract & Multi-Page Navigation */}
      <Header
        onOpenConsultation={() => handleOpenConsultation('enterprise-software')}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      {/* Mobile Navigation Drawer */}
      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        onOpenConsultation={() => handleOpenConsultation('enterprise-software')}
      />

      {/* Main Page Flow depending on currentRoute */}
      <main className="flex-1">
        <Suspense fallback={<PageLoadingFallback />}>{renderCurrentView()}</Suspense>
      </main>

      {/* Professional Enterprise Footer */}
      <Footer />

      {/* Interactive Modals */}
      <ConsultationModal
        isOpen={isConsultationOpen}
        onClose={() => setIsConsultationOpen(false)}
        preselectedService={preselectedConsultService}
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

      {/* Enterprise Authentication Modal */}
      <AuthModal />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <NavigationProvider>
          <NotificationProvider>
            <AppsProvider>
              <MainApp />
            </AppsProvider>
          </NotificationProvider>
        </NavigationProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
