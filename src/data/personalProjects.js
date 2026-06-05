// ============================================================
//  PERSONAL PROJECTS — things built for the love of it
//
//  Shown in the Software Dev building's "Personal Projects" cove.
//  Same shape as src/data/projects.js (rendered by the same panel).
//  The first entry is this 3D world itself; the rest are PLACEHOLDERS —
//  replace with your real personal projects (add as many as you like and
//  bump the `personal` room's screenCount in worldLayout.js to match).
//
//  Fields: slug, title, url, image (or null → solid screen), role,
//          description, stack[]
// ============================================================

export const personalProjects = [
  {
    slug: 'explore-3d',
    title: 'Explore — 3D Portfolio World',
    url: '/explore',
    image: null,
    role: 'Solo Project',
    description:
      "The interactive 3D world you're standing in. A floating sky-archipelago you wander as a low-poly character to browse my work, built as a navigation layer over the classic site. I built the world, character controller, custom camera, and a code-based collision/boundary system. Made with React, Three.js, React Three Fiber, Rapier physics, and ecctrl.",
    stack: ['React', 'Three.js', 'React Three Fiber', 'Rapier', 'ecctrl'],
  },
  {
    slug: 'personal-placeholder-1',
    title: 'Personal Project (Placeholder)',
    url: '',
    image: null,
    role: 'Solo Project',
    description:
      'Placeholder — replace with one of your personal projects. A sentence or two on what it is, what you built, and the tech behind it.',
    stack: ['React'],
  },
  {
    slug: 'personal-placeholder-2',
    title: 'Personal Project (Placeholder)',
    url: '',
    image: null,
    role: 'Solo Project',
    description:
      'Placeholder — replace with another personal project. Keep it short and focused on what you made.',
    stack: ['JavaScript'],
  },
]
