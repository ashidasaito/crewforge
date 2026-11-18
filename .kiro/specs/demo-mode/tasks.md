# Spec: demo-mode — Tasks

- [ ] 1. Verify the seed data in `src/lib/seed.ts` renders correctly on first load (14 agents, 6 divisions, 16 tasks, mixed states)
  - _Requirements: 1, 12_
- [ ] 2. Replace the `DemoTour` stub with the real six-step guided tour (overlay, step dots, Back/Next/Skip/Close, Escape to close)
  - _Requirements: 3, 5_
- [ ] 3. Implement per-step navigation + element highlighting (add/remove `.tour-highlight` on the target id; skip gracefully if the target is missing)
  - _Requirements: 4_
- [ ] 4. Implement the three one-click step actions (forge Bolt, assign the demo task, speed up to 4x) via `onDemoAction`; mark each as done after it runs
  - _Requirements: 6, 7, 8, 9_
- [ ] 5. Verify Export downloads `crewforge-crew.json` and Import restores it exactly; invalid files are refused with a message
  - _Requirements: 10, 11_
- [ ] 6. Verify Reset (with confirm) restores the seed crew
  - _Requirements: 2_
- [ ] 7. Implement the empty state ("Load the demo crew") in the views when no agents and no tasks exist
  - _Requirements: 13_
- [ ] 8. Run the full demo end-to-end as a first-time visitor (Play demo → six steps → task completes at 4x), then run `npm run build`
  - _Requirements: Acceptance criteria_
