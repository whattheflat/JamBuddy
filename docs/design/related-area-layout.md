# Related-area space layout — Try-this side-by-side + Related 2×2 (task D-75)

**Sprint:** `sprint-dashboard-polish` · **Owner:** Muse · **Impl tasks:** L-75 (TryThis.jsx + App mount) · L-76 (RelatedProgressions.jsx). Concept doc only — no code here.

**User ask (2026-07-13, verbatim, after running the working dashboard — happy with it):**
> "for the TRY THIS can we also add the little piano/fretboard next to it? now it also has a 1/2 option, but please put them next to each other, we have enough space in that area. also for the suggested progressions underneath there is space to have it cut in half to make it 2x2 in a similar fashion so we use the space and we fit everything in one big screen."

The user is pointing at the **LEFT column** of the jam dashboard (`flex-1` ≈ **744px** per `one-screen.md` §1 — far wider than the 500px rail) and asking us to **use its horizontal width**: (A) Try-this stops rotating one-at-a-time and shows **all** the current chord's substitutions **side by side**, each with a **mini instrument diagram** of that chord; (B) RelatedProgressions goes from a vertical list to a **2×2 grid**. Both to compress the vertical footprint so more fits on one screen.

---

## 0. The honest reversal (say it plainly)

L-74 shipped a **rotating one-at-a-time** Try-this card (`pickSub` / `advanceOnWrap` / `cycle`), because the same-day directive was *"more surprising, more jam-like, keeps offering new ideas."* The user has now **seen** that rotation and prefers **all-visible side-by-side** ("put them next to each other, we have enough space"). This doc **reverses** the rotation decision. That is not churn for its own sake — it is the user refining after seeing it live, exactly the loop the ensemble is built for. The **engine (`suggestSubstitutions`, L-73) and its rules do not change**; only the UI shape does.

What survives from L-74's `TryThis.jsx`:
- `parseChordName(name)` — pure, keep.
- `subsForChord(name, pos, loopArr, keyInfo)` — pure, keep.
- `pickSubject(loopArr, keyInfo, currentChord)` — pure, keep. This is what keeps the card **live**: it picks (a) the live `currentChord` if it parses and yields ≥1 sub, else (b) the first loop station that yields subs, else (c) `null` (honest empty). The card still follows the playhead — as you play, the subject chord and its ≤4 subs update.

What is **deleted**:
- `useState(cycle)` + the rotation `useEffect`, `advanceOnWrap`, `pickSub`, the `lastPosRef` / `lastNameRef`, the "N of M" indicator, the dot rail. Smoke coupling: **none** — `scripts/smoke.mjs` has zero references to `advanceOnWrap` / `pickSub` / `parseChordName` (grep-confirmed; its "rotation" hits are all progression-match tests). So L-75 can drop the helpers without touching smoke; its lock stays `TryThis.jsx` + `App.jsx`.

Honest empties preserved: no key / no loop / atonal → `pickSubject` returns null → render nothing (unchanged). A chord with fewer than 4 valid subs simply shows fewer cards (the engine already `.slice(0,4)`; often 1–3 fire).

---

## 1. Try-this — side by side, one card per sub, each with an instrument diagram

### 1.1 The layout

Keep the outer section shell (`rounded-2xl border border-border bg-panel p-3`, the micro-header "Try this instead of {chord} · in {key} {mode}"). Below it, replace the single-card body with a **flex-wrap row of sub-cards**, one per `subject.subs` entry (≤4):

```
<div className="flex flex-wrap gap-2">
  {subject.subs.map(sub => <SubCard … />)}
</div>
```

- **Container adapts to the instrument's cell width** (§3 proves the footprints — the across-count is NOT a fixed 4):
  - **guitar / bass** — `flex flex-wrap gap-2`, each card `basis-[168px] grow min-w-[152px]`: the small cells (guitar 75px, bass none) let **4 fit one row** in the 720px interior; with 1–3 subs the cards `grow` to fill.
  - **piano** — a **`grid grid-cols-2 gap-2`** (2×2): the mini keyboard's real footprint is up to **199px** (§3), so 4 piano cards cannot share one 720px row; a clean 2×2 mirrors the rail's own piano idiom (`VoicingBrowser` dense = `grid grid-cols-2`) and avoids the unbalanced 3+1 that a plain `flex-wrap` would produce.
  - On a narrow/stacked viewport both collapse to **1-per-row** (`grid-cols-1` / `flex-wrap`) — the DoD reflow, for free.

