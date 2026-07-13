# Integrated Glance — the Jam Guide joins the main module (task D-40)

> **Thesis:** the Jam Guide stops being the last collapsible at the bottom of the
> page and becomes a **full-width, always-open band directly below the instrument
> view** — the third element of the main module. The loop is shown **once**, in
> ProgressionBanner (where the user says it already lives); the Roadmap track
> retires and its education (solo scales, guide tones, voice-leading) folds into
> the rail's station headers. The rail itself flips from the D-31 playhead
> accordion to **all stations expanded at once, as vertical rows** — every loop
> chord's full voicing gallery permanently visible, the playhead highlighting
> (never revealing) the active row. One global GUITAR/PIANO/BASS selector — App's
> existing `instrument` state — drives everything.
>
> User directive (2026-07-10, verbatim): *"i would like to move it up and
> integrate it somewhat in the space of the main module up top. or maybe right
> below it as it is super important. … i would like to be able to see the loop
> clearly, no need to have this repeated again. as its already in the main module
> … only one selection for GUITAR/PIANO/BASS and everything should show in that
> instrument. … i'd like to see all the chords and their voicings in a specific
> way in case a loop is detected (or at least just like 4 chords or something at
> least, so you can follow and potentially learn new ways to play it while you
> are playing the loop.) scrolling is easier then clicking"*

**Decision authority:** per the sprint header (no user gate), Muse picks the
strongest option and records rejected alternatives (§7). Implementation is
**L-40** (App restructure, §6.1) then **D-41** (rail rework, §6.2). This doc
supersedes `glance-mode.md` §1's accordion where they conflict — the user's
scroll license overturns D-31's "everything expanded" rejection (Rejected A
there), with the axis flipped to vertical (§4).

---

## 0. What exists today (read from the code)

App.jsx mount order: `ProgressionBanner` (~609) → instrument row (~618–630:
`Fretboard`/`BassFretboard`/`Piano` at 70% + `ProgressionSuggestions` 30%) →
`CurrentJamPanel` (~634) → `LoopStation` (~642) → Debug/Drum/Tuner collapsibles →
**`JamGuide` last (~712)**. The global `instrument` state (App.jsx:58,
`'piano'|'guitar'|'bass'`) has its selector in the controls bar (~484) and drives
the main instrument views + DebugView — but **JamGuide ignores it** and runs its
own internal Guitar/Piano/Bass tabs (JamGuide.jsx ~405–434, local state ~208).

The detected loop renders **twice**: ProgressionBanner's loop row (compact chips,
active chip highlighted via `findLoopPosition`) and `RoadmapTrack` inside the
JamGuide jam section (stations with solo-scale labels, guide-tone dots,
voice-leading rails, playhead + beat grid). Below the Roadmap, `GlanceRail`
(L-33) is a playhead **accordion**: one station's gallery expanded at a time —
the exact "it changes when the chord is not playing" complaint.

---

## 1. Placement — a full-width band directly below the instrument view

**Chosen: the Jam Guide content mounts as a full-width, always-open band
immediately below the instrument row, replacing `CurrentJamPanel`'s slot (before
`LoopStation`).** The four-section Knowledge Center dock stays at the bottom as
the browse/study area, minus its jam section (§5).

Why *below* the main module and not *inside* it:

- **Width math kills "inside".** The only free space inside the main module is
  the 30% `ProgressionSuggestions` column (~360px at 1280) and the banner's
  interior. A single piano station's gallery is **~1,178px** worst case: the
  gallery calls `pianoVoicing` with no `prev` (VoicingBrowser.jsx:161), and
  MiniPiano's D-24 crop is C-aligned (`octStart = floor(minNote/12)`), so any
  station rooted **above D** crosses the C boundary even in root position and
  shell — recomputed G7: root [7,11,14,17], shell [19,23,29], rootlessA
  [23,26,29,33], rootlessB [17,21,23,26] → **all four cells are 2-octave 284px
  crops** ≈ 4×284 + 24 gaps + 18 chrome ≈ 1,178px. (glance-mode.md's ~940px was
  the Dm7-specific figure; 1-octave root/shell crops exist only for roots C–D.)
  Nothing gallery-shaped fits inside the module without crushing the neck/keys —
  the surface the player's eyes track continuously.
