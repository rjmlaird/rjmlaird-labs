# N-Body Gravity Simulator

An interactive physics lab for [labs.rjmlaird.co.uk](https://labs.rjmlaird.co.uk) — a real-time
N-body gravitational simulation built with Astro, TypeScript, and the HTML canvas, using **real
astronomical units**: solar masses (M&#9737;), AU, and years.

Every body in the simulation exerts a gravitational pull on every other body,
integrated with a symplectic **velocity Verlet** scheme so orbits stay stable
over long runs rather than drifting the way naive forward-Euler integration does.

## Physical units

Distances are in AU, masses in solar masses, time in years. The gravitational constant is fixed at

```
G = 4π² AU³ / (M☉ · yr²)
```

which falls straight out of Kepler's third law applied to Earth's own orbit (a = 1 AU, T = 1 yr,
M = 1 M☉). The payoff: any preset built from real masses and real distances produces physically
correct orbital periods and speeds automatically — no extra scaling, no fudge factors. A body with
a = 1 AU around a 1 M☉ star really does complete an orbit in 1.000 year (verified numerically to
four decimal places), and Jupiter's 5.203 AU orbit really does take 11.87 years.

Two presets (the figure-8 three-body choreography and the chaotic cluster) use a separate,
dimensionless G = 1 — they're mathematical curiosities rather than physical systems, and are
labelled as "normalised units" in the UI rather than AU/M☉.

## Setting up bodies by mass and distance

The **Add Body** panel lets you place a new body directly:

- **Mass (M☉)**
- **Orbit around** — pick an existing body as the central mass, or leave it unset to drop the new
  body at rest
- **Semi-major axis a (AU)** and **eccentricity e**
- **Retrograde** toggle for a clockwise orbit

The new body is placed at periapsis and given the exact vis-viva velocity for that mass, distance,
and eccentricity — a real Keplerian orbit, not an approximation. Click-drag on the canvas still
works as a quick freehand alternative.

## Kepler's laws, demonstrated live

Toggle **"Kepler's laws overlay"** (on by default for the *Kepler's laws* and *Inner solar system*
presets) to see all three laws at once:

1. **Law of ellipses** — orbit trails trace out visibly elliptical paths; the dominant mass (dashed
   ring) sits at one focus, not the centre.
2. **Law of equal areas** — the simulation samples the orbiting body's position at a fixed time
   interval and shades the swept-out area as a wedge from the focus. The area readouts in the panel
   stay close together regardless of orbital speed — the body sweeps equal areas in equal times,
   moving fastest near periapsis and slowest near apoapsis.
3. **Law of periods (T² ∝ a³)** — a live table computes each body's semi-major axis and period from
   its instantaneous position and velocity (via specific orbital energy / vis-viva), then shows
   T²/a³ for each. Every bound body orbiting the same central mass converges on the same value —
   which the panel shows is exactly 1/M_focus in these units.

## Other features

- **True N-body physics** — O(n²) pairwise force calculation, no restriction to two bodies.
- **Plummer softening** — prevents force singularities when bodies pass close together.
- **Six presets**: Kepler's laws demo, inner solar system (Sun through Jupiter, real data),
  binary star (α Centauri A/B, real masses and orbit), figure-8 three-body, chaotic cluster,
  and a blank canvas.
- **Live diagnostics** — body count and energy drift (%), a quick sanity check on integrator
  stability; a well-behaved run should stay within a fraction of a percent.
- **Adjustable gravity strength, softening, zoom (px/AU), and simulation speed.**

## Stack

- [Astro](https://astro.build) (static output)
- Tailwind CSS, using project brand tokens (navy `#0B0F1A`, teal `#00C2A8`, amber `#F5A623`)
- Space Grotesk (display) + Inter (body) + IBM Plex Mono (data/HUD)
- No external physics or rendering libraries — the integrator and canvas
  renderer are both hand-written in `src/lib/`

## Project structure

```
src/
├── layouts/Layout.astro       # shared HTML shell
├── pages/index.astro          # the lab page: canvas + HUD controls + Add Body form
├── lib/
│   ├── vectors.ts             # minimal 2D vector helpers
│   ├── units.ts                # G=4π² unit system, vis-viva, orbital element estimation
│   ├── physics.ts             # N-body integrator, energy/centre-of-mass calc
│   ├── presets.ts             # preset systems (Kepler demo, solar system, binary, ...)
│   └── simulation.ts          # canvas rendering, interaction, Kepler overlays, animation loop
└── styles/global.css
```

## Development

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # outputs to dist/
npm run preview   # preview the production build
```

## Extending

Ideas for a "Lab 02" in the same series:

- Add relativistic apsidal precession (Mercury-style) as an optional force term.
- Real Lagrange point visualisation (restricted three-body problem).
- Barnes–Hut tree approximation to push body counts into the hundreds.
- Collision/merging when bodies overlap, conserving momentum.
- Let the "Add Body" form target an angle/position instead of a random periapsis point.

Built by Ryan Laird — Green Orbit Digital.
