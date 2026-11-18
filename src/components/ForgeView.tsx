/**
 * ForgeView — the Forge: where the founder defines the crew and the work.
 * Two columns (agents left, tasks right; stacked under 900px). All mutations
 * go through the callbacks App.tsx provides; cross-entity rules (division
 * match, busy/blocked agent) live in sim.ts assignTask and its error string
 * surfaces via the App toast through onAssign.
 *
 * Division change on an agent edit: if the agent has a current task in the
 * old division, the task is unassigned first (back to To Do) and the view
 * explains why — App.updateAgent itself does not do this cleanup.
 */
import { useState, type CSSProperties } from 'react';
import type { Agent, AppState, Division, Priority, Task } from '../lib/types';
import { divisionById } from '../lib/types';
import AgentForm, { type AgentInput } from './AgentForm';
import TaskForm, { type TaskInput } from './TaskForm';

export interface ForgeViewProps {
  state: AppState;
  divisions: Division[];
  onAddAgent: (input: Omit<Agent, 'id' | 'status' | 'currentTaskId' | 'blockedNote'>) => Agent;
  onUpdateAgent: (id: string, patch: Partial<Agent>) => void;
  onDeleteAgent: (id: string) => void;
  onAddTask: (input: {
    title: string;
    description: string;
    division: Task['division'];
    effort: number;
    priority: Priority;
    assigneeId: string | null;
  }) => Task;
  onUpdateTask: (id: string, patch: Partial<Task>) => void;
  onDeleteTask: (id: string) => void;
  onAssign: (taskId: string, agentId: string | null) => void;
  onGoToOffice: () => void;
}

function agentStatusLabel(status: Agent['status']): string {
  if (status === 'working') return 'Working';
  if (status === 'blocked') return 'Blocked';
  return 'Idle';
}

function taskStatusLabel(status: Task['status']): string {
  if (status === 'doing') return 'Doing';
  if (status === 'done') return 'Done';
  return 'To Do';
}