- **"The main module" to the user = banner + big instrument view** — the
  real-time detection surface. The guide answers a different question ("what
  can I play on each chord of this loop") at a different rhythm (study-while-
  looping). Directly below = one saccade down, same screenful top edge, no
  competition for the detection pixels. The user himself offered "or maybe
  right below it" — and the space math makes that the only honest reading.
- **Always open, zero chrome.** No collapse header (scroll past it if unwanted
  — scroll > click), no section nav, no internal instrument tabs, no style
  tabs, no level chips. The band is a pure auto surface: detection picks the
  loop and style, the ONE controls-bar selector picks the instrument. The
  `styleOverride`/style-tab machinery (JamGuide.jsx ~210–212, ~438–458) **dies
  with the tabs**: the band always follows `match.style`; the heard-live
  LicksStrip's `styleId` falls back to `styles[0]` when nothing is matched;
  browsing OTHER styles stays reachable via the dock's own style chips
  (LicksSection and ExploreSection each keep theirs). When no loop is matched
  the band degrades to the existing "heard live" single gallery for
  `currentChord`; when nothing is heard, a slim one-line hint (~40px) so it
  never wastes main-module space.
- The band gets a micro-header line (`JAM GUIDE — {matched name} · in C major`,
  uppercase tracking-widest gray-500 style), not a button.

Vertical position at 1280×900 (~860px usable): header ≈56 + controls bar ≈52 +
banner ≈140 + instrument row ≈300 + margins ≈24 → **the band starts ≈570px
down**; its first ≈290px are visible at rest, and one scroll-flick puts the
whole rail at the top of the viewport (§4 math). Estimates for the module
heights; verified figures for the rail.

---

## 2. The single loop display — ProgressionBanner survives, RoadmapTrack retires

**Call: ProgressionBanner's loop row is THE loop display. RoadmapTrack is
unmounted** (L-40 removes the import/mount; the file stays in place like the
EducationPanel precedent — deletion filed to backlog).

