/* ------------------------------------------------------------------
 * Shared world layout — the single source of truth for island geometry, used
 * by Scene (terrain + boundary), Architecture (museum walls/domes/tunnels),
 * and interactables (wall-mounted screen positions). Lives in its own module
 * so those three can import it without a circular dependency.
 * ------------------------------------------------------------------ */
export const ISLAND_TOP_Y = 0 // walking surface height
export const ISLAND_THICKNESS = 1.5
export const BRIDGE_HALF_WIDTH = 3
export const BRIDGE_OVERLAP = 3 // how far each bridge end sinks into its island

const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi)

// Radii scale with how much each island holds: Dev (5 screens) is biggest;
// About (one merged stop) is small. Dev stays at the origin; Video and About
// sit close to the hub so their bridges (now covered tunnels) stay short.
export const ISLANDS = [
  { id: 'hub', position: [0, 0, 75], radius: 16, color: '#b3d99b', label: 'Hub' },
  // dev & video are now split into walled rooms, so they're sized so each room
  // reads full rather than as a sparse ring. about is a single small stop.
  { id: 'dev', position: [0, 0, 0], radius: 24, color: '#a7d8a0', label: 'Software Dev' },
  { id: 'video', position: [54, 0, 75], radius: 28, color: '#9ec9e8', label: 'Videography' },
  { id: 'about', position: [-40, 0, 75], radius: 8.5, color: '#e6c98a', label: 'About' },
]
export const BRIDGE_LINKS = [
  ['hub', 'dev'],
  ['hub', 'video'],
  ['hub', 'about'],
]
// Spawn right against the hub's north edge (walkable boundary is radius-1 = 15,
// i.e. z≈90) — the only ground "behind" the buildings, which fan out
// south/east/west — so the player faces south and takes in the whole world on
// load, as far back as the island allows.
export const SPAWN = [0, 2.5, 89.5]
export const SECTION_IDS = ['dev', 'video', 'about'] // the enclosed museum islands

// Welcome NPC ("Max") standing just in front of spawn, turned to face the
// player. (atan2(dx,dz) faces the model's +z toward the spawn point.)
export const NPC_POSITION = [3.5, 0, 84]
export const NPC_ROTATION_Y = Math.atan2(SPAWN[0] - NPC_POSITION[0], SPAWN[2] - NPC_POSITION[2])

export const islandById = (id) => ISLANDS.find((i) => i.id === id)

// "Indoors" = standing within a section building's footprint (its island). The
// hub and the bridges are open-air. Used to crossfade the ambient sound beds.
export function isIndoor(x, z) {
  return SECTION_IDS.some((id) => {
    const isl = islandById(id)
    return Math.hypot(x - isl.position[0], z - isl.position[2]) <= isl.radius
  })
}

// On a covered bridge/tunnel deck? (Used to duck the outdoor ambience early —
// the tunnel is the moment the world starts to feel enclosed.)
export function onBridge(x, z) {
  return BRIDGES.some(
    (b) => x >= b.zone.minX && x <= b.zone.maxX && z >= b.zone.minZ && z <= b.zone.maxZ
  )
}

// Progress along whichever tunnel you're in: 0 at the hub mouth → 1 at the
// building mouth, or null if not in a tunnel. Lets the outdoor ambience fade
// out smoothly across the tunnel so it's fully silent by the building end.
export function tunnelProgress(x, z) {
  for (const b of BRIDGES) {
    const zn = b.zone
    if (x >= zn.minX && x <= zn.maxX && z >= zn.minZ && z <= zn.maxZ) {
      const hub = islandById(b.from).position
      const sec = islandById(b.to).position
      if (b.axis === 'x') {
        const s = Math.sign(sec[0] - hub[0])
        return clamp(((x - b.hubEnd[0]) * s) / b.length, 0, 1)
      }
      const s = Math.sign(sec[2] - hub[2])
      return clamp(((z - b.hubEnd[2]) * s) / b.length, 0, 1)
    }
  }
  return null
}

// Footstep surface from position: 'grass' on the open hub, 'hard' on the bridge
// decks and inside the (stone/marble) buildings. A logical map of the floor,
// independent of its visual material.
export function surfaceAt(x, z) {
  return onBridge(x, z) || isIndoor(x, z) ? 'hard' : 'grass'
}

