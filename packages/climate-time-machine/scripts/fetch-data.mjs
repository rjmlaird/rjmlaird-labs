#!/usr/bin/env node
/**
 * Builds deployable climate datasets in public/data/.
 *
 * Observations:
 *   Met Office UK regional climate series (HadUK-Grid derived),
 *   Open Government Licence v3.0.
 *
 * Projections:
 *   Open-Meteo Climate API, downscaled CMIP6 HighResMIP models,
 *   CC BY 4.0.
 *
 * Usage:
 *   npm run data:build
 *   npm run data:resume
 *   npm run data:midlands
 *
 *   node scripts/fetch-data.mjs
 *   node scripts/fetch-data.mjs --if-missing
 *   node scripts/fetch-data.mjs --location=midlands
 *   node scripts/fetch-data.mjs --location=midlands --refresh-projections
 */

import { mkdir, writeFile, readFile, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseSeries, metOfficeUrl } from './lib/metoffice.mjs';
import {
  buildObservations,
  periodMeans,
  referenceStats,
  summariseModels,
  adjustModels,
} from './lib/build.mjs';

const SCHEMA = 2;
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public', 'data');
const CACHE = join(ROOT, 'data', 'cache', 'open-meteo');

const PROJECTION_START = '1991-01-01';
const PROJECTION_END = '2050-12-31';
const REQUEST_TIMEOUT_MS = 120_000;
const MAX_RETRIES = 4;
const BETWEEN_LOCATIONS_MS = 90_000;

const MODELS = [
  'MRI_AGCM3_2_S',
  'EC_Earth3P_HR',
  'NICAM16_8S',
  'CMCC_CM2_VHR4',
  'FGOALS_f3_H',
  'HiRAM_SIT_HR',
  'MPI_ESM1_2_XR',
];

// `region` is the Met Office file name. lat/lon is the point sampled by models.
const LOCATIONS = [
  {
    id: 'midlands',
    name: 'Midlands',
    region: 'Midlands',
    lat: 52.6,
    lon: -1.5,
    note: 'Met Office “Midlands” region. This is the closest published series to Leicestershire; county-level series are not published in this format.',
  },
  {
    id: 'east-anglia',
    name: 'East Anglia',
    region: 'East_Anglia',
    lat: 52.5,
    lon: 0.9,
    note: 'Met Office “East Anglia” region.',
  },
  {
    id: 'england-e-ne',
    name: 'Eastern and north-eastern England',
    region: 'England_E_and_NE',
    lat: 53.9,
    lon: -1.0,
    note: 'Met Office “England E & NE” region.',
  },
  {
    id: 'england-se',
    name: 'South-east and central southern England',
    region: 'England_SE_and_Central_S',
    lat: 51.4,
    lon: -0.9,
    note: 'Met Office “England SE & Central S” region.',
  },
  {
    id: 'england-sw',
    name: 'South-west England and south Wales',
    region: 'England_SW_and_S_Wales',
    lat: 51.0,
    lon: -3.2,
    note: 'Met Office “England SW & Wales S” region.',
  },
  {
    id: 'england-nw',
    name: 'North-west England and north Wales',
    region: 'England_NW_and_N_Wales',
    lat: 53.6,
    lon: -2.7,
    note: 'Met Office “England NW & Wales N” region.',
  },
  {
    id: 'england',
    name: 'England',
    region: 'England',
    lat: 52.5,
    lon: -1.5,
    note: 'Met Office England series.',
  },
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

async function writeJson(path, value) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value)}\n`);
}

async function isCurrent(path) {
  try {
    const data = await readJson(path);
    return data.schema === SCHEMA
      && Array.isArray(data.observations)
      && data.observations.length > 0
      && Array.isArray(data.projections?.rows)
      && data.projections.rows.length > 0;
  } catch {
    return false;
  }
}

function parseArguments(args) {
  const locationArg = args.find((arg) => arg.startsWith('--location='));
  const locationId = locationArg?.slice('--location='.length);

  return {
    resume: args.includes('--if-missing'),
    refreshProjections: args.includes('--refresh-projections'),
    locationId,
  };
}

function selectLocations(locationId) {
  if (!locationId) return LOCATIONS;

  const location = LOCATIONS.find((item) => item.id === locationId);

  if (!location) {
    const validIds = LOCATIONS.map((item) => item.id).join(', ');
    throw new Error(`Unknown location "${locationId}". Valid IDs: ${validIds}`);
  }

  return [location];
}

async function fetchWithTimeout(url, options = {}, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'User-Agent': 'climate-time-machine/0.1 (static educational climate lab)',
        ...options.headers,
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function getText(url) {
  const response = await fetchWithTimeout(url);

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText} for ${url}`);
  }

  return response.text();
}

// Extra series are optional: missing values do not stop a location build.
async function getOptional(variable, region) {
  try {
    return parseSeries(await getText(metOfficeUrl(variable, region)));
  } catch (error) {
    console.warn(`  no ${variable} series (${error.message.slice(0, 100)})`);
    return new Map();
  }
}

function modelUrl(location) {
  const params = new URLSearchParams({
    latitude: String(location.lat),
    longitude: String(location.lon),
    start_date: PROJECTION_START,
    end_date: PROJECTION_END,
    models: MODELS.join(','),
    daily: 'temperature_2m_mean,precipitation_sum',
  });

  return `https://climate-api.open-meteo.com/v1/climate?${params}`;
}

function cachePath(location) {
  return join(CACHE, `${location.id}.json`);
}

