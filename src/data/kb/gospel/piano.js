// Gospel piano pack (task P-23). Recipes verified by degree-spelling against
// CHORD_TYPES (src/lib/theory.js) and the validator's stacking convention
// (order inside each hand = voicing order low → high, documented at
// jazz/piano.js header). Voicings and treatments sourced from:
// hearandplay.com — "Gospel Pianists: Don't Leave Home Without These Essential
// Chords" (root–5 / octave left hands, full RH stacks), "Little known ways to
// use diminished walk-ups and walk-downs" (♯i°7/♯iv°7 as passing chords),
// "Gospel Piano Scales — 6 Different Scales That Can Work Now" (the
// pentatonic-♭3 "gospel scale"), and GospelKeys 202 (replacing plain triads
// with full-sounding 9th/6-9 voicings in worship playing);
// pianogroove.com — "Gospel Passing Chords & Substitutions", "Blues & Gospel
// Walk-Ups", "Gospel Hymn Styles" and "Gospel Time Signatures" (12/8 and 6/8
// hymn feels), "The Gospel Walk Down";
// piano.org — "Rootless Voicings: Type A and Type B (Bill Evans Style)" (the
// rootless grips contemporary gospel borrows once a bassist is present);
// pianowithjonny.com — "Play Gospel Piano: The 6-Step Beginner Guide"
// (root–5 foundations, add9/6th colour); learncolorpiano.com — "Gospel
// Progression 1 | Diminished 7th Chords" (rolling the passing °7).
// Voice-leading statements in notes/tips are pitch-class arithmetic, checked
// against the realized voicings (key of C) before writing.

// Reusable degree recipes. Order inside each hand = voicing order, low → high.
const LH_R5 = ['1', '5']             // open fifth — the hymn "pillar" left hand
const LH_OCT = ['1', '1']            // root octave — gospel's bass-player left hand
const RH_7TH = ['3', '5', '7']       // root-position seventh-chord upper structure
const RH_9TH = ['3', '5', '7', '9']  // the full-sounding 9th stack (GospelKeys-style)
const RH_ADD9 = ['3', '5', '9']      // triad with the 9 on top (no 7th)
const RH_69 = ['3', '5', '6', '9']   // the 6/9 landing hand — gospel's final chord

