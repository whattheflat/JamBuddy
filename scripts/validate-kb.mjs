// KB quality gate — validates src/data/kb/ against the contract in src/data/kb/SCHEMA.md.
// Run: node scripts/validate-kb.mjs   (exit 1 on any error)
import { readdirSync, existsSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'
import { CHORD_TYPES } from '../src/lib/theory.js'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const KB = join(ROOT, 'src', 'data', 'kb')

const MODES = ['major', 'minor', 'dorian', 'phrygian', 'lydian', 'mixolydian']
const OPEN_PC = [4, 9, 2, 7, 11, 4] // EADGBe low-E first
const PERFECT_FIFTH = 7
const BASS_TOKENS = ['R', 'b3', '3', '5', '6', 'b7', '7', '9', 'O', 'chrom>', 'chrom<', '5>', 'x', '-']
const MIN_PROGRESSIONS = 4
const MIN_PLAYS = 2
const MAX_SPAN = 4

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
  const required = iv.filter(i => i !== PERFECT_FIFTH && !(chordStep.rootless && i === 0))
  for (const pc of required)
    if (!sounded.has(pc)) return err(where, `defining tone pc ${pc} of ${quality} missing from shape`)
}

function checkPianoRecipe(where, chordStep, quality) {
  const { recipe } = chordStep
  if (!recipe) return err(where, 'missing recipe')
  for (const hand of ['LH', 'RH']) {
    const degs = recipe[hand]
    if (degs === undefined) continue
    if (!Array.isArray(degs) || !degs.length) return err(where, `${hand} must be a non-empty array`)
    if (degs.length > 5) return err(where, `${hand} has ${degs.length} notes — one hand, max 5`)
    for (const d of degs)
      if (resolveDegree(d, quality) === null) err(where, `unresolvable degree '${d}' for ${quality}`)
  }
  if (recipe.LH === undefined && recipe.RH === undefined) err(where, 'recipe needs LH and/or RH')
}

function checkBassPlay(where, play, prog) {
  const totalBars = prog.bars.reduce((a, b) => a + b, 0)
  if (!Array.isArray(play.bars) || play.bars.length !== totalBars)
    return err(where, `bars length ${play.bars?.length} ≠ progression total ${totalBars}`)
  play.bars.forEach((bar, i) => {
    if (!Array.isArray(bar.beats) || !bar.beats.length) return err(`${where} bar ${i}`, 'missing beats')
    for (const b of bar.beats)
      if (!BASS_TOKENS.includes(b)) err(`${where} bar ${i}`, `unknown beat token '${b}'`)
  })
}

async function loadModule(path) {
  return (await import(pathToFileURL(path).href)).default
}

const styleDirs = readdirSync(KB, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name)
if (!styleDirs.length) { console.error('No style folders in src/data/kb/'); process.exit(1) }

const registry = existsSync(join(KB, 'index.js')) ? await loadModule(join(KB, 'index.js')) : null
if (!registry) err('kb/index.js', 'registry missing')

const allIds = new Set()
let totals = { styles: 0, progressions: 0, plays: 0 }

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

    for (const p of progs)
      if ((pack.plays?.[p.id]?.length ?? 0) < MIN_PLAYS)
        err(iw, `progression '${p.id}' has < ${MIN_PLAYS} plays`)

    for (const [pid, plays] of Object.entries(pack.plays ?? {})) {
      const prog = progById[pid]
      if (!prog) { err(iw, `plays key '${pid}' is not a progression of this style`); continue }
      plays.forEach((play, pi) => {
        const lw = `${iw} ${pid} play[${pi}] "${play.label ?? '?'}"`
        if (!play.label || !play.level || !play.tips) err(lw, 'label/level/tips required')
        totals.plays++
        if (inst === 'bass') return checkBassPlay(lw, play, prog)
        if (!Array.isArray(play.chords) || play.chords.length !== prog.degrees.length)
          return err(lw, `chords length ≠ progression length ${prog.degrees.length}`)
        play.chords.forEach((step, ci) => {
          const cw = `${lw} chord[${ci}] (${prog.rn[ci]})`
          if (inst === 'guitar') checkGuitarShape(cw, step, prog.qualities[ci])
          else checkPianoRecipe(cw, step, prog.qualities[ci])
        })
      })
    }
  }
}

if (errors.length) {
  console.error(`✗ KB validation failed — ${errors.length} error(s):\n`)
  for (const e of errors) console.error('  ' + e)
  process.exit(1)
}
console.log(`✓ KB valid — ${totals.styles} style(s), ${totals.progressions} progressions, ${totals.plays} plays`)
