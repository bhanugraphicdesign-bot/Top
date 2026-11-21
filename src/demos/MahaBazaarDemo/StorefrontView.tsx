import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  FileText,
  Globe2,
  Headphones,
  IndianRupee,
  Mail,
  MapPin,
  Minus,
  PackageCheck,
  Phone,
  Plus,
  RotateCcw,
  Search,
  Send,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  SlidersHorizontal,
  Smartphone,
  Store,
  Tag,
  Trash2,
  Truck,
  Users,
  BarChart3,
  Bell,
  X,
} from 'lucide-react';
import {
  CATEGORY_CARDS,
  CartItem,
  MahaImage,
  PLATFORM_FEATURES,
  PLATFORM_PACKAGES,
  PlatformSettings,
  ProductCategory,
  SampleProduct,
  formatINR,
} from './sampleData';

interface StorefrontViewProps {
  isHi: boolean;
  onToggleLanguage: (lang: 'hi' | 'en') => void;
  products: SampleProduct[];
  platformSettings: PlatformSettings;
  onOrderPlaced: (orderId: string) => void;
  onTrackOrder: (orderId: string) => void;
}

const FEATURE_ICONS = [
  Store,
  Truck,
  CreditCard,
  Tag,
  IndianRupee,
  Bell,
  FileText,
  RotateCcw,
  BarChart3,
  Users,
  Globe2,
  Smartphone,
];

const HERO_SLIDES = [
  {
    id: 'slide-1',
    image: '/demo/maha-bazaar/hero.jpg',
    kickerHi: 'महा बाज़ार मल्टी-वेंडर प्लेटफ़ॉर्म',
    kickerEn: 'Maha Bazaar Multi-Vendor Platform',
    titleHi: 'हज़ारों विक्रेता, एक भरोसेमंद बाज़ार',
    titleEn: 'Countless Sellers, One Trusted Marketplace',
    subtitleHi:
      'फ़ैशन, किराना, इलेक्ट्रॉनिक्स और होम डेकोर — पारदर्शी कीमतों और सुरक्षित चेकआउट के साथ एक ही प्लेटफ़ॉर्म पर।',
    subtitleEn:
      'Fashion, groceries, electronics, and home decor brought together with transparent pricing and structured checkout.',
  },
  {
    id: 'slide-2',
    image: '/demo/maha-bazaar/customer-shopping.jpg',
    kickerHi: 'ग्राहक · विक्रेता · डिलीवरी · एडमिन',
    kickerEn: 'Customer · Seller · Delivery · Admin',
    titleHi: 'हर शहर के लिए सहज ऑनलाइन खरीदारी',
    titleEn: 'Seamless Online Shopping for Every City',
    subtitleHi:
      'पिनकोड जाँच, आसान रिटर्न, कूपन छूट और चरण-दर-चरण ऑर्डर ट्रैकिंग का पूरा एंटरप्राइज़ अनुभव।',
    subtitleEn:
      'Pincode serviceability checks, easy returns, coupon codes, and step-by-step order tracking in one suite.',
  },
];

