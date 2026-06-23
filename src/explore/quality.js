/* ------------------------------------------------------------------
 * Quality tier for the 3D world: 'high' (full fidelity) or 'low' (reduced for
 * weak GPUs — fewer dynamic lights, lighter/!no shadows, flat clouds, no HDRI
 * IBL, dpr 1, no MSAA). Picked ONCE per page load and cached, so it's stable
 * across the whole session (no mid-scene remounts).
 *
 * Resolution order:
 *   1. ?quality=low / ?quality=high  — manual override (used for testing on a
 *      strong machine; also what a forced-software-WebGL run resolves to).
 *   2. Auto-detection — touch devices, software/Intel GPUs, or low core+memory
 *      machines get 'low'; everything else 'high'.
 *
 * Strong GPUs (Apple Silicon, discrete NVIDIA/AMD) stay 'high', so the dev's
 * MacBook is unaffected. The chosen tier + the signals behind it are logged to
 * the console so it's clear WHY a device landed where it did.
 * ------------------------------------------------------------------ */

// Inspect the GPU's unmasked renderer string. Returns { renderer, weak }.
function detectGPU() {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    if (!gl) return { renderer: 'none', weak: true } // no WebGL at all → weakest case
    const dbg = gl.getExtension('WEBGL_debug_renderer_info')
    const renderer = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : ''
    const r = String(renderer).toLowerCase()
    // Software rasterizers and Intel integrated GPUs are the ones that struggle
    // with this scene. Apple/NVIDIA/AMD/Adreno/Mali-on-modern are treated as OK
    // (those still hit the dpr cap etc., just not the full low tier).
    const weak = /swiftshader|llvmpipe|software|microsoft basic|intel/.test(r)
    return { renderer: renderer || 'unknown', weak }
  } catch {
    return { renderer: 'error', weak: false }
  }
}

function detectTier() {
  if (typeof window === 'undefined') return { tier: 'high', signals: ['ssr'] }

  const param = new URLSearchParams(window.location.search).get('quality')
  if (param === 'low' || param === 'high') return { tier: param, signals: ['override=' + param] }

  const signals = []
  const coarse = window.matchMedia?.('(pointer: coarse)').matches
  if (coarse) signals.push('touch')

  const cores = navigator.hardwareConcurrency || 8
  const mem = navigator.deviceMemory || 8 // Chrome-only; defaults high elsewhere
  if (cores <= 4) signals.push('cores=' + cores)
  if (mem <= 4) signals.push('mem=' + mem)

  const gpu = detectGPU()
  if (gpu.weak) signals.push('gpu=' + gpu.renderer)

  // Low if: a touch device, a weak/software GPU, OR a machine that's both
  // core- and memory-constrained. Otherwise high.
  const low = coarse || gpu.weak || (cores <= 4 && mem <= 4)
  return { tier: low ? 'low' : 'high', signals }
}

let _cached = null
function resolve() {
  if (_cached) return _cached
  _cached = detectTier()
  if (typeof console !== 'undefined') {
    console.info(
      `[explore] quality tier: ${_cached.tier} (signals: ${_cached.signals.join(', ') || 'none'})`
    )
  }
  return _cached
}

// The resolved tier string ('high' | 'low') and a boolean convenience.
export const QUALITY = resolve().tier
export const isLow = QUALITY === 'low'

// Per-tier render settings, read by ExplorePage (Canvas) and Scene (lights,
// shadows, clouds, environment). One place to tune the whole low-end profile.
export const QUALITY_SETTINGS = {
  high: {
    dpr: [1, 1.5],
    antialias: true,
    shadows: 'soft', // drei <Canvas shadows> value
    shadowMapSize: 2048,
    environment: true, // HDRI image-based lighting
    volumetricClouds: true, // drei <Clouds>/<Cloud> vs a flat cloud plane
    roomLights: true, // per-room interior point lights
    tunnelLights: true, // per-tunnel point lights
  },
  low: {
    dpr: 1,
    antialias: false,
    shadows: false, // no real-time shadows — the single biggest weak-GPU win
    shadowMapSize: 1024,
    environment: false, // hemisphere + ambient only
    volumetricClouds: false,
    roomLights: false,
    tunnelLights: false,
  },
}[QUALITY]
