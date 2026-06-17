/* ------------------------------------------------------------------
 * The dress-up bear: a layered SVG teddy whose clothing composes onto the
 * body. WARDROBE defines the slots (hat, eyewear, shirt, scarf, pants, shoes)
 * and the options in each; every option carries a small `emoji` for its
 * wardrobe button and (except "none") a `render()` that draws the garment as
 * SVG, aligned to the base bear below. <DressUpBear outfit> stacks the selected
 * layers in a fixed back-to-front order. Used by InteractionOverlay's
 * DressUpPanel. ViewBox is 200×340.
 * ------------------------------------------------------------------ */

// Fur palette + face color, shared by the base bear.
const FUR = '#b07a47'
const LIGHT = '#eccfa6'
const FACE = '#3a2a20'

function BaseBear() {
  return (
    <g>
      {/* ears */}
      <circle cx="60" cy="42" r="20" fill={FUR} />
      <circle cx="140" cy="42" r="20" fill={FUR} />
      <circle cx="60" cy="42" r="10" fill={LIGHT} />
      <circle cx="140" cy="42" r="10" fill={LIGHT} />
      {/* arms */}
      <rect x="32" y="150" width="30" height="92" rx="15" fill={FUR} />
      <rect x="138" y="150" width="30" height="92" rx="15" fill={FUR} />
      {/* legs */}
      <rect x="68" y="250" width="28" height="66" rx="14" fill={FUR} />
      <rect x="104" y="250" width="28" height="66" rx="14" fill={FUR} />
      {/* feet */}
      <ellipse cx="82" cy="316" rx="20" ry="13" fill={FUR} />
      <ellipse cx="118" cy="316" rx="20" ry="13" fill={FUR} />
      <ellipse cx="82" cy="318" rx="11" ry="7" fill={LIGHT} />
      <ellipse cx="118" cy="318" rx="11" ry="7" fill={LIGHT} />
      {/* torso */}
      <ellipse cx="100" cy="198" rx="56" ry="76" fill={FUR} />
      <ellipse cx="100" cy="206" rx="38" ry="54" fill={LIGHT} />
      {/* head */}
      <circle cx="100" cy="82" r="50" fill={FUR} />
      <ellipse cx="100" cy="98" rx="24" ry="18" fill={LIGHT} />
      <ellipse cx="100" cy="88" rx="7" ry="5" fill={FACE} />
      <path d="M100 92 q0 8 -8 11 M100 92 q0 8 8 11" stroke={FACE} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <circle cx="82" cy="74" r="5.5" fill={FACE} />
      <circle cx="118" cy="74" r="5.5" fill={FACE} />
    </g>
  )
}

/* ---- garment renderers (each aligned to the base bear) ---- */

// Shirts share one tee silhouette; color + optional extras vary.
const tee = (fill, extra = null) => (
  <g>
    <ellipse cx="50" cy="168" rx="18" ry="20" fill={fill} />
    <ellipse cx="150" cy="168" rx="18" ry="20" fill={fill} />
    <path
      d="M62 170 Q62 150 84 148 L116 148 Q138 150 138 170 L138 244 Q138 250 130 250 L70 250 Q62 250 62 244 Z"
      fill={fill}
    />
    {extra}
  </g>
)

const jeansLegs = (fill, waist, hi) => (
  <g fill={fill}>
    <path d={`M62 ${waist} Q62 224 72 226 L128 226 Q138 224 138 ${waist} L138 ${waist + 22} L62 ${waist + 22} Z`} />
    <rect x="68" y={waist + 18} width="28" height={hi} rx="12" />
    <rect x="104" y={waist + 18} width="28" height={hi} rx="12" />
  </g>
)

const shoe = (cx, sole) => (
  <g>
    <path d={`M${cx - 22} 312 Q${cx - 22} 300 ${cx - 6} 300 L${cx + 18} 308 Q${cx + 24} 312 ${cx + 24} 320 L${cx - 20} 320 Z`} fill="#fafafa" />
    <rect x={cx - 23} y="318" width="48" height="8" rx="4" fill={sole} />
    <path d={`M${cx - 6} 304 L${cx + 14} 310`} stroke="#cfcfcf" strokeWidth="3" strokeLinecap="round" />
  </g>
)

