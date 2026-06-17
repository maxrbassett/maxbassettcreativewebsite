import { Text, Float, RoundedBox } from '@react-three/drei'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
import * as THREE from 'three'
import { GlassMaterial } from './Architecture'
import { VENDING_POSITION, VENDING_ROTATION_Y } from './vending'

/* The Treat-O-Matic: a chunky candy-red vending machine standing on the blue
 * secret island. Built entirely from primitives (no GLB) so it's cheap and
 * needs no art assets. It's a prop — the actual giveaway game plays in the HTML
 * overlay (InteractionOverlay's VendingMachinePanel) on walk-up. A floating orb
 * marks it interactive, matching the museum kiosks.
 *
 * Front layout (local space, base at y=0): a glass display window on the LEFT
 * showing stocked shelves, and a separate control strip on the RIGHT with the
 * selection buttons + coin slot — kept in their own lanes so nothing overlaps.
 * The parent group sits on the island surface, rotated so the front (+z) faces
 * the hub / the arriving player. */

const W = 1.7 // width
const H = 3.0 // body height
const D = 1.0 // depth
const BODY = '#e63946' // candy red
const TRIM = '#f7f3ee' // cream trim
const FRONT = D / 2 // body front plane (z)

// Display window (left lane).
const WIN_X = -0.24
const WIN_W = 1.0
const WIN_Y = 1.9
const WIN_H = 1.72
// Control strip (right lane) — clears the window's right edge.
const CTRL_X = 0.58
const CTRL_W = 0.4

// Bright "treats" stocked behind the glass — colorful gumballs (spheres) and
// candy boxes on three shelves. Deterministic so it never reflows.
const SHELF_COLORS = ['#ffd166', '#06d6a0', '#4d96ff', '#ff66c4', '#ff9f1c', '#c77dff']
const SHELVES = [2.18, 1.62, 1.06] // shelf surface heights (local Y), inside the window
const PER_SHELF = 5
const ITEM_Z = FRONT - 0.32 // sits between the dark backing and the glass

function StockedShelves() {
  const items = []
  const spread = WIN_W * 0.68
  SHELVES.forEach((y, s) => {
    for (let i = 0; i < PER_SHELF; i++) {
      const x = WIN_X - spread / 2 + (i / (PER_SHELF - 1)) * spread
      const color = SHELF_COLORS[(s * PER_SHELF + i) % SHELF_COLORS.length]
      const sphere = (s + i) % 2 === 0
      items.push(
        sphere ? (
          <mesh key={`${s}-${i}`} position={[x, y + 0.13, ITEM_Z]} castShadow>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshStandardMaterial color={color} roughness={0.35} />
          </mesh>
        ) : (
          <mesh key={`${s}-${i}`} position={[x, y + 0.11, ITEM_Z]} castShadow>
            <boxGeometry args={[0.2, 0.22, 0.18]} />
            <meshStandardMaterial color={color} roughness={0.5} />
          </mesh>
        )
      )
    }
    items.push(
      <mesh key={`board-${s}`} position={[WIN_X, y, ITEM_Z]}>
        <boxGeometry args={[WIN_W * 0.9, 0.04, 0.36]} />
        <meshStandardMaterial color="#d8d2c8" roughness={0.8} />
      </mesh>
    )
  })
  return <group>{items}</group>
}

// Cream frame around the glass window — four thin bars (not a solid panel, so
// the treats stay visible), sitting just proud of the body front.
function WindowFrame() {
  const t = 0.09 // bar thickness
  const zf = FRONT + 0.02
  const halfW = WIN_W / 2
  const halfH = WIN_H / 2
  const bar = (args, pos) => (
    <mesh position={pos}>
      <boxGeometry args={args} />
      <meshStandardMaterial color={TRIM} roughness={0.7} />
    </mesh>
  )
  return (
    <group>
      {bar([WIN_W + 2 * t, t, 0.05], [WIN_X, WIN_Y + halfH + t / 2, zf])}
      {bar([WIN_W + 2 * t, t, 0.05], [WIN_X, WIN_Y - halfH - t / 2, zf])}
      {bar([t, WIN_H + 2 * t, 0.05], [WIN_X - halfW - t / 2, WIN_Y, zf])}
      {bar([t, WIN_H + 2 * t, 0.05], [WIN_X + halfW + t / 2, WIN_Y, zf])}
    </group>
  )
}

