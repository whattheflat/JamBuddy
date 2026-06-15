// ─── Piano voicing resolver (L-10) ────────────────────────────────────────────
//
// A pure, deterministic module that generates piano voicings from a chord, for
// the Jam Guide's piano instrument tab (GOAL G4: "generate piano voicings from
// interval recipes rather than data files — root position, inversions, shells
// (1-3-7), rootless A (3-5-7-9) / B (7-9-3-5) — choosing the inversion that
// minimizes movement from the previous chord").
//
// Built on the SAME chord model the rest of the app uses: a chord is
// { rootPc, quality } where `rootPc` is a pitch class 0–11 and `quality` is a
// CHORD_TYPES key (one of the 14: maj, min, dom7, maj7, min7, dim, dim7,
// half_dim, aug, sus4, sus2, maj6, min6, add9). This is exactly what
// match.js exposes (`chordRootPC` + a quality token) and what KB stations carry
// (`degrees[i]` + `qualities[i]`), so a caller maps a station → a voicing with
// no string parsing. Intervals come straight from CHORD_TYPES — never redefined.
//
// No globals, no Date, no random. Same input → same output, always.
//
// ─── The `notes` reference convention (READ THIS — D-10/L-11 render against it) ─
//
// `notes` are ABSOLUTE semitone positions for placing keys on a keyboard, NOT
// pitch classes. The reference point is:
//
//     0  =  C of the displayed LOW octave.
//
// So a value of `n` means "the key `n` semitones above that low C". A renderer
// drawing ~2–3 octaves (MiniPiano, D-10) maps note value `n` to key index `n`
// from the left edge of its low C. Examples in C (rootPc 0):
//
//     C-major root-position triad   →  notes [0, 4, 7]      (C E G, low octave)
//     Cmaj7    root-position        →  notes [0, 4, 7, 11]  (C E G B)
//     Cmaj7    shell (R-3-7)        →  notes [0, 4, 11]
//     Dm7      rootless A (3-5-7-9) →  notes [17, 21, 24, 28] (F A C E, lifted a register)
//
// Rootless and shell voicings deliberately sit HIGHER than root position so they
// read as right-hand comping shapes — the resolver lifts them by one octave (+12)
// from the root anchor by default (the LH would supply the root). `bass` is the
// lowest sounding note of whatever was produced, so a renderer can mark the LH
// anchor distinctly. All note values are ≥ 0 and span ≤ ~3 octaves (0–36), so a
// keyboard of 3 octaves always contains every voicing this module emits.
//
// `pcs` are the pitch classes (0–11) actually sounding — for highlighting which
// keys light up in every octave, and for validation.
//
// ─── The tone-set contract (what counts as a "correct" pc — READ for C-10) ─────
//
// For root-position and shell voicings, every pc is a strict chord tone:
// pcs ⊆ { (rootPc + i) mod 12 | i ∈ CHORD_TYPES[quality].intervals }, and the
// defining tones (the 3rd, and the true 7th when the chord has one) are present.
//
// Rootless A/B voicings additionally carry the **9th** — the defining colour of
// a rootless jazz voicing (the "9" in 3-5-7-9 / 7-9-3-5). The 9th (a 2nd up an
// octave, pc = rootPc+2) is an EXTENSION, not a member of the bare triad/7th
// interval set, so it is a *deliberate, consonant* added tone — never a "wrong
// note". The full legitimate tone set for a quality is therefore the chord tones
// PLUS the natural 9th, exported as `voicingToneSet(rootPc, quality, style)` so a
// validator (C-10) checks `pcs ⊆ voicingToneSet(...)` rather than the bare triad.
// No voicing this module emits ever contains a pc outside that set.

import { CHORD_TYPES, guideTones } from './theory'

// ─── Internals ────────────────────────────────────────────────────────────────

const mod12 = (n) => ((n % 12) + 12) % 12

// Resolve a quality to its CHORD_TYPES entry, defaulting to maj for anything odd.
function chordType(quality) {
  return CHORD_TYPES[quality] ?? CHORD_TYPES.maj
}

