// KB quality gate — validates src/data/kb/ against the contract in src/data/kb/SCHEMA.md.
// Run: node scripts/validate-kb.mjs   (exit 1 on any error)
//
// Lib mode: scripts/smoke.mjs imports this file with KB_VALIDATE_AS_LIB=1 set to
// reuse the exported pure checks (checkLick, checkPianoRecipe, checkBassPlay,
// checkPianoLick, LEVELS, LICK_TECHNIQUES, PIANO_LICK_TECHNIQUES,
// PIANO_LICK_APPROACHES, PIANO_LICK_MAX_OFFSET, MAX_HAND_SPAN, MIN_PLAYS_BASS,
// BASS_APPROACHES, BASS_MAX_OFFSET) against in-memory fixtures — same logic,
// no copy. When the env var is absent the script runs the full KB validation
// as before.
import { readdirSync, existsSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'
import { CHORD_TYPES } from '../src/lib/theory.js'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const KB = join(ROOT, 'src', 'data', 'kb')

const MODES = ['major', 'minor', 'dorian', 'phrygian', 'lydian', 'mixolydian']
const OPEN_PC = [4, 9, 2, 7, 11, 4] // EADGBe low-E first
const PERFECT_FIFTH = 7
const MIN_PROGRESSIONS = 4
const MIN_PLAYS = 2
// Bass floor is 1, not 2 (SCHEMA.md "Bass play"): the band wants one bassline
// at a time, and rule 4's "idiomatically different" bar invites filler at 2.
export const MIN_PLAYS_BASS = 1
const MAX_SPAN = 4

// Optional progression/lick difficulty tags (SCHEMA.md — absent = 'foundation').
export const LEVELS = ['foundation', 'intermediate']
// Fixed technique vocabulary for licks — both the techniques[] summary and each
// tab note's optional technique must come from this list (SCHEMA.md).
export const LICK_TECHNIQUES = [
  'hammer-on', 'pull-off', 'slide', 'bend',
  'double-stop', 'ghost-note', 'chromatic-approach', 'vibrato',
]
const LICK_MAX_FRET = 15

const errors = []
const err = (where, msg) => errors.push(`${where}: ${msg}`)

// Resolve a degree string ('3', 'b9', '13'…) to a pitch class relative to the
// chord root, through the quality's intervals where the degree is quality-dependent.
function resolveDegree(deg, quality) {
  const iv = CHORD_TYPES[quality].intervals
  const fixed = { 1: 0, b9: 1, 9: 2, '#9': 3, 11: 5, '#11': 6, b5: 6, b13: 8, 13: 9, 6: 9, b3: 3, b7: 10 }
  if (deg === '3') return iv.find(i => i === 3 || i === 4) ?? iv.find(i => i === 2 || i === 5) ?? null
  if (deg === '5') return iv.find(i => i === 6 || i === 7 || i === 8) ?? null
  if (deg === '7') return iv.find(i => i === 9 || i === 10 || i === 11) ?? null
  return fixed[deg] ?? null
}

function checkGuitarShape(where, chordStep, quality) {
  const { shape, extensions = [] } = chordStep
  if (!shape) return err(where, 'missing shape')
  const strings = shape.offsets ?? shape.frets
  if (!Array.isArray(strings) || strings.length !== 6)
    return err(where, 'offsets/frets must be an array of 6 (low E first)')
  const isMovable = !!shape.offsets

  if (isMovable) {
    if (!(shape.rootStr >= 1 && shape.rootStr <= 6)) return err(where, `bad rootStr ${shape.rootStr}`)
    if (strings[6 - shape.rootStr] !== 0) return err(where, 'offset on the root string must be 0')
  } else {
    if (!(shape.onlyRoot >= 0 && shape.onlyRoot <= 11)) return err(where, 'open shape needs onlyRoot (pc 0-11)')
  }

  const fretted = strings.filter(f => f !== 'x')
  if (fretted.some(f => !Number.isInteger(f) || f < -2 || f > 15))
    return err(where, `bad fret values: ${JSON.stringify(strings)}`)
  const nonOpen = fretted.filter(f => f !== 0)
  if (nonOpen.length && Math.max(...nonOpen) - Math.min(...nonOpen) > MAX_SPAN)
    return err(where, `fret span > ${MAX_SPAN} — not intermediate-friendly`)

  // Pitch-class verification: every sounded note must belong to the chord
  // (quality intervals + declared extensions); defining tones must be present.
  const iv = CHORD_TYPES[quality].intervals
  const allowed = new Set(iv)
  for (const ext of extensions) {
    const pc = resolveDegree(ext, quality)
    if (pc === null) return err(where, `unresolvable extension '${ext}' for ${quality}`)
    allowed.add(pc)
  }
  const rootRel = isMovable ? (12 - OPEN_PC[6 - shape.rootStr]) % 12 : null
  const sounded = new Set()
  strings.forEach((f, i) => {
    if (f === 'x') return
    const pc = isMovable
      ? (OPEN_PC[i] + rootRel + f + 24) % 12
      : (OPEN_PC[i] + f - shape.onlyRoot + 24) % 12
    sounded.add(pc)
  })
  for (const pc of sounded)
    if (!allowed.has(pc)) return err(where, `sounded pc ${pc} is not in ${quality} (+ext) — shape misspells the chord`)
  const required = iv.filter(i =>
    i !== PERFECT_FIFTH
    && !(chordStep.rootless && i === 0)
    && !(chordStep.omit3 && (i === 3 || i === 4)))
  for (const pc of required)
    if (!sounded.has(pc)) return err(where, `defining tone pc ${pc} of ${quality} missing from shape`)
}

// Piano hand-span rule (SCHEMA.md rule 3: "one hand per recipe stays within a
// 10th"). Enforced as ≤ 15 semitones — a minor 10th, the widest reading of
// "a 10th" — so the hand-verified 14-semitone ø11 rootless voicing in
// jazz/piano.js (P-22) stays legal while anything wider fails. Task C-22.
export const MAX_HAND_SPAN = 15

// Resolve one hand's degree list to stacked absolute semitone offsets per the
// documented convention (src/data/kb/jazz/piano.js header, ~line 14): order
// inside a hand = voicing order low→high, each note placed in the nearest
// position strictly above the previous (a repeated pitch class = octave up).
// Returns null if any degree is unresolvable (reported separately by caller).
function stackHand(degs, quality) {
  const notes = []
  for (const d of degs) {
    const pc = resolveDegree(d, quality)
    if (pc === null) return null
    if (!notes.length) { notes.push(pc); continue }
    const prev = notes[notes.length - 1]
    const step = (pc - (prev % 12) + 12) % 12
    notes.push(prev + (step === 0 ? 12 : step))
  }
  return notes
}

// Pure piano-recipe validation. Returns an array of where-prefixed error
// strings (empty = valid). Exported for reuse by scripts/smoke.mjs (lib mode).
export function checkPianoRecipe(where, chordStep, quality) {
  const out = []
  const e = (msg) => out.push(`${where}: ${msg}`)
  if (!CHORD_TYPES[quality]) { e(`unknown quality '${quality}'`); return out }
  const { recipe } = chordStep
  if (!recipe) { e('missing recipe'); return out }
  for (const hand of ['LH', 'RH']) {
    const degs = recipe[hand]
    if (degs === undefined) continue
    if (!Array.isArray(degs) || !degs.length) { e(`${hand} must be a non-empty array`); continue }
    if (degs.length > 5) e(`${hand} has ${degs.length} notes — one hand, max 5`)
    for (const d of degs)
      if (resolveDegree(d, quality) === null) e(`unresolvable degree '${d}' for ${quality}`)
    const stacked = stackHand(degs, quality)
    if (stacked === null) continue // unresolvable degree already reported
    const span = stacked[stacked.length - 1] - stacked[0]
    if (span > MAX_HAND_SPAN)
      e(`${hand} [${degs.join(' ')}] spans ${span} semitones stacked low→high — max ${MAX_HAND_SPAN} (a minor 10th; SCHEMA rule 3, one hand within a 10th)`)
  }
  if (recipe.LH === undefined && recipe.RH === undefined) e('recipe needs LH and/or RH')
  return out
}

// ── Bass plays (SCHEMA.md "Bass play") ────────────────────────────────────────
// Degree-based per-station patterns: one chords[] entry per progression step,
// each a non-empty ORDERED pattern of {deg,…} chord/color tones (resolved
// through the step's quality — a degree can't misspell a pitch class) and
// typed {approach,…} notes whose pitch is DERIVED from the next station's
// root, so the validator can allow the non-chord tone without blessing
// arbitrary chromatics. Data never encodes strings/frets (key-agnostic,
// hard rule 1); the renderer places patterns on E–A–D–G, frets 0–15.
export const BASS_APPROACHES = ['chrom-below', 'chrom-above', 'fifth-of-next']
// Widest legal offset above the root: an octave + a fifth keeps every pattern
// placeable on E–A–D–G within frets 0–15 in one position.
export const BASS_MAX_OFFSET = 19
const BASS_BEATS_PER_BAR = 4      // patterns are notated in 4 — 12/8 is `feel`
const BASS_MAX_NOTES_PER_BAR = 8  // straight-8ths density cap (rule 3)

// Pure bass-play validation. Returns an array of where-prefixed error strings
// (empty = valid). Exported for reuse by scripts/smoke.mjs (lib mode).
export function checkBassPlay(where, play, prog) {
  const out = []
  const e = (msg) => out.push(`${where}: ${msg}`)
  if (typeof play.feel !== 'string' || !play.feel)
    e("feel required — the groove in one line (e.g. 'swung 8ths, locked with the kick')")
  if (play.level !== undefined && !LEVELS.includes(play.level))
    e(`level must be one of ${LEVELS.join(' | ')}, got '${play.level}'`)
  if (!Array.isArray(play.chords) || play.chords.length !== prog.degrees.length) {
    e(`chords length ${play.chords?.length} ≠ progression length ${prog.degrees.length}`)
    return out
  }
  play.chords.forEach((step, ci) => {
    const cw = `chord[${ci}] (${prog.rn?.[ci] ?? ci})`
    const quality = prog.qualities[ci]
    if (!CHORD_TYPES[quality]) return e(`${cw}: unknown quality '${quality}'`)
    const bars = prog.bars?.[ci] ?? 1
    const pat = step?.pattern
    if (!Array.isArray(pat) || !pat.length)
      return e(`${cw}: pattern must be a non-empty ordered array of notes`)
    if (pat.length > BASS_MAX_NOTES_PER_BAR * bars)
      e(`${cw}: ${pat.length} notes > ${BASS_MAX_NOTES_PER_BAR * bars} (8ths density cap over ${bars} bar(s)) — not intermediate-friendly`)
    let approachSeen = false
    let rootSeen = false
    let lastBeat = -Infinity
    pat.forEach((n, ni) => {
      const nw = `${cw} pattern[${ni}]`
      if (!n || typeof n !== 'object') return e(`${nw}: note must be an object ({deg,…} or {approach,…})`)
      const isDeg = n.deg !== undefined
      const isApproach = n.approach !== undefined
      if (isDeg === isApproach) return e(`${nw}: exactly one of deg | approach per note`)
      if (isApproach) {
        approachSeen = true
        if (!BASS_APPROACHES.includes(n.approach))
          e(`${nw}: unknown approach '${n.approach}' — allowed: ${BASS_APPROACHES.join(', ')}`)
        if (n.octave !== undefined)
          e(`${nw}: octave applies to deg notes only (the renderer places approaches beside the next root)`)
      } else {
        if (approachSeen)
          e(`${nw}: deg note after an approach — approach notes must close the pattern (they lead into the next chord)`)
        if (typeof n.deg !== 'string') {
          e(`${nw}: deg must be a degree STRING ('1', 'b7', …), got ${JSON.stringify(n.deg)}`)
        } else {
          const pc = resolveDegree(n.deg, quality)
          if (pc === null) e(`${nw}: unresolvable degree '${n.deg}' for ${quality}`)
          if (n.deg === '1') rootSeen = true
          if (n.octave !== undefined && n.octave !== 0 && n.octave !== 1)
            e(`${nw}: octave, when present, must be 0 or 1 — got ${JSON.stringify(n.octave)}`)
          else if (pc !== null && pc + 12 * (n.octave === 1 ? 1 : 0) > BASS_MAX_OFFSET)
            e(`${nw}: '${n.deg}' octave ${n.octave} sits ${pc + 12} semitones above the root — max ${BASS_MAX_OFFSET} (an octave + a fifth; keeps the pattern in one position on E–A–D–G)`)
        }
      }
      if (n.technique !== undefined && !LICK_TECHNIQUES.includes(n.technique))
        e(`${nw}: unknown technique '${n.technique}' — allowed: ${LICK_TECHNIQUES.join(', ')}`)
      if (n.beat !== undefined) {
        const maxBeat = BASS_BEATS_PER_BAR * bars
        if (typeof n.beat !== 'number' || !(n.beat >= 1 && n.beat < maxBeat + 1))
          e(`${nw}: beat must be a number in [1, ${maxBeat + 1}) for a ${bars}-bar step, got ${JSON.stringify(n.beat)}`)
        else if (n.beat < lastBeat)
          e(`${nw}: beat ${n.beat} < previous beat ${lastBeat} — beats must be non-decreasing in pattern order`)
        else lastBeat = n.beat
      }
    })
    if (!rootSeen)
      e(`${cw}: pattern never states the root ('1') — a bassline grounds the chord (SCHEMA "Bass play" root rule)`)
  })
  return out
}

// Pure lick validation (SCHEMA.md "Licks" section). Returns an array of error
// strings (already where-prefixed); mutates seenIds by adding the lick's id so
// ids stay globally unique across ALL progressions and licks (same rule as
// progression ids). Exported for reuse by scripts/smoke.mjs.
export function checkLick(where, lick, style, seenIds) {
  const out = []
  const e = (msg) => out.push(`${where}: ${msg}`)
  if (!lick || typeof lick !== 'object') { e('lick must be an object'); return out }
  if (typeof lick.id !== 'string' || !lick.id.startsWith(`${style}-`))
    e(`id must be a string starting with '${style}-'`)
  else if (seenIds.has(lick.id)) e(`duplicate id '${lick.id}' (ids are global across progressions AND licks)`)
  else seenIds.add(lick.id)
  if (!lick.name) e('name missing')
  if (!LEVELS.includes(lick.level)) e(`level must be one of ${LEVELS.join(' | ')}, got '${lick.level}'`)
  if (typeof lick.chordContext !== 'string' || !lick.chordContext)
    e("chordContext missing (which chord/station the lick fits, e.g. 'dom7' or 'over the I7')")
  const summary = new Set()
  if (!Array.isArray(lick.techniques)) e('techniques must be an array (may be empty for a plain-picked lick)')
  else for (const t of lick.techniques) {
    if (!LICK_TECHNIQUES.includes(t)) e(`unknown technique '${t}' — allowed: ${LICK_TECHNIQUES.join(', ')}`)
    summary.add(t)
  }
  if (!Array.isArray(lick.tab) || !lick.tab.length) { e('tab must be a non-empty ordered array of notes'); return out }
  lick.tab.forEach((note, i) => {
    const nw = `tab[${i}]`
    if (!note || typeof note !== 'object') return e(`${nw} must be an object {string, fret, technique?}`)
    if (!Number.isInteger(note.string) || note.string < 1 || note.string > 6)
      e(`${nw} string must be an integer 1–6 (1 = high e, 6 = low E), got ${JSON.stringify(note.string)}`)
    if (!Number.isInteger(note.fret) || note.fret < 0 || note.fret > LICK_MAX_FRET)
      e(`${nw} fret must be an integer 0–${LICK_MAX_FRET}, got ${JSON.stringify(note.fret)}`)
    if (note.technique !== undefined) {
      if (!LICK_TECHNIQUES.includes(note.technique))
        e(`${nw} unknown technique '${note.technique}' — allowed: ${LICK_TECHNIQUES.join(', ')}`)
      else if (!summary.has(note.technique))
        e(`${nw} technique '${note.technique}' must also appear in the lick's techniques[] summary`)
    }
  })
  return out
}

// ── Piano licks (SCHEMA.md "Piano licks") ────────────────────────────────────
// Degree-based melodic phrases over ONE explicit quality (guitar tab is
// instrument-truth and needs no quality; degrees need a context to resolve
// through — chordContext stays the human sentence, `quality` is the machine
// truth). Approaches are typed and DERIVED: each targets the next deg note in
// the lick (there is no "next station" inside a self-contained lick), so the
// validator can allow the non-chord tone without blessing arbitrary
// chromatics — and an approach can never close a lick (nothing to target).
//
// Piano technique vocabulary — deliberately NOT LICK_TECHNIQUES: keys don't
// bend, hammer, pull off, or sustain vibrato; chromatic-approach is redundant
// (approaches are typed notes here). The three shared words keep their
// guitar-lick meanings; grace-note (the crushed blues/gospel ornament) is
// piano-specific. smoke.mjs guards both lists' consistency.
export const PIANO_LICK_TECHNIQUES = ['slide', 'double-stop', 'ghost-note', 'grace-note']
export const PIANO_LICK_APPROACHES = ['chrom-below', 'chrom-above']
// Range cap on every RESOLVED offset (deg: pc + 12·octave; approach: derived):
// [0, 25] semitones above the root. Proof against MiniPiano's render window
// (absolute notes [0, 36], 0 = low C): place the root at its pitch class in
// the bottom octave (0–11); the highest possible note is then 11 + 25 = 36 —
// exactly the window's top key — so every legal lick fits in all 12 keys.
export const PIANO_LICK_MAX_OFFSET = 25
const PIANO_LICK_MAX_NOTES = 16      // 8ths over the 2-bar beat window (rule 3)
const PIANO_LICK_MAX_BEAT = 9        // exclusive: 1 ≤ beat < 9 (two 4/4 bars)

// Pure piano-lick validation. Returns an array of where-prefixed error strings
// (empty = valid); mutates seenIds like checkLick (shared global id
// namespace). Exported for reuse by scripts/smoke.mjs (lib mode).
export function checkPianoLick(where, lick, style, seenIds) {
  const out = []
  const e = (msg) => out.push(`${where}: ${msg}`)
  if (!lick || typeof lick !== 'object') { e('lick must be an object'); return out }
  if (typeof lick.id !== 'string' || !lick.id.startsWith(`${style}-`))
    e(`id must be a string starting with '${style}-'`)
  else if (seenIds.has(lick.id)) e(`duplicate id '${lick.id}' (ids are global across progressions AND licks)`)
  else seenIds.add(lick.id)
  if (!lick.name) e('name missing')
  if (!LEVELS.includes(lick.level)) e(`level must be one of ${LEVELS.join(' | ')}, got '${lick.level}'`)
  if (typeof lick.chordContext !== 'string' || !lick.chordContext)
    e("chordContext missing (which chord/station the lick fits, e.g. 'over the ii7')")
  const quality = lick.quality
  if (!CHORD_TYPES[quality]) {
    e(`quality must be a CHORD_TYPES key (the context every deg resolves through), got '${quality}'`)
    return out // nothing below is checkable without a quality
  }
  const summary = new Set()
  if (!Array.isArray(lick.techniques)) e('techniques must be an array (may be empty for a plain lick)')
  else for (const t of lick.techniques) {
    if (!PIANO_LICK_TECHNIQUES.includes(t))
      e(`unknown piano technique '${t}' — allowed: ${PIANO_LICK_TECHNIQUES.join(', ')}`)
    summary.add(t)
  }
  const notes = lick.notes
  if (!Array.isArray(notes) || !notes.length) { e('notes must be a non-empty ordered array'); return out }
  if (notes.length > PIANO_LICK_MAX_NOTES)
    e(`${notes.length} notes > ${PIANO_LICK_MAX_NOTES} (8ths over two bars) — not intermediate-friendly`)

  // Pass 1: resolved offset of every deg note (null = unresolvable/malformed),
  // so approaches can look up their target (the NEXT deg note in order).
  const degOffsets = notes.map((n) => {
    if (!n || typeof n !== 'object' || n.deg === undefined || typeof n.deg !== 'string') return null
    const pc = resolveDegree(n.deg, quality)
    if (pc === null) return null
    const oct = n.octave === undefined ? 0 : n.octave
    return oct === 0 || oct === 1 || oct === 2 ? pc + 12 * oct : null
  })

  let lastBeat = -Infinity
  let prevApproach = null // type of the immediately preceding approach note
  notes.forEach((n, ni) => {
    const nw = `notes[${ni}]`
    if (!n || typeof n !== 'object') return e(`${nw}: note must be an object ({deg,…} or {approach,…})`)
    const isDeg = n.deg !== undefined
    const isApproach = n.approach !== undefined
    if (isDeg === isApproach) return e(`${nw}: exactly one of deg | approach per note`)
    if (isApproach) {
      if (!PIANO_LICK_APPROACHES.includes(n.approach))
        e(`${nw}: unknown approach '${n.approach}' — allowed: ${PIANO_LICK_APPROACHES.join(', ')} (piano licks have no next station; 'fifth-of-next' is bass-only)`)
      if (n.octave !== undefined)
        e(`${nw}: octave applies to deg notes only (approach pitch is derived from its target)`)
      if (prevApproach === n.approach)
        e(`${nw}: two consecutive '${n.approach}' approaches derive the identical pitch — write the note you mean as a deg, or alternate types (the enclosure)`)
      // Target = the NEXT deg note in order (scan past intervening approaches).
      const ti = notes.findIndex((m, i) => i > ni && m?.deg !== undefined)
      if (ti === -1) {
        e(`${nw}: approach cannot close a piano lick — it targets the NEXT deg note (the final note must be a deg)`)
      } else if (degOffsets[ti] !== null) {
        const derived = degOffsets[ti] + (n.approach === 'chrom-below' ? -1 : 1)
        if (derived < 0)
          e(`${nw}: chrom-below of a root-position target derives −1 — below the render window; raise the target an octave`)
        else if (derived > PIANO_LICK_MAX_OFFSET)
          e(`${nw}: derived pitch sits ${derived} semitones above the root — max ${PIANO_LICK_MAX_OFFSET} (fits MiniPiano's 37-key window for all 12 roots)`)
      } // target exists but is itself malformed → its own error already reports it
      prevApproach = n.approach
    } else {
      prevApproach = null
      if (typeof n.deg !== 'string') {
        e(`${nw}: deg must be a degree STRING ('1', 'b7', …), got ${JSON.stringify(n.deg)}`)
      } else {
        const pc = resolveDegree(n.deg, quality)
        if (pc === null) e(`${nw}: unresolvable degree '${n.deg}' for ${quality}`)
        if (n.octave !== undefined && n.octave !== 0 && n.octave !== 1 && n.octave !== 2)
          e(`${nw}: octave, when present, must be 0, 1 or 2 — got ${JSON.stringify(n.octave)}`)
        else if (pc !== null && degOffsets[ni] !== null && degOffsets[ni] > PIANO_LICK_MAX_OFFSET)
          e(`${nw}: '${n.deg}' octave ${n.octave} sits ${degOffsets[ni]} semitones above the root — max ${PIANO_LICK_MAX_OFFSET} (fits MiniPiano's 37-key window for all 12 roots)`)
      }
    }
    if (n.technique !== undefined) {
      if (!PIANO_LICK_TECHNIQUES.includes(n.technique))
        e(`${nw}: unknown piano technique '${n.technique}' — allowed: ${PIANO_LICK_TECHNIQUES.join(', ')}`)
      else if (!summary.has(n.technique))
        e(`${nw}: technique '${n.technique}' must also appear in the lick's techniques[] summary`)
    }
    if (n.beat !== undefined) {
      if (typeof n.beat !== 'number' || !(n.beat >= 1 && n.beat < PIANO_LICK_MAX_BEAT))
        e(`${nw}: beat must be a number in [1, ${PIANO_LICK_MAX_BEAT}) — a lick spans at most two 4/4 bars, got ${JSON.stringify(n.beat)}`)
      else if (n.beat < lastBeat)
        e(`${nw}: beat ${n.beat} < previous beat ${lastBeat} — beats must be non-decreasing in note order`)
      else lastBeat = n.beat
    }
  })
  return out
}

async function loadModule(path) {
  return (await import(pathToFileURL(path).href)).default
}

async function main() {
const styleDirs = readdirSync(KB, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name)
if (!styleDirs.length) { console.error('No style folders in src/data/kb/'); process.exit(1) }

const registry = existsSync(join(KB, 'index.js')) ? await loadModule(join(KB, 'index.js')) : null
if (!registry) err('kb/index.js', 'registry missing')

const allIds = new Set()
let totals = { styles: 0, progressions: 0, plays: 0, licks: 0 }

for (const style of styleDirs) {
  const dir = join(KB, style)
  const w = `kb/${style}`
  if (registry && !registry[style]) err('kb/index.js', `style '${style}' not registered`)

  const meta = existsSync(join(dir, 'meta.js')) ? await loadModule(join(dir, 'meta.js')) : null
  if (!meta) { err(w, 'meta.js missing'); continue }
  if (meta.id !== style) err(`${w}/meta.js`, `id '${meta.id}' ≠ folder '${style}'`)
  for (const f of ['label', 'feel', 'character']) if (!meta[f]) err(`${w}/meta.js`, `missing ${f}`)

  const progs = existsSync(join(dir, 'progressions.js')) ? await loadModule(join(dir, 'progressions.js')) : null
  if (!Array.isArray(progs) || !progs.length) { err(w, 'progressions.js missing/empty'); continue }
  if (progs.length < MIN_PROGRESSIONS) err(w, `${progs.length} progressions < ${MIN_PROGRESSIONS}`)

  const progById = {}
  for (const p of progs) {
    const pw = `${w}/progressions.js [${p.id}]`
    if (!p.id?.startsWith(`${style}-`)) err(pw, `id must start with '${style}-'`)
    if (allIds.has(p.id)) err(pw, 'duplicate id'); allIds.add(p.id)
    progById[p.id] = p
    const n = p.degrees?.length
    if (!n) { err(pw, 'degrees missing'); continue }
    for (const [field, arr] of [['rn', p.rn], ['qualities', p.qualities], ['bars', p.bars]])
      if (!Array.isArray(arr) || arr.length !== n) err(pw, `${field} length ≠ degrees length`)
    if (p.degrees.some(d => !Number.isInteger(d) || d < 0 || d > 11)) err(pw, 'degrees must be ints 0-11')
    for (const q of p.qualities ?? []) if (!CHORD_TYPES[q]) err(pw, `unknown quality '${q}'`)
    if (!MODES.includes(p.mode)) err(pw, `unknown mode '${p.mode}'`)
    if (!Array.isArray(p.songs) || !p.songs.length) err(pw, 'songs missing')
    if (!p.tip) err(pw, 'tip missing')
    // Optional difficulty tag — absent means 'foundation' (consumer default).
    if (p.level !== undefined && !LEVELS.includes(p.level))
      err(pw, `level, when present, must be one of ${LEVELS.join(' | ')} — got '${p.level}'`)
  }
  totals.styles++; totals.progressions += progs.length

  for (const inst of ['guitar', 'piano', 'bass']) {
    const file = join(dir, `${inst}.js`)
    if (!existsSync(file)) continue
    const pack = await loadModule(file)
    const iw = `${w}/${inst}.js`
    if (!pack.styleIntro) err(iw, 'styleIntro missing')
    if (!Array.isArray(pack.comping) || !pack.comping.length) err(iw, 'comping missing')
    if (inst !== 'bass' && (!pack.improv?.scales?.length || !pack.improv?.targetNotes))
      err(iw, 'improv.scales / improv.targetNotes required')

    const minPlays = inst === 'bass' ? MIN_PLAYS_BASS : MIN_PLAYS
    for (const p of progs)
      if ((pack.plays?.[p.id]?.length ?? 0) < minPlays)
        err(iw, `progression '${p.id}' has < ${minPlays} play(s)`)

    for (const [pid, plays] of Object.entries(pack.plays ?? {})) {
      const prog = progById[pid]
      if (!prog) { err(iw, `plays key '${pid}' is not a progression of this style`); continue }
      plays.forEach((play, pi) => {
        const lw = `${iw} ${pid} play[${pi}] "${play.label ?? '?'}"`
        if (!play.label || !play.level || !play.tips) err(lw, 'label/level/tips required')
        totals.plays++
        if (inst === 'bass') { for (const m of checkBassPlay(lw, play, prog)) errors.push(m); return }
        if (!Array.isArray(play.chords) || play.chords.length !== prog.degrees.length)
          return err(lw, `chords length ≠ progression length ${prog.degrees.length}`)
        play.chords.forEach((step, ci) => {
          const cw = `${lw} chord[${ci}] (${prog.rn[ci]})`
          if (inst === 'guitar') checkGuitarShape(cw, step, prog.qualities[ci])
          else for (const m of checkPianoRecipe(cw, step, prog.qualities[ci])) errors.push(m)
        })
      })
    }

    // Optional structured licks (SCHEMA.md "Licks" / "Piano licks") — a
    // top-level `licks` key on the instrument pack. Absent is fine; when
    // present it must validate. Routed by instrument: piano licks are
    // degree-based (checkPianoLick); guitar licks are tab-based (checkLick).
    if (pack.licks !== undefined) {
      if (!Array.isArray(pack.licks) || !pack.licks.length) {
        err(iw, 'licks, when present, must be a non-empty array')
      } else {
        const checkInstLick = inst === 'piano' ? checkPianoLick : checkLick
        pack.licks.forEach((lick, li) => {
          const lkw = `${iw} licks[${li}] "${lick?.id ?? '?'}"`
          for (const m of checkInstLick(lkw, lick, style, allIds)) errors.push(m)
        })
        totals.licks += pack.licks.length
      }
    }
  }
}

// ── Global progression-id uniqueness over the REGISTRY (task C-50) ────────────
// RelatedProgressions' ranking excludes the matched progression by ID ALONE
// (rankRelatedProgressions: `prog.id !== match.id` — no style comparison, task
// L-51), so a progression id repeated anywhere in the registry would silently
// drop an unrelated style's entry from the related list. The per-style loop
// above walks the FILES (kb/*/progressions.js) into `allIds`; this asserts the
// same invariant over kb/index.js — the object the components actually
// consume — so a registry wiring mistake the file walk never sees (a style
// registered against another style's progressions module, a shared/duplicated
// array) cannot reintroduce a duplicate.
if (registry) {
  const seenRegIds = new Map() // id → style it first appeared under
  for (const style of Object.keys(registry)) {
    const progs = registry[style]?.progressions
    if (!Array.isArray(progs)) continue
    for (const p of progs) {
      const rw = `kb/index.js [${style}]`
      if (typeof p?.id !== 'string' || !p.id) { err(rw, 'registry progression with missing/non-string id'); continue }
      if (seenRegIds.has(p.id))
        err(rw, `progression id '${p.id}' already registered under style '${seenRegIds.get(p.id)}' — ids must be globally unique across the registry (RelatedProgressions excludes the matched progression by id alone)`)
      else seenRegIds.set(p.id, style)
    }
  }
}

if (errors.length) {
  console.error(`✗ KB validation failed — ${errors.length} error(s):\n`)
  for (const e of errors) console.error('  ' + e)
  process.exit(1)
}
const lickNote = totals.licks ? `, ${totals.licks} licks` : ''
console.log(`✓ KB valid — ${totals.styles} style(s), ${totals.progressions} progressions, ${totals.plays} plays${lickNote}`)
}

// Run the full validation unless imported as a library (see header comment).
// Safe-by-default: an unset env var always means "run" — the gate can't be
// skipped by a path-comparison quirk.
if (!process.env.KB_VALIDATE_AS_LIB) await main()
