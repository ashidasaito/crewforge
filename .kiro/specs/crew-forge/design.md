# Spec: crew-forge — Design

## Overview
`ForgeView.tsx` is a two-column management view (agents on the left, tasks on the right on desktop; stacked on mobile). It is a pure view: all mutations go through the callbacks `App.tsx` provides (`onAddAgent`, `onUpdateAgent`, `onDeleteAgent`, `onAddTask`, `onUpdateTask`, `onDeleteTask`, `onAssign`). Validation that needs cross-entity knowledge (division match, agent busy/blocked) lives in `src/lib/sim.ts` (`assignTask`) — the view surfaces the returned error string in the toast.

## Components
- `ForgeView` — layout, filter/search state, wires the forms and lists together. DOM id `#forge-view`.
- `AgentForm` (new file `src/components/AgentForm.tsx`) — controlled form: name (text, required), role (text, required), division (select, required), color (color input, default = division color), emoji (text, 1 char, default ✨), skills (comma-separated text → string[]). Used for both create and edit (edit pre-fills values).
- `TaskForm` (new file `src/components/TaskForm.tsx`) — controlled form: title (text, required), description (textarea), division (select), effort (number 1–5, default 2), priority (select Low/Medium/High, default Medium), assignee (select of agents in the chosen division + "Unassigned"). Changing the division resets the assignee picker to the agents of that division.
- `AgentList` — inside `ForgeView` (or a separate file if it grows): rows with avatar, name, role, division badge, status badge, current task title, Edit / Delete buttons. Delete asks for confirmation via `window.confirm`.
- `TaskList` — rows with title, division badge, effort, priority, assignee name or "Unassigned", status, Edit / Delete buttons, and an assignee select for quick reassignment.
- DOM ids: the agent list container `#agent-list`, the task form `#task-form`.

## Data flow
1. Form submit → local validation (required fields, effort range) → callback to `App.tsx` → `setState` → localStorage auto-save (App effect) → re-render.
2. Assignment from the Forge uses `onAssign(taskId, agentId)` → `assignTask` in `sim.ts` → error string (if any) shown as a toast by `App.tsx`.
3. Division change on an agent edit: `App.updateAgent` applies the patch; if the agent had a current task whose division no longer matches, `App.deleteAgent`-style cleanup applies — unassign first, then patch (implemented in `ForgeView` via the existing `onAssign(taskId, null)` callback, since `App.tsx` holds no cleanup logic; the view shows an inline note explaining why).

## Error handling
- Form-level: inline message under the offending field; submit is blocked until fixed.
- Assignment-level: the error string from `assignTask` is shown in the App toast for 4 seconds; no state is changed on failure.
- Delete: `window.confirm` with the agent/task name in the prompt.

## Testing strategy
- Manual verification (no test runner in the MVP): create agent → appears in list; create task → appears; assign across divisions → refused with message; assign to busy agent → refused; delete agent → tasks return to To Do; search/filter → lists narrow correctly.
- `npm run build` must pass (strict TS) after every change.