// World-space angle (atan2(dz,dx)) from an island's center toward the hub —
// where its doorway, archway, and bridge all meet.
export const entranceAngle = (island) => {
  const hub = islandById('hub')
  return Math.atan2(hub.position[2] - island.position[2], hub.position[0] - island.position[0])
}

// Build an axis-aligned bridge between two islands that share one axis.
// Returns deck params + the walkable rect zone, overlapping both islands.
function makeBridge(aId, bId) {
  const a = islandById(aId)
  const b = islandById(bId)
  const dx = b.position[0] - a.position[0]
  const dz = b.position[2] - a.position[2]
  const hw = BRIDGE_HALF_WIDTH
  if (Math.abs(dx) >= Math.abs(dz)) {
    const s = Math.sign(dx)
    const start = a.position[0] + s * (a.radius - BRIDGE_OVERLAP)
    const end = b.position[0] - s * (b.radius - BRIDGE_OVERLAP)
    const minX = Math.min(start, end)
    const maxX = Math.max(start, end)
    const cz = a.position[2]
    return {
      axis: 'x', cx: (minX + maxX) / 2, cz, length: maxX - minX,
      from: aId, to: bId, hubEnd: [start, 0, cz], // `start` is the a-side (hub) end
      zone: { type: 'rect', minX, maxX, minZ: cz - hw + 0.4, maxZ: cz + hw - 0.4 },
    }
  }
  const s = Math.sign(dz)
  const start = a.position[2] + s * (a.radius - BRIDGE_OVERLAP)
  const end = b.position[2] - s * (b.radius - BRIDGE_OVERLAP)
  const minZ = Math.min(start, end)
  const maxZ = Math.max(start, end)
  const cx = a.position[0]
  return {
    axis: 'z', cx, cz: (minZ + maxZ) / 2, length: maxZ - minZ,
    from: aId, to: bId, hubEnd: [cx, 0, start], // `start` is the a-side (hub) end
    zone: { type: 'rect', minX: cx - hw + 0.4, maxX: cx + hw - 0.4, minZ, maxZ },
  }
}

export const BRIDGES = BRIDGE_LINKS.map(([a, b]) => makeBridge(a, b))

// Walkable zones: each island as a circle (inset margin) + each bridge rect.
export const ZONES = [
  ...ISLANDS.map((i) => ({ type: 'circle', cx: i.position[0], cz: i.position[2], r: i.radius - 1 })),
  ...BRIDGES.map((b) => b.zone),
]

/* ---- Museum building dimensions (shared by Architecture + interactables) ---- */
// Covered-bridge height — matches the archway, and doubles as the doorway
// height (the building wall gets a lintel above this so the opening is only as
// tall as the tunnel, with solid wall continuing up to the dome).
export const TUNNEL_HEIGHT = 5
export const SCREEN_MOUNT_INSET = 0.7 // wall-mounted screens sit this far inside the wall radius
export const SCREEN_CENTER_Y = 2.7 // height of a screen's center on the wall

// Wall height per island radius, and the angular half-width of the doorway
// (sized to match the tunnel's outer width, BRIDGE_HALF_WIDTH + wall thickness).
export const wallHeight = (r) => clamp(r * 0.32, 6.5, 8)
export const doorHalfAngle = (r) => Math.asin(clamp((BRIDGE_HALF_WIDTH + 0.4) / r, 0.05, 0.95))

// Per museum: a wall tint, an accent light color, and an `engrave` color used
// as the outline/border of the archway's white title text — a darkened shade
// of the wall color, so each title is color-coded to its building yet stays
// crisp and readable on the light stone lintel.
export const BUILDING_THEME = {
  dev: { wall: '#d7d2c6', light: '#bfe6c0', engrave: '#5f574a' },
  video: { wall: '#cdd6e2', light: '#bcd4ff', engrave: '#43566e' },
  about: { wall: '#e0d4bb', light: '#ffe2b0', engrave: '#6e5a38' },
}

