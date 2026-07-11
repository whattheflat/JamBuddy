// Smoke-test harness — asserts the KB registry and the loop matcher are wired
// correctly before a merge. Imports the REAL src/data/kb/index.js and
// src/lib/match.js (no mocks), runs structural + behavioural checks, and exits
// non-zero on any failure so CI can gate on it.
//
// Run: node scripts/smoke.mjs   (exit 1 on any failure, 0 on all-pass)
//
// Style mirrors scripts/validate-kb.mjs: plain Node ESM, node: imports, a flat
// list of checks with ✓/✗ per check, a summary line, and process.exit().
import { register } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'
import { existsSync } from 'node:fs'

// match.js imports './theory' extensionless (resolved by Vite at build time, but
// raw Node ESM requires the extension). Register a tiny resolve hook that retries
// a failed extensionless relative specifier with '.js' appended, so we can import
// the REAL match.js unmodified (it's locked to task L-01 — we must not touch it).
register(
  'data:text/javascript,' +
    encodeURIComponent(`
      export async function resolve(specifier, context, next) {
        try {
          return await next(specifier, context)
        } catch (e) {
          if (/^\\.{1,2}\\//.test(specifier) && !/\\.[mc]?js$/.test(specifier)) {
            return await next(specifier + '.js', context)
          }
          throw e
        }
      }
    `),
  import.meta.url,
)

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const load = async (rel) => (await import(pathToFileURL(join(ROOT, rel)).href))

// ─── Tiny assertion harness ───────────────────────────────────────────────────

let passed = 0
const failures = []

function check(label, fn) {
  try {
    fn()
    passed++
    console.log(`  ✓ ${label}`)
  } catch (e) {
    failures.push(`${label}: ${e.message}`)
    console.log(`  ✗ ${label} — ${e.message}`)
  }
}

function warn(label, msg) {
  console.log(`  ⚠ ${label} — ${msg} (skipped)`)
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg)
}

// ─── Load the real modules ────────────────────────────────────────────────────

const kb = (await load('src/data/kb/index.js')).default
const match = await load('src/lib/match.js')
const { buildLoopIndex, matchLoopToProgression, findLoopPosition } = match

const theory = await load('src/lib/theory.js')
const { CHORD_TYPES, detectRepeatingProgression } = theory

const piano = await load('src/lib/piano.js')
const { pianoVoicing, pianoVoicingChain, voicingToneSet, hasTrueSeventh } = piano

// ─── 1. Registry integrity ────────────────────────────────────────────────────

console.log('\nRegistry integrity:')

check('KB default export is a non-empty object with ≥1 style', () => {
  assert(kb && typeof kb === 'object', 'kb default export is not an object')
  assert(Object.keys(kb).length >= 1, 'kb has no styles')
})

const styleNames = kb && typeof kb === 'object' ? Object.keys(kb) : []
const allIds = new Map() // id → style (for uniqueness across the whole KB)

for (const styleName of styleNames) {
  const style = kb[styleName]

  check(`style '${styleName}' has meta, progressions[], instruments.guitar`, () => {
    assert(style && typeof style === 'object', 'style entry is not an object')
    assert(style.meta && typeof style.meta === 'object', 'missing meta')
    assert(Array.isArray(style.progressions) && style.progressions.length > 0, 'progressions must be a non-empty array')
    assert(style.instruments && typeof style.instruments === 'object', 'missing instruments')
    assert(style.instruments.guitar && typeof style.instruments.guitar === 'object', 'missing instruments.guitar')
  })

  const progs = Array.isArray(style?.progressions) ? style.progressions : []
  for (const p of progs) {
    check(`'${styleName}' progression '${p?.id ?? '?'}' has consistent degrees/qualities/rn/bars + unique id`, () => {
      assert(typeof p.id === 'string' && p.id.length > 0, 'progression id missing')
      assert(!allIds.has(p.id), `duplicate id '${p.id}' (also in style '${allIds.get(p.id)}')`)
      allIds.set(p.id, styleName)
      const n = Array.isArray(p.degrees) ? p.degrees.length : 0
      assert(n > 0, 'degrees missing/empty')
      for (const [field, arr] of [['qualities', p.qualities], ['rn', p.rn], ['bars', p.bars]]) {
        assert(Array.isArray(arr), `${field} is not an array`)
        assert(arr.length === n, `${field} length ${arr.length} ≠ degrees length ${n}`)
      }
    })
  }
}

// ─── 2. Matcher correctness on sample loops ───────────────────────────────────

console.log('\nMatcher correctness:')

const index = buildLoopIndex(kb)

check('buildLoopIndex returns a { byCanonical: Map } shape', () => {
  assert(index && index.byCanonical instanceof Map, 'byCanonical is not a Map')
  assert(index.byCanonical.size > 0, 'index is empty')
})

// Helper: rotate a degree array by r so it starts at index r.
const rotate = (arr, r) => arr.map((_, i) => arr[(r + i) % arr.length])
// Helper: re-base a degree array so its first element is 0 (the loop "shape").
const rebase = (arr) => {
  const base = arr[0]
  return arr.map((d) => (((d - base) % 12) + 12) % 12)
}

// --- ii–V–I → some jazz 2-5-1, matched:true; derive the expected id from KB ---
// (don't hardcode 'jazz-251-major' — look up what the loop actually maps to and
//  assert its structural truth: the matched progression's degrees rotate to the
//  loop's degree shape.)
{
  const loop = ['Dm7', 'G7', 'Cmaj7'] // ii–V–I in C → degree shape [0,5,10]
  const r = matchLoopToProgression(loop, index)

  check('ii–V–I [Dm7,G7,Cmaj7] matches a progression (matched:true)', () => {
    assert(r.matched === true, `expected matched:true, got ${JSON.stringify(r)}`)
    assert(typeof r.id === 'string' && r.id.length > 0, 'matched but no id')
    assert(kb[r.style], `matched style '${r.style}' not in KB`)
  })

  check("ii–V–I maps to a 2-5-1-shaped progression (derived from KB)", () => {
    // Structural: the matched progression's degrees, rotated by the reported
    // rotation to align with the loop, must equal the loop's own degree shape.
    const loopShape = rebase([2, 7, 0]) // Dm7 G7 Cmaj7 pcs → re-based shape [0,5,10]
    const kbDeg = r.progression.degrees
    const rotatedKbShape = rebase(rotate(kbDeg, r.rotation))
    assert(rotatedKbShape.join(',') === loopShape.join(','),
      `KB degrees ${kbDeg} rotated by ${r.rotation} → ${rotatedKbShape} ≠ loop shape ${loopShape}`)
    // Soft: this loop is a major 2-5-1, expect the major-quality (maj7) candidate.
    assert(/251/.test(r.id) || r.progression.qualities.includes('maj7'),
      `expected a 2-5-1-shaped id, got '${r.id}'`)
  })

  // Remember the id for the rotation test below (derived, not hardcoded).
  globalThis.__ii_v_i_id = r.id
}

// --- A rotation of ii–V–I matches the SAME id with non-zero rotation ----------
{
  const loop = ['G7', 'Cmaj7', 'Dm7'] // V–I–ii: same loop, rotated by 1
  const r = matchLoopToProgression(loop, index)

  check('rotation [G7,Cmaj7,Dm7] matches the SAME id as ii–V–I', () => {
    assert(r.matched === true, `expected matched:true, got ${JSON.stringify(r)}`)
    assert(r.id === globalThis.__ii_v_i_id,
      `rotation matched '${r.id}', expected same id '${globalThis.__ii_v_i_id}'`)
  })

  check('rotation reports a non-zero rotation index', () => {
    assert(r.rotation !== 0, `expected non-zero rotation, got ${r.rotation}`)
    assert(r.rotation > 0 && r.rotation < loop.length, `rotation ${r.rotation} out of range`)
    // The rotation index should point at the loop slot aligning with KB degrees[0].
    // KB ii–V–I starts on ii (Dm7); Dm7 is at loop index 2 here.
    assert(loop[r.rotation] === 'Dm7', `loop[${r.rotation}] is '${loop[r.rotation]}', expected 'Dm7'`)
  })
}

