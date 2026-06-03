# 3D "Explore the World" — Build Handoff

> Context doc for continuing the 3D portfolio world. Hand this to a fresh
> session: "Read EXPLORE_3D.md, we're starting Phase 4."

## Goal
An opt-in interactive 3D third-person world at **`/explore`**: a Nintendo-style
**floating sky-archipelago** where the visitor wanders as a low-poly human
adventurer to explore Max's portfolio. The 3D layer is **navigation only** —
actual content (projects, videos, bio) renders as **HTML overlay panels**, not
inside WebGL. The classic 2D site stays the default and fallback.

## Status: Phases 1–4 done. Phase 5 (art pass) in progress.
Phase 5 so far: atmosphere & lighting; islands converted to **enclosed themed
museums** (walls + domes + covered tunnels + interior lights); kiosks → wall
screens; videography → individual video screens; **engraved stone archways**.
Remaining art-pass ideas: real interior-only lighting, cam-collision indoors,
styled CC0 props, social (vertical) video screens, optional intro camera.
Branch: **`feature/explore-3d`** (`main` is untouched). Everything 3D lives
under `src/explore/` and is lazy-loaded, so the main site bundle is unchanged
(~76.5 KB gzip); the 3D chunk (~1.2 MB gzip) only loads on `/explore`.

## Stack (added this effort)
- **React upgraded 18 → 19** (required by the current R3F v9 line; its own commit).
- `three`, `@react-three/fiber` v9, `@react-three/drei` v10, `@react-three/rapier` v2, `ecctrl` (character controller), `zustand`.
- All MIT/free. Character: `public/models/character.glb` = Quaternius **Adventurer** (CC0).

