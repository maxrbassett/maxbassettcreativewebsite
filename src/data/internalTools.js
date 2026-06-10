// ============================================================
//  INTERNAL TOOLS — Software Dev building, "Internal Tools" cove
//
//  Internal/confidential apps can't be shown directly, but the work
//  can be described at a high level. Each entry follows a
//  Problem → Approach → Impact format (what recruiters skim for),
//  with no confidential UI — just the thinking, scope, and results.
//
//  Fields:
//    id        — unique slug
//    title     — project name
//    role      — your role
//    problem   — the business/technical problem it solved
//    approach  — what you built + key decisions
//    impact    — array of short, concrete outcomes
//    stack     — technologies used
//    image     — optional safe graphic in /public/dev/; null → solid screen
// ============================================================

export const internalTools = [
  {
    id: 'pim-system',
    title: 'In-House PIM System',
    role: 'Architect & Lead Developer',
    problem:
      'Product data for a large medical-device catalog lived in scattered spreadsheets and disconnected systems, so the same SKU could read differently across tools and the public site — and every content change meant pulling in a developer.',
    approach:
      'Architected a custom Product Information Management system as the single canonical source of truth for the catalog, modeling a deep product hierarchy that stays queryable and fast at scale. I built it as a Django/PostgreSQL backend with a React admin frontend and an Algolia search layer, then exposed the data through a GraphQL API so internal tools and the public site all read from one place.',
    impact: [
      'One canonical source for 7,000+ SKUs and 25,000+ competitor entries',
      'Powers a public catalog plus multiple internal tools off a single GraphQL API',
      'Eliminated near-weekly developer involvement in content updates',
    ],
    stack: ['React', 'Django', 'PostgreSQL', 'GraphQL (Apollo)', 'Algolia'],
    image: null,
  },
  {
    id: 'quote-tool',
    title: 'Quote Tool',
    role: 'Architect & Full-stack Developer',
    problem:
      'Sales reps needed to search thousands of products, configure pricing, and get a quote in front of a customer quickly — but the existing process was slow, manual, and disconnected from the CRM where deals actually lived.',
    approach:
      'Built the Quote Tool from the ground up: a TypeScript/React frontend backed by an Apollo GraphQL middleware server over a Django/PostgreSQL backend. Reps can search the full catalog, configure pricing, generate PDFs, and send quotes in real time. I integrated it with Salesforce so quotes link directly to accounts, contacts, and opportunities.',
    impact: [
      'Lets 100+ users quote against 25,000+ SKUs in real time',
      'One-click PDF generation and send, straight from the catalog',
      'Salesforce integration ties every quote to the right account and opportunity',
    ],
    stack: ['TypeScript', 'React', 'GraphQL (Apollo)', 'Django', 'PostgreSQL', 'Salesforce API'],
    image: null,
  },
  {
    id: 'power-hour',
    title: 'Power Hour — Real-Time Sales Game',
    role: 'Architect & Full-stack Developer',
    problem:
      'The sales floor wanted a recurring, high-energy competition to drive call volume — something live and shared, not a static dashboard that nobody looked at.',
    approach:
      'Designed and delivered a fully gamified, real-time competition platform built on Socket.io WebSockets — synchronized avatar states, live leaderboards, live chat, a traffic-light countdown, and an animated trophy reveal. I engineered all of the UI animation from scratch and diagnosed a tricky React re-rendering bug that was cutting animations short mid-sequence, fixing it with precisely timed render-blocking logic.',
    impact: [
      'Used daily by ~30 sales managers and reps',
      'Live synchronized state across every connected client',
      'Custom CSS animation system for countdowns and reveals',
    ],
    stack: ['React', 'Node.js', 'Socket.io', 'CSS animations'],
    image: null,
  },
  {
    id: 'call-tracker',
    title: 'Call Tracker Dashboard',
    role: 'Full-stack Developer',
    problem:
      'Managers wanted live visibility into call activity and team rankings without anyone having to log in, refresh, or click — a passive, always-on view for the office.',
    approach:
      'Built a real-time dashboard for large-screen TV display, integrating a live Asterisk phone-system event stream through a Node.js middleware layer. It surfaces call status and team rankings the instant they change, with layout and refresh tuned for an always-on monitor that needs no user interaction.',
    impact: [
      'Always-on team visibility with zero user interaction',
      'Live call status and rankings driven by a real-time phone-system feed',
      'Tuned specifically for passive large-screen office display',
    ],
    stack: ['React', 'Node.js', 'WebSockets', 'Asterisk'],
    image: null,
  },
]