// The chord's interval set (semitones from root), e.g. dom7 → [0,4,7,10].
function chordIntervals(quality) {
  return chordType(quality).intervals
}

// Does this quality carry a TRUE 7th (a minor or major 7th — interval 10 or 11)?
// This mirrors theory.guideTones' honest `hasSeventh` (NOT "length >= 4": add9
// [0,2,4,7] and maj6/min6 [0,4,7,9] are 4-tone chords with no real 7th).
function seventhInterval(quality) {
  return chordIntervals(quality).find((i) => i === 10 || i === 11)
}

// The 3rd interval. CHORD_TYPES index 1 is the 3rd for triad/7th qualities, but
// sus2 [0,2,7] / sus4 [0,5,7] have a 2nd/4th there instead — there is no 3rd, so
// we report the suspension tone as the "3rd-slot" colour (what the voicing uses
// where a 3rd would go). add9's index 1 is its 9th (pc+2), so we pick the actual
// major/minor 3rd (interval 3 or 4) when the set has one, else the index-1 tone.
function thirdInterval(quality) {
  const ints = chordIntervals(quality)
  const real = ints.find((i) => i === 3 || i === 4) // minor or major 3rd
  if (real !== undefined) return real
  return ints[1] // sus2 → 2, sus4 → 5 (the suspension stands in for the 3rd)
}

// The 5th interval the chord actually contains: perfect 5th (7) when present,
// else the altered 5th (♭5=6 for dim/dim7/half_dim, #5=8 for aug).
function fifthInterval(quality) {
  const ints = chordIntervals(quality)
  if (ints.includes(7)) return 7
  if (ints.includes(6)) return 6
  if (ints.includes(8)) return 8
  return 7
}

// The 9th colour for rootless voicings: a 9th is a 2nd up an octave (interval 2
// or 14). add9 already lists 2; otherwise we synthesize the natural 9th (14)
// from the root — rootless A/B want a 9th on top whether or not the chord names
// one. (For min6/maj6 we use the 6th as the rootless "colour" instead — see
// rootlessColours below.)
const NINTH = 14

// ─── Voicing builders ─────────────────────────────────────────────────────────
//
// Each builder returns { pcs, intervalsFromRoot, style, label } where
// `intervalsFromRoot` are signed semitone offsets from the chord root in the
// builder's own register (root position low; shell/rootless lifted +12). The
// register is then optimized for voice-leading in placeVoicing().

// Root position: every chord tone stacked from the root, low register (root @ 0).
function buildRoot(rootPc, quality) {
  const ints = chordIntervals(quality)
  return {
    intervalsFromRoot: [...ints],
    pcs: ints.map((i) => mod12(rootPc + i)),
    style: 'root',
    label: `root position (${labelFor(ints)})`,
  }
}

// Shell: the skeleton a comping pianist plays — root + 3rd + 7th for a 7th chord,
// root + 3rd + 5th for a triad (no 7th to thin to). Lifted +12 (RH shape; LH
// would double the root). For sus chords the "3rd" is the suspension tone.
function buildShell(rootPc, quality) {
  const seventh = seventhInterval(quality)
  const third = thirdInterval(quality)
  let ints
  let kind
  if (seventh !== undefined) {
    ints = [0, third, seventh] // R-3-7 (the true shell)
    kind = 'R-3-7'
  } else {
    ints = [0, third, fifthInterval(quality)] // triad shell R-3-5
    kind = 'R-3-5'
  }
  const lifted = ints.map((i) => i + 12)
  return {
    intervalsFromRoot: lifted,
    pcs: ints.map((i) => mod12(rootPc + i)),
    style: 'shell',
    label: `shell (${kind})`,
  }
}

