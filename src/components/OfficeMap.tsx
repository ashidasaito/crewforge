/**
 * OfficeMap — six room buttons, one per division.
 * Each room shows its label, division name, the agents in that room as
 * dots, and a count of active (Doing) tasks. Clicking a room toggles the
 * division filter; clicking again clears it. The "All" button clears
 * the filter outright.
 */
import type { CSSProperties } from 'react';
import type { Agent, DivisionId, Task } from '../lib/types';
import { DIVISIONS } from '../lib/types';

export interface OfficeMapProps {
  agents: Agent[];
  tasks: Task[];
  selectedDivision: DivisionId | null;
  onSelectDivision: (divisionId: DivisionId | null) => void;
}

export default function OfficeMap({ agents, tasks, selectedDivision, onSelectDivision }: OfficeMapProps) {
  return (
    <div id="office-map">
      <div className="filter-bar" style={{ marginBottom: 12 }}>
        <button
          className={selectedDivision === null ? 'btn btn-sm btn-primary' : 'btn btn-sm'}
          onClick={() => onSelectDivision(null)}
          aria-pressed={selectedDivision === null}
        >
          All divisions
        </button>
        {selectedDivision && (
          <span className="panel-sub" style={{ marginBottom: 0 }}>
            Filtering board and agent cards to one division — click the room again to clear.
          </span>
        )}
      </div>
      <div className="office-map">
        {DIVISIONS.map((division) => {
          const roomAgents = agents.filter((a) => a.division === division.id);
          const activeCount = tasks.filter(
            (t) => t.division === division.id && t.status === 'doing',
          ).length;
          const selected = selectedDivision === division.id;
          const style = { '--div-color': division.color } as CSSProperties;
          return (
            <button
              key={division.id}
              type="button"
              className={selected ? 'room selected' : 'room'}
              style={style}
              aria-pressed={selected}
              onClick={() => onSelectDivision(selected ? null : division.id)}
            >
              <div className="room-name">
                {division.room} — {division.name}
              </div>
              <div className="room-sub">
                {activeCount} active · {roomAgents.length} agent{roomAgents.length === 1 ? '' : 's'}
              </div>
              <div className="room-dots">
                {roomAgents.map((agent) => (
                  <span
                    key={agent.id}
                    className="room-dot"
                    style={style}
                    title={`${agent.name} — ${agent.role}`}
                  >
                    {agent.emoji}
                  </span>
                ))}
                {roomAgents.length === 0 && <span className="room-sub">No agents yet</span>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