// --- I–V–vi–IV axis loop → axis progression (pop may be absent) ----------------
{
  const loop = ['C', 'G', 'Am', 'F'] // I–V–vi–IV, degree shape [0,7,9,5]
  const r = matchLoopToProgression(loop, index)
  const loopShape = rebase([0, 7, 9, 5])

  if (r.matched) {
    check('axis [C,G,Am,F] matches an axis-shaped progression', () => {
      assert(kb[r.style], `matched style '${r.style}' not in KB`)
      // Whatever style owns the axis, its degrees must rotate to the loop shape.
      const rotatedKbShape = rebase(rotate(r.progression.degrees, r.rotation))
      assert(rotatedKbShape.join(',') === loopShape.join(','),
        `matched '${r.id}' degrees ${r.progression.degrees} rotated by ${r.rotation} don't match axis shape ${loopShape}`)
      // The axis is the four-chord I–V–vi–IV; sanity-check it's a 4-chord loop.
      assert(r.progression.degrees.length === 4, `expected a 4-chord axis, got length ${r.progression.degrees.length}`)
    })
  } else {
    warn('axis [C,G,Am,F] match', 'no axis-shaped 4-chord progression in current KB')
  }
}

// --- Chromatic / garbage loop → matched:false, no throw -----------------------
{
  check('chromatic loop [C,C#,D] returns matched:false cleanly (no throw)', () => {
    const r = matchLoopToProgression(['C', 'C#', 'D'], index)
    assert(r && r.matched === false, `expected matched:false, got ${JSON.stringify(r)}`)
    assert(r.id === null, `expected id:null on no-match, got ${r.id}`)
  })
}

// --- findLoopPosition: in-range index for a known loop, -1 for no-match --------
{
  const loop = ['Dm7', 'G7', 'Cmaj7']

  check('findLoopPosition returns an in-range index for a known loop', () => {
    const history = ['Dm7', 'G7'] // player is on G7
    const pos = findLoopPosition(history, loop)
    assert(Number.isInteger(pos), `expected an integer, got ${pos}`)
    assert(pos >= 0 && pos < loop.length, `index ${pos} out of range [0,${loop.length})`)
    assert(loop[pos] === 'G7', `loop[${pos}] is '${loop[pos]}', expected 'G7'`)
  })

  check('findLoopPosition returns -1 when the last chord is not in the loop', () => {
    const pos = findLoopPosition(['Ebmaj7'], loop)
    assert(pos === -1, `expected -1, got ${pos}`)
  })

  check('findLoopPosition returns -1 on empty inputs', () => {
    assert(findLoopPosition([], loop) === -1, 'empty history should be -1')
    assert(findLoopPosition(['Dm7'], []) === -1, 'empty loop should be -1')
  })
}

// ─── 3. Piano voicing resolver (C-10) ─────────────────────────────────────────
//
// Exercise src/lib/piano.js across every CHORD_TYPES quality (all 14) at a
// couple of roots, for each forced style + the default. Expected facts are
// derived from the resolver/theory (voicingToneSet / hasTrueSeventh / the chord
// intervals), never hardcoded as brittle note arrays.

console.log('\nPiano resolver:')

const QUALITIES = Object.keys(CHORD_TYPES)          // all 14
const PIANO_ROOTS = [0, 7]                           // C and G
const PIANO_STYLES = ['root', 'shell', 'rootlessA', 'rootlessB', undefined] // undefined = default
const mod12 = (n) => (((n % 12) + 12) % 12)
const styleName = (s) => s ?? 'default'

check(`CHORD_TYPES exposes all 14 qualities for the piano sweep`, () => {
  assert(QUALITIES.length === 14, `expected 14 CHORD_TYPES, got ${QUALITIES.length}`)
})

// --- 3a. Per (quality × root × style): valid shape, no wrong notes, 3rd & 7th --
for (const quality of QUALITIES) {
  const ints = CHORD_TYPES[quality].intervals
  const hasReal3rd = ints.some((i) => i === 3 || i === 4)
  // The "real 3rd" target pc: minor/major 3rd if present, else the suspension
  // tone (sus2 → 2, sus4 → 5) that stands in the 3rd slot.
  const susTone = ints[1] // sus2 → 2, sus4 → 5 (index-1 stand-in for the 3rd)
  const trueSeventh = hasTrueSeventh(quality) // interval 10 or 11 present

  for (const rootPc of PIANO_ROOTS) {
    // expected 3rd-slot pc (absolute pc)
    const third3 = mod12(rootPc + 3)
    const third4 = mod12(rootPc + 4)
    const susPc = mod12(rootPc + susTone)
    const seventhInt = ints.find((i) => i === 10 || i === 11)
    const seventhPc = seventhInt === undefined ? null : mod12(rootPc + seventhInt)

    for (const style of PIANO_STYLES) {
      const chord = { rootPc, quality }
      const opts = style === undefined ? {} : { style }
      const tag = `${quality}@${rootPc} [${styleName(style)}]`

      check(`${tag}: valid voicing shape`, () => {
        const v = pianoVoicing(chord, opts)
        assert(v && typeof v === 'object', 'no voicing object')
        assert(Array.isArray(v.notes) && v.notes.length > 0, 'notes must be a non-empty array')
        assert(v.notes.every((n) => Number.isFinite(n)), 'notes must all be numbers')
        assert(Array.isArray(v.pcs) && v.pcs.length > 0, 'pcs must be a non-empty array')
        assert(typeof v.bass === 'number', 'bass must be a number')
        assert(typeof v.style === 'string' && v.style.length > 0, 'style must be a non-empty string')
        assert(typeof v.label === 'string' && v.label.length > 0, 'label must be a non-empty string')
      })

      check(`${tag}: no wrong notes (pcs ⊆ voicingToneSet)`, () => {
        const v = pianoVoicing(chord, opts)
        // Scope the legal-tone set to the voicing's ACTUAL produced style.
        const legal = voicingToneSet({ rootPc, quality }, v.style)
        for (const pc of v.pcs) {
          assert(legal.has(pc), `pc ${pc} not in voicingToneSet(${quality}, ${v.style}) {${[...legal].sort((a, b) => a - b)}}`)
        }
      })

      check(`${tag}: real 3rd (or suspension) present`, () => {
        const v = pianoVoicing(chord, opts)
        if (hasReal3rd) {
          assert(v.pcs.includes(third3) || v.pcs.includes(third4),
            `expected a 3rd (pc ${third3} or ${third4}) in pcs {${v.pcs}}`)
        } else {
          // sus2/sus4 — the 2 or 4 stands in the 3rd slot.
          assert(v.pcs.includes(susPc),
            `expected suspension tone pc ${susPc} in pcs {${v.pcs}}`)
        }
      })

      check(`${tag}: true 7th present in shell/rootless`, () => {
        const v = pianoVoicing(chord, opts)
        const isSeventhVoicing = v.style === 'shell' || v.style === 'rootlessA' || v.style === 'rootlessB'
        if (trueSeventh && isSeventhVoicing) {
          assert(v.pcs.includes(seventhPc),
            `${v.style} of a true-7th chord must include the 7th pc ${seventhPc}, got {${v.pcs}}`)
        }
      })

      check(`${tag}: notes within [0,36] and bass == min(notes)`, () => {
        const v = pianoVoicing(chord, opts)
        assert(v.notes.every((n) => n >= 0 && n <= 36),
          `notes ${JSON.stringify(v.notes)} out of [0,36]`)
        assert(v.bass === Math.min(...v.notes),
          `bass ${v.bass} ≠ min(notes) ${Math.min(...v.notes)}`)
      })
    }
  }
}

// --- 3b. No duplicate absolute note within a single voicing (sus2 nit watch) ---
// Sweep every quality × style (forced + default). A duplicate absolute note in
// one voicing's `notes` is a defect surfaced as a ✗ (L-10 gate flagged a
// forced-rootless sus2 collision). If the resolver was since deduped, this
// passes. We report WHICH quality/style collides so it's visible.
{
  const dupes = []
  for (const quality of QUALITIES) {
    for (const rootPc of PIANO_ROOTS) {
      for (const style of PIANO_STYLES) {
        const opts = style === undefined ? {} : { style }
        const v = pianoVoicing({ rootPc, quality }, opts)
        if (v.notes.length !== new Set(v.notes).size) {
          dupes.push(`${quality}@${rootPc} [${styleName(style)}] notes=${JSON.stringify(v.notes)}`)
        }
      }
    }
  }
  check('no duplicate absolute note within any single voicing (all qualities × styles)', () => {
    assert(dupes.length === 0,
      `duplicate-note voicing(s) found: ${dupes.join('; ')}`)
  })
}

