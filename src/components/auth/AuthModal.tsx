import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  X,
  Lock,
  Mail,
  User as UserIcon,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Moon,
  Sun,
  Check,
  Loader2,
  Globe,
} from 'lucide-react';
import '../../styles/login-neumorphic.css';

const LOGIN_THEME_STORAGE_KEY = 'pws_login_theme';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readSavedLoginTheme(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(LOGIN_THEME_STORAGE_KEY) === 'dark';
  } catch {
    return false;
  }
}

export const AuthModal: React.FC = () => {
  const {
    currentUser,
    isRoleChecking,
    isAuthModalOpen,
    closeAuthModal,
    authModalTab,
    openAuthModal,
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    resetPassword,
  } = useAuth();
  const { language, setLanguage, t, showToast } = useLanguage();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isDark, setIsDark] = useState<boolean>(readSavedLoginTheme);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const googleClickLockRef = useRef(false);

  useEffect(() => {
    setErrorMsg('');
    setResetSent(false);
  }, [isAuthModalOpen, authModalTab]);

  useEffect(() => {
    if (isAuthModalOpen && currentUser && !isRoleChecking) {
      closeAuthModal();
    }
  }, [isAuthModalOpen, currentUser, isRoleChecking, closeAuthModal]);

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

  const toggleLoginTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(LOGIN_THEME_STORAGE_KEY, next ? 'dark' : 'light');
      } catch {
        // Ignore storage errors in private/sandboxed modes
      }
      return next;
    });
  };

  const mapAuthError = (err: any): string => {
    const code = String(err?.code || '');
    if (code === 'auth/unauthorized-domain') {
      return language === 'hi'
        ? 'यह डोमेन अभी Firebase में अधिकृत नहीं है।'
        : 'This domain is not yet authorized in Firebase.';
    }
    if (
      code === 'auth/invalid-credential' ||
      code === 'auth/wrong-password' ||
      code === 'auth/user-not-found'
    ) {
      return language === 'hi'
        ? 'गलत ईमेल या पासवर्ड। कृपया दोबारा जांचें।'
        : 'Incorrect email or password. Please check and try again.';
    }
    if (code === 'auth/email-already-in-use') {
      return language === 'hi'
        ? 'यह ईमेल पहले से पंजीकृत है। कृपया साइन इन करें।'
        : 'This email is already registered. Please sign in instead.';
    }
    if (code === 'auth/weak-password') {
      return language === 'hi'
        ? 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।'
        : 'Password must be at least 6 characters long.';
    }
    if (code === 'auth/invalid-email') {
      return language === 'hi'
        ? 'कृपया एक मान्य ईमेल पता दर्ज करें।'
        : 'Please enter a valid email address.';
    }
    if (code === 'auth/too-many-requests') {
      return language === 'hi'
        ? 'बहुत अधिक असफल प्रयास। कृपया कुछ मिनट बाद पुनः प्रयास करें।'
        : 'Too many attempts. Please wait a few minutes and try again.';
    }
    if (
      code === 'auth/popup-closed-by-user' ||
      code === 'auth/cancelled-popup-request' ||
      String(err?.message || '').includes('Pending promise was never set')
    ) {
      return language === 'hi'
        ? 'Google साइन-इन विंडो पूरी होने से पहले बंद कर दी गई।'
        : 'Google sign-in popup was closed before completing.';
    }
    if (code === 'auth/popup-blocked') {
      return language === 'hi'
        ? 'ब्राउज़र ने Google साइन-इन पॉपअप को ब्लॉक कर दिया है। कृपया अपने मोबाइल/ब्राउज़र सेटिंग में पॉपअप की अनुमति दें (या Chrome/Safari में खोलें) और फिर से प्रयास करें।'
        : 'Your browser blocked the Google sign-in popup. Please allow popups in your mobile or browser settings (or open in Chrome/Safari) and try again.';
    }
    if (code === 'auth/network-request-failed') {
      return language === 'hi'
        ? 'नेटवर्क त्रुटि। कृपया अपना इंटरनेट कनेक्शन जांचें और पुनः प्रयास करें।'
        : 'Network error. Please check your internet connection and try again.';
    }
    return (
      err?.message ||
      (language === 'hi'
        ? 'लॉगिन प्रक्रिया में त्रुटि हुई। कृपया पुनः प्रयास करें।'
        : 'Authentication failed. Please try again.')
    );
  };

  if (!isAuthModalOpen) return null;

  const isExpectedAuthError = (err: any): boolean => {
    const code = String(err?.code || '');
    const msg = String(err?.message || '');
    return (
      code === 'auth/popup-closed-by-user' ||
      code === 'auth/cancelled-popup-request' ||
      code === 'auth/popup-blocked' ||
      code === 'auth/invalid-credential' ||
      code === 'auth/wrong-password' ||
      code === 'auth/user-not-found' ||
      code === 'auth/email-already-in-use' ||
      code === 'auth/weak-password' ||
      code === 'auth/invalid-email' ||
      code === 'auth/too-many-requests' ||
      code === 'auth/network-request-failed' ||
      msg.includes('Pending promise was never set')
    );
  };

  const handleGoogleSignIn = async () => {
    if (googleClickLockRef.current || loading || googleLoading) return;
    googleClickLockRef.current = true;
    try {
      setGoogleLoading(true);
      setErrorMsg('');
      await loginWithGoogle(rememberMe);
      showToast(
        language === 'hi'
          ? 'Google द्वारा सफलतापूर्वक साइन इन हो गया।'
          : 'Signed in with Google successfully.',
        'success'
      );
    } catch (err: any) {
      if (!isExpectedAuthError(err)) {
        console.error(err);
      }
      const msg = mapAuthError(err);
      setErrorMsg(msg);
      if (err?.code === 'auth/popup-blocked') {
        showToast(msg, 'alert');
      }
    } finally {
      googleClickLockRef.current = false;
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || googleLoading) return;
    setErrorMsg('');

    const trimmedEmail = email.trim();
    const trimmedName = displayName.trim();

    if (authModalTab === 'register' && !trimmedName) {
      setErrorMsg(t('Please enter your full name.', 'कृपया अपना पूरा नाम दर्ज करें।'));
      return;
    }

    if (!trimmedEmail) {
      setErrorMsg(
        t('Please enter your email address.', 'कृपया अपना ईमेल पता दर्ज करें।')
      );
      return;
    }

    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setErrorMsg(
        t('Please enter a valid email address.', 'कृपया एक मान्य ईमेल पता दर्ज करें।')
      );
      return;
    }

    if (authModalTab !== 'forgot' && !password) {
      setErrorMsg(t('Please enter your password.', 'कृपया अपना पासवर्ड दर्ज करें।'));
      return;
    }

    if (authModalTab === 'register' && password.length < 6) {
      setErrorMsg(
        t(
          'Password must be at least 6 characters long.',
          'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।'
        )
      );
      return;
    }

    setLoading(true);

    try {
      if (authModalTab === 'login') {
        await loginWithEmail(trimmedEmail, password, rememberMe);
        showToast(
          language === 'hi' ? 'सफलतापूर्वक साइन इन हो गया।' : 'Signed in successfully.',
          'success'
        );
      } else if (authModalTab === 'register') {
        await registerWithEmail(trimmedEmail, password, trimmedName);
        showToast(
          language === 'hi' ? 'खाता सफलतापूर्वक बनाया गया।' : 'Account created successfully.',
          'success'
        );
      } else if (authModalTab === 'forgot') {
        await resetPassword(trimmedEmail);
        setResetSent(true);
        showToast(
          language === 'hi'
            ? 'पासवर्ड रीसेट लिंक आपके ईमेल पर भेज दिया गया है।'
            : 'Password reset link sent to your email.',
          'info'
        );
      }
    } catch (err: any) {
      if (!isExpectedAuthError(err)) {
        console.error(err);
      }
      setErrorMsg(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const isBusy = loading || googleLoading;

  const headingText =
    authModalTab === 'login'
      ? t('Welcome Back', 'वापसी पर स्वागत है')
      : authModalTab === 'register'
      ? t('Create Account', 'नया खाता बनाएं')
      : t('Reset Password', 'पासवर्ड रीसेट करें');

  const subheadingText =
    authModalTab === 'login'
      ? t('Sign in to continue', 'जारी रखने के लिए साइन इन करें')
      : authModalTab === 'register'
      ? t('Create your account to continue', 'जारी रखने के लिए अपना खाता बनाएं')
      : t(
          'Enter your email to receive a reset link',
          'रीसेट लिंक प्राप्त करने के लिए अपना ईमेल दर्ज करें'
        );

  return (
    <div
      className={`pws-login-shell fixed inset-0 z-50 overflow-y-auto overflow-x-hidden ${
        isDark ? 'pws-login-dark' : ''
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      {/* Decorative 3D Soft Blue Background Circles (clipped to prevent overflow) */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="pws-login-orb pws-login-orb-1" />
        <div className="pws-login-orb pws-login-orb-2" />
        <div className="pws-login-orb pws-login-orb-3" />
      </div>

      {/* Top-Right Floating Controls: Language Toggle, Login Dark Mode Toggle, Close */}
      <div className="fixed top-3 right-3 sm:top-5 sm:right-6 z-20 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setLanguage(language === 'hi' ? 'en' : 'hi')}
          aria-label={
            language === 'hi' ? 'Switch language to English' : 'भाषा हिन्दी में बदलें'
          }
          className="pws-login-neu-btn min-w-[44px] min-h-[44px] px-3 rounded-full inline-flex items-center justify-center gap-1.5 text-xs font-bold cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-500"
        >
          <Globe className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{language === 'hi' ? 'EN' : 'हिं'}</span>
        </button>

        <button
          type="button"
          onClick={toggleLoginTheme}
          aria-pressed={isDark}
          aria-label={
            isDark
              ? t('Switch login page to light mode', 'लॉगिन पेज को लाइट मोड में बदलें')
              : t('Switch login page to dark mode', 'लॉगिन पेज को डार्क मोड में बदलें')
          }
          className="pws-login-neu-btn w-11 h-11 min-w-[44px] min-h-[44px] rounded-full inline-flex items-center justify-center cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-500"
        >
          {isDark ? (
            <Sun className="w-5 h-5 text-amber-300" aria-hidden="true" />
          ) : (
            <Moon className="w-5 h-5 text-blue-700" aria-hidden="true" />
          )}
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            closeAuthModal();
          }}
          aria-label={t('Close login', 'बंद करें')}
          className="pws-login-neu-btn w-11 h-11 min-w-[44px] min-h-[44px] rounded-full inline-flex items-center justify-center cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-500"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      {/* Centered Card Container */}
      <div className="relative z-10 min-h-full flex items-center justify-center px-3.5 pt-20 pb-8 sm:px-6 sm:py-12">
        <div
          className="pws-login-card w-full max-w-[436px] rounded-[28px] p-5 min-[375px]:p-6 sm:p-9"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Brand Logo + Wordmark + Heading */}
          <div className="flex flex-col items-center text-center mb-6 sm:mb-7">
            <div className="pws-login-logo-tile w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-2xl p-1.5 flex items-center justify-center mb-3.5">
              {!logoFailed ? (
                <img
                  src="/apple-touch-icon.png"
                  alt="POWER WEB STUDIO AI"
                  width={64}
                  height={64}
                  onError={() => setLogoFailed(true)}
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                <span className="text-lg font-black tracking-tight text-blue-600">PW</span>
              )}
            </div>

            <div
              className="text-[11px] sm:text-xs font-extrabold tracking-[0.16em] uppercase"
              style={{ color: 'var(--login-brand-accent)' }}
            >
              POWER WEB STUDIO AI
            </div>

            <h2
              id="auth-modal-title"
              className="mt-2.5 text-2xl sm:text-[28px] font-extrabold tracking-tight leading-tight"
              style={{ color: 'var(--login-heading)', textWrap: 'balance' }}
            >
              {headingText}
            </h2>

            <p
              className="mt-1.5 text-xs sm:text-sm font-medium"
              style={{ color: 'var(--login-subtext)' }}
            >
              {subheadingText}
            </p>
          </div>

          {/* Bilingual Error Banner */}
          {errorMsg && (
            <div
              role="alert"
              className="pws-login-error-box mb-5 px-3.5 py-3 rounded-2xl text-xs sm:text-[13px] font-medium flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span className="leading-snug">{errorMsg}</span>
            </div>
          )}

          {/* Reset Password Confirmation State */}
          {resetSent ? (
            <div className="py-4 text-center space-y-4">
              <div className="pws-login-success-box rounded-2xl p-5 flex flex-col items-center gap-2.5">
                <CheckCircle className="w-10 h-10" aria-hidden="true" />
                <h3 className="text-base font-bold">
                  {t('Password Reset Link Sent', 'पासवर्ड रीसेट लिंक भेजा गया')}
                </h3>
                <p className="text-xs sm:text-sm leading-relaxed opacity-90">
                  {t(
                    `If an account exists for ${email.trim()}, a password reset link has been sent to your inbox.`,
                    `यदि ${email.trim()} के लिए खाता मौजूद है, तो आपके इनबॉक्स में पासवर्ड रीसेट लिंक भेज दिया गया है।`
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setResetSent(false);
                  openAuthModal('login');
                }}
                className="pws-login-primary-btn w-full min-h-[50px] px-5 py-3 rounded-2xl text-sm font-bold cursor-pointer inline-flex items-center justify-center gap-2 focus-visible:outline-2 focus-visible:outline-blue-500"
              >
                <span>{t('Back to Sign In', 'साइन इन पर वापस जाएं')}</span>
                <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {/* Full Name Field (Register tab only) */}
              {authModalTab === 'register' && (
                <div>
                  <label
                    htmlFor="auth-display-name"
                    className="block text-xs font-semibold mb-1.5 pl-1"
                    style={{ color: 'var(--login-label)' }}
                  >
                    {t('Full Name', 'पूरा नाम')}
                  </label>
                  <div className="pws-login-input-wrap relative flex items-center rounded-2xl min-h-[50px]">
                    <UserIcon
                      className="w-[18px] h-[18px] ml-4 shrink-0"
                      style={{ color: 'var(--login-icon-color)' }}
                      aria-hidden="true"
                    />
                    <input
                      id="auth-display-name"
                      name="displayName"
                      type="text"
                      autoComplete="name"
                      disabled={isBusy}
                      value={displayName}
                      onChange={(e) => {
                        setDisplayName(e.target.value);
                        if (errorMsg) setErrorMsg('');
                      }}
                      placeholder={t('Enter your full name', 'अपना पूरा नाम लिखें')}
                      className="pws-login-input w-full min-w-0 px-3.5 py-3 text-sm font-medium focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Username or Email Field */}
              <div>
                <label
                  htmlFor="auth-email"
                  className="block text-xs font-semibold mb-1.5 pl-1"
                  style={{ color: 'var(--login-label)' }}
                >
                  {t('Username or Email', 'यूज़रनेम या ईमेल')}
                </label>
                <div className="pws-login-input-wrap relative flex items-center rounded-2xl min-h-[50px]">
                  <Mail
                    className="w-[18px] h-[18px] ml-4 shrink-0"
                    style={{ color: 'var(--login-icon-color)' }}
                    aria-hidden="true"
                  />
                  <input
                    id="auth-email"
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    disabled={isBusy}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errorMsg) setErrorMsg('');
                    }}
                    placeholder={t('name@example.com', 'आपका ईमेल पता लिखें')}
                    className="pws-login-input w-full min-w-0 px-3.5 py-3 text-sm font-medium focus:outline-none"
                  />
                </div>
              </div>

              {/* Password Field (Login & Register tabs) */}
              {authModalTab !== 'forgot' && (
                <div>
                  <label
                    htmlFor="auth-password"
                    className="block text-xs font-semibold mb-1.5 pl-1"
                    style={{ color: 'var(--login-label)' }}
                  >
                    {t('Password', 'पासवर्ड')}
                  </label>
                  <div className="pws-login-input-wrap relative flex items-center rounded-2xl min-h-[50px]">
                    <Lock
                      className="w-[18px] h-[18px] ml-4 shrink-0"
                      style={{ color: 'var(--login-icon-color)' }}
                      aria-hidden="true"
                    />
                    <input
                      id="auth-password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete={
                        authModalTab === 'register' ? 'new-password' : 'current-password'
                      }
                      disabled={isBusy}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errorMsg) setErrorMsg('');
                      }}
                      placeholder="••••••••"
                      className="pws-login-input w-full min-w-0 pl-3.5 pr-2 py-3 text-sm font-medium focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={
                        showPassword
                          ? t('Hide password', 'पासवर्ड छिपाएं')
                          : t('Show password', 'पासवर्ड दिखाएं')
                      }
                      aria-pressed={showPassword}
                      className="min-w-[44px] min-h-[44px] mr-1 rounded-xl inline-flex items-center justify-center cursor-pointer transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-blue-500 shrink-0"
                      style={{ color: 'var(--login-icon-color)' }}
                    >
                      {showPassword ? (
                        <EyeOff className="w-[18px] h-[18px]" aria-hidden="true" />
                      ) : (
                        <Eye className="w-[18px] h-[18px]" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Remember Me + Forgot Password Row (Login tab) */}
              {authModalTab === 'login' && (
                <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                  <label
                    htmlFor="auth-remember-me"
                    className="inline-flex items-center gap-2.5 min-h-[44px] cursor-pointer select-none"
                  >
                    <input
                      id="auth-remember-me"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="sr-only peer"
                    />
                    <span
                      data-checked={rememberMe ? 'true' : 'false'}
                      aria-hidden="true"
                      className="pws-login-checkbox-box w-5 h-5 rounded-md inline-flex items-center justify-center shrink-0 peer-focus-visible:outline-2 peer-focus-visible:outline-blue-500"
                    >
                      {rememberMe && (
                        <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                      )}
                    </span>
                    <span
                      className="text-xs sm:text-[13px] font-semibold"
                      style={{ color: 'var(--login-subtext)' }}
                    >
                      {t('Remember me', 'मुझे याद रखें')}
                    </span>
                  </label>

                  <button
                    type="button"
                    onClick={() => openAuthModal('forgot')}
                    className="min-h-[44px] px-1 text-xs sm:text-[13px] font-bold cursor-pointer hover:underline focus-visible:outline-2 focus-visible:outline-blue-500 rounded-md"
                    style={{ color: 'var(--login-brand-accent)' }}
                  >
                    {t('Forgot password?', 'पासवर्ड भूल गए?')}
                  </button>
                </div>
              )}

              {/* Large 3D Blue Gradient Primary Action Button */}
              <button
                type="submit"
                disabled={isBusy}
                className="pws-login-primary-btn w-full min-h-[52px] px-6 py-3.5 rounded-2xl text-sm sm:text-[15px] font-bold tracking-wide cursor-pointer inline-flex items-center justify-center gap-2.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 mt-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
                    <span>
                      {authModalTab === 'login'
                        ? t('Signing in...', 'साइन इन हो रहा है...')
                        : authModalTab === 'register'
                        ? t('Creating account...', 'खाता बनाया जा रहा है...')
                        : t('Sending reset link...', 'लिंक भेजा जा रहा है...')}
                    </span>
                  </>
                ) : (
                  <>
                    <span>
                      {authModalTab === 'login'
                        ? t('Login', 'लॉगिन करें')
                        : authModalTab === 'register'
                        ? t('Create Account', 'खाता बनाएं')
                        : t('Send Reset Link', 'रीसेट लिंक भेजें')}
                    </span>
                    <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* OR CONTINUE WITH + Google Auth (real GoogleAuthProvider configured) */}
          {!resetSent && authModalTab !== 'forgot' && (
            <div className="mt-6">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="flex-1 h-px"
                  style={{ background: 'var(--login-divider)' }}
                />
                <span
                  className="text-[11px] font-bold tracking-[0.12em] uppercase whitespace-nowrap"
                  style={{ color: 'var(--login-muted)' }}
                >
                  {t('OR CONTINUE WITH', 'या इससे जारी रखें')}
                </span>
                <div
                  className="flex-1 h-px"
                  style={{ background: 'var(--login-divider)' }}
                />
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isBusy}
                className="pws-login-neu-btn w-full min-h-[48px] px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold cursor-pointer inline-flex items-center justify-center gap-3 focus-visible:outline-2 focus-visible:outline-blue-500"
              >
                {googleLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
                ) : (
                  <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" aria-hidden="true">
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
                )}
                <span>
                  {googleLoading
                    ? t('Connecting to Google...', 'Google से जुड़ रहा है...')
                    : t('Continue with Google', 'Google के साथ जारी रखें')}
                </span>
              </button>
            </div>
          )}

          {/* Create Account / Sign In Switch Footer (real registerWithEmail exists) */}
          <div
            className="mt-6 pt-4 text-center text-xs sm:text-[13px] font-medium"
            style={{
              borderTop: '1px solid var(--login-divider)',
              color: 'var(--login-subtext)',
            }}
          >
            {authModalTab === 'login' ? (
              <p className="flex flex-wrap items-center justify-center gap-1">
                <span>{t("Don't have an account?", 'क्या आपका खाता नहीं है?')}</span>
                <button
                  type="button"
                  onClick={() => openAuthModal('register')}
                  className="min-h-[44px] px-1.5 font-bold cursor-pointer hover:underline focus-visible:outline-2 focus-visible:outline-blue-500 rounded-md inline-flex items-center"
                  style={{ color: 'var(--login-brand-accent)' }}
                >
                  {t('Create Account', 'नया खाता बनाएं')}
                </button>
              </p>
            ) : (
              <p className="flex flex-wrap items-center justify-center gap-1">
                <span>{t('Already have an account?', 'क्या आपका खाता पहले से है?')}</span>
                <button
                  type="button"
                  onClick={() => openAuthModal('login')}
                  className="min-h-[44px] px-1.5 font-bold cursor-pointer hover:underline focus-visible:outline-2 focus-visible:outline-blue-500 rounded-md inline-flex items-center"
                  style={{ color: 'var(--login-brand-accent)' }}
                >
                  {t('Sign In', 'साइन इन करें')}
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
