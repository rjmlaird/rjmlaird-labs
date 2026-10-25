import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const DATA_DIR = new URL('../public/data/', import.meta.url);

const locations = JSON.parse(
  await readFile(new URL('locations.json', DATA_DIR), 'utf8')
);

if (!Array.isArray(locations) || locations.length === 0) {
  throw new Error('locations.json contains no locations.');
}

for (const location of locations) {
  const file = new URL(`${location.id}.json`, DATA_DIR);
  const data = JSON.parse(await readFile(file, 'utf8'));

  if (data.schema !== 2) throw new Error(`${location.id}: unsupported schema.`);
  if (!data.observations?.length) throw new Error(`${location.id}: no observations.`);
  if (!data.projections?.rows?.length) throw new Error(`${location.id}: no projections.`);
  if (!data.location?.name) throw new Error(`${location.id}: missing location metadata.`);
}

console.log(`Validated ${locations.length} location dataset(s).`);
