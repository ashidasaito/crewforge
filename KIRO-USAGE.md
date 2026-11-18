# How Kiro was used to build CrewForge

This is an honest account of the Kiro workflow behind this project, written for the Kiroween 2026 judges. It describes what actually happened — not what would sound impressive.

## Spec-driven development (the core of the build)

Before any feature code was written, the build followed Kiro's spec workflow:

1. **Requirements first.** Each feature got a spec in `.kiro/specs/<name>/` with `requirements.md` written in EARS notation ("WHEN [condition] THE SYSTEM SHALL [behavior]"), so every behavior had an acceptance condition before implementation started.
2. **Design second.** `design.md` recorded the component breakdown, data flow, error handling, and testing strategy for each spec.
3. **Tasks third.** `tasks.md` broke each spec into small, checkable implementation tasks, and the build worked through them in order.

Three specs were written and followed:

| Spec | What it covers |
|---|---|
| `crew-forge` | Agent CRUD, task CRUD, assignment rules, filter + search |
| `office-dashboard` | Agent cards, task board, activity feed, office map, stats, sim controls |
| `demo-mode` | Seed data, guided tour, export/import/reset, empty state |

The specs are plain Markdown, committed in `.kiro/specs/`, and they are the reason the three builders could work in parallel without stepping on each other: the data model and the component contracts were settled before the first component was written.

## Steering docs

`.kiro/steering/` carries the lasting project context that every session loads:

- `product.md` — what CrewForge is, who it is for, the true office story, and the non-goals.
- `tech.md` — the stack (Vite + React + TypeScript strict), the commands, and the hard constraints (single state owner, pure simulation engine, no network at runtime, English everywhere).
- `structure.md` — the directory layout, the component contracts, the CSS class system, and the stable DOM ids the demo tour targets.

A root `AGENTS.md` mirrors the same rules for any agent tool that opens the repo (Kiro reads it as an always-included steering file).

## Kiro IDE / CLI on the founder's laptop

The 4,000 free Kiroween credits were redeemed on the founder's Kiro account (Free plan, GitHub sign-in) and are used in **Kiro IDE on the founder's laptop** for spec-driven iteration — opening this repo in Kiro, running the specs, and letting Kiro implement/refine tasks from `tasks.md`. That step happens on the laptop because this build ran on a VM without a Kiro IDE install; the repo is structured so the Kiro pass is a normal continuation of the same spec workflow, not a separate process.

## What Kiro did NOT do

- Kiro did not invent the product: the concept, the office story, and the seed data come from the founder's real office.
- No vibe coding: no feature was built from a bare prompt without a spec. Where the implementation deviated from a spec, the spec was updated first.
- No MCP servers, custom agents, hooks, or property-based testing were used in this build. Those are real Kiro features we did not need; claiming them would be dishonest.

## Compared to vibe coding

Writing requirements in EARS before touching code forced the hard decisions early — the division-matching rule for assignment, what happens when an agent's division changes mid-task, how a blocked agent resumes. In a pure vibe-coding flow those edge cases surface as bugs during the demo; here they were acceptance criteria before the code existed. The specs also made parallel work possible: three builders, one data model, zero merge conflicts on the contract.