async function getModelsFromApi(location) {
  const url = modelUrl(location);

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    const response = await fetchWithTimeout(url);

    if (response.ok) {
      const payload = await response.json();

      if (!payload.daily?.time?.length) {
        throw new Error('Open-Meteo returned no daily climate data.');
      }

      return summariseModels(payload.daily);
    }

    const body = await response.text();

    if (response.status !== 429 || attempt === MAX_RETRIES) {
      throw new Error(`${response.status} ${body.slice(0, 300)}`);
    }

    const retryAfterSeconds = Number(response.headers.get('retry-after'));
    const backoffMs = Math.min(15 * 60_000, 60_000 * (2 ** (attempt - 1)));
    const waitMs = Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
      ? retryAfterSeconds * 1_000
      : backoffMs + Math.round(Math.random() * 15_000);

    console.log(
      `  rate limited; retrying in ${Math.ceil(waitMs / 1_000)}s `
      + `(attempt ${attempt}/${MAX_RETRIES})...`,
    );

    await sleep(waitMs);
  }

  throw new Error('Open-Meteo retry loop ended unexpectedly.');
}

async function getModels(location, { refreshProjections }) {
  const path = cachePath(location);

  if (!refreshProjections && await exists(path)) {
    const cached = await readJson(path);

    if (
      cached.models
      && Array.isArray(cached.models)
      && cached.models.length > 0
      && cached.retrieved
    ) {
      console.log(`  projections: using cached response (${cached.retrieved})`);
      return cached.models;
    }
  }

  const models = await getModelsFromApi(location);

  await writeJson(path, {
    source: 'Open-Meteo Climate API',
    retrieved: new Date().toISOString(),
    request: {
      latitude: location.lat,
      longitude: location.lon,
      startDate: PROJECTION_START,
      endDate: PROJECTION_END,
      variables: ['temperature_2m_mean', 'precipitation_sum'],
      models: MODELS,
    },
    models,
  });

  return models;
}

async function buildLocation(location, options) {
  const outputPath = join(OUT, `${location.id}.json`);

  if (options.resume && await isCurrent(outputPath)) {
    console.log(`${location.name}: already built`);
    return { id: location.id, name: location.name };
  }

  console.log(`\n${location.name}`);

  const [tmean, rain, tmax, tmin, frost] = await Promise.all([
    getText(metOfficeUrl('Tmean', location.region)).then(parseSeries),
    getText(metOfficeUrl('Rainfall', location.region)).then(parseSeries),
    getOptional('Tmax', location.region),
    getOptional('Tmin', location.region),
    getOptional('AirFrost', location.region),
  ]);

  const observations = buildObservations({ tmean, rain, tmax, tmin, frost });
  const withTemperature = observations.filter((row) => row.temp != null);

  if (!withTemperature.length) {
    throw new Error('No usable temperature observations.');
  }

  const lastObsYear = withTemperature.at(-1).year;
  const base91 = periodMeans(observations, 1991, 2020);

  console.log(`  observations ${withTemperature[0].year}-${lastObsYear}`);

  const models = await getModels(location, options);
  const { cols, rows } = adjustModels(models, base91, lastObsYear);

  if (!rows.length) {
    throw new Error('No usable projection rows after model adjustment.');
  }

  console.log(
    `  projections: ${Object.keys(models).length} models, ${rows.length} model-years`,
  );

  await writeJson(outputPath, {
    schema: SCHEMA,
    generated: new Date().toISOString().slice(0, 10),
    location: {
      id: location.id,
      name: location.name,
      note: location.note,
      lat: location.lat,
      lon: location.lon,
    },
    ref: referenceStats(observations),
    lastObsYear,
    observations,
    projections: {
      source: 'Open-Meteo Climate API / CMIP6 HighResMIP',
      baseline: '1991-2020',
      models: Object.keys(models),
      cols,
      rows,
    },
  });

  return { id: location.id, name: location.name };
}

async function discoverBuiltLocations() {
  const locations = [];

  for (const location of LOCATIONS) {
    const path = join(OUT, `${location.id}.json`);

    if (await isCurrent(path)) {
      locations.push({ id: location.id, name: location.name });
    }
  }

  return locations;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const targets = selectLocations(options.locationId);

  await mkdir(OUT, { recursive: true });
  await mkdir(CACHE, { recursive: true });

  console.log(
    `Building ${targets.length} location(s)`
    + `${options.resume ? ' (missing data only)' : ''}`
    + `${options.refreshProjections ? ' (refreshing projections)' : ''}.`,
  );

  let successful = 0;

  for (let index = 0; index < targets.length; index += 1) {
    const location = targets[index];

    try {
      await buildLocation(location, options);
      successful += 1;
    } catch (error) {
      console.warn(`  skipped ${location.name}: ${error.message}`);
    }

    const hasAnotherLocation = index < targets.length - 1;

    if (hasAnotherLocation) {
      console.log(`  waiting ${Math.round(BETWEEN_LOCATIONS_MS / 1_000)}s before the next location...`);
      await sleep(BETWEEN_LOCATIONS_MS);
    }
  }

  const builtLocations = await discoverBuiltLocations();
  await writeJson(join(OUT, 'locations.json'), builtLocations);

  if (!builtLocations.length) {
    throw new Error(
      'No usable location datasets are available. Check the network or retry later.',
    );
  }

  console.log(
    `\nBuilt ${successful}/${targets.length} requested location(s). `
    + `${builtLocations.length} location(s) available in public/data/.`,
  );
}

main().catch((error) => {
  console.error(`\nData build failed: ${error.message}`);
  process.exitCode = 1;
});
