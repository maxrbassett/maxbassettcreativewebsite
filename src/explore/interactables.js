import { projects } from '../data/projects'
import {
  trailersPromos,
  socialShortForm,
  narrativeDocumentary,
  aiVideos,
} from '../data/videos'
import { internalTools } from '../data/internalTools'
import { management } from '../data/management'
import { personalProjects } from '../data/personalProjects'
import maxProfile from '../assets/maxProfile2.jpg'
import { wallSlots, coveSlots, BUILDING_ROOMS, NPC_POSITION, NPC_ROTATION_Y } from './worldLayout'

/* Interactive wall-mounted screens inside the museum islands. Each entry has a
 * `type` that tells InteractionOverlay which content panel to render on
 * walk-up:
 *   - 'project' → a software-dev project (linked `project` from projects.js)
 *   - 'video'   → a single YouTube video (linked `video`); walk-up plays it in
 *                 an iframe popup
 *   - 'about'   → bio + photo + get-in-touch panel (`about`)
 *   - 'npc'     → the welcome NPC ("Max"); a stepped dialogue box (`npc.lines`)
 *
 * Positions/rotations are NOT hand-placed — `wallSlots` distributes each
 * island's screens around its interior wall (facing the room center), so they
 * stay correct automatically if an island moves or resizes. `radius` is the
 * walk-up proximity distance.
 */
const bySlug = (slug) => projects.find((p) => p.slug === slug)
const PROXIMITY = 5

// --- Software Dev museum, "Public Web" room: the live client sites, all on
// the one labeled wall left of the entrance. ---
const devSlugs = ['typenex', 'artchi', 'timpine-therapy', 'chicago-venture', 'emergent-trading']
const webSlots = coveSlots('dev', 'web')
const devKiosks = devSlugs.slice(0, webSlots.length).map((slug, i) => ({
  id: slug,
  type: 'project',
  radius: PROXIMITY,
  position: webSlots[i].position,
  rotationY: webSlots[i].rotationY,
  project: bySlug(slug),
}))

// --- "Personal Projects" room: things built for the love of it (incl. this
// 3D world), on the wall right of the entrance. ---
const personalSlots = coveSlots('dev', 'personal')
const personalKiosks = personalProjects.slice(0, personalSlots.length).map((p, i) => ({
  id: `personal-${p.slug}`,
  type: 'project',
  radius: PROXIMITY,
  position: personalSlots[i].position,
  rotationY: personalSlots[i].rotationY,
  project: p,
}))

// --- Software Dev museum, "Internal Tools" room: confidential work shown via
// Problem → Approach → Impact panels (no UI shown). Curated to the room. ---
const internalSlots = coveSlots('dev', 'internal')
const internalKiosks = internalTools.slice(0, internalSlots.length).map((tool, i) => ({
  id: tool.id,
  type: 'internal',
  radius: PROXIMITY,
  position: internalSlots[i].position,
  rotationY: internalSlots[i].rotationY,
  internal: tool,
}))

// --- Software Dev museum, "Management" room: leadership work (team lead,
// delivery, standards, mentorship) shown as lighter highlight panels. Back wall,
// right of the rear partition (next to Internal Tools). ---
const managementSlots = coveSlots('dev', 'management')
const managementKiosks = management.slice(0, managementSlots.length).map((item, i) => ({
  id: item.id,
  type: 'management',
  radius: PROXIMITY,
  position: managementSlots[i].position,
  rotationY: managementSlots[i].rotationY,
  management: item,
}))