// The 3-5-7-9 / 7-9-3-5 colour tones for a rootless voicing.
// For a true-7th chord: use 3, 5, the real 7th, and the 9th (14).
// For maj6/min6 (no 7th): treat the 6th (9) as the upper colour in the 7-slot —
//   GOAL: "min6/maj6 treat the 6th as the 13th-ish color or fall back gracefully".
// For triads/sus/add9 (no 7th): there is no rootless 3-5-7-9 — degrade to a
//   3-5-9 colour shape and SAY SO in the label.
function rootlessColours(quality) {
  const third = thirdInterval(quality)
  const fifth = fifthInterval(quality)
  const seventh = seventhInterval(quality)
  const ints = chordIntervals(quality)

  if (seventh !== undefined) {
    return { third, fifth, seventh, ninth: NINTH, full: true, note: '3-5-7-9' }
  }
  // maj6 / min6 — the 6th (interval 9) stands in for the 7-slot colour.
  if (ints.includes(9) && (quality === 'maj6' || quality === 'min6')) {
    return { third, fifth, seventh: 9, ninth: NINTH, full: true, note: '3-5-6-9' }
  }
  // triad / sus / add9 — no 7th and no 6th: a 3-5-9 colour shape (no 7-slot).
  return { third, fifth, seventh: null, ninth: NINTH, full: false, note: '3-5-9' }
}

// Rootless A — voiced low-to-high 3-5-7-9 (the standard "A" form). Lifted +12.
function buildRootlessA(rootPc, quality) {
  const c = rootlessColours(quality)
  const ints = (c.full ? [c.third, c.fifth, c.seventh, c.ninth] : [c.third, c.fifth, c.ninth])
    .map((i) => i + 12)
  ints.sort((a, b) => a - b)
  return {
    intervalsFromRoot: ints,
    pcs: ints.map((i) => mod12(rootPc + i)),
    style: 'rootlessA',
    label: c.full
      ? `rootless A (${c.note})`
      : `rootless A — no 7th, ${c.note} colour`,
  }
}

// Rootless B — voiced 7-9-3-5: the SAME four colour tones, but with the 7th & 9th
// in the lower octave and the 3rd & 5th in the upper, so the shape inverts. We
// build it by placing 7 & 9 at +12 and 3 & 5 at +24 (a register higher), which
// is what makes A and B alternate cleanly down a chain. Falls back like A.
function buildRootlessB(rootPc, quality) {
  const c = rootlessColours(quality)
  let ints
  if (c.full) {
    ints = [c.seventh + 12, c.ninth + 12, c.third + 24, c.fifth + 24]
  } else {
    // no true 7th: 9 below, 3 & 5 above — a 9-3-5 inversion of the A fallback.
    ints = [c.ninth + 12, c.third + 24, c.fifth + 24]
  }
  ints.sort((a, b) => a - b)
  return {
    intervalsFromRoot: ints,
    pcs: ints.map((i) => mod12(rootPc + i)),
    style: 'rootlessB',
    label: c.full
      ? `rootless B (7-9-3-5)`
      : `rootless B — no 7th, 9-3-5 colour`,
  }
}

// Human label for a root-position interval set, e.g. [0,4,7,10] → "R-3-5-♭7".
function labelFor(ints) {
  const NAME = {
    0: 'R', 1: '♭9', 2: '9', 3: '♭3', 4: '3', 5: '4', 6: '♭5',
    7: '5', 8: '♯5', 9: '6', 10: '♭7', 11: '7',
  }
  return ints.map((i) => NAME[mod12(i)] ?? `${i}`).join('-')
}

