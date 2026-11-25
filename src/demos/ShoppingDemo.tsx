import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { DemoPriceBar } from '../components/DemoPriceBar';
import { DemoLanguageToggle } from '../components/common/DemoLanguageToggle';
import {
  ArrowLeft,
  ArrowRight,
  Search,
  ShoppingBag,
  Heart,
  User,
  Home,
  LayoutGrid,
  Plus,
  Minus,
  Trash2,
  X,
  CheckCircle2,
  Truck,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Package,
  CreditCard,
  Smartphone,
  Banknote,
  RotateCcw,
} from 'lucide-react';

interface ShoppingDemoProps {
  onBackToHome: () => void;
  onRequestQuote: () => void;
}

type StoreView =
  | 'home'
  | 'categories'
  | 'product'
  | 'wishlist'
  | 'cart'
  | 'address'
  | 'payment'
  | 'success'
  | 'account';

type CategoryKey =
  | 'all'
  | 'clothing'
  | 'saree'
  | 'bags'
  | 'footwear'
  | 'home-decor'
  | 'kitchen';

type SortOption = 'newest' | 'price-asc' | 'price-desc';

interface StoreProduct {
  id: string;
  category: Exclude<CategoryKey, 'all'>;
  image: string;
  nameHi: string;
  nameEn: string;
  price: number;
  mrp: number;
  sizes?: string[];
  materialHi: string;
  materialEn: string;
  descriptionHi: string;
  descriptionEn: string;
  specsHi: string[];
  specsEn: string[];
  addedOrder: number;
}

interface CartItem {
  key: string;
  product: StoreProduct;
  size?: string;
  quantity: number;
}

interface AddressForm {
  name: string;
  mobile: string;
  address: string;
  city: string;
  pincode: string;
}

interface AddressErrors {
  name?: string;
  mobile?: string;
  address?: string;
  city?: string;
  pincode?: string;
}

interface DemoOrderRecord {
  orderNumber: string;
  createdAt: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  address: AddressForm;
  paymentMethod: 'COD' | 'UPI' | 'CARD';
}

const FREE_DELIVERY_MIN = 999;
const STANDARD_DELIVERY = 49;

const STORE_PRODUCTS: StoreProduct[] = [
  {
    id: 'indigo-cotton-kurta',
    category: 'clothing',
    image: '/demo/shopping/kurta.jpg',
    nameHi: 'इंडिगो कॉटन कुर्ता',
    nameEn: 'Indigo Cotton Kurta',
    price: 899,
    mrp: 1299,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    materialHi: '100% हैंडब्लॉक कॉटन',
    materialEn: '100% Hand-Block Cotton',
    descriptionHi:
      'प्राकृतिक इंडिगो रंग में हाथ से छपा हुआ हल्का और आरामदायक शुद्ध कॉटन कुर्ता। रोज़मर्रा के उपयोग और त्योहारों दोनों के लिए बेहतरीन।',
    descriptionEn:
      'Breathable pure cotton kurta finished in natural indigo hand-block print with a clean mandarin collar for daily and festive wear.',
    specsHi: [
      'मुलायम 100% सूती कपड़ा',
      'मैन्डरिन कॉलर और साइड पॉकेट',
      'ठंडे पानी में आसान धुलाई',
      'रेगुलर कम्फ़र्ट फ़िट',
    ],
    specsEn: [
      'Soft 100% pure cotton weave',
      'Mandarin collar with side pockets',
      'Gentle cold hand or machine wash',
      'Regular comfort fit',
    ],
    addedOrder: 6,
  },
  {
    id: 'handloom-saree',
    category: 'saree',
    image: '/demo/shopping/saree.jpg',
    nameHi: 'हैंडलूम साड़ी',
    nameEn: 'Handloom Saree',
    price: 2499,
    mrp: 3199,
    sizes: ['Free Size'],
    materialHi: 'करघा कॉटन-सिल्क ब्लेंड',
    materialEn: 'Handloom Cotton-Silk Blend',
    descriptionHi:
      'पारंपरिक करघे पर बुनी गई गहरे लाल रंग की साड़ी, बारीक सुनहरी ज़री बॉर्डर और मैचिंग अनस्टिच्ड ब्लाउज़ पीस के साथ।',
    descriptionEn:
      'Traditionally woven crimson handloom saree featuring an intricate golden zari border, pallu tassels, and matching unstitched blouse piece.',
    specsHi: [
      'लंबाई: 5.5 मीटर साड़ी + 0.8 मीटर ब्लाउज़ पीस',
      'पारंपरिक बुना हुआ ज़री पल्लू',
      'हल्का और सुंदर ड्रेप',
      'ड्राई क्लीन अनुशंसित',
    ],
    specsEn: [
      'Length: 5.5m saree + 0.8m blouse piece',
      'Traditional woven golden zari pallu',
      'Lightweight, structured drape',
      'Dry clean recommended',
    ],
    addedOrder: 5,
  },
  {
    id: 'leather-handbag',
    category: 'bags',
    image: '/demo/shopping/handbag.jpg',
    nameHi: 'लेदर हैंडबैग',
    nameEn: 'Leather Handbag',
    price: 1599,
    mrp: 2199,
    materialHi: 'हैंडस्टिच्ड टैन लेदर',
    materialEn: 'Hand-Stitched Tan Leather',
    descriptionHi:
      'ऑफ़िस, कॉलेज और यात्रा के लिए मज़बूत टैन लेदर टोट हैंडबैग। अंदर ज़िपर पॉकेट, मोबाइल स्लॉट और पीतल की टिकाऊ फिटिंग।',
    descriptionEn:
      'Structured tan leather tote handbag built for work and travel with interior zip organizer pockets and solid brushed brass hardware.',
    specsHi: [
      'मज़बूत पीतल बकल और स्मूद ज़िपर',
      '13-इंच लैपटॉप व ज़रूरी सामान के लिए पर्याप्त जगह',
      'अंदर टिकाऊ सूती अस्तर',
      'आरामदायक शोल्डर हैंडल',
    ],
    specsEn: [
      'Brushed brass hardware and smooth zip closure',
      'Spacious interior fits daily essentials & 13-inch notebook',
      'Durable cotton inner lining',
      'Reinforced double shoulder straps',
    ],
    addedOrder: 4,
  },
  {
    id: 'canvas-sneakers',
    category: 'footwear',
    image: '/demo/shopping/sneakers.jpg',
    nameHi: 'कैनवस स्नीकर्स',
    nameEn: 'Canvas Sneakers',
    price: 1199,
    mrp: 1599,
    sizes: ['UK 6', 'UK 7', 'UK 8', 'UK 9', 'UK 10'],
    materialHi: 'ऑर्गेनिक कैनवस व रबर सोल',
    materialEn: 'Organic Canvas & Rubber Sole',
    descriptionHi:
      'दिनभर आराम से चलने के लिए हल्के कैनवस लो-टॉप स्नीकर्स, मुलायम कुशन इनसोल और फिसलन-रोधी सफेद रबर सोल के साथ।',
    descriptionEn:
      'Lightweight everyday organic canvas low-top sneakers engineered with cushioned insoles and flexible non-slip white rubber soles.',
    specsHi: [
      'हवादार ऑर्गेनिक कॉटन कैनवस अपर',
      'मुलायम कुशन फ़ुटबेड',
      'मज़बूत एंटी-स्लिप रबर आउटसोल',
      'कॉटन लेस और पीतल आईलेट्स',
    ],
    specsEn: [
      'Breathable organic cotton canvas upper',
      'Soft cushioned footbed for all-day wear',
      'Flexible anti-slip rubber outsole',
      'Woven cotton laces with brass eyelets',
    ],
    addedOrder: 3,
  },
  {
    id: 'brass-diya',
    category: 'home-decor',
    image: '/demo/shopping/diya.jpg',
    nameHi: 'पीतल दीया',
    nameEn: 'Brass Diya',
    price: 749,
    mrp: 999,
    materialHi: 'शुद्ध हस्तनिर्मित पीतल',
    materialEn: 'Solid Handcrafted Brass',
    descriptionHi:
      'पारंपरिक नक्काशी वाला ठोस पीतल का दीया, पूजा घर, दीवाली और शुभ अवसरों की सजावट के लिए आदर्श।',
    descriptionEn:
      'Finely etched solid brass traditional oil lamp handcrafted for home temples, Diwali lighting, and festive gifting.',
    specsHi: [
      'ठोस और भारी पीतल निर्माण',
      'लंबे समय तक जलने के लिए गहरी कटोरी',
      'बारीक पारंपरिक नक्काशी',
      'आसान सफ़ाई और टिकाऊ चमक',
    ],
    specsEn: [
      'Heavy-gauge solid brass craftsmanship',
      'Deep oil bowl for longer flame duration',
      'Detailed traditional ethnic etching',
      'Easy to clean and polish',
    ],
    addedOrder: 2,
  },
  {
    id: 'coffee-mug-set',
    category: 'kitchen',
    image: '/demo/shopping/mugs.jpg',
    nameHi: 'कॉफ़ी मग सेट',
    nameEn: 'Coffee Mug Set',
    price: 599,
    mrp: 799,
    materialHi: 'हैंडग्लेज़्ड स्टोनवेयर सिरेमिक',
    materialEn: 'Hand-Glazed Stoneware Ceramic',
    descriptionHi:
      'चाय और कॉफ़ी के लिए 2 हस्तनिर्मित स्टोनवेयर सिरेमिक मग का सेट, मिट्टी के प्राकृतिक रंग और आरामदायक ग्रिप हैंडल के साथ।',
    descriptionEn:
      'Set of 2 artisan-glazed stoneware ceramic mugs in earthy terracotta and speckled cream tones with comfortable wide handles.',
    specsHi: [
      '2 मग का सेट (प्रत्येक 300 ml)',
      'माइक्रोवेव और डिशवॉशर सुरक्षित',
      'गर्मी को देर तक बनाए रखे',
      'लीड-फ्री फ़ूड-सेफ़ ग्लेज़',
    ],
    specsEn: [
      'Set of 2 mugs (300 ml capacity each)',
      'Microwave and dishwasher safe',
      'Thick ceramic retains warmth longer',
      'Lead-free food-safe glaze',
    ],
    addedOrder: 1,
  },
];

const CATEGORY_CIRCLES: {
  id: Exclude<CategoryKey, 'all'>;
  labelHi: string;
  labelEn: string;
  image: string;
}[] = [
  { id: 'clothing', labelHi: 'कपड़े', labelEn: 'Clothing', image: '/demo/shopping/kurta.jpg' },
  { id: 'saree', labelHi: 'साड़ी', labelEn: 'Sarees', image: '/demo/shopping/saree.jpg' },
  { id: 'bags', labelHi: 'बैग', labelEn: 'Bags', image: '/demo/shopping/handbag.jpg' },
  { id: 'footwear', labelHi: 'जूते', labelEn: 'Footwear', image: '/demo/shopping/sneakers.jpg' },
  { id: 'home-decor', labelHi: 'घर सजावट', labelEn: 'Home Decor', image: '/demo/shopping/diya.jpg' },
  { id: 'kitchen', labelHi: 'किचन', labelEn: 'Kitchen', image: '/demo/shopping/mugs.jpg' },
];

