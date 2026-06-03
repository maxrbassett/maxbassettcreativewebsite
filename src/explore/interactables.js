import { projects } from '../data/projects'
import {
  trailersPromos,
  narrativeDocumentary,
  aiVideos,
} from '../data/videos'
import maxProfile from '../assets/maxProfile2.jpg'
import { wallSlots } from './worldLayout'

/* Interactive wall-mounted screens inside the museum islands. Each entry has a
 * `type` that tells InteractionOverlay which content panel to render on
 * walk-up:
 *   - 'project' → a software-dev project (linked `project` from projects.js)
 *   - 'video'   → a single YouTube video (linked `video`); walk-up plays it in
 *                 an iframe popup
 *   - 'about'   → bio + photo + get-in-touch panel (`about`)
 *
 * Positions/rotations are NOT hand-placed — `wallSlots` distributes each
 * island's screens around its interior wall (facing the room center), so they
 * stay correct automatically if an island moves or resizes. `radius` is the
 * walk-up proximity distance.
 */
const bySlug = (slug) => projects.find((p) => p.slug === slug)
const PROXIMITY = 5

// --- Software Dev museum: 5 project screens around the wall ---
const devSlugs = ['typenex', 'artchi', 'timpine-therapy', 'chicago-venture', 'emergent-trading']
const devSlots = wallSlots('dev', devSlugs.length)
const devKiosks = devSlugs.map((slug, i) => ({
  id: slug,
  type: 'project',
  radius: PROXIMITY,
  position: devSlots[i].position,
  rotationY: devSlots[i].rotationY,
  project: bySlug(slug),
}))

// --- Videography museum: one screen per horizontal video, around the wall.
// (The 16:9 categories — trailers, narrative, AI; the vertical Social/Short
// Form set is omitted here since the wall screens are horizontal.) Walk-up
// plays the video in an iframe popup. ---
const horizontalVideos = [...trailersPromos, ...narrativeDocumentary, ...aiVideos]
const videoSlots = wallSlots('video', horizontalVideos.length)
const videoKiosks = horizontalVideos.map((v, i) => ({
  id: `vid-${v.youtubeId}`, // youtubeId is unique; some data `id`s repeat
  type: 'video',
  radius: PROXIMITY,
  position: videoSlots[i].position,
  rotationY: videoSlots[i].rotationY,
  video: { youtubeId: v.youtubeId, title: v.title },
}))

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

export const INTERACTABLES = [...devKiosks, ...videoKiosks, aboutKiosk]

/* Type-agnostic accessors so the in-world screen (texture + proximity label)
 * doesn't need to branch on type. */
export const interactableTitle = (it) => {
  switch (it.type) {
    case 'video': return it.video.title
    case 'about': return 'About Max'
    default: return it.project.title
  }
}

export const interactableImage = (it) => {
  switch (it.type) {
    case 'video': return `https://img.youtube.com/vi/${it.video.youtubeId}/hqdefault.jpg`
    case 'about': return it.about.photo
    default: return it.project.image
  }
}
