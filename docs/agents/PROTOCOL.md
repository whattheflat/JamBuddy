# Ensemble Protocol — How the Agents Collaborate

The operating system for the [six-agent ensemble](ROSTER.md). Agents are isolated subagents — they share **no memory**, only **files**: the live ledger ([`LEDGER.md`](LEDGER.md)) and the repo. Everything below makes that file-mediated collaboration safe and productive.

---

## 1. The unit of work: a great task

An iteration is only as good as its tasks. Every ledger task MUST be:

1. **Bounded** — one domain, one definition-of-done, completable in one session.
2. **Owned** — exactly one agent appointed (domain → agent is 1:1).
3. **Locked** — declares the files it will write; that set is its lock.
4. **Justified** — content cites sources, code references the task id, design references tokens.
5. **Gated** — Critic reviews before merge; nothing self-certifies.
6. **Logged** — on completion: ledger updated, commit made, `GOAL.md` touched if scope shifted.

If a task can't be written this way, it's too big — Maestro splits it.

---

## 2. The ledger lifecycle

Status flow, managed in [`LEDGER.md`](LEDGER.md):

```
backlog → ready → claimed → in-review → done
                     │           │
                     └───────────┴──→ returned (with findings) → ready
```

- **backlog** — captured, not yet actionable.
- **ready** — dependencies met; Maestro promoted it.
- **claimed** — an agent is working it; its files are now **locked**.
- **in-review** — work done, handed to Critic.
- **done** — Critic passed it; merged.
- **returned** — Critic failed it; carries specific findings; goes back to ready.

**The locking rule (prevents file conflicts):** an agent may only claim a `ready` task whose declared files do **not** overlap any `claimed` or `in-review` task. This serialises conflicting work without a central daemon — the check happens at claim time against the ledger.

---

## 3. File ownership map

Primary owner routes the task; co-reviewers must sign off on cross-domain files.

| Path | Primary | Co-review |
|---|---|---|
| `src/data/kb/**` (content) | Professor | Critic (validator) |
| `src/data/kb/SCHEMA.md`, `scripts/validate-kb.mjs` | Critic | Professor, Luthier |
| `src/components/**`, `src/services/**`, `src/App.jsx`, `electron/**`, build cfg | Luthier | Critic; Muse if visual |
| `tailwind.config.js`, visual layer, SVG renderers | Muse | Luthier (integration), Critic |
| `src/lib/theory.js` | **shared** Professor (music) + Luthier (code) | Critic |
| `docs/learn-curriculum.md`, `docs/progression-repertoire.md`, `docs/kb-*.md` | Professor | Herald (clarity) |
| `README.md`, `CONTRIBUTING.md`, `LICENSE`, `.github/**` | Herald | Maestro |
| `GOAL.md`, `docs/agents/LEDGER.md` | Maestro | all read |

**Shared files** (`theory.js`) get strict task-locking: only one task touching them runs at a time, reviewed by Critic **and** the non-owning domain.

---

## 4. The appointment algorithm (each iteration)

This is what `/jam-loop` (Maestro, run by the main loop) executes:

1. **PLAN** — read `LEDGER.md` + `GOAL.md`. Promote `backlog → ready` where deps are met. Pick the next batch by `priority × cadence-weight` ([weights in ROSTER](ROSTER.md)), ensuring file-disjointness for any parallel batch.
2. **APPOINT** — for each chosen task, dispatch the agent whose domain == `task.domain`.
3. **DISPATCH** — choose the shape:
   - **Serial (default, proven):** one task → one agent via the Agent tool. A dependent chain → run in order.
   - **Sprint (opt-in / "ultracode"):** independent ready tasks → parallel; dependent tasks → pipeline; via the Workflow tool.
   - **Parallel writes to disjoint files** → give each agent `isolation: "worktree"`.
4. **GATE** — every completed worker task → **Critic** reviews (runs `npm run build`, `node scripts/validate-kb.mjs`, tests; applies judgment). Pass → `done`; fail → `returned` with findings.
5. **RECONCILE** — Maestro commits passing work (one commit per task), updates `LEDGER.md` + `GOAL.md`, writes a one-line iteration log.
6. **CONTINUE** — schedule the next iteration, or at sprint end open the PR (see §6).

**Appointing correctly = the five rules of great iterations** (§1) applied at dispatch: bounded scope to one agent, files locked, sources/refs required, Critic gate wired in, honest status on return.

---

## 5. Scheduling

The clean model: **schedule the conductor, not the band.** One recurring loop runs `/jam-loop`; each fire is one orchestrated iteration that appoints whichever agent the next ready task needs.

- **Session loop** (runs while this terminal is open): `/loop 1h /jam-loop` — good for a focused build sprint you're watching.
- **Cloud schedule** (durable, survives closing the session): `/schedule` → e.g. "run /jam-loop every weekday at 09:07" — good for steady background progress. Recommended for a standing ensemble.

Per-domain cadence is the **weight**, not a separate cron: content advances most iterations, OSS/docs every ~4th. To shift emphasis for a stretch (e.g. "design week"), Maestro raises Muse's weight in the ledger header — no schedule change.

**Advanced — true parallel cadences (not default).** You *can* run separate loops per agent (`/loop 1h /jam-loop --only professor`, `/loop 3h /jam-loop --only luthier`). Only do this with **worktree isolation mandatory** and **strictly disjoint file ownership per loop**, or they will collide on shared files (`theory.js`, `App.jsx`, the ledger). The single-conductor model avoids this entirely; prefer it unless you have a specific throughput need.

---

## 6. Branching, review, and PRs

- One **sprint branch** off `main` (e.g. `sprint-jam-guide`); each task is a commit (parallel disjoint work uses worktrees off the branch).
- Critic gates every commit; Maestro opens **one PR per sprint** to `main` summarising all tasks + validator/build status.
- **Known constraint (this machine):** `gh` CLI is not installed. Open PRs via the GitHub API using stored git credentials:
  ```bash
  TOKEN=$(printf 'protocol=https\nhost=github.com\n\n' | git credential fill | sed -n 's/^password=//p')
  # POST to https://api.github.com/repos/whattheflat/JamBuddy/pulls with {title, head, base, body}
  ```
  (Repo was renamed `whattheflat` → `JamBuddy`; origin URL still works for push.)

---

## 7. Conflict resolution

- **File clash at claim time** → can't claim; pick another ready task or wait for the lock to clear.
- **Cross-domain disagreement** (e.g. Muse wants a layout Luthier says is infeasible) → Maestro decides, records the call in the ledger, and if it's a product question surfaces it to the human instead of guessing.
- **Critic vs author** → Critic's gate is binding on *correctness/quality*; on *taste/scope*, Maestro arbitrates. Returned work always carries specific, actionable findings — never a bare rejection.
- **Scope creep** → if a task grows mid-flight, the agent stops, notes it in the ledger, and Maestro re-splits. Silent scope expansion is the cardinal sin.

---

## 8. State lives in files (because agents don't share memory)

Every iteration must leave perfect context for the next, since the next agent starts fresh:
- the **ledger** carries task status, locks, and findings;
- the **commit** carries the change and its rationale;
- **`GOAL.md`** carries shifts in direction;
- a recalled **memory** file (`project_ensemble`) carries the standing setup.

Write as if the next agent has never seen this conversation — because it hasn't.
