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
  { id: 'dev', position: [0, 0, 0], radius: 33, color: '#a7d8a0', label: 'Software Dev' },
  { id: 'video', position: [54, 0, 75], radius: 26, color: '#9ec9e8', label: 'Videography' },
  { id: 'about', position: [-40, 0, 75], radius: 14, color: '#e6c98a', label: 'About' },
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
