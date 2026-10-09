import { describe, it, expect } from 'vitest';
import { computeOptics, evaluateFit, fovFromWidthAtDistance, convertAngle, formatAngle } from './calc';

describe('telescope optics', () => {
  const base = { type: 'reflector' as const, apertureMm: 200, focalLengthMm: 1200, eyepieceFocalLengthMm: 25 };

  it('magnification = focal length / eyepiece', () => {
    expect(computeOptics(base).magnification).toBeCloseTo(48, 5);
  });

  it('1.5× Barlow increases effective focal length and magnification', () => {
    const r = computeOptics({ ...base, focalFactor: 1.5 });
    expect(r.effectiveFocalLengthMm).toBeCloseTo(1800, 5);
    expect(r.magnification).toBeCloseTo(72, 5);
  });

  it('0.63× reducer decreases effective focal length and focal ratio', () => {
    const r = computeOptics({ ...base, focalFactor: 0.63 });
    expect(r.effectiveFocalLengthMm).toBeCloseTo(756, 5);
    expect(r.focalRatio).toBeCloseTo(3.78, 2);
  });

  it('exit pupil = aperture / magnification', () => {
    expect(computeOptics(base).exitPupilMm).toBeCloseTo(200 / 48, 5);
  });

  it('apparent-field method: AFOV / magnification', () => {
    const r = computeOptics({ ...base, focalLengthMm: 1000, eyepieceAfovDeg: 52 });
    expect(r.trueFieldDeg).toBeCloseTo(1.3, 5);
    expect(r.method).toBe('apparent-field');
    expect(r.approximate).toBe(true);
  });

  it('field-stop method is preferred when supplied', () => {
    const r = computeOptics({ ...base, focalLengthMm: 1000, eyepieceAfovDeg: 52, fieldStopMm: 27 });
    expect(r.trueFieldDeg).toBeCloseTo(1.547, 2);
    expect(r.method).toBe('field-stop');
  });

  it('warns on zero eyepiece focal length', () => {
    const r = computeOptics({ ...base, eyepieceFocalLengthMm: 0 });
    expect(r.magnification).toBeUndefined();
    expect(r.warnings.join(' ')).toMatch(/positive/);
  });

  it('warns when incomplete', () => {
    const r = computeOptics({ type: 'refractor', apertureMm: 80, focalLengthMm: 400 });
    expect(r.trueFieldDeg).toBeUndefined();
    expect(r.warnings.length).toBeGreaterThan(0);
  });

  it('warns on implausible field stop and tiny exit pupil', () => {
    const r = computeOptics({ ...base, eyepieceFocalLengthMm: 2, fieldStopMm: 60 });
    const text = r.warnings.join(' ');
    expect(text).toMatch(/46 mm/);
    expect(text).toMatch(/Exit pupil is very small/);
  });
});

describe('binoculars', () => {
  it('exit pupil of 10×50 is 5 mm', () => {
    const r = computeOptics({ type: 'binoculars', binocularMagnification: 10, binocularObjectiveMm: 50, trueFieldDeg: 6.5 });
    expect(r.exitPupilMm).toBeCloseTo(5, 5);
    expect(r.trueFieldDeg).toBe(6.5);
    expect(r.approximate).toBe(false);
  });

  it('converts metres at 1000 m to degrees', () => {
    expect(fovFromWidthAtDistance(105, 1000)).toBeCloseTo(6.01, 2);
    const r = computeOptics({ type: 'binoculars', binocularMagnification: 8, binocularObjectiveMm: 42, fovMetresAt1000m: 105 });
    expect(r.trueFieldDeg).toBeCloseTo(6.01, 2);
  });

  it('derives true field from apparent field (approximate)', () => {
    const r = computeOptics({ type: 'binoculars', binocularMagnification: 10, binocularObjectiveMm: 50, binocularAfovDeg: 65 });
    expect(r.trueFieldDeg).toBeCloseTo(6.5, 5);
    expect(r.approximate).toBe(true);
  });

  it('explains that magnification and objective alone are not enough', () => {
    const r = computeOptics({ type: 'binoculars', binocularMagnification: 10, binocularObjectiveMm: 50 });
    expect(r.trueFieldDeg).toBeUndefined();
    expect(r.warnings.join(' ')).toMatch(/objective diameter/);
  });
});

describe('camera', () => {
  it('sensor diagonal over effective focal length', () => {
    const r = computeOptics({ type: 'camera', apertureMm: 80, focalLengthMm: 480, focalFactor: 0.8, fieldStopMm: 28.4 });
    expect(r.effectiveFocalLengthMm).toBeCloseTo(384, 5);
    expect(r.trueFieldDeg).toBeCloseTo(4.24, 2);
  });
});

describe('fit and units', () => {
  it('computes percentage of field and fit', () => {
    const f = evaluateFit(31, 1.3);
    expect(f.percent).toBeCloseTo(39.74, 1);
    expect(f.fits).toBe(true);
  });

  it('flags objects larger than the field', () => {
    const f = evaluateFit(190, 1.3);
    expect(f.fits).toBe(false);
    expect(f.percent).toBeGreaterThan(100);
  });

  it('converts units', () => {
    expect(convertAngle(1, 'arcmin')).toBe(60);
    expect(convertAngle(1, 'arcsec')).toBe(3600);
    expect(formatAngle(1.5, 'arcmin')).toBe('90′');
  });
});