// --- 3c. Determinism: same input → identical notes -----------------------------
{
  check('pianoVoicing is deterministic (same input → identical notes)', () => {
    for (const quality of QUALITIES) {
      for (const rootPc of PIANO_ROOTS) {
        for (const style of PIANO_STYLES) {
          const opts = style === undefined ? {} : { style }
          const a = pianoVoicing({ rootPc, quality }, opts)
          const b = pianoVoicing({ rootPc, quality }, opts)
          assert(a.notes.join(',') === b.notes.join(','),
            `non-deterministic notes for ${quality}@${rootPc} [${styleName(style)}]: ${a.notes} vs ${b.notes}`)
        }
      }
    }
  })
}

// --- 3d. Voice-leading sanity: chain pcs == per-chord unthreaded pcs ------------
// Threading re-registers (slides whole shapes by octaves) but never changes the
// pitch CONTENT — each chained voicing's pcs must equal the same chord voiced
// alone (default style), as a set.
{
  const chords = [
    { rootPc: 2, quality: 'min7' },  // Dm7
    { rootPc: 7, quality: 'dom7' },  // G7
    { rootPc: 0, quality: 'maj7' },  // Cmaj7
  ]
  const chain = pianoVoicingChain(chords)
  const pcSet = (arr) => [...new Set(arr)].sort((a, b) => a - b).join(',')

  check('pianoVoicingChain(ii–V–I) returns 3 voicings', () => {
    assert(Array.isArray(chain) && chain.length === 3,
      `expected 3 voicings, got ${Array.isArray(chain) ? chain.length : typeof chain}`)
  })

  check('chain pcs match the per-chord unthreaded pcs (threading never changes pitch content)', () => {
    chords.forEach((chord, i) => {
      const solo = pianoVoicing(chord) // same default style, no prev
      assert(pcSet(chain[i].pcs) === pcSet(solo.pcs),
        `chord ${i} (${chord.quality}@${chord.rootPc}): chain pcs {${pcSet(chain[i].pcs)}} ≠ unthreaded {${pcSet(solo.pcs)}}`)
    })
  })
}

// ─── 4. Lick + level schema validation (C-20) ─────────────────────────────────
//
// Import the REAL validator in lib mode (KB_VALIDATE_AS_LIB skips the full-KB
// run) and exercise its exported checkLick/LEVELS against in-memory fixtures:
// a good lick must pass, and bad-vocab / bad-string-range / duplicate-id licks
// must FAIL — proving the validator's lick rules actually bite.

console.log('\nLick + level schema (validate-kb lib mode):')

process.env.KB_VALIDATE_AS_LIB = '1'
const kbv = await load('scripts/validate-kb.mjs')
const { checkLick, LEVELS, LICK_TECHNIQUES } = kbv

check('validate-kb exports checkLick / LEVELS / LICK_TECHNIQUES in lib mode', () => {
  assert(typeof checkLick === 'function', 'checkLick is not a function')
  assert(Array.isArray(LEVELS) && LEVELS.join(',') === 'foundation,intermediate',
    `LEVELS must be exactly [foundation, intermediate], got ${JSON.stringify(LEVELS)}`)
  assert(Array.isArray(LICK_TECHNIQUES) && LICK_TECHNIQUES.length === 8,
    `expected the 8-word technique vocab, got ${JSON.stringify(LICK_TECHNIQUES)}`)
  for (const t of ['hammer-on', 'pull-off', 'slide', 'bend', 'double-stop', 'ghost-note', 'chromatic-approach', 'vibrato'])
    assert(LICK_TECHNIQUES.includes(t), `vocab missing '${t}'`)
})

// A realistic, fully-valid fixture (style-prefixed id, vocab techniques,
// strings 1–6, frets 0–15, per-note techniques present in the summary).
const goodLick = () => ({
  id: 'blues-box1-roll',
  name: 'B.B. box roll',
  level: 'foundation',
  chordContext: 'over the I7',
  techniques: ['bend', 'vibrato'],
  tab: [
    { string: 2, fret: 8 },
    { string: 1, fret: 8, technique: 'bend' },
    { string: 1, fret: 10, technique: 'vibrato' },
    { string: 2, fret: 8 },
  ],
})

check('good in-memory lick fixture PASSES checkLick (0 errors)', () => {
  const errs = checkLick('fixture', goodLick(), 'blues', new Set())
  assert(errs.length === 0, `expected clean pass, got: ${errs.join('; ')}`)
})

check('bad-vocab lick FAILS (technique outside the fixed vocabulary)', () => {
  const lick = goodLick()
  lick.techniques = ['bend', 'tapping'] // 'tapping' is not in the vocab
  const errs = checkLick('fixture', lick, 'blues', new Set())
  assert(errs.length > 0, 'bad vocab was accepted')
  assert(errs.some((e) => e.includes("'tapping'")), `no error names 'tapping': ${errs.join('; ')}`)
})

check('bad per-note technique FAILS (vocab enforced on tab notes too)', () => {
  const lick = goodLick()
  lick.tab[1].technique = 'sweep-picking'
  const errs = checkLick('fixture', lick, 'blues', new Set())
  assert(errs.some((e) => e.includes("'sweep-picking'")), `per-note vocab not enforced: ${errs.join('; ')}`)
})

check('bad-string-range lick FAILS (string 7 / string 0 rejected)', () => {
  for (const bad of [7, 0]) {
    const lick = goodLick()
    lick.tab[0].string = bad
    const errs = checkLick('fixture', lick, 'blues', new Set())
    assert(errs.some((e) => e.includes('string must be an integer 1–6')),
      `string ${bad} was accepted: ${errs.join('; ')}`)
  }
})

check('bad-fret lick FAILS (fret 16 / negative / non-integer rejected)', () => {
  for (const bad of [16, -1, 3.5]) {
    const lick = goodLick()
    lick.tab[0].fret = bad
    const errs = checkLick('fixture', lick, 'blues', new Set())
    assert(errs.some((e) => e.includes('fret must be an integer')),
      `fret ${bad} was accepted: ${errs.join('; ')}`)
  }
})

check('duplicate-id lick FAILS (ids global across progressions AND licks)', () => {
  const ids = new Set()
  assert(checkLick('fixture', goodLick(), 'blues', ids).length === 0, 'first insert should pass')
  const errs = checkLick('fixture', goodLick(), 'blues', ids) // same id again
  assert(errs.some((e) => e.includes('duplicate id')), `duplicate id was accepted: ${errs.join('; ')}`)
  // Colliding with an existing PROGRESSION id must also fail (shared namespace).
  const progIds = new Set(['blues-box1-roll'])
  const errs2 = checkLick('fixture', goodLick(), 'blues', progIds)
  assert(errs2.some((e) => e.includes('duplicate id')), 'collision with a progression id was accepted')
})

check('wrong style prefix / bad level / empty tab all FAIL', () => {
  const wrongPrefix = goodLick(); wrongPrefix.id = 'jazz-box1-roll'
  assert(checkLick('fixture', wrongPrefix, 'blues', new Set()).some((e) => e.includes("starting with 'blues-'")),
    'wrong style prefix accepted')
  const badLevel = goodLick(); badLevel.level = 'advanced'
  assert(checkLick('fixture', badLevel, 'blues', new Set()).some((e) => e.includes('level must be one of')),
    "level 'advanced' accepted")
  const emptyTab = goodLick(); emptyTab.tab = []
  assert(checkLick('fixture', emptyTab, 'blues', new Set()).some((e) => e.includes('tab must be a non-empty')),
    'empty tab accepted')
})

check('per-note technique missing from techniques[] summary FAILS (card tags stay honest)', () => {
  const lick = goodLick()
  lick.tab[2].technique = 'slide' // valid vocab, but not in techniques: [bend, vibrato]
  const errs = checkLick('fixture', lick, 'blues', new Set())
  assert(errs.some((e) => e.includes("must also appear in the lick's techniques[]")),
    `summary consistency not enforced: ${errs.join('; ')}`)
})

