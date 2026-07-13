// ─── Constants ───────────────────────────────────────────────────────────────

export const NOTES      = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
export const NOTES_FLAT = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B']

// Semitone intervals for each scale mode
export const SCALES = {
  major:            [0, 2, 4, 5, 7, 9, 11],
  minor:            [0, 2, 3, 5, 7, 8, 10],
  dorian:           [0, 2, 3, 5, 7, 9, 10],
  phrygian:         [0, 1, 3, 5, 7, 8, 10],
  lydian:           [0, 2, 4, 6, 7, 9, 11],
  mixolydian:       [0, 2, 4, 5, 7, 9, 10],
  pentatonic_major: [0, 2, 4, 7, 9],
  pentatonic_minor: [0, 3, 5, 7, 10],
  blues:            [0, 3, 5, 6, 7, 10],
  diminished:       [0, 2, 3, 5, 6, 8, 9, 11],
  whole_tone:       [0, 2, 4, 6, 8, 10],
}

// Human-readable scale labels
export const SCALE_LABELS = {
  major:            'Major',
  minor:            'Natural Minor',
  dorian:           'Dorian',
  phrygian:         'Phrygian',
  lydian:           'Lydian',
  mixolydian:       'Mixolydian',
  pentatonic_major: 'Major Pentatonic',
  pentatonic_minor: 'Minor Pentatonic',
  blues:            'Blues',
  diminished:       'Diminished',
  whole_tone:       'Whole Tone',
}

// Krumhansl-Schmuckler key profiles (major/minor only — used for key detection)
const KS_MAJOR = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88]
const KS_MINOR = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17]

// Chord type definitions: intervals (semitones from root) and display suffix
export const CHORD_TYPES = {
  maj:      { intervals: [0, 4, 7],        suffix: ''      },
  min:      { intervals: [0, 3, 7],        suffix: 'm'     },
  dom7:     { intervals: [0, 4, 7, 10],    suffix: '7'     },
  maj7:     { intervals: [0, 4, 7, 11],    suffix: 'maj7'  },
  min7:     { intervals: [0, 3, 7, 10],    suffix: 'm7'    },
  dim:      { intervals: [0, 3, 6],        suffix: 'dim'   },
  dim7:     { intervals: [0, 3, 6, 9],     suffix: 'dim7'  },
  half_dim: { intervals: [0, 3, 6, 10],    suffix: 'm7b5'  },
  aug:      { intervals: [0, 4, 8],        suffix: 'aug'   },
  sus4:     { intervals: [0, 5, 7],        suffix: 'sus4'  },
  sus2:     { intervals: [0, 2, 7],        suffix: 'sus2'  },
  maj6:     { intervals: [0, 4, 7, 9],     suffix: '6'     },
  min6:     { intervals: [0, 3, 7, 9],     suffix: 'm6'    },
  add9:     { intervals: [0, 2, 4, 7],     suffix: 'add9'  },
}

// Chord types considered during real-time chroma matching
const MATCH_CHORD_TYPES = [
  'maj', 'min', 'dom7', 'maj7', 'min7', 'dim', 'half_dim', 'aug', 'sus4', 'sus2', 'add9',
]

// Minimum score for a chord match to be reported
const CHORD_MATCH_MIN_SCORE  = 0.42
// Minimum margin over second-best for a match to be considered unambiguous
const CHORD_MATCH_MIN_MARGIN = 0.07

// Chord quality for each scale degree, per mode
const DEGREE_QUALITIES = {
  major:      ['',  'm',   'm',   '',    '',  'm',   'dim'],
  minor:      ['m', 'dim', '',    'm',   'm', '',    ''   ],
  dorian:     ['m', 'm',   '',    '',    'm', 'dim', ''   ],
  phrygian:   ['m', '',    '',    'm',   'dim','',   'm'  ],
  lydian:     ['',  '',    'm',   'dim', '',  'm',   'm'  ],
  mixolydian: ['',  'm',   'dim', '',    'm', 'm',   ''   ],
}

const ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII']

// Common chord progressions by genre, expressed as semitone offsets from the root
const PROGRESSIONS = {
  // Pop
  pop:     { name: 'Pop',      rn: ['I', 'V', 'vi', 'IV'],      degrees: [0, 7, 9, 5]     },
  pop2:    { name: 'Pop',      rn: ['I', 'IV', 'vi', 'V'],      degrees: [0, 5, 9, 7]     },
  pop3:    { name: 'Pop',      rn: ['I', 'vi', 'ii', 'V'],      degrees: [0, 9, 2, 7]     },
  // Blues
  blues:   { name: 'Blues',    rn: ['I', 'IV', 'V'],             degrees: [0, 5, 7]        },
  blues2:  { name: 'Blues',    rn: ['I', 'IV', 'V', 'IV'],       degrees: [0, 5, 7, 5]     },
  blues3:  { name: 'Blues',    rn: ['I', 'I', 'IV', 'V'],        degrees: [0, 0, 5, 7]     },
  // Folk
  folk:    { name: 'Folk',     rn: ['I', 'IV', 'I', 'V'],        degrees: [0, 5, 0, 7]     },
  folk2:   { name: 'Folk',     rn: ['I', 'V', 'IV', 'I'],        degrees: [0, 7, 5, 0]     },
  folk3:   { name: 'Folk',     rn: ['I', 'ii', 'IV', 'V'],       degrees: [0, 2, 5, 7]     },
  // Jazz
  jazz:    { name: 'Jazz',     rn: ['ii', 'V', 'I'],             degrees: [2, 7, 0]        },
  jazz2:   { name: 'Jazz',     rn: ['I', 'vi', 'ii', 'V'],       degrees: [0, 9, 2, 7]     },
  jazz3:   { name: 'Jazz',     rn: ['iii', 'vi', 'ii', 'V'],     degrees: [4, 9, 2, 7]     },
  // Rock
  rock:    { name: 'Rock',     rn: ['I', 'bVII', 'IV', 'I'],     degrees: [0, 10, 5, 0]    },
  rock2:   { name: 'Rock',     rn: ['I', 'IV', 'V', 'I'],        degrees: [0, 5, 7, 0]     },
  rock3:   { name: 'Rock',     rn: ['I', 'bVII', 'bVI', 'bVII'], degrees: [0, 10, 8, 10]   },
  // '50s
  '50s':   { name: "'50s",     rn: ['I', 'vi', 'IV', 'V'],       degrees: [0, 9, 5, 7]     },
  '50s2':  { name: "'50s",     rn: ['I', 'V', 'vi', 'iii'],      degrees: [0, 7, 9, 4]     },
  // Flamenco
  flamen:  { name: 'Flamenco', rn: ['i', 'bVII', 'bVI', 'V'],   degrees: [0, 10, 8, 7]    },
  flamen2: { name: 'Flamenco', rn: ['i', 'bVI', 'bVII', 'i'],   degrees: [0, 8, 10, 0]    },
}

