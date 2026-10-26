import { defineConfig } from 'astro/config';
export default defineConfig({ site: 'https://labs.rjmlaird.co.uk', output: 'static', trailingSlash: 'never', build: { format: 'file' } });
