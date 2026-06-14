# Ensemble Ledger — Live Task Board

The shared queue all agents read and write. Lifecycle and rules: [`PROTOCOL.md`](PROTOCOL.md). Roster + cadence weights: [`ROSTER.md`](ROSTER.md).

**Status:** `backlog` → `ready` → `claimed` → `in-review` → `done` / `returned`
**Lock:** a task's `files` column is its lock — no two `claimed`/`in-review` tasks may overlap files.

---

## Active sprint: `sprint-jam-guide` (branch: `sprint-jam-guide`)

Emphasis this sprint: **ship the Jam Guide MVP** (put the 8 guitar style packs on screen, synced to live detection) + **reframe the repo as a learning platform**. Weights this sprint: Luthier 3, Muse 3 (design-heavy), Professor 2, Herald 2, Critic gate.

**Design-first gate (user directive 2026-06-14):** before D-02 locks a layout, Muse explores *several distinct* visualization concepts and the **user picks** one. D-01x/D-02 implement the chosen concept.

| id | title | domain | status | depends-on | files (lock) | definition of done |
|----|-------|--------|--------|-----------|--------------|--------------------|
| M-01 | Cut `sprint-jam-guide` branch; seed sprint | maestro | done | — | (branch) | branch cut off ensemble-system HEAD (carries agents+KB+skill), ledger header set |
| D-00a | Viz concept **A — "Stage"**: optimised for live play at-a-glance (big current chord, next-chord preview, one recommended voicing) | design | in-review | — | `docs/design/jam-guide-concept-a.md` | ASCII mockup at panel proportions, interaction model, KB-data mapping, pros/cons, ≤16-line preview block |
| D-00b | Viz concept **B — "Playbook"**: optimised for study/comparison (full progression grid × multiple voicings per chord, "more ways" expansion) | design | in-review | — | `docs/design/jam-guide-concept-b.md` | same DoD as D-00a |
| D-00c | Viz concept **C — "Roadmap"**: optimised for improv guidance (progression timeline, position-in-loop, voice-leading/scale hints, what's coming) | design | in-review | — | `docs/design/jam-guide-concept-c.md` | same DoD as D-00a |
| D-SEL | **User selects** a concept (or a blend); Maestro folds it into D-01x/D-02 | maestro | blocked | D-00a, D-00b, D-00c | `docs/agents/LEDGER.md` | chosen concept recorded; layout tasks rewritten to match |
| L-01 | Shared util: extract `findLoopPosition` + degree-relative loop matcher (rotation-invariant) from `ProgressionBanner.jsx` into `src/lib/match.js` | engineering | backlog | M-01 | `src/lib/match.js`, `src/components/ProgressionBanner.jsx` | matcher maps detected loop → style progression id, rotation-invariant; existing banner still works; build green |
| L-02 | `JamGuide.jsx` panel shell: mounts last in `App.jsx`, reads `kb/index.js`, instrument+style tabs from registry, collapsed header → ~70vh | engineering | backlog | L-01 | `src/components/JamGuide.jsx`, `src/App.jsx` | panel renders, tabs generate from KB, matches current loop or shows fallback; build green |
| D-01 | `ChordDiagram.jsx`: 6-string × 5-fret SVG, consumes the KB shape format (movable `rootStr`+`offsets`, open `frets`+`onlyRoot`), key-aware fret placement | design | backlog | L-01 | `src/components/ChordDiagram.jsx` | renders any KB guitar shape correctly in any key; uses design tokens; chord-tone colour tier |
| D-02 | Jam Guide layout: CSS-grid (cols = progression chords, rows = plays), "more ways ▾" collapse, narrow-viewport reflow, active-chord highlight | design | backlog | L-02, D-01 | `src/components/JamGuide.jsx` (styling), `tailwind.config.js` | fits target viewport; active chord highlights in time; AA contrast; keyboard-reachable |
| P-01 | Gospel guitar KB cell | content | ready | — | `src/data/kb/gospel/**`, `src/data/kb/index.js` | 5 progressions × 2 plays, validator green (run `/kb-expand`) |
| P-02 | Pop guitar KB cell | content | backlog | P-01 | `src/data/kb/pop/**`, `src/data/kb/index.js` | 5 progressions × 2 plays, validator green |
| H-01 | README reframe: lead with the learning-platform vision (detect → guide → learn), screenshot/gif placeholder, link `GOAL.md` + `docs/agents/` | community | ready | — | `README.md` | README states the dual vision; links resolve |
| H-02 | `CONTRIBUTING.md` + issue templates: the data-contract path so a musician can PR a style without coding (point at `src/data/kb/SCHEMA.md`) | community | backlog | H-01 | `CONTRIBUTING.md`, `.github/ISSUE_TEMPLATE/**` | a non-coder can follow "add a style"; `/kb-expand` documented as the assisted path |
| C-01 | Smoke-test harness: a `scripts/smoke.mjs` that imports `kb/index.js` + runs the matcher on sample loops, wired alongside `validate-kb.mjs` | quality | backlog | L-01 | `scripts/smoke.mjs` | catches a broken matcher/registry before merge; documented in PROTOCOL gate |

> Critic (C-) reviews every L-/D-/P-/H- task as it reaches `in-review` — those reviews are the gate, not separate ledger rows, except where new test infra is itself the deliverable (e.g. C-01).

---

## Backlog (future sprints)

- **Jam Guide phase 2:** `MiniPiano.jsx` + piano recipe resolver (unblocks piano packs); bass pattern renderer.
- **Content:** piano packs (jazz → gospel → neo-soul first), then bass packs (blues → jazz → funk first) — see `docs/kb-backlog.md`.
- **Learning features (Professor + Luthier):** drills tab seeded from `docs/learn-curriculum.md`; target-note highlighting; ear-training quiz on own chord history; pocket report from the onset pipeline.
- **Progression Builder (GOAL G3):** key-relative palette, drag-reorder, Nashville-number toggle, voicing alternatives.
- **Platform (Herald):** GitHub Pages docs site; "you're playing the Creep progression" engagement hook; contributor leaderboard for styles added.

---

## Iteration log

_(Maestro appends one line per completed iteration: `<date> · <task ids done> · <next>`.)_

- 2026-06-14 · done: M-01 · in-review (awaiting user pick): D-00a/b/c viz concepts · next: D-SEL (user chooses) → then L-01/D-01/D-02 implement chosen concept
