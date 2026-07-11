# Jam Roulette — design spec (task D-62)

> **Thesis:** one button, two clicks, a jam. "Jam roulette" in the controls bar
> opens a genre menu (the 10 KB styles + Surprise me); picking one instantly
> rolls a random key + an interesting KB progression and **seeds the exact
> state live detection already writes** — `lockedKey`, `detectedProgression`,
> and a committed-shape `progressionVoteRef` — so the loop strip, the voicing
> rail, the licks strip, and the related-progressions card all populate
> **exactly as if the loop had been detected**. Musicians read the screen and
> start playing; the L-31 commit layer then treats the seed like any committed
> loop: agreeing detections confirm it, a genuinely different loop replaces it
> after `REPLACE_VOTES`, and New Song clears it. **No new parallel state** —
> the seed is a writer into the existing machine, not a second machine.
>
> User ask (verbatim, sprint goal 2026-07-11): *"one button that would be a
> random chord progression selection. a button up top 'jam roulette' and then
> select a genre (like we have jazz, blues rock etc) and then have a random key
> chosen and an interesting progression show up as a loop in the screen. it
> would fill in the loop section and a 4 bar progression or something so that
> everyone can see the key and the chords to be played with different voicing
> so they can start playing… then musicians can start playing and it continues
> from it"*

**Dependency note:** L-60 is dep-blocked on **C-50** (one-screen close-out).
This spec is written against `docs/design/one-screen.md`'s **target** layout
(controls bar per §1.1, slim loop strip per §1.2, the two-column dashboard),
which L-50 is building concurrently. Everything here that names the controls
bar or the strip means the *post-L-50* versions; the seed mechanism (§3) is
layout-independent and verified against App.jsx as it stands today (~b753b58).

Standing principles honoured: reuse, don't duplicate; nothing shown twice;
scroll > click; tokens only, no raw hex; the 🚨 App.jsx audio contract
(callbacks / ref-sync / AudioCapture untouched).

---

## 1. UX flow

### 1.1 The button

- **Where:** right end of the controls bar, in the global-chrome cluster next
  to one-screen §1.1's `⛶ Jam view` toggle ("a button up top" — the controls
  bar is the app's persistent top chrome; the header row stays reserved for
  Settings / New Song / Start).
- **What:** `🎲 Jam roulette` — same button language as the existing controls:
  `px-3 py-1 rounded-lg border border-border text-sm text-gray-200
  hover:border-gray-500 focus-visible:ring-2 focus-visible:ring-accent
  transition-colors`. While a seed is active (unconfirmed, §1.3) the button
  carries the seeded accent: `border-accent/40 text-accent bg-accent/10` +
  `aria-pressed="true"` — same active treatment as the locked-key pill.
- **Keyboard:** real `<button>`, Tab-reachable, Enter/Space opens the menu.

### 1.2 The genre menu

Click → an anchored popover (not a page takeover; the jam never leaves the
screen): `absolute` panel under the button, `bg-panel border border-border
rounded-xl shadow-lg p-1 z-20`, one column of `<button>` rows
(`w-full text-left px-3 py-1.5 rounded-lg text-sm text-gray-200
hover:bg-accent/10 focus-visible:ring-2 focus-visible:ring-accent`):

1. **`✨ Surprise me`** — first row, divider under it (`border-b border-border`)
   — uniform pick over the 10 styles, then §2 as normal.
2. **The 10 KB styles**, straight from the registry:
   `Object.entries(kb).map(([id, s]) => s.meta.label)` — never a hard-coded
   list; an 11th style appears here for free.
