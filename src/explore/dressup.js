/* ------------------------------------------------------------------
 * Dress the Bear — the bear boutique on the red secret island (game-1).
 * Placement only (data-only, like vending.js / matching.js); the wardrobe
 * itself + the layered SVG bear live in DressUpBear.jsx. Shared by the 3D prop
 * (DressUpStand.jsx), the proximity interactable (interactables.js), and the
 * overlay game (InteractionOverlay's DressUpPanel).
 * ------------------------------------------------------------------ */
import { SECRET_GAME_ISLANDS, SECRET_ISLAND } from './worldLayout'

// The "red island" — the terracotta far-flung game island (#e07a5f).
const RED = SECRET_GAME_ISLANDS.find((i) => i.id === 'game-1')

const _dx = SECRET_ISLAND.position[0] - RED.position[0]
const _dz = SECRET_ISLAND.position[2] - RED.position[2]
const _len = Math.hypot(_dx, _dz) || 1
const UX = _dx / _len
const UZ = _dz / _len

export const DRESSUP_POSITION = [
  RED.position[0] + UX * 6,
  RED.position[1],
  RED.position[2] + UZ * 6,
]
// Front (+z) faces the hub — the edge the player arrives on (and is turned to
// face) — so you meet the bear head-on.
export const DRESSUP_ROTATION_Y = Math.atan2(UX, UZ)
export const DRESSUP_ISLAND_ID = RED.id
export const DRESSUP_ISLAND_COLOR = RED.color
export const DRESSUP_PROXIMITY = 6
