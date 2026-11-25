import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { saveServiceItem } from '../../firebase/services';
import { ServiceItem } from '../../types';
import { X, Cpu, Check } from 'lucide-react';

interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  service?: ServiceItem | null;
  isDemoSandbox?: boolean;
  onSaveDemo?: (savedService: ServiceItem) => void;
}

export const ServiceManagerModal: React.FC<ServiceModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  service,
  isDemoSandbox = false,
  onSaveDemo,
}) => {
  const { language, t, showToast } = useLanguage();

  const [formData, setFormData] = useState<ServiceItem>({
    id: '',
    number: '01',
    title: '',
    titleHi: '',
    category: 'Core Engineering',
    categoryHi: 'कोर इंजीनियरिंग',
    shortDesc: '',
    shortDescHi: '',
    fullDesc: '',
    fullDescHi: '',
    deliverables: [],
    deliverablesHi: [],
    techStack: [],
    icon: 'Layers',
    metric: '<120ms',
    metricLabel: 'P99 Latency',
    metricLabelHi: 'पी99 लेटेंसी',
  });

  const [deliverablesStr, setDeliverablesStr] = useState('');
  const [techStackStr, setTechStackStr] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (service) {
      setFormData(service);
      setDeliverablesStr(service.deliverables.join('\n'));
      setTechStackStr(service.techStack.join(', '));
    } else {
      setFormData({
        id: `service-${Date.now()}`,
        number: '07',
        title: '',
        titleHi: '',
        category: 'Enterprise Engineering',
        categoryHi: 'एंटरप्राइज इंजीनियरिंग',
        shortDesc: '',
        shortDescHi: '',
        fullDesc: '',
        fullDescHi: '',
        deliverables: [],
        deliverablesHi: [],
        techStack: [],
        icon: 'Cpu',
        metric: '<100ms',
        metricLabel: 'Target SLA',
        metricLabelHi: 'लक्षित SLA',
      });
      setDeliverablesStr('Fault-Tolerant Distributed Architecture\nFull Codebase & IP Ownership Deed');
      setTechStackStr('TypeScript, Go, React, PostgreSQL');
    }
  }, [service, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showToast(t('Please provide a service title.', 'कृपया सेवा शीर्षक दर्ज करें।'), 'alert');
      return;
    }

    setSaving(true);
    try {
      const deliverables = deliverablesStr.split('\n').filter((s) => s.trim().length > 0);
      const techStack = techStackStr.split(',').map((s) => s.trim()).filter(Boolean);
      const payload: ServiceItem = {
        ...formData,
        titleHi: formData.titleHi || formData.title,
        shortDescHi: formData.shortDescHi || formData.shortDesc,
        fullDesc: formData.fullDesc || formData.shortDesc,
        fullDescHi: formData.fullDescHi || formData.shortDescHi || formData.fullDesc || formData.shortDesc,
        deliverables,
        deliverablesHi: formData.deliverablesHi.length > 0 ? formData.deliverablesHi : deliverables,
        techStack,
      };

      if (isDemoSandbox) {
        onSaveDemo?.(payload);
        showToast(
          t(
            '[Demo Sandbox] Service catalog item updated locally.',
            '[डेमो सैंडबॉक्स] सेवा कैटलॉग केवल स्थानीय पूर्वावलोकन में सहेजी गई।'
          ),
          'info'
        );
        onSuccess();
        onClose();
        return;
      }

      await saveServiceItem(payload);

      showToast(
        language === 'hi' ? 'सेवा कैटलॉग सफलतापूर्वक सहेज लिया गया।' : 'Service catalog item saved successfully.',
        'success'
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to save service', 'alert');
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
          role="dialog"
          aria-modal="true"
          aria-labelledby="service-manager-modal-title"
          className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 text-left border border-slate-200"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={onClose}
            aria-label={t('Close modal', 'बंद करें')}
            className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 id="service-manager-modal-title" className="text-lg font-bold text-slate-950">
                {service ? t('Edit Technology Service', 'प्रौद्योगिकी सेवा संपादित करें') : t('Add Technology Service', 'नई प्रौद्योगिकी सेवा जोड़ें')}
              </h3>
              <p className="text-xs text-slate-500">
                {t('Configure corporate capability offering, SLA guarantees, and deliverables.', 'कॉर्पोरेट क्षमता, SLA गारंटी और डिलीवरेबल्स कॉन्फ़िगर करें।')}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 max-h-[75vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('Service Number', 'क्रमांक')}
                </label>
                <input
                  type="text"
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  placeholder="01"
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:border-blue-700 focus:outline-none font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('Service Identifier Key', 'सेवा पहचान कुंजी')}
                </label>
                <input
                  type="text"
                  required
                  value={formData.id}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                  placeholder="e.g. custom-enterprise-software"
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:border-blue-700 focus:outline-none font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('Title (English) *', 'शीर्षक (अंग्रेज़ी) *')}
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Sovereign AI Solutions"
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:border-blue-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('Title (Hindi)', 'शीर्षक (हिन्दी)')}
                </label>
                <input
                  type="text"
                  value={formData.titleHi}
                  onChange={(e) => setFormData({ ...formData, titleHi: e.target.value })}
                  placeholder="उदा. संप्रभु एआई समाधान"
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:border-blue-700 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('Short Summary (English)', 'संक्षिप्त विवरण (अंग्रेज़ी)')}
              </label>
              <textarea
                rows={2}
                value={formData.shortDesc}
                onChange={(e) => setFormData({ ...formData, shortDesc: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:border-blue-700 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('Deliverables (1 per line)', 'डिलीवरेबल्स (प्रति पंक्ति 1)')}
                </label>
                <textarea
                  rows={3}
                  value={deliverablesStr}
                  onChange={(e) => setDeliverablesStr(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:border-blue-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('Tech Stack (Comma-separated)', 'तकनीकी स्टैक')}
                </label>
                <textarea
                  rows={3}
                  value={techStackStr}
                  onChange={(e) => setTechStackStr(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:border-blue-700 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('Performance Metric Badge', 'परफॉर्मेंस मेट्रिक')}
                </label>
                <input
                  type="text"
                  value={formData.metric}
                  onChange={(e) => setFormData({ ...formData, metric: e.target.value })}
                  placeholder="e.g. <120ms P99"
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:border-blue-700 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('Metric Label', 'मेट्रिक लेबल')}
                </label>
                <input
                  type="text"
                  value={formData.metricLabel}
                  onChange={(e) => setFormData({ ...formData, metricLabel: e.target.value })}
                  placeholder="e.g. Latency at scale"
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:border-blue-700 focus:outline-none"
                />
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
                disabled={saving}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-50 rounded-md transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{saving ? t('Saving...', 'सहेजा जा रहा है...') : t('Save Service Item', 'सेवा सहेजें')}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
