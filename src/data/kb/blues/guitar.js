// Blues guitar pack. Shapes verified by note-spelling against: guitarworld.com
// (13th chords, Jimmy Reed rhythm), fundamental-changes.com (SRV/Freddie King 9ths,
// turnarounds), truefire.com (Texas comping, chord-tone targeting), jazzguitar.be
// (tritone shells), guitarplayer.com (B.B. box, turnarounds).

// Big barre grips — full-band downbeat hits.
const E_BARRE7 = { rootStr: 6, offsets: [0, 2, 0, 1, 0, 0], fingers: [1, 3, 1, 2, 1, 1] }       // R-5-♭7-3-5-R
const A_BARRE7 = { rootStr: 5, offsets: ['x', 0, 2, 0, 2, 0], fingers: [0, 1, 3, 1, 4, 1] }     // R-5-♭7-3-5
const MIN7_BARRE_6 = { rootStr: 6, offsets: [0, 2, 0, 0, 0, 0], fingers: [1, 3, 1, 1, 1, 1] }   // Em-shape m7
const MIN7_BARRE_5 = { rootStr: 5, offsets: ['x', 0, 2, 0, 1, 0], fingers: [0, 1, 3, 1, 2, 1] } // Am-shape m7

// The blues colour chords — root on the A string.
const NINTH = { rootStr: 5, offsets: ['x', 0, -1, 0, 0, 0], fingers: [0, 2, 1, 3, 3, 3] }       // R-3-♭7-9-5
const THIRTEEN = { rootStr: 5, offsets: ['x', 0, -1, 0, 0, 2], fingers: [0, 2, 1, 3, 3, 4] }    // R-3-♭7-9-13
const THIRTEEN_6 = { rootStr: 6, offsets: [0, 'x', 0, 1, 2, 'x'], fingers: [1, 0, 2, 3, 4, 0] } // R-♭7-3-13 (T-Bone register)
const HENDRIX = { rootStr: 5, offsets: ['x', 0, -1, 0, 1, 'x'], fingers: [0, 2, 1, 3, 4, 0] }   // 7#9 — ♭3 vs 3 in one grip

// Two-note-tritone shells — the Chicago comping grips.
const SHELL7_6 = { rootStr: 6, offsets: [0, 'x', 0, 1, 'x', 'x'], fingers: [1, 0, 2, 3, 0, 0] } // R-♭7-3
const SHELL7_5 = { rootStr: 5, offsets: ['x', 0, 'x', 0, 2, 'x'], fingers: [0, 1, 0, 2, 4, 0] } // R-♭7-3
const SHELL_M7_5 = { rootStr: 5, offsets: ['x', 0, -2, 0, 'x', 'x'], fingers: [0, 3, 1, 4, 0, 0] } // R-♭3-♭7

