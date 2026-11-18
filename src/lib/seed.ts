/**
 * CrewForge — demo seed data.
 *
 * The seed crew is the founder's REAL office: Riza (Founder & CEO) runs a
 * 15-person AI office every day, six divisions, agents with names and real
 * jobs. The seed below is the crew minus Riza himself (the founder is the
 * user of the app, shown in the header — not an assignable agent).
 *
 * Keep every name, role, and task truthful to the real office. Do not invent
 * people. If the real office changes, update this file and the spec.
 */
import type { Agent, AppState, FeedEvent, Task } from './types';
import { newId } from './types';

export const FOUNDER = {
  name: 'Riza',
  title: 'Founder & CEO',
  company: 'AI Office',
};

function agent(
  name: string,
  role: string,
  division: Agent['division'],
  color: string,
  emoji: string,
  skills: string[],
): Agent {
  return {
    id: newId(),
    name,
    role,
    division,
    color,
    emoji,
    skills,
    status: 'idle',
    currentTaskId: null,
    blockedNote: null,
  };
}

function task(
  title: string,
  description: string,
  division: Task['division'],
  effort: number,
  priority: Task['priority'],
  assigneeName: string | null,
  status: Task['status'],
  progress: number,
  agents: Agent[],
): Task {
  const assignee = assigneeName
    ? agents.find((a) => a.name === assigneeName) ?? null
    : null;
  return {
    id: newId(),
    title,
    description,
    division,
    effort,
    priority,
    assigneeId: assignee ? assignee.id : null,
    status,
    progress,
    createdAt: Date.now() - 1000 * 60 * 60 * 3,
    completedAt: status === 'done' ? Date.now() - 1000 * 60 * 60 : null,
  };
}