3. When a seed is active, row 0 becomes **`⟳ Re-roll — {styleLabel}`** (same
   style, fresh key + progression, honouring §2's no-repeat memory) and
   `✨ Surprise me` moves to row 1.

Escape / click-outside / picking a row closes it. Focus returns to the button.
Picking a genre seeds **instantly** — two clicks from cold to a full jam
dashboard. No confirmation step: re-rolling is cheaper than confirming.

### 1.3 The seeded indicator — honest provenance

The dashboard must not pretend the roulette loop was *heard*. Until live
detection confirms it, the slim loop strip's loop row swaps its chrome:

- The `♻` glyph becomes `🎲`; the `→ loop` tail becomes an amber provenance
  chip: **`rolled · {styleLabel} · {progression.name} · {Σbars} bars — play
  it!`** (`text-amber-400 text-xs` — amber is the app's established secondary
  accent, the rn colour; no new token). Σbars comes from the KB `bars` array —
  this is where "a 4 bar progression" is made visible.
- The loop chips themselves render **identically** to a detected loop (same
  chip anatomy, chord + rn) — the chords are real instructions, only the
  *provenance* differs.
- The moment the commit layer confirms the seed (§3.4 — first agreeing live
  detection), the indicator flips to the normal `♻ … → loop` with no other
  visual change: the honest signal that "the band is now playing what was
  rolled". If a *different* loop replaces the seed, the indicator vanishes
  with the seed (the new loop is detection-owned).

Empty-state note: pre-first-note the history slot still shows "Start
listening…" — correct and honest (nothing has been heard); the key chip shows
the rolled key immediately (it's a real `lockedKey`, rendered with the 🔒 pill
in the controls bar too, mode dropdown and unlock included — the rolled key is
a first-class key lock, not a special display).

### 1.4 Flow summary

Cold start: **🎲 → genre → the dashboard fills** (key chip + locked-key pill,
loop chips with rn, voicing rail with every station's shapes/voicings, licks
strip aimed at station 0, related progressions) → band reads, plays → playhead
lights on the first committed loop chord → detection confirms after ~2 cycles
→ 🎲 indicator becomes ♻ → the jam continues under pure live detection.
Mid-session: 🎲 acts as **New Song + seed** (§3.6) — one gesture, clean slate,
new card.

---

## 2. Randomization rules

All randomness lives in the seed function (plain `Math.random()`; no audio
contact). Inputs: the KB registry only.

### 2.1 Key

- **Root:** uniform over the 12 pitch classes, spelled from **`NOTES` (sharp
  spellings)** — mandatory, not stylistic: `matchChordFromChroma` names every
  committed chord via `noteName(r)` with `preferFlat=false` (theory.js:112,
  445 — the live naming path), so only sharp spellings string-match detection
  later (§3.3).
- **Mode:** taken directly from the rolled progression's `mode` field —
  verified: **every KB progression encodes `mode`**, vocabulary
  `major | minor | dorian | mixolydian` (grep across all 10
  `progressions.js`), all four already present in the key-lock mode dropdown
  and `SCALES`. No inference, no default needed.
- **Confidence:** `1` (the `applyLock` convention).
- Session memory: don't repeat the previous roll's root (re-draw once).

### 2.2 Progression pool ("interesting" AND seedable)

Per style, from `kb[style].progressions`, each entry realized + collapsed per
§3.2 first. **Pool membership = the hard bounds ∩ the round-trip invariant**
— a progression only rolls if the machine can genuinely confirm it:

- **Hard length bounds: collapsed length must be 2–8.**
  - `< 2` — unrepresentable as a detected loop (`detectRepeatingProgression`
    min pattern length 2). Today this excludes **nothing**: even
    `funk-one-chord` collapses to **two** names (`X7, Xsus4` — its
    `['dom7','dom7','sus4','dom7']` qualities survive collapse because a
    quality change on the same root is a different name; wrap-dedupe then
    drops the trailing `X7`). The rule stays as future-proofing for a true
    single-name vamp, and the code comment must say so honestly.
  - `> 8` — the detector's candidate loop only sweeps lengths **2–8**
    (theory.js:627). A longer seed is not merely unconfirmable: as the band
    plays it, in-window *fragments* of it become the only detectable
    structure and **replace the seed after `REPLACE_VOTES` = 3** — the card
    self-destructs into a sub-loop. Excludes today: `jazz-blues` (collapsed
    10), `blues-quickchange` (9), `bossa-blue` (10).
- **Round-trip invariant (the real gate) — the protocol is load-bearing:**
  *a progression passes iff, with the 32-commit window filled with
  repetitions of its seeded canonical form (steady state) and truncated at
  **every** partial-cycle offset (0…len−1 commits past a cycle boundary),
  the real `detectRepeatingProgression` returns exactly that form at **all**
  offsets.* Steady-state-plus-all-offsets is the honest protocol because a
  jam is sampled mid-cycle, not at cycle boundaries — and a naive "feed 2
  clean cycles" protocol gets *both* failure modes wrong: it spuriously
  fails all 8 two-name vamps (2 cycles × 2 names = 4 commits, under
  theory.js:609's history ≥ 6 gate — a ramp artifact, not a steady-state
  failure), and it *passes* `blues-8bar`, whose 7-name form actually fails
  at exactly **1 of its 7 phase offsets** (4 cycles + 4 extra commits → the
  detector prefers the `[C7, G7]` alternation). Round-trip is *empirical,
  not constructional* — the detector's recency×occurrence scoring can prefer
  an internal alternation over the full form at some phase. The invariant is
  **precomputed over the whole registry** (lazy module-level memo on first
  roulette open — key-independent per §3.3.3, so one sweep in C covers all
  keys; an 11th style or new progression joins the pool automatically) and
  **pinned by the L-60 commit-1 smoke sweep** (same protocol verbatim —
  §3.4 flag 2).
- **Honest numbers today (Critic gate ran the real matcher + detector under
  the protocol above):** **4/56 fail** — the 3 over-length forms plus
  `blues-8bar`'s phase-offset failure — so the **expected pool is 52/56**,
  pinned exactly by the smoke sweep. (Pre-fix-(a), 10/56 additionally
  returned NO MATCH for their own collapsed form and `country-145` matched a
  different progression — §3.3.1; all return to the pool with the fix, since
  matching post-fix is constructional, §3.3.4.)
- **Weight = levelW × lenW** (over pool members only):
  - `levelW`: `level === 'intermediate'` → **2**; foundation/untagged → **1**
    (the D-20 rule: untagged counts foundation). "Interesting" = intermediate
    leans in, foundations still roll.
  - `lenW`: collapsed length **3–7 → 2** (the "4-bar-ish" sweet spot — note
    a collapsed 12-bar blues is 7 names, so the genre's staple stays strong);
    **2 and 8 → 1**.
- **No-repeat memory:** `rouletteMemoryRef` (plain `useRef([])` in App —
  UI-state ref, never read by audio code) keeps the last **6** rolled
  progression ids; they're excluded from the pool. If exclusion leaves the
  pool empty (small styles — several have 5 entries), fall back to excluding
  only the immediately previous id. The ref survives New Song deliberately
  (variety across songs is the point) and dies with the session.
- Weighted draw; push id to memory.

---

## 3. The seed mechanism — spec'd against the real App state

### 3.1 What the seed writes (exhaustive)

`rollJam(styleId)` — a plain function in App.jsx, sibling of
`quickLock`/`newSong`:

```
1. newSong()                                 // §3.6 — the clean-slate rule
2. const info = { root: NOTES[rolledPc], mode: prog.mode, confidence: 1 }
   setLockedKey(info)
   effectiveKeyRef.current = info            // the quickLock precedent —
   chordVotesRef.current = []                // detection uses the key NOW
3. const loop = seedableLoop(prog, rolledPc) // §3.2 — realize→collapse→canonicalize
4. setDetectedProgression(loop)
5. progressionVoteRef.current = {
     committedKey: loop.join(','),           // the committed shape, L-31's own
     candidateKey: null,
     candidateCount: 0,
     seeded: true,                           // §3.4 — the one flag L-60 adds
   }
   progressionMissRef.current = 0            // (newSong already did; explicit)
6. setSeedInfo({ styleLabel, name, bars })   // §3.5 — display provenance
7. rouletteMemoryRef bookkeeping (§2.2)
```

Nothing else. **Never touched:** `handleNote` / `handleChroma` / `handleOnset`
/ `handleWaveform`, AudioCapture and its props, `noteHistoryRef`,
`keyVotesRef`, `chromaRingRef`, the loop engine. The seed is display state +
the two progression refs the L-31 effect already owns — exactly the audio
contract boundary the L-60 ledger row grep-gates.

Synergy worth stating: `handleChroma` bails while `effectiveKeyRef.current` is
null — a cold session normally can't commit chords until key detection locks.
The seed provides the key up front, so **the very first chroma frames can
commit chords**, and the diatonic bonus in `matchChordFromChroma` is already
biased toward the rolled key. The roulette makes detection *faster*, not
just decorated.

### 3.2 Realizing the loop — `seedableLoop(progression, keyRootPc)`

The chord names must be **byte-identical** to what detection would commit when
the band plays the progression, or the commit layer treats the seed as a rival
forever. Three steps, each forced by a verified code path:

1. **Realize** (the JamGuide `stationVoicings` formula, JamGuide.jsx:262-273):
   per station `rootPc = (keyRootPc + degrees[i]) % 12`,
   `name = NOTES[rootPc] + (CHORD_TYPES[qualities[i]]?.suffix ?? '')`.
   Sharp spellings only (§2.1).
2. **Collapse consecutive duplicate names**, then if `first === last` drop the
   last — mirrors `detectRepeatingProgression`'s collapse of back-to-back
   commits (theory.js:611-615) *plus* the cyclic wrap (in the live stream the
   loop's tail flows into its head; `setChordHistory` also dedupes
   consecutive identical commits, App.jsx:363). E.g. `blues-12bar` degrees
   `[0,0,0,0,5,5,0,0,7,5,0,7]` → 7 names `[I,IV,I,V,IV,I,V]` realized;
   `funk-one-chord` keeps its quality changes (same root, different suffix ≠
   duplicate → `[X7, Xsus4]`). Name-collapse is provably **key-independent**
   (§3.3.3) — the collapsed *shape* is a property of the progression, which
   is what makes fix (a) (§3.3.2) computable once, key-free.
3. **Canonicalize rotation** with **theory.js's own rule** — lexicographically
   smallest rotation compared via `join('\0')` (`canonicalize`,
   theory.js:579-586, currently private). `detectRepeatingProgression`
   returns *its* canonical rotation; the agreement branch compares exact
   `join(',')` strings, so the seed must store the same rotation or
   confirmation is unreachable (§3.4 flag 2).

**Where it lives:** `seedableLoop` exported from **`src/lib/match.js`**
(loop-identity is that file's mandate; it already imports theory.js
read-only; L-51 is adding adjacent exports there and L-60 runs after C-50, so
no lock overlap). For step 3 it needs `canonicalize`: **preferred — additive
`export` keyword on theory.js's `canonicalize`** (one-word diff; shared-file
lock, flag to Maestro at L-60 promotion; smoke's `loop-fixtures.mjs` already
byte-checks a replica of this function, so a second in-app replica would
triple the drift surface). Fallback if Maestro won't open theory.js: replica
in match.js with a drift comment + smoke guard, the loop-fixtures precedent.

Display note: the banner shows the seeded loop in this canonical rotation —
**identical to how any live-detected loop displays today**; the JamGuide rail
re-rotates to canonical KB order via `match.rotation` regardless, so the
learning surface always reads in textbook order (ii first in a ii–V–I).

### 3.3 Matching + round-trip — constructional after fix (a)

#### 3.3.1 The bug fix (a) exists for (Critic gate, real matcher run)

`buildLoopIndex` (match.js:126-141) indexes each progression's **raw,
uncollapsed** `degrees` — but the seeded loop (and the *live* commit stream,
which dedupes back-to-back chords) is the **collapsed** form, a different
sequence length whenever a progression repeats a chord across adjacent slots
or across the wrap. The gate ran the real matcher: **10/56 progressions
return NO MATCH for their own collapsed form** — `jazz-blues`, `blues-12bar`,
`blues-quickchange`, `blues-8bar`, `blues-minor`, `bossa-blue`,
`funk-one-chord`, `country-folk-axis`, `gospel-iv-passing-dim`,
`gospel-tonicized-amen` — and `country-145` is worse: its raw 8-shape matches
a *different* progression. Rolling blues would produce a populated banner and
an **empty JamGuide**. This is also a **pre-existing live-detection bug** the
roulette work surfaces: a band playing a real 12-bar blues today commits the
collapsed stream and gets an empty JamGuide — fix (a) repairs both at once.

#### 3.3.2 Fix (a) — collapsed-form indexing (Maestro-directed, mandatory)

`buildLoopIndex` **additionally** indexes each progression's collapsed form:

- **Collapse rule (key-free):** dedupe adjacent stations whose
  `(degree, suffix)` pairs are equal, where
  `suffix = CHORD_TYPES[quality]?.suffix ?? ''` (compare *suffixes*, not raw
  quality tokens — two out-of-vocab qualities both fall back to `''` and
  produce equal names, so a token comparison would under-collapse); then
  **wrap-dedupe**: if the last pair equals the first, drop the last (one
  check suffices post-collapse — only the boundary pair can merge).
- **What's indexed:** `canonicalDegrees(collapsedDegrees)` → an entry whose
  `progression` is the **collapsed projection** of the authored one:
  `{ ...progression, degrees, qualities, rn (first-of-run), bars (summed per
  run), sourceIndex }` where `sourceIndex[i]` = the first raw station index
  of collapsed station `i`. Same `id`/`name`/`level`/`mode`/`songs`/`tip`.
- **Only when it differs:** entries are added only where the collapsed shape
  ≠ the raw shape — **45/56 index once, 11 twice**. The full census (gate,
  raw → collapsed): `jazz-blues` 12→10, `blues-12bar` 12→7,
  `blues-quickchange` 12→9, `blues-8bar` 8→7, `blues-minor` 12→5,
  `bossa-blue` 16→10, `funk-one-chord` 4→2, `country-145` 8→4,
  `country-folk-axis` 8→7, `gospel-iv-passing-dim` 4→3,
  `gospel-tonicized-amen` 5→4.
- **The true compatibility invariant (stated exactly):** collapsed entries
  are **appended after all raw entries**, so `matchLoopToProgression`'s
  strict-`>` disambiguation keeps every previously-matching input's winner
  **on ties** — but append order never engages on a strict score win, and
  one real case exists: for input shape `[0,5,0,7]` with
  `maj/maj/maj/dom7` qualities (e.g. `[C, F, C, G7]`), `country-145`'s
  collapsed form scores 4×100−4 and **strictly beats** the incumbent
  `country-bluegrass-cycle` (3×100−4 — its quality set lacks `dom7`).
  Gate-verified registry-wide (raw + collapsed × 3 keys): this is the
  **only** winner change, and it is an **improvement** — the progression
  actually being played now self-attributes (pure-triad `[C,F,C,G]` input
  still ties and keeps `bluegrass-cycle`). So: **behaviour-preserving except
  where a collapsed entry strictly dominates the disambiguation score,
  enumerated: `country-145`, desired direction.** Previously-`NO_MATCH`
  collapsed streams now match; that is the point.
- **Rotation:** for a collapsed-form hit, `rotationToCanonicalOrder` runs
  against the *collapsed* degrees — equal lengths by construction. (Today's
  length-mismatch guard, match.js:208, silently returns 0, which is exactly
  what would break the playhead if the raw progression were returned
  instead.)

Downstream, JamGuide renders the projection's stations naturally — a 12-bar
renders **7 stations, one per distinct change** (the right glance-rail
answer: duplicate consecutive bars add no voicing information; the strip's
loop chips carry position). The one alignment consumers need: **every
authored-play lookup must remap through `sourceIndex`** — otherwise a
collapsed match reads the first N raw play entries against the wrong
stations. There are **four** raw-indexed lookups, not two:

- **guitar** shape path, JamGuide.jsx:280, and **piano** recipe path, :288 —
  both inside the `stationVoicings` memo: `play.chords[prog.sourceIndex?.[i]
  ?? i]`;
- **bass**, inside `BassGuideRows`: `play?.chords?.[i]?.pattern` (:530) and
  `…?.note` (:533). Mechanism chosen: the `stationVoicings` memo attaches a
  per-station **`sourceIndex` field** (`stations[i].sourceIndex =
  prog.sourceIndex?.[i] ?? i`), and the two bass lines read
  `play?.chords?.[st.sourceIndex ?? i]` — BassGuideRows already receives the
  stations, so **no new prop**; the heard-live path's synthetic station has
  no `sourceIndex` and the `?? i` fallback keeps it exact.

Blues ships guitar, piano *and* bass cells, and its bass pack covers **four
collapse-affected progressions** (`blues-12bar`/`quickchange`/`8bar`/
`minor`), two of them pool members (`blues-12bar` 7, `blues-minor` 5) — so
the bass remap is load-bearing for the roulette itself, not just for live
detection. Four bounded lines + the one field attachment; JamGuide.jsx joins
L-60's lock (§5).

#### 3.3.3 Key-independence proof (why the index can be built key-free)

Realized names are `Nᵢ = NOTES[(k + dᵢ) mod 12] + suffix(qᵢ)` for key root
`k`. Adjacent names are equal ⇔ their roots are equal AND their suffixes are
equal. Roots: `(k + dᵢ) ≡ (k + dⱼ) (mod 12) ⇔ dᵢ ≡ dⱼ (mod 12)` — `k`
cancels, and KB degrees live in 0–11, so this is plain `dᵢ = dⱼ`. Suffixes:
the 14 `CHORD_TYPES` suffixes are pairwise distinct (verified by inspection,
theory.js:41-55), so equal suffixes ⇔ the same suffix class — identical
quality for in-vocab tokens, the shared `''` fallback for out-of-vocab ones
(hence §3.3.2 compares suffixes). Therefore **name-collapse ≡
(degree, suffix)-pair collapse in every key**: `buildLoopIndex` computes the
collapsed shape once with no key in hand, and `seedableLoop`'s per-key name
collapse always produces that same shape. The same argument makes the §2.2
**round-trip invariant key-independent**: the detector consumes only the name
stream's *equality structure*, which is key-invariant; the lexicographic
rotation choice may differ per key, but seed and detector canonicalize
identically over identical names, so agreement of the two outputs is
preserved — one sweep in C covers all 12 keys.

#### 3.3.4 What is constructional vs what stays empirical

- **Matching is constructional post-fix-(a):** every rolled loop *is* some
  progression's collapsed canonical shape, and fix (a) indexes exactly those
  — `matchLoopToProgression` cannot miss. (It may attribute to a same-shape
  sibling — the §4 quirk, now including within-style cases like
  `country-145`-collapsed ≡ `country-bluegrass-cycle`.)
- **Detector round-trip stays empirical** — hence §2.2's precomputed
  registry-wide invariant (steady-state window, all partial-cycle offsets)
  as the pool gate: today 4/56 fail — 3 over-length + `blues-8bar`'s
  1-of-7-offsets self-competition; expected pool **52/56**, pinned by smoke.
  Worked example of a passer: rolled `jazz-251-major` in A → seeded
  `[Bm7, E7, Amaj7]` (canonical rotation) → band plays it → detection
  commits the same sharp names from the same `CHORD_TYPES` suffixes → after
  2 cycles (6 commits, clearing the history ≥ 6 gate) the detector returns
  the identical canonical form at every subsequent commit, whatever the
  phase → agreement branch fires. ✓

#### 3.3.5 Honest limit — qualities detection can't name

`MATCH_CHORD_TYPES` (theory.js:59-61) is a *subset* — KB qualities `dim7` and
`min6` (7 progression slots across the KB, counted) can never be committed by
detection under those exact names (it will hear `dim` / `m7`-ish). For such
rolls the seed displays the authored chord, and once the band plays,
detection consistently returns the *as-heard* loop → the `REPLACE_VOTES`
branch swaps in reality after 3 commits. That is the machine working as
designed — the card yields to what's actually played, and the re-match still
lands on the same KB progression (degree shape unchanged, quality is only a
tie-breaker). Same story if the band plays triads where the KB says sevenths.
Not a bug; documented behaviour.

### 3.4 The L-31 commit-layer interplay — branch by branch

The effect (App.jsx:181-213) runs once per chord commit (`[chordHistory]`
deps — seeding itself triggers exactly one run via `newSong`'s
`setChordHistory([])`, landing in the null branch at miss 1). With a seeded
vote `{committedKey: S, candidateKey: null, candidateCount: 0, seeded: true}`:

| Branch | Seeded behaviour | Verdict |
|---|---|---|
| **Agreement** (`vote.committedKey === key`) | Refreshes the loop, drops rivals — **L-60 adds:** `vote.seeded = false` + `setSeedInfo(null)`. The seed is now a normal committed loop; every subsequent rule applies verbatim | works, 2-line addition |
| **Rival counting** (`candidateKey` bookkeeping) | A transient sub-cycle detection during ramp-up (real: a 7-name collapsed 12-bar contains `[I,IV]` twice before the full form recurs) starts a candidate; `committedKey` survives the rebuild — **but the rebuild literal at line 207 drops `seeded`** | 🚩 **flag 3 below** |
| **Replacement** (`candidateCount ≥ REPLACE_VOTES=3`) | A genuinely different, consistently-detected loop replaces the seed; new vote is detection-owned (no `seeded`) — **L-60 adds** `setSeedInfo(null)` here | correct as-is: rolled cards must yield to a real band playing something else |
| **Null branch / miss counter** (`NULL_CLEAR=6`) | **Kills EVERY seed during ramp-up — no length survives.** L-31's "fills never null" reasoning assumed the loop is *in the history window* — a seeded loop isn't yet. Exact timeline: the seed's own effect run (via `newSong`'s history reset) is **miss 1**; commits 1–5 take the counter to 6 → **the card is wiped at commit 5**. But the earliest *any* detection can land is **commit 6** — `detectRepeatingProgression` hard-gates raw history `< 6` (theory.js:609), so even a 2-name loop cannot confirm before then, and a loop of length *len* needs ~2·len commits besides. **Unguarded, every seed dies exactly one commit before the earliest possible confirmation** — the guard is mandatory for every pool member, not a long-loop nicety | 🚩 **flag 1 — the critical fix** |

