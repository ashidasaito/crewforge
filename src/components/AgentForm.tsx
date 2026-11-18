/**
 * AgentForm — controlled form for creating and editing a crew agent.
 * Used by ForgeView for both modes: `initial` set means edit, unset means create.
 * Local validation: name and role are required (inline errors).
 * The color defaults to the division color until the founder picks one.
 */
import { useState, type FormEvent } from 'react';
import type { Agent, Division, DivisionId } from '../lib/types';
import { divisionById } from '../lib/types';

export interface AgentInput {
  name: string;
  role: string;
  division: DivisionId;
  color: string;
  emoji: string;
  skills: string[];
}

interface AgentFormProps {
  divisions: Division[];
  /** When set, the form edits this agent instead of creating one. */
  initial?: Agent | null;
  submitLabel: string;
  onSubmit: (input: AgentInput) => void;
  onCancel?: () => void;
}

export default function AgentForm({ divisions, initial, submitLabel, onSubmit, onCancel }: AgentFormProps) {
  const defaultDivision = initial?.division ?? divisions[0]?.id ?? 'research';
  const [name, setName] = useState(initial?.name ?? '');
  const [role, setRole] = useState(initial?.role ?? '');
  const [division, setDivision] = useState<DivisionId>(defaultDivision);
  const [color, setColor] = useState(initial?.color ?? divisionById(defaultDivision).color);
  const [colorTouched, setColorTouched] = useState(Boolean(initial));
  const [emoji, setEmoji] = useState(initial?.emoji ?? '✨');
  const [skillsText, setSkillsText] = useState(initial?.skills.join(', ') ?? '');
  const [errors, setErrors] = useState<{ name?: string; role?: string }>({});

  const handleDivisionChange = (next: DivisionId) => {
    setDivision(next);
    // Keep the color in step with the division until the founder picks one.
    if (!colorTouched) setColor(divisionById(next).color);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const nextErrors: { name?: string; role?: string } = {};
    if (!name.trim()) nextErrors.name = 'Name is required.';
    if (!role.trim()) nextErrors.role = 'Role is required.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const firstEmoji = Array.from(emoji.trim())[0] ?? '✨';
    onSubmit({
      name: name.trim(),
      role: role.trim(),
      division,
      color,
      emoji: firstEmoji,
      skills: skillsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    });
  };

  return (
    <form className="form-card" onSubmit={handleSubmit}>
      <div className="form-row">
        <div>
          <label htmlFor={`agent-name-${initial?.id ?? 'new'}`}>Name *</label>
          <input
            id={`agent-name-${initial?.id ?? 'new'}`}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Kira"
          />
          {errors.name && <p className="field-error">{errors.name}</p>}
        </div>
        <div>
          <label htmlFor={`agent-role-${initial?.id ?? 'new'}`}>Role *</label>
          <input
            id={`agent-role-${initial?.id ?? 'new'}`}
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g. Bounty hunter"
          />
          {errors.role && <p className="field-error">{errors.role}</p>}
        </div>
      </div>

      <div className="form-row">
        <div>
          <label htmlFor={`agent-division-${initial?.id ?? 'new'}`}>Division</label>
          <select
            id={`agent-division-${initial?.id ?? 'new'}`}
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
          <label htmlFor={`agent-color-${initial?.id ?? 'new'}`}>Color</label>
          <input
            id={`agent-color-${initial?.id ?? 'new'}`}
            type="color"
            value={color}
            onChange={(e) => {
              setColor(e.target.value);
              setColorTouched(true);
            }}
          />
        </div>
      </div>

      <div className="form-row">
        <div>
          <label htmlFor={`agent-emoji-${initial?.id ?? 'new'}`}>Emoji</label>
          <input
            id={`agent-emoji-${initial?.id ?? 'new'}`}
            type="text"
            value={emoji}
            maxLength={2}
            onChange={(e) => setEmoji(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor={`agent-skills-${initial?.id ?? 'new'}`}>Skills (comma-separated)</label>
          <input
            id={`agent-skills-${initial?.id ?? 'new'}`}
            type="text"
            value={skillsText}
            onChange={(e) => setSkillsText(e.target.value)}
            placeholder="e.g. react, audits, video"
          />
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