Each **SubCard** is a vertical stack (`flex flex-col items-center gap-1.5 rounded-lg border border-border bg-border/30 p-2`):

1. **Chord chip** (top) — the tappable control, reusing L-74's chip idiom exactly:
   `button` → `onChordClick?.(sub.label)`, classes `rounded-lg border border-border bg-border px-2 py-1 text-sm font-bold text-gray-100 hover:border-accent/50 hover:text-accent focus-visible:ring-2 focus-visible:ring-accent`. `aria-label={`${sub.label} — ${sub.why}`}`. Tap → `ChordDetailModal` (App's `setSelectedChord`), where the **full** why + all voicings live.
2. **Mini instrument diagram** (middle) — of `{sub.rootPc, sub.quality}`, following the **global instrument** (§2). This is the "little piano/fretboard next to it" the user asked for.
3. **Category tag** — the L-74 language: `relative` / `borrowed` / `colour` / `V7`, with the `↻` accent glyph **only** for `relative` + `secondary_dominant` (circle categories — unchanged rule, `text-accent`).
4. **Why** (bottom) — `sub.why`, `text-[11px] leading-snug text-gray-400`, **`line-clamp-3`** with the full text on the chip's `aria-label` + tap→modal. At ~152–168px card width, clamp-3 keeps whys up to ~75 chars whole; longer ones truncate visibly and the full sentence is one tap away. This is the honest trade of side-by-side: 4 whys visible at a glance costs each one its full width — the user chose see-all over the single full-width why.

### 1.2 Across-count is a function of the diagram footprint, not a fixed "4"

The user said *"put them next to each other … we have enough space"* and — resolving the piano case directly — *"for the piano's u can take more space in case there is indeed a bigger piano needed"* (2026-07-13). So: spend the **horizontal** budget as far as each instrument's diagram allows, and let piano take the **vertical** room it needs rather than cramming it. Guitar/bass cells are small (75px / none) → 4 subs sit **one row across**. Piano cells are large (up to 199px, §3) → 4 subs form a **2×2** — still "next to each other," still using the width, just a taller block (which the user explicitly OK'd). The count follows the footprint; the layout adapts (§1.1) instead of forcing a uniform grid that would clip the piano or waste the guitar row. **No MiniPiano change** — the keyboard renders at its honest size.

---

## 2. The instrument prop — threading + which resolver draws each diagram

`TryThis` needs the global `instrument` (`'guitar' | 'piano' | 'bass'`), which lives in `App.jsx` and is already handed to `JamGuide` (line 849). **Prop path:** add `instrument={instrument}` to the `<TryThis … />` mount in the `relatedSlot` (App.jsx ~line 859) and add `instrument` to the component signature: `TryThis({ loop, keyInfo, currentChord, onChordClick, instrument })`. One-line App change, grep-clean (no audio/callback contract touched) — this is the App half of L-75.

Per-instrument diagram resolver (mirror the established rail idiom in `VoicingBrowser.jsx:288`/`:327`):

| instrument | diagram | resolver → render |
|---|---|---|
| `guitar` | `ChordDiagram size="thumb"` (~75px) | `const shape = getGuitarVoicings(sub.label)[0]` → `<ChordDiagram shape={shape} rootPc={sub.rootPc} size="thumb" />`. `getGuitarVoicings` (voicings.js) resolves the first (barre/open) shape to **absolute** low-E-first frets; ChordDiagram's open-shape path windows them (draws a `5fr` label when up-neck). **Omit** ChordDiagram's own `label` prop — the chip above already names the chord (saves ~13px). If `getGuitarVoicings(sub.label)` is empty (rare), render **no** diagram — just chip + why (honest, no crash). |
| `piano` | `MiniPiano size="mini"` (107–199px, §3) | `<MiniPiano voicing={{ ...pianoVoicing({ rootPc: sub.rootPc, quality: sub.quality }), rootPc: sub.rootPc }} size="mini" />`. **Spread `rootPc` back in** — `pianoVoicing()` output carries none, and `VoicingPiano` needs it to badge "R" correctly (the VoicingBrowser:317-319 caveat). `size="mini"` = the dashboard-density scale already used in the rail's 2×2. |
| `bass` | **no diagram — honest** | Bass players read a chord symbol + root, not a chord grip; there is no compact bass-chord renderer, and reusing the guitar/piano diagram under a BASS selector would misrepresent the instrument (same honesty call the licks strip makes for bass). SubCard shows the chip + a small caption `root · {NOTES[sub.rootPc]}` (`text-[10px] text-gray-500`) + the why. Compact, correct, no faked shape. |

