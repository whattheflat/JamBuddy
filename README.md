# JamBuddy

**Hear the jam, learn the jam.** JamBuddy listens through your microphone, figures out the key and chords you're playing in real time, then shows you *how to play over them* — and helps you level up while you do it.

It started as a live key/chord detector (you may know it as *WhatTheFlat*). It's growing into an open, contributable **learning platform** for the player who can already survive a jam and wants to make it better.

---

## The idea: detect → guide → level up

1. **Detect.** Point your mic at a guitar, piano, or a whole band. JamBuddy identifies the **key** and the **chords** as you play, finds the repeating **loop**, and reads it back in Roman numerals (ii–V–I, I–V–vi–IV).

2. **Guide.** Once it knows your loop, the **Roadmap Jam Guide** lays it out as an improv highway synced to what you're playing: **guide tones** (the 3rds and 7ths that carry the harmony), **voice-leading rails** showing how each chord resolves into the next, the **solo scale** to blow over each station, and the **chord voicings** to grab — all in your detected key, with a playhead tracking where the loop is.

3. **Level up.** Style packs turn the same ii–V–I into *jazz* vs *bossa* vs *funk* — genuinely different voicings, rhythms, and improv advice — so you don't just play the changes, you learn the language. This is the on-ramp to the wider **Learn** direction (drills and detection-powered feedback) described in [`GOAL.md`](GOAL.md).

---

## What works today vs. what's in progress

This is an honest snapshot — it's an active project.

**Working today**

- **Real-time key detection** with top-3 candidate chips (click to lock) — works for guitar and piano.
- **Real-time chord detection** from live audio, with chord history and repeating-progression detection.
- **Roadmap Jam Guide** panel: matches your detected loop to a style progression and renders guide tones, voice-leading rails, solo-scale labels, and chord-voicing thumbnails synced to the loop position.
- **8 guitar style packs** in the knowledgebase — jazz, blues, rock, bossa nova, funk, reggae, country, and R&B (gospel landing next).
- **Fretboard and piano** visualisers that colour chord tones, pentatonic, and scale notes.
- **Chromatic tuner** and a **loop station** for capturing and replaying phrases.
- **Fully offline** — all audio and detection run locally in the desktop window; no server, no network calls.

**In progress**

- **Piano and bass** style packs (guitar is the first instrument rolled out).
- The **Progression Builder** — lay out and rearrange your own progression by hand (GOAL §G3).
- **Detection-powered drills** — practice exercises and feedback that use the fact that the app can actually *hear* you (GOAL Part 2).

---

## What it looks like

<!-- TODO: add a screenshot or GIF of the Roadmap Jam Guide tracking a live ii–V–I or 12-bar blues. -->
<!-- Caption: "The Roadmap Jam Guide mid-jam — guide tones, voice-leading rails, and the next voicing, synced to the chord you're playing right now." -->

_(Screenshot coming — the Roadmap panel mid-jam.)_

---

## Quickstart

You'll need [Node.js](https://nodejs.org/) (18+) and a microphone.

```bash
git clone https://github.com/whattheflat/whattheflat.git
cd whattheflat
npm install

# Desktop app (Vite dev server + Electron window, hot reload)
npm run electron:dev
```

Prefer the browser? Run the renderer on its own (no Electron shell):

```bash
npm run dev    # then open http://localhost:5173
```

**To see the magic:** grant **microphone permission** when prompted, then play a **recognized loop** — a **ii–V–I** or a **12-bar blues** are the easiest ways to light up the Roadmap Jam Guide. JamBuddy needs to hear the loop repeat a couple of times to lock the key and match the progression.

### Building installers

```bash
npm run electron:build:win     # Windows NSIS installer  → release/
npm run electron:build:mac     # macOS DMG               → release/
npm run electron:build:linux   # Linux AppImage          → release/
```

---

## Contributing — add a style without deep coding

The style packs are **data, not code**. If you're a musician who knows how a style is voiced and played, you can add one by filling in a structured data file — no audio or detection internals required.

- The data contract lives in [`src/data/kb/SCHEMA.md`](src/data/kb/SCHEMA.md): progressions as key-agnostic scale degrees, plus 2+ idiomatic "ways to play" each (voicings, comping, improv). One entry renders in all 12 keys.
- An **assisted path** is available: the `/kb-expand` workflow researches, drafts, and validates one style cell at a time, so you can start from a scaffold rather than a blank file.
- Every contribution passes a **validator quality gate** (`node scripts/validate-kb.mjs`) that mechanically checks each voicing actually contains the chord's tones — that's the bar that keeps the knowledgebase trustworthy.

A full step-by-step **`CONTRIBUTING.md`** guide is **coming** (tracked as task H-02). Until then, `SCHEMA.md` is the source of truth, and the [jazz pack](src/data/kb/jazz) is the gold-standard example to imitate.

---

## How it's built — the ensemble

JamBuddy is built by a six-agent team (Maestro, Professor, Luthier, Muse, Critic, Herald) that collaborates entirely through files — a shared ledger and the repo — conducted by one scheduled loop. If you want to understand how the project plans and ships work, start in [`docs/agents/`](docs/agents/):

- [`ROSTER.md`](docs/agents/ROSTER.md) — the six agents and their domains.
- [`PROTOCOL.md`](docs/agents/PROTOCOL.md) — how they collaborate (task locking, review gate, scheduling).
- [`LEDGER.md`](docs/agents/LEDGER.md) — the live task board.

The product north star and full roadmap are in [`GOAL.md`](GOAL.md).

---

## Tech & how detection works

| | |
|---|---|
| **App shell** | Electron (window host only — all logic runs in the renderer) |
| **UI** | React, Tailwind CSS, Vite |
| **Audio** | Web Audio API, [Pitchy](https://github.com/ianprime0509/pitchy) (McLeod pitch detection) |
| **Music theory** | Custom JS — Krumhansl-Schmuckler key detection, harmonic-summation chroma chord matching |

Two audio pipelines run in parallel: a fast **pitch path** (4096-sample FFT, McLeod autocorrelation) feeds Krumhansl-Schmuckler key detection over a voting window; a higher-resolution **chord path** (16384-sample FFT, ~2.7 Hz/bin) extracts a harmonic-summation chroma and matches it against chord templates. Architecture details are in [`CLAUDE.md`](CLAUDE.md).

> Note on modes: Krumhansl-Schmuckler distinguishes major vs. minor but not modes — Dorian and natural minor look the same to it. JamBuddy detects the tonal centre, and you pick the mode (the dropdown offers Dorian, Mixolydian, etc.). By design.

---

## License

No license file is set yet. Until one is added, all rights are reserved by the authors — please open an issue before reusing the code.
