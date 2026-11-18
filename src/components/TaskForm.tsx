/**
 * TaskForm — controlled form for creating and editing a task.
 * Used by ForgeView for both modes: `initial` set means edit, unset means create.
 * Local validation: title is required; effort must be a whole number from 1 to 5.
 * The assignee picker only lists agents in the chosen division, and changing
 * the division resets the assignee. A blocked or already-busy assignee is
 * refused here with an inline error (App.addTask does not re-check that).
 */
import { useState, type FormEvent } from 'react';
import type { Agent, Division, DivisionId, Priority, Task } from '../lib/types';

export interface TaskInput {
  title: string;
  description: string;
  division: DivisionId;
  effort: number;
  priority: Priority;
  assigneeId: string | null;
}

interface TaskFormProps {
  divisions: Division[];
  agents: Agent[];
  tasks: Task[];
  /** When set, the form edits this task instead of creating one. */
  initial?: Task | null;
  submitLabel: string;
  onSubmit: (input: TaskInput) => void;
  onCancel?: () => void;
}

const PRIORITIES: Priority[] = ['low', 'medium', 'high'];

export default function TaskForm({ divisions, agents, tasks, initial, submitLabel, onSubmit, onCancel }: TaskFormProps) {
  const defaultDivision = initial?.division ?? divisions[0]?.id ?? 'research';
  const initialAssignee = initial?.assigneeId ?? null;
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [division, setDivision] = useState<DivisionId>(defaultDivision);
  const [effort, setEffort] = useState(String(initial?.effort ?? 2));
  const [priority, setPriority] = useState<Priority>(initial?.priority ?? 'medium');
  const [assigneeId, setAssigneeId] = useState<string>(
    initialAssignee && agents.some((a) => a.id === initialAssignee && a.division === defaultDivision)
      ? initialAssignee
      : '',
  );
  const [errors, setErrors] = useState<{ title?: string; effort?: string; assignee?: string }>({});

  // A done task cannot be reassigned; its assignee is shown but locked.
  const assigneeLocked = initial?.status === 'done';
  const divisionAgents = agents.filter((a) => a.division === division);

  const handleDivisionChange = (next: DivisionId) => {
    setDivision(next);
    // The assignee picker only ever shows agents of the chosen division.
    setAssigneeId('');
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const nextErrors: { title?: string; effort?: string; assignee?: string } = {};
    if (!title.trim()) nextErrors.title = 'Title is required.';
    const effortNum = Number(effort);
    if (!Number.isInteger(effortNum) || effortNum < 1 || effortNum > 5) {
      nextErrors.effort = 'Effort must be a whole number between 1 and 5.';
    }
    if (assigneeId) {
      const agent = agents.find((a) => a.id === assigneeId);
      if (agent) {
        if (agent.status === 'blocked') {
          nextErrors.assignee = `${agent.name} is blocked — resolve the blocker first.`;
        } else if (agent.currentTaskId && agent.currentTaskId !== initial?.id) {
          const other = tasks.find((t) => t.id === agent.currentTaskId);
          nextErrors.assignee = other
            ? `${agent.name} is already working on "${other.title}".`
            : `${agent.name} is already working on another task.`;
        }
      }
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      division,
      effort: effortNum,
      priority,
      assigneeId: assigneeId || null,
    });
  };

  const idSuffix = initial?.id ?? 'new';

  return (
    <form id="task-form" className="form-card" onSubmit={handleSubmit}>
      <div>
        <label htmlFor={`task-title-${idSuffix}`}>Title *</label>
        <input
          id={`task-title-${idSuffix}`}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Audit the staking contract"
        />
        {errors.title && <p className="field-error">{errors.title}</p>}
      </div>

      <div>
        <label htmlFor={`task-description-${idSuffix}`}>Description</label>
        <textarea
          id={`task-description-${idSuffix}`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="What does done look like?"
        />
      </div>

      <div className="form-row">
        <div>
          <label htmlFor={`task-division-${idSuffix}`}>Division</label>
          <select
            id={`task-division-${idSuffix}`}
            value={division}
            onChange={(e) => handleDivisionChange(e.target.value as DivisionId)}
          >
            {divisions.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`task-effort-${idSuffix}`}>Effort (1–5) *</label>
          <input
            id={`task-effort-${idSuffix}`}
            type="number"
            min={1}
            max={5}
            step={1}
            value={effort}
            onChange={(e) => setEffort(e.target.value)}
          />
          {errors.effort && <p className="field-error">{errors.effort}</p>}
        </div>
      </div>

      <div className="form-row">
        <div>
          <label htmlFor={`task-priority-${idSuffix}`}>Priority</label>
          <select
            id={`task-priority-${idSuffix}`}
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`task-assignee-${idSuffix}`}>Assignee</label>
          <select
            id={`task-assignee-${idSuffix}`}
            value={assigneeId}
            disabled={assigneeLocked}
            onChange={(e) => setAssigneeId(e.target.value)}
          >
            <option value="">Unassigned</option>
            {divisionAgents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} — {a.role}
              </option>
            ))}
          </select>
          {errors.assignee && <p className="field-error">{errors.assignee}</p>}
        </div>
      </div>

      <div className="task-actions">
        <button type="submit" className="btn btn-primary">
          {submitLabel}
        </button>
        {onCancel && (
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