All diagrams use the established note-colour tiers already baked into `ChordDiagram`/`MiniPiano` (accent-purple root, light-purple/gray other tones, amber bass ring) — no new colour, no token change.

---

## 3. Space math — the LEFT column (~744px), honest

- Left column `flex-1 min-w-0` ≈ **744px** (one-screen.md §1). The `relatedSlot` is `flex flex-col gap-3` **directly** in it, so the Try-this `section` spans the full 744px. Section `p-3` (12px each side) → **interior ≈ 720px**.
- Per-card diagram footprints (recomputed from source geometry):
  - **Guitar** `ChordDiagram size="thumb"`: `padL 14 + gridW 55 + padR 6 = 75px` wide; `padT 11 + gridH 55 + padB 6 = 72px` tall (label omitted). Root-independent.
  - **Piano** `MiniPiano size="mini"` — the window is **C-octave-boundary anchored, NOT span-anchored** (MiniPiano.jsx:200-207): `octStart = ⌊minNote/12⌋`, `OCTAVES = max(1, ⌈(maxNote − octStart·12)/12⌉)`, `SVG_W = (22·(7·OCTAVES + 1) + 2)·0.60`. A voicing whose *interval span* is under an octave STILL renders **2 octaves** whenever its notes straddle a C boundary — so "span ≤ 1 octave" does **not** imply "renders 1 octave." Worked: F♯ major triad `pianoVoicing({rootPc:6})` → notes `[6,10,13]` (span 7) → `octStart 0`, `maxNote 13` → `OCTAVES = ⌈13/12⌉ = 2` → `SVG_W = (22·15 + 2)·0.60 = 332·0.60 = **199.2px**`. This fires for **every triad quality at roots pc ≥ 6 (F♯–B)** (maxNote = root + top-interval > 12) and for shells at most roots (the +12 lift pushes the 7th over the next C) — i.e. roughly **half** of all sub roots, and sub roots routinely land upper-half (any G♯/A♯/B relative / borrowed / secondary-dominant candidate). One octave (107px) is the *best* case (triad roots pc 0–5); **199.2px is the planning footprint.** MiniPiano.jsx:29-31's own header documents this "2-octave mini cell (213.2px)". `SVG_H = (60 + 4)·0.60 = **38.4px** — octave-INDEPENDENT`: the window widens, height never does.
- **Across-count per instrument** (interior 720px, `gap-2` = 8px; an SVG's hard `width` attr floors the flex item's min-content at ≈ its px, so `basis-[168px]` cannot shrink a piano cell below its keyboard):
  - **Guitar** — cell 75px, card ~152px min (diagram + `p-2` + chip width) → `4·152 + 3·8 = 632 ≤ 720` → **4-across, one row.**
  - **Bass** — no diagram, card ~152px → **4-across, one row.**
  - **Piano** — worst-case cell 199.2px, card ~215px (+ `p-2` 16) → `3·215 + 2·8 = 661 ≤ 720` but `4·215 + 3·8 = 884 > 720`. So **at most 3 share a row**, and 4 can't. Laid out as a **2×2 grid** (§1.1, per user's "take more space"): 2 cells/row, `2·215 + 8 = 438 ≤ 720` (roomy, each keyboard gets its full width) → **2 across × up to 2 rows.**
- **Row / block heights** (`SVG_H` is octave-independent, so piano height is driven purely by sub-count, not cell width):
  - **Guitar** card: chip ~22 + diagram 72 + why (clamp-3 @11px/1.35 ≈ 45) + tag ~12 + `p-2` 16 + inner gaps ~10 ≈ **~177px** → block (1 row + header 20 + `p-3` 24) ≈ **~221px.**
  - **Piano** card: chip ~22 + diagram 38 + why ~45 + tag ~12 + `p-2` 16 + gaps ~12 ≈ **~145px**. 4 subs → 2×2 = `2·145 + 8 ≈ 298` → block (+ 44 chrome) ≈ **~342px**. ≤3 subs → one row → block ≈ **~189px.**
  - **Bass** card ≈ chip 22 + root caption 14 + why 45 + tag 12 + `p-2` 16 + gaps 12 ≈ **~121px** → block ≈ **~165px.**
