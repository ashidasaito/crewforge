# Spec: office-dashboard — Tasks

- [ ] 1. Replace the `OfficeView` stub with the real layout (stats → sim controls → map → agent cards → board + feed)
  - _Requirements: 1_
- [ ] 2. Implement the stats strip (crew size, in flight, done, finished by crew) from live state
  - _Requirements: 1_
- [ ] 3. Implement sim controls: Play/Pause toggle, 1x/2x/4x speed buttons with active state, tick counter
  - _Requirements: 2, 3, 4_
- [ ] 4. Implement `AgentCard` (`src/components/AgentCard.tsx`): avatar, role, division, status badge, current task, progress bar, blocked note + Resolve button
  - _Requirements: 5, 6, 7_
- [ ] 5. Implement `TaskBoard` (`src/components/TaskBoard.tsx`): three columns with counts, cards, move buttons, HTML5 drag-and-drop with buttons as fallback
  - _Requirements: 8, 9, 10, 11_
- [ ] 6. Implement `ActivityFeed` (`src/components/ActivityFeed.tsx`): newest-first, tick + time + kind icon, scrollable, newest 200 kept
  - _Requirements: 12, 13_
- [ ] 7. Implement `OfficeMap` (`src/components/OfficeMap.tsx`): six rooms with agent dots and active-task counts; click filters board + cards, click again clears
  - _Requirements: 14, 15_
- [ ] 8. Add DOM ids `#stats-strip`, `#sim-controls`, `#task-board`, `#agent-cards`, `#activity-feed`, `#office-map`; verify end-to-end (task progresses → completes → feed narrates; pause; speeds; block → resolve) and run `npm run build`
  - _Requirements: Acceptance criteria_
