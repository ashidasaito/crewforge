/**
 * CrewForge — the simulation engine.
 *
 * A transparent, rule-based engine: NO AI API calls, NO network, NO magic.
 * Agents accrue progress on their task every tick; when a task completes the
 * agent picks up the next To Do task in their division. Occasionally an agent
 * gets blocked (seeded randomness, so the demo run is repeatable).
 *
 * Pure functions only — `tick` takes a state and returns a new state plus the
 * feed events that happened. This makes the engine trivially testable and
 * honest about what it is: a simulation of a crew, not real agents.
 */
import type { Agent, AppState, FeedEvent, Task } from './types';
import { newId } from './types';

/** Ticks needed per unit of effort at 1x speed. Effort 1 = 20s, effort 5 = 100s. */
export const TICKS_PER_UNIT = 20;
/** Per-tick probability that a working agent gets blocked. */
const BLOCK_CHANCE_PER_TICK = 0.004;

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface TickResult {
  state: AppState;
  events: FeedEvent[];
}

function agentName(state: AppState, id: string | null): string {
  if (!id) return 'Unassigned';
  return state.agents.find((a) => a.id === id)?.name ?? 'Unknown';
}

/**
 * Advance the simulation by one tick. The caller is responsible for calling
 * this on an interval (1000ms / speed) while sim.running is true.
 */
export function tick(prev: AppState): TickResult {
  const events: FeedEvent[] = [];
  const tickNo = prev.sim.tick + 1;
  const rng = mulberry32(prev.sim.seed + tickNo);

  // Deep-ish copy: new arrays, new objects for anything we mutate.
  const agents: Agent[] = prev.agents.map((a) => ({ ...a, skills: [...a.skills] }));
  const tasks: Task[] = prev.tasks.map((t) => ({ ...t }));
  const feed: FeedEvent[] = [...prev.feed];
  const stats = { ...prev.stats };

  const pushEvent = (kind: FeedEvent['kind'], text: string, agentId: string | null) => {
    const ev: FeedEvent = { id: newId(), tick: tickNo, at: Date.now(), kind, text, agentId };
    events.push(ev);
    feed.unshift(ev);
  };

  for (const agent of agents) {
    if (agent.status === 'blocked' || !agent.currentTaskId) continue;
    const task = tasks.find((t) => t.id === agent.currentTaskId);
    if (!task || task.status !== 'doing') continue;

    // Occasionally the agent gets blocked (waiting on the founder).
    if (rng() < BLOCK_CHANCE_PER_TICK) {
      agent.status = 'blocked';
      agent.blockedNote = 'Waiting for founder input';
      stats.blockedCount += 1;
      pushEvent('blocked', `${agent.name} is blocked on "${task.title}" — waiting for founder input.`, agent.id);
      continue;
    }

    task.progress = Math.min(100, task.progress + 100 / (task.effort * TICKS_PER_UNIT));

    if (task.progress >= 100) {
      task.status = 'done';
      task.progress = 100;
      task.completedAt = Date.now();
      agent.status = 'idle';
      agent.currentTaskId = null;
      stats.tasksDone += 1;
      pushEvent('done', `${agent.name} finished "${task.title}".`, agent.id);

      // Auto-pick the next To Do task in the agent's division (oldest first).
      const next = tasks
        .filter((t) => t.status === 'todo' && t.division === agent.division)
        .sort((a, b) => a.createdAt - b.createdAt)[0];
      if (next) {
        next.status = 'doing';
        next.progress = 0;
        next.assigneeId = agent.id;
        agent.status = 'working';
        agent.currentTaskId = next.id;
        stats.tasksStarted += 1;
        pushEvent('start', `${agent.name} started "${next.title}".`, agent.id);
      }
    }
  }

  return {
    state: {
      agents,
      tasks,
      feed: feed.slice(0, 200),
      sim: { ...prev.sim, tick: tickNo },
      stats,
    },
    events,
  };
}

