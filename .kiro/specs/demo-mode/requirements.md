# Spec: demo-mode — Requirements

## Introduction
Demo mode is how a stranger understands CrewForge in under two minutes: the real office seed crew, a guided tour that drives the app, and data tools (export / import / reset) so the demo is repeatable. The tour must work with zero setup and must never break the app state.

## Requirements

### Seed data
1. WHEN the app loads with no saved state THEN the system SHALL seed the real office crew (14 agents, 6 divisions) and 16 realistic tasks in mixed states (To Do / Doing / Done).
2. WHEN the founder presses "Reset demo crew" and confirms THEN the system SHALL replace the current state with the seed and SHALL show a confirmation message.

### Guided tour
3. WHEN the founder presses "Play demo" THEN the system SHALL open a guided tour overlay with a step counter (e.g. "Step 2 of 6").
4. WHEN a tour step targets a part of the UI THEN the system SHALL navigate to the right view, SHALL scroll the target into view, SHALL leave the target undimmed inside a cutout in the dim with a highlight ring, and SHALL anchor the step card beside the target (below first, then above, then to the side) so the card never covers the target.
5. WHEN the founder presses Next THEN the system SHALL advance to the next step; Back SHALL go to the previous step; Close (or Escape) SHALL exit the tour at any time.
6. WHEN the tour reaches the "forge an agent" step THEN the system SHALL offer a one-click action that forges a sample agent ("Bolt", Demo Agent, Product Development) without typing.
7. WHEN the tour reaches the "assign a task" step THEN the system SHALL offer a one-click action that creates a small task and assigns it to the sample agent.
8. WHEN the tour reaches the "speed up" step THEN the system SHALL offer a one-click action that sets the simulation to 4x and running.
9. WHEN the tour ends THEN the system SHALL close the overlay and SHALL leave the app in a working state (the sample agent and task remain; nothing is deleted).

### Data tools
10. WHEN the founder presses Export THEN the system SHALL download the full crew state as a JSON file named `crewforge-crew.json`.
11. WHEN the founder imports a file THEN the system SHALL replace the state only if the file parses as a valid CrewForge export; otherwise it SHALL refuse and SHALL say the file is not valid.
12. WHEN the app loads with saved state THEN the system SHALL restore it exactly (agents, tasks, feed, simulation tick, stats).

### Empty state
13. WHEN the crew has no agents and no tasks THEN the system SHALL show an empty state with "Load the demo crew" as the primary action.

### Acceptance criteria (end-to-end)
- A first-time visitor can press "Play demo", follow six steps, and watch a task complete — without typing anything and without reading any docs.
- Export → Reset → Import restores the exact same crew.
