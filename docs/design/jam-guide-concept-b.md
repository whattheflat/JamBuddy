# Jam Guide — Concept B: "Playbook"

> Ledger task **D-00b** · domain: design · author: Muse
> Tokens: `bg-surface` #0f0f0f · `bg-panel` #1a1a1a · `border-border` #2a2a2a · `accent` #a855f7 · `amber` #f59e0b

## 1. Name + thesis

**"The Playbook"** — the whole loop opened flat like a method-book page: a grid where **columns are the chords of the progression** and **rows are different ways to voice it**, so you can read *across* the loop and *down* the voicings in a single glance and choose how you want to play it.

This is the **deepest-information** of the three concepts. Stage answers "what do I play *right now*"; Roadmap answers "where am I going". Playbook answers **"how is this whole thing played, and what are my options"** — the panel you open between choruses to study, then internalise.

---

## 2. Mockup — Blues 12-bar in A (real KB data, full-width ~70vh)

Rendered from `kb/blues/progressions.js` (`blues-12bar`) + `kb/blues/guitar.js` (`plays['blues-12bar']`). The 12-bar form collapses to its **3 distinct chords (I7 · IV7 · V7)** as columns — the grid teaches the *vocabulary*, the bar map (top strip) teaches the *form*. Each cell is a `ChordDiagram` (D-01). `●` = fretted/finger, `○` = root, `×` = muted, numbers above = barre fret.

