// ============================================================
//  INTERNAL TOOLS — PLACEHOLDER CONTENT
//
//  Internal/confidential apps can't be shown directly, but the
//  work can be described at a high level. Each entry follows a
//  Problem → Approach → Impact format (what recruiters skim for),
//  with no confidential UI — just the thinking, scope, and results.
//
//  ⚠️ The text below is PLACEHOLDER/sample — replace with your real
//  projects. Keep details high-level and NDA-safe.
//
//  Fields:
//    id        — unique slug
//    title     — project name (generic is fine, e.g. "Internal Reporting Platform")
//    role      — your role (e.g. "Lead Developer")
//    problem   — the business/technical problem it solved
//    approach  — what you built + key decisions (your role on a team)
//    impact    — array of short, concrete outcomes (metrics if you can)
//    stack     — technologies used
//    image     — optional safe graphic (architecture diagram in /public/dev/);
//                leave null to show a solid screen in-world
// ============================================================

export const internalTools = [
  {
    id: 'internal-reporting',
    title: 'Internal Reporting Platform',
    role: 'Lead Developer',
    problem:
      'Operations teams reconciled data by hand across several disconnected systems, a slow and error-prone process that delayed monthly reporting. (Placeholder — replace with the real problem.)',
    approach:
      'Designed and built a centralized reporting platform: a React dashboard backed by a Node/GraphQL API that pulls from the internal systems on a schedule, normalizes the data, and surfaces it through filterable views and exports. I owned the data model and the front end. (Placeholder.)',
    impact: [
      'Cut monthly reconciliation from days to hours',
      'Single source of truth across 4+ internal systems',
      'Self-serve reports for non-technical staff',
    ],
    stack: ['React', 'Node.js', 'GraphQL', 'PostgreSQL'],
    image: null,
  },
  {
    id: 'internal-workflow',
    title: 'Workflow Automation Service',
    role: 'Full-stack Developer',
    problem:
      'A high-volume manual process required staff to move data between tools by hand, creating a bottleneck and frequent mistakes. (Placeholder — replace with the real problem.)',
    approach:
      'Built an event-driven automation service that watches for triggers, applies business rules, and updates the downstream systems automatically, with an admin UI for monitoring and overrides. (Placeholder.)',
    impact: [
      'Eliminated a recurring manual bottleneck',
      'Near-real-time processing with full audit trail',
      'Reduced processing errors substantially',
    ],
    stack: ['Node.js', 'TypeScript', 'Queue/Webhooks', 'REST'],
    image: null,
  },
  {
    id: 'internal-integration',
    title: 'Systems Integration / Data Sync',
    role: 'Developer',
    problem:
      'Two core internal systems held overlapping data that drifted out of sync, causing downstream inconsistencies. (Placeholder — replace with the real problem.)',
    approach:
      'Implemented a sync layer that maps and reconciles records between the systems, with conflict handling and observability so the team can trust the data. (Placeholder.)',
    impact: [
      'Kept critical records consistent across systems',
      'Surfaced and resolved data conflicts automatically',
      'Cut support tickets caused by mismatched data',
    ],
    stack: ['Node.js', 'REST APIs', 'PostgreSQL'],
    image: null,
  },
]
