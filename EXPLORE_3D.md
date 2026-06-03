# 3D "Explore the World" — Build Handoff

> Context doc for continuing the 3D portfolio world. Hand this to a fresh
> session: "Read EXPLORE_3D.md, we're starting Phase 4."

## Goal
An opt-in interactive 3D third-person world at **`/explore`**: a Nintendo-style
**floating sky-archipelago** where the visitor wanders as a low-poly human
adventurer to explore Max's portfolio. The 3D layer is **navigation only** —
actual content (projects, videos, bio) renders as **HTML overlay panels**, not
inside WebGL. The classic 2D site stays the default and fallback.

## Status: Phases 1–4 done. Phase 5 (art pass) is next.
Branch: **`feature/explore-3d`** (`main` is untouched). Everything 3D lives
under `src/explore/` and is lazy-loaded, so the main site bundle is unchanged
(~76.5 KB gzip); the 3D chunk (~1.2 MB gzip) only loads on `/explore`.

## Stack (added this effort)
- **React upgraded 18 → 19** (required by the current R3F v9 line; its own commit).
- `three`, `@react-three/fiber` v9, `@react-three/drei` v10, `@react-three/rapier` v2, `ecctrl` (character controller), `zustand`.
- All MIT/free. Character: `public/models/character.glb` = Quaternius **Adventurer** (CC0).

