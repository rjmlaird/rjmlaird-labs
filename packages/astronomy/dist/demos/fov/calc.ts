/**
 * Core field-of-view calculations. Pure functions, no DOM, no dependencies.
 *
 * Formulas (all documented where used):
 *   effective focal length  EFL = f × barlow/reducer factor × train factor
 *   magnification           M   = EFL / eyepiece focal length
 *   focal ratio             N   = EFL / aperture
 *   exit pupil              EP  = aperture / M   (binoculars: objective / M)
 *   true FOV (field stop)   ≈ 57.2958 × field stop / EFL          [preferred]
 *   true FOV (apparent)     ≈ apparent FOV / M                    [approximation]
 *   FOV from width at dist  = 2 × atan(width / (2 × distance))
 */

export const DEG_PER_RAD = 57.2958;

export type AngleUnit = 'deg' | 'arcmin' | 'arcsec';
export type InstrumentType =
  | 'naked-eye'
  | 'binoculars'
  | 'refractor'
  | 'reflector'
  | 'catadioptric'
  | 'finder'
  | 'camera';

export interface InstrumentConfig {
  type: InstrumentType;
  apertureMm?: number;
  focalLengthMm?: number;
  eyepieceFocalLengthMm?: number;
  eyepieceAfovDeg?: number;
  /** Eyepiece field-stop diameter. For `camera`, treated as sensor diagonal. */
  fieldStopMm?: number;
  binocularMagnification?: number;
  binocularObjectiveMm?: number;
  /** Manufacturer / measured true field (binoculars, naked eye). */
  trueFieldDeg?: number;
  /** Binocular apparent field, if the true field is not quoted. */
  binocularAfovDeg?: number;
  /** Binocular field quoted as width in metres at 1000 m. */
  fovMetresAt1000m?: number;
  /** Barlow (>1) or focal reducer (<1). Default 1. */
  focalFactor?: number;
  /** Any other optical-train multiplier (extender, flattener with ratio…). Default 1. */
  trainFactor?: number;
}

export type FovMethod =
  | 'field-stop'
  | 'apparent-field'
  | 'supplied-true-field'
  | 'metres-at-1000m'
  | 'binocular-apparent-field'
  | 'sensor-size'
  | 'none';

export const METHOD_LABEL: Record<FovMethod, string> = {
  'field-stop': 'Field-stop method (57.2958 × field stop ÷ effective focal length)',
  'apparent-field': 'Apparent-field method (apparent FOV ÷ magnification) — approximate',
  'supplied-true-field': 'Supplied true field of view',
  'metres-at-1000m': 'Converted from field width at 1000 m',
  'binocular-apparent-field': 'Apparent-field method (apparent FOV ÷ magnification) — approximate',
  'sensor-size': 'Sensor diagonal ÷ effective focal length',
  none: 'Not available',
};

export interface OpticsResult {
  magnification?: number;
  effectiveFocalLengthMm?: number;
  focalRatio?: number;
  exitPupilMm?: number;
  trueFieldDeg?: number;
  method: FovMethod;
  /** True unless the value is a direct conversion of a supplied quantity. */
  approximate: boolean;
  warnings: string[];
  notes: string[];
}

const pos = (v?: number): number | undefined =>
  typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : undefined;
const invalid = (v?: number) => v !== undefined && !(Number.isFinite(v) && v > 0);

export function fovFromWidthAtDistance(width: number, distance: number): number {
  return 2 * Math.atan(width / (2 * distance)) * (180 / Math.PI);
}

export function convertAngle(deg: number, unit: AngleUnit): number {
  return unit === 'deg' ? deg : unit === 'arcmin' ? deg * 60 : deg * 3600;
}

const SYMBOL: Record<AngleUnit, string> = { deg: '°', arcmin: '′', arcsec: '″' };

export function formatAngle(deg: number, unit: AngleUnit): string {
  const v = Number(convertAngle(deg, unit).toPrecision(3));
  return `${v.toLocaleString('en-GB')}${SYMBOL[unit]}`;
}

