import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture, Float } from '@react-three/drei'
import { INTERACTABLES, interactableTitle, interactableImage } from './interactables'
import { SCREEN_CENTER_Y } from './worldLayout'
import { useExplore } from './useExplore'

/* Wall-mounted TV screens (the museum exhibits). Each is a flat framed panel
 * fixed to a museum's interior wall, facing the room center; the screen shows
 * a preview image (project shot / video thumbnail) — the real content
 * lives in the HTML overlay panel. A floating orb marks it interactive.
 *
 * No colliders: screens sit just outside the walkable boundary, so the
 * BoundaryGuard already stops the player before reaching them. */
const SCREEN_POS = [0, SCREEN_CENTER_Y, 0.13]
const SCREEN_ARGS = [4.2, 2.5]

// Screen face split in two so the texture hook is never called conditionally:
// a textured preview when the kiosk has an image, else a solid emissive panel.
function TexturedScreen({ src }) {
  const tex = useTexture(src)
  return (
    <mesh position={SCREEN_POS}>
      <planeGeometry args={SCREEN_ARGS} />
      <meshBasicMaterial map={tex} toneMapped={false} />
    </mesh>
  )
}

function ColorScreen({ color = '#cda6e6' }) {
  return (
    <mesh position={SCREEN_POS}>
      <planeGeometry args={SCREEN_ARGS} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} toneMapped={false} />
    </mesh>
  )
}

function Kiosk({ data }) {
  const img = interactableImage(data)
  return (
    <group position={data.position} rotation={[0, data.rotationY || 0, 0]}>
      {/* Framed panel mounted flush on the wall (faces local +z, into the room) */}
      <mesh position={[0, SCREEN_CENTER_Y, 0]} castShadow>
        <boxGeometry args={[4.6, 3.0, 0.22]} />
        <meshStandardMaterial color="#141414" metalness={0.3} roughness={0.6} />
      </mesh>
      {img ? <TexturedScreen src={img} /> : <ColorScreen />}

      {/* Floating interact indicator above the screen */}
      <Float speed={3} floatIntensity={0.9} rotationIntensity={0.7}>
        <mesh position={[0, SCREEN_CENTER_Y + 2.0, 0]} castShadow>
          <octahedronGeometry args={[0.32, 0]} />
          <meshStandardMaterial color="#A46B44" emissive="#A46B44" emissiveIntensity={0.7} />
        </mesh>
      </Float>
    </group>
  )
}

export function Kiosks() {
  // The NPC is a character, rendered by <Npc> — not a wall screen.
  return INTERACTABLES.filter((d) => d.type !== 'npc').map((data) => (
    <Kiosk key={data.id} data={data} />
  ))
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

    // Auto-end an open interaction once you walk away from it. Mainly matters
    // for the NPC chat (which leaves movement unlocked) — running off ends the
    // conversation so E is free for the next screen. (Full-screen panels lock
    // movement, so you can't walk away from those anyway.) A buffer past the
    // walk-up radius avoids flickering closed right at the edge.
    const active = useExplore.getState().active
    if (active?.position) {
      const da = Math.hypot(p.x - active.position[0], p.z - active.position[2])
      if (da > active.radius + 3) useExplore.getState().close()
    }

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
      setNearby(found ? { id: found.id, title: interactableTitle(found) } : null)
    }
  })

  return null
}
