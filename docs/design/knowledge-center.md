# Knowledge Center — design concept (task D-20)

> **Thesis:** JamBuddy's knowledge should live in **one bottom dock with four sections**, grown out of the existing Jam Guide dock — not three (actually five) competing collapsible panels. The live Roadmap stays the flagship landing section; Explore, Voicings, and Licks & Techniques become sibling sections inside the same shell. One shared level filter (foundation/intermediate), one visual language (the Roadmap's, per `jam-guide-concept-c.md`), zero new top-level chrome.

**Decision authority:** per the sprint header (user away 12 h, no user gate), Muse picks the strongest layout and records rationale + rejected alternatives below (§6). Implementation is task **L-22**; this doc is its blueprint.

---

## 0. Honest audit — what actually exists today

Read directly from `src/App.jsx` and the components before designing. The "three disconnected surfaces" from the user directive are real, but the on-disk truth is messier:

| Surface | File | Mounted in App.jsx? | Content |
|---|---|---|---|
| Jam Guide (Roadmap) | `src/components/JamGuide.jsx` | **Yes** — last, bottom dock | Live loop → KB match → RoadmapTrack + voicing strip; instrument + style tabs |
| Explore panel | `src/components/ExplorePanel.jsx` | **No — orphaned** (verified: no import anywhere in `src/`) | Chord picker (root × quality), guitar voicing grid, piano techniques, famous progressions |
| Education panel | `src/components/EducationPanel.jsx` | **No — orphaned** (same verification) | Session snapshot, similar progressions, "play differently" substitutions, progression variations |
| Current Jam panel | `src/components/CurrentJamPanel.jsx` | **Yes** — mid-page collapsible | Voicings / scales / style options / **similar progressions** — heavy overlap with EducationPanel |
| Chord detail modal | `src/components/ChordDetailModal.jsx` | **Yes** — overlay | 6 tabs: Guitar, Piano, Theory, Learn (playbook + ASCII licks), Progressions, Explore |

So the fragmentation the user feels is: JamGuide (bottom) + CurrentJamPanel (middle) + ChordDetailModal (overlay), with two *dead* panels duplicating slices of both. The Knowledge Center consolidates the browse/learn material into the bottom dock, reuses the orphans as parts, and leaves CurrentJamPanel and the modal shell untouched this sprint (flagged for follow-up, §10).

---

## 1. Chosen structure — one dock, four sections

The existing JamGuide dock (collapsed header → ~70vh body) becomes the **Knowledge Center**. Its body gains a section nav; everything else about the dock chrome (collapsed summary bar, live match label, 70vh expand) is preserved.