// Progression `level` is optional in the KB — assert today's KB either omits it
// or uses a legal value (guards P-20's tagging against typos reaching main).
check("every KB progression 'level', when present, is foundation|intermediate", () => {
  for (const styleName of styleNames) {
    for (const p of kb[styleName]?.progressions ?? []) {
      if (p.level !== undefined) {
        assert(LEVELS.includes(p.level), `${styleName}/${p.id}: bad level '${p.level}'`)
      }
    }
  }
})

// Same guard for any licks already shipped in the KB: run the REAL packs'
// licks (if any) through the instrument-routed checker — piano licks are
// degree-based (checkPianoLick, §5c below), everything else is tab-based
// checkLick — mirroring the validator's own routing.
check('every KB pack licks[] entry (if any) passes its instrument\'s lick check', () => {
  const ids = new Set()
  for (const styleName of styleNames) {
    const instruments = kb[styleName]?.instruments ?? {}
    for (const [inst, pack] of Object.entries(instruments)) {
      if (pack?.licks === undefined) continue
      assert(Array.isArray(pack.licks) && pack.licks.length,
        `${styleName}/${inst}: licks, when present, must be a non-empty array`)
      const checkInstLick = inst === 'piano' ? kbv.checkPianoLick : checkLick
      for (const lick of pack.licks) {
        const errs = checkInstLick(`${styleName}/${inst} ${lick?.id ?? '?'}`, lick, styleName, ids)
        assert(errs.length === 0, errs.join('; '))
      }
    }
  }
})

// ─── 5. Piano hand-span rule (C-22) ───────────────────────────────────────────
//
// SCHEMA.md rule 3: one hand per recipe stays within a 10th. The validator
// enforces span ≤ MAX_HAND_SPAN (15 semitones, a minor 10th) by stacking the
// recipe's degrees low→high (each note in the nearest position above the
// previous — the documented jazz/piano.js convention). Prove the rule bites on
// synthetic fixtures, then run every REAL piano pack recipe through the check.

console.log('\nPiano hand-span rule (validate-kb lib mode):')

const { checkPianoRecipe, MAX_HAND_SPAN } = kbv

check('validate-kb exports checkPianoRecipe / MAX_HAND_SPAN (= 15, a minor 10th)', () => {
  assert(typeof checkPianoRecipe === 'function', 'checkPianoRecipe is not a function')
  assert(MAX_HAND_SPAN === 15, `MAX_HAND_SPAN must be 15 (minor 10th), got ${MAX_HAND_SPAN}`)
})

// dom7 LH ['1','7','3'] stacks 0 → 10 → 16 (the 3rd must sit ABOVE the ♭7):
// span 16 = a major 10th — one semitone past the rule. Must FAIL, and the
// error must name the hand and the computed span.
check('synthetic 16-semitone hand (dom7 LH [1 7 3]) FAILS with the span error', () => {
  const errs = checkPianoRecipe('fixture', { recipe: { LH: ['1', '7', '3'] } }, 'dom7')
  assert(errs.length > 0, 'a 16-semitone hand was accepted')
  assert(errs.some((e) => e.includes('LH') && e.includes('spans 16')),
    `no error names LH + span 16: ${errs.join('; ')}`)
})

// dom7 LH ['1','7','#9'] stacks 0 → 10 → 15: span exactly 15 (the 7♯9 sound).
// The boundary is legal — SCHEMA's "within a 10th" includes the minor 10th.
check('synthetic 15-semitone hand (dom7 LH [1 7 #9]) passes (boundary is legal)', () => {
  const errs = checkPianoRecipe('fixture', { recipe: { LH: ['1', '7', '#9'] } }, 'dom7')
  assert(errs.length === 0, `span-15 boundary rejected: ${errs.join('; ')}`)
})

// The rule must bite on the RIGHT hand too, and a legal LH must not mask it.
check('RH is checked independently (LH [1] fine, RH [1 7 3] fails naming RH)', () => {
  const errs = checkPianoRecipe('fixture', { recipe: { LH: ['1'], RH: ['1', '7', '3'] } }, 'dom7')
  assert(errs.some((e) => e.includes('RH') && e.includes('spans 16')),
    `RH span not enforced: ${errs.join('; ')}`)
  assert(!errs.some((e) => e.includes('LH')), `legal LH wrongly flagged: ${errs.join('; ')}`)
})

// P-22's widest verified voicing: ø11 rootless ['3','5','7','11'] on half_dim
// stacks 3 → 6 → 10 → 17: span 14. It must stay legal — that's why the
// constant is 15, not 12 or 16.
check("jazz's widest voicing (half_dim LH [3 5 7 11], span 14) stays legal", () => {
  const errs = checkPianoRecipe('fixture', { recipe: { LH: ['3', '5', '7', '11'] } }, 'half_dim')
  assert(errs.length === 0, `the verified 14-span ø11 voicing was rejected: ${errs.join('; ')}`)
})

// Live-KB guard: every piano recipe in every registered pack (present and
// future — e.g. the incoming gospel piano cell) passes checkPianoRecipe.
check('every KB piano pack recipe passes checkPianoRecipe (span ≤ 15 everywhere)', () => {
  let recipes = 0
  for (const styleName of styleNames) {
    const pack = kb[styleName]?.instruments?.piano
    if (!pack) continue
    const progById = Object.fromEntries((kb[styleName].progressions ?? []).map((p) => [p.id, p]))
    for (const [pid, plays] of Object.entries(pack.plays ?? {})) {
      const prog = progById[pid]
      assert(prog, `${styleName}/piano plays key '${pid}' is not a progression of this style`)
      plays.forEach((play, pi) => {
        (play.chords ?? []).forEach((step, ci) => {
          recipes++
          const where = `${styleName}/piano ${pid} play[${pi}] "${play.label ?? '?'}" chord[${ci}]`
          const errs = checkPianoRecipe(where, step, prog.qualities[ci])
          assert(errs.length === 0, errs.join('; '))
        })
      })
    }
  }
  console.log(`      (${recipes} live piano recipes checked)`)
})

// ─── 5b. Bass play schema (C-41) ──────────────────────────────────────────────
//
// Same lib-mode pattern as §4/§5: exercise the exported checkBassPlay against
// in-memory fixtures — a realistic boogie play must pass, and each malformed
// variant must FAIL with the specific error — proving the bass rules bite
// before any bass cell (P-41) is authored against them.

console.log('\nBass play schema (validate-kb lib mode):')

const { checkBassPlay, MIN_PLAYS_BASS, BASS_APPROACHES, BASS_MAX_OFFSET } = kbv

check('validate-kb exports checkBassPlay / MIN_PLAYS_BASS(=1) / BASS_APPROACHES / BASS_MAX_OFFSET(=19)', () => {
  assert(typeof checkBassPlay === 'function', 'checkBassPlay is not a function')
  assert(MIN_PLAYS_BASS === 1, `MIN_PLAYS_BASS must be 1 (SCHEMA bass coverage floor), got ${MIN_PLAYS_BASS}`)
  assert(Array.isArray(BASS_APPROACHES) && BASS_APPROACHES.join(',') === 'chrom-below,chrom-above,fifth-of-next',
    `BASS_APPROACHES must be exactly [chrom-below, chrom-above, fifth-of-next], got ${JSON.stringify(BASS_APPROACHES)}`)
  assert(BASS_MAX_OFFSET === 19, `BASS_MAX_OFFSET must be 19 (an octave + a fifth), got ${BASS_MAX_OFFSET}`)
})

// A 2-step I7→IV7 fixture progression; the IV7 gets 2 bars (exercises the
// per-step beat range). The good play: classic boogie cell + a chromatic walk.
const bassProg = () => ({
  id: 'blues-fixture', rn: ['I7', 'IV7'], degrees: [0, 5],
  qualities: ['dom7', 'dom7'], bars: [1, 2],
})
const goodBassPlay = () => ({
  label: 'Boogie cell',
  level: 'foundation',
  feel: 'swung 8ths, locked with the kick',
  tips: 'The same cell moves to the IV unchanged — degrees, not frets.',
  chords: [
    {
      pattern: [
        { deg: '1', beat: 1 },
        { deg: '3', beat: 2 },
        { deg: '5', beat: 3, technique: 'ghost-note' },
        { approach: 'chrom-below', beat: 4 },
      ],
      note: 'walk up into the IV',
    },
    {
      pattern: [
        { deg: '1', beat: 1 },
        { deg: '6', beat: 3 },
        { deg: 'b7', beat: 5 },
        { deg: '1', octave: 1, beat: 7 },
        { approach: 'fifth-of-next', beat: 8 },
      ],
    },
  ],
})

