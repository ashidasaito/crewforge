# CrewForge 🔨

**Forge a crew of AI agents. Give it work. Watch it work.**

CrewForge is a local-first web app for solo founders who run a crew of AI agents: define each agent's role and division, assign tasks, and watch the crew work in a live office dashboard — agent cards, a Kanban board, an office floor-plan map, and an activity feed that narrates the crew's progress in real time.

Built for **Kiroween 2026** (Frankenstein category) with **Kiro**, using spec-driven development. See [KIRO-USAGE.md](./KIRO-USAGE.md) for exactly how Kiro was used.

## The true story

This is not a made-up demo. The founder runs a real 15-person AI office, every day — six divisions (Research & Security, Content & Video, Freelance & Bounty, Admin & Money, Learning & Presentation, Product Development) with named agents doing real jobs: Kira hunts bounties, Nana builds games, Mizuki cuts clips, Gita posts, Momo monitors the feeds, Nadia keeps the savings ledger. CrewForge is the tool he wished he had on day one, and the app ships with the real office crew as its seed data.

## What it does

- **Forge** — create/edit agents (name, role, division, color, emoji, skills) and tasks (title, division, effort 1–5, priority). Assign tasks to agents in the same division; the app enforces the rule and explains refusals.
- **Office** — live dashboard: agent cards with status and progress bars, a To Do / Doing / Done board (buttons + drag-and-drop), an activity feed, an office map of the six division rooms, and a stats strip.
- **Simulation engine** — a transparent, rule-based engine (no API calls, no cost): agents accrue progress every tick, finish tasks, and pick up the next task in their division. Occasionally an agent gets blocked and waits for the founder. Pause/resume, 1x/2x/4x speed.
- **Demo mode** — a guided 6-step tour that forges a sample agent, assigns it a task, and speeds up time so you watch the task finish. One click, no typing.
- **Local-first** — everything persists in `localStorage`. Export/import the whole crew as JSON, or reset to the demo crew.

## Honest note

CrewForge **simulates** an AI crew locally in your browser. There are no real AI agents behind the cards, no API keys, and no network calls at runtime. The simulation is the point: a founder can rehearse running a crew before paying for one. The app says so in the UI, and the video says so too.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # strict TypeScript + Vite build → static dist/
npm run preview  # serve the production build locally
```

No accounts, no keys, no backend. The production build is a static site — deploy it anywhere (GitHub Pages, Vercel, Netlify).

## Tech

- Vite 8 + React 19 + TypeScript (strict), plain CSS, no runtime dependencies beyond React.
- State: a single `AppState` owned by `src/App.tsx`; pure simulation engine in `src/lib/sim.ts`; persistence in `src/lib/store.ts` (localStorage key `crewforge-state-v1`).

## Project structure

```
src/
├── App.tsx            # Shell: state, sim clock, persistence, view switching
├── index.css          # The only stylesheet
├── lib/
│   ├── types.ts       # Data model + divisions (the contract)
│   ├── seed.ts        # Real office crew + realistic tasks
│   ├── store.ts       # localStorage load/save/export/import
│   └── sim.ts         # Pure simulation engine
└── components/
    ├── ForgeView.tsx  # Crew + task management
    ├── OfficeView.tsx # Dashboard: cards, board, feed, map, stats
    └── DemoTour.tsx   # Guided tour overlay
.kiro/
├── steering/          # product.md, tech.md, structure.md
└── specs/             # crew-forge, office-dashboard, demo-mode
    └── <spec>/        # requirements.md (EARS), design.md, tasks.md
```

## License

MIT — see [LICENSE](./LICENSE).
