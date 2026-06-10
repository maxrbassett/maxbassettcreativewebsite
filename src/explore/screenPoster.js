import * as THREE from 'three'
import { makePosterCanvas, makePosterDataURL } from '../lib/poster'

/* Three.js wrapper around the shared (canvas-only) poster generator in
 * lib/poster.js. Keeping the canvas code three-free means the main site can
 * import the same posters without pulling three.js into its bundle. */

// In-world TV screen texture.
export function makePosterTexture(opts) {
  const tex = new THREE.CanvasTexture(makePosterCanvas(opts))
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  tex.needsUpdate = true
  return tex
}

// Re-export so existing explore imports (InteractionOverlay) keep working.
export { makePosterDataURL }
