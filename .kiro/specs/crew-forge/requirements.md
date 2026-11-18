# Spec: crew-forge — Requirements

## Introduction
The Forge is where the founder defines the crew and the work. It covers agent CRUD, task CRUD, assignment with division rules, and finding things again (filter + search). Everything here writes to the single `AppState` owned by `App.tsx`.

## Glossary
- **Agent:** a crew member with a name, role, division, color, emoji, and skills.
- **Task:** a unit of work with a title, division, effort (1–5), priority, assignee, and status.
- **Division:** one of the six office divisions. An agent belongs to exactly one division; a task belongs to exactly one division.

## Requirements

### Agent management
1. WHEN the founder opens the Forge view THEN the system SHALL list all agents grouped or filterable by division, showing name, role, division, current task, and status.
2. WHEN the founder submits the new-agent form with a name, role, and division THEN the system SHALL create an agent with status Idle, no current task, and the chosen color/emoji/skills (defaults: division color, ✨, no skills).
3. WHEN the founder submits the new-agent form with a missing name or role THEN the system SHALL refuse to create the agent and SHALL show which field is missing.
4. WHEN the founder edits an agent THEN the system SHALL persist the change immediately and SHALL keep the agent's current task and status unless the division changed.
5. WHEN the founder changes an agent's division while the agent has a current task in the old division THEN the system SHALL unassign the agent (task returns to To Do, unassigned) and SHALL explain why.
6. WHEN the founder deletes an agent THEN the system SHALL remove the agent and SHALL return all of their tasks to the To Do queue unassigned, and SHALL log a feed event.

### Task management
7. WHEN the founder submits the new-task form with a title, division, and effort THEN the system SHALL create a task with status To Do (or Doing when an assignee is chosen) and progress 0.
8. WHEN the founder submits the new-task form with a missing title or an effort outside 1–5 THEN the system SHALL refuse and SHALL show which field is wrong.
9. WHEN the founder edits a task THEN the system SHALL persist the change immediately.
10. WHEN the founder deletes a task THEN the system SHALL remove it and SHALL free its assignee (agent becomes Idle).

### Assignment
11. WHEN the founder assigns a task to an agent in the same division THEN the system SHALL set the task to Doing, set the agent to Working with that task, and SHALL log a feed event.
12. WHEN the founder assigns a task to an agent in a different division THEN the system SHALL refuse and SHALL explain the division mismatch.
13. WHEN the founder assigns a task to an agent who is already working on another task THEN the system SHALL refuse and SHALL name the task the agent is already doing.
14. WHEN the founder assigns a task to a blocked agent THEN the system SHALL refuse and SHALL say the agent must be unblocked first.
15. WHEN the founder unassigns a task THEN the system SHALL set it to To Do with progress 0 and SHALL free the agent.

### Finding things
16. WHEN the founder types in the search box THEN the system SHALL filter agents and tasks by name/title substring (case-insensitive) without a page reload.
17. WHEN the founder picks a division filter THEN the system SHALL show only agents and tasks of that division; "All divisions" SHALL clear the filter.

### Acceptance criteria (end-to-end)
- A founder can forge a new agent, create a task, assign it, and see the agent Working — all without a reload and without touching the Office view.
- All validation failures name the problem in plain English and leave existing data untouched.
