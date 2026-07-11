import { defineCollection, z } from 'astro:content';

export const boundsSchema = z.object({
  southWest: z.tuple([z.number(), z.number()]),
  northEast: z.tuple([z.number(), z.number()])
});

export const renderingSchema = z
  .object({
    colormapName: z.string().optional(),
    colorFormula: z.string().optional(),
    rescale: z.tuple([z.number(), z.number()]).optional(),
    bidx: z.number().int().positive().optional()
  })
  .optional();

export const caseSchema = z.object({
  slug: z.string(),
  title: z.string(),
  region: z.string(),
  beforeDate: z.string(),
  afterDate: z.string(),
  sensor: z.string(),
  burnMetric: z.string(),
  severity: z.string(),
  areaAffected: z.string(),
  notes: z.string(),
  beforeCogUrl: z.string().url(),
  afterCogUrl: z.string().url(),
  beforeBounds: boundsSchema,
  afterBounds: boundsSchema,
  rasterCrs: z.enum(['EPSG:4326', 'EPSG:3857']).default('EPSG:4326'),
  rendering: renderingSchema
});

const cases = defineCollection({
  type: 'data',
  schema: caseSchema
});

export const collections = { cases };
