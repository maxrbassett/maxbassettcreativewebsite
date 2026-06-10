// ============================================================
//  PERSONAL PROJECTS — things built for the love of it
//
//  Shown in the Software Dev building's "Personal Projects" cove.
//  Same shape as src/data/projects.js (rendered by the same panel).
//  An entry with image: null shows a generated poster (title + motif)
//  on the screen and the card; otherwise drop a screenshot in
//  /public/dev/ matching the `image` filename.
//
//  Fields: slug, title, url, image (or null → generated poster), role,
//          description, stack[]
// ============================================================

export const personalProjects = [
  {
    slug: 'explore-3d',
    title: 'Explore — 3D Portfolio World',
    url: '/explore',
    image: '/dev/explore-3d.png',
    role: 'Solo Project',
    description:
      "The interactive 3D world you're standing in — a floating sky-archipelago you wander as a low-poly character to browse my work, built as a navigation layer over the classic site. I built the world, character controller, custom camera, and a code-based collision/boundary system, pair-programming with Claude Code throughout. Made with React, Three.js, React Three Fiber, Rapier physics, and ecctrl.",
    stack: ['React', 'Three.js', 'React Three Fiber', 'Rapier', 'ecctrl', 'Claude Code'],
  },
  {
    slug: 'q-game',
    title: 'The Q Game',
    url: 'https://qgame1.netlify.app',
    image: '/dev/q-game.png',
    role: 'Solo Project',
    description:
      "A mobile-first progressive web app that turns conversation-starter questions into a social guessing game. You swipe through a deck of thousands of prompts — would-you-rathers, rating scales, 'have you ever' — answering, favoriting, and organizing them with a flexible three-layer tagging system. Its standout is a two-sided multiplayer mode: you answer a question and send it to a friend who guesses what you said before revealing their own, then the round bounces back so you can guess theirs — all archived in a head-to-head history with real-time turn notifications. Under the hood it's a React 18 + Vite SPA on Supabase (Postgres, Auth, real-time), with global state flowing through a single context and every persistence call funneled through one storage seam so guest and cloud modes share an interface. Correctness lives at the database layer — row-level security scopes every read and write, and Postgres triggers make committed answers immutable so the game can't be cheated. Built with Claude Code as my pair programmer.",
    stack: ['React', 'Vite', 'Supabase', 'PostgreSQL', 'CSS Modules', 'Claude Code'],
  },
  {
    slug: '30-days-to-30',
    title: '30 Days to 30',
    url: 'https://github.com/maxrbassett/birthday-countdown',
    image: null,
    role: 'Solo Project',
    description:
      "An experimental web app that delivers a personalized countdown in Instagram-stories format — one chapter unlocks each day leading up to a big moment like a birthday or wedding. Each day reveals that day's story: a video from a loved one, a quote, and other personal touches saved for exactly the right moment. Built with React and Firebase, using react-insta-stories for the tap-through story flow. So far its audience has been a happy one — I built it for my wife — but it's a concept I'd love to develop into something many more people can use.",
    stack: ['React', 'Firebase', 'react-insta-stories', 'Bootstrap'],
  },
]