The user told us where the loop lives: *"no need to have this repeated again.
as its already in the main module"* — i.e. the banner. The banner is compact,
up top, always visible, and **already carries the playhead**: `findLoopPosition`
highlights the active loop chip (accent glow + amber rn). There is nothing to
absorb on that front — the beat grid's "current beat" was chord-accurate anyway
(RoadmapTrack's own comment: "coarse, chord-accurate — matches
ProgressionBanner"). **ProgressionBanner.jsx needs zero edits.**

Honest disposition of RoadmapTrack's unique value:

| RoadmapTrack feature | Disposition |
|---|---|
| Playhead (active station) | Already in the banner's loop chips — nothing lost |
| Beat grid + progress bar | **Dropped.** It never showed sub-chord progress (chord-accurate by construction); the BPM readout already lives in the controls-bar badge. Loss: the downbeat tick visual. If missed, a slim progress underline beneath the banner's loop chips is a future 1-point polish — explicitly NOT in L-40/D-41 |
| Solo-scale label per station ("G mixolydian") | **Folds into each rail row's header** (§4) via `soloScale` from theory.js |
| Guide-tone lane (3rd filled / 7th hollow dots) | **Folds into each rail row's header** ("aim" dots, same accent-filled/hollow language) via `guideTones` |
| Voice-leading rails (7→3 half-step arrows) | **Folds into a compact transition chip** at the end of each row header: "next: F→E · ½ step down" (via `voiceLeadingPairs`; wrap-around chip on the last row says "loop"). The between-columns arrow SVG dies; the information survives |
| Station "next" lookahead glow | Superseded: next row gets a small "next" tag; the whole loop is visible anyway |

Interim honesty: L-40 unmounts RoadmapTrack **before** D-41 builds the row
headers, so for one gate cycle the solo-scale/guide-tone/voice-leading education
is absent from the page (the banner still shows the loop; the accordion rail
still shows voicings). Accepted — D-41 follows immediately in the same serialized
chain; Critic should not flag the gap as a regression.

---

## 3. Instrument threading — one selector, honest bass

JamGuide's internal `INSTRUMENTS` tabs, `COMPUTED_INSTRUMENTS`,
`availableInstruments`, and local `instrument` state (JamGuide.jsx ~42–47, ~178–
184, ~208, ~405–434) are **deleted**. App's existing `instrument` flows down as
a prop. Full prop paths to every consumer:

| Consumer | Path |
|---|---|
| GlanceRail (band) | `App.jsx instrument` (line 58) → `<JamGuide instrument={instrument}>` → `<GlanceRail instrument={instrument}>` (prop already exists; only its source changes) |
| VoicingBrowser, heard-live fallback (band) | App → JamGuide → `<VoicingBrowser show={instrument}>` (JamGuide.jsx ~494) |
| LicksStrip (band) | App → JamGuide → `<LicksStrip instrument={instrument}>` (both mounts, ~498 and ~757) |
| `stationVoicings` memo (band) | App → JamGuide — the memo's `instrument` dependency reads the prop |
| VoicingsSection (dock) | App → `<KnowledgeDock instrument={instrument}>` (§5) → `<VoicingsSection instrument={instrument}>` → its `<VoicingBrowser show={instrument}>` (ExplorePanel.jsx:425, today defaulting to `'both'`) |
| LicksSection (dock) | **No prop** — LicksSection is a module-local function in **JamGuide.jsx:562** (NOT an ExplorePanel export), and its heading is already statically honest ("Guitar licks · tab reads high e on top…"); licks are guitar-only in the KB (C-20 schema), so an `instrument` prop would be dead on arrival. Recorded so nobody threads it |
| ExploreSection (dock) | **No prop needed** — it renders progression chips + famous progressions, no instrument-specific renderer; chord taps open ChordDetailModal, which has its own user-driven Guitar/Piano tabs. Recorded so nobody threads a dead prop |
| DebugView | Already receives `instrument` (App.jsx ~676) — untouched |

The only `ExplorePanel.jsx` signature change is
`VoicingsSection({ keyInfo, chordHistory, currentChord, instrument })`
(its named exports are LevelChips / ChordPickerToolbar / GuitarGrid / PianoGrid /
ExploreSection / VoicingsSection — no LicksSection there).

### The honest bass state (until C-41/P-41/L-42 land)

BassFretboard covers the main view; the KB has **zero bass content** and both
gallery generators are wrong for bass (guitar shapes are not bass patterns;
`pianoVoicing` is piano). Showing guitar diagrams under BASS would break the
one-selector promise the user just made. Instead, when `instrument === 'bass'`
and a loop is matched:

- Station rows still render their full headers — chord, rn, solo scale, aim
  dots. **Guide tones ARE the bassist's target notes**; none of this is
  instrument-specific.
- The gallery slot renders a computed **root · fifth · approach** line per
  station: root name, fifth name, and the chromatic approach into the NEXT
  station's root ("approach: G♯ → A", computed from `stations[i+1].rootPc − 1`
  semitone — pure arithmetic on data the component already has; **no theory.js
  change**). This is the honest useful minimum, not a placeholder.
- ONE notice for the whole rail (not per row): *"Authored bass patterns are on
  the way (blues first) — meanwhile: roots, fifths, and the approach into the
  next chord."*
