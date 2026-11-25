import React from 'react';
import { Language } from '../../types';

interface DemoLanguageToggleProps {
  language: Language;
  onChange: (lang: Language) => void;
  tone?: 'light' | 'dark';
  className?: string;
}

/**
 * Uniform हिन्दी / EN segmented language switcher shared across all 8 demo pages.
 */
export const DemoLanguageToggle: React.FC<DemoLanguageToggleProps> = ({
  language,
  onChange,
  tone = 'dark',
  className = '',
}) => {
  const isHi = language === 'hi';

  const containerClass =
    tone === 'light'
      ? 'inline-flex items-center rounded-md border border-slate-200 bg-slate-100 p-0.5 text-[11px] font-bold shrink-0'
      : 'inline-flex items-center rounded-md border border-white/20 bg-white/10 p-0.5 text-[11px] font-bold shrink-0';

  const activeClass =
    tone === 'light'
      ? 'bg-blue-700 text-white shadow-2xs'
      : 'bg-blue-600 text-white shadow-2xs';

  const inactiveClass =
    tone === 'light'
      ? 'text-slate-700 hover:text-slate-950'
      : 'text-slate-200 hover:text-white';

  return (
    <div
      role="group"
      aria-label={isHi ? 'भाषा चुनें' : 'Select language'}
      className={`${containerClass} ${className}`.trim()}
    >
      <button
        type="button"
        aria-pressed={isHi}
        onClick={() => onChange('hi')}
        className={`px-2 py-1 rounded transition-colors cursor-pointer whitespace-nowrap ${
          isHi ? activeClass : inactiveClass
        }`}
      >
        हिन्दी
      </button>
      <button
        type="button"
        aria-pressed={!isHi}
        onClick={() => onChange('en')}
        className={`px-2 py-1 rounded transition-colors cursor-pointer whitespace-nowrap ${
          !isHi ? activeClass : inactiveClass
        }`}
      >
        EN
      </button>
    </div>
  );
};