## File map (`src/explore/`)
- **ExplorePage.jsx** — page shell: WebGL check + graceful fallback, intro card, drei `<Loader>`, the `<Canvas>`, `<TouchControls>` (mobile, hidden when a panel is open), `<InteractionOverlay>`, exit-to-site link. The lazy route is added in `src/App.jsx`.
- **Scene.jsx** — the 3D world. Contains: lights + `<Sky>` + cloud-sea disc; **data-driven** `ISLANDS` + `BRIDGE_LINKS` → `makeBridge()` builds bridges + walkable `ZONES`; `Island`, `Bridge`, `IslandLabel` components; `BoundaryGuard` (keeps you in the zones + fall-respawn); `CameraDragControls` (drag-to-look); `Ecctrl` controller; `CharacterModel` (cloned skeleton) + custom `CharacterAnimation`.
- **Kiosks.jsx** — `Kiosk` (gray-box monitor showing the project screenshot) + `ProximityDetector` (per-frame nearest-interactable check → store).
- **interactables.js** — `INTERACTABLES` array. Currently the **5 dev project kiosks** (world `position`, `rotationY`, `radius`, linked `project` from `src/data/projects.js`).
- **InteractionOverlay.jsx** — DOM overlay: desktop "Press E" prompt, mobile **View** button, `ProjectPanel` (renders project image/role/stack/description/visit link), E + Esc key handling.
- **TouchControls.jsx** — custom mobile joystick + jump button writing to ecctrl's `useJoystickControls` store.
- **useExplore.js** — zustand store: `nearby`, `active`, `setNearby`, `open`, `close`.
- **explore.css** — all overlay/HUD styling (uses the site's CSS tokens + fonts).

## Critical gotchas (don't relearn these the hard way)
- **Clone the character** with `SkeletonUtils.clone` — rendering the shared cached GLTF scene leaves the animation mixer detached under React StrictMode → no animation plays.
- **Custom `CharacterAnimation`** replaces ecctrl's `EcctrlAnimation` to scale the run clip's playback to actual ground speed (no foot-sliding). `RUN_STRIDE_K` is the cadence knob.
- **Always-run**: `animationSet.walk` is aliased to the Run clip; `maxVelLimit=8`, `sprintMult=1`. The Adventurer has **no jump clip**, so jump/fall slots map to `Idle_Neutral`.
- **Camera = hybrid**: `mode="FixedCamera"` (locked behind) + `CameraDragControls` calling ecctrl's `rotateCamera()`. While dragging (`looking` state) we set `fixedCamRotMult={0}` to pause auto-recenter; on release it eases back behind. (ecctrl hardcodes `camMoveSpeed=0` in FixedCamera, which is why native drag is off and we drive it ourselves.)
- **Mobile joystick is custom** — ecctrl's `EcctrlJoystick` attaches its drag listeners via `document.querySelector` during its first render (before its DOM exists) so touch-move never wired up; `TouchControls.jsx` writes to the `useJoystickControls` store directly instead. Also: **never force `.explore-root canvas { width/height:100% }`** — it stretches the joystick's own canvas and breaks its hit area.
- **Boundary is code-based, not collider walls** (walls tunnel at run speed). `BoundaryGuard` keeps you inside the union of zones (island circles + bridge rects) and, when out, clamps to the nearest edge **removing only the outward velocity** (so you can move away / slide along edges). Falls below y=-8 respawn at `SPAWN` (hub).
- **Bridges** are lifted `0.08` above the island surface to avoid z-fighting at the overlaps.
- **drei `<Html>` labels** use `zIndexRange={[100,0]}` to sit below the UI, and are hidden while a content panel is open.

## World layout (in Scene.jsx `ISLANDS`)
| id | position | radius | content |
|----|----------|--------|---------|
| hub | [0,0,75] | 16 | spawn (`SPAWN=[0,2.5,75]`) |
| dev | [0,0,0] | 33 | 5 project kiosks |
| video | [54,0,75] | 26 | 4 video-category screens |
| about | [-40,0,75] | 14 | 1 merged About + Contact stop |
Bridges connect hub ↔ each island. Video/About sit close to the hub so the
bridges stay short. **A 4th island slot is open** (north, ~`[0,0,125]`, where
Contact used to live) — deferred until Max picks a theme (Lab/Experiments and
Services were the leading ideas).

## Phase 4 (DONE): islands wired via a type-driven interaction loop
Each `interactables.js` entry has a **`type`** (`project | videoCategory |
about`); `InteractionOverlay` renders the matching panel; `interactableTitle`
/`interactableImage` are type-agnostic accessors used by the in-world kiosk.
- **Videography**: 4 category screens (`src/data/videos.js`) → `VideoPanel`
  reusing `VideoGrid`/`VideoCard`. Thumbnails in `public/` (`*Thumbnail.png`).
- **About**: one stop → `AboutPanel` (bio + photo from `About.jsx` +
  `maxProfile2.jpg`, then a get-in-touch section whose link → `/contact`).
  **Contact was folded in here** (both pages were too thin to justify their
  own islands) and the separate Contact island was removed.
- **Archways**: each bridge's hub-side entrance has a labeled gray-box gateway
  (named for its destination), replacing the old floating labels + billboards.

## Later phases
- **Phase 5 — Art pass**: themed biomes (mushroom forest = Dev, crystal cavern = Video, sky temple = About), real lighting, volumetric clouds, styled kiosks, and **labeled archways at each bridge's hub-side entrance** (the wayfinding that replaced the old billboards — removed once kiosks identified each island). Free CC0 kits (Quaternius/Kenney). This is the big visual leap — kiosk styling waits for here.
- **Phase 6 — Engagement/polish** (user wants these LATER, not now): ambient **music + SFX**, **collectibles / light gamification**, a **welcome NPC on the hub representing Max**, loading screen, bloom post-processing, drifting clouds, idle character animations.
- **Phase 7 — Ship**: mobile/perf tuning, code-split/compress the ~1.2 MB explore chunk, add an **"Enter the World"** entry point on the real homepage, merge to `main` / deploy (Netlify).

## How to run & test
- Dev (LAN for phone testing): `npm run dev -- --host` → desktop `http://localhost:5173/explore`, phone `http://<LAN-IP>:5173/explore` (same Wi-Fi).
- `npm run build` — sanity check; the **main bundle must stay ~76.5 KB gzip** (3D stays in its own chunk).
- **Cadence that's worked**: build one island/feature as a slice → test on **desktop AND a real phone** → tune by feel → commit at each confirmed milestone.

## User preferences
- Keep the **simple path**; defer audio/collectibles/NPC to Phase 6.
- Loves the **hybrid camera** (locked-behind + drag-to-look) and **always-run**.
- Don't polish visuals yet (billboards/kiosks are gray-box on purpose until Phase 5).
- Iterative + cautious: small testable slices, verify on mobile, commit checkpoints.

## Commit trail (on feature/explore-3d)
- `e1fb94c` Upgrade to React 19
- `2898057` Phase 1: walkable /explore spike
- `871b1f8` Phase 2: floating island + interaction system
- `feaa695` Phase 2: all 5 dev kiosks
- `59fa55b` Phase 2: hybrid drag-to-look camera
- `72f3e8f` Phase 3 slice: hub + bridge
- `300ff0d` Phase 3: full archipelago
