import { Text, Float, RoundedBox } from '@react-three/drei'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
import * as THREE from 'three'
import { GlassMaterial } from './Architecture'
import { MATCHING_GAMES } from './matching'

/* Memory Match cabinets: chunky arcade machines on the secret game islands,
 * built from primitives (no GLB), siblings to the Treat-O-Matic. Each is a prop
 * — the card-matching game itself plays in the HTML overlay (MatchingGamePanel)
 * on walk-up. Colors come from each game's config so the cabinet matches its
 * island and its overlay. A floating orb marks it interactive.
 *
 * Local space: base at y=0; the parent group sits on the island surface and is
 * rotated so the front (+z) faces the island center. */

const W = 1.7 // cabinet width
const D = 1.1 // depth
const TRIM = '#f7f3ee' // cream bezel (shared)
const SCREEN_Y = 1.92 // center of the screen on the upper cabinet
const FRONT_Z = D / 2 // shared front face

// A 4×4 grid of glowing "card back" tiles on the screen, so the cabinet reads
// as a matching game from across the island.
const TILE_COLS = 4
const TILE_ROWS = 4
const SCREEN_W = W * 0.7
const SCREEN_H = 1.12

function ScreenTiles({ tile, glow }) {
  const tiles = []
  const cw = SCREEN_W / TILE_COLS
  const ch = SCREEN_H / TILE_ROWS
  for (let r = 0; r < TILE_ROWS; r++) {
    for (let c = 0; c < TILE_COLS; c++) {
      const x = -SCREEN_W / 2 + (c + 0.5) * cw
      const y = SCREEN_Y + SCREEN_H / 2 - (r + 0.5) * ch
      tiles.push(
        <mesh key={`${r}-${c}`} position={[x, y, FRONT_Z + 0.005]}>
          <planeGeometry args={[cw * 0.8, ch * 0.8]} />
          <meshStandardMaterial color={tile} emissive={glow} emissiveIntensity={0.6} toneMapped={false} />
        </mesh>
      )
    }
  }
  return <group>{tiles}</group>
}

function ControlPanel() {
  // A slanted panel jutting from the front at waist height, with a little
  // joystick and two arcade buttons.
  const y = 1.06
  const z = FRONT_Z + 0.18
  return (
    <group position={[0, y, z]} rotation={[-Math.PI / 6, 0, 0]}>
      <RoundedBox args={[W * 0.92, 0.12, 0.62]} radius={0.04} smoothness={2} castShadow>
        <meshStandardMaterial color="#1f1f24" roughness={0.6} />
      </RoundedBox>
      {/* joystick */}
      <mesh position={[-W * 0.26, 0.16, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.26, 12]} />
        <meshStandardMaterial color="#111" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[-W * 0.26, 0.3, 0]}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshStandardMaterial color="#e63946" roughness={0.4} />
      </mesh>
      {/* two buttons */}
      {[
        ['#ffd166', W * 0.12],
        ['#4d96ff', W * 0.3],
      ].map(([col, bx], i) => (
        <mesh key={i} position={[bx, 0.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.06, 20]} />
          <meshStandardMaterial color={col} emissive={col} emissiveIntensity={0.5} toneMapped={false} />
        </mesh>
      ))}
    </group>
  )
}

function MatchingCabinet({ game }) {
  return (
    <group position={game.position} rotation={[0, game.rotationY, 0]}>
      <RigidBody type="fixed" colliders={false}>
        {/* Lower cabinet */}
        <RoundedBox args={[W, 1.0, D]} radius={0.06} smoothness={3} position={[0, 0.5, 0]} castShadow receiveShadow>
          <meshStandardMaterial color={game.body} roughness={0.55} />
        </RoundedBox>
        {/* Upper cabinet (holds the screen) */}
        <RoundedBox args={[W, 1.5, D * 0.9]} radius={0.06} smoothness={3} position={[0, 1.75, 0]} castShadow receiveShadow>
          <meshStandardMaterial color={game.body} roughness={0.55} />
        </RoundedBox>

        {/* Cream bezel + dark screen + glowing card-back grid under glass */}
        <mesh position={[0, SCREEN_Y, FRONT_Z - 0.005]}>
          <boxGeometry args={[SCREEN_W + 0.22, SCREEN_H + 0.22, 0.06]} />
          <meshStandardMaterial color={TRIM} roughness={0.7} />
        </mesh>
        <mesh position={[0, SCREEN_Y, FRONT_Z - 0.01]}>
          <boxGeometry args={[SCREEN_W + 0.06, SCREEN_H + 0.06, 0.04]} />
          <meshStandardMaterial color="#0f1814" roughness={0.9} />
        </mesh>
        <ScreenTiles tile={game.tile} glow={game.glow} />
        <mesh position={[0, SCREEN_Y, FRONT_Z + 0.03]}>
          <planeGeometry args={[SCREEN_W + 0.04, SCREEN_H + 0.04]} />
          <GlassMaterial color={game.glass} opacity={0.16} side={THREE.FrontSide} />
        </mesh>

        <ControlPanel />

        {/* Glowing marquee on top */}
        <RoundedBox args={[W * 0.98, 0.46, D * 0.6]} radius={0.05} smoothness={3} position={[0, 2.62, 0]} castShadow>
          <meshStandardMaterial color={game.deep} roughness={0.5} />
        </RoundedBox>
        <Text
          position={[0, 2.62, D * 0.3 + 0.01]}
          font="/fonts/BebasNeue-Regular.ttf"
          fontSize={0.3}
          letterSpacing={0.07}
          anchorX="center"
          anchorY="middle"
          color="#fff3b0"
          outlineWidth={0.011}
          outlineColor={game.deep}
        >
          {game.marquee}
        </Text>

        {/* Stubby base feet */}
        {[-W / 2 + 0.18, W / 2 - 0.18].map((x) =>
          [-D / 2 + 0.18, D / 2 - 0.18].map((z) => (
            <mesh key={`${x}-${z}`} position={[x, 0.06, z]}>
              <cylinderGeometry args={[0.1, 0.1, 0.12, 12]} />
              <meshStandardMaterial color={game.deep} roughness={0.6} metalness={0.4} />
            </mesh>
          ))
        )}

        {/* Solid body collider so you bump into the cabinet. */}
        <CuboidCollider args={[W / 2, 1.25, D / 2]} position={[0, 1.25, 0]} />
      </RigidBody>

      {/* Floating interact indicator above the marquee, matching the kiosks. */}
      <Float speed={3} floatIntensity={0.9} rotationIntensity={0.6}>
        <mesh position={[0, 3.45, 0]} castShadow>
          <octahedronGeometry args={[0.32, 0]} />
          <meshStandardMaterial color="#A46B44" emissive="#A46B44" emissiveIntensity={0.7} />
        </mesh>
      </Float>
    </group>
  )
}

export function MatchingGames() {
  return MATCHING_GAMES.map((game) => <MatchingCabinet key={game.id} game={game} />)
}
