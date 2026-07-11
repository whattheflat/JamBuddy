# KB Authoring Contract

Every knowledgebase cell must conform to this schema and pass `node scripts/validate-kb.mjs`. The gold-standard exemplar is `jazz/` — imitate it. Background and rationale: `docs/kb-plan.md`.

## Layout

```
src/data/kb/<style>/
  meta.js           — style identity
  progressions.js   — the style's standard progressions (instrument-independent)
  guitar.js         — instrument packs (piano.js, bass.js as cells are completed)
```

Register each style in `src/data/kb/index.js`. The UI reads only the registry.

## Hard rules

1. **Key-agnostic.** Degrees and movable shapes only — never absolute chord names in data. Open guitar shapes are the one exception (they declare `onlyRoot`, a pitch class, and render only in matching keys).
2. **Qualities** must be keys of `CHORD_TYPES` in `src/lib/theory.js` (`maj`, `min`, `dom7`, `maj7`, `min7`, `dim`, `dim7`, `half_dim`, `aug`, `sus4`, `sus2`, `maj6`, `min6`, `add9`).
3. **Intermediate level.** Guitar: fret span ≤ 4 within a shape. Piano: one hand per recipe stays within a 10th. If a play is harder, provide an easier alternative in the same play set.
4. Plays for the same progression must be **idiomatically different** (register, density, technique) — not transpositions of each other.

## meta.js

```js
export default {
  id: 'jazz',                 // folder name
  label: 'Jazz',
  feel: 'swing',              // swing | straight | shuffle | 16th | bossa…
  tempoRange: [110, 230],
  character: 'One sentence on what makes the style sound like itself.',
}
```

## progressions.js

```js
export default [
  {
    id: 'jazz-251-major',       // '<style>-<slug>', globally unique
    name: 'ii–V–I',
    rn: ['ii7', 'V7', 'Imaj7'], // display numerals
    degrees: [2, 7, 0],          // semitone offsets from key root, 0–11
    qualities: ['min7', 'dom7', 'maj7'],
    bars: [1, 1, 2],             // same length as degrees
    mode: 'major',               // major | minor | dorian | mixolydian | …
    songs: ['Autumn Leaves'],
    tip: 'One transferable idea.',
    level: 'intermediate',       // OPTIONAL: 'foundation' | 'intermediate'
  },
]
```

4–8 progressions per style. Cross-check `docs/progression-repertoire.md` §1.

