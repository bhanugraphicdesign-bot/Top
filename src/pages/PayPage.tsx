import React, { useState, useEffect, useMemo } from 'react';
import QRCode from 'qrcode';
import { useLanguage } from '../context/LanguageContext';
import { useNavigation } from '../context/NavigationContext';
import { trackPaymentStart } from '../utils/ga4';
import { executeRecaptchaEnterprise } from '../utils/recaptcha';
import { RecaptchaNotice } from '../components/common/RecaptchaNotice';
import { UpiPaymentRecord, UpiPaymentSettings } from '../types';
import {
  IndianRupee,
  Smartphone,
  Copy,
  Check,
  QrCode,
  ShieldCheck,
  Clock,
  AlertCircle,
  ArrowRight,
  MessageCircle,
  Loader2,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

const WHATSAPP_URL = 'https://wa.me/918305457717';
const DEFAULT_PAYEE_NAME = 'BHANU RAM BARIHA DIGITAL TECHNOLOGIES';

export const PayPage: React.FC = () => {
  const { language, t, showToast } = useLanguage();
  const { params, navigate } = useNavigation();

  const [loadingSettings, setLoadingSettings] = useState(true);
  const [settings, setSettings] = useState<UpiPaymentSettings>({
    enabled: false,
    upiId: '',
    payeeName: DEFAULT_PAYEE_NAME,
  });
  const [settingsError, setSettingsError] = useState('');

  // Form state (prefilled from ?amount= and ?ref= query parameters if present)
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [purpose, setPurpose] = useState('');
  const [amount, setAmount] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [formError, setFormError] = useState('');
  const [creatingPayment, setCreatingPayment] = useState(false);

  // Active created payment state
  const [activePayment, setActivePayment] = useState<UpiPaymentRecord | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrError, setQrError] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);

  // UTR submission state
  const [utr, setUtr] = useState('');
  const [utrError, setUtrError] = useState('');
  const [submittingUtr, setSubmittingUtr] = useState(false);
  const [submittedRecord, setSubmittedRecord] = useState<UpiPaymentRecord | null>(null);

  // Prefill ?amount= and ?ref= whenever URL query params change
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const rawAmount = params.amount || sp.get('amount') || '';
    const rawRef = params.ref || sp.get('ref') || '';

    if (rawAmount) {
      const parsed = Number(rawAmount);
      if (Number.isFinite(parsed) && parsed >= 1) {
        setAmount(String(Math.round(parsed * 100) / 100));
      }
    }
    if (rawRef.trim()) {
      setPurpose(rawRef.trim());
    }
  }, [params.amount, params.ref]);

  // Load public payment settings from server (never hardcoded)
  useEffect(() => {
    let cancelled = false;
    setLoadingSettings(true);
    setSettingsError('');

    fetch('/api/payment-settings')
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        setSettings({
          enabled: Boolean(data?.enabled),
          upiId: typeof data?.upiId === 'string' ? data.upiId.trim() : '',
          payeeName:
            typeof data?.payeeName === 'string' && data.payeeName.trim()
              ? data.payeeName.trim()
              : DEFAULT_PAYEE_NAME,
        });
      })
      .catch(() => {
        if (cancelled) return;
        setSettings({
          enabled: false,
          upiId: '',
          payeeName: DEFAULT_PAYEE_NAME,
        });
        setSettingsError(
          language === 'hi'
            ? 'भुगतान सेटिंग्स लोड करने में समस्या आई।'
            : 'Unable to load payment configuration right now.'
        );
      })
      .finally(() => {
        if (!cancelled) setLoadingSettings(false);
      });

    return () => {
      cancelled = true;
    };
  }, [language]);

  const upiDeepLink = useMemo(() => {
    if (!activePayment || !activePayment.upiId) return '';
    const pa = encodeURIComponent(activePayment.upiId);
    const pn = encodeURIComponent(activePayment.payeeName || DEFAULT_PAYEE_NAME);
    const am = encodeURIComponent(String(activePayment.amount));
    const tn = encodeURIComponent(activePayment.referenceNumber);
    return `upi://pay?pa=${pa}&pn=${pn}&am=${am}&cu=INR&tn=${tn}`;
  }, [activePayment]);

  // Generate QR code in browser using npm `qrcode` package
  useEffect(() => {
    if (!upiDeepLink) {
      setQrDataUrl('');
      setQrError(false);
      return;
    }
    let cancelled = false;
    setQrError(false);

    QRCode.toDataURL(upiDeepLink, {
      width: 260,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((dataUrl) => {
        if (!cancelled) setQrDataUrl(dataUrl);
      })
      .catch(() => {
        if (!cancelled) setQrError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [upiDeepLink]);

  const isPaymentsAvailable = Boolean(settings.enabled && settings.upiId);

  const handleCopyText = async (text: string, target: 'upi' | 'ref') => {
    try {
      await navigator.clipboard.writeText(text);
      if (target === 'upi') {
        setCopiedUpi(true);
        window.setTimeout(() => setCopiedUpi(false), 2200);
        showToast(t('UPI ID copied to clipboard.', 'UPI ID कॉपी हो गया।'), 'success');
      } else {
        setCopiedRef(true);
        window.setTimeout(() => setCopiedRef(false), 2200);
        showToast(t('Reference number copied.', 'क्रमांक कॉपी हो गया।'), 'success');
      }
    } catch {
      showToast(t('Unable to copy automatically. Please select and copy.', 'स्वतः कॉपी नहीं हो सका।'), 'alert');
    }
  };

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const trimmedName = name.trim();
    const cleanedMobile = mobile.replace(/\D/g, '');
    const trimmedPurpose = purpose.trim();
    const numericAmount = Number(amount);

    if (trimmedName.length < 2) {
      setFormError(t('Please enter your full name (minimum 2 characters).', 'कृपया अपना पूरा नाम लिखें।'));
      return;
    }
    if (!/^\d{10}$/.test(cleanedMobile)) {
      setFormError(t('Please enter a valid 10-digit mobile number.', 'कृपया 10 अंकों का सही मोबाइल नंबर दर्ज करें।'));
      return;
    }
    if (trimmedPurpose.length < 2) {
      setFormError(
        t(
          'Please mention the service, quotation, or invoice number.',
          'कृपया बताएं कि यह भुगतान किस काम, सेवा या इनवॉइस के लिए है।'
        )
      );
      return;
    }
    if (!Number.isFinite(numericAmount) || numericAmount < 1) {
      setFormError(t('Please enter a valid amount (minimum ₹1).', 'कृपया मान्य रकम दर्ज करें (न्यूनतम ₹1)।'));
      return;
    }

    setCreatingPayment(true);
    try {
      const { recaptchaToken, recaptchaAction } = await executeRecaptchaEnterprise('payment_submit');
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          mobile: cleanedMobile,
          purpose: trimmedPurpose,
          amount: Math.round(numericAmount * 100) / 100,
          website: honeypot,
          language,
          recaptchaToken,
          recaptchaAction,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.payment) {
        const errMsg =
          language === 'hi'
            ? data?.errorHi || data?.error || 'भुगतान विवरण सेव करने में समस्या आई।'
            : data?.errorEn || data?.error || 'Unable to initiate payment right now.';
        setFormError(errMsg);
        showToast(errMsg, 'alert');
        return;
      }

      setActivePayment(data.payment as UpiPaymentRecord);
      setUtr('');
      setUtrError('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      const errMsg = t(
        'Network error while starting payment. Please try again.',
        'नेटवर्क त्रुटि। कृपया पुनः प्रयास करें।'
      );
      setFormError(errMsg);
      showToast(errMsg, 'alert');
    } finally {
      setCreatingPayment(false);
    }
  };

  const handleSubmitUtr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePayment) return;
    setUtrError('');

    const cleanedUtr = utr.replace(/\D/g, '');
    if (!/^\d{12}$/.test(cleanedUtr)) {
      setUtrError(
        t(
          'Please enter the exact 12-digit UTR / Reference number from your UPI app.',
          'कृपया अपने UPI ऐप से 12 अंकों का सही UTR/रेफ़रेंस नंबर दर्ज करें।'
        )
      );
      return;
    }

    setSubmittingUtr(true);
    try {
      const { recaptchaToken, recaptchaAction } = await executeRecaptchaEnterprise('payment_utr_submit');
      const res = await fetch(`/api/payments/${encodeURIComponent(activePayment.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ utr: cleanedUtr, recaptchaToken, recaptchaAction }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.payment) {
        const errMsg =
          language === 'hi'
            ? data?.errorHi || data?.error || 'UTR दर्ज करने में समस्या आई।'
            : data?.errorEn || data?.error || 'Unable to submit UTR number.';
        setUtrError(errMsg);
        showToast(errMsg, 'alert');
        return;
      }

      setSubmittedRecord(data.payment as UpiPaymentRecord);
      showToast(
        language === 'hi'
          ? 'धन्यवाद! हम आपका भुगतान जाँचकर पुष्टि करेंगे।'
          : 'Thank you! We will verify your payment and confirm shortly.',
        'success'
      );
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      const errMsg = t(
        'Network error while submitting UTR. Please try again.',
        'नेटवर्क त्रुटि। कृपया पुनः प्रयास करें।'
      );
      setUtrError(errMsg);
      showToast(errMsg, 'alert');
    } finally {
      setSubmittingUtr(false);
    }
  };

  const handleStartNewPayment = () => {
    setSubmittedRecord(null);
    setActivePayment(null);
    setUtr('');
    setUtrError('');
    setFormError('');
  };

  return (
    <section className="pws-hero-surface py-10 sm:py-16 min-h-[75vh] overflow-x-hidden">
      <div className="pws-hero-grid" aria-hidden="true" />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 space-y-6 relative z-10">
        {/* Page Header */}
        <div className="pws-reveal text-center space-y-2.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold">
            <IndianRupee className="w-3.5 h-3.5" />
            <span>{t('Direct UPI Payment', 'सीधा UPI भुगतान')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
            <span className="pws-gradient-text">{t('Pay via UPI', 'भुगतान करें')}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto">
            {t(
              'Pay directly to BHANU RAM BARIHA DIGITAL TECHNOLOGIES using any UPI app (Google Pay, PhonePe, Paytm, BHIM).',
              'किसी भी UPI ऐप (Google Pay, PhonePe, Paytm, BHIM) से सीधे भुगतान करें और 12 अंकों का UTR नंबर दर्ज करें।'
            )}
          </p>
        </div>

        {/* Loading Settings */}
        {loadingSettings ? (
          <div className="pws-card-3d pws-no-tilt rounded-2xl p-10 text-center space-y-3">
            <Loader2 className="w-7 h-7 text-blue-700 animate-spin mx-auto" />
            <p className="text-sm text-slate-600 font-medium">
              {t('Checking UPI payment availability...', 'भुगतान विकल्प जाँचा जा रहा है...')}
            </p>
          </div>
        ) : !isPaymentsAvailable ? (
          /* Payments Disabled or UPI ID Not Configured */
          <div className="pws-card-3d pws-no-tilt rounded-2xl p-6 sm:p-8 text-center space-y-5">
            <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6 text-amber-700" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-950">
                {language === 'hi'
                  ? 'ऑनलाइन भुगतान अभी उपलब्ध नहीं, कृपया संपर्क करें'
                  : 'Online payment is currently unavailable, please contact us'}
              </h2>
              {settingsError && (
                <p className="text-xs text-slate-500">{settingsError}</p>
              )}
              <p className="text-xs sm:text-sm text-slate-600">
                {t(
                  'Please reach out to our team on WhatsApp for payment instructions or official invoice details.',
                  'भुगतान जानकारी या इनवॉइस सहायता के लिए कृपया नीचे दिए गए WhatsApp बटन से सीधे संपर्क करें।'
                )}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="pws-btn-emerald w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-white text-sm font-bold"
              >
                <MessageCircle className="w-4 h-4" />
                <span>{t('Contact on WhatsApp', 'WhatsApp पर संपर्क करें')}</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </a>
              <button
                type="button"
                onClick={() => navigate('home')}
                className="pws-btn-glass w-full sm:w-auto px-5 py-3 rounded-lg text-slate-800 text-sm font-semibold cursor-pointer"
              >
                {t('Back to Home', 'होम पेज पर जाएँ')}
              </button>
            </div>
          </div>
        ) : submittedRecord ? (
          /* STEP 3: UTR SUBMITTED — MANUAL VERIFICATION PENDING (NEVER SHOW "PAYMENT SUCCESSFUL") */
          <div className="pws-card-3d pws-no-tilt rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto">
                <Clock className="w-7 h-7 text-blue-700" />
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{t('UTR Received · Verification Pending', 'UTR प्राप्त · जाँच लंबित')}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-950">
                {language === 'hi'
                  ? 'धन्यवाद! हम आपका भुगतान जाँचकर पुष्टि करेंगे।'
                  : 'Thank you! We will verify your payment and confirm shortly.'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
                {t(
                  'UPI transfers are verified manually against our bank statement before marking as paid. Please keep your reference number for your records.',
                  'बैंक विवरण से मिलान करने के बाद हमारी टीम आपका भुगतान सत्यापित करेगी। कृपया नीचे दिया गया क्रमांक सुरक्षित रखें।'
                )}
              </p>
            </div>

            <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 space-y-2.5 text-xs sm:text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500">{t('Reference No.', 'क्रमांक')}</span>
                <span className="font-mono font-bold text-slate-950 break-all text-right">
                  {submittedRecord.referenceNumber}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500">{t('Amount', 'रकम')}</span>
                <span className="font-mono font-extrabold text-slate-950 tabular-nums">
                  ₹{submittedRecord.amount.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500">{t('UTR Number', 'UTR नंबर')}</span>
                <span className="font-mono font-bold text-blue-700">{submittedRecord.utr}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500">{t('Purpose', 'काम / विवरण')}</span>
                <span className="font-semibold text-slate-800 text-right break-words max-w-[60%]">
                  {submittedRecord.purpose}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href={`${WHATSAPP_URL}?text=${encodeURIComponent(
                  `नमस्ते, मैंने ₹${submittedRecord.amount} का UPI भुगतान किया है। क्रमांक: ${submittedRecord.referenceNumber}, UTR: ${submittedRecord.utr}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="pws-btn-emerald w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-white text-xs sm:text-sm font-bold"
              >
                <MessageCircle className="w-4 h-4" />
                <span>{t('Share Receipt on WhatsApp', 'WhatsApp पर जानकारी भेजें')}</span>
              </a>
              <button
                type="button"
                onClick={handleStartNewPayment}
                className="pws-btn-glass w-full sm:w-auto px-4 py-2.5 rounded-lg text-slate-800 text-xs sm:text-sm font-semibold cursor-pointer"
              >
                {t('Make Another Payment', 'नया भुगतान करें')}
              </button>
            </div>
          </div>
        ) : activePayment ? (
          /* STEP 2: UPI APP BUTTON + QR CODE + COPY UPI ID + 12-DIGIT UTR FORM */
          <div className="space-y-5">
            <div className="pws-card-3d pws-no-tilt rounded-2xl p-5 sm:p-7 space-y-6">
              {/* Amount & Reference Summary */}
              <div className="rounded-xl bg-[#0B1220] border border-blue-500/30 text-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
                <div className="min-w-0">
                  <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                    {t('Payable Amount', 'भुगतान राशि')}
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-white mt-0.5">
                    ₹{activePayment.amount.toLocaleString('en-IN')}
                  </div>
                  <div className="text-xs text-slate-300 mt-1 break-words">
                    {activePayment.payeeName}
                  </div>
                </div>
                <div className="sm:text-right border-t sm:border-t-0 border-slate-800 pt-3 sm:pt-0">
                  <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                    {t('Reference Number', 'भुगतान क्रमांक')}
                  </div>
                  <div className="flex items-center sm:justify-end gap-2 mt-0.5">
                    <span className="font-mono font-bold text-sm sm:text-base text-blue-300 break-all">
                      {activePayment.referenceNumber}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyText(activePayment.referenceNumber, 'ref')}
                      aria-label={t('Copy reference number', 'क्रमांक कॉपी करें')}
                      className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer shrink-0"
                    >
                      {copiedRef ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 break-words">
                    {activePayment.purpose}
                  </div>
                </div>
              </div>

              {/* Big Mobile UPI App Launch Button */}
              <div className="space-y-2">
                <a
                  href={upiDeepLink}
                  className="pws-btn-3d w-full flex items-center justify-center gap-2.5 px-5 py-4 rounded-xl text-white text-base font-extrabold text-center"
                >
                  <Smartphone className="w-5 h-5 shrink-0" />
                  <span>{language === 'hi' ? 'UPI ऐप से भुगतान करें' : 'Pay via UPI App'}</span>
                </a>
                <p className="text-[11px] text-center text-slate-500">
                  {t(
                    'Tap on mobile to open Google Pay, PhonePe, Paytm, or BHIM directly with amount pre-filled.',
                    'मोबाइल पर दबाते ही आपका UPI ऐप (GPay, PhonePe, Paytm, BHIM) रकम और क्रमांक के साथ खुल जाएगा।'
                  )}
                </p>
              </div>

              {/* QR Code generated in browser via `qrcode` */}
              <div className="flex flex-col items-center justify-center p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
                  <QrCode className="w-4 h-4 text-blue-700" />
                  <span>{t('UPI QR Code', 'UPI QR कोड')}</span>
                </div>
                {qrDataUrl ? (
                  <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                    <img
                      src={qrDataUrl}
                      alt={t('UPI Payment QR Code', 'UPI भुगतान QR कोड')}
                      className="w-52 h-52 sm:w-56 sm:h-56 block"
                    />
                  </div>
                ) : qrError ? (
                  <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-md px-3 py-2">
                    {t('Could not render QR code. Please use the UPI ID below.', 'QR कोड नहीं बन सका। कृपया नीचे दी गई UPI ID का उपयोग करें।')}
                  </div>
                ) : (
                  <div className="w-52 h-52 flex items-center justify-center bg-white rounded-xl border border-slate-200">
                    <Loader2 className="w-6 h-6 text-blue-700 animate-spin" />
                  </div>
                )}
                <p className="text-sm font-bold text-slate-800 text-center">
                  {language === 'hi' ? 'किसी भी UPI ऐप से स्कैन करें' : 'Scan with any UPI app'}
                </p>
              </div>

              {/* Copyable UPI ID Box */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    {t('Official UPI ID', 'आधिकारिक UPI ID')}
                  </div>
                  <div className="text-sm sm:text-base font-mono font-extrabold text-slate-950 break-all mt-0.5">
                    {activePayment.upiId}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyText(activePayment.upiId, 'upi')}
                  className="pws-btn-glass inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-slate-900 text-xs font-bold cursor-pointer shrink-0"
                >
                  {copiedUpi ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-700" />
                      <span className="text-emerald-700">{t('Copied!', 'कॉपी हो गया!')}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-blue-700" />
                      <span>{t('Copy UPI ID', 'UPI ID कॉपी करें')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* UTR Submission Form */}
            <form
              onSubmit={handleSubmitUtr}
              className="pws-card-3d pws-no-tilt rounded-2xl p-5 sm:p-7 space-y-4"
            >
              <div className="space-y-1">
                <label
                  htmlFor="upi-utr-input"
                  className="block text-sm sm:text-base font-extrabold text-slate-950"
                >
                  {language === 'hi'
                    ? 'भुगतान के बाद 12 अंक का UTR/रेफ़रेंस नंबर डालें'
                    : 'Enter 12-digit UTR / Reference Number after payment'}
                </label>
                <p className="text-xs text-slate-500">
                  {t(
                    'You will find the 12-digit UPI Ref / UTR number in your UPI app transaction receipt.',
                    'भुगतान पूरा करने के बाद आपके UPI ऐप की रसीद में 12 अंकों का UTR / UPI Ref नंबर दिखेगा।'
                  )}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  id="upi-utr-input"
                  name="utr"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={12}
                  required
                  value={utr}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 12);
                    setUtr(digits);
                    if (utrError) setUtrError('');
                  }}
                  placeholder={t('e.g. 432512345678', 'उदाहरण: 432512345678')}
                  className="flex-1 min-w-0 px-4 py-3 text-base font-mono tracking-wider rounded-lg border border-slate-300 bg-white text-slate-950 focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
                <button
                  type="submit"
                  disabled={submittingUtr}
                  className="pws-btn-emerald inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-white text-sm font-extrabold cursor-pointer whitespace-nowrap shrink-0"
                >
                  {submittingUtr ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{t('Submitting...', 'भेजा जा रहा है...')}</span>
                    </>
                  ) : (
                    <span>{language === 'hi' ? 'भुगतान किया' : 'I Have Paid'}</span>
                  )}
                </button>
              </div>

              {utrError && (
                <div
                  role="alert"
                  className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{utrError}</span>
                </div>
              )}

              <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500">
                <span>
                  {t('Payer:', 'भुगतानकर्ता:')} <strong className="text-slate-700">{activePayment.name}</strong> ({activePayment.mobile})
                </span>
                <button
                  type="button"
                  onClick={handleStartNewPayment}
                  className="text-blue-700 hover:underline font-semibold cursor-pointer"
                >
                  {t('Edit details', 'विवरण बदलें')}
                </button>
              </div>

              <RecaptchaNotice />
            </form>
          </div>
        ) : (
          /* STEP 1: PAYMENT DETAILS FORM */
          <form
            onSubmit={handleCreatePayment}
            className="pws-card-3d pws-no-tilt rounded-2xl p-5 sm:p-7 space-y-5"
          >
            {/* Hidden anti-spam honeypot */}
            <div
              aria-hidden="true"
              className="pointer-events-none fixed -left-[9999px] top-auto h-px w-px overflow-hidden opacity-0"
            >
              <label htmlFor="pay-hp-website">Leave blank</label>
              <input
                id="pay-hp-website"
                name="website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
              />
            </div>

            <div className="p-3.5 rounded-lg bg-blue-50/80 border border-blue-200 flex items-start gap-2.5 text-xs text-blue-950">
              <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="font-bold">{settings.payeeName}</div>
                <div className="text-blue-900/80">
                  {t(
                    'We never ask for card numbers, CVV, OTP, or UPI PIN on this website. Payments happen directly inside your UPI app.',
                    'इस वेबसाइट पर कभी कार्ड नंबर, CVV, OTP या UPI PIN नहीं माँगा जाता। भुगतान सीधे आपके UPI ऐप में होता है।'
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="pay-name" className="block text-xs font-bold text-slate-800 mb-1.5">
                  {t('Full Name', 'नाम')} <span className="text-rose-600">*</span>
                </label>
                <input
                  id="pay-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  maxLength={120}
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (formError) setFormError('');
                  }}
                  placeholder={t('Your full name', 'आपका पूरा नाम')}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-white text-slate-950 focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label htmlFor="pay-mobile" className="block text-xs font-bold text-slate-800 mb-1.5">
                  {t('Mobile Number (10 digits)', 'मोबाइल नंबर (10 अंक)')} <span className="text-rose-600">*</span>
                </label>
                <input
                  id="pay-mobile"
                  name="mobile"
                  type="tel"
                  autoComplete="tel"
                  inputMode="numeric"
                  required
                  maxLength={10}
                  value={mobile}
                  onChange={(e) => {
                    setMobile(e.target.value.replace(/\D/g, '').slice(0, 10));
                    if (formError) setFormError('');
                  }}
                  placeholder="9876543210"
                  className="w-full px-3.5 py-2.5 text-sm font-mono rounded-lg border border-slate-300 bg-white text-slate-950 focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div>
              <label htmlFor="pay-purpose" className="block text-xs font-bold text-slate-800 mb-1.5">
                {t(
                  'Payment For (Service / Quotation / Invoice No.)',
                  'किस काम का भुगतान (सेवा / कोटेशन / इनवॉइस नंबर)'
                )}{' '}
                <span className="text-rose-600">*</span>
              </label>
              <input
                id="pay-purpose"
                name="purpose"
                type="text"
                required
                maxLength={200}
                value={purpose}
                onChange={(e) => {
                  setPurpose(e.target.value);
                  if (formError) setFormError('');
                }}
                placeholder={t(
                  'e.g. Website Advance / Quotation #104 / INV-2026-0814',
                  'उदाहरण: वेबसाइट एडवांस / कोटेशन / इनवॉइस नंबर'
                )}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-white text-slate-950 focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label htmlFor="pay-amount" className="block text-xs font-bold text-slate-800 mb-1.5">
                {t('Amount (₹, minimum ₹1)', 'रकम ₹ (न्यूनतम 1)')} <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-base">
                  ₹
                </span>
                <input
                  id="pay-amount"
                  name="amount"
                  type="number"
                  inputMode="decimal"
                  required
                  min={1}
                  max={10000000}
                  step="any"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    if (formError) setFormError('');
                  }}
                  placeholder="5000"
                  className="w-full pl-8 pr-4 py-2.5 text-base font-mono font-bold rounded-lg border border-slate-300 bg-white text-slate-950 focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            {formError && (
              <div
                role="alert"
                className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={creatingPayment}
              onClick={() => trackPaymentStart()}
              className="pws-btn-3d w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-white text-sm sm:text-base font-extrabold cursor-pointer"
            >
              {creatingPayment ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t('Creating Payment Reference...', 'क्रमांक बनाया जा रहा है...')}</span>
                </>
              ) : (
                <>
                  <span>{language === 'hi' ? 'आगे बढ़ें' : 'Proceed to Pay'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <RecaptchaNotice />
          </form>
        )}
      </div>
    </section>
  );
};
