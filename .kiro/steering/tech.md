---
inclusion: always
---

# CrewForge — Tech

## Stack
- **Vite 8 + React 19 + TypeScript** (strict). Single-page app, no router library (two views switched by state in `App.tsx`).
- **Plain CSS** in `src/index.css`. No CSS framework, no component library. Reuse the classes defined there; do not invent a second design system.
- **No runtime dependencies beyond React.** No network calls at runtime — the app works fully offline after load.

## Commands
- `npm install` — install dependencies.
- `npm run dev` — dev server (default http://localhost:5173).
- `npm run build` — `tsc -b && vite build`; produces static `dist/`.
- `npm run preview` — serve the production build locally.

## Agent hooks (`.kiro/hooks/`)
- **Build on source edit** (`.kiro/hooks/build-on-source-edit.json`, schema v1 per the official Kiro Hooks docs, https://kiro.dev/docs/hooks/): on the `PostFileSave` trigger, when the saved file matches `^src/.*\.(ts|tsx|css)$`, Kiro runs `npm run build` in the project root (timeout 120s). Type errors are caught immediately after an agent edit instead of at demo time. The hook is a plain JSON file following the documented v1 schema (`version`, `hooks[]` with `name`, `trigger`, `matcher`, `action: { type: "command", command }`, `timeout`); it activates automatically when a Kiro session starts — no registration needed. It runs inside Kiro IDE/CLI on the founder's laptop, where Kiro is installed; it cannot run on the build VM, which has no Kiro install.
- **Do not invent hook schemas.** Any future hook must match the documented schema at https://kiro.dev/docs/hooks/ (PascalCase trigger names, `command` or `agent` actions) and its command must pass in this repo before it is committed.

## Constraints
- **TypeScript strict is on** (`tsc -b` must pass with zero errors). No unused locals/parameters. No `any` without a comment explaining why.
- **State ownership:** `App.tsx` owns the single `AppState`. Views receive state + callbacks as props and never keep their own copy of crew/task data. Local UI state (form inputs, filters, selected tab) lives in the component that uses it.
- **Simulation is pure:** `src/lib/sim.ts` exports pure functions (`tick`, `assignTask`, `moveTask`, `unblockAgent`). The engine never touches the DOM, timers, or storage. `App.tsx` owns the interval.
- **Persistence:** `src/lib/store.ts` only. Key `crewforge-state-v1`. Never write to localStorage from a component.
- **Data model:** `src/lib/types.ts` is the contract. Do not change a type without updating the specs, the seed data, and every component that uses it.
- **English everywhere:** all UI copy, code comments that users might read, docs, and commit messages in English.
- **Accessibility:** buttons have discernible text; form fields have labels; status is conveyed by text, not color alone.