// ─── Voice-leading placement ──────────────────────────────────────────────────
//
// Given a voicing's pitch classes and a `prev` notes array, choose the absolute
// register (which octave each pc lands in) that MINIMIZES total voice-leading
// movement from prev — the sum, over each voice, of the nearest-semitone
// distance to its closest prev note.
//
// ALGORITHM (documented):
//   1. The builder gives `intervalsFromRoot` — a register-anchored shape. We keep
//      that internal voicing SHAPE (its inversion/spread) intact, and only slide
//      the whole shape up or down by whole octaves to sit nearest to prev. This
//      preserves the chosen voicing identity (a shell stays a shell) while still
//      voice-leading the progression smoothly.
//   2. For each candidate octave offset k ∈ {-2..+2} (×12), shift every note by
//      12k, keep it inside the renderable window [0, 36], and score it: for each
//      shifted note find min |note − p| over all p in prev (nearest-voice
//      distance), and sum. Lowest total wins. Ties → the offset closest to the
//      builder's default register (k nearest 0), keeping output stable/low.
//   3. With no prev, we don't shift — the builder's default register is used, so
//      the FIRST chord of a progression voices at a predictable height and every
//      subsequent chord threads from it.
//
// This is per-shape octave optimization, not per-voice re-inversion: it's
// deterministic, cheap, and gives the smooth "shape glides to meet the last
// chord" motion the design wants without scrambling the voicing's character.

function placeVoicing(base, rootPc, prev) {
  // Absolute notes in the builder's default register (anchor: low C = 0).
  const def = base.intervalsFromRoot.map((i) => mod12(rootPc) + i)

  if (!Array.isArray(prev) || prev.length === 0) {
    return clampWindow(def)
  }

  let bestNotes = null
  let bestCost = Infinity
  let bestK = 0
  for (let k = -2; k <= 2; k++) {
    const shifted = def.map((n) => n + 12 * k)
    if (shifted.some((n) => n < 0 || n > 36)) continue
    let cost = 0
    for (const n of shifted) {
      let nearest = Infinity
      for (const p of prev) nearest = Math.min(nearest, Math.abs(n - p))
      cost += nearest
    }
    // Prefer lower cost; tie-break toward the default register (smaller |k|).
    if (cost < bestCost || (cost === bestCost && Math.abs(k) < Math.abs(bestK))) {
      bestCost = cost
      bestNotes = shifted
      bestK = k
    }
  }
  return clampWindow(bestNotes ?? def)
}

// Keep a voicing inside the renderable window [0, 36] (≤3 octaves) by sliding it
// by whole octaves if it pokes out — never reshapes, only translates.
function clampWindow(notes) {
  let out = [...notes]
  while (Math.min(...out) < 0) out = out.map((n) => n + 12)
  while (Math.max(...out) > 36) out = out.map((n) => n - 12)
  return out.sort((a, b) => a - b)
}

// ─── Public API ───────────────────────────────────────────────────────────────

const BUILDERS = {
  root: buildRoot,
  shell: buildShell,
  rootlessA: buildRootlessA,
  rootlessB: buildRootlessB,
}

// Default voicing style: shells for 7th chords (the comping skeleton), root
// position for plain triads / sus / add9 / 6 chords (nothing to thin to a shell).
function defaultStyle(quality) {
  return seventhInterval(quality) !== undefined ? 'shell' : 'root'
}

/**
 * pianoVoicing({ rootPc, quality }, opts?) → voicing
 *
 * Generates a single piano voicing for a chord.
 *
 * @param {{rootPc:number, quality:string}} chord
 *        rootPc 0–11; quality is a CHORD_TYPES key.
 * @param {{ style?: 'root'|'shell'|'rootlessA'|'rootlessB', prev?: number[] }} [opts]
 *        style — force a voicing type (else default: shell for 7ths, root else).
 *        prev  — the previous voicing's `notes`; when given, the register is
 *                chosen to minimize total voice-leading movement from it.
 *
 * @returns {{
 *   notes: number[],   // absolute key positions (0 = C of low octave; see header)
 *   pcs:   number[],   // pitch classes 0–11 sounding (subset of chord tones)
 *   bass:  number,     // lowest sounding note (LH anchor)
 *   style: string,     // 'root' | 'shell' | 'rootlessA' | 'rootlessB'
 *   label: string,     // e.g. "rootless A (3-5-7-9)"
 * }}
 *
 * Inline sanity (verified):
 *   pianoVoicing({rootPc:0,  quality:'maj7'}, {style:'shell'}).pcs  → {0,4,11}   (C-E-B)
 *   pianoVoicing({rootPc:2,  quality:'min7'}, {style:'rootlessA'}).pcs → {5,9,0,4} = F-A-C-E
 *   pianoVoicing({rootPc:7,  quality:'dom7'}, {style:'shell'}).pcs   → {7,11,5}   (G-B-F)
 *   pianoVoicing({rootPc:9,  quality:'aug'}).pcs                     → {9,1,5}    (A-C♯-F)
 *   pianoVoicing({rootPc:0,  quality:'sus4'}).pcs                    → {0,5,7}    (C-F-G)
 *   pianoVoicing({rootPc:0,  quality:'add9'}).pcs                    → {0,2,4,7}  (C-D-E-G)
 *   A ii–V–I threaded with `prev` (Dm7→G7→Cmaj7, all shells) keeps each chord's
 *   octave register near the last → small total semitone motion (voice-led).
 */
