import { useMemo } from 'react'
import { useKTX2 } from '@react-three/drei'
import * as THREE from 'three'

/* ------------------------------------------------------------------
 * Material library for the realistic art pass.
 *
 * Textures are CC0 PBR (Poly Haven), encoded to KTX2/Basis — they download ~3x
 * smaller than JPG and stay GPU-compressed in VRAM. Sources + .ktx2 live under
 * public/textures/<set>/ (loaded only on /explore, never in the JS bundle).
 * Re-encode with scripts/encode-textures.sh. See EXPLORE_TEXTURES.md.
 *
 * Strategy: a SMALL set of reusable materials, each tiled per-surface and tinted
 * with the mesh's material.color — so many buildings share a few texture sets
 * instead of shipping unique textures per surface.
 * ------------------------------------------------------------------ */

// Self-hosted Basis transcoder (public/basis/), so KTX2 decode needs no CDN.
const BASIS_PATH = '/basis/'

// name -> KTX2 map URLs. Add new CC0 sets here after encoding them.
export const MATERIALS = {
  stone: {
    map: '/textures/stone_tiles_02/diff_1k.ktx2',
    normalMap: '/textures/stone_tiles_02/nor_gl_1k.ktx2',
    roughnessMap: '/textures/stone_tiles_02/rough_1k.ktx2',
  },
  marble: {
    map: '/textures/marble_01/diff_1k.ktx2',
    normalMap: '/textures/marble_01/nor_gl_1k.ktx2',
    roughnessMap: '/textures/marble_01/rough_1k.ktx2',
  },
  grass: {
    map: '/textures/grass_medium_01/diff_1k.ktx2',
    normalMap: '/textures/grass_medium_01/nor_gl_1k.ktx2',
    roughnessMap: '/textures/grass_medium_01/rough_1k.ktx2',
  },
  dirt: {
    map: '/textures/dirt_floor/diff_1k.ktx2',
    normalMap: '/textures/dirt_floor/nor_gl_1k.ktx2',
    roughnessMap: '/textures/dirt_floor/rough_1k.ktx2',
  },
}

export const STONE_TILE = 6 // world units per texture repeat (smaller = more visible detail)
export const STONE_NORMAL_SCALE = 1.15 // normal-map relief strength (too high amplifies compression speckle)
export const GROUND_TILE = 7 // world units per repeat for grass/dirt ground

// Marble is polished and smooth: a larger repeat so the veining reads as big
// slabs (not busy tiles), and a gentle normal scale so it looks flat/polished
// rather than rough stone.
export const MARBLE_TILE = 9
export const MARBLE_NORMAL_SCALE = 0.4

// Clone the shared maps into an independent, tiling set at the given repeat
// (each surface needs its own clone so repeats don't collide on shared textures).
function configureSet(base, rx, ry) {
  const out = {}
  for (const k of Object.keys(base)) {
    const t = base[k].clone()
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(rx, ry)
    t.anisotropy = 8
    if (k === 'map') t.colorSpace = THREE.SRGBColorSpace
    t.needsUpdate = true
    out[k] = t
  }
  return out
}

// Configured sets are cached by (material, tiling) and SHARED across every
// surface that uses the same tiling — so we upload each variant to the GPU once
// instead of cloning it per mesh (many surfaces reuse the same repeat). This was
// a real VRAM sink on mobile: ~45 marble clones collapse to a handful.
const setCache = new Map()

// Hook: load a named material's KTX2 maps (cached/shared by drei) and return a
// configured set tiling at (rx, ry).
export function useMaterialSet(name, rx = 1, ry = 1) {
  const base = useKTX2(MATERIALS[name], BASIS_PATH)
  return useMemo(() => {
    const key = `${name}|${rx}|${ry}`
    let set = setCache.get(key)
    if (!set) {
      set = configureSet(base, rx, ry)
      setCache.set(key, set)
    }
    return set
  }, [base, name, rx, ry])
}

// Back-compat convenience for the stone set.
export const useStoneSet = (rx, ry) => useMaterialSet('stone', rx, ry)

// Marble set — used for the building shells, interior walls, and archways.
export const useMarbleSet = (rx, ry) => useMaterialSet('marble', rx, ry)

// NOTE: do NOT useKTX2.preload here — preload has no renderer, so it primes the
// KTX2Loader without detectSupport(gl) and the real load then throws
// "Missing initialization with .detectSupport(renderer)". useKTX2 (below, inside
// the Canvas) calls detectSupport itself, so loading is handled there.