check('good boogie fixture PASSES checkBassPlay (0 errors)', () => {
  const errs = checkBassPlay('fixture', goodBassPlay(), bassProg())
  assert(errs.length === 0, `expected clean pass, got: ${errs.join('; ')}`)
})

check("unresolvable degree FAILS ('2' is not a bass degree)", () => {
  const play = goodBassPlay()
  play.chords[0].pattern[1] = { deg: '2', beat: 2 }
  const errs = checkBassPlay('fixture', play, bassProg())
  assert(errs.some((e) => e.includes("unresolvable degree '2'")), `deg '2' was accepted: ${errs.join('; ')}`)
})

check('numeric deg FAILS (degrees are strings, one convention with piano)', () => {
  const play = goodBassPlay()
  play.chords[0].pattern[0] = { deg: 1, beat: 1 }
  const errs = checkBassPlay('fixture', play, bassProg())
  assert(errs.some((e) => e.includes('deg must be a degree STRING')), `numeric deg accepted: ${errs.join('; ')}`)
})

check("octave cap bites (b7 octave 1 = 22 semitones > 19) and bad octave values FAIL", () => {
  const play = goodBassPlay()
  play.chords[1].pattern[3] = { deg: 'b7', octave: 1, beat: 7 }
  const errs = checkBassPlay('fixture', play, bassProg())
  assert(errs.some((e) => e.includes(`max ${BASS_MAX_OFFSET}`)), `22-semitone offset accepted: ${errs.join('; ')}`)
  const play2 = goodBassPlay()
  play2.chords[1].pattern[3] = { deg: '1', octave: 2, beat: 7 }
  const errs2 = checkBassPlay('fixture', play2, bassProg())
  assert(errs2.some((e) => e.includes('octave, when present, must be 0 or 1')), `octave 2 accepted: ${errs2.join('; ')}`)
})

check('empty pattern FAILS', () => {
  const play = goodBassPlay()
  play.chords[0].pattern = []
  const errs = checkBassPlay('fixture', play, bassProg())
  assert(errs.some((e) => e.includes('pattern must be a non-empty ordered array')), `empty pattern accepted: ${errs.join('; ')}`)
})

check("rootless pattern FAILS (every pattern must state '1')", () => {
  const play = goodBassPlay()
  play.chords[0].pattern = [{ deg: '3', beat: 1 }, { deg: '5', beat: 2 }]
  const errs = checkBassPlay('fixture', play, bassProg())
  assert(errs.some((e) => e.includes("never states the root ('1')")), `rootless pattern accepted: ${errs.join('; ')}`)
})

check('approach notes must CLOSE the pattern (deg after approach fails)', () => {
  const play = goodBassPlay()
  play.chords[0].pattern = [{ deg: '1', beat: 1 }, { approach: 'chrom-below', beat: 2 }, { deg: '5', beat: 3 }]
  const errs = checkBassPlay('fixture', play, bassProg())
  assert(errs.some((e) => e.includes('deg note after an approach')), `mid-pattern approach accepted: ${errs.join('; ')}`)
})

check("unknown approach type FAILS ('tritone-sub' is not in the typed set)", () => {
  const play = goodBassPlay()
  play.chords[0].pattern[3] = { approach: 'tritone-sub', beat: 4 }
  const errs = checkBassPlay('fixture', play, bassProg())
  assert(errs.some((e) => e.includes("unknown approach 'tritone-sub'")), `unknown approach accepted: ${errs.join('; ')}`)
})

check('beat range + ordering bite (beat 9 on a 2-bar step; decreasing beats)', () => {
  const play = goodBassPlay()
  play.chords[1].pattern[4] = { approach: 'fifth-of-next', beat: 9 } // 2 bars → beat < 9
  const errs = checkBassPlay('fixture', play, bassProg())
  assert(errs.some((e) => e.includes('beat must be a number in [1, 9)')), `beat 9 on a 2-bar step accepted: ${errs.join('; ')}`)
  const play2 = goodBassPlay()
  play2.chords[0].pattern[2] = { deg: '5', beat: 1.5 } // after beat 2 — decreasing
  const errs2 = checkBassPlay('fixture', play2, bassProg())
  assert(errs2.some((e) => e.includes('beats must be non-decreasing')), `decreasing beats accepted: ${errs2.join('; ')}`)
})

check('chords length ≠ progression length FAILS; missing feel FAILS; bad technique FAILS', () => {
  const short = goodBassPlay(); short.chords = short.chords.slice(0, 1)
  assert(checkBassPlay('fixture', short, bassProg()).some((e) => e.includes('chords length 1 ≠ progression length 2')),
    'short chords array accepted')
  const noFeel = goodBassPlay(); delete noFeel.feel
  assert(checkBassPlay('fixture', noFeel, bassProg()).some((e) => e.includes('feel required')),
    'missing feel accepted')
  const badTech = goodBassPlay(); badTech.chords[0].pattern[2].technique = 'slap-pop'
  assert(checkBassPlay('fixture', badTech, bassProg()).some((e) => e.includes("unknown technique 'slap-pop'")),
    'off-vocabulary technique accepted')
})

check('density cap bites (> 8 notes per bar is not intermediate)', () => {
  const play = goodBassPlay()
  play.chords[0].pattern = Array.from({ length: 9 }, () => ({ deg: '1' }))
  const errs = checkBassPlay('fixture', play, bassProg())
  assert(errs.some((e) => e.includes('8ths density cap')), `9 notes in one bar accepted: ${errs.join('; ')}`)
})

// Live-KB guard (future-proofs P-41): every bass pack play in the registry
// passes checkBassPlay. Zero bass cells today — the loop is a no-op until the
// first bass.js registers, then it gates it exactly like the validator does.
check('every KB bass pack play passes checkBassPlay', () => {
  let bassPlays = 0
  for (const styleName of styleNames) {
    const pack = kb[styleName]?.instruments?.bass
    if (!pack) continue
    const progById = Object.fromEntries((kb[styleName].progressions ?? []).map((p) => [p.id, p]))
    for (const [pid, plays] of Object.entries(pack.plays ?? {})) {
      const prog = progById[pid]
      assert(prog, `${styleName}/bass plays key '${pid}' is not a progression of this style`)
      plays.forEach((play, pi) => {
        bassPlays++
        const errs = checkBassPlay(`${styleName}/bass ${pid} play[${pi}] "${play.label ?? '?'}"`, play, prog)
        assert(errs.length === 0, errs.join('; '))
      })
    }
  }
  console.log(`      (${bassPlays} live bass plays checked)`)
})

// ─── 5c. Piano lick schema (C-60) ─────────────────────────────────────────────
//
// Same lib-mode pattern as §4/§5/§5b: exercise the exported checkPianoLick
// against in-memory fixtures — a realistic enclosure lick must pass, and each
// malformed variant must FAIL with the specific error — proving the piano-lick
// rules bite before any piano licks (P-60) are authored against them.

console.log('\nPiano lick schema (validate-kb lib mode):')

const { checkPianoLick, PIANO_LICK_TECHNIQUES, PIANO_LICK_APPROACHES, PIANO_LICK_MAX_OFFSET } = kbv

check('validate-kb exports checkPianoLick / PIANO_LICK_TECHNIQUES / PIANO_LICK_APPROACHES / PIANO_LICK_MAX_OFFSET(=25)', () => {
  assert(typeof checkPianoLick === 'function', 'checkPianoLick is not a function')
  assert(Array.isArray(PIANO_LICK_TECHNIQUES)
    && PIANO_LICK_TECHNIQUES.join(',') === 'slide,double-stop,ghost-note,grace-note',
    `PIANO_LICK_TECHNIQUES must be exactly [slide, double-stop, ghost-note, grace-note], got ${JSON.stringify(PIANO_LICK_TECHNIQUES)}`)
  assert(Array.isArray(PIANO_LICK_APPROACHES) && PIANO_LICK_APPROACHES.join(',') === 'chrom-below,chrom-above',
    `PIANO_LICK_APPROACHES must be exactly [chrom-below, chrom-above] (no fifth-of-next — licks have no next station), got ${JSON.stringify(PIANO_LICK_APPROACHES)}`)
  assert(PIANO_LICK_MAX_OFFSET === 25,
    `PIANO_LICK_MAX_OFFSET must be 25 (root in the bottom octave: 11 + 25 = 36, MiniPiano's top key), got ${PIANO_LICK_MAX_OFFSET}`)
})

