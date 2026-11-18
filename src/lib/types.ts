/**
 * CrewForge — core data model.
 * Single source of truth for every builder. Do not change these types
 * without updating .kiro/specs and all components that use them.
 */

export type DivisionId =
  | 'research'
  | 'content'
  | 'freelance'
  | 'admin'
  | 'learning'
  | 'product';

export interface Division {
  id: DivisionId;
  /** English display name */
  name: string;
  /** Short label for the office map room */
  room: string;
  /** Hex color used for the division across the app */
  color: string;
  blurb: string;
}

export const DIVISIONS: Division[] = [
  { id: 'research', name: 'Research & Security', room: 'Room 01', color: '#38bdf8', blurb: 'Hunt bounties, watch whales, scan the meme radar.' },
  { id: 'content', name: 'Content & Video', room: 'Room 02', color: '#f472b6', blurb: 'Clips, posts, and the MINA channel.' },
  { id: 'freelance', name: 'Freelance & Bounty', room: 'Room 03', color: '#fbbf24', blurb: 'Gigs, bounties, and deadlines.' },
  { id: 'admin', name: 'Admin & Money', room: 'Room 04', color: '#34d399', blurb: 'Ledger, savings, and keeping the office honest.' },
  { id: 'learning', name: 'Learning & Presentation', room: 'Room 05', color: '#a78bfa', blurb: 'Study material, quizzes, and the big presentation.' },
  { id: 'product', name: 'Product Development', room: 'Room 06', color: '#fb7185', blurb: 'The things we build and ship.' },
];

export function divisionById(id: DivisionId): Division {
  return DIVISIONS.find((d) => d.id === id) ?? DIVISIONS[0];
}

export type AgentStatus = 'idle' | 'working' | 'blocked';

export interface Agent {
  id: string;
  name: string;
  role: string;
  division: DivisionId;
  /** Hex color for the avatar ring; defaults to the division color */
  color: string;
  /** Single emoji shown in the avatar */
  emoji: string;
  skills: string[];
  status: AgentStatus;
  /** Id of the task the agent is currently working on, or null */
  currentTaskId: string | null;
  /** Human-readable note shown when blocked (e.g. "Waiting for X login") */
  blockedNote: string | null;
}

export type TaskStatus = 'todo' | 'doing' | 'done';
export type Priority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  description: string;
  division: DivisionId;
  /** 1–5 work units. One unit = 20 simulation ticks at 1x speed. */
  effort: number;
  priority: Priority;
  /** Agent id, or null when the task sits in the unassigned queue */
  assigneeId: string | null;
  status: TaskStatus;
  /** 0–100, meaningful while status is 'doing' */
  progress: number;
  createdAt: number;
  completedAt: number | null;
}

export type FeedKind = 'start' | 'done' | 'blocked' | 'unblocked' | 'assign' | 'system';

export interface FeedEvent {
  id: string;
  /** Simulation tick number when the event happened */
  tick: number;
  /** Wall-clock timestamp (ms) for display */
  at: number;
  kind: FeedKind;
  text: string;
  agentId: string | null;
}

export interface SimState {
  running: boolean;
  speed: 1 | 2 | 4;
  /** Total ticks elapsed since the crew was seeded */
  tick: number;
  /** Seed for the deterministic PRNG, so the demo run is repeatable */
  seed: number;
}

export interface Stats {
  tasksDone: number;
  tasksStarted: number;
  blockedCount: number;
}

export interface AppState {
  agents: Agent[];
  tasks: Task[];
  feed: FeedEvent[];
  sim: SimState;
  stats: Stats;
}

export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e9).toString(36)}`;
}