- The licks strip hides under bass (guitar tab licks are noise to a bassist
  mid-jam; under piano the strip keeps today's honest "guitar licks" heading).

**What L-42 slots in:** a per-station `<BassPatternCard>` (new component,
Luthier/Muse per the C-41 schema — 4-string, frets 0–15) mounted in the same
gallery slot of each row, replacing the computed line **when the matched style
ships a bass cell**; the computed root/fifth/approach line remains the
per-station fallback for styles without bass content. The rail's row structure,
highlight, and header need zero changes for L-42 — that's the contract.

---

## 4. The all-stations-expanded rail — vertical rows, playhead highlights

**Axis call: stations are VERTICAL ROWS** — one row per loop chord, each row =
station header + that chord's full horizontal voicing gallery; the page scrolls
down. All rows render all cells, always. **The playhead HIGHLIGHTS the active
row and never hides, collapses, or reveals content.**

Why vertical beats all-horizontal: a 4-station piano loop laid out as expanded
columns is ≈4 × 1,470px ≈ **5,900px wide** — continuous sideways tracking while
playing, on the axis mouse wheels don't scroll. Vertically, the worst piano row
is ≈ 284 (threaded cell — an authored LH 3-5-7-9 also crops 2 octaves) + 8 +
1,178 (§1 gallery) ≈ **1,470px of cells**, which does NOT fit 1,240px usable —
the gallery **flex-wraps to a second cell line** (~300px row height). **No
horizontal scroll survives because rows wrap, not because they fit.** Rows stack
~170–300px tall and ≥4 chords sit within one to one-and-a-half screenfuls —
the "at least 4 chords so you can follow" ask, under the user's scroll license.

### Row anatomy (canonical KB order, same as the banner's loop after rotation)

- **Header (~30px):** chord label (gray-100 bold) + rn + "now" badge (accent,
  when active) / "next" tag · solo-scale label ("solo · G mixolydian") · aim
  dots (3rd filled accent, 7th hollow — RoadmapTrack's GuideDot language,
  honest "5th" fallback kept) · transition chip ("next: F→E · ½ step down";
  last row: "loop"). Header data via theory.js `guideTones` /
  `voiceLeadingPairs` / `soloScale` — read-only imports.
- **Gallery:** first cell = the *station's own* voicing — guitar: the KB play's
  recommended shape badged "play" (when present); piano: the threaded/authored
  `stationVoicings[i].voicing` labeled honestly (e.g. "LH 3-5-7-9") — this is
  where the accordion's collapsed-thumb value survives. Then the full
  VoicingBrowser gallery (`show={instrument}`, `dense`): every placeable guitar
  shape / all four piano styles, each with its own ▶ (D-30 one-at-a-time
  playback contract). Bass: the §3 computed line (later the L-42 pattern card).
- **Active row:** `border-accent ring-2 ring-accent bg-accent/10` + "now" badge
  + `aria-current="true"`. Inactive rows `border-border bg-surface`, opacity
  floor 0.85 (never dim below AA). Tokens only; no new colour.
- **Mic-feedback microcopy** once below the last row (rail-owned; galleries run
  `dense`), as today.

### Focus semantics — pin simplified

With everything always expanded, the pin has nothing to hold open. It collapses
to a **focus toggle**: tapping a row header toggles that station as
`focusedStation` (renamed from `pinnedStation`, same JamGuide-owned state, same
reset-on-loop/style/instrument-change effect, same `onFocusChord({rootPc,
quality})` emission — the D-03 fretboard guide-tone contract is byte-compatible).
A focused row shows an "aim on fretboard" chip; tap again (or the loop changes)
to clear. `aria-pressed` on the header button, min 32px target,
`focus-visible:ring-2 ring-accent` everywhere.

**No auto-scroll.** The band lives in page flow, so `scrollIntoView` would yank
the whole page while the user reads the looper below — the accordion's
auto-centre effect is **removed**, not ported (deleted in the same L-40 commit
that promotes the band, §6.1 step 2 — today it is contained only by the dock's
70vh scroller, which the band no longer has). The playhead highlight travels;
the user owns the scrollbar (their explicit preference). On 4-row loops the
whole rail is one screenful anyway; on 8-row loops the banner up top always
shows the position. (Internal-scroll variant rejected: a nested scrollbar caps
the rail at ~62vh ≈ 3 rows — breaks the ≥4-visible goal at 900px.)

### Licks strip

Directly below the last station row, unchanged in behaviour: thumb LickCards
(~165px wide, strip ≈190px tall with heading), context-sorted to the playhead
station via the token-boundary matcher, strip-owned "fits X — now" ring, hides
entirely when the style has no licks, hidden under bass (§3). One flick below
the rows — consistent with its D-31 position in the scroll order.

### Space math (verified numbers: guitar cell ~93px, piano cells 160–284px, piano gallery ~1,178px worst — §1, licks thumb ~165px)

Row heights: guitar row ≈ header 30 + cells ~140 + padding ≈ **185px**; piano
row ≈ 30 + one cell line ~125 + padding ≈ **170px** single-line, ≈ **300px**
when the gallery wraps to two cell lines. Row widths (cells): guitar ≈ play
cell + 3–5 gallery cells ≈ **460–650px**; piano ≈ threaded cell up to ~284 +
gallery up to ~1,178 ≈ **~1,470px worst case**. Piano rows rooted above D with
a true 7th — i.e. most stations of most jazz/gospel loops — exceed 1,240px and
**wrap** (single-line piano rows exist only for roots C–D or triad qualities);
rows never scroll horizontally.

| Scenario | 1280×900 (~1,240×860 usable) | ~640px wide (~576 usable) |
|---|---|---|
| 4-chord loop, guitar | 4×185 = **740px** — all 4 rows in one screenful (band scrolled to top); +190 licks strip = one flick more | cells fit one line (5×93+gaps ≈ 500); 4 rows ≈ 740px ≈ 1.3 screenfuls |
| 4-chord loop, piano | best case (roots C–D / triads) 4×170 = **680px** ≈ one screenful; honest 7th-chord case (the jazz flagship): rows wrap → up to 4×300 ≈ **1,200px ≈ 1.4 screenfuls** — still zero clicks; the scroll license covers it | gallery wraps to 2–3 cell-lines → row ≈ 300–430px; 4 rows ≈ 1,200–1,700px ≈ 2–3 screenfuls, zero clicks |
| 8-chord loop (post-L-30) | guitar ≈ 1,480px ≈ **1.7 screenfuls** / piano ≈ up to 2,400px ≈ **2.8 screenfuls** — scroll, highlight travels, banner keeps the position | ≈ 2.5–6 screenfuls; still zero clicks |

At rest (no scroll) the band's visible ≈290px shows the header line + ~1–1.5
rows — enough to see the "now" row when it's early in the loop; one flick brings
the rail to the top. The user licensed exactly this trade.

---

## 5. What remains below — the dock slims to three sections, CurrentJamPanel retires

- **`KnowledgeDock`** (named export from JamGuide.jsx, §6.1): the bottom
  collapsible keeps **Explore / Voicings / Licks & Techniques** — the browse
  and study area (chord picker, KB progression browser, full lick grids, the
  shared level filter). The **jam section is removed** (it IS the band now);
  the dock's header drops the live match label and becomes static ("Knowledge
  Center — browse & study"). Level-filter chips stay dock-only; the band shows
  all levels (a glance surface filters nothing — directive 4).
- **`CurrentJamPanel` is unmounted by L-40.** The backlog already flags folding
  it; the band moving into its exact slot makes its duplication terminal
  (voicing strips → the rail; similar progressions → Explore; per-chord scale
  labels → row headers). Honest loss: its mode-level `SCALE_IDEAS` prose and
  `STYLE_VARIATIONS` cards exist nowhere else — the existing backlog item
  ("fold CurrentJamPanel's unique bits into the Knowledge Center") stays open
  for Professor/Muse; the file is retired-in-place, deletion filed with
  EducationPanel's. Note for Maestro: only `RiffDiagram.jsx` goes orphaned with
  it — `ChordBox.jsx` is still imported by ChordDetailModal.jsx (lines 2, 58)
  and ExplorePanel.jsx (lines 18, 170) and must **NOT** be deleted.
- **LoopStation** does not move — the band replaces `CurrentJamPanel` directly
  above it, so it ends up right below the jam surface it feeds for free.
  Debug/Drum/Tuner collapsibles unchanged.
- **ChordDetailModal, ProgressionSuggestions, Fretboard/Piano/BassFretboard,
  ProgressionBanner:** zero edits.

Resulting App.jsx order: banner → instrument row → **Jam Guide band** →
LoopStation → Debug → Drum → Tuner → **KnowledgeDock**.

---

## 6. Migration order — bounded scopes, green at every commit

Serialized: L-40 → D-41 (same surfaces). Each commit: `npm run build` +
`node scripts/smoke.mjs` green; Critic gates.

### 6.1 L-40 (Luthier) — App restructure + instrument threading + single loop display

**Files:** `src/App.jsx` (mounts + prop pass ONLY — 🚨 audio callbacks, refs,
AudioCapture props untouched, grep-gated), `src/components/JamGuide.jsx`,
`src/components/ExplorePanel.jsx` (VoicingsSection signature only — LicksSection
lives in JamGuide.jsx), `src/components/GlanceRail.jsx` (**one-line effect
deletion only**, see step 2 — re-lock at promotion per the ledger row).
**Not touched:** RoadmapTrack.jsx / CurrentJamPanel.jsx (unmounted, not edited),
ProgressionBanner.jsx, VoicingBrowser.jsx, all `src/lib/**`.

1. **Thread the instrument.** App passes `instrument` to the JamGuide mount;
   JamGuide deletes its internal tabs/state/availability gating and consumes
   the prop everywhere (§3 table); VoicingsSection gains the prop. Guide still
   at the bottom, four sections intact. Green.
2. **Split and promote.** JamGuide.jsx → default export `JamGuide` (the band:
   micro-header + jam content, always open, no section nav) + named export
   `KnowledgeDock` (collapsible, 3 sections, level filter). App mounts the band
   in CurrentJamPanel's slot, retires the CurrentJamPanel mount, keeps the dock
   last. **RoadmapTrack unmounted** (loop now shown exactly once — the banner).
   The band body for now = existing GlanceRail accordion + LicksStrip +
   heard-live/empty fallbacks. **Same commit, mandatory:** delete GlanceRail's
   auto-centre effect (GlanceRail.jsx:56–67 `scrollIntoView`) — it is contained
   today only by the dock's 70vh `overflow-auto` body; in page flow the nearest
   scroller is the DOCUMENT, so every playhead advance would yank the whole
   page — the exact failure §4 forbids. Promoting the band and deleting the
   effect must land together. Green.
3. **Honest bass state.** `instrument === 'bass'` + loop matched → the §3
   computed root/fifth/approach rows + single notice (band-level; no further
   GlanceRail edits). Green.

### 6.2 D-41 (Muse) — the all-expanded rail

**Files:** `src/components/GlanceRail.jsx` (rework), `src/components/JamGuide.jsx`
(band wiring: pass `keyMode`, `pinnedStation` → `focusedStation` rename,
LicksStrip/bass-slot composition into rows), `src/components/VoicingBrowser.jsx`
(**optional**, `dense`-path styling only). **Not touched:** App.jsx,
RoadmapTrack.jsx, ProgressionBanner.jsx, MiniPiano/ChordDiagram/LickCard, libs.

1. **Rows.** Accordion → all-expanded vertical rows: every station renders
   header + full gallery permanently; active row highlight (`aria-current`);
   pin → focus toggle (same onFocusChord contract). The `scrollIntoView`
   effect is already gone (L-40 step 2) — verify none is reintroduced. Green.
2. **Absorb the roadmap.** Row headers gain solo-scale, aim dots, transition
   chip (theory.js read-only imports); gallery gains the "play"/threaded first
   cell. Green.
3. **Reflow + verify.** Narrow (~640px) cell-wrap per row; eyeball 1280×900,
   1280×800, ~640; AA/focus audit; verify **rows wrap and never scroll
   horizontally** (the piano worst case ≈1,470px of cells does NOT fit 1,240 —
   §4), and recompute the honest screenful counts against the §4 table. Green.

---

## 7. Rejected alternatives

**Rejected A — the guide inside the main module** (banner absorbs the rail, or
the rail replaces the 30% ProgressionSuggestions column). Killed by width math —
and the corrected worst case only strengthens it: ~360px column vs a ~1,178px
piano gallery (§1); inside the banner it competes with the
key/history/now-chord — the one surface that must stay instantly readable. The
user's "or maybe right below it" is the version of his own ask that survives
arithmetic. Also rejected structurally: ProgressionBanner doing loops + history
+ now-chord + galleries is a god-component.

**Rejected B — all-horizontal expanded rail** (stations as columns, every column
expanded). The literal reading of "all voicings at once", and the axis the old
accordion already had. With the corrected cell widths it gets worse, not better:
4-station piano ≈ 5,900px wide; 8-station ≈ 11,800px; continuous sideways
tracking on the axis wheels don't scroll, whole stations hidden off-edge at any
moment — the directive's "follow while playing" fails exactly when it matters.
Vertical rows carry the same content with zero horizontal scroll (rows wrap,
§4).

**Rejected C — RoadmapTrack survives as the single loop display** (banner's loop
row dies instead). Keeps the education-dense artefact, but contradicts the
user's own account of where the loop lives ("it's already in the main module"),
costs ~230px of premium height above the rail, and the banner would still show
near-loop-shaped history chips — the "repeated again" feeling survives its own
fix. Folding the education into row headers (§2) keeps ~90% of the value at
~30px per row.

**Rejected D — keep the pin/accordion semantics inside the expanded rail**
(pinned row grows a bigger gallery). With everything expanded there is nothing
left to reveal; a "bigger on pin" state reintroduces layout shift mid-jam — the
exact complaint. The pin's two real jobs (fretboard guide tones, "hold still")
survive as the focus toggle.

**Rejected E — internal max-height scroller for the band** (~50–62vh, contained
auto-scroll). Caps visible rows at ~3 (< the user's "at least 4"), adds a nested
scrollbar inside the page scroll, and only exists to enable auto-scroll the
design doesn't want. Page flow + user-owned scrolling is simpler and matches
"scrolling is easier than clicking".

---

## 8. Out of scope / flags for Maestro

- **ProgressionBanner polish** (progress underline beneath loop chips) — future
  1-pointer, only if the beat grid is missed. Not in L-40/D-41.
- **Cleanup ticket:** RoadmapTrack.jsx, CurrentJamPanel.jsx and its now-orphaned
  RiffDiagram.jsx join EducationPanel.jsx in the retire-then-delete backlog
  item. ChordBox.jsx stays — it is live in ChordDetailModal + ExplorePanel (§5).
- **`SCALE_IDEAS`/`STYLE_VARIATIONS` prose** (CurrentJamPanel's unique content)
  — the existing fold-into-Knowledge-Center backlog item stays open.
- **L-42 contract** (§3): bass pattern card mounts in the row gallery slot;
  rail structure frozen for it.
- No new tokens, no new dependencies, no KB/theory/audio changes anywhere in
  this design. All figures either verified (guitar/licks cells from the D-31
  gate; piano worst case recomputed at the D-40 gate — G7 all-284px, §1) or
  marked as estimates (module heights).
