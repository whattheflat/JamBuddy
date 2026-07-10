// R&B / Neo-soul piano pack (task P-30). Recipes verified by degree-spelling
// against CHORD_TYPES (src/lib/theory.js) and the validator's stacking
// convention (order inside each hand = voicing order low → high, nearest
// strictly above — documented at jazz/piano.js header). Every voice-leading
// statement in notes/tips is pitch-class arithmetic, computed and checked
// against the realized voicings (key of C) before writing.
// Voicings and treatments sourced from:
// pianowithjonny.com — "4 Steps to Play Neo Soul Chords on Piano" (maj7/min7
// as the base colour, the common-tone voicing rule, Rhodes as the idiomatic
// sound); hearandplay.com — "Neo Soul Chords: Exploring Extended Minor Chords"
// (the m11 voiced as a major triad on the ♭7 over the minor shell);
// pianogroove.com — "'So What' Chord Voicing" (the 1–11–♭7–♭3–5 stack: three
// perfect fourths capped by a major third; Bill Evans via the Miles Davis
// session) and "Quartal Comping Voicings for Jazz Piano" (fourths as planeable,
// harmonically ambiguous grips — the Robert Glasper-school texture);
// Mark Levine, The Jazz Piano Book (rootless left-hand voicings Type A/B,
// dominants swapping 5 for 13; sus voicings as a major triad off the ♭7);
// piano.org — "Rootless Voicings: Type A and Type B (Bill Evans Style)";
// freejazzlessons.com & jazzpianoblog.com — "Isn't She Lovely" piano analyses
// (the II9 → V9sus cadence treatment); musicradar.com — D'Angelo "Brown Sugar"
// breakdown & brltheory.com — the Dilla feel (both already cited by
// rnb/guitar.js). Pedagogy frame: docs/learn-curriculum.md — Piano pillar
// (shells → rootless, register discipline, voice-leading as hand economy).

// Reusable degree recipes. Order inside each hand = voicing order, low → high.
const LH_R5 = ['1', '5']                  // root + fifth anchor
const LH_R = ['1']                        // single bass note
const RH_SPREAD9 = ['9', '3', '7']        // the neo-soul default hand: 9 tucked under the 3rd, 7th on top
const RH_69 = ['6', '9', '3']             // the 6/9 hand: 6 above the LH fifth, 3rd on top
const A_FORM = ['3', '5', '7', '9']       // rootless Type A (3rd on the bottom)
const A_FORM_DOM = ['3', '13', '7', '9']  // dominant Type A: 5 → 13
const B_FORM = ['7', '9', '3', '5']       // rootless Type B (7th on the bottom)
const B_FORM_DOM = ['7', '9', '3', '13']  // dominant Type B: 5 → 13
const SO_WHAT_LH = ['1', '11']            // So What bottom: two of the stacked fourths
const SO_WHAT_RH = ['7', '3', '5']        // So What top: ♭7–♭3 fourth + major-3rd cap