// --- Videography museum: one room (cove) per category, each curated to its
// room's screen count. Trailers/Narrative/AI are 16:9; Social & Short Form is
// 9:16 (vertical), flagged so the screen renders portrait. Walk-up plays the
// video in an iframe popup. ---
const VIDEO_SOURCES = {
  trailers: trailersPromos,
  social: socialShortForm,
  narrative: narrativeDocumentary,
  ai: aiVideos,
}
// Optional explicit curation/order per room (by youtubeId). The entrance room
// (trailers) fills flank-by-flank, so this order also keeps the Believer (idx 1
// → left flank) and General Conference (idx 3 → right flank) trailers apart.
const VIDEO_CURATION = {
  trailers: [
    '1qE5tWuvYzQ', // Old Town
    'Mx7fu1LC6K4', // Believer (recut music video)
    'MZ1u0Dejh_Y', // Pink Panther (recut)
    'UL5YojeR598', // General Conference
  ],
  social: [
    '7uti1teAqFU', // Fulton Lee Demo 1
    'iLdk56kHwxY', // Fulton Lee Demo 2
    'b_ORalcozsU', // Global Youth Service Day
    '8eLL2YdVL5k', // Giving Machine 2024
    'r4FtGcrqeZI', // Inspiration | It's Okay to Cry  (swapped in for Jena's Story)
  ],
}
const pickVideos = (key, n) => {
  const src = VIDEO_SOURCES[key] || []
  const ids = VIDEO_CURATION[key]
  const chosen = ids
    ? ids.map((id) => src.find((v) => v.youtubeId === id)).filter(Boolean)
    : src
  return chosen.slice(0, n)
}
const videoKiosks = BUILDING_ROOMS.video.flatMap((room) => {
  const slots = coveSlots('video', room.key)
  const vids = pickVideos(room.key, slots.length)
  return vids.map((v, i) => ({
    id: `vid-${v.youtubeId}`, // youtubeId is unique; some data `id`s repeat
    type: 'video',
    radius: PROXIMITY,
    vertical: room.key === 'social',
    position: slots[i].position,
    rotationY: slots[i].rotationY,
    video: { youtubeId: v.youtubeId, title: v.title },
  }))
})

// --- About museum: one merged stop (bio + photo + get-in-touch). Bio text
// mirrors src/pages/About.jsx; contactText mirrors src/pages/Contact.jsx. ---
const aboutSlot = wallSlots('about', 1)[0]
const aboutKiosk = {
  id: 'about',
  type: 'about',
  radius: PROXIMITY,
  position: aboutSlot.position,
  rotationY: aboutSlot.rotationY,
  about: {
    name: 'Max Bassett',
    photo: maxProfile,
    paragraphs: [
      "I'm a software developer based in Lancaster, South Carolina. I build web apps, sites, and internal tools — combining clean engineering with careful attention to design and user experience. I currently work as a Senior Full-stack Developer at Chicago Venture Partners and assist in the software development for their portfolio companies, including Typenex Medical, a medical device company supplying hospitals, clinics, and surgery centers with the tools they need to provide better care. I also work as a freelance web developer for small businesses and growing teams.",
      "I'm always interested in connecting with new people and learning about interesting projects. If you'd like to chat, feel free to reach out!",
    ],
    contactText: "Have a project in mind? Whether it's a website, a web app, an internal tool, or a video project — I'd love to hear about it.",
  },
}

// --- Welcome NPC ("Max") next to spawn. Auto-greets on load; talk again with
// E. Rendered as a character (not a kiosk) by <Npc>; this entry just drives
// proximity + the dialogue. ---
export const NPC = {
  id: 'npc-max',
  type: 'npc',
  radius: 7,
  position: NPC_POSITION,
  rotationY: NPC_ROTATION_Y,
  npc: {
    name: 'Max',
    lines: [
      'Welcome to my 3d portfolio world, built entirely with web tools.',
      "I'm Max — each building here is a different part of what I do.",
      'Inside, walk up to a screen and press E, or click, to take a closer look.',
      "Oh — and keep your eyes open.",
      "I hear there's a secret land hidden somewhere below…",
      "Enjoy exploring!",
    ],
  },
}

export const INTERACTABLES = [...devKiosks, ...personalKiosks, ...internalKiosks, ...managementKiosks, ...videoKiosks, aboutKiosk, NPC]

/* Type-agnostic accessors so the in-world screen (texture + proximity label)
 * doesn't need to branch on type. */
export const interactableTitle = (it) => {
  switch (it.type) {
    case 'video': return it.video.title
    case 'about': return 'About Max'
    case 'npc': return it.npc.name
    case 'internal': return it.internal.title
    case 'management': return it.management.title
    default: return it.project.title
  }
}

export const interactableImage = (it) => {
  switch (it.type) {
    // Same thumbnail the main site uses (hqdefault); vertical screens center-crop
    // it to fill the portrait panel, matching the site's object-fit: cover cards.
    case 'video': return `https://img.youtube.com/vi/${it.video.youtubeId}/hqdefault.jpg`
    case 'about': return it.about.photo
    case 'npc': return null
    case 'internal': return it.internal.image || null
    case 'management': return it.management.image || null
    default: return it.project.image
  }
}