```
┌─ JAM GUIDE ──────────────────────────────  [ Guitar ▸ Piano  Bass ]   [ Jazz ‖ BLUES ‖ Rock  Bossa  Funk … ] ──┐
│                                                                                                                  │
│  Matched:  Standard 12-bar  ·  A major          your loop:  A7 → D7 → E7        ♻ bar 5 / 12  · 96 BPM shuffle  │
│  form:  ┃A7┃A7┃A7┃A7┃D7┃D7▸┃A7┃A7┃E7┃D7┃A7┃E7┃   ← active bar pulses amber, sweeps L→R with the band            │
│ ───────────────────────────────────────────────────────────────────────────────────────────────────────────── │
│                       I7   ·  A7                IV7  ·  D7   ◀ playing now            V7   ·  E7                  │
│                                                                                                                  │
│  Barre shuffle    ●○ ● ● ● ●  fr5          ●× ●○ ● ● ● ●  fr5  ◀━━━━━           ●○ ● ● ● ●  fr7                  │
│  ▸ beginner-safe  │○│ │ │ │ │              │×│○│ │ │ │ │      ◀ active col      │○│ │ │ │ │                     │
│  R-5-♭7-3         E-shape A7               A-shape D7  (glows)                  E-shape E7                       │
│                   "root on 6th str"        "same fret, root str up"            "two frets above IV"             │
│ ───────────────────────────────────────────────────────────────────────────────────────────────────────────── │
│  9th stabs        ×○♭7 ● ● ●  fr5          ×○♭7 ● ● ●  fr5                      ×○♭7 ● ● 13  fr7 (V13)           │
│  ▸ intermediate   │×│○│♭│●│●│●│            │×│○│♭│●│●│●│                        │×│○│♭│●│●│●│  pinky → 13        │
│  R-3-♭7-9 (Texas) "slide in ½-step below"  "IV9"                               "V13 — horn-section hook"        │
│ ───────────────────────────────────────────────────────────────────────────────────────────────────────────── │
│  Tritone shells   ×○ ● ● × ×  fr5          ×○ ● ● × ×  fr5                      ×○ ● ● × ×  fr7                  │
│  ▸ minimal/comp   R-♭7-3 only              "inner pair drops 1 fret → IV"      "Chicago grip"                   │
│                                                                                                                  │
│                                              ⌄ more ways (2)  —  Jimmy Reed boogie · Stormy Monday walk-up      │
│ ═══════════════════════════════════════════════════════════════════════════════════════════════════════════── │
│  IMPROV   over I7 → A Mixolydian · over IV7 → D Mixo · target the 3rds  C♯→F♯→G♯  ·  the blues curl: ♭3↗3       │
│           lick ▸  B.B. box in C: e|8 10b12 10 8 · D bent to E (the 3rd)            tap a cell to hear it ♪      │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

Header reads tokens directly: panel `bg-panel`, hairlines `border-border`, the matched-style tab and active highlights `accent` (#a855f7), the live bar/now-playing pulse `amber` (#f59e0b) — matching `ProgressionBanner`'s existing "active = accent ring, numeral = amber" language so the two panels feel like one instrument.

---

## 3. Interaction & live-sync model

**Active-column highlight (the live thread).** The detected `currentChord` maps to a *column*, not a single cell. Reusing `findLoopPosition` (extracted to `src/lib/match.js` per L-01), the panel finds the loop index, looks up which of the 3 chord-columns that bar belongs to, and lights the whole column: an `accent` left-border rail, a faint `bg-accent/8` column wash, and an `◀ playing now` caret over the header. Because Playbook shows the *whole* loop at rest, the highlight is a **moving spotlight over a static page** — your eye already knows where the next column is, so you read ahead in rhythm. The top **bar-map strip** carries the finer-grained pulse (which of 12 bars), sweeping amber L→R; the grid columns carry the coarser "which chord". Two clocks, one glance.

**"More ways ▾" expansion.** Each cell stack shows the first **2–3 plays** that fit the panel height; remaining plays (the KB has up to 4–5 per progression — Jimmy Reed boogie, Stormy Monday walk-up, etc.) collapse behind a single `⌄ more ways (N)` row at the grid foot, labelled with their play titles so you know what you're expanding. Click → the grid grows new rows in place (panel scrolls internally, header + bar-map stay pinned). Per-row, a small `▸` chevron on the row label toggles that row's **tips** line (the `tips` string) and per-cell `note`/`extensions` annotations from collapsed to shown — dense by default, denser on demand.

**Instrument / style tabs.** Top-right: style tabs generated from `kb/index.js` keys (`jazz blues rock bossa funk reggae country rnb` today, growing as the loop fills cells) — the matched style is auto-selected and shown `accent`-filled; the others are quiet `text-gray-400` and switch the whole grid (re-voicing the same detected loop in another idiom — the core "Jazz→Bossa over one ii–V–I" payoff). Top-left: instrument segmented control (Guitar live; Piano/Bass dimmed until those packs exist, driven by `instruments` keys present in the registry). Both persist to settings.

**Scroll vs collapse.** Collapsed, the panel is a **single header strip** (`Matched: … · your loop · ♻ bar n/12`) always visible at the bottom of the app scroll — identical resting footprint to the other two concepts. Click the header (or scroll into it) → expands to ~70vh. Inside, the grid scrolls **vertically** (more rows than fit) with the header, bar-map, and improv footer pinned; on narrow viewports it reflows (see §5) so columns never crush.

---

## 4. KB-data mapping (proves it's buildable today)

Every cell is driven by existing fields in the shipped guitar packs — nothing new is invented:

| UI element | KB source (`kb/blues/…`) |
|---|---|
| Column headers (I7 · IV7 · V7) + `name`, key chip | `progressions.js` → `rn`, `name`, `mode`; deduped against `degrees`/`qualities` to the distinct chords |
| Top bar-map strip `┃A7┃A7┃…┃` | `progressions.js` → full `degrees` × `bars`, rendered absolute in the detected key |
| Row labels ("Barre shuffle", "9th stabs", "Tritone shells") | `guitar.js` → `plays['blues-12bar'][].label` |
| Row level badge (`▸ intermediate`) | `plays[][].level` |
| Each diagram cell | `plays[][].chords[stepForThisColumn].shape` → `ChordDiagram` (D-01); movable `rootStr`+`offsets` placed at the column chord's fret in the detected key; open shapes via `frets`+`onlyRoot` |
| Cell colour-tone label (`R-3-♭7-9`), `13`/`♭7` glyphs | `chords[].extensions` + the shape's computed pitch classes (chord-tone tier = `accent`, same as Fretboard) |
| Per-cell caption | `chords[].note` ("same fret, root str up", "V13 — pinky reaches the 13") |
| Per-row tips (▸ reveal) | `plays[][].tips` |
| "more ways (N)" titles | the remaining `plays['blues-12bar']` entries beyond the visible rows |
| IMPROV footer | `improv.scales[].over/scale`, `improv.targetNotes`, `improv.licks[].tab/description` |
| Style/instrument tabs | `kb/index.js` registry keys + each style's `instruments` keys |

Because a 12-bar has many bars but few distinct chords, the **column reducer** (distinct `degree`+`quality` pairs, order of first appearance) keeps the grid to 3–4 columns even for a 12-bar — exactly what makes "down the voicings" legible. A 4-chord loop (Axis I–V–vi–IV) yields 4 columns; the same component, no special-casing.

---

## 5. Pros / cons / what it sacrifices

**Pros**
- **Most information per screen.** You see the entire loop *and* 3–5 ways to voice each chord at once — the only concept that supports true *comparison* ("shells vs barres vs 9ths") side by side. This is the deepest-study option, the method-book page.
- **Teaches vocabulary, not just the moment.** Reading *down* a column is a voicing lesson; reading *across* a row is the form. Level badges (beginner→advanced grips in one stack) let a player climb difficulty in place.
- **Reuses every KB field with zero waste** — multiple `plays`, `level`, `tips`, `extensions`, `note`, improv — so the agent-authored content is fully surfaced (Stage/Roadmap show a slice; Playbook shows the book).
- **Grid is reflow-friendly:** narrow → one play per row, columns scroll horizontally (the kb-plan §4 "smart fit" fallback) without changing the mental model.

**Cons**
- **Density is the cost.** It is *not* a glance-and-go panel mid-solo — there's a lot on screen, and the moving column-spotlight is the only thing that's instant. A player needs a beat to study it; if they want "just tell me the one chord now," Stage wins.
- **Diagram real-estate pressure.** 3–5 rows × 3–4 columns of SVG diagrams is the heaviest render of the three; cells must shrink on small windows (mitigated by collapse + reflow, but a 13" laptop shows ~3 rows before scroll).
- **Bar-form abstraction.** Collapsing 12 bars to 3 columns is powerful but hides bar-by-bar order *in the grid* — recovered by the top bar-map strip, but that's a second thing to read.

**What it sacrifices:** *immediacy*. The whole design trades instant glanceability for completeness — a deliberate inversion of Stage. It assumes the musician has a moment (a turnaround, a verse they know, a teacher's pause) to look down and *study*, then look up and play. The active-column spotlight is the lifeline that keeps it usable even mid-jam, but the panel's centre of gravity is **learning the loop**, not surviving the next bar.

---

```PREVIEW
┌ JAM GUIDE · Playbook ──────────[Guitar][Jazz‖BLUES‖Rock…]┐
│ Matched: 12-bar · A maj   loop A7→D7→E7   ♻ bar5/12 96BPM │
│ form ┃A7┃A7┃A7┃A7┃D7┃D7▸┃A7┃A7┃E7┃D7┃A7┃E7┃  (amber sweep) │
│ ──────────── I7·A7 ──────── IV7·D7 ◀now ──── V7·E7 ────── │
│ Barre shuffle  ●○●●●● fr5    ×●○●●● fr5     ●○●●●● fr7     │
│ ▸ beginner     E-shape A7    A-shape (glows) E-shape E7   │
│ 9th stabs ▸    ×○♭7●●● fr5   ×○♭7●●● fr5    ×○♭7●●13 V13   │
│ int (Texas)    R-3-♭7-9      "IV9"          horn hook     │
│ Tritone shell  ×○●●×× fr5    ×○●●×× fr5     ×○●●×× fr7     │
│ minimal/comp   R-♭7-3        inner pair −1  Chicago grip  │
│                       ⌄ more ways (2): Jimmy Reed · Stormy │
│ ═════════════════════════════════════════════════════════ │
│ IMPROV  I7→A Mixo · target 3rds C♯→F♯→G♯ · curl ♭3↗3  ♪tap │
│   ▲ columns = loop chords · rows = ways to voice · scan ↕  │
└──────────────────────────────────────────────────────────┘
```
