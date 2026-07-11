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

import { NOTES, NOTES_FLAT, toRomanNumeral } from './theory'

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

/**
 * Precompute a lookup table from a KB registry (kb/index.js default export).
 * Returns { byCanonical: Map<canonicalDegrees, entry[]> } where each entry is
 * { style, id, progression }. Build once, reuse across matches.
 */
export function buildLoopIndex(kb) {
  const byCanonical = new Map()
  if (!kb) return { byCanonical }
  for (const style of Object.keys(kb)) {
    const progs = kb[style]?.progressions
    if (!Array.isArray(progs)) continue
    for (const progression of progs) {
      if (!Array.isArray(progression.degrees) || !progression.degrees.length) continue
      const canon = canonicalDegrees(progression.degrees)
      const entry = { style, id: progression.id, progression }
      if (!byCanonical.has(canon)) byCanonical.set(canon, [])
      byCanonical.get(canon).push(entry)
    }
  }
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

// ─── Roman-numeral helpers (re-exported for callers that only need matching) ───

/**
 * loopRomanNumerals(loop, keyRoot, keyMode) → roman numeral per chord.
 * Thin wrapper over theory.toRomanNumeral so banner/roadmap share one path.
 */
export function loopRomanNumerals(loop, keyRoot, keyMode) {
  if (!loop?.length) return []
  return loop.map(chord => (keyRoot ? toRomanNumeral(chord, keyRoot, keyMode) : chord))
}
