/**
 * AgentCard — one crew member in the Office dashboard.
 * Shows avatar, name, role, division badge, status badge, current task
 * with a progress bar while working, and a blocked note + Resolve button
 * while blocked.
 */
import type { CSSProperties } from 'react';
import type { Agent, Task } from '../lib/types';
import { divisionById } from '../lib/types';

export interface AgentCardProps {
  agent: Agent;
  /** The task the agent is currently working on, or null */
  task: Task | null;
  onUnblock: (agentId: string) => void;
}

const STATUS_LABEL: Record<Agent['status'], string> = {
  idle: 'Idle',
  working: 'Working',
  blocked: 'Blocked',
};

export default function AgentCard({ agent, task, onUnblock }: AgentCardProps) {
  const division = divisionById(agent.division);
  const style = { '--div-color': agent.color || division.color } as CSSProperties;

  return (
    <article
      className={agent.status === 'blocked' ? 'agent-card blocked' : 'agent-card'}
      style={style}
    >
      <div className="agent-head">
        <span className="agent-avatar" aria-hidden="true">
          {agent.emoji}
        </span>
        <div>
          <div className="agent-name">{agent.name}</div>
          <div className="agent-role">{agent.role}</div>
        </div>
      </div>
      <div className="task-meta">
        <span className="badge">{division.name}</span>
        <span className={agent.status === 'working' ? 'badge working' : agent.status === 'blocked' ? 'badge blocked' : 'badge'}>
          {STATUS_LABEL[agent.status]}
        </span>
      </div>
      <div className="agent-task">
        {agent.status === 'working' && task ? (
          <>Working on “{task.title}”</>
        ) : agent.status === 'blocked' && task ? (
          <>Blocked on “{task.title}”</>
        ) : (
          <span className="idle">Idle — waiting for work</span>
        )}
      </div>
      {agent.status === 'working' && task && (
        <div
          className="progress"
          role="progressbar"
          aria-valuenow={Math.round(task.progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progress on ${task.title}`}
        >
          <div style={{ width: `${Math.round(task.progress)}%` }} />
        </div>
      )}
      {agent.status === 'blocked' && (
        <>
          {agent.blockedNote && <p className="panel-sub">{agent.blockedNote}</p>}
          <div className="task-actions">
            <button className="btn btn-sm btn-primary" onClick={() => onUnblock(agent.id)}>
              Resolve
            </button>
          </div>
        </>
      )}
    </article>
  );
}
