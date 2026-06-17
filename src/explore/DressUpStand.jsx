import { Text, Float, RoundedBox } from '@react-three/drei'
import { RigidBody, CylinderCollider } from '@react-three/rapier'
import { DRESSUP_POSITION, DRESSUP_ROTATION_Y } from './dressup'

/* Dress the Bear: a teddy bear on a boutique pedestal on the red secret island,
 * with a little clothing rack and a sign. Built from primitives (no GLB), a
 * sibling to the other game props. It's a prop — the actual dress-up game plays
 * in the HTML overlay (DressUpPanel) on walk-up, where the bear is a layered
 * SVG. A floating orb marks it interactive.
 *
 * Local space: ground at y=0; the parent group sits on the island surface and
 * is rotated so the front (+z, the bear's face) faces the arriving player. */

const FUR = '#b07a47'
const LIGHT = '#eccfa6'
const FACE = '#3a2a20'

// A simple sitting teddy made of spheres, perched on the pedestal top (y≈0.55).
function TeddyBear() {
  return (
    <group position={[0, 0.55, 0]}>
      {/* body */}
      <mesh position={[0, 0.5, 0]} scale={[1, 1.1, 1]} castShadow>
        <sphereGeometry args={[0.42, 24, 24]} />
        <meshStandardMaterial color={FUR} roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.46, 0.2]} scale={[1, 1.05, 0.7]}>
        <sphereGeometry args={[0.3, 20, 20]} />
        <meshStandardMaterial color={LIGHT} roughness={0.85} />
      </mesh>
      {/* legs/feet forward */}
      {[-0.22, 0.22].map((x) => (
        <mesh key={x} position={[x, 0.16, 0.3]} scale={[1, 0.8, 1.2]} castShadow>
          <sphereGeometry args={[0.18, 16, 16]} />
          <meshStandardMaterial color={FUR} roughness={0.8} />
        </mesh>
      ))}
      {/* arms */}
      {[-0.42, 0.42].map((x) => (
        <mesh key={x} position={[x, 0.52, 0.12]} castShadow>
          <sphereGeometry args={[0.16, 16, 16]} />
          <meshStandardMaterial color={FUR} roughness={0.8} />
        </mesh>
      ))}
      {/* head */}
      <mesh position={[0, 1.08, 0.04]} castShadow>
        <sphereGeometry args={[0.34, 24, 24]} />
        <meshStandardMaterial color={FUR} roughness={0.8} />
      </mesh>
      {/* ears */}
      {[-0.22, 0.22].map((x) => (
        <mesh key={x} position={[x, 1.34, 0]} castShadow>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial color={FUR} roughness={0.8} />
        </mesh>
      ))}
      {/* muzzle + nose + eyes */}
      <mesh position={[0, 1.0, 0.28]} scale={[1.1, 0.85, 1]}>
        <sphereGeometry args={[0.15, 18, 18]} />
        <meshStandardMaterial color={LIGHT} roughness={0.85} />
      </mesh>
      <mesh position={[0, 1.04, 0.41]}>
        <sphereGeometry args={[0.05, 12, 12]} />
        <meshStandardMaterial color={FACE} roughness={0.6} />
      </mesh>
      {[-0.13, 0.13].map((x) => (
        <mesh key={x} position={[x, 1.16, 0.3]}>
          <sphereGeometry args={[0.045, 12, 12]} />
          <meshStandardMaterial color={FACE} roughness={0.5} />
        </mesh>
      ))}
    </group>
  )
}

// A small clothing rack off to one side — a bar on two posts with a few hanging
// garments, signaling "dress-up" at a glance.
function ClothingRack() {
  const garments = [
    ['#e63946', -0.3],
    ['#4d96ff', 0],
    ['#3a7d5a', 0.3],
  ]
  return (
    <group position={[-1.9, 0, -0.1]}>
      {[-0.55, 0.55].map((x) => (
        <mesh key={x} position={[x, 0.9, 0]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 1.8, 10]} />
          <meshStandardMaterial color="#9aa0a8" metalness={0.6} roughness={0.4} />
        </mesh>
      ))}
      <mesh position={[0, 1.78, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.035, 0.035, 1.2, 10]} />
        <meshStandardMaterial color="#9aa0a8" metalness={0.6} roughness={0.4} />
      </mesh>
      {garments.map(([color, x]) => (
        <group key={x} position={[x, 1.3, 0]}>
          {/* hanger hook */}
          <mesh position={[0, 0.48, 0]}>
            <torusGeometry args={[0.05, 0.012, 8, 16, Math.PI]} />
            <meshStandardMaterial color="#9aa0a8" metalness={0.6} roughness={0.4} />
          </mesh>
          {/* garment */}
          <mesh castShadow>
            <boxGeometry args={[0.34, 0.5, 0.06]} />
            <meshStandardMaterial color={color} roughness={0.7} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

export function DressUpStand() {
  return (
    <group position={DRESSUP_POSITION} rotation={[0, DRESSUP_ROTATION_Y, 0]}>
      <RigidBody type="fixed" colliders={false}>
        {/* Pedestal */}
        <mesh position={[0, 0.28, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.72, 0.82, 0.56, 32]} />
          <meshStandardMaterial color="#d8c9a8" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.55, 0]}>
          <cylinderGeometry args={[0.78, 0.78, 0.06, 32]} />
          <meshStandardMaterial color="#e07a5f" roughness={0.6} />
        </mesh>

        <TeddyBear />
        <ClothingRack />

        {/* Sign post to the side */}
        <mesh position={[1.7, 1.0, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 2.0, 12]} />
          <meshStandardMaterial color="#8a5a2b" roughness={0.7} />
        </mesh>
        <RoundedBox args={[1.2, 0.5, 0.08]} radius={0.05} smoothness={2} position={[1.45, 2.05, 0]} castShadow>
          <meshStandardMaterial color="#e07a5f" roughness={0.55} />
        </RoundedBox>
        <Text
          position={[1.45, 2.05, 0.05]}
          font="/fonts/BebasNeue-Regular.ttf"
          fontSize={0.17}
          lineHeight={0.95}
          letterSpacing={0.04}
          textAlign="center"
          anchorX="center"
          anchorY="middle"
          color="#fff3e6"
          outlineWidth={0.006}
          outlineColor="#a8503a"
          maxWidth={1.05}
        >
          DRESS THE BEAR
        </Text>

        {/* Collider around the pedestal + bear so you can't walk through them. */}
        <CylinderCollider args={[1.0, 0.85]} position={[0, 1.0, 0]} />
      </RigidBody>

      {/* Floating interact indicator above the bear, matching the kiosks. */}
      <Float speed={3} floatIntensity={0.9} rotationIntensity={0.6}>
        <mesh position={[0, 2.5, 0]} castShadow>
          <octahedronGeometry args={[0.32, 0]} />
          <meshStandardMaterial color="#A46B44" emissive="#A46B44" emissiveIntensity={0.7} />
        </mesh>
      </Float>
    </group>
  )
}
