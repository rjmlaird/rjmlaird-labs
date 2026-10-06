import test from 'node:test';
import assert from 'node:assert/strict';

const SATCAT = [
  'OBJECT_NAME,OBJECT_ID,NORAD_CAT_ID,OBJECT_TYPE,OPS_STATUS_CODE,OWNER,LAUNCH_DATE,LAUNCH_SITE,DECAY_DATE,PERIOD,INCLINATION,APOGEE,PERIGEE,RCS,DATA_STATUS_CODE,ORBIT_CENTER,ORBIT_TYPE',
  'ISS (ZARYA),1998-067A,25544,PAY,+,ISS,1998-11-20,TTMTR,,92.9,51.6,420,418,399.05,,EA,ORB',
  '"FOO, BAR",2020-001A,99001,PAY,+,US,2020-01-02,AFETR,,95,53,550,540,,,EA,ORB',
  'SL-8 R/B,1970-001B,99002,R/B,,CIS,1970-02-02,PKMTR,,100,82,900,800,,,EA,ORB',
  'DEB,1999-025A,99003,DEB,,PRC,1999-05-05,TAIYU,,100,98,900,800,,,EA,ORB',
].join('\n');

const tle = (name, id) =>
  `${name}\n1 ${String(id).padStart(5, '0')}U 98067A   26280.00000000  .00000000  00000-0  00000-0 0  9990\n2 ${String(id).padStart(5, '0')}  51.6000   0.0000 0001000   0.0000   0.0000 15.50000000    10\n`;

let calls = [];
globalThis.fetch = async (url) => {
  calls.push(String(url));
  const u = String(url);
  if (u.includes('satcat.csv')) return new Response(SATCAT);
  if (u.includes('GROUP=stations')) return new Response(tle('ISS', 25544) + tle('FOO', 99001) + tle('GHOST', 12345));
  if (u.includes('GROUP=weather')) return new Response('No GP data found');
  return new Response('nope', { status: 500 });
};

const gp = await import('../api/gp.js');
const satcat = await import('../api/satcat.js');
const req = (path) => new Request('https://x.test' + path);

test('gp: returns TLE with long-lived cache headers', async () => {
  const r = await gp.GET(req('/api/gp?group=stations'));
  assert.equal(r.status, 200);
  assert.match(r.headers.get('cache-control'), /s-maxage=7200/);
  assert.match(r.headers.get('cache-control'), /stale-while-revalidate/);
  assert.match(await r.text(), /^ISS/);
});

test('gp: rejects unknown and missing groups, never calls upstream', async () => {
  calls = [];
  assert.equal((await gp.GET(req('/api/gp?group=../../etc'))).status, 400);
  assert.equal((await gp.GET(req('/api/gp'))).status, 400);
  assert.equal(calls.length, 0);
});

test('gp: empty upstream result is a 404 and not cached', async () => {
  const r = await gp.GET(req('/api/gp?group=weather'));
  assert.equal(r.status, 404);
  assert.equal(r.headers.get('cache-control'), 'no-store');
});

test('satcat: slices to group members, trims columns, keeps quoted cells', async () => {
  const r = await satcat.GET(req('/api/satcat?group=stations'));
  assert.equal(r.status, 200);
  const lines = (await r.text()).split('\n');
  assert.equal(lines.length, 3); // header + ISS + FOO (GHOST not in SATCAT)
  assert.ok(!lines[0].includes('DECAY_DATE'));
  assert.ok(!lines[0].includes('OBJECT_NAME'));
  assert.match(lines[0], /NORAD_CAT_ID/);
  assert.match(lines[1], /^1998-067A,25544,PAY/);
});

test('satcat: payloads scope has only PAY rows and 3 columns', async () => {
  const r = await satcat.GET(req('/api/satcat?scope=payloads'));
  const lines = (await r.text()).split('\n');
  assert.equal(lines[0], 'OBJECT_TYPE,OWNER,LAUNCH_DATE');
  assert.equal(lines.length, 3);
  assert.ok(lines.slice(1).every((l) => l.startsWith('PAY,')));
});

test('satcat: warm instance reuses the SATCAT download', async () => {
  calls = [];
  await satcat.GET(req('/api/satcat?group=stations'));
  await satcat.GET(req('/api/satcat?scope=payloads'));
  assert.equal(calls.filter((c) => c.includes('satcat.csv')).length, 0);
});
