---
name: kb-expand
description: Expand the JamBuddy jam knowledgebase by exactly one style × instrument cell — research, author, validate, commit. Run repeatedly (or via /loop) to fill the backlog in docs/kb-backlog.md.
---

# KB Expand — one cell per session

You are expanding JamBuddy's jam knowledgebase: intermediate-level standard progressions and ways to play them, per style × instrument. **Do exactly one cell, end to end.** Small, validated, committed.

## Steps

### 1. Orient (always, every session)
Read, in this order:
- `docs/kb-plan.md` — architecture, schema conventions, quality gates, success criteria
- `docs/kb-backlog.md` — the queue
- `src/data/kb/SCHEMA.md` and the gold standard `src/data/kb/jazz/guitar.js` — **if they exist**
- `docs/progression-repertoire.md` §1 — cross-check progressions for the style
- `docs/learn-curriculum.md` — the intermediate level definition for the instrument

### 2. Claim a cell
Take the **first `todo` cell** in the backlog (respect the order: bootstrap → guitar → piano → bass). Mark it `in-progress` in `docs/kb-backlog.md`.

**If the foundation doesn't exist yet (no `src/data/kb/`), this session is Session 0:** build `src/data/kb/` with `index.js` registry, `SCHEMA.md` (formats from kb-plan.md §1, one fully-worked example, the musician checklist from §2), `scripts/validate-kb.mjs` (all mechanical checks from kb-plan.md §2 — especially the pitch-class verification of guitar shapes against chord qualities from `src/lib/theory.js` CHORD_TYPES), and the **jazz/guitar** cell as the gold standard. That is one full session; stop after it.

### 3. Research
Dispatch 1-2 web-research subagents for the claimed style × instrument:
- the style's standard progressions (verify against `docs/progression-repertoire.md`; add style-specific ones with named sources)
- 2-3 genuinely different intermediate ways to play each progression on this instrument (voicings with exact frets/fingerings for guitar, degree recipes for piano, line patterns for bass)
- comping rhythm(s) characteristic of the style, improv guidance (scales over each chord, target notes, 1-2 licks)
- require named sources/URLs in the agent's report

### 4. Author
Write `src/data/kb/<style>/progressions.js` (if new style) and `src/data/kb/<style>/<instrument>.js` per SCHEMA.md. Key-agnostic only: degrees and movable shapes (`rootStr` + `offsets`), open shapes with `onlyRoot`. Qualities must be keys of `CHORD_TYPES` in `src/lib/theory.js`. Register the style in `src/data/kb/index.js`.

### 5. Validate — hard gate
- `node scripts/validate-kb.mjs` must pass. Fix content, don't weaken the validator.
- Run the musician checklist in SCHEMA.md; cut or fix anything that fails it.
- `npm run build` must pass.

### 6. Record and commit
- Backlog: mark the cell `done (YYYY-MM-DD, N progressions × M plays)`.
- Commit on the current branch: `kb: add <style> <instrument> pack` (or `kb: bootstrap foundation + jazz guitar gold standard`). Do not push unless asked.

### 7. Report
Tell the user: what was added (progressions, plays, sources), validator result, and **the next cell in the queue**. If a UI milestone in the backlog just became unblocked (e.g. Jam Guide MVP after cell 0), say so explicitly.

## Rules
- One cell per invocation. Never start a second cell, even if the first went quickly.
- Never commit content that fails the validator; never relax a validator rule to make content pass — flag the conflict to the user instead.
- Intermediate level: no 5+ fret stretches, no advanced-only voicings without an intermediate alternative in the same play set.
- Plays per progression must be idiomatically different (register/density/technique), not transpositions of each other.
