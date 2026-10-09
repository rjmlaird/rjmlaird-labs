# AstronomyFieldOfView

Self-contained Astro component. No framework, no Tailwind, no runtime dependencies. All maths runs in the browser.

## Install

Copy into your project, keeping the relative paths:

```
src/components/AstronomyFieldOfView.astro
src/lib/fov/calc.ts        # pure calculation functions
src/lib/fov/data.ts        # editable presets and sky objects
src/lib/fov/calc.test.ts   # tests
src/pages/field-of-view.astro   # example usage
```

Use it:

```astro
---
import AstronomyFieldOfView from '../components/AstronomyFieldOfView.astro';
---
<AstronomyFieldOfView defaultPresetId="dob-200" defaultObjectId="m31" />
```

Props (all optional): `id`, `heading`, `defaultPresetId`, `defaultObjectId`.

## Tests

```
npm i -D vitest
npx vitest run src/lib/fov
```

## Customising

- **Presets and objects:** edit the arrays in `data.ts`. A preset is a typed `InstrumentConfig` plus `id`, `name`, `category`, `description`.
- **Colours:** set `--afov-text` and `--afov-bg` on a parent element, or edit the `.afov` variables. All classes are prefixed `afov-` and styles are scoped.
- **Fonts:** the component inherits the site font.

## Calculations

| Quantity | Formula |
|---|---|
| Effective focal length | focal length × Barlow/reducer factor × train factor |
| Magnification | effective focal length ÷ eyepiece focal length |
| Focal ratio | effective focal length ÷ aperture |
| Exit pupil | aperture ÷ magnification (binoculars: objective ÷ magnification) |
| True field (preferred) | 57.2958 × field stop ÷ effective focal length |
| True field (fallback) | apparent field ÷ magnification, labelled approximate |
| Field from width at distance | 2 × atan(width ÷ (2 × distance)) |
| Object fit | object major axis ÷ field diameter |

The field-stop result is used whenever a field stop is given, and the method used is shown in the results. For cameras, the "field stop" input is the sensor diagonal. Binocular true field is never guessed from magnification and objective size alone; the component asks for a field value instead.

## Notes

- Preset values are representative examples, not specifications for every instrument of that type.
- Object sizes are approximate and several (planets, the Moon) vary with distance.
- The component assumes Node 18+ and Astro 3 or later. Its script is bundled by Astro, so no extra config is needed.
