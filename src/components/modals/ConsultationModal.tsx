import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useSiteContact } from '../../hooks/useSiteContact';
import { X, CheckCircle, Shield, Send, MessageCircle } from 'lucide-react';
import { submitLead } from '../../firebase/services';
import { trackConsultationFormOpen, trackConsultationFormSubmit } from '../../firebase/analytics';
import { trackBookConsultation } from '../../utils/ga4';
import { executeRecaptchaEnterprise } from '../../utils/recaptcha';
import { RecaptchaNotice } from '../common/RecaptchaNotice';
import { ValidatedFileUploader } from '../common/ValidatedFileUploader';
import { UploadedFileRecord } from '../../types';
import {
  validateFormAntiBot,
  computeFillDurationMs,
} from '../../utils/formProtection';
import {
  QUOTE_SERVICE_OPTIONS,
  QUOTE_BUDGET_OPTIONS,
  getOptionLabel,
} from '../../data/quotationOptions';

interface ConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedService?: string;
  prefillMessage?: string;
}

function normalizeServiceDomain(raw?: string): { domain: string; demoContext: string } {
  const val = (raw || '').trim();
  if (!val) return { domain: 'enterprise-software', demoContext: '' };
  if (
    val.startsWith('Android APK Demo') ||
    val.startsWith('Android App Demo')
  ) {
    return { domain: 'android-ecosystem', demoContext: val };
  }
  const map: Record<string, string> = {
    'enterprise-software': 'enterprise-software',
    'custom-enterprise-software': 'enterprise-software',
    'leadership-briefing': 'enterprise-software',
    'enterprise-services': 'enterprise-software',
    'process-discovery': 'enterprise-software',
    'android-ecosystem': 'android-ecosystem',
    'android-app-ecosystem': 'android-ecosystem',
    'ai-solutions': 'ai-solutions',
    'ai-cognitive-engineering': 'ai-solutions',
    'web-platforms': 'web-platforms',
    'web-app-engineering': 'web-platforms',
    'cloud-devops': 'cloud-devops',
    'cloud-devops-infrastructure': 'cloud-devops',
    'api-integration': 'api-integration',
    'api-gateway': 'api-integration',
    'api-security-gateway': 'api-integration',
  };
  return { domain: map[val] || 'enterprise-software', demoContext: '' };
}

