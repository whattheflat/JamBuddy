// ─── Loop matching & positioning ──────────────────────────────────────────────
//
// Shared, rotation-invariant loop matcher used by both the live ProgressionBanner
// and the upcoming Jam Guide (Roadmap) panel.
//
// Two concerns live here:
//   1. POSITION — where in a known loop the player currently is (drives playheads).
//   2. IDENTITY — which KB progression a detected loop *is*, independent of which
//      chord it happens to start on ([I IV V] == [IV V I] == [V I IV]).
//
// This file is matching/position logic only. All music-theory primitives
// (note names, roman numerals) come read-only from theory.js.

import { NOTES, NOTES_FLAT, CHORD_TYPES, toRomanNumeral, canonicalize, detectRepeatingProgression } from './theory'

// ─── Chord-name parsing (local — theory.js does not export a pitch-class helper) ─

// Maps a note name (sharp or flat spelling) to its pitch class 0–11, or -1.
function pitchClassOf(note) {
  if (!note) return -1
  const idx = NOTES.indexOf(note)
  if (idx !== -1) return idx
  return NOTES_FLAT.indexOf(note)
}

// Splits a chord name like "Cm7" / "F#maj7" / "Bb" into { root, quality }.
function parseChord(chordName) {
  if (!chordName || typeof chordName !== 'string') return null
  const m = chordName.match(/^([A-G][b#]?)(.*)$/)
  if (!m) return null
  return { root: m[1], quality: m[2] }
}

// Pitch class (0–11) of a chord name's root, or -1 if unparseable.
export function chordRootPC(chordName) {
  const parsed = parseChord(chordName)
  if (!parsed) return -1
  return pitchClassOf(parsed.root)
}

// Maps a chord-name suffix to a KB quality token (the vocabulary used in
// kb/**/progressions.js `qualities` arrays). Used as a soft tie-breaker only.
function suffixToQuality(suffix) {
  switch (suffix) {
    case '':       return 'maj'
    case 'm':      return 'min'
    case '7':      return 'dom7'
    case 'maj7':   return 'maj7'
    case 'm7':     return 'min7'
    case 'dim':    return 'dim'
    case 'dim7':   return 'dim7'
    case 'm7b5':   return 'half_dim'
    case 'aug':    return 'aug'
    case 'sus4':   return 'sus4'
    case 'sus2':   return 'sus2'
    case '6':      return 'maj6'
    case 'm6':     return 'min6'
    case 'add9':   return 'add9'
    default:       return null
  }
}

// ─── Position within a known loop ─────────────────────────────────────────────

/**
 * findLoopPosition(chordHistory, loop) → index in `loop` the player is on, or -1.
 *
 * `loop` is an array of chord-name strings (e.g. the detected progression, or a
 * KB progression rendered into chord names for the current key). Robust to the
 * most recent chord: walks back from each occurrence of the last chord and keeps
 * the position whose preceding chords best continue the recent history; falls
 * back to the first plain occurrence of the last chord.
 */
export function findLoopPosition(chordHistory, loop) {
  if (!loop?.length || !chordHistory?.length) return -1
  const last = chordHistory[chordHistory.length - 1]
  for (let p = loop.length - 1; p >= 0; p--) {
    if (loop[p] !== last) continue
    let match = true
    for (let i = 1; i < Math.min(p + 1, chordHistory.length); i++) {
      if (loop[p - i] !== chordHistory[chordHistory.length - 1 - i]) { match = false; break }
    }
    if (match) return p
  }
  return loop.indexOf(last)
}

// ─── Degree-relative, rotation-invariant identity ─────────────────────────────

// Turns a degree sequence (semitone offsets) into the canonical rotation:
// for each rotation, re-base so the first element is 0, then pick the
// lexicographically smallest resulting sequence. Same loop → same string,
// regardless of which chord it starts on.
// Exported additively for RelatedProgressions' ranking (task L-51,
// one-screen.md §5) — no behaviour change.
export function canonicalDegrees(degrees) {
  const n = degrees.length
  if (n === 0) return ''
  let best = null
  for (let r = 0; r < n; r++) {
    const base = degrees[r]
    const rot = []
    for (let i = 0; i < n; i++) {
      const d = degrees[(r + i) % n]
      rot.push(((d - base) % 12 + 12) % 12)
    }
    const key = rot.join(',')
    if (best === null || key < best) best = key
  }
  return best
}

// Converts a loop of chord-name strings into semitone offsets from the loop's
// own first chord. Returns null if any chord root is unparseable.
// Exported additively for RelatedProgressions' ranking (task L-51,
// one-screen.md §5) — no behaviour change.
export function loopToDegrees(loop) {
  if (!loop?.length) return null
  const pcs = loop.map(chordRootPC)
  if (pcs.some(pc => pc < 0)) return null
  const tonic = pcs[0]
  return pcs.map(pc => ((pc - tonic) % 12 + 12) % 12)
}

// Suffix of a KB quality token (the display suffix, '' fallback for out-of-vocab
// tokens). Name-collapse compares SUFFIXES, not raw quality tokens: two
// out-of-vocab qualities both fall back to '' and realize to equal names, so a
// token comparison would under-collapse (jam-roulette.md §3.3.2).
function suffixOfQuality(quality) {
  return CHORD_TYPES[quality]?.suffix ?? ''
}

/**
 * collapseProjection(progression) → { degrees, qualities, rn, bars, sourceIndex }
 *
 * The key-free collapsed shape of a KB progression (fix (a), jam-roulette.md
 * §3.3.2 / §3.3.3): dedupe adjacent stations whose (degree, suffix) pairs are
 * equal, then wrap-dedupe (if the last pair equals the first, drop the last).
 * The projection mirrors detection's collapsed commit stream:
 *   - rn        : the first-of-run roman numeral
 *   - bars      : summed per run
 *   - sourceIndex[i] : the first RAW station index of collapsed station i — the
 *                 remap every authored-play lookup must go through so a collapsed
 *                 match reads the right raw play entry (JamGuide §3.3.2).
 * Name-collapse is provably key-independent (§3.3.3), so this is computed once
 * with no key in hand.
 */
function collapseProjection(progression) {
  const degrees = Array.isArray(progression?.degrees) ? progression.degrees : []
  const qualities = Array.isArray(progression?.qualities) ? progression.qualities : []
  const rn = Array.isArray(progression?.rn) ? progression.rn : []
  const bars = Array.isArray(progression?.bars) ? progression.bars : []
  const outDeg = [], outQual = [], outRn = [], outBars = [], sourceIndex = []
  for (let i = 0; i < degrees.length; i++) {
    const last = outDeg.length - 1
    if (last >= 0 && outDeg[last] === degrees[i] && suffixOfQuality(outQual[last]) === suffixOfQuality(qualities[i])) {
      outBars[last] += bars[i] ?? 0
      continue
    }
    outDeg.push(degrees[i])
    outQual.push(qualities[i])
    outRn.push(rn[i] ?? '')
    outBars.push(bars[i] ?? 0)
    sourceIndex.push(i)
  }
  // Wrap-dedupe — only the boundary pair can merge post-collapse (§3.3.2).
  if (outDeg.length > 1
      && outDeg[outDeg.length - 1] === outDeg[0]
      && suffixOfQuality(outQual[outQual.length - 1]) === suffixOfQuality(outQual[0])) {
    outBars[0] += outBars[outDeg.length - 1]
    outDeg.pop(); outQual.pop(); outRn.pop(); outBars.pop(); sourceIndex.pop()
  }
  return { degrees: outDeg, qualities: outQual, rn: outRn, bars: outBars, sourceIndex }
}

/**
 * Precompute a lookup table from a KB registry (kb/index.js default export).
 * Returns { byCanonical: Map<canonicalDegrees, entry[]> } where each entry is
 * { style, id, progression }. Build once, reuse across matches.
 *
 * Fix (a) (jam-roulette.md §3.3.2): each progression is indexed by its RAW
 * degrees AND — when the collapsed shape differs (11/56 today) — by its
 * collapsed form, whose `progression` is the collapsed PROJECTION (degrees /
 * qualities / rn / bars / sourceIndex). Collapsed entries are appended AFTER all
 * raw entries so matchLoopToProgression's strict-`>` disambiguation keeps every
 * previously-matching input's winner on ties (behaviour-preserving except the
 * one enumerated strict win, country-145 → its own collapsed form). This makes
 * a detected COLLAPSED loop (the live commit stream dedupes back-to-back chords)
 * match its progression — repairing a pre-existing live-detection miss for real
 * 12-bar / 8-bar streams and enabling the roulette seed to populate the guide.
 */
export function buildLoopIndex(kb) {
  const byCanonical = new Map()
  if (!kb) return { byCanonical }
  const add = (canon, entry) => {
    if (!byCanonical.has(canon)) byCanonical.set(canon, [])
    byCanonical.get(canon).push(entry)
  }
  const collapsedPending = []
  for (const style of Object.keys(kb)) {
    const progs = kb[style]?.progressions
    if (!Array.isArray(progs)) continue
    for (const progression of progs) {
      if (!Array.isArray(progression.degrees) || !progression.degrees.length) continue
      add(canonicalDegrees(progression.degrees), { style, id: progression.id, progression })
      // Collapsed-form entry — only when the collapsed shape differs (a run
      // collapse strictly shortens length, so a length change ⇔ a real collapse).
      const proj = collapseProjection(progression)
      if (proj.degrees.length && proj.degrees.length !== progression.degrees.length) {
        const collapsedProg = {
          ...progression,
          degrees: proj.degrees,
          qualities: proj.qualities,
          rn: proj.rn,
          bars: proj.bars,
          sourceIndex: proj.sourceIndex,
        }
        collapsedPending.push({
          canon: canonicalDegrees(proj.degrees),
          entry: { style, id: progression.id, progression: collapsedProg },
        })
      }
    }
  }
  // Append collapsed entries after ALL raw entries (the tie-preservation invariant).
  for (const { canon, entry } of collapsedPending) add(canon, entry)
  return { byCanonical }
}

// A "no match" result, shared so callers can compare shape consistently.
const NO_MATCH = { matched: false, id: null, style: null, rotation: 0, progression: null }

/**
 * matchLoopToProgression(loop, kbOrIndex) → match result.
 *
 * `loop` is an array of chord-name strings (the detected repeating progression).
 * `kbOrIndex` is either the kb/index.js default export OR a prebuilt index from
 * buildLoopIndex() (preferred for repeated calls).
 *
 * Rotation-invariant: a detected [F7 G7 Cmaj7] (= IV V I) matches a KB
 * progression stored as ii–V–I etc. when their degree shapes coincide.
 *
 * Returns:
 *   { matched: true, id, style, rotation, progression }
 *     rotation = index into `loop` that aligns with the KB progression's first
 *     degree (degrees[0]); callers rotate the loop by `rotation` to put it in
 *     canonical KB order for the playhead.
 *   { matched: false, id: null, style: null, rotation: 0, progression: null }
 */
export function matchLoopToProgression(loop, kbOrIndex) {
  const degrees = loopToDegrees(loop)
  if (!degrees) return NO_MATCH

  const index = kbOrIndex?.byCanonical instanceof Map ? kbOrIndex : buildLoopIndex(kbOrIndex)
  const canon = canonicalDegrees(degrees)
  const candidates = index.byCanonical.get(canon)
  if (!candidates || !candidates.length) return NO_MATCH

  // Disambiguate same-shape progressions (e.g. major vs minor ii–V) by chord
  // quality overlap with the loop, then by fewer chords (the tighter loop).
  const loopQualities = loop.map(c => {
    const p = parseChord(c)
    return p ? suffixToQuality(p.quality) : null
  })

  let best = null
  let bestScore = -Infinity
  for (const cand of candidates) {
    const kbQ = cand.progression.qualities
    let qScore = 0
    if (Array.isArray(kbQ) && kbQ.length) {
      const kbSet = new Set(kbQ)
      for (const q of loopQualities) if (q && kbSet.has(q)) qScore++
    }
    // Prefer quality overlap; break ties toward shorter canonical progressions.
    const score = qScore * 100 - cand.progression.degrees.length
    if (score > bestScore) { bestScore = score; best = cand }
  }
  if (!best) return NO_MATCH

  return {
    matched: true,
    id: best.id,
    style: best.style,
    // For a collapsed-form hit best.progression.degrees IS the collapsed shape
    // (equal length to the loop by construction, fix (a)), so rotation is
    // computed against the collapsed degrees — the length-mismatch guard never
    // silently returns 0 for a genuine collapsed match (jam-roulette.md §3.3.2).
    rotation: rotationToCanonicalOrder(degrees, best.progression.degrees),
    progression: best.progression,
  }
}

// Finds the rotation `r` of the loop's degree sequence that matches the KB
// progression's degree shape (re-based to start at the KB's first degree).
// Returns the index into the loop that lines up with KB degrees[0].
function rotationToCanonicalOrder(loopDegrees, kbDegrees) {
  const n = loopDegrees.length
  if (n === 0 || n !== kbDegrees.length) return 0
  const kbBase = kbDegrees[0]
  const kbShape = kbDegrees.map(d => ((d - kbBase) % 12 + 12) % 12).join(',')
  for (let r = 0; r < n; r++) {
    const base = loopDegrees[r]
    const rot = []
    for (let i = 0; i < n; i++) {
      const d = loopDegrees[(r + i) % n]
      rot.push(((d - base) % 12 + 12) % 12)
    }
    if (rot.join(',') === kbShape) return r
  }
  return 0
}

// ─── Jam Roulette — seed realization + the seedable pool (task L-60) ──────────
//
// jam-roulette.md §3.2 / §2.2. The seed writes the exact loop detection would
// commit when the band plays this progression in the rolled key, so the L-31
// commit layer treats it like any committed loop.

/**
 * seedableLoop(progression, keyRootPc) → string[] | null
 *
 * Realize → collapse (+ wrap-dedupe) → canonicalize (§3.2):
 *   1. Realize each station in the rolled key with SHARP spellings (§2.1 — only
 *      sharp names string-match live detection's noteName path).
 *   2. Collapse consecutive duplicate NAMES, then drop the last if it equals the
 *      first (the cyclic wrap — the loop's tail flows into its head live).
 *   3. Canonicalize the rotation with theory.js's own rule, so the seeded string
 *      equals detectRepeatingProgression's canonical output exactly (the L-31
 *      agreement branch compares join(',') strings).
 * Returns null when the collapsed loop has < 2 names (unrepresentable as a
 * detected loop — detectRepeatingProgression's min pattern length is 2).
 */
export function seedableLoop(progression, keyRootPc) {
  const degrees = Array.isArray(progression?.degrees) ? progression.degrees : []
  const qualities = Array.isArray(progression?.qualities) ? progression.qualities : []
  if (!degrees.length) return null
  const names = degrees.map((deg, i) => {
    const rootPc = (((keyRootPc + deg) % 12) + 12) % 12
    return NOTES[rootPc] + suffixOfQuality(qualities[i])
  })
  const collapsed = names.filter((n, i) => i === 0 || n !== names[i - 1])
  if (collapsed.length > 1 && collapsed[0] === collapsed[collapsed.length - 1]) collapsed.pop()
  if (collapsed.length < 2) return null
  return canonicalize(collapsed)
}

/**
 * roundTripPasses(canonicalForm) → boolean   (jam-roulette.md §2.2)
 *
 * The pool gate: a progression is confirmable iff, with a 32-commit window
 * filled with repetitions of its seeded canonical form (steady state) and
 * truncated at EVERY partial-cycle offset (0…len−1), detectRepeatingProgression
 * returns exactly that form at ALL offsets. Steady-state-plus-all-offsets is the
 * honest protocol — a jam is sampled mid-cycle, not at cycle boundaries, and a
 * naive "2 clean cycles" feed gets both failure modes wrong (§2.2). Hard length
 * bounds 2–8 (the detector only sweeps those lengths) are part of the gate.
 * Key-independent (§3.3.3): the detector consumes only the name stream's
 * equality structure, so one sweep in any key (the pool builds in C) covers all.
 */
export function roundTripPasses(canonicalForm) {
  if (!Array.isArray(canonicalForm)) return false
  const len = canonicalForm.length
  if (len < 2 || len > 8) return false
  const WINDOW = 32
  const target = canonicalForm.join(',')
  for (let offset = 0; offset < len; offset++) {
    const history = []
    for (let k = 0; k < WINDOW; k++) history.push(canonicalForm[(offset + k) % len])
    const detected = detectRepeatingProgression(history)
    if (!detected || detected.join(',') !== target) return false
  }
  return true
}

// Lazy module-level memo (§2.2): one sweep on first roulette open, reused for
// every roll. Key-independent, so the pool is computed once in C.
let _roulettePoolMemo = null

/**
 * buildRoulettePool(kb) → { byStyle: Map<style, member[]> }
 *   member = { style, id, progression, collapsedLen }
 *
 * The roulette pool (§2.2): per style, the progressions whose seedable canonical
 * form passes the round-trip invariant AND lands in the 2–8 length bounds. An
 * 11th style or a new progression joins automatically. Randomization (weighting,
 * no-repeat memory, key) lives in the caller (App.rollJam) — this is the pure,
 * audio-free eligibility set.
 */
export function buildRoulettePool(kb) {
  if (_roulettePoolMemo) return _roulettePoolMemo
  const byStyle = new Map()
  for (const style of Object.keys(kb ?? {})) {
    const progs = kb[style]?.progressions
    if (!Array.isArray(progs)) { byStyle.set(style, []); continue }
    const eligible = []
    for (const progression of progs) {
      const form = seedableLoop(progression, 0) // key C — key-independent (§3.3.3)
      if (!form || !roundTripPasses(form)) continue
      eligible.push({ style, id: progression.id, progression, collapsedLen: form.length })
    }
    byStyle.set(style, eligible)
  }
  _roulettePoolMemo = { byStyle }
  return _roulettePoolMemo
}

// ─── Roman-numeral helpers (re-exported for callers that only need matching) ───

/**
 * loopRomanNumerals(loop, keyRoot, keyMode) → roman numeral per chord.
 * Thin wrapper over theory.toRomanNumeral so banner/roadmap share one path.
 */
export function loopRomanNumerals(loop, keyRoot, keyMode) {
  if (!loop?.length) return []
  return loop.map(chord => (keyRoot ? toRomanNumeral(chord, keyRoot, keyMode) : chord))
}
