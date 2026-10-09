import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://astronomy.labs.rjmlaird.co.uk',
  trailingSlash: 'always',
  build: { format: 'directory' },
});
