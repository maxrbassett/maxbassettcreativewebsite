/* ------------------------------------------------------------------
 * Grand Prix — the racing game on the gold/yellow secret island (game-3).
 * Placement only (data-only, like vending.js / matching.js); the game itself
 * (a top-down circuit you race against AI) lives in RacingGame.jsx and its 3D
 * prop in RaceStand.jsx.
 * ------------------------------------------------------------------ */
import { SECRET_GAME_ISLANDS, SECRET_ISLAND } from './worldLayout'

// The "yellow island" — the gold far-flung game island (#e6b13e).
const GOLD = SECRET_GAME_ISLANDS.find((i) => i.id === 'game-3')

const _dx = SECRET_ISLAND.position[0] - GOLD.position[0]
const _dz = SECRET_ISLAND.position[2] - GOLD.position[2]
const _len = Math.hypot(_dx, _dz) || 1
const UX = _dx / _len
const UZ = _dz / _len

export const RACING_POSITION = [
  GOLD.position[0] + UX * 6,
  GOLD.position[1],
  GOLD.position[2] + UZ * 6,
]
// Front (+z) faces the hub — the edge the player arrives on (and is turned to
// face) — so you meet the start-line arch head-on.
export const RACING_ROTATION_Y = Math.atan2(UX, UZ)
export const RACING_ISLAND_ID = GOLD.id
export const RACING_ISLAND_COLOR = GOLD.color
export const RACING_PROXIMITY = 6