function pupilChecks(r: OpticsResult) {
  const ep = r.exitPupilMm;
  if (ep === undefined) return;
  if (ep < 0.5) r.warnings.push(`Exit pupil is very small (${ep.toFixed(2)} mm): the image will be dim and floaters in your eye become obvious.`);
  else if (ep > 7.5) r.warnings.push(`Exit pupil (${ep.toFixed(1)} mm) is larger than most eyes can use (about 5–7 mm); light is wasted.`);
}

export function computeOptics(c: InstrumentConfig): OpticsResult {
  const r: OpticsResult = { method: 'none', approximate: true, warnings: [], notes: [] };
  const w = r.warnings;
  const n = r.notes;

  const check = (label: string, v?: number) => {
    if (invalid(v)) w.push(`${label} must be a positive number (zero or negative values are impossible).`);
  };

  // ---- Naked eye ---------------------------------------------------------
  if (c.type === 'naked-eye') {
    check('True field', c.trueFieldDeg);
    r.magnification = 1;
    r.trueFieldDeg = pos(c.trueFieldDeg) ?? 100;
    r.method = 'supplied-true-field';
    n.push('The eye\u2019s usable field depends on the person and on how much you move your eyes; about 100° is a rough working figure.');
    return r;
  }

  // ---- Binoculars --------------------------------------------------------
  if (c.type === 'binoculars') {
    check('Magnification', c.binocularMagnification);
    check('Objective diameter', c.binocularObjectiveMm);
    const m = pos(c.binocularMagnification);
    const obj = pos(c.binocularObjectiveMm);
    r.magnification = m;
    if (m && obj) r.exitPupilMm = obj / m;
    if (m && m > 12) n.push('Above about 12× most people need a tripod or support for a steady image.');

    const tf = pos(c.trueFieldDeg);
    const metres = pos(c.fovMetresAt1000m);
    const afov = pos(c.binocularAfovDeg);
    if (tf) {
      r.trueFieldDeg = tf; r.method = 'supplied-true-field'; r.approximate = false;
    } else if (metres) {
      r.trueFieldDeg = fovFromWidthAtDistance(metres, 1000); r.method = 'metres-at-1000m'; r.approximate = false;
    } else if (afov && m) {
      r.trueFieldDeg = afov / m; r.method = 'binocular-apparent-field';
    } else {
      w.push(
        'True field of view cannot be worked out from magnification and objective diameter alone — the objective size does not set the field. ' +
          'Enter the manufacturer\u2019s true field (°), the field width at 1000 m, or the apparent field.'
      );
    }
    pupilChecks(r);
    return r;
  }

  // ---- Camera / imaging --------------------------------------------------
  if (c.type === 'camera') {
    check('Focal length', c.focalLengthMm);
    check('Sensor diagonal', c.fieldStopMm);
    check('Aperture', c.apertureMm);
    const fl = pos(c.focalLengthMm);
    const sensor = pos(c.fieldStopMm);
    const ap = pos(c.apertureMm);
    const factor = (pos(c.focalFactor) ?? 1) * (pos(c.trainFactor) ?? 1);
    if (fl) {
      r.effectiveFocalLengthMm = fl * factor;
      if (ap) r.focalRatio = r.effectiveFocalLengthMm / ap;
    }
    if (r.effectiveFocalLengthMm && sensor) {
      r.trueFieldDeg = (DEG_PER_RAD * sensor) / r.effectiveFocalLengthMm;
      r.method = 'sensor-size';
      n.push('Shown as the sensor\u2019s diagonal. The width and height of the frame are smaller, and the sensor is rectangular, not round.');
    } else {
      w.push('Enter the focal length and the sensor diagonal (mm) to see the imaging field.');
    }
    return r;
  }

  // ---- Visual telescopes (refractor, reflector, catadioptric, finder) ----
  check('Aperture', c.apertureMm);
  check('Telescope focal length', c.focalLengthMm);
  check('Eyepiece focal length', c.eyepieceFocalLengthMm);
  check('Eyepiece apparent field', c.eyepieceAfovDeg);
  check('Field-stop diameter', c.fieldStopMm);
  check('Barlow/reducer factor', c.focalFactor);
  check('Optical-train factor', c.trainFactor);

  const ap = pos(c.apertureMm);
  const fl = pos(c.focalLengthMm);
  const ep = pos(c.eyepieceFocalLengthMm);
  const afov = pos(c.eyepieceAfovDeg);
  const fs = pos(c.fieldStopMm);
  const factor = (pos(c.focalFactor) ?? 1) * (pos(c.trainFactor) ?? 1);

  if (fl) {
    r.effectiveFocalLengthMm = fl * factor;
    if (ap) r.focalRatio = r.effectiveFocalLengthMm / ap;
  } else if (!invalid(c.focalLengthMm)) {
    w.push('Telescope focal length is missing, so magnification and field cannot be calculated.');
  }

  if (r.effectiveFocalLengthMm && ep) {
    r.magnification = r.effectiveFocalLengthMm / ep;
    if (ap) r.exitPupilMm = ap / r.magnification;
    if (r.magnification < 1) w.push('Magnification below 1× is not meaningful for this configuration; check the focal lengths.');
    if (ap && r.magnification > 2 * ap) w.push(`Magnification (${r.magnification.toFixed(0)}×) exceeds the common rule of thumb of 2× aperture in mm (${2 * ap}×); the image is usually limited by seeing and optics.`);
  } else if (r.effectiveFocalLengthMm && !invalid(c.eyepieceFocalLengthMm)) {
    w.push('Eyepiece focal length is missing, so magnification and exit pupil cannot be calculated.');
  }

  if (fs && fs > 46) w.push(`A field stop of ${fs} mm exceeds the ~46 mm limit of 2-inch eyepieces; check the value.`);
  if (fs && !ap) n.push('Add the aperture to see exit pupil and focal ratio.');

  if (r.effectiveFocalLengthMm && fs) {
    r.trueFieldDeg = (DEG_PER_RAD * fs) / r.effectiveFocalLengthMm;
    r.method = 'field-stop';
    if (afov && r.magnification) {
      const alt = afov / r.magnification;
      if (Math.abs(alt - r.trueFieldDeg) / r.trueFieldDeg > 0.2) {
        n.push(`The apparent-field method would give about ${alt.toFixed(2)}°, which differs by more than 20% from the field-stop result. The field-stop value is used; check your inputs.`);
      }
    }
    if (fl && c.focalFactor && c.focalFactor !== 1) n.push('The field stop sets the true field in the eyepiece, so a Barlow or reducer is already included via the effective focal length.');
  } else if (r.magnification && afov) {
    r.trueFieldDeg = afov / r.magnification;
    r.method = 'apparent-field';
    n.push('The apparent-field method is an approximation: eyepiece distortion and the real field stop mean actual fields are often a little different.');
  } else if (r.effectiveFocalLengthMm) {
    w.push('Configuration incomplete: enter either the eyepiece field-stop diameter or the eyepiece focal length with its apparent field.');
  }

  pupilChecks(r);
  return r;
}

export interface FitResult {
  fits: boolean;
  /** Object major axis as % of field diameter. */
  percent: number;
  note: string;
}

export function evaluateFit(objectArcmin: number, fieldDeg: number): FitResult {
  const percent = (objectArcmin / 60 / fieldDeg) * 100;
  const fits = percent <= 100;
  let note: string;
  if (!fits) note = `The object is about ${(percent / 100).toFixed(1)}× wider than the field, so you would see only part of it.`;
  else if (percent >= 70) note = 'It fits, but tightly. Expect little sky around it.';
  else if (percent >= 10) note = 'It fits comfortably with room around it.';
  else if (percent >= 1) note = 'It fits easily but looks small in the field.';
  else note = 'It is tiny compared with this field and will look like a point or a small disc.';
  return { fits, percent, note };
}
