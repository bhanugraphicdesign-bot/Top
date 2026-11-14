import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useSiteContact } from '../../hooks/useSiteContact';
import { X, CheckCircle, Clock, Shield, Calendar, Send } from 'lucide-react';
import { submitQuotation } from '../../firebase/services';
import { trackConsultationFormOpen, trackConsultationFormSubmit } from '../../firebase/analytics';
import { ValidatedFileUploader } from '../common/ValidatedFileUploader';
import { UploadedFileRecord } from '../../types';
import {
  validateFormAntiBot,
  extractBilingualApiError,
  computeFillDurationMs,
} from '../../utils/formProtection';

interface ConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedService?: string;
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
}) => {
  const { language, t, dict, showToast } = useLanguage();
  const siteContact = useSiteContact();

  const initialNormalized = normalizeServiceDomain(preselectedService);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    company: '',
    service: initialNormalized.domain,
    timeline: '3-6-months',
    budget: 'enterprise-custom',
    brief: initialNormalized.demoContext ? `Requesting demo & walkthrough for: ${initialNormalized.demoContext}` : '',
  });

  const [honeypot, setHoneypot] = useState('');
  const formOpenedAtRef = useRef<number>(Date.now());
  const [attachment, setAttachment] = useState<UploadedFileRecord | null>(null);
  const [uploaderKey, setUploaderKey] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    formOpenedAtRef.current = Date.now();
    setHoneypot('');
    const { domain, demoContext } = normalizeServiceDomain(preselectedService);
    trackConsultationFormOpen(domain);
    setErrorMessage('');
    setIsSubmitted(false);
    setFormData((prev) => ({
      ...prev,
      service: domain,
      brief: demoContext ? `Requesting demo & walkthrough for: ${demoContext}` : prev.brief,
    }));
  }, [isOpen, preselectedService]);

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
    if (!formData.email.trim()) {
      setErrorMessage(dict.validations.emailRequired);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setErrorMessage(dict.validations.emailInvalid);
      return;
    }
    setErrorMessage('');
    setSubmitting(true);

    try {
      // 1. Server validation & rate-limit enforcement
      const valRes = await fetch('/api/inquiries/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          serviceType: formData.service,
          brief: formData.brief,
          language,
          _hp: honeypot,
          formOpenedAt: formOpenedAtRef.current,
          fillDurationMs: computeFillDurationMs(formOpenedAtRef.current),
        }),
      });

      if (!valRes.ok) {
        const errData = await valRes.json().catch(() => ({}));
        throw new Error(
          extractBilingualApiError(
            valRes.status,
            errData,
            language,
            `Validation failed (HTTP ${valRes.status})`,
            `सत्यापन विफल रहा (HTTP ${valRes.status})`
          )
        );
      }

      // 2. Commit to Cloud Firestore
      await submitQuotation({
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        company: formData.company,
        serviceType: formData.service,
        timeline: formData.timeline,
        budget: formData.budget,
        brief: formData.brief,
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
      setIsSubmitted(true);
      showToast(dict.notifications.consultationBooked, 'success');
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
    setHoneypot('');
    formOpenedAtRef.current = Date.now();
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      company: '',
      service: domain,
      timeline: '3-6-months',
      budget: 'enterprise-custom',
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
          className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 text-left border border-slate-200 transform transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          {isSubmitted ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">
                {t('Architecture Consultation Requested', 'आर्किटेक्चर परामर्श अनुरोध प्राप्त हुआ')}
              </h3>
              <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                {t(
                  `Thank you, ${formData.fullName}. A Principal Solutions Architect from ${siteContact.name} will review your project requirements and connect via ${formData.email} within 4 business hours.`,
                  `धन्यवाद, ${formData.fullName}। ${siteContact.name} के प्रमुख समाधान आर्किटेक्ट आपकी आवश्यकताओं की समीक्षा करेंगे और 4 व्यावसायिक घंटों के भीतर आपसे संपर्क करेंगे।`
                )}
              </p>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 max-w-md mx-auto text-xs text-slate-600 text-left space-y-1.5">
                <p>
                  <span className="font-bold text-slate-900">{t('Reference ID:', 'संदर्भ आईडी:')}</span> PWS-
                  {Math.floor(100000 + Math.random() * 900000)}
                </p>
                <p>
                  <span className="font-bold text-slate-900">{t('Direct Line:', 'सीधा संपर्क:')}</span> {siteContact.phone}
                </p>
                <p>
                  <span className="font-bold text-slate-900">{t('Confidentiality:', 'गोपनीयता:')}</span> {t('Protected under mutual NDA', 'सख्त एनडीए के तहत सुरक्षित')}
                </p>
              </div>
              <div className="pt-4">
                <button
                  onClick={handleReset}
                  className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs rounded-md transition-colors cursor-pointer"
                >
                  {t('Return to Platform', 'प्लेटफ़ॉर्म पर वापस जाएं')}
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-6">
                <div className="text-xs font-bold text-blue-700 tracking-wider uppercase mb-1">
                  {siteContact.name}
                </div>
                <h3 id="consultation-modal-title" className="text-2xl font-bold text-slate-900">
                  {t('Schedule an Architecture Review', 'आर्किटेक्चर समीक्षा शेड्यूल करें')}
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
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {t('Full Name *', 'पूरा नाम *')}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="e.g. Bhanu Ram Bariha"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-hidden transition-all text-slate-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {t('Work Email *', 'कार्य ईमेल *')}
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="name@enterprise.com"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-hidden transition-all text-slate-900 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {t('Phone / WhatsApp', 'फ़ोन / व्हाट्सएप')}
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 98000 00000"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-hidden transition-all text-slate-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {t('Company / Organization', 'कंपनी / संगठन')}
                    </label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      placeholder="Enterprise Ltd."
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-hidden transition-all text-slate-900 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {t('Technology Domain', 'प्रौद्योगिकी डोमेन')}
                    </label>
                    <select
                      value={formData.service}
                      onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-hidden transition-all text-slate-900 bg-white cursor-pointer"
                    >
                      <option value="enterprise-software">{t('Custom Enterprise Software', 'कस्टम एंटरप्राइज सॉफ्टवेयर')}</option>
                      <option value="android-ecosystem">{t('Android App Ecosystem', 'एंड्रॉइड ऐप इकोसिस्टम')}</option>
                      <option value="ai-solutions">{t('AI & Autonomous Agents', 'एआई और ऑटोनॉमस एजेंट्स')}</option>
                      <option value="web-platforms">{t('High-Performance Web Platform', 'उच्च प्रदर्शन वेब प्लेटफॉर्म')}</option>
                      <option value="cloud-devops">{t('Cloud DevOps & Kubernetes', 'क्लाउड डेवऑप्स व कुबेरनेट्स')}</option>
                      <option value="api-integration">{t('API Gateways & Modernization', 'एपीआई गेटवे और आधुनिकीकरण')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {t('Project Target Timeline', 'परियोजना समय-सीमा')}
                    </label>
                    <select
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('Technical Objective / Scope Brief', 'तकनीकी उद्देश्य / संक्षिप्त विवरण')}
                  </label>
                  <textarea
                    rows={3}
                    value={formData.brief}
                    onChange={(e) => setFormData({ ...formData, brief: e.target.value })}
                    placeholder={t(
                      'Briefly describe your concurrency, platform requirements, or architectural challenges...',
                      'अपनी समवर्ती क्षमता, प्लेटफॉर्म आवश्यकताओं या तकनीकी चुनौतियों का संक्षेप में वर्णन करें...'
                    )}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-hidden transition-all text-slate-900 bg-white"
                  />
                </div>

                {/* Validated File Uploader for RFP / Scope Document */}
                <ValidatedFileUploader
                  key={uploaderKey}
                  label="Attach RFP / Scope Document (Optional)"
                  labelHi="RFP / स्कोप दस्तावेज़ संलग्न करें (वैकल्पिक)"
                  description="PDF, DOCX, ZIP, or diagram (up to 25 MB with SHA-256 validation)"
                  descriptionHi="PDF, DOCX, ZIP (25 MB तक SHA-256 सत्यापन के साथ)"
                  category="consultation_rfp"
                  onUploadSuccess={(file) => setAttachment(file)}
                  onRemove={() => setAttachment(null)}
                />

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Shield className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                    <span>{t('Strict NDA protected', 'सख्त एनडीए द्वारा सुरक्षित')}</span>
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-50 rounded-md transition-all shadow-xs cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-600"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submitting ? t('Confirming...', 'पुष्टि हो रही है...') : t('Book Architecture Review', 'आर्किटेक्चर समीक्षा बुक करें')}</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
