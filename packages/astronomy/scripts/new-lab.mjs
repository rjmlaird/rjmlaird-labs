#!/usr/bin/env node
// Usage: npm run new-lab -- <slug> "<Title>" <category>
import fs from 'node:fs';
const [slug, title, category = 'orbits'] = process.argv.slice(2);
if (!slug || !title) { console.error('Usage: npm run new-lab -- <slug> "<Title>" <category>'); process.exit(1); }
const dir = `public/demos/${slug}`;
if (fs.existsSync(dir)) { console.error(`${dir} already exists`); process.exit(1); }
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(`${dir}/index.html`, `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title></head><body><h1>${title}</h1></body></html>\n`);
fs.writeFileSync(`src/content/labs/${slug}.md`, `---\ntitle: "${title}"\nsummary: "TODO one-sentence summary."\ncategory: ${category}\ntags: []\norder: 100\nstatus: beta\nadded: ${new Date().toISOString().slice(0, 10)}\n---\nTODO short description.\n`);
console.log(`Created ${dir}/index.html and src/content/labs/${slug}.md`);
