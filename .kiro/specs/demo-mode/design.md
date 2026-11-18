# Spec: demo-mode — Design

## Overview
Demo mode is three things: seed data (`src/lib/seed.ts`, already written — the real office crew), the guided tour (`DemoTour.tsx`), and the data tools (export / import / reset, wired in `App.tsx`). The tour drives the app through callbacks App already provides (`onGoToView`, `onDemoAction`); it never mutates state directly.

## Components
- `DemoTour` (`src/components/DemoTour.tsx`) — anchored overlay (`.tour-overlay` + `.tour-dim` + `.tour-blocker` + `.tour-card`) with:
  - Anchored card: on step change the tour scrolls the target into view, measures its rect, and positions the card so it never overlaps the target — below first, then above, then to the side. For a target taller than the viewport minus the card (the agent-cards grid) the page is scrolled a little further so the card fits below the target; only if nothing fits does the card shrink with an internal scroll. The dim (`.tour-dim`) is a full-screen layer with a `clip-path` cutout around the target, so the target stays fully visible and undimmed; `.tour-blocker` (transparent) keeps the tour modal by swallowing clicks behind it, including inside the cutout. A missing target falls back to a full dim with the card bottom-centred (`.tour-card--fallback`).
  - Target resolution (`resolveTarget` in `DemoTour.tsx`): a step anchors to its `targetId` element, except (a) step 1 compacts the agent grid first — `.tour-compact-grid` on `#agent-cards` (five dense columns, smaller avatars, task line clamped to one line with an ellipsis) so the whole grid and the card fit in 720px; the class is removed when the tour leaves step 1 or closes; (b) step 4 carries a `fallbackSelector` — after "Run this step" switches the view to the Office and unmounts `#task-form`, the card re-anchors to the newly assigned task card via `data-task-title="Ship the demo feature"` (hook on the `<article>` in `TaskBoard.tsx`); the action re-anchors at 120/350/800ms until the card has settled, so the old bottom-centred fallback never appears; (c) step 6 carries a `followTaskTitle` — it anchors to that same task card while it exists (falling back to `#task-board`), and a 400ms interval keeps the card near the middle of the viewport (scrolling it to centre whenever it drifts more than 80px off-centre or leaves the viewport) and re-anchors as the simulation moves it between Doing and Done. Centring matters because at 4x other tasks keep completing above it in the Done column, each pushing it down a card height — centred, one push still leaves it fully visible. Small card targets scroll to the middle of the viewport (`block: 'center'`); full-size targets scroll to the top as before.
  - Step definitions (array of `{ title, body, view, targetId, action?, fallbackSelector?, followTaskTitle?, compactGrid? }`):
    1. "Meet the crew" — Office view, target `#agent-cards`, `compactGrid: true`. No action.
    2. "This is the office map" — Office view, target `#office-map`. No action.
    3. "Forge a new agent" — Forge view, target `#agent-list`, action `forge-agent` (creates Bolt).
    4. "Give the crew work" — Forge view, target `#task-form`, action `assign-task` (creates "Ship the demo feature", assigns to Bolt), `fallbackSelector: [data-task-title="Ship the demo feature"]`.
    5. "Speed up time" — Office view, target `#sim-controls`, action `speed-up` (4x + running).
    6. "Watch it finish" — Office view, target `#task-board` with `followTaskTitle: "Ship the demo feature"`. No action; body tells the viewer to watch the board and feed.  - Navigation: Back / Next / Skip / Close (×) + Escape key to close. Step dots showing progress. The "Run this step" button appears only on steps with an action, and becomes "Done ✓" after the action runs once.
  - Highlight: on step change, the tour adds the `.tour-highlight` class to the element matching `targetId` (via `document.getElementById`) and removes it from the previous target; on close it removes all highlights. The highlight also raises the target above the dim (`position: relative; z-index: 51`) with a green glow, and the dim is cut out around the target so the target is never dimmed. For follow/fallback steps the highlighted element is the task card resolved by `resolveTarget`, and the step-6 interval re-applies the highlight if React re-creates the card node as it moves columns.
  - The tour opens with `open=true`; when closed it unmounts cleanly (no leftover highlight classes).
- Seed data — `src/lib/seed.ts` (`buildSeedState()`): 14 agents, 16 tasks, 5 feed events, sim seeded (seed 20261118) so blocked events are repeatable-ish. `App.tsx` calls `buildSeedState()` on first load (via `loadState`) and on Reset.
- Data tools — in `App.tsx`: Export downloads `crewforge-crew.json` (Blob + anchor click); Import reads a file and validates via `importState` in `store.ts` (shape check: arrays + sim.tick); Reset confirms with `window.confirm` then replaces state with `buildSeedState()`.
- Empty state — rendered by the views when `agents.length === 0 && tasks.length === 0`: a dashed panel with "Load the demo crew" calling the same reset path. (Each view checks; the Forge view is the natural home, but the Office view shows it too if both lists are empty.)

## Data flow
1. Tour step change → `onGoToView(view)` → App switches view → `useEffect` in DemoTour scrolls the target into view and anchors the card after a short delay (view must render first; 80ms timeout is enough), re-measuring the card once its real height is known.
2. "Run this step" → `onDemoAction(action)` → App performs the action (forge Bolt / assign task / speed-up) and shows a toast. The tour re-anchors at 120/350/800ms so a view switch (step 4) lands on the fallback task card, not the bottom-centred fallback.
3. Export/Import/Reset are synchronous state operations in App; Import is async only for FileReader.

## Error handling
- If a tour target element is missing (a view did not render yet), the tour skips the highlight for that step instead of crashing.
- Import of an invalid file shows "That file is not a valid CrewForge export." and keeps the current state.
- Reset is guarded by `window.confirm`.

## Testing strategy
- Manual verification: fresh load → seed crew present; Play demo → all six steps navigate + highlight; run each action once; watch the demo task complete at 4x; Close mid-tour → no leftover highlights; Export → Reset → Import → same crew back; delete everything → empty state → Load demo crew.
- Automated tour check: `../demo-video-work/verify-tour.cjs` (Playwright, 1280×720, fresh context) walks all six steps and asserts per step that the highlighted target is fully visible and undimmed, the card is readable, inside the viewport, and never overlapping the target or falling back to the bottom-centred card; it also checks the step-1 compact grid, the step-4 post-action anchor, the step-6 follow to Done, and Back/Skip/×/Escape. Screenshots land in `../demo-video-work/tour-caveats-stepN.png`.
- `npm run build` must pass (strict TS) after every change.
