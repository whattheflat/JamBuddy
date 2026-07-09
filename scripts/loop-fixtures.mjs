// Loop-detection truth fixtures (task C-30) — the contract L-30 must satisfy.
//
// Each fixture is a realistic `chordHistory` as App.jsx commits it (plain chord
// name strings from matchChordFromChroma — "C", "Am", "G7", "Cmaj7"…; the commit
// layer at App.jsx:322-324 suppresses ADJACENT duplicates, so histories here are
// adjacent-dup-free except the one fixture that deliberately tests dups) plus the
// loop a musician would say they are playing (`expect`, or null for "no loop").
//
// Consumed by scripts/smoke.mjs:
//   · fixture without expectedFail that fails  → smoke exits non-zero (regression)
//   · fixture with expectedFail that fails     → annotated expected-fail (printed)
//   · fixture with expectedFail that PASSES    → smoke FAILS: stale marker, flip it
// L-30's definition of done = every expectedFail marker removed, all green.
//
// ─── FAILURE MAP OF THE CURRENT ALGORITHM ────────────────────────────────────
// (theory.js `detectRepeatingProgression`, every fixture RUN against it 2026-07-10;
//  the `today:` comment on each expectedFail fixture is the actual observed output)
//
// The current matcher: window = last 32 commits; candidate lengths 2–6; EXACT
// contiguous occurrence counting (scan advances by len on match, by 1 on miss);
// requires reps ≥ 2; score = reps × len²; returns the canonical (lexicographically
// smallest) rotation of the best candidate.
//
// 1. len²-weighting artifact — self-overlaps of a short vamp beat the vamp:
//    a 2-chord vamp ×4 reports the 3-chord [Am,G,Am] (2 reps × 3² = 18 beats the
//    true pair's 4 × 2² = 16); a SUSTAINED 2-chord vamp (full 32 window) reports
//    the bogus 5-chord [Am,Am,G,Am,G] (fixtures: vamp-2x4, vamp-2-sustained).
// 2. One SUBSTITUTED misdetection inside one rep of a 3-loop flips the winner to
//    a wrong 4-pattern: [F,C,Am,F] straddling the noise scores 2 × 4² = 32 and
//    beats the real [C,Am,F] at 3 × 3² = 27 (fixture: spurious-substitution).
//    NOTE: one INSERTED extra chord is survivable today — the miss-by-1 scan
//    realigns after it (fixture spurious-insert-once stays green).
// 3. Insertions in 2 of 4 reps → the same wrong-4-pattern failure (spurious-2of4).
// 4. Consecutive duplicate commits of one chord create a wrong 4-pattern
//    [C,Am,F,C] (2 × 16 > 3 × 9) instead of collapsing to the 3-loop
//    (fixture: dup-commit). Unreachable from TODAY'S commit layer (App.jsx
//    dedupes adjacent commits) — the fixture makes the detector safe standalone,
//    per L-30's "collapse consecutive duplicates" requirement.
// 5. Loop lengths 7–8 are structurally impossible (len caps at 6): a 7- or
//    8-chord loop ×2 returns a truncated 6-chord slice of itself, not the loop
//    (fixtures: seven-x2, eight-x2). This is the likely reading of the user's
//    "5 and then 2 others": a 5+2 = 7-chord FORM can never be detected.
// 6. No recency weighting: after a section change (loop A ×3 → loop B ×3) the
//    OLD 4-chord loop A still outscores the current 3-chord loop B
//    (3 × 4² = 48 > 3 × 3² = 27), so the display is stuck on the previous
//    section (fixture: section-change).
//
// What already WORKS at the pure-function level (regression guards — L-30 must
// keep these green): clean 2×3 / 3×2 / 3×3 / 4×3 / 6×2 loops; one inserted
// spurious chord; a 5-chord loop + 2-chord tag/turnaround, both with and without
// the loop resuming (the occurrence scan skips foreign chords). So if the user
// sees the 5+tag case fail live, the loss is in the App.jsx commit layer
// (miss-4-then-clear / 2-consecutive-identical vote) — that is L-31's territory,
// not this function's.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Rotation-minimal normalization — a LOCAL REPLICA of theory.js's private
 * `canonicalize` (it is not exported, and theory.js is locked to L-30, so we
 * must not touch it to export it). Same semantics byte-for-byte: pick the
 * lexicographically smallest rotation via '\0'-joined comparison, so [C,Am,F],
 * [Am,F,C] and [F,C,Am] all compare equal as loops.
 */
