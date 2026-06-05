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
// Screen dimensions: horizontal (16:9) by default, vertical (9:16) for social
// shorts. [screen plane, frame box, frame height].
const HORIZONTAL = { screen: [4.2, 2.5], frame: [4.6, 3.0, 0.22], frameH: 3.0 }
const VERTICAL = { screen: [2.4, 4.27], frame: [2.7, 4.6, 0.22], frameH: 4.6 }
const SCREEN_Z = 0.13

// Screen face split in two so the texture hook is never called conditionally:
// a textured preview when the kiosk has an image, else a solid emissive panel.
// `crop` (<1) center-crops the texture's width — used for vertical screens so the
// hqdefault thumbnail fills a portrait panel (emulates the site's object-fit:cover).
function TexturedScreen({ src, args, crop }) {
  const tex = useTexture(src)
  if (crop) {
    tex.center.set(0.5, 0.5)
    tex.repeat.set(crop, 1)
  }
  return (
    <mesh position={[0, SCREEN_CENTER_Y, SCREEN_Z]}>
      <planeGeometry args={args} />
      <meshBasicMaterial map={tex} toneMapped={false} />
    </mesh>
  )
}

function ColorScreen({ color = '#cda6e6', args }) {
  return (
    <mesh position={[0, SCREEN_CENTER_Y, SCREEN_Z]}>
      <planeGeometry args={args} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} toneMapped={false} />
    </mesh>
  )
}

function Kiosk({ data }) {
  const img = interactableImage(data)
  const dims = data.vertical ? VERTICAL : HORIZONTAL
  // Cover-crop the 4:3 hqdefault thumbnail to the portrait panel's aspect
  // (matches the main site's object-fit: cover on its vertical cards).
  const crop = data.vertical ? (dims.screen[0] / dims.screen[1]) / (4 / 3) : null
  const orbY = SCREEN_CENTER_Y + dims.frameH / 2 + 0.7 // just above the frame
  return (
    <group position={data.position} rotation={[0, data.rotationY || 0, 0]}>
      {/* Framed panel mounted flush on the wall (faces local +z, into the room) */}
      <mesh position={[0, SCREEN_CENTER_Y, 0]} castShadow>
        <boxGeometry args={dims.frame} />
        <meshStandardMaterial color="#141414" metalness={0.3} roughness={0.6} />
      </mesh>
      {img ? <TexturedScreen src={img} args={dims.screen} crop={crop} /> : <ColorScreen args={dims.screen} />}

      {/* Floating interact indicator above the screen */}
      <Float speed={3} floatIntensity={0.9} rotationIntensity={0.7}>
        <mesh position={[0, orbY, 0]} castShadow>
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
