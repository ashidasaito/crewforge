# Spec: demo-mode — Design

## Overview
Demo mode is three things: seed data (`src/lib/seed.ts`, already written — the real MINOKATSU crew), the guided tour (`DemoTour.tsx`), and the data tools (export / import / reset, wired in `App.tsx`). The tour drives the app through callbacks App already provides (`onGoToView`, `onDemoAction`); it never mutates state directly.

## Components
- `DemoTour` (`src/components/DemoTour.tsx`) — modal overlay (`.tour-overlay` + `.tour-card`) with:
  - Step definitions (array of `{ title, body, view, targetId, action? }`):
    1. "Meet the crew" — Office view, target `#agent-cards`. No action.
    2. "This is the office map" — Office view, target `#office-map`. No action.
    3. "Forge a new agent" — Forge view, target `#agent-list`, action `forge-agent` (creates Bolt).
    4. "Give the crew work" — Forge view, target `#task-form`, action `assign-task` (creates "Ship the demo feature", assigns to Bolt).
    5. "Speed up time" — Office view, target `#sim-controls`, action `speed-up` (4x + running).
    6. "Watch it finish" — Office view, target `#task-board` (or `#activity-feed`). No action; body tells the viewer to watch the board and feed.
  - Navigation: Back / Next / Skip / Close (×) + Escape key to close. Step dots showing progress. The "Run this step" button appears only on steps with an action, and becomes "Done ✓" after the action runs once.
  - Highlight: on step change, the tour adds the `.tour-highlight` class to the element matching `targetId` (via `document.getElementById`) and removes it from the previous target; on close it removes all highlights.
  - The tour opens with `open=true`; when closed it unmounts cleanly (no leftover highlight classes).
- Seed data — `src/lib/seed.ts` (`buildSeedState()`): 14 agents, 16 tasks, 5 feed events, sim seeded (seed 20261118) so blocked events are repeatable-ish. `App.tsx` calls `buildSeedState()` on first load (via `loadState`) and on Reset.
- Data tools — in `App.tsx`: Export downloads `crewforge-crew.json` (Blob + anchor click); Import reads a file and validates via `importState` in `store.ts` (shape check: arrays + sim.tick); Reset confirms with `window.confirm` then replaces state with `buildSeedState()`.
- Empty state — rendered by the views when `agents.length === 0 && tasks.length === 0`: a dashed panel with "Load the demo crew" calling the same reset path. (Each view checks; the Forge view is the natural home, but the Office view shows it too if both lists are empty.)

## Data flow
1. Tour step change → `onGoToView(view)` → App switches view → `useEffect` in DemoTour applies the highlight after a short delay (view must render first; 50ms timeout is enough).
2. "Run this step" → `onDemoAction(action)` → App performs the action (forge Bolt / assign task / speed-up) and shows a toast.
3. Export/Import/Reset are synchronous state operations in App; Import is async only for FileReader.

## Error handling
- If a tour target element is missing (a view did not render yet), the tour skips the highlight for that step instead of crashing.
- Import of an invalid file shows "That file is not a valid CrewForge export." and keeps the current state.
- Reset is guarded by `window.confirm`.

## Testing strategy
- Manual verification: fresh load → seed crew present; Play demo → all six steps navigate + highlight; run each action once; watch the demo task complete at 4x; Close mid-tour → no leftover highlights; Export → Reset → Import → same crew back; delete everything → empty state → Load demo crew.
- `npm run build` must pass (strict TS) after every change.
