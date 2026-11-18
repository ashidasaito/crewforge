/**
 * OfficeView — the live dashboard: stats strip, simulation controls,
 * office map, agent cards, task board, and activity feed.
 *
 * Owns only local UI state (the selected division filter). All crew/task
 * data and mutations live in App.tsx; the simulation clock lives there too.
 */
import { useState } from 'react';
import type { AppState, DivisionId, TaskStatus } from '../lib/types';
import { divisionById } from '../lib/types';
import AgentCard from './AgentCard';
import TaskBoard from './TaskBoard';
import ActivityFeed from './ActivityFeed';
import OfficeMap from './OfficeMap';

export interface OfficeViewProps {
  state: AppState;
  onAssign: (taskId: string, agentId: string | null) => void;
  onMove: (taskId: string, to: TaskStatus) => void;
  onUnblock: (agentId: string) => void;
  onSetRunning: (running: boolean) => void;
  onSetSpeed: (speed: 1 | 2 | 4) => void;
  onSelectDivision: () => void;
  doingCount: number;
  doneCount: number;
}

const SPEEDS: (1 | 2 | 4)[] = [1, 2, 4];

export default function OfficeView({
  state,
  onAssign,
  onMove,
  onUnblock,
  onSetRunning,
  onSetSpeed,
  onSelectDivision,
  doingCount,
  doneCount,
}: OfficeViewProps) {
  // Local UI state only: the division filter for the board + agent cards.
  const [filterDivision, setFilterDivision] = useState<DivisionId | null>(null);

  const visibleAgents = filterDivision
    ? state.agents.filter((a) => a.division === filterDivision)
    : state.agents;

  return (
    <div id="office-view" className="stack">
      {/* Stats strip */}
      <div className="stats-strip" id="stats-strip">
        <div className="stat">
          <div className="stat-num">{state.agents.length}</div>
          <div className="stat-label">Agents</div>
        </div>
        <div className="stat">
          <div className="stat-num">{doingCount}</div>
          <div className="stat-label">In flight</div>
        </div>
        <div className="stat">
          <div className="stat-num">{doneCount}</div>
          <div className="stat-label">Done</div>
        </div>
        <div className="stat">
          <div className="stat-num">{state.stats.tasksDone}</div>
          <div className="stat-label">Finished by crew</div>
        </div>
      </div>

      {/* Simulation controls */}
      <div className="panel">
        <div className="sim-controls" id="sim-controls">
          <button
            className="btn btn-primary"
            onClick={() => onSetRunning(!state.sim.running)}
          >
            {state.sim.running ? '⏸ Pause' : '▶ Play'}
          </button>
          {SPEEDS.map((speed) => (
            <button
              key={speed}
              className={state.sim.speed === speed ? 'btn speed-btn active' : 'btn speed-btn'}
              aria-pressed={state.sim.speed === speed}
              onClick={() => onSetSpeed(speed)}
            >
              {speed}x
            </button>
          ))}
          <span className="clock">
            Tick {state.sim.tick} · {state.sim.running ? `running at ${state.sim.speed}x` : 'paused'}
          </span>
        </div>
      </div>

      {/* Office map */}
      <section className="panel" aria-label="Office map">
        <h2 className="section-title">Office map</h2>
        <p className="panel-sub">
          Six rooms, one per division. Click a room to filter the board and the agent cards.
        </p>
        <OfficeMap
          agents={state.agents}
          tasks={state.tasks}
          selectedDivision={filterDivision}
          onSelectDivision={setFilterDivision}
        />
        <div className="task-actions" style={{ marginTop: 12 }}>
          <button className="btn btn-sm btn-ghost" onClick={onSelectDivision}>
            🔨 Forge a new agent
          </button>
        </div>
      </section>

      {/* Agent cards */}
      <section aria-label="Agent cards">
        <h2 className="section-title">
          Crew
          {filterDivision && (
            <>
              {' '}
              · {divisionById(filterDivision).name}{' '}
              <button className="btn btn-sm btn-ghost" onClick={() => setFilterDivision(null)}>
                Clear filter ✕
              </button>
            </>
          )}
        </h2>
        <p className="panel-sub">
          {visibleAgents.length} of {state.agents.length} agents
          {filterDivision ? ' in this division' : ' on the crew'}.
        </p>
        <div className="agent-grid" id="agent-cards">
          {visibleAgents.length === 0 ? (
            <div className="empty-state">No agents in this division yet.</div>
          ) : (
            visibleAgents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                task={state.tasks.find((t) => t.id === agent.currentTaskId) ?? null}
                onUnblock={onUnblock}
              />
            ))
          )}
        </div>
      </section>

      {/* Board + feed, side by side on desktop */}
      <div className="grid-2">
        <section className="panel" aria-label="Task board">
          <h2 className="section-title">Task board</h2>
          <p className="panel-sub">
            Move cards with the buttons or drag them between columns.
            {filterDivision ? ` Showing ${divisionById(filterDivision).name} only.` : ''}
          </p>
          <TaskBoard
            tasks={state.tasks}
            agents={state.agents}
            filterDivision={filterDivision}
            onMove={onMove}
            onAssign={onAssign}
          />
        </section>
        <section className="panel" aria-label="Activity feed">
          <h2 className="section-title">Activity</h2>
          <p className="panel-sub">Newest first — the crew narrates its own work.</p>
          <ActivityFeed feed={state.feed} />
        </section>
      </div>
    </div>
  );
}