export function buildSeedState(): AppState {
  const agents: Agent[] = [
    // Research & Security
    agent('Kira', 'Project Hunter', 'research', '#38bdf8', '🔍', ['bounty-hunting', 'hackathons', 'airdrops']),
    agent('Yuki', 'Bug Hunter', 'research', '#38bdf8', '🐛', ['security-audit', 'xe-network', 'triage']),
    agent('Sora', 'Whale Watcher', 'research', '#38bdf8', '🐋', ['on-chain', 'wallets', 'memecoins']),
    agent('Yui', 'Meme Radar', 'research', '#38bdf8', '📡', ['rugcheck', 'solana', 'trend-scan']),
    // Content & Video
    agent('Mizuki', 'Clip Cutter', 'content', '#f472b6', '✂️', ['video-edit', 'shorts', 'captions']),
    agent('Gita', 'Social Poster', 'content', '#f472b6', '📣', ['x-posts', 'scheduling', 'threads']),
    agent('Momo', 'Feed Monitor', 'content', '#f472b6', '👀', ['monitoring', 'social-listening']),
    // Freelance & Bounty
    agent('Rio', 'Gig Coordinator', 'freelance', '#fbbf24', '⏰', ['deadlines', 'fiverr', 'superteam']),
    // Admin & Money
    agent('Nadia', 'Savings Treasurer', 'admin', '#34d399', '💰', ['ledger', 'savings-2030', 'reports']),
    agent('Misaki', 'Co-founder & Overseer', 'admin', '#34d399', '🌸', ['oversight', 'reports', 'coordination']),
    // Learning & Presentation
    agent('Jurina', 'Summarizer', 'learning', '#a78bfa', '📝', ['summaries', 'research-notes']),
    agent('Eli', 'Quiz Maker', 'learning', '#a78bfa', '❓', ['questions', 'answer-keys']),
    agent('Hyde', 'Schedule Maker', 'learning', '#a78bfa', '🗓️', ['planning', 'timetables']),
    // Product Development
    agent('Nana', 'Game Builder', 'product', '#fb7185', '🎮', ['game-dev', 'threejs', 'playtesting']),
  ];

  const byName = (name: string): Agent => agents.find((a) => a.name === name)!;

  const tasks: Task[] = [
    task('Hunt Superteam bounties', 'Scan new bounties, check payout and requirements, shortlist the free ones.', 'research', 3, 'high', 'Kira', 'doing', 45, agents),
    task('Triage XE-17632 follow-up', 'Watch the desk for triage verdicts on the /frontiers re-report.', 'research', 2, 'medium', 'Yuki', 'doing', 60, agents),
    task('Track whale wallets', 'Update the top-100 wallet watchlist and flag unusual moves.', 'research', 2, 'low', 'Sora', 'todo', 0, agents),
    task('Scan new meme coins', 'Run the radar, verify with RugCheck, report only the clean ones.', 'research', 2, 'medium', 'Yui', 'todo', 0, agents),
    task('Cut MINA klip 06', 'Edit the next funny cat clip, 9:16, no text on video.', 'content', 4, 'high', 'Mizuki', 'doing', 30, agents),
    task('Post Asentum X thread', 'One thread about the daily grind, spaced out, no burst posting.', 'content', 1, 'medium', 'Gita', 'todo', 0, agents),
    task('Monitor GuarEmperor feed', 'Watch for new calls and log them with links, no buy advice.', 'content', 2, 'low', 'Momo', 'doing', 20, agents),
    task('Chase the Raenest credit', 'Track the Superteam referral; Raenest is the target when a credit lands.', 'freelance', 2, 'high', 'Rio', 'todo', 0, agents),
    task('Reconcile savings ledger', 'Update the 2030 savings sheet with this week’s small wins.', 'admin', 2, 'medium', 'Nadia', 'todo', 0, agents),
    task('Review ARCHIEL audit fixes', 'Re-check the fixed contracts against the audit findings.', 'admin', 3, 'high', 'Misaki', 'doing', 55, agents),
    task('Summarize Flow tutorial', 'One-page summary of the new Flow tricks for the Dongeng team.', 'learning', 1, 'low', 'Jurina', 'todo', 0, agents),
    task('Draft 10 quiz questions', 'Questions + answer key for next week’s study material.', 'learning', 2, 'medium', 'Eli', 'doing', 40, agents),
    task('Plan next week study schedule', 'Daily schedule, Friday 19:00 review, keep it realistic.', 'learning', 1, 'low', 'Hyde', 'todo', 0, agents),
    task('Build VICE BAY v2 polish', 'Polish missions 2–6 and re-submit the GTA 6 entry.', 'product', 5, 'high', 'Nana', 'doing', 70, agents),
    task('Write the morning report', 'Compile every project into one PDF and email it by 08:00.', 'admin', 2, 'high', null, 'done', 100, agents),
    task('Publish MINA klip 05', 'Shorts + TikTok + Reels, all three, with the caption.', 'content', 1, 'high', null, 'done', 100, agents),
  ];

  // Wire agent status to their doing tasks.
  for (const t of tasks) {
    if (t.status === 'doing' && t.assigneeId) {
      const a = agents.find((x) => x.id === t.assigneeId);
      if (a) {
        a.status = 'working';
        a.currentTaskId = t.id;
      }
    }
  }

  const feed: FeedEvent[] = [
    { id: newId(), tick: 0, at: Date.now() - 1000 * 60 * 42, kind: 'done', text: 'Misaki finished "Write the morning report" — emailed at 08:02.', agentId: byName('Misaki').id },
    { id: newId(), tick: 0, at: Date.now() - 1000 * 60 * 31, kind: 'done', text: 'Mizuki finished "Publish MINA klip 05" — live on all three platforms.', agentId: byName('Mizuki').id },
    { id: newId(), tick: 0, at: Date.now() - 1000 * 60 * 12, kind: 'start', text: 'Nana started "Build VICE BAY v2 polish" — missions 2–6.', agentId: byName('Nana').id },
    { id: newId(), tick: 0, at: Date.now() - 1000 * 60 * 5, kind: 'start', text: 'Kira started "Hunt Superteam bounties" — scanning the board.', agentId: byName('Kira').id },
    { id: newId(), tick: 0, at: Date.now() - 1000 * 60 * 2, kind: 'system', text: 'CrewForge seeded the office — 14 agents, 6 divisions.', agentId: null },
  ];

  return {
    agents,
    tasks,
    feed,
    sim: { running: true, speed: 1, tick: 0, seed: 20261118 },
    stats: { tasksDone: 2, tasksStarted: 8, blockedCount: 0 },
  };
}
