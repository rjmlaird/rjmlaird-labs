import { getCollection } from 'astro:content';
import { categories } from '../data/categories';
export async function GET({ site }: { site: URL }) {
  const labs = (await getCollection('labs')).filter((l) => l.data.status !== 'planned');
  const urls = ['/', ...categories.map((c) => `/c/${c.id}/`), ...labs.map((l) => `/labs/${l.id}/`)];
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `  <url><loc>${new URL(u, site).href}</loc></url>`)
    .join('\n')}\n</urlset>\n`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml' } });
}