**`level` (optional).** Tags the progression's difficulty for the in-app level
filter. Allowed values: `'foundation'` (the style's bread-and-butter loops) or
`'intermediate'` (secondary dominants, chained ii–Vs, backdoor, borrowed
chords…). **Omitting the field is fine and means `'foundation'`** — consumers
treat an absent `level` as foundation, so existing styles need no edits. The
validator only checks the value when the field is present.

## Instrument packs

Common envelope:

```js
export default {
  styleIntro: '2-3 sentences on this instrument's role in the style.',
  comping: [{ label, rhythm, description }],   // ≥1 named rhythm
  plays: { '<progression-id>': [ <play>, <play> ] },  // ≥2 plays per progression (bass: ≥1 — see Bass play)
  improv: {                                     // guitar/piano; optional for bass
    scales: [{ over: 'ii7', scale: 'dorian', why }],
    targetNotes: '…',
    licks: [{ tab/notation, description, over: '<progression-id>', source }],
  },
}
```

### Guitar play

```js
{
  label: 'Shell voicings',
  level: 'intermediate',
  chords: [        // one per progression step
    {
      shape: {
        // movable: fret offsets relative to the root fret; 'x' = muted
        rootStr: 6,                        // string carrying the root, 6 = low E
        offsets: [0, 'x', 0, 0, 'x', 'x'], // ALWAYS 6 entries, low E first
        fingers: [1, 0, 2, 3, 0, 0],
        // open shapes instead use: frets: [...absolute], onlyRoot: <pc 0-11>
      },
      extensions: ['9'],   // declared color tones beyond the quality (validator allows only these)
      // declared omissions (honest data, surfaced by the UI):
      // rootless: true — shape omits the root (e.g. guide-tone grips)
      // omit3: true    — shape omits the 3rd (e.g. power chords; works over major or minor)
      note: 'root–♭7–♭3',
    },
    // …
  ],
  tips: 'Voice-leading or ensemble advice.',
}
```

### Piano play

Voicings are degree recipes resolved through the chord quality. Degrees: `'1' '3' '5' '7'` resolve per quality (e.g. `'3'` → ♭3 for min7); altered/extended degrees are explicit: `'b9' '9' '#9' '11' '#11' 'b13' '13' '6'`.

> **Resolver quirk (both hand-synced `resolveDegree` copies —
> `scripts/validate-kb.mjs` and `src/components/JamGuide.jsx`):** on
> `maj6`/`min6` the degree `'7'` resolves to **9 semitones, i.e. the 6th**
> (those qualities have no 7th in their interval set, and the resolver takes
> the top stack tone as the "7 slot"). It never misspells the chord, but when
> you mean the 6th, write `'6'` explicitly — don't lean on `'7'`. This applies
> equally to bass patterns below, which share the same resolver.

```js
{
  label: 'Rootless A/B alternation',
  level: 'intermediate',
  chords: [
    { recipe: { LH: ['3', '5', '7', '9'] }, note: 'Type A' },
    { recipe: { LH: ['7', '9', '3', '13'] }, note: 'Type B' },
  ],
  register: 'top note between C4 and C5',
  tips: '…',
}
```

### Bass play

A bass play is per-station patterns: `chords` has **one entry per progression
step** (like guitar/piano plays), each carrying the ordered notes the bassist
plays over that chord.

Patterns are **degree-based** — the piano-recipe language — not string/fret
tab. Why: hard rule 1. A bass play renders over every station of a *detected*
loop in the *detected* key, so the data must transpose automatically; and a
degree either resolves through the chord quality or it doesn't — you cannot
misspell a pitch class, only mislabel your intent. Fret tab was considered and
rejected: absolute frets are key-specific (licks are the one documented
exception, and they say so), and a movable-fret variant breaks at the nut —
exactly where bass lives, on open strings. The open-string/position idiom
belongs in authoring prose: the optional `position` hint.

Rendering convention (for the per-station pattern card): standard 4-string
tuning **E–A–D–G**, strings numbered **1 = G (highest) … 4 = E (lowest)** —
the same "1 = highest string" convention as lick tab and `rootStr`, so no
third counting scheme exists in this codebase. The renderer places each
pattern in the lowest playable position within frets 0–15; the data itself
never encodes strings or frets.

```js
{
  label: 'Boogie cell',
  level: 'foundation',
  feel: 'swung 8ths, locked with the kick',   // REQUIRED — the groove in one line
  chords: [        // one per progression step
    {
      pattern: [   // the ORDERED notes (played first → last)
        { deg: '1', beat: 1 },           // chord/color tone, resolved through the quality
        { deg: '3', beat: 2 },
        { deg: '5', beat: 3, technique: 'ghost-note' },  // technique optional (lick vocabulary)
        { approach: 'chrom-below', beat: 4 },  // leads into the NEXT station's root
      ],
      note: 'walk up into the IV',       // optional, as in guitar/piano plays
    },
    // …
  ],
  position: 'first five frets; open E and A when the key allows',  // OPTIONAL prose hint
  tips: 'Transferable idea.',
}
```

Field rules (all enforced by `node scripts/validate-kb.mjs` when a `bass.js`
pack exists — a style without one is complete and valid):

| Field | Rule |
|---|---|
| `feel` | required non-empty string — bass is a rhythm role; the pattern alone doesn't say swung vs straight |
| `chords` | array, exactly one entry per progression step |
| `pattern` | non-empty ordered array; ≤ 8 notes per bar of its step (straight-8ths density cap — rule 3) |
| note shape | exactly one of `deg` \| `approach` per note |
| `deg` | a degree **string** from the piano-recipe language above, resolved through the step's quality (`'1' '3' '5' '7'` quality-resolved; `'b3' '6' 'b7' 'b9' '9' '#9' '11' '#11' 'b5' 'b13' '13'` explicit). The maj6/min6 `'7'` quirk above applies — write `'6'` |
| root rule | every pattern states `'1'` at least once — a bassline grounds the chord (a deliberately rootless play needs a schema change, not silence) |
| `octave` | optional on `deg` notes, `0` (default) or `1`; the resolved offset `deg + 12·octave` must stay **≤ 19 semitones** (an octave + a fifth) so every pattern sits on E–A–D–G within frets 0–15 in one position |
| `approach` | `'chrom-below'` (next root − 1 semitone) · `'chrom-above'` (next root + 1) · `'fifth-of-next'` (next root + 7). The pitch is **derived from the next station's root** (last step wraps to the first), never authored — that's why the validator can allow a non-chord tone here while untyped chromatics stay illegal. Approach notes must be the **final note(s)** of the pattern — they lead into the next chord |
| `beat` | optional number, `1 ≤ beat < 4·bars + 1` for that step (patterns are notated in 4 — a 12/8 shuffle is `feel`, not extra beats); non-decreasing in pattern order (equal beats = a dyad) |
| `technique` | optional per note, from the fixed lick technique vocabulary (see Licks) |

**Coverage: every progression of the style needs ≥ 1 bass play** — deliberately
1, not the guitar/piano 2. The band wants ONE bassline at a time, and rule 4's
"idiomatically different" bar is hard to clear twice per progression without
filler. A second play is welcome where a genuinely different lane exists
(two-feel vs walking, say) — the validator sets a floor, not a ceiling.

## Licks (optional)

A style's instrument pack may also teach short, named licks — the ordered-note
phrases the Licks & Techniques cards render. **The whole section is optional**:
a pack without licks is complete and valid. Guitar licks are tab-based (this
section); piano licks are degree-based (next section).

**How to register licks:** add a `licks` array as one more top-level key on the
instrument pack's default export (next to `styleIntro`/`comping`/`plays`/`improv`
in e.g. `src/data/kb/blues/guitar.js`). No change to `src/data/kb/index.js` is
needed — the registry already exposes the whole pack, and the UI reads
`kb[style].instruments.guitar.licks ?? []`.