// Vocabulary-family consistency: every piano word except the piano-specific
// 'grace-note' must also be a guitar lick word WITH THE SAME SPELLING — one
// vocabulary family, not a third counting scheme. (The guitar set-equality
// guard in §7b is untouched: LICK_TECHNIQUES itself did not change.)
check("piano vocab ⊂ guitar vocab + 'grace-note' (shared words, one spelling)", () => {
  const guitar = new Set(LICK_TECHNIQUES)
  const strays = PIANO_LICK_TECHNIQUES.filter((t) => t !== 'grace-note' && !guitar.has(t))
  assert(strays.length === 0,
    `piano technique word(s) [${strays}] are neither 'grace-note' nor in LICK_TECHNIQUES — shared words must keep the guitar spelling`)
  assert(!guitar.has('grace-note'),
    "guitar vocab now contains 'grace-note' — it was piano-specific; update SCHEMA + this guard deliberately")
})

// A realistic, fully-valid fixture: a bebop enclosure into the 3rd over min7.
// Offsets: '5'@1 → 19; approaches target '3'@1 → 15, deriving 16 and 14;
// final deg '3'@1 → 15. All in [0, 25]; beats non-decreasing.
const goodPianoLick = () => ({
  id: 'jazz-enclosure-into-3',
  name: 'Bebop enclosure into the 3rd',
  level: 'intermediate',
  chordContext: 'over the ii7',
  quality: 'min7',
  techniques: ['grace-note'],
  source: 'Barry Harris workshop vocabulary',
  notes: [
    { deg: '5', octave: 1, beat: 1 },
    { approach: 'chrom-above', beat: 2 },
    { approach: 'chrom-below', beat: 2.5 },
    { deg: '3', octave: 1, beat: 3, technique: 'grace-note' },
  ],
})

check('good enclosure fixture PASSES checkPianoLick (0 errors)', () => {
  const errs = checkPianoLick('fixture', goodPianoLick(), 'jazz', new Set())
  assert(errs.length === 0, `expected clean pass, got: ${errs.join('; ')}`)
})

check("missing / unknown quality FAILS (degrees need a machine context, chordContext is prose)", () => {
  const noQ = goodPianoLick(); delete noQ.quality
  assert(checkPianoLick('fixture', noQ, 'jazz', new Set()).some((e) => e.includes('quality must be a CHORD_TYPES key')),
    'missing quality accepted')
  const badQ = goodPianoLick(); badQ.quality = 'minor7' // not a CHORD_TYPES key
  assert(checkPianoLick('fixture', badQ, 'jazz', new Set()).some((e) => e.includes('quality must be a CHORD_TYPES key')),
    "quality 'minor7' accepted")
})

check("unresolvable degree FAILS ('7' resolves on min7 but '2' never does)", () => {
  const lick = goodPianoLick()
  lick.notes[0] = { deg: '2', beat: 1 }
  const errs = checkPianoLick('fixture', lick, 'jazz', new Set())
  assert(errs.some((e) => e.includes("unresolvable degree '2'")), `deg '2' accepted: ${errs.join('; ')}`)
})

check('terminal approach FAILS (targets the next deg — the final note must be a deg)', () => {
  const lick = goodPianoLick()
  lick.notes.push({ approach: 'chrom-below', beat: 4 })
  const errs = checkPianoLick('fixture', lick, 'jazz', new Set())
  assert(errs.some((e) => e.includes('approach cannot close a piano lick')), `terminal approach accepted: ${errs.join('; ')}`)
})

check('consecutive SAME-type approaches FAIL (identical derived pitch); the enclosure (alternating) passes', () => {
  const lick = goodPianoLick()
  lick.notes[2] = { approach: 'chrom-above', beat: 2.5 } // above, above
  const errs = checkPianoLick('fixture', lick, 'jazz', new Set())
  assert(errs.some((e) => e.includes('consecutive')), `same-type approach pair accepted: ${errs.join('; ')}`)
  // and the alternating original stays clean (already asserted above, but the contrast is the point)
  assert(checkPianoLick('fixture', goodPianoLick(), 'jazz', new Set()).length === 0, 'alternating enclosure rejected')
})

check('chrom-below of a root-position target FAILS (derives −1, below the window)', () => {
  const lick = goodPianoLick()
  lick.notes = [{ approach: 'chrom-below', beat: 1 }, { deg: '1', beat: 2 }]
  const errs = checkPianoLick('fixture', lick, 'jazz', new Set())
  assert(errs.some((e) => e.includes('derives −1')), `sub-window approach accepted: ${errs.join('; ')}`)
})

check("range cap bites both ways: deg '5' octave 2 (=31) and chrom-above of a 25-offset target (=26) FAIL", () => {
  const lick = goodPianoLick()
  lick.notes[0] = { deg: '5', octave: 2, beat: 1 } // 7 + 24 = 31 > 25
  const errs = checkPianoLick('fixture', lick, 'jazz', new Set())
  assert(errs.some((e) => e.includes(`max ${PIANO_LICK_MAX_OFFSET}`)), `31-semitone deg accepted: ${errs.join('; ')}`)
  const lick2 = goodPianoLick() // b9 @ octave 2 = 25 (legal boundary); chrom-above derives 26
  lick2.quality = 'dom7'
  lick2.notes = [{ approach: 'chrom-above', beat: 1 }, { deg: 'b9', octave: 2, beat: 2 }]
  const errs2 = checkPianoLick('fixture', lick2, 'jazz', new Set())
  assert(errs2.some((e) => e.includes('derived pitch sits 26')), `26-semitone derived approach accepted: ${errs2.join('; ')}`)
  const lick3 = goodPianoLick() // the 25 boundary itself is legal: high root via octave 2 + b9… use deg '1' octave 2 = 24 and chrom-above = 25
  lick3.notes = [{ approach: 'chrom-above', beat: 1 }, { deg: '1', octave: 2, beat: 2 }]
  assert(checkPianoLick('fixture', lick3, 'jazz', new Set()).length === 0,
    'the 25-semitone boundary (chrom-above of the double-octave root) was rejected — cap off by one')
})

check('bad octave values FAIL (3 and non-integers rejected; approaches take no octave)', () => {
  const lick = goodPianoLick()
  lick.notes[0] = { deg: '5', octave: 3, beat: 1 }
  assert(checkPianoLick('fixture', lick, 'jazz', new Set()).some((e) => e.includes('octave, when present, must be 0, 1 or 2')),
    'octave 3 accepted')
  const lick2 = goodPianoLick()
  lick2.notes[1] = { approach: 'chrom-above', octave: 1, beat: 2 }
  assert(checkPianoLick('fixture', lick2, 'jazz', new Set()).some((e) => e.includes('octave applies to deg notes only')),
    'octave on an approach accepted')
})

check("guitar-only technique words FAIL on piano ('bend' in summary; 'vibrato' per-note; summary honesty)", () => {
  const lick = goodPianoLick()
  lick.techniques = ['grace-note', 'bend']
  assert(checkPianoLick('fixture', lick, 'jazz', new Set()).some((e) => e.includes("unknown piano technique 'bend'")),
    "'bend' accepted on keys")
  const lick2 = goodPianoLick()
  lick2.notes[3].technique = 'vibrato'
  assert(checkPianoLick('fixture', lick2, 'jazz', new Set()).some((e) => e.includes("unknown piano technique 'vibrato'")),
    "'vibrato' accepted on keys")
  const lick3 = goodPianoLick()
  lick3.notes[3].technique = 'slide' // valid word, but not in techniques: [grace-note]
  assert(checkPianoLick('fixture', lick3, 'jazz', new Set()).some((e) => e.includes("must also appear in the lick's techniques[]")),
    'summary honesty not enforced')
})