**Flags for L-60 (each a 1-line change inside the effect — the one licensed
edit in that block):**

1. **Null-clear guard:** `if (progressionMissRef.current >= NULL_CLEAR &&
   !progressionVoteRef.current?.seeded) { …clear… }`. Semantics: *a seeded
   card is an instruction, not an observation — it stays until confirmed
   (then normal rules resume), replaced by a consistently-detected different
   loop, re-rolled, or New Song.* A band that noodles structurelessly under a
   seeded card keeps the card — intended: it's what they were asked to play.
2. **Rotation equality is constructional** (§3.2/§3.3) — no branch change,
   but if `seedableLoop` skipped canonicalization the agreement branch would
   be unreachable and the seed would churn-replace with itself (rotated) at
   commit 3. L-60's smoke-visible invariant is §2.2's registry-wide sweep,
   **protocol verbatim:** *for each of the 56 progressions, fill the
   32-commit window with repetitions of the seeded canonical form (steady
   state) and truncate at every partial-cycle offset (0…len−1 commits past a
   cycle boundary); the progression passes only if
   `detectRepeatingProgression` returns exactly the seeded canonical form at
   ALL offsets.* Expected: 52 passers pinned; the 4 named failures
   (`jazz-blues`, `blues-quickchange`, `bossa-blue`, `blues-8bar`) asserted
   as excluded from the pool. (A naive 2-clean-cycles feed is wrong in both
   directions — §2.2.)
