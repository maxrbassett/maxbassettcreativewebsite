import * as THREE from 'three'
import {
  ISLAND_TOP_Y,
  BRIDGE_HALF_WIDTH,
  SECTION_IDS,
  TUNNEL_HEIGHT,
  wallHeight,
  doorHalfAngle,
  entranceAngle,
  BUILDING_THEME,
} from './worldLayout'

/* ------------------------------------------------------------------
 * Museum architecture: each section island is sealed into a themed building —
 * a curved wall with a single doorway (facing the hub), a domed roof, and an
 * interior accent light. Bridges become covered tunnels connecting the hub to
 * each doorway. From outside, the only opening is the entrance.
 *
 * No colliders: the code-based BoundaryGuard already confines the player to
 * the walkable zones, and walls sit just outside that boundary, so geometry
 * here is purely visual. Walls/roofs are DoubleSide so the interior reads
 * correctly from within and the shell reads from without.
 * ------------------------------------------------------------------ */

function Building({ island }) {
  const { position, radius: r, id } = island
  const H = wallHeight(r)
  const theme = BUILDING_THEME[id] || BUILDING_THEME.dev
  const door = doorHalfAngle(r)

  // CylinderGeometry places a vertex at angle θ at (r·sinθ, r·cosθ), so a world
  // direction maps to θ = π/2 − worldAngle. The wall spans [thetaStart, +Δ];
  // the complementary wedge (2·door wide) becomes the doorway, centered toward
  // the hub. Open-ended so there are no top/bottom caps.
  const phiDoor = Math.PI / 2 - entranceAngle(island)
  const thetaStart = phiDoor + door
  const thetaLength = Math.PI * 2 - 2 * door
  const domeRise = Math.min(r * 0.42, 12)
  const doorH = Math.min(TUNNEL_HEIGHT, H) // opening only as tall as the tunnel

  return (
    <group position={[position[0], ISLAND_TOP_Y, position[2]]}>
      {/* Curved wall with the doorway gap */}
      <mesh position={[0, H / 2, 0]} receiveShadow>
        <cylinderGeometry args={[r, r, H, 72, 1, true, thetaStart, thetaLength]} />
        <meshStandardMaterial color={theme.wall} side={THREE.DoubleSide} roughness={0.92} />
      </mesh>
      {/* Lintel — fills the wall above the doorway so the opening is only as
          tall as the covered tunnel, with solid wall continuing up to the dome. */}
      {H > doorH && (
        <mesh position={[0, (doorH + H) / 2, 0]} receiveShadow>
          <cylinderGeometry args={[r, r, H - doorH, 72, 1, true, phiDoor - door, 2 * door]} />
          <meshStandardMaterial color={theme.wall} side={THREE.DoubleSide} roughness={0.92} />
        </mesh>
      )}
      {/* Domed roof — top hemisphere flattened in Y to a gentle rounded ceiling */}
      <mesh position={[0, H, 0]} scale={[1, domeRise / r, 1]} receiveShadow>
        <sphereGeometry args={[r, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={theme.wall} side={THREE.DoubleSide} roughness={0.92} />
      </mesh>
      {/* Interior accent light. Range kept near the room so it doesn't wash the
          exterior; the themed color gives each museum its own mood. */}
      <pointLight
        position={[0, H * 0.82, 0]}
        color={theme.light}
        intensity={1.4}
        distance={r * 1.5}
        decay={1}
      />
    </group>
  )
}

function BridgeTunnel({ axis, cx, cz, length, to }) {
  const H = TUNNEL_HEIGHT // same height as the archway
  const hw = BRIDGE_HALF_WIDTH
  const t = 0.4 // wall/ceiling thickness
  // Match the destination building's wall color so the tunnel reads as part of it.
  const color = (BUILDING_THEME[to] || BUILDING_THEME.dev).wall
  const wallArgs = axis === 'x' ? [length, H, t] : [t, H, length]
  const ceilArgs = axis === 'x' ? [length, t, hw * 2 + t * 2] : [hw * 2 + t * 2, t, length]
  const wall1 = axis === 'x' ? [cx, H / 2, cz + hw] : [cx + hw, H / 2, cz]
  const wall2 = axis === 'x' ? [cx, H / 2, cz - hw] : [cx - hw, H / 2, cz]
  return (
    <group>
      {/* Side walls (open at both ends) + a flat ceiling over the deck */}
      <mesh position={wall1} receiveShadow>
        <boxGeometry args={wallArgs} />
        <meshStandardMaterial color={color} side={THREE.DoubleSide} roughness={0.92} />
      </mesh>
      <mesh position={wall2} receiveShadow>
        <boxGeometry args={wallArgs} />
        <meshStandardMaterial color={color} side={THREE.DoubleSide} roughness={0.92} />
      </mesh>
      <mesh position={[cx, H, cz]} receiveShadow>
        <boxGeometry args={ceilArgs} />
        <meshStandardMaterial color={color} side={THREE.DoubleSide} roughness={0.92} />
      </mesh>
      <pointLight position={[cx, H * 0.7, cz]} color="#fff0d8" intensity={0.6} distance={Math.max(length, 24)} decay={0.9} />
    </group>
  )
}

/* All museum shells + covered tunnels. Pass the shared ISLANDS / BRIDGES. */
export function Museums({ islands, bridges }) {
  return (
    <>
      {islands
        .filter((i) => SECTION_IDS.includes(i.id))
        .map((i) => <Building key={i.id} island={i} />)}
      {bridges.map((b, idx) => <BridgeTunnel key={idx} {...b} />)}
    </>
  )
}