// Evenly distribute `count` wall-mounted screens around a museum's interior
// wall, skipping the doorway wedge, each facing the room center. Returns
// world-space { position:[x,0,z], rotationY }. Used to place the kiosks.
export function wallSlots(islandId, count) {
  const isl = islandById(islandId)
  const [cx, , cz] = isl.position
  const R = isl.radius - SCREEN_MOUNT_INSET
  const ent = entranceAngle(isl)
  const door = doorHalfAngle(isl.radius)
  const arc = Math.PI * 2 - 2 * door // wall arc available (door wedge removed)
  const slots = []
  for (let i = 0; i < count; i++) {
    const a = ent + door + arc * ((i + 1) / (count + 1))
    const x = cx + Math.cos(a) * R
    const z = cz + Math.sin(a) * R
    slots.push({ position: [x, 0, z], rotationY: Math.atan2(cx - x, cz - z) }) // face center
  }
  return slots
}

/* ------------------------------------------------------------------
 * Interior "coves" — each section building is carved into walled-off rooms,
 * one per content category, by flat RADIAL partition walls running from an
 * inner radius out to the outer wall. Walls stop short of center (leaving a
 * small open atrium) and each has a doorway gap, so the player circulates
 * room→room. The main entrance (toward the hub) is centered in room 0.
 *
 * All geometry derives from the island's radius + entranceAngle + this config,
 * so resizing a building auto-propagates to walls, screen slots, and headers.
 * ------------------------------------------------------------------ */

// Ordered rooms per building. A room is one wall section with its own label +
// screens. By default rooms are equal wedges in circulation order (room 0 holds
// the entrance, split onto two flanks by the doorway). A room may instead pin
// an explicit outer-wall arc via `arcDeg: [startDeg, endDeg]` (world angles) —
// used by Software Dev so Public Web and Personal Projects each occupy a whole
// wall flanking the entrance, with Internal Tools and Management splitting the
// back wall (left/right of the rear partition).
export const BUILDING_ROOMS = {
  dev: [
    { key: 'web', label: 'Public Web', screenCount: 5, arcDeg: [96, 180] }, // left of entrance (labeled wall)
    { key: 'personal', label: 'Personal Projects', screenCount: 3, arcDeg: [0, 84] }, // right of entrance
    { key: 'internal', label: 'Internal Tools', screenCount: 4, arcDeg: [185, 265] }, // back wall, left of rear partition
    { key: 'management', label: 'Management', screenCount: 4, arcDeg: [275, 355] }, // back wall, right of rear partition
  ],
  video: [
    { key: 'trailers', label: 'Trailers & Promos', screenCount: 4 }, // entrance room (2 per flank)
    { key: 'social', label: 'Social & Short Form', screenCount: 5 },
    { key: 'narrative', label: 'Narrative & Documentary', screenCount: 5 },
    { key: 'ai', label: 'AI', screenCount: 5 },
  ],
}

// Explicit partition-wall angles (world radians) for buildings whose rooms
// aren't auto equal-wedges. Dev = a diameter wall (0/π) separating the two
// front rooms from the back, plus a rear wall at 3π/2 (270°, straight back from
// the entrance) splitting the back into Internal Tools and Management. The
// web/personal split at the front is just the open main entrance (no wall).
export const BUILDING_PARTITIONS = {
  dev: [0, Math.PI, 1.5 * Math.PI],
}

export const COVE_DOOR_WIDTH = 3.4 // doorway-gap span along a partition wall
export const COVE_DOOR_INNER_OFFSET = 2 // gap starts this far past the inner radius
export const PARTITION_THICKNESS = 0.8 // visual wall thickness (box depth)
export const ROOM_HEADER_Y = SCREEN_CENTER_Y + 4.0 // engraved header height (clear of the float orbs above the TVs)
const COVE_PAD = 0.06 // keep screens/labels off the partition seams (radians)
const DEG = Math.PI / 180
// Inner radius where radial walls stop, leaving an open central atrium so the
// walls never converge to a cramped point. ~17% of the building radius.
export const coveInnerRadius = (r) => Math.max(3.5, r * 0.17)

const roomStep = (islandId) => (Math.PI * 2) / BUILDING_ROOMS[islandId].length