3. **Preserve `seeded` across candidate rebuilds:** line 207 becomes
   `{ committedKey, candidateKey: key, candidateCount: 1,
   seeded: vote?.seeded ?? false }` — otherwise one transient ghost
   sub-cycle strips the flag and flag 1's guard dies with it, resurrecting
   the ramp-up kill through the side door.

Nothing else in the effect treats a seed differently — `COMMIT_VOTES` never
applies (a committed key exists), and `progressionMissRef.current = 0` on any
detection keeps the counter honest once structure appears.

### 3.5 The provenance flag — machine truth vs display echo

Two readers need "seeded, unconfirmed": the effect (guard, flag 1) and the
banner/button (indicator, §1.3). The effect reads `vote.seeded` — its own ref,
already in hand, mutation-safe. The **display** cannot read a ref reactively,
so App gains one small UI-state:
`const [seedInfo, setSeedInfo] = useState(null)` —
`{ styleLabel, name, bars } | null`, passed to ProgressionBanner as a
presentational prop (and read by the roulette button for its active state +
re-roll row). This is **provenance metadata that exists nowhere else** (style
label, progression name, bar count) — not a duplicate of
`detectedProgression`. Invariant, enforced at every transition: `seedInfo !==
null ⇔ progressionVoteRef.current?.seeded === true`. Sync points: set
together in `rollJam`; cleared together in the agreement branch, the
replacement branch, and `newSong` (one added line — `setSeedInfo(null)`).

