# KB Expansion Backlog

The queue for the `/kb-expand` loop. One cell per session, top-to-bottom. Protocol and schema: [`docs/kb-plan.md`](kb-plan.md). Statuses: `todo` → `in-progress` → `done (YYYY-MM-DD, coverage)`.

## Phase 0 — Foundation (must be first)

| # | Cell | Status |
|---|---|---|
| 0 | Bootstrap: `src/data/kb/` + `SCHEMA.md` + `scripts/validate-kb.mjs` + `kb/index.js` + **jazz/guitar gold standard** | done (2026-06-12, iteration 1) |

## Guitar

| # | Style | Status |
|---|---|---|
| 1 | Jazz (part of bootstrap) | done (2026-06-12, 5 progressions × 2 plays, validator ✓) |
| 2 | Blues | done (2026-06-12, 5 progressions × 2 plays, validator ✓) |
| 3 | Rock | done (2026-06-12, 5 progressions × 2 plays, validator ✓) |
| 4 | Bossa Nova | done (2026-06-12, 5 progressions × 2 plays, validator ✓) |
| 5 | Funk | done (2026-06-12, 5 progressions × 2 plays, validator ✓) |
| 6 | Reggae | done (2026-06-12, 5 progressions × 2 plays, validator ✓) |
| 7 | Country / Folk | todo |
| 8 | R&B / Neo-soul | todo |
| 9 | Gospel | todo |
| 10 | Pop | todo |

## Piano

| # | Style | Status |
|---|---|---|
| 11 | Jazz | todo |
| 12 | Blues | todo |
| 13 | Bossa Nova | todo |
| 14 | Gospel | todo |
| 15 | R&B / Neo-soul | todo |
| 16 | Pop | todo |
| 17 | Rock | todo |
| 18 | Funk | todo |
| 19 | Country / Folk | todo |
| 20 | Reggae | todo |

## Bass

| # | Style | Status |
|---|---|---|
| 21 | Blues | todo |
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
| Jam Guide MVP (panel, matching, `ChordDiagram.jsx`, live sync) | cell 0 | todo |
| `MiniPiano.jsx` + recipe resolver | cell 11 | todo |
| Bass pattern renderer | cell 21 | todo |
| Improv layer (licks/tabs display) | a few guitar cells | todo |

> Notes for sessions: piano style order front-loads the styles where piano voicings differ most (jazz/gospel/neo-soul); bass order front-loads line-driven styles (blues/jazz/funk). Adjust freely — order is a default, not a rule.
