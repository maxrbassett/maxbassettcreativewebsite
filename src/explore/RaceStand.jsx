import { Text, Float, RoundedBox } from '@react-three/drei'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
import { RACING_POSITION, RACING_ROTATION_Y } from './racing'

/* Grand Prix: a little red hot rod beneath a checkered start/finish arch on the
 * gold secret island, with a sign. Built from primitives (no GLB), a sibling to
 * the other game props. It's a prop — the actual top-down race plays in the HTML
 * overlay (RacingPanel) on walk-up. A floating orb marks it interactive.
 *
 * Local space: ground at y=0; the parent group sits on the island surface and
 * is rotated so the front (+z, the car's nose + arch) faces the arriving player. */

const CAR = '#e63946' // hot-rod red
const GOLD = '#e6b13e'

// A low cartoon hot rod pointing +z (forward).
function HotRod() {
  const wheel = (x, z) => (
    <mesh key={`${x}-${z}`} position={[x, 0.24, z]} rotation={[0, 0, Math.PI / 2]} castShadow>
      <cylinderGeometry args={[0.24, 0.24, 0.18, 16]} />
      <meshStandardMaterial color="#15151a" roughness={0.7} />
    </mesh>
  )
  return (
    <group position={[0, 0, 0]}>
      {wheel(-0.5, 0.6)}
      {wheel(0.5, 0.6)}
      {wheel(-0.5, -0.6)}
      {wheel(0.5, -0.6)}
      {/* chassis */}
      <RoundedBox args={[1.0, 0.34, 2.1]} radius={0.12} smoothness={3} position={[0, 0.42, 0]} castShadow>
        <meshStandardMaterial color={CAR} roughness={0.45} metalness={0.1} />
      </RoundedBox>
      {/* cabin */}
      <RoundedBox args={[0.74, 0.34, 0.86]} radius={0.1} smoothness={3} position={[0, 0.7, -0.12]} castShadow>
        <meshStandardMaterial color="#b3242f" roughness={0.45} />
      </RoundedBox>
      {/* windshield */}
      <mesh position={[0, 0.72, 0.32]} rotation={[-0.5, 0, 0]}>
        <boxGeometry args={[0.62, 0.26, 0.04]} />
        <meshStandardMaterial color="#bfe6ff" roughness={0.1} metalness={0.2} opacity={0.8} transparent />
      </mesh>
      {/* rear spoiler */}
      <mesh position={[0, 0.74, -1.0]} castShadow>
        <boxGeometry args={[0.9, 0.04, 0.22]} />
        <meshStandardMaterial color="#15151a" roughness={0.6} />
      </mesh>
      {[-0.36, 0.36].map((x) => (
        <mesh key={x} position={[x, 0.6, -1.0]}>
          <boxGeometry args={[0.05, 0.28, 0.05]} />
          <meshStandardMaterial color="#15151a" />
        </mesh>
      ))}
      {/* headlights */}
      {[-0.3, 0.3].map((x) => (
        <mesh key={x} position={[x, 0.42, 1.04]}>
          <sphereGeometry args={[0.08, 12, 12]} />
          <meshStandardMaterial color="#fff7d6" emissive="#fff2b0" emissiveIntensity={0.6} toneMapped={false} />
        </mesh>
      ))}
    </group>
  )
}

// Checkered banner across the arch — a row of alternating black/white squares.
function CheckerBanner({ width, y }) {
  const cols = 14
  const sq = width / cols
  const squares = []
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < 2; r++) {
      squares.push(
        <mesh key={`${c}-${r}`} position={[-width / 2 + (c + 0.5) * sq, y - 0.1 + r * 0.2, 0.06]}>
          <planeGeometry args={[sq * 0.98, 0.2]} />
          <meshStandardMaterial color={(c + r) % 2 ? '#f4f4f4' : '#15151a'} />
        </mesh>
      )
    }
  }
  return <group>{squares}</group>
}

export function RaceStand() {
  const span = 3.4 // arch width
  const postH = 2.8
  const half = span / 2
  return (
    <group position={RACING_POSITION} rotation={[0, RACING_ROTATION_Y, 0]}>
      <RigidBody type="fixed" colliders={false}>
        {/* Start/finish arch */}
        {[-half, half].map((x) => (
          <mesh key={x} position={[x, postH / 2, 0]} castShadow>
            <cylinderGeometry args={[0.14, 0.16, postH, 16]} />
            <meshStandardMaterial color={GOLD} roughness={0.5} metalness={0.2} />
          </mesh>
        ))}
        <RoundedBox args={[span + 0.3, 0.5, 0.12]} radius={0.05} smoothness={3} position={[0, postH + 0.05, 0]} castShadow>
          <meshStandardMaterial color={GOLD} roughness={0.5} metalness={0.2} />
        </RoundedBox>
        <CheckerBanner width={span} y={postH + 0.05} />

        <HotRod />

        {/* Sign post to the side */}
        <mesh position={[half + 0.6, 1.0, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 2.0, 12]} />
          <meshStandardMaterial color="#8a6a2b" roughness={0.7} />
        </mesh>
        <RoundedBox args={[1.3, 0.5, 0.08]} radius={0.05} smoothness={2} position={[half + 0.35, 2.05, 0]} castShadow>
          <meshStandardMaterial color={GOLD} roughness={0.5} />
        </RoundedBox>
        <Text
          position={[half + 0.35, 2.05, 0.05]}
          font="/fonts/BebasNeue-Regular.ttf"
          fontSize={0.22}
          letterSpacing={0.05}
          anchorX="center"
          anchorY="middle"
          color="#3a2a10"
          maxWidth={1.15}
        >
          GRAND PRIX
        </Text>

        {/* Collider on the car so you bump it rather than walking through. */}
        <CuboidCollider args={[0.6, 0.5, 1.1]} position={[0, 0.5, 0]} />
      </RigidBody>

      {/* Floating interact indicator above the arch, matching the kiosks. */}
      <Float speed={3} floatIntensity={0.9} rotationIntensity={0.6}>
        <mesh position={[0, postH + 0.9, 0]} castShadow>
          <octahedronGeometry args={[0.32, 0]} />
          <meshStandardMaterial color="#A46B44" emissive="#A46B44" emissiveIntensity={0.7} />
        </mesh>
      </Float>
    </group>
  )
}
