# Spec: office-dashboard — Requirements

## Introduction
The Office is the live dashboard: the founder watches the crew work. It shows agent cards, the task board, the activity feed, the office map, the stats strip, and the simulation controls. The simulation engine itself lives in `src/lib/sim.ts`; this spec covers only what the founder sees and touches.

## Requirements

### Stats strip
1. WHEN the Office view loads THEN the system SHALL show crew size, tasks in flight, tasks done, and tasks finished by the crew, computed from the current state.

### Simulation controls
2. WHEN the founder presses Pause THEN the system SHALL stop the simulation clock; pressing Play SHALL resume it. The button label SHALL always show the action that will happen next.
3. WHEN the founder picks a speed (1x / 2x / 4x) THEN the system SHALL run the clock at that speed; the active speed SHALL be visibly marked.
4. WHEN the simulation is running THEN the system SHALL show the current tick count.

### Agent cards
5. WHEN the Office view loads THEN the system SHALL show one card per agent with avatar, name, role, division, status badge, current task title, and a progress bar while working.
6. WHEN an agent is blocked THEN the system SHALL show the blocked note and a Resolve button; pressing Resolve SHALL unblock the agent and resume their task.
7. WHEN an agent finishes a task THEN the system SHALL update the card to Idle (or to the next task, if one was auto-picked) without a reload.

### Task board
8. WHEN the Office view loads THEN the system SHALL show three columns (To Do / Doing / Done) with a count on each, cards showing title, division, effort, priority, and assignee.
9. WHEN the founder moves a task to Doing without an assignee THEN the system SHALL refuse and SHALL say the task needs an assignee first.
10. WHEN the founder moves a task to Done THEN the system SHALL mark it done, free its agent, and update the counts.
11. WHEN the founder drags a card between columns THEN the system SHALL apply the same rules as the move buttons; if drag is unavailable the buttons SHALL still work.

### Activity feed
12. WHEN the simulation or the founder causes an event (start, finish, block, unblock, assign) THEN the system SHALL prepend it to the feed with a tick number and a readable time.
13. WHEN the feed grows beyond 200 events THEN the system SHALL keep only the newest 200.

### Office map
14. WHEN the Office view loads THEN the system SHALL show six rooms (one per division) with the agents in that room as dots and a count of active tasks.
15. WHEN the founder clicks a room THEN the system SHALL filter the board and the agent cards to that division; clicking again (or an "All" control) SHALL clear the filter.

### Acceptance criteria (end-to-end)
- With the simulation running, a Doing task visibly progresses, completes, moves to Done, and the feed narrates it — with no reload and no errors.
- Pause stops all progress; 4x visibly runs faster than 1x; a blocked agent can be resolved from their card.
