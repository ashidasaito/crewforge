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
│   ├── hooks/                  # build-on-source-edit.json — runs `npm run build` after src/ edits (see tech.md)
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
    │   ├── seed.ts             # Real office crew + realistic tasks
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
- Tour overlay classes: `.tour-overlay` (transparent fixed shell, pointer-events none — children opt back in), `.tour-blocker` (transparent full-screen click swallow, keeps the tour modal), `.tour-dim` (full-screen dim with a `clip-path` cutout hole around the highlighted target), `.tour-card` (fixed-positioned by `DemoTour.tsx` via inline top/left, never overlapping the target), `.tour-card--fallback` (bottom-centred card, used only when a step's target is missing), `.tour-highlight` (green outline + glow, raises the target above the dim), `.tour-compact-grid` (dense 5-column agent grid used by the tour on step 1 only; removed on step change/close).
- **Narrow phones (≤600px media query, added 2026-11-18, verified at 390px):** `.form-row` collapses to one column (two-column form rows truncate select values at phone widths), and `.agent-grid.tour-compact-grid` drops from 5 to 3 columns (5 columns are ~64px each at 390px: names clip mid-word, badges spill past the card, and the page scrolls horizontally). No new class was added — both rules override existing classes inside the new breakpoint. The 3-column grid is taller, which the tour's anchor logic already handles by scrolling and shrinking the card.

## DOM ids (stable — the demo tour targets them)
- `#forge-view`, `#office-view`
- `#agent-list`, `#task-form`, `#sim-controls`, `#task-board`, `#agent-cards`, `#activity-feed`, `#office-map`, `#stats-strip`
- Do not rename these ids without updating `DemoTour.tsx` and the demo-mode spec.
- Task cards also carry `data-task-title="<title>"` (set in `TaskBoard.tsx`) — the tour's stable hook for following one task card across board columns (steps 4–6).

## Naming
- Files: PascalCase for components (`ForgeView.tsx`), camelCase for lib modules (`sim.ts`).
- CSS classes: kebab-case, prefixed by feature (`.agent-*`, `.task-*`, `.room-*`, `.tour-*`).
- Test ids are not used; the demo tour uses the DOM ids above.
