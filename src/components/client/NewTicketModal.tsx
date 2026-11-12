import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { createSupportTicket } from '../../firebase/services';
import { X, AlertCircle, Check, LifeBuoy, Clock, ShieldAlert } from 'lucide-react';
import { ValidatedFileUploader } from '../common/ValidatedFileUploader';
import { UploadedFileRecord } from '../../types';

interface NewTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (ticket: any) => void;
  defaultProjectCode?: string;
}

export const NewTicketModal: React.FC<NewTicketModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultProjectCode = 'PRJ-FLT-2026',
}) => {
  const { language, t, showToast } = useLanguage();

  const [formData, setFormData] = useState<{
    subject: string;
    priority: 'P1_Critical' | 'P2_High' | 'P3_Normal' | 'P4_Low';
    category: string;
    projectCode: string;
    environment: string;
    details: string;
  }>({
    subject: '',
    priority: 'P2_High',
    category: 'Mobile Runtime & Hardware Driver',
    projectCode: defaultProjectCode,
    environment: 'Android 14 (API 34) / Enterprise Fleet',
    details: '',
  });

  const [attachment, setAttachment] = useState<UploadedFileRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject.trim() || !formData.details.trim()) {
      showToast(t('Please complete subject and detailed brief.', 'कृपया विषय एवं विस्तृत विवरण भरें।'), 'alert');
      return;
    }

    setSubmitting(true);
    try {
      const fullDetails = `[Project: ${formData.projectCode}] [Category: ${formData.category}] [Env: ${formData.environment}]\n\n${formData.details}`;
      const ticketId = await createSupportTicket({
        subject: formData.subject,
        priority: formData.priority,
        category: formData.category,
        projectCode: formData.projectCode,
        environment: formData.environment,
        details: fullDetails,
        attachment: attachment
          ? {
              fileUrl: attachment.downloadUrl,
              fileName: attachment.fileName,
              sha256: attachment.sha256,
              fileSizeFormatted: attachment.fileSizeFormatted,
            }
          : undefined,
      });

      const newTicket = {
        id: ticketId || `tkt-${Date.now()}`,
        subject: formData.subject,
        priority: formData.priority,
        category: formData.category,
        projectCode: formData.projectCode,
        environment: formData.environment,
        details: fullDetails,
        attachment: attachment || null,
        responses: [],
        status: 'open',
        createdAt: new Date().toISOString(),
      };

      showToast(
        language === 'hi'
          ? `प्राथमिकता सहायता टिकट (${formData.priority}) सफलतापूर्वक दर्ज हुआ। SLA सक्रिय।`
          : `Priority SLA Ticket (${formData.priority}) created successfully in Firestore.`,
        'success'
      );

      onSuccess(newTicket);
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to submit ticket', 'alert');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="min-h-full flex items-center justify-center p-4 sm:p-6 text-center">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-ticket-modal-title"
          className="relative bg-white rounded-xl shadow-2xl max-w-xl w-full p-6 text-left border border-slate-200"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <LifeBuoy className="w-5 h-5 text-blue-700" />
            </div>
            <div>
              <h3 id="new-ticket-modal-title" className="text-lg font-bold text-slate-950">
                {t('Raise Priority SLA Support Ticket', 'प्राथमिकता SLA सहायता टिकट दर्ज करें')}
              </h3>
              <p className="text-xs text-slate-500">
                {t(
                  'Direct dispatch to Principal Architect & Assigned Engineering Squad.',
                  'प्रधान आर्किटेक्ट एवं समर्पित इंजीनियरिंग स्क्वाड को सीधी सूचना।'
                )}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5 max-h-[75vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('SLA Priority Level *', 'SLA प्राथमिकता स्तर *')}
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:border-blue-700 focus:outline-none font-medium cursor-pointer"
                >
                  <option value="P1_Critical">P1 Critical (&lt; 15 Mins SLA - Production Blocker)</option>
                  <option value="P2_High">P2 High (&lt; 2 Hrs SLA - Major Feature Impaired)</option>
                  <option value="P3_Normal">P3 Normal (&lt; 8 Hrs SLA - Routine Request)</option>
                  <option value="P4_Low">P4 Low (&lt; 24 Hrs SLA - General Inquiry)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('Issue Category', 'समस्या श्रेणी')}
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:border-blue-700 focus:outline-none font-medium cursor-pointer"
                >
                  <option value="Mobile Runtime & Hardware Driver">Mobile Runtime & Hardware Driver</option>
                  <option value="Cloud API & Microservice Latency">Cloud API & Microservice Latency</option>
                  <option value="Offline SQLite Cipher & Data Sync">Offline SQLite Cipher & Data Sync</option>
                  <option value="Security, Keystore & Compliance">Security, Keystore & Compliance</option>
                  <option value="Change Request & Architecture Scope">Change Request & Architecture Scope</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('Project Engagement Code', 'प्रोजेक्ट कोड')}
                </label>
                <input
                  type="text"
                  value={formData.projectCode}
                  onChange={(e) => setFormData({ ...formData, projectCode: e.target.value })}
                  placeholder="PRJ-FLT-2026"
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:border-blue-700 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('Target Environment / Version', 'लक्ष्य वातावरण / संस्करण')}
                </label>
                <input
                  type="text"
                  value={formData.environment}
                  onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
                  placeholder="Android 14 / v2.4.1-rc3"
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:border-blue-700 focus:outline-none font-mono text-[11px]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('Subject / Summary *', 'विषय / सारांश *')}
              </label>
              <input
                type="text"
                required
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder={t('e.g. BLE Soundbox reconnect latency spike on Android 14', 'उदा. एंड्रॉइड 14 पर बीएलई साउंडबॉक्स लेटेंसी स्पाइक')}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:border-blue-700 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('Detailed Description & Steps to Reproduce *', 'विस्तृत विवरण एवं चरण *')}
              </label>
              <textarea
                rows={4}
                required
                value={formData.details}
                onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                placeholder={t('Provide stack traces, reproduction steps, device models, or incident logs...', 'त्रुटि लॉग, डिवाइस मॉडल या घटना का विवरण दर्ज करें...')}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:border-blue-700 focus:outline-none font-mono text-[11px]"
              />
            </div>

            {/* Validated Crash Dumps / Diagnostics File Upload */}
            <ValidatedFileUploader
              label="Attach Diagnostic Logs / Stack Trace / Screenshots (Optional)"
              labelHi="त्रुटि लॉग / स्टैक ट्रेस / स्क्रीनशॉट संलग्न करें (वैकल्पिक)"
              description="Upload TXT, JSON, PNG, JPG, ZIP (up to 25 MB with SHA-256 validation)"
              descriptionHi="TXT, JSON, PNG, JPG, ZIP अपलोड करें (25 MB तक SHA-256 सत्यापन के साथ)"
              category="support_ticket_diagnostic"
              onUploadSuccess={(file) => setAttachment(file)}
              onRemove={() => setAttachment(null)}
            />

            <div className="p-3 bg-blue-50/70 rounded-lg border border-blue-200 text-xs text-blue-900 flex items-start gap-2">
              <Clock className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
              <div>
                <strong>{t('Contractual SLA Guarantee:', 'अनुबंधित SLA गारंटी:')}</strong>{' '}
                {formData.priority === 'P1_Critical' && t('On-call architect page sent immediately. First response within 15 minutes.', 'ऑन-कॉल आर्किटेक्ट को तत्काल पेज भेजा गया। 15 मिनट के भीतर प्रतिक्रिया।')}
                {formData.priority === 'P2_High' && t('Senior Systems Engineer assigned. Guaranteed response within 2 hours.', 'वरिष्ठ सिस्टम इंजीनियर नियुक्त। 2 घंटे के भीतर गारंटीकृत प्रतिक्रिया।')}
                {formData.priority === 'P3_Normal' && t('Standard engineering triage. Response within 8 hours.', 'मानक इंजीनियरिंग ट्राइएज। 8 घंटे के भीतर उत्तर।')}
                {formData.priority === 'P4_Low' && t('Non-blocking request. Response within 24 hours.', 'गैर-अवरोधक अनुरोध। 24 घंटे के भीतर उत्तर।')}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                {t('Cancel', 'रद्द करें')}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-50 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{submitting ? t('Dispatching...', 'प्रेषित हो रहा है...') : t('Dispatch SLA Ticket', 'SLA टिकट दर्ज करें')}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
