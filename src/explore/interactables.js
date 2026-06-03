import { projects } from '../data/projects'
import {
  trailersPromos,
  socialShortForm,
  narrativeDocumentary,
  aiVideos,
} from '../data/videos'
import maxProfile from '../assets/maxProfile2.jpg'

/* Interactive kiosks placed in the world. Each entry has a `type` that tells
 * InteractionOverlay which content panel to render on walk-up:
 *   - 'project'       → a software-dev project (linked `project` from projects.js)
 *   - 'videoCategory' → a video category (linked `category` from videos.js)
 *   - 'about'         → bio + photo + get-in-touch panel (`about`)
 *
 * `position` is world-space, `rotationY` faces the screen toward the player,
 * `radius` is how close (world units) the player must be for the prompt.
 */
const bySlug = (slug) => projects.find((p) => p.slug === slug)

/* --- Software Dev island (origin) ---
 * A ~144° arc in front of spawn (radius 15), each rotated to face the island
 * center so the screen greets you as you approach.
 *   position = [15·sinβ, 0, -15·cosβ],  rotationY = -β  (β = -72°..+72°). */
const devKiosks = [
  { id: 'typenex', position: [0, 0, -15], rotationY: 0, radius: 5, project: bySlug('typenex') },
  { id: 'artchi', position: [-8.8, 0, -12.1], rotationY: 0.63, radius: 5, project: bySlug('artchi') },
  { id: 'timpine-therapy', position: [8.8, 0, -12.1], rotationY: -0.63, radius: 5, project: bySlug('timpine-therapy') },
  { id: 'chicago-venture', position: [-14.3, 0, -4.6], rotationY: 1.26, radius: 5, project: bySlug('chicago-venture') },
  { id: 'emergent-trading', position: [14.3, 0, -4.6], rotationY: -1.26, radius: 5, project: bySlug('emergent-trading') },
].map((k) => ({ ...k, type: 'project' }))

/* --- Videography island (center [54,0,75], radius 26) ---
 * The west bridge lands the player at world ~[31,75]; these 4 screens fan
 * across the island's inner half, each rotated to face that entrance so the
 * player walks into a welcoming arc of category screens. (The whole fan is
 * the original layout shifted -18 on x with the island; rotations are
 * unchanged since each screen's offset from the entrance is preserved.) */
const videoKiosks = [
  {
    id: 'video-trailers', position: [47.5, 0, 83.9], rotationY: -2.07, radius: 5,
    category: { label: 'Trailers & Promos', thumbnail: '/trailersThumbnail.png', videos: trailersPromos },
  },
  {
    id: 'video-social', position: [43.5, 0, 78.4], rotationY: -1.84, radius: 5,
    category: { label: 'Social & Short Form', thumbnail: '/socialThumbnail.png', videos: socialShortForm, vertical: true },
  },
  {
    id: 'video-narrative', position: [43.5, 0, 71.6], rotationY: -1.30, radius: 5,
    category: { label: 'Narrative & Documentary', thumbnail: '/narrativeThumbnail.png', videos: narrativeDocumentary },
  },
  {
    id: 'video-ai', position: [47.5, 0, 66.1], rotationY: -1.08, radius: 5,
    category: { label: 'AI', thumbnail: '/aiThumbnail.png', videos: aiVideos },
  },
].map((k) => ({ ...k, type: 'videoCategory' }))

/* --- About island (center [-40,0,75], radius 14) ---
 * One merged stop: bio + photo + a get-in-touch section (Contact folded in
 * here since both pages are thin). Bridge lands the player on the east side
 * (~world [-29,75]) walking -x, so the screen sits just past center and faces
 * +x toward the entrance. Bio text mirrors src/pages/About.jsx; contactText
 * mirrors src/pages/Contact.jsx (keep in sync if those change). */
const aboutKiosk = {
  id: 'about', type: 'about', position: [-42, 0, 75], rotationY: Math.PI / 2, radius: 5,
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

/* Type-agnostic accessors so the in-world kiosk (screen texture + proximity
 * label) doesn't need to branch on type. */
export const interactableTitle = (it) => {
  switch (it.type) {
    case 'videoCategory': return it.category.label
    case 'about': return 'About Max'
    default: return it.project.title
  }
}

export const interactableImage = (it) => {
  switch (it.type) {
    case 'videoCategory': return it.category.thumbnail
    case 'about': return it.about.photo
    default: return it.project.image
  }
}
