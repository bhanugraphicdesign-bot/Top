import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { saveBlogPost } from '../../firebase/services';
import { BlogPost } from '../../types';
import { X, BookOpen, Check } from 'lucide-react';

interface BlogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  post?: BlogPost | null;
  isDemoSandbox?: boolean;
  onSaveDemo?: (savedPost: BlogPost) => void;
}

export const BlogManagerModal: React.FC<BlogModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  post,
  isDemoSandbox = false,
  onSaveDemo,
}) => {
  const { language, t, showToast } = useLanguage();

  const [formData, setFormData] = useState<BlogPost>({
    id: '',
    title: '',
    titleHi: '',
    excerpt: '',
    excerptHi: '',
    content: [],
    contentHi: [],
    author: 'Er. Bhanu Ram Bariha',
    authorRole: 'Founder & Principal Software Architect',
    authorRoleHi: 'संस्थापक एवं प्रधान सॉफ्टवेयर वास्तुकार',
    date: new Date().toISOString().split('T')[0],
    dateHi: new Date().toISOString().split('T')[0],
    readTime: '6 min read',
    readTimeHi: '6 मिनट अध्ययन',
    category: 'Architecture',
    categoryHi: 'आर्किटेक्चर',
  });

  const [contentEnStr, setContentEnStr] = useState('');
  const [contentHiStr, setContentHiStr] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (post) {
      setFormData(post);
      setContentEnStr(post.content.join('\n\n'));
      setContentHiStr((post.contentHi || []).join('\n\n'));
    } else {
      setFormData({
        id: `post-${Date.now()}`,
        title: '',
        titleHi: '',
        excerpt: '',
        excerptHi: '',
        content: [],
        contentHi: [],
        author: 'Er. Bhanu Ram Bariha',
        authorRole: 'Founder & Principal Software Architect',
        authorRoleHi: 'संस्थापक एवं प्रधान सॉफ्टवेयर वास्तुकार',
        date: new Date().toISOString().split('T')[0],
        dateHi: new Date().toISOString().split('T')[0],
        readTime: '5 min read',
        readTimeHi: '5 मिनट अध्ययन',
        category: 'Engineering',
        categoryHi: 'इंजीनियरिंग',
      });
      setContentEnStr('');
      setContentHiStr('');
    }
  }, [post, isOpen]);

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
      showToast(t('Article title is required.', 'लेख का शीर्षक अनिवार्य है।'), 'alert');
      return;
    }

    setSaving(true);
    try {
      const content = contentEnStr
        .split('\n\n')
        .map((p) => p.trim())
        .filter((p) => p.length > 0);

      const contentHi = contentHiStr
        .split('\n\n')
        .map((p) => p.trim())
        .filter((p) => p.length > 0);

      const finalContent = content.length > 0 ? content : ['Article content in drafting phase.'];
      const payload: BlogPost = {
        ...formData,
        titleHi: formData.titleHi || formData.title,
        excerptHi: formData.excerptHi || formData.excerpt,
        content: finalContent,
        contentHi: contentHi.length > 0 ? contentHi : finalContent,
      };

      if (isDemoSandbox) {
        onSaveDemo?.(payload);
        showToast(
          t(
            '[Demo Sandbox] Article saved locally for preview.',
            '[डेमो सैंडबॉक्स] लेख केवल स्थानीय पूर्वावलोकन में सहेजा गया।'
          ),
          'info'
        );
        onSuccess();
        onClose();
        return;
      }

      await saveBlogPost(payload);

      showToast(
        language === 'hi' ? 'ब्लॉग लेख सफलतापूर्वक सहेजा गया।' : 'Blog article published successfully.',
        'success'
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to save blog post', 'alert');
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
          aria-labelledby="blog-manager-modal-title"
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
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 id="blog-manager-modal-title" className="text-lg font-bold text-slate-950">
                {post ? t('Edit Engineering Publication', 'इंजीनियरिंग लेख संपादित करें') : t('Create Engineering Publication', 'नया इंजीनियरिंग लेख प्रकाशित करें')}
              </h3>
              <p className="text-xs text-slate-500">
                {t('Publish technical insights, whitepapers, and enterprise architecture blueprints.', 'तकनीकी श्वेतपत्र और एंटरप्राइज आर्किटेक्चर विश्लेषण प्रकाशित करें।')}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 max-h-[75vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('Article ID / Slug *', 'आर्टिकल स्लग *')}
                </label>
                <input
                  type="text"
                  required
                  value={formData.id}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                  placeholder="post-slug-key"
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:border-blue-700 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('Category', 'श्रेणी')}
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Android Architecture"
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:border-blue-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('Read Time', 'पठन अवधि')}
                </label>
                <input
                  type="text"
                  value={formData.readTime}
                  onChange={(e) => setFormData({ ...formData, readTime: e.target.value })}
                  placeholder="6 min read"
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
                  placeholder="e.g. Zero-Trust Android Architectures"
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
                  placeholder="उदा. ज़ीरो-ट्रस्ट एंड्रॉइड आर्किटेक्चर"
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:border-blue-700 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('Abstract / Excerpt (English)', 'सार / संक्षिप्त परिचय (अंग्रेज़ी)')}
              </label>
              <textarea
                rows={2}
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:border-blue-700 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('Author Name', 'लेखक नाम')}
                </label>
                <input
                  type="text"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:border-blue-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('Author Role', 'लेखक पद')}
                </label>
                <input
                  type="text"
                  value={formData.authorRole}
                  onChange={(e) => setFormData({ ...formData, authorRole: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:border-blue-700 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('Body Paragraphs (Separate with double newline)', 'मुख्य पैराग्राफ (दो नई लाइनों से अलग करें)')}
              </label>
              <textarea
                rows={5}
                value={contentEnStr}
                onChange={(e) => setContentEnStr(e.target.value)}
                placeholder="Write article paragraphs here..."
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:border-blue-700 focus:outline-none font-mono"
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
                <span>{saving ? t('Publishing...', 'प्रकाशन जारी...') : t('Publish Article', 'लेख प्रकाशित करें')}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
