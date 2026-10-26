import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
const pages = ['index', 'labs', 'labs/earthquakes', 'about', 'contact', 'privacy', '404'];
describe('built-page accessibility smoke test (run `npm run test:a11y`)', () => {
  for (const p of pages) {
    it(`${p}: lang, title, one h1, main landmark, skip link, img alts`, () => {
      const f = `dist/${p}.html`;
      expect(existsSync(f), `${f} missing – build first`).toBe(true);
      const h = readFileSync(f, 'utf8');
      expect(h).toMatch(/<html[^>]+lang="en-GB"/);
      expect(h).toMatch(/<title>[^<]{10,}<\/title>/);
      expect((h.match(/<h1[\s>]/g) ?? []).length).toBe(1);
      expect(h).toMatch(/<main[\s>]/);
      expect(h).toContain('class="skip"');
      expect(h).not.toMatch(/<img(?![^>]*\balt=)[^>]*>/);
    });
  }
  it('lab page: tabs, labelled inputs, reduced-motion CSS rule', () => {
    const h = readFileSync('dist/labs/earthquakes.html', 'utf8');
    expect(h).toContain('role="tablist"');
    for (const m of h.matchAll(/<input[^>]*\bid="([^"]+)"/g))
      expect(h, `input #${m[1]} lacks a label`).toMatch(new RegExp(`for="${m[1]}"`));
    expect(readFileSync('src/styles/global.css', 'utf8')).toContain('prefers-reduced-motion');
  });
});
