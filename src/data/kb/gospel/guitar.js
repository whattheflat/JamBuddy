// Gospel guitar pack. Every shape's pitch classes were verified by note-spelling
// against standard tuning (EADGBe) and the chord quality before authoring.
// Voicing/comping references: hearandplay.com (gospel guitar comping, passing
// chords), pianogroove.com (sus/add9 colour, hymn reharmonization),
// jenslarsen.nl & jazzguitar.be (shell voicings, voice leading).

// --- Shell voicings (root + 3rd + 7th, fifth omitted) — the gospel-comp backbone ---
const SHELL_6 = { // root on the low-E string
  maj7: { rootStr: 6, offsets: [0, 'x', 1, 1, 'x', 'x'], fingers: [1, 0, 3, 4, 0, 0] }, // R–7–3
  dom7: { rootStr: 6, offsets: [0, 'x', 0, 1, 'x', 'x'], fingers: [1, 0, 2, 3, 0, 0] }, // R–♭7–3
  min7: { rootStr: 6, offsets: [0, 'x', 0, 0, 'x', 'x'], fingers: [1, 0, 2, 3, 0, 0] }, // R–♭7–♭3
}
const SHELL_5 = { // root on the A string
  maj7: { rootStr: 5, offsets: ['x', 0, -1, 1, 'x', 'x'], fingers: [0, 2, 1, 4, 0, 0] }, // R–3–7
  dom7: { rootStr: 5, offsets: ['x', 0, -1, 0, 'x', 'x'], fingers: [0, 2, 1, 3, 0, 0] }, // R–3–♭7
  min7: { rootStr: 5, offsets: ['x', 0, -2, 0, 'x', 'x'], fingers: [0, 3, 1, 4, 0, 0] }, // R–♭3–♭7
}

// --- 9th / colour voicings (the gospel "shine") ---
const MIN9_5 = { rootStr: 5, offsets: ['x', 0, -2, 0, 0, 0], fingers: [0, 2, 1, 3, 3, 3] }     // R–♭3–♭7–9–5
const MAJ9_6 = { rootStr: 6, offsets: [0, -1, 1, -1, 'x', 'x'], fingers: [2, 1, 4, 1, 0, 0] }   // R–3–7–9
const DOM9_6 = { rootStr: 6, offsets: [0, -1, 0, -1, 'x', 'x'], fingers: [3, 1, 2, 1, 0, 0] }   // R–3–♭7–9
const DOM9_5 = { rootStr: 5, offsets: ['x', 0, -1, 0, 0, 'x'], fingers: [0, 2, 1, 3, 4, 0] }    // R–3–♭7–9

// --- add9 / sus colour for the modern praise vamp ---
const ADD9_5 = { rootStr: 5, offsets: ['x', 0, -1, 2, 0, 'x'], fingers: [0, 2, 1, 4, 3, 0] }    // R–3–(root)–9
const ADD9_6 = { rootStr: 6, offsets: [0, -1, 'x', -1, 0, 'x'], fingers: [2, 1, 0, 1, 3, 0] }   // R–3–9–5
const SUS4_5 = { rootStr: 5, offsets: ['x', 0, 'x', 'x', 3, 0], fingers: [0, 1, 0, 0, 4, 1] }   // R–4–5
const SUS4_6 = { rootStr: 6, offsets: [0, 0, 'x', 'x', 0, 'x'], fingers: [1, 2, 0, 0, 3, 0] }   // R–4–5

// --- plain triads (the plagal "Amen" wants no extensions) ---
const MAJ_6 = { rootStr: 6, offsets: [0, 2, 2, 1, 'x', 'x'], fingers: [1, 3, 4, 2, 0, 0] }       // R–5–R–3 (E-shape)
const MAJ_5 = { rootStr: 5, offsets: ['x', 0, 2, 2, 2, 'x'], fingers: [0, 1, 2, 3, 4, 0] }       // R–5–R–3 (A-shape)