export default function ForgeView({
  state,
  divisions,
  onAddAgent,
  onUpdateAgent,
  onDeleteAgent,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onAssign,
  onGoToOffice,
}: ForgeViewProps) {
  const [search, setSearch] = useState('');
  const [divisionFilter, setDivisionFilter] = useState<string>('all');
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [agentFormNonce, setAgentFormNonce] = useState(0);
  const [taskFormNonce, setTaskFormNonce] = useState(0);
  const [agentNote, setAgentNote] = useState<string | null>(null);

  const taskById = (id: string | null): Task | undefined =>
    state.tasks.find((t) => t.id === id);
  const agentById = (id: string | null): Agent | undefined =>
    state.agents.find((a) => a.id === id);

  /* ------------------------------ filtering ------------------------------ */
  const query = search.trim().toLowerCase();
  const filteredAgents = state.agents.filter((a) => {
    if (divisionFilter !== 'all' && a.division !== divisionFilter) return false;
    if (!query) return true;
    return (
      a.name.toLowerCase().includes(query) ||
      a.role.toLowerCase().includes(query) ||
      a.skills.some((s) => s.toLowerCase().includes(query))
    );
  });
  const filteredTasks = state.tasks.filter((t) => {
    if (divisionFilter !== 'all' && t.division !== divisionFilter) return false;
    if (!query) return true;
    return (
      t.title.toLowerCase().includes(query) || t.description.toLowerCase().includes(query)
    );
  });

  /* ------------------------------ agent CRUD ----------------------------- */
  const handleAddAgent = (input: AgentInput) => {
    onAddAgent(input);
    setAgentFormNonce((n) => n + 1);
  };

  const handleUpdateAgent = (agent: Agent, input: AgentInput) => {
    // Division change while the agent has a current task in the old division:
    // unassign first so the task returns to the To Do queue, then apply the patch.
    if (input.division !== agent.division && agent.currentTaskId) {
      const task = taskById(agent.currentTaskId);
      onAssign(agent.currentTaskId, null);
      setAgentNote(
        `${agent.name} was unassigned from "${task?.title ?? 'their task'}" — that task belongs to ${divisionById(agent.division).name}, not ${divisionById(input.division).name}.`,
      );
    }
    onUpdateAgent(agent.id, input);
    setEditingAgent(null);
  };

  const handleDeleteAgent = (agent: Agent) => {
    if (
      window.confirm(
        `Delete ${agent.name}? Their tasks will return to the To Do queue.`,
      )
    ) {
      onDeleteAgent(agent.id);
      if (editingAgent?.id === agent.id) setEditingAgent(null);
    }
  };

  /* ------------------------------ task CRUD ------------------------------ */
  const handleAddTask = (input: TaskInput) => {
    onAddTask(input);
    setTaskFormNonce((n) => n + 1);
  };

  const handleUpdateTask = (task: Task, input: TaskInput) => {
    // Division change while the task has an assignee: the assignee works in the
    // old division, so free them first (task returns to To Do, progress 0).
    if (input.division !== task.division && task.assigneeId) {
      onAssign(task.id, null);
    }
    onUpdateTask(task.id, {
      title: input.title,
      description: input.description,
      division: input.division,
      effort: input.effort,
      priority: input.priority,
      assigneeId: input.assigneeId,
    });
    // Route assignee changes through assignTask so division/busy/blocked
    // rules are enforced and refusals surface in the App toast.
    if (input.assigneeId !== task.assigneeId) {
      onAssign(task.id, input.assigneeId);
    }
    setEditingTask(null);
  };

  const handleDeleteTask = (task: Task) => {
    if (window.confirm(`Delete "${task.title}"?`)) {
      onDeleteTask(task.id);
      if (editingTask?.id === task.id) setEditingTask(null);
    }
  };

  /* ------------------------------- render -------------------------------- */
  return (
    <div id="forge-view" className="stack">
      <div className="panel">
        <h2 className="section-title">Forge</h2>
        <p className="panel-sub">
          {state.agents.length} agents · {state.tasks.length} tasks. Forge the crew,
          give it work, then watch it in the Office.
        </p>
        <div className="filter-bar">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search agents and tasks…"
            aria-label="Search agents and tasks"
          />
          <select
            value={divisionFilter}
            onChange={(e) => setDivisionFilter(e.target.value)}
            aria-label="Filter by division"
          >
            <option value="all">All divisions</option>
            {divisions.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <button className="btn" onClick={onGoToOffice}>
            View the office →
          </button>
        </div>
      </div>

      <div className="forge-layout">
        {/* ------------------------------- agents ------------------------------ */}
        <section className="panel stack" aria-label="Agents">
          <div>
            <h2>Agents</h2>
            <p className="panel-sub">The crew. One division each, one task at a time.</p>
          </div>

          {agentNote && (
            <p className="panel-sub">
              {agentNote}{' '}
              <button className="btn btn-sm btn-ghost" onClick={() => setAgentNote(null)}>
                Dismiss
              </button>
            </p>
          )}

          {editingAgent ? (
            <AgentForm
              key={editingAgent.id}
              divisions={divisions}
              initial={editingAgent}
              submitLabel="Save changes"
              onSubmit={(input) => handleUpdateAgent(editingAgent, input)}
              onCancel={() => setEditingAgent(null)}
            />
          ) : (
            <AgentForm
              key={`new-agent-${agentFormNonce}`}
              divisions={divisions}
              submitLabel="Add agent"
              onSubmit={handleAddAgent}
            />
          )}

          <div id="agent-list">
            {filteredAgents.length === 0 && (
              <div className="empty-state">
                {state.agents.length === 0
                  ? 'No agents yet — forge the first one above.'
                  : 'No agents match this filter.'}
              </div>
            )}
            {filteredAgents.map((agent) => {
              const division = divisionById(agent.division);
              const currentTask = taskById(agent.currentTaskId);
              return (
                <div key={agent.id} className="list-row">
                  <span
                    className="agent-avatar"
                    style={{ '--div-color': division.color } as CSSProperties}
                    aria-hidden="true"
                  >
                    {agent.emoji}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div>
                      <strong>{agent.name}</strong>{' '}
                      <span className="agent-role">{agent.role}</span>
                    </div>
                    <div className="task-meta">
                      <span className="badge">{division.name}</span>
                      <span
                        className={
                          agent.status === 'working'
                            ? 'badge working'
                            : agent.status === 'blocked'
                              ? 'badge blocked'
                              : 'badge'
                        }
                      >
                        {agentStatusLabel(agent.status)}
                      </span>
                    </div>
                    <div className="agent-task">
                      {agent.status === 'blocked' && agent.blockedNote ? (
                        <span className="priority-medium">{agent.blockedNote}</span>
                      ) : currentTask ? (
                        <span>
                          Working on: “{currentTask.title}” ({currentTask.progress}%)
                        </span>
                      ) : (
                        <span className="idle">No current task</span>
                      )}
                    </div>
                    {agent.skills.length > 0 && (
                      <div className="skill-tags">
                        {agent.skills.map((s) => (
                          <span key={s} className="skill-tag">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="task-actions">
                    <button className="btn btn-sm" onClick={() => setEditingAgent(agent)}>
                      Edit
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDeleteAgent(agent)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ------------------------------- tasks ------------------------------- */}
        <section className="panel stack" aria-label="Tasks">
          <div>
            <h2>Tasks</h2>
            <p className="panel-sub">The work. Pick an assignee to start it.</p>
          </div>

          {editingTask ? (
            <TaskForm
              key={editingTask.id}
              divisions={divisions}
              agents={state.agents}
              tasks={state.tasks}
              initial={editingTask}
              submitLabel="Save changes"
              onSubmit={(input) => handleUpdateTask(editingTask, input)}
              onCancel={() => setEditingTask(null)}
            />
          ) : (
            <TaskForm
              key={`new-task-${taskFormNonce}`}
              divisions={divisions}
              agents={state.agents}
              tasks={state.tasks}
              submitLabel="Add task"
              onSubmit={handleAddTask}
            />
          )}

          <div id="task-list">
            {filteredTasks.length === 0 && (
              <div className="empty-state">
                {state.tasks.length === 0
                  ? 'No tasks yet — create the first one above.'
                  : 'No tasks match this filter.'}
              </div>
            )}
            {filteredTasks.map((task) => {
              const division = divisionById(task.division);
              const assignee = agentById(task.assigneeId);
              const divisionAgents = state.agents.filter((a) => a.division === task.division);
              return (
                <div key={task.id} className="list-row">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="task-title">{task.title}</div>
                    {task.description && <div className="task-desc">{task.description}</div>}
                    <div className="task-meta">
                      <span className="badge">{division.name}</span>
                      <span
                        className={
                          task.status === 'doing'
                            ? 'badge working'
                            : task.status === 'done'
                              ? 'badge done'
                              : 'badge'
                        }
                      >
                        {taskStatusLabel(task.status)}
                      </span>
                      <span>Effort {task.effort}</span>
                      <span className={`priority-${task.priority}`}>
                        {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                      </span>
                      <span>
                        {assignee ? `Assigned to ${assignee.name}` : 'Unassigned'}
                      </span>
                      {task.status === 'doing' && <span>{task.progress}%</span>}
                    </div>
                    <div className="task-actions" style={{ marginTop: 6 }}>
                      <label htmlFor={`reassign-${task.id}`} className="agent-role">
                        Reassign
                      </label>
                      <select
                        id={`reassign-${task.id}`}
                        value={task.assigneeId ?? ''}
                        disabled={task.status === 'done'}
                        onChange={(e) => onAssign(task.id, e.target.value || null)}
                        style={{ width: 'auto', flex: 1 }}
                      >
                        <option value="">Unassigned</option>
                        {divisionAgents.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name}
                          </option>
                        ))}
                      </select>
                      <button className="btn btn-sm" onClick={() => setEditingTask(task)}>
                        Edit
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDeleteTask(task)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