export function canonicalLoop(pattern) {
  let best = pattern
  for (let i = 1; i < pattern.length; i++) {
    const rot = [...pattern.slice(i), ...pattern.slice(0, i)]
    if (rot.join('\0') < best.join('\0')) best = rot
  }
  return best
}

// repeat a loop n times into one flat history
const reps = (loop, n) => Array.from({ length: n }, () => loop).flat()

export const LOOP_FIXTURES = [
  // ── Regression guards: what works today MUST keep working ──────────────────
  {
    id: 'clean-2x3',
    description: 'clean 2-chord vamp played 3× — the minimal detectable loop',
    history: reps(['Am', 'G'], 3),
    expect: ['Am', 'G'],
  },
  {
    id: 'clean-3x2',
    description: 'clean 3-chord loop played exactly 2× (6 commits, the minimum history)',
    history: reps(['C', 'Am', 'F'], 2),
    expect: ['C', 'Am', 'F'],
  },
  {
    id: 'clean-3x3',
    description: 'clean 3-chord loop played 3× — the plain "3 chords return" case',
    history: reps(['C', 'Am', 'F'], 3),
    expect: ['C', 'Am', 'F'],
  },
  {
    id: 'clean-4x3',
    description: 'clean 4-chord axis loop played 3×',
    history: reps(['C', 'G', 'Am', 'F'], 3),
    expect: ['C', 'G', 'Am', 'F'],
  },
  {
    id: 'clean-6x2',
    description: 'clean 6-chord loop played 2× — the top of the current length range',
    history: reps(['C', 'Am', 'Dm', 'G', 'Em', 'F'], 2),
    expect: ['C', 'Am', 'Dm', 'G', 'Em', 'F'],
  },
  {
    id: 'spurious-insert-once',
    description: '3-chord loop with ONE spurious chord INSERTED mid-rep (C Am F | C Am E7 F | C Am F) — the scan realigns after an insertion',
    history: ['C', 'Am', 'F', 'C', 'Am', 'E7', 'F', 'C', 'Am', 'F'],
    expect: ['C', 'Am', 'F'],
  },
  {
    id: 'five-plus-tag-resumes',
    description: '5-chord loop ×2, a 2-chord turnaround tag (Dm E7), then the loop resumes — loop must survive the tag',
    history: [...reps(['Am', 'F', 'C', 'G', 'Em'], 2), 'Dm', 'E7', 'Am', 'F', 'C', 'G', 'Em'],
    expect: ['Am', 'F', 'C', 'G', 'Em'],
  },
  {
    id: 'five-plus-tag-at-end',
    description: '5-chord loop ×2 then 2 foreign chords with the history ending there — the just-played loop must still be reported',
    history: [...reps(['Am', 'F', 'C', 'G', 'Em'], 2), 'Dm', 'E7'],
    expect: ['Am', 'F', 'C', 'G', 'Em'],
  },
  {
    id: 'chromatic-null',
    description: 'non-repeating chromatic walk — no loop exists, must report null',
    history: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G'],
    expect: null,
  },

  // ── Expected failures of the current algorithm — the L-30 contract ─────────
  {
    id: 'vamp-2x4',
    description: 'clean 2-chord vamp played 4× — must still report the pair, not a self-overlap',
    history: reps(['Am', 'G'], 4),
    expect: ['Am', 'G'],
    // today: returns [Am,Am,G] — the 3-chord self-overlap [Am,G,Am] scores
    // 2 reps × 3² = 18 and beats the true pair at 4 × 2² = 16 (failure map #1).
    expectedFail: true,
  },
  {
    id: 'vamp-2-sustained',
    description: 'sustained 2-chord vamp filling the whole window (×16) — the everyday two-chord jam',
    history: reps(['Am', 'G'], 16),
    expect: ['Am', 'G'],
    // today: returns [Am,Am,G,Am,G] — a bogus 5-chord self-overlap of the pair
    // wins on len² (failure map #1). A musician vamping Am–G sees a fake
    // 5-chord progression.
    expectedFail: true,
  },
  {
    id: 'spurious-substitution',
    description: '3-chord loop ×4 with ONE substituted misdetection (Am read as E7 in the third rep) — must still report the 3-loop',
    history: ['C', 'Am', 'F', 'C', 'Am', 'F', 'C', 'E7', 'F', 'C', 'Am', 'F'],
    expect: ['C', 'Am', 'F'],
    // today: returns [Am,F,F,C] — the wrong 4-pattern [F,C,Am,F] straddling the
    // noise scores 2 × 4² = 32 and beats the real loop's 3 × 3² = 27
    // (failure map #2). This is the user's "doesn't recognize when 3 chords
    // return": one bad commit and the display shows a 4-chord ghost.
    expectedFail: true,
  },
  {
    id: 'spurious-2of4',
    description: '3-chord loop ×4 with an inserted misdetection in two different reps (E7, then Dm7) — realistic sustained noise',
    history: ['C', 'Am', 'F', 'C', 'Am', 'E7', 'F', 'C', 'Am', 'F', 'C', 'Dm7', 'Am', 'F'],
    expect: ['C', 'Am', 'F'],
    // today: returns [Am,F,C,C] — a wrong 4-pattern beats the true 3-loop once
    // noise appears in more than one rep (failure map #3).
    expectedFail: true,
  },
  {
    id: 'dup-commit',
    description: 'consecutive duplicate commit of the same chord inside an otherwise clean 3-loop (C Am F C C Am F …) — dups must collapse',
    history: ['C', 'Am', 'F', 'C', 'C', 'Am', 'F', 'C', 'Am', 'F'],
    expect: ['C', 'Am', 'F'],
    // today: returns [Am,F,C,C] — the duplicate mints a wrong 4-pattern
    // [C,Am,F,C] at 2 × 16 = 32 vs the real loop's 27 (failure map #4).
    // App.jsx:322-324 currently suppresses adjacent dup commits, so this exact
    // history can't arise from today's commit layer — the fixture pins L-30's
    // "collapse consecutive duplicates before matching" so the detector is safe
    // standalone (and safe if L-31 changes the commit layer).
    expectedFail: true,
  },
  {
    id: 'seven-x2',
    description: '7-chord loop played 2× — beyond the current length-6 cap',
    history: reps(['Em', 'G', 'D', 'A', 'Em', 'C', 'B7'], 2),
    expect: ['Em', 'G', 'D', 'A', 'Em', 'C', 'B7'],
    // today: returns [A,Em,C,Em,G,D] — a truncated 6-chord slice of the loop,
    // because candidate lengths cap at 6 (failure map #5). The user's
    // "5 and then 2 others" = a 7-chord form is structurally undetectable.
    expectedFail: true,
  },
  {
    id: 'eight-x2',
    description: '8-chord loop (extended andalusian form) played 2× — beyond the current cap',
    history: reps(['Am', 'G', 'F', 'E7', 'Am', 'C', 'Dm', 'E7'], 2),
    expect: ['Am', 'G', 'F', 'E7', 'Am', 'C', 'Dm', 'E7'],
    // today: returns [Am,C,Am,G,F,E7] — again a wrong 6-chord truncation
    // (failure map #5).
    expectedFail: true,
  },
  {
    id: 'section-change',
    description: 'section change: 4-chord loop A ×3, then 3-chord loop B ×3 — must report B, the loop being played NOW',
    history: [...reps(['C', 'G', 'Am', 'F'], 3), ...reps(['Dm7', 'G7', 'Cmaj7'], 3)],
    expect: ['Dm7', 'G7', 'Cmaj7'],
    // today: returns [Am,F,C,G] — the STALE loop A: no recency weighting, so the
    // old section's 3 × 4² = 48 outscores the current section's 3 × 3² = 27
    // (failure map #6). The display stays stuck on the previous section.
    expectedFail: true,
  },
]

export default LOOP_FIXTURES
