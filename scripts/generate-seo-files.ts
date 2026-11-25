import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  DEFAULT_SITEMAP_APP_IDS,
  buildRobotsTxt,
  buildSitemapXml,
  resolveCanonicalSiteOrigin,
} from '../src/config/siteConfig.ts';
import { DEMO_SITES } from '../src/data/demoSites.ts';
import { BLOG_POSTS } from '../src/data/blogData.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const publicDir = path.resolve(rootDir, 'public');

const siteUrl = resolveCanonicalSiteOrigin(process.env.SITE_URL);
const lastMod = new Date().toISOString().split('T')[0];

const robotsTxt = buildRobotsTxt(siteUrl);
const sitemapXml = buildSitemapXml({
  siteUrl,
  lastMod,
  appIds: DEFAULT_SITEMAP_APP_IDS,
  blogPostIds: BLOG_POSTS.map((post) => post.id),
  demoSlugs: DEMO_SITES.map((demo) => demo.slug),
});

fs.mkdirSync(publicDir, { recursive: true });
fs.writeFileSync(path.join(publicDir, 'robots.txt'), robotsTxt, 'utf8');
fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemapXml, 'utf8');

console.log(
  `[SEO] Generated public/robots.txt and public/sitemap.xml for ${siteUrl} (lastmod=${lastMod}, demos=${DEMO_SITES.length}, blogPosts=${BLOG_POSTS.length})`
);
