import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { saveClientRecord } from '../../firebase/services';
import { X, User, Check } from 'lucide-react';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  customer?: any | null;
  isDemoSandbox?: boolean;
  onSaveDemo?: (savedCustomer: any) => void;
}

export const CustomerManagerModal: React.FC<CustomerModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  customer,
  isDemoSandbox = false,
  onSaveDemo,
}) => {
  const { language, t, showToast } = useLanguage();

  const [formData, setFormData] = useState({
    uid: '',
    email: '',
    displayName: '',
    companyName: '',
    phone: '',
    role: 'client' as 'admin' | 'client',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (customer) {
      setFormData({
        uid: customer.uid || `user-${Date.now()}`,
        email: customer.email || '',
        displayName: customer.displayName || '',
        companyName: customer.companyName || '',
        phone: customer.phone || '',
        role: customer.role === 'admin' ? 'admin' : 'client',
      });
    } else {
      setFormData({
        uid: `user-${Date.now()}`,
        email: '',
        displayName: '',
        companyName: '',
        phone: '',
        role: 'client',
      });
    }
  }, [customer, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email.trim() || !formData.displayName.trim()) {
      showToast(t('Please provide both name and email.', 'कृपया नाम और ईमेल दोनों दर्ज करें।'), 'alert');
      return;
    }

    setSaving(true);
    try {
      const createdAt = customer?.createdAt || new Date().toISOString();
      if (isDemoSandbox) {
        onSaveDemo?.({
          ...customer,
          ...formData,
          createdAt,
          lastLoginAt: new Date().toISOString(),
        });
        showToast(
          t(
            '[Demo Sandbox] Customer record updated locally for preview.',
            '[डेमो सैंडबॉक्स] ग्राहक रिकॉर्ड केवल स्थानीय पूर्वावलोकन में सहेजा गया।'
          ),
          'info'
        );
        onSuccess();
        onClose();
        return;
      }

      await saveClientRecord({
        ...formData,
        createdAt: customer?.createdAt ? undefined : createdAt,
      });
      showToast(
        language === 'hi'
          ? 'ग्राहक रिकॉर्ड सफलतापूर्वक सहेज लिया गया।'
          : 'Customer record saved successfully.',
        'success'
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to save customer', 'alert');
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
          className="relative bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 text-left border border-slate-200"
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
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-950">
                {customer ? t('Edit Client Account', 'ग्राहक खाता संपादित करें') : t('Add Enterprise Client', 'नया एंटरप्राइज ग्राहक जोड़ें')}
              </h3>
              <p className="text-xs text-slate-500">
                {t('Configure user credentials, organization, and access role.', 'उपयोगकर्ता पहचान, संगठन और एक्सेस रोल कॉन्फ़िगर करें।')}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('Full Name *', 'पूरा नाम *')}
              </label>
              <input
                type="text"
                required
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                placeholder="e.g. Ramesh Chandra Sethi"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:border-blue-700 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('Work Email Address *', 'कार्य ईमेल पता *')}
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="client@enterprise.com"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:border-blue-700 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('Company / Organization', 'कंपनी / संगठन')}
                </label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="e.g. Kalinga Logistics Ltd."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:border-blue-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('Phone / Contact', 'फ़ोन नंबर')}
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98000 00000"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:border-blue-700 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('Platform Privilege Role', 'सिस्टम रोल प्रिविलेज')}
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'client' })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:border-blue-700 focus:outline-none bg-white"
              >
                <option value="client">{t('Client (Standard Portal Access)', 'क्लाइंट (मानक पोर्टल एक्सेस)')}</option>
                <option value="admin">{t('Administrator (Full Control Console)', 'एडमिनिस्ट्रेटर (पूर्ण नियंत्रण)')}</option>
              </select>
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
                <span>{saving ? t('Saving...', 'सहेजा जा रहा है...') : t('Save Customer', 'ग्राहक सहेजें')}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