### 3.6 New Song & mid-session rolls

`newSong()` (App.jsx:216-241) already clears the whole seed surface:
`progressionVoteRef.current = null`, `progressionMissRef.current = 0`,
`setDetectedProgression(null)`, `setLockedKey(null)`,
`setChordHistory([])` — verified line by line; L-60 adds only
`setSeedInfo(null)`. **The seed clears naturally.** ✓

**Mid-session rule: roulette = New Song + seed** (`rollJam` step 1). Without
it, a 32-commit history still containing the *old* loop keeps re-detecting it
and would replace the fresh seed within 3 commits even after the band
switches — the stale window poisons the handoff. `newSong()` is the
already-tested full reset (history, votes, key, BPM); seeding onto that clean
slate makes ramp-up §3.4's only story. The banner history emptying is honest
("new song" is literally what the button did), and the loop-station audio is
untouched (`newSong` never touched it).

---

## 4. What fills in — every consumer, verified

The seed sets `lockedKey` (→ `effectiveKey`) + `detectedProgression` (+ the
vote ref). Consumers and their honest pre-first-note state (`chordHistory`
empty, `currentChord` undefined):

| Surface | Consumes | Seeded behaviour |
|---|---|---|
| Slim loop strip — key chip | `keyInfo` (= effectiveKey) | Rolled key + mode render immediately |
| Slim loop strip — loop chips | `detectedProgression`, `findLoopPosition(chordHistory, loop)` | All chips render (chord + rn via the rolled key). `findLoopPosition` **returns −1 on empty history** (match.js:75 guard) → **no chip highlighted** — correct: nobody is anywhere yet. 🎲 indicator per §1.3 |
| Strip — history row | `chordHistory` | "Start listening…" — honest |
| JamGuide match | `matchLoopToProgression(loop, kbIndex)` | **Matched by construction — after §3.3.2's fix (a)** (mandatory L-60 scope): the seeded loop is the progression's collapsed canonical shape, which fix (a) indexes. *Without* the fix, 10/56 rolls (all of blues among them) would show a populated banner and an **empty JamGuide** — and the same fix repairs today's live-detection miss for real 12-bar streams. Header shows the progression name + "in {key}" |
| Voicing rail (GlanceRail / BassGuideRows) | `stationVoicings` (match + keyRoot), `activeIndex = canonicalPos` | Every station's shapes/voicings render in canonical KB order — for collapse-affected matches, the **collapsed projection's** stations (a 12-bar renders 7, one per distinct change) with plays remapped via `sourceIndex` (§3.3.2). `canonicalPos` guard (JamGuide.jsx:220-225) → **−1** → **no "now" row** — the rail shows the whole map unhighlighted |
| Licks strip | `activeStyle` (= match.style), `contextStation` | Populates; `contextStation` **falls back to station 0** when canonicalPos is −1 (JamGuide.jsx:341-344, existing comment says exactly this) — licks aim at the progression's first chord until the playhead exists |
| Related progressions (L-51) | `{ loop, keyInfo, onChordClick }` | Populates for free — it computes its own match from the loop |
| Instrument view | `keyInfo`, `currentChord` | Scale + pentatonic tiers light in the rolled key; **no chord-tone tier until the first commit** (currentChord undefined) — honest |
| ChordDetailModal | tap any chip | Works — chips pass real chord names |
| Chord detection itself | `effectiveKeyRef` | **Enabled immediately** by the seeded key (§3.1 synergy) |