```js
export default {
  styleIntro: '…',
  comping: [ /* … */ ],
  plays: { /* … */ },
  improv: { /* … */ },

  // OPTIONAL — structured licks (this section):
  licks: [
    {
      id: 'blues-box1-bb-answer',   // '<style>-<slug>', globally unique
                                    // (shares ONE id namespace with progression ids)
      name: 'B.B. box answer phrase',
      level: 'foundation',          // 'foundation' | 'intermediate' (required)
      chordContext: 'over the I7',  // which chord/station it fits — free text,
                                    // e.g. 'dom7' or 'over the V7 turnaround'
      techniques: ['bend', 'vibrato'],  // summary tags, from the fixed vocabulary below
      source: 'the B.B. King box, e.g. "The Thrill Is Gone" fills', // recommended attribution
      tab: [                        // the ORDERED note sequence (played first → last)
        { string: 2, fret: 8 },                        // string 1 = high e … 6 = low E
        { string: 1, fret: 8, technique: 'bend' },     // fret 0 (open) … 15
        { string: 1, fret: 10, technique: 'vibrato' }, // technique is optional per note
        { string: 2, fret: 8 },
      ],
    },
  ],
}
```

Field rules (all enforced by `node scripts/validate-kb.mjs` when `licks` is present):

| Field | Rule |
|---|---|
| `id` | starts with `'<style>-'`; globally unique across **all** progression and lick ids in the whole KB |
| `name` | required, non-empty |
| `level` | `'foundation'` or `'intermediate'` — nothing else |
| `chordContext` | required, non-empty string — tells the player *where* the lick lands |
| `techniques` | array; every entry from the fixed vocabulary below (empty array = plain-picked) |
| `tab` | non-empty ordered array of `{string, fret, technique?}` |
| `tab[].string` | integer 1–6 (**1 = high e, 6 = low E** — standard tab convention; note `rootStr` in shapes counts the same way) |
| `tab[].fret` | integer 0–15 (0 = open string) |
| `tab[].technique` | optional; from the vocabulary; must **also** appear in the lick's `techniques[]` summary so card tags stay honest |
| `source` | optional but recommended — name where the lick comes from (checklist: nothing invented) |

**Fixed technique vocabulary** (both for `techniques[]` and per-note `technique`
— the validator rejects anything else):

`hammer-on` · `pull-off` · `slide` · `bend` · `double-stop` · `ghost-note` · `chromatic-approach` · `vibrato`

Like shapes, licks are **key-agnostic in spirit**: write them where they sit in
the style's home position and say in `chordContext` which chord they fit; the
tab renders as absolute string/fret positions.

Note: the older freeform `improv.licks` (prose `{tab/notation, description,
over, source}`) is unchanged and still welcome — it feeds the improv text
section. This top-level `licks` array is the *structured* shape that the lick
cards render and the validator checks.

## Piano licks (optional, degree-based)

A piano pack's `licks` array uses the **degree language**, not tab — the same
reasoning as bass patterns (hard rule 1): a lick renders over a *detected*
chord in the *detected* key, so the data must transpose automatically, and a
degree either resolves through the stated quality or it doesn't — you cannot
misspell a pitch, only mislabel your intent. Registration is identical to
guitar licks: a top-level `licks` key on `<style>/piano.js`; no registry
change; the section is optional.

