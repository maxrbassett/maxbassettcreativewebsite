import * as THREE from 'three'
import { Text } from '@react-three/drei'
import { useMarbleSet, MARBLE_TILE, MARBLE_NORMAL_SCALE } from './textures'
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

/* Reusable see-through glass material. Uses meshStandardMaterial (NOT physical
 * + clearcoat) so it's cheap enough for mobile — the glass tunnels stack a lot
 * of transparent overdraw, and clearcoat is the heaviest material shader there
 * is. Low roughness + a little metalness + the HDRI env still give it a glassy
 * sheen. depthWrite off so what's behind shows through; `side` defaults to
 * DoubleSide (walls), but large surfaces (the deck) pass FrontSide to halve cost. */
export function GlassMaterial({ color = '#cfe6ff', opacity = 0.22, side = THREE.DoubleSide }) {
  return (
    <meshStandardMaterial
      color={color}
      transparent
      opacity={opacity}
      roughness={0.1}
      metalness={0.2}
      envMapIntensity={1.4}
      side={side}
      depthWrite={false}
    />
  )
}

/* Shared building surface (marble). `tex` is a configured PBR set ({map,
 * normalMap, roughnessMap}) or null; `tint` (the building's theme color)
 * multiplies the marble so each surface keeps its identity. Roughness is pulled
 * down a touch so the marble reads as polished (the HDRI then gives it a soft
 * sheen). With no `tex` it falls back to a flat tinted matte. */
export function BuildingMaterial({ tex, tint, side = THREE.DoubleSide }) {
  return (
    <meshStandardMaterial
      color={tint}
      side={side}
      // Cast shadows from only the outer (sun-facing) face. The walls are
      // zero-thickness shells, so a DoubleSide caster writes ambiguous depth into
      // the shadow map and the sun's shadow leaks onto the interior faces. Using
      // the front face alone gives a clean single-depth occluder.
      shadowSide={THREE.FrontSide}
      roughness={tex ? 0.65 : 0.92}
      metalness={0}
      map={tex?.map}
      normalMap={tex?.normalMap}
      normalScale={tex ? [MARBLE_NORMAL_SCALE, MARBLE_NORMAL_SCALE] : undefined}
      roughnessMap={tex?.roughnessMap}
    />
  )
}

/* The museum shell. `shell` (optional) supplies PBR texture sets
 * { wall, dome } (each { map, normalMap, roughnessMap }) for the realistic look;
 * without it the shell is a flat themed color. The theme color tints the stone
 * either way, so each building reads as its own material. */
