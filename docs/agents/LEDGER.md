# Ensemble Ledger — Live Task Board

The shared queue all agents read and write. Lifecycle and rules: [`PROTOCOL.md`](PROTOCOL.md). Roster + cadence weights: [`ROSTER.md`](ROSTER.md).

**Status:** `backlog` → `ready` → `claimed` → `in-review` → `done` / `returned`
**Lock:** a task's `files` column is its lock — no two `claimed`/`in-review` tasks may overlap files.

---

## Active sprint: `sprint-jam-guide` (branch: `sprint-jam-guide`)

Emphasis this sprint: **ship the Jam Guide MVP** (put the 8 guitar style packs on screen, synced to live detection) + **reframe the repo as a learning platform**. Weights this sprint: Luthier 3, Muse 3 (design-heavy), Professor 2, Herald 2, Critic gate.

**Design-first gate (user directive 2026-06-14):** Muse explored three distinct concepts; **user chose "Roadmap"** (improv-first highway) on 2026-06-15. Implementation tasks below are re-planned to build Roadmap. Concept doc: `docs/design/jam-guide-concept-c.md`. Stage/Playbook (`-a`/`-b`) kept as reference for future modes.

**Roadmap build shape:** a horizontal timeline panel — stations (= loop chords) carry guide-tone lanes (3rd/7th), a solo-scale label, and voice-leading rails (7→3) between stations; a playhead + beat grid track loop position; the chosen voicing is a secondary thumbnail per station; tap a station → guide tones on the fretboard. Needs derived theory (`guideTones`, `voiceLeadingPairs`, default `soloScale`) — Luthier owns those.

| id | title | domain | status | depends-on | files (lock) | definition of done |
|----|-------|--------|--------|-----------|--------------|--------------------|
| M-01 | Cut `sprint-jam-guide` branch; seed sprint | maestro | done | — | (branch) | branch cut, ledger header set |
| D-00a | Viz concept A — "Stage" | design | done | — | `docs/design/jam-guide-concept-a.md` | delivered; reference for future collapsed/glance mode |
| D-00b | Viz concept B — "Playbook" | design | done | — | `docs/design/jam-guide-concept-b.md` | delivered; reference for future study mode |
| D-00c | Viz concept C — "Roadmap" | design | done | — | `docs/design/jam-guide-concept-c.md` | delivered; **CHOSEN** |
| D-SEL | User selects a concept | maestro | done | D-00a, D-00b, D-00c | `docs/agents/LEDGER.md` | **Roadmap chosen 2026-06-15**; tasks re-planned below |
| L-01 | Shared matcher: extract/author `findLoopPosition` (which chord index the loop is on) + rotation-invariant degree-relative loop→progression-id matcher into `src/lib/match.js`; refactor `ProgressionBanner.jsx` to use it | engineering | done | M-01 | `src/lib/match.js`, `src/components/ProgressionBanner.jsx` | matcher maps detected loop → style progression id (rotation-invariant) AND returns current position index for the playhead; banner still works; build green — VERIFY: `npm run build` green; banner renders identically (findLoopPosition now imported from match.js); matchLoopToProgression rotation-invariant + quality tie-break (smoke: ii–V–I & its rotation → jazz-251-major rot 0/2; minor 251 → jazz-251-minor; chromatic → no match) |
| L-01b | Derived theory for Roadmap: add `guideTones(chordRoot,quality)` (3rd & 7th pcs), `voiceLeadingPairs(chordA,chordB)` (7→3 / nearest-tone rails), and default `soloScale(quality,mode)` (Mixo/dom7, Dorian/m7, Ionian/maj7…) to `theory.js` — additive exports only | engineering | done | M-01 | `src/lib/theory.js` | pure functions, unit-sane (ii–V–I in C → C→B, F→E rails); reuses existing `getChordTones`; build green; no existing export changed |
| L-02 | `JamGuide.jsx` panel shell: mounts last in `App.jsx`, reads `kb/index.js`, instrument+style tabs from registry, collapsed header → ~70vh; receives live loop + position props | engineering | backlog | L-01 | `src/components/JamGuide.jsx`, `src/App.jsx` | panel renders, tabs from KB, matched progression or fallback; build green |
| D-01 | `RoadmapTrack.jsx` — the heart: horizontal stations (loop chords) with guide-tone lanes (3rd/7th dots), solo-scale label, voice-leading rails between stations, playhead + beat grid, lookahead highlight on the next station | design | backlog | L-01, L-01b | `src/components/RoadmapTrack.jsx` | renders a real ii–V–I & a 12-bar blues from KB; lanes computed from `guideTones`/`voiceLeadingPairs`/`soloScale`; design tokens; AA contrast |
| D-01b | `ChordDiagram.jsx` — secondary per-station voicing thumbnail (movable `rootStr`+`offsets`, open `frets`+`onlyRoot`), key-aware fret placement, tap-to-enlarge | design | backlog | L-01 | `src/components/ChordDiagram.jsx` | renders any KB guitar shape in any key; chord-tone colour tier; compact thumbnail + enlarged states |
| D-02 | Roadmap assembly & live polish in `JamGuide.jsx`: place `RoadmapTrack` + thumbnails, animate playhead against BPM/onset, narrow-viewport reflow, tap-station → fretboard guide tones | design | backlog | L-02, D-01, D-01b | `src/components/JamGuide.jsx` (assembly/styling), `tailwind.config.js` | playhead tracks position; reflows on narrow; keyboard-reachable; AA contrast |
| P-01 | Gospel guitar KB cell | content | ready | — | `src/data/kb/gospel/**`, `src/data/kb/index.js` | 5 progressions × 2 plays, validator green (run `/kb-expand`) |
| P-02 | Pop guitar KB cell | content | backlog | P-01 | `src/data/kb/pop/**`, `src/data/kb/index.js` | 5 progressions × 2 plays, validator green |
| H-01 | README reframe: lead with the learning-platform vision (detect → guide → learn), screenshot/gif placeholder, link `GOAL.md` + `docs/agents/` | community | ready | — | `README.md` | README states the dual vision; links resolve |
| H-02 | `CONTRIBUTING.md` + issue templates: the data-contract path so a musician can PR a style without coding (point at `src/data/kb/SCHEMA.md`) | community | backlog | H-01 | `CONTRIBUTING.md`, `.github/ISSUE_TEMPLATE/**` | a non-coder can follow "add a style"; `/kb-expand` documented as the assisted path |
| C-01 | Smoke-test harness: a `scripts/smoke.mjs` that imports `kb/index.js` + runs the matcher on sample loops, wired alongside `validate-kb.mjs` | quality | backlog | L-01 | `scripts/smoke.mjs` | catches a broken matcher/registry before merge; documented in PROTOCOL gate |