const OFFER_SLIDES = [
  {
    id: 'diwali-sale',
    tagHi: 'त्योहार विशेष',
    tagEn: 'Festive Offer',
    titleHi: 'दीवाली सेल — 30% तक छूट',
    titleEn: 'Diwali Sale — Up to 30% Off',
    subHi: 'कपड़े, हैंडलूम, बैग और घर सजावट पर आकर्षक दाम',
    subEn: 'Handcrafted fashion, home decor & kitchen essentials',
    ctaHi: 'ऑफ़र देखें',
    ctaEn: 'Shop Offers',
    bgImage: '/demo/shopping/hero.jpg',
    featureImage: '/demo/shopping/diya.jpg',
    targetCategory: 'all' as CategoryKey,
  },
  {
    id: 'handloom-collection',
    tagHi: 'नया कलेक्शन',
    tagEn: 'New Arrivals',
    titleHi: 'हैंडलूम कलेक्शन',
    titleEn: 'Handloom Collection',
    subHi: 'शुद्ध इंडिगो कॉटन कुर्ता और ज़री बॉर्डर हैंडलूम साड़ियाँ',
    subEn: 'Pure indigo block-print kurtas & woven zari sarees',
    ctaHi: 'कलेक्शन देखें',
    ctaEn: 'Explore Handloom',
    bgImage: '/demo/shopping/saree.jpg',
    featureImage: '/demo/shopping/kurta.jpg',
    targetCategory: 'saree' as CategoryKey,
  },
  {
    id: 'free-delivery',
    tagHi: 'फ़ास्ट शिपिंग',
    tagEn: 'Fast Shipping',
    titleHi: '₹999 से ऊपर मुफ़्त डिलीवरी',
    titleEn: 'Free Delivery Above ₹999',
    subHi: 'पूरे भारत में सुरक्षित पैकिंग और आसान वापसी सुविधा (नमूना)',
    subEn: 'Safe packaging & easy 7-day sample returns across India',
    ctaHi: 'अभी खरीदें',
    ctaEn: 'Shop Now',
    bgImage: '/demo/shopping/handbag.jpg',
    featureImage: '/demo/shopping/sneakers.jpg',
    targetCategory: 'bags' as CategoryKey,
  },
];