## File map (`src/explore/`)
- **ExplorePage.jsx** — page shell: WebGL check + graceful fallback, intro card, drei `<Loader>`, the `<Canvas>`, `<TouchControls>` (mobile, hidden when a panel is open), `<InteractionOverlay>`, exit-to-site link. The lazy route is added in `src/App.jsx`.
- **worldLayout.js** — **shared source of truth** for the layout (no circular imports): `ISLANDS`, `BRIDGE_LINKS`, `SPAWN`, `makeBridge`→`BRIDGES`, walkable `ZONES`, `islandById`, `entranceAngle`; museum dims (`wallHeight`, `doorHalfAngle`, `TUNNEL_HEIGHT`, `SCREEN_*`), `BUILDING_THEME` (wall/light/engrave colors), and `wallSlots()` (distributes screens around an interior wall).
- **Scene.jsx** — the 3D world. Atmosphere (fog + `<Sky>` + hemisphere/warm key light on a shared `SUN_POS` + cloud-sea disc + drei `<Clouds>`); `Island`, `Bridge` (deck only), `Archway` (chunky stone gateway with **engraved 3D `<Text>`** — white fill, building-colored outline, Bebas Neue from `/public/fonts/`); `BoundaryGuard`; `CameraDragControls`; `Ecctrl` (spawns facing south via `camInitDir.y=π`); `CharacterModel` + custom `CharacterAnimation`.
- **Architecture.jsx** — the museum shells: `Building` (curved wall with a doorway gap + lintel above it + domed roof + interior accent light), `BridgeTunnel` (covered bridge, archway-height, colored to its destination building), and `Museums` wrapper.
- **Decor.jsx** — `WorldDecor`: just the distant background islets now (the themed biome props were removed when islands became museums).
- **Kiosks.jsx** — `Kiosk` (flat **wall-mounted TV**: framed panel + screen, no stand/collider) with `TexturedScreen`/`ColorScreen` split + `ProximityDetector` (nearest-interactable → store).
- **interactables.js** — `INTERACTABLES`, positions derived via `wallSlots`. Types: **`project`** (5 dev screens), **`video`** (one per horizontal YouTube video — trailers/narrative/AI), **`about`** (one merged bio+contact stop). `interactableTitle`/`interactableImage` are type-agnostic accessors.
- **InteractionOverlay.jsx** — DOM overlay: "Press E"/mobile **View** prompt; panels by `active.type` — `ProjectPanel`, `VideoPlayerPanel` (autoplay iframe), `AboutPanel` (bio+photo+get-in-touch→`/contact`); E + Esc handling.
- **TouchControls.jsx** — custom mobile joystick + jump button writing to ecctrl's `useJoystickControls` store.
- **useExplore.js** — zustand store: `nearby`, `active` (the open interactable), `setNearby`, `open`, `close`.
- **explore.css** — all overlay/HUD styling (uses the site's CSS tokens + fonts).

## Critical gotchas (don't relearn these the hard way)
- **Clone the character** with `SkeletonUtils.clone` — rendering the shared cached GLTF scene leaves the animation mixer detached under React StrictMode → no animation plays.
- **Custom `CharacterAnimation`** replaces ecctrl's `EcctrlAnimation` to scale the run clip's playback to actual ground speed (no foot-sliding). `RUN_STRIDE_K` is the cadence knob.
- **Always-run**: `animationSet.walk` is aliased to the Run clip; `maxVelLimit=8`, `sprintMult=2` (hold **Shift** → the `run` action → sprint at double, 16). The Adventurer has **no jump clip**, so jump/fall slots map to `Idle_Neutral`.
- **Camera = hybrid**: `mode="FixedCamera"` (locked behind) + `CameraDragControls` calling ecctrl's `rotateCamera()`. While dragging (`looking` state) we set `fixedCamRotMult={0}` to pause auto-recenter; on release it eases back behind. (ecctrl hardcodes `camMoveSpeed=0` in FixedCamera, which is why native drag is off and we drive it ourselves.)
- **Mobile joystick is custom** — ecctrl's `EcctrlJoystick` attaches its drag listeners via `document.querySelector` during its first render (before its DOM exists) so touch-move never wired up; `TouchControls.jsx` writes to the `useJoystickControls` store directly instead. Also: **never force `.explore-root canvas { width/height:100% }`** — it stretches the joystick's own canvas and breaks its hit area.
- **Boundary is code-based, not collider walls** (walls tunnel at run speed). `BoundaryGuard` keeps you inside the union of zones (island circles + bridge rects) and, when out, clamps to the nearest edge **removing only the outward velocity** (so you can move away / slide along edges). Falls below y=-8 respawn at `SPAWN` (hub).
- **Bridges** are lifted `0.08` above the island surface to avoid z-fighting at the overlaps.
- **Museums are visual-only** (no colliders): walls sit just outside the walkable boundary so `BoundaryGuard` already stops you; walls/domes are `THREE.DoubleSide`. The doorway is a cylinder `thetaStart/Length` gap (centered toward the hub via `φ = π/2 − worldAngle`), with a lintel filling the wall above it so the opening is only `TUNNEL_HEIGHT` tall.
- **Interiors aren't truly dark** — three.js lights pass through walls (no occlusion), so the sun/hemisphere still light the interior; accent point lights tint rather than dominate. Real interior-only lighting needs shadow-casting domes / dialing back the sun inside (not done).
- **Third-person camera can clip** museum walls (esp. small About) — no cam-collision yet.
- **YouTube thumbnails as WebGL textures** work (`img.youtube.com` sends `access-control-allow-origin: *`); ~23 load on entering the video museum.
- **Archway text** uses drei `<Text>` (troika; +~40 KB to the explore chunk) with a local Bebas Neue TTF in `public/fonts/` (no runtime CDN font fetch).

## World layout (in `worldLayout.js` `ISLANDS`)
Each section island is now an **enclosed themed museum** (walls + domed roof,
single doorway facing the hub) connected by a **covered tunnel**; the kiosks
are **wall-mounted screens** inside. The open hub stays a grassy grove.
| id | position | radius | content |
|----|----------|--------|---------|
| hub | [0,0,75] | 16 | spawn (`SPAWN=[0,2.5,89.5]`, north edge, facing south) |
| dev | [0,0,0] | 33 | Software Dev museum — 5 project screens |
| video | [54,0,75] | 26 | Videography museum — ~23 horizontal-video screens |
| about | [-40,0,75] | 14 | About museum — 1 merged bio+contact screen |
Bridges connect hub ↔ each island; Video/About sit close to the hub so the
tunnels stay short. **A 4th island slot is open** (north, ~`[0,0,125]`, where
Contact used to live) — deferred until Max picks a theme (Lab/Experiments and
Services were the leading ideas).

## Phase 4 (DONE): islands wired via a type-driven interaction loop
Each `interactables.js` entry has a **`type`** (`project | video | about`);
`InteractionOverlay` renders the matching panel; `interactableTitle`
/`interactableImage` are type-agnostic accessors used by the in-world screen.
- **Videography**: one screen per **horizontal** video (trailers/narrative/AI
  from `src/data/videos.js`) → `VideoPlayerPanel` (autoplay iframe). The
  vertical Social/Short-Form set is **not** shown yet (needs vertical screens).
- **About**: one stop → `AboutPanel` (bio + photo from `About.jsx` +
  `maxProfile2.jpg`, then a get-in-touch section whose link → `/contact`).
  **Contact was folded in here** and its separate island removed.

## Later phases
- **Phase 5 — Art pass** (IN PROGRESS): done so far — atmosphere/lighting,
  enclosed museum architecture (walls/domes/tunnels/interior lights), wall
  screens, engraved stone archways. Remaining: real interior-only lighting
  (shadow-casting domes), indoor cam-collision, styled CC0 props
  (Quaternius/Kenney), vertical screens for social video, optional intro camera.
- **Phase 6 — Engagement/polish** (user wants these LATER, not now): ambient **music + SFX**, **collectibles / light gamification**, a **welcome NPC on the hub representing Max**, loading screen, bloom post-processing, drifting clouds, idle character animations.
- **Phase 7 — Ship**: mobile/perf tuning, code-split/compress the ~1.2 MB explore chunk, add an **"Enter the World"** entry point on the real homepage, merge to `main` / deploy (Netlify).

## How to run & test
- Dev (LAN for phone testing): `npm run dev -- --host` → desktop `http://localhost:5173/explore`, phone `http://<LAN-IP>:5173/explore` (same Wi-Fi).
- `npm run build` — sanity check; the **main bundle must stay ~76.5 KB gzip** (3D stays in its own chunk).
- **Cadence that's worked**: build one island/feature as a slice → test on **desktop AND a real phone** → tune by feel → commit at each confirmed milestone.

## User preferences
- Keep the **simple path**; defer audio/collectibles/NPC to Phase 6.
- Loves the **hybrid camera** (locked-behind + drag-to-look) and **always-run**.
- Iterative + cautious: small testable slices, verify on mobile, commit checkpoints.
- Drove the museum direction (enclosed buildings, wall screens, engraved
  archways, color-coded titles); likes seeing demos to judge fidelity.

## Commit trail (on feature/explore-3d)
- `e1fb94c` Upgrade to React 19
- `2898057` Phase 1: walkable /explore spike
- `871b1f8` Phase 2: floating island + interaction system
- `feaa695` Phase 2: all 5 dev kiosks
- `59fa55b` Phase 2: hybrid drag-to-look camera
- `72f3e8f` Phase 3 slice: hub + bridge
- `300ff0d` Phase 3: full archipelago
- `837557f` Phase 4 slice: Videography island
- `9646ea2` Phase 4: merged About stop, archways, compact layout
- `c8b2dbd` Phase 5 slice: atmosphere & lighting
- _(next)_ Phase 5: enclosed museums + wall screens + engraved archways
