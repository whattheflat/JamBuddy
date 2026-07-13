# "Try this" — chord-substitution nudge (task D-73)

**Sprint:** `sprint-dashboard-polish` · **Owner:** Muse · **Impl tasks:** L-73 (engine, `theory.js`) + L-74 (UI, new `TryThis.jsx`)

**User ask (2026-07-13, verbatim):** *"imagine we play a simple Am C F then i'd like to have an alternative to that F that would be in the similar style … potentially based on the circle of fifths? i'd like an option that says: 'try this' … i want musicians to learn how they can make the jam more interesting."* Plus the guard-rail: *"we dont have to create something too difficult."*

So this is a **small, curated, learnable nudge** — not a reharmonisation engine. For the chord under the playhead, in the detected key, show 3–4 alternative chords, each with one plain sentence that *teaches why it works*. Tap a suggestion → the existing `ChordDetailModal` to study it.

> **Not** the existing `getChordSubstitutions` (education.js). That returns **context-free, same-root colour swaps** (`maj → maj7, add9, maj6…`) and never looks at the key. The new engine is **key-aware** and, crucially, **changes the root** (relative sub, secondary dominant) with a *why* framed against the live key. They coexist; the modal keeps its colour-swap grid, the dashboard gets the new nudge.

---

## 1. The reading model — which key/mode the engine trusts

**Recommendation: take the app's `effectiveKey` (`lockedKey ?? keyInfo`) as the single reading. Do not compute both readings at once.**