// Resolve a room to its outer-wall arc: a center angle (for label/light) and
// the interval(s) screens spread across. Explicit `arcDeg` → one interval; else
// an equal wedge (the entrance room splits into two flanks around the doorway).
function roomArc(islandId, idx) {
  const isl = islandById(islandId)
  const room = BUILDING_ROOMS[islandId][idx]
  if (room.arcDeg) {
    const s = room.arcDeg[0] * DEG
    const e = room.arcDeg[1] * DEG
    return { center: (s + e) / 2, intervals: [[s + COVE_PAD, e - COVE_PAD]] }
  }
  const step = roomStep(islandId)
  const center = entranceAngle(isl) + idx * step
  if (idx === 0) {
    const door = doorHalfAngle(isl.radius)
    return {
      center, // header sits centered over the entrance doorway, between the two flanks
      intervals: [
        [center - step / 2 + COVE_PAD, center - door - COVE_PAD],
        [center + door + COVE_PAD, center + step / 2 - COVE_PAD],
      ],
    }
  }
  return { center, intervals: [[center - step / 2 + COVE_PAD, center + step / 2 - COVE_PAD]] }
}

// A room's center angle (world radians) — for placing its light.
export const roomCenter = (islandId, idx) => roomArc(islandId, idx).center

// Radial partition walls for a building, each split into two collision/render
// segments around a mid-wall doorway gap. Returns
// { angle, gap:{inner,outer}, segments:[{ax,az,bx,bz}, …] } in world space.
export function partitionWalls(islandId) {
  const isl = islandById(islandId)
  const [cx, , cz] = isl.position
  const R = isl.radius
  const ent = entranceAngle(isl)
  const step = roomStep(islandId)
  const angles =
    BUILDING_PARTITIONS[islandId] ||
    Array.from({ length: BUILDING_ROOMS[islandId].length }, (_, j) => ent + (j + 0.5) * step)
  const ri = coveInnerRadius(R)
  const outer = R - 0.3 // tuck the wall end just behind the curved outer wall
  const gapInner = ri + COVE_DOOR_INNER_OFFSET
  const gapOuter = gapInner + COVE_DOOR_WIDTH
  const pt = (a, r) => [cx + Math.cos(a) * r, cz + Math.sin(a) * r]
  const seg = (a, r0, r1) => {
    const [ax, az] = pt(a, r0)
    const [bx, bz] = pt(a, r1)
    return { ax, az, bx, bz }
  }
  return angles.map((a) => ({
    angle: a,
    gap: { inner: gapInner, outer: gapOuter },
    segments: [seg(a, ri, gapInner), seg(a, gapOuter, outer)],
  }))
}

// Distribute a room's screens across its outer-wall arc, each facing center.
// Mirrors wallSlots' spacing/facing math.
export function coveSlots(islandId, roomKey) {
  const isl = islandById(islandId)
  const [cx, , cz] = isl.position
  const R = isl.radius - SCREEN_MOUNT_INSET
  const rooms = BUILDING_ROOMS[islandId]
  const idx = rooms.findIndex((r) => r.key === roomKey)
  const K = rooms[idx].screenCount
  const { intervals } = roomArc(islandId, idx)

  const lengths = intervals.map(([s, e]) => Math.max(0, e - s))
  const total = lengths.reduce((a, b) => a + b, 0) || 1
  const slots = []
  let placed = 0
  intervals.forEach(([s, e], ii) => {
    // proportional split by arc length; last interval takes the remainder
    const n = ii === intervals.length - 1 ? K - placed : Math.round((lengths[ii] / total) * K)
    for (let i = 0; i < n; i++) {
      const a = s + (e - s) * ((i + 1) / (n + 1))
      const x = cx + Math.cos(a) * R
      const z = cz + Math.sin(a) * R
      slots.push({ position: [x, 0, z], rotationY: Math.atan2(cx - x, cz - z) })
    }
    placed += n
  })
  return slots
}

// Anchor for a room's engraved header sign: on the outer wall above the screen
// band, facing inward.
export function roomHeaderAnchor(islandId, roomKey) {
  const isl = islandById(islandId)
  const [cx, , cz] = isl.position
  // Headers are wide FLAT text planes on a CURVED wall: their ends bow outward
  // from the chord, so they must sit far enough toward the room center that even
  // those ends clear the (inset, thick) inner wall surface. -1.2 keeps a wide
  // label (maxWidth 14 → ~7 half-width) in front of the inner shell.
  const R = isl.radius - SCREEN_MOUNT_INSET - 1.2
  const idx = BUILDING_ROOMS[islandId].findIndex((r) => r.key === roomKey)
  const center = roomCenter(islandId, idx)
  const x = cx + Math.cos(center) * R
  const z = cz + Math.sin(center) * R
  return { position: [x, ROOM_HEADER_Y, z], rotationY: Math.atan2(cx - x, cz - z) }
}
