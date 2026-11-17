import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  X,
  Lock,
  Mail,
  User as UserIcon,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authModalTab,
    openAuthModal,
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    resetPassword,
  } = useAuth();
  const { language, t, showToast } = useLanguage();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    setErrorMsg('');
    setResetSent(false);
  }, [isAuthModalOpen, authModalTab]);

  useEffect(() => {
    if (!isAuthModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeAuthModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthModalOpen, closeAuthModal]);

  if (!isAuthModalOpen) return null;

  const mapAuthError = (err: any): string => {
    const code = err?.code || '';
    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
      return language === 'hi' ? 'अमान्य ईमेल या पासवर्ड।' : 'Invalid email or password.';
    }
    if (code === 'auth/email-already-in-use') {
      return language === 'hi' ? 'यह ईमेल पहले से पंजीकृत है।' : 'Email is already registered.';
    }
    if (code === 'auth/weak-password') {
      return language === 'hi' ? 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।' : 'Password must be at least 6 characters.';
    }
    if (code === 'auth/invalid-email') {
      return language === 'hi' ? 'कृपया मान्य ईमेल पता दर्ज करें।' : 'Please enter a valid email address.';
    }
    if (code === 'auth/too-many-requests') {
      return language === 'hi'
        ? 'बहुत अधिक प्रयास। कृपया कुछ मिनट बाद पुनः प्रयास करें।'
        : 'Too many attempts. Please wait a few minutes and try again.';
    }
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      return language === 'hi' ? 'Google साइन-इन विंडो बंद कर दी गई।' : 'Google sign-in popup was closed before completing.';
    }
    if (code === 'auth/popup-blocked') {
      return language === 'hi'
        ? 'ब्राउज़र ने साइन-इन पॉपअप ब्लॉक किया है। कृपया पॉपअप अनुमति दें।'
        : 'Sign-in popup was blocked by your browser. Please allow popups for this site.';
    }
    if (code === 'auth/network-request-failed') {
      return language === 'hi'
        ? 'नेटवर्क त्रुटि। कृपया अपना इंटरनेट कनेक्शन जांचें।'
        : 'Network error. Please check your internet connection and retry.';
    }
    return err?.message || (language === 'hi' ? 'प्रमाणीकरण त्रुटि।' : 'Authentication error.');
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      await loginWithGoogle();
      showToast(
        language === 'hi' ? 'Google द्वारा सफलतापूर्वक लॉगिन संपन्न हुआ।' : 'Signed in with Google successfully.',
        'success'
      );
    } catch (err: any) {
      console.error(err);
      setErrorMsg(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmedEmail = email.trim();
    const trimmedName = displayName.trim();

    if (!trimmedEmail) {
      setErrorMsg(t('Please enter your work email.', 'कृपया अपना कार्य ईमेल दर्ज करें।'));
      return;
    }

    setLoading(true);

    try {
      if (authModalTab === 'login') {
        await loginWithEmail(trimmedEmail, password);
        showToast(
          language === 'hi' ? 'सफलतापूर्वक लॉगिन हो गया।' : 'Signed in successfully.',
          'success'
        );
      } else if (authModalTab === 'register') {
        if (!trimmedName) {
          setErrorMsg(t('Please enter your full name.', 'कृपया अपना पूरा नाम दर्ज करें।'));
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setErrorMsg(t('Password must be at least 6 characters.', 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।'));
          setLoading(false);
          return;
        }
        await registerWithEmail(trimmedEmail, password, trimmedName);
        showToast(
          language === 'hi' ? 'खाता सफलतापूर्वक बनाया गया।' : 'Account created successfully.',
          'success'
        );
      } else if (authModalTab === 'forgot') {
        await resetPassword(trimmedEmail);
        setResetSent(true);
        showToast(
          language === 'hi' ? 'पासवर्ड रीसेट लिंक ईमेल पर भेजा गया।' : 'Password reset link sent to your email.',
          'info'
        );
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
        onClick={closeAuthModal}
        aria-hidden="true"
      />

      <div className="min-h-full flex items-center justify-center p-4 sm:p-6 text-center">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-modal-title"
          className="relative bg-white rounded-xl shadow-2xl max-w-md w-full p-6 sm:p-8 text-left border border-slate-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={closeAuthModal}
            className="absolute top-5 right-5 p-2 text-slate-500 hover:text-slate-900 rounded-md hover:bg-slate-100 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-600"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Header */}
          <div className="text-center mb-6">
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
              POWER WEB STUDIO AI
            </span>
            <h2 id="auth-modal-title" className="text-2xl font-black text-slate-950 tracking-tight mt-1">
              {authModalTab === 'login' && t('Enterprise Sign In', 'एंटरप्राइज लॉगिन')}
              {authModalTab === 'register' && t('Create Account', 'नया खाता बनाएं')}
              {authModalTab === 'forgot' && t('Reset Password', 'पासवर्ड रीसेट करें')}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {t(
                'Access client portals, verified APKs, and architecture scopes.',
                'क्लाइंट पोर्टल, निजी APKs एवं आर्किटेक्चर अनुबंधों तक पहुंच।'
              )}
            </p>
          </div>

          {/* Google One-Click Auth */}
          {authModalTab !== 'forgot' && (
            <div className="mb-5">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-slate-300 rounded-lg text-xs sm:text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-600"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{t('Continue with Google', 'Google के साथ जारी रखें')}</span>
              </button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-white text-slate-600 font-semibold uppercase">
                    {t('Or with Work Email', 'या कार्य ईमेल द्वारा')}
                  </span>
                </div>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="mb-4 p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {resetSent ? (
            <div className="py-6 text-center space-y-3">
              <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">
                {t('Password Reset Email Dispatched', 'पासवर्ड रीसेट ईमेल भेजा गया')}
              </h3>
              <p className="text-xs text-slate-600">
                {t(
                  `If an account exists for ${email}, a secure reset link has been dispatched.`,
                  `यदि ${email} का खाता मौजूद है, तो पासवर्ड रीसेट लिंक भेज दिया गया है।`
                )}
              </p>
              <button
                type="button"
                onClick={() => {
                  setResetSent(false);
                  openAuthModal('login');
                }}
                className="text-xs font-bold text-blue-700 hover:text-blue-800 cursor-pointer pt-2"
              >
                {t('Return to Sign In', 'लॉगिन पर वापस जाएं')}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {authModalTab === 'register' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('Full Name', 'पूरा नाम')}
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" aria-hidden="true" />
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Bhanu Ram Bariha"
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-md focus:border-blue-700 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('Work Email', 'कार्य ईमेल')}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" aria-hidden="true" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="architect@enterprise.com"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-md focus:border-blue-700 focus:outline-none"
                  />
                </div>
              </div>

              {authModalTab !== 'forgot' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      {t('Password', 'पासवर्ड')}
                    </label>
                    {authModalTab === 'login' && (
                      <button
                        type="button"
                        onClick={() => openAuthModal('forgot')}
                        className="text-[11px] text-blue-700 hover:text-blue-800 font-semibold cursor-pointer"
                      >
                        {t('Forgot password?', 'पासवर्ड भूल गए?')}
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" aria-hidden="true" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-9 py-2 text-xs border border-slate-300 rounded-md focus:border-blue-700 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? t('Hide password', 'पासवर्ड छिपाएं') : t('Show password', 'पासवर्ड दिखाएं')}
                      className="absolute right-2.5 top-2 p-0.5 text-slate-500 hover:text-slate-800 cursor-pointer rounded focus-visible:outline-2 focus-visible:outline-blue-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-50 rounded-md transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-2"
              >
                <span>
                  {loading
                    ? t('Verifying Credentials...', 'सत्यापन जारी है...')
                    : authModalTab === 'login'
                    ? t('Sign In to Console', 'कंसोल में साइन इन करें')
                    : authModalTab === 'register'
                    ? t('Create Enterprise Account', 'नया खाता बनाएं')
                    : t('Send Reset Link', 'रीसेट लिंक भेजें')}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          )}

          {/* Switch Tab Footers */}
          <div className="mt-5 pt-4 border-t border-slate-100 text-center text-xs text-slate-600">
            {authModalTab === 'login' ? (
              <p>
                {t("Don't have an enterprise account?", 'क्या आपके पास खाता नहीं है?')}{' '}
                <button
                  type="button"
                  onClick={() => openAuthModal('register')}
                  className="font-bold text-blue-700 hover:underline cursor-pointer"
                >
                  {t('Register now', 'अभी पंजीकरण करें')}
                </button>
              </p>
            ) : (
              <p>
                {t('Already registered?', 'पहले से पंजीकृत हैं?')}{' '}
                <button
                  type="button"
                  onClick={() => openAuthModal('login')}
                  className="font-bold text-blue-700 hover:underline cursor-pointer"
                >
                  {t('Sign in here', 'यहाँ लॉगिन करें')}
                </button>
              </p>
            )}
          </div>

          <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-slate-600">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t('Firebase Identity & Role-Based Session Verification', 'Firebase पहचान एवं भूमिका-आधारित सत्र सत्यापन')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