check('beat range + ordering bite (beat 9; decreasing beats); density cap bites (17 notes)', () => {
  const lick = goodPianoLick()
  lick.notes[3].beat = 9
  assert(checkPianoLick('fixture', lick, 'jazz', new Set()).some((e) => e.includes('beat must be a number in [1, 9)')),
    'beat 9 accepted')
  const lick2 = goodPianoLick()
  lick2.notes[3].beat = 2.25 // after 2.5 — decreasing
  assert(checkPianoLick('fixture', lick2, 'jazz', new Set()).some((e) => e.includes('beats must be non-decreasing')),
    'decreasing beats accepted')
  const lick3 = goodPianoLick()
  lick3.notes = Array.from({ length: 17 }, () => ({ deg: '1' }))
  assert(checkPianoLick('fixture', lick3, 'jazz', new Set()).some((e) => e.includes('17 notes > 16')),
    '17-note lick accepted')
})

check('duplicate id FAILS (shared namespace with progressions and guitar licks)', () => {
  const ids = new Set()
  assert(checkPianoLick('fixture', goodPianoLick(), 'jazz', ids).length === 0, 'first insert should pass')
  const errs = checkPianoLick('fixture', goodPianoLick(), 'jazz', ids)
  assert(errs.some((e) => e.includes('duplicate id')), `duplicate id accepted: ${errs.join('; ')}`)
})

// (The PianoLickCard vocab drift guard lives in §7b-piano below — it needs the
// jsx load hook, which is registered in §7.)

// ─── 6. Loop-detection truth fixtures (C-30) ──────────────────────────────────
//
// Run every scripts/loop-fixtures.mjs case against the REAL
// detectRepeatingProgression. Comparison is rotation-canonical on BOTH sides
// (the fixture module replicates theory.js's private `canonicalize`), so a
// correct loop reported from any rotation passes. Semantics:
//   · no expectedFail + mismatch → ✗ smoke failure (regression in what works)
//   · expectedFail + mismatch    → ⚠ annotated expected-fail (printed, counted,
//                                    NOT a failure — this is L-30's todo list)
//   · expectedFail + MATCH       → ✗ smoke failure: stale marker — the fixture
//                                    now passes, L-30 must flip expectedFail off
//
// The failure map of the current algorithm lives in the fixture file header.

console.log('\nLoop-detection fixtures (C-30):')

const { LOOP_FIXTURES, canonicalLoop } = await load('scripts/loop-fixtures.mjs')
let expectedFails = 0

check('loop-fixtures module exports a non-empty fixture array + canonicalLoop', () => {
  assert(Array.isArray(LOOP_FIXTURES) && LOOP_FIXTURES.length > 0, 'LOOP_FIXTURES missing/empty')
  assert(typeof canonicalLoop === 'function', 'canonicalLoop is not a function')
  const ids = new Set(LOOP_FIXTURES.map((f) => f.id))
  assert(ids.size === LOOP_FIXTURES.length, 'duplicate fixture ids')
  // canonicalLoop must be rotation-invariant (replica sanity: all rotations of a
  // loop normalise to the same key — the property the comparisons rely on).
  const key = canonicalLoop(['C', 'Am', 'F']).join(',')
  assert(canonicalLoop(['Am', 'F', 'C']).join(',') === key && canonicalLoop(['F', 'C', 'Am']).join(',') === key,
    'canonicalLoop is not rotation-invariant')
})

const loopKey = (loop) => (loop === null ? 'null' : canonicalLoop(loop).join(','))

for (const f of LOOP_FIXTURES ?? []) {
  const got = detectRepeatingProgression(f.history)
  const gotKey = loopKey(Array.isArray(got) ? got : null)
  const wantKey = loopKey(f.expect)
  const matches = gotKey === wantKey
  const label = `loop fixture '${f.id}' — ${f.description}`

  if (!f.expectedFail) {
    check(label, () => {
      assert(matches, `got [${gotKey}], expected [${wantKey}]`)
    })
  } else if (!matches) {
    // Documented current-algorithm failure — annotated, never silently skipped.
    expectedFails++
    console.log(`  ⚠ EXPECTED-FAIL ${label}\n      today: [${gotKey}] · contract (L-30): [${wantKey}]`)
  } else {
    // The algorithm now satisfies this contract — the marker is stale and MUST
    // be removed (L-30's DoD is zero expectedFail markers). Fail loudly.
    check(`${label} [STALE expectedFail marker]`, () => {
      assert(false, `fixture PASSES (got [${gotKey}]) but is still marked expectedFail — remove the marker in scripts/loop-fixtures.mjs`)
    })
  }
}

if (expectedFails) {
  console.log(`  (${expectedFails} annotated expected-fail(s) — the current detectRepeatingProgression's known gaps, awaiting L-30)`)
}

// ─── 7. Hand-sync drift guards (C-40) ─────────────────────────────────────────
//
// Two pieces of logic/data are deliberately duplicated by hand across files
// (src/ must not import from scripts/, so validator ↔ component pairs can't
// share a module). These guards turn silent drift into a red smoke run.
//
// (a) resolveDegree — scripts/validate-kb.mjs holds the KB contract's reference
//     implementation; src/components/JamGuide.jsx carries a hand-synced copy
//     (its header says "keep the two in sync by hand"). If they drift, authored
//     piano recipes validate against one rule and RENDER with another — wrong
//     pitches, no error. Guard: a LITERAL 16-degree × 14-quality truth table
//     (pinned values, NOT derived from CHORD_TYPES at runtime — deriving would
//     let the expectation co-move with the very code under test) asserted
//     against BOTH implementations for every pair.
//       · The validator's resolveDegree is unexported; it is probed BEHAVIOURALLY
//         through the exported checkPianoRecipe: recipe LH ['1','1','1', deg]
//         stacks 0 → 12 → 24 → 24 + offset (a repeated pc climbs an octave —
//         stackHand's documented convention), so the span error always fires
//         (span 25–36 > MAX_HAND_SPAN 15) and REPORTS the span, from which the
//         offset is recovered exactly: offset = span − 24 (36 → 0). An
//         unresolvable degree instead yields the 'unresolvable degree' error.
//       · JamGuide.jsx's copy IS directly comparable (since 2026-07-10):
//         L-40's ride-along exported `resolveDegree` (the C-40 follow-up), so
//         this section imports the real component module under the jsx load
//         hook below and sweeps the copy against the same pinned table, cell
//         for cell. A '.jsx'-retry resolve hook (registered next to the load
//         hook) lets JamGuide's extensionless component imports
//         ('./GlanceRail', './BassPatternCard'…) resolve under raw Node ESM —
//         the top-of-file hook only retries '.js'.
//
// (b) Technique vocabulary — validate-kb.mjs LICK_TECHNIQUES (the schema gate)
//     vs LickCard.jsx TECHNIQUE_VOCAB (the renderer's glyph vocabulary). A word
//     added to one but not the other means licks that validate but render with
//     no glyph, or dead glyph code. Guard: import BOTH and assert set-equality.
//     LickCard.jsx is JSX, so a node:module load hook transpiles .jsx on the
//     fly via esbuild (already in node_modules as Vite's transpiler).

console.log('\nHand-sync drift guards (C-40):')

// -- jsx load hook: lets Node import component files (esbuild transform) -------
register(
  'data:text/javascript,' +
    encodeURIComponent(`
      import { readFileSync } from 'node:fs'
      const esbuildP = import(${JSON.stringify(import.meta.resolve('esbuild'))})
      export async function load(url, context, next) {
        if (url.endsWith('.jsx')) {
          const { transform } = await esbuildP
          const src = readFileSync(new URL(url), 'utf8')
          const { code } = await transform(src, { loader: 'jsx', jsx: 'automatic', jsxImportSource: 'react' })
          return { format: 'module', source: code, shortCircuit: true }
        }
        return next(url, context)
      }
    `),
  import.meta.url,
)

// -- '.jsx' resolve retry: component files import siblings extensionless -------
// (e.g. JamGuide.jsx does `import GlanceRail from './GlanceRail'`; the top-of-
// file hook retries '.js' only). Registered last so it runs FIRST and catches
// the whole chain's failure, then retries with '.jsx' appended.
register(
  'data:text/javascript,' +
    encodeURIComponent(`
      export async function resolve(specifier, context, next) {
        try {
          return await next(specifier, context)
        } catch (e) {
          if (/^\\.{1,2}\\//.test(specifier) && !/\\.([mc]?js|jsx)$/.test(specifier)) {
            try { return await next(specifier + '.jsx', context) } catch { throw e }
          }
          throw e
        }
      }
    `),
  import.meta.url,
)

