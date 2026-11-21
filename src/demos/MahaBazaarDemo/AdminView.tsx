import React, { useState } from 'react';
import {
  CheckCircle2,
  ClipboardList,
  IndianRupee,
  Plus,
  Settings,
  ShieldCheck,
  Store,
  Users,
  XCircle,
} from 'lucide-react';
import {
  ADMIN_CATEGORY_SALES,
  ADMIN_MONTHLY_SALES,
  MahaImage,
  PlatformSettings,
  ROLE_PERMISSIONS,
  SellerApplication,
} from './sampleData';

interface AdminViewProps {
  isHi: boolean;
  applications: SellerApplication[];
  onUpdateApplication: (id: string, status: 'approved' | 'rejected') => void;
  platformSettings: PlatformSettings;
  onUpdateSettings: (next: PlatformSettings) => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  isHi,
  applications,
  onUpdateApplication,
  platformSettings,
  onUpdateSettings,
}) => {
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponPercent, setNewCouponPercent] = useState('15');
  const [settingsSavedMsg, setSettingsSavedMsg] = useState<string | null>(null);

  const approvedCount = applications.filter((a) => a.status === 'approved').length;

  const handleAddCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = newCouponCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    const pct = Math.min(50, Math.max(5, Number(newCouponPercent) || 10));
    if (cleaned.length < 3) return;

    const exists = platformSettings.coupons.some((c) => c.code === cleaned);
    if (exists) return;

    onUpdateSettings({
      ...platformSettings,
      coupons: [...platformSettings.coupons, { code: cleaned, percent: pct }],
    });
    setNewCouponCode('');
    setSettingsSavedMsg(
      isHi
        ? `डेमो कूपन ${cleaned} (${pct}%) लोकल स्टेट में जोड़ा गया — इसे ग्राहक कार्ट में भी आज़माएँ।`
        : `Demo coupon ${cleaned} (${pct}%) added locally — try it in the Customer Cart too.`
    );
  };

  // Monthly Area Chart geometry
  const maxMonth = Math.max(...ADMIN_MONTHLY_SALES.map((m) => m.value), 1);
  const svgW = 460;
  const svgH = 175;
  const padX = 28;
  const padY = 20;
  const areaPts = ADMIN_MONTHLY_SALES.map((m, idx) => {
    const x = padX + (idx / (ADMIN_MONTHLY_SALES.length - 1)) * (svgW - padX * 2);
    const y = svgH - padY - (m.value / maxMonth) * (svgH - padY * 2);
    return { ...m, x, y };
  });
  const lineStr = areaPts.map((p) => `${p.x},${p.y}`).join(' ');
  const areaStr = `${padX},${svgH - padY} ${lineStr} ${svgW - padX},${svgH - padY}`;

  return (
    <div className="bg-slate-50 min-h-screen pb-14">
      {/* ADMIN BANNER */}
      <div className="relative h-44 sm:h-52 bg-indigo-950 overflow-hidden">
        <MahaImage
          src="/demo/maha-bazaar/admin-analytics.jpg"
          alt={isHi ? 'एडमिन एनालिटिक्स बैनर' : 'Admin analytics banner'}
          eager
          className="w-full h-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-950/92 via-indigo-950/75 to-indigo-950/45" />
        <div className="relative max-w-7xl mx-auto h-full px-4 sm:px-6 flex flex-col justify-center">
          <p className="text-xs font-mono text-orange-300">
            {isHi ? 'एडमिन नियंत्रण कक्ष · सारा डेटा नमूना है' : 'Admin Control Console · Sample Data Only'}
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            {isHi ? 'मार्केटप्लेस एडमिन डैशबोर्ड' : 'Marketplace Admin Dashboard'}
          </h1>
          <p className="text-xs sm:text-sm text-indigo-100 mt-1 max-w-xl">
            {isHi
              ? 'विक्रेता स्वीकृति, कैटेगरी एनालिटिक्स, कमीशन व कूपन सेटिंग्स और रोल-आधारित अनुमतियाँ।'
              : 'Seller approvals, category analytics, commission & coupon settings, and role permissions.'}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* 4 SAMPLE KPI CARDS */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-extrabold text-indigo-950">
              {isHi ? 'प्लेटफ़ॉर्म मुख्य सूचकांक' : 'Platform KPI Overview'}
            </h2>
            <span className="px-2.5 py-1 rounded bg-amber-50 border border-amber-200 text-xs font-mono font-bold text-amber-900">
              {isHi ? 'नमूना डेटा' : 'Sample Data'}
            </span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: Store,
                hi: 'कुल विक्रेता (नमूना)',
                en: 'Total Sellers (Sample)',
                val: String(48 + approvedCount),
              },
              {
                icon: Users,
                hi: 'कुल ग्राहक (नमूना)',
                en: 'Total Customers (Sample)',
                val: '1,240',
              },
              {
                icon: ClipboardList,
                hi: 'आज के ऑर्डर (नमूना)',
                en: "Today's Orders (Sample)",
                val: '86',
              },
              {
                icon: IndianRupee,
                hi: 'मासिक GMV (नमूना)',
                en: 'Monthly GMV (Sample)',
                val: '₹18.4L',
              },
            ].map((kpi) => {
              const Icon = kpi.icon;
              return (
                <div
                  key={kpi.en}
                  className="rounded-xl bg-white border border-slate-200 p-4 sm:p-5 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">
                      {isHi ? kpi.hi : kpi.en}
                    </span>
                    <Icon className="w-4 h-4 text-orange-500 shrink-0" />
                  </div>
                  <div className="text-2xl font-extrabold text-indigo-950 font-mono tabular-nums">
                    {kpi.val}
                  </div>
                  <div className="text-[11px] font-mono text-amber-800">
                    {isHi ? 'नमूना मान' : 'Sample value'}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* CHARTS: CATEGORY BAR + MONTHLY AREA */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Bar Chart */}
          <div className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-extrabold text-indigo-950">
                {isHi ? 'कैटेगरी-वार बिक्री (बार चार्ट)' : 'Category-Wise Sales (Bar Chart)'}
              </h3>
              <span className="text-[11px] font-mono text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                {isHi ? 'नमूना डेटा' : 'Sample Data'}
              </span>
            </div>

            <div className="space-y-3.5 pt-2">
              {ADMIN_CATEGORY_SALES.map((cat) => (
                <div key={cat.labelEn} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700">{isHi ? cat.labelHi : cat.labelEn}</span>
                    <span className="font-mono font-bold text-indigo-950 tabular-nums">
                      ₹{cat.value}L ({isHi ? 'नमूना' : 'Sample'})
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-900 to-orange-500"
                      style={{ width: `${Math.round((cat.value / 65) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly Sales Area Chart */}
          <div className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-extrabold text-indigo-950">
                {isHi ? 'मासिक बिक्री (एरिया चार्ट)' : 'Monthly Sales Trend (Area Chart)'}
              </h3>
              <span className="text-[11px] font-mono text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                {isHi ? 'नमूना डेटा' : 'Sample Data'}
              </span>
            </div>

            <svg
              viewBox={`0 0 ${svgW} ${svgH}`}
              className="w-full h-44"
              role="img"
              aria-label={isHi ? 'मासिक बिक्री एरिया चार्ट' : 'Monthly sales area chart'}
            >
              <defs>
                <linearGradient id="mbAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f97316" stopOpacity="0.32" />
                  <stop offset="100%" stopColor="#312e81" stopOpacity="0.03" />
                </linearGradient>
              </defs>
              <polygon points={areaStr} fill="url(#mbAreaGrad)" />
              <polyline
                fill="none"
                stroke="#312e81"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={lineStr}
              />
              {areaPts.map((pt) => (
                <g key={pt.monthEn}>
                  <circle cx={pt.x} cy={pt.y} r="4" fill="#f97316" stroke="#fff" strokeWidth="1.5" />
                  <text
                    x={pt.x}
                    y={pt.y - 8}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#1e1b4b"
                    fontFamily="monospace"
                  >
                    {pt.value}L
                  </text>
                  <text x={pt.x} y={svgH - 4} textAnchor="middle" fontSize="11" fill="#64748b">
                    {isHi ? pt.monthHi : pt.monthEn}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </section>

        {/* SELLER APPROVAL TABLE (4 Sample Applications) */}
        <section className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-extrabold text-indigo-950">
                {isHi ? 'विक्रेता स्वीकृति आवेदन (4 नमूना)' : 'Seller Approval Queue (4 Sample Applications)'}
              </h2>
              <p className="text-xs text-slate-500">
                {isHi ? 'लोकल स्टेट में स्वीकृत या अस्वीकृत करके देखें।' : 'Approve or reject applications in local demo state.'}
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
                  <th className="px-4 py-3">{isHi ? 'स्टोर नाम' : 'Store Name'}</th>
                  <th className="px-4 py-3">{isHi ? 'आवेदक' : 'Owner'}</th>
                  <th className="px-4 py-3">{isHi ? 'कैटेगरी / शहर' : 'Category / City'}</th>
                  <th className="px-4 py-3">{isHi ? 'स्थिति' : 'Status'}</th>
                  <th className="px-4 py-3 text-right">{isHi ? 'कार्रवाई' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-bold text-indigo-950">
                      {isHi ? app.storeNameHi : app.storeNameEn}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {isHi ? app.ownerHi : app.ownerEn}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {isHi ? `${app.categoryHi} · ${app.cityHi}` : `${app.categoryEn} · ${app.cityEn}`}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-bold ${
                          app.status === 'approved'
                            ? 'text-emerald-700'
                            : app.status === 'rejected'
                            ? 'text-rose-700'
                            : 'text-amber-700'
                        }`}
                      >
                        {app.status === 'approved'
                          ? isHi
                            ? 'स्वीकृत'
                            : 'Approved'
                          : app.status === 'rejected'
                          ? isHi
                            ? 'अस्वीकृत'
                            : 'Rejected'
                          : isHi
                          ? 'प्रतीक्षारत'
                          : 'Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onUpdateApplication(app.id, 'approved')}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{isHi ? 'स्वीकृत' : 'Approve'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onUpdateApplication(app.id, 'rejected')}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>{isHi ? 'अस्वीकृत' : 'Reject'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* SETTINGS CARD + ROLES & PERMISSIONS CARD */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Platform Settings (Local State) */}
          <div className="lg:col-span-7 rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-indigo-950 flex items-center gap-2">
                <Settings className="w-4 h-4 text-orange-500" />
                <span>{isHi ? 'प्लेटफ़ॉर्म सेटिंग्स (लोकल State)' : 'Platform Settings (Local State)'}</span>
              </h3>
              <span className="text-[11px] font-mono text-slate-500">
                {isHi ? 'रीलोड पर रीसेट' : 'Resets on reload'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isHi ? 'विक्रेता कमीशन (%)' : 'Seller Commission (%)'}
                </label>
                <input
                  type="number"
                  min={1}
                  max={35}
                  value={platformSettings.commissionPercent}
                  onChange={(e) =>
                    onUpdateSettings({
                      ...platformSettings,
                      commissionPercent: Math.min(35, Math.max(1, Number(e.target.value) || 1)),
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isHi ? 'मानक डिलीवरी शुल्क (₹)' : 'Standard Delivery Fee (₹)'}
                </label>
                <input
                  type="number"
                  min={0}
                  max={500}
                  value={platformSettings.deliveryFee}
                  onChange={(e) =>
                    onUpdateSettings({
                      ...platformSettings,
                      deliveryFee: Math.max(0, Number(e.target.value) || 0),
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono font-bold"
                />
              </div>
            </div>

            {/* Create Coupon */}
            <form onSubmit={handleAddCoupon} className="pt-4 border-t border-slate-200 space-y-3">
              <div className="text-xs font-bold text-indigo-950">
                {isHi ? 'नया डेमो कूपन बनाएँ' : 'Create New Demo Coupon'}
              </div>
              <div className="flex flex-wrap sm:flex-nowrap gap-2">
                <input
                  type="text"
                  value={newCouponCode}
                  onChange={(e) => setNewCouponCode(e.target.value)}
                  placeholder="FESTIVE15"
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono uppercase"
                />
                <input
                  type="number"
                  min={5}
                  max={50}
                  value={newCouponPercent}
                  onChange={(e) => setNewCouponPercent(e.target.value)}
                  className="w-20 rounded-lg border border-slate-300 px-2.5 py-2 text-xs font-mono"
                  aria-label="Discount percent"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-indigo-950 hover:bg-orange-500 text-white text-xs font-bold cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isHi ? 'कूपन जोड़ें' : 'Add Coupon'}</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-2 text-xs">
                {platformSettings.coupons.map((c) => (
                  <span
                    key={c.code}
                    className="px-2.5 py-1 rounded bg-indigo-50 border border-indigo-200 font-mono font-bold text-indigo-900"
                  >
                    {c.code} · {c.percent}%
                  </span>
                ))}
              </div>

              {settingsSavedMsg && (
                <p className="text-xs font-semibold text-emerald-700">{settingsSavedMsg}</p>
              )}
            </form>
          </div>

          {/* Roles & Permissions Display Card */}
          <div className="lg:col-span-5 rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 space-y-4">
            <h3 className="text-base font-extrabold text-indigo-950 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-orange-500" />
              <span>{isHi ? 'रोल और अनुमतियाँ' : 'Roles & Permissions'}</span>
            </h3>
            <p className="text-xs text-slate-500">
              {isHi
                ? 'एंटरप्राइज़ प्लेटफ़ॉर्म के लिए भूमिका-आधारित एक्सेस संरचना (सिर्फ़ प्रदर्शन के लिए)।'
                : 'Role-based access matrix structure for enterprise operations (informational view).'}
            </p>
            <div className="divide-y divide-slate-100">
              {ROLE_PERMISSIONS.map((rp) => (
                <div key={rp.roleEn} className="py-3 space-y-1">
                  <div className="text-sm font-bold text-indigo-950">
                    {isHi ? rp.roleHi : rp.roleEn}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {isHi ? rp.accessHi : rp.accessEn}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
