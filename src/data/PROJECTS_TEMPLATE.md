# Project Content Template — Internal Tools & Personal Projects

Fill this out, then hand it back and I'll drop it into the data files
([`internalTools.js`](./internalTools.js) and [`personalProjects.js`](./personalProjects.js))
that feed the Software Dev building in the 3D world. You can also edit the data
files directly — the field names below match them exactly.

> **Audience:** a recruiter or hiring manager skimming for ~15 seconds. Lead with
> impact, keep it scannable, and never include anything confidential.

---

## A. Internal Tools (confidential work)

For apps you can't show but *can* describe. Each one renders as a
**Problem → Approach → Impact** panel — no screenshots required.

### Fields

| Field | Required | What it is | Tips for impact |
|-------|----------|------------|-----------------|
| `title` | ✅ | Project name (generic is fine) | "Internal Reporting Platform" beats "Project X". Name the *kind* of system. |
| `role` | ✅ | Your role | e.g. "Lead Developer", "Full-stack Developer". Be honest about scope. |
| `problem` | ✅ | The business/technical pain it solved | 1–2 sentences. Concrete > vague: "Ops reconciled data by hand across 4 systems" beats "improved efficiency". |
| `approach` | ✅ | What you built + key decisions + **what was yours** | Name the architecture and the parts *you* owned. This is where engineering judgment shows. |
| `impact` | ✅ | List of concrete outcomes | **Numbers win**: "↓80% reconciliation time", "1,200 users", "99.9% uptime", "4 systems integrated". 2–4 bullets. |
| `stack` | ✅ | Technologies used | 3–6 items. Real tools, no buzzword padding. |
| `image` | optional | A *safe* graphic (architecture diagram), file in `/public/dev/` | Leave blank if none. A boxes-and-arrows diagram is more impressive than a UI shot and reveals nothing. |

### Effectiveness tips
- **Problem → Approach → Impact** is the spine. If a line doesn't serve one of those, cut it.
- Quantify everything you safely can. If you can't get exact numbers, use honest ranges ("cut a multi-day process to hours").
- "My role" matters most on team projects — say what *you* owned vs. the team.
- Keep it NDA-safe: no client names you can't share, no internal URLs, no secret metrics.

### Fill-in blocks (copy one per tool)

```
Title:
Role:
Problem:
Approach (incl. what you specifically built/owned):
Impact:
  -
  -
  -
Stack:
Architecture diagram? (file name or "none"):
```

```
Title:
Role:
Problem:
Approach:
Impact:
  -
  -
Stack:
Architecture diagram?:
```

```
Title:
Role:
Problem:
Approach:
Impact:
  -
  -
Stack:
Architecture diagram?:
```

> There are currently **3** Internal Tools screens. Want more/fewer? Just tell me
> and I'll adjust the room's `screenCount` in `worldLayout.js`.

---

## B. Personal Projects (things built for the love of it)

Public side projects, experiments, this 3D site, etc. These render with the same
panel as the public-web projects (title, role, stack, description, optional link).

### Fields

| Field | Required | What it is | Tips |
|-------|----------|------------|------|
| `title` | ✅ | Project name | Clear and specific. |
| `role` | ✅ | Usually "Solo Project" (or your role) | |
| `description` | ✅ | 1–3 sentences: what it is, what you built, why it's cool | Lead with what it *does*, then the interesting technical bit. |
| `stack` | ✅ | Technologies | 3–6 items. |
| `url` | optional | Live link (or repo) | Leave blank if none — the "Visit site" button just won't show. Use `/explore` for the 3D world. |
| `image` | optional | Screenshot in `/public/dev/` | Leave blank → shows a solid screen. A real screenshot is a nice touch for public projects. |

### Effectiveness tips
- Personal projects signal curiosity and range — show breadth (a tool, a game, an experiment), not just more of the day job.
- If it's live, link it. A working demo beats a description.
- The `/explore` world is already entry #1 here (great portfolio piece on its own).

### Fill-in blocks (copy one per project)

```
Title:
Role:
Description:
Stack:
Live URL (or "none"):
Screenshot (file name or "none"):
```

```
Title:
Role:
Description:
Stack:
Live URL (or "none"):
Screenshot (file name or "none"):
```

> Currently **3** Personal Projects screens (this 3D site + 2 placeholders). Add
> as many as you like — tell me the count and I'll size the wall to match.

---

## Handing it back
Once filled in, paste it back to me (or commit it) and I'll:
1. Convert each block into the matching object in `internalTools.js` / `personalProjects.js`.
2. Drop any diagrams/screenshots into `/public/dev/` and wire the `image` paths.
3. Resize the rooms' `screenCount` if the number of items changed.
