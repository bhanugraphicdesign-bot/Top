import React, { useState } from 'react';
import { ShoppingBag } from 'lucide-react';

export type MarketplaceRole = 'customer' | 'seller' | 'delivery' | 'admin';
export type ProductCategory = 'fashion' | 'grocery' | 'electronics' | 'home-decor';

export interface SampleProduct {
  id: string;
  category: ProductCategory;
  nameHi: string;
  nameEn: string;
  price: number;
  sellerHi: string;
  sellerEn: string;
  stock: number;
  image: string;
  objectPosition: string;
  descriptionHi: string;
  descriptionEn: string;
}

export interface CartItem {
  product: SampleProduct;
  quantity: number;
}

export interface SellerOrder {
  id: string;
  customerHi: string;
  customerEn: string;
  itemHi: string;
  itemEn: string;
  amount: number;
  date: string;
  status: 'new' | 'packed' | 'shipped';
}

export interface DeliveryTask {
  id: string;
  orderId: string;
  customerHi: string;
  customerEn: string;
  addressHi: string;
  addressEn: string;
  codAmount: number;
  paymentMode: 'Prepaid' | 'COD';
  delivered: boolean;
}

export interface SellerApplication {
  id: string;
  storeNameHi: string;
  storeNameEn: string;
  ownerHi: string;
  ownerEn: string;
  categoryHi: string;
  categoryEn: string;
  cityHi: string;
  cityEn: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface CouponConfig {
  code: string;
  percent: number;
}

export interface PlatformSettings {
  commissionPercent: number;
  deliveryFee: number;
  coupons: CouponConfig[];
}

export const CATEGORY_CARDS: {
  id: ProductCategory;
  nameHi: string;
  nameEn: string;
  subtitleHi: string;
  subtitleEn: string;
  image: string;
}[] = [
  {
    id: 'fashion',
    nameHi: 'फ़ैशन',
    nameEn: 'Fashion',
    subtitleHi: 'कुर्ता, स्टोल, ब्लेज़र व फ़ुटवियर',
    subtitleEn: 'Kurtas, stoles, blazers & footwear',
    image: '/demo/maha-bazaar/cat-fashion.jpg',
  },
  {
    id: 'grocery',
    nameHi: 'किराना',
    nameEn: 'Grocery',
    subtitleHi: 'मसाले, दालें, चाय और तेल',
    subtitleEn: 'Spices, lentils, tea & pantry',
    image: '/demo/maha-bazaar/cat-grocery.jpg',
  },
  {
    id: 'electronics',
    nameHi: 'इलेक्ट्रॉनिक्स',
    nameEn: 'Electronics',
    subtitleHi: 'हेडफ़ोन, स्मार्टवॉच, लैपटॉप व स्पीकर',
    subtitleEn: 'Headphones, smartwatch, laptop & speaker',
    image: '/demo/maha-bazaar/cat-electronics.jpg',
  },
  {
    id: 'home-decor',
    nameHi: 'होम डेकोर',
    nameEn: 'Home Decor',
    subtitleHi: 'लैंप, सिरेमिक वास, कुशन व ट्रे',
    subtitleEn: 'Lamps, ceramic vases, cushions & trays',
    image: '/demo/maha-bazaar/cat-home-decor.jpg',
  },
];

export const INITIAL_PRODUCTS: SampleProduct[] = [
  // Fashion (4)
  {
    id: 'mb-f1',
    category: 'fashion',
    nameHi: 'इंडिगो हैंडलूम कॉटन कुर्ता',
    nameEn: 'Indigo Handloom Cotton Kurta',
    price: 1299,
    sellerHi: 'नमूना स्टोर 1 · जयपुर टेक्सटाइल',
    sellerEn: 'Sample Store 1 · Jaipur Textiles',
    stock: 24,
    image: '/demo/maha-bazaar/cat-fashion.jpg',
    objectPosition: '18% 40%',
    descriptionHi:
      'आरामदायक शुद्ध सूती हैंडलूम कुर्ता, हल्की सिलाई और रोज़ाना व उत्सव दोनों के लिए उपयुक्त।',
    descriptionEn:
      'Breathable handloom cotton kurta with subtle stitch detailing suitable for everyday and festive wear.',
  },
  {
    id: 'mb-f2',
    category: 'fashion',
    nameHi: 'केसरिया सिल्क ब्लेंड स्टोल',
    nameEn: 'Saffron Silk Blend Stole',
    price: 899,
    sellerHi: 'नमूना स्टोर 2 · वाराणसी लूम्स',
    sellerEn: 'Sample Store 2 · Varanasi Looms',
    stock: 16,
    image: '/demo/maha-bazaar/cat-fashion.jpg',
    objectPosition: '43% 35%',
    descriptionHi:
      'मुलायम बनावट वाला पारंपरिक केसरिया स्टोल, हल्का वज़न और सुरुचिपूर्ण किनारी के साथ।',
    descriptionEn:
      'Soft woven saffron silk-blend stole with delicate border finish and lightweight drape.',
  },
  {
    id: 'mb-f3',
    category: 'fashion',
    nameHi: 'क्लासिक लिनन टेलर्ड ब्लेज़र',
    nameEn: 'Classic Linen Tailored Blazer',
    price: 3499,
    sellerHi: 'नमूना स्टोर 3 · सूरत स्टूडियो',
    sellerEn: 'Sample Store 3 · Surat Studio',
    stock: 9,
    image: '/demo/maha-bazaar/cat-fashion.jpg',
    objectPosition: '70% 42%',
    descriptionHi:
      'गर्मियों व ऑफिस मीटिंग के लिए हवादार लिनन फ़ैब्रिक से तैयार क्लासिक फिट ब्लेज़र।',
    descriptionEn:
      'Breathable tailored linen blazer crafted for crisp office meetings and warm-weather comfort.',
  },
  {
    id: 'mb-f4',
    category: 'fashion',
    nameHi: 'हैंडक्राफ़्टेड लेदर जूती व स्लाइड्स',
    nameEn: 'Handcrafted Leather Jutti Pair',
    price: 1599,
    sellerHi: 'नमूना स्टोर 4 · आगरा क्राफ्ट्स',
    sellerEn: 'Sample Store 4 · Agra Crafts',
    stock: 5,
    image: '/demo/maha-bazaar/cat-fashion.jpg',
    objectPosition: '56% 88%',
    descriptionHi:
      'कुशन सोल और हस्तनिर्मित सिलाई के साथ टिकाऊ पारंपरिक फ़ुटवियर।',
    descriptionEn:
      'Durable artisanal footwear with cushioned footbed and traditional stitched finish.',
  },

  // Grocery (4)
  {
    id: 'mb-g1',
    category: 'grocery',
    nameHi: 'ऑर्गेनिक साबुत मसाला पैक (4 जार)',
    nameEn: 'Whole Spices Pantry Pack (4 Jars)',
    price: 649,
    sellerHi: 'नमूना स्टोर 5 · कोच्चि स्पाइस मार्ट',
    sellerEn: 'Sample Store 5 · Kochi Spice Mart',
    stock: 42,
    image: '/demo/maha-bazaar/cat-grocery.jpg',
    objectPosition: '28% 72%',
    descriptionHi:
      'हरी इलायची, दालचीनी, लौंग और जीरा का ताज़ा पैक — स्वच्छ एयरटाइट पैकेजिंग में।',
    descriptionEn:
      'Aromatic cardamom, cinnamon, cloves, and cumin packed fresh in clean airtight containers.',
  },
  {
    id: 'mb-g2',
    category: 'grocery',
    nameHi: 'अनपॉलिश्ड दाल कॉम्बो (3 किग्रा)',
    nameEn: 'Unpolished Lentils Combo (3 kg)',
    price: 540,
    sellerHi: 'नमूना स्टोर 6 · इंदौर अनाज भंडार',
    sellerEn: 'Sample Store 6 · Indore Grain Mart',
    stock: 35,
    image: '/demo/maha-bazaar/cat-grocery.jpg',
    objectPosition: '66% 35%',
    descriptionHi:
      'तूर, मूँग और मसूर दाल का प्राकृतिक अनपॉलिश्ड पैक, रोज़ाना घरेलू रसोई के लिए।',
    descriptionEn:
      'Naturally processed unpolished toor, moong, and masoor lentils for daily home cooking.',
  },
  {
    id: 'mb-g3',
    category: 'grocery',
    nameHi: 'प्रीमियम असम चाय टिन (500 ग्राम)',
    nameEn: 'Premium Assam Tea Tin (500 g)',
    price: 420,
    sellerHi: 'नमूना स्टोर 7 · जोरहाट टी हाउस',
    sellerEn: 'Sample Store 7 · Jorhat Tea House',
    stock: 19,
    image: '/demo/maha-bazaar/cat-grocery.jpg',
    objectPosition: '68% 68%',
    descriptionHi:
      'कड़क स्वाद और ताज़ी सुगंध वाली चयनित पत्तियाँ, दोबारा इस्तेमाल होने वाले टिन डिब्बे में।',
    descriptionEn:
      'Rich single-origin Assam tea leaves packed in a reusable metal caddy to lock in aroma.',
  },
  {
    id: 'mb-g4',
    category: 'grocery',
    nameHi: 'कोल्ड-प्रेस्ड सरसों तेल व बादाम पैक',
    nameEn: 'Cold-Pressed Oil & Almonds Pack',
    price: 790,
    sellerHi: 'नमूना स्टोर 8 · हिमालय फ़ार्म्स',
    sellerEn: 'Sample Store 8 · Himalaya Farms',
    stock: 6,
    image: '/demo/maha-bazaar/cat-grocery.jpg',
    objectPosition: '86% 68%',
    descriptionHi:
      'लकड़ी की घानी से निकला शुद्ध तेल और चयनित कैलिफ़ोर्निया बादाम का किचन कॉम्बो।',
    descriptionEn:
      'Wood-pressed cooking oil paired with selected crunchy almonds for everyday nutrition.',
  },

  // Electronics (4)
  {
    id: 'mb-e1',
    category: 'electronics',
    nameHi: 'वायरलेस ओवर-ईयर स्टूडियो हेडफ़ोन',
    nameEn: 'Wireless Over-Ear Studio Headphones',
    price: 4999,
    sellerHi: 'नमूना स्टोर 9 · टेक हब इंडिया',
    sellerEn: 'Sample Store 9 · Tech Hub India',
    stock: 14,
    image: '/demo/maha-bazaar/cat-electronics.jpg',
    objectPosition: '18% 48%',
    descriptionHi:
      'मुलायम मेमोरी-फ़ोम कुशन, स्पष्ट कॉलिंग माइक और लंबी बैटरी के साथ वायरलेस हेडफ़ोन।',
    descriptionEn:
      'Memory-foam ear cushions, clear voice pickup, and balanced acoustic tuning for work and music.',
  },
  {
    id: 'mb-e2',
    category: 'electronics',
    nameHi: 'फिटनेस और नोटिफ़िकेशन स्मार्टवॉच',
    nameEn: 'Fitness & Alert Smartwatch',
    price: 2799,
    sellerHi: 'नमूना स्टोर 10 · पल्स डिवाइसेज़',
    sellerEn: 'Sample Store 10 · Pulse Devices',
    stock: 21,
    image: '/demo/maha-bazaar/cat-electronics.jpg',
    objectPosition: '38% 64%',
    descriptionHi:
      'चमकदार डिस्प्ले, स्टेप ट्रैकिंग और कॉल अलर्ट के साथ हल्की डेली स्मार्टवॉच।',
    descriptionEn:
      'Lightweight everyday smartwatch with crisp display, activity tracking, and message alerts.',
  },
  {
    id: 'mb-e3',
    category: 'electronics',
    nameHi: 'अल्ट्रा-स्लिम एल्युमिनियम लैपटॉप',
    nameEn: 'Ultra-Slim Aluminum Laptop',
    price: 42999,
    sellerHi: 'नमूना स्टोर 11 · मेट्रो सिस्टम्स',
    sellerEn: 'Sample Store 11 · Metro Systems',
    stock: 4,
    image: '/demo/maha-bazaar/cat-electronics.jpg',
    objectPosition: '58% 64%',
    descriptionHi:
      'ऑफिस, पढ़ाई और बिज़नेस कार्य के लिए तेज़ SSD और पतले मेटल बॉडी वाला आधुनिक लैपटॉप।',
    descriptionEn:
      'Sleek brushed-aluminum notebook built for smooth multitasking, study, and remote work.',
  },
  {
    id: 'mb-e4',
    category: 'electronics',
    nameHi: 'कॉम्पैक्ट स्मार्ट होम स्पीकर',
    nameEn: 'Compact Smart Home Speaker',
    price: 3299,
    sellerHi: 'नमूना स्टोर 12 · साउंडवेव स्टोर',
    sellerEn: 'Sample Store 12 · Soundwave Store',
    stock: 18,
    image: '/demo/maha-bazaar/cat-electronics.jpg',
    objectPosition: '86% 56%',
    descriptionHi:
      '360-डिग्री साफ़ ऑडियो आउटपुट और मिनिमल फ़ैब्रिक डिज़ाइन वाला कॉम्पैक्ट ब्लूटूथ स्पीकर।',
    descriptionEn:
      'Room-filling 360-degree audio wrapped in acoustic mesh fabric for desks and living spaces.',
  },

  // Home Decor (4)
  {
    id: 'mb-h1',
    category: 'home-decor',
    nameHi: 'ब्रश्ड ब्रास टेबल लैंप',
    nameEn: 'Brushed Brass Table Lamp',
    price: 2499,
    sellerHi: 'नमूना स्टोर 13 · मुरादाबाद आर्ट्स',
    sellerEn: 'Sample Store 13 · Moradabad Arts',
    stock: 11,
    image: '/demo/maha-bazaar/cat-home-decor.jpg',
    objectPosition: '20% 52%',
    descriptionHi:
      'लिनेन शेड और पीतल के बेस वाला वार्म लाइट टेबल लैंप, लिविंग रूम व बेडरूम के लिए।',
    descriptionEn:
      'Warm ambient table lamp with brushed brass base and natural woven linen shade.',
  },
  {
    id: 'mb-h2',
    category: 'home-decor',
    nameHi: 'हैंडक्राफ़्टेड सिरेमिक फ़्लावर वास',
    nameEn: 'Handcrafted Ceramic Flower Vase',
    price: 1199,
    sellerHi: 'नमूना स्टोर 14 · खुर्जा पॉटरी',
    sellerEn: 'Sample Store 14 · Khurja Pottery',
    stock: 27,
    image: '/demo/maha-bazaar/cat-home-decor.jpg',
    objectPosition: '44% 58%',
    descriptionHi:
      'मैट टेराकोटा बेस और स्पेकल्ड ग्लेज़ के साथ आधुनिक हस्तनिर्मित सिरेमिक वास।',
    descriptionEn:
      'Speckled matte ceramic vessel with raw terracotta base suited for dried botanicals.',
  },
  {
    id: 'mb-h3',
    category: 'home-decor',
    nameHi: 'हैंडवोवन कॉटन कुशन कवर (सेट ऑफ 2)',
    nameEn: 'Handwoven Cotton Cushion Set (2)',
    price: 949,
    sellerHi: 'नमूना स्टोर 15 · पानीपत होम',
    sellerEn: 'Sample Store 15 · Panipat Home',
    stock: 30,
    image: '/demo/maha-bazaar/cat-home-decor.jpg',
    objectPosition: '62% 58%',
    descriptionHi:
      'ज्यामितीय पैटर्न और टैसल कॉर्नर के साथ मोटे कॉटन से बुने हुए सजावटी कुशन।',
    descriptionEn:
      'Textured cotton cushions with geometric weaving and corner tassels for warm seating accents.',
  },
  {
    id: 'mb-h4',
    category: 'home-decor',
    nameHi: 'नक्काशीदार अखरोट वुड सर्विंग ट्रे',
    nameEn: 'Carved Walnut Wood Serving Tray',
    price: 1699,
    sellerHi: 'नमूना स्टोर 16 · सहारनपुर वुडक्राफ्ट',
    sellerEn: 'Sample Store 16 · Saharanpur Woodcraft',
    stock: 7,
    image: '/demo/maha-bazaar/cat-home-decor.jpg',
    objectPosition: '66% 78%',
    descriptionHi:
      'मज़बूत हैंडल और पारंपरिक बॉर्डर नक्काशी के साथ प्रीमियम लकड़ी की सर्विंग व सेंटर ट्रे।',
    descriptionEn:
      'Hand-carved wooden serving and console tray finished with food-safe matte polish.',
  },
];

export const INITIAL_SELLER_ORDERS: SellerOrder[] = [
  {
    id: 'MB-DEMO-2048',
    customerHi: 'रोहित शर्मा (रायपुर)',
    customerEn: 'Rohit Sharma (Raipur)',
    itemHi: 'इंडिगो हैंडलूम कॉटन कुर्ता × 2',
    itemEn: 'Indigo Handloom Cotton Kurta × 2',
    amount: 2598,
    date: 'आज, 10:15 AM',
    status: 'new',
  },
  {
    id: 'MB-DEMO-2047',
    customerHi: 'प्रियंका नायडू (पुणे)',
    customerEn: 'Priyanka Naidu (Pune)',
    itemHi: 'वायरलेस ओवर-ईयर स्टूडियो हेडफ़ोन × 1',
    itemEn: 'Wireless Over-Ear Studio Headphones × 1',
    amount: 4999,
    date: 'आज, 09:40 AM',
    status: 'packed',
  },
  {
    id: 'MB-DEMO-2046',
    customerHi: 'अमित पाटीदार (इंदौर)',
    customerEn: 'Amit Patidar (Indore)',
    itemHi: 'ब्रश्ड ब्रास टेबल लैंप × 1',
    itemEn: 'Brushed Brass Table Lamp × 1',
    amount: 2499,
    date: 'कल, 06:25 PM',
    status: 'shipped',
  },
  {
    id: 'MB-DEMO-2045',
    customerHi: 'सुनीता जोशी (जयपुर)',
    customerEn: 'Sunita Joshi (Jaipur)',
    itemHi: 'ऑर्गेनिक साबुत मसाला पैक × 3',
    itemEn: 'Whole Spices Pantry Pack × 3',
    amount: 1947,
    date: 'कल, 03:10 PM',
    status: 'packed',
  },
  {
    id: 'MB-DEMO-2044',
    customerHi: 'विकास ठाकुर (भोपाल)',
    customerEn: 'Vikas Thakur (Bhopal)',
    itemHi: 'नक्काशीदार वुड सर्विंग ट्रे × 1',
    itemEn: 'Carved Walnut Wood Serving Tray × 1',
    amount: 1699,
    date: 'कल, 11:50 AM',
    status: 'new',
  },
];

export const INITIAL_DELIVERY_TASKS: DeliveryTask[] = [
  {
    id: 'dlv-1',
    orderId: 'MB-DEMO-2048',
    customerHi: 'रोहित शर्मा',
    customerEn: 'Rohit Sharma',
    addressHi: 'सेक्टर 4, शंकर नगर, रायपुर 492007',
    addressEn: 'Sector 4, Shankar Nagar, Raipur 492007',
    codAmount: 2598,
    paymentMode: 'COD',
    delivered: false,
  },
  {
    id: 'dlv-2',
    orderId: 'MB-DEMO-2047',
    customerHi: 'प्रियंका नायडू',
    customerEn: 'Priyanka Naidu',
    addressHi: 'बानर रोड, फ़्लैट 302, पुणे 411045',
    addressEn: 'Baner Road, Flat 302, Pune 411045',
    codAmount: 0,
    paymentMode: 'Prepaid',
    delivered: false,
  },
  {
    id: 'dlv-3',
    orderId: 'MB-DEMO-2046',
    customerHi: 'अमित पाटीदार',
    customerEn: 'Amit Patidar',
    addressHi: 'विजय नगर स्कीम 54, इंदौर 452010',
    addressEn: 'Vijay Nagar Scheme 54, Indore 452010',
    codAmount: 2499,
    paymentMode: 'COD',
    delivered: false,
  },
  {
    id: 'dlv-4',
    orderId: 'MB-DEMO-2045',
    customerHi: 'सुनीता जोशी',
    customerEn: 'Sunita Joshi',
    addressHi: 'मालवीय नगर ब्लॉक B, जयपुर 302017',
    addressEn: 'Malviya Nagar Block B, Jaipur 302017',
    codAmount: 0,
    paymentMode: 'Prepaid',
    delivered: true,
  },
  {
    id: 'dlv-5',
    orderId: 'MB-DEMO-2044',
    customerHi: 'विकास ठाकुर',
    customerEn: 'Vikas Thakur',
    addressHi: 'अरेरा कॉलोनी E-4, भोपाल 462016',
    addressEn: 'Arera Colony E-4, Bhopal 462016',
    codAmount: 1699,
    paymentMode: 'COD',
    delivered: false,
  },
];

export const INITIAL_SELLER_APPLICATIONS: SellerApplication[] = [
  {
    id: 'app-1',
    storeNameHi: 'कोसा सिल्क एम्पोरियम (नमूना)',
    storeNameEn: 'Kosa Silk Emporium (Sample)',
    ownerHi: 'राजेश साहू',
    ownerEn: 'Rajesh Sahu',
    categoryHi: 'फ़ैशन',
    categoryEn: 'Fashion',
    cityHi: 'बिलासपुर',
    cityEn: 'Bilaspur',
    status: 'pending',
  },
  {
    id: 'app-2',
    storeNameHi: 'दक्षिण स्पाइस हाउस (नमूना)',
    storeNameEn: 'Dakshin Spice House (Sample)',
    ownerHi: 'मीनाक्षी अय्यर',
    ownerEn: 'Meenakshi Iyer',
    categoryHi: 'किराना',
    categoryEn: 'Grocery',
    cityHi: 'कोयंबटूर',
    cityEn: 'Coimbatore',
    status: 'pending',
  },
  {
    id: 'app-3',
    storeNameHi: 'अर्बन गैजेट हब (नमूना)',
    storeNameEn: 'Urban Gadget Hub (Sample)',
    ownerHi: 'सौरभ कुलकर्णी',
    ownerEn: 'Saurabh Kulkarni',
    categoryHi: 'इलेक्ट्रॉनिक्स',
    categoryEn: 'Electronics',
    cityHi: 'नागपुर',
    cityEn: 'Nagpur',
    status: 'pending',
  },
  {
    id: 'app-4',
    storeNameHi: 'कलाकृति होम स्टूडियो (नमूना)',
    storeNameEn: 'Kalakriti Home Studio (Sample)',
    ownerHi: 'अनीता अग्रवाल',
    ownerEn: 'Anita Agarwal',
    categoryHi: 'होम डेकोर',
    categoryEn: 'Home Decor',
    cityHi: 'जोधपुर',
    cityEn: 'Jodhpur',
    status: 'approved',
  },
];

export const SELLER_WEEKLY_SALES = [
  { dayHi: 'सोम', dayEn: 'Mon', value: 18400 },
  { dayHi: 'मंगल', dayEn: 'Tue', value: 24200 },
  { dayHi: 'बुध', dayEn: 'Wed', value: 21800 },
  { dayHi: 'गुरु', dayEn: 'Thu', value: 29500 },
  { dayHi: 'शुक्र', dayEn: 'Fri', value: 34100 },
  { dayHi: 'शनि', dayEn: 'Sat', value: 41600 },
  { dayHi: 'रवि', dayEn: 'Sun', value: 38900 },
];

export const ADMIN_CATEGORY_SALES = [
  { labelHi: 'फ़ैशन', labelEn: 'Fashion', value: 42 },
  { labelHi: 'इलेक्ट्रॉनिक्स', labelEn: 'Electronics', value: 58 },
  { labelHi: 'किराना', labelEn: 'Grocery', value: 36 },
  { labelHi: 'होम डेकोर', labelEn: 'Home Decor', value: 29 },
];

export const ADMIN_MONTHLY_SALES = [
  { monthHi: 'जन', monthEn: 'Jan', value: 28 },
  { monthHi: 'फ़र', monthEn: 'Feb', value: 34 },
  { monthHi: 'मार्च', monthEn: 'Mar', value: 41 },
  { monthHi: 'अप्रैल', monthEn: 'Apr', value: 46 },
  { monthHi: 'मई', monthEn: 'May', value: 53 },
  { monthHi: 'जून', monthEn: 'Jun', value: 64 },
];

export const PLATFORM_FEATURES = [
  { id: 'multi-vendor', titleHi: 'मल्टी-वेंडर', titleEn: 'Multi-Vendor', descHi: 'अलग-अलग विक्रेता स्टोर और स्वतंत्र कैटलॉग प्रबंधन।', descEn: 'Independent seller storefronts and unified catalog control.' },
  { id: 'live-tracking', titleHi: 'लाइव ऑर्डर ट्रैकिंग', titleEn: 'Live Order Tracking', descHi: 'पैक से डिलीवरी तक स्पष्ट चरण-दर-चरण अपडेट।', descEn: 'Step-by-step milestone visibility from packing to doorstep.' },
  { id: 'payments', titleHi: 'UPI / कार्ड / COD', titleEn: 'UPI / Card / COD', descHi: 'लोकप्रिय भारतीय भुगतान विकल्पों के लिए तैयार चेकआउट।', descEn: 'Checkout ready for Indian UPI, card, and cash-on-delivery flows.' },
  { id: 'coupons', titleHi: 'कूपन और ऑफ़र', titleEn: 'Coupons & Offers', descHi: 'प्रतिशत छूट, न्यूनतम ऑर्डर और त्योहारी कोड नियम।', descEn: 'Percentage discounts, campaign codes, and cart rules.' },
  { id: 'payouts', titleHi: 'विक्रेता पेआउट', titleEn: 'Seller Payouts', descHi: 'स्वचालित कमीशन गणना और स्पष्ट सेटलमेंट विवरण।', descEn: 'Automated commission split and transparent settlement ledgers.' },
  { id: 'inventory', titleHi: 'इन्वेंटरी अलर्ट', titleEn: 'Inventory Alerts', descHi: 'लो-स्टॉक चेतावनी ताकि लोकप्रिय उत्पाद खत्म न हों।', descEn: 'Low-stock alerts so fast-moving SKUs stay replenished.' },
  { id: 'gst-invoice', titleHi: 'GST इनवॉइस', titleEn: 'GST Invoicing', descHi: 'मानक टैक्स ब्रेकअप के साथ स्वचालित डिजिटल बिल।', descEn: 'Structured tax-ready invoices generated for every order.' },
  { id: 'returns', titleHi: 'रिटर्न मैनेजमेंट', titleEn: 'Return Management', descHi: 'आसान रिटर्न अनुरोध, पिकअप और रिफ़ंड ट्रैकिंग।', descEn: 'Clear return workflows, reverse pickup, and refund status.' },
  { id: 'analytics', titleHi: 'रिपोर्ट और एनालिटिक्स', titleEn: 'Reports & Analytics', descHi: 'कैटेगरी बिक्री, GMV और विक्रेता प्रदर्शन डैशबोर्ड।', descEn: 'Category performance, GMV overview, and operational reports.' },
  { id: 'rbac', titleHi: 'रोल-आधारित एक्सेस', titleEn: 'Role-Based Access', descHi: 'सुपर एडमिन, विक्रेता, डिलीवरी व सपोर्ट के अलग अधिकार।', descEn: 'Separate permissions for Admin, Seller, Delivery, and Support.' },
  { id: 'bilingual', titleHi: 'हिंदी / English', titleEn: 'Hindi / English', descHi: 'भारतीय ग्राहकों और विक्रेताओं के लिए द्विभाषी अनुभव।', descEn: 'Bilingual storefront and operations interface for wider reach.' },
  { id: 'mobile-ready', titleHi: 'मोबाइल ऐप-रेडी', titleEn: 'Mobile App-Ready', descHi: 'Android और iOS ऐप से जुड़ने योग्य API-फ़र्स्ट संरचना।', descEn: 'API-first architecture ready to power Android & iOS apps.' },
];

export const PLATFORM_PACKAGES = [
  {
    id: 'growth',
    nameHi: 'ग्रोथ',
    nameEn: 'Growth',
    priceHi: '₹4,99,999',
    priceEn: '₹4,99,999',
    popular: false,
    summaryHi: 'क्षेत्रीय और निश मल्टी-वेंडर वेब मार्केटप्लेस शुरू करने के लिए।',
    summaryEn: 'Launch a regional or niche multi-vendor web marketplace.',
    featuresHi: [
      'वेब मार्केटप्लेस + कस्टम ब्रांडिंग',
      'विक्रेता पैनल (कैटलॉग, ऑर्डर, इन्वेंटरी)',
      'कूपन इंजन, GST इनवॉइस और COD/ऑनलाइन चेकआउट फ़्लो',
      'एडमिन नियंत्रण और बुनियादी रिपोर्ट्स',
    ],
    featuresEn: [
      'Custom branded web marketplace storefront',
      'Seller portal for catalog, orders, and inventory',
      'Coupon engine, GST invoicing, and checkout flows',
      'Admin moderation and core operational reports',
    ],
  },
  {
    id: 'enterprise',
    nameHi: 'एंटरप्राइज़',
    nameEn: 'Enterprise',
    priceHi: '₹19,99,999',
    priceEn: '₹19,99,999',
    popular: true,
    summaryHi: 'वेब, ग्राहक मोबाइल ऐप, डिलीवरी ऐप और पूर्ण एडमिन सूट।',
    summaryEn: 'Complete web + customer mobile apps + delivery app + admin suite.',
    featuresHi: [
      'वेब मार्केटप्लेस + Android / iOS ग्राहक ऐप',
      'डेडिकेटेड डिलीवरी पार्टनर ऐप (OTP वेरिफ़िकेशन)',
      'विक्रेता ऑनबोर्डिंग, कमीशन और पेआउट मॉड्यूल',
      'उन्नत एनालिटिक्स, रोल-आधारित एक्सेस और द्विभाषी UI',
    ],
    featuresEn: [
      'Web marketplace + Android / iOS customer apps',
      'Dedicated delivery partner app with OTP confirmation',
      'Seller onboarding, commission rules, and payout tracking',
      'Advanced analytics, RBAC controls, and bilingual UX',
    ],
  },
  {
    id: 'flagship',
    nameHi: 'फ़्लैगशिप',
    nameEn: 'Flagship',
    priceHi: 'कस्टम कोट',
    priceEn: 'Custom Quote',
    popular: false,
    summaryHi: 'बड़े स्तर के राष्ट्रीय मार्केटप्लेस और कस्टम ERP इंटीग्रेशन के लिए।',
    summaryEn: 'Large-scale national marketplaces with custom ERP & logistics integrations.',
    featuresHi: [
      'हाई-स्केल मल्टी-रीजन प्लेटफ़ॉर्म आर्किटेक्चर',
      'कस्टम ERP, वेयरहाउस और कूरियर API इंटीग्रेशन',
      'समर्पित इंजीनियरिंग टीम और कस्टम सुरक्षा ऑडिट',
      'मल्टी-वेयरहाउस रूटिंग व एंटरप्राइज़ SLA विकल्प',
    ],
    featuresEn: [
      'High-scale multi-region platform architecture',
      'Custom ERP, warehouse, and courier API integrations',
      'Dedicated engineering team and custom security review',
      'Multi-warehouse routing and tailored rollout roadmap',
    ],
  },
];

export const ROLE_PERMISSIONS = [
  {
    roleHi: 'सुपर एडमिन',
    roleEn: 'Super Admin',
    accessHi: 'सभी मॉड्यूल, कमीशन सेटिंग्स, विक्रेता स्वीकृति, रोल नियंत्रण',
    accessEn: 'Full platform control, commission rules, seller approvals, RBAC',
  },
  {
    roleHi: 'विक्रेता (Seller)',
    roleEn: 'Seller',
    accessHi: 'अपना कैटलॉग, स्टॉक अपडेट, ऑर्डर पैकिंग व पेआउट सारांश',
    accessEn: 'Own catalog, stock updates, order packing, and payout ledger',
  },
  {
    roleHi: 'डिलीवरी पार्टनर',
    roleEn: 'Delivery Partner',
    accessHi: 'निर्धारित पार्सल सूची, रूट जानकारी और OTP डिलीवरी पुष्टि',
    accessEn: 'Assigned parcel queue, drop details, and OTP delivery confirmation',
  },
  {
    roleHi: 'सपोर्ट टीम',
    roleEn: 'Support Team',
    accessHi: 'ऑर्डर स्थिति जाँच, रिटर्न सहायता और ग्राहक टिकट समाधान',
    accessEn: 'Order lookup, return assistance, and customer ticket resolution',
  },
];

export const MahaImage: React.FC<{
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  eager?: boolean;
}> = ({ src, alt, className, style, eager = false }) => {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return React.createElement(
      'div',
      {
        className: `flex flex-col items-center justify-center bg-slate-100 text-indigo-900 ${className || ''}`,
        role: 'img',
        'aria-label': alt,
      },
      React.createElement(ShoppingBag, { className: 'w-7 h-7 text-orange-500 mb-1.5' }),
      React.createElement(
        'span',
        { className: 'text-xs font-semibold text-slate-600 px-3 text-center' },
        alt
      )
    );
  }

  return React.createElement('img', {
    src,
    alt,
    loading: eager ? 'eager' : 'lazy',
    decoding: 'async',
    referrerPolicy: 'no-referrer',
    onError: () => setFailed(true),
    style,
    className,
  });
};

export function formatINR(value: number): string {
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}