// -- (a) resolveDegree truth table ---------------------------------------------

// Quality order for the per-quality rows below (must stay CHORD_TYPES' keys —
// a new chord quality MUST extend this table, and the check enforces that).
const Q14 = ['maj', 'min', 'dom7', 'maj7', 'min7', 'dim', 'dim7', 'half_dim', 'aug', 'sus4', 'sus2', 'maj6', 'min6', 'add9']

// resolveDegree(deg, quality) → pitch-class offset from the chord root.
// Scalar = same for all 14 qualities (the fixed-offset degrees); array = one
// value per Q14 entry ('3'/'5'/'7' resolve through the quality's intervals).
// '2' is the canary row: not a legal degree, must stay null everywhere.
const DEGREE_TABLE = {
  '1': 0,
  'b9': 1,
  '9': 2,
  '#9': 3,
  '11': 5,
  '#11': 6,
  'b5': 6,
  'b13': 8,
  '13': 9,
  '6': 9,
  'b3': 3,
  'b7': 10,
  //     maj   min   dom7  maj7  min7  dim   dim7  ø     aug   sus4  sus2  maj6  min6  add9
  '3': [ 4,    3,    4,    4,    3,    3,    3,    3,    4,    5,    2,    4,    3,    4   ],
  '5': [ 7,    7,    7,    7,    7,    6,    6,    6,    8,    7,    7,    7,    7,    7   ],
  '7': [ null, null, 10,   11,   10,   null, 9,    10,   null, null, null, 9,    9,    null],
  '2': null,
}

// Behavioural probe of the validator's unexported resolveDegree (see header).
function probeValidatorResolveDegree(deg, quality) {
  const errs = checkPianoRecipe('probe', { recipe: { LH: ['1', '1', '1', deg] } }, quality)
  if (errs.some((e) => e.includes(`unresolvable degree '${deg}'`))) return null
  const m = errs.map((e) => /spans (\d+) semitones/.exec(e)).find(Boolean)
  if (!m) throw new Error(`probe(${deg}, ${quality}) got neither an 'unresolvable degree' nor a span error — checkPianoRecipe/stackHand changed shape; re-derive the probe. Errors: ${JSON.stringify(errs)}`)
  const offset = Number(m[1]) - 24
  return offset === 12 ? 0 : offset // '1'-repeat lands an octave up: span 36 ⇒ offset 0
}

check('truth table covers 16 degrees × all 14 CHORD_TYPES qualities', () => {
  const degs = Object.keys(DEGREE_TABLE)
  assert(degs.length === 16, `expected 16 degrees, table has ${degs.length}`)
  assert(Q14.join(',') === QUALITIES.join(','),
    `Q14 ≠ CHORD_TYPES keys — a quality was added/renamed; extend DEGREE_TABLE. Q14: ${Q14} · CHORD_TYPES: ${QUALITIES}`)
  for (const [deg, row] of Object.entries(DEGREE_TABLE))
    if (Array.isArray(row)) assert(row.length === 14, `row '${deg}' has ${row.length} entries, expected 14`)
})

// JamGuide's hand-synced copy, imported directly (exported by the L-40
// ride-along; transpiled by the jsx load hook above).
const jamGuideMod = await load('src/components/JamGuide.jsx')

check('JamGuide.jsx exports resolveDegree (L-40 ride-along) so the drift guard can sweep it directly', () => {
  assert(typeof jamGuideMod.resolveDegree === 'function',
    `resolveDegree is ${typeof jamGuideMod.resolveDegree}, expected an exported function — the export at JamGuide.jsx (see its header) was removed; the drift guard lost its direct probe`)
})

for (const [deg, row] of Object.entries(DEGREE_TABLE)) {
  check(`validator resolveDegree('${deg}') matches the pinned table for all 14 qualities`, () => {
    Q14.forEach((quality, qi) => {
      const want = Array.isArray(row) ? row[qi] : row
      const got = probeValidatorResolveDegree(deg, quality)
      assert(got === want,
        `resolveDegree('${deg}', '${quality}') drifted: validator says ${got}, pinned table says ${want} — re-sync scripts/validate-kb.mjs ↔ src/components/JamGuide.jsx (hand-synced pair) or fix the table if the contract legitimately changed`)
    })
  })
  check(`JamGuide resolveDegree('${deg}') matches the pinned table for all 14 qualities`, () => {
    Q14.forEach((quality, qi) => {
      const want = Array.isArray(row) ? row[qi] : row
      const got = jamGuideMod.resolveDegree(String(deg), quality) ?? null
      assert(got === want,
        `resolveDegree('${deg}', '${quality}') drifted: JamGuide.jsx says ${got}, pinned table says ${want} — re-sync src/components/JamGuide.jsx ↔ scripts/validate-kb.mjs (hand-synced pair) or fix the table if the contract legitimately changed`)
    })
  })
}

// -- (b) technique vocab set-equality -------------------------------------------

const lickCardMod = await load('src/components/LickCard.jsx')

check('LickCard.jsx imports under the jsx hook and exports TECHNIQUE_VOCAB', () => {
  assert(Array.isArray(lickCardMod.TECHNIQUE_VOCAB), 'TECHNIQUE_VOCAB is not an exported array')
  assert(lickCardMod.TECHNIQUE_VOCAB.length > 0, 'TECHNIQUE_VOCAB is empty')
})

check('TECHNIQUE_VOCAB (LickCard.jsx) ≡ LICK_TECHNIQUES (validate-kb.mjs) as sets', () => {
  const vocab = new Set(lickCardMod.TECHNIQUE_VOCAB ?? [])
  const schema = new Set(LICK_TECHNIQUES)
  const missingInCard = [...schema].filter((t) => !vocab.has(t))
  const missingInSchema = [...vocab].filter((t) => !schema.has(t))
  assert(missingInCard.length === 0 && missingInSchema.length === 0,
    `technique vocab drift — in validator but not LickCard: [${missingInCard}] · in LickCard but not validator: [${missingInSchema}] — the two lists are hand-synced; add the word to BOTH or neither`)
})

// -- (b-piano) piano technique vocab set-equality (C-60 forward guard) ----------
// Once D-60's PianoLickCard.jsx lands, its exported PIANO_TECHNIQUE_VOCAB must
// be set-equal to the validator's PIANO_LICK_TECHNIQUES — the same hand-sync
// rule as LickCard. Conditional so smoke stays green until the component
// exists, then bites automatically (D-60's DoD includes making this pass).
if (existsSync(join(ROOT, 'src/components/PianoLickCard.jsx'))) {
  const pianoCardMod = await load('src/components/PianoLickCard.jsx')
  check('PIANO_TECHNIQUE_VOCAB (PianoLickCard.jsx) ≡ PIANO_LICK_TECHNIQUES (validate-kb.mjs) as sets', () => {
    const vocab = new Set(pianoCardMod.PIANO_TECHNIQUE_VOCAB ?? [])
    const schema = new Set(PIANO_LICK_TECHNIQUES)
    const missingInCard = [...schema].filter((t) => !vocab.has(t))
    const missingInSchema = [...vocab].filter((t) => !schema.has(t))
    assert(missingInCard.length === 0 && missingInSchema.length === 0,
      `piano technique vocab drift — in validator but not PianoLickCard: [${missingInCard}] · in PianoLickCard but not validator: [${missingInSchema}] — hand-synced; add the word to BOTH or neither`)
  })
} else {
  warn('PianoLickCard vocab drift guard', 'src/components/PianoLickCard.jsx not yet authored (D-60)')
}

// ─── 8. Summary + exit code ───────────────────────────────────────────────────

const total = passed + failures.length
console.log('')
if (failures.length) {
  console.error(`✗ Smoke test FAILED — ${failures.length}/${total} check(s) failed:\n`)
  for (const f of failures) console.error('  ' + f)
  process.exit(1)
}
console.log(`✓ Smoke test passed — ${passed}/${total} checks green (${styleNames.length} styles, ${allIds.size} progressions)`
  + (expectedFails ? ` · ${expectedFails} annotated loop-fixture expected-fail(s) awaiting L-30` : ''))
process.exit(0)
