# KB Expansion Backlog

The queue for the `/kb-expand` loop. One cell per session, top-to-bottom. Protocol and schema: [`docs/kb-plan.md`](kb-plan.md). Statuses: `todo` → `in-progress` → `done (YYYY-MM-DD, coverage)`.

> Ground truth (verified 2026-07-10): `node scripts/validate-kb.mjs` → ✓ KB valid — **10 style(s), 56 progressions, 164 plays, 23 licks**. Registered cells in `src/data/kb/index.js`: all 10 guitar; piano for jazz, blues, gospel, rnb.
>
> **Next cells:** piano column continues (pop, rock, funk, country, reggae, bossa remain) · **bass column is now active** — blues bass is next (ledger task P-41, pending the C-41 bass play schema), order blues → jazz → funk per plan.

## Phase 0 — Foundation (must be first)

| # | Cell | Status |
|---|---|---|
| 0 | Bootstrap: `src/data/kb/` + `SCHEMA.md` + `scripts/validate-kb.mjs` + `kb/index.js` + **jazz/guitar gold standard** | done (2026-06-12, iteration 1) |

## Guitar

| # | Style | Status |
|---|---|---|
| 1 | Jazz (part of bootstrap) | done (2026-06-12, 5 progressions × 2 plays; +2 intermediate progressions 2026-07-08 → 7 × 2, validator ✓) |
| 2 | Blues | done (2026-06-12, 5 progressions × 2 plays, validator ✓) |
| 3 | Rock | done (2026-06-12, 5 progressions × 2 plays, validator ✓) |
| 4 | Bossa Nova | done (2026-06-12, 5 progressions × 2 plays, validator ✓) |
| 5 | Funk | done (2026-06-12, 5 progressions × 2 plays, validator ✓) |
| 6 | Reggae | done (2026-06-12, 5 progressions × 2 plays, validator ✓) |
| 7 | Country / Folk | done (2026-06-12, 5 progressions × 2 plays, validator ✓) |
| 8 | R&B / Neo-soul | done (2026-06-12, 5 progressions × 2 plays; +2 intermediate progressions 2026-07-08 → 7 × 2, validator ✓) |
| 9 | Gospel | done (2026-06-15, 5 progressions × 2 plays; +2 intermediate progressions 2026-07-08 → 7 × 2, validator ✓) |
| 10 | Pop | done (2026-06-15, 5 progressions × 2 plays, validator ✓) |

> Guitar licks (not tracked as cells above; C-20 lick schema, 2026-07-08): 23 licks live in 6 guitar cells — blues 4, jazz 4, funk 4 (pack #1, 2026-07-08) + rock 4, country 4, reggae 3 (pack #2, 2026-07-08/09).

## Piano

| # | Style | Status |
|---|---|---|
| 11 | Jazz | done (2026-07-08, 7 progressions × 2 plays, validator ✓) |
| 12 | Blues | done (2026-07-10, 5 progressions × 2 plays, validator ✓) |
| 13 | Bossa Nova | todo |
| 14 | Gospel | done (2026-07-09, 7 progressions × 2 plays, validator ✓) |
| 15 | R&B / Neo-soul | done (2026-07-10, 7 progressions × 2 plays, validator ✓) |
| 16 | Pop | todo — **next piano cell** |
| 17 | Rock | todo |
| 18 | Funk | todo |
| 19 | Country / Folk | todo |
| 20 | Reggae | todo |

## Bass

| # | Style | Status |
|---|---|---|
| 21 | Blues | todo — **next bass cell** (ledger task P-41; blocked on the C-41 bass play schema) |
| 22 | Jazz | todo |
| 23 | Funk | todo |
| 24 | Reggae | todo |
| 25 | Rock | todo |
| 26 | Bossa Nova | todo |
| 27 | R&B / Neo-soul | todo |
| 28 | Country / Folk | todo |
| 29 | Gospel | todo |
| 30 | Pop | todo |

## UI milestones (interleave when their data exists)

| Milestone | Depends on | Status |
|---|---|---|
| Jam Guide MVP (panel, matching, `ChordDiagram.jsx`, live sync) | cell 0 | done (2026-06-15, sprint-jam-guide, PR #2) |
| `MiniPiano.jsx` + recipe resolver | cell 11 | done (2026-06-16 resolver + MiniPiano voicing prop; authored packs render at stations 2026-07-09) |
| Bass pattern renderer | cell 21 | todo — activated in sprint-integrated-glance (ledger task L-42, after C-41 + P-41) |
| Improv layer (licks/tabs display) | a few guitar cells | done (2026-07-08, `LickCard.jsx` + licks section; 23 licks across 6 styles) |

> Notes for sessions: piano style order front-loaded the styles where piano voicings differ most (jazz/gospel/neo-soul — all shipped, plus blues); bass order front-loads line-driven styles (blues/jazz/funk). Adjust freely — order is a default, not a rule. Bass cells need the C-41 play schema in `SCHEMA.md` before authoring.
