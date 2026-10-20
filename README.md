# FiberLab 3D — Interactive Optical Fibre Physics Laboratory

A first-year engineering physics project exploring **Fibre Optics: Transmission of Signals Through Light**. Built with React, Vite, Three.js through React Three Fiber/Drei, Recharts, and Lucide icons. No backend or paid API is required.

## Features

- Interactive 3D fibre scene with orbit/zoom controls, transparent cladding, visible core, laser transmitter, photodetector, and animated pulse.
- Controls for internal incidence angle, entrance-angle mode, core/cladding/external refractive indices, wavelength, input power, fibre length, baseline attenuation, bend radius, and visual curvature.
- Live readout for critical angle, numerical aperture, acceptance angle, received optical power, and total loss.
- Six calculated graphs: incidence angle, bend radius, fibre length, input power, curvature, and baseline attenuation.
- Simulation presets, calculation breakdown, CSV report export, theory notes, applications, formula sheet, and 18 viva questions.
- Responsive layout for laptop and mobile.
- Unit tests for core physics calculations and edge cases.

## Requirements

- Node.js 20.19+ or 22.12+ recommended (Vite 7 requirement)
- npm

## Run locally

```bash
npm install
npm run dev
```

Vite prints a local URL, normally `http://localhost:5173`.

## Build and test

```bash
npm run build
npm test
npm run preview
```

## Key files

- `src/App.jsx` — dashboard, controls, tabs, report export, theory, applications and viva content
- `src/components/FibreScene.jsx` — Three.js / React Three Fiber scene
- `src/components/Graphs.jsx` — Recharts graph components
- `src/lib/physics.js` — reusable physics calculations and graph data generation
- `src/lib/physics.test.js` — Vitest unit tests
- `src/style.css` — responsive dark-laboratory UI

## Physics model and limitations

1. **Critical angle:** `θc = asin(n_clad / n_core)` when `n_core > n_clad`.
2. **Numerical aperture:** `NA = sqrt(n_core² - n_clad²)` for a step-index fibre in air.
3. **Acceptance angle:** `θmax = asin(NA / n_external)` when the arcsine argument is at most one.
4. **Baseline attenuation:** `L_baseline = α × length`, with α in dB/km and length in km.
5. **Received power:** `Pout = Pin × 10^(-L_total/10)`.
6. **Bend loss:** a clearly labelled educational approximation, not a validated universal formula. Real bend loss depends on fibre design, wavelength, bend radius, and installation.
7. **Angle graph and ray path:** the rendered zig-zag is schematic; the angle graph is a qualitative ray-model indicator, not a measured power-transmission curve. This is not a full-wave Maxwell-equation solver.
8. The current entrance-angle mode shows a simplified angle relationship for demonstration; a rigorous ray-trace at the entrance face would additionally solve Snell's law and the local geometry at the actual entry point.
9. Coupling loss is an example link-budget assumption, not a measured value. Uncheck realistic mode to compare without this example loss.
10. The animated pulse is a visual demonstration. Its animation speed is not a calibrated physical time-of-flight measurement.

Use the limitations section in your presentation so the project does not overclaim laboratory-grade predictions.