function ControlPanel() {
  const z = FRONT // mounted on the body front
  const buttons = [2.2, 1.85, 1.5, 1.15, 0.8]
  return (
    <group>
      {/* recessed dark column */}
      <mesh position={[CTRL_X, 1.55, z]}>
        <boxGeometry args={[CTRL_W, 1.9, 0.06]} />
        <meshStandardMaterial color="#1b1b1f" roughness={0.6} metalness={0.3} />
      </mesh>
      {/* selection buttons, sitting proud of the column face */}
      {buttons.map((by, i) => (
        <mesh key={i} position={[CTRL_X, by, z + 0.06]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 0.05, 20]} />
          <meshStandardMaterial
            color={SHELF_COLORS[i % SHELF_COLORS.length]}
            emissive={SHELF_COLORS[i % SHELF_COLORS.length]}
            emissiveIntensity={0.6}
            toneMapped={false}
          />
        </mesh>
      ))}
      {/* coin slot */}
      <mesh position={[CTRL_X, 0.55, z + 0.05]}>
        <boxGeometry args={[0.16, 0.05, 0.04]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.6} roughness={0.4} />
      </mesh>
    </group>
  )
}

export function VendingMachine() {
  return (
    <group position={VENDING_POSITION} rotation={[0, VENDING_ROTATION_Y, 0]}>
      <RigidBody type="fixed" colliders={false}>
        {/* Main body */}
        <RoundedBox args={[W, H, D]} radius={0.08} smoothness={3} position={[0, H / 2, 0]} castShadow receiveShadow>
          <meshStandardMaterial color={BODY} roughness={0.55} metalness={0.05} />
        </RoundedBox>

        {/* Recessed dark interior behind the glass so the treats pop */}
        <mesh position={[WIN_X, WIN_Y, FRONT - 0.42]}>
          <boxGeometry args={[WIN_W, WIN_H, 0.02]} />
          <meshStandardMaterial color="#14141a" roughness={0.9} />
        </mesh>

        <StockedShelves />

        {/* Glass over the goods (just behind the cream frame's front rim) */}
        <mesh position={[WIN_X, WIN_Y, FRONT]}>
          <planeGeometry args={[WIN_W, WIN_H]} />
          <GlassMaterial color="#eaf6ff" opacity={0.22} side={THREE.FrontSide} />
        </mesh>
        <WindowFrame />

        <ControlPanel />

        {/* Dispense tray — a recessed opening near the bottom with a glass flap,
            in its own lane left of the control strip (no overlap). */}
        <mesh position={[-0.1, 0.42, FRONT - 0.08]}>
          <boxGeometry args={[0.8, 0.4, 0.14]} />
          <meshStandardMaterial color="#101013" roughness={0.95} />
        </mesh>
        <mesh position={[-0.1, 0.42, FRONT + 0.015]}>
          <boxGeometry args={[0.84, 0.44, 0.03]} />
          <GlassMaterial color="#aee" opacity={0.18} side={THREE.FrontSide} />
        </mesh>

        {/* Glowing marquee on top */}
        <RoundedBox args={[W * 0.98, 0.5, D * 0.7]} radius={0.06} smoothness={3} position={[0, H + 0.12, 0]} castShadow>
          <meshStandardMaterial color="#2b2b33" roughness={0.5} />
        </RoundedBox>
        <Text
          position={[0, H + 0.12, D * 0.35 + 0.01]}
          font="/fonts/BebasNeue-Regular.ttf"
          fontSize={0.34}
          letterSpacing={0.08}
          anchorX="center"
          anchorY="middle"
          color="#fff3b0"
          outlineWidth={0.012}
          outlineColor="#e63946"
        >
          TREAT-O-MATIC
        </Text>

        {/* Stubby base feet */}
        {[-W / 2 + 0.18, W / 2 - 0.18].map((x) =>
          [-D / 2 + 0.18, D / 2 - 0.18].map((z) => (
            <mesh key={`${x}-${z}`} position={[x, 0.06, z]}>
              <cylinderGeometry args={[0.1, 0.1, 0.12, 12]} />
              <meshStandardMaterial color="#1b1b1f" roughness={0.6} metalness={0.4} />
            </mesh>
          ))
        )}

        {/* Solid body collider so you bump into the machine instead of walking
            through it. Sized to the body (the marquee overhang doesn't matter). */}
        <CuboidCollider args={[W / 2, H / 2, D / 2]} position={[0, H / 2, 0]} />
      </RigidBody>

      {/* Floating interact indicator above the marquee, matching the kiosks. */}
      <Float speed={3} floatIntensity={0.9} rotationIntensity={0.6}>
        <mesh position={[0, H + 1.0, 0]} castShadow>
          <octahedronGeometry args={[0.32, 0]} />
          <meshStandardMaterial color="#A46B44" emissive="#A46B44" emissiveIntensity={0.7} />
        </mesh>
      </Float>
    </group>
  )
}
