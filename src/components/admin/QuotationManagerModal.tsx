import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { saveQuotation } from '../../firebase/services';
import { X, FileText, Check } from 'lucide-react';

interface QuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  quotation?: any | null;
}

export const QuotationManagerModal: React.FC<QuotationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  quotation,
}) => {
  const { language, t, showToast } = useLanguage();

  const [formData, setFormData] = useState({
    id: '',
    clientName: '',
    clientEmail: '',
    phone: '',
    company: '',
    serviceType: 'enterprise-software',
    estimatedBudget: '₹25,00,000 - ₹50,00,000',
    timeline: '3-6-months',
    brief: '',
    status: 'pending',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (quotation) {
      setFormData({
        id: quotation.id || `quote-${Date.now()}`,
        clientName: quotation.clientName || '',
        clientEmail: quotation.clientEmail || '',
        phone: quotation.phone || '',
        company: quotation.company || '',
        serviceType: quotation.serviceType || 'enterprise-software',
        estimatedBudget: quotation.estimatedBudget || '₹25,00,000 - ₹50,00,000',
        timeline: quotation.timeline || '3-6-months',
        brief: quotation.brief || '',
        status: quotation.status || 'pending',
      });
    } else {
      setFormData({
        id: `quote-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        clientName: '',
        clientEmail: '',
        phone: '',
        company: '',
        serviceType: 'enterprise-software',
        estimatedBudget: '₹15,00,000 - ₹30,00,000',
        timeline: '3-6-months',
        brief: '',
        status: 'pending',
      });
    }
  }, [quotation, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientName.trim() || !formData.clientEmail.trim()) {
      showToast(t('Please provide client name and email.', 'कृपया ग्राहक का नाम और ईमेल दर्ज करें।'), 'alert');
      return;
    }

    setSaving(true);
    try {
      await saveQuotation({
        ...formData,
        createdAt: quotation?.createdAt || new Date().toISOString(),
      });
      showToast(
        language === 'hi' ? 'कोटेशन सफलतापूर्वक सहेज लिया गया।' : 'Quotation saved successfully.',
        'success'
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to save quotation', 'alert');
    } finally {
      setSaving(false);
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
          className="relative bg-white rounded-xl shadow-2xl max-w-xl w-full p-6 text-left border border-slate-200"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-950">
                {quotation ? t('Edit Commercial Quotation', 'कोटेशन संपादित करें') : t('Create Commercial Quotation', 'नया व्यावसायिक कोटेशन बनाएं')}
              </h3>
              <p className="text-xs text-slate-500">
                {t('Configure technical scope proposal, pricing tiers, and approval status.', 'प्रस्ताव का दायरा, मूल्य निर्धारण और स्वीकृति स्थिति कॉन्फ़िगर करें।')}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5 max-h-[75vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('Client Contact Name *', 'ग्राहक का नाम *')}
                </label>
                <input
                  type="text"
                  required
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  placeholder="e.g. Rajiv Sengupta"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:border-blue-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('Work Email *', 'कार्य ईमेल *')}
                </label>
                <input
                  type="email"
                  required
                  value={formData.clientEmail}
                  onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                  placeholder="client@company.com"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:border-blue-700 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('Company Name', 'कंपनी का नाम')}
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="Kalinga Logistics Ltd."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:border-blue-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('Phone Number', 'फ़ोन नंबर')}
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 94370 12890"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:border-blue-700 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('Service Type', 'सेवा का प्रकार')}
                </label>
                <select
                  value={formData.serviceType}
                  onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:border-blue-700 focus:outline-none bg-white"
                >
                  <option value="enterprise-software">Custom Enterprise Software</option>
                  <option value="android-ecosystem">Native Android Engineering</option>
                  <option value="ai-solutions">Sovereign AI Workflows</option>
                  <option value="cloud-devops">Cloud DevOps & Architecture</option>
                  <option value="web-platforms">High-Performance Web Platforms</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('Proposal Status', 'प्रस्ताव स्थिति')}
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:border-blue-700 focus:outline-none bg-white font-bold"
                >
                  <option value="pending">Pending Review / नई पूछताछ</option>
                  <option value="reviewed">Under Technical Scoping / तकनीकी समीक्षा</option>
                  <option value="accepted">Approved & Contract Signed / स्वीकृत</option>
                  <option value="rejected">Archived / Lost / अस्वीकृत</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('Estimated Budget Scope (INR)', 'अनुमानित बजट दायरा (₹)')}
                </label>
                <input
                  type="text"
                  value={formData.estimatedBudget}
                  onChange={(e) => setFormData({ ...formData, estimatedBudget: e.target.value })}
                  placeholder="₹25,00,000 - ₹50,00,000"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:border-blue-700 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('Project Delivery Window', 'प्रोजेक्ट डिलीवरी विंडो')}
                </label>
                <input
                  type="text"
                  value={formData.timeline}
                  onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                  placeholder="3-6 Months"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:border-blue-700 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('Scope Brief & Deliverables Notes', 'स्कोप विवरण एवं डिलीवरेबल्स')}
              </label>
              <textarea
                rows={3}
                value={formData.brief}
                onChange={(e) => setFormData({ ...formData, brief: e.target.value })}
                placeholder="Details of required architecture, concurrency targets, and deliverables..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:border-blue-700 focus:outline-none"
              />
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
                disabled={saving}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-50 rounded-md transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{saving ? t('Saving...', 'सहेजा जा रहा है...') : t('Save Quotation', 'कोटेशन सहेजें')}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
