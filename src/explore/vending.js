/* ------------------------------------------------------------------
 * Treat-O-Matic — the giveaway vending machine on the blue secret island
 * (game-5). Holds two things that the 3D model (VendingMachine.jsx), the
 * proximity interactable (interactables.js), and the overlay game
 * (InteractionOverlay.jsx) all share:
 *   1. where the machine sits / faces (derived from the island so it tracks
 *      the layout), and
 *   2. the prize pool it dispenses (toys & candy, weighted by rarity).
 * ------------------------------------------------------------------ */
import { SECRET_GAME_ISLANDS, SECRET_ISLAND } from './worldLayout'

// The "blue island" — one of the bare far-flung game islands (#5b8def).
const BLUE = SECRET_GAME_ISLANDS.find((i) => i.id === 'game-5')

// Unit vector from the island center toward the secret hub (xz only). The
// player arrives on this (hub-facing) edge, so we set the machine just inside
// it, facing back across the island — you walk straight up to its front.
const _dx = SECRET_ISLAND.position[0] - BLUE.position[0]
const _dz = SECRET_ISLAND.position[2] - BLUE.position[2]
const _len = Math.hypot(_dx, _dz) || 1
const UX = _dx / _len
const UZ = _dz / _len

// Sit it 6 units off-center toward the hub side. Its base rests on the island
// surface (the island's own Y).
export const VENDING_POSITION = [
  BLUE.position[0] + UX * 6,
  BLUE.position[1],
  BLUE.position[2] + UZ * 6,
]
// Front (+z) faces toward the hub — the edge the player arrives on — so on
// arrival (where we also turn the player to face the machine) you meet its
// front, glass and buttons toward you.
export const VENDING_ROTATION_Y = Math.atan2(UX, UZ)
export const VENDING_ISLAND_ID = BLUE.id
export const VENDING_ISLAND_COLOR = BLUE.color
export const VENDING_PROXIMITY = 6

/* The prize pool. `kind` flavors the in-world flair (toy = rarer/sparkly);
 * `weight` sets how often it drops (candy common, toys rare). Emoji-only so it
 * needs zero art assets and renders identically everywhere. */
export const TREATS = [
  // --- Candy (common) ---
  { id: 'gummy', name: 'Gummy Bears', emoji: '🐻', kind: 'candy', weight: 10 },
  { id: 'lollipop', name: 'Swirl Lollipop', emoji: '🍭', kind: 'candy', weight: 10 },
  { id: 'chocolate', name: 'Chocolate Bar', emoji: '🍫', kind: 'candy', weight: 9 },
  { id: 'candy', name: 'Wrapped Candy', emoji: '🍬', kind: 'candy', weight: 10 },
  { id: 'donut', name: 'Sprinkle Donut', emoji: '🍩', kind: 'candy', weight: 8 },
  { id: 'cupcake', name: 'Frosted Cupcake', emoji: '🧁', kind: 'candy', weight: 7 },
  { id: 'cookie', name: 'Choc-Chip Cookie', emoji: '🍪', kind: 'candy', weight: 8 },
  // --- Toys (rare) ---
  { id: 'teddy', name: 'Teddy Bear', emoji: '🧸', kind: 'toy', weight: 5 },
  { id: 'car', name: 'Toy Race Car', emoji: '🏎️', kind: 'toy', weight: 5 },
  { id: 'dino', name: 'Squeaky Dino', emoji: '🦖', kind: 'toy', weight: 4 },
  { id: 'robot', name: 'Wind-Up Robot', emoji: '🤖', kind: 'toy', weight: 3 },
  { id: 'rocket', name: 'Mini Rocket', emoji: '🚀', kind: 'toy', weight: 2 },
]

// Weighted pick from the pool. `rand` is 0..1 (caller supplies Math.random()),
// kept as a param so the picker itself stays pure/testable.
export function pickTreat(rand) {
  const total = TREATS.reduce((s, t) => s + t.weight, 0)
  let r = rand * total
  for (const t of TREATS) {
    r -= t.weight
    if (r <= 0) return t
  }
  return TREATS[TREATS.length - 1]
}
