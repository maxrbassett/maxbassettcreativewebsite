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

const ISLETS = [
  { position: [128, -3, 18], radius: 9 },
  { position: [-118, 7, 150], radius: 7 },
  { position: [44, 11, -96], radius: 11 },
  { position: [150, -5, 128], radius: 8 },
  { position: [-86, -8, -52], radius: 6 },
  { position: [-150, 2, 40], radius: 10 },
]

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