**The pre-first-note playhead, stated plainly:** there is none — no strip chip
glows, no rail row is "now", and that is the design: a playhead claims
knowledge of where the band is, and the app doesn't have it yet. It lights on
the **first committed chord whose name appears in the loop** (`findLoopPosition`
walks back from the last commit; a first chord outside the loop keeps it
unlit). The 🎲 chip carries the "we're starting" affordance until then.

**Style-attribution quirk (documented, accepted):** same-shape progressions
exist across styles (`rock-axis` / `reggae-nwnc` / `pop-axis` all
`[0,7,9,5]`), and fix (a) adds within-style aliases
(`country-145`-collapsed ≡ `country-bluegrass-cycle`).
`matchLoopToProgression` disambiguates by quality overlap then length; ties
fall to entry order (raw before collapsed, §3.3.2 — incumbents keep winning
on ties), and the one strict-win exception is `country-145`'s collapsed form
over `bluegrass-cycle` for dom7-V input — the desired direction (§3.3.2's
true invariant). So rolling *pop* → Axis may render the rail/licks
attributed to **rock**. The chords, key, rn, and voicings are identical;
only the style label and lick flavour differ. **Re-judged against Maestro's belt-and-braces
offer: with fix (a) mandatory, matching is constructional and a seeded
`styleHint` would correct only the label/lick flavour — cosmetic, not
load-bearing. Declined for v1** (it would plumb a new prop through JamGuide
for no structural gain); noted for Maestro as a user-pulled follow-up if
anyone notices.