// --- the passing diminished 7th (#iv°7 / ♯i°7 — symmetric, one grip fits both) ---
const DIM7_5 = { rootStr: 5, offsets: ['x', 0, 1, -1, 1, 'x'], fingers: [0, 2, 3, 1, 4, 0] }     // R–♭5–𝄫7–♭3 (symmetric)

// --- the borrowed iv (minor 6th on the middle strings, for the tonicized Amen) ---
const MIN6_4 = { rootStr: 4, offsets: ['x', 'x', 0, -2, 0, -2], fingers: [0, 0, 3, 1, 4, 2] }    // R–♭3–6–R

export default {
  styleIntro:
    'Gospel guitar lives between the organ and the choir: short, voice-led grips that comp the changes without crowding the keys. The signature sounds are guide-tone shells for the moving 2–5–1 chains, 9th and add9 colour on the resting chords, sus tension in the modern praise vamp, and a single passing diminished that makes a plain hymn sound like church. Keep the fifth and often the root to the bass — your job is the 3rds, 7ths, and the colour note.',

  comping: [
    {
      label: 'Triplet shuffle (12/8 church feel)',
      rhythm: '♪♪♪ ♪♪♪ (compound, lilting)',
      description: 'The default slow-gospel groove: a swung 12/8 with the chord landing on beat 1 and a soft stab on the last triplet partial of each beat. Let the long notes ring under the choir; chop the pickups.',
    },
    {
      label: 'Anticipated push into the change',
      rhythm: 'tied from the "and" before the bar',
      description: 'Strike the next chord an eighth (or final triplet) early and tie it over the barline — telegraphs the move to the band, the same anticipation gospel organists use to lead the turnaround.',
    },
    {
      label: 'Sustained pads (praise-vamp register)',
      rhythm: '𝅗𝅥 𝅗𝅥 (held, no chop)',
      description: 'For the sus/add9 vamp: let each grip ring its full bar high on the neck, no percussive damping — a guitar "pad" under the worship leader. Move only the changing voices between chords.',
    },
  ],

  plays: {
    'gospel-cycle-251': [
      {
        label: 'Shell chain, guide-tone glue',
        level: 'intermediate',
        chords: [
          { shape: SHELL_5.min7, note: 'iii7 — R–♭3–♭7' },
          { shape: SHELL_6.dom7, note: 'VI7 — the ♭3 of iii falls a half-step to the 3rd of VI7' },
          { shape: SHELL_5.min7, note: 'ii7 — back to the minor grip' },
          { shape: SHELL_6.dom7, note: 'V7 — ♭7 leads down to the maj-3rd of I' },
          { shape: SHELL_6.maj7, note: 'Imaj7 — home' },
        ],
        tips: 'Roots alternate 5th-string → 6th-string at nearly the same fret; the two guide tones move 0–1 fret per change. Follow the D and G strings — that thread is the whole cascade.',
      },
      {
        label: '9th-coloured cycle (upper register)',
        level: 'intermediate',
        chords: [
          { shape: MIN9_5, extensions: ['9'], note: 'iii9 — R–♭3–♭7–9–5' },
          { shape: DOM9_6, extensions: ['9'], note: 'VI9 — R–3–♭7–9' },
          { shape: MIN9_5, extensions: ['9'], note: 'ii9 — same grip slid down' },
          { shape: DOM9_6, extensions: ['9'], note: 'V9 — the dominant shine' },
          { shape: MAJ9_6, extensions: ['9'], note: 'Imaj9 — resolve with the 9 on top' },
        ],
        tips: 'Same harmony as the shells but each chord gains its 9th for the gospel "shimmer". The two dominant grips are identical shapes a 5th apart — learn one and transpose.',
      },
    ],

    'gospel-amen-625': [
      {
        label: 'Shells through the turnaround + plain Amen',
        level: 'intermediate',
        chords: [
          { shape: SHELL_6.min7, note: 'vi7' },
          { shape: SHELL_5.min7, note: 'ii7' },
          { shape: SHELL_6.dom7, note: 'V7' },
          { shape: SHELL_5.maj7, note: 'Imaj7' },
          { shape: MAJ_6, note: 'IV — plain triad: the plagal "Amen" wants no extensions' },
          { shape: SHELL_6.maj7, note: 'Imaj7 — final resolution' },
        ],
        tips: 'Comp the 6–2–5–1 with the small shells, then drop to bare IV–I triads for the Amen so the cadence lands clean and hymn-like. The contrast between busy turnaround and plain plagal tag is the whole effect.',
      },
      {
        label: '9th turnaround, triad Amen high',
        level: 'intermediate',
        chords: [
          { shape: MIN9_5, extensions: ['9'], note: 'vi9' },
          { shape: MIN9_5, extensions: ['9'], note: 'ii9 — same grip down the neck' },
          { shape: DOM9_5, extensions: ['9'], note: 'V9' },
          { shape: MAJ9_6, extensions: ['9'], note: 'Imaj9' },
          { shape: MAJ_5, note: 'IV — A-shape triad for the Amen' },
          { shape: MAJ9_6, extensions: ['9'], note: 'Imaj9 — back home with colour' },
        ],
        tips: 'A richer reading: 9ths through the turnaround, then a clean triad IV for the plagal cadence before the maj9 resolves it. Keep the Amen quieter than the turnaround — dynamics sell the cadence.',
      },
    ],

    'gospel-iv-passing-dim': [
      {
        label: 'Open-string add9 with the passing diminished',
        level: 'intermediate',
        chords: [
          { shape: ADD9_6, note: 'Iadd9 — R–3–5–9, low register' },
          { shape: MAJ_5, note: 'IV — plain A-shape triad' },
          { shape: DIM7_5, note: '#iv°7 — chromatic passing chord, bass walks 4 → #4' },
          { shape: ADD9_6, note: 'Iadd9 — resolve up to I as the bass reaches 5/1' },
        ],
        tips: 'The whole move is one bass walk: 4 → #4 → home. Hold the upper voices steady and let the diminished slide through underneath — that single borrowed chord is the gospel signature.',
      },
      {
        label: 'Compact add9 voicing up the neck',
        level: 'intermediate',
        chords: [
          { shape: ADD9_5, note: 'Iadd9 — R–3–(root)–9 on the A-string root' },
          { shape: MAJ_6, note: 'IV — E-shape triad' },
          { shape: DIM7_5, note: '#iv°7 — same diminished grip, one shape' },
          { shape: ADD9_5, note: 'Iadd9 — back home' },
        ],
        tips: 'A higher, tighter version of the same idea for when the bass and keys own the low end. The °7 is symmetric — the identical grip works from any of its four notes, so you can place it nearest the chords around it.',
      },
    ],

    'gospel-sus-vamp': [
      {
        label: 'Praise-vamp pads (sustained, high)',
        level: 'intermediate',
        chords: [
          { shape: MIN9_5, extensions: ['9'], note: 'vi9 — full ringing grip' },
          { shape: ADD9_5, note: 'IVadd9 — R–3–9 colour, no chop' },
          { shape: SUS4_6, note: 'Vsus4 — R–4–5; the 4th hangs, never resolving to the 3rd' },
          { shape: ADD9_6, note: 'Iadd9 — R–3–5–9 to land the loop' },
        ],
        tips: 'Let every chord ring its full bar like a synth pad — no percussive damping. The unresolved sus over V is what keeps the vamp lifting; loop it and the tension never closes.',
      },
      {
        label: 'Two-voice movement vamp (different register)',
        level: 'intermediate',
        chords: [
          { shape: SHELL_6.min7, note: 'vi7 — leaner shell to contrast the pads' },
          { shape: ADD9_6, note: 'IVadd9 — R–3–5–9 low' },
          { shape: SUS4_5, note: 'Vsus4 — A-string root, R–4–5' },
          { shape: ADD9_5, note: 'Iadd9 — compact, A-string root' },
        ],
        tips: 'Same vamp, sparser: a shell vi instead of the wide min9, and the sus voiced low. Use this when a second guitar or keys is already holding the pad — you supply motion, not width.',
      },
    ],

    'gospel-backdoor': [
      {
        label: 'Shells through the back door',
        level: 'intermediate',
        chords: [
          { shape: SHELL_5.min7, note: 'iii7' },
          { shape: SHELL_6.min7, note: 'vi7 — soft diatonic drop' },
          { shape: SHELL_5.dom7, note: '♭VII7 — the back-door dominant, a whole step below I' },
          { shape: SHELL_6.maj7, note: 'Imaj7 — resolves UP by step, not down a fifth' },
        ],
        tips: 'Listen for how ♭VII7 → I rises by a whole step into home rather than falling a fifth like V7 — a warmer, less expected cadence. The ♭7 of ♭VII7 is the ♭7 of the key: keep it under your fingers between the chords.',
      },
      {
        label: '9th-coloured back door',
        level: 'intermediate',
        chords: [
          { shape: MIN9_5, extensions: ['9'], note: 'iii9' },
          { shape: MIN9_5, extensions: ['9'], note: 'vi9 — same grip slid up a fourth' },
          { shape: DOM9_6, extensions: ['9'], note: '♭VII9 — back-door dominant with its 9' },
          { shape: MAJ9_6, extensions: ['9'], note: 'Imaj9 — soft landing' },
        ],
        tips: 'The two min9 chords are the identical shape a fourth apart — one of the easiest gospel moves to internalize. The maj9 resolution sounds especially plush after a back-door dominant.',
      },
    ],

    'gospel-walkup-dim': [
      {
        label: 'Walk-up on the A string (shells)',
        level: 'intermediate',
        chords: [
          { shape: SHELL_5.maj7, note: 'Imaj7 — root on the A string' },
          { shape: DIM7_5, note: '♯i°7 — one fret up: the ladder rung' },
          { shape: SHELL_5.min7, note: 'ii7 — one more fret: the bass arrived by half steps' },
          { shape: SHELL_6.dom7, note: 'V7 — turn around and climb again' },
        ],
        tips: 'The first three roots sit on one string, one fret apart — the walk-up is literally visible under your hand. Give the diminished its full beat but keep it quieter than the chords around it: it is a passing chord, a rung, not a destination. Over it, arpeggiate its four notes (all minor 3rds apart) — the fastest route from I\'s tones to ii\'s.',
      },
      {
        label: '9th-coloured walk-up (mixed registers)',
        level: 'intermediate',
        chords: [
          { shape: MAJ9_6, extensions: ['9'], note: 'Imaj9 — low root, the 9 shining on top' },
          { shape: DIM7_5, note: '♯i°7 — the diminished stays plain; its tension IS the colour' },
          { shape: MIN9_5, extensions: ['9'], note: 'ii9' },
          { shape: DOM9_5, extensions: ['9'], note: 'V9' },
        ],
        tips: 'Same climb with the gospel shimmer on the resting chords. Remember what the ♯i°7 really is — a rootless VI7♭9 aimed at ii — but not every note climbs: only the root rises a half step into ii\'s root, while the hidden dominant\'s ♭7 and ♭9 sigh downward into the ii9. Don\'t decorate the diminished; decorate its resolution.',
      },
    ],

    'gospel-tonicized-amen': [
      {
        label: 'Shell tag — one finger tells the story',
        level: 'intermediate',
        chords: [
          { shape: SHELL_6.maj7, note: 'Imaj7 — R–7–3' },
          { shape: SHELL_6.dom7, note: 'I7 — same grip, one finger drops a fret: the 7 falls to ♭7' },
          { shape: SHELL_5.maj7, note: 'IVmaj7 — same fret, root string up (the I7 pointed here)' },
          { shape: MIN6_4, note: 'iv6 — the borrowed minor on the middle strings' },
          { shape: SHELL_6.maj7, note: 'Imaj7 — home' },
        ],
        tips: 'Watch the two half-step falls: the I\'s major 7 drops to ♭7 (turning I into V7/IV), then the IV\'s 3rd drops to ♭3 (the borrowed iv). Everything else holds. When soloing, target exactly those two falling voices — the ♭7 of I7 resolves into the 3rd of IV, and the iv\'s ♭3 sighs down to the 9/1 of home.',
      },
      {
        label: '9th-coloured tag (upper register)',
        level: 'intermediate',
        chords: [
          { shape: MAJ9_6, extensions: ['9'], note: 'Imaj9' },
          { shape: DOM9_6, extensions: ['9'], note: 'I9 — the same one-finger drop, with the 9 held on top' },
          { shape: MAJ9_6, extensions: ['9'], note: 'IVmaj9 — identical grip five frets up' },
          { shape: MIN6_4, note: 'iv6 — drop to the plain borrowed minor; no 9 here' },
          { shape: MAJ9_6, extensions: ['9'], note: 'Imaj9 — resolve with colour' },
        ],
        tips: 'The maj9 → dom9 move is the same story as the shells — only the D-string finger moves, 7 falling to ♭7 — but the held 9 makes the tag glow. Leave the iv6 uncoloured: after four 9th chords, the bare borrowed minor is the emotional dip that sets up the resolution.',
      },
    ],
  },

  improv: {
    scales: [
      { over: 'ii7 / iii7 / vi7', scale: 'dorian', why: 'Minor 7 chords in a major key take Dorian — the natural 6 keeps them bright, not mournful, which suits gospel.' },
      { over: 'V7', scale: 'mixolydian', why: 'The built-in ♭7 fits the dominant; over the praise-vamp Vsus4, stay on the 4th (suspension) and avoid the leading tone until you want to resolve.' },
      { over: 'VI7 / ♭VII7', scale: 'mixolydian', why: 'Borrowed dominants are still dominants — Mixolydian off their own root. Over ♭VII7 that scale is the key\'s major scale starting on ♭7, so it stays diatonic-sounding into the resolution.' },
      { over: 'Imaj7 / Iadd9', scale: 'major', why: 'The home major (or its pentatonic) sings over the tonic; the major 6th and 9th are the gospel sweet notes — lean on them.' },
      { over: '#iv°7', scale: 'dim', why: 'A symmetric diminished (half-whole/whole-half) over the passing chord; it lasts a beat or two, so an arpeggio of its four notes usually says more than a run.' },
    ],
    targetNotes:
      'On the resting chords land the 6th or 9th, not just the root — those are the gospel colour tones. Through the 2–5–1 chains, target the 3rd of each new chord on the downbeat; the ♭7 of one dominant falls a half-step into the 3rd of the next chord, the same guide-tone rail as in jazz.',
    licks: [
      {
        over: 'gospel-amen-625',
        description: 'Classic plagal turn over the Amen: walk the bass/lowest voice down from the 1 of IV to the 5 then 1 of I (e.g. degrees 4-chord root → 3 → tonic), letting the major 3rd of I ring on the resolution. The whole point is the smooth descent into the cadence.',
        source: 'hearandplay.com — "Who Else Wants To Learn The Famous Amen Cadence?"; Wikipedia: Plagal cadence',
      },
      {
        over: 'gospel-iv-passing-dim',
        description: 'Over the IV → #iv°7 → I, run the diminished arpeggio (R–♭3–♭5–𝄫7, all minor-3rds apart) connecting the IV chord tones to the I chord tones — the symmetric shape lets you start it from whichever note sits nearest your IV grip and land on the 3rd of I.',
        source: 'hearandplay.com — "The [Extended] Resolution Of The #4-Diminished Seventh Chord"; pianogroove.com gospel passing chords',
      },
    ],
  },
}