function Building({ island, shell }) {
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

  // --- Facade articulation: a base plinth, a projecting cornice, and a ring of
  // pilasters give the smooth shell real depth (silhouette + cast shadows) so it
  // doesn't read as a flat curved surface. All marble, tinted like the wall. ---
  const ent = entranceAngle(island) // world angle of the doorway (toward the hub)
  const WALL_T = 0.6 // wall thickness: gap between the outer + inner shells
  const PIL_W = 1.1 // pilaster tangential width
  const PIL_D = 0.5 // how far each pilaster projects past the wall
  const detailTex = useMarbleSet(1, Math.max(1, Math.round(H / MARBLE_TILE)))
  // Evenly spaced pilasters (≈ one every 6 world units), skipping the doorway.
  const pilCount = Math.max(8, Math.round((2 * Math.PI * r) / 6))
  const pilAngles = []
  for (let i = 0; i < pilCount; i++) {
    const a = (i / pilCount) * Math.PI * 2
    const dd = Math.atan2(Math.sin(a - ent), Math.cos(a - ent)) // signed gap to the door
    if (Math.abs(dd) >= door + 0.18) pilAngles.push(a)
  }

  return (
    <group position={[position[0], ISLAND_TOP_Y, position[2]]}>
      {/* Curved wall with the doorway gap — built as two shells so the wall has
          real thickness. The OUTER shell (sun-facing, casts shadow) occludes the
          sun; the INNER shell, set back by WALL_T, then sits in that shadow, so
          the exterior pilaster shadows can't bleed through to the interior. */}
      <mesh position={[0, H / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[r, r, H, 72, 1, true, thetaStart, thetaLength]} />
        <BuildingMaterial tex={shell?.wall} tint={theme.wall} side={THREE.FrontSide} />
      </mesh>
      <mesh position={[0, H / 2, 0]} receiveShadow>
        <cylinderGeometry args={[r - WALL_T, r - WALL_T, H, 72, 1, true, thetaStart, thetaLength]} />
        <BuildingMaterial tex={shell?.wall} tint={theme.wall} side={THREE.BackSide} />
      </mesh>
      {/* Lintel — fills the wall above the doorway so the opening is only as
          tall as the covered tunnel, with solid wall continuing up to the dome. */}
      {H > doorH && (
        <>
          <mesh position={[0, (doorH + H) / 2, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[r, r, H - doorH, 72, 1, true, phiDoor - door, 2 * door]} />
            <BuildingMaterial tex={shell?.wall} tint={theme.wall} side={THREE.FrontSide} />
          </mesh>
          <mesh position={[0, (doorH + H) / 2, 0]} receiveShadow>
            <cylinderGeometry args={[r - WALL_T, r - WALL_T, H - doorH, 72, 1, true, phiDoor - door, 2 * door]} />
            <BuildingMaterial tex={shell?.wall} tint={theme.wall} side={THREE.BackSide} />
          </mesh>
        </>
      )}
      {/* Domed roof — top hemisphere flattened in Y to a gentle rounded ceiling.
          Two shells like the wall: the outer casts the sun shadow, the inner
          (set back by WALL_T, same apex) is the ceiling seen from within. */}
      <mesh position={[0, H, 0]} scale={[1, domeRise / r, 1]} castShadow receiveShadow>
        <sphereGeometry args={[r, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <BuildingMaterial tex={shell?.dome} tint={theme.wall} side={THREE.FrontSide} />
      </mesh>
      <mesh position={[0, H, 0]} scale={[1, domeRise / (r - WALL_T), 1]} receiveShadow>
        <sphereGeometry args={[r - WALL_T, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <BuildingMaterial tex={shell?.dome} tint={theme.wall} side={THREE.BackSide} />
      </mesh>

      {/* Base plinth — an arc matching the wall (doorway left open) that the
          building visually sits on, projecting past the wall face. */}
      <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[r + 0.55, r + 0.55, 0.9, 72, 1, true, thetaStart, thetaLength]} />
        <BuildingMaterial tex={shell?.wall} tint={theme.wall} />
      </mesh>
      {/* Cornice — a projecting band where the wall meets the dome. Full circle
          (it sits above the doorway opening) but OPEN-ENDED: a closed cylinder's
          cap disks would form a flat ceiling and hide the dome from inside. */}
      <mesh position={[0, H - 0.35, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[r + 0.6, r + 0.6, 0.7, 72, 1, true]} />
        <BuildingMaterial tex={shell?.wall} tint={theme.wall} />
      </mesh>
      {/* Pilasters — vertical marble piers standing proud of the wall, skipping
          the doorway. Their cast shadows are what make the facade read as 3D. */}
      {pilAngles.map((a, i) => (
        <mesh
          key={`pil${i}`}
          position={[Math.cos(a) * (r + PIL_D / 2), H / 2, Math.sin(a) * (r + PIL_D / 2)]}
          rotation={[0, Math.PI / 2 - a, 0]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[PIL_W, H, PIL_D]} />
          <BuildingMaterial tex={detailTex} tint={theme.wall} />
        </mesh>
      ))}

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

function BridgeTunnel({ axis, cx, cz, length }) {
  const H = TUNNEL_HEIGHT // same height as the archway
  const hw = BRIDGE_HALF_WIDTH
  const t = 0.4 // wall/ceiling thickness
  const wallArgs = axis === 'x' ? [length, H, t] : [t, H, length]
  const ceilArgs = axis === 'x' ? [length, t, hw * 2 + t * 2] : [hw * 2 + t * 2, t, length]
  const wall1 = axis === 'x' ? [cx, H / 2, cz + hw] : [cx + hw, H / 2, cz]
  const wall2 = axis === 'x' ? [cx, H / 2, cz - hw] : [cx - hw, H / 2, cz]
  return (
    <group>
      {/* See-through glass side walls (open at both ends) + a glass ceiling over
          the deck. No receiveShadow — transparent glass receiving shadows is
          costly and barely visible; skipping it keeps tunnels cheap on mobile. */}
      <mesh position={wall1}>
        <boxGeometry args={wallArgs} />
        <GlassMaterial />
      </mesh>
      <mesh position={wall2}>
        <boxGeometry args={wallArgs} />
        <GlassMaterial />
      </mesh>
      <mesh position={[cx, H, cz]}>
        <boxGeometry args={ceilArgs} />
        <GlassMaterial />
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
  // One shared marble set for all of this building's interior dividers (tiled at
  // roughly world-scale; segments vary in length so tiling isn't pixel-exact,
  // but the relief reads far better than the old flat color). Tinted by theme.
  const tex = useMarbleSet(Math.max(2, Math.round(r / MARBLE_TILE)), Math.max(1, Math.round(H / MARBLE_TILE)))
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
              <BuildingMaterial tex={tex} tint={theme.wall} />
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
              <BuildingMaterial tex={tex} tint={theme.wall} />
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

/* Realistic-marble building shell: loads the CC0 PBR marble set, tiled per
 * surface to keep a consistent world-scale, and feeds it to Building as its
 * shell. The theme color (inside Building) tints the marble so each building
 * keeps its identity. Used for every section building. */
function SectionBuilding({ island }) {
  const r = island.radius
  const H = wallHeight(r)
  const repX = Math.max(4, Math.round((2 * Math.PI * r) / MARBLE_TILE))
  const repY = Math.max(1, Math.round(H / MARBLE_TILE))
  const domeU = Math.max(4, Math.round((2 * Math.PI * r) / MARBLE_TILE))
  const domeV = Math.max(2, Math.round(((Math.PI / 2) * r) / MARBLE_TILE))
  const wall = useMarbleSet(repX, repY)
  const dome = useMarbleSet(domeU, domeV)
  return <Building island={island} shell={{ wall, dome }} />
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
            <SectionBuilding island={i} />
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