---

## 5. L-60 scope — exact files, bounded commits

**The audio-contract boundary (grep-gated, restated):** the seed touches
display state (`lockedKey`, `detectedProgression`, `seedInfo`,
`chordHistory` via `newSong`) + the progression refs
(`progressionVoteRef`, `progressionMissRef`) + UI refs
(`rouletteMemoryRef`, `effectiveKeyRef` per the quickLock precedent) —
**never** `handleNote`/`handleChroma`/`handleOnset`/`handleWaveform`, their
ref-sync effects, or any AudioCapture prop.

**Files:**

1. `src/lib/theory.js` — **additive only:** `export` keyword on
   `canonicalize` (shared file — flag lock to Maestro at promotion;
   Professor+Critic co-review per PROTOCOL §3; fallback per §3.2).
2. `src/lib/match.js` — the sprint's real engineering weight, all additive:
   - **`seedableLoop(progression, keyRootPc) → string[] | null`** (realize →
     collapse+wrap-dedupe → canonicalize; null for collapsed length < 2);
   - **fix (a)** per §3.3.2: `buildLoopIndex` collapsed-form entries
     (collapsed projection with `sourceIndex`, appended after raw entries)
     + `matchLoopToProgression` collapsed-hit rotation against collapsed
     degrees. Behaviour-preserving except the one enumerated strict win
     (§3.3.2 true invariant: `country-145`, desired direction);
     previously-`NO_MATCH` collapsed streams now match — this also fixes
     the pre-existing live 12-bar miss;
   - the **round-trip pool sweep** helper (lazy module-level memo, §2.2).
   After C-50, no lock overlap with L-51's exports.
