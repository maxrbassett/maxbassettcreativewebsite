import { projects } from '../data/projects'

/* Interactive objects placed in the world. Phase 2b ships one — the Typenex
 * kiosk — but this is an array so adding the rest of the projects later is
 * just more entries. `radius` is how close (world units) the player must be
 * for the interact prompt to appear. */
const bySlug = (slug) => projects.find((p) => p.slug === slug)

export const INTERACTABLES = [
  { id: 'typenex', position: [0, 0, -10], radius: 5, project: bySlug('typenex') },
]
