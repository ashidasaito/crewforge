---
inclusion: always
---

# CrewForge — Structure

## Layout
```
crewforge/
├── index.html                  # Title: "CrewForge — Forge your AI crew"
├── package.json                # Scripts: dev / build / preview
├── README.md                   # What it is, how to run it, how Kiro was used
├── KIRO-USAGE.md               # Honest write-up of the Kiro workflow (for judges)
├── LICENSE                     # MIT
├── .gitignore                  # node_modules, dist — NEVER .kiro
├── AGENTS.md                   # Cross-tool agent instructions (also read by Kiro)
├── .kiro/
│   ├── steering/               # product.md, tech.md, structure.md (this file)
│   └── specs/
│       ├── crew-forge/         # requirements.md, design.md, tasks.md
│       ├── office-dashboard/   # requirements.md, design.md, tasks.md
│       └── demo-mode/          # requirements.md, design.md, tasks.md
├── public/
│   └── favicon.svg
└── src/
    ├── main.tsx                # Entry point (unchanged from Vite scaffold)
    ├── App.tsx                 # Shell: state, sim clock, persistence, view switch
    ├── index.css               # The only stylesheet; class names are the design system
    ├── lib/
    │   ├── types.ts            # Data model + DIVISIONS (the contract)
    │   ├── seed.ts             # Real MINOKATSU crew + realistic tasks
    │   ├── store.ts            # localStorage load/save/export/import
    │   └── sim.ts              # Pure simulation engine
    └── components/
        ├── ForgeView.tsx       # Crew + task management (spec: crew-forge)
        ├── OfficeView.tsx      # Dashboard: cards, board, feed, map, stats (spec: office-dashboard)
        └── DemoTour.tsx        # Guided tour overlay (spec: demo-mode)
```

## Component contracts
- `App.tsx` passes props; views never import `store.ts` or `sim.ts` directly (except through the callbacks App provides, plus read-only helpers from `types.ts`).
- New components go in `src/components/` and are imported by exactly one view (or by `App.tsx`).
- Reuse CSS classes from `src/index.css` (`.panel`, `.btn`, `.agent-card`, `.task-card`, `.board-col`, `.feed`, `.room`, `.stat`, `.form-card`, `.tour-card`, …). Add a new class only when no existing class fits, and document it in `structure.md`.

## DOM ids (stable — the demo tour targets them)
- `#forge-view`, `#office-view`
- `#agent-list`, `#task-form`, `#sim-controls`, `#task-board`, `#agent-cards`, `#activity-feed`, `#office-map`, `#stats-strip`
- Do not rename these ids without updating `DemoTour.tsx` and the demo-mode spec.

## Naming
- Files: PascalCase for components (`ForgeView.tsx`), camelCase for lib modules (`sim.ts`).
- CSS classes: kebab-case, prefixed by feature (`.agent-*`, `.task-*`, `.room-*`, `.tour-*`).
- Test ids are not used; the demo tour uses the DOM ids above.