```
┌─ KNOWLEDGE CENTER ── ii–V–I in C major · in C major ──────────────────── ▼ ─┐   (collapsed bar,
└──────────────────────────────────────────────────────────────────────────────┘    unchanged behaviour)

┌─ KNOWLEDGE CENTER ── ii–V–I in C major ──────────────────────────────── ▲ ─┐
│ ┌───────────────┬─────────┬──────────┬────────────────────┐                 │
│ │ ▶ Jam Guide ● │ Explore │ Voicings │ Licks & Techniques │  ← section nav  │
│ └───────────────┴─────────┴──────────┴────────────────────┘   (● = live)    │
│                                                                              │
│  [ Jam Guide (live) — the existing Roadmap body, byte-for-byte:             │
│    instrument tabs · style tabs · RoadmapTrack · voicing strip ]            │
│                                                                              │
│  [ Explore — KB progression browser + famous progressions:                  │
│    style chips · (Foundation)(Intermediate) level chips ·                    │
│    progression cards with level badge, chords-in-key, tip, songs ]          │
│                                                                              │
│  [ Voicings — chord picker (root × quality, follows the live chord) →       │
│    VoicingBrowser: guitar shapes + piano voicings, each with ▶ play ]       │
│                                                                              │
│  [ Licks & Techniques — style chips · level chips ·                          │
│    LickCard grid (tab SVG + technique glyphs) · glyph legend ]              │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Section semantics:**

1. **Jam Guide (live)** — default landing section; answers *"what do I play over this loop right now?"* The current Roadmap body moves in unchanged (RoadmapTrack, playhead, station voicings strip, piano tab from L-11). The `●` live dot on the nav pill pulses only when a loop is matched, so even from another section you see the guide is hot.
2. **Explore** — answers *"what could we play?"* A **KB progression browser** (new, simple: style chips from the `kb/index.js` registry → progression cards showing name, rn pattern, chords rendered in the current key, `tip`, level badge) plus the famous-progressions cards reused from ExplorePanel. Any chord chip → `ChordDetailModal` via `onChordClick`.
3. **Voicings** — answers *"how do I grip/voice this chord — and what does it sound like?"* ExplorePanel's root × quality picker (defaulting to `currentChord` when live) feeding **VoicingBrowser** (D-21): guitar alternatives via `ChordDiagram`, piano alternatives via `MiniPiano voicing`, each variant with a ▶ button through `src/lib/chordAudio.js`.
4. **Licks & Techniques** — answers *"give me a phrase."* Style chips → **LickCard** (D-22) grid of P-21 licks, level chips shared with Explore, technique-glyph legend once per grid (not per card). Styles without authored licks show an honest empty state ("No licks authored for Pop yet — Blues, Jazz and Funk have them").

**Why the dock and not a new page:** the Knowledge Center must be reachable *mid-jam* without losing the detection UI (key chip, fretboard, banner). The bottom dock already established that contract with the Roadmap; sections extend it. Concept-C's visual language (station cards, accent-on-active, dimmed-by-age tiers, amber for secondary/held tones) carries through all four sections.

---

## 2. IA map — reused / new / retired

| Piece | Fate | Where it lands |
|---|---|---|
| `JamGuide.jsx` Roadmap body (RoadmapTrack, voicing strip, instrument/style tabs, L-11 piano tab) | **Reused unchanged** | Section 1 content; JamGuide.jsx becomes the Knowledge Center shell + section 1 |
| `ExplorePanel.jsx` chord picker + quick-pick chips | **Reused** (refactored to named exports) | Section 3 toolbar |
| `ExplorePanel.jsx` `GuitarGrid` / `PianoGrid` | **Reused as interim**, then superseded by VoicingBrowser | Section 3 body until D-21 merges; kept as the no-audio fallback |
| `ExplorePanel.jsx` `ProgressionCards` (famous progressions) | **Reused** | Section 2, below the KB progression browser |
| KB progression browser (style → progressions with level badges) | **New** (small, data straight from `kb/index.js` which JamGuide already imports) | Section 2 hero |
| `VoicingBrowser.jsx` (D-21) | **New** | Section 3 + `ChordDetailModal` + station-enlarge (see §3) |
| `LickCard.jsx` (D-22) | **New** | Section 4 grid |
| Level filter chips | **New** (one shared component + one shared state in the shell) | Sections 2 and 4 toolbars (§4) |
| `EducationPanel.jsx` | **Retired** — stays unmounted; not edited (not in the L-22 lock). Its unique content (substitutions, variations) already lives in CurrentJamPanel + ChordDetailModal Theory tab. File deletion is a future cleanup task for Maestro to file | — |
| `CurrentJamPanel.jsx` | **Untouched this sprint** — overlap with section 2 acknowledged; folding it in is a follow-up (§10) | mid-page, as today |
| `ChordDetailModal.jsx` | **Shell untouched**; L-21 swaps only its Guitar/Piano tab grids for VoicingBrowser | overlay, as today |

Naming: the collapsed bar reads **"Knowledge Center — 〈live match label〉"**; the flagship keeps its name as section 1, "Jam Guide". No behaviour of the collapsed bar changes.

---

## 3. Where VoicingBrowser and LickCard mount

**VoicingBrowser** (`src/components/VoicingBrowser.jsx`, D-21) — three mount points, one component, prop-driven `{rootPc, quality}`:

1. **Knowledge Center → Voicings section** (L-22, via the ExplorePanel.jsx refactor) — the browse-first entry: pick any chord, audition every voicing.
2. **ChordDetailModal → Guitar/Piano tabs** (L-21) — replaces/extends the static `GuitarGrid`/`PianoGrid` so the modal's voicings become playable.
3. **Jam Guide station-enlarge** (L-21) — tapping a Roadmap station's thumbnail currently enlarges one `ChordDiagram`; it becomes the VoicingBrowser for that station's `{rootPc, quality}`, so mid-jam you can audition alternatives for the chord that's coming.

Data sources: guitar shapes from `src/lib/voicings.js` `GUITAR_SHAPES` (already the `ChordDiagram`-compatible `rootStr`/`offsets` format); piano voicings computed by `src/lib/piano.js` `pianoVoicing` (root / shell / rootlessA / rootlessB) rendered by `MiniPiano voicing`. Audio via `src/lib/chordAudio.js` (L-20). **Mic-feedback caveat surfaced in UI:** a one-line `text-gray-500` hint near the ▶ buttons — "played through your speakers — the mic may hear it" — mirroring the L-20 documentation.

**LickCard** (`src/components/LickCard.jsx`, D-22) — one mount point this sprint:

1. **Knowledge Center → Licks & Techniques section** (L-22): responsive grid, one card per P-21 lick, filtered by style chip + level chips. Card shows name, level badge, `chordContext` chip ("over the V7"), the tab SVG with technique glyphs (h, p, slide ⌒, bend ↑ … per the C-20 vocab), and the technique names it uses. The glyph legend renders once below the grid.

*Not* mounted in ChordDetailModal's Learn tab this sprint — that tab's `CHORD_PLAYBOOK` ASCII licks are a different corpus (`education.js`); converging them is future work, noted for Maestro (§10).

---

## 4. Level filter — placement and default

**Form:** two toggle chips, `Foundation` and `Intermediate`, rendered side by side in a section's toolbar. Both **on by default** (= show everything; badges do the signalling). Tapping one off narrows the list; both can't be off (tapping the last active chip is a no-op with a brief tooltip). This is the "easiest possible surface" per the directive: no new panel, no dropdown, one tap to see only intermediate material.

**State:** one `levels` state in the Knowledge Center shell, shared by both consuming sections — filter once, it holds as you move between Explore and Licks.

**Placement (exactly two spots):**
- **Explore section toolbar**, next to the style chips — filters the KB progression browser (every KB progression carries `level` after P-20).
- **Licks & Techniques toolbar** — filters LickCards (`lick.level` from the C-20 schema).

**Chip styling:** inactive = `bg-surface border-border text-gray-400`; active = `bg-accent/20 border-accent text-accent font-semibold` (the established active-tab treatment). Level *badges* on cards: foundation = `border-border text-gray-400`; intermediate = `border-amber/40 text-amber` (amber is already a token — no new colour needed).

**Honesty:** `FAMOUS_PROGRESSIONS` in `src/lib/education.js` carries **no** `level` field and `education.js` is in no task's lock — the famous-progressions cards in Explore show no badge and are **not affected by the filter** (they sit under their own "Famous progressions" subheading so the filter's scope reads clearly). Tagging that corpus is an open question for Maestro (§10).

---

## 5. Narrow-viewport plan

Target checks at implementation: **1280×800** (default Electron window), **~1024×768**, and **≤420px** width (half-snapped window).

- **Section nav:** horizontal chip row, `overflow-x-auto` + `shrink-0` pills (the pattern ChordDetailModal's tab bar and EducationPanel's nav already use) — never wraps into a tall block, never traps vertical scroll.
- **Dock body:** stays ~70vh with internal vertical scrolling; each section is a vertical stack on narrow.
- **Jam Guide section:** keeps its existing verified reflow (voicing strip wraps via `flex-wrap sm:flex-nowrap`, RoadmapTrack scrolls horizontally under the fixed playhead).
- **Explore:** progression cards are full-width stacked (they already are `flex-col`); chord chips inside cards wrap.
- **Voicings:** voicing-variant chips wrap; diagrams grid uses `repeat(auto-fill, minmax(140px, 1fr))` so thumbnails go 2-up at ~360px and never overflow; the enlarged diagram caps at container width (`max-w-full`, SVG scales via viewBox).
- **Licks:** grid `repeat(auto-fill, minmax(240px, 1fr))` → single column below ~520px; the LickCard SVG scales to card width (viewBox + `width:100%`), glyphs sized in SVG units so they scale with the tab.
- **Toolbars** (style chips + level chips): `flex-wrap` — level chips drop to a second row on narrow rather than shrinking below tap-target size (min 32px height).

---

## 6. Rationale + rejected alternatives (no user gate this sprint)

**Chosen: the four-section bottom dock grown from JamGuide.** Reasons:
1. **Minimum migration risk** — JamGuide already owns the dock chrome, the KB registry import, the live-match plumbing, and passed Critic's audio-contract gates repeatedly. Wrapping its body in a section nav is additive; the flagship Roadmap is never rebuilt.
2. **Mid-jam continuity** — knowledge is reachable while the detection UI stays on screen; the collapsed bar keeps broadcasting the live match even when closed.
3. **One home for the level filter** — shared state across Explore and Licks with zero duplication.
4. **App.jsx stays mount-only** — one additive prop (`onChordClick`, §7); no structural change near the audio callbacks.

**Rejected A — full-screen "Knowledge" mode/route** (top-level toggle Jam ⇄ Knowledge). More room per section, but it hides the detection UI while browsing (breaks the "look at it mid-jam" core promise), needs App.jsx restructuring far beyond mount-only, and adds a navigation concept the app doesn't have. Rejected on risk *and* UX grounds.

**Rejected B — keep three separate collapsible panels, restyled and cross-linked.** Cheapest to build, but it *is* the problem the user named: three headers competing in the scroll, three places for the level filter, no shared state, and the orphaned panels would be resurrected as-is (including EducationPanel's overlap with CurrentJamPanel). Rejected as fragmentation with a fresh coat of paint.

**Rejected C — right-side drawer.** Nice on ultrawide, but the Electron window is frequently narrow; a drawer either crushes the fretboard or overlays it (losing the glance-both-at-once value), and it duplicates the dock pattern the Roadmap already established. Rejected for viewport economics.

---

## 7. Migration order for L-22 (app green between every commit)

Precondition: **L-11** (piano in JamGuide) and ideally **L-21** hold locks on `JamGuide.jsx` — Maestro sequences L-22 after those merge. Order within L-22:

1. **Commit 1 — refactor `ExplorePanel.jsx` into parts.** Split into named exports: `ChordPickerToolbar`, `ExploreSection` (progression browser + famous progressions), `VoicingsSection` (picker + grids), `LevelChips`. Keep the default export as a thin composition of the parts. **Zero user-visible risk — the file is unmounted today.** Build + smoke green trivially.
2. **Commit 2 — Knowledge Center shell in `JamGuide.jsx` + App prop.** Add the section nav; move the existing Roadmap body (verbatim) into section 1; mount `ExploreSection` and `VoicingsSection` (with the interim static grids) from ExplorePanel.jsx; `App.jsx` gains exactly one additive prop on the existing JamGuide mount: `onChordClick={setSelectedChord}` (mount-only, nowhere near the audio callbacks/refs). App renders identically until the dock is opened; the Roadmap section is a code *move*, not a change.
3. **Commit 3 — level filter live.** `LevelChips` wired to the shared `levels` state; KB progression browser reads `progression.level` (P-20 must be merged); level badges on cards; licksless filter scope documented in the empty states.
4. **Commit 4 — Licks & Techniques section.** Mount the LickCard grid (needs D-22 component + P-21 data merged); style chips reuse the registry list section 1 already derives; shared level chips apply; empty state for lick-less styles.
5. **Commit 5 (in-sprint upgrade, may fold into L-21's landing) — Voicings section swaps static grids for `VoicingBrowser`** once D-21 merges: a one-line component swap inside `VoicingsSection`, with the static grids kept as the fallback when `chordAudio` is unavailable.

Every commit: `npm run build` + `node scripts/smoke.mjs` green; at no point does the app lose the Roadmap, the modal, or any mounted panel.

---

## 8. Tokens, contrast, keyboard

**Tokens only** — `bg-surface` #0f0f0f, `bg-panel` #1a1a1a, `border-border` #2a2a2a, `accent` #a855f7, `amber` #f59e0b (all already in `tailwind.config.js`). **No new colour is required** for the Knowledge Center; level badges reuse amber, active states reuse the accent tints already shipped in JamGuide.

**Measured contrast commitments** (computed, not assumed):
- `accent` #a855f7 on `panel` #1a1a1a ≈ **4.4:1** — passes AA for large/bold text and UI components, *borderline for small normal text*. Rule: small accent text sits on `bg-surface` cards (**≈4.8:1**, passes) or is ≥ semibold at ≥14px; body copy is never accent.
- `gray-400` #9ca3af on panel ≈ **6.9:1** — the floor for any *essential* label.
- `gray-500` #6b7280 on panel ≈ **3.6:1** — decoration/microcopy only, never load-bearing text (existing app convention, now explicit).
- `amber` #f59e0b on panel ≈ **8.1:1** — level badges and secondary-tone markers are comfortably AA.

**Keyboard:** every section pill, style chip, level chip, voicing variant, ▶ play button, and LickCard is a real `<button>` in DOM order with `focus-visible:ring-2 ring-accent` (the shipped pattern). Section nav uses `aria-pressed`/`aria-current`; level chips `aria-pressed`; the live dot on the Jam Guide pill is decorative (`aria-hidden`) with the liveness conveyed in the pill's `aria-label`. ▶ buttons get descriptive labels ("Play C maj7 — shell voicing"). The dock's expand/collapse button keeps `aria-expanded`.

---

## 9. What stays untouched (explicitly out of scope)

- **The audio/detection pipeline** — `AudioCapture.jsx`, `handleNote`/`handleChroma`/`handleOnset`, all refs and `useCallback` contracts in `App.jsx`. The only App.jsx change in this whole plan is one additive prop on an existing mount (§7 commit 2). `chordAudio.js` is a separate, lazily-created context (L-20's contract) and never touches the detection contexts.
- **Detection UI** — key chip, `ProgressionBanner`, `ProgressionSuggestions`, main `Fretboard`/`Piano`/`BassFretboard`, the D-03 guide-tone cross-link.
- **Tuner, Loop Station, DebugView, DrumView** — not part of the Knowledge Center; their mounts and order in App.jsx are unchanged.
- **`CurrentJamPanel`** — remains mounted as-is despite overlapping Explore (§10).
- **`ChordDetailModal` shell** and its Theory/Learn/Progressions/Explore tabs — L-21 touches only the Guitar/Piano voicing grids.
- **Libraries** — `theory.js`, `education.js`, `voicings.js`, `match.js`, `piano.js`: read-only from this design.

---

## 10. Open questions for Maestro

1. **`FAMOUS_PROGRESSIONS` level tags** — `education.js` is unlocked and untagged; famous-progression cards are exempt from the level filter (§4). File a small Professor task to tag it, or accept the split scope?
2. **CurrentJamPanel convergence** — its "Similar Progressions"/"Style Options" views largely duplicate Explore. Recommend a follow-up task (post-sprint) to fold its unique bits (per-chord open-voicing strips, scale diagrams) into the Knowledge Center and retire the panel — reduces the main scroll by one header.
3. **EducationPanel.jsx deletion** — confirmed orphaned; retire-in-place this sprint, file a cleanup deletion (Luthier, trivial) later so dead code doesn't confuse future agents.
4. **L-21/L-22 sequencing on `JamGuide.jsx`** — both edit it; this doc assumes L-11 → L-21 → L-22 (or L-22 commits 1–4 then the §7 commit-5 swap folded into L-21). Maestro to serialize the lock.
5. **Naming check with the user (async, non-blocking):** collapsed bar renamed "Knowledge Center — 〈match〉"; "Jam Guide" lives on as section 1. Cheap to revert if the user prefers the old bar title.
