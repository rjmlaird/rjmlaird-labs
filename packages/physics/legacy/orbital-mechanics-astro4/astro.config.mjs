import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  site: 'https://labs.rjmlaird.co.uk',
  integrations: [tailwind({ applyBaseStyles: false })],
  output: 'static',
});
