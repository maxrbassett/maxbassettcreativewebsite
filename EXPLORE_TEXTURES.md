# 3D Explore — Realistic Art / Texture Pipeline

> Context doc for the realistic art pass on `/explore`. Hand to a fresh session
> alongside `EXPLORE_3D.md`. Goal: photoreal surfaces (stone, glass, metal, …)
> that stay small enough for the Netlify **free tier**.

## Philosophy & the bandwidth math
The classic site bundle is untouched (~76.7 KB gzip). All 3D lives in a
lazy-loaded chunk + image assets that **only download on `/explore`**, so they
never affect the main site. Netlify free tier ≈ **100 GB/mo bandwidth**; even a
~15 MB `/explore` would allow thousands of *first* visits/month (repeat visits
are cached). So the real target is **load time**, not the bill. We keep it small
with four levers:

1. **Reuse a few materials** (tile + tint) instead of unique textures per surface.
2. **KTX2 / Basis** GPU-compressed textures (~3× smaller download + less VRAM).
3. **One HDRI** for sky-style lighting + reflections across the whole scene.
4. **Cache headers** so repeat visitors download nothing.

## Where assets live
```
public/textures/<set>/   <name>.jpg|png   ← CC0 source maps (kept for re-encoding)
                         <name>.ktx2      ← shipped, GPU-compressed (app loads these)
public/hdri/sky_1k.hdr                    ← CC0 HDRI for image-based lighting
public/basis/basis_transcoder.{js,wasm}   ← KTX2 decoder (from three; cached forever)
public/_headers                            ← Netlify cache rules
scripts/encode-textures.sh                 ← JPG/PNG → KTX2 (bootstraps toktx)
scripts/.tool/                             ← cached toktx encoder (gitignored)
src/explore/textures.js                    ← material library + loaders
```
Source maps sit next to the `.ktx2` for easy re-encoding. They're deployed but
**never requested** by the app (zero bandwidth); move them out of `public/` only
if you want to trim deploy storage.

## Material library (`src/explore/textures.js`)
Central registry — add a material once, reuse everywhere:
```js
export const MATERIALS = {
  stone: {
    map:          '/textures/stone_tiles_02/diff_1k.ktx2',
    normalMap:    '/textures/stone_tiles_02/nor_gl_1k.ktx2',
    roughnessMap: '/textures/stone_tiles_02/rough_1k.ktx2',
  },
}
```
Use it in a component (loads cached KTX2, returns a per-surface tiling set):
```js
const set = useMaterialSet('stone', repeatX, repeatY) // {map, normalMap, roughnessMap}
// then: <meshStandardMaterial color="#fff" {...set} />  (color tints the texture)
```
- `useStoneSet(rx, ry)` is a convenience alias for `useMaterialSet('stone', …)`.
- Each call **clones** the maps so repeats don't collide between surfaces.
- The color map is tagged `SRGBColorSpace`; normal/roughness stay linear.
- Tint via the mesh's `color` to reuse one set across differently-shaded surfaces.

