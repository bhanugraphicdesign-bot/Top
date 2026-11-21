import React, { useState } from 'react';
import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  ClipboardList,
  IndianRupee,
  LayoutDashboard,
  Package,
  PlusCircle,
  RotateCcw,
  Upload,
} from 'lucide-react';
import {
  CATEGORY_CARDS,
  MahaImage,
  PlatformSettings,
  ProductCategory,
  SELLER_WEEKLY_SALES,
  SampleProduct,
  SellerOrder,
  formatINR,
} from './sampleData';

interface SellerViewProps {
  isHi: boolean;
  products: SampleProduct[];
  onAddProduct: (product: SampleProduct) => void;
  onRestockProduct: (productId: string, addQty: number) => void;
  orders: SellerOrder[];
  onUpdateOrderStatus: (orderId: string, nextStatus: SellerOrder['status']) => void;
  platformSettings: PlatformSettings;
}

type SellerTab = 'dashboard' | 'products' | 'orders' | 'inventory' | 'payouts';

export const SellerView: React.FC<SellerViewProps> = ({
  isHi,
  products,
  onAddProduct,
  onRestockProduct,
  orders,
  onUpdateOrderStatus,
  platformSettings,
}) => {
  const [activeTab, setActiveTab] = useState<SellerTab>('dashboard');

  // Add Product Form State (Local only)
  const [prodName, setProdName] = useState('');
  const [prodPrice, setProdPrice] = useState('1499');
  const [prodStock, setProdStock] = useState('20');
  const [prodCategory, setProdCategory] = useState<ProductCategory>('fashion');
  const [localPhotoUrl, setLocalPhotoUrl] = useState<string | null>(null);
  const [formNotice, setFormNotice] = useState<string | null>(null);

  const lowStockItems = products.filter((p) => p.stock <= 8);
  const totalSampleSales = orders.reduce((sum, o) => sum + o.amount, 0) + 194800;
  const commissionCut = Math.round((totalSampleSales * platformSettings.commissionPercent) / 100);
  const netPayout = totalSampleSales - commissionCut;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setLocalPhotoUrl(preview);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = prodName.trim();
    const numericPrice = Number(prodPrice);
    const numericStock = Number(prodStock);

    if (trimmed.length < 2 || !numericPrice || numericPrice <= 0) {
      setFormNotice(
        isHi ? 'कृपया प्रोडक्ट का नाम और सही कीमत दर्ज करें।' : 'Enter a valid product name and price.'
      );
      return;
    }

    const fallbackImg =
      CATEGORY_CARDS.find((c) => c.id === prodCategory)?.image || '/demo/maha-bazaar/cat-fashion.jpg';

    const newProduct: SampleProduct = {
      id: `mb-custom-${Date.now()}`,
      category: prodCategory,
      nameHi: trimmed,
      nameEn: trimmed,
      price: numericPrice,
      sellerHi: 'नमूना विक्रेता स्टोर (आप)',
      sellerEn: 'Sample Seller Store (You)',
      stock: Number.isFinite(numericStock) && numericStock >= 0 ? numericStock : 10,
      image: localPhotoUrl || fallbackImg,
      objectPosition: '50% 50%',
      descriptionHi: 'विक्रेता पैनल के डेमो फ़ॉर्म से जोड़ा गया नमूना उत्पाद।',
      descriptionEn: 'Sample product added locally from the Seller Panel demo form.',
    };

    onAddProduct(newProduct);
    setProdName('');
    setProdPrice('1499');
    setProdStock('20');
    setLocalPhotoUrl(null);
    setFormNotice(
      isHi
        ? 'डेमो: प्रोडक्ट लोकल सूची और ग्राहक स्टोर में जुड़ गया (रीलोड पर रीसेट होगा)।'
        : 'Demo: Product added to local seller list and storefront (resets on reload).'
    );
  };

  const navItems: { id: SellerTab; icon: React.ComponentType<{ className?: string }>; hi: string; en: string }[] = [
    { id: 'dashboard', icon: LayoutDashboard, hi: 'डैशबोर्ड', en: 'Dashboard' },
    { id: 'products', icon: Package, hi: 'प्रोडक्ट', en: 'Products' },
    { id: 'orders', icon: ClipboardList, hi: 'ऑर्डर', en: 'Orders' },
    { id: 'inventory', icon: Boxes, hi: 'इन्वेंटरी', en: 'Inventory' },
    { id: 'payouts', icon: IndianRupee, hi: 'भुगतान', en: 'Payouts' },
  ];

  // Lightweight SVG Line Chart points
  const maxSales = Math.max(...SELLER_WEEKLY_SALES.map((d) => d.value), 1);
  const svgW = 560;
  const svgH = 190;
  const padX = 36;
  const padY = 22;
  const chartPoints = SELLER_WEEKLY_SALES.map((d, idx) => {
    const x = padX + (idx / (SELLER_WEEKLY_SALES.length - 1)) * (svgW - padX * 2);
    const y = svgH - padY - (d.value / maxSales) * (svgH - padY * 2);
    return { ...d, x, y };
  });
  const polylinePoints = chartPoints.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <div className="bg-slate-50 min-h-screen pb-20 md:pb-12">
      {/* SELLER BANNER */}
      <div className="relative h-44 sm:h-52 bg-indigo-950 overflow-hidden">
        <MahaImage
          src="/demo/maha-bazaar/seller-panel.jpg"
          alt={isHi ? 'विक्रेता पैनल बैनर' : 'Seller panel banner'}
          eager
          className="w-full h-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-950/92 via-indigo-950/75 to-indigo-950/45" />
        <div className="relative max-w-7xl mx-auto h-full px-4 sm:px-6 flex flex-col justify-center">
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-orange-300">
            <span>{isHi ? 'विक्रेता पैनल · नमूना डेटा' : 'Seller Portal · Sample Data'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            {isHi ? 'विक्रेता प्रबंधन डैशबोर्ड' : 'Seller Operations Dashboard'}
          </h1>
          <p className="text-xs sm:text-sm text-indigo-100 mt-1 max-w-xl">
            {isHi
              ? 'नए उत्पाद जोड़ें, ऑर्डर स्टेटस अपडेट करें, लो-स्टॉक संभालें और भुगतान विवरण देखें।'
              : 'Add catalog items, update order status, monitor low stock, and review settlement previews.'}
          </p>
        </div>
      </div>

      {/* MAIN WORKSPACE: SIDEBAR + CONTENT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Desktop Sidebar */}
        <aside className="hidden md:block md:col-span-3 lg:col-span-2">
          <div className="rounded-xl bg-white border border-slate-200 p-2 space-y-1 sticky top-28">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    active
                      ? 'bg-indigo-950 text-white'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-orange-400' : 'text-slate-500'}`} />
                  <span>{isHi ? item.hi : item.en}</span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Active Panel Content */}
        <div className="md:col-span-9 lg:col-span-10 space-y-6">
          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-extrabold text-indigo-950">
                  {isHi ? 'दैनिक विक्रेता सारांश' : 'Daily Seller Overview'}
                </h2>
                <span className="px-2.5 py-1 rounded bg-amber-50 border border-amber-200 text-[11px] font-mono font-bold text-amber-900">
                  {isHi ? 'नमूना डेटा' : 'Sample Data'}
                </span>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    icon: ClipboardList,
                    labelHi: 'आज के ऑर्डर',
                    labelEn: "Today's Orders",
                    value: String(orders.length + 14),
                  },
                  {
                    icon: IndianRupee,
                    labelHi: 'साप्ताहिक बिक्री',
                    labelEn: 'Weekly Sales',
                    value: formatINR(totalSampleSales),
                  },
                  {
                    icon: AlertTriangle,
                    labelHi: 'लो-स्टॉक आइटम',
                    labelEn: 'Low-Stock SKUs',
                    value: String(lowStockItems.length),
                  },
                  {
                    icon: RotateCcw,
                    labelHi: 'रिटर्न अनुरोध',
                    labelEn: 'Return Requests',
                    value: '2',
                  },
                ].map((kpi) => {
                  const Icon = kpi.icon;
                  return (
                    <div
                      key={kpi.labelEn}
                      className="rounded-xl bg-white border border-slate-200 p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500">
                          {isHi ? kpi.labelHi : kpi.labelEn}
                        </span>
                        <Icon className="w-4 h-4 text-orange-500" />
                      </div>
                      <div className="text-2xl font-extrabold text-indigo-950 font-mono tabular-nums">
                        {kpi.value}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {isHi ? 'नमूना डेटा' : 'Sample data'}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Weekly Sales SVG Line Chart */}
              <div className="rounded-xl bg-white border border-slate-200 p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-indigo-950">
                      {isHi ? 'साप्ताहिक बिक्री ग्राफ़ (₹)' : 'Weekly Sales Trend (₹)'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {isHi ? 'पिछले 7 दिनों की नमूना बिक्री प्रवृत्ति' : 'Last 7 days sample revenue trend'}
                    </p>
                  </div>
                  <span className="text-[11px] font-mono font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                    {isHi ? 'नमूना डेटा' : 'Sample Data'}
                  </span>
                </div>

                <div className="w-full overflow-x-auto">
                  <svg
                    viewBox={`0 0 ${svgW} ${svgH}`}
                    className="w-full min-w-[320px] h-52"
                    role="img"
                    aria-label={isHi ? 'साप्ताहिक बिक्री लाइन चार्ट' : 'Weekly sales line chart'}
                  >
                    {[0.25, 0.5, 0.75, 1].map((step) => {
                      const y = svgH - padY - step * (svgH - padY * 2);
                      return (
                        <line
                          key={step}
                          x1={padX}
                          y1={y}
                          x2={svgW - padX}
                          y2={y}
                          stroke="#e2e8f0"
                          strokeDasharray="4 4"
                        />
                      );
                    })}
                    <polyline
                      fill="none"
                      stroke="#312e81"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={polylinePoints}
                    />
                    {chartPoints.map((pt) => (
                      <g key={pt.dayEn}>
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r="5"
                          fill="#f97316"
                          stroke="#ffffff"
                          strokeWidth="2"
                        />
                        <text
                          x={pt.x}
                          y={pt.y - 10}
                          textAnchor="middle"
                          fontSize="10"
                          fill="#1e1b4b"
                          fontFamily="monospace"
                        >
                          {Math.round(pt.value / 1000)}k
                        </text>
                        <text
                          x={pt.x}
                          y={svgH - 4}
                          textAnchor="middle"
                          fontSize="11"
                          fill="#64748b"
                        >
                          {isHi ? pt.dayHi : pt.dayEn}
                        </text>
                      </g>
                    ))}
                  </svg>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: PRODUCTS + ADD PRODUCT FORM */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="rounded-xl bg-white border border-slate-200 p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-base sm:text-lg font-extrabold text-indigo-950 flex items-center gap-2">
                    <PlusCircle className="w-5 h-5 text-orange-500" />
                    <span>{isHi ? 'नया प्रोडक्ट जोड़ें (लोकल डेमो)' : 'Add New Product (Local Demo)'}</span>
                  </h2>
                  <span className="text-[11px] font-mono text-slate-500">
                    {isHi ? 'सिर्फ़ ब्राउज़र State में सेव' : 'Saved in local state only'}
                  </span>
                </div>

                <form onSubmit={handleSaveProduct} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isHi ? 'प्रोडक्ट का नाम *' : 'Product Name *'}
                    </label>
                    <input
                      type="text"
                      value={prodName}
                      onChange={(e) => setProdName(e.target.value)}
                      placeholder={isHi ? 'जैसे: कॉटन जैकेट' : 'e.g. Handwoven Cotton Jacket'}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isHi ? 'कीमत (₹) *' : 'Price (₹) *'}
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={prodPrice}
                      onChange={(e) => setProdPrice(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isHi ? 'स्टॉक मात्रा' : 'Stock Qty'}
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={prodStock}
                      onChange={(e) => setProdStock(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isHi ? 'कैटेगरी' : 'Category'}
                    </label>
                    <select
                      value={prodCategory}
                      onChange={(e) => setProdCategory(e.target.value as ProductCategory)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                    >
                      {CATEGORY_CARDS.map((c) => (
                        <option key={c.id} value={c.id}>
                          {isHi ? c.nameHi : c.nameEn}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isHi ? 'फ़ोटो चुनें (लोकल प्रीव्यू)' : 'Choose Photo (Local Preview)'}
                    </label>
                    <div className="flex items-center gap-3">
                      <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-indigo-400 bg-indigo-50 text-indigo-900 text-xs font-bold cursor-pointer hover:bg-indigo-100">
                        <Upload className="w-4 h-4" />
                        <span>{isHi ? 'फ़ोटो चुनें' : 'Select Image'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                      </label>
                      {localPhotoUrl && (
                        <img
                          src={localPhotoUrl}
                          alt="Preview"
                          className="w-10 h-10 rounded-lg object-cover border border-slate-200"
                        />
                      )}
                    </div>
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full py-2.5 px-4 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold cursor-pointer"
                    >
                      {isHi ? 'प्रोडक्ट सेव करें' : 'Save Product'}
                    </button>
                  </div>
                </form>

                {formNotice && (
                  <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3.5 py-2.5 text-xs font-semibold text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{formNotice}</span>
                  </div>
                )}
              </div>

              {/* Seller Product List */}
              <div className="rounded-xl bg-white border border-slate-200 overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-indigo-950">
                    {isHi ? `सक्रिय कैटलॉग (${products.length})` : `Active Catalog (${products.length})`}
                  </h3>
                  <span className="text-[11px] font-mono text-slate-500">
                    {isHi ? 'नमूना सूची' : 'Sample list'}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs">
                      <tr>
                        <th className="px-4 py-2.5">{isHi ? 'प्रोडक्ट' : 'Product'}</th>
                        <th className="px-4 py-2.5">{isHi ? 'कैटेगरी' : 'Category'}</th>
                        <th className="px-4 py-2.5 text-right">{isHi ? 'कीमत' : 'Price'}</th>
                        <th className="px-4 py-2.5 text-right">{isHi ? 'स्टॉक' : 'Stock'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {products.slice(0, 10).map((prod) => (
                        <tr key={prod.id} className="hover:bg-slate-50">
                          <td className="px-4 py-2.5 font-semibold text-indigo-950 flex items-center gap-2.5">
                            <MahaImage
                              src={prod.image}
                              alt={isHi ? prod.nameHi : prod.nameEn}
                              style={{ objectPosition: prod.objectPosition }}
                              className="w-9 h-9 rounded object-cover shrink-0 border border-slate-200"
                            />
                            <span className="truncate max-w-[200px] sm:max-w-xs">
                              {isHi ? prod.nameHi : prod.nameEn}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-slate-600 capitalize">{prod.category}</td>
                          <td className="px-4 py-2.5 text-right font-mono font-bold tabular-nums">
                            {formatINR(prod.price)}
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                            <span className={prod.stock <= 8 ? 'text-rose-600 font-bold' : 'text-slate-700'}>
                              {prod.stock}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ORDERS TABLE WITH STATUS DROPDOWN */}
          {activeTab === 'orders' && (
            <div className="rounded-xl bg-white border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-extrabold text-indigo-950">
                    {isHi ? 'ऑर्डर प्रबंधन टेबल' : 'Order Fulfillment Table'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {isHi ? 'ड्रॉपडाउन से स्टेटस बदलें (नया → पैक → भेजा गया)' : 'Update status via dropdown (New → Packed → Shipped)'}
                  </p>
                </div>
                <span className="text-[11px] font-mono text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                  {isHi ? 'नमूना डेटा' : 'Sample Data'}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs">
                    <tr>
                      <th className="px-4 py-3">{isHi ? 'ऑर्डर ID' : 'Order ID'}</th>
                      <th className="px-4 py-3">{isHi ? 'ग्राहक' : 'Customer'}</th>
                      <th className="px-4 py-3">{isHi ? 'आइटम' : 'Item'}</th>
                      <th className="px-4 py-3 text-right">{isHi ? 'राशि' : 'Amount'}</th>
                      <th className="px-4 py-3">{isHi ? 'स्टेटस' : 'Status'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-mono font-bold text-indigo-950 whitespace-nowrap">
                          {ord.id}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {isHi ? ord.customerHi : ord.customerEn}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {isHi ? ord.itemHi : ord.itemEn}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold tabular-nums">
                          {formatINR(ord.amount)}
                        </td>
                        <td className="px-4 py-3">
                          <select
                            aria-label={`Order status for ${ord.id}`}
                            value={ord.status}
                            onChange={(e) =>
                              onUpdateOrderStatus(ord.id, e.target.value as SellerOrder['status'])
                            }
                            className={`rounded-lg border px-2.5 py-1.5 text-xs font-bold cursor-pointer ${
                              ord.status === 'shipped'
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                : ord.status === 'packed'
                                ? 'bg-amber-50 border-amber-300 text-amber-900'
                                : 'bg-indigo-50 border-indigo-200 text-indigo-900'
                            }`}
                          >
                            <option value="new">{isHi ? 'नया' : 'New'}</option>
                            <option value="packed">{isHi ? 'पैक' : 'Packed'}</option>
                            <option value="shipped">{isHi ? 'भेजा गया' : 'Shipped'}</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: INVENTORY */}
          {activeTab === 'inventory' && (
            <div className="rounded-xl bg-white border border-slate-200 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-extrabold text-indigo-950">
                  {isHi ? 'इन्वेंटरी और लो-स्टॉक अलर्ट' : 'Inventory & Low-Stock Alerts'}
                </h2>
                <span className="text-xs font-mono text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                  {isHi ? 'नमूना डेटा' : 'Sample Data'}
                </span>
              </div>
              <div className="divide-y divide-slate-100">
                {products.map((prod) => (
                  <div
                    key={prod.id}
                    className="py-3 flex flex-wrap items-center justify-between gap-3"
                  >
                    <div>
                      <div className="text-sm font-bold text-indigo-950">
                        {isHi ? prod.nameHi : prod.nameEn}
                      </div>
                      <div className="text-xs text-slate-500">
                        {isHi ? 'उपलब्ध स्टॉक:' : 'Available stock:'}{' '}
                        <span
                          className={`font-mono font-bold tabular-nums ${
                            prod.stock <= 8 ? 'text-rose-600' : 'text-emerald-700'
                          }`}
                        >
                          {prod.stock} {isHi ? 'यूनिट' : 'units'}
                        </span>
                        {prod.stock <= 8 && (
                          <span className="ml-2 text-rose-600 font-semibold">
                            · {isHi ? 'लो-स्टॉक' : 'Low stock'}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRestockProduct(prod.id, 10)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-950 hover:bg-orange-500 text-white text-xs font-bold cursor-pointer transition-colors"
                    >
                      {isHi ? '+10 स्टॉक जोड़ें' : '+10 Restock'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: PAYOUTS */}
          {activeTab === 'payouts' && (
            <div className="rounded-xl bg-white border border-slate-200 p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-extrabold text-indigo-950">
                  {isHi ? 'विक्रेता भुगतान सारांश' : 'Seller Payout Summary'}
                </h2>
                <span className="text-xs font-mono text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                  {isHi ? 'नमूना डेटा' : 'Sample Data'}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                  <div className="text-xs text-slate-500">{isHi ? 'कुल बिक्री (नमूना)' : 'Gross Sales (Sample)'}</div>
                  <div className="text-xl font-extrabold font-mono text-indigo-950 mt-1 tabular-nums">
                    {formatINR(totalSampleSales)}
                  </div>
                </div>
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                  <div className="text-xs text-slate-500">
                    {isHi
                      ? `प्लेटफ़ॉर्म कमीशन (${platformSettings.commissionPercent}%)`
                      : `Platform Commission (${platformSettings.commissionPercent}%)`}
                  </div>
                  <div className="text-xl font-extrabold font-mono text-rose-700 mt-1 tabular-nums">
                    -{formatINR(commissionCut)}
                  </div>
                </div>
                <div className="rounded-xl bg-indigo-950 text-white p-4">
                  <div className="text-xs text-indigo-200">{isHi ? 'अनुमानित नेट पेआउट' : 'Estimated Net Payout'}</div>
                  <div className="text-xl font-extrabold font-mono text-orange-300 mt-1 tabular-nums">
                    {formatINR(netPayout)}
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-500">
                {isHi
                  ? 'एडमिन टैब में कमीशन % बदलने पर यह नमूना गणना तुरंत अपडेट होती है।'
                  : 'Adjusting the commission % in the Admin tab immediately updates this sample calculation.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* MOBILE BOTTOM TAB BAR */}
      <nav
        aria-label="Seller mobile tabs"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200 px-2 py-1.5 grid grid-cols-5 gap-1 shadow-lg"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 rounded-lg text-[10px] font-bold cursor-pointer ${
                active ? 'text-orange-600 bg-orange-50' : 'text-slate-600'
              }`}
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span className="truncate">{isHi ? item.hi : item.en}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
