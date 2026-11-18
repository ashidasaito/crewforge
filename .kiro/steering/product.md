---
inclusion: always
---

# CrewForge — Product

## What it is
CrewForge is a local-first web app that lets a solo founder **forge a crew of AI agents**, assign them tasks, and watch the crew work in a live office dashboard. One app stitches four tools that do not normally belong together: a Kanban task board, an office floor-plan map, a rule-based multi-agent simulation engine, and a guided demo tour.

## Who it is for
- **Solo founders / indie hackers** who coordinate several AI agents or AI tools and want one place to define roles, hand out work, and see progress.
- **Hackathon judges and first-time visitors**, who must understand the product in under 2 minutes with zero setup (demo mode).

## The true story (the pitch)
Riza runs a real 15-person AI office, every day — six divisions (Research & Security, Content & Video, Freelance & Bounty, Admin & Money, Learning & Presentation, Product Development) with named agents doing real jobs (Kira hunts bounties, Nana builds games, Mizuki cuts clips, Gita posts, Momo monitors, Nadia keeps the ledger). CrewForge is the tool he wished he had on day one. The demo ships with the real office crew as seed data.

## Core loop
1. Forge agents (name, role, division, skills) and tasks (title, division, effort, priority).
2. Assign tasks to agents in the same division.
3. Watch the simulation: agents work, tasks move To Do → Doing → Done, the feed narrates.
4. Unblock agents when they get stuck; reassign as needed.

## Goals for this build
- A working app that runs with `npm install && npm run dev` and builds to static `dist/`.
- A demo a stranger can follow in under 2 minutes with no account and no setup.
- Honest scope: the crew is **simulated locally** by a transparent rule engine. The app says so in the UI, the README, and the video. Never claim real AI agents.

## Non-goals
- No backend, database, accounts, or login. No real AI API calls. No payments or real money. No chat interface. No multi-user sync. No Kiro Crew app (stretch goal only).
