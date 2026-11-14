import React, { useState, useEffect } from 'react';
import { OPTIMIZED_ASSETS, type AssetKey } from '../../data/content';
import { useLanguage } from '../../context/LanguageContext';

interface OptimizedImageProps {
  assetKey: AssetKey;
  /** Optional custom image override (e.g., admin-provided external screenshot URL) */
  customSrc?: string;
  /** Primary / English alt text (falls back to OPTIMIZED_ASSETS[assetKey].altEn) */
  alt?: string;
  /** Optional Hindi alt text (falls back to OPTIMIZED_ASSETS[assetKey].altHi) */
  altHi?: string;
  width?: number;
  height?: number;
  /** Explicit loading behavior override; defaults to eager when priority=true, else lazy */
  loading?: 'eager' | 'lazy';
  sizes?: string;
  /** Set true only for above-the-fold LCP hero/banner images; defaults to false (lazy-loaded) */
  priority?: boolean;
  className?: string;
  referrerPolicy?: React.HTMLAttributeReferrerPolicy;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  assetKey,
  customSrc,
  alt,
  altHi,
  width,
  height,
  loading,
  sizes,
  priority = false,
  className,
  referrerPolicy = 'no-referrer',
}) => {
  const { language } = useLanguage();
  const meta = OPTIMIZED_ASSETS[assetKey];
  const resolvedWidth = width ?? meta.width;
  const resolvedHeight = height ?? meta.height;
  const resolvedLoading = loading ?? (priority ? 'eager' : 'lazy');
  const resolvedDecoding = priority ? 'sync' : 'async';

  const resolvedAlt =
    language === 'hi'
      ? altHi || alt || meta.altHi
      : alt || meta.altEn;

  const [customLoadFailed, setCustomLoadFailed] = useState(false);

  useEffect(() => {
    setCustomLoadFailed(false);
  }, [customSrc]);

  const isCustomOverride =
    !customLoadFailed &&
    Boolean(customSrc) &&
    customSrc !== meta.webp &&
    customSrc !== meta.jpg &&
    !customSrc!.startsWith('/src/assets/');

  if (isCustomOverride && customSrc) {
    return (
      <img
        src={customSrc}
        alt={resolvedAlt}
        width={resolvedWidth}
        height={resolvedHeight}
        loading={resolvedLoading}
        decoding={resolvedDecoding}
        fetchPriority={priority ? 'high' : undefined}
        sizes={sizes}
        className={className}
        referrerPolicy={referrerPolicy}
        onError={() => setCustomLoadFailed(true)}
      />
    );
  }

  return (
    <picture className="contents">
      {meta.webp !== meta.jpg && (
        <source srcSet={meta.webp} type="image/webp" sizes={sizes} />
      )}
      <img
        src={meta.jpg}
        alt={resolvedAlt}
        width={resolvedWidth}
        height={resolvedHeight}
        loading={resolvedLoading}
        decoding={resolvedDecoding}
        fetchPriority={priority ? 'high' : undefined}
        sizes={sizes}
        className={className}
        referrerPolicy={referrerPolicy}
      />
    </picture>
  );
};