export default {
  styleIntro:
    'In church the piano often IS the rhythm section: the left hand supplies the bass (roots, fifths, octaves), the right hand supplies the choir (full triads and 7ths with 9ths and 6ths stacked in), and the space between chords is filled with walk-ups and passing diminisheds. Everything is voiced full and vocal — every chord supports a singer, and every voice is always headed somewhere: to the 4, to the Amen, back home.',

  comping: [
    {
      label: '12/8 hymn pulse',
      rhythm: 'four beats to the bar, each felt in three (12/8)',
      description:
        'The slow-gospel foundation: block both hands on the four main beats and let the triplet subdivision breathe underneath. Roll the bigger chords bottom-to-top into beats 1 and 3 — on a hymn the roll is the ornament, not the notes.',
    },
    {
      label: 'Walk-up into the downbeat',
      rhythm: 'beats 3–4 walk, land on 1',
      description:
        'Gospel\'s transitional engine: on the last beats of the bar the left hand climbs stepwise or chromatically (often through a passing diminished) so the next chord\'s downbeat lands like an arrival. The chord change is announced before it happens.',
    },
    {
      label: 'Shout-drive stabs',
      rhythm: 'relentless on-beat quarters, both hands',
      description:
        'The praise-break gear: octave roots in the left hand, full stacks in the right, hammered on every beat of a fast swung 4/4. Where jazz comping avoids downbeats, shout playing owns them — the piano is driving the room, not commenting on it.',
    },
  ],

  plays: {
    'gospel-cycle-251': [
      {
        label: 'Church pillars (root–5 under stacked 9ths)',
        level: 'intermediate',
        chords: [
          { recipe: { LH: LH_R5, RH: RH_7TH }, note: 'plain minor 7 — save the colour for the chords that move' },
          { recipe: { LH: LH_R5, RH: ['3', '7', 'b9'] }, note: 'VI7♭9 — from the iii7 one RH note name holds (its ♭3 is this ♭7) and the other two each fall a half-step (5→♭9, ♭7→3)' },
          { recipe: { LH: LH_R5, RH: RH_9TH }, note: 'the VI7\'s ♭9 just fell a half-step onto this 5th' },
          { recipe: { LH: LH_R5, RH: RH_9TH }, note: 'two note names hold from the ii (♭3→♭7, 5→9); the ii\'s ♭7 fell a half-step onto this 3rd' },
          { recipe: { LH: LH_R5, RH: RH_9TH }, note: 'maj9 home — the V7\'s ♭7 fell a half-step onto this 3rd' },
        ],
        register: 'LH open fifths around C3, RH stacks just above middle C',
        tips: 'Root and fifth below, four-note stack above — the full-choir sound that lets a piano carry a congregation alone. The cycle teaches one law: at every change the old ♭7 falls onto the new 3rd — a half-step when the landing chord is major or dominant (iii7→VI7, ii7→V7, V7→I), a whole step when it lands on the minor ii (VI7→ii7). Hear that thread and the whole chain plays itself.',
      },
      {
        label: 'Rootless cascade (band setting)',
        level: 'intermediate',
        chords: [
          { recipe: { LH: ['3', '5', '7'] }, note: '♭3–5–♭7, no root — the bass player has it' },
          { recipe: { LH: ['7', 'b9', '3'] }, note: 'from the iii7: one note name holds, two fall a half-step' },
          { recipe: { LH: ['3', '5', '7', '9'] }, note: 'out of the VI7 everything sinks: two half-steps and a whole step' },
          { recipe: { LH: ['7', '9', '3', '13'] }, note: 'three note names hold from the ii (♭3→♭7, 5→9, 9→13) — only the ♭7 moves, a half-step onto this 3rd' },
          { recipe: { LH: ['3', '5', '7', '9'] }, note: 'maj9 landing — the V\'s 3rd holds over as this maj7' },
        ],
        register: 'left hand alone, top note between C4 and C5 — right hand answers the choir',
        tips: 'Contemporary gospel borrows the jazz rootless grips the moment a bassist is on the platform: doubling their root just muddies the mix. Watch the ii7→V7 seam and count what your hand does — three fingers stay on the same note names (♭3→♭7, 5→9, 9→13) and one falls a half-step. That near-stillness over a moving bass is the sound of a tight church band.',
      },
    ],

    'gospel-amen-625': [
      {
        label: 'Hymn pillars into the Amen',
        level: 'intermediate',
        chords: [
          { recipe: { LH: LH_R5, RH: RH_7TH }, note: 'the turnaround starts its fall home' },
          { recipe: { LH: LH_R5, RH: RH_7TH }, note: 'the vi\'s ♭7 fell a whole step onto this ♭3' },
          { recipe: { LH: LH_R5, RH: RH_7TH }, note: 'the ii\'s ♭7 fell a half-step onto this 3rd' },
          { recipe: { LH: LH_R5, RH: RH_7TH }, note: 'home — the V\'s ♭7 fell a half-step onto this 3rd' },
          { recipe: { LH: LH_R5, RH: ['3', '5', '1'] }, note: 'inverted triad, root on top — set up the Amen fall' },
          { recipe: { LH: LH_R5, RH: RH_7TH }, note: 'Amen: all three RH voices sink — root-on-top a half-step onto the 3rd, 5th a half-step onto the maj7, 3rd a whole step onto the 5th' },
        ],
        register: 'LH fifths around C3, RH close position around middle C; 12/8 pulse',
        tips: 'The 6–2–5–1 is the same falling-fifths law as any turnaround: each ♭7 falls by step onto the next chord\'s 3rd. The Amen is the payoff — voice the IV with its root on top and every right-hand voice sinks into the I (two half-steps, one whole step). That downward sigh is why plagal cadences close hymns.',
      },
      {
        label: 'Octave bass, 6/9 colour (contemporary)',
        level: 'intermediate',
        chords: [
          { recipe: { LH: LH_OCT, RH: RH_ADD9 }, note: 'm9 spread — the 9 on top sings' },
          { recipe: { LH: LH_OCT, RH: RH_ADD9 }, note: 'same shape, next station of the fall' },
          { recipe: { LH: LH_OCT, RH: ['3', '7', '9'] }, note: 'V9 — its 9 will hold into the I as the 6th' },
          { recipe: { LH: LH_OCT, RH: RH_69 }, note: '6/9 instead of maj7 — the V9\'s ♭7 fell a half-step onto this 3rd, its 9 held as this 6' },
          { recipe: { LH: LH_OCT, RH: ['3', '6', '9'] }, note: 'IV as a 6/9 — every note of this hand is already a note of the I6/9' },
          { recipe: { LH: LH_OCT, RH: RH_69 }, note: 'the final chord of half the gospel repertoire: 6/9, root octave below' },
        ],
        register: 'LH octaves around C2–C3, RH between C4 and C5 — big and open',
        tips: 'Swapping the maj7 for the 6/9 is the single most gospel substitution there is — the 6th and 9th colour the tonic without the maj7\'s leading-tone rub against a melody on the root. The Amen becomes pure bass motion: every note of the IV6/9 right hand is already a tone of the I6/9 (its 3, 6 and 9 are the I\'s 6, 9 and 5), so those three note names hold, the I\'s 3rd joins beneath them, and the octave bass makes the change alone.',
      },
    ],

    'gospel-iv-passing-dim': [
      {
        label: 'The 4–♯4–5 walk (dim7 into I over its 5th)',
        level: 'intermediate',
        chords: [
          { recipe: { LH: LH_R5, RH: RH_ADD9 }, note: 'add9 home, open and ringing' },
          { recipe: { LH: ['1'], RH: ['3', '5', '1'] }, note: 'single bass note — the walk starts; root on top of the RH' },
          { recipe: { LH: ['1'], RH: RH_7TH }, note: 'two RH notes freeze (the IV\'s 3rd and 5th are this °7\'s ♭3 and ♭5); the top slips a whole step; the bass does the talking' },
          { recipe: { LH: ['5', '1'], RH: RH_ADD9 }, note: 'I over its 5th — the bass lands 4→♯4→5 while the °7\'s 𝄫7 rises a half-step onto this 3rd' },
        ],
        register: 'bass line front and centre (C2–C3); RH compact around middle C',
        tips: 'The whole point is the bass: 4, ♯4, 5 — two half-steps that turn a plain IV–I into church. Above it almost nothing moves: the ♯iv°7 keeps two of the IV\'s notes, and it already contains the key\'s home note (its ♭5), so the resolution is prepared before you play it. Landing on I-over-its-5th instead of root position is what makes the walk feel continuous — save root position for the phrase\'s final chord.',
      },
      {
        label: 'Praise clusters with a rolled diminished',
        level: 'intermediate',
        chords: [
          { recipe: { LH: LH_OCT, RH: ['9', '3', '5'] }, note: 'add9 cluster — 9 tucked under the 3rd, modern worship colour' },
          { recipe: { LH: LH_OCT, RH: ['9', '3', '5'] }, note: 'same grip, root a fourth up — the cluster shape carries the whole vamp' },
          { recipe: { LH: LH_OCT, RH: RH_7TH }, note: 'roll it bottom-to-top like a grace note — two of the IV\'s three cluster notes carry straight in' },
          { recipe: { LH: LH_OCT, RH: ['5', '1', '9'] }, note: 'open 5–1–9 — release after the crunch' },
        ],
        register: 'LH octaves; RH clusters between C4 and D5; straight-16th contemporary feel',
        tips: 'The 9-under-the-3rd cluster is the modern praise sound — tight, bright, no 7th. Treat the ♯iv°7 as a gesture, not a destination: roll it into the beat and let it release into the open 5–1–9 hand. One crunchy chord between two clean ones is exactly the dosage; two would be a jazz solo.',
      },
    ],

    'gospel-sus-vamp': [
      {
        label: 'Worship pads (one shape, four chords)',
        level: 'intermediate',
        chords: [
          { recipe: { LH: LH_R5, RH: RH_ADD9 }, note: 'm9 pad' },
          { recipe: { LH: LH_R5, RH: RH_ADD9 }, note: 'add9 — same grip, the roots do the work' },
          { recipe: { LH: LH_R5, RH: RH_ADD9 }, note: 'the "3rd" slot is the suspended 4th — which is the key\'s home note' },
          { recipe: { LH: LH_R5, RH: RH_ADD9 }, note: 'home, still hovering on the 9' },
        ],
        register: 'sustained, pedal down; LH fifths low, RH between C4 and C5',
        tips: 'One right-hand recipe — 3(4)–5–9 — planted on four different roots: this is how worship keyboardists play a whole set. The vamp hovers because the tonic note never leaves: it is the vi\'s ♭3, the IV\'s 5th and the Vsus\'s suspended 4th before it finally lands in the bass on the I. The Vsus\'s 9 is the vi\'s root — the loop\'s seam is sewn shut.',
      },
      {
        label: 'Anticipated stabs (octaves + clusters)',
        level: 'intermediate',
        chords: [
          { recipe: { LH: LH_OCT, RH: ['3', '5', '1'] }, note: 'first-inversion shape, root on top' },
          { recipe: { LH: LH_OCT, RH: ['9', '3', '5'] }, note: '9-cluster — tight against the pad version\'s spread' },
          { recipe: { LH: LH_OCT, RH: ['3', '1', '9'] }, note: 'sus stack: 4th, root, 9 — no 3rd to resolve' },
          { recipe: { LH: LH_OCT, RH: ['5', '1', '9'] }, note: 'two of the three stab notes (the key\'s 1 and 5) carry over from the Vsus' },
        ],
        register: 'both hands mid-keyboard, short and percussive; hit the and-of-4 and tie',
        tips: 'Same four chords, opposite job: instead of pads, strike each chord an eighth early (the and-of-4) and let the tie pull the band forward. Keep the right hand to three notes — stabs live or die on rhythm, and the Vsus→I seam proves how little needs to move: two of your three notes stay on the same note names while the octave bass resolves.',
      },
    ],

    'gospel-backdoor': [
      {
        label: 'Pillars: the back door swings on its 9',
        level: 'intermediate',
        chords: [
          { recipe: { LH: LH_R5, RH: RH_7TH }, note: 'soft diatonic start' },
          { recipe: { LH: LH_R5, RH: RH_7TH }, note: 'two note names carry over: the iii\'s root becomes this chord\'s 5th, its ♭3 becomes this ♭7' },
          { recipe: { LH: LH_R5, RH: RH_9TH }, note: '♭VII9 — the 9 of this chord is the key\'s home note; keep it on top of your ear' },
          { recipe: { LH: LH_R5, RH: RH_9TH }, note: 'maj9 — the back door\'s ♭7 sank a half-step onto this 5th, its 5th a half-step onto this 3rd' },
        ],
        register: 'LH fifths around C3, RH around middle C; unhurried',
        tips: 'The back door earns its name in the voice leading: where V7 resolves with leading-tone pull, the ♭VII7 slides home on two half-step sighs — its ♭7 onto the I\'s 5th and its 5th onto the I\'s 3rd — while its 9 (the key\'s home note) rings through the whole change. Play the ♭VII9 slightly softer than the chords around it; the surprise chord should whisper.',
      },
      {
        label: 'Rootless slide (band setting)',
        level: 'intermediate',
        chords: [
          { recipe: { LH: ['3', '5', '7'] }, note: 'three-note rootless — light' },
          { recipe: { LH: ['3', '5', '7'] }, note: 'the iii\'s ♭7 fell a whole step onto this ♭3' },
          { recipe: { LH: ['3', '13', '7', '9'] }, note: 'the vi\'s ♭3 and ♭7 are already this chord\'s 9 and 13 — two note names don\'t move' },
          { recipe: { LH: ['3', '5', '7', '9'] }, note: 'maj9 — the ♭VII\'s 13 was already this chord\'s 5th' },
        ],
        register: 'left hand alone, top note between C4 and C5',
        tips: 'The 13 is the trick: adding it to the ♭VII7 plants the I\'s 5th in your hand a bar early, and its 9 is the key\'s home note — so the "borrowed" chord is half at home before it resolves. Then the ♭7 sinks a half-step and the 3rd climbs a whole step onto the I\'s 3rd. Rootless because the bassist owns that ♭7̂ bass note — let them have the drama.',
      },
    ],

    'gospel-walkup-dim': [
      {
        label: 'Walk-up: the bass climbs, the hands barely move',
        level: 'intermediate',
        chords: [
          { recipe: { LH: ['1'], RH: ['3', '5', '1'] }, note: 'root on top — it will fall a whole step while the rest of the hand freezes' },
          { recipe: { LH: ['1'], RH: RH_7TH }, note: 'the I\'s 3rd and 5th ARE this °7\'s ♭3 and ♭5 — two RH notes don\'t move; the bass climbs a half-step' },
          { recipe: { LH: ['1'], RH: RH_7TH }, note: 'every RH note climbs a half- or whole-step; the bass takes its second half-step' },
          { recipe: { LH: ['1'], RH: RH_7TH }, note: 'the ii\'s ♭3 holds as this ♭7 (same note name); its ♭7 fell a half-step onto this 3rd' },
        ],
        register: 'single bass notes C2–C3 — the walking line is the melody; RH compact',
        tips: 'A walk-up is a bass line wearing chords: 1, ♯1, 2 in the left hand while the right hand moves as little as arithmetic allows — two notes literally frozen through the first change. It works because ♯i°7 is a rootless VI7♭9 (its four notes are exactly the top four of the VI7♭9), so the ear hears a secondary dominant pointing at the ii. Practise hands separately: bass alone should already sound like gospel.',
      },
      {
        label: 'Full-church walk-up (root–5 + 9ths)',
        level: 'intermediate',
        chords: [
          { recipe: { LH: LH_R5, RH: RH_9TH }, note: 'maj9 — big two-hand home' },
          { recipe: { LH: LH_R5, RH: RH_7TH }, note: 'thin to three: two RH notes freeze, the maj7 slips a half-step onto the 𝄫7, the 9 steps aside' },
          { recipe: { LH: LH_R5, RH: RH_9TH }, note: 'the whole right hand climbs by step out of the diminished — half-step, whole step, whole step — and the 9 returns on top' },
          { recipe: { LH: LH_R5, RH: ['3', '13', '7', '9'] }, note: 'V13 — three note names hold from the ii (♭3→♭7, 5→9, 9→13); only its ♭7 falls, a half-step onto this 3rd' },
        ],
        register: 'LH fifths around C3, RH between C4 and C5; land the changes on downbeats',
        tips: 'The same walk-up dressed for Sunday: open fifths under four-note stacks. Notice the diminished bar is the THIN one — dropping to three notes while the bass climbs makes the ♯i°7 feel like motion instead of mud, then the 9 coming back on the ii is the choir breathing in. The V13 grip (3–13–♭7–9) is the classic gospel dominant: learn it as one hand-shape and the ii7→V7 change costs you one finger.',
      },
    ],

    'gospel-tonicized-amen': [
      {
        label: 'The two sighs, voiced plain',
        level: 'intermediate',
        chords: [
          { recipe: { LH: LH_R5, RH: RH_7TH }, note: 'home, unhurried' },
          { recipe: { LH: LH_R5, RH: RH_7TH }, note: 'identical grip — one note changes: the 7 falls a half-step to the ♭7, and home becomes V7 of the IV' },
          { recipe: { LH: LH_R5, RH: RH_7TH }, note: 'the ♭7 fell a half-step onto this 3rd; the I\'s 3rd holds as this maj7 (same note name)' },
          { recipe: { LH: LH_R5, RH: ['3', '5', '6'] }, note: 'iv6: the 3rd sank a half-step to ♭3, the maj7 a whole step to the 6th, the 5th held' },
          { recipe: { LH: LH_R5, RH: RH_7TH }, note: 'the iv\'s ♭3 sighs a half-step onto this 5th; its 6th rises a whole step onto this 3rd' },
        ],
        register: 'LH fifths around C3, RH around middle C; 12/8, rolled arrivals',
        tips: 'Five chords, two borrowed notes, and each borrowed note resolves down a half-step — the ♭7 (into the IV\'s 3rd) and the borrowed ♭3 (into the I\'s 5th). Keep every other voice as still as the arithmetic allows and the tag plays like a pair of sighs, which is exactly how a congregation sings it. This is the hymn-ending to have under your fingers in all twelve keys.',
      },
      {
        label: 'Drive to the 4, land on the 6/9',
        level: 'intermediate',
        chords: [
          { recipe: { LH: LH_OCT, RH: RH_ADD9 }, note: 'add9 home over octaves' },
          { recipe: { LH: LH_OCT, RH: ['3', '7', '9'] }, note: 'the drive: swap the 5 for the ♭7 — one finger hops up a minor third, the rest freeze' },
          { recipe: { LH: LH_OCT, RH: RH_ADD9 }, note: 'arrival: the ♭7 sighed a half-step onto this 3rd, the 9 fell a whole step onto this 5th' },
          { recipe: { LH: LH_OCT, RH: ['3', '6', '9'] }, note: 'iv6/9: flatten the 3rd, swap the 5 for the 6 — the 9 on top never moves' },
          { recipe: { LH: LH_OCT, RH: RH_69 }, note: 'the iv\'s 6 and 9 are already this chord\'s 9 and 5 — those note names hold; the borrowed ♭3 resolves down a half-step (♭6̂ to 5̂ of the key)' },
        ],
        register: 'LH octaves low, RH between C4 and C5; push the I7 on the and-of-4',
        tips: 'The I7 is a gesture, not a chord to sit on: strike it late in the bar (and-of-4, tied) so it shoves the music into the IV — that anticipation is the "drive to the 4" every gospel pianist leans on. Coming home, count what actually moves: two of the iv6/9\'s three notes are already tones of the I6/9, only the borrowed ♭3 resolves (down a half-step), and the I\'s 3rd slips in at the bottom of the hand. Endings this quiet are earned by voicings this shared.',
      },
    ],
  },

  improv: {
    scales: [
      {
        over: 'I / Imaj7 / Iadd9',
        scale: 'major pentatonic + ♭3 (the gospel scale)',
        why: '1–2–♭3–3–5–6: major pentatonic with a ♭3 crush note (hearandplay teaches it as the pentatonic-♭3 scale). The ♭3→3 slip into a chord tone is the single most gospel ornament on the piano.',
      },
      {
        over: 'ii7',
        scale: 'dorian',
        why: 'The parent major scale started from 2 — no new notes to learn, and the natural 6 keeps the ii warm instead of mournful.',
      },
      {
        over: 'vi7 / iii7',
        scale: 'the key\'s own notes (aeolian / phrygian)',
        why: 'These minor chords are diatonic, so the major scale you are already in covers them — from the vi it sounds aeolian, from the iii phrygian. Aim at each chord\'s ♭3 and ♭7 rather than reaching for a new scale.',
      },
      {
        over: 'dom7 (V7, VI7, ♭VII7)',
        scale: 'mixolydian',
        why: 'Mixolydian from each dominant\'s own root hands you its ♭7. Over the backdoor ♭VII7 it also supplies the key\'s borrowed flat notes — that dusky colour is the point of the chord.',
      },
      {
        over: '♯i°7 / ♯iv°7',
        scale: 'the four chord tones (°7 arpeggio)',
        why: 'Passing chords last a breath — arpeggiate the °7 itself (it is symmetric, stacked minor 3rds) and resolve by step: most of its tones sit a half-step or whole step from a tone of the next chord.',
      },
      {
        over: 'iv6',
        scale: 'dorian from the iv',
        why: 'Dorian\'s natural 6 IS the chord\'s 6th, so the scale bakes the borrowed-iv colour in; land on the ♭3 and let it sigh down a half-step when the I arrives.',
      },
    ],
    targetNotes:
      'Land 3rds on the strong beats, then double your line in 3rds or 6ths — the harmonized run is gospel\'s signature ornament, and on piano it is one hand-shape moved up the scale. Save the ♭3→3 crush for arrivals on the I, and when a walk-up is coming, aim your right-hand line at the same downbeat the bass is walking toward.',
  },

  // Structured piano licks (SCHEMA.md "Piano licks", task P-61). Degree-based
  // and key-agnostic: every deg resolves through the stated quality, approach
  // pitches are derived from the next deg note. Realized offsets in the
  // comments use a C-rooted chord for readability; every interval claim in
  // notes/tips was recomputed from those offsets before writing (P-41 bar).
  licks: [
    {
      // Over Cadd9: C4 D4 (E♭4)E4 G4 A4 C5 — offsets 0 2 [3]4 7 9 12: the
      // hearandplay "gospel scale" (major pentatonic + ♭3) climbed straight
      // up one octave, the ♭3 crushing a half-step into the 3rd.
      id: 'gospel-scale-run',
      name: 'Gospel-scale run (the ♭3→3 crush)',
      level: 'foundation',
      chordContext: 'over the Iadd9 — any major-tonic bar',
      quality: 'add9',
      techniques: ['grace-note'],
      source: 'the pentatonic-♭3 "gospel scale" — hearandplay.com, "Gospel Piano Scales — 6 Different Scales That Can Work Now"',
      notes: [
        { deg: '1', beat: 1 },
        { deg: '9', beat: 1.5 },
        { deg: 'b3', beat: 2, technique: 'grace-note' },
        { deg: '3', beat: 2 },
        { deg: '5', beat: 2.5 },
        { deg: '6', beat: 3 },
        { deg: '1', octave: 1, beat: 3.5 },
      ],
      tips: 'Major pentatonic with one borrowed note: 1–2–♭3–3–5–6–1, the ♭3 crushed into the 3rd almost as one gesture — gospel\'s answer to the string bend, same move the blues makes but headed somewhere brighter. Run it up one octave and stop; the restraint is what keeps it church and not cocktail.',
    },
    {
      // Over C7 (the V7 of an F shout vamp): G4 A4 C5 D5 E5 — offsets
      // 7 9 12 14 16: 5–6–1–9–3 major pentatonic, straight-8th pickup on
      // beats 3–4.5 landing the 3rd on beat 5 (the next downbeat).
      id: 'gospel-shout-runup',
      name: 'Shout run-up (pentatonic pickup)',
      level: 'foundation',
      chordContext: 'over the V7 — the run-up into a shout/praise-break downbeat',
      quality: 'dom7',
      techniques: [],
      source: 'praise-break run-up vocabulary — the drive gear hearandplay teaches in GospelKeys 300 (praise songs & shouting music)',
      notes: [
        { deg: '5', beat: 3 },
        { deg: '6', beat: 3.5 },
        { deg: '1', octave: 1, beat: 4 },
        { deg: '9', octave: 1, beat: 4.5 },
        { deg: '3', octave: 1, beat: 5 },
      ],
      tips: 'A five-note ladder — 5, 6, root, 9, 3, all major pentatonic off the chord\'s root — thrown at the next bar\'s downbeat like a drummer\'s fill. The landing note is the 3rd, arriving exactly ON beat 1 with the band\'s next hit: in shout music the run exists to make the downbeat feel inevitable. Play it in octaves when the room gets loud.',
    },
    {
      // Over Cmaj7, dyads struck together: C4+A4 → D4+B4 → E4+C5 → G4+E5 —
      // offsets (0,9)(2,11)(4,12)(7,16). Every pair is a sixth (9,9,8,9
      // semitones); bottom voice walks 1–2–3 then leaps a minor 3rd to 5,
      // top sings 6–7–1 then leaps a major 3rd to the high 3. All eight
      // notes diatonic to the root's major scale.
      id: 'gospel-sixths-walkup',
      name: 'Sixths walk-up (the harmonized choir line)',
      level: 'intermediate',
      chordContext: 'over the Imaj7, walking into the next downbeat',
      quality: 'maj7',
      techniques: ['double-stop'],
      source: 'harmonizing the scale in 3rds and 6ths — hearandplay.com, "Harmonization Of The Major Scale Using Third And Sixth Intervals"',
      notes: [
        { deg: '1', beat: 2 },
        { deg: '6', beat: 2, technique: 'double-stop' },
        { deg: '9', beat: 3 },
        { deg: '7', beat: 3, technique: 'double-stop' },
        { deg: '3', beat: 4 },
        { deg: '1', octave: 1, beat: 4, technique: 'double-stop' },
        { deg: '5', beat: 5 },
        { deg: '3', octave: 1, beat: 5, technique: 'double-stop' },
      ],
      tips: 'One singer with a shadow: the bottom voice walks 1–2–3 up the scale while the top sings 6–7–8 a sixth above, then both voices leap a third onto 5-under-3 for the arrival. Quarter notes, landing on the next bar\'s downbeat — it is the choir\'s soprano-alto pair under your right hand, and the 3rd on top of the last dyad is the note the pack keeps telling you to land on.',
    },
    {
      // Over a °7 (C root): C4 E♭4 G♭4 A4 C5 E♭5 G♭5 A5 — offsets
      // 0 3 6 9 12 15 18 21: pure stacked minor 3rds, two full octaves of
      // the symmetric chord, rolled in 16ths across beats 1–2.75.
      id: 'gospel-dim-roll',
      name: 'Diminished roll (two octaves of the passing chord)',
      level: 'intermediate',
      chordContext: 'over the passing diminished bar — the ♯iv°7 or ♯i°7',
      quality: 'dim7',
      techniques: [],
      source: 'rolling the passing °7 — learncolorpiano.com "Gospel Progression 1 | Diminished 7th Chords"; hearandplay.com diminished walk-ups/walk-downs lesson',
      notes: [
        { deg: '1', beat: 1 },
        { deg: 'b3', beat: 1.25 },
        { deg: 'b5', beat: 1.5 },
        { deg: '6', beat: 1.75 },
        { deg: '1', octave: 1, beat: 2 },
        { deg: 'b3', octave: 1, beat: 2.25 },
        { deg: 'b5', octave: 1, beat: 2.5 },
        { deg: '6', octave: 1, beat: 2.75 },
      ],
      tips: 'The °7 is symmetric — minor thirds all the way up, the same four note names in every octave — so one four-note fingering (1-2-3-4, cross, repeat) sweeps two octaves without thinking. Roll it like a harp flourish inside the passing bar and let the last note hang: every tone of the chord sits a half-step or whole step from a tone of the chord you are walking into, so wherever you stop, the resolution is already prepared.',
    },
  ],
}
