// Jazz piano pack — first authored piano cell (task P-22). Recipes verified by
// degree-spelling against CHORD_TYPES (src/lib/theory.js) and SCHEMA.md's
// resolveDegree contract. Voicings sourced from: Mark Levine, The Jazz Piano
// Book (three-note "Bud Powell" shells; rootless left-hand voicings; altered
// dominants in minor); learnjazzstandards.com "Left-Hand Piano Voicings for
// ii-V7-Is" (the middle-C position set F-A-C-E / F-A-B-E / E-G-B-D);
// piano.org "Rootless Voicings: Type A and Type B (Bill Evans Style)"
// (A = 3rd on the bottom 3-5-7-9, B = 7th on the bottom 7-9-3-5, dominants
// swap the 5 for the 13); pianogroove.com (minor ii-V-i, ø11 colour);
// jazz-library.com/articles/comping (Charleston; Red Garland offbeats).
// Pedagogy frame: docs/learn-curriculum.md — Piano pillar (shells → rootless,
// register discipline, "rule of 1").

// Reusable degree recipes. Order inside each hand = voicing order, low → high.
const SHELL_R7 = { LH: ['1', '7'] }        // Bud Powell shell: root + 7th
const SHELL_R3 = { LH: ['1', '3'] }        // Bud Powell shell: root + 3rd
const A_FORM = { LH: ['3', '5', '7', '9'] }      // rootless Type A (3rd on bottom)
const B_FORM = { LH: ['7', '9', '3', '5'] }      // rootless Type B (7th on bottom)
const A_FORM_DOM = { LH: ['3', '13', '7', '9'] } // dominant Type A: 5 → 13
const B_FORM_DOM = { LH: ['7', '9', '3', '13'] } // dominant Type B: 5 → 13