- **Headline:** guitar & bass show all ≤4 subs **4-across in one row** (~165–221px block). Piano shows them as a **2×2** taking the full room each 199px keyboard needs — **~189px** block for ≤3 subs, **~342px when all 4 fire** (two rows). Only piano's across-count/row-count vary; height is width-independent (38.4px SVG). This taller piano block is the honest, user-sanctioned cost of "the little piano next to it."

---

## 4. RelatedProgressions → 2×2 grid (L-76, layout only)

### 4.1 The change

Today the populated list is `<ul className="flex flex-col gap-2.5">` of up to `RELATED_MAX_ENTRIES` (5) entries, each = name + meta row (style/level/annotation-or-role) + `ChordChain` chips. **Swap the container** to a 2-column grid:

```
<ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
```

Each `<li>` (its inner markup — name row, `LevelBadge`, role/annotation, `ChordChain`) is **untouched**. `grid-cols-1` on narrow (the stacked reflow), `sm:grid-cols-2` at width. No ranking, scoring, `collapseChanges`, `siblingRole`, or annotation logic changes — L-76 is **presentation only**.

### 4.2 The cap: 5 → display **4** (no ranker change)

A clean 2×2 wants **4** cells; 5 leaves an orphan in a lonely third row that reads as broken. **Decision:** the ranker keeps `RELATED_MAX_ENTRIES = 5` (untouched — no smoke re-pin, no exported-constant edit); the **component renders `primary.slice(0, 4)`** into the grid. Entries are score-sorted, so this drops only the **lowest-scoring** 5th sibling — honest ("top 4"), and a future "show all" affordance could reveal it. This keeps L-76 strictly layout-scoped.

### 4.3 Which sections grid

Per L-72's finding-A, `secondary` (cross-style) is **currently always `[]`**: when a style is locked the panel is same-style-only; when unlocked, everything lands in `primary`. So **only `primary` is ever populated** → only it needs the grid. The optional cross-style section stays dormant; **if** a future change repopulates `secondary`, it gets its own `grid grid-cols-2` block below its own subheading (spec'd, not built). The **idle** dashed card and the two **empty-state sentences** ("You're on the only {style} loop…", "Nothing in the songbook genuinely relates…") stay single-column — they are prose, not a grid.

### 4.4 Space + height

- 2-col cell width ≈ `(720 − 10 gap) / 2 ≈ 355px`. A `ChordChain` of up to 8 chips (~40px each) wraps to ~2 rows inside 355px — fine, same chips, just narrower flow.
- Cell height ≈ name 18 + meta 16 + chain (2 chip-rows ~30 each) 60 ≈ **~95–100px**. Block = header ~20 + subheader ("Try these in {style}") ~18 + (2 rows × 100 + 10 gap) 210 + `p-3` 24 ≈ **~272px**.
- The old vertical **5**-list block ≈ header 20 + subheader 18 + 5 × ~90 + 4 × 10 + 24 ≈ **~552px**. **2×2(4) ≈ 272px → saves ~280px** — the compression the user is after ("cut in half"), almost exactly halved.

---

## 5. The whole left column on one screen (honest)

Usable content box at 1280×900 ≈ **836px** tall (one-screen.md §4). Left stack in jam-view = instrument view + licks strip + `relatedSlot` (`flex-1 min-h-0 overflow-y-auto` absorber = TryThis + RelatedProgressions). Heights are **section-inclusive** (own header + `p-3`); gaps = 3 × `gap-3` = 36px.

| build / instrument | instrument | licks | try-this | related | +gaps | **total** | vs 836 box |
|---|---|---|---|---|---|---|---|
| **current L-74** (guitar) | 240 | 190 | ~154 (rotating, 1 card) | ~552 (5-list) | 36 | **~1172** | overflow **~336px** |
| **D-75 new — guitar** | 240 | 190 | ~221 (4-across, 1 row) | ~272 (2×2) | 36 | **~959** | overflow **~123px** |
| **D-75 new — bass** | 240 | 190 | ~165 (4-across, 1 row) | ~272 | 36 | **~903** | overflow **~67px** |
| **D-75 new — piano, ≤3 subs** | 240 | 190 | ~189 (one row) | ~272 | 36 | **~927** | overflow **~91px** |
| **D-75 new — piano, 4 subs** | 240 | 190 | ~342 (2×2, 2 rows) | ~272 | 36 | **~1080** | overflow **~244px** |

