import React, { useState } from 'react';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { NavigationProvider, useNavigation } from './context/NavigationContext';
import { AppsProvider, useApps } from './context/AppsContext';
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
import { AboutPage } from './pages/AboutPage';
import { ServicesPage } from './pages/ServicesPage';
import { AiSolutionsPage } from './pages/AiSolutionsPage';
import { AndroidPortfolioPage } from './pages/AndroidPortfolioPage';
import { AppDetailPage } from './pages/AppDetailPage';
import { ProcessPage } from './pages/ProcessPage';
import { ContactPage } from './pages/ContactPage';
import { BlogPage } from './pages/BlogPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { TermsPage } from './pages/TermsPage';
import { ClientDashboardPage } from './pages/ClientDashboardPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { ToastContainer } from './components/common/ToastContainer';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { AuthModal } from './components/auth/AuthModal';
import { ServiceItem, AndroidApp } from './types';

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

      {/* Mobile Navigation Drawer for 10 Public Pages */}
      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        onOpenConsultation={() => handleOpenConsultation('enterprise-software')}
      />

      {/* Main Page Flow depending on currentRoute */}
      <main className="flex-1">{renderCurrentView()}</main>

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
