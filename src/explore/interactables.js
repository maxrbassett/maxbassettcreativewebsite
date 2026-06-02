import { projects } from '../data/projects'
import {
  trailersPromos,
  socialShortForm,
  narrativeDocumentary,
  aiVideos,
} from '../data/videos'

/* Interactive kiosks placed in the world. Each entry has a `type` that tells
 * InteractionOverlay which content panel to render on walk-up:
 *   - 'project'       → a software-dev project (linked `project` from projects.js)
 *   - 'videoCategory' → a video category (linked `category` from videos.js)
 * (Phase 4 adds videoCategory; about/contact types come next.)
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

/* --- Videography island (center [72,0,75], radius 26) ---
 * The west bridge lands the player at world ~[49,75]; these 4 screens fan
 * across the island's inner half, each rotated to face that entrance so the
 * player walks into a welcoming arc of category screens.
 * (rotationY = atan2(49-x, 75-z): screen's local +z aims at the entrance.) */
const videoKiosks = [
  {
    id: 'video-trailers', position: [65.5, 0, 83.9], rotationY: -2.07, radius: 5,
    category: { label: 'Trailers & Promos', thumbnail: '/trailersThumbnail.png', videos: trailersPromos },
  },
  {
    id: 'video-social', position: [61.5, 0, 78.4], rotationY: -1.84, radius: 5,
    category: { label: 'Social & Short Form', thumbnail: '/socialThumbnail.png', videos: socialShortForm, vertical: true },
  },
  {
    id: 'video-narrative', position: [61.5, 0, 71.6], rotationY: -1.30, radius: 5,
    category: { label: 'Narrative & Documentary', thumbnail: '/narrativeThumbnail.png', videos: narrativeDocumentary },
  },
  {
    id: 'video-ai', position: [65.5, 0, 66.1], rotationY: -1.08, radius: 5,
    category: { label: 'AI', thumbnail: '/aiThumbnail.png', videos: aiVideos },
  },
].map((k) => ({ ...k, type: 'videoCategory' }))

export const INTERACTABLES = [...devKiosks, ...videoKiosks]

/* Type-agnostic accessors so the in-world kiosk (screen texture + proximity
 * label) doesn't need to branch on type. */
export const interactableTitle = (it) =>
  it.type === 'videoCategory' ? it.category.label : it.project.title

export const interactableImage = (it) =>
  it.type === 'videoCategory' ? it.category.thumbnail : it.project.image