**Honest headline:** the RelatedProgressions 2×2 halves that block in every case (**~552 → ~272, −280px**) — the compression the user asked for. Guitar and bass compress hard: the fold shrinks from the current build's ~336px to **~67–123px** (a micro-flick). Piano is the honest exception the user pre-approved: because MiniPiano's C-anchored window makes each keyboard up to 199px, four piano subs form a **2×2 (two rows, ~342px)**, so the piano-with-4-subs fold is **~244px** — still ~90px better than the current build, and only in the corner case where all four sub-rules fire *and* the diagram is piano (many chords yield 2–3 subs → piano one row → ~91px fold). The residue is absorbed only by the related area's `overflow-y-auto` (instrument + licks never move); a fold-flick is within the standing scroll license, and the user explicitly OK'd more vertical space for the piano. At **1280×960+** guitar/bass/piano-≤3 clear; piano-4-subs still wants a short flick for the related bottom row.

(The `flex-1 min-h-0 overflow-y-auto` absorber already exists — jam-view fit is exact by construction; only the related area, never the instrument/licks, absorbs the residue.)

> **Future option (out of D-75 scope):** the only lever to shrink the piano block further is a **span-anchored** MiniPiano `mini` window (crop to the voicing's actual keys instead of C-boundary octaves) — a MiniPiano code change, option (b), deliberately deferred. Flag for a follow-up task if the piano fold proves annoying in play.

---

## 6. Bounded scopes (disjoint)

- **L-75** — `src/components/TryThis.jsx` (rewrite: drop the rotation state/effect + `pickSub`/`advanceOnWrap` + indicator; keep `parseChordName`/`subsForChord`/`pickSubject`; render `subject.subs` as a `flex-wrap` row of SubCards, each with the instrument-following diagram per §2) **+** `src/App.jsx` (add `instrument={instrument}` to the TryThis mount — one line, grep-clean). No smoke coupling (§0). Disjoint from L-76.
- **L-76** — `src/components/RelatedProgressions.jsx` **only** (`ul` container `flex flex-col` → `grid grid-cols-1 sm:grid-cols-2`; `primary.slice(0, 4)` for display; idle/empty states untouched; **no** ranking/scoring/constant change). Disjoint from L-75.

Serialise or worktree — the two locks share no file. No `tailwind.config.js` change (no new colour); no `theory.js` / `piano.js` / `voicings.js` change (resolvers consumed as-is).

---

## 7. Rejected alternatives (≥2)

1. **Keep the rotation AND add a diagram to the single card.** Rejected: the user has seen rotation and explicitly asked for side-by-side ("put them next to each other, we have enough space") — a single card leaves the 744px width the user pointed at mostly empty, and re-litigates a decision the user has already moved past.
2. **One big shared diagram for all subs** (e.g. mark all subs on a single fretboard/piano, or a circle-of-fifths mini). Rejected: the subs differ in root, quality, **and** the right instrument grip; a per-sub diagram is exactly what teaches "play *this* shape instead," and it preserves the tap→modal-per-chord affordance. A merged diagram is unreadable and loses per-chord tapping.
3. **A uniform 2×2 for try-this across all instruments.** Rejected as the *default*: for guitar/bass (75px / no diagram) a 2×2 wastes half the row and is taller than 4-across for no benefit. Piano adopts a 2×2 only because its ~199px keyboards genuinely can't fit 4-across (§3) and the user OK'd more space for it — an instrument-driven adaptation, not a uniform choice.
4. **Cram/shrink the piano keyboards to force 4-across.** Rejected (and the user directly vetoed it, 2026-07-13): the `mini` SVG carries a hard width attr that floors the flex item, so "shrinking" would clip the keyboard; the honest fix is to let piano take a 2×2 and more vertical space. (A genuine width fix = span-anchored MiniPiano window = §5's deferred option b.)
4. **Change `RELATED_MAX_ENTRIES` 5→4 in the ranker for the 2×2.** Rejected: that edits an exported constant + forces a smoke re-pin, pulling L-76 out of "layout only." A component-side `slice(0, 4)` gets the clean grid with zero engine/scoring/test churn.