/** Assign a task to an agent (or unassign with null). Enforces division match. */
export function assignTask(
  state: AppState,
  taskId: string,
  agentId: string | null,
): { state: AppState; error: string | null } {
  const task = state.tasks.find((t) => t.id === taskId);
  if (!task) return { state, error: 'Task not found.' };
  if (task.status === 'done') return { state, error: 'That task is already done.' };

  if (agentId) {
    const agent = state.agents.find((a) => a.id === agentId);
    if (!agent) return { state, error: 'Agent not found.' };
    if (agent.division !== task.division) {
      return { state, error: `${agent.name} works in ${agent.division} — this task belongs to ${task.division}.` };
    }
    if (agent.status === 'blocked') {
      return { state, error: `${agent.name} is blocked. Resolve the blocker first.` };
    }
    if (agent.currentTaskId && agent.currentTaskId !== taskId) {
      return { state, error: `${agent.name} is already working on another task.` };
    }
  }

  const tasks = state.tasks.map((t) => {
    if (t.id !== taskId) return t;
    if (agentId) return { ...t, assigneeId: agentId, status: 'doing' as const, progress: t.status === 'doing' ? t.progress : 0 };
    return { ...t, assigneeId: null, status: 'todo' as const, progress: 0 };
  });
  const agents = state.agents.map((a) => {
    if (agentId && a.id === agentId) {
      return { ...a, status: 'working' as const, currentTaskId: taskId };
    }
    if (a.currentTaskId === taskId && a.id !== agentId) {
      return { ...a, status: 'idle' as const, currentTaskId: null };
    }
    return a;
  });
  const feed: FeedEvent[] = [
    {
      id: newId(),
      tick: state.sim.tick,
      at: Date.now(),
      kind: 'assign' as const,
      text: agentId
        ? `"${task.title}" assigned to ${agentName(state, agentId)}.`
        : `"${task.title}" moved back to the unassigned queue.`,
      agentId,
    },
    ...state.feed,
  ].slice(0, 200);
  return { state: { ...state, tasks, agents, feed }, error: null };
}

/** Move a task between board columns (To Do / Doing / Done) by button or drag. */
export function moveTask(
  state: AppState,
  taskId: string,
  to: Task['status'],
): { state: AppState; error: string | null } {
  const task = state.tasks.find((t) => t.id === taskId);
  if (!task) return { state, error: 'Task not found.' };
  if (to === 'doing' && !task.assigneeId) {
    return { state, error: 'Assign the task to an agent before starting it.' };
  }
  if (to === 'done' && task.status !== 'doing') {
    return { state, error: 'Only a task in progress can be marked done.' };
  }
  const tasks = state.tasks.map((t) => {
    if (t.id !== taskId) return t;
    if (to === 'done') return { ...t, status: 'done' as const, progress: 100, completedAt: Date.now() };
    if (to === 'todo') return { ...t, status: 'todo' as const, progress: 0 };
    return { ...t, status: 'doing' as const };
  });
  // Free the agent if their task was moved out of 'doing'.
  const agents = state.agents.map((a) => {
    if (a.currentTaskId !== taskId) return a;
    if (to === 'doing') return a;
    return { ...a, status: 'idle' as const, currentTaskId: null };
  });
  const stats =
    to === 'done' && task.status !== 'done'
      ? { ...state.stats, tasksDone: state.stats.tasksDone + 1 }
      : state.stats;
  return { state: { ...state, tasks, agents, stats }, error: null };
}

/** Unblock an agent; their current task resumes. */
export function unblockAgent(state: AppState, agentId: string): AppState {
  const agents = state.agents.map((a) =>
    a.id === agentId
      ? { ...a, status: (a.currentTaskId ? 'working' : 'idle') as Agent['status'], blockedNote: null }
      : a,
  );
  const agent = state.agents.find((a) => a.id === agentId);
  const feed: FeedEvent[] = agent
    ? [{ id: newId(), tick: state.sim.tick, at: Date.now(), kind: 'unblocked' as const, text: `${agent.name} is unblocked and back to work.`, agentId }, ...state.feed].slice(0, 200)
    : state.feed;
  return { ...state, agents, feed };
}
