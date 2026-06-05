import * as THREE from 'three'
import { Text } from '@react-three/drei'
import {
  ISLAND_TOP_Y,
  BRIDGE_HALF_WIDTH,
  SECTION_IDS,
  TUNNEL_HEIGHT,
  wallHeight,
  doorHalfAngle,
  entranceAngle,
  BUILDING_THEME,
  BUILDING_ROOMS,
  PARTITION_THICKNESS,
  partitionWalls,
  roomHeaderAnchor,
  roomCenter,
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

/* Interior partition walls that carve a building into walled-off rooms. Each
 * wall is a flat box along its radial segment(s) (split around a doorway gap),
 * with a lintel filling the gap above doorway height so it reads as a door.
 * Geometry comes from worldLayout's partitionWalls() (shared with collision). */
function PartitionWalls({ island }) {
  const { id, radius: r } = island
  const [cx, , cz] = island.position
  const theme = BUILDING_THEME[id] || BUILDING_THEME.dev
  const H = wallHeight(r)
  const doorH = Math.min(TUNNEL_HEIGHT, H)
  const walls = partitionWalls(id)
  return (
    <group position={[cx, ISLAND_TOP_Y, cz]}>
      {walls.flatMap((w, wi) => {
        const meshes = w.segments.map((s, si) => {
          const dx = s.bx - s.ax
          const dz = s.bz - s.az
          const len = Math.hypot(dx, dz)
          // Box's local +X aligns to world direction α via rotationY = −α.
          const rotY = Math.atan2(dz, dx)
          const mx = (s.ax + s.bx) / 2 - cx
          const mz = (s.az + s.bz) / 2 - cz
          return (
            <mesh key={`w${wi}s${si}`} position={[mx, H / 2, mz]} rotation={[0, -rotY, 0]} castShadow receiveShadow>
              <boxGeometry args={[len, H, PARTITION_THICKNESS]} />
              <meshStandardMaterial color={theme.wall} side={THREE.DoubleSide} roughness={0.92} />
            </mesh>
          )
        })
        // Lintel over the doorway gap (only the wall above the opening).
        const lintelH = H - doorH
        if (lintelH > 0.05) {
          const gmid = (w.gap.inner + w.gap.outer) / 2
          meshes.push(
            <mesh
              key={`w${wi}lintel`}
              position={[Math.cos(w.angle) * gmid, (doorH + H) / 2, Math.sin(w.angle) * gmid]}
              rotation={[0, -w.angle, 0]}
              receiveShadow
            >
              <boxGeometry args={[w.gap.outer - w.gap.inner, lintelH, PARTITION_THICKNESS]} />
              <meshStandardMaterial color={theme.wall} side={THREE.DoubleSide} roughness={0.92} />
            </mesh>
          )
        }
        return meshes
      })}
    </group>
  )
}

/* Engraved room-name signs (same look as the entrance archways: white fill,
 * building-colored outline, Bebas Neue) above each room's screens. */
function RoomHeaders({ island }) {
  const { id } = island
  const theme = BUILDING_THEME[id] || BUILDING_THEME.dev
  return (BUILDING_ROOMS[id] || []).map((room) => {
    const a = roomHeaderAnchor(id, room.key)
    return (
      <Text
        key={room.key}
        position={a.position}
        rotation={[0, a.rotationY, 0]}
        font="/fonts/BebasNeue-Regular.ttf"
        fontSize={1.15}
        letterSpacing={0.04}
        maxWidth={14}
        textAlign="center"
        anchorX="center"
        anchorY="middle"
        color="#ffffff"
        outlineWidth={0.06}
        outlineColor={theme.engrave}
      >
        {room.label}
      </Text>
    )
  })
}

/* One accent light per room — the building's single central light can't reach
 * past the new partition walls, so each room gets its own. */
function RoomLights({ island }) {
  const { id, radius: r } = island
  const [cx, , cz] = island.position
  const theme = BUILDING_THEME[id] || BUILDING_THEME.dev
  const H = wallHeight(r)
  const rooms = BUILDING_ROOMS[id] || []
  return rooms.map((room, idx) => {
    const a = roomCenter(id, idx)
    const x = cx + Math.cos(a) * (r * 0.5)
    const z = cz + Math.sin(a) * (r * 0.5)
    return (
      <pointLight
        key={room.key}
        position={[x, H * 0.72, z]}
        color={theme.light}
        intensity={1.0}
        distance={r * 0.95}
        decay={1}
      />
    )
  })
}

/* All museum shells + covered tunnels. Pass the shared ISLANDS / BRIDGES.
 * Buildings listed in BUILDING_ROOMS also get interior rooms (partition walls +
 * engraved headers + per-room lights). */
export function Museums({ islands, bridges }) {
  return (
    <>
      {islands
        .filter((i) => SECTION_IDS.includes(i.id))
        .map((i) => (
          <group key={i.id}>
            <Building island={i} />
            {BUILDING_ROOMS[i.id] && (
              <>
                <PartitionWalls island={i} />
                <RoomHeaders island={i} />
                <RoomLights island={i} />
              </>
            )}
          </group>
        ))}
      {bridges.map((b, idx) => <BridgeTunnel key={idx} {...b} />)}
    </>
  )
}
