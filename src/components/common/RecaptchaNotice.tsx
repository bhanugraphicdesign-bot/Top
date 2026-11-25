import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

interface RecaptchaNoticeProps {
  tone?: 'light' | 'dark';
  className?: string;
}

export const RecaptchaNotice: React.FC<RecaptchaNoticeProps> = ({
  tone = 'light',
  className = '',
}) => {
  const { language } = useLanguage();

  const textColor = tone === 'dark' ? 'text-slate-200' : 'text-slate-700';
  const linkColor =
    tone === 'dark'
      ? 'text-sky-300 hover:underline font-medium'
      : 'text-blue-700 hover:underline font-medium';

  return (
    <p className={`text-xs leading-relaxed ${textColor} ${className}`.trim()}>
      {language === 'hi' ? (
        <>
          यह साइट reCAPTCHA द्वारा सुरक्षित है और Google की{' '}
          <a
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className={linkColor}
          >
            गोपनीयता नीति
          </a>{' '}
          और{' '}
          <a
            href="https://policies.google.com/terms"
            target="_blank"
            rel="noopener noreferrer"
            className={linkColor}
          >
            सेवा की शर्तें
          </a>{' '}
          लागू होती हैं।
        </>
      ) : (
        <>
          This site is protected by reCAPTCHA and the Google{' '}
          <a
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className={linkColor}
          >
            Privacy Policy
          </a>{' '}
          and{' '}
          <a
            href="https://policies.google.com/terms"
            target="_blank"
            rel="noopener noreferrer"
            className={linkColor}
          >
            Terms of Service
          </a>{' '}
          apply.
        </>
      )}
    </p>
  );
};