// ─── Internal helpers ────────────────────────────────────────────────────────

function noteName(semitone, preferFlat = false) {
  const pc = ((semitone % 12) + 12) % 12
  return preferFlat ? NOTES_FLAT[pc] : NOTES[pc]
}

function pearsonCorrelation(a, b) {
  const n = a.length
  const meanA = a.reduce((s, v) => s + v, 0) / n
  const meanB = b.reduce((s, v) => s + v, 0) / n
  let num = 0, denA = 0, denB = 0
  for (let i = 0; i < n; i++) {
    const da = a[i] - meanA
    const db = b[i] - meanB
    num  += da * db
    denA += da * da
    denB += db * db
  }
  return num / Math.sqrt(denA * denB + 1e-10)
}

// Accepts both sharp (C#) and flat (Db) spellings
function noteIndex(note) {
  const idx = NOTES.indexOf(note)
  if (idx !== -1) return idx
  return NOTES_FLAT.indexOf(note)
}

// ─── Key Detection ───────────────────────────────────────────────────────────

/**
 * detectTopKeys(noteHistory, n) → top N key candidates sorted by confidence.
 * Each entry: { root, mode, confidence }
 */
export function detectTopKeys(noteHistory, n = 3) {
  if (!noteHistory || noteHistory.length < 8) return []

  const freq = new Array(12).fill(0)
  for (const note of noteHistory) freq[((note % 12) + 12) % 12]++

  const candidates = []
  for (let root = 0; root < 12; root++) {
    const rotated  = Array.from({ length: 12 }, (_, i) => freq[(i + root) % 12])
    const scoreMaj = pearsonCorrelation(rotated, KS_MAJOR)
    const scoreMin = pearsonCorrelation(rotated, KS_MINOR)
    candidates.push({ root: noteName(root), mode: 'major', score: scoreMaj,
      confidence: Math.max(0, Math.min(1, (scoreMaj + 1) / 2)) })
    candidates.push({ root: noteName(root), mode: 'minor', score: scoreMin,
      confidence: Math.max(0, Math.min(1, (scoreMin + 1) / 2)) })
  }

  return candidates.sort((a, b) => b.score - a.score).slice(0, n)
    .map(({ root, mode, confidence }) => ({ root, mode, confidence }))
}

/**
 * detectKey(noteHistory) → { root, mode, confidence }
 * Uses Krumhansl-Schmuckler: correlates pitch-class histogram with key profiles.
 * noteHistory: array of MIDI note numbers or pitch-class integers (0–11)
 */
export function detectKey(noteHistory) {
  if (!noteHistory || noteHistory.length < 4) {
    return { root: 'C', mode: 'major', confidence: 0 }
  }

  const freq = new Array(12).fill(0)
  for (const note of noteHistory) {
    freq[((note % 12) + 12) % 12]++
  }

  let best = { root: 0, mode: 'major', score: -Infinity }

  for (let root = 0; root < 12; root++) {
    const rotated = Array.from({ length: 12 }, (_, i) => freq[(i + root) % 12])
    const scoreMaj = pearsonCorrelation(rotated, KS_MAJOR)
    const scoreMin = pearsonCorrelation(rotated, KS_MINOR)
    if (scoreMaj > best.score) best = { root, mode: 'major', score: scoreMaj }
    if (scoreMin > best.score) best = { root, mode: 'minor', score: scoreMin }
  }

  const confidence = Math.max(0, Math.min(1, (best.score + 1) / 2))
  return { root: noteName(best.root), mode: best.mode, confidence }
}

// ─── Scale helpers ───────────────────────────────────────────────────────────

export function getScale(root, mode) {
  const rootIdx = noteIndex(root)
  if (rootIdx === -1) return []
  return (SCALES[mode] ?? SCALES.major).map(i => noteName(rootIdx + i))
}

// Legacy aliases
export const getFullScale      = (root, mode) => getScale(root, mode)
export const getPentatonicScale = (root, mode) =>
  getScale(root, mode === 'minor' ? 'pentatonic_minor' : 'pentatonic_major')

/**
 * Returns all scale modes that contain every note in playedNotes.
 * Useful for suggesting compatible scales from a detected chord or melody.
 */
export function getCompatibleScales(playedNotes, root) {
  const played = new Set(playedNotes)
  return Object.entries(SCALES)
    .map(([mode]) => ({ mode, label: SCALE_LABELS[mode] ?? mode, notes: getScale(root, mode) }))
    .filter(({ notes }) => [...played].every(n => notes.includes(n)))
}

