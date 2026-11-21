import React, { useState, useEffect, Suspense, lazy } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Shield,
  ShoppingBag,
  Store,
  Truck,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { DemoPriceBar } from '../../components/DemoPriceBar';
import {
  DeliveryTask,
  INITIAL_DELIVERY_TASKS,
  INITIAL_PRODUCTS,
  INITIAL_SELLER_APPLICATIONS,
  INITIAL_SELLER_ORDERS,
  MarketplaceRole,
  PlatformSettings,
  SampleProduct,
  SellerApplication,
  SellerOrder,
} from './sampleData';

const StorefrontView = lazy(() =>
  import('./StorefrontView').then((m) => ({ default: m.StorefrontView }))
);
const SellerView = lazy(() =>
  import('./SellerView').then((m) => ({ default: m.SellerView }))
);
const DeliveryView = lazy(() =>
  import('./DeliveryView').then((m) => ({ default: m.DeliveryView }))
);
const AdminView = lazy(() =>
  import('./AdminView').then((m) => ({ default: m.AdminView }))
);

interface MahaBazaarDemoProps {
  onBackToHome: () => void;
  onRequestQuote: () => void;
}

const VALID_ROLES: MarketplaceRole[] = ['customer', 'seller', 'delivery', 'admin'];

function parseRoleFromHash(): MarketplaceRole {
  if (typeof window === 'undefined') return 'customer';
  const cleaned = window.location.hash.replace(/^#/, '').toLowerCase() as MarketplaceRole;
  return VALID_ROLES.includes(cleaned) ? cleaned : 'customer';
}

const ViewSkeleton: React.FC = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-6 animate-pulse">
    <div className="h-44 rounded-2xl bg-slate-200" />
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-28 rounded-xl bg-slate-200" />
      ))}
    </div>
    <div className="h-56 rounded-2xl bg-slate-200" />
  </div>
);

