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

// ─── 3. Summary + exit code ───────────────────────────────────────────────────

const total = passed + failures.length
console.log('')
if (failures.length) {
  console.error(`✗ Smoke test FAILED — ${failures.length}/${total} check(s) failed:\n`)
  for (const f of failures) console.error('  ' + f)
  process.exit(1)
}
console.log(`✓ Smoke test passed — ${passed}/${total} checks green (${styleNames.length} styles, ${allIds.size} progressions)`)
process.exit(0)
