# The JamBuddy Ensemble — Agent Roster

Six specialised agents build JamBuddy as both a **real-time jam companion** and an **open-source learning platform**. They collaborate through files (a shared ledger + the repo), never through live conversation — exactly like a git-based human team. The conductor (Maestro) appoints; the five workers do; the gate (Critic) approves.

How they run: [`PROTOCOL.md`](PROTOCOL.md). What's queued now: [`LEDGER.md`](LEDGER.md). The product north star: [`../../GOAL.md`](../../GOAL.md).

| Agent | Role | Realised as |
|---|---|---|
| 🎼 **Maestro** | Orchestrator / product lead | the `/jam-loop` skill (run by the main loop) + [`.claude/agents/maestro.md`](../../.claude/agents/maestro.md) for solo planning |
| 🎓 **Professor** | Music & pedagogy | [`.claude/agents/professor.md`](../../.claude/agents/professor.md) |
| 🔧 **Luthier** | Engineering | [`.claude/agents/luthier.md`](../../.claude/agents/luthier.md) |
| 🎨 **Muse** | Design & UX | [`.claude/agents/muse.md`](../../.claude/agents/muse.md) |
| 🔍 **Critic** | Quality & review (the gate) | [`.claude/agents/critic.md`](../../.claude/agents/critic.md) |
| 📣 **Herald** | Open-source & community | [`.claude/agents/herald.md`](../../.claude/agents/herald.md) |

---

## Domains, ownership, and quality bar

### 🎼 Maestro — orchestrator / product lead
- **Mandate:** turn `GOAL.md` into bounded, dependency-ordered tasks; appoint the right agent; reconcile and merge; keep the ledger and goal honest. Writes the plan, not the feature code.
- **Owns (write):** `GOAL.md`, `docs/agents/LEDGER.md`.
- **Quality bar:** every task is single-domain, single-DoD, fits one session, declares files + deps. No task ships without a Critic pass logged.

### 🎓 Professor — music & pedagogy
- **Mandate:** the music brain. Research and author knowledgebase cells (the `/kb-expand` work, now a standing role), learning curricula, drills, and ear-training design; guard music-theory correctness.
- **Owns (write):** `src/data/kb/**` (content), `docs/learn-curriculum.md`, `docs/progression-repertoire.md`; **co-owns** `src/lib/theory.js` (music correctness) with Luthier.
- **Quality bar:** key-agnostic data only; `node scripts/validate-kb.mjs` green; named sources; pedagogically sequenced (intermediate, not step-one).

### 🔧 Luthier — engineering
- **Mandate:** build and revise the app — features, the audio pipeline, wiring the KB into the UI (the Jam Guide panel), refactors, performance, Electron.
- **Owns (write):** `src/components/**`, `src/services/**`, `src/App.jsx`, `electron/**`, build config; **co-owns** `src/lib/theory.js` (code) with Professor.
- **Quality bar:** `npm run build` green; no regressions to the audio callbacks' stability contract (see `CLAUDE.md`); diff matches the task; reuses design tokens, never raw hex.

### 🎨 Muse — design & UX
- **Mandate:** make it come to life on screen — visual design, layout, interaction, the "smart fit to screen" for the Jam Guide, SVG renderers' look, accessibility.
- **Owns (write):** `tailwind.config.js` (design tokens), presentational components and their styling, SVG visual specs (`ChordDiagram`, `MiniPiano`).
- **Quality bar:** uses `bg-surface`/`bg-panel`/`border-border`/`accent` tokens; responsive + fits the target viewport; WCAG-AA contrast; keyboard-reachable.

### 🔍 Critic — quality & review (the gate)
- **Mandate:** review every other agent's work before it merges; run the validator, the build, and any tests; apply judgment; return failing work with specific findings. Veto power.
- **Owns (write):** `scripts/validate-kb.mjs`, test infrastructure, review notes in the ledger. **Never** silently rewrites feature work — returns it.
- **Quality bar:** mechanical checks must actually be run (evidence, not assertion); findings are specific and actionable.

### 📣 Herald — open-source & community
- **Mandate:** make this a *platform*, not just an app — README that frames the learning-platform vision, CONTRIBUTING with the data-contract so musicians (not only coders) can PR a style, issue/PR templates, license, changelog, public roadmap.
- **Owns (write):** `README.md`, `CONTRIBUTING.md`, `LICENSE`, `.github/**`, contributor-facing docs.
- **Quality bar:** links resolve; instructions are runnable as written; a non-coding musician can follow the "add a style" path.

---

## Cadence weights (how the conductor balances the band)

Per-domain rhythm is expressed as how often Maestro is *eligible* to pick that domain each iteration — not as separate schedules (see [`PROTOCOL.md` §Scheduling](PROTOCOL.md)).

| Agent | Weight | Effect |
|---|---|---|
| Professor | 3 | content can advance every iteration |
| Luthier | 3 | engineering every iteration (tasks are larger, span iterations naturally) |
| Muse | 2 | when there is UI pending style (event-driven) |
| Critic | — | mandatory gate stage every iteration, not weighted |
| Herald | 1 | ~every 4th iteration, or when a contributor-facing change lands |
| Maestro | — | plans + reconciles every iteration |