> Critic (C-) reviews every L-/D-/P-/H- task as it reaches `in-review` — those reviews are the gate, not separate ledger rows, except where new test infra is itself the deliverable (e.g. C-01).

> GATE 2026-06-15 (Critic) · **L-01 PASS** — build green, validator green (8 styles/40 progs/80 plays). `findLoopPosition` extracted byte-identical (verified by diff, no semantic change). matchLoopToProgression verified rotation-invariant with quality tie-break: `[Dm7,G7,Cmaj7]`→`jazz-251-major` rot 0; rotation `[G7,Cmaj7,Dm7]`→ rot 2; `[Dm7b5,G7,Cm7]`→`jazz-251-minor` (tie-break works); chromatic→clean `{matched:false}`. rotation index correctly points at the loop slot aligning with KB degrees[0]. `match.js` holds only matching/position logic + a small local chord-root parser (theory.js exposes no pc helper — acceptable). Note (non-blocking): banner refactor also adds `onChordClick` click affordances — beyond a pure extract but already wired to `setSelectedChord`/ChordDetailModal in App.jsx and behaviour-preserving for `findLoopPosition`. Minor: `match.js` uses extensionless `import … from './theory'` (works under Vite; matches existing `education.js` convention).
> GATE 2026-06-15 (Critic) · **L-01b PASS** — build green. theory.js diff is purely additive (zero `-` lines; no existing export touched). Verified by running the real functions: ii–V–I in C → **Dm7→G7 = C→B (−1)** and **G7→Cmaj7 = F→E (−1)** rails (plus intentional 0-semitone common-tone rails). `guideTones` triad fallback flags `hasSeventh:false` and uses the 5th. `soloScale` defaults sane: dom7→mixolydian, min7→dorian, maj7→major(ionian), half_dim→locrian, dom7/minor→phrygian-dominant. Functions are pure and reuse CHORD_TYPES/SCALES.

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
- 2026-06-15 · done: D-00a/b/c, D-SEL (Roadmap chosen), L-01 (match.js + banner refactor), L-01b (guideTones/voiceLeadingPairs/soloScale) — Critic PASS both · next: L-02 (JamGuide shell) → D-01 (RoadmapTrack) ‖ D-01b (ChordDiagram)
