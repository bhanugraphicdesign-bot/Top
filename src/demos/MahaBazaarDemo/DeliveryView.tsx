import React, { useState, useEffect, useRef } from 'react';
import {
  CheckCircle2,
  KeyRound,
  MapPin,
  Package,
  PackageCheck,
  Search,
  Truck,
  Warehouse,
} from 'lucide-react';
import { DeliveryTask, MahaImage, formatINR } from './sampleData';

interface DeliveryViewProps {
  isHi: boolean;
  initialOrderId: string;
  tasks: DeliveryTask[];
  onMarkDelivered: (taskId: string) => void;
}

const TIMELINE_STEPS = [
  { id: 0, icon: Package, hi: 'ऑर्डर मिला', en: 'Order Received' },
  { id: 1, icon: PackageCheck, hi: 'पैक हुआ', en: 'Packed at Seller' },
  { id: 2, icon: Warehouse, hi: 'वेयरहाउस से निकला', en: 'Dispatched from Hub' },
  { id: 3, icon: Truck, hi: 'डिलीवरी पर', en: 'Out for Delivery' },
  { id: 4, icon: CheckCircle2, hi: 'डिलीवर', en: 'Delivered' },
];

export const DeliveryView: React.FC<DeliveryViewProps> = ({
  isHi,
  initialOrderId,
  tasks,
  onMarkDelivered,
}) => {
  const [orderInput, setOrderInput] = useState(initialOrderId);
  const [trackedId, setTrackedId] = useState(initialOrderId);
  const [activeStepIndex, setActiveStepIndex] = useState(3);
  const [isAnimating, setIsAnimating] = useState(false);
  const timersRef = useRef<number[]>([]);

  // Partner OTP Verification state
  const [otpTaskId, setOtpTaskId] = useState<string | null>(null);
  const [otpValue, setOtpValue] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);

  useEffect(() => {
    setOrderInput(initialOrderId);
    setTrackedId(initialOrderId);
  }, [initialOrderId]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  const handleTrackOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = orderInput.trim() || 'MB-DEMO-2048';
    setTrackedId(cleaned);
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];

    setIsAnimating(true);
    setActiveStepIndex(0);

    [1, 2, 3, 4].forEach((stepIdx, i) => {
      const t = window.setTimeout(() => {
        setActiveStepIndex(stepIdx);
        if (stepIdx === 4) setIsAnimating(false);
      }, (i + 1) * 550);
      timersRef.current.push(t);
    });
  };

  const handleConfirmOtp = (taskId: string) => {
    setOtpError(null);
    const digits = otpValue.replace(/\D/g, '');
    if (digits.length !== 4) {
      setOtpError(
        isHi ? 'कृपया कोई भी 4 अंकों का डेमो OTP दर्ज करें।' : 'Please enter any 4-digit demo OTP.'
      );
      return;
    }
    onMarkDelivered(taskId);
    setOtpTaskId(null);
    setOtpValue('');
  };

  const progressPercent = (activeStepIndex / (TIMELINE_STEPS.length - 1)) * 100;

  return (
    <div className="bg-slate-50 min-h-screen pb-14">
      <style>{`
        @keyframes mbRoadMove {
          0% { transform: translateX(0%); }
          50% { transform: translateX(88%); }
          100% { transform: translateX(0%); }
        }
        .mb-route-dot {
          animation: mbRoadMove 6s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .mb-route-dot {
            animation: none !important;
          }
        }
      `}</style>

      {/* DELIVERY BANNER */}
      <div className="relative h-44 sm:h-52 bg-indigo-950 overflow-hidden">
        <MahaImage
          src="/demo/maha-bazaar/delivery.jpg"
          alt={isHi ? 'डिलीवरी ट्रैकिंग बैनर' : 'Delivery tracking banner'}
          eager
          className="w-full h-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-950/92 via-indigo-950/75 to-indigo-950/45" />
        <div className="relative max-w-7xl mx-auto h-full px-4 sm:px-6 flex flex-col justify-center">
          <p className="text-xs font-mono text-orange-300">
            {isHi ? 'डिलीवरी व लॉजिस्टिक्स · नमूना डेटा' : 'Delivery & Logistics · Sample Data'}
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            {isHi ? 'ऑर्डर ट्रैकिंग और डिलीवरी पार्टनर व्यू' : 'Order Tracking & Delivery Partner Portal'}
          </h1>
          <p className="text-xs sm:text-sm text-indigo-100 mt-1 max-w-xl">
            {isHi
              ? 'ग्राहक के लिए 5-स्टेप लाइव टाइमलाइन और डिलीवरी पार्टनर के लिए OTP पुष्टि वर्कफ़्लो।'
              : 'Animated 5-step customer tracking timeline paired with a delivery partner OTP workflow.'}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* CUSTOMER ORDER TRACKING CARD */}
        <section className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-7 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-extrabold text-indigo-950">
                {isHi ? 'अपना ऑर्डर ट्रैक करें' : 'Track Your Sample Order'}
              </h2>
              <p className="text-xs text-slate-500">
                {isHi
                  ? 'ऑर्डर ID डालकर "ट्रैक करें" दबाएँ और 5-स्टेप टाइमलाइन एनिमेशन देखें।'
                  : 'Click Track to run the animated 5-step delivery milestone timeline.'}
              </p>
            </div>

            <form onSubmit={handleTrackOrder} className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={orderInput}
                  onChange={(e) => setOrderInput(e.target.value)}
                  placeholder="MB-DEMO-2048"
                  className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-sm font-mono font-semibold text-indigo-950 focus:outline-none focus:border-indigo-700"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold whitespace-nowrap cursor-pointer"
              >
                {isHi ? 'ट्रैक करें' : 'Track'}
              </button>
            </form>
          </div>

          {/* 5-Step Animated Timeline */}
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-5 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-mono font-bold text-indigo-950">
                {isHi ? `ट्रैकिंग ID: ${trackedId}` : `Tracking ID: ${trackedId}`}
              </span>
              <span className="font-semibold text-emerald-700">
                {isAnimating
                  ? isHi
                    ? 'स्टेटस अपडेट हो रहा है...'
                    : 'Updating milestones...'
                  : isHi
                  ? `वर्तमान चरण: ${TIMELINE_STEPS[activeStepIndex].hi}`
                  : `Current stage: ${TIMELINE_STEPS[activeStepIndex].en}`}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-800 to-orange-500 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {TIMELINE_STEPS.map((step) => {
                const Icon = step.icon;
                const reached = step.id <= activeStepIndex;
                return (
                  <div
                    key={step.id}
                    className={`rounded-xl p-3 border transition-all duration-300 flex sm:flex-col items-center sm:text-center gap-3 sm:gap-2 ${
                      reached
                        ? 'bg-white border-indigo-300 text-indigo-950 shadow-xs'
                        : 'bg-slate-100/70 border-slate-200 text-slate-400'
                    }`}
                  >
                    <span
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                        reached ? 'bg-indigo-950 text-orange-400' : 'bg-slate-200 text-slate-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </span>
                    <span className="text-xs font-bold leading-snug">
                      {isHi ? step.hi : step.en}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Simple CSS Map-Style Route Card (Zero External Map API) */}
          <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-indigo-50 via-slate-50 to-orange-50 p-5 space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-indigo-950 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-orange-500" />
                <span>{isHi ? 'नमूना रूट प्रीव्यू (CSS विज़ुअल)' : 'Sample Route Preview (CSS Visual)'}</span>
              </span>
              <span className="font-mono text-slate-500">
                {isHi ? 'कोई लाइव मैप API नहीं' : 'No live map API'}
              </span>
            </div>

            <div className="relative py-6 px-3">
              {/* Road Line */}
              <div className="h-2 rounded-full bg-indigo-200 relative overflow-hidden">
                <div className="absolute inset-0 border-t-2 border-dashed border-white/70 top-1" />
              </div>

              {/* Animated Moving Delivery Marker */}
              <div className="absolute left-3 right-10 top-2 pointer-events-none">
                <div className="mb-route-dot w-9 h-9 rounded-full bg-orange-500 text-white shadow-md flex items-center justify-center">
                  <Truck className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-[11px] font-bold text-indigo-950">
                <span>{isHi ? 'वेयरहाउस हब' : 'Warehouse Hub'}</span>
                <span>{isHi ? 'सिटी डिस्पैच सेंटर' : 'City Dispatch Center'}</span>
                <span>{isHi ? 'ग्राहक पता' : 'Customer Doorstep'}</span>
              </div>
            </div>
          </div>
        </section>

        {/* DELIVERY PARTNER VIEW (Today's 5 Sample Deliveries + 4-digit OTP) */}
        <section className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-7 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-extrabold text-indigo-950">
                {isHi ? 'डिलीवरी पार्टनर व्यू — आज की 5 डिलीवरी' : "Delivery Partner View — Today's 5 Tasks"}
              </h2>
              <p className="text-xs text-slate-500">
                {isHi
                  ? '"डिलीवर किया" दबाएँ और पुष्टि के लिए कोई भी 4 अंकों का डेमो OTP दर्ज करें।'
                  : 'Click Mark Delivered and enter any 4-digit demo OTP to complete handoff.'}
              </p>
            </div>
            <span className="px-2.5 py-1 rounded bg-amber-50 border border-amber-200 text-xs font-mono font-bold text-amber-900">
              {isHi ? 'नमूना डेटा' : 'Sample Data'}
            </span>
          </div>

          <div className="space-y-3">
            {tasks.map((task) => {
              const isVerifying = otpTaskId === task.id;
              return (
                <div
                  key={task.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex flex-col gap-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-mono font-extrabold text-indigo-950">
                          {task.orderId}
                        </span>
                        <span className="text-slate-400">·</span>
                        <span className="font-bold text-slate-800">
                          {isHi ? task.customerHi : task.customerEn}
                        </span>
                        <span className="text-slate-400">·</span>
                        <span className="font-mono font-semibold text-orange-700">
                          {task.paymentMode === 'COD'
                            ? `COD ${formatINR(task.codAmount)}`
                            : isHi
                            ? 'प्रीपेड'
                            : 'Prepaid'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{isHi ? task.addressHi : task.addressEn}</span>
                      </p>
                    </div>

                    <div className="shrink-0">
                      {task.delivered ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{isHi ? 'डिलीवर हुआ' : 'Delivered'}</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setOtpTaskId(isVerifying ? null : task.id);
                            setOtpValue('');
                            setOtpError(null);
                          }}
                          className="px-4 py-2 rounded-lg bg-indigo-950 hover:bg-orange-500 text-white text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
                        >
                          {isHi ? 'डिलीवर किया' : 'Mark Delivered'}
                        </button>
                      )}
                    </div>
                  </div>

                  {isVerifying && !task.delivered && (
                    <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex items-center gap-2 flex-1">
                        <KeyRound className="w-4 h-4 text-orange-500 shrink-0" />
                        <input
                          type="text"
                          maxLength={4}
                          value={otpValue}
                          onChange={(e) => {
                            setOtpValue(e.target.value.replace(/\D/g, ''));
                            setOtpError(null);
                          }}
                          placeholder={isHi ? '4 अंकों का OTP (जैसे 1234)' : '4-digit OTP (e.g. 1234)'}
                          className="w-full sm:w-52 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-mono focus:outline-none focus:border-indigo-700"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleConfirmOtp(task.id)}
                          className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                        >
                          {isHi ? 'OTP सत्यापित करें' : 'Verify OTP'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setOtpTaskId(null)}
                          className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-600 cursor-pointer"
                        >
                          {isHi ? 'रद्द करें' : 'Cancel'}
                        </button>
                      </div>
                      {otpError && (
                        <p className="text-xs font-semibold text-rose-600">{otpError}</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};
