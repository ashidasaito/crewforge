/**
 * TaskBoard — the three-column board (To Do / Doing / Done).
 * Cards can be moved with the ← / → buttons or by HTML5 drag-and-drop;
 * both paths call onMove with the same rules. Moving a task to Doing
 * without an assignee is refused by the engine (surfaced as a toast).
 * Unassigned To Do cards offer an agent picker so the founder can
 * assign before starting the task.
 */
import { useState } from 'react';
import type { CSSProperties } from 'react';
import type { Agent, DivisionId, Task, TaskStatus } from '../lib/types';
import { divisionById } from '../lib/types';

export interface TaskBoardProps {
  tasks: Task[];
  agents: Agent[];
  /** Only show tasks from this division when set; null shows all. */
  filterDivision: DivisionId | null;
  onMove: (taskId: string, to: TaskStatus) => void;
  onAssign: (taskId: string, agentId: string | null) => void;
}

const COLUMNS: { status: TaskStatus; title: string }[] = [
  { status: 'todo', title: 'To Do' },
  { status: 'doing', title: 'Doing' },
  { status: 'done', title: 'Done' },
];

const PREV: Partial<Record<TaskStatus, TaskStatus>> = { doing: 'todo', done: 'todo' };
const NEXT: Partial<Record<TaskStatus, TaskStatus>> = { todo: 'doing', doing: 'done' };

function TaskCardView({
  task,
  agents,
  onMove,
  onAssign,
}: {
  task: Task;
  agents: Agent[];
  onMove: (taskId: string, to: TaskStatus) => void;
  onAssign: (taskId: string, agentId: string | null) => void;
}) {
  const division = divisionById(task.division);
  const style = { '--div-color': division.color } as CSSProperties;
  const assignee = task.assigneeId ? agents.find((a) => a.id === task.assigneeId) : null;
  // Idle agents in the same division are eligible to take this task.
  const candidates = agents.filter(
    (a) => a.division === task.division && a.status === 'idle',
  );
  const prev = PREV[task.status];
  const next = NEXT[task.status];

  return (
    <article
      className={task.status === 'done' ? 'task-card done' : 'task-card'}
      style={style}
      data-task-title={task.title}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', task.id);
        e.dataTransfer.effectAllowed = 'move';
      }}
    >
      <div className="task-title">{task.title}</div>
      {task.description && (
        <div className="task-desc" title={task.description}>
          {task.description}
        </div>
      )}
      <div className="task-meta">
        <span className="badge">{division.name}</span>
        <span>Effort {task.effort}</span>
        <span className={`priority-${task.priority}`}>{task.priority}</span>
        <span>{assignee ? assignee.name : 'Unassigned'}</span>
      </div>
      {task.status === 'todo' && !task.assigneeId && candidates.length > 0 && (
        <select
          aria-label={`Assign ${task.title}`}
          defaultValue=""
          onChange={(e) => {
            if (e.target.value) onAssign(task.id, e.target.value);
          }}
        >
          <option value="" disabled>
            Assign to…
          </option>
          {candidates.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} — {a.role}
            </option>
          ))}
        </select>
      )}
      <div className="task-actions">
        {prev && (
          <button
            className="btn btn-sm"
            onClick={() => onMove(task.id, prev)}
            aria-label={`Move ${task.title} back to ${prev === 'todo' ? 'To Do' : 'Doing'}`}
          >
            ← {prev === 'todo' ? 'To Do' : 'Doing'}
          </button>
        )}
        {next && (
          <button
            className="btn btn-sm btn-primary"
            onClick={() => onMove(task.id, next)}
            aria-label={`Move ${task.title} to ${next === 'doing' ? 'Doing' : 'Done'}`}
          >
            {next === 'doing' ? 'Start' : 'Done'} →
          </button>
        )}
      </div>
    </article>
  );
}

export default function TaskBoard({ tasks, agents, filterDivision, onMove, onAssign }: TaskBoardProps) {
  const [dragOver, setDragOver] = useState<TaskStatus | null>(null);

  const visible = filterDivision
    ? tasks.filter((t) => t.division === filterDivision)
    : tasks;

  return (
    <div className="board" id="task-board">
      {COLUMNS.map((col) => {
        const colTasks = visible.filter((t) => t.status === col.status);
        return (
          <section
            key={col.status}
            className="board-col"
            aria-label={`${col.title} column`}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
              setDragOver(col.status);
            }}
            onDragLeave={() => setDragOver((cur) => (cur === col.status ? null : cur))}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(null);
              const taskId = e.dataTransfer.getData('text/plain');
              if (taskId) onMove(taskId, col.status);
            }}
            style={
              dragOver === col.status
                ? { outline: '2px dashed var(--accent-strong)', outlineOffset: '-2px' }
                : undefined
            }
          >
            <h3>
              {col.title}
              <span className="count">{colTasks.length}</span>
            </h3>
            {colTasks.length === 0 ? (
              <p className="panel-sub">No tasks here.</p>
            ) : (
              colTasks.map((task) => (
                <TaskCardView
                  key={task.id}
                  task={task}
                  agents={agents}
                  onMove={onMove}
                  onAssign={onAssign}
                />
              ))
            )}
          </section>
        );
      })}
    </div>
  );
}