export function pianoVoicing(chord, opts = {}) {
  const rootPc = mod12(chord?.rootPc ?? 0)
  const quality = CHORD_TYPES[chord?.quality] ? chord.quality : 'maj'
  const style = BUILDERS[opts.style] ? opts.style : defaultStyle(quality)

  const base = BUILDERS[style](rootPc, quality)
  const notes = placeVoicing(base, rootPc, opts.prev)

  // pcs in the voiced order (low→high), deduped — what keys light up.
  const pcs = [...new Set(notes.map((n) => mod12(n)))]

  return {
    notes,
    pcs,
    bass: Math.min(...notes),
    style,
    label: base.label,
  }
}

/**
 * pianoVoicingChain(chords, opts?) → voicing[]
 *
 * Convenience: voice a whole progression with voice-leading threading. Each
 * chord after the first is placed to minimize movement from the previous chord's
 * `notes`, so a ii–V–I (or any loop) glides smoothly. `chords` is an array of
 * { rootPc, quality }. `opts.style` (optional) forces one style for the chain;
 * otherwise each chord uses its own default. Returns the voicings in order.
 *
 * D-10/L-11 can call this once per loop to lay out a synced row of MiniPianos.
 */
export function pianoVoicingChain(chords, opts = {}) {
  if (!Array.isArray(chords)) return []
  const out = []
  let prev = null
  for (const chord of chords) {
    const v = pianoVoicing(chord, { style: opts.style, prev })
    out.push(v)
    prev = v.notes
  }
  return out
}

// Re-export the chord-model helper the resolver leans on, so a consumer can ask
// "does this chord have a true 7th?" without re-importing theory (handy for
// MiniPiano deciding whether to offer rootless A/B toggles).
export function hasTrueSeventh(quality) {
  return seventhInterval(quality) !== undefined
}

/**
 * voicingToneSet({ rootPc, quality }, style?) → Set<number> of legal pitch classes.
 *
 * The complete set of pcs a voicing of this chord may legitimately sound — the
 * correctness reference for validation (C-10). It is the chord's strict tones
 * (rootPc + each CHORD_TYPES interval); for rootless styles it ALSO includes the
 * natural 9th (rootPc+2) and, for maj6/min6, the 6th (already a chord tone) used
 * as the upper colour. Any `pianoVoicing(...).pcs` is guaranteed ⊆ this set.
 *
 * Pass `style` to scope it (root/shell never add the 9th); omit `style` to get
 * the widest legal set (tones + 9th) — handy as a one-shot "no wrong notes" gate.
 */
export function voicingToneSet({ rootPc, quality } = {}, style) {
  const r = mod12(rootPc ?? 0)
  const q = CHORD_TYPES[quality] ? quality : 'maj'
  const set = new Set(chordIntervals(q).map((i) => mod12(r + i)))
  const rootless = style === 'rootlessA' || style === 'rootlessB' || style === undefined
  if (rootless) set.add(mod12(r + 2)) // the rootless 9th extension
  return set
}

// guideTones is re-exported so a renderer can co-highlight the 3rd/7th targets
// on the same keyboard it draws the voicing on, from one import.
export { guideTones }