Unlike guitar licks (whose tab is instrument-truth and needs no quality),
degree-based licks **require an explicit `quality`** — a `CHORD_TYPES` key —
so the validator can resolve every degree. `chordContext` stays the human
sentence; `quality` is the machine truth. They must agree by eye ("over the
ii7" → `min7`); the validator can only check the machine half.

```js
licks: [
  {
    id: 'jazz-enclosure-into-3',       // '<style>-<slug>', same global id namespace
    name: 'Bebop enclosure into the 3rd',
    level: 'intermediate',             // 'foundation' | 'intermediate'
    chordContext: 'over the ii7',      // human text, as in guitar licks
    quality: 'min7',                   // REQUIRED — CHORD_TYPES key every deg resolves through
    techniques: ['grace-note'],        // summary tags, PIANO vocabulary (below)
    source: 'Barry Harris workshop vocabulary',   // recommended attribution
    notes: [                           // the ORDERED melodic line (played first → last)
      { deg: '5', octave: 1, beat: 1 },
      { approach: 'chrom-above', beat: 2 },        // targets the NEXT deg note
      { approach: 'chrom-below', beat: 2.5 },      // enclosure: above, below…
      { deg: '3', octave: 1, beat: 3, technique: 'grace-note' },  // …target
    ],
    tips: 'Optional transferable idea.',           // optional, unlike guitar licks
  },
]
```

Field rules (enforced by `node scripts/validate-kb.mjs` when a piano pack has
`licks`; guitar packs keep the tab rules above — the validator routes by
instrument):

| Field | Rule |
|---|---|
| `id` `name` `level` `chordContext` | exactly as guitar licks (shared global id namespace) |
| `quality` | required, a `CHORD_TYPES` key — the context every `deg` resolves through |
| `techniques` | array; every entry from the **piano vocabulary** below (empty = plain) |
| `notes` | non-empty ordered array; ≤ 16 notes (8ths over the 2-bar beat window — rule 3); the **final note must be a `deg` note** |
| note shape | exactly one of `deg` \| `approach` per note |
| `deg` | a degree **string** from the piano-recipe language, resolved through `quality` (the maj6/min6 `'7'` quirk applies — write `'6'`) |
| `octave` | optional on `deg` notes, `0` (default) \| `1` \| `2` |
| range cap | every resolved offset — `deg`: `pc + 12·octave`; `approach`: derived (below) — must sit in **[0, 25]** semitones above the root. Proof: MiniPiano's render window is absolute notes [0, 36] (0 = low C); placing the root at its pitch class in the bottom octave (0–11), the highest possible note is 11 + 25 = 36 — the window's top key — so **every lick fits the window in all 12 keys**. (Note `octave: 2` is only legal where the cap allows — e.g. ending on the high root `'1'`.) |
| `approach` | `'chrom-below'` (target − 1 semitone) · `'chrom-above'` (target + 1). The **target is the next `deg` note** in `notes[]` order, scanning past intervening approaches — so `chrom-above, chrom-below, deg` is the classic enclosure and both approaches frame the same target. The pitch is always **derived**, never authored (that's why a non-chord tone is legal here while untyped chromatics stay illegal). Guitar licks have no "next station", so unlike bass approaches these target a note *inside* the lick — and therefore **cannot close it** (nothing to target). Consecutive approaches must **differ in type** (two of the same type would derive the identical pitch — write the note you mean as a `deg` instead). No `octave` on approach notes. |
| `beat` | optional number, `1 ≤ beat < 9` (a lick spans at most two 4/4 bars); non-decreasing in order (equal beats = grace-note placement or a dyad) |
| `technique` | optional per note, from the piano vocabulary; must also appear in `techniques[]` (same honesty rule as guitar) |
| `source` | optional but recommended (checklist: nothing invented) |
| `tips` | optional string |

No root rule (unlike bass): a melodic line targets 3rds and 7ths; grounding
the root is the bassist's job.

**Piano technique vocabulary** (a distinct list from the guitar vocabulary —
keys don't bend, hammer, or sustain vibrato; the shared words keep their
guitar-lick meanings):

`slide` (the blues key-slip, off a black key onto its neighbour) ·
`double-stop` (two keys struck together) · `ghost-note` (barely-voiced filler)
· `grace-note` (crushed ornament into the main note — piano-specific)

The first three are shared with the guitar vocabulary and mean the same thing;
`grace-note` exists only here. The smoke test guards both lists (and, once
`PianoLickCard.jsx` exists, its exported `PIANO_TECHNIQUE_VOCAB` must be
set-equal to the validator's `PIANO_LICK_TECHNIQUES` — same hand-sync rule as
LickCard).

## Musician checklist (self-review before committing)

- [ ] Plays per progression genuinely differ in register/density/technique
- [ ] Every shape/recipe is playable by intermediate hands (rule 3)
- [ ] The style is recognizable from the rhythm descriptions alone (bossa ≠ jazz with new labels)
- [ ] Every tip teaches a transferable idea (voice leading, register, space), not just "play this"
- [ ] Songs/licks have sources; nothing invented
- [ ] Lick techniques use only the fixed vocabulary; every lick is playable as written (strings 1–6, frets 0–15, in order)
- [ ] Piano licks state their `quality`, keep approaches typed and non-terminal, and stay within [0, 25] semitones of the root
- [ ] Bass patterns state the root, keep approaches typed and terminal, and stay within an octave + a fifth of the root
- [ ] `node scripts/validate-kb.mjs` green; `npm run build` green
