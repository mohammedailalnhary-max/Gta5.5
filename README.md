# VICE WORLD — Phase 01

A playable, mobile-first 3D browser prototype for an original Miami-inspired open-world game.

## Implemented in this phase
- Three.js 3D scene with a coastal neighborhood, roads, buildings, windows, palms, promenade, water and street lights.
- Third-person character and follow camera.
- Starter sports car with enter/exit interaction and arcade driving.
- Touch joystick, camera drag, run/jump, steering, gas and brake controls.
- A first exploration objective and location label.
- Local save data and a PWA service-worker shell cache.
- Landscape-first mobile interface and desktop keyboard/mouse controls.

## Requirements
Node.js 20.19+ or 22.12+ recommended.

## Run locally
```bash
npm install
npm run dev
```
Open the local URL shown by Vite. For a production build:
```bash
npm run build
npm run preview
```

## Offline use
The browser can cache the built app shell after the first successful online visit. Three.js and Vite are bundled into the production build, so the game does not require a remote 3D library at runtime. Test this by opening the deployed app once, waiting for it to load, and then enabling airplane mode and reloading.

Browser storage and service-worker behavior varies by browser. Local development over `localhost` is supported; service workers generally require HTTPS when deployed.

## Controls
- Desktop: WASD/arrows move, Shift run, Space jump, E enter/exit, mouse drag to look after clicking the game, Escape pause.
- Mobile: left virtual stick moves; drag the right side to look; buttons provide run, jump, enter/exit and vehicle controls.
- Get close to the teal sports car and tap ENTER. Drive toward the cyan objective marker to complete the first objective.

## Important limitations
This is a first playable slice, not a finished AAA game. The city and vehicles use procedural starter geometry, not final photorealistic scanned assets. The collision system is intentionally lightweight. Traffic AI, pedestrians, aircraft, boats, advanced missions, full physics, character animation, detailed interiors, and a large streamed map are future milestones. Visual quality and performance vary by device.

## Asset and brand policy
Vice World is an original working title. This prototype uses generated procedural geometry and Three.js, not GTA proprietary maps, models, characters or trademarks. Add only assets that you have the right to redistribute.
