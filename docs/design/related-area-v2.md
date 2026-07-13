# Related-area v2 — always-multi-chord voicings rail + stable 3×3 Try-this (task D-76)

**Sprint:** `sprint-dashboard-polish` · **Owner:** Muse · **Impl tasks:** L-77 (voicings rail: GlanceRail.jsx + JamGuide.jsx) · L-78 (TryThis.jsx). Concept doc only — no code here. Supersedes the relevant parts of `related-area-layout.md` (D-75) that this refines.

**User ask (2026-07-13, verbatim — "one last change then we push everything"):**
> "for the right part 'different voicings' there is currently only one chord visible, we said to show all chords in the loop with the most recent first. at all times we wanna see all different voicings of the different chords. also for the TRY THIS part please always keep the layout the same if it's 2 or 3 chords i want it to stay in place its annoying when the layout changes then u dont know where to look. max it on 3 TRY THIS suggestions, PLUS please add at least 3 ways to play it. i think we have enough space for 3x3 guitar. for piano it can be just one thats okay."

Two independent surfaces:
- **(A) The voicings RAIL** (right column, `JamGuide` `railContent`) must show **multiple chords, most recent first, at all times** — the "only one chord visible" is the no-loop heard-live fallback.
- **(B) TRY THIS** (left column) caps at **3** suggestions, holds a **stable fixed layout** (2-vs-3 subs never shifts position), and gives each suggestion **≥3 ways to play it** — a **3×3** guitar grid, **1** piano keyboard, bass root caption.

---

## 0. Where "only one chord" actually comes from (say it plainly)

`JamGuide` `railContent` (JamGuide.jsx:373-435) has **three** states:

1. `match.matched` → `<GlanceRail stations={stationVoicings} …/>` — **already** shows every loop chord as a vertical row (canonical KB order, playhead highlight, full per-row gallery). This is NOT the bug.
2. `liveChord` (no KB match but a chord is committing, JamGuide.jsx:252) → a **single** `<VoicingBrowser rootPc quality show dense/>` inside a "Heard live · {chord} — every voicing" section (JamGuide.jsx:411-425). **This is the "only one chord."**
3. else → the slim idle line.

So the fix is scoped to state 2 (and the idle-with-history case): replace the single-chord fallback with a **multi-chord, most-recent-first history rail**. State 1 (the loop) already satisfies "all chords of the loop" — the open question is only whether to physically reorder it most-recent-first (§1.3: no, and why).

---

## 1. The voicings rail — always multiple chords, most recent first

### 1.1 Decision: keep GlanceRail-for-loop + a new history fallback — do NOT fully unify

**Recommendation: keep the two paths, replace only the single-chord fallback.**

- **Loop matched** → `GlanceRail` as today (canonical order, playhead, per-row gallery, the D-40 voice-leading education). Untouched.
- **No loop** → a **new `HistoryRail`** driven by the recent DISTINCT `chordHistory`, most-recent-first, each rendered as a GlanceRail-style voicing row.

**Why not unify** (always drive the rail from recent-distinct-history, loop adds highlighting): the loop rail's education is *canonical-order-dependent*. `GlanceRail` computes `voiceLeadingPairs` between **canonically adjacent** stations (GlanceRail.jsx:234-241) and renders per-row `TransitionChip`s ("next F→E · ½ step down") plus the wrap chip ("loop") — a voice-leading **wheel**. Reordering those rows most-recent-first would make every "next …" chip point at the wrong neighbour, and the wrap chip lie. Unifying therefore *destroys* the loop education to satisfy a directive the loop already meets another way (§1.3). So: two paths, one shared row idiom, no loss.

This is also the **minimal, lowest-regression** change: `StationRow` (loop) stays byte-identical; the new `HistoryRow`/`HistoryRail` is additive.

### 1.2 The no-loop history rail — data source & most-recent-first

`chordHistory` is already a `JamGuide` prop (JamGuide.jsx:186; App passes it at App.jsx:846) — **no App change needed.** Build the rail entirely from it:

