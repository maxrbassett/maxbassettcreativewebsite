import * as THREE from 'three'

/* ------------------------------------------------------------------
 * Background scenery: a few distant, contentless islands floating in the haze.
 * Pure decoration that makes the world feel larger than its reachable islands;
 * they sit deep in the fog so they read as soft silhouettes, not detail.
 *
 * (The themed biome props — forest/crystals/columns — were removed when the
 * islands became enclosed museums; the theme now lives in the buildings.)
 * ------------------------------------------------------------------ */
const MAT = {
  isletTop: new THREE.MeshStandardMaterial({ color: '#a9d4bf', roughness: 1 }),
  isletRock: new THREE.MeshStandardMaterial({ color: '#7d6b58', roughness: 1 }),
}

// Seeded so the scatter is stable across reloads/HMR. A ring of islets around
// the world center, varied distance/height/size, kept within the fog range so
// they fade to silhouettes rather than popping at a hard edge.
function mulberry32(a) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const ISLETS = (() => {
  const rng = mulberry32(20260603)
  const cx = 0
  const cz = 55 // rough center of the playable area
  return Array.from({ length: 22 }, () => {
    const ang = rng() * Math.PI * 2
    const dist = 120 + rng() * 175 // 120–295: past the islands, inside the fog
    return {
      position: [cx + Math.cos(ang) * dist, -14 + rng() * 30, cz + Math.sin(ang) * dist],
      radius: 4 + rng() * 7,
    }
  })
})()

function Islet({ position, radius }) {
  return (
    <group position={position}>
      <mesh material={MAT.isletTop}>
        <cylinderGeometry args={[radius, radius, 1, 16]} />
      </mesh>
      <mesh material={MAT.isletRock} position={[0, -radius * 0.5, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[radius - 0.4, radius * 1.1, 16]} />
      </mesh>
    </group>
  )
}

export function WorldDecor() {
  return ISLETS.map((it, i) => <Islet key={`islet${i}`} {...it} />)
}