export default {
  styleIntro:
    'In a jazz rhythm section the piano is a commentator, not a metronome: short voicings placed around the soloist, roots left to the bassist, colour tones (9ths, 13ths) doing the talking. Left hand learns two grips per chord — a shell and a rootless voicing — and the music comes from where you place them in time.',

  comping: [
    {
      label: 'Charleston',
      rhythm: '♩. + "and of 2"',
      description: 'Chord on beat 1 (held) plus a stab on the and-of-2 — the foundational syncopated comping cell. Displace it around the bar once it is automatic; comping failure in jams is usually rhythmic, not harmonic.',
    },
    {
      label: 'Red Garland offbeats',
      rhythm: '"and of 2" + "and of 4"',
      description: 'Both hits off the beat — the Miles Davis quintet sound. The bassist and drummer own the downbeats; you answer them. Keep the voicings short and identical so only the rhythm speaks.',
    },
    {
      label: 'The push (anticipated and-of-4)',
      rhythm: 'tied from "and of 4"',
      description: 'Strike the next bar\'s chord an eighth note early and hold it over the barline. Telegraphs the change to the whole band — use it going into bar 1 of the form.',
    },
  ],

  plays: {
    'jazz-251-major': [
      {
        label: 'Bud Powell shells (LH 1–7 / 1–3)',
        level: 'intermediate',
        chords: [
          { recipe: SHELL_R7, note: 'root + ♭7 — the lightest possible ii chord' },
          { recipe: SHELL_R3, note: 'the ii\'s ♭7 just fell a half-step to become this 3rd' },
          { recipe: SHELL_R7, note: 'the V\'s 3rd holds over as the maj7 — one finger stays put' },
        ],
        register: 'LH around C3; keep the right hand free for melody or answers',
        tips: 'Alternating 1–7 and 1–3 shells is the whole voice-leading engine: the top note either holds or falls a half-step, never jumps. Two notes is not "beginner" — it is what Bud Powell played behind Charlie Parker. In a duo the root matters; once a bassist arrives, graduate to the rootless play below.',
      },
      {
        label: 'Rootless A–B–A (Bill Evans left hand)',
        level: 'intermediate',
        chords: [
          { recipe: A_FORM, note: 'Type A: ♭3–5–♭7–9, 3rd on the bottom' },
          { recipe: B_FORM_DOM, note: 'Type B: ♭7–9–3–13 — only one finger moves from the ii' },
          { recipe: A_FORM, note: 'back to Type A: 3–5–7–9, a maj9 sound' },
        ],
        register: 'top note between C4 and C5; the bassist owns everything below G3',
        tips: 'A on the ii, B on the V, A on the I: alternate the two types and the hand barely moves — that is the entire point of the system. No roots anywhere: that is the bassist\'s lane, and doubling it muddies the band. Practise the pair in all 12 keys around the circle of fifths.',
      },
    ],

    'jazz-251-minor': [
      {
        label: 'Shells with the colour on top',
        level: 'intermediate',
        chords: [
          { recipe: { LH: ['1', '7'], RH: ['3', '5'] }, note: 'RH ♭3 + ♭5 — the ø colour; don\'t skip the ♭5' },
          { recipe: { LH: ['1', '7'], RH: ['3', 'b9'] }, note: 'the ♭9 is the same key the iiø7\'s ♭5 just was — hold it' },
          { recipe: { LH: ['1', '7'], RH: ['3', '5'] }, note: 'home — resolve and get light' },
        ],
        register: 'LH shells around C3, RH colour tones just above middle C',
        tips: 'Hand-role splitting in miniature: LH anchors root + 7th, RH carries the two notes that make the minor ii–V dark. The physical lesson is the shared key: the iiø7\'s ♭5 and the V7\'s ♭9 are the same pitch reinterpreted — find it once and keep the finger there through both chords.',
      },
      {
        label: 'Rootless with the altered V',
        level: 'intermediate',
        chords: [
          { recipe: { LH: ['3', '5', '7', '11'] }, note: '♭3–♭5–♭7–11 — the 11 is the classic colour on ø chords' },
          { recipe: { LH: ['7', 'b9', '3', 'b13'] }, note: '♭7–♭9–3–♭13: the altered dominant that minor keys demand' },
          { recipe: A_FORM, note: '♭3–5–♭7–9 — a m9 sound; resolved but still coloured' },
        ],
        register: 'top note between C4 and C5',
        tips: 'Same A/B logic as the major ii–V–I, darker fuel: the V7 swaps its 9 and 13 for ♭9 and ♭13 (both live in the key\'s harmonic minor). If the four-note ø voicing feels crunchy, drop the 11 and play the three-note core ♭3–♭5–♭7 — the shells play above is the easier road into this one.',
      },
    ],

    'jazz-rhythm-a': [
      {
        label: 'Shells on the Charleston',
        level: 'intermediate',
        chords: [
          { recipe: SHELL_R7, note: 'maj7 shell — root + 7' },
          { recipe: SHELL_R3, note: 'the I\'s 7th steps up a half-step to the vi\'s ♭3' },
          { recipe: SHELL_R7, note: 'the vi\'s ♭3 holds over as the ii\'s ♭7 — same key' },
          { recipe: SHELL_R3, note: 'falls a half-step onto the V\'s 3rd, which leads back to bar 1' },
        ],
        register: 'LH around C3; Charleston rhythm, one cell per bar',
        tips: 'One chord per bar at rhythm-changes tempo — the two-note grips are the only ones that keep up. Learn the top-voice thread as a loop: hold, half-step, hold, half-step, forever. Rhythm first: put the metronome on 2 and 4 and drill the Charleston until the hands stop negotiating.',
      },
      {
        label: 'Rootless turnaround in one hand position',
        level: 'intermediate',
        chords: [
          { recipe: A_FORM, note: 'Type A on the I' },
          { recipe: B_FORM, note: 'Type B on the vi — two fingers move, two hold' },
          { recipe: A_FORM, note: 'Type A on the ii' },
          { recipe: B_FORM_DOM, note: 'Type B on the V — one finger moves; bar 4 feeds bar 1' },
        ],
        register: 'top note between C4 and C5',
        tips: 'A–B–A–B around the loop keeps most changes to a finger or two — two keys hold into the vi and again into the ii, and only the seam back into bar 1 re-sets three fingers, each by a whole step or less. This is the "rule of 1" made physical: in a five-piece band you supply one fifth of the music, and identical small voicings placed on Red Garland offbeats are exactly that fifth.',
      },
    ],

    'jazz-625': [
      {
        label: 'Shells falling in fifths',
        level: 'intermediate',
        chords: [
          { recipe: SHELL_R7, note: 'vi — root + ♭7' },
          { recipe: SHELL_R3, note: 'the vi\'s ♭7 falls a whole step onto the ii\'s ♭3' },
          { recipe: SHELL_R7, note: 'ii\'s ♭3 holds over as the V\'s ♭7' },
          { recipe: SHELL_R3, note: 'half-step fall onto the I\'s 3rd — journey over' },
        ],
        register: 'LH around C3',
        tips: 'Pure circle-of-fifths motion: alternating 1–7 / 1–3 shells was built for exactly this — every root falls a fifth while the top voice walks down by step. Sing the top voice while you play; if you can hear this two-note line, you can predict half the jazz repertoire.',
      },
      {
        label: 'Rootless B–A–B–A circle',
        level: 'intermediate',
        chords: [
          { recipe: B_FORM, note: 'Type B on the vi — ♭7 on the bottom' },
          { recipe: A_FORM, note: 'Type A on the ii — two voices fall a step, two hold' },
          { recipe: B_FORM_DOM, note: 'Type B on the V — a single half-step move' },
          { recipe: A_FORM, note: 'Type A on the I — maj9 landing' },
        ],
        register: 'top note between C4 and C5',
        tips: 'Starting on the B form instead of A puts the whole circle a fourth away — same alternation, different lane. Learn both start positions so you can pick whichever keeps the top note between C4 and C5 in the key of the night; that window sits above the bass and below the soloist.',
      },
    ],

    'jazz-blues': [
      {
        label: 'Shells through the form',
        level: 'intermediate',
        chords: [
          { recipe: SHELL_R7, note: 'I7 — root + ♭7' },
          { recipe: SHELL_R3, note: 'IV7 — the I\'s ♭7 falls a half-step to this 3rd' },
          { recipe: SHELL_R7, note: 'back home' },
          { recipe: SHELL_R7, note: 'hold — or restrike on the and-of-2' },
          { recipe: SHELL_R3, note: 'IV7 again — same half-step fall' },
          { recipe: SHELL_R3, note: 'sit on it' },
          { recipe: SHELL_R7, note: 'home' },
          { recipe: SHELL_R3, note: 'VI7 — the jazz move; hear bar 8 coming' },
          { recipe: SHELL_R7, note: 'ii7 of the turnaround' },
          { recipe: SHELL_R3, note: 'V7 — the ii\'s ♭7 falls a half-step onto this 3rd' },
          { recipe: SHELL_R7, note: 'home' },
          { recipe: SHELL_R3, note: 'V7 pickup into the next chorus' },
        ],
        register: 'LH around C3; RH free for blues fills between phrases',
        tips: 'Most of the form runs on one alternation: 1–7 on the I, 1–3 on the chord it falls into — those tops arrive by half-step. Bar 8\'s VI7 is the one real reach in the chorus; aim for it early. Fill with the right hand only in the gaps the soloist leaves (rule of 1).',
      },
      {
        label: 'Rootless blues (Wynton Kelly lane)',
        level: 'intermediate',
        chords: [
          { recipe: A_FORM_DOM, note: 'Type A dominant: 3–13–♭7–9' },
          { recipe: B_FORM_DOM, note: 'Type B on the IV7 — two fingers slide, two hold' },
          { recipe: A_FORM_DOM, note: '' },
          { recipe: A_FORM_DOM, note: 'thin it to just 3 + ♭7 if the band is loud' },
          { recipe: B_FORM_DOM, note: '' },
          { recipe: B_FORM_DOM, note: '' },
          { recipe: A_FORM_DOM, note: '' },
          { recipe: { LH: ['3', '7', 'b9'] }, note: 'VI7♭9 — the V-of-ii sound; the ♭9 pulls into the next bar' },
          { recipe: A_FORM, note: 'ii7 — Type A minor' },
          { recipe: B_FORM_DOM, note: 'V7 — Type B, one finger from the ii' },
          { recipe: A_FORM_DOM, note: 'home' },
          { recipe: B_FORM_DOM, note: 'V7 — hands you the next chorus' },
        ],
        register: 'top note between C4 and C5; comp Red Garland offbeats',
        tips: 'Dominant rootless voicings carry two colour tones each (9 and 13) — that is why a jazz blues sounds like a suit, not overalls. Between I7 and IV7 the A/B alternation trades like this: two keys hold while swapping names, one voice slips a half-step (the 3↔♭7 trade), and one finger hops a minor third. Bar 8\'s ♭9 is the one dark note in the form: let it ring into the ii.',
      },
    ],

    'jazz-tritone-sub': [
      {
        label: 'Guide tones over the chromatic bass',
        level: 'intermediate',
        chords: [
          { recipe: { LH: ['1'], RH: ['3', '7'] }, note: 'ii7 — bass on 2, guide tones ♭3 + ♭7 on top' },
          { recipe: { LH: ['1'], RH: ['3', '7'] }, note: '♭II7 — bass slides to ♭2; the ii\'s ♭3 holds as this 3rd' },
          { recipe: { LH: ['1'], RH: ['3', '7'] }, note: 'Imaj7 — bass lands on 1; the ♭II7\'s ♭7 holds as this 7' },
        ],
        register: 'LH single bass notes around C3, RH guide tones just above middle C',
        tips: 'The sub turns the bass line into a chromatic slide — 2, ♭2, 1 — while the right hand proves *why* it works: at every change one guide tone holds and the other falls a half-step, because ♭II7 and V7 share the same tritone (the 3rd and ♭7 simply trade names). Play it slow and listen for the two threads.',
      },
      {
        label: 'Rootless: the ♭II7 is a free altered V7',
        level: 'intermediate',
        chords: [
          { recipe: A_FORM, note: 'ii7 — Type A' },
          { recipe: A_FORM_DOM, note: '♭II7 Type A — read from the old V7\'s root, this exact hand spells ♭7–♯9–3–♭13: a V7alt for free' },
          { recipe: A_FORM, note: 'Imaj7 — Type A; the ♭II7\'s ♭7 holds over as your maj7' },
        ],
        register: 'top note between C4 and C5',
        tips: 'This is the deepest lesson in the substitution: a plain 9/13 rootless voicing on the ♭II7 contains, note for note, the altered voicing of the V7 it replaced — ♭9s and ♭13s appear without you learning a single new grip. Into the ♭II7 every voice holds or moves a half-step — that slide is the sub\'s whole sales pitch. Coming home, three voices resolve the same way while one finger (the sub\'s 13) drops a third onto the I\'s 5th.',
      },
    ],

    'jazz-rhythm-bridge': [
      {
        label: 'Shells around the circle of dominants',
        level: 'intermediate',
        chords: [
          { recipe: SHELL_R7, note: 'III7 — the first domino; two bars to sit on it' },
          { recipe: SHELL_R3, note: 'VI7 — the III7\'s ♭7 fell a half-step onto this 3rd' },
          { recipe: SHELL_R7, note: 'II7 — the pattern repeats a whole step down' },
          { recipe: SHELL_R3, note: 'V7 — one more half-step fall, then the A section' },
        ],
        register: 'LH around C3; two bars per chord — leave space',
        tips: 'Each chord is the V of the next, so the same two-grip alternation from the ii–V–I walks the whole bridge: ♭7 falls a half-step onto the next 3rd, four times in a row. That chromatic thread in your top voice is also the soloist\'s map — comp it clearly and you are conducting.',
      },
      {
        label: 'Rootless dominants, alternating types',
        level: 'intermediate',
        chords: [
          { recipe: A_FORM_DOM, note: 'III7 — Type A: 3–13–♭7–9' },
          { recipe: B_FORM_DOM, note: 'VI7 — Type B: two keys hold, the old 3rd falls a half-step, the old ♭7 drops a third onto the 9' },
          { recipe: A_FORM_DOM, note: 'II7 — back to Type A' },
          { recipe: B_FORM_DOM, note: 'V7 — Type B hands you the A section' },
        ],
        register: 'top note between C4 and C5',
        tips: 'Around a circle of dominants the A/B alternation keeps each step compact: at least one key holds, the old 3rd falls a half-step onto the new ♭7, and nothing moves more than a minor third. Two bars per chord is room to decorate — restrike the same voicing on the Charleston, or walk the top finger up to the 13 and back rather than reaching for a new chord.',
      },
    ],
  },

  improv: {
    scales: [
      { over: 'ii7', scale: 'dorian', why: 'Minor 7 chords in a major key take Dorian — the natural 6 keeps it from sounding sad. On piano it is the parent major scale started from 2: no new fingering.' },
      { over: 'V7', scale: 'mixolydian', why: 'The ♭7 is built in. In minor keys use Phrygian dominant (harmonic minor from the V) — it hands you the ♭9 and ♭13 your left hand is already voicing.' },
      { over: 'Imaj7', scale: 'major', why: 'Plain major works; avoid sitting on the 4th over the maj7 — it rubs against the 3rd a half-step below.' },
      { over: 'I7 (blues)', scale: 'mixolydian', why: 'Mixolydian for the changes, blues scale for the attitude — mix them phrase by phrase, not note by note.' },
      { over: 'iiø7', scale: 'locrian', why: 'Target the ♭3 or ♭5; the ♭5 becomes the ♭9 of the next V7 — the same pivot key your comping hand holds.' },
    ],
    targetNotes:
      'Land the 3rd of each chord on the downbeat of the change — your left hand is already holding it, so the ear-check is built in. In any ii–V–I the 7th of one chord falls a half-step to the 3rd of the next; play that two-note rail as a whole-note chorus before you play eighth notes.',
  },
}