3. `src/App.jsx` — `rollJam(styleId)` + `seedInfo` state +
   `rouletteMemoryRef`; the roulette button + popover menu in the controls
   bar; the three 1-line commit-layer edits (§3.4 flags 1 & 3 + the two
   `setSeedInfo(null)` clears); one line in `newSong`.
4. `src/components/ProgressionBanner.jsx` — presentational `seedInfo` prop:
   🎲 glyph + amber provenance chip on the loop row (§1.3).
5. `src/components/JamGuide.jsx` — **four bounded lines + one field**
   (§3.3.2): guitar-shape and piano-recipe lookups remap through
   `prog.sourceIndex?.[i] ?? i` (JamGuide.jsx:280, :288); `stationVoicings`
   attaches `stations[i].sourceIndex`; BassGuideRows' two raw-indexed
   lookups (`pattern` :530, `note` :533) read
   `play?.chords?.[st.sourceIndex ?? i]` — no new prop, heard-live falls
   back via `?? i`. Re-lock at promotion — JamGuide is one-screen-locked
   until C-50, which L-60 already depends on.

**Suggested commits (green at each):**
1. theory.js export + match.js (`seedableLoop` + fix (a)) + the JamGuide
   `sourceIndex` remaps (all four paths incl. bass) + the smoke sweep: the
   §2.2 round-trip invariant over **all 56** progressions under the
   steady-state/all-offsets protocol (§3.4 flag 2 verbatim; expected 52
   passers pinned; the 4 named failures asserted excluded) **plus** a
   live-stream fixture proving a clean 12-bar history now matches (the
   pre-existing bug, pinned fixed).
2. App.jsx commit-layer guard lines + `rollJam` + state/refs (mechanism live,
   invokable from a temporary plain button if needed).
3. The controls-bar button + menu + banner indicator (the visible feature).

**Out of L-60 scope:** GlanceRail/VoicingBrowser (untouched — they render
whatever stations JamGuide hands them), JamGuide beyond the four remap lines
+ field, KB content, theory beyond the one export, audio, and the
`styleHint` disambiguation (declined, §4).

---

## 6. Rejected alternatives

**Rejected A — fake `chordHistory` injection** (seed by pushing 2 synthetic
cycles into history so the detector "discovers" the roll naturally). Seductive
— zero commit-layer changes — and dishonest at every surface: the banner
history strip shows eight chords **nobody played**; `findLoopPosition`
immediately lights a playhead asserting the band is mid-loop before a note
sounds; the L-31 cadence reasoning (thresholds are *per real chord commit*)
silently breaks; and the first real commits interleave with the fake tail,
producing corrupted-rep flapping (the exact pathology C-30/L-31 spent a sprint
taming). The seed must write conclusions, not forge evidence.

**Rejected B — a separate `seededProgression` state rendered when
`detectedProgression` is null.** Duplicates the loop's identity across two
states with a priority rule; every consumer (strip, JamGuide, RelatedProgressions,
future ones) must learn the fallback or silently miss the seed; and the
detection handoff becomes a hard visual swap between two objects instead of
the vote ref's smooth confirm/replace. The standing principle exists for
exactly this: one loop, one state, one machine.

**Rejected C — display-only overlay ("ghost card") that never enters the
state machine**, cleared on first detection. Honest-looking, but the screen's
surfaces don't populate from a ghost: the rail, licks, and related
progressions all key off `detectedProgression` — an overlay would either
leave them empty (failing "so that everyone can see the chords with different
voicings") or need Rejected B's plumbing anyway. Also loses the §3.1 synergy
(no `lockedKey` → chord detection stays gated on key detection).

**Rejected D — neutralize the ramp-up with a miss-counter credit**
(`progressionMissRef.current = -(2·len + 4)` at seed time) instead of the
`seeded` flag. One line, no flag — but the credit is a magic number that burns
in real time: a band that chats for eight commits' worth of noodling before
starting spends it on nothing and the card still dies mid-ramp-up; and it
leaves no way for the agreement branch to know confirmation happened (the
indicator can't flip). The flag has clean semantics; the credit has arithmetic
luck.

---

## 7. Flags for Maestro

- **theory.js shared-file lock** (additive `export` on `canonicalize`) — L-60
  promotion must note it; Professor co-review per PROTOCOL §3.
- **L-60 lock list** per §5 (App.jsx + ProgressionBanner.jsx + match.js +
  theory.js + JamGuide.jsx, four remap lines + one station field) —
  supersedes the ledger row's "App.jsx (+ per D-62)".
- **Fix (a) repairs a pre-existing LIVE bug** (§3.3.1: real 12-bar/8-bar
  streams — 10 progressions match nothing in JamGuide today, and
  `country-145` misattributes; 11 collapse-affected total, §3.3.2 census).
  Worth a line in the PR body / Herald's changelog: users get it even if
  they never touch the roulette.
- **`styleHint` disambiguation** — re-judged and **declined for v1** (§4:
  cosmetic post-fix-(a)); user-pulled follow-up only.
- **Smoke round-trip sweep** (§5 commit 1, all 56 progressions + the live
  12-bar fixture) — if Critic prefers it C-owned, it slots into C-61's sweep
  instead.
- No new tokens, no new colours (amber + accent are established), no
  dependencies, no KB/audio changes anywhere in this design.