```
recentDistinct(chordHistory, cap = 6):
  seen = new Set(); out = []
  for name from END of chordHistory backwards:           // newest first
    parsed = parseChord(name)                             // voicings.js — same parser JamGuide already imports (line 12)
    if (!parsed) continue                                 // unparseable → skip, no crash
    if (seen.has(name)) continue                           // DISTINCT by chord name (subsumes consecutive-dedup)
    seen.add(name); out.push({ ...parsed, label: name })
    if (out.length === cap) break
  return out                                               // out[0] = the chord sounding now
```

**"Most recent first" mapping:** walk `chordHistory` from the tail (the newest commit is `chordHistory[len-1]` = `currentChord`, App.jsx:572). `out[0]` is therefore the current chord, `out[1]` the previous distinct chord, etc. **Distinct-by-name** (not merely consecutive-dedup) so "F Am F Am F" yields `[F, Am]` — the user wants the *different chords*, each once, not a ping-pong; the most-recent occurrence fixes each chord's slot. Cap **6** rows.

Each entry parses to `{ rootPc, type, label }` (voicings.js `parseChord` returns `{ rootPc, type }`). Feed each as a row.

**Honest edges:**
- **1 chord ever played** → 1 row. Unavoidable (there is genuinely one chord) — but it is now a *row in the rail idiom*, not a bespoke single-chord section. Strictly better than today, which also showed one.
- **20 chords** → the 6 most-recent distinct, newest first. Older ones roll off (the rail is a live window, not a log — the KnowledgeDock Voicings section is the browse-everything surface).
- **All same chord** (F F F F) → 1 row.
- **Unparseable name** → skipped; if *nothing* parses → fall through to the existing slim idle line (state 3), unchanged.

### 1.3 What "most recent first" means for the LOOP (honest)

For the loop, `GlanceRail` stays **canonical KB order** and the **playhead** (accent ring + "now" badge + `aria-current`, GlanceRail.jsx:184-188) marks the chord you're on. That IS "most recent, unmistakable" — it is exactly the active-chord-at-a-glance the DoD demands — without reordering. Physically reordering the loop rows most-recent-first is **rejected** (§6.1) because it breaks the voice-leading wheel. If the user, after seeing this, still wants the loop *physically* re-sequenced, that is a follow-up that must first rework/retire the `TransitionChip` education — flag to Maestro, don't silently do it.

### 1.4 The HistoryRail row anatomy (reuse, minus loop chrome)

A new `HistoryRow` (sibling of `StationRow` in GlanceRail.jsx — keep `StationRow` untouched for the loop). Per row, most-recent-first:

