# Spec: office-dashboard — Design

## Overview
`OfficeView.tsx` composes five presentational pieces over the shared `AppState`. It owns only local UI state: the selected division filter (or null) and nothing else. All mutations go through `App.tsx` callbacks (`onAssign`, `onMove`, `onUnblock`, `onSetRunning`, `onSetSpeed`).

## Components
- `OfficeView` — layout: stats strip → sim controls → office map → agent cards → board + feed side by side (board left, feed right on desktop; stacked on mobile). DOM id `#office-view`.
- `StatsStrip` (inline in `OfficeView.tsx` unless it grows) — four stats from state. DOM id `#stats-strip`.
- `SimControls` (inline) — Play/Pause button, 1x/2x/4x speed buttons (active marked), tick counter in monospace. DOM id `#sim-controls`.
- `AgentCard` (new file `src/components/AgentCard.tsx`) — avatar (emoji + division-color ring), name, role, division badge, status badge (Idle / Working / Blocked), current task title or "Idle — waiting for work", progress bar (only while working), blocked note + Resolve button (only while blocked). Uses `.agent-card` and sets `--div-color` inline from the division color.
- `TaskBoard` (new file `src/components/TaskBoard.tsx`) — three columns with counts; each card shows title, description (one line), division badge, effort (e.g. "Effort 3"), priority label, assignee name; move buttons (← / →) per card; HTML5 drag-and-drop between columns (draggable cards, drop targets on columns) with the buttons as the always-working fallback. DOM id `#task-board`.
- `ActivityFeed` (new file `src/components/ActivityFeed.tsx`) — newest-first list, each row: tick number (mono), kind icon (▶ start, ✅ done, ⚠️ blocked, 🔓 unblocked, 📌 assign, ℹ️ system), text, relative time ("2 min ago"). DOM id `#activity-feed`. Max height with scroll.
- `OfficeMap` (new file `src/components/OfficeMap.tsx`) — CSS grid of six room buttons; each shows room label, division name, agent dots (emoji in a circle), "n active" count; click toggles the division filter. DOM id `#office-map`.

## Data flow
1. `App.tsx` ticks the engine on an interval (`1000 / speed` ms) while `sim.running`; each tick returns a new state → re-render.
2. Board moves call `onMove(taskId, to)` → `moveTask` in `sim.ts` → error string (if any) shown in the App toast.
3. Resolve calls `onUnblock(agentId)` → `unblockAgent` in `sim.ts`.
4. Division filter is local to `OfficeView` and filters both the agent grid and the board columns (feed is never filtered).

## Error handling
- Move failures (no assignee, wrong source state) surface as toast messages; the board does not change.
- Drag-and-drop failure (e.g. dropped outside a column) is a no-op — the card stays where it was.

## Testing strategy
- Manual verification: start the app, confirm a Doing task progresses and completes; pause/resume; speeds; block → resolve; board move buttons; drag a card; room filter on/off; feed grows.
- `npm run build` must pass (strict TS) after every change.