export const ConsultationModal: React.FC<ConsultationModalProps> = ({
  isOpen,
  onClose,
  preselectedService = 'enterprise-software',
  prefillMessage = '',
}) => {
  const { language, t, dict, showToast } = useLanguage();
  const { currentUser } = useAuth();
  const siteContact = useSiteContact();

  const initialNormalized = normalizeServiceDomain(preselectedService);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    company: '',
    service: initialNormalized.domain,
    timeline: '3-6-months',
    budget: '',
    brief: prefillMessage || (initialNormalized.demoContext ? `Requesting demo & walkthrough for: ${initialNormalized.demoContext}` : ''),
  });

  const [honeypot, setHoneypot] = useState('');
  const formOpenedAtRef = useRef<number>(Date.now());
  const [attachment, setAttachment] = useState<UploadedFileRecord | null>(null);
  const [uploaderKey, setUploaderKey] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedQuoteId, setSubmittedQuoteId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const whatsappHref = `https://wa.me/918305457717?text=${encodeURIComponent(
    'नमस्ते, मुझे वेबसाइट/ऐप बनवानी है।'
  )}`;

  const normalizeMobileDigits = (raw: string) => {
    const digits = raw.replace(/[^\d]/g, '');
    if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
    if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
    return digits;
  };

  useEffect(() => {
    if (!isOpen) return;
    formOpenedAtRef.current = Date.now();
    setHoneypot('');
    const { domain, demoContext } = normalizeServiceDomain(preselectedService);
    trackConsultationFormOpen(domain);
    setErrorMessage('');
    setIsSubmitted(false);
    setSubmittedQuoteId('');
    const nextBrief = prefillMessage
      ? prefillMessage
      : demoContext
      ? `Requesting demo & walkthrough for: ${demoContext}`
      : '';
    setFormData((prev) => ({
      ...prev,
      service: domain,
      brief: nextBrief || prev.brief,
    }));
  }, [isOpen, preselectedService, prefillMessage]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isSubmitted) {
          const { domain } = normalizeServiceDomain(preselectedService);
          setIsSubmitted(false);
          setSubmittedQuoteId('');
          setHoneypot('');
          formOpenedAtRef.current = Date.now();
          setFormData({
            fullName: '',
            email: '',
            phone: '',
            company: '',
            service: domain,
            timeline: '3-6-months',
            budget: '',
            brief: '',
          });
          setAttachment(null);
          setUploaderKey((k) => k + 1);
          setErrorMessage('');
          onClose();
        } else {
          setErrorMessage('');
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitted, preselectedService, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const botCheck = validateFormAntiBot({
      honeypotValue: honeypot,
      formOpenedAt: formOpenedAtRef.current,
      language,
    });
    if (!botCheck.ok) {
      const msg = botCheck.message || '';
      setErrorMessage(msg);
      showToast(msg, 'alert');
      return;
    }

    if (!formData.fullName.trim()) {
      setErrorMessage(dict.validations.nameRequired);
      return;
    }

    const cleanPhone = normalizeMobileDigits(formData.phone);
    if (!/^\d{10}$/.test(cleanPhone)) {
      setErrorMessage(
        t(
          'Please enter a valid 10-digit mobile number.',
          'कृपया 10 अंकों का मान्य मोबाइल नंबर दर्ज करें।'
        )
      );
      return;
    }

    const trimmedEmail = formData.email.trim();
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErrorMessage(dict.validations.emailInvalid);
      return;
    }

    setErrorMessage('');
    setSubmitting(true);

    try {
      const { recaptchaToken, recaptchaAction } = await executeRecaptchaEnterprise('consultation_submit');
      const result = await submitLead({
        fullName: formData.fullName,
        email: trimmedEmail,
        phone: cleanPhone,
        company: formData.company,
        serviceType: formData.service,
        timeline: formData.timeline,
        budget: formData.budget,
        brief: formData.brief,
        source: 'consultation_modal',
        language,
        user: currentUser,
        _hp: honeypot,
        formOpenedAt: formOpenedAtRef.current,
        fillDurationMs: computeFillDurationMs(formOpenedAtRef.current),
        recaptchaToken,
        recaptchaAction,
        attachment: attachment
          ? {
              fileUrl: attachment.downloadUrl,
              fileName: attachment.fileName,
              sha256: attachment.sha256,
              fileSizeFormatted: attachment.fileSizeFormatted,
            }
          : undefined,
      });
      trackConsultationFormSubmit({
        source: 'consultation_modal',
        serviceType: formData.service,
        timeline: formData.timeline,
        hasAttachment: Boolean(attachment),
      });
      trackBookConsultation(formData.service);
      setSubmittedQuoteId(result.leadId || '');
      setIsSubmitted(true);
      showToast(language === 'hi' ? result.messageHi : result.messageEn, 'success');
    } catch (err: any) {
      const msg =
        err?.message ||
        t(
          'Unable to submit consultation request. Please check your connection and try again.',
          'परामर्श अनुरोध सबमिट करने में असमर्थ। कृपया पुनः प्रयास करें।'
        );
      setErrorMessage(msg);
      showToast(msg, 'alert');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    const { domain } = normalizeServiceDomain(preselectedService);
    setIsSubmitted(false);
    setSubmittedQuoteId('');
    setHoneypot('');
    formOpenedAtRef.current = Date.now();
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      company: '',
      service: domain,
      timeline: '3-6-months',
      budget: '',
      brief: '',
    });
    setAttachment(null);
    setUploaderKey((k) => k + 1);
    setErrorMessage('');
    onClose();
  };

  const handleClose = () => {
    if (isSubmitted) {
      handleReset();
    } else {
      setErrorMessage('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
        onClick={handleClose}
        aria-hidden="true"
      />

      <div className="min-h-full flex items-center justify-center p-4 sm:p-6 text-center">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="consultation-modal-title"
          className="relative bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 text-left border border-blue-200/70 transform transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-5 right-5 p-2 text-slate-500 hover:text-slate-900 rounded-md hover:bg-slate-100 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-600"
            aria-label={t('Close modal', 'बंद करें')}
          >
            <X className="w-5 h-5" />
          </button>

          {isSubmitted ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">
                {t('Inquiry Received', 'पूछताछ प्राप्त हुई')}
              </h3>
              <p className="text-sm text-slate-700 max-w-md mx-auto leading-relaxed font-medium">
                {t(
                  'Thank you! We have received your inquiry and will contact you soon.',
                  'धन्यवाद! आपकी पूछताछ मिल गई है, हम जल्द संपर्क करेंगे।'
                )}
              </p>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 max-w-md mx-auto text-xs text-slate-600 text-left space-y-1.5">
                <p>
                  <span className="font-bold text-slate-900">{t('Reference ID:', 'संदर्भ आईडी:')}</span>{' '}
                  <span className="font-mono">{submittedQuoteId || 'PWS-CONFIRMED'}</span>
                </p>
                <p>
                  <span className="font-bold text-slate-900">{t('Direct Line:', 'सीधा संपर्क:')}</span> {siteContact.phone}
                </p>
              </div>
              <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={handleReset}
                  className="pws-btn-3d px-6 py-2.5 text-white font-semibold text-xs rounded-lg cursor-pointer"
                >
                  {t('Return to Platform', 'प्लेटफ़ॉर्म पर वापस जाएं')}
                </button>
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pws-btn-emerald inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-white rounded-lg"
                >
                  <MessageCircle className="w-4 h-4 shrink-0" />
                  <span>{t('Chat on WhatsApp', 'WhatsApp पर बात करें')}</span>
                </a>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-6">
                <div className="text-xs font-bold text-blue-700 tracking-wider uppercase mb-1">
                  {siteContact.name}
                </div>
                <h3 id="consultation-modal-title" className="text-2xl font-bold text-slate-900">
                  {t('Book Free Consultation', 'मुफ़्त परामर्श बुक करें')}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {t(
                    'Direct 45-minute technical discovery session with our Lead Engineering Squad.',
                    'हमारे लीड इंजीनियरिंग दल के साथ 45 मिनट का प्रत्यक्ष तकनीकी सत्र।'
                  )}
                </p>
              </div>

              {errorMessage && (
                <div
                  role="alert"
                  className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-xs"
                >
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Honeypot anti-bot trap (isolated from browser autofill & screen readers) */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none fixed -left-[9999px] top-auto h-px w-px overflow-hidden opacity-0"
                >
                  <label htmlFor="consultation-hp-code">Leave this field blank</label>
                  <input
                    id="consultation-hp-code"
                    name="contact_hp_code"
                    type="text"
                    tabIndex={-1}
                    autoComplete="new-password"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="consult-full-name" className="block text-xs font-semibold text-slate-700 mb-1">
                      {t('Full Name *', 'पूरा नाम *')}
                    </label>
                    <input
                      id="consult-full-name"
                      name="fullName"
                      type="text"
                      autoComplete="name"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder={t('e.g. Rajesh Sharma', 'उदा. राजेश शर्मा')}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-hidden transition-all text-slate-900 bg-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="consult-phone" className="block text-xs font-semibold text-slate-700 mb-1">
                      {t('Mobile Number (10 digits) *', 'मोबाइल नंबर (10 अंक) *')}
                    </label>
                    <input
                      id="consult-phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      required
                      inputMode="numeric"
                      maxLength={14}
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="9800000000"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-hidden transition-all text-slate-900 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="consult-email" className="block text-xs font-semibold text-slate-700 mb-1">
                      {t('Email (Optional)', 'ईमेल (वैकल्पिक)')}
                    </label>
                    <input
                      id="consult-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="name@enterprise.com"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-hidden transition-all text-slate-900 bg-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="consult-company" className="block text-xs font-semibold text-slate-700 mb-1">
                      {t('Company / Organization', 'कंपनी / संगठन')}
                    </label>
                    <input
                      id="consult-company"
                      name="company"
                      type="text"
                      autoComplete="organization"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      placeholder="Enterprise Ltd."
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-hidden transition-all text-slate-900 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="consult-service" className="block text-xs font-semibold text-slate-700 mb-1">
                      {t('Technology Domain', 'प्रौद्योगिकी डोमेन')}
                    </label>
                    <select
                      id="consult-service"
                      name="service"
                      value={formData.service}
                      onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-hidden transition-all text-slate-900 bg-white cursor-pointer"
                    >
                      {QUOTE_SERVICE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {getOptionLabel(opt, language)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="consult-timeline" className="block text-xs font-semibold text-slate-700 mb-1">
                      {t('Project Target Timeline', 'परियोजना समय-सीमा')}
                    </label>
                    <select
                      id="consult-timeline"
                      name="timeline"
                      value={formData.timeline}
                      onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-hidden transition-all text-slate-900 bg-white cursor-pointer"
                    >
                      <option value="immediate">{t('Immediate (Within 30 Days)', 'तत्काल (30 दिनों के भीतर)')}</option>
                      <option value="3-6-months">{t('Q1-Q2 (2–4 Months)', '2-4 महीने')}</option>
                      <option value="strategic">{t('Strategic Initiative (6+ Months)', 'रणनीतिक पहल (6+ महीने)')}</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="consult-budget" className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('Estimated Budget (Optional)', 'अनुमानित बजट (वैकल्पिक)')}
                  </label>
                  <select
                    id="consult-budget"
                    name="budget"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-hidden transition-all text-slate-900 bg-white cursor-pointer"
                  >
                    <option value="">{t('Select Budget (Optional)', 'बजट चुनें (वैकल्पिक)')}</option>
                    {QUOTE_BUDGET_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {getOptionLabel(opt, language)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="consult-brief" className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('Message / Technical Requirements', 'संदेश / संक्षिप्त विवरण')}
                  </label>
                  <textarea
                    id="consult-brief"
                    name="brief"
                    rows={3}
                    value={formData.brief}
                    onChange={(e) => setFormData({ ...formData, brief: e.target.value })}
                    placeholder={t(
                      'Briefly describe your website, app, or technical requirements...',
                      'अपनी वेबसाइट, ऐप या तकनीकी आवश्यकताओं का संक्षेप में वर्णन करें...'
                    )}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-hidden transition-all text-slate-900 bg-white"
                  />
                </div>

                {/* Validated File Uploader for signed-in users */}
                {currentUser && (
                  <ValidatedFileUploader
                    key={uploaderKey}
                    label="Attach RFP / Scope Document (Optional)"
                    labelHi="RFP / स्कोप दस्तावेज़ संलग्न करें (वैकल्पिक)"
                    description="PDF, PNG, JPG, or DOCX (up to 10 MB with SHA-256 validation)"
                    descriptionHi="PDF, PNG, JPG, या DOCX (10 MB तक SHA-256 सत्यापन के साथ)"
                    category="consultation_rfp"
                    onUploadSuccess={(file) => setAttachment(file)}
                    onRemove={() => setAttachment(null)}
                  />
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <Shield className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                    <span>{t('No login required · Strict NDA protected', 'बिना लॉगिन पूछताछ · सुरक्षित गोपनीयता')}</span>
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="pws-btn-3d w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-white rounded-lg cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-600"
                  >
                    {submitting ? (
                      <span className="pws-spinner" aria-hidden="true" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>{submitting ? t('Submitting...', 'भेजा जा रहा है...') : t('Book Free Consultation', 'मुफ़्त परामर्श बुक करें')}</span>
                  </button>
                </div>

                {/* Direct WhatsApp CTA below form */}
                <div className="pt-3 border-t border-slate-100">
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="pws-btn-emerald w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold text-white rounded-lg"
                  >
                    <MessageCircle className="w-4 h-4 shrink-0" />
                    <span>{t('Chat on WhatsApp', 'WhatsApp पर बात करें')}</span>
                  </a>
                </div>

                <RecaptchaNotice className="pt-1" />
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
