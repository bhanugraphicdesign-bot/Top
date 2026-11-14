import React, { useState } from 'react';
import { useApps } from '../../context/AppsContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { AndroidApp, AppCategory, AppReleaseStatus } from '../../types';
import { ASSETS } from '../../data/content';
import { X, Plus, Edit2, Trash2, RotateCcw, Check, Smartphone, ShieldCheck, AlertCircle } from 'lucide-react';

interface AdminAppManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingApp?: AndroidApp | null;
}

export const AdminAppManagerModal: React.FC<AdminAppManagerModalProps> = ({ isOpen, onClose, editingApp }) => {
  const { apps, addApp, updateApp, deleteApp, resetToDefaults } = useApps();
  const { isAdmin } = useAuth();
  const { t, showToast } = useLanguage();

  const [mode, setMode] = useState<'list' | 'add' | 'edit'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState<{
    name: string;
    nameHi: string;
    tagline: string;
    taglineHi: string;
    category: AppCategory;
    version: string;
    architecture: string;
    description: string;
    descriptionHi: string;
    keyFeaturesStr: string;
    keyFeaturesHiStr: string;
    techStackStr: string;
    status: AppReleaseStatus;
    downloadSize: string;
    targetSdk: string;
  }>({
    name: '',
    nameHi: '',
    tagline: '',
    taglineHi: '',
    category: 'Business Apps',
    version: 'v1.0.0 Enterprise',
    architecture: 'Clean Architecture + MVI + Kotlin Coroutines',
    description: '',
    descriptionHi: '',
    keyFeaturesStr: 'Sub-200ms transaction processing\nOffline encrypted cache',
    keyFeaturesHiStr: 'सब-200ms लेनदेन प्रसंस्करण\nऑफ़लाइन एन्क्रिप्टेड कैश',
    techStackStr: 'Kotlin, Jetpack Compose, Room DB',
    status: 'enterprise_distribution',
    downloadSize: '22 MB',
    targetSdk: 'Android 14 (API 34)',
  });

  React.useEffect(() => {
    setConfirmDeleteId(null);
    if (editingApp) {
      handleStartEdit(editingApp);
    } else if (isOpen) {
      setMode('list');
      setEditingId(null);
    }
  }, [editingApp, isOpen]);

  if (!isOpen || !isAdmin) return null;

  const handleStartAdd = () => {
    setFormData({
      name: '',
      nameHi: '',
      tagline: '',
      taglineHi: '',
      category: 'Business Apps',
      version: 'v1.0.0 Enterprise',
      architecture: 'Clean Architecture + MVI + Kotlin Coroutines',
      description: '',
      descriptionHi: '',
      keyFeaturesStr: 'Sub-200ms transaction processing\nOffline encrypted cache',
      keyFeaturesHiStr: 'सब-200ms लेनदेन प्रसंस्करण\nऑफ़लाइन एन्क्रिप्टेड कैश',
      techStackStr: 'Kotlin, Jetpack Compose, Room DB',
      status: 'enterprise_distribution',
      downloadSize: '22 MB',
      targetSdk: 'Android 14 (API 34)',
    });
    setEditingId(null);
    setMode('add');
  };

  const handleStartEdit = (app: AndroidApp) => {
    setEditingId(app.id);
    setFormData({
      name: app.name,
      nameHi: app.nameHi,
      tagline: app.tagline,
      taglineHi: app.taglineHi,
      category: app.category,
      version: app.version,
      architecture: app.architecture,
      description: app.description,
      descriptionHi: app.descriptionHi,
      keyFeaturesStr: app.keyFeatures.join('\n'),
      keyFeaturesHiStr: app.keyFeaturesHi.join('\n'),
      techStackStr: app.techStack.join(', '),
      status: app.status,
      downloadSize: app.downloadSize,
      targetSdk: app.targetSdk,
    });
    setMode('edit');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !isAdmin) return;

    const keyFeatures = formData.keyFeaturesStr.split('\n').filter((s) => s.trim().length > 0);
    const keyFeaturesHi = formData.keyFeaturesHiStr.split('\n').filter((s) => s.trim().length > 0);
    const techStack = formData.techStackStr.split(',').map((s) => s.trim()).filter(Boolean);

    const statusLabels: Record<AppReleaseStatus, { en: string; hi: string }> = {
      enterprise_distribution: { en: 'Enterprise Distribution (Private APK)', hi: 'एंटरप्राइज वितरण (प्राइवेट एपीके)' },
      internal_testing: { en: 'Internal Pilot Testing', hi: 'आंतरिक पायलट परीक्षण' },
      private_apk: { en: 'Private Partner APK', hi: 'प्राइवेट पार्टनर एपीके' },
      in_development: { en: 'In Active Development', hi: 'सक्रिय विकास में' },
      published: { en: 'Google Play Release', hi: 'गूगल प्ले रिलीज' },
    };

    const categoryHiMap: Record<AppCategory, string> = {
      'Business Apps': 'बिजनेस ऐप्स',
      'Education Apps': 'शिक्षा ऐप्स',
      'Productivity Apps': 'उत्पादकता ऐप्स',
      'Utility Apps': 'उपयोगिता ऐप्स',
      'E-commerce Apps': 'ई-कॉमर्स ऐप्स',
      'Enterprise Apps': 'एंटरप्राइज ऐप्स',
      'AI-powered Apps': 'एआई संचालित ऐप्स',
    };

    try {
      if (mode === 'add') {
        const newApp: AndroidApp = {
          id: `app-${Date.now()}`,
          name: formData.name,
          nameHi: formData.nameHi || formData.name,
          tagline: formData.tagline,
          taglineHi: formData.taglineHi || formData.tagline,
          category: formData.category,
          categoryHi: categoryHiMap[formData.category] || formData.category,
          version: formData.version,
          architecture: formData.architecture,
          description: formData.description,
          descriptionHi: formData.descriptionHi || formData.description,
          keyFeatures: keyFeatures.length > 0 ? keyFeatures : ['Production-ready Kotlin Architecture'],
          keyFeaturesHi: keyFeaturesHi.length > 0 ? keyFeaturesHi : ['प्रोडक्शन-रेडी कोटलिन आर्किटेक्चर'],
          techStack: techStack.length > 0 ? techStack : ['Kotlin', 'Compose'],
          metrics: [
            { label: 'Target Uptime', labelHi: 'लक्षित अपटाइम', value: 'HA Design' },
            { label: 'Target Latency', labelHi: 'लेटेंसी', value: '<250ms' },
            { label: 'Crash Rate', labelHi: 'क्रैश दर', value: '0.01%' },
          ],
          accentColor: '#1E40AF',
          iconName: 'Smartphone',
          status: formData.status,
          statusLabelEn: statusLabels[formData.status].en,
          statusLabelHi: statusLabels[formData.status].hi,
          downloadSize: formData.downloadSize,
          targetSdk: formData.targetSdk,
          screenshots: [
            ASSETS.appMockupImage,
            ASSETS.androidImage,
          ],
        };
        await addApp(newApp);
      } else if (mode === 'edit' && editingId) {
        await updateApp(editingId, {
          name: formData.name,
          nameHi: formData.nameHi,
          tagline: formData.tagline,
          taglineHi: formData.taglineHi,
          category: formData.category,
          categoryHi: categoryHiMap[formData.category] || formData.category,
          version: formData.version,
          architecture: formData.architecture,
          description: formData.description,
          descriptionHi: formData.descriptionHi,
          keyFeatures,
          keyFeaturesHi,
          techStack,
          status: formData.status,
          statusLabelEn: statusLabels[formData.status].en,
          statusLabelHi: statusLabels[formData.status].hi,
          downloadSize: formData.downloadSize,
          targetSdk: formData.targetSdk,
        });
      }
      setMode('list');
    } catch (err: any) {
      showToast(err?.message || 'Admin authorization required.', 'alert');
    }
  };

  const categories: AppCategory[] = [
    'Business Apps',
    'Education Apps',
    'Productivity Apps',
    'Utility Apps',
    'E-commerce Apps',
    'Enterprise Apps',
    'AI-powered Apps',
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="min-h-full flex items-center justify-center p-4 sm:p-6 text-center">
        <div
          className="relative bg-white rounded-xl shadow-2xl max-w-3xl w-full p-6 sm:p-8 text-left border border-slate-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {t('Portfolio Architecture Admin Console', 'पोर्टफोलियो आर्किटेक्चर एडमिन कंसोल')}
                </h3>
                <p className="text-xs text-slate-500">
                  {t('Add, Edit, and Manage Android Apps across all 7 Enterprise Categories', 'सभी 7 श्रेणियों में ऐप्स जोड़ने, संपादित करने और प्रबंधित करने की सुविधा')}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {mode === 'list' ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  {t(`Registered Apps (${apps.length})`, `पंजीकृत ऐप्स (${apps.length})`)}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={resetToDefaults}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{t('Reset Defaults', 'डिफ़ॉल्ट रीसेट')}</span>
                  </button>
                  <button
                    onClick={handleStartAdd}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-md transition-colors cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{t('Add New App', 'नया ऐप जोड़ें')}</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
                {apps.map((app) => (
                  <div
                    key={app.id}
                    className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-blue-400 transition-all flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                          {app.category}
                        </span>
                        <span aria-hidden="true" className="text-slate-300">·</span>
                        <span className="text-xs text-slate-500 font-mono">{app.version}</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 truncate mt-0.5">
                        {app.name}
                      </h4>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {app.statusLabelEn}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setConfirmDeleteId(null);
                          handleStartEdit(app);
                        }}
                        className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                        title="Edit app"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {confirmDeleteId === app.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={async () => {
                              await deleteApp(app.id);
                              setConfirmDeleteId(null);
                            }}
                            className="px-2 py-1 text-[11px] font-bold text-white bg-rose-700 hover:bg-rose-800 rounded cursor-pointer"
                          >
                            {t('Confirm', 'पुष्टि करें')}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-1 text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded cursor-pointer"
                          >
                            {t('Cancel', 'रद्द')}
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(app.id)}
                          className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                          title="Delete app"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                  {mode === 'add' ? t('Add New Android App', 'नया एंड्रॉइड ऐप जोड़ें') : t('Edit Android App', 'ऐप संपादित करें')}
                </span>
                <button
                  type="button"
                  onClick={() => setMode('list')}
                  className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  {t('Cancel', 'रद्द करें')}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('App Name (English) *', 'ऐप का नाम (अंग्रेज़ी) *')}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. FinCore Express"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-600 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('App Name (Hindi)', 'ऐप का नाम (हिन्दी)')}
                  </label>
                  <input
                    type="text"
                    value={formData.nameHi}
                    onChange={(e) => setFormData({ ...formData, nameHi: e.target.value })}
                    placeholder="e.g. फिनकोर एक्सप्रेस"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-600 outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('Category *', 'श्रेणी *')}
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as AppCategory })}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-600 outline-hidden bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('Version', 'संस्करण')}
                  </label>
                  <input
                    type="text"
                    value={formData.version}
                    onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-600 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('Release Status *', 'रिलीज स्थिति *')}
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as AppReleaseStatus })}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-600 outline-hidden bg-white"
                  >
                    <option value="enterprise_distribution">Enterprise Distribution (Private APK)</option>
                    <option value="internal_testing">Internal Pilot Testing</option>
                    <option value="private_apk">Private Partner APK</option>
                    <option value="in_development">In Active Development</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('Tagline (English)', 'टैगलाइन (अंग्रेज़ी)')}
                </label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  placeholder="e.g. High-throughput retail payment terminal"
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-600 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('Architecture Pattern', 'आर्किटेक्चर पैटर्न')}
                </label>
                <input
                  type="text"
                  value={formData.architecture}
                  onChange={(e) => setFormData({ ...formData, architecture: e.target.value })}
                  placeholder="e.g. Clean Architecture + MVI + Room DB"
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-600 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('Description (English)', 'विवरण (अंग्रेज़ी)')}
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-600 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('Key Features (1 per line)', 'प्रमुख विशेषताएं (प्रति पंक्ति 1)')}
                  </label>
                  <textarea
                    rows={3}
                    value={formData.keyFeaturesStr}
                    onChange={(e) => setFormData({ ...formData, keyFeaturesStr: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-600 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('Tech Stack (Comma-separated)', 'तकनीकी स्टैक (अल्पविराम से अलग)')}
                  </label>
                  <textarea
                    rows={3}
                    value={formData.techStackStr}
                    onChange={(e) => setFormData({ ...formData, techStackStr: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-600 outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setMode('list')}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  {t('Cancel', 'रद्द करें')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-md transition-colors cursor-pointer shadow-xs"
                >
                  {t('Save App Configuration', 'ऐप कॉन्फ़िगरेशन सहेजें')}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