- `effectiveKey` is `{ root, mode, confidence }`. The **mode disambiguates the i-vs-vi ambiguity** that makes `Am C F` read two ways: if the app committed **A minor**, `F` is `♭VI`; if **C major**, `F` is `IV`. The engine frames the *why* against whichever one is live, and gates the moves that need a specific reading (borrowed `iv` needs a major reading — see Rule B).
- The user can already flip the mode in the key dropdown (the app's intended workflow, per project memory — e.g. A minor → A Dorian). When they do, the *why* copy and the applicable moves change with it. That is the honest way to "see the other framing" — one reading on screen at a time, driven by the user's own mode choice.
- **Edge — no key / atonal / low confidence:** `suggestSubstitutions` returns `[]` when `!keyInfo?.root`. `TryThis` then renders a quiet idle line ("Lock a key to see substitutions") — never a fabricated suggestion. This mirrors `RelatedProgressions`/`CircleOfFifths` idle states.

The worked examples in §4 show **both** readings only so the gate can verify the arithmetic under each; at runtime exactly one is shown.

---

## 2. The curated set — 4 categories, ranked softest → boldest

All rules operate on `{ rootPc, quality }` (a pitch class 0–11 + a `CHORD_TYPES` key) — the same shape the KB/JamGuide stations already use — and read `keyInfo {root, mode}`. `keyRootPc = noteIndex(keyInfo.root)` (theory.js's own in-module note-name→pc helper, line 133 — **not** match.js's `chordRootPC`, which would make theory.js import from a module that imports it back = circular). Candidates are returned as `{ rootPc, quality, label, why, category }` where `label = NOTES[rootPc] + CHORD_TYPES[quality].suffix`. **Cap the output at 4**, in the order below (softest first, so the glance reads top-down by boldness).

Notation: pc arithmetic is mod 12. `NOTES = [C,C#,D,D#,E,F,F#,G,G#,A,A#,B]` (C=0 … B=11).

### A. Relative / diatonic-third sub — *the softest, most universal*
Swap a chord for the diatonic chord a third away that **shares two of three tones**.
- **major-family chord** (`maj, maj7, maj6, add9`): candidate = `{ (rootPc + 9) % 12, 'min' }` — the **relative minor** (a minor 3rd below). *Shared tones:* the original root and 3rd become the relative's 3rd and 5th.
- **minor-family chord** (`min, min7, min6`): candidate = `{ (rootPc + 3) % 12, 'maj' }` — the **relative major** (a minor 3rd above).
- **Gate:** emit only if the candidate is **diatonic in `keyInfo`** (`getChordsInKey(root,mode)` contains it). This keeps the swap "safe/soft" and never forces an out-of-key relative. (Non-diatonic relatives are out of MVP scope.)
- **Circle tie-in: yes** — the relative minor/major is the circle's *inner ring* (see `CircleOfFifths.jsx`). The *why* may say so.
- **Why template:** `"{cand} is {orig}'s relative {minor|major} — shares {t1} & {t2}. In this key it's the {rn(cand)}: {softer|brighter} pull, same family."`

### B. Borrowed minor colour — *the "blue"/"Creep" move* (conditional)
Major `IV → iv` (same root, major → minor) — lowers the 6th of the key to the ♭6.
- **Gate (strict, honest):** emit **only** when `keyInfo.mode` is **major-ish** AND the chord is the **IV** (`rootPc === (keyRootPc + 5) % 12`) AND quality is major-family. Under a **minor reading it is suppressed** (in A minor, `F` is a diatonic major `♭VI`; `Fm` would be a chromatic `♭vi` with no honest function — we do not fake it).
- Candidate = `{ rootPc, 'min' }`.
- **Circle tie-in: no** — this is a modal borrowing, not a circle step. The *why* must not claim the circle.
- **Why template:** `"Borrow {cand} (the iv) from the parallel minor — {n6}→{nb6} adds that wistful pull home. The 'Creep' move."` where `nb6 = noteName((keyRootPc + 8) % 12, /*preferFlat*/true)` (the ♭6). **Spell it flat** — this is a flatward modal borrow (A→A♭), never the sharp `NOTES[8]='G#'`. (The *ascending* leading tone in Rule D stays sharp — see §3.)

### C. Extension / colour — *same function, more colour*
Keep the root and function; add one diatonically-honest colour tone.
- Pick the extension whose **added tone is diatonic** in `keyInfo` (prefer, in order): major-family → `maj7` if `(rootPc+11)` diatonic, else `add9` if `(rootPc+2)` diatonic, else `maj6`; minor-family → `min7` if `(rootPc+10)` diatonic, else `add9`; `dom7` → `sus4` (the 9sus-ish suspension). Same root, so `label` = `NOTES[rootPc] + suffix`.
- **Gate:** the chosen added tone must be in `getScale(root,mode)`; if none qualifies, omit category C rather than add a clashing tone.
- **Circle tie-in: no** — vertical colour, not a circle step.
- **Why template:** `"Add the {intervalName} ({addedNote}) — same {rn}, lusher. {addedNote} is the key's own {degreeWord}, so it stays in the family."`

### D. Secondary dominant of the next chord — *the circle move*, boldest (conditional)
Approach the **next loop chord** by its own `V7` — the circle-of-fifths, dominant-direction pull.
- **Gate:** requires `opts.nextRootPc` (the next station's root pc). Candidate = `{ (nextRootPc + 7) % 12, 'dom7' }`. Emit only when a loop/next chord is known and the candidate root ≠ current root.
- **Circle tie-in: yes** — the candidate root is **one wedge clockwise from the next chord** on the circle (its dominant). Its 3rd is the **leading tone** into the next root.
- **Why template:** `"Swap for {cand}, the V7 of {next} — its 3rd ({leadingTone}) leans a half-step into {next}, pulling the loop around. One step clockwise on the circle."`

> **Honest circle summary:** A and D **are** circle relationships (inner ring; dominant step) — name the circle in their copy. B and C are **not** — never claim the circle for them. We do **not** require the D-61 circle widget on the dashboard; the *why* copy carries the lesson.

---

## 3. Worked examples — `Am – C – F`, both readings (gate: recompute me)

Loop wraps `Am → C → F → Am`. Target = **F** = `{ rootPc: 5, quality: 'maj' }`, tones `{F=5, A=9, C=0}`. Next chord after F = **Am** (`nextRootPc = 9`).

### Reading (i) — **A minor** (`i · III · ♭VI`) → 3 subs (borrowed iv suppressed)
`A-minor scale = {9,11,0,2,4,5,7}` = A B C D E F G. `getChordsInKey(A,minor) = [Am, B°, C, Dm, Em, F, G]`.

| # | Cat | Candidate (pc) | label | Diatonic check | WHY copy |
|---|-----|----------------|-------|----------------|----------|
| A | relative | (5+9)=**2**, min | **Dm** | Dm ∈ A-min = `iv` ✓ | "Dm is F's relative minor — shares **F & A**. In A minor it's the **iv**: a darker, more grounded step than the bright ♭VI. (Circle: F's inner-ring relative.)" |
| B | borrowed | — | — | mode = minor → **suppressed** | *(not shown — F is ♭VI here, not IV; Fm would be chromatic. Honest omission.)* |
| C | extension | 5, add 11→**E(4)** | **Fmaj7** | E ∈ A-min (the 5th) ✓ | "Add the major 7th (**E**) — ♭VI becomes Fmaj7, dreamy and floating. E is A minor's own 5th, so it stays in the family." |
| D | 2nd-dom | (9+7)=**4**, dom7 | **E7** | leads to Am | "Swap for **E7**, the V7 of Am — its 3rd (**G♯**) leans a half-step into A, pulling the loop back around. One step clockwise on the circle." |

*Arithmetic:* Dm={2,5,9}∩F{5,9,0}={5,9}=F,A ✓. Fmaj7={5,9,0,4}, all ∈ A-min ✓. E7={4,8,11,2}; G♯=8→A=9 ✓; E is a fifth above A (9+7=4) ✓.

### Reading (ii) — **C major** (`vi · I · IV`) → 4 subs (cap)
`C-major scale = {0,2,4,5,7,9,11}` = C D E F G A B. `getChordsInKey(C,major) = [C, Dm, Em, F, G, Am, B°]`.

| # | Cat | Candidate (pc) | label | Diatonic check | WHY copy |
|---|-----|----------------|-------|----------------|----------|
| A | relative | (5+9)=**2**, min | **Dm** | Dm ∈ C-maj = `ii` ✓ | "Dm is F's relative minor — shares **F & A**. In C it's the **ii**: trades IV's brightness for a softer, more forward pull. (Circle: F's inner-ring relative.)" |
| B | borrowed | 5, **min** | **Fm** | mode major **and** F = IV (0+5=5) ✓ | "Borrow **Fm** (the iv) from C minor — lowering A to **A♭** adds that wistful 'Creep' pull home. The classic blue move." |
| C | extension | 5, add 11→**E(4)** | **Fmaj7** | E ∈ C-maj (the 3rd) ✓ | "Add the major 7th (**E**) — same IV, lusher and static. E is C's own 3rd (the mediant), so it glues the chord to the key." |
| D | 2nd-dom | (9+7)=**4**, dom7 | **E7** | leads to Am | "Swap for **E7**, the V7 of Am — its 3rd (**G♯**) leans into A, pulling the loop around. One step clockwise on the circle." |

*Arithmetic:* Fm={5,8,0}; A(9)→A♭(8) ✓; A♭=8=(0+8)=♭6 of C ✓. Everything else as above.

**Payoff:** the *same* candidate chord (Dm, Fmaj7, E7) is right under both readings — only its role-name and *why* change with the mode. Borrowed `Fm` appears **only** under the major reading. That is the honesty the feature promises.

**Bonus — the same rules over the whole loop** (feeds the smoke truth-table): current **Am**→next C ⇒ D = **G7** (V7/C, B→C); current **C**→next F ⇒ D = **C7** (V7/F, E→F — the classic bluesy `I7→IV`). Both musically gold, both from the one rule.

---

## 4. Which chord gets suggestions — the playhead chord

**Decision: one `TryThis` card that follows the playhead — subs for the *currently sounding* chord, updated as the loop turns.**

- Rejected: one static sub for the whole loop (misses the point — the user asked specifically about *F*), and a per-station sub grid across the rail (too dense, collides with the rail — see §6).
- Target selection: `currentChord` when present → fall back to the committed loop's active/first station when silent → else idle. `opts.nextRootPc` = the following loop station's root (so Rule D can fire); when there is no loop, D is simply omitted.
- Keep it tiny: **≤4 chips, one row.** It is a nudge, not a panel.
- *(Optional nicety, not required):* the UI may drop a candidate that is already a loop chord (e.g. relative of Am = C, which is already in `Am C F`) to avoid a redundant suggestion. Engine stays pure; dedup lives in `TryThis`.

---

## 5. The UI surface — new `TryThis.jsx`, left column

A compact card, visually a sibling of `RelatedProgressions`/`CircleOfFifths` (same micro-header + chip language):

```
Try this instead of F  · in A minor          ← text-[10px] uppercase tracking-widest text-gray-500
[ Dm ]  relative minor — softer, same family  ← chip + one-line why, per row
[ Fmaj7 ] add the maj7 (E) — dreamy, in-key
[ E7 ]  V7 of Am — pulls the loop around ↻
```

- **Chip = tappable** → `onChordClick(label)` = App's `setSelectedChord` → `ChordDetailModal` (the established tap target; reuse verbatim). Each chip is a `<button>`, keyboard-reachable, `focus-visible:ring-2 focus-visible:ring-accent`.
- **Layout:** chip on the left (bold, `text-gray-100`), *why* to the right (`text-[11px] text-gray-400`), category label optional as a faint tag. `Category D` gets a small `↻` glyph hinting the circle (no widget dependency).
- **Tokens only** (`tailwind.config.js`): `bg-panel`, `border-border`, `text-accent`, `text-gray-100/400/500`, `hover:border-accent/50 hover:text-accent`. **No new colour** — nothing to flag to Maestro. Accent-on-panel meets AA (same usage cleared in D-61).
- **Mount — App.jsx only (file-disjoint from the rail/licks/related chains):** compose `TryThis` **above** `RelatedProgressions` inside App's existing `relatedSlot` prop:

  ```jsx
  relatedSlot={
    <div className="flex flex-col gap-3">
      <TryThis
        chord={currentChord}          {/* App parses to {rootPc,quality} */}
        nextRootPc={/* next station root of the committed loop, or undefined */}
        keyInfo={effectiveKey}
        onChordClick={setSelectedChord}
      />
      <RelatedProgressions loop={detectedProgression} keyInfo={effectiveKey} onChordClick={setSelectedChord} />
    </div>
  }
  ```

  This edits **App.jsx only** (mount) + the new file — it does **not** touch `JamGuide.jsx` (locked by L-71), `GlanceRail/VoicingBrowser/index.css` (L-70), or `RelatedProgressions.jsx` (L-72). The left column already reflows to one-per-row narrow (JamGuide `order-4` wrapper); `TryThis` inherits that. Glanceable in the ≤4-chip footprint at 1280×900 and stacks cleanly narrow.

---

## 6. Circle-of-fifths tie-in — honest

- **Rule A (relative)** and **Rule D (secondary dominant)** ARE circle relationships — the inner ring and the clockwise/dominant step respectively (both visible in `CircleOfFifths.jsx`). Their *why* copy names the circle.
- **Rule B (borrowed iv)** and **Rule C (extension)** are **not** circle-adjacent — modal/vertical colour. Their copy must **never** invoke the circle.
- We **do not** require the D-61 circle widget on the dashboard (it lives in the Knowledge Center). The lesson travels entirely in the one-line *why*. Optional future polish: a tiny `↻` affordance on circle-derived chips.

---

## 7. Impl scopes (bounded)

### L-73 — engine (`src/lib/theory.js`, additive; `scripts/smoke.mjs`)
- Add `export function suggestSubstitutions({ rootPc, quality }, keyInfo, opts = {})` → `[{ rootPc, quality, label, why, category }]`, categories in order `relative, borrowed, extension, secondary_dominant`, capped at 4, `[]` when `!keyInfo?.root`. Reuse `NOTES`, `NOTES_FLAT`, `noteName`, `noteIndex`, `CHORD_TYPES`, `getChordsInKey`, `getScale`, `getChordTones`, `intervalName`, `toRomanNumeral` — all **in-module** to theory.js (do **not** import `chordRootPC` from match.js — circular). **Never re-derive** intervals or diatonic sets. `opts.nextRootPc` gates Rule D.
- **Smoke truth-table** in `smoke.mjs` (sabotage-proven, like the `resolveDegree` guard): pin the §3 tables — `F/maj` in **A minor** → `[Dm, Fmaj7, E7]` (no Fm); in **C major** → `[Dm, Fm, Fmaj7, E7]`; plus `Am/min`→next C ⇒ D=`G7`, `C/maj`→next F ⇒ D=`C7`; and a no-key case → `[]`. Flip one rule constant → smoke must go red.
- **⚠ Sequencing flag for Maestro:** L-73 and **L-72 both lock `scripts/smoke.mjs`** — they cannot be claimed concurrently. Serialize them (L-73 appends a new smoke section to minimise merge friction). `theory.js` is the shared Professor+Luthier file → single-task lock + Critic + non-owning-domain review, per PROTOCOL §3.

### L-74 — UI (`src/components/TryThis.jsx` new; `src/App.jsx` mount)
- Pure/presentational component consuming `suggestSubstitutions`; props `{ chord, nextRootPc?, keyInfo, onChordClick }`; renders header + ≤4 chip/why rows; tap → `onChordClick`. Idle line when the engine returns `[]`.
- Mount per §5 (App composes it into `relatedSlot` above `RelatedProgressions`). **Files disjoint** from L-70/L-71/L-72; App.jsx is unlocked by all three. Audio contract untouched (mount/UI-state only — the App.jsx grep gate applies).

---

## 8. Rejected alternatives (≥2)

1. **Full reharmonisation engine** (chord-scale subs, ii–V insertion, Coltrane changes, tritone-on-everything). **Rejected** per the user's explicit *"we dont have to create something too difficult"* + "not a reharm engine." Un-glanceable mid-jam and un-learnable. The curated 4-move set is the whole point.
2. **Blanket tritone sub** (`root+6` dom7 on every chord). **Rejected as a general rule:** the tritone sub is only functionally honest on a *dominant resolving down a fifth*; on a static major IV like `F` it yields `B7` — jarring, no diatonic footing, no *why* that teaches. The **secondary-dominant** move (Rule D) captures the same circle-of-fifths energy but is functionally grounded in the *actual next chord*. (Tritone could return later as a dom7-only opt-in.)
3. **Per-station subs plastered across the voicings rail.** **Rejected:** clutters the glance-critical rail (owned by L-70), 3–4 chips × N stations is too dense, and it competes with the voicings the user is reading to *play*. One playhead-following card is the nudge.
4. **Show both key readings at once.** **Rejected:** doubles the surface, contradicts "keep it small," and the app already commits to one `effectiveKey` (the mode disambiguates). The user flips the mode dropdown to see the other framing — one reading on screen at a time.
</content>
</invoke>