export default {
  styleIntro:
    'Blues rhythm guitar is a drum kit with pitch: the shuffle is the job, the chord is the decoration. Pick a lane — low boogie locked with the bass, or high 9th-chord stabs answering the vocal — and never both at once.',

  comping: [
    {
      label: 'Jimmy Reed boogie shuffle',
      rhythm: 'swung 8ths: R+5 / R+6 alternating',
      description: 'Two-note dyads on the bottom strings, alternating the 5th and 6th above the root in swung eighths; move the same cell to the IV and V strings. Low register, dense — doubles the bass. The "second guitar" role Reed pioneered.',
    },
    {
      label: '9th-chord stabs (Texas / SRV)',
      rhythm: 'staccato hits, slide in from a half-step below',
      description: 'Short muted stabs of the 9th grip, approached from one fret under (B♭9→B9). Mid-high register, sparse — leaves the low end to the bass. The Freddie King "Hide Away" sound.',
    },
    {
      label: 'Slow blues 12/8',
      rhythm: 'rolled chords on a triplet grid',
      description: 'At ~60 BPM everything subdivides into triplets: arpeggiated 9ths, the 6↔9 rock on the top strings, fills answering the vocal. Density drops; space is the instrument.',
    },
    {
      label: 'Stormy Monday walk-up',
      rhythm: 'one chord per walking step, bars 7–8',
      description: 'Diatonic chord climb I7→ii7→iii7 then chromatic back down — a bassline played as chords. Canonical on the Allman Brothers\' At Fillmore East.',
    },
  ],

  plays: {
    'blues-12bar': [
      {
        label: 'Barre-chord shuffle',
        level: 'intermediate',
        chords: [
          { shape: E_BARRE7, note: 'I7 — root on the 6th string' },
          { shape: E_BARRE7, note: '' }, { shape: E_BARRE7, note: '' }, { shape: E_BARRE7, note: '' },
          { shape: A_BARRE7, note: 'IV7 — same fret, root string up' },
          { shape: A_BARRE7, note: '' },
          { shape: E_BARRE7, note: '' }, { shape: E_BARRE7, note: '' },
          { shape: A_BARRE7, note: 'V7 — two frets above the IV grip' },
          { shape: A_BARRE7, note: 'IV7' },
          { shape: E_BARRE7, note: '' },
          { shape: A_BARRE7, note: 'V7 — push into the next chorus' },
        ],
        tips: 'I, IV and V all live within two frets: 6th-string root, then 5th-string root at the same fret (IV) and two up (V). Strum short — the shuffle lives in the damping hand.',
      },
      {
        label: '9th-chord stabs (Texas)',
        level: 'intermediate',
        chords: [
          { shape: NINTH, extensions: ['9'], note: 'slide in from one fret below' },
          { shape: NINTH, extensions: ['9'], note: '' }, { shape: NINTH, extensions: ['9'], note: '' }, { shape: NINTH, extensions: ['9'], note: '' },
          { shape: NINTH, extensions: ['9'], note: 'IV9' }, { shape: NINTH, extensions: ['9'], note: '' },
          { shape: NINTH, extensions: ['9'], note: '' }, { shape: NINTH, extensions: ['9'], note: '' },
          { shape: THIRTEEN, extensions: ['9', '13'], note: 'V13 — pinky reaches the 13' },
          { shape: NINTH, extensions: ['9'], note: 'IV9' },
          { shape: NINTH, extensions: ['9'], note: '' },
          { shape: THIRTEEN, extensions: ['9', '13'], note: 'V13' },
        ],
        tips: 'Stab, mute, wait. The 13↔9 drop on the top string is a free melodic hook — comping that sounds like a horn section.',
      },
    ],

    'blues-quickchange': [
      {
        label: 'Tritone shells (Chicago)',
        level: 'intermediate',
        chords: [
          { shape: SHELL7_6, note: 'I7' },
          { shape: SHELL7_5, note: 'quick IV — only the inner pair moves' },
          { shape: SHELL7_6, note: '' }, { shape: SHELL7_6, note: '' },
          { shape: SHELL7_5, note: '' }, { shape: SHELL7_5, note: '' },
          { shape: SHELL7_6, note: '' }, { shape: SHELL7_6, note: '' },
          { shape: SHELL7_5, note: 'V7' },
          { shape: SHELL7_5, note: 'IV7' },
          { shape: SHELL7_6, note: '' },
          { shape: SHELL7_5, note: 'V7' },
        ],
        tips: 'Three strings, two of them the chord-defining tritone. Drop the I7\'s inner pair one fret and you\'re already playing the IV7\'s guide tones — the quick change costs one finger.',
      },
      {
        label: 'Big barres, quick four',
        level: 'intermediate',
        chords: [
          { shape: E_BARRE7, note: '' },
          { shape: A_BARRE7, note: 'the quick change — bar 2' },
          { shape: E_BARRE7, note: '' }, { shape: E_BARRE7, note: '' },
          { shape: A_BARRE7, note: '' }, { shape: A_BARRE7, note: '' },
          { shape: E_BARRE7, note: '' }, { shape: E_BARRE7, note: '' },
          { shape: A_BARRE7, note: 'V7' },
          { shape: A_BARRE7, note: 'IV7' },
          { shape: E_BARRE7, note: '' },
          { shape: A_BARRE7, note: 'V7' },
        ],
        tips: 'Accent bar 2 slightly — telegraphing the quick change keeps the whole jam from splitting between the two 12-bar variants.',
      },
    ],

    'blues-8bar': [
      {
        label: 'Barres through the 8-bar form',
        level: 'intermediate',
        chords: [
          { shape: E_BARRE7, note: 'I7' },
          { shape: A_BARRE7, note: 'V7 already — count!' },
          { shape: A_BARRE7, note: 'IV7' }, { shape: A_BARRE7, note: '' },
          { shape: E_BARRE7, note: '' },
          { shape: A_BARRE7, note: 'V7' },
          { shape: E_BARRE7, note: '' },
          { shape: A_BARRE7, note: 'V7 — turnaround' },
        ],
        tips: 'Half the length, twice the changes per chorus. Lock the form before decorating it.',
      },
      {
        label: '9ths and 13ths, uptown',
        level: 'intermediate',
        chords: [
          { shape: NINTH, extensions: ['9'], note: '' },
          { shape: THIRTEEN, extensions: ['9', '13'], note: 'V13' },
          { shape: NINTH, extensions: ['9'], note: 'IV9' }, { shape: NINTH, extensions: ['9'], note: '' },
          { shape: NINTH, extensions: ['9'], note: '' },
          { shape: THIRTEEN, extensions: ['9', '13'], note: '' },
          { shape: NINTH, extensions: ['9'], note: '' },
          { shape: THIRTEEN, extensions: ['9', '13'], note: '' },
        ],
        tips: 'The Key-to-the-Highway feel is gentle — roll the chords instead of stabbing them, triplet feel even at medium tempo.',
      },
    ],

    'blues-minor': [
      {
        label: 'm7 barres with the ♯9 climax',
        level: 'intermediate',
        chords: [
          { shape: MIN7_BARRE_6, note: 'i7' },
          { shape: MIN7_BARRE_6, note: '' }, { shape: MIN7_BARRE_6, note: '' }, { shape: MIN7_BARRE_6, note: '' },
          { shape: MIN7_BARRE_5, note: 'iv7' }, { shape: MIN7_BARRE_5, note: '' },
          { shape: MIN7_BARRE_6, note: '' }, { shape: MIN7_BARRE_6, note: '' },
          { shape: A_BARRE7, note: '♭VI7 — the drama bar' },
          { shape: HENDRIX, extensions: ['#9'], note: 'V7♯9 — the slow-blues scream' },
          { shape: MIN7_BARRE_6, note: '' }, { shape: MIN7_BARRE_6, note: '' },
        ],
        tips: 'Save your dynamics for bars 9–10: the ♭VI7→V7♯9 half-step drop is the whole emotional payload of the form. Everything before it is patience.',
      },
      {
        label: 'Upper-register minor comping',
        level: 'intermediate',
        chords: [
          { shape: MIN7_BARRE_5, note: 'i7 — A-string root, above the bass' },
          { shape: MIN7_BARRE_5, note: '' }, { shape: MIN7_BARRE_5, note: '' }, { shape: MIN7_BARRE_5, note: '' },
          { shape: SHELL_M7_5, note: 'iv7 — thin out, the singer is working' },
          { shape: SHELL_M7_5, note: '' },
          { shape: MIN7_BARRE_5, note: '' }, { shape: MIN7_BARRE_5, note: '' },
          { shape: THIRTEEN_6, extensions: ['13'], note: '♭VI13' },
          { shape: NINTH, extensions: ['9'], note: 'V9' },
          { shape: MIN7_BARRE_5, note: '' }, { shape: SHELL_M7_5, note: 'fade to the turnaround' },
        ],
        tips: 'Minor blues is usually slow — 12/8 triplet grid, rolled chords, and at least one full bar per chorus where you play nothing at all.',
      },
    ],

    'blues-turnaround': [
      {
        label: 'Shell cycle',
        level: 'intermediate',
        chords: [
          { shape: SHELL7_6, note: 'I7' },
          { shape: SHELL7_5, note: 'VI7' },
          { shape: SHELL_M7_5, note: 'ii7' },
          { shape: SHELL7_6, note: 'V7' },
        ],
        tips: 'Often two beats per chord, not a bar — practise it at both speeds. The roots fall in fifths from the VI on, so the grips alternate strings on their own.',
      },
      {
        label: 'Uptown 9ths (T-Bone)',
        level: 'intermediate',
        chords: [
          { shape: NINTH, extensions: ['9'], note: 'I9' },
          { shape: NINTH, extensions: ['9'], note: 'VI9' },
          { shape: MIN7_BARRE_5, note: 'ii7' },
          { shape: THIRTEEN, extensions: ['9', '13'], note: 'V13 — hold, then slide down a fret into the next chorus' },
        ],
        tips: 'This is the Stormy Monday sound: every dominant becomes a 9th or 13th, approached chromatically. Roll them lazily on the triplet grid.',
      },
    ],
  },

  improv: {
    scales: [
      { over: 'I7', scale: 'mixolydian', why: 'Major pentatonic and Mixolydian shine over the I — the sweet B.B. King side of the coin.' },
      { over: 'IV7', scale: 'mixolydian', why: 'Switch to minor pentatonic (or think the IV\'s own Mixolydian) when the IV arrives — the key\'s major 3rd clashes with its ♭7.' },
      { over: 'V7', scale: 'mixolydian', why: 'Each chord gets its own Mixolydian; adjacent ones differ by one note, so really it\'s "follow the chord tones."' },
      { over: 'i7 (minor blues)', scale: 'minor', why: 'Minor pentatonic + the natural 6 over the iv; harmonic minor colour over the V7.' },
    ],
    targetNotes:
      'The 3rd of the current chord at every change is the whole game; hit the ♭7 of the I in bar 4 to announce the IV. The blues curl — a quarter-step bend of the ♭3 toward the major 3 — is the signature ornament.',
    licks: [
      {
        over: 'blues-12bar',
        description: 'Classic descending turnaround in E (Robert Johnson "Kind Hearted Woman" lineage): ♭7–6–♭6–5 under a high-E pedal, swung triplets, resolving to B7.',
        tab: 'e|--0---0---0---0--------2--\nB|--3---2---1---0--------0--\nG|-----------------------2--\nD|-----------------------1--\nA|-----------------------2--\nE|--------------------------\n    D   C#  C   B   →  B7',
        source: 'GuitarPlayer "Blues Turnarounds Pt 1"; Fundamental Changes "Blues Turnarounds for Guitar"',
      },
      {
        over: 'blues-12bar',
        description: 'B.B. King box lick in C: major-pentatonic box around frets 8–10 with the signature 2→3 whole-step bend (D bent to E, the 3rd of C7).',
        tab: 'e|--8--10b12--10--8---------------\nB|------------------10--8---------\nG|------------------------9-------\n    C   D→E    D   C   A   G   E',
        source: 'GuitarPlayer "12 Killer Blues Licks"; Guitar World (B.B. box, R-2-4-5-6)',
      },
    ],
  },

  // Structured licks (SCHEMA.md "Licks", task P-21). Written in a home key each
  // (noted per lick) but key-agnostic in spirit — chordContext names the station.
  // Every pitch hand-verified: s6=E s5=A s4=D s3=G s2=B s1=e (+fret, mod 12).
  licks: [
    {
      // In C (box at fret 8): G C D→E C A G = 5 R 9→3 R 13 5, C major pentatonic
      // over the I7 — the sweet B.B. side of the coin.
      id: 'blues-bb-box-sweet',
      name: 'B.B. box sweet-spot phrase',
      level: 'foundation',
      chordContext: 'over the I7',
      techniques: ['bend', 'vibrato'],
      source: 'in the style of B.B. King\'s box-position fills; Guitar World "B.B. box" lessons (R-2-4-5-6 grid)',
      tab: [
        { string: 2, fret: 8 },                          // G — the 5th
        { string: 1, fret: 8 },                          // C — root
        { string: 1, fret: 10, technique: 'bend' },      // D bent a whole step to E, the 3rd — the signature move
        { string: 1, fret: 8 },                          // C
        { string: 2, fret: 10 },                         // A — the 13
        { string: 2, fret: 8, technique: 'vibrato' },    // G — settle on the 5th
      ],
    },
    {
      // In E, open position: ♭7–6–♭6–5 (D C♯ C B) descending on the B string
      // under a high-e root pedal, resolving to the V7's root (B).
      id: 'blues-open-turnaround',
      name: 'Descending turnaround under a root pedal',
      level: 'foundation',
      chordContext: 'bars 11–12: I7 walking down to the V7',
      techniques: ['double-stop', 'vibrato'],
      source: 'the Robert Johnson-lineage turnaround (e.g. "Kind Hearted Woman"); Fundamental Changes "Blues Turnarounds for Guitar"',
      tab: [
        { string: 2, fret: 3 },                              // D — ♭7
        { string: 1, fret: 0, technique: 'double-stop' },    // E pedal on top
        { string: 2, fret: 2 },                              // C♯ — 6
        { string: 1, fret: 0, technique: 'double-stop' },
        { string: 2, fret: 1 },                              // C — ♭6
        { string: 1, fret: 0, technique: 'double-stop' },
        { string: 2, fret: 0 },                              // B — 5
        { string: 1, fret: 0, technique: 'double-stop' },
        { string: 5, fret: 2, technique: 'vibrato' },        // B — root of the V7: the landing
      ],
    },
    {
      // In A, box 1: C→C♯ (♭3 hammered to the major 3) into the E+A double-stop,
      // ♭7 bend, settle on the 5th — the 12/8 slow-blues answer phrase.
      id: 'blues-slow-curl',
      name: 'Slow-blues curl into the root double-stop',
      level: 'intermediate',
      chordContext: 'over the I7, 12/8 slow blues',
      techniques: ['hammer-on', 'double-stop', 'bend', 'vibrato'],
      source: 'stock box-1 slow-blues vocabulary (the ♭3→3 curl); TrueFire Texas-blues chord-tone lessons',
      tab: [
        { string: 3, fret: 5 },                              // C — ♭3
        { string: 3, fret: 6, technique: 'hammer-on' },      // C♯ — the major 3rd; the blues curl made explicit
        { string: 2, fret: 5 },                              // E — 5th
        { string: 1, fret: 5, technique: 'double-stop' },    // A on top — root+5th dyad
        { string: 2, fret: 8, technique: 'bend' },           // G (♭7) bent a whole step toward the root
        { string: 2, fret: 5, technique: 'vibrato' },        // E — resolve on the 5th
      ],
    },
    {
      // In A (IV = D9): the IV7's 3+♭7 tritone pair (F♯+C) slid in from one fret
      // below (F+B), then the 5th on top — the Texas comping move as a lick.
      id: 'blues-iv9-slide',
      name: 'Tritone slide into the IV9',
      level: 'intermediate',
      chordContext: 'bar 5: landing on the IV7',
      techniques: ['chromatic-approach', 'double-stop', 'slide', 'vibrato'],
      source: 'the Texas/Freddie King 9th-grip slide-in ("Hide Away" comping vocabulary); Fundamental Changes SRV/Freddie King 9ths',
      tab: [
        { string: 4, fret: 3, technique: 'chromatic-approach' }, // F — one fret below the 3rd
        { string: 3, fret: 4, technique: 'double-stop' },        // B — one fret below the ♭7
        { string: 4, fret: 4, technique: 'slide' },              // F♯ — the IV7's 3rd
        { string: 3, fret: 5, technique: 'double-stop' },        // C — the IV7's ♭7: the tritone pair lands
        { string: 1, fret: 5, technique: 'vibrato' },            // A — the IV7's 5th (the key's root)
      ],
    },
  ],
}