export const MahaBazaarDemo: React.FC<MahaBazaarDemoProps> = ({
  onBackToHome,
  onRequestQuote,
}) => {
  const { language, setLanguage } = useLanguage();
  const isHi = language === 'hi';

  const [role, setRole] = useState<MarketplaceRole>(parseRoleFromHash);

  // Shared in-memory marketplace state (ZERO Firestore / ZERO API calls — resets on page reload)
  const [products, setProducts] = useState<SampleProduct[]>(INITIAL_PRODUCTS);
  const [sellerOrders, setSellerOrders] = useState<SellerOrder[]>(INITIAL_SELLER_ORDERS);
  const [deliveryTasks, setDeliveryTasks] = useState<DeliveryTask[]>(INITIAL_DELIVERY_TASKS);
  const [sellerApps, setSellerApps] = useState<SellerApplication[]>(INITIAL_SELLER_APPLICATIONS);
  const [trackedOrderId, setTrackedOrderId] = useState<string>('MB-DEMO-2048');
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>({
    commissionPercent: 8,
    deliveryFee: 49,
    coupons: [{ code: 'DEMO10', percent: 10 }],
  });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    const onHashChange = () => {
      setRole(parseRoleFromHash());
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const switchRole = (nextRole: MarketplaceRole) => {
    setRole(nextRole);
    if (typeof window !== 'undefined') {
      const targetHash = `#${nextRole}`;
      if (window.location.hash !== targetHash) {
        window.history.replaceState(null, '', `${window.location.pathname}${targetHash}`);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleAddProduct = (newProd: SampleProduct) => {
    setProducts((prev) => [newProd, ...prev]);
  };

  const handleRestockProduct = (productId: string, addQty: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, stock: p.stock + addQty } : p))
    );
  };

  const handleUpdateOrderStatus = (orderId: string, nextStatus: SellerOrder['status']) => {
    setSellerOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o))
    );
  };

  const handleMarkDelivered = (taskId: string) => {
    setDeliveryTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, delivered: true } : t))
    );
  };

  const handleUpdateApplication = (id: string, status: 'approved' | 'rejected') => {
    setSellerApps((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
  };

  const handleOrderPlaced = (orderId: string) => {
    setTrackedOrderId(orderId);
    setSellerOrders((prev) => [
      {
        id: orderId,
        customerHi: 'डेमो ग्राहक (वेब स्टोर)',
        customerEn: 'Demo Customer (Web Store)',
        itemHi: 'कार्ट चेकआउट ऑर्डर',
        itemEn: 'Cart Checkout Order',
        amount: 1999,
        date: isHi ? 'अभी' : 'Just now',
        status: 'new',
      },
      ...prev,
    ]);
  };

  const roleTabs: {
    id: MarketplaceRole;
    icon: React.ComponentType<{ className?: string }>;
    hi: string;
    en: string;
  }[] = [
    { id: 'customer', icon: ShoppingBag, hi: 'ग्राहक', en: 'Customer' },
    { id: 'seller', icon: Store, hi: 'विक्रेता', en: 'Seller' },
    { id: 'delivery', icon: Truck, hi: 'डिलीवरी', en: 'Delivery' },
    { id: 'admin', icon: Shield, hi: 'एडमिन', en: 'Admin' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* STICKY TOP BAR: DEMO DISCLAIMER + 4-ROLE SWITCHER */}
      <div className="sticky top-0 z-40 shadow-xs">
        {/* Top Demo Strip */}
        <div className="bg-slate-950 text-slate-100 border-b border-slate-800">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 py-1.5 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <button
                type="button"
                onClick={onBackToHome}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-orange-400" />
                <span>{isHi ? 'Power Web Studio AI पर वापस' : 'Back to Power Web Studio AI'}</span>
              </button>
              <span className="hidden sm:inline text-amber-300 font-medium truncate">
                {isHi
                  ? 'DEMO प्लेटफ़ॉर्म — सारा डेटा नमूना है'
                  : 'DEMO Platform — All Data Is Sample Only'}
              </span>
            </div>

            <span className="text-[11px] font-mono text-slate-300 whitespace-nowrap shrink-0">
              {isHi ? 'फ़्लैगशिप डेमो' : 'Flagship Demo'}
            </span>
          </div>
        </div>

        {/* MRP Price Bar */}
        <DemoPriceBar slug="maha-bazaar" />

        {/* Role Switcher Bar (4 Tabs synced to URL hash) */}
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-950 shrink-0">
              <span className="hidden sm:inline">
                {isHi ? 'रोल स्विचर:' : 'Role Switcher:'}
              </span>
            </div>

            <div
              role="tablist"
              aria-label={isHi ? 'प्लेटफ़ॉर्म रोल चुनें' : 'Select platform role'}
              className="flex-1 sm:flex-initial grid grid-cols-4 sm:inline-flex gap-1 bg-slate-100 p-1 rounded-xl"
            >
              {roleTabs.map((tab) => {
                const Icon = tab.icon;
                const active = role === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => switchRole(tab.id)}
                    className={`inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      active
                        ? 'bg-indigo-950 text-white shadow-xs'
                        : 'text-slate-700 hover:text-indigo-950'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-orange-400' : 'text-slate-500'}`} />
                    <span>{isHi ? tab.hi : tab.en}</span>
                  </button>
                );
              })}
            </div>

            {role !== 'customer' && (
              <div className="hidden md:inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200 shrink-0">
                <button
                  type="button"
                  onClick={() => setLanguage('hi')}
                  className={`px-2 py-0.5 text-[11px] font-bold rounded cursor-pointer ${
                    isHi ? 'bg-indigo-950 text-white' : 'text-slate-600'
                  }`}
                >
                  हिंदी
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`px-2 py-0.5 text-[11px] font-bold rounded cursor-pointer ${
                    !isHi ? 'bg-indigo-950 text-white' : 'text-slate-600'
                  }`}
                >
                  EN
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ACTIVE ROLE VIEW (React.lazy code-split per portal) */}
      <main className="flex-1">
        <Suspense fallback={<ViewSkeleton />}>
          {role === 'customer' && (
            <StorefrontView
              isHi={isHi}
              onToggleLanguage={setLanguage}
              products={products}
              platformSettings={platformSettings}
              onOrderPlaced={handleOrderPlaced}
              onTrackOrder={(id) => {
                setTrackedOrderId(id);
                switchRole('delivery');
              }}
            />
          )}
          {role === 'seller' && (
            <SellerView
              isHi={isHi}
              products={products}
              onAddProduct={handleAddProduct}
              onRestockProduct={handleRestockProduct}
              orders={sellerOrders}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              platformSettings={platformSettings}
            />
          )}
          {role === 'delivery' && (
            <DeliveryView
              isHi={isHi}
              initialOrderId={trackedOrderId}
              tasks={deliveryTasks}
              onMarkDelivered={handleMarkDelivered}
            />
          )}
          {role === 'admin' && (
            <AdminView
              isHi={isHi}
              applications={sellerApps}
              onUpdateApplication={handleUpdateApplication}
              platformSettings={platformSettings}
              onUpdateSettings={setPlatformSettings}
            />
          )}
        </Suspense>
      </main>

      {/* BOTTOM MAIN-SITE CONVERSION CTA */}
      <section className="bg-indigo-950 text-white py-9 border-t border-indigo-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left space-y-1">
            <h3 className="text-lg sm:text-xl font-extrabold">
              {isHi
                ? 'ऐसा एंटरप्राइज़ मार्केटप्लेस अपने बिज़नेस के लिए बनवाएँ'
                : 'Launch an Enterprise Marketplace Platform Like This'}
            </h3>
            <p className="text-xs sm:text-sm text-indigo-200">
              {isHi
                ? 'विक्रेता, ग्राहक, डिलीवरी और एडमिन — Power Web Studio AI द्वारा आपके ब्रांड के अनुरूप निर्मित।'
                : 'Customer, Seller, Delivery, and Admin portals tailored to your brand by Power Web Studio AI.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onRequestQuote}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>
              {isHi
                ? 'ऐसा प्लेटफ़ॉर्म अपने बिज़नेस के लिए बनवाएँ'
                : 'Build a Platform Like This for Your Business'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-950 text-slate-400 py-6 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <span className="font-bold text-slate-200">© Maha Bazaar (Demo)</span>
          <span>
            {isHi
              ? 'यह एक इंटरैक्टिव डेमो प्लेटफ़ॉर्म है — कोई वास्तविक ऑर्डर, पेमेंट या डेटाबेस सेव नहीं होता।'
              : 'Interactive showcase platform — no live orders, payments, or database writes occur.'}
          </span>
        </div>
      </footer>
    </div>
  );
};
