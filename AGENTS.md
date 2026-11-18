# AGENTS.md — CrewForge

Instructions for any AI agent working in this repo (Kiro reads this as an always-included steering file).

## The product
CrewForge is a local-first web app: a solo founder forges a crew of AI agents, assigns tasks, and watches the crew work in a live office dashboard. Built for Kiroween 2026 (Frankenstein). The seed crew is the founder's real office — keep names, roles, and tasks truthful; do not invent people.

## Rules
- **Specs first.** A feature starts in `.kiro/specs/<name>/` (requirements in EARS, then design, then tasks). Implement from `tasks.md` in order. Update the spec if the implementation must deviate.
- **One state owner.** `App.tsx` owns `AppState`. Views get state + callbacks as props and never keep their own copy of crew/task data.
- **Pure engine.** `src/lib/sim.ts` is pure functions only — no DOM, timers, or storage. `App.tsx` owns the interval.
- **Persistence only via `src/lib/store.ts`.** Key: `crewforge-state-v1`. Never touch localStorage from a component.
- **Data model is the contract.** `src/lib/types.ts` — do not change a type without updating the specs, the seed, and every component that uses it.
- **Strict TypeScript.** `npm run build` must pass with zero errors. No unused locals/parameters. No `any` without a comment.
- **Plain CSS only**, in `src/index.css`. Reuse existing classes; document any new class in `.kiro/steering/structure.md`.
- **English everywhere** — UI copy, docs, commit messages.
- **Honesty:** the crew is simulated locally. Never claim real AI agents, API calls, or network features. The app, README, and video all say so.
- **No backend, no accounts, no paid APIs, no real money.** Do not add them.
- **Never add `.kiro` to `.gitignore`.** The Kiroween rules require `/.kiro` at the repo root.

## Commands
- `npm install` · `npm run dev` (http://localhost:5173) · `npm run build` · `npm run preview`

## Key files
- Specs: `.kiro/specs/crew-forge`, `.kiro/specs/office-dashboard`, `.kiro/specs/demo-mode`
- Steering: `.kiro/steering/product.md`, `tech.md`, `structure.md`
- Product spec: `../crewforge-spec-2026-11-18.md` (in the goal folder, not the repo)
- Rules: `../kiroween-rules-2026-11-18.md` (in the goal folder, not the repo)