- **Header line:** `st.label` (plain bold text — no focus-toggle button; history chords aren't stations, so no fretboard-focus wiring → simpler, and the main Fretboard already follows `currentChord`). `SoloLabel` + `AimDots` **kept** (GlanceRail.jsx exported atoms) — those are *per-chord* guide-tone education, correct for any chord, and give the history rail visual parity with the loop rail. **No** `TransitionChip` (no canonical adjacency), **no** "next" tag.
- **"now" marker on row 0** (the most-recent chord): the same `border-accent bg-accent/10 ring-2 ring-accent` + "now" badge `StationRow` uses for the playhead — so the active chord is unmistakable (DoD). Rows 1-5 recede to the `opacity: 0.85` floor, exactly as inactive loop rows.
- **Gallery — as-is:** `<VoicingBrowser rootPc={st.rootPc} quality={st.type} show={instrument} dense max={4} />`. Guitar ≤4 recommended-first shapes on one line, piano 2×2 mini, **no ▶** — the identical per-row gallery the loop rail uses. `recommended` is **null** (an arbitrary heard chord has no authored KB play), which `VoicingBrowser` already handles (order untouched, no badge).

`HistoryRail` header (the section h4): `Recent chords · newest first — every voicing`, with the one-line microcopy `Following what you play — the newest chord is up top; no repeating loop yet.` (tokens: `bg-panel`, `border-border`, `text-gray-500`).

### 1.5 Bass, no loop

The no-loop bass path today renders `BassGuideRows` with a **single** live station (JamGuide.jsx:404-410). Extend it to the **same recent-distinct stations, most-recent-first**: pass the `recentDistinct` array to `BassGuideRows` with approach suppressed (history is not a loop → no "approach into the next chord" line; reuse the existing `live` gate, which already turns `next` off at BassGuideRows.jsx:557, or add a `history` flag if the "· heard live" header wording should change to "· recent"). Root + fifth per row; row 0 marked "now". This keeps all three instruments honest and multi-chord.

### 1.6 Rail fit (unchanged geometry)

The rail column is 500px with the D-51 margin-hardened interior (~451px worst-case; GlanceRail.jsx:5-13). `HistoryRow` reuses the exact `VoicingBrowser dense max={4}` cell math, so guitar 4-across (374 ≤ 451) and the piano 2×2 pair (442 ≤ 451) fits are **byte-for-byte the loop rail's** — no new fit risk. Up to 6 rows stack vertically inside the column's existing `overflow-y-auto` scroller (JamGuide.jsx:493-497); the user owns the scrollbar (no auto-scroll — GlanceRail.jsx:46-49's law holds).

---

## 2. Try this — max 3, stable 3-slot layout, ≥3 ways to play each

### 2.1 The reshape: from cards-across to rows-of-shapes

Today `TryThis` (TryThis.jsx:171-189) lays subs **side by side** (columns = subs), each `SubCard` carrying **one** diagram. D-76 turns this **90°**: **rows = subs, columns = shapes.** Each sub becomes a **horizontal row**: an identity block (chord chip + tag + why) on the left, and its **≥3 ways to play it** on the right. Three sub-rows stacked = the "3×3" the user pictured (3 subs × 3 guitar shapes).

Cap: `subject.subs.slice(0, 3)` (was up to 4 — TryThis.jsx:160 `subs`). The engine (`suggestSubstitutions`, L-73) and `pickSubject`/`subsForChord`/`parseChordName` are **unchanged** — reactivity preserved: subject still follows `currentChord`, subs recompute per chord (TryThis.jsx:79-90, 152-160). Only the render and the cap change.

### 2.2 The STABLE fixed 3-slot layout (the anti-jump)

**Always render exactly 3 slots**, in order:

```
<div className="flex flex-col gap-2">
  {[0,1,2].map(i => subs[i] ? <SubRow sub={subs[i]} …/> : <EmptySlot key={i}/>)}
</div>
```

- A present sub → `SubRow`. An absent one → `EmptySlot`: a **subtle placeholder** that holds the **exact SubRow height** for the current instrument — `rounded-lg border border-dashed border-border/50 bg-transparent` at low opacity, a centred muted `—` (`text-gray-600 text-[11px]`), `aria-hidden`. It reads as "an intentionally empty slot," not as broken, and — critically — the first two rows **never move** whether the chord yields 2 or 3 subs. This is the exact complaint the user raised ("annoying when the layout changes then u dont know where to look"): with fixed slots, sub #1 and sub #2 are always in the same pixel band.
- **Uniform row height per instrument** (not across instruments — the global `instrument` is fixed at any moment, so all 3 slots share one instrument's row height): guitar `min-h-[100px]`, piano `min-h-[72px]`, bass `min-h-[64px]` (§3 math). `EmptySlot` inherits the same `min-h-*`.

Why 3 slots and not "as many as fire": stability is worth a little reserved whitespace. The user explicitly chose predictable position over density here.

### 2.3 SubRow — guitar (the 3×3), piano (1), bass (caption)

Outer row: `flex items-center gap-3 rounded-lg border border-border bg-border/30 p-2 min-h-[…]` (reuses the SubCard token palette — TryThis.jsx:126).

**Left identity block** (`flex flex-col gap-1 shrink-0 w-[180px]`), all instruments:
1. **Chord chip** — the tappable control, reused verbatim from TryThis.jsx:127-134: `button → onChordClick?.(sub.label)`, `rounded-lg border border-border bg-border px-2 py-1 text-sm font-bold text-gray-100 hover:border-accent/50 hover:text-accent focus-visible:ring-2 focus-visible:ring-accent`, `aria-label={`${sub.label} — ${sub.why}`}`. Tap → `ChordDetailModal`. Inline beside it: the **category tag** (`relative`/`borrowed`/`colour`/`V7`) + the `↻` accent glyph for circle categories only (`CIRCLE_CATEGORIES`, TryThis.jsx:48-55 — unchanged rule).
2. **Why** — `sub.why`, `text-[11px] leading-snug text-gray-400`, `line-clamp-2` (the identity block is ~180px wide; 2 lines ≈ 50 chars; full text stays on the chip `aria-label` + tap→modal). Wider than the old 152px card, so whys clip less.

**Right "ways to play" block**, by instrument:

| instrument | right block |
|---|---|
| **guitar** | `flex gap-2` of **up to 3** `ChordDiagram size="thumb"` (~75px), from `getGuitarVoicings(sub.label).slice(0, 3)`. Each thumb captioned underneath with its shape name (`text-[9px] text-gray-500` — e.g. "E Barre", "A Barre / 5fr") so the three read as **three genuinely different grips**, not a repeat. **Omit** ChordDiagram's own `label` (the chip names the chord). Fewer than 3 shapes exist (dim/aug, §2.4) → show what exists; the row does not pad with blanks (the shapes left-align, the row height is fixed by `min-h`). |
| **piano** | **one** `MiniPiano size="mini"` (per the user: "for piano it can be just one thats okay"): `<MiniPiano voicing={{ ...pianoVoicing({ rootPc: sub.rootPc, quality: sub.quality }), rootPc: sub.rootPc }} size="mini" />`. Spread `rootPc` back in (the VoicingBrowser.jsx:317-319 caveat) so "R" badges correctly. |
| **bass** | no diagram — `root · {NOTES[sub.rootPc]}` caption (`text-[10px] text-gray-500`), the same honesty call TryThis/BassGuideRows already make (there is no compact bass-chord renderer). |

All diagrams use the established tiers baked into `ChordDiagram`/`MiniPiano` (accent-purple root, gray/light-purple other tones) — **no new colour, no token change.**

### 2.4 Honest empties

- **Fewer than 3 subs** for the chord → the missing slot(s) render `EmptySlot` (§2.2). Position of the present subs is unchanged.
- **A guitar sub with fewer than 3 shapes**: `getGuitarVoicings` returns all placeable shapes — barre forms are always placeable (any root ≤ fret 15). The engine only ever emits **{min, maj, dom7, maj7, add9, maj6, min7, sus4}** (every `mk()` call in theory.js:801-917 — dim/aug are **never** substitution candidates, so they can't appear here). Of those, **maj/min/dom7/maj7/min7/sus4/maj6** carry ≥3 barre shapes → the full 3×3 (voicings.js:10-53, 76-105). The genuine 2-shape case is **add9**: `getGuitarVoicings` returns only 2 barre shapes (E Barre, A Shape) for **9 of 12 roots**, and 3 only for **C/G/D** (which add an open Cadd9/Gadd9/Dadd9, voicings.js:116-121) → that sub-row honestly shows **2** thumbs, `slice(0,3)` simply yielding two. And add9 is **routinely** emitted — Rule C picks add9 for a major-family chord whose maj7 added tone is non-diatonic (e.g. in D major, the V chord A → **Aadd9**), which is common on major-family V-type chords. So a 2-thumb guitar row is a **regular, honest occurrence**, not a rarity; it never crashes and never pads with fakes.
- **No subject** (no key / no loop / atonal) → `pickSubject` returns null → render nothing (TryThis.jsx:157, unchanged).

### 2.5 Reactivity preserved

`pickSubject(loopArr, keyInfo, currentChord)` still chooses the live chord first, then the first loop station that yields subs (TryThis.jsx:79-90). As the progression evolves the subject and its (now ≤3) subs recompute every commit — the user confirmed they want it to evolve with the playing. The only behavioural deltas: **cap 3** and **3 shapes each**.

---

## 3. Space math — honest

**Left column** `flex-1 min-w-0` ≈ **744px**, section `p-3` → interior **≈ 720px** (one-screen.md §1; carried from D-75 §3). Footprints from source geometry: `ChordDiagram size="thumb"` = **75×72px** (padL 14 + gridW 55 + padR 6; padT 11 + gridH 55 + padB 6). `MiniPiano size="mini"` = up to **199×38px** (C-anchored window, D-75 §3 — width varies with root, **height is octave-independent 38.4px**).

**Guitar SubRow.** Right block: 3 thumbs = `3·75 + 2·8 = 241px` (+ 9px shape captions → ~84px tall). Left identity 180px + gaps ≈ `180 + 12 + 241 = 433 ≤ 720` — comfortable, ~287px to spare. Row height = max(thumb 72 + caption 12 = 84, chip 22 + why-2-lines 30 = 52) + `p-2` 16 ≈ **~100px** → `min-h-[100px]`. **3 slots** = `3·100 + 2·8 = 316`; block (+ header 20 + `p-3` 24) ≈ **~360px** — fixed, 2 subs or 3.

**Piano SubRow.** Right block: one `mini` keyboard ≤199px wide, 38px tall. `180 + 12 + 199 = 391 ≤ 720`. Row = max(38, 52) + 16 ≈ **~72px** → `min-h-[72px]`. **3 slots** = `3·72 + 16` ≈ 232; block ≈ **~276px**.

**Bass SubRow.** No diagram. Row = 52 + 16 ≈ **~64px** → `min-h-[64px]`. 3 slots ≈ 208; block ≈ **~250px**.

Note the 3×3 guitar block (~360px) is **taller** than D-75's 4-across single row (~221px) — the honest cost of "at least 3 ways to play each," which the user asked for directly.

### One-screen budget @ 1280×900 (usable box ≈ 836px, one-screen.md §4)

Left jam-view stack = instrument view + licks strip + `relatedSlot` (`flex-1 min-h-0 overflow-y-auto` absorber = **new** Try-this + RelatedProgressions 2×2 from L-76); gaps = 3·`gap-3` = 36px.

| instrument | instrument | licks | try-this (new) | related 2×2 | +gaps | **total** | vs 836 |
|---|---|---|---|---|---|---|---|
| **guitar** | 240 | 190 | ~360 (3×3, 3 slots) | ~272 | 36 | **~1098** | overflow **~262px** |
| **piano** | 240 | 190 | ~276 (1 kbd, 3 slots) | ~272 | 36 | **~1014** | overflow **~178px** |
| **bass** | 240 | 190 | ~250 (caption, 3 slots) | ~272 | 36 | **~988** | overflow **~152px** |

**Scroll story (honest):** the instrument view and licks strip stay **pinned** (they are `xl:shrink-0`, JamGuide.jsx:476-481); only the `relatedSlot` — the `flex-1 min-h-0 overflow-y-auto` absorber (JamGuide.jsx:485-489) — scrolls. So the taller 3×3 try-this deepens the fold in the *related area only*: guitar wants a ~262px flick to reach the bottom of the RelatedProgressions grid, piano ~178px, bass ~152px. This is ~139px more than D-75's guitar fold (~123px) — the direct, user-requested trade for 3 grips per sub. Instrument + licks never move; the active chord and the Try-this subjects are always above the fold. At **1280×1080+** guitar clears; piano/bass clear at ~1100. The `overflow-y-auto` absorber makes the fit exact by construction — the residue lands only in the related area, never on the instrument/licks the player watches.

*(The right rail is independent: `HistoryRail`'s ≤6 rows live in the 500px column's own `overflow-y-auto` scroller — they do not affect the left-column budget.)*

---

## 4. Bounded scopes (file-disjoint → parallelisable)

- **L-77 — the voicings rail.** Files: **`src/components/GlanceRail.jsx`** (add `HistoryRow` + exported `HistoryRail`, reusing the `VoicingBrowser dense max={4}` gallery + `SoloLabel`/`AimDots`; `StationRow`/`GlanceRail` for the loop stay byte-identical) **+ `src/components/JamGuide.jsx`** (a `recentDistinct(chordHistory)` memo; the no-loop `railContent` branch → `HistoryRail` for guitar/piano and `BassGuideRows` fed the recent-distinct stations with approach suppressed for bass; the single-`VoicingBrowser` fallback is retired). **No App change** (`chordHistory` already flows in, JamGuide.jsx:186 / App.jsx:846). No `theory.js`/`voicings.js`/`piano.js`/`tailwind.config.js` change (resolvers/tokens consumed as-is).
- **L-78 — Try this.** File: **`src/components/TryThis.jsx` only.** Cap `subs.slice(0,3)`; replace the cards-across body with the 3-slot rows-of-shapes (§2); keep `parseChordName`/`subsForChord`/`pickSubject`. **No App change** (`instrument` already threaded by L-75, App.jsx:864). No engine change (§2.5).

**Disjoint:** L-77 = {GlanceRail.jsx, JamGuide.jsx}; L-78 = {TryThis.jsx}. **Zero file overlap** → they can run in parallel (worktree) or serial, in any order. Neither touches `theory.js`, `voicings.js`, `piano.js`, `App.jsx`, or `tailwind.config.js`. C-70's `VoicingBrowser.jsx` aria fold is disjoint from both.

*(If a future revision wants the history rail and the loop rail to share one component body, that unification is out of D-76 scope — it would re-touch `StationRow` and risk the loop path; keep it a separate task.)*

---

## 5. What does NOT change

- The engine `suggestSubstitutions` and its rules/why-copy (L-73) — untouched; only the display cap (4→3) and per-sub shape count change.
- The loop rail (`GlanceRail`/`StationRow`): canonical order, playhead, voice-leading wheel, focus→fretboard — all byte-identical.
- `VoicingBrowser`, `ChordDiagram`, `MiniPiano`, `pianoVoicing`, `getGuitarVoicings` — consumed as-is.
- Tokens: `bg-panel`, `bg-surface`, `border-border`, `text-accent`/`bg-accent`, the accent ring, the established note-colour tiers. **No new colour, no `tailwind.config.js` edit.**

---

## 6. Rejected alternatives (≥2)

1. **Reorder the LOOP rail most-recent-first (physically re-sequence the rows).** Rejected: `GlanceRail` builds `voiceLeadingPairs` between *canonically adjacent* stations and shows per-row "next F→E · ½ step down" + a "loop" wrap chip (GlanceRail.jsx:118-132, 234-241). Reordering makes every transition chip point at the wrong neighbour and the wrap chip lie — it trades away the loop's whole voice-leading education for a re-sort the playhead highlight already conveys. The current chord is unmistakable *in place* via the "now" ring.
2. **Fully unify: always drive the rail from recent-distinct-history, loop merely overlays highlighting.** Rejected: same casualty — the transition/wrap education is canonical-order-only, and a history-ordered rail can't carry it. Unifying is a larger refactor that *reduces* the loop's teaching value. Two paths sharing one row idiom is smaller and loses nothing.
3. **Keep Try-this side-by-side (columns = subs) and just add 2 more diagrams per card.** Rejected: 3 subs × 3 guitar thumbs across = `3·(3·75) ≈ 675px` of diagrams fighting for a 720px row with no room for chips/whys, and it re-introduces the 2-vs-3 horizontal jump the user hates (cards grow/reflow). Rows = subs, columns = shapes, fixed 3 slots is the stable-position answer.
4. **Let the number of Try-this slots follow the sub count (render 2 rows when 2 subs).** Rejected: that is exactly the "layout changes, you don't know where to look" jump the user called out. Reserving 3 slots with a subtle placeholder costs a little whitespace and buys constant position — the user's explicit priority.
5. **Shrink guitar thumbs to force less height / cram the 3×3.** Rejected: 75px is the established `ChordDiagram thumb` size used everywhere (rail, KC, modal); shrinking it below the shared size fragments the visual language and hurts readability mid-jam. The honest cost of 3 grips per sub is ~140px more fold in the *related area only* (§3) — pinned instrument/licks are unaffected, and the user asked for the 3 grips knowing it takes room.
