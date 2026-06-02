import { projects } from '../data/projects'

/* Interactive kiosks placed in the world, one per software-dev project.
 * Arranged in a ~144° arc in front of spawn (radius 15), each rotated to
 * face the island center so the screen greets you as you approach.
 * `radius` is how close (world units) the player must be for the prompt.
 *
 * Positions/rotations were derived from arc angles β = -72°..+72°:
 *   position = [15·sinβ, 0, -15·cosβ],  rotationY = -β  (so screen faces center). */
const bySlug = (slug) => projects.find((p) => p.slug === slug)

export const INTERACTABLES = [
  { id: 'typenex', position: [0, 0, -15], rotationY: 0, radius: 5, project: bySlug('typenex') },
  { id: 'artchi', position: [-8.8, 0, -12.1], rotationY: 0.63, radius: 5, project: bySlug('artchi') },
  { id: 'timpine-therapy', position: [8.8, 0, -12.1], rotationY: -0.63, radius: 5, project: bySlug('timpine-therapy') },
  { id: 'chicago-venture', position: [-14.3, 0, -4.6], rotationY: 1.26, radius: 5, project: bySlug('chicago-venture') },
  { id: 'emergent-trading', position: [14.3, 0, -4.6], rotationY: -1.26, radius: 5, project: bySlug('emergent-trading') },
]
