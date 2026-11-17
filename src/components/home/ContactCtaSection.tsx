import React, { useState, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useSiteContact } from '../../hooks/useSiteContact';
import { Phone, Mail, MapPin, Send, CheckCircle, Shield } from 'lucide-react';

import { submitQuotation } from '../../firebase/services';
import { trackConsultationFormSubmit } from '../../firebase/analytics';
import { ValidatedFileUploader } from '../common/ValidatedFileUploader';
import { UploadedFileRecord } from '../../types';
import {
  validateFormAntiBot,
  computeFillDurationMs,
} from '../../utils/formProtection';

export const ContactCtaSection: React.FC = () => {
  const { language, t, dict, showToast } = useLanguage();
  const siteContact = useSiteContact();

  const [formData, setFormData] = useState({
    fullName: '',
    workEmail: '',
    phone: '',
    company: '',
    serviceType: 'enterprise-software',
    timeline: '3-6-months',
    budget: 'mid-tier',
    projectBrief: '',
  });

  const [honeypot, setHoneypot] = useState('');
  const formOpenedAtRef = useRef<number>(Date.now());
  const [attachment, setAttachment] = useState<UploadedFileRecord | null>(null);
  const [uploaderKey, setUploaderKey] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submittedQuoteId, setSubmittedQuoteId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleResetInquiry = () => {
    setSubmitted(false);
    setSubmittedQuoteId('');
    setHoneypot('');
    formOpenedAtRef.current = Date.now();
    setAttachment(null);
    setErrorMsg('');
    setUploaderKey((k) => k + 1);
    setFormData((prev) => ({
      ...prev,
      projectBrief: '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const botCheck = validateFormAntiBot({
      honeypotValue: honeypot,
      formOpenedAt: formOpenedAtRef.current,
      language,
    });
    if (!botCheck.ok) {
      const msg = botCheck.message || '';
      setErrorMsg(msg);
      showToast(msg, 'alert');
      return;
    }

    if (!formData.fullName.trim()) {
      setErrorMsg(dict.validations.nameRequired);
      return;
    }
    if (!formData.workEmail.trim()) {
      setErrorMsg(dict.validations.emailRequired);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.workEmail)) {
      setErrorMsg(dict.validations.emailInvalid);
      return;
    }
    setErrorMsg('');
    setSubmitting(true);

    try {
      const quoteId = await submitQuotation({
        fullName: formData.fullName,
        email: formData.workEmail,
        phone: formData.phone,
        company: formData.company,
        serviceType: formData.serviceType,
        timeline: formData.timeline,
        budget: formData.budget,
        brief: formData.projectBrief,
        language,
        _hp: honeypot,
        formOpenedAt: formOpenedAtRef.current,
        fillDurationMs: computeFillDurationMs(formOpenedAtRef.current),
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
        source: 'contact_cta_form',
        serviceType: formData.serviceType,
        timeline: formData.timeline,
        hasAttachment: Boolean(attachment),
      });
      setSubmittedQuoteId(quoteId || '');
      setSubmitted(true);
      showToast(dict.notifications.consultationBooked, 'success');
    } catch (err: any) {
      const msg =
        err?.message ||
        t(
          'Unable to save architectural inquiry right now. Please verify your inputs and retry.',
          'अनुरोध सहेजने में समस्या हुई। कृपया अपने विवरण जांचें और पुनः प्रयास करें।'
        );
      setErrorMsg(msg);
      showToast(msg, 'alert');
    } finally {
      setSubmitting(false);
    }
  };

  const getEstimatedSquad = () => {
    if (formData.serviceType === 'ai-solutions') {
      return {
        squad: '1 Principal AI Architect, 2 ML Engineers, 1 Full-Stack Engineer',
        duration: '6–10 Weeks',
      };
    } else if (formData.serviceType === 'android-ecosystem') {
      return {
        squad: '1 Mobile Lead Architect, 2 Senior Android (Kotlin) Engineers, 1 QA Engineer',
        duration: '8–12 Weeks',
      };
    }
    return {
      squad: '1 Principal System Architect, 2 Backend Engineers, 1 Frontend Engineer, 1 DevOps Lead',
      duration: '10–14 Weeks',
    };
  };

  const est = getEstimatedSquad();

  return (
    <section id="contact" className="py-20 sm:py-28 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14">
          {/* Left: Contact Info & Scope Guidance (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <div className="text-xs font-bold text-blue-700 tracking-wider uppercase mb-2">
                {t('DIRECT ARCHITECT ENGAGEMENT', 'सीधा संपर्क और परामर्श')}
              </div>
              <h2
                className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight leading-tight"
                style={{ textWrap: 'balance' }}
              >
                {language === 'hi' ? (
                  <>
                    अपने अगले प्रोजेक्ट के लिए <span className="text-blue-700">इंजीनियरिंग परामर्श</span> प्रारंभ करें
                  </>
                ) : (
                  <>
                    Initiate Your <span className="text-blue-700">Architecture Scope</span> & Discovery
                  </>
                )}
              </h2>
              <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
                {t(
                  'Have an architectural dilemma, high-concurrency requirement, or enterprise AI initiative? Schedule a direct discovery session with our Lead Software Architects.',
                  'क्या आपके पास कोई तकनीकी चुनौती या उच्च-समवर्ती आवश्यकता है? हमारे प्रमुख सॉफ्टवेयर आर्किटेक्ट्स के साथ सीधे परामर्श सत्र का समय तय करें।'
                )}
              </p>
            </div>

            {/* Direct Contact Cards */}
            <div className="space-y-3 pt-2">
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex items-start gap-3">
                <MapPin className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    {t('Headquarters & Innovation Campus', 'मुख्यालय और इनोवेशन कैंपस')}
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    {siteContact.name}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {siteContact.location}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-3 min-w-0">
                  <Phone className="w-5 h-5 text-blue-700 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900">
                      {t('Mobile / Enterprise Hotline', 'मोबाइल / हेल्पलाइन नंबर')}
                    </div>
                    <a
                      href={`tel:${siteContact.phone.replace(/\s+/g, '')}`}
                      className="text-xs text-slate-700 hover:text-blue-700 font-mono break-words inline-block"
                    >
                      {siteContact.phone}
                    </a>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shrink-0">
                  {t('Direct Desk', 'सीधा संपर्क')}
                </span>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-3">
                <Mail className="w-5 h-5 text-blue-700 shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900">
                    {t('Direct Engineering Inquiries', 'सीधा ईमेल संपर्क')}
                  </div>
                  <a
                    href={`mailto:${siteContact.email}`}
                    className="text-xs text-blue-700 hover:underline font-mono font-medium break-all inline-block"
                  >
                    {siteContact.email}
                  </a>
                </div>
              </div>
            </div>

            {/* Projected Squad Composition Box */}
            <div className="p-4 rounded-lg bg-blue-50/70 border border-blue-200/60 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-blue-900 uppercase tracking-wider">
                  {t('Standard Squad Allocation:', 'मानक टीम आवंटन:')}
                </span>
                <span className="font-mono text-blue-700 font-bold">{est.duration}</span>
              </div>
              <p className="text-xs text-slate-700 leading-snug">
                {est.squad}
              </p>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1">
                <Shield className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                <span>{t('Strict mutual NDA signed before technical disclosure', 'तकनीकी प्रकटीकरण से पहले आपसी एनडीए')}</span>
              </div>
            </div>
          </div>

          {/* Right: Functional Scope & Estimator Form (7 cols) */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-sm">
              {submitted ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">
                    {t('Inquiry Confirmed', 'अनुरोध सफलतापूर्वक प्राप्त हुआ')}
                  </h3>
                  <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                    {t(
                      `Thank you, ${formData.fullName}. Our Principal Engineering Architect will review your scope for ${formData.company || 'your organization'} and reply within 4 business hours.`,
                      `धन्यवाद, ${formData.fullName}। हमारे मुख्य सॉफ्टवेयर आर्किटेक्ट आपके विवरण की समीक्षा करेंगे और 4 व्यावसायिक घंटों के भीतर संपर्क करेंगे।`
                    )}
                  </p>
                  {submittedQuoteId && (
                    <div className="inline-block px-3 py-1.5 rounded bg-slate-50 border border-slate-200 text-xs text-slate-700 font-mono">
                      {t('Reference ID:', 'संदर्भ आईडी:')} <span className="font-bold text-slate-900">{submittedQuoteId}</span>
                    </div>
                  )}
                  <div className="pt-4">
                    <button
                      type="button"
                      onClick={handleResetInquiry}
                      className="px-5 py-2.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors cursor-pointer"
                    >
                      {t('Submit Another Inquiry', 'एक और अनुरोध भेजें')}
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Honeypot anti-bot trap (isolated from browser autofill & screen readers) */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none fixed -left-[9999px] top-auto h-px w-px overflow-hidden opacity-0"
                  >
                    <label htmlFor="contact-hp-code">Leave this field blank</label>
                    <input
                      id="contact-hp-code"
                      name="contact_hp_code"
                      type="text"
                      tabIndex={-1}
                      autoComplete="new-password"
                      value={honeypot}
                      onChange={(e) => setHoneypot(e.target.value)}
                    />
                  </div>
                  <div className="border-b border-slate-100 pb-3 mb-2">
                    <h3 className="text-xl font-bold text-slate-900">
                      {t('Project Scope & Architectural Inquiry', 'प्रोजेक्ट विवरण और पूछताछ')}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {t('Fill out key parameters to receive a technical scoping estimate.', 'तकनीकी अनुमान प्राप्त करने के लिए विवरण भरें।')}
                    </p>
                  </div>

                  {errorMsg && (
                    <div
                      role="alert"
                      className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-xs"
                    >
                      {errorMsg}
                    </div>
                  )}

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
                        value={formData.workEmail}
                        onChange={(e) => setFormData({ ...formData, workEmail: e.target.value })}
                        placeholder="name@company.com"
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
                        placeholder="Company Ltd."
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-hidden transition-all text-slate-900 bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {t('Technology Service Needed', 'आवश्यक तकनीकी सेवा')}
                      </label>
                      <select
                        value={formData.serviceType}
                        onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-hidden transition-all text-slate-900 bg-white cursor-pointer"
                      >
                        <option value="enterprise-software">{t('Custom Enterprise Software', 'कस्टम एंटरप्राइज सॉफ्टवेयर')}</option>
                        <option value="android-ecosystem">{t('Native Android Application', 'नेटिव एंड्रॉइड ऐप')}</option>
                        <option value="ai-solutions">{t('Enterprise AI & Autonomous Agents', 'एंटरप्राइज एआई व एजेंट्स')}</option>
                        <option value="web-platforms">{t('High-Performance Web Platform', 'उच्च प्रदर्शन वेब प्लेटफॉर्म')}</option>
                        <option value="cloud-devops">{t('Cloud DevOps & Kubernetes', 'क्लाउड डेवऑप्स व कुबेरनेट्स')}</option>
                        <option value="api-integration">{t('Secure API Gateway & Integration', 'सुरक्षित एपीआई गेटवे')}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {t('Target Launch Window', 'लक्षित लॉन्च समय-सीमा')}
                      </label>
                      <select
                        value={formData.timeline}
                        onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-hidden transition-all text-slate-900 bg-white cursor-pointer"
                      >
                        <option value="immediate">{t('Immediate (< 30 Days)', 'तत्काल (< 30 दिन)')}</option>
                        <option value="3-6-months">{t('Quarterly Sprint (2–4 Months)', '2-4 महीने')}</option>
                        <option value="strategic">{t('Enterprise Program (6+ Months)', '6+ महीने')}</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {t('Project Overview & Technical Requirements', 'प्रोजेक्ट विवरण व तकनीकी आवश्यकताएं')}
                    </label>
                    <textarea
                      rows={3}
                      value={formData.projectBrief}
                      onChange={(e) => setFormData({ ...formData, projectBrief: e.target.value })}
                      placeholder={t(
                        'Provide details about your current architecture, user volume, or system integration needs...',
                        'अपने मौजूदा सिस्टम, उपयोगकर्ता संख्या या तकनीकी आवश्यकताओं का विवरण दें...'
                      )}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-hidden transition-all text-slate-900 bg-white"
                    />
                  </div>

                  {/* Validated File Upload (RFP / Technical Architecture Brief) */}
                  <ValidatedFileUploader
                    key={uploaderKey}
                    label="Attach RFP / Architecture Specification (Optional)"
                    labelHi="RFP / तकनीकी विनिर्देश संलग्न करें (वैकल्पिक)"
                    description="Upload PDF, PNG, JPG, or DOCX (up to 10 MB with SHA-256 validation)"
                    descriptionHi="PDF, PNG, JPG, या DOCX अपलोड करें (10 MB तक SHA-256 सत्यापन के साथ)"
                    category="rfp_attachment"
                    onUploadSuccess={(file) => setAttachment(file)}
                    onRemove={() => setAttachment(null)}
                  />

                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <span className="text-xs text-slate-500">
                      {t('No marketing spam · Direct architect response', 'कोई स्पैम नहीं · सीधा आर्किटेक्ट जवाब')}
                    </span>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-50 rounded-md transition-all shadow-xs cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-600"
                    >
                      <Send className="w-3.5 h-3.5 shrink-0" />
                      <span>{submitting ? t('Submitting...', 'भेजा जा रहा है...') : t('Request Architectural Scoping', 'आर्किटेक्चर स्कोप का अनुरोध करें')}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