export default {
  styleIntro:
    'On a neo-soul record the keyboard is the harmonic centre of gravity: Rhodes pads voiced in 9ths and 11ths, roots ceded to the bass player, every change placed a breath behind the drums. The left hand plays anchors (a root, a fifth) or vacates entirely; the right hand carries the colour — and the colour, not the changes, is the song.',

  comping: [
    {
      label: 'Rhodes pads',
      rhythm: 'whole- and half-note sustains, soft attack',
      description:
        'Lay the voicing down and leave it: neo-soul keys breathe in long tones while the drums chop 16ths underneath. Voice-lead so the top note barely moves between chords, and let the Rhodes tremolo (or the piano pedal) do the animating.',
    },
    {
      label: 'Behind-the-beat stabs (the Dilla pocket)',
      rhythm: '16th-note stabs, dragged a hair late',
      description:
        'Short chords placed just behind the drum grid — deliberately, consistently late. Practise with the metronome ON the 16ths and aim to feel lazy without slowing down: the drag is a placement, not a tempo.',
    },
    {
      label: 'The half-step slip',
      rhythm: 'grace-note crush into the beat',
      description:
        'Form the whole grip a half-step below the target, brush it as a grace note, and place the real chord on the beat. The keys translation of the neo-soul guitar slide — most at home on the m9 and maj9 grips.',
    },
  ],

  plays: {
    'rnb-mediant-circle': [
      {
        label: 'm9 spreads on the Rhodes',
        level: 'intermediate',
        chords: [
          { recipe: { LH: LH_R5, RH: RH_SPREAD9 }, note: 'm9 planed — even on the iii, where the 9 leans outside the key; the parallel colour is the point' },
          { recipe: { LH: LH_R5, RH: RH_SPREAD9 }, note: 'the iii\'s ♭3 holds over as this ♭7 (same key); its ♭7 falls a whole step onto this ♭3' },
          { recipe: { LH: LH_R5, RH: RH_SPREAD9 }, note: 'the same trade again — the circle\'s law, one station later' },
          { recipe: { LH: LH_R, RH: ['3', '13', '7', '9'] }, note: 'V13 — two note names hold from the ii (♭3→♭7, 9→13); its ♭7 falls a half-step onto this 3rd' },
        ],
        register: 'LH anchors around C3, RH spreads just above middle C; let the Rhodes bark soften the 9s',
        tips: 'Three m9s falling in fifths, then the V13. At every change the old ♭3 keeps its key and becomes the new ♭7, while the old ♭7 falls by step — a whole step into a minor chord, a half-step into the dominant. Place every chord a hair behind the drums; the Dilla feel is placement, not extra notes.',
      },
      {
        label: 'So What fourths (quartal planing)',
        level: 'intermediate',
        chords: [
          { recipe: { LH: SO_WHAT_LH, RH: SO_WHAT_RH }, note: 'the So What chord: 1–11–♭7–♭3–5, three perfect fourths capped by a major third' },
          { recipe: { LH: SO_WHAT_LH, RH: SO_WHAT_RH }, note: 'the same five-finger grip planed down a fifth — nothing to re-finger' },
          { recipe: { LH: SO_WHAT_LH, RH: SO_WHAT_RH }, note: 'third station on the circle; the fourths keep it airy and unresolved' },
          { recipe: { LH: LH_R, RH: ['3', '13', '9'] }, note: 'quartal V13: the right hand stacks two perfect fourths (3–13–9) over the bare root; two of the ii\'s note names are already here — its 11 is this root, its 5th this 9' },
        ],
        register: 'both hands close together, mid-keyboard — the five So What notes span a twelfth',
        tips: 'This is the Bill Evans "So What" grip that the Glasper school planes shamelessly: fourths are harmonically ambiguous, so one hand-shape covers every m7 on the circle — you slide, the drums swing, nobody asks questions. Save the stacked-third m9 play for hooks; fourths are verse texture.',
      },
    ],

    'rnb-6251': [
      {
        label: 'Stevie hands (the full cadence)',
        level: 'intermediate',
        chords: [
          { recipe: { LH: LH_R5, RH: RH_SPREAD9 }, note: 'm9 spread to start the fall home' },
          { recipe: { LH: LH_R5, RH: RH_SPREAD9 }, note: 'the dominant II: the vi\'s ♭3 holds as this ♭7 — and that note is the key\'s tonic; its ♭7 falls a half-step onto this 3rd' },
          { recipe: { LH: LH_R5, RH: ['b7', '9', '3'] }, note: '9sus: the right hand is a plain major triad built on the ♭7 — the II\'s 3rd just fell a half-step into it' },
          { recipe: { LH: LH_R5, RH: RH_69 }, note: '6/9 instead of a plain triad — the sus ♭7 fell a half-step onto this 3rd, its 9 held over as this 6' },
        ],
        register: 'LH fifths around C3, RH around middle C; unhurried, let the sus ring',
        tips: 'The cadence never plays a plain dominant: the II is a 9, the V is a 9sus that melts rather than resolves, and home is a 6/9. Track the key\'s home note through the middle of it — it is the II9\'s ♭7, then the sus chord\'s suspended 4th, before it finally lands in your left hand on the I.',
      },
      {
        label: 'Rootless (Levine grips behind a bassist)',
        level: 'intermediate',
        chords: [
          { recipe: { LH: A_FORM }, note: 'Type A rootless: ♭3–5–♭7–9' },
          { recipe: { LH: A_FORM_DOM }, note: 'three note names hold (♭3→♭7, 5→9, 9→13); only the ♭7 moves, a half-step onto this 3rd' },
          { recipe: { LH: ['3', '13', 'b7', '9'] }, note: '13sus — the dominant Type A shape with the 4th where the 3rd was; two names hold from the II (♭7→4, 9→13), the 3rd falls a half-step onto this ♭7, the 13 a whole step onto this 9' },
          { recipe: { LH: ['3', '5', '6', '9'] }, note: '6/9 landing: the sus 13 was already this 3rd, its 9 this 6th — those hold; the 4th and ♭7 each rise a whole step (onto the 9 and the 5th)' },
        ],
        register: 'left hand alone, top note between C4 and C5 — the bassist owns the roots',
        tips: 'The vi→II seam is the same physical move as any ii–V — three fingers hold, one falls — even though the II is a secondary dominant; your hand doesn\'t care about the theory. The 13sus is the modern-soul V: as a shape it is your dominant Type A with the bottom note a half-step up, and it never fully commits to dominant. That non-commitment IS the Stevie sound.',
      },
    ],

    'rnb-maj7-vamp': [
      {
        label: 'maj9 pads',
        level: 'intermediate',
        chords: [
          { recipe: { LH: LH_R5, RH: RH_SPREAD9 }, note: 'maj9 spread — the 9 tucked in above the anchor, 3rd and maj7 closing the hand' },
          { recipe: { LH: LH_R5, RH: RH_SPREAD9 }, note: 'the I\'s 3rd holds over as this maj7 (same note name); its maj7 falls a whole step onto this 3rd' },
        ],
        register: 'wide and sustained; pedal through each two-bar chord',
        tips: 'Two chords, one hinge: the I\'s 3rd and the IV\'s maj7 are the same note name — keep it in your voicing all night and float the rest around it (the common-tone rule pianowithjonny builds the whole style on). Colour each repeat differently — add the 9, thin to a bare 3–7, restrike on the and-of-2 — instead of changing chords.',
      },
      {
        label: 'Quartal drift (Glasper pads)',
        level: 'intermediate',
        chords: [
          { recipe: { LH: LH_R, RH: ['7', '3', '13'] }, note: 'fourths off the maj7: 7–3–13, two perfect fourths — lush but weightless over the bare bass note' },
          { recipe: { LH: LH_R, RH: ['7', '3', '13'] }, note: 'same shape on the new root — two of its three note names were already sounding (the I\'s 3rd is this maj7, its 13 this 3rd)' },
        ],
        register: 'single bass notes low, the fourths around middle C; let everything ring into everything',
        tips: 'Every note both chords use comes from one parent scale, which is why this vamp can loop for six minutes without leaving home. The fourth-stack keeps the maj7 from sounding like a piano-bar ballad — same colour tones, none of the syrup. Vary the attack point (bar 2, the and-of-3) rather than the harmony.',
      },
    ],

    'rnb-dorian': [
      {
        label: 'm11 haze (Voodoo pads)',
        level: 'intermediate',
        chords: [
          { recipe: { LH: LH_R5, RH: ['7', '9', '11'] }, note: 'm11: the right hand is a major triad built on the ♭7 — the hearandplay neo-soul grip' },
          { recipe: { LH: LH_R5, RH: RH_SPREAD9 }, note: 'every right-hand voice moves by a step and no further: the ♭7 falls a half-step onto this 3rd, the 9 rises a half-step onto this ♭7, the 11 rises a whole step onto this 9' },
        ],
        register: 'low fifths, right hand clustered just above middle C; 70 BPM, pedal-blurred',
        tips: 'The whole haze is two steps wide — at the change every voice moves by a step and the grip re-forms. The IV9\'s major 3rd is Dorian\'s raised 6th, the one note separating this from plain sad minor: it is what tells the room this is D\'Angelo. Let it arrive slightly late.',
      },
      {
        label: 'Voodoo minimal (two-finger stabs)',
        level: 'intermediate',
        chords: [
          { recipe: { LH: LH_R, RH: ['b3', '11'] }, note: 'a bare whole-step rub — ♭3 against 11 — more smoke than chord' },
          { recipe: { LH: LH_R, RH: ['3', 'b7'] }, note: 'just the dominant\'s tritone; the i\'s ♭3 has become this ♭7 (same note name) — half the dyad doesn\'t move' },
        ],
        register: 'almost nothing: one bass note, two right-hand notes mid-keyboard — the drums are the point',
        tips: 'Voodoo-era D\'Angelo is subtraction: three notes total, laid so far behind the beat they almost fall over. Two-finger shapes leave room for the slip — brush the dyad a half-step below and land both fingers on it on the beat. If it sounds empty, good: resist adding notes and push the placement instead.',
      },
    ],

    'rnb-gospel-amen': [
      {
        label: 'The borrowed sigh (full hands)',
        level: 'intermediate',
        chords: [
          { recipe: { LH: LH_R5, RH: RH_SPREAD9 }, note: 'maj9 — bright before the shadow' },
          { recipe: { LH: LH_R5, RH: ['6', '9', '3'] }, note: 'the borrowed chord: the 3rd fell a half-step to ♭3, the maj7 a whole step onto the 6th, and the 9 held' },
          { recipe: { LH: LH_R5, RH: RH_SPREAD9 }, note: 'home: the iv\'s 6th holds as this 9; its borrowed ♭3 sighs a half-step down onto the key\'s 5th — your left hand is already holding it' },
        ],
        register: 'LH fifths around C3, RH just above middle C; let the iv bar breathe',
        tips: 'One chord borrowed from the parallel minor, two sighs to pay for it: the 3rd falls a half-step going in (IV→iv), the borrowed ♭3 falls a half-step coming home (iv→I). Every other note name holds or steps down — soul ballads end on this cadence because the hands literally relax. Play the iv softer than the IV; borrowed chords whisper.',
      },
      {
        label: 'Rootless, iv as m6/9',
        level: 'intermediate',
        chords: [
          { recipe: { LH: A_FORM }, note: 'Type A rootless: 3–5–7–9' },
          { recipe: { LH: ['3', '5', '6', '9'] }, note: 'm6/9: the 5th and the 9 hold; the 3rd falls a half-step to ♭3, the maj7 a whole step onto the 6th' },
          { recipe: { LH: A_FORM }, note: 'the iv\'s 6th and 9th are already this chord\'s 9th and 5th — those names hold; the borrowed ♭3 (the key\'s ♭6) resolves down a half-step to the 5th, and the iv\'s 5th — the key\'s own tonic — slips a half-step onto this maj7' },
        ],
        register: 'left hand alone, top note C4–C5; a bassist owns the roots',
        tips: 'The m6/9 grip is what makes the borrowed iv sound like Musiq Soulchild instead of a hymn: same borrowed ♭3, but the 6 and 9 around it are both notes the I wants anyway, so the chord arrives already half-resolved. Across the whole cadence no change moves more than two note names — that stillness is the neo-soul reading of gospel\'s Amen.',
      },
    ],

    'rnb-justthetwo': [
      {
        label: 'Planed 9ths (smooth-soul pads)',
        level: 'intermediate',
        chords: [
          { recipe: { LH: LH_R5, RH: RH_SPREAD9 }, note: 'maj9 on the ♭VI — the loop starts away from home' },
          { recipe: { LH: LH_R5, RH: RH_SPREAD9 }, note: 'the whole chord sinks: roots, 5ths, 3rds and 9s each fall a half-step; the 7 falls a whole step (maj7 becomes ♭7)' },
          { recipe: { LH: LH_R5, RH: RH_SPREAD9 }, note: 'the V\'s 3rd — the raised leading tone — resolves up a half-step into your bass root; its ♭7 falls a whole step onto this ♭3' },
          { recipe: { LH: LH_R5, RH: RH_SPREAD9 }, note: 'the same m9 hand slides down a whole step — every voice, together' },
          { recipe: { LH: LH_R5, RH: RH_SPREAD9 }, note: 'a ii–V pointing at ♭VI: the ♭vii\'s ♭3 holds as this ♭7 (same name); its ♭7 falls a half-step onto this 3rd' },
        ],
        register: 'LH fifths mid-low, RH spreads above middle C; think slow-jam strings',
        tips: 'The loop teaches two lessons. First, the half-step fall: ♭VI→V drags every voice down by step. Second, ii–Vs that aim somewhere other than home: ♭vii–♭III7 is a ii–V of the ♭VI, and the ♭III7\'s 3rd is the ♭VI\'s maj7 by name — so the loop\'s seam resolves as smoothly as its middle. Hear those two things and every smooth-soul chart gets easier.',
      },
      {
        label: 'Rootless A/B (90s R&B changes)',
        level: 'intermediate',
        chords: [
          { recipe: { LH: A_FORM }, note: 'Type A on the ♭VImaj7: 3–5–7–9' },
          { recipe: { LH: B_FORM_DOM }, note: 'Type B on the V: no name survives — every voice moves by step, three of the four by half-step' },
          { recipe: { LH: A_FORM }, note: 'back to Type A: the V\'s 3rd falls a half-step onto this ♭7, its ♭7 a whole step onto this ♭3' },
          { recipe: { LH: B_FORM }, note: 'Type B — alternating types keeps the voicing in the same part of the keyboard while the roots move' },
          { recipe: { LH: A_FORM_DOM }, note: 'three names hold from the ♭vii (9→13, ♭3→♭7, 5→9); only its ♭7 falls, a half-step onto this 3rd' },
        ],
        register: 'top note between C4 and C5; leave the low register to the bass and pads',
        tips: 'The ii–V law rides again in a strange neighbourhood: minor-to-dominant a fifth down means three fingers freeze and one falls, whether the target is home or — as here — the ♭VI. Around the seam, two names hold into the ♭VImaj7: the ♭III7\'s 3rd becomes its maj7, its 13 becomes its 3rd. Learn the loop as hand motion, not chord names.',
      },
    ],

    'rnb-chromatic-vi': [
      {
        label: 'The chromatic slide (full hands)',
        level: 'intermediate',
        chords: [
          { recipe: { LH: LH_R5, RH: RH_69 }, note: '6/9 — the Motown tonic; its 6th is the vi\'s root arriving early' },
          { recipe: { LH: LH_R5, RH: RH_SPREAD9 }, note: 'the I\'s 9 fell a whole step onto this ♭3; its 6th fell another onto this ♭7' },
          { recipe: { LH: LH_R5, RH: RH_SPREAD9 }, note: 'the key\'s home note holds through this change — the vi\'s ♭3 IS the ♭VI7\'s 3rd; the ♭7 and 9 each slip down a half-step' },
          { recipe: { LH: LH_R5, RH: RH_SPREAD9 }, note: 'the whole chord planes down a semitone — all five voices fall exactly a half-step' },
        ],
        register: 'LH fifths around C3, RH around middle C',
        tips: 'Sir Duke\'s verse is a bass line wearing chords: home for a bar, then 6–♭6–5 in half-steps. Count what survives on top: the tonic note refuses to move from vi into ♭VI7 (it just turns from ♭3 into 3rd), then nothing survives into V7 — the one change where everything slides together. Whether you call the ♭VI7 borrowed or a tritone sub of II7, the hands play the same thing.',
      },
      {
        label: 'Stab set with the ♯9 (horn-section hands)',
        level: 'intermediate',
        chords: [
          { recipe: { LH: LH_R, RH: ['3', '5', '1'] }, note: 'plain triad, root on top — punchy, no colour yet' },
          { recipe: { LH: LH_R, RH: ['3', '5', '7'] }, note: 'the same three note names you just played, reread as this chord\'s ♭3, 5th and ♭7 — only the bass moves' },
          { recipe: { LH: LH_R, RH: ['3', '13', '7'] }, note: '♭VI13: the home note holds (♭3 turned 3rd) while the outer pair pinch inward by half-steps — 5th up onto the 13, ♭7 down onto the ♭7' },
          { recipe: { LH: LH_R, RH: ['3', '7', '#9'] }, note: 'the ♯9 exclamation: the ♭VI\'s 13 holds over as this ♭7 (same name) while the home note finally gives way, a half-step down onto the leading tone' },
        ],
        register: 'tight three-note stabs either side of middle C; short, on the hits',
        tips: 'Play these like a horn section: short, placed, gone. The I-to-vi change is free (same three names, new bass), the middle pinches chromatically, and the ♯9 on the V is spice you spend once per loop — the soul-horn exclamation, same budget as the guitar pack\'s 7♯9. Between stabs, dead silence is the groove.',
      },
    ],
  },

  improv: {
    scales: [
      {
        over: 'i7 / IV9 (Dorian vamps)',
        scale: 'dorian',
        why: 'D\'Angelo vamps live on Dorian: its raised 6th is the IV9\'s major 3rd, so the scale agrees with the chord change instead of fighting it — one scale covers both chords of the loop.',
      },
      {
        over: 'the m9 circle (iii–vi–ii)',
        scale: 'dorian from each root',
        why: 'Each root\'s own Dorian contains exactly the planed m9 grip (9, ♭3, 11, ♭7) — shift scales with the chords, the way the chords themselves plane. Aim at each new 9th.',
      },
      {
        over: 'Imaj7 / IVmaj7',
        scale: 'major pentatonic of the key',
        why: 'Five notes, no avoid note over either chord — over the IV they land on its 3rd, 5th, maj7, 9 and 13. The pentatonic haze over lush maj7s is half of bedroom R&B.',
      },
      {
        over: 'dom7 (II9, V13, ♭VI7, ♭III7)',
        scale: 'mixolydian from the chord\'s root',
        why: 'Each passing dominant carries its own Mixolydian for exactly one bar. Over the ♭VI7 that scale still contains the key\'s home note — the same pivot your comping hand is holding.',
      },
      {
        over: 'V9sus',
        scale: 'the key\'s major scale',
        why: 'A 9sus is the ii7 stacked on the V\'s bass, so the plain parent scale cannot miss. Land on the 9 or the suspended 4th, and let the ♭7 fall to the I\'s 3rd when the chord finally turns.',
      },
    ],
    targetNotes:
      'Nines on the downbeats: most grips in this pack keep a 9 under your fingers, and landing on it — a whole step above each new root — is the fastest way to sound like the record. Approach chord tones from a half-step below (the single-note version of the slip), and when in doubt lay out for a bar: neo-soul solos breathe on the 16th grid they float over.',
  },
}