export const StorefrontView: React.FC<StorefrontViewProps> = ({
  isHi,
  onToggleLanguage,
  products,
  platformSettings,
  onOrderPlaced,
  onTrackOrder,
}) => {
  // Header Search & Pincode
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [pincode, setPincode] = useState('492001');
  const [pincodeMsg, setPincodeMsg] = useState<string | null>(null);

  // Hero Slider (3s auto-slide)
  const [activeSlide, setActiveSlide] = useState(0);
  const [sliderPaused, setSliderPaused] = useState(false);

  // Catalog Filters + Skeleton feedback
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>('all');
  const [maxPrice, setMaxPrice] = useState<number>(45000);
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc'>('featured');
  const [isFiltering, setIsFiltering] = useState(false);

  // Product Detail Modal
  const [activeProduct, setActiveProduct] = useState<SampleProduct | null>(null);
  const [detailQty, setDetailQty] = useState(1);

  // Cart & 3-Step Checkout Drawer
  const [cart, setCart] = useState<CartItem[]>([
    { product: products[0], quantity: 1 },
    { product: products[4], quantity: 1 },
  ]);
  const [cartOpen, setCartOpen] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; percent: number } | null>(null);
  const [couponFeedback, setCouponFeedback] = useState<string | null>(null);

  // Checkout steps: 0 = cart list, 1 = address, 2 = payment choice, 3 = summary, 4 = done
  const [checkoutStep, setCheckoutStep] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [shipName, setShipName] = useState('');
  const [shipPhone, setShipPhone] = useState('');
  const [shipAddress, setShipAddress] = useState('');
  const [shipPincode, setShipPincode] = useState('492001');
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD' | 'COD'>('UPI');
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);

  // Enterprise Inquiry Form (Local only)
  const [contactName, setContactName] = useState('');
  const [contactCompany, setContactCompany] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactType, setContactType] = useState('multi-vendor');
  const [contactBudget, setContactBudget] = useState('5-10L');
  const [contactError, setContactError] = useState<string | null>(null);
  const [contactSuccess, setContactSuccess] = useState(false);

  useEffect(() => {
    if (sliderPaused) return;
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const timer = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 3000);
    return () => window.clearInterval(timer);
  }, [sliderPaused]);

  const triggerFilterSkeleton = (nextCategory: ProductCategory | 'all') => {
    setSelectedCategory(nextCategory);
    setIsFiltering(true);
    window.setTimeout(() => setIsFiltering(false), 200);
  };

  const searchSuggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return products.slice(0, 5);
    return products
      .filter(
        (p) =>
          p.nameHi.toLowerCase().includes(q) ||
          p.nameEn.toLowerCase().includes(q) ||
          p.sellerHi.toLowerCase().includes(q) ||
          p.sellerEn.toLowerCase().includes(q)
      )
      .slice(0, 5);
  }, [searchQuery, products]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = products.filter((item) => {
      const catMatch = selectedCategory === 'all' || item.category === selectedCategory;
      const priceMatch = item.price <= maxPrice;
      const queryMatch =
        !q ||
        item.nameHi.toLowerCase().includes(q) ||
        item.nameEn.toLowerCase().includes(q) ||
        item.sellerHi.toLowerCase().includes(q) ||
        item.sellerEn.toLowerCase().includes(q);
      return catMatch && priceMatch && queryMatch;
    });

    if (sortBy === 'price-asc') return [...list].sort((a, b) => a.price - b.price);
    if (sortBy === 'price-desc') return [...list].sort((a, b) => b.price - a.price);
    return list;
  }, [products, selectedCategory, maxPrice, searchQuery, sortBy]);

  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [cart]
  );

  const discountAmount = appliedCoupon
    ? Math.round((subtotal * appliedCoupon.percent) / 100)
    : 0;
  const deliveryFee = cart.length > 0 ? platformSettings.deliveryFee : 0;
  const grandTotal = Math.max(0, subtotal - discountAmount + deliveryFee);

  const addToCart = (product: SampleProduct, qty = 1, openDrawer = false) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.product.id === product.id);
      if (existing) {
        return prev.map((c) =>
          c.product.id === product.id ? { ...c, quantity: c.quantity + qty } : c
        );
      }
      return [...prev, { product, quantity: qty }];
    });
    if (openDrawer) {
      setCheckoutStep(0);
      setCartOpen(true);
    }
  };

  const updateCartQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.product.id === productId
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const handleApplyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    const matched = platformSettings.coupons.find((c) => c.code.toUpperCase() === code);
    if (matched) {
      setAppliedCoupon(matched);
      setCouponFeedback(
        isHi
          ? `कूपन ${matched.code} लागू हुआ (${matched.percent}% छूट)`
          : `Coupon ${matched.code} applied (${matched.percent}% off)`
      );
    } else {
      setAppliedCoupon(null);
      setCouponFeedback(
        isHi
          ? 'अमान्य कूपन। नमूना छूट के लिए DEMO10 आज़माएँ।'
          : 'Invalid code. Try DEMO10 for 10% sample discount.'
      );
    }
  };

  const handleCheckPincode = () => {
    const digits = pincode.replace(/\D/g, '');
    if (digits.length === 6) {
      setPincodeMsg(
        isHi
          ? `पिनकोड ${digits}: मानक डिलीवरी उपलब्ध (नमूना)`
          : `Pincode ${digits}: Standard delivery available (Sample)`
      );
    } else {
      setPincodeMsg(
        isHi ? 'कृपया 6 अंकों का पिनकोड लिखें।' : 'Please enter a 6-digit pincode.'
      );
    }
  };

  const handleProceedFromAddress = () => {
    setCheckoutError(null);
    const digits = shipPhone.replace(/\D/g, '');
    if (shipName.trim().length < 2) {
      setCheckoutError(isHi ? 'कृपया प्राप्तकर्ता का नाम दर्ज करें।' : 'Enter recipient name.');
      return;
    }
    if (digits.length < 10) {
      setCheckoutError(
        isHi ? 'कृपया 10 अंकों का मोबाइल नंबर लिखें।' : 'Enter a 10-digit mobile number.'
      );
      return;
    }
    if (shipAddress.trim().length < 6) {
      setCheckoutError(isHi ? 'कृपया पूरा पता दर्ज करें।' : 'Enter complete shipping address.');
      return;
    }
    setCheckoutStep(2);
  };

  const handlePlaceDemoOrder = () => {
    const randomNum = Math.floor(3000 + Math.random() * 6900);
    const generatedId = `MB-DEMO-${randomNum}`;
    setPlacedOrderId(generatedId);
    setCheckoutStep(4);
    setCart([]);
    setAppliedCoupon(null);
    setCouponInput('');
    onOrderPlaced(generatedId);
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactError(null);
    setContactSuccess(false);
    const digits = contactPhone.replace(/\D/g, '');

    if (contactName.trim().length < 2) {
      setContactError(isHi ? 'कृपया अपना नाम दर्ज करें।' : 'Please enter your name.');
      return;
    }
    if (contactCompany.trim().length < 2) {
      setContactError(isHi ? 'कृपया कंपनी का नाम दर्ज करें।' : 'Please enter your company name.');
      return;
    }
    if (digits.length < 10 || digits.length > 13) {
      setContactError(
        isHi ? 'कृपया वैध 10 अंकों का मोबाइल नंबर लिखें।' : 'Please enter a valid 10-digit phone number.'
      );
      return;
    }

    // Strictly local state — NO Firestore or API write
    setContactSuccess(true);
  };

  const scrollToEl = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="bg-slate-50 text-slate-900">
      {/* STOREFRONT DEEP INDIGO HEADER */}
      <header className="bg-indigo-950 text-white border-b border-indigo-900">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 flex flex-wrap lg:flex-nowrap items-center justify-between gap-3">
          {/* Logo */}
          <button
            type="button"
            onClick={() => triggerFilterSkeleton('all')}
            className="flex items-center gap-2.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span className="w-9 h-9 rounded-lg bg-orange-500 text-white flex items-center justify-center shadow-sm">
              <ShoppingBag className="w-5 h-5" />
            </span>
            <span className="text-base sm:text-lg font-extrabold tracking-tight text-white">
              {isHi ? 'महा बाज़ार' : 'Maha Bazaar'}
            </span>
          </button>

          {/* Search Bar with Live Sample Suggestions */}
          <div className="relative order-3 lg:order-2 w-full lg:flex-1 lg:max-w-xl">
            <div className="flex items-center bg-white rounded-lg overflow-hidden border border-indigo-800 focus-within:ring-2 focus-within:ring-orange-400">
              <Search className="w-4 h-4 text-slate-400 ml-3 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => window.setTimeout(() => setSearchFocused(false), 180)}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  isHi
                    ? 'कुर्ता, मसाले, हेडफ़ोन, लैंप या स्टोर खोजें...'
                    : 'Search kurta, spices, headphones, lamps, or stores...'
                }
                aria-label={isHi ? 'प्रोडक्ट खोजें' : 'Search products'}
                className="w-full px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label={isHi ? 'साफ़ करें' : 'Clear'}
                  className="p-2 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {searchFocused && searchSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 z-30 rounded-xl bg-white border border-slate-200 shadow-xl overflow-hidden text-slate-900">
                <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 text-[11px] font-semibold text-slate-500">
                  {isHi ? 'नमूना खोज सुझाव' : 'Sample Suggestions'}
                </div>
                {searchSuggestions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onMouseDown={() => {
                      setSearchQuery(isHi ? item.nameHi : item.nameEn);
                      setSearchFocused(false);
                      scrollToEl('mb-catalog');
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-indigo-50 flex items-center justify-between gap-3 text-sm cursor-pointer"
                  >
                    <span className="truncate font-medium">
                      {isHi ? item.nameHi : item.nameEn}
                    </span>
                    <span className="font-mono text-xs font-bold text-indigo-900 shrink-0 tabular-nums">
                      {formatINR(item.price)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Controls: Pincode + Language + Cart */}
          <div className="order-2 lg:order-3 flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="hidden md:flex items-center bg-indigo-900/90 border border-indigo-800 rounded-lg px-2 py-1 gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-orange-400 shrink-0" />
              <input
                type="text"
                maxLength={6}
                value={pincode}
                onChange={(e) => {
                  setPincode(e.target.value.replace(/\D/g, ''));
                  setPincodeMsg(null);
                }}
                aria-label={isHi ? 'पिनकोड' : 'Pincode'}
                className="w-16 bg-transparent text-xs font-mono text-white focus:outline-none"
                placeholder="492001"
              />
              <button
                type="button"
                onClick={handleCheckPincode}
                className="text-[11px] font-bold text-orange-300 hover:text-orange-200 cursor-pointer whitespace-nowrap"
              >
                {isHi ? 'जाँचें' : 'Check'}
              </button>
            </div>

            <div className="inline-flex rounded-lg bg-indigo-900 border border-indigo-800 p-0.5">
              <button
                type="button"
                onClick={() => onToggleLanguage('hi')}
                className={`px-2 py-1 text-xs font-bold rounded-md cursor-pointer transition-colors ${
                  isHi ? 'bg-orange-500 text-white' : 'text-indigo-200 hover:text-white'
                }`}
              >
                हिंदी
              </button>
              <button
                type="button"
                onClick={() => onToggleLanguage('en')}
                className={`px-2 py-1 text-xs font-bold rounded-md cursor-pointer transition-colors ${
                  !isHi ? 'bg-orange-500 text-white' : 'text-indigo-200 hover:text-white'
                }`}
              >
                EN
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setCheckoutStep(0);
                setCartOpen(true);
              }}
              className="relative inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs sm:text-sm transition-colors whitespace-nowrap cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden sm:inline">{isHi ? 'कार्ट' : 'Cart'}</span>
              <span className="px-1.5 py-0.5 rounded bg-indigo-950 text-white text-[11px] font-mono tabular-nums">
                {cartCount}
              </span>
            </button>
          </div>
        </div>
        {pincodeMsg && (
          <div className="bg-indigo-900/80 border-t border-indigo-800/80 px-4 py-1.5 text-center text-xs text-orange-200">
            {pincodeMsg}
          </div>
        )}
      </header>

      {/* HERO AUTO-SLIDER (3s interval) */}
      <section
        className="relative overflow-hidden bg-indigo-950"
        onMouseEnter={() => setSliderPaused(true)}
        onMouseLeave={() => setSliderPaused(false)}
      >
        <div className="relative h-[320px] sm:h-[400px] lg:h-[440px]">
          {HERO_SLIDES.map((slide, idx) => (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-700 ${
                idx === activeSlide ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              <MahaImage
                src={slide.image}
                alt={isHi ? slide.titleHi : slide.titleEn}
                eager={idx === 0}
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-950/92 via-indigo-950/72 to-indigo-950/35" />
              <div className="relative max-w-7xl mx-auto h-full px-4 sm:px-6 flex flex-col justify-center">
                <div className="max-w-xl space-y-4">
                  <p className="text-xs sm:text-sm font-bold text-orange-300 tracking-wide">
                    {isHi ? slide.kickerHi : slide.kickerEn}
                  </p>
                  <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight text-balance">
                    {isHi ? slide.titleHi : slide.titleEn}
                  </h1>
                  <p className="text-sm sm:text-base text-indigo-100 leading-relaxed">
                    {isHi ? slide.subtitleHi : slide.subtitleEn}
                  </p>
                  <div className="pt-1 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => scrollToEl('mb-catalog')}
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <span>{isHi ? 'खरीदारी शुरू करें' : 'Start Shopping'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Slider Arrows & Indicators */}
          <div className="absolute bottom-4 right-4 sm:right-8 z-20 flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setActiveSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)
              }
              aria-label={isHi ? 'पिछली स्लाइड' : 'Previous slide'}
              className="w-9 h-9 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 border border-white/20 text-white flex items-center justify-center cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setActiveSlide((prev) => (prev + 1) % HERO_SLIDES.length)}
              aria-label={isHi ? 'अगली स्लाइड' : 'Next slide'}
              className="w-9 h-9 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 border border-white/20 text-white flex items-center justify-center cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* 4 CATEGORY PHOTO CARDS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <p className="text-xs font-bold text-orange-600">
              {isHi ? 'कैटेगरी के अनुसार चुनें' : 'Browse by Category'}
            </p>
            <h2 className="text-xl sm:text-2xl font-extrabold text-indigo-950 mt-0.5">
              {isHi ? 'प्रमुख मार्केटप्लेस कैटेगरी' : 'Core Marketplace Categories'}
            </h2>
          </div>
          {selectedCategory !== 'all' && (
            <button
              type="button"
              onClick={() => triggerFilterSkeleton('all')}
              className="text-xs font-bold text-indigo-800 hover:text-orange-600 cursor-pointer whitespace-nowrap"
            >
              {isHi ? 'सभी कैटेगरी देखें' : 'Show All Categories'}
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {CATEGORY_CARDS.map((cat) => {
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  triggerFilterSkeleton(active ? 'all' : cat.id);
                  scrollToEl('mb-catalog');
                }}
                className={`group text-left rounded-xl overflow-hidden bg-white border transition-all duration-200 cursor-pointer hover:-translate-y-0.5 ${
                  active
                    ? 'border-orange-500 ring-2 ring-orange-200 shadow-md'
                    : 'border-slate-200 shadow-xs hover:shadow-md'
                }`}
              >
                <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                  <MahaImage
                    src={cat.image}
                    alt={isHi ? cat.nameHi : cat.nameEn}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="p-3.5 sm:p-4">
                  <div className="text-sm sm:text-base font-extrabold text-indigo-950">
                    {isHi ? cat.nameHi : cat.nameEn}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                    {isHi ? cat.subtitleHi : cat.subtitleEn}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* PRODUCT CATALOG GRID WITH FILTERS */}
      <section id="mb-catalog" className="max-w-7xl mx-auto px-4 sm:px-6 pb-14">
        <div className="rounded-xl bg-white border border-slate-200 p-4 sm:p-5 mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Category Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all' as const, hi: 'सभी (16)', en: 'All' },
              ...CATEGORY_CARDS.map((c) => ({ id: c.id, hi: c.nameHi, en: c.nameEn })),
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => triggerFilterSkeleton(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  selectedCategory === tab.id
                    ? 'bg-indigo-950 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {isHi ? tab.hi : tab.en}
              </button>
            ))}
          </div>

          {/* Price Slider & Sort */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2.5">
              <SlidersHorizontal className="w-4 h-4 text-indigo-800 shrink-0" />
              <label htmlFor="mb-price-slider" className="text-xs font-semibold text-slate-600 whitespace-nowrap">
                {isHi ? 'अधिकतम कीमत:' : 'Max Price:'}{' '}
                <span className="font-mono font-bold text-indigo-950 tabular-nums">
                  {formatINR(maxPrice)}
                </span>
              </label>
              <input
                id="mb-price-slider"
                type="range"
                min={500}
                max={45000}
                step={500}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-28 sm:w-36 accent-orange-500 cursor-pointer"
              />
            </div>

            <select
              aria-label={isHi ? 'क्रमबद्ध करें' : 'Sort products'}
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as 'featured' | 'price-asc' | 'price-desc')
              }
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-700 cursor-pointer"
            >
              <option value="featured">{isHi ? 'क्रम: प्रमुख' : 'Sort: Featured'}</option>
              <option value="price-asc">{isHi ? 'कीमत: कम से ज़्यादा' : 'Price: Low to High'}</option>
              <option value="price-desc">{isHi ? 'कीमत: ज़्यादा से कम' : 'Price: High to Low'}</option>
            </select>
          </div>
        </div>

        {/* Skeleton Loading or Product Cards */}
        {isFiltering ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl bg-white border border-slate-200 overflow-hidden animate-pulse"
              >
                <div className="aspect-[4/3] bg-slate-200" />
                <div className="p-4 space-y-3">
                  <div className="h-3 bg-slate-200 rounded w-1/2" />
                  <div className="h-4 bg-slate-200 rounded w-4/5" />
                  <div className="h-8 bg-slate-200 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="rounded-xl bg-white border border-slate-200 p-10 text-center space-y-3">
            <p className="text-sm font-semibold text-slate-700">
              {isHi
                ? 'आपके चुने गए फ़िल्टर के अनुसार कोई नमूना प्रोडक्ट नहीं मिला।'
                : 'No sample products matched your active filters.'}
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setMaxPrice(45000);
              }}
              className="px-4 py-2 rounded-lg bg-indigo-950 text-white text-xs font-bold cursor-pointer"
            >
              {isHi ? 'फ़िल्टर रीसेट करें' : 'Reset Filters'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {filteredProducts.map((product) => (
              <article
                key={product.id}
                className="group rounded-xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 overflow-hidden flex flex-col"
              >
                <button
                  type="button"
                  onClick={() => {
                    setActiveProduct(product);
                    setDetailQty(1);
                  }}
                  className="aspect-[4/3] overflow-hidden bg-slate-100 block w-full cursor-pointer text-left"
                >
                  <MahaImage
                    src={product.image}
                    alt={isHi ? product.nameHi : product.nameEn}
                    style={{ objectPosition: product.objectPosition }}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </button>

                <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-medium text-slate-500 truncate">
                      {isHi ? `विक्रेता: ${product.sellerHi}` : `Seller: ${product.sellerEn}`}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveProduct(product);
                        setDetailQty(1);
                      }}
                      className="text-left text-sm font-bold text-indigo-950 hover:text-orange-600 transition-colors line-clamp-2 cursor-pointer"
                    >
                      {isHi ? product.nameHi : product.nameEn}
                    </button>
                    <div className="flex items-baseline justify-between pt-0.5">
                      <span className="text-base font-extrabold text-slate-950 font-mono tabular-nums">
                        {formatINR(product.price)}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {isHi ? 'नमूना कीमत' : 'Sample price'}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => addToCart(product, 1, false)}
                    className="w-full py-2 px-3 rounded-lg bg-indigo-950 hover:bg-orange-500 text-white text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
                  >
                    {isHi ? 'कार्ट में डालें' : 'Add to Cart'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* TRUST FEATURE STRIP (Features Only — secure-payment.jpg & support.jpg) */}
      <section className="bg-white border-y border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50 flex flex-col">
              <div className="h-32 overflow-hidden bg-slate-200">
                <MahaImage
                  src="/demo/maha-bazaar/secure-payment.jpg"
                  alt={isHi ? 'सुरक्षित पेमेंट विकल्प' : 'Secure payment options'}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4 space-y-1">
                <div className="flex items-center gap-2 text-indigo-950 font-bold text-sm">
                  <ShieldCheck className="w-4 h-4 text-orange-500 shrink-0" />
                  <span>{isHi ? 'सुरक्षित पेमेंट' : 'Secure Payments'}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {isHi
                    ? 'UPI, डेबिट/क्रेडिट कार्ड और नेटबैंकिंग के लिए सुरक्षित चेकआउट संरचना।'
                    : 'Structured checkout ready for UPI, cards, and netbanking.'}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 flex flex-col justify-center space-y-2.5">
              <div className="w-10 h-10 rounded-lg bg-indigo-950 text-orange-400 flex items-center justify-center">
                <RotateCcw className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-indigo-950">
                {isHi ? 'आसान रिटर्न' : 'Easy Returns'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {isHi
                  ? 'ऑर्डर हिस्ट्री से सीधे रिटर्न अनुरोध, पिकअप शेड्यूलिंग और स्थिति ट्रैकिंग।'
                  : 'Clear return requests, reverse pickup scheduling, and status updates.'}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 flex flex-col justify-center space-y-2.5">
              <div className="w-10 h-10 rounded-lg bg-indigo-950 text-orange-400 flex items-center justify-center">
                <IndianRupee className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-indigo-950">
                {isHi ? 'कैश ऑन डिलीवरी (COD)' : 'Cash on Delivery (COD)'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {isHi
                  ? 'पिनकोड अनुसार COD विकल्प और डिलीवरी पर OTP पुष्टि फ़्लो।'
                  : 'Pincode-based COD eligibility with OTP verification on delivery.'}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50 flex flex-col">
              <div className="h-32 overflow-hidden bg-slate-200">
                <MahaImage
                  src="/demo/maha-bazaar/support.jpg"
                  alt={isHi ? 'ग्राहक सहायता केंद्र' : 'Customer support center'}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4 space-y-1">
                <div className="flex items-center gap-2 text-indigo-950 font-bold text-sm">
                  <Headphones className="w-4 h-4 text-orange-500 shrink-0" />
                  <span>{isHi ? 'सहायता केंद्र' : 'Support Center'}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {isHi
                    ? 'ग्राहक, विक्रेता और डिलीवरी प्रश्नों के लिए समर्पित टिकट डेस्क मॉड्यूल।'
                    : 'Dedicated helpdesk workflow for customer, seller, and delivery queries.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 12 PLATFORM FEATURES SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="max-w-2xl mb-8 space-y-2">
          <p className="text-xs font-bold text-orange-600">
            {isHi ? 'एंटरप्राइज़ प्लेटफ़ॉर्म क्षमताएँ' : 'Enterprise Platform Capabilities'}
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-indigo-950">
            {isHi
              ? 'एक संपूर्ण मल्टी-वेंडर मार्केटप्लेस के 12 प्रमुख फ़ीचर'
              : '12 Core Features of a Multi-Vendor Marketplace'}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLATFORM_FEATURES.map((feat, idx) => {
            const Icon = FEATURE_ICONS[idx % FEATURE_ICONS.length];
            return (
              <div
                key={feat.id}
                className="rounded-xl bg-white border border-slate-200 p-4 space-y-2 hover:border-indigo-300 transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-900 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-orange-600" />
                </div>
                <h3 className="text-sm font-bold text-indigo-950">
                  {isHi ? feat.titleHi : feat.titleEn}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {isHi ? feat.descHi : feat.descEn}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* PACKAGES SECTION (3 Cards — Explicitly Labeled Sample Pricing) */}
      <section className="bg-white border-y border-slate-200 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-9">
            <div className="space-y-1.5 max-w-2xl">
              <p className="text-xs font-bold text-orange-600">
                {isHi ? 'प्लेटफ़ॉर्म पैकेज' : 'Platform Packages'}
              </p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-indigo-950">
                {isHi
                  ? 'आपके मार्केटप्लेस विज़न के अनुरूप मॉडल'
                  : 'Scalable Marketplace Build Packages'}
              </h2>
            </div>
            <span className="px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-xs font-mono font-bold text-amber-900 w-fit">
              {isHi ? 'नमूना कीमतें — डेमो' : 'Sample Pricing — Demo Only'}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            {PLATFORM_PACKAGES.map((pkg) => (
              <div
                key={pkg.id}
                className={`rounded-2xl p-6 flex flex-col justify-between gap-6 ${
                  pkg.popular
                    ? 'bg-indigo-950 text-white border border-indigo-900 shadow-lg'
                    : 'bg-slate-50 text-slate-900 border border-slate-200'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xl font-extrabold">
                      {isHi ? pkg.nameHi : pkg.nameEn}
                    </h3>
                    {pkg.popular && (
                      <span className="text-xs font-bold text-orange-300">
                        {isHi ? 'लोकप्रिय' : 'Popular'}
                      </span>
                    )}
                  </div>
                  <div className="text-3xl font-extrabold font-mono tabular-nums">
                    {isHi ? pkg.priceHi : pkg.priceEn}
                  </div>
                  <p
                    className={`text-sm leading-relaxed ${
                      pkg.popular ? 'text-indigo-200' : 'text-slate-600'
                    }`}
                  >
                    {isHi ? pkg.summaryHi : pkg.summaryEn}
                  </p>
                  <ul className="space-y-2 pt-3 border-t border-current/10">
                    {(isHi ? pkg.featuresHi : pkg.featuresEn).map((feat) => (
                      <li key={feat} className="flex items-start gap-2 text-sm">
                        <CheckCircle2
                          className={`w-4 h-4 shrink-0 mt-0.5 ${
                            pkg.popular ? 'text-orange-400' : 'text-indigo-700'
                          }`}
                        />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => scrollToEl('mb-contact')}
                  className={`w-full py-2.5 px-4 rounded-lg text-sm font-bold transition-colors cursor-pointer ${
                    pkg.popular
                      ? 'bg-orange-500 hover:bg-orange-600 text-white'
                      : 'bg-indigo-950 hover:bg-indigo-900 text-white'
                  }`}
                >
                  {isHi ? 'जानकारी पूछें' : 'Inquire Sample Plan'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT SECTION (Local Validated Form + Demo Contact Info) */}
      <section id="mb-contact" className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 space-y-5">
            <div className="space-y-1.5">
              <p className="text-xs font-bold text-orange-600">
                {isHi ? 'प्लेटफ़ॉर्म संपर्क फ़ॉर्म' : 'Platform Inquiry Form'}
              </p>
              <h2 className="text-2xl font-extrabold text-indigo-950">
                {isHi ? 'अपने मार्केटप्लेस प्रोजेक्ट की चर्चा करें' : 'Discuss Your Marketplace Project'}
              </h2>
              <p className="text-xs text-slate-500">
                {isHi
                  ? 'यह केवल डेमो फ़ॉर्म है — सबमिट करने पर कोई डेटा सेव या प्रेषित नहीं होता।'
                  : 'Local demo form only — submitting does not save or transmit data.'}
              </p>
            </div>

            <form onSubmit={handleContactSubmit} noValidate className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="mb-c-name" className="block text-xs font-bold text-slate-700 mb-1">
                    {isHi ? 'नाम *' : 'Name *'}
                  </label>
                  <input
                    id="mb-c-name"
                    type="text"
                    value={contactName}
                    onChange={(e) => {
                      setContactName(e.target.value);
                      setContactSuccess(false);
                    }}
                    placeholder={isHi ? 'आपका नाम' : 'Your full name'}
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-700"
                  />
                </div>
                <div>
                  <label htmlFor="mb-c-company" className="block text-xs font-bold text-slate-700 mb-1">
                    {isHi ? 'कंपनी *' : 'Company *'}
                  </label>
                  <input
                    id="mb-c-company"
                    type="text"
                    value={contactCompany}
                    onChange={(e) => {
                      setContactCompany(e.target.value);
                      setContactSuccess(false);
                    }}
                    placeholder={isHi ? 'कंपनी का नाम' : 'Company name'}
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="mb-c-phone" className="block text-xs font-bold text-slate-700 mb-1">
                    {isHi ? 'मोबाइल *' : 'Mobile *'}
                  </label>
                  <input
                    id="mb-c-phone"
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => {
                      setContactPhone(e.target.value);
                      setContactSuccess(false);
                    }}
                    placeholder="+91 90000 00000"
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm font-mono focus:outline-none focus:border-indigo-700"
                  />
                </div>
                <div>
                  <label htmlFor="mb-c-type" className="block text-xs font-bold text-slate-700 mb-1">
                    {isHi ? 'किस तरह का प्लेटफ़ॉर्म' : 'Platform Type'}
                  </label>
                  <select
                    id="mb-c-type"
                    value={contactType}
                    onChange={(e) => setContactType(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-700"
                  >
                    <option value="multi-vendor">
                      {isHi ? 'मल्टी-वेंडर मार्केटप्लेस' : 'Multi-Vendor Marketplace'}
                    </option>
                    <option value="b2b-wholesale">
                      {isHi ? 'B2B थोक पोर्टल' : 'B2B Wholesale Portal'}
                    </option>
                    <option value="hyperlocal">
                      {isHi ? 'हाइपरलोकल किराना / डिलीवरी' : 'Hyperlocal Grocery & Delivery'}
                    </option>
                    <option value="custom-enterprise">
                      {isHi ? 'कस्टम एंटरप्राइज़ प्लेटफ़ॉर्म' : 'Custom Enterprise Platform'}
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="mb-c-budget" className="block text-xs font-bold text-slate-700 mb-1">
                  {isHi ? 'अनुमानित बजट रेंज (नमूना)' : 'Estimated Budget Range (Sample)'}
                </label>
                <select
                  id="mb-c-budget"
                  value={contactBudget}
                  onChange={(e) => setContactBudget(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-700"
                >
                  <option value="5-10L">{isHi ? '₹5 लाख – ₹10 लाख' : '₹5L – ₹10L'}</option>
                  <option value="10-20L">{isHi ? '₹10 लाख – ₹20 लाख' : '₹10L – ₹20L'}</option>
                  <option value="20L+">{isHi ? '₹20 लाख से अधिक (फ़्लैगशिप)' : '₹20L+ (Flagship)'}</option>
                </select>
              </div>

              {contactError && (
                <div role="alert" className="rounded-lg bg-rose-50 border border-rose-200 px-3.5 py-2.5 text-xs font-semibold text-rose-700">
                  {contactError}
                </div>
              )}

              {contactSuccess && (
                <div role="status" className="rounded-lg bg-emerald-50 border border-emerald-200 px-3.5 py-3 text-sm font-semibold text-emerald-800 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    {isHi
                      ? 'डेमो: फ़ॉर्म ठीक से भरा गया। यह नमूना है, कोई संदेश नहीं भेजा गया।'
                      : 'Demo: Form validated successfully. This is a sample preview, no message was sent.'}
                  </span>
                </div>
              )}

              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-950 hover:bg-orange-500 text-white text-sm font-bold transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{isHi ? 'डेमो फ़ॉर्म सबमिट करें' : 'Submit Demo Form'}</span>
              </button>
            </form>
          </div>

          <div className="lg:col-span-5 rounded-2xl bg-white border border-slate-200 p-6 sm:p-7 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3.5">
              <h3 className="text-lg font-extrabold text-indigo-950">
                {isHi ? 'संपर्क जानकारी' : 'Contact Information'}
              </h3>
              <span className="text-xs font-mono font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                {isHi ? 'डेमो जानकारी' : 'Demo Info'}
              </span>
            </div>

            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-orange-500 mt-1 shrink-0" />
                <div>
                  <div className="text-xs text-slate-500">{isHi ? 'फ़ोन (डेमो)' : 'Phone (Demo)'}</div>
                  <div className="font-mono font-bold text-indigo-950">+91 90000 00000</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-orange-500 mt-1 shrink-0" />
                <div>
                  <div className="text-xs text-slate-500">{isHi ? 'ईमेल (डेमो)' : 'Email (Demo)'}</div>
                  <div className="font-mono font-bold text-indigo-950 break-all">
                    hello@mahabazaar.example
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Building2 className="w-4 h-4 text-orange-500 mt-1 shrink-0" />
                <div>
                  <div className="text-xs text-slate-500">{isHi ? 'मल्टी-रोल प्रीव्यू' : 'Multi-Role Preview'}</div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {isHi
                      ? 'ऊपर दिए गए रोल स्विचर से ग्राहक, विक्रेता, डिलीवरी और एडमिन — चारों पोर्टल लाइव आज़माकर देखें।'
                      : 'Use the Role Switcher above to explore all 4 portals: Customer, Seller, Delivery, and Admin.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRODUCT DETAIL MODAL */}
      {activeProduct && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setActiveProduct(null)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-2xl grid grid-cols-1 md:grid-cols-12"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="md:col-span-6 aspect-[4/3] md:aspect-auto bg-slate-100">
              <MahaImage
                src={activeProduct.image}
                alt={isHi ? activeProduct.nameHi : activeProduct.nameEn}
                style={{ objectPosition: activeProduct.objectPosition }}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="md:col-span-6 p-6 flex flex-col justify-between gap-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-semibold text-orange-600">
                    {isHi ? `विक्रेता: ${activeProduct.sellerHi}` : `Seller: ${activeProduct.sellerEn}`}
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveProduct(null)}
                    aria-label={isHi ? 'बंद करें' : 'Close'}
                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="text-xl font-extrabold text-indigo-950">
                  {isHi ? activeProduct.nameHi : activeProduct.nameEn}
                </h3>

                <div className="text-2xl font-extrabold font-mono text-slate-950 tabular-nums">
                  {formatINR(activeProduct.price)}
                </div>

                <p className="text-sm text-slate-600 leading-relaxed">
                  {isHi ? activeProduct.descriptionHi : activeProduct.descriptionEn}
                </p>

                <div className="flex items-center gap-3 pt-1">
                  <span className="text-xs font-bold text-slate-600">
                    {isHi ? 'मात्रा:' : 'Quantity:'}
                  </span>
                  <div className="inline-flex items-center rounded-lg border border-slate-300">
                    <button
                      type="button"
                      onClick={() => setDetailQty((q) => Math.max(1, q - 1))}
                      className="p-2 hover:bg-slate-100 cursor-pointer"
                      aria-label="Decrease"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 text-sm font-mono font-bold tabular-nums">{detailQty}</span>
                    <button
                      type="button"
                      onClick={() => setDetailQty((q) => Math.min(10, q + 1))}
                      className="p-2 hover:bg-slate-100 cursor-pointer"
                      aria-label="Increase"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    addToCart(activeProduct, detailQty, false);
                    setActiveProduct(null);
                  }}
                  className="py-2.5 px-3 rounded-lg border border-indigo-950 text-indigo-950 hover:bg-indigo-50 text-xs font-bold cursor-pointer"
                >
                  {isHi ? 'कार्ट में डालें' : 'Add to Cart'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    addToCart(activeProduct, detailQty, false);
                    setActiveProduct(null);
                    setCheckoutStep(1);
                    setCartOpen(true);
                  }}
                  className="py-2.5 px-3 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold cursor-pointer"
                >
                  {isHi ? 'अभी खरीदें' : 'Buy Now'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SLIDE-OVER CART & 3-STEP CHECKOUT DRAWER */}
      {cartOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-xs flex justify-end"
          role="dialog"
          aria-modal="true"
          onClick={() => setCartOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white h-full flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="px-5 py-4 bg-indigo-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-orange-400" />
                <h3 className="text-sm font-extrabold">
                  {checkoutStep === 0
                    ? isHi
                      ? `शॉपिंग कार्ट (${cartCount})`
                      : `Shopping Cart (${cartCount})`
                    : checkoutStep === 4
                    ? isHi
                      ? 'डेमो ऑर्डर पुष्टि'
                      : 'Demo Order Confirmed'
                    : isHi
                    ? `चेकआउट — चरण ${checkoutStep} / 3`
                    : `Checkout — Step ${checkoutStep} of 3`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCartOpen(false)}
                aria-label={isHi ? 'बंद करें' : 'Close'}
                className="p-1.5 rounded-lg hover:bg-indigo-900 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Step Indicator during Checkout */}
            {checkoutStep >= 1 && checkoutStep <= 3 && (
              <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-semibold">
                {[
                  { s: 1, hi: '1. पता', en: '1. Address' },
                  { s: 2, hi: '2. पेमेंट', en: '2. Payment' },
                  { s: 3, hi: '3. सारांश', en: '3. Summary' },
                ].map((st) => (
                  <span
                    key={st.s}
                    className={
                      checkoutStep === st.s
                        ? 'text-orange-600 font-extrabold'
                        : checkoutStep > st.s
                        ? 'text-emerald-700'
                        : 'text-slate-400'
                    }
                  >
                    {isHi ? st.hi : st.en}
                  </span>
                ))}
              </div>
            )}

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {checkoutStep === 0 && (
                <>
                  {cart.length === 0 ? (
                    <div className="py-16 text-center space-y-3">
                      <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto" />
                      <p className="text-sm font-semibold text-slate-600">
                        {isHi ? 'आपका डेमो कार्ट अभी खाली है।' : 'Your demo cart is empty.'}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3">
                        {cart.map((item) => (
                          <div
                            key={item.product.id}
                            className="flex gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50"
                          >
                            <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-200 shrink-0">
                              <MahaImage
                                src={item.product.image}
                                alt={isHi ? item.product.nameHi : item.product.nameEn}
                                style={{ objectPosition: item.product.objectPosition }}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-bold text-indigo-950 truncate">
                                {isHi ? item.product.nameHi : item.product.nameEn}
                              </div>
                              <div className="text-xs font-mono font-extrabold text-slate-900 mt-0.5 tabular-nums">
                                {formatINR(item.product.price * item.quantity)}
                              </div>
                              <div className="flex items-center justify-between mt-2">
                                <div className="inline-flex items-center rounded border border-slate-300 bg-white">
                                  <button
                                    type="button"
                                    onClick={() => updateCartQty(item.product.id, -1)}
                                    className="px-2 py-1 hover:bg-slate-100 cursor-pointer"
                                    aria-label="Decrease"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <span className="px-2.5 text-xs font-mono font-bold tabular-nums">
                                    {item.quantity}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => updateCartQty(item.product.id, 1)}
                                    className="px-2 py-1 hover:bg-slate-100 cursor-pointer"
                                    aria-label="Increase"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => updateCartQty(item.product.id, -item.quantity)}
                                  className="text-slate-400 hover:text-rose-600 cursor-pointer"
                                  aria-label={isHi ? 'हटाएँ' : 'Remove'}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Coupon Input */}
                      <div className="rounded-xl border border-slate-200 p-3.5 space-y-2 bg-slate-50">
                        <label htmlFor="mb-coupon" className="block text-xs font-bold text-indigo-950">
                          {isHi ? 'कूपन कोड (DEMO10 आज़माएँ)' : 'Coupon Code (Try DEMO10)'}
                        </label>
                        <div className="flex gap-2">
                          <input
                            id="mb-coupon"
                            type="text"
                            value={couponInput}
                            onChange={(e) => setCouponInput(e.target.value)}
                            placeholder="DEMO10"
                            className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-mono uppercase focus:outline-none focus:border-indigo-700"
                          />
                          <button
                            type="button"
                            onClick={handleApplyCoupon}
                            className="px-3.5 py-1.5 rounded-lg bg-indigo-950 text-white text-xs font-bold hover:bg-orange-500 transition-colors cursor-pointer"
                          >
                            {isHi ? 'लागू करें' : 'Apply'}
                          </button>
                        </div>
                        {couponFeedback && (
                          <p className="text-[11px] font-medium text-indigo-800">{couponFeedback}</p>
                        )}
                      </div>

                      {/* Totals */}
                      <div className="space-y-1.5 text-sm border-t border-slate-200 pt-3">
                        <div className="flex justify-between text-slate-600">
                          <span>{isHi ? 'उप-योग' : 'Subtotal'}</span>
                          <span className="font-mono tabular-nums">{formatINR(subtotal)}</span>
                        </div>
                        {discountAmount > 0 && (
                          <div className="flex justify-between text-emerald-700 font-semibold">
                            <span>
                              {isHi ? `कूपन छूट (${appliedCoupon?.code})` : `Discount (${appliedCoupon?.code})`}
                            </span>
                            <span className="font-mono tabular-nums">-{formatINR(discountAmount)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-slate-600">
                          <span>{isHi ? 'डिलीवरी शुल्क (नमूना)' : 'Delivery Fee (Sample)'}</span>
                          <span className="font-mono tabular-nums">{formatINR(deliveryFee)}</span>
                        </div>
                        <div className="flex justify-between text-base font-extrabold text-indigo-950 pt-2 border-t border-slate-200">
                          <span>{isHi ? 'कुल योग' : 'Total'}</span>
                          <span className="font-mono tabular-nums">{formatINR(grandTotal)}</span>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}

              {checkoutStep === 1 && (
                <div className="space-y-3.5">
                  <p className="text-xs text-slate-500">
                    {isHi
                      ? 'यह डेमो पता फ़ॉर्म है — कोई जानकारी सेव नहीं होती।'
                      : 'Sample shipping form — nothing is stored.'}
                  </p>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isHi ? 'पूरा नाम *' : 'Full Name *'}
                    </label>
                    <input
                      type="text"
                      value={shipName}
                      onChange={(e) => setShipName(e.target.value)}
                      placeholder={isHi ? 'रोहित शर्मा' : 'Rohit Sharma'}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isHi ? 'मोबाइल नंबर *' : 'Mobile Number *'}
                    </label>
                    <input
                      type="tel"
                      value={shipPhone}
                      onChange={(e) => setShipPhone(e.target.value)}
                      placeholder="9876543210"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isHi ? 'डिलीवरी पता *' : 'Delivery Address *'}
                    </label>
                    <textarea
                      rows={3}
                      value={shipAddress}
                      onChange={(e) => setShipAddress(e.target.value)}
                      placeholder={isHi ? 'मकान नंबर, मोहल्ला, शहर' : 'House No, Street, City'}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isHi ? 'पिनकोड' : 'Pincode'}
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={shipPincode}
                      onChange={(e) => setShipPincode(e.target.value.replace(/\D/g, ''))}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono"
                    />
                  </div>
                  {checkoutError && (
                    <div className="rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700">
                      {checkoutError}
                    </div>
                  )}
                </div>
              )}

              {checkoutStep === 2 && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                    {isHi
                      ? 'सिर्फ़ डेमो चयन — कोई असली पेमेंट गेटवे नहीं जुड़ा है।'
                      : 'Demo selection only — no real payment gateway is connected.'}
                  </p>
                  {(
                    [
                      { id: 'UPI', hi: 'UPI (नमूना विकल्प)', en: 'UPI (Sample Option)' },
                      { id: 'CARD', hi: 'डेबिट / क्रेडिट कार्ड (नमूना)', en: 'Debit / Credit Card (Sample)' },
                      { id: 'COD', hi: 'कैश ऑन डिलीवरी (COD)', en: 'Cash on Delivery (COD)' },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setPaymentMethod(opt.id)}
                      className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between cursor-pointer ${
                        paymentMethod === opt.id
                          ? 'border-orange-500 bg-orange-50 text-indigo-950 font-bold'
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      <span className="text-sm">{isHi ? opt.hi : opt.en}</span>
                      <span className="text-xs font-mono">{opt.id}</span>
                    </button>
                  ))}
                </div>
              )}

              {checkoutStep === 3 && (
                <div className="space-y-4">
                  <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-2 text-xs">
                    <div className="font-bold text-indigo-950">
                      {isHi ? 'डिलीवरी विवरण' : 'Delivery Summary'}
                    </div>
                    <div className="text-slate-700">
                      {shipName} · {shipPhone}
                    </div>
                    <div className="text-slate-600">
                      {shipAddress} ({shipPincode})
                    </div>
                    <div className="pt-1 font-semibold text-orange-700">
                      {isHi ? `पेमेंट मोड (नमूना): ${paymentMethod}` : `Payment Mode (Sample): ${paymentMethod}`}
                    </div>
                  </div>
                  <div className="rounded-xl bg-indigo-50 border border-indigo-200 p-4 flex items-center justify-between">
                    <span className="text-sm font-bold text-indigo-950">
                      {isHi ? 'कुल नमूना राशि' : 'Sample Total'}
                    </span>
                    <span className="text-lg font-extrabold font-mono text-indigo-950 tabular-nums">
                      {formatINR(grandTotal)}
                    </span>
                  </div>
                </div>
              )}

              {checkoutStep === 4 && placedOrderId && (
                <div className="py-6 text-center space-y-4">
                  <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <PackageCheck className="w-7 h-7" />
                  </div>
                  <h4 className="text-lg font-extrabold text-indigo-950">
                    {isHi ? 'डेमो ऑर्डर — कोई पेमेंट नहीं हुआ' : 'Demo Order — No Payment Processed'}
                  </h4>
                  <div className="inline-block px-4 py-2 rounded-lg bg-slate-100 border border-slate-200 font-mono text-sm font-bold text-indigo-950">
                    {isHi ? 'नमूना ऑर्डर ID:' : 'Sample Order ID:'} {placedOrderId}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {isHi
                      ? 'यह ऑर्डर केवल आपके ब्राउज़र सेशन में बना है। आप इसे डिलीवरी टैब में ट्रैक करके देख सकते हैं।'
                      : 'This sample order lives only in your browser state. You can track it right away in the Delivery view.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setCartOpen(false);
                      onTrackOrder(placedOrderId);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold cursor-pointer"
                  >
                    <Truck className="w-4 h-4" />
                    <span>{isHi ? 'डिलीवरी टैब में ट्रैक करें' : 'Track in Delivery View'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Drawer Footer Controls */}
            {checkoutStep < 4 && cart.length > 0 && (
              <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center gap-2.5">
                {checkoutStep > 0 && (
                  <button
                    type="button"
                    onClick={() => setCheckoutStep((s) => (s - 1) as 0 | 1 | 2 | 3)}
                    className="px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-700 cursor-pointer"
                  >
                    {isHi ? 'पीछे' : 'Back'}
                  </button>
                )}

                {checkoutStep === 0 && (
                  <button
                    type="button"
                    onClick={() => setCheckoutStep(1)}
                    className="flex-1 py-2.5 px-4 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold cursor-pointer"
                  >
                    {isHi ? 'चेकआउट करें' : 'Proceed to Checkout'}
                  </button>
                )}
                {checkoutStep === 1 && (
                  <button
                    type="button"
                    onClick={handleProceedFromAddress}
                    className="flex-1 py-2.5 px-4 rounded-lg bg-indigo-950 hover:bg-indigo-900 text-white text-sm font-bold cursor-pointer"
                  >
                    {isHi ? 'पेमेंट विकल्प चुनें' : 'Continue to Payment'}
                  </button>
                )}
                {checkoutStep === 2 && (
                  <button
                    type="button"
                    onClick={() => setCheckoutStep(3)}
                    className="flex-1 py-2.5 px-4 rounded-lg bg-indigo-950 hover:bg-indigo-900 text-white text-sm font-bold cursor-pointer"
                  >
                    {isHi ? 'सारांश देखें' : 'Review Summary'}
                  </button>
                )}
                {checkoutStep === 3 && (
                  <button
                    type="button"
                    onClick={handlePlaceDemoOrder}
                    className="flex-1 py-2.5 px-4 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold cursor-pointer"
                  >
                    {isHi ? 'डेमो ऑर्डर पूरा करें' : 'Place Demo Order'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
