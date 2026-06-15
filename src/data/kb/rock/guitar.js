// Rock guitar pack. Shapes verified by note-spelling against: guitarplayer.com
// (Malcolm Young, Hendrix rhythm rules), musicradar.com (Keith Richards grips,
// Andy Summers add9), appliedguitartheory.com (triads on string sets),
// fundamental-changes.com (open-G translations), justinguitar.com (unison bends).

// Power chords — the rock engine room. omit3: works over major or minor.
const P5R_6 = { rootStr: 6, offsets: [0, 2, 2, 'x', 'x', 'x'], fingers: [1, 3, 4, 0, 0, 0] } // R-5-R
const P5R_5 = { rootStr: 5, offsets: ['x', 0, 2, 2, 'x', 'x'], fingers: [0, 1, 3, 4, 0, 0] }

// Full barres.
const E_BARRE_MAJ = { rootStr: 6, offsets: [0, 2, 2, 1, 0, 0], fingers: [1, 3, 4, 2, 1, 1] }
const A_BARRE_MAJ = { rootStr: 5, offsets: ['x', 0, 2, 2, 2, 0], fingers: [0, 1, 2, 3, 4, 1] }
const E_BARRE_MIN = { rootStr: 6, offsets: [0, 2, 2, 0, 0, 0], fingers: [1, 3, 4, 1, 1, 1] }

// Open-position big chords (Malcolm Young) — render only when the chord root matches.
const OPEN_A = { onlyRoot: 9, frets: ['x', 0, 2, 2, 2, 0], fingers: [0, 0, 1, 2, 3, 0] }
const OPEN_G = { onlyRoot: 7, frets: [3, 2, 0, 0, 0, 3], fingers: [2, 1, 0, 0, 0, 3] }
const OPEN_D = { onlyRoot: 2, frets: ['x', 'x', 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2] }

// Triads on the top string sets — the second-guitar register.
const TRIAD_GBE_MAJ = { rootStr: 3, offsets: ['x', 'x', 'x', 0, 0, -2], fingers: [0, 0, 0, 3, 4, 1] }      // R-3-5
const TRIAD_GBE_MAJ_INV1 = { rootStr: 1, offsets: ['x', 'x', 'x', 1, 0, 0], fingers: [0, 0, 0, 2, 1, 1] }  // 3-5-R
const TRIAD_GBE_MIN_INV1 = { rootStr: 1, offsets: ['x', 'x', 'x', 0, 0, 0], fingers: [0, 0, 0, 1, 1, 1] }  // ♭3-5-R barre
const TRIAD_DGB_MAJ = { rootStr: 4, offsets: ['x', 'x', 0, -1, -2, 'x'], fingers: [0, 0, 3, 2, 1, 0] }     // R-3-5
const TRIAD_DGB_MIN = { rootStr: 4, offsets: ['x', 'x', 0, -2, -2, 'x'], fingers: [0, 0, 3, 1, 1, 0] }     // R-♭3-5

// Hendrix/Frusciante thumb-over E-shape — A string muted, fingers free to embellish.
const THUMB_E = { rootStr: 6, offsets: [0, 'x', 2, 1, 0, 0], fingers: [0, 0, 3, 2, 1, 1] }

// Police-style add9 stretches (clean arpeggio picking).
const ADD9_ARP = { rootStr: 6, offsets: [0, 'x', 2, 1, 0, 2], fingers: [1, 0, 3, 2, 1, 4] }   // R-R-3-5-9
const MADD9_ARP = { rootStr: 6, offsets: [0, 'x', 2, 0, 0, 2], fingers: [1, 0, 3, 1, 1, 4] }  // R-R-♭3-5-9