## Adding a new material (full loop)
1. **Find CC0 maps** on [Poly Haven](https://polyhaven.com/textures) or
   [ambientCG](https://ambientcg.com). Grab **Diffuse + Normal (GL) + Roughness**
   at **1K JPG** (add AO/metal only if needed).
   - Poly Haven direct URLs: `GET https://api.polyhaven.com/files/<slug>` → JSON of map URLs (`<map>.<res>.<fmt>.url`).
2. **Download** into `public/textures/<set>/` (e.g. `diff_1k.jpg`, `nor_gl_1k.jpg`, `rough_1k.jpg`).
3. **Add to the MANIFEST** in `scripts/encode-textures.sh`:
   ```
   "public/textures/<set>/diff_1k|color"
   "public/textures/<set>/nor_gl_1k|normal"
   "public/textures/<set>/rough_1k|linear"
   ```
4. **Encode:** `./scripts/encode-textures.sh` (auto-downloads `toktx` if missing).
5. **Register** the `.ktx2` paths under `MATERIALS` in `src/explore/textures.js`.
6. **Use** `useMaterialSet('<name>', rx, ry)` on your meshes.

## KTX2 encoding details
`scripts/encode-textures.sh` resolves `toktx` (PATH → `scripts/.tool` → downloads
the Khronos **KTX-Software** macOS release and extracts it locally — no system
install). Per-map settings (ETC1S/BasisLZ + mipmaps):

| Map type | `toktx` flags | Color space |
|----------|---------------|-------------|
| `color`  | `--encode etc1s --clevel 4 --qlevel 200` | sRGB |
| `normal` | `--encode etc1s --normal_mode --clevel 4 --qlevel 200` | linear |
| `linear` (rough/ao/metal/height) | `--encode etc1s --clevel 4 --qlevel 160` | linear |

All get `--t2 --genmipmap`. ETC1S keeps files tiny; bump `--qlevel`/`--clevel`
or switch a map to `--encode uastc` for higher fidelity at larger size (UASTC is
big — add `--zcmp 18` to zstd-supercompress its download).

Runtime decode: drei `useKTX2(MATERIALS[name], '/basis/')` with the self-hosted
transcoder in `public/basis/` (copied from
`node_modules/three/examples/jsm/libs/basis/`). KTX2 stays compressed in VRAM.

## HDRI lighting (`src/explore/Scene.jsx`)
```jsx
<Environment files="/hdri/sky_1k.hdr" environmentIntensity={0.35} />
```
One ~1.2 MB CC0 HDRI gives realistic **reflections** (glass/stone) and an ambient
fill. We keep drei `<Sky>` as the visible backdrop (no `background` prop) and the
intensity modest so it complements the existing hemisphere/key lights. As more
surfaces go realistic, lean on this and dial the flat `hemisphereLight` /
`ambientLight` down. To swap skies: replace `public/hdri/sky_1k.hdr` (Poly Haven
`*_puresky` 1K HDRs are ideal) or set `background` to use it as the sky too.

## Glass (`GlassMaterial` in `Architecture.jsx`)
Cheap see-through glass — transparent + low roughness + clearcoat, **no
transmission pass** (so it's mobile-friendly). The HDRI gives it reflections.
Used on the Videography bridge (deck + tunnel). For true refraction later, swap
to drei `MeshTransmissionMaterial` (heavier).

## Caching & loading
- **`public/_headers`**: hashed `/assets/*` cached `immutable` 1yr; static 3D
  assets (`/textures`, `/hdri`, `/basis`, `/fonts`, `/models`) cached 30 days.
  Replacing an asset? bump its filename (e.g. `_v2`) to bust caches immediately.
- **Loading screen**: drei `<Loader>` in `ExplorePage` already tracks every
  `useLoader` asset (GLB, KTX2, HDRI), so the progress bar covers all of this.

## Size budget (rough, per first `/explore` visit)
| Item | ~Size | Notes |
|------|-------|-------|
| explore JS chunk | ~1.3 MB gzip | code (incl. KTX2/HDRI loaders) |
| Basis transcoder | ~0.57 MB | once, cached forever, shared |
| HDRI 1K | ~1.2 MB | whole-scene lighting/reflections |
| Stone KTX2 set (3 maps) | ~0.7 MB | reused across stone surfaces |
Aim to keep total realistic assets in the **~6–12 MB** range by reusing ~4–6
material sets across all buildings/ground rather than unique textures each.

## Status
- **Done:** pipeline established; **all section buildings** = realistic **marble**
  (`marble_01`, KTX2 PBR) — shells, domes, interior partition walls, and all
  archways — each **tinted by its theme color** (`BUILDING_THEME[id].wall`) off
  the one shared `marble` set (`MARBLE_TILE` / `MARBLE_NORMAL_SCALE` tune scale +
  relief; roughness eased to read as polished). All covered bridge tunnels are
  glass. Island rims/cones are a flat dirt-brown color (no texture). HDRI IBL
  scene-wide; lights rebalanced toward the HDRI + key for more form. Grass
  blades removed.
- **Stone** set (`stone_tiles_02`) is still registered but no longer referenced;
  drop it from `MATERIALS` (and the source maps) if you want to trim deploy size.
- **Next candidates:** add 1–2 more CC0 sets (e.g. `concrete`/`wood`) so buildings
  aren't all the same marble; ground/terrain material for the green island discs;
  consider an `*_puresky` HDRI as the actual sky.

## Gotchas
- KTX2 needs `public/basis/` present and `useKTX2(…, '/basis/')` (we self-host;
  don't rely on the drei CDN default in production).
- Normal maps: use the **GL** variant (`nor_gl`), not DirectX (`nor_dx`).
- Encoding is **macOS** here (toktx auto-download targets Darwin); on other OSes
  install KTX-Software and ensure `toktx` is on PATH.
- Source `.jpg`/`.png` are inputs only — the app references `.ktx2`.
