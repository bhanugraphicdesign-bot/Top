import React from 'react';

export type PremiumButtonVariant = 'primary' | 'glass' | 'glass-dark' | 'amber' | 'emerald';
export type PremiumButtonSize = 'xs' | 'sm' | 'md' | 'lg';

interface BaseProps {
  variant?: PremiumButtonVariant;
  size?: PremiumButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
  children: React.ReactNode;
}

export type PremiumButtonProps = BaseProps &
  (
    | (React.ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined })
    | (React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; disabled?: boolean })
  );

const VARIANT_CLASS: Record<PremiumButtonVariant, string> = {
  primary: 'pws-btn-3d text-white',
  glass: 'pws-btn-glass text-slate-900',
  'glass-dark': 'pws-btn-glass pws-btn-glass-dark text-white',
  amber: 'pws-btn-amber text-slate-950',
  emerald: 'pws-btn-emerald text-white',
};

const SIZE_CLASS: Record<PremiumButtonSize, string> = {
  xs: 'px-3 py-1.5 text-xs rounded-md gap-1.5',
  sm: 'px-3.5 py-2 text-xs rounded-md gap-1.5',
  md: 'px-5 py-3 text-sm rounded-lg gap-2',
  lg: 'px-6 py-3.5 text-sm rounded-lg gap-2',
};

export const PremiumButton: React.FC<PremiumButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  className = '',
  children,
  ...rest
}) => {
  const isDisabled = Boolean(('disabled' in rest && rest.disabled) || loading);
  const sharedClasses = [
    'inline-flex items-center justify-center font-bold cursor-pointer select-none',
    VARIANT_CLASS[variant],
    SIZE_CLASS[size],
    fullWidth ? 'w-full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const content = (
    <>
      {loading && <span className="pws-spinner" aria-hidden="true" />}
      {children}
    </>
  );

  if ('href' in rest && typeof rest.href === 'string') {
    const { href, onClick, ...anchorProps } = rest;
    return (
      <a
        href={isDisabled ? undefined : href}
        aria-disabled={isDisabled || undefined}
        onClick={(e) => {
          if (isDisabled) {
            e.preventDefault();
            return;
          }
          onClick?.(e);
        }}
        className={sharedClasses}
        {...anchorProps}
      >
        {content}
      </a>
    );
  }

  const buttonProps = rest as React.ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button
      type={buttonProps.type ?? 'button'}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={sharedClasses}
      {...buttonProps}
    >
      {content}
    </button>
  );
};