export default {
  styleIntro:
    'Rock rhythm guitar is arrangement: the same chords played as muted chugs, open-string detonations, or high triad shimmer depending on the section. With two guitars, split the register — one low and thick, one high and thin — and never share an octave.',

  comping: [
    {
      label: 'Straight-8ths downstroke drive',
      rhythm: '♪♪♪♪♪♪♪♪ all downstrokes',
      description: 'Relentless eighth-note downpicks on power chords, slight palm mute, no gaps — the punk/Ramones engine. Only works if the other guitar stays sparse or high.',
    },
    {
      label: 'Malcolm Young space',
      rhythm: 'accent hits + deliberate rests',
      description: 'Big open-position chords hit hard with silence between — the rests ARE the hook. Low gain, all downstrokes, let the band breathe.',
    },
    {
      label: 'Palm-muted chug with pushes',
      rhythm: 'muted 8ths/16ths, lift on the and-of-4',
      description: 'Muted root chug; lift the palm for full-ring accents on anticipations. High note-density, low spectral density — leaves room above.',
    },
    {
      label: 'Keith Richards sus figure',
      rhythm: 'hammer sus4/6 on the offbeats',
      description: 'Hold the A-shape barre, hammer the sus4 (B string +1) and the 6th (top string +2) on the "ands", pull back to the triad. The Start Me Up / Brown Sugar move.',
    },
    {
      label: 'Clean add9 arpeggio picking',
      rhythm: 'steady picked 8ths, light mute',
      description: 'Hold the add9 stretch and pick through it string by string — the Every Breath You Take verse texture everyone else lays out under.',
    },
  ],

  plays: {
    'rock-mixo-vamp': [
      {
        label: 'Big open chords (Malcolm)',
        level: 'intermediate',
        chords: [
          { shape: OPEN_A, note: 'I — open A, all six strings of it' },
          { shape: OPEN_G, note: '♭VII — open G' },
          { shape: OPEN_D, note: 'IV — open D' },
        ],
        tips: 'The open-chord version lives in the key of A (A–G–D). Hit hard, then shut up — the space between hits is the AC/DC trick. In other keys, use the barre or triad play.',
      },
      {
        label: 'Second-guitar triads, top strings',
        level: 'intermediate',
        chords: [
          { shape: TRIAD_GBE_MAJ, note: 'I up high' },
          { shape: TRIAD_GBE_MAJ_INV1, note: '♭VII — nearest inversion, no jump' },
          { shape: TRIAD_GBE_MAJ, note: 'IV' },
        ],
        tips: 'This is the guitar-2 part: triads above fret 5 while someone else owns the low end. Move to the nearest inversion, not the same shape up the neck.',
      },
    ],

    'rock-145': [
      {
        label: 'Barres, straight-8ths drive',
        level: 'intermediate',
        chords: [
          { shape: E_BARRE_MAJ, note: 'I — 6th-string root' },
          { shape: A_BARRE_MAJ, note: 'IV — same fret, root string up' },
          { shape: A_BARRE_MAJ, note: 'V — two frets up' },
        ],
        tips: 'Same I/IV/V geometry as a blues: one position, two grips. Verse = palm-muted, chorus = open. The dynamic contrast is the part.',
      },
      {
        label: 'Keith sus figure on the IV and V',
        level: 'intermediate',
        chords: [
          { shape: A_BARRE_MAJ, note: 'hammer the sus4 (B string +1) on the and-beats' },
          { shape: A_BARRE_MAJ, note: 'same figure — sus4 and 6th (top string +2) trading' },
          { shape: A_BARRE_MAJ, note: 'resolve the hammer INTO the change' },
        ],
        tips: 'The grip stays still; two fingers do the talking. Swing the hammers slightly even over straight drums — that lag is the Stones feel.',
      },
    ],

    'rock-minor-descent': [
      {
        label: 'Barres walking down the 6th string',
        level: 'intermediate',
        chords: [
          { shape: E_BARRE_MIN, note: 'i' },
          { shape: E_BARRE_MAJ, note: '♭VII — two frets down' },
          { shape: E_BARRE_MAJ, note: '♭VI — two more' },
          { shape: E_BARRE_MAJ, note: 'V — one more half-step, the borrowed pull home' },
        ],
        tips: 'The whole progression is the low-E string walking down: root, -2, -4, -5 frets. Let the audience hear that bassline inside your chords.',
      },
      {
        label: 'High triads (Watchtower texture)',
        level: 'intermediate',
        chords: [
          { shape: TRIAD_DGB_MIN, note: 'i — middle-string triad' },
          { shape: TRIAD_DGB_MAJ, note: '♭VII' },
          { shape: TRIAD_DGB_MAJ, note: '♭VI' },
          { shape: TRIAD_DGB_MAJ, note: 'V' },
        ],
        tips: 'Strum these as 16th-note skanks or let them ring — either way you\'re the texture, not the foundation. Classic when keys or a second guitar hold the low end.',
      },
    ],

    'rock-axis': [
      {
        label: 'Power-chord chug',
        level: 'intermediate',
        chords: [
          { shape: P5R_6, omit3: true, note: 'I' },
          { shape: P5R_6, omit3: true, note: 'V' },
          { shape: P5R_6, omit3: true, note: 'vi — same shape; the bass note carries the minor' },
          { shape: P5R_5, omit3: true, note: 'IV — 5th-string root keeps you in position' },
        ],
        tips: 'No 3rds anywhere — major and minor come from the root motion, which is why one shape plays the whole loop. Save the full barres for the last chorus.',
      },
      {
        label: 'Add9 arpeggio verse (Police)',
        level: 'intermediate',
        chords: [
          { shape: ADD9_ARP, extensions: ['9'], note: 'pick through, low to high, let it ring' },
          { shape: ADD9_ARP, extensions: ['9'], note: '' },
          { shape: MADD9_ARP, extensions: ['9'], note: 'minor add9 — one finger lifts' },
          { shape: ADD9_ARP, extensions: ['9'], note: '' },
        ],
        tips: 'It\'s a stretch — practise the grip high on the neck first, then move down. Light palm mute, clean tone, metronomic 8ths: the part is a clock, not a riff.',
      },
    ],

    'rock-riff-cell': [
      {
        label: 'Power chords (Smoke on the Water)',
        level: 'intermediate',
        chords: [
          { shape: P5R_6, omit3: true, note: 'i' },
          { shape: P5R_6, omit3: true, note: '♭III — three frets up, same shape' },
          { shape: P5R_6, omit3: true, note: 'IV — two more' },
        ],
        tips: 'Root–♭3–4 on one string is the riff; the power chords are it harmonised. The famous version is two-note 4ths on the middle strings — same cell.',
      },
      {
        label: 'Thumb-over with embellishments',
        level: 'intermediate',
        chords: [
          { shape: E_BARRE_MIN, note: 'i' },
          { shape: THUMB_E, note: '♭III — thumb takes the bass, hammer the sus4 (G string +1)' },
          { shape: THUMB_E, note: 'IV — add the 9 with the pinky (top string +2)' },
        ],
        tips: 'The Hendrix/Frusciante device: thumb frets the root, the freed fingers decorate inside the chord. The Dorian IV is where the colour lives — lean on it.',
      },
    ],
  },

  improv: {
    scales: [
      { over: 'i / I', scale: 'minor', why: 'Minor pentatonic box 1 plus the ♭5 (blues scale) is the rock default over almost everything.' },
      { over: 'I (country-rock)', scale: 'major', why: 'Major pentatonic for the Skynyrd/Allman sweetness — same box shape three frets down from the minor one.' },
      { over: 'I–♭VII–IV', scale: 'mixolydian', why: 'Major pentatonic + the ♭7 and 4. The ♭7 of the key IS the root of the ♭VII chord — free target note.' },
      { over: 'i–♭VII–♭VI', scale: 'minor', why: 'Natural minor (Aeolian): minor pentatonic + the 2 and ♭6 for the stepwise colour.' },
      { over: 'i–♭III–IV', scale: 'dorian', why: 'The major IV asks for Dorian — minor pentatonic + the natural 6.' },
    ],
    targetNotes:
      'Root and 5th are safe everywhere; the 3rd of the chord of the moment is the pro move. Double-stops are rock\'s vocabulary: Berry 4ths on the top two strings, unison bends, and the quarter-step blues curl on the ♭3.',
    licks: [
      {
        over: 'rock-145',
        description: 'Chuck Berry double-stop intro figure (Johnny B. Goode device, shown in A): one-finger barre on the top two strings, slid in from below, hammered in triplets.',
        tab: 'e|--5--5--5--5--5--5--5--5--5--5--5--5--\nB|3/5--5--5--5--5--5--5--5--5--5--5--5--\n    (slide in; A on e + E on B = root+5th of A)',
        source: 'Chuck Berry, "Johnny B. Goode" (1958); JustinGuitar song lesson SB-425',
      },
      {
        over: 'rock-axis',
        description: 'Box-1 unison bend cliché: bend the B-string ♭7 a whole step up to the root against the same note held on the top string (Hendrix "Purple Haze" outro, Page, May).',
        tab: 'e|---5------5------5------5----\nB|--8b10---8b10---8b10---8b10--\n    (G bent to A against the A on e-string 5)',
        source: 'JustinGuitar unison bend technique BL-607; Happy Bluesman unison bends',
      },
    ],
  },
}
