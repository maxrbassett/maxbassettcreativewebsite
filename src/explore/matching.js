/* ------------------------------------------------------------------
 * Memory Match — card-matching arcade cabinets on the secret game islands.
 * Each entry in MATCHING_GAMES is one cabinet: its island, its colors, and the
 * symbol set it's played with. Shared by the 3D props (MatchingGame.jsx), the
 * proximity interactables (interactables.js), and the overlay game
 * (InteractionOverlay's MatchingGamePanel). Mirrors vending.js: placement is
 * derived from the island so it tracks the layout.
 * ------------------------------------------------------------------ */
import { SECRET_GAME_ISLANDS, SECRET_ISLAND } from './worldLayout'

export const MATCHING_PROXIMITY = 6

// Place a cabinet on a game island: `offset` units off-center toward the secret
// hub (the edge the player arrives on), facing back toward the island center.
function placeOnIsland(islandId, offset = 6) {
  const isl = SECRET_GAME_ISLANDS.find((i) => i.id === islandId)
  const dx = SECRET_ISLAND.position[0] - isl.position[0]
  const dz = SECRET_ISLAND.position[2] - isl.position[2]
  const len = Math.hypot(dx, dz) || 1
  const ux = dx / len
  const uz = dz / len
  return {
    islandId,
    position: [isl.position[0] + ux * offset, isl.position[1], isl.position[2] + uz * offset],
    // Front (+z) faces toward the hub — the edge the player arrives on (and is
    // turned to face) — so you meet the screen head-on.
    rotationY: Math.atan2(ux, uz),
  }
}

/* The cabinets. `symbols` is the eight faces (eight pairs → a 4×4 board).
 * Colors theme both the 3D cabinet and the overlay panel:
 *   body/deep — cabinet body + dark trim; tile/glow — the on-screen card backs;
 *   panel.top/bottom/deep/accent/btnText — the overlay's CSS theme. */
export const MATCHING_GAMES = [
  {
    id: 'memory-match',
    title: 'Memory Match',
    marquee: 'MEMORY MATCH',
    body: '#2a9d8f',
    deep: '#15413a',
    tile: '#7ff0d8',
    glow: '#3fd9b8',
    glass: '#dffbf2',
    symbols: ['🐶', '🐱', '🦊', '🐼', '🐸', '🦁', '🐵', '🐧'],
    panel: { top: '#2a9d8f', bottom: '#1f7d72', deep: '#15413a', accent: '#4fd1b8', btnText: '#1f7d72' },
    ...placeOnIsland('game-2'), // green island
  },
  {
    id: 'face-match',
    title: 'Face Match',
    marquee: 'FACE MATCH',
    body: '#9a7ad1',
    deep: '#3a2a55',
    tile: '#d9c2ff',
    glow: '#b794f4',
    glass: '#f1e9ff',
    symbols: ['🤠', '🧙', '🧛', '🥷', '🦸', '👮', '🤴', '👸'],
    panel: { top: '#9a7ad1', bottom: '#7d5cb8', deep: '#3a2a55', accent: '#c9a9ff', btnText: '#5a3f8f' },
    ...placeOnIsland('game-4'), // purple island
  },
]

export const matchingGameById = (id) => MATCHING_GAMES.find((g) => g.id === id)

// Fisher–Yates shuffle (in place) using the supplied rng (Math.random by
// default), kept as a param so it stays testable.
export function shuffle(arr, rng = Math.random) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// Build a freshly shuffled deck for a symbol set: two cards per symbol, each
// with a stable key.
export function newDeck(symbols, rng = Math.random) {
  const cards = symbols.flatMap((symbol, i) => [
    { symbol, key: `${i}a` },
    { symbol, key: `${i}b` },
  ])
  return shuffle(cards, rng).map((c, id) => ({ ...c, id, matched: false }))
}
