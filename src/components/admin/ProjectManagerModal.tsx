import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { saveProject } from '../../firebase/services';
import { X, Layers, Check } from 'lucide-react';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  project?: any | null;
  usersList?: any[];
  isDemoSandbox?: boolean;
  onSaveDemo?: (savedProject: any) => void;
}

export const ProjectManagerModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  project,
  usersList = [],
  isDemoSandbox = false,
  onSaveDemo,
}) => {
  const { language, t, showToast } = useLanguage();

  const [formData, setFormData] = useState({
    id: '',
    code: '',
    name: '',
    nameHi: '',
    clientId: 'client-default',
    clientName: '',
    clientEmail: '',
    sprint: '',
    sprintHi: '',
    completion: 50,
    status: 'In Sprints',
    statusHi: 'सक्रिय स्प्रिंट',
    health: 'Nominal (P99: 40ms)',
    healthHi: 'उत्कृष्ट (P99: 40ms)',
    leadArchitect: 'Bhanu Ram Bariha / Principal Systems Pod',
    leadArchitectHi: 'भानु राम बरीहा / प्रधान सिस्टम्स दल',
    stackStr: 'Kotlin, Go, PostgreSQL, Kafka',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (project) {
      const existingStack = Array.isArray(project.techStack)
        ? project.techStack
        : Array.isArray(project.stack)
        ? project.stack
        : ['Kotlin', 'Go', 'PostgreSQL'];
      setFormData({
        id: project.id || `proj-${Date.now()}`,
        code: project.code || 'PRJ-ENG-2026',
        name: project.name || '',
        nameHi: project.nameHi || project.name || '',
        clientId: project.clientId || 'client-default',
        clientName: project.clientName || 'Enterprise Partner',
        clientEmail: project.clientEmail || '',
        sprint: project.sprint || 'Sprint 1 of 8',
        sprintHi: project.sprintHi || 'स्प्रिंट 1 / 8',
        completion: project.completion || 0,
        status: project.status || 'In Sprints',
        statusHi: project.statusHi || 'सक्रिय स्प्रिंट',
        health: project.health || 'Nominal',
        healthHi: project.healthHi || 'उत्कृष्ट',
        leadArchitect: project.leadArchitect || 'Bhanu Ram Bariha',
        leadArchitectHi: project.leadArchitectHi || 'भानु राम बरीहा',
        stackStr: existingStack.join(', '),
      });
    } else {
      setFormData({
        id: `proj-${Date.now()}`,
        code: `PRJ-${Math.floor(100 + Math.random() * 900)}-2026`,
        name: '',
        nameHi: '',
        clientId: 'client-default',
        clientName: '',
        clientEmail: '',
        sprint: 'Sprint 1 of 12 (Foundation)',
        sprintHi: 'स्प्रिंट 1 / 12 (आधारशिला)',
        completion: 10,
        status: 'In Sprints',
        statusHi: 'सक्रिय स्प्रिंट',
        health: 'Nominal (P99: 35ms)',
        healthHi: 'उत्कृष्ट (P99: 35ms)',
        leadArchitect: 'Bhanu Ram Bariha / Principal Systems Pod',
        leadArchitectHi: 'भानु राम बरीहा / प्रधान सिस्टम्स दल',
        stackStr: 'Jetpack Compose, Go, PostgreSQL, Redis',
      });
    }
  }, [project, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelectRegisteredClient = (selectedUid: string) => {
    const found = usersList.find((u) => (u.uid || u.id) === selectedUid);
    if (found) {
      setFormData((prev) => ({
        ...prev,
        clientId: found.uid || found.id,
        clientName: found.displayName || found.companyName || prev.clientName,
        clientEmail: found.email || prev.clientEmail,
      }));
    } else {
      setFormData((prev) => ({ ...prev, clientId: selectedUid }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast(t('Please provide a project name.', 'कृपया परियोजना का नाम दर्ज करें।'), 'alert');
      return;
    }

    setSaving(true);
    try {
      const stack = formData.stackStr.split(',').map((s) => s.trim()).filter(Boolean);
      const payload = {
        ...formData,
        clientId: formData.clientId.trim() || 'client-default',
        clientEmail: formData.clientEmail.trim(),
        techStack: stack,
        stack,
        updatedAt: new Date().toISOString(),
      };
      if (isDemoSandbox) {
        onSaveDemo?.(payload);
        showToast(
          t(
            '[Demo Sandbox] Project saved locally for preview.',
            '[डेमो सैंडबॉक्स] परियोजना केवल स्थानीय पूर्वावलोकन में सहेजी गई।'
          ),
          'info'
        );
        onSuccess();
        onClose();
        return;
      }
      await saveProject(payload);
      showToast(
        language === 'hi' ? 'परियोजना सफलतापूर्वक सहेज ली गई।' : 'Project saved successfully.',
        'success'
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to save project', 'alert');
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
          aria-labelledby="project-manager-modal-title"
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
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 id="project-manager-modal-title" className="text-lg font-bold text-slate-950">
                {project ? t('Edit Software Project', 'परियोजना संपादित करें') : t('Create New Enterprise Project', 'नई एंटरप्राइज परियोजना बनाएं')}
              </h3>
              <p className="text-xs text-slate-500">
                {t('Configure contract milestones, sprint velocity, and architecture lead.', 'अनुबंध माइलस्टोन्स, स्प्रिंट गति और आर्किटेक्ट लीड कॉन्फ़िगर करें।')}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5 max-h-[75vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('Project Code *', 'प्रोजेक्ट कोड *')}
                </label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g. PRJ-FLT-2026"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:border-blue-700 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('Client / Organization Name', 'ग्राहक / संस्था का नाम')}
                </label>
                <input
                  type="text"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  placeholder="e.g. Apex Bharat Logistics Ltd."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:border-blue-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('Client Email', 'ग्राहक ईमेल')}
                </label>
                <input
                  type="email"
                  value={formData.clientEmail}
                  onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                  placeholder="client@enterprise.in"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:border-blue-700 focus:outline-none font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {usersList.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('Assign Registered Client Account', 'पंजीकृत ग्राहक खाता चुनें')}
                  </label>
                  <select
                    value={usersList.some((u) => (u.uid || u.id) === formData.clientId) ? formData.clientId : ''}
                    onChange={(e) => e.target.value && handleSelectRegisteredClient(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:border-blue-700 focus:outline-none bg-white"
                  >
                    <option value="">{t('-- Select Client from Directory --', '-- सूची से ग्राहक चुनें --')}</option>
                    {usersList.map((u) => (
                      <option key={u.uid || u.id} value={u.uid || u.id}>
                        {(u.displayName || u.email)} ({u.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className={usersList.length > 0 ? '' : 'sm:col-span-2'}>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('Assigned Client UID (Firestore Access Key)', 'क्लाइंट UID (फ़ायरस्टोर एक्सेस कुंजी)')}
                </label>
                <input
                  type="text"
                  value={formData.clientId}
                  onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                  placeholder="Firebase Auth UID"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:border-blue-700 focus:outline-none font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('Project Title (English) *', 'प्रोजेक्ट शीर्षक (अंग्रेज़ी) *')}
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Bharat Fleet ERP & Distributed Telematics"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:border-blue-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('Project Title (Hindi)', 'प्रोजेक्ट शीर्षक (हिन्दी)')}
                </label>
                <input
                  type="text"
                  value={formData.nameHi}
                  onChange={(e) => setFormData({ ...formData, nameHi: e.target.value })}
                  placeholder="उदा. भारत फ्लीट ईआरपी एवं टेलीमैटिक्स"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:border-blue-700 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('Current Sprint Description (EN)', 'वर्तमान स्प्रिंट (अंग्रेज़ी)')}
                </label>
                <input
                  type="text"
                  value={formData.sprint}
                  onChange={(e) => setFormData({ ...formData, sprint: e.target.value })}
                  placeholder="e.g. Sprint 14 of 16 (Release Candidate)"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:border-blue-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('Current Sprint Description (HI)', 'वर्तमान स्प्रिंट (हिन्दी)')}
                </label>
                <input
                  type="text"
                  value={formData.sprintHi}
                  onChange={(e) => setFormData({ ...formData, sprintHi: e.target.value })}
                  placeholder="उदा. स्प्रिंट 14 / 16 (रिलीज कैंडिडेट)"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:border-blue-700 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('Completion % (0-100)', 'पूर्णता प्रतिशत (0-100)')}
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.completion}
                  onChange={(e) => setFormData({ ...formData, completion: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:border-blue-700 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('Contract Status', 'अनुबंध स्थिति')}
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:border-blue-700 focus:outline-none bg-white"
                >
                  <option value="Discovery">Discovery & Scoping</option>
                  <option value="In Sprints">In Active Sprints</option>
                  <option value="QA & Staging">QA & Staging</option>
                  <option value="Deployed">Production Deployed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('Operational Health', 'सिस्टम स्थिति')}
                </label>
                <input
                  type="text"
                  value={formData.health}
                  onChange={(e) => setFormData({ ...formData, health: e.target.value })}
                  placeholder="e.g. Nominal (P99: 38ms)"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:border-blue-700 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('Tech Stack (Comma-separated)', 'तकनीकी स्टैक (अल्पविराम द्वारा अलग)')}
              </label>
              <input
                type="text"
                value={formData.stackStr}
                onChange={(e) => setFormData({ ...formData, stackStr: e.target.value })}
                placeholder="Kotlin Multiplatform, Go, PostgreSQL, Kafka"
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
                <span>{saving ? t('Saving...', 'सहेजा जा रहा है...') : t('Save Project', 'परियोजना सहेजें')}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