function formatInr(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

function getDiscountPercent(price: number, mrp: number): number {
  if (mrp <= price) return 0;
  return Math.round(((mrp - price) / mrp) * 100);
}

export const ShoppingDemo: React.FC<ShoppingDemoProps> = ({
  onBackToHome,
  onRequestQuote,
}) => {
  const { language, setLanguage, t } = useLanguage();
  const isHindi = language === 'hi';

  // View & browsing state (100% React state, zero API/Firestore writes)
  const [view, setView] = useState<StoreView>('home');
  const [selectedProductId, setSelectedProductId] = useState<string>(STORE_PRODUCTS[0].id);
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [searchQuery, setSearchQuery] = useState('');

  // Offer slider & deal countdown timer
  const [slideIndex, setSlideIndex] = useState(0);
  const [sliderPaused, setSliderPaused] = useState(false);
  const [dealSecondsLeft, setDealSecondsLeft] = useState(4 * 3600 + 28 * 60 + 45);

  // Cart & Wishlist (local React state only)
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [demoOrders, setDemoOrders] = useState<DemoOrderRecord[]>([]);

  // PDP controls
  const [pdpSize, setPdpSize] = useState<string>('');
  const [pdpQty, setPdpQty] = useState<number>(1);
  const [pdpPincode, setPdpPincode] = useState('');
  const [pdpPincodeStatus, setPdpPincodeStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');

  // Checkout controls
  const [addressForm, setAddressForm] = useState<AddressForm>({
    name: '',
    mobile: '',
    address: '',
    city: '',
    pincode: '',
  });
  const [addressErrors, setAddressErrors] = useState<AddressErrors>({});
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'UPI' | 'CARD'>('COD');
  const [demoUpiId, setDemoUpiId] = useState('customer@upi');
  const [demoCardLast4, setDemoCardLast4] = useState('4242');
  const [latestOrder, setLatestOrder] = useState<DemoOrderRecord | null>(null);

  // Toast & Footer Info Modal
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [infoModal, setInfoModal] = useState<'about' | 'contact' | 'returns' | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 2400);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  // Auto-advance offer banner every 4.5s
  useEffect(() => {
    if (sliderPaused || view !== 'home') return;
    const id = window.setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % OFFER_SLIDES.length);
    }, 4500);
    return () => window.clearInterval(id);
  }, [sliderPaused, view]);

  // Live deals countdown timer
  useEffect(() => {
    const id = window.setInterval(() => {
      setDealSecondsLeft((sec) => (sec > 0 ? sec - 1 : 4 * 3600 + 28 * 60 + 45));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const formattedTimer = useMemo(() => {
    const hrs = Math.floor(dealSecondsLeft / 3600);
    const mins = Math.floor((dealSecondsLeft % 3600) / 60);
    const secs = dealSecondsLeft % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, [dealSecondsLeft]);

  const activeProduct = useMemo(
    () => STORE_PRODUCTS.find((p) => p.id === selectedProductId) || STORE_PRODUCTS[0],
    [selectedProductId]
  );

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = STORE_PRODUCTS.filter((p) => {
      const catMatch = selectedCategory === 'all' || p.category === selectedCategory;
      if (!catMatch) return false;
      if (!q) return true;
      return (
        p.nameHi.toLowerCase().includes(q) ||
        p.nameEn.toLowerCase().includes(q) ||
        p.materialHi.toLowerCase().includes(q) ||
        p.materialEn.toLowerCase().includes(q)
      );
    });

    if (sortBy === 'price-asc') {
      return [...list].sort((a, b) => a.price - b.price);
    }
    if (sortBy === 'price-desc') {
      return [...list].sort((a, b) => b.price - a.price);
    }
    return [...list].sort((a, b) => b.addedOrder - a.addedOrder);
  }, [searchQuery, selectedCategory, sortBy]);

  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const cartSubtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [cart]
  );

  const cartMrpTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.product.mrp * item.quantity, 0),
    [cart]
  );

  const deliveryFee =
    cartSubtotal === 0 ? 0 : cartSubtotal >= FREE_DELIVERY_MIN ? 0 : STANDARD_DELIVERY;
  const grandTotal = cartSubtotal + deliveryFee;

  const navigateView = (next: StoreView) => {
    setView(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openProductPage = (product: StoreProduct) => {
    setSelectedProductId(product.id);
    setPdpSize(product.sizes?.[0] || '');
    setPdpQty(1);
    setPdpPincodeStatus('idle');
    navigateView('product');
  };

  const handleAddToCart = (product: StoreProduct, qty = 1, size?: string) => {
    const resolvedSize = size || product.sizes?.[0];
    const key = resolvedSize ? `${product.id}__${resolvedSize}` : product.id;

    setCart((prev) => {
      const existing = prev.find((i) => i.key === key);
      if (existing) {
        return prev.map((i) =>
          i.key === key ? { ...i, quantity: i.quantity + qty } : i
        );
      }
      return [...prev, { key, product, size: resolvedSize, quantity: qty }];
    });

    showToast(
      isHindi
        ? `${product.nameHi} — कार्ट में जोड़ा गया`
        : `${product.nameEn} — Added to cart`
    );
  };

  const handleBuyNow = (product: StoreProduct, qty = 1, size?: string) => {
    handleAddToCart(product, qty, size);
    navigateView('cart');
  };

  const updateCartQty = (key: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.key === key ? { ...item, quantity: item.quantity + delta } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeCartItem = (key: string) => {
    setCart((prev) => prev.filter((item) => item.key !== key));
  };

  const toggleWishlist = (product: StoreProduct) => {
    setWishlistIds((prev) => {
      const exists = prev.includes(product.id);
      if (exists) {
        showToast(
          isHindi ? 'विशलिस्ट से हटाया गया' : 'Removed from wishlist'
        );
        return prev.filter((id) => id !== product.id);
      }
      showToast(
        isHindi ? 'विशलिस्ट में सहेजा गया' : 'Saved to wishlist'
      );
      return [...prev, product.id];
    });
  };

  const handleSelectCategory = (cat: CategoryKey) => {
    setSelectedCategory(cat);
    if (view !== 'home') {
      setView('home');
      window.setTimeout(() => {
        document.getElementById('desi-all-products')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      document.getElementById('desi-all-products')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCheckPincode = (e: React.FormEvent) => {
    e.preventDefault();
    if (/^\d{6}$/.test(pdpPincode.trim())) {
      setPdpPincodeStatus('valid');
    } else {
      setPdpPincodeStatus('invalid');
    }
  };

  const handleAddressContinue = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: AddressErrors = {};
    if (addressForm.name.trim().length < 2) {
      errs.name = t('Enter your full name.', 'कृपया पूरा नाम दर्ज करें।');
    }
    if (!/^[6-9]\d{9}$/.test(addressForm.mobile.replace(/\D/g, ''))) {
      errs.mobile = t('Enter a valid 10-digit mobile number.', 'सही 10 अंकों का मोबाइल नंबर लिखें।');
    }
    if (addressForm.address.trim().length < 8) {
      errs.address = t('Enter full house/street address.', 'कृपया पूरा पता दर्ज करें।');
    }
    if (addressForm.city.trim().length < 2) {
      errs.city = t('Enter city / town name.', 'कृपया शहर का नाम लिखें।');
    }
    if (!/^\d{6}$/.test(addressForm.pincode.trim())) {
      errs.pincode = t('Enter a valid 6-digit pincode.', 'सही 6 अंकों का पिनकोड लिखें।');
    }
    setAddressErrors(errs);
    if (Object.keys(errs).length > 0) return;
    navigateView('payment');
  };

  const handleConfirmDemoOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    const orderNum = `DB-DEMO-${Math.floor(100000 + Math.random() * 900000)}`;
    const newOrder: DemoOrderRecord = {
      orderNumber: orderNum,
      createdAt: new Date().toLocaleTimeString(isHindi ? 'hi-IN' : 'en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      items: [...cart],
      subtotal: cartSubtotal,
      deliveryFee,
      total: grandTotal,
      address: { ...addressForm },
      paymentMethod,
    };

    setLatestOrder(newOrder);
    setDemoOrders((prev) => [newOrder, ...prev]);
    setCart([]);
    navigateView('success');
  };

  const similarProducts = useMemo(
    () => STORE_PRODUCTS.filter((p) => p.id !== activeProduct.id).slice(0, 4),
    [activeProduct.id]
  );

  const wishlistProducts = useMemo(
    () => STORE_PRODUCTS.filter((p) => wishlistIds.includes(p.id)),
    [wishlistIds]
  );

  const activeSlide = OFFER_SLIDES[slideIndex];

  const renderCheckoutStepper = (activeStep: 1 | 2 | 3 | 4) => {
    const steps = [
      { n: 1, labelHi: 'कार्ट', labelEn: 'Cart' },
      { n: 2, labelHi: 'पता', labelEn: 'Address' },
      { n: 3, labelHi: 'भुगतान', labelEn: 'Payment' },
      { n: 4, labelHi: 'ऑर्डर सफल', labelEn: 'Confirmed' },
    ];
    return (
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-2 overflow-x-auto">
          {steps.map((step, idx) => {
            const done = activeStep > step.n;
            const current = activeStep === step.n;
            return (
              <React.Fragment key={step.n}>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center font-mono tabular-nums ${
                      done
                        ? 'bg-emerald-600 text-white'
                        : current
                        ? 'bg-[#9d174d] text-white'
                        : 'bg-neutral-100 text-neutral-500 border border-neutral-300'
                    }`}
                  >
                    {done ? '✓' : step.n}
                  </span>
                  <span
                    className={`text-xs sm:text-sm font-semibold whitespace-nowrap ${
                      current ? 'text-[#9d174d]' : done ? 'text-neutral-900' : 'text-neutral-400'
                    }`}
                  >
                    {isHindi ? step.labelHi : step.labelEn}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div
                    className={`flex-1 h-px min-w-[20px] ${
                      activeStep > step.n ? 'bg-emerald-500' : 'bg-neutral-200'
                    }`}
                    aria-hidden="true"
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-neutral-900 font-sans pb-16 md:pb-0">
      {/* Unified Sticky Top Shell: Slim DEMO Bar + Storefront Header */}
      <div className="sticky top-0 z-40">
        {/* Top Slim DEMO Bar */}
        <div className="bg-neutral-950 text-white border-b border-neutral-800">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 py-1.5 flex items-center justify-between gap-2 text-[11px] sm:text-xs">
            <p className="text-neutral-200 truncate">
              <span className="font-bold text-amber-300 mr-1.5">DEMO</span>
              {t(
                'Sample website — No real orders or payments',
                'वेबसाइट — असली ऑर्डर या भुगतान नहीं होता'
              )}
            </p>
            <button
              type="button"
              onClick={onBackToHome}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white hover:bg-neutral-200 text-neutral-950 font-bold text-[11px] transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <ArrowLeft className="w-3 h-3 shrink-0" />
              <span>{t('Power Web Studio AI', 'Power Web Studio AI पर वापस')}</span>
            </button>
          </div>
        </div>

        {/* MRP Price Bar */}
        <DemoPriceBar slug="shopping" />

        {/* Real Storefront Header */}
        <header className="bg-white/98 backdrop-blur-md border-b border-neutral-200 shadow-2xs">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3 sm:gap-5">
            {/* Store Logo */}
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
                navigateView('home');
              }}
              className="flex items-center gap-2 text-left cursor-pointer shrink-0 focus-visible:outline-2 focus-visible:outline-[#9d174d] rounded"
            >
              <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#9d174d] text-white flex items-center justify-center shrink-0">
                <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
              </span>
              <span className="leading-none">
                <span className="block text-base sm:text-xl font-extrabold tracking-tight text-[#9d174d] whitespace-nowrap">
                  {t('Desi Bazaar', 'देसी बाज़ार')}
                </span>
                <span className="hidden sm:block text-[10px] font-medium text-neutral-500 mt-0.5 whitespace-nowrap">
                  {t('Indian Handcrafted Store', 'भारतीय हस्तनिर्मित स्टोर')}
                </span>
              </span>
            </button>

            {/* Large Search Box (Desktop / Tablet) */}
            <div className="hidden md:block flex-1 max-w-2xl relative">
              <Search
                className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (view !== 'home') setView('home');
                }}
                placeholder={t(
                  'Search for kurtas, handloom sarees, leather bags, sneakers, diyas...',
                  'कुर्ता, हैंडलूम साड़ी, लेदर बैग, स्नीकर्स, पीतल दीया खोजें...'
                )}
                aria-label={t('Search products', 'प्रोडक्ट खोजें')}
                className="w-full pl-10 pr-10 py-2.5 text-sm bg-neutral-100 hover:bg-neutral-100/80 focus:bg-white border border-neutral-200 focus:border-[#9d174d] rounded-lg text-neutral-900 placeholder:text-neutral-500 focus:outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label={t('Clear search', 'खोज साफ़ करें')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Right Header Icons: Language + Login/Account + Wishlist + Cart */}
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              {/* Language Switch */}
              <DemoLanguageToggle
                language={language}
                onChange={setLanguage}
                tone="light"
              />

              {/* Account / Login Icon */}
              <button
                type="button"
                onClick={() => navigateView('account')}
                aria-label={t('Demo Account', 'खाता')}
                className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  view === 'account'
                    ? 'bg-pink-50 text-[#9d174d]'
                    : 'text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                <User className="w-4 h-4 shrink-0" />
                <span className="hidden lg:inline">{t('Account', 'खाता')}</span>
              </button>

              {/* Wishlist Heart Icon */}
              <button
                type="button"
                onClick={() => navigateView('wishlist')}
                aria-label={t('Wishlist', 'विशलिस्ट')}
                className={`relative inline-flex items-center gap-1.5 p-2 sm:px-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  view === 'wishlist'
                    ? 'bg-pink-50 text-[#9d174d]'
                    : 'text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                <Heart
                  className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 ${
                    wishlistIds.length > 0 ? 'fill-[#9d174d] text-[#9d174d]' : ''
                  }`}
                />
                <span className="hidden lg:inline">{t('Wishlist', 'विशलिस्ट')}</span>
                {wishlistIds.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 sm:static sm:ml-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#9d174d] text-white text-[10px] font-bold font-mono tabular-nums flex items-center justify-center">
                    {wishlistIds.length}
                  </span>
                )}
              </button>

              {/* Cart Icon with Count */}
              <button
                type="button"
                onClick={() => navigateView('cart')}
                aria-label={t('Shopping Cart', 'शॉपिंग कार्ट')}
                className="relative inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#9d174d] hover:bg-[#831843] active:scale-[0.98] text-white text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
              >
                <ShoppingBag className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">{t('Cart', 'कार्ट')}</span>
                <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-white text-[#9d174d] text-[11px] font-extrabold font-mono tabular-nums flex items-center justify-center">
                  {cartCount}
                </span>
              </button>
            </div>
          </div>
        </header>
      </div>

      {/* Mobile Search Bar (Directly under sticky header on narrow screens) */}
      {(view === 'home' || view === 'categories') && (
        <div className="md:hidden bg-white border-b border-neutral-200 px-3 py-2.5">
          <div className="relative">
            <Search
              className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (view !== 'home') setView('home');
              }}
              placeholder={t(
                'Search kurta, saree, handbag, diya...',
                'कुर्ता, साड़ी, हैंडबैग, दीया खोजें...'
              )}
              aria-label={t('Search products', 'प्रोडक्ट खोजें')}
              className="w-full pl-9 pr-9 py-2 text-sm bg-neutral-100 border border-neutral-200 rounded-lg text-neutral-900 placeholder:text-neutral-500 focus:outline-none focus:bg-white focus:border-[#9d174d]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label={t('Clear search', 'खोज साफ़ करें')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          VIEW 1: STOREFRONT HOME
         ===================================================================== */}
      {view === 'home' && (
        <main className="flex-1 bg-white">
          {/* Circular Category Icons Strip with Real Photos */}
          <section
            aria-label={t('Shop by Category', 'कैटेगरी के अनुसार खरीदें')}
            className="border-b border-neutral-200 bg-white"
          >
            <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4">
              <div className="flex items-start gap-4 sm:gap-7 overflow-x-auto pb-1 md:justify-center">
                {CATEGORY_CIRCLES.map((cat) => {
                  const active = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() =>
                        handleSelectCategory(active ? 'all' : cat.id)
                      }
                      className="flex flex-col items-center gap-1.5 shrink-0 w-[68px] sm:w-[82px] group cursor-pointer focus-visible:outline-2 focus-visible:outline-[#9d174d] rounded-lg"
                    >
                      <span
                        className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 p-0.5 transition-transform duration-200 group-hover:scale-105 ${
                          active
                            ? 'border-[#9d174d] shadow-sm'
                            : 'border-neutral-200 group-hover:border-pink-300'
                        }`}
                      >
                        <img
                          src={cat.image}
                          alt=""
                          aria-hidden="true"
                          loading="lazy"
                          decoding="async"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover rounded-full"
                        />
                      </span>
                      <span
                        className={`text-[11px] sm:text-xs font-semibold text-center leading-tight ${
                          active ? 'text-[#9d174d] font-bold' : 'text-neutral-800'
                        }`}
                      >
                        {isHindi ? cat.labelHi : cat.labelEn}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Auto-Playing 3-Slide Offer Banner Slider with Real Photos */}
          <section className="max-w-7xl mx-auto px-3 sm:px-6 pt-4 sm:pt-6">
            <div
              onMouseEnter={() => setSliderPaused(true)}
              onMouseLeave={() => setSliderPaused(false)}
              className="relative rounded-2xl overflow-hidden border border-neutral-200 bg-neutral-900 shadow-sm"
            >
              {/* Slide Backdrop Image */}
              <div className="relative h-[230px] sm:h-[320px] lg:h-[370px] w-full">
                <img
                  src={activeSlide.bgImage}
                  alt={isHindi ? activeSlide.titleHi : activeSlide.titleEn}
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-opacity duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/85 via-neutral-950/60 to-neutral-950/25" />

                {/* Slide Content + Product Spotlight Photo */}
                <div className="absolute inset-0 p-5 sm:p-8 lg:p-12 flex items-center justify-between gap-6">
                  <div className="max-w-xl text-white space-y-2.5 sm:space-y-4">
                    <span className="inline-block px-2.5 py-1 rounded bg-[#9d174d] text-[11px] font-bold tracking-wide uppercase">
                      {isHindi ? activeSlide.tagHi : activeSlide.tagEn}
                    </span>
                    <h1
                      className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.12]"
                      style={{ textWrap: 'balance' }}
                    >
                      {isHindi ? activeSlide.titleHi : activeSlide.titleEn}
                    </h1>
                    <p className="text-xs sm:text-base text-neutral-200 max-w-md leading-relaxed">
                      {isHindi ? activeSlide.subHi : activeSlide.subEn}
                    </p>
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => handleSelectCategory(activeSlide.targetCategory)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white hover:bg-neutral-100 active:scale-[0.98] text-neutral-950 text-xs sm:text-sm font-extrabold transition-all cursor-pointer"
                      >
                        <span>{isHindi ? activeSlide.ctaHi : activeSlide.ctaEn}</span>
                        <ArrowRight className="w-4 h-4 text-[#9d174d]" />
                      </button>
                    </div>
                  </div>

                  {/* Secondary Real Product Photo Card on Desktop */}
                  <div className="hidden md:block shrink-0 w-44 lg:w-56 aspect-square rounded-2xl overflow-hidden border-2 border-white/80 shadow-xl bg-white">
                    <img
                      src={activeSlide.featureImage}
                      alt={isHindi ? activeSlide.titleHi : activeSlide.titleEn}
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Prev / Next Controls */}
                <button
                  type="button"
                  onClick={() =>
                    setSlideIndex(
                      (prev) => (prev - 1 + OFFER_SLIDES.length) % OFFER_SLIDES.length
                    )
                  }
                  aria-label={t('Previous banner', 'पिछला बैनर')}
                  className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-neutral-900 items-center justify-center shadow cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSlideIndex((prev) => (prev + 1) % OFFER_SLIDES.length)
                  }
                  aria-label={t('Next banner', 'अगला बैनर')}
                  className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-neutral-900 items-center justify-center shadow cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                {/* Slide Indicator Dots */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2">
                  {OFFER_SLIDES.map((s, idx) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSlideIndex(idx)}
                      aria-label={`Slide ${idx + 1}`}
                      className={`h-2 rounded-full transition-all cursor-pointer ${
                        idx === slideIndex ? 'w-6 bg-white' : 'w-2 bg-white/50 hover:bg-white/80'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* "आज की डील्स" (Today's Deals) Horizontal Scroll with % OFF & Countdown */}
          <section className="max-w-7xl mx-auto px-3 sm:px-6 pt-8 sm:pt-10">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-lg sm:text-2xl font-extrabold text-neutral-950 tracking-tight">
                  {t("Today's Deals", 'आज की डील्स')}
                </h2>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-pink-50 border border-pink-200 text-[#9d174d] text-xs font-bold font-mono tabular-nums">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>{formattedTimer}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleSelectCategory('all')}
                className="text-xs sm:text-sm font-bold text-[#9d174d] hover:underline cursor-pointer"
              >
                {t('View All', 'सभी देखें')} →
              </button>
            </div>

            <div className="flex items-stretch gap-3.5 sm:gap-4 overflow-x-auto snap-x snap-mandatory pb-3 -mx-3 px-3 sm:mx-0 sm:px-0">
              {STORE_PRODUCTS.map((product) => {
                const discount = getDiscountPercent(product.price, product.mrp);
                return (
                  <article
                    key={`deal-${product.id}`}
                    className="snap-start shrink-0 w-[180px] sm:w-[220px] rounded-xl bg-white border border-neutral-200 overflow-hidden shadow-2xs hover:shadow-md transition-transform duration-200 hover:-translate-y-0.5 flex flex-col"
                  >
                    <button
                      type="button"
                      onClick={() => openProductPage(product)}
                      className="relative w-full aspect-square bg-neutral-100 overflow-hidden cursor-pointer group"
                    >
                      <img
                        src={product.image}
                        alt={isHindi ? product.nameHi : product.nameEn}
                        loading="lazy"
                        decoding="async"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-[#9d174d] text-white text-[10px] font-extrabold tracking-wide">
                        {discount}% OFF
                      </span>
                    </button>

                    <div className="p-3 flex-1 flex flex-col justify-between gap-2">
                      <div>
                        <button
                          type="button"
                          onClick={() => openProductPage(product)}
                          className="text-left text-xs sm:text-sm font-bold text-neutral-900 hover:text-[#9d174d] line-clamp-1 cursor-pointer"
                        >
                          {isHindi ? product.nameHi : product.nameEn}
                        </button>
                        <div className="mt-1 flex items-baseline gap-1.5 font-mono tabular-nums">
                          <span className="text-sm sm:text-base font-extrabold text-neutral-950">
                            {formatInr(product.price)}
                          </span>
                          <span className="text-[11px] text-neutral-400 line-through">
                            {formatInr(product.mrp)}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddToCart(product, 1)}
                        className="w-full py-1.5 px-2.5 rounded-lg border border-[#9d174d] text-[#9d174d] hover:bg-[#9d174d] hover:text-white active:scale-[0.98] text-xs font-bold transition-colors cursor-pointer"
                      >
                        {t('Add to Cart', 'कार्ट में डालें')}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          {/* "सभी प्रोडक्ट" (All Products) Grid — 2 Cols Mobile, 4 Cols Desktop */}
          <section
            id="desi-all-products"
            className="max-w-7xl mx-auto px-3 sm:px-6 py-8 sm:py-12 scroll-mt-28"
          >
            {/* Section Title + Sort & Category Controls */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg sm:text-2xl font-extrabold text-neutral-950 tracking-tight">
                  {t('All Products', 'सभी प्रोडक्ट')}
                </h2>
                <p className="text-xs text-neutral-500 mt-0.5 tabular-nums">
                  {isHindi
                    ? `${filteredProducts.length} उत्पाद उपलब्ध`
                    : `${filteredProducts.length} products available`}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3">
                {/* Category Filter Buttons */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                      selectedCategory === 'all'
                        ? 'bg-[#9d174d] text-white'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                    }`}
                  >
                    {t('All', 'सभी')}
                  </button>
                  {CATEGORY_CIRCLES.map((cat) => (
                    <button
                      key={`filter-${cat.id}`}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                        selectedCategory === cat.id
                          ? 'bg-[#9d174d] text-white'
                          : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                      }`}
                    >
                      {isHindi ? cat.labelHi : cat.labelEn}
                    </button>
                  ))}
                </div>

                {/* Sort Select */}
                <div className="flex items-center gap-2 shrink-0">
                  <label
                    htmlFor="desi-sort"
                    className="text-xs font-semibold text-neutral-600 whitespace-nowrap"
                  >
                    {t('Sort:', 'क्रम:')}
                  </label>
                  <select
                    id="desi-sort"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="text-xs font-semibold border border-neutral-300 rounded-lg px-2.5 py-1.5 bg-white text-neutral-900 focus:outline-none focus:border-[#9d174d] cursor-pointer"
                  >
                    <option value="newest">{t('Newest', 'नया')}</option>
                    <option value="price-asc">
                      {t('Price: Low to High', 'कीमत: कम से ज़्यादा')}
                    </option>
                    <option value="price-desc">
                      {t('Price: High to Low', 'कीमत: ज़्यादा से कम')}
                    </option>
                  </select>
                </div>
              </div>
            </div>

            {/* Product Grid: 2 Columns Mobile, 4 Columns Desktop */}
            {filteredProducts.length === 0 ? (
              <div className="rounded-xl bg-neutral-50 border border-neutral-200 p-10 text-center space-y-3">
                <p className="text-base font-bold text-neutral-900">
                  {t('No products matched your search', 'आपकी खोज के अनुसार कोई प्रोडक्ट नहीं मिला')}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}
                  className="px-4 py-2 rounded-lg bg-[#9d174d] text-white text-xs font-bold cursor-pointer"
                >
                  {t('Show All Products', 'सभी प्रोडक्ट दिखाएँ')}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
                {filteredProducts.map((product) => {
                  const discount = getDiscountPercent(product.price, product.mrp);
                  const isWished = wishlistIds.includes(product.id);
                  return (
                    <article
                      key={product.id}
                      className="rounded-xl bg-white border border-neutral-200 overflow-hidden shadow-2xs hover:shadow-md transition-transform duration-200 hover:-translate-y-0.5 flex flex-col"
                    >
                      {/* Photo + Wishlist Heart */}
                      <div className="relative aspect-square bg-neutral-100 overflow-hidden group">
                        <button
                          type="button"
                          onClick={() => openProductPage(product)}
                          className="w-full h-full block cursor-pointer"
                          aria-label={
                            isHindi
                              ? `${product.nameHi} देखें`
                              : `View ${product.nameEn}`
                          }
                        >
                          <img
                            src={product.image}
                            alt={isHindi ? product.nameHi : product.nameEn}
                            loading="lazy"
                            decoding="async"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleWishlist(product)}
                          aria-label={
                            isWished
                              ? t('Remove from wishlist', 'विशलिस्ट से हटाएँ')
                              : t('Add to wishlist', 'विशलिस्ट में जोड़ें')
                          }
                          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/95 hover:bg-white shadow-sm flex items-center justify-center cursor-pointer transition-transform active:scale-90"
                        >
                          <Heart
                            className={`w-4 h-4 ${
                              isWished
                                ? 'fill-[#9d174d] text-[#9d174d]'
                                : 'text-neutral-600'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Product Info */}
                      <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between gap-3">
                        <div>
                          <p className="text-[11px] text-neutral-500 truncate">
                            {isHindi ? product.materialHi : product.materialEn}
                          </p>
                          <button
                            type="button"
                            onClick={() => openProductPage(product)}
                            className="mt-0.5 text-left text-xs sm:text-sm font-bold text-neutral-950 hover:text-[#9d174d] line-clamp-2 cursor-pointer"
                          >
                            {isHindi ? product.nameHi : product.nameEn}
                          </button>

                          <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 font-mono tabular-nums">
                            <span className="text-sm sm:text-base font-extrabold text-neutral-950">
                              {formatInr(product.price)}
                            </span>
                            <span className="text-[11px] sm:text-xs text-neutral-400 line-through">
                              {formatInr(product.mrp)}
                            </span>
                            <span className="text-[11px] sm:text-xs font-bold text-emerald-700 font-sans">
                              {isHindi ? `${discount}% छूट` : `${discount}% off`}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAddToCart(product, 1)}
                          className="w-full py-2 px-3 rounded-lg bg-[#9d174d] hover:bg-[#831843] active:scale-[0.98] text-white text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
                        >
                          {t('Add to Cart', 'कार्ट में डालें')}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </main>
      )}

      {/* =====================================================================
          VIEW 2: CATEGORIES DIRECTORY (Mobile App Feel)
         ===================================================================== */}
      {view === 'categories' && (
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 sm:py-10">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-950">
              {t('Shop by Category', 'सभी कैटेगरी')}
            </h1>
            <button
              type="button"
              onClick={() => handleSelectCategory('all')}
              className="text-xs font-bold text-[#9d174d] hover:underline cursor-pointer"
            >
              {t('All Products', 'सभी प्रोडक्ट')} →
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {CATEGORY_CIRCLES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleSelectCategory(cat.id)}
                className="rounded-xl overflow-hidden border border-neutral-200 bg-white hover:shadow-md transition-transform hover:-translate-y-0.5 text-left cursor-pointer group"
              >
                <div className="aspect-[4/3] overflow-hidden bg-neutral-100" aria-hidden="true">
                  <img
                    src={cat.image}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="p-3.5 flex items-center justify-between">
                  <span className="text-sm font-bold text-neutral-950">
                    {isHindi ? cat.labelHi : cat.labelEn}
                  </span>
                  <ArrowRight className="w-4 h-4 text-[#9d174d]" />
                </div>
              </button>
            ))}
          </div>
        </main>
      )}

      {/* =====================================================================
          VIEW 3: FULL-SCREEN PRODUCT DETAIL PAGE (PDP)
         ===================================================================== */}
      {view === 'product' && (
        <main className="flex-1 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
            <button
              type="button"
              onClick={() => navigateView('home')}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-neutral-700 hover:text-[#9d174d] mb-5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t('Back to Store', 'स्टोर पर वापस')}</span>
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
              {/* Large Product Photo */}
              <div className="lg:col-span-6">
                <div className="relative rounded-2xl overflow-hidden border border-neutral-200 bg-neutral-50 aspect-square">
                  <img
                    src={activeProduct.image}
                    alt={isHindi ? activeProduct.nameHi : activeProduct.nameEn}
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-[#9d174d] text-white text-xs font-extrabold">
                    {getDiscountPercent(activeProduct.price, activeProduct.mrp)}% OFF
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleWishlist(activeProduct)}
                    aria-label={t('Toggle wishlist', 'विशलिस्ट')}
                    className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white shadow flex items-center justify-center cursor-pointer active:scale-90 transition-transform"
                  >
                    <Heart
                      className={`w-5 h-5 ${
                        wishlistIds.includes(activeProduct.id)
                          ? 'fill-[#9d174d] text-[#9d174d]'
                          : 'text-neutral-700'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Contiguous Purchase Details */}
              <div className="lg:col-span-6 space-y-5">
                <div>
                  <p className="text-xs font-semibold text-neutral-500">
                    {isHindi ? activeProduct.materialHi : activeProduct.materialEn}
                  </p>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-950 tracking-tight mt-1">
                    {isHindi ? activeProduct.nameHi : activeProduct.nameEn}
                  </h1>

                  <div className="mt-3 flex items-baseline gap-3 font-mono tabular-nums">
                    <span className="text-2xl sm:text-3xl font-extrabold text-neutral-950">
                      {formatInr(activeProduct.price)}
                    </span>
                    <span className="text-base text-neutral-400 line-through">
                      {formatInr(activeProduct.mrp)}
                    </span>
                    <span className="text-sm font-bold text-emerald-700 font-sans">
                      {isHindi
                        ? `${getDiscountPercent(activeProduct.price, activeProduct.mrp)}% छूट`
                        : `${getDiscountPercent(activeProduct.price, activeProduct.mrp)}% off`}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">
                    {t('Inclusive of all sample taxes', 'सभी नमूना कर शामिल')}
                  </p>
                </div>

                {/* Size Selector (Clothing & Footwear) */}
                {activeProduct.sizes && activeProduct.sizes.length > 0 && (
                  <div className="pt-2 border-t border-neutral-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-neutral-800">
                        {t('Select Size', 'साइज़ चुनें')}
                      </span>
                      <span className="text-xs text-neutral-500 font-mono">{pdpSize}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {activeProduct.sizes.map((size) => {
                        const selected = pdpSize === size;
                        return (
                          <button
                            key={size}
                            type="button"
                            onClick={() => setPdpSize(size)}
                            className={`min-w-[48px] px-3 py-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                              selected
                                ? 'bg-[#9d174d] text-white border-[#9d174d]'
                                : 'bg-white text-neutral-800 border-neutral-300 hover:border-[#9d174d]'
                            }`}
                          >
                            {size}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Quantity Selector */}
                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold text-neutral-800">
                    {t('Quantity', 'मात्रा')}
                  </span>
                  <div className="inline-flex items-center border border-neutral-300 rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setPdpQty((q) => Math.max(1, q - 1))}
                      aria-label={t('Decrease quantity', 'मात्रा घटाएँ')}
                      className="px-3 py-2 text-neutral-700 hover:bg-neutral-100 cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-4 py-1.5 text-sm font-bold font-mono tabular-nums">
                      {pdpQty}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPdpQty((q) => Math.min(10, q + 1))}
                      aria-label={t('Increase quantity', 'मात्रा बढ़ाएँ')}
                      className="px-3 py-2 text-neutral-700 hover:bg-neutral-100 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Primary CTAs: Add to Cart & Buy Now */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => handleAddToCart(activeProduct, pdpQty, pdpSize)}
                    className="py-3 px-4 rounded-xl border-2 border-[#9d174d] text-[#9d174d] hover:bg-pink-50 active:scale-[0.98] text-sm font-extrabold transition-all cursor-pointer"
                  >
                    {t('Add to Cart', 'कार्ट में डालें')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBuyNow(activeProduct, pdpQty, pdpSize)}
                    className="py-3 px-4 rounded-xl bg-[#9d174d] hover:bg-[#831843] active:scale-[0.98] text-white text-sm font-extrabold transition-all cursor-pointer"
                  >
                    {t('Buy Now', 'अभी खरीदें')}
                  </button>
                </div>

                {/* Pincode Delivery Checker (Sample 3-5 days) */}
                <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-neutral-900">
                    <MapPin className="w-4 h-4 text-[#9d174d] shrink-0" />
                    <span>{t('Check Delivery Estimate', 'डिलीवरी समय जाँचें')}</span>
                  </div>
                  <form onSubmit={handleCheckPincode} className="flex gap-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={pdpPincode}
                      onChange={(e) => {
                        setPdpPincode(e.target.value.replace(/\D/g, '').slice(0, 6));
                        setPdpPincodeStatus('idle');
                      }}
                      placeholder={t('Enter 6-digit pincode', '6 अंकों का पिनकोड डालें')}
                      className="flex-1 px-3 py-2 text-xs sm:text-sm font-mono bg-white border border-neutral-300 rounded-lg focus:outline-none focus:border-[#9d174d]"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold cursor-pointer whitespace-nowrap"
                    >
                      {t('Check', 'जाँचें')}
                    </button>
                  </form>
                  {pdpPincodeStatus === 'valid' && (
                    <p className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                      <Truck className="w-4 h-4 shrink-0" />
                      <span>
                        {isHindi
                          ? `पिनकोड ${pdpPincode} पर डिलीवरी 3–5 दिन में उपलब्ध (नमूना)`
                          : `Delivery to ${pdpPincode} in 3–5 days (Sample)`}
                      </span>
                    </p>
                  )}
                  {pdpPincodeStatus === 'invalid' && (
                    <p className="text-xs text-rose-600">
                      {t('Please enter a valid 6-digit pincode.', 'कृपया सही 6 अंकों का पिनकोड दर्ज करें।')}
                    </p>
                  )}
                </div>

                {/* Product Description & Specs */}
                <div className="pt-2 border-t border-neutral-200 space-y-3">
                  <h2 className="text-sm font-extrabold text-neutral-950">
                    {t('Product Details', 'प्रोडक्ट विवरण')}
                  </h2>
                  <p className="text-sm text-neutral-600 leading-relaxed">
                    {isHindi ? activeProduct.descriptionHi : activeProduct.descriptionEn}
                  </p>
                  <ul className="space-y-1.5 text-xs sm:text-sm text-neutral-700">
                    {(isHindi ? activeProduct.specsHi : activeProduct.specsEn).map((spec) => (
                      <li key={spec} className="flex items-start gap-2">
                        <span className="text-[#9d174d] font-bold" aria-hidden="true">
                          ·
                        </span>
                        <span>{spec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Similar Products Section */}
            <section className="mt-12 pt-8 border-t border-neutral-200">
              <h2 className="text-lg sm:text-xl font-extrabold text-neutral-950 mb-5">
                {t('Similar Products', 'समान प्रोडक्ट')}
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
                {similarProducts.map((item) => {
                  const disc = getDiscountPercent(item.price, item.mrp);
                  return (
                    <article
                      key={`sim-${item.id}`}
                      className="rounded-xl bg-white border border-neutral-200 overflow-hidden hover:shadow-md transition-transform hover:-translate-y-0.5 flex flex-col"
                    >
                      <button
                        type="button"
                        onClick={() => openProductPage(item)}
                        className="aspect-square bg-neutral-100 overflow-hidden cursor-pointer group"
                      >
                        <img
                          src={item.image}
                          alt={isHindi ? item.nameHi : item.nameEn}
                          loading="lazy"
                          decoding="async"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </button>
                      <div className="p-3 flex-1 flex flex-col justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => openProductPage(item)}
                          className="text-left text-xs sm:text-sm font-bold text-neutral-900 hover:text-[#9d174d] line-clamp-1 cursor-pointer"
                        >
                          {isHindi ? item.nameHi : item.nameEn}
                        </button>
                        <div className="flex items-baseline gap-1.5 font-mono tabular-nums">
                          <span className="text-sm font-extrabold text-neutral-950">
                            {formatInr(item.price)}
                          </span>
                          <span className="text-[11px] text-neutral-400 line-through">
                            {formatInr(item.mrp)}
                          </span>
                          <span className="text-[11px] font-bold text-emerald-700 font-sans">
                            {disc}%
                          </span>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          </div>
        </main>
      )}

      {/* =====================================================================
          VIEW 4: WISHLIST PAGE
         ===================================================================== */}
      {view === 'wishlist' && (
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-950">
              {isHindi
                ? `आपकी विशलिस्ट (${wishlistProducts.length})`
                : `Your Wishlist (${wishlistProducts.length})`}
            </h1>
            <button
              type="button"
              onClick={() => navigateView('home')}
              className="text-xs sm:text-sm font-bold text-[#9d174d] hover:underline cursor-pointer"
            >
              {t('Continue Shopping', 'खरीदारी जारी रखें')}
            </button>
          </div>

          {wishlistProducts.length === 0 ? (
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-10 text-center space-y-3">
              <Heart className="w-10 h-10 text-neutral-300 mx-auto" />
              <p className="text-base font-bold text-neutral-900">
                {t('Your wishlist is empty', 'आपकी विशलिस्ट खाली है')}
              </p>
              <p className="text-xs sm:text-sm text-neutral-500">
                {t(
                  'Tap the heart icon on any product to save it here.',
                  'पसंदीदा प्रोडक्ट सेव करने के लिए दिल के आइकन पर टैप करें।'
                )}
              </p>
              <button
                type="button"
                onClick={() => navigateView('home')}
                className="px-5 py-2.5 rounded-lg bg-[#9d174d] text-white text-xs font-bold cursor-pointer"
              >
                {t('Explore Products', 'प्रोडक्ट देखें')}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {wishlistProducts.map((product) => (
                <article
                  key={`wish-${product.id}`}
                  className="rounded-xl bg-white border border-neutral-200 overflow-hidden flex flex-col"
                >
                  <button
                    type="button"
                    onClick={() => openProductPage(product)}
                    className="aspect-square bg-neutral-100 overflow-hidden cursor-pointer"
                  >
                    <img
                      src={product.image}
                      alt={isHindi ? product.nameHi : product.nameEn}
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </button>
                  <div className="p-3 flex-1 flex flex-col justify-between gap-2.5">
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-neutral-950 line-clamp-1">
                        {isHindi ? product.nameHi : product.nameEn}
                      </p>
                      <p className="text-sm font-extrabold font-mono tabular-nums mt-1">
                        {formatInr(product.price)}
                      </p>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleAddToCart(product, 1)}
                        className="flex-1 py-2 px-2 rounded-lg bg-[#9d174d] text-white text-xs font-bold cursor-pointer"
                      >
                        {t('Move to Cart', 'कार्ट में डालें')}
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleWishlist(product)}
                        aria-label={t('Remove', 'हटाएँ')}
                        className="p-2 rounded-lg border border-neutral-200 text-neutral-500 hover:text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </main>
      )}

      {/* =====================================================================
          VIEW 5: CART PAGE (Step 1)
         ===================================================================== */}
      {view === 'cart' && (
        <main className="flex-1 bg-neutral-50">
          {renderCheckoutStepper(1)}
          <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
            {cart.length === 0 ? (
              <div className="rounded-2xl bg-white border border-neutral-200 p-10 text-center space-y-3">
                <ShoppingBag className="w-10 h-10 text-neutral-300 mx-auto" />
                <h1 className="text-lg font-extrabold text-neutral-950">
                  {t('Your cart is empty', 'आपका कार्ट खाली है')}
                </h1>
                <p className="text-xs sm:text-sm text-neutral-500">
                  {t(
                    'Add products from Desi Bazaar to try the full demo checkout flow.',
                    'पूरा डेमो चेकआउट अनुभव देखने के लिए देसी बाज़ार से प्रोडक्ट जोड़ें।'
                  )}
                </p>
                <button
                  type="button"
                  onClick={() => navigateView('home')}
                  className="px-5 py-2.5 rounded-lg bg-[#9d174d] text-white text-xs font-bold cursor-pointer"
                >
                  {t('Start Shopping', 'खरीदारी शुरू करें')}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Cart Items */}
                <div className="lg:col-span-8 space-y-3">
                  {cart.map((item) => (
                    <div
                      key={item.key}
                      className="rounded-xl bg-white border border-neutral-200 p-4 flex gap-4 items-start"
                    >
                      <button
                        type="button"
                        onClick={() => openProductPage(item.product)}
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden bg-neutral-100 shrink-0 cursor-pointer"
                      >
                        <img
                          src={item.product.image}
                          alt={isHindi ? item.product.nameHi : item.product.nameEn}
                          loading="lazy"
                          decoding="async"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <button
                              type="button"
                              onClick={() => openProductPage(item.product)}
                              className="text-left text-sm sm:text-base font-bold text-neutral-950 hover:text-[#9d174d] cursor-pointer"
                            >
                              {isHindi ? item.product.nameHi : item.product.nameEn}
                            </button>
                            {item.size && (
                              <p className="text-xs text-neutral-500 mt-0.5">
                                {t('Size:', 'साइज़:')} <span className="font-semibold">{item.size}</span>
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeCartItem(item.key)}
                            aria-label={t('Remove item', 'आइटम हटाएँ')}
                            className="p-1.5 text-neutral-400 hover:text-rose-600 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-baseline gap-2 font-mono tabular-nums">
                            <span className="text-base font-extrabold text-neutral-950">
                              {formatInr(item.product.price * item.quantity)}
                            </span>
                            <span className="text-xs text-neutral-400 line-through">
                              {formatInr(item.product.mrp * item.quantity)}
                            </span>
                          </div>

                          <div className="inline-flex items-center border border-neutral-300 rounded-lg overflow-hidden">
                            <button
                              type="button"
                              onClick={() => updateCartQty(item.key, -1)}
                              aria-label={t('Decrease quantity', 'मात्रा घटाएँ')}
                              className="px-2.5 py-1.5 text-neutral-700 hover:bg-neutral-100 cursor-pointer"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="px-3 py-1 text-xs font-bold font-mono tabular-nums">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateCartQty(item.key, 1)}
                              aria-label={t('Increase quantity', 'मात्रा बढ़ाएँ')}
                              className="px-2.5 py-1.5 text-neutral-700 hover:bg-neutral-100 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Price Details Summary */}
                <div className="lg:col-span-4 rounded-xl bg-white border border-neutral-200 p-5 space-y-4">
                  <h2 className="text-sm font-extrabold text-neutral-950 uppercase tracking-wide">
                    {t('Price Summary', 'मूल्य विवरण')}
                  </h2>

                  {cartSubtotal < FREE_DELIVERY_MIN && (
                    <p className="text-xs bg-pink-50 text-[#9d174d] border border-pink-200 rounded-lg px-3 py-2 font-medium">
                      {isHindi
                        ? `मुफ़्त डिलीवरी के लिए ${formatInr(FREE_DELIVERY_MIN - cartSubtotal)} और जोड़ें`
                        : `Add ${formatInr(FREE_DELIVERY_MIN - cartSubtotal)} more for free delivery`}
                    </p>
                  )}

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-neutral-600">
                      <span>{t('Total MRP', 'कुल MRP')}</span>
                      <span className="font-mono tabular-nums">{formatInr(cartMrpTotal)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-700">
                      <span>{t('Discount', 'छूट')}</span>
                      <span className="font-mono tabular-nums font-semibold">
                        −{formatInr(cartMrpTotal - cartSubtotal)}
                      </span>
                    </div>
                    <div className="flex justify-between text-neutral-600">
                      <span>{t('Delivery Charges', 'डिलीवरी शुल्क')}</span>
                      <span
                        className={`font-mono tabular-nums font-semibold ${
                          deliveryFee === 0 ? 'text-emerald-700' : 'text-neutral-900'
                        }`}
                      >
                        {deliveryFee === 0 ? t('FREE', 'मुफ़्त') : formatInr(deliveryFee)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-3 border-t border-neutral-200 text-base font-extrabold text-neutral-950">
                      <span>{t('Total Amount', 'कुल देय राशि')}</span>
                      <span className="font-mono tabular-nums">{formatInr(grandTotal)}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigateView('address')}
                    className="w-full py-3 px-4 rounded-xl bg-[#9d174d] hover:bg-[#831843] active:scale-[0.98] text-white text-sm font-extrabold transition-all cursor-pointer"
                  >
                    {t('Continue to Address', 'पता दर्ज करें')} →
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      )}

      {/* =====================================================================
          VIEW 6: ADDRESS PAGE (Step 2)
         ===================================================================== */}
      {view === 'address' && (
        <main className="flex-1 bg-neutral-50">
          {renderCheckoutStepper(2)}
          <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8">
            <form
              onSubmit={handleAddressContinue}
              noValidate
              className="rounded-2xl bg-white border border-neutral-200 p-5 sm:p-7 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h1 className="text-lg sm:text-xl font-extrabold text-neutral-950">
                  {t('Delivery Address (Demo)', 'डिलीवरी का पता (नमूना)')}
                </h1>
                <button
                  type="button"
                  onClick={() => navigateView('cart')}
                  className="text-xs font-bold text-[#9d174d] hover:underline cursor-pointer"
                >
                  ← {t('Back to Cart', 'कार्ट पर वापस')}
                </button>
              </div>

              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
                {t(
                  'Demo form only — nothing is saved to any server or database.',
                  'यह केवल डेमो फ़ॉर्म है — कोई जानकारी सर्वर या डेटाबेस में सेव नहीं होती।'
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="addr-name" className="block text-xs font-bold text-neutral-800 mb-1">
                    {t('Full Name', 'पूरा नाम')} *
                  </label>
                  <input
                    id="addr-name"
                    type="text"
                    value={addressForm.name}
                    onChange={(e) => setAddressForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder={t('e.g. Priya Sharma', 'जैसे: प्रिया शर्मा')}
                    className="w-full px-3 py-2.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:border-[#9d174d]"
                  />
                  {addressErrors.name && (
                    <p className="mt-1 text-xs text-rose-600">{addressErrors.name}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="addr-mobile" className="block text-xs font-bold text-neutral-800 mb-1">
                    {t('Mobile Number', 'मोबाइल नंबर')} *
                  </label>
                  <input
                    id="addr-mobile"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={addressForm.mobile}
                    onChange={(e) =>
                      setAddressForm((f) => ({
                        ...f,
                        mobile: e.target.value.replace(/\D/g, '').slice(0, 10),
                      }))
                    }
                    placeholder="9876543210"
                    className="w-full px-3 py-2.5 text-sm font-mono border border-neutral-300 rounded-lg focus:outline-none focus:border-[#9d174d]"
                  />
                  {addressErrors.mobile && (
                    <p className="mt-1 text-xs text-rose-600">{addressErrors.mobile}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="addr-line" className="block text-xs font-bold text-neutral-800 mb-1">
                  {t('House No., Street, Area', 'मकान नंबर, गली, इलाका')} *
                </label>
                <textarea
                  id="addr-line"
                  rows={2}
                  value={addressForm.address}
                  onChange={(e) => setAddressForm((f) => ({ ...f, address: e.target.value }))}
                  placeholder={t('Flat 12B, Civil Lines', 'मकान 12B, सिविल लाइंस')}
                  className="w-full px-3 py-2.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:border-[#9d174d]"
                />
                {addressErrors.address && (
                  <p className="mt-1 text-xs text-rose-600">{addressErrors.address}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="addr-city" className="block text-xs font-bold text-neutral-800 mb-1">
                    {t('City / District', 'शहर / ज़िला')} *
                  </label>
                  <input
                    id="addr-city"
                    type="text"
                    value={addressForm.city}
                    onChange={(e) => setAddressForm((f) => ({ ...f, city: e.target.value }))}
                    placeholder={t('Raipur', 'रायपुर')}
                    className="w-full px-3 py-2.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:border-[#9d174d]"
                  />
                  {addressErrors.city && (
                    <p className="mt-1 text-xs text-rose-600">{addressErrors.city}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="addr-pin" className="block text-xs font-bold text-neutral-800 mb-1">
                    {t('Pincode', 'पिनकोड')} *
                  </label>
                  <input
                    id="addr-pin"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={addressForm.pincode}
                    onChange={(e) =>
                      setAddressForm((f) => ({
                        ...f,
                        pincode: e.target.value.replace(/\D/g, '').slice(0, 6),
                      }))
                    }
                    placeholder="492001"
                    className="w-full px-3 py-2.5 text-sm font-mono border border-neutral-300 rounded-lg focus:outline-none focus:border-[#9d174d]"
                  />
                  {addressErrors.pincode && (
                    <p className="mt-1 text-xs text-rose-600">{addressErrors.pincode}</p>
                  )}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl bg-[#9d174d] hover:bg-[#831843] text-white text-sm font-extrabold cursor-pointer"
                >
                  {t('Continue to Payment', 'भुगतान चुनें')} →
                </button>
              </div>
            </form>
          </div>
        </main>
      )}

      {/* =====================================================================
          VIEW 7: PAYMENT PAGE (Step 3 — Sample Only)
         ===================================================================== */}
      {view === 'payment' && (
        <main className="flex-1 bg-neutral-50">
          {renderCheckoutStepper(3)}
          <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8">
            <form
              onSubmit={handleConfirmDemoOrder}
              className="rounded-2xl bg-white border border-neutral-200 p-5 sm:p-7 space-y-5"
            >
              <div className="flex items-center justify-between">
                <h1 className="text-lg sm:text-xl font-extrabold text-neutral-950">
                  {t('Select Payment Method (Demo)', 'भुगतान का तरीका चुनें (डेमो)')}
                </h1>
                <button
                  type="button"
                  onClick={() => navigateView('address')}
                  className="text-xs font-bold text-[#9d174d] hover:underline cursor-pointer"
                >
                  ← {t('Edit Address', 'पता बदलें')}
                </button>
              </div>

              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  {t(
                    'Simulated Demo Payment — No real money is charged and no card/UPI details are transmitted.',
                    'केवल नमूना भुगतान स्क्रीन — कोई असली पैसा नहीं कटता और कोई कार्ड/UPI जानकारी सेव नहीं होती।'
                  )}
                </span>
              </div>

              <div className="space-y-3">
                {/* COD */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('COD')}
                  className={`w-full p-4 rounded-xl border text-left flex items-center gap-3 transition-colors cursor-pointer ${
                    paymentMethod === 'COD'
                      ? 'border-[#9d174d] bg-pink-50/50'
                      : 'border-neutral-200 hover:bg-neutral-50'
                  }`}
                >
                  <Banknote className="w-5 h-5 text-[#9d174d] shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-neutral-950">
                      {t('Cash on Delivery (COD)', 'कैश ऑन डिलीवरी (COD)')}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {t('Pay on delivery (Sample flow)', 'डिलीवरी पर नकद भुगतान (नमूना)')}
                    </p>
                  </div>
                </button>

                {/* UPI */}
                <div
                  className={`rounded-xl border transition-colors ${
                    paymentMethod === 'UPI'
                      ? 'border-[#9d174d] bg-pink-50/50'
                      : 'border-neutral-200'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('UPI')}
                    className="w-full p-4 text-left flex items-center gap-3 cursor-pointer"
                  >
                    <Smartphone className="w-5 h-5 text-[#9d174d] shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-neutral-950">
                        {t('UPI (Demo Only)', 'UPI (केवल डेमो)')}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {t('Simulated UPI handle preview', 'नमूना UPI आईडी प्रीव्यू')}
                      </p>
                    </div>
                  </button>
                  {paymentMethod === 'UPI' && (
                    <div className="px-4 pb-4">
                      <input
                        type="text"
                        value={demoUpiId}
                        onChange={(e) => setDemoUpiId(e.target.value)}
                        aria-label="Demo UPI ID"
                        className="w-full px-3 py-2 text-xs font-mono bg-white border border-neutral-300 rounded-lg"
                      />
                    </div>
                  )}
                </div>

                {/* Card */}
                <div
                  className={`rounded-xl border transition-colors ${
                    paymentMethod === 'CARD'
                      ? 'border-[#9d174d] bg-pink-50/50'
                      : 'border-neutral-200'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CARD')}
                    className="w-full p-4 text-left flex items-center gap-3 cursor-pointer"
                  >
                    <CreditCard className="w-5 h-5 text-[#9d174d] shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-neutral-950">
                        {t('Credit / Debit Card (Demo)', 'क्रेडिट / डेबिट कार्ड (डेमो)')}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {t('Sample test card only — do not enter real card info', 'केवल नमूना कार्ड — असली कार्ड नंबर न डालें')}
                      </p>
                    </div>
                  </button>
                  {paymentMethod === 'CARD' && (
                    <div className="px-4 pb-4 flex items-center gap-2 text-xs font-mono text-neutral-600">
                      <span>•••• •••• ••••</span>
                      <input
                        type="text"
                        maxLength={4}
                        value={demoCardLast4}
                        onChange={(e) =>
                          setDemoCardLast4(e.target.value.replace(/\D/g, '').slice(0, 4))
                        }
                        aria-label="Sample Card Last 4 Digits"
                        className="w-16 px-2 py-1 bg-white border border-neutral-300 rounded text-neutral-900"
                      />
                      <span className="text-[11px] text-neutral-500 font-sans">
                        ({t('Test card', 'टेस्ट कार्ड')})
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Payable Total */}
              <div className="pt-4 border-t border-neutral-200 flex items-center justify-between">
                <span className="text-sm font-bold text-neutral-700">
                  {t('Total Payable (Demo)', 'कुल राशि (डेमो)')}
                </span>
                <span className="text-xl font-extrabold font-mono tabular-nums text-neutral-950">
                  {formatInr(grandTotal)}
                </span>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-xl bg-[#9d174d] hover:bg-[#831843] active:scale-[0.98] text-white text-sm font-extrabold transition-all cursor-pointer"
              >
                {t('Place Demo Order', 'डेमो ऑर्डर कन्फ़र्म करें')}
              </button>
            </form>
          </div>
        </main>
      )}

      {/* =====================================================================
          VIEW 8: ORDER SUCCESS + TRACKING TIMELINE (Step 4)
         ===================================================================== */}
      {view === 'success' && latestOrder && (
        <main className="flex-1 bg-neutral-50">
          {renderCheckoutStepper(4)}
          <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
            <div className="rounded-2xl bg-white border border-neutral-200 p-6 sm:p-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="inline-block px-3 py-1 rounded-md bg-amber-100 border border-amber-300 text-amber-950 text-xs font-extrabold">
                {t(
                  'THIS IS A SAMPLE — No real order or payment occurred',
                  'यह नमूना है — असली ऑर्डर या भुगतान नहीं हुआ'
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-950">
                {t('Demo Order Placed Successfully!', 'डेमो ऑर्डर सफल!')}
              </h1>

              <p className="text-sm text-neutral-600">
                {t('Order Number:', 'ऑर्डर नंबर:')}{' '}
                <strong className="font-mono text-neutral-950">{latestOrder.orderNumber}</strong>
              </p>

              {/* 4-Step Order Tracking Timeline */}
              <div className="pt-4 pb-2">
                <div className="grid grid-cols-4 gap-2 text-center">
                  {[
                    {
                      labelHi: 'ऑर्डर हुआ',
                      labelEn: 'Order Placed',
                      icon: CheckCircle2,
                      active: true,
                    },
                    { labelHi: 'पैक', labelEn: 'Packed', icon: Package, active: false },
                    { labelHi: 'रवाना', labelEn: 'Shipped', icon: Truck, active: false },
                    { labelHi: 'डिलीवर', labelEn: 'Delivered', icon: Home, active: false },
                  ].map((step) => {
                    const Icon = step.icon;
                    return (
                      <div key={step.labelEn} className="flex flex-col items-center gap-1.5">
                        <span
                          className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                            step.active
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'bg-neutral-50 border-neutral-200 text-neutral-400'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </span>
                        <span
                          className={`text-[11px] sm:text-xs font-bold ${
                            step.active ? 'text-emerald-700' : 'text-neutral-500'
                          }`}
                        >
                          {isHindi ? step.labelHi : step.labelEn}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Order Summary Box */}
              <div className="text-left rounded-xl bg-neutral-50 border border-neutral-200 p-4 text-xs sm:text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-neutral-500">{t('Deliver To', 'डिलीवरी पता')}</span>
                  <span className="font-semibold text-neutral-900 text-right">
                    {latestOrder.address.name}, {latestOrder.address.city} -{' '}
                    {latestOrder.address.pincode}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">{t('Payment Mode', 'भुगतान माध्यम')}</span>
                  <span className="font-semibold text-neutral-900">
                    {latestOrder.paymentMethod} ({t('Demo', 'नमूना')})
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-neutral-200 font-extrabold text-neutral-950">
                  <span>{t('Total', 'कुल राशि')}</span>
                  <span className="font-mono tabular-nums">{formatInr(latestOrder.total)}</span>
                </div>
              </div>

              <div className="flex flex-wrap justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => navigateView('home')}
                  className="px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs sm:text-sm font-bold cursor-pointer"
                >
                  {t('Continue Shopping', 'खरीदारी जारी रखें')}
                </button>
                <button
                  type="button"
                  onClick={onRequestQuote}
                  className="px-5 py-2.5 rounded-xl bg-[#9d174d] hover:bg-[#831843] text-white text-xs sm:text-sm font-bold cursor-pointer"
                >
                  {t(
                    'Build This Website for Your Business',
                    'ऐसी वेबसाइट अपने बिज़नेस के लिए बनवाएँ'
                  )}
                </button>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* =====================================================================
          VIEW 9: DEMO ACCOUNT VIEW (Local Session Only)
         ===================================================================== */}
      {view === 'account' && (
        <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-6 sm:py-10 space-y-6">
          <div className="rounded-2xl bg-neutral-50 border border-neutral-200 p-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-full bg-[#9d174d] text-white flex items-center justify-center">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg font-extrabold text-neutral-950">
                  {t('Demo Guest Account', 'डेमो गेस्ट खाता')}
                </h1>
                <p className="text-xs text-neutral-500">
                  {t(
                    'Session-only preview account — no login required.',
                    'केवल इस सेशन के लिए नमूना खाता — लॉगिन की आवश्यकता नहीं।'
                  )}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onRequestQuote}
              className="px-4 py-2 rounded-lg bg-[#9d174d] text-white text-xs font-bold cursor-pointer"
            >
              {t('Build Your Store', 'अपना स्टोर बनवाएँ')}
            </button>
          </div>

          <div className="rounded-2xl bg-white border border-neutral-200 p-5 space-y-3">
            <h2 className="text-base font-extrabold text-neutral-950">
              {t('Demo Orders in This Session', 'इस सेशन के डेमो ऑर्डर')} ({demoOrders.length})
            </h2>
            {demoOrders.length === 0 ? (
              <p className="text-xs sm:text-sm text-neutral-500">
                {t(
                  'No demo orders placed yet. Add items to cart and complete the demo checkout to see tracking here.',
                  'अभी कोई डेमो ऑर्डर नहीं किया गया है। कार्ट में प्रोडक्ट डालकर डेमो चेकआउट आज़माएँ।'
                )}
              </p>
            ) : (
              <div className="space-y-3">
                {demoOrders.map((ord) => (
                  <div
                    key={ord.orderNumber}
                    className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm"
                  >
                    <div>
                      <p className="font-mono font-bold text-neutral-950">{ord.orderNumber}</p>
                      <p className="text-neutral-500">
                        {ord.items.length} {t('items', 'उत्पाद')} · {ord.paymentMethod} ({t('Demo', 'नमूना')})
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-extrabold text-neutral-950">
                        {formatInr(ord.total)}
                      </p>
                      <p className="text-emerald-700 font-semibold text-xs">
                        {t('Order Placed (Sample)', 'ऑर्डर हुआ (नमूना)')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      )}

      {/* =====================================================================
          BUSINESS QUOTE BANNER + STOREFRONT FOOTER
         ===================================================================== */}
      <section className="bg-[#9d174d] text-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div>
            <p className="text-xs font-semibold text-pink-200">
              POWER WEB STUDIO AI · {t('E-Commerce Solutions', 'ई-कॉमर्स समाधान')}
            </p>
            <h2 className="text-lg sm:text-2xl font-extrabold tracking-tight mt-1">
              {t(
                'Launch a Real Online Store Like This for Your Business',
                'अपने बिज़नेस के लिए ऐसी असली ऑनलाइन शॉपिंग वेबसाइट बनवाएँ'
              )}
            </h2>
          </div>
          <button
            type="button"
            onClick={onRequestQuote}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white hover:bg-neutral-100 active:scale-[0.98] text-[#9d174d] text-xs sm:text-sm font-extrabold transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            <span>
              {t(
                'Build This Website for Your Business',
                'ऐसी वेबसाइट अपने बिज़नेस के लिए बनवाएँ'
              )}
            </span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </button>
        </div>
      </section>

      <footer className="bg-neutral-950 text-neutral-300 border-t border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-xs sm:text-sm">
          {/* Store Info */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-white font-extrabold text-base">
              <span className="w-7 h-7 rounded bg-[#9d174d] flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 text-white" />
              </span>
              <span>{t('Desi Bazaar', 'देसी बाज़ार')}</span>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              {t(
                'Interactive e-commerce storefront demo created by Power Web Studio AI. Sample catalog only.',
                'Power Web Studio AI द्वारा निर्मित इंटरैक्टिव ऑनलाइन शॉपिंग डेमो। केवल नमूना स्टोर।'
              )}
            </p>
          </div>

          {/* Policies & Links */}
          <div>
            <h3 className="text-white font-bold text-xs uppercase tracking-wider mb-3">
              {t('Store Information', 'स्टोर जानकारी')}
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  type="button"
                  onClick={() => setInfoModal('about')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  {t('About Us', 'हमारे बारे में')}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setInfoModal('contact')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  {t('Contact Us', 'संपर्क')}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setInfoModal('returns')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  {t('Return Policy', 'वापसी नीति')}
                </button>
              </li>
            </ul>
          </div>

          {/* Payment Icons */}
          <div>
            <h3 className="text-white font-bold text-xs uppercase tracking-wider mb-3">
              {t('Supported Payments (Demo)', 'भुगतान विकल्प (नमूना)')}
            </h3>
            <div className="flex flex-wrap gap-2 text-[11px] font-bold">
              <span className="px-2.5 py-1.5 rounded bg-neutral-900 border border-neutral-700 text-white">
                UPI
              </span>
              <span className="px-2.5 py-1.5 rounded bg-neutral-900 border border-neutral-700 text-white">
                VISA
              </span>
              <span className="px-2.5 py-1.5 rounded bg-neutral-900 border border-neutral-700 text-white">
                RuPay
              </span>
              <span className="px-2.5 py-1.5 rounded bg-neutral-900 border border-neutral-700 text-white">
                COD
              </span>
            </div>
          </div>

          {/* Social Icons */}
          <div>
            <h3 className="text-white font-bold text-xs uppercase tracking-wider mb-3">
              {t('Follow Us', 'हमसे जुड़ें')}
            </h3>
            <div className="flex items-center gap-2.5">
              {[
                { label: 'Instagram', path: 'M7 3h10a4 4 0 014 4v10a4 4 0 01-4 4H7a4 4 0 01-4-4V7a4 4 0 014-4zm5 5a4 4 0 100 8 4 4 0 000-8zm5.2-.8a1 1 0 100 2 1 1 0 000-2z' },
                { label: 'Facebook', path: 'M14 9h3V5h-3c-2.2 0-4 1.8-4 4v2H7v4h3v6h4v-6h3l1-4h-4V9c0-.6.4-1 1-1z' },
                { label: 'YouTube', path: 'M21 8.5a2.5 2.5 0 00-1.8-1.8C17.6 6.2 12 6.2 12 6.2s-5.6 0-7.2.5A2.5 2.5 0 003 8.5 26 26 0 002.5 12a26 26 0 00.5 3.5 2.5 2.5 0 001.8 1.8c1.6.5 7.2.5 7.2.5s5.6 0 7.2-.5a2.5 2.5 0 001.8-1.8c.3-1.2.5-2.3.5-3.5s-.2-2.3-.5-3.5zM10 15V9l5 3-5 3z' },
              ].map((soc) => (
                <button
                  key={soc.label}
                  type="button"
                  onClick={() =>
                    showToast(
                      isHindi
                        ? `${soc.label} — डेमो लिंक`
                        : `${soc.label} — Demo social link`
                    )
                  }
                  aria-label={soc.label}
                  className="w-9 h-9 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-600 text-neutral-300 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true">
                    <path d={soc.path} />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t border-neutral-800 py-3 px-4 text-center text-[11px] text-neutral-500">
          {t(
            'Desi Bazaar Demo Store · Powered by Power Web Studio AI (Sample Only)',
            'देसी बाज़ार डेमो स्टोर · Power Web Studio AI द्वारा निर्मित (केवल नमूना)'
          )}
        </div>
      </footer>

      {/* =====================================================================
          MOBILE BOTTOM APP NAVIGATION BAR
         ===================================================================== */}
      <nav
        aria-label={t('Store Navigation', 'स्टोर नेविगेशन')}
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-neutral-200 shadow-lg"
      >
        <div className="grid grid-cols-5 h-15">
          {[
            { id: 'home' as StoreView, labelHi: 'होम', labelEn: 'Home', icon: Home },
            { id: 'categories' as StoreView, labelHi: 'कैटेगरी', labelEn: 'Categories', icon: LayoutGrid },
            { id: 'wishlist' as StoreView, labelHi: 'विशलिस्ट', labelEn: 'Wishlist', icon: Heart, badge: wishlistIds.length },
            { id: 'cart' as StoreView, labelHi: 'कार्ट', labelEn: 'Cart', icon: ShoppingBag, badge: cartCount },
            { id: 'account' as StoreView, labelHi: 'खाता', labelEn: 'Account', icon: User },
          ].map((tab) => {
            const Icon = tab.icon;
            const active =
              view === tab.id ||
              (tab.id === 'cart' && (view === 'address' || view === 'payment' || view === 'success'));
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => navigateView(tab.id)}
                className={`relative flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold cursor-pointer ${
                  active ? 'text-[#9d174d]' : 'text-neutral-500'
                }`}
              >
                <span className="relative">
                  <Icon className="w-5 h-5" />
                  {tab.badge && tab.badge > 0 ? (
                    <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-[#9d174d] text-white text-[9px] font-extrabold font-mono tabular-nums flex items-center justify-center">
                      {tab.badge}
                    </span>
                  ) : null}
                </span>
                <span>{isHindi ? tab.labelHi : tab.labelEn}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* =====================================================================
          FOOTER INFO MODAL (About / Contact / Return Policy — Zero Dead Clicks)
         ===================================================================== */}
      {infoModal && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setInfoModal(null)}
          className="fixed inset-0 z-50 bg-neutral-950/65 flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-white border border-neutral-200 p-6 space-y-3 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-neutral-950 flex items-center gap-2">
                {infoModal === 'returns' && <RotateCcw className="w-4 h-4 text-[#9d174d]" />}
                <span>
                  {infoModal === 'about'
                    ? t('About Desi Bazaar (Demo)', 'देसी बाज़ार के बारे में (डेमो)')
                    : infoModal === 'contact'
                    ? t('Contact Desi Bazaar (Demo)', 'संपर्क जानकारी (डेमो)')
                    : t('Return Policy (Demo)', 'वापसी नीति (डेमो)')}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setInfoModal(null)}
                aria-label={t('Close', 'बंद करें')}
                className="p-1 text-neutral-400 hover:text-neutral-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-neutral-600 leading-relaxed">
              {infoModal === 'about'
                ? t(
                    'Desi Bazaar is a live e-commerce sample storefront demonstrating product discovery, mobile bottom navigation, cart, and multi-step checkout built by Power Web Studio AI.',
                    'देसी बाज़ार Power Web Studio AI द्वारा बनाया गया एक इंटरैक्टिव ऑनलाइन शॉपिंग डेमो है, जो आधुनिक ई-कॉमर्स अनुभव दिखाता है।'
                  )
                : infoModal === 'contact'
                ? t(
                    'To build a similar online store for your own business, click the quote button below to reach Power Web Studio AI.',
                    'अपने बिज़नेस के लिए ऐसी असली वेबसाइट बनवाने हेतु नीचे दिए गए बटन से Power Web Studio AI से संपर्क करें।'
                  )
                : t(
                    'Sample store policy: 7-day easy return & exchange workflow preview. No real purchases are processed in this demo.',
                    'नमूना स्टोर नीति: 7 दिन की आसान वापसी और बदलाव प्रक्रिया का प्रीव्यू। इस डेमो में कोई वास्तविक खरीद नहीं होती।'
                  )}
            </p>
            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setInfoModal(null)}
                className="px-4 py-2 rounded-lg border border-neutral-300 text-xs font-bold text-neutral-700 cursor-pointer"
              >
                {t('Close', 'बंद करें')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setInfoModal(null);
                  onRequestQuote();
                }}
                className="px-4 py-2 rounded-lg bg-[#9d174d] text-white text-xs font-bold cursor-pointer"
              >
                {t('Request Quote', 'कोटेशन माँगें')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          FLOATING "ADDED TO CART" TOAST
         ===================================================================== */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-neutral-950 text-white text-xs sm:text-sm font-semibold shadow-xl flex items-center gap-2 whitespace-nowrap max-w-[92vw] truncate"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="truncate">{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