// ─── Chord helpers ───────────────────────────────────────────────────────────

export function getChordTones(chordName) {
  const match = chordName.match(/^([A-G][b#]?)(.*)$/)
  if (!match) return []
  const root = noteIndex(match[1])
  const suffix = match[2] ?? ''
  const type = Object.values(CHORD_TYPES).find(t => t.suffix === suffix) ?? CHORD_TYPES.maj
  return type.intervals.map(i => noteName(root + i))
}

export function getChordsInKey(root, mode) {
  const rootIdx = noteIndex(root)
  if (rootIdx === -1) return []
  const scale    = SCALES[mode] ?? SCALES.major
  const qualities = DEGREE_QUALITIES[mode] ?? DEGREE_QUALITIES.major
  return scale.map((degree, i) => noteName(rootIdx + degree) + qualities[i])
}

// ─── Jam Guide: derived improv theory (L-01b) ─────────────────────────────────
//
// Three additive, pure helpers that feed the Roadmap Jam Guide. They are
// key-agnostic: chords are described as a pitch class (0–11) + a CHORD_TYPES
// quality key (e.g. 'min7', 'dom7', 'maj7', 'half_dim'), exactly the shape the
// KB progression data already uses (`degrees` + `qualities`). They reuse
// CHORD_TYPES / getChordTones rather than re-deriving intervals.
//
// Chord arg shape: { root, quality } where root is a pitch class 0–11 and
// quality is a CHORD_TYPES key. This matches the KB station model
// ({ degrees[i], qualities[i] }) so a caller maps a station to a chord with no
// string parsing.

// Internal: resolve a chord's pitch-class tone set from a CHORD_TYPES key.
// Returns the intervals mapped to absolute pitch classes, preserving the
// CHORD_TYPES interval order (index 0 = root, 1 = 3rd, last = 7th when present).
function chordTonePcs(rootPc, quality) {
  const type = CHORD_TYPES[quality] ?? CHORD_TYPES.maj
  const r = ((rootPc % 12) + 12) % 12
  return type.intervals.map(i => (r + i) % 12)
}

/**
 * guideTones(rootPc, quality) → { third, seventh, root }
 *
 * The guide tones a soloist targets: a chord's 3rd and 7th. Index 1 in every
 * CHORD_TYPES interval set is the 3rd. A chord has a TRUE 7th only if its
 * interval set contains 10 (m7) or 11 (M7) — NOT merely if it has 4 tones.
 * When there is no real 7th (triads, and 4-tone non-7th chords like add9
 * [0,2,4,7] or maj6/min6 [0,4,7,9]) we fall back to the 5th as the secondary
 * anchor and flag `hasSeventh: false` so a caller labels it honestly ("5th",
 * not "7th"). dim/dim7/aug have no perfect 5th, so they anchor on their ♭5/#5.
 *
 * Returns pitch classes (0–11) so the Roadmap TARGET lane can place dots in any
 * key. `root` is included as the third anchor the design's badges reference.
 *
 * Sanity (C): guideTones(0,'maj7') → third 4 (E), seventh 11 (B), hasSeventh:true.
 *             guideTones(7,'dom7') → third 11 (B), seventh 5 (F), hasSeventh:true.
 *             guideTones(2,'min7') → third 5 (F), seventh 0 (C), hasSeventh:true.
 *             guideTones(0,'add9') → third 4 (E), seventh 7 (G=5th), hasSeventh:false.
 *             guideTones(0,'maj6') / (0,'min6') → seventh 7 (G=5th), hasSeventh:false.
 */
export function guideTones(rootPc, quality) {
  const type   = CHORD_TYPES[quality] ?? CHORD_TYPES.maj
  const r      = ((rootPc % 12) + 12) % 12
  const ints   = type.intervals
  const third  = (r + ints[1]) % 12                      // index 1 is always the 3rd
  // A chord has a TRUE 7th only if its interval set contains 10 (m7) or 11 (M7).
  // `length >= 4` is wrong: add9 [0,2,4,7] and maj6/min6 [0,4,7,9] are 4-tone
  // chords with NO seventh, so their secondary anchor must fall back to the 5th —
  // never badge a 5th/6th as a "7". (add9 → hasSeventh:false, anchor=5th.)
  const seventhInt = ints.find(i => i === 10 || i === 11)   // m7 / M7
  const hasSeventh = seventhInt !== undefined
  // Secondary anchor: the true 7th when present; otherwise the perfect 5th (7).
  // When no perfect 5th exists either (dim/dim7 carry a ♭5=6, aug carries a #5=8),
  // anchor on whichever altered 5th the chord actually contains.
  const fifthInt = ints.includes(7) ? 7 : ints.includes(6) ? 6 : ints.includes(8) ? 8 : 7
  const seventh = (r + (hasSeventh ? seventhInt : fifthInt)) % 12
  return { third, seventh, root: r, hasSeventh }
}

/**
 * voiceLeadingPairs(chordA, chordB) → [{ from, to, semitones }]
 *
 * The voice-leading rails between two adjacent stations. For each guide tone of
 * chordA (its 3rd and 7th) it finds the nearest tone of chordB (chordB's full
 * tone set) and returns the smallest signed semitone move (negative = falls,
 * positive = rises). Only rails moving ≤2 semitones are kept — that is the
 * "smooth voice leading" band; bigger leaps are not rails. A 0-semitone rail
 * (a held common tone) is kept so the design can draw "B holds → next loop".
 *
 * Each chord is { root, quality } (pitch class + CHORD_TYPES key).
 *
 * Sanity — ii–V–I in C (the gold-standard rails):
 *   Dm7 → G7 : 7th of Dm7 (C=0) → 3rd of G7 (B=11)  ⇒ { from:0,  to:11, semitones:-1 }
 *   G7  → Cmaj7: 7th of G7 (F=5) → 3rd of Cmaj7 (E=4) ⇒ { from:5, to:4,  semitones:-1 }
 * i.e. the classic 7→3 falls a half-step, proving C→B and F→E.
 */
export function voiceLeadingPairs(chordA, chordB) {
  const a = guideTones(chordA.root, chordA.quality)
  const targets = chordTonePcs(chordB.root, chordB.quality)

  // smallest signed interval from pc x to pc y, in range (-6, 6]
  const signedStep = (x, y) => {
    let d = (((y - x) % 12) + 12) % 12
    if (d > 6) d -= 12
    return d
  }

  const rails = []
  for (const from of [a.seventh, a.third]) {        // 7th first (the headline 7→3 rail)
    let best = null
    for (const to of targets) {
      const semitones = signedStep(from, to)
      if (Math.abs(semitones) > 2) continue          // only smooth moves are rails
      if (best === null || Math.abs(semitones) < Math.abs(best.semitones)) {
        best = { from, to, semitones }
      }
    }
    if (best) rails.push(best)
  }
  return rails
}

// Default solo scale per chord quality (used when a KB pack didn't author an
// improv.scales entry for a degree). Maps a CHORD_TYPES key → a SCALES mode.
// 'locrian' is named here even though it isn't in SCALES (the KB references it
// for half-diminished); intervals are provided so a caller never has to look it
// up in SCALES for the half_dim case.
const SOLO_SCALE_BY_QUALITY = {
  maj:      'major',
  maj7:     'major',       // Ionian; packs may upgrade to Lydian via improv.scales
  maj6:     'major',
  add9:     'major',
  dom7:     'mixolydian',
  min:      'dorian',
  min7:     'dorian',
  min6:     'dorian',
  half_dim: 'locrian',
  dim:      'diminished',
  dim7:     'diminished',
  aug:      'whole_tone',
  sus4:     'mixolydian',
  sus2:     'major',
}

// Locrian isn't in SCALES (no diatonic degree uses it); supply its intervals so
// soloScale can return a complete { name, intervals } for half-diminished.
const LOCRIAN_INTERVALS = [0, 1, 3, 5, 6, 8, 10]

/**
 * soloScale(quality, mode) → { name, intervals }
 *
 * The computed default scale to solo over a chord of the given quality — the
 * fallback for packs that didn't author an improv.scales entry. Returns the
 * same shape callers already get from SCALES (a relative interval set) plus its
 * mode `name`, so the Roadmap SCALE lane can label it ("G mixolydian") and the
 * fretboard can offset the intervals against the chord root.
 *
 * `mode` (the song's key mode, e.g. 'major'/'minor') is an optional context
 * hint: a dominant chord in a minor key implies the ♭9 colour, so we nudge
 * dom7 → phrygian dominant there; otherwise it is ignored. This keeps the
 * default sensible without needing per-chord KB data.
 *
 * Sanity: soloScale('dom7')         → { name:'mixolydian', intervals:[0,2,4,5,7,9,10] }
 *         soloScale('min7')         → { name:'dorian',     intervals:[0,2,3,5,7,9,10] }
 *         soloScale('maj7')         → { name:'major',      intervals:[0,2,4,5,7,9,11] }
 *         soloScale('half_dim')     → { name:'locrian',    intervals:[0,1,3,5,6,8,10] }
 *         soloScale('dom7','minor') → phrygian-dominant intervals (♭9 over the V)
 */
export function soloScale(quality, mode) {
  // Dominant in a minor key → Phrygian dominant (the ♭9/♭13 "V of i" sound).
  if (quality === 'dom7' && mode === 'minor') {
    return { name: 'phrygian_dominant', intervals: [0, 1, 4, 5, 7, 8, 10] }
  }
  const name = SOLO_SCALE_BY_QUALITY[quality] ?? 'major'
  const intervals = name === 'locrian'
    ? LOCRIAN_INTERVALS
    : (SCALES[name] ?? SCALES.major)
  return { name, intervals }
}

// ─── Progression suggestions ─────────────────────────────────────────────────

export function getSuggestedProgressions(root, mode) {
  const rootIdx = noteIndex(root)
  if (rootIdx === -1) return []
  const scale    = SCALES[mode] ?? SCALES.major
  const qualities = DEGREE_QUALITIES[mode] ?? DEGREE_QUALITIES.major

  return Object.values(PROGRESSIONS).map(prog => {
    const chords = prog.degrees.map(semitones => {
      const noteIdx   = (rootIdx + semitones) % 12
      const degreeIdx = scale.indexOf(semitones)
      // Chromatic degrees (e.g. bVII in rock) default to major triad
      const quality   = degreeIdx >= 0 ? qualities[degreeIdx] : ''
      return noteName(noteIdx) + quality
    })
    return { genre: prog.name, rn: prog.rn, chords }
  })
}

// ─── Chroma-based chord matching ─────────────────────────────────────────────

/**
 * matchChordFromChroma(chroma, keyInfo, bassPC?, strictDiatonic?, minScore?, minMargin?)
 * chroma: Float32Array[12], normalised 0–1 energy per pitch class.
 * Returns null when no unambiguous winner is found (transition/silence).
 */
export function matchChordFromChroma(
  chroma,
  keyInfo,
  bassPC         = null,
  strictDiatonic = false,
  minScore       = CHORD_MATCH_MIN_SCORE,
  minMargin      = CHORD_MATCH_MIN_MARGIN,
) {
  if (!keyInfo?.root) return null

  const diatonicSet = new Set(getChordsInKey(keyInfo.root, keyInfo.mode))

  let best        = { name: null, score: -Infinity }
  let secondScore = -Infinity

  for (let r = 0; r < 12; r++) {
    for (const typeKey of MATCH_CHORD_TYPES) {
      const type      = CHORD_TYPES[typeKey]
      const chordName = noteName(r) + type.suffix

      if (strictDiatonic && !diatonicSet.has(chordName)) continue

      const tones = new Set(type.intervals.map(i => (r + i) % 12))

      // Skip if root has no meaningful energy — chord without its root is unreliable
      if (chroma[r] < 0.08) continue

      let inEnergy = 0, outEnergy = 0
      for (let pc = 0; pc < 12; pc++) {
        if (pc === r) {
          inEnergy  += chroma[pc] * 1.5  // root weight reduced: 2→1.5 (less root bias)
        } else if (tones.has(pc)) {
          inEnergy  += chroma[pc]
        } else {
          outEnergy += chroma[pc]
        }
      }

      if (inEnergy + outEnergy < 0.05) continue

      // Stricter outEnergy penalty (0.7 vs 0.5) — wrong notes hurt more
      const coverageScore = inEnergy / (inEnergy + outEnergy * 0.7)
      const bassBonus     = bassPC !== null && r === bassPC ? 0.15 : 0
      const diatonicBonus = diatonicSet.has(chordName)     ? 0.15 : 0

      const finalScore = coverageScore + bassBonus + diatonicBonus

      if (finalScore > best.score) {
        secondScore = best.score
        best        = { name: chordName, score: finalScore }
      } else if (finalScore > secondScore) {
        secondScore = finalScore
      }
    }
  }

  return (best.score >= minScore && best.score - secondScore >= minMargin)
    ? best.name
    : null
}

// ─── Roman numeral notation ───────────────────────────────────────────────────

/**
 * Converts a chord name to its Roman numeral relative to a key.
 * Chromatic (borrowed) chords get a flat prefix, e.g. Bb in C major → ♭VII.
 */
export function toRomanNumeral(chordName, keyRoot, keyMode) {
  if (!chordName || !keyRoot) return '?'

  const match = chordName.match(/^([A-G][b#]?)(.*)$/)
  if (!match) return '?'
  const [, root, quality] = match

  const chordRootIdx = noteIndex(root)
  const keyRootIdx   = noteIndex(keyRoot)
  if (chordRootIdx < 0 || keyRootIdx < 0) return '?'

  const semitones = ((chordRootIdx - keyRootIdx) + 12) % 12
  const scale     = SCALES[keyMode] ?? SCALES.major
  const degreeIdx = scale.indexOf(semitones)

  let rn
  if (degreeIdx >= 0) {
    rn = ROMAN_NUMERALS[degreeIdx]
  } else {
    // Chromatic chord: flat the nearest diatonic degree above it
    const nearestAbove = scale.findIndex(d => d > semitones)
    const refDegree    = nearestAbove >= 0 ? nearestAbove : 0
    rn = '♭' + ROMAN_NUMERALS[refDegree]
  }

  const isMinorQuality = /^m(?!aj)/.test(quality) || quality === 'dim' || quality === 'm7b5'
  return isMinorQuality ? rn.toLowerCase() : rn
}

// ─── Repeating progression detection ──────────────────────────────────────────

// True if arr has a "weak period" p < arr.length — i.e. arr[i] === arr[i-p] for
// every i ≥ p, meaning arr is a prefix of some p-periodic infinite sequence.
// This rejects not only exact repetitions ([A,B,A,B], p=2) but also self-overlap
// fragments/rotations of a shorter loop ([A,B,A], p=2; [C,G,Am,F,C], p=4) that
// would otherwise mint ghost candidates out of a short vamp. A genuine loop is
// never weak-periodic: a loop whose tail restates its head would produce an
// adjacent duplicate at the cycle seam, which the window collapse removes.
function hasShorterPeriod(arr) {
  for (let p = 1; p < arr.length; p++) {
    let periodic = true
    for (let i = p; i < arr.length; i++) {
      if (arr[i] !== arr[i - p]) { periodic = false; break }
    }
    if (periodic) return true
  }
  return false
}

// Match one occurrence of `cand` in `win` anchored at `start` (the first chord
// must match exactly), tolerating at most ONE edit per cycle: a substitution
// (one chord misdetected) or an insertion (one foreign chord slipped between two
// loop chords). The remainder after the edit must match exactly. Returns
// { end, matched, editPos } — `matched` = window indices that matched a loop
// chord, `editPos` = window index of the edit (-1 if the occurrence is exact) —
// or null if no match.
function matchLoopOccurrence(win, start, cand) {
  if (win[start] !== cand[0]) return null
  const matched = [start]
  let i = start + 1
  for (let j = 1; j < cand.length; j++) {
    if (i >= win.length) return null
    if (win[i] === cand[j]) { matched.push(i); i++; continue }

    // First mismatch — the single allowed edit. Fork the two readings; each
    // requires the rest of the candidate to match exactly from where it lands.
    const exactFrom = (wi, cj) => {
      const tail = []
      for (; cj < cand.length; cj++, wi++) {
        if (wi >= win.length || win[wi] !== cand[cj]) return null
        tail.push(wi)
      }
      return { end: wi, tail }
    }
    const ins = exactFrom(i + 1, j)     // win[i] is a foreign inserted chord
    const sub = exactFrom(i + 1, j + 1) // win[i] is cand[j] misdetected
    const hit = ins ?? sub              // insertion keeps one more matched chord
    if (!hit) return null
    return { end: hit.end, matched: [...matched, ...hit.tail], editPos: i }
  }
  return { end: i, matched, editPos: -1 }
}

// Returns the lexicographically smallest rotation so the same loop always
// produces the same string regardless of where in the cycle we currently are.
// Exported additively for match.js's seedableLoop / round-trip pool (task L-60,
// jam-roulette.md §3.2) — the seed must canonicalize identically to detection.
export function canonicalize(pattern) {
  let best = pattern
  for (let i = 1; i < pattern.length; i++) {
    const rot = [...pattern.slice(i), ...pattern.slice(0, i)]
    if (rot.join('\0') < best.join('\0')) best = rot
  }
  return best
}

/**
 * detectRepeatingProgression(history) → chord[] or null   (task L-30)
 *
 * Finds the loop the musician is playing NOW in the recent chord history.
 * Candidates are contiguous slices (lengths 2–8) of the last-32 window with
 * consecutive duplicate commits collapsed; candidates that are self-overlaps
 * of a shorter period are rejected (see hasShorterPeriod). Each candidate is
 * scored by recency-weighted COVERAGE: non-overlapping occurrences are counted
 * with at most one substitution or insertion per cycle, every matched chord
 * adds its recency weight, every edit subtracts the weight at the edit slot.
 * Linear coverage (not reps × len²) means a ghost pattern straddling noise can
 * never outscore the true loop, and exponential recency decay means the current
 * section outscores a longer stale one. Requires ≥2 EXACT occurrences: an
 * edit-tolerant occurrence corroborates a loop but cannot establish it — a
 * loop means the sequence came back exactly, and a ghost slice that absorbs a
 * noise chord into itself rarely recurs exactly (only phase-locked corruption
 * of the same slot by the same chord can make one recur — and such data is
 * genuinely periodic at that longer length). Returns the canonical
 * (rotation-normalised) best pattern.
 */
export function detectRepeatingProgression(history) {
  if (!history || history.length < 6) return null

  // Collapse consecutive duplicate commits — a chord re-committed back-to-back
  // is the same loop slot, not two. Non-adjacent repeats (e.g. Em … Em inside a
  // 7-chord form) are meaningful and untouched.
  const raw = history.slice(-32)
  const win = raw.filter((c, i) => i === 0 || c !== raw[i - 1])
  const n = win.length
  if (n < 4) return null // shortest loop (2 chords) × 2 reps

  // Recency weight per window slot: newest chord weighs 1, each step back
  // decays by 0.9 (half-life ≈ 6.6 chords).
  const RECENCY = 0.9
  const weight = Array.from({ length: n }, (_, i) => RECENCY ** (n - 1 - i))

  let best = null
  let bestScore = 0

  for (let len = 2; len <= 8; len++) {
    if (len * 2 > n) break
    const seen = new Set()

    for (let start = 0; start <= n - len; start++) {
      const candidate = win.slice(start, start + len)
      const key = candidate.join('\0')
      if (seen.has(key)) continue
      seen.add(key)

      if (hasShorterPeriod(candidate)) continue

      let exactOccurrences = 0
      let score = 0
      let i = 0
      while (i < n) {
        const occ = matchLoopOccurrence(win, i, candidate)
        // A 2-chord candidate may not take a substitution (1 matched chord is
        // no evidence); insertions keep matched === len and stay allowed.
        if (occ && occ.matched.length >= 2) {
          if (occ.editPos < 0) exactOccurrences++
          for (const p of occ.matched) score += weight[p]
          if (occ.editPos >= 0) score -= weight[occ.editPos]
          i = occ.end
        } else {
          i++
        }
      }

      if (exactOccurrences < 2) continue // implies occurrences ≥ 2

      if (score > bestScore) {
        bestScore = score
        best = candidate
      }
    }
  }

  return best ? canonicalize(best) : null
}

// ─── Debug / analysis helpers ─────────────────────────────────────────────────

/**
 * Returns top N chord candidates with full score breakdown for the given chroma.
 */
export function getChordCandidates(chroma, keyInfo, bassPC = null, topN = 8) {
  if (!keyInfo?.root || !chroma) return []
  const diatonicSet = new Set(getChordsInKey(keyInfo.root, keyInfo.mode))
  const candidates  = []

  for (let r = 0; r < 12; r++) {
    for (const typeKey of MATCH_CHORD_TYPES) {
      const type      = CHORD_TYPES[typeKey]
      const chordName = noteName(r) + type.suffix
      const tones     = new Set(type.intervals.map(i => (r + i) % 12))

      let inEnergy = 0, outEnergy = 0
      for (let pc = 0; pc < 12; pc++) {
        if      (pc === r)        inEnergy  += chroma[pc] * 2
        else if (tones.has(pc))   inEnergy  += chroma[pc]
        else                      outEnergy += chroma[pc]
      }
      if (inEnergy + outEnergy < 0.05) continue

      const coverage     = inEnergy / (inEnergy + outEnergy * 0.5)
      const bassBonus    = bassPC !== null && r === bassPC ? 0.15 : 0
      const diatBonus    = diatonicSet.has(chordName) ? 0.15 : 0
      const score        = coverage + bassBonus + diatBonus
      candidates.push({ name: chordName, score, coverage, bassBonus, diatBonus, diatonic: diatonicSet.has(chordName) })
    }
  }
  return candidates.sort((a, b) => b.score - a.score).slice(0, topN)
}

/**
 * Analyses note history: returns normalised pitch-class frequencies and
 * top K-S key candidates with correlation scores.
 */
export function getNoteHistoryAnalysis(noteHistory) {
  const freq = new Array(12).fill(0)
  if (!noteHistory?.length) return { freq, topKeys: [] }

  for (const note of noteHistory) freq[((note % 12) + 12) % 12]++
  const total      = noteHistory.length
  const normalized = freq.map(f => f / total)

  const candidates = []
  for (let root = 0; root < 12; root++) {
    const rotated = Array.from({ length: 12 }, (_, i) => normalized[(i + root) % 12])
    candidates.push({ root: noteName(root), mode: 'major', score: pearsonCorrelation(rotated, KS_MAJOR) })
    candidates.push({ root: noteName(root), mode: 'minor', score: pearsonCorrelation(rotated, KS_MINOR) })
  }
  return {
    freq:    normalized,
    total,
    topKeys: candidates.sort((a, b) => b.score - a.score).slice(0, 5),
  }
}

// ─── Utilities ───────────────────────────────────────────────────────────────

export function intervalName(semitones) {
  const names = [
    'Unison', 'Minor 2nd', 'Major 2nd', 'Minor 3rd', 'Major 3rd',
    'Perfect 4th', 'Tritone', 'Perfect 5th', 'Minor 6th',
    'Major 6th', 'Minor 7th', 'Major 7th',
  ]
  return names[((semitones % 12) + 12) % 12] ?? 'Unknown'
}

export function transposeChord(chordName, semitones) {
  const match = chordName.match(/^([A-G][b#]?)(.*)$/)
  if (!match) return chordName
  return noteName(noteIndex(match[1]) + semitones) + match[2]
}

export function transposeProgression(chords, semitones) {
  return chords.map(c => transposeChord(c, semitones))
}

// ─── "Try this" — key-aware substitution nudge (task L-73) ────────────────────
//
// Curated, learnable chord-substitution engine for the Jam Guide dashboard.
// Spec: docs/design/try-this-subs.md §2 (the 4 category rules) + §3 (the worked
// Am–C–F truth-tables). For the chord under the playhead, in the detected key,
// returns up to 4 alternatives — each with one plain sentence that teaches WHY
// it works. This is NOT the context-free colour-swap grid in education.js; this
// one is key-aware and changes the root (relative / secondary dominant).
//
// All-in-module: reuses NOTES, NOTES_FLAT, noteName, noteIndex, CHORD_TYPES,
// getChordsInKey, getScale, intervalName, toRomanNumeral, chordTonePcs. It does
// NOT import match.js's chordRootPC (that would be circular) — it uses theory's
// own noteIndex(keyInfo.root) for the key root pc.

// Chord-quality families the rules branch on.
const SUB_MAJOR_FAMILY = ['maj', 'maj7', 'maj6', 'add9']
const SUB_MINOR_FAMILY = ['min', 'min7', 'min6']
// Key modes with a major tonic ("major-ish") — the only readings under which the
// borrowed-iv (Rule B) is honest. A minor/dorian/phrygian reading suppresses it.
const SUB_MAJORISH_MODES = ['major', 'lydian', 'mixolydian']

// Scale-degree vocabulary for the extension why-copy ("E is C's 3rd (the mediant)").
const DEGREE_ORDINALS = ['root', '2nd', '3rd', '4th', '5th', '6th', '7th']
const DEGREE_NAMES    = ['tonic', 'supertonic', 'mediant', 'subdominant', 'dominant', 'submediant', 'leading tone']

// Name a pitch class by its scale degree in the key, e.g. "3rd (the mediant)".
// Returns null if the pc is not diatonic (Rule C never calls it off-scale).
function subDegreeWord(pc, keyRootPc, mode) {
  const scale = SCALES[mode] ?? SCALES.major
  const semi  = ((((pc - keyRootPc) % 12) + 12) % 12)
  const idx   = scale.indexOf(semi)
  if (idx < 0) return null
  return `${DEGREE_ORDINALS[idx]} (the ${DEGREE_NAMES[idx]})`
}

/**
 * suggestSubstitutions({ rootPc, quality }, keyInfo, opts = {})
 *   → [{ rootPc, quality, label, why, category }]
 *
 * Categories, always in this order (softest → boldest), capped at 4:
 *   relative · borrowed · extension · secondary_dominant
 * Returns [] when there is no key (`!keyInfo?.root`) — the UI shows an idle line.
 *
 * `label = NOTES[rootPc] + CHORD_TYPES[quality].suffix`. `opts.nextRootPc` (the
 * next loop station's root pc) gates Rule D. See docs/design/try-this-subs.md §2.
 *
 * Sanity (Am–C–F loop, §3):
 *   F/maj (5) in A minor, next Am (9) → [Dm(rel), Fmaj7(ext), E7(2nd-dom)]  (no Fm)
 *   F/maj (5) in C major, next Am (9) → [Dm, Fm(borrowed), Fmaj7, E7]        (cap 4)
 *   Am/min(9) → next C (0): Rule D = G7 ;  C/maj(0) → next F (5): Rule D = C7
 */
export function suggestSubstitutions({ rootPc, quality } = {}, keyInfo, opts = {}) {
  if (!keyInfo?.root) return []
  const keyRootPc = noteIndex(keyInfo.root)
  if (keyRootPc < 0 || rootPc == null || quality == null) return []

  const mode      = keyInfo.mode ?? 'major'
  const r         = ((rootPc % 12) + 12) % 12
  const origLabel = NOTES[r] + (CHORD_TYPES[quality]?.suffix ?? '')
  const isMajorFam = SUB_MAJOR_FAMILY.includes(quality)
  const isMinorFam = SUB_MINOR_FAMILY.includes(quality)

  // Diatonic chord-name set + scale pitch-class set for the gates.
  const diatonic = new Set(getChordsInKey(keyInfo.root, mode))
  const scaleInts = SCALES[mode] ?? SCALES.major
  const scalePcs  = new Set(scaleInts.map(i => (keyRootPc + i) % 12))

  const mk = (candRootPc, candQuality, why, category) => {
    const pc = ((candRootPc % 12) + 12) % 12
    return {
      rootPc: pc,
      quality: candQuality,
      label: NOTES[pc] + (CHORD_TYPES[candQuality]?.suffix ?? ''),
      why,
      category,
    }
  }

  const out = []

  // ── Rule A — relative / diatonic-third sub (softest). Circle: inner ring. ──
  // major-family → relative minor (root+9); minor-family → relative major (root+3).
  // Emit only if the candidate is diatonic in the key.
  {
    let candRootPc = null, candQuality = null
    if (isMajorFam)      { candRootPc = (r + 9) % 12; candQuality = 'min' }
    else if (isMinorFam) { candRootPc = (r + 3) % 12; candQuality = 'maj' }
    if (candRootPc !== null) {
      const label = NOTES[candRootPc] + (CHORD_TYPES[candQuality].suffix)
      if (diatonic.has(label)) {
        // Shared tones = intersection of the two triads (root & 3rd of the original).
        const origTones = new Set(chordTonePcs(r, quality))
        const shared    = chordTonePcs(candRootPc, candQuality).filter(t => origTones.has(t))
        const sharedNames = shared.map(t => noteName(t)).join(' & ')
        const relWord = isMajorFam ? 'minor' : 'major'
        const pull    = isMajorFam ? 'softer' : 'brighter'
        const rn      = toRomanNumeral(label, keyInfo.root, mode)
        out.push(mk(candRootPc, candQuality,
          `${label} is ${origLabel}'s relative ${relWord} — shares ${sharedNames}. `
          + `In this key it's the ${rn}: a ${pull} pull, same family. `
          + `(Circle: its inner-ring relative.)`,
          'relative'))
      }
    }
  }

  // ── Rule B — borrowed iv (the "Creep" move), conditional. NOT a circle step. ──
  // Only under a major-ish reading, on the IV (root === keyRoot+5), major-family.
  if (isMajorFam && SUB_MAJORISH_MODES.includes(mode) && r === (keyRootPc + 5) % 12) {
    const n6  = noteName(keyRootPc + 9)            // natural 6th of the key
    const nb6 = noteName(keyRootPc + 8, true)      // ♭6 — spelled FLAT (A→A♭, never G#)
    out.push(mk(r, 'min',
      `Borrow ${NOTES[r]}m (the iv) from the parallel minor — ${n6}→${nb6} adds that `
      + `wistful pull home. The 'Creep' move.`,
      'borrowed'))
  }

  // ── Rule C — extension / colour (same function, one diatonic colour tone). ──
  // Vertical colour, NOT a circle step. Pick the first extension whose added tone
  // is diatonic; omit the category if none qualifies.
  //
  // Two guards keep the suggestion an honest ALTERNATIVE, not the chord already
  // sounding (the common case — jazz stations are min7/maj7/dom7):
  //   (a) skip any candidate whose quality === the input quality — the chord
  //       already carries that colour (a min7 input never re-emits min7).
  //   (b) minor-family offers ONLY min7. CHORD_TYPES.add9 = [0,2,4,7] is a MAJOR
  //       add9 (interval 4 = major 3rd), so applying it to a minor chord would
  //       raise the 3rd (Dm → D, F♮→F♯) = a wrong-note suggestion. Never do it.
  {
    let opts2 = null
    if (isMajorFam)          opts2 = [['maj7', 11], ['add9', 2], ['maj6', 9]]
    else if (isMinorFam)     opts2 = [['min7', 10]]
    else if (quality === 'dom7') opts2 = [['sus4', 5]]
    if (opts2) {
      const pick = opts2.find(([q, interval]) =>
        q !== quality && scalePcs.has((r + interval) % 12))
      if (pick) {
        const [extQuality, interval] = pick
        const addedPc   = (r + interval) % 12
        const addedNote = noteName(addedPc)
        const rn        = toRomanNumeral(origLabel, keyInfo.root, mode)
        const dw        = subDegreeWord(addedPc, keyRootPc, mode)
        out.push(mk(r, extQuality,
          `Add the ${intervalName(interval).toLowerCase()} (${addedNote}) — same ${rn}, lusher. `
          + `${addedNote} is ${keyInfo.root}'s own ${dw}, so it stays in the family.`,
          'extension'))
      }
    }
  }

  // ── Rule D — secondary dominant of the next chord (boldest). Circle move. ──
  // V7 of the next loop chord = (nextRootPc+7) dom7. Requires a known next chord;
  // omit when the candidate is the identical chord already sounding.
  if (opts.nextRootPc != null) {
    const nextPc     = ((opts.nextRootPc % 12) + 12) % 12
    const candRootPc = (nextPc + 7) % 12
    const isSameChord = candRootPc === r && quality === 'dom7'
    if (!isSameChord) {
      const leadingTone = noteName(candRootPc + 4)   // dom7's 3rd = ascending leading tone (SHARP)
      const nextName    = noteName(nextPc)
      out.push(mk(candRootPc, 'dom7',
        `Swap for ${NOTES[candRootPc]}7, the V7 of ${nextName} — its 3rd (${leadingTone}) leans `
        + `a half-step into ${nextName}, pulling the loop around. One step clockwise on the circle.`,
        'secondary_dominant'))
    }
  }

  return out.slice(0, 4)
}
