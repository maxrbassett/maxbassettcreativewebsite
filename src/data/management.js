// ============================================================
//  MANAGEMENT — Software Dev building, "Management" cove
//
//  Leadership work as Web Team Lead: team leadership, cross-functional
//  delivery, standards, and mentorship. Lighter "highlights" format
//  (no Problem/Approach/Impact) — a context line plus a few bullets.
//
//  Fields:
//    id         — unique slug
//    title      — initiative name
//    role       — your role / context line (shown under the title)
//    summary    — one or two sentences of context (optional)
//    highlights — array of short, concrete bullet points
//    stack      — optional tools/tech (only where relevant)
//    image      — optional safe graphic in /public/dev/; null → solid screen
// ============================================================

export const management = [
  {
    id: 'erp-migration',
    title: 'ERP Migration Leadership',
    role: 'Web Team Lead',
    summary:
      'Led a team of 7 developers through a full-scale ERP migration from Oracle Forms to Oracle APEX — 100+ pages and 20+ business workflows that the company runs on every day.',
    highlights: [
      'Ran weekly stakeholder meetings with 20+ attendees, translating technical decisions into clear priorities',
      'Managed sprint planning and daily standups across multiple concurrent projects',
      'Drove months-long UAT cycles to completion without disrupting the workflows people depend on',
    ],
    stack: ['Oracle APEX', 'Sprint planning', 'UAT'],
    image: null,
  },
  {
    id: 'testing-quality',
    title: 'Testing & Quality Leadership',
    role: 'Web Team Lead',
    summary:
      'Built a testing culture across the team, pairing automated coverage with a specification process that gets stakeholders aligned before any code is written.',
    highlights: [
      'Led a team of 5 engineers building a Playwright integration suite against a production app',
      'Improved regression coverage across critical workflows relied on by 100+ internal users',
      'Introduced BDD with Cucumber/Gherkin so stakeholders review and approve specs up front',
      'Enforced coverage through a CI/CD pipeline that blocks deploys on failing tests',
    ],
    stack: ['Playwright', 'Cucumber / Gherkin', 'CI/CD'],
    image: null,
  },
  {
    id: 'ui-architecture',
    title: 'UI Architecture & Design System',
    role: 'Web Team Lead',
    summary:
      'Owned the front-end standards that keep a growing suite of products consistent — defining the architecture and driving its adoption across feature teams.',
    highlights: [
      'Defined and enforced UI architecture standards org-wide: component APIs, spacing, typography, and TypeScript patterns',
      'Led a design-system migration from a default theme to a fully custom branded system aligned with marketing',
      'Drove adoption through documentation, code review, and direct collaboration with feature teams',
    ],
    stack: ['React', 'TypeScript', 'Figma', 'Design systems'],
    image: null,
  },
  {
    id: 'intern-mentorship',
    title: 'Intern Mentorship Program',
    role: 'Web Team Lead',
    summary:
      'Founded and ran the team’s intern program, building the onboarding experience and the hiring pipeline that feeds it.',
    highlights: [
      'Paired summer interns with senior engineers and held regular 1:1s for a high-quality onboarding experience',
      'Helped hire 8+ interns over 4 years — wrote the technical questions and ran candidates through the interview stages',
      'Represented the team at 5 university career fairs, speaking to 500+ students',
    ],
    image: null,
  },
]
