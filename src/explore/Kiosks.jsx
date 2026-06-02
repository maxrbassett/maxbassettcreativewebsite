import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture, Float } from '@react-three/drei'
import { RigidBody } from '@react-three/rapier'
import { INTERACTABLES } from './interactables'
import { useExplore } from './useExplore'

/* A gray-box "monitor on a stand" kiosk. The screen shows the project
 * screenshot as a preview (a thumbnail, not the real content — that lives in
 * the HTML overlay panel). A floating orb marks it as interactive. */
function Kiosk({ data }) {
  const screenTex = useTexture(data.project.image)

  return (
    <group position={data.position}>
      <RigidBody type="fixed" colliders="cuboid">
        {/* base */}
        <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.8, 0.2, 1.2]} />
          <meshStandardMaterial color="#2a2a2a" />
        </mesh>
        {/* stand */}
        <mesh position={[0, 1.0, 0]} castShadow>
          <boxGeometry args={[0.5, 1.8, 0.5]} />
          <meshStandardMaterial color="#3a3a3a" />
        </mesh>
        {/* monitor frame */}
        <mesh position={[0, 2.8, 0]} castShadow>
          <boxGeometry args={[4.4, 2.8, 0.25]} />
          <meshStandardMaterial color="#161616" />
        </mesh>
      </RigidBody>

      {/* Screen preview — faces +z, toward a player approaching from spawn */}
      <mesh position={[0, 2.8, 0.14]}>
        <planeGeometry args={[4.0, 2.35]} />
        <meshBasicMaterial map={screenTex} toneMapped={false} />
      </mesh>

      {/* Floating interact indicator */}
      <Float speed={3} floatIntensity={1.2} rotationIntensity={0.8}>
        <mesh position={[0, 5.2, 0]} castShadow>
          <octahedronGeometry args={[0.4, 0]} />
          <meshStandardMaterial color="#F05A1A" emissive="#F05A1A" emissiveIntensity={0.7} />
        </mesh>
      </Float>
    </group>
  )
}

export function Kiosks() {
  return INTERACTABLES.map((data) => <Kiosk key={data.id} data={data} />)
}

/* Per-frame distance check from the character to each interactable. Sets
 * the closest in-range one as `nearby` (or null). Only writes to the store
 * when the result changes, to avoid a setState every frame. */
export function ProximityDetector({ bodyRef }) {
  const setNearby = useExplore((s) => s.setNearby)
  const lastId = useRef(undefined)

  useFrame(() => {
    const body = bodyRef.current?.group
    if (!body) return
    const p = body.translation()

    let found = null
    let best = Infinity
    for (const it of INTERACTABLES) {
      const d = Math.hypot(p.x - it.position[0], p.z - it.position[2])
      if (d < it.radius && d < best) {
        best = d
        found = it
      }
    }

    const id = found ? found.id : null
    if (id !== lastId.current) {
      lastId.current = id
      setNearby(found ? { id: found.id, title: found.project.title } : null)
    }
  })

  return null
}