const boot = (cx) => (
  <g fill="#6b4324">
    <rect x={cx - 16} y="288" width="32" height="34" rx="8" />
    <path d={`M${cx - 20} 312 L${cx + 24} 312 Q${cx + 28} 322 ${cx + 18} 324 L${cx - 18} 324 Q${cx - 24} 322 ${cx - 20} 312 Z`} />
    <rect x={cx - 22} y="320" width="50" height="7" rx="3" fill="#3f2817" />
  </g>
)

export const WARDROBE = [
  {
    slot: 'hat',
    label: 'Hat',
    options: [
      { id: 'none', label: 'None', emoji: '🚫' },
      {
        id: 'tophat',
        label: 'Top Hat',
        emoji: '🎩',
        render: () => (
          <g>
            <ellipse cx="100" cy="42" rx="46" ry="9" fill="#2b2b33" />
            <rect x="78" y="2" width="44" height="42" rx="4" fill="#2b2b33" />
            <rect x="78" y="30" width="44" height="9" fill="#e63946" />
          </g>
        ),
      },
      {
        id: 'cap',
        label: 'Cap',
        emoji: '🧢',
        render: () => (
          <g>
            <path d="M56 54 A46 42 0 0 1 144 54 Z" fill="#2f7d4f" />
            <path d="M120 52 Q160 54 160 66 Q150 70 118 64 Z" fill="#256a42" />
            <circle cx="100" cy="20" r="4" fill="#256a42" />
          </g>
        ),
      },
      {
        id: 'crown',
        label: 'Crown',
        emoji: '👑',
        render: () => (
          <g fill="#f4c430">
            <polygon points="62,46 76,18 90,40 100,14 110,40 124,18 138,46" />
            <rect x="62" y="44" width="76" height="13" rx="2" />
            <circle cx="100" cy="50" r="3.5" fill="#e63946" />
            <circle cx="78" cy="50" r="3" fill="#4d96ff" />
            <circle cx="122" cy="50" r="3" fill="#4d96ff" />
          </g>
        ),
      },
      {
        id: 'cowboy',
        label: 'Cowboy',
        emoji: '🤠',
        render: () => (
          <g fill="#9a6a3a">
            <ellipse cx="100" cy="52" rx="56" ry="13" />
            <path d="M70 54 Q72 18 100 18 Q128 18 130 54 Z" />
            <rect x="70" y="44" width="60" height="8" fill="#6f4a26" />
          </g>
        ),
      },
    ],
  },
  {
    slot: 'eyewear',
    label: 'Eyewear',
    options: [
      { id: 'none', label: 'None', emoji: '🚫' },
      {
        id: 'round',
        label: 'Round',
        emoji: '👓',
        render: () => (
          <g fill="none" stroke="#2b2b33" strokeWidth="3.5">
            <circle cx="82" cy="74" r="13" fill="rgba(180,220,255,0.25)" />
            <circle cx="118" cy="74" r="13" fill="rgba(180,220,255,0.25)" />
            <path d="M95 74 H105" />
            <path d="M69 70 L56 64 M131 70 L144 64" strokeLinecap="round" />
          </g>
        ),
      },
      {
        id: 'sunglasses',
        label: 'Shades',
        emoji: '🕶️',
        render: () => (
          <g fill="#15151a">
            <rect x="66" y="66" width="30" height="18" rx="7" />
            <rect x="104" y="66" width="30" height="18" rx="7" />
            <rect x="95" y="71" width="10" height="5" />
            <path d="M66 70 L54 64 M134 70 L146 64" stroke="#15151a" strokeWidth="3.5" strokeLinecap="round" />
          </g>
        ),
      },
      {
        id: 'nerd',
        label: 'Big',
        emoji: '🤓',
        render: () => (
          <g fill="rgba(255,255,255,0.2)" stroke="#1b1b1b" strokeWidth="5">
            <rect x="64" y="62" width="30" height="26" rx="6" />
            <rect x="106" y="62" width="30" height="26" rx="6" />
            <path d="M94 72 H106" />
          </g>
        ),
      },
    ],
  },
  {
    slot: 'shirt',
    label: 'Shirt',
    options: [
      { id: 'none', label: 'None', emoji: '🚫' },
      { id: 'tee-red', label: 'Red Tee', emoji: '👕', render: () => tee('#e63946') },
      { id: 'tee-blue', label: 'Blue Tee', emoji: '🔵', render: () => tee('#4d96ff') },
      {
        id: 'hoodie',
        label: 'Hoodie',
        emoji: '🧥',
        render: () =>
          tee(
            '#3a7d5a',
            <g>
              <path d="M74 150 Q100 126 126 150 Q100 140 74 150 Z" fill="#2f6749" />
              <path d="M82 214 H118 L112 236 H88 Z" fill="#2f6749" />
              <path d="M92 150 L90 168 M108 150 L110 168" stroke="#dfe8e2" strokeWidth="3" strokeLinecap="round" />
            </g>
          ),
      },
    ],
  },
  {
    slot: 'scarf',
    label: 'Scarf',
    options: [
      { id: 'none', label: 'None', emoji: '🚫' },
      {
        id: 'scarf-red',
        label: 'Red',
        emoji: '🧣',
        render: () => (
          <g fill="#d23b4a">
            <rect x="62" y="128" width="76" height="17" rx="8" />
            <path d="M116 140 l16 4 l-5 48 l-17 -4 z" />
            <rect x="110" y="188" width="20" height="6" fill="#a82c39" />
          </g>
        ),
      },
      {
        id: 'scarf-teal',
        label: 'Teal',
        emoji: '🟢',
        render: () => (
          <g fill="#2a9d8f">
            <rect x="62" y="128" width="76" height="17" rx="8" />
            <path d="M116 140 l16 4 l-5 48 l-17 -4 z" />
            <rect x="110" y="188" width="20" height="6" fill="#1f7d72" />
          </g>
        ),
      },
    ],
  },
  {
    slot: 'pants',
    label: 'Pants',
    options: [
      { id: 'none', label: 'None', emoji: '🚫' },
      { id: 'jeans', label: 'Jeans', emoji: '👖', render: () => jeansLegs('#4a6fa5', 228, 66) },
      { id: 'shorts', label: 'Shorts', emoji: '🩳', render: () => jeansLegs('#d98a3d', 228, 34) },
      {
        id: 'overalls',
        label: 'Overalls',
        emoji: '👷',
        render: () => (
          <g>
            {jeansLegs('#3f5f8f', 226, 66)}
            <rect x="80" y="176" width="40" height="56" rx="6" fill="#3f5f8f" />
            <path d="M84 178 L74 152 M116 178 L126 152" stroke="#3f5f8f" strokeWidth="8" strokeLinecap="round" />
            <circle cx="88" cy="200" r="3" fill="#d9c24a" />
            <circle cx="112" cy="200" r="3" fill="#d9c24a" />
          </g>
        ),
      },
    ],
  },
  {
    slot: 'shoes',
    label: 'Shoes',
    options: [
      { id: 'none', label: 'None', emoji: '🚫' },
      {
        id: 'sneakers',
        label: 'Sneakers',
        emoji: '👟',
        render: () => (
          <g>
            {shoe(82, '#e63946')}
            {shoe(118, '#e63946')}
          </g>
        ),
      },
      {
        id: 'boots',
        label: 'Boots',
        emoji: '🥾',
        render: () => (
          <g>
            {boot(82)}
            {boot(118)}
          </g>
        ),
      },
    ],
  },
]

// Back-to-front draw order so garments overlap naturally.
const LAYER_ORDER = ['pants', 'shoes', 'shirt', 'scarf', 'eyewear', 'hat']

// A pleasant starter outfit (so the bear isn't bare on first open).
export const DEFAULT_OUTFIT = {
  hat: 'none',
  eyewear: 'none',
  shirt: 'tee-red',
  scarf: 'none',
  pants: 'jeans',
  shoes: 'sneakers',
}

const catBySlot = (slot) => WARDROBE.find((c) => c.slot === slot)

// A random outfit (each slot independently; "none" is a valid pick).
export function randomOutfit() {
  const out = {}
  for (const cat of WARDROBE) {
    const opts = cat.options
    out[cat.slot] = opts[Math.floor(Math.random() * opts.length)].id
  }
  return out
}

export function DressUpBear({ outfit }) {
  return (
    <svg viewBox="0 0 200 340" className="explore-du__bear-svg" aria-label="The bear">
      <BaseBear />
      {LAYER_ORDER.map((slot) => {
        const opt = catBySlot(slot)?.options.find((o) => o.id === outfit[slot])
        return opt?.render ? <g key={slot}>{opt.render()}</g> : null
      })}
    </svg>
  )
}
