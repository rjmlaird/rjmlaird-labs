import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { categoryIds } from './data/categories';

const labs = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/labs' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    category: z.enum(categoryIds),
    tags: z.array(z.string()).default([]),
    order: z.number().default(100),
    status: z.enum(['live', 'beta', 'planned']).default('live'),
    added: z.coerce.date(),
    // 'iframe' = self-contained demo in public/demos/<slug>/index.html
    // 'native' = demo rebuilt as an Astro component (future)
    kind: z.enum(['iframe']).default('iframe'),
  }),
});

export const collections = { labs };
