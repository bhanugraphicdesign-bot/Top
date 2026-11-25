/**
 * Single source of truth for canonical site URL, sitemap generation,
 * robots.txt generation, and Organization / LocalBusiness structured data.
 */

export const CANONICAL_SITE_URL =
  'https://power-web-studio-ai-enterprise-digital-platform.ai.studio';

export const PLACEHOLDER_SITE_URL = 'https://YOUR-DOMAIN.com';
export const SITE_NAME = 'POWER WEB STUDIO AI';
export const DEFAULT_OG_IMAGE_PATH = '/og-image.jpg';

export interface SitemapStaticRoute {
  path: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: string;
}

export const PUBLIC_SITEMAP_ROUTES: readonly SitemapStaticRoute[] = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/services', changefreq: 'weekly', priority: '0.9' },
  { path: '/ai-solutions', changefreq: 'weekly', priority: '0.9' },
  { path: '/android-portfolio', changefreq: 'weekly', priority: '0.9' },
  { path: '/process', changefreq: 'monthly', priority: '0.8' },
  { path: '/about', changefreq: 'monthly', priority: '0.8' },
  { path: '/contact', changefreq: 'monthly', priority: '0.8' },
  { path: '/blog', changefreq: 'weekly', priority: '0.8' },
  { path: '/privacy', changefreq: 'yearly', priority: '0.5' },
  { path: '/terms', changefreq: 'yearly', priority: '0.5' },
];

export const DEFAULT_SITEMAP_APP_IDS: readonly string[] = [
  'bariha-pay',
  'vidyasetu-lms',
  'taskmatrix-pro',
  'networkpulse-diagnostic',
  'bharatbazaar-omnichannel',
  'trackcore-logistics',
  'docusense-vision-ai',
  'retailflow-pos',
];

export const EXCLUDED_SITEMAP_PREFIXES: readonly string[] = [
  '/admin',
  '/admin-dashboard',
  '/client-dashboard',
  '/pay',
  '/api',
];

export const BUSINESS_SCHEMA_INFO = {
  name: 'BHANU RAM BARIHA DIGITAL TECHNOLOGIES',
  alternateName: SITE_NAME,
  email: 'powerusertopuser@gmail.com',
  telephone: '+91 8305457717',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Fingeshwar Borid Mod, Rajim Subdistrict',
    addressLocality: 'Gariaband District',
    addressRegion: 'Chhattisgarh',
    postalCode: '493992',
    addressCountry: 'IN',
  },
} as const;

function isDisallowedCanonicalHost(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  return (
    lower === 'your-domain.com' ||
    lower === 'localhost' ||
    lower === '127.0.0.1' ||
    lower === '0.0.0.0' ||
    lower.endsWith('.run.app')
  );
}

/**
 * Resolves the canonical public origin for SEO tags, robots.txt, and sitemap.xml.
 * Always rejects placeholder domains, localhost, and temporary *.run.app preview hosts.
 */
export function resolveCanonicalSiteOrigin(candidate?: string): string {
  const cleaned = (candidate || '').trim().replace(/\/+$/, '');
  if (/^https?:\/\//i.test(cleaned)) {
    try {
      const parsed = new URL(cleaned);
      if (!isDisallowedCanonicalHost(parsed.hostname)) {
        return `${parsed.protocol}//${parsed.host}`;
      }
    } catch {
      // Fall back to canonical config URL
    }
  }
  return CANONICAL_SITE_URL;
}

export function isExcludedFromSitemap(pathname: string): boolean {
  const normalized = pathname.trim().toLowerCase();
  return EXCLUDED_SITEMAP_PREFIXES.some(
    (prefix) =>
      normalized === prefix ||
      normalized.startsWith(`${prefix}/`) ||
      normalized.startsWith(`${prefix}?`)
  );
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function buildRobotsTxt(siteUrl?: string): string {
  const baseUrl = resolveCanonicalSiteOrigin(siteUrl);
  return [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /admin-dashboard',
    'Disallow: /client-dashboard',
    'Disallow: /pay',
    'Disallow: /api/',
    '',
    `Sitemap: ${baseUrl}/sitemap.xml`,
    '',
  ].join('\n');
}

export interface BuildSitemapOptions {
  siteUrl?: string;
  lastMod?: string;
  appIds?: readonly string[];
  blogPostIds?: readonly string[];
  demoSlugs?: readonly string[];
}

export function buildSitemapXml(options: BuildSitemapOptions = {}): string {
  const baseUrl = resolveCanonicalSiteOrigin(options.siteUrl);
  const lastMod = options.lastMod || new Date().toISOString().split('T')[0];

  const entries: SitemapStaticRoute[] = [...PUBLIC_SITEMAP_ROUTES];

  for (const appId of options.appIds || []) {
    const cleanId = appId.trim();
    if (!cleanId) continue;
    entries.push({
      path: `/apps/${encodeURIComponent(cleanId)}`,
      changefreq: 'monthly',
      priority: '0.8',
    });
  }

  for (const postId of options.blogPostIds || []) {
    const cleanId = postId.trim();
    if (!cleanId) continue;
    entries.push({
      path: `/blog?post=${encodeURIComponent(cleanId)}`,
      changefreq: 'monthly',
      priority: '0.7',
    });
  }

  for (const slug of options.demoSlugs || []) {
    const cleanSlug = slug.trim().toLowerCase();
    if (!cleanSlug) continue;
    entries.push({
      path: `/demo/${encodeURIComponent(cleanSlug)}`,
      changefreq: 'monthly',
      priority: '0.8',
    });
  }

  const seenPaths = new Set<string>();
  const urlNodes: string[] = [];

  for (const entry of entries) {
    const normalizedPath = entry.path.startsWith('/') ? entry.path : `/${entry.path}`;
    if (isExcludedFromSitemap(normalizedPath) || seenPaths.has(normalizedPath)) {
      continue;
    }
    seenPaths.add(normalizedPath);
    const fullUrl = normalizedPath === '/' ? `${baseUrl}/` : `${baseUrl}${normalizedPath}`;
    urlNodes.push(
      [
        '  <url>',
        `    <loc>${escapeXml(fullUrl)}</loc>`,
        `    <lastmod>${escapeXml(lastMod)}</lastmod>`,
        `    <changefreq>${entry.changefreq}</changefreq>`,
        `    <priority>${entry.priority}</priority>`,
        '  </url>',
      ].join('\n')
    );
  }

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urlNodes,
    '</urlset>',
    '',
  ].join('\n');
}

export function buildOrganizationBusinessSchema(
  origin: string,
  includeLocalBusiness: boolean
): Record<string, unknown> {
  const baseUrl = resolveCanonicalSiteOrigin(origin);
  return {
    '@type': includeLocalBusiness ? ['Organization', 'LocalBusiness'] : 'Organization',
    name: BUSINESS_SCHEMA_INFO.name,
    alternateName: BUSINESS_SCHEMA_INFO.alternateName,
    url: `${baseUrl}/`,
    logo: `${baseUrl}/apple-touch-icon.png`,
    image: `${baseUrl}${DEFAULT_OG_IMAGE_PATH}`,
    email: BUSINESS_SCHEMA_INFO.email,
    telephone: BUSINESS_SCHEMA_INFO.telephone,
    address: { ...BUSINESS_SCHEMA_INFO.address },
  };
}
