import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useNavigation } from '../../context/NavigationContext';
import {
  X,
  User as UserIcon,
  Mail,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  LogOut,
  Copy,
  Check,
  Clock,
  KeyRound,
  LayoutDashboard,
} from 'lucide-react';

export const ProfileModal: React.FC = () => {
  const {
    currentUser,
    isAdmin,
    isProfileModalOpen,
    closeProfileModal,
    logout,
  } = useAuth();
  const { language, t } = useLanguage();
  const { navigate } = useNavigation();

  const [imgError, setImgError] = useState(false);
  const [copiedUid, setCopiedUid] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    setImgError(false);
    setCopiedUid(false);
  }, [currentUser?.uid, currentUser?.photoURL, isProfileModalOpen]);

  useEffect(() => {
    if (!isProfileModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeProfileModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isProfileModalOpen, closeProfileModal]);

  if (!isProfileModalOpen || !currentUser) return null;

  const realDisplayName = currentUser.displayName?.trim() || '';
  const realEmail = currentUser.email?.trim() || '';
  const avatarInitial = (realDisplayName || realEmail).charAt(0).toUpperCase();

  const providers =
    currentUser.providerData
      ?.map((p) => {
        if (p.providerId === 'google.com') return 'Google';
        if (p.providerId === 'password') return t('Email & Password', 'ईमेल व पासवर्ड');
        return p.providerId;
      })
      .filter(Boolean)
      .join(', ') || 'Firebase Auth';

  const formatDate = (raw?: string) => {
    if (!raw) return '—';
    const dt = new Date(raw);
    if (Number.isNaN(dt.getTime())) return raw;
    return dt.toLocaleString(language === 'hi' ? 'hi-IN' : 'en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const handleCopyUid = async () => {
    try {
      await navigator.clipboard.writeText(currentUser.uid);
      setCopiedUid(true);
      setTimeout(() => setCopiedUid(false), 2000);
    } catch {
      // Clipboard API may be unavailable in restricted contexts
    }
  };

  const handleLogout = async () => {
    setSigningOut(true);
    try {
      closeProfileModal();
      await logout();
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
        onClick={closeProfileModal}
        aria-hidden="true"
      />

      <div className="min-h-full flex items-center justify-center p-4 sm:p-6 text-center">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="profile-modal-title"
          className="relative bg-white rounded-xl shadow-2xl max-w-md w-full p-6 sm:p-7 text-left border border-slate-200"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={closeProfileModal}
            className="absolute top-4 right-4 p-2 text-slate-500 hover:text-slate-900 rounded-md hover:bg-slate-100 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-600"
            aria-label={t('Close profile details', 'प्रोफ़ाइल बंद करें')}
          >
            <X className="w-5 h-5" />
          </button>

          <div className="mb-5">
            <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
              {t('Firebase Account Profile', 'Firebase अकाउंट प्रोफ़ाइल')}
            </span>
            <h2 id="profile-modal-title" className="text-xl font-black text-slate-950 tracking-tight mt-0.5">
              {t('Profile Details', 'प्रोफ़ाइल विवरण')}
            </h2>
          </div>

          {/* Authenticated User Summary Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3.5 mb-5">
            {currentUser.photoURL && !imgError ? (
              <img
                src={currentUser.photoURL}
                alt={realDisplayName || realEmail || 'User avatar'}
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
                className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-xs shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold text-lg shadow-xs shrink-0">
                {avatarInitial || <UserIcon className="w-6 h-6" />}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="text-base font-extrabold text-slate-950 truncate">
                {realDisplayName || t('Display name not set', 'नाम उपलब्ध नहीं है')}
              </div>
              <div className="text-xs text-slate-600 flex items-center gap-1.5 mt-0.5 truncate">
                <Mail className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                <span className="truncate">{realEmail || t('No email linked', 'ईमेल उपलब्ध नहीं')}</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border ${
                    currentUser.emailVerified
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  {currentUser.emailVerified ? (
                    <CheckCircle className="w-3 h-3" />
                  ) : (
                    <AlertTriangle className="w-3 h-3" />
                  )}
                  <span>
                    {currentUser.emailVerified
                      ? t('Verified Email', 'सत्यापित ईमेल')
                      : t('Unverified Email', 'असत्यापित ईमेल')}
                  </span>
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  <ShieldCheck className="w-3 h-3" />
                  <span>{isAdmin ? t('System Admin', 'सिस्टम एडमिन') : t('Client Account', 'क्लाइंट खाता')}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Live Firebase Auth Metadata */}
          <div className="space-y-2.5 text-xs bg-white border border-slate-200 rounded-lg p-3.5 mb-5">
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
              <span className="text-slate-500 flex items-center gap-1.5 shrink-0">
                <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                <span>UID:</span>
              </span>
              <div className="flex items-center gap-1.5 min-w-0">
                <code className="font-mono text-[11px] text-slate-800 truncate">{currentUser.uid}</code>
                <button
                  type="button"
                  onClick={handleCopyUid}
                  className="p-1 text-slate-500 hover:text-blue-700 rounded hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                  aria-label={t('Copy UID', 'UID कॉपी करें')}
                  title={t('Copy UID', 'UID कॉपी करें')}
                >
                  {copiedUid ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
              <span className="text-slate-500">{t('Sign-In Provider:', 'लॉगिन माध्यम:')}</span>
              <span className="font-semibold text-slate-800">{providers}</span>
            </div>

            <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{t('Last Sign-In:', 'अंतिम लॉगिन:')}</span>
              </span>
              <span className="font-medium text-slate-800 text-right">
                {formatDate(currentUser.metadata?.lastSignInTime)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-500">{t('Account Created:', 'खाता निर्माण:')}</span>
              <span className="font-medium text-slate-800 text-right">
                {formatDate(currentUser.metadata?.creationTime)}
              </span>
            </div>
          </div>

          {/* Actions: Portal Navigation & Separate Logout */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <button
              type="button"
              onClick={() => {
                closeProfileModal();
                navigate(isAdmin ? 'admin-dashboard' : 'client-dashboard');
              }}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-blue-700" />
              <span>
                {isAdmin
                  ? t('Open Admin Console', 'एडमिन कंसोल खोलें')
                  : t('Open Client Portal', 'क्लाइंट पोर्टल खोलें')}
              </span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              disabled={signingOut}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-60 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{t('Logout', 'लॉग आउट')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
