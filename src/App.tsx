/**
 * CrewForge — app shell.
 *
 * Owns the single AppState, the simulation clock, persistence, and the
 * view switching (Office / Forge). Feature views live in
 * src/components/ and receive state + callbacks as props — they never
 * own state themselves.
 */
import { useEffect, useRef, useState } from 'react';
import type { Agent, AppState, Priority, Task, TaskStatus } from './lib/types';
import { DIVISIONS, newId } from './lib/types';
import { loadState, saveState, exportState, importState } from './lib/store';
import { buildSeedState, FOUNDER } from './lib/seed';
import { tick, assignTask, moveTask, unblockAgent } from './lib/sim';
import ForgeView from './components/ForgeView';
import OfficeView from './components/OfficeView';
import DemoTour from './components/DemoTour';

export type View = 'office' | 'forge';
export type DemoAction = 'forge-agent' | 'assign-task' | 'speed-up';

export default function App() {
  const [state, setState] = useState<AppState>(() => loadState());
  const [view, setView] = useState<View>('office');
  const [demoOpen, setDemoOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Persist on every change.
  useEffect(() => {
    saveState(state);
  }, [state]);

  // Simulation clock: one tick per interval; speed divides the interval.
  useEffect(() => {
    if (!state.sim.running) return;
    const ms = 1000 / state.sim.speed;
    const id = window.setInterval(() => {
      setState((prev) => (prev.sim.running ? tick(prev).state : prev));
    }, ms);
    return () => window.clearInterval(id);
  }, [state.sim.running, state.sim.speed]);

  // Auto-dismiss notices.
  useEffect(() => {
    if (!notice) return;
    const id = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(id);
  }, [notice]);

  const showError = (error: string | null) => {
    if (error) setNotice(error);
  };

  /* ------------------------------ agent CRUD ----------------------------- */
  const addAgent = (input: Omit<Agent, 'id' | 'status' | 'currentTaskId' | 'blockedNote'>) => {
    const agent: Agent = { ...input, id: newId(), status: 'idle', currentTaskId: null, blockedNote: null };
    setState((prev) => ({ ...prev, agents: [...prev.agents, agent] }));
    return agent;
  };

  const updateAgent = (id: string, patch: Partial<Agent>) => {
    setState((prev) => ({
      ...prev,
      agents: prev.agents.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    }));
  };

  const deleteAgent = (id: string) => {
    setState((prev) => {
      const agent = prev.agents.find((a) => a.id === id);
      const tasks = prev.tasks.map((t) =>
        t.assigneeId === id
          ? { ...t, assigneeId: null, status: (t.status === 'done' ? 'done' : 'todo') as TaskStatus, progress: t.status === 'done' ? t.progress : 0 }
          : t,
      );
      return {
        ...prev,
        agents: prev.agents.filter((a) => a.id !== id),
        tasks,
        feed: agent
          ? [{ id: newId(), tick: prev.sim.tick, at: Date.now(), kind: 'system' as const, text: `${agent.name} left the crew. Their tasks returned to the queue.`, agentId: null }, ...prev.feed].slice(0, 200)
          : prev.feed,
      };
    });
  };

  /* ------------------------------ task CRUD ------------------------------ */
  const addTask = (input: {
    title: string;
    description: string;
    division: Task['division'];
    effort: number;
    priority: Priority;
    assigneeId: string | null;
  }) => {
    const task: Task = {
      ...input,
      id: newId(),
      status: input.assigneeId ? 'doing' : 'todo',
      progress: 0,
      createdAt: Date.now(),
      completedAt: null,
    };
    setState((prev) => {
      const agents = prev.agents.map((a) =>
        a.id === input.assigneeId ? { ...a, status: 'working' as const, currentTaskId: task.id } : a,
      );
      const feed = input.assigneeId
        ? [{ id: newId(), tick: prev.sim.tick, at: Date.now(), kind: 'assign' as const, text: `"${task.title}" assigned to ${prev.agents.find((a) => a.id === input.assigneeId)?.name ?? 'someone'}.`, agentId: input.assigneeId }, ...prev.feed].slice(0, 200)
        : prev.feed;
      return { ...prev, tasks: [...prev.tasks, task], agents, feed, stats: { ...prev.stats, tasksStarted: prev.stats.tasksStarted + (input.assigneeId ? 1 : 0) } };
    });
    return task;
  };

  const updateTask = (id: string, patch: Partial<Task>) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }));
  };

  const deleteTask = (id: string) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => t.id !== id),
      agents: prev.agents.map((a) =>
        a.currentTaskId === id ? { ...a, status: 'idle' as const, currentTaskId: null } : a,
      ),
    }));
  };

  /* --------------------------- sim + board actions ------------------------ */
  const handleAssign = (taskId: string, agentId: string | null) => {
    setState((prev) => {
      const { state: next, error } = assignTask(prev, taskId, agentId);
      showError(error);
      return next;
    });
  };

  const handleMove = (taskId: string, to: TaskStatus) => {
    setState((prev) => {
      const { state: next, error } = moveTask(prev, taskId, to);
      showError(error);
      return next;
    });
  };

  const handleUnblock = (agentId: string) => {
    setState((prev) => unblockAgent(prev, agentId));
  };

  const setRunning = (running: boolean) => {
    setState((prev) => ({ ...prev, sim: { ...prev.sim, running } }));
  };

  const setSpeed = (speed: 1 | 2 | 4) => {
    setState((prev) => ({ ...prev, sim: { ...prev.sim, speed } }));
  };

  /* ------------------------- demo tour conveniences ----------------------- */
  const handleDemoAction = (action: DemoAction) => {
    if (action === 'forge-agent') {
      const existing = state.agents.find((a) => a.name === 'Bolt');
      if (!existing) {
        addAgent({
          name: 'Bolt',
          role: 'Demo Agent',
          division: 'product',
          color: '#fb7185',
          emoji: '⚡',
          skills: ['demo', 'fast-learner'],
        });
        setNotice('Bolt joined the crew — Product Development.');
      }
      setView('forge');
    }
    if (action === 'assign-task') {
      const bolt = state.agents.find((a) => a.name === 'Bolt');
      const existing = state.tasks.find((t) => t.title === 'Ship the demo feature');
      if (!existing && bolt) {
        addTask({
          title: 'Ship the demo feature',
          description: 'A small feature to show the crew working end to end.',
          division: 'product',
          effort: 1,
          priority: 'high',
          assigneeId: bolt.id,
        });
        setNotice('Task assigned to Bolt — watch it in the Office.');
      }
      setRunning(true);
      setView('office');
    }
    if (action === 'speed-up') {
      setSpeed(4);
      setRunning(true);
      setView('office');
    }
  };

  /* --------------------------- data management ---------------------------- */
  const handleExport = () => {
    const blob = new Blob([exportState(state)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'crewforge-crew.json';
    a.click();
    URL.revokeObjectURL(url);
    setNotice('Crew exported as JSON.');
  };

  const handleImportFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const next = importState(String(reader.result ?? ''));
      if (next) {
        setState(next);
        setNotice('Crew imported.');
      } else {
        setNotice('That file is not a valid CrewForge export.');
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (window.confirm('Reset the office to the demo MINOKATSU crew? Your current crew will be replaced.')) {
      setState(buildSeedState());
      setNotice('Demo crew restored.');
    }
  };

  const doingCount = state.tasks.filter((t) => t.status === 'doing').length;
  const doneCount = state.tasks.filter((t) => t.status === 'done').length;

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            🔨
          </span>
          <div>
            <h1 className="brand-name">CrewForge</h1>
            <p className="brand-tag">Forge your AI crew. Give it work. Watch it work.</p>
          </div>
        </div>
        <div className="founder-chip" title="The founder running this office">
          <span className="founder-avatar" aria-hidden="true">
            👤
          </span>
          <div>
            <strong>{FOUNDER.name}</strong>
            <span>
              {FOUNDER.title} · {FOUNDER.company}
            </span>
          </div>
        </div>
      </header>

      <nav className="app-nav" aria-label="Views">
        <div className="nav-tabs" role="tablist">
          <button
            role="tab"
            aria-selected={view === 'office'}
            className={view === 'office' ? 'nav-tab active' : 'nav-tab'}
            onClick={() => setView('office')}
          >
            🏢 Office
          </button>
          <button
            role="tab"
            aria-selected={view === 'forge'}
            className={view === 'forge' ? 'nav-tab active' : 'nav-tab'}
            onClick={() => setView('forge')}
          >
            🔨 Forge
          </button>
        </div>
        <div className="nav-actions">
          <button className="btn btn-primary" onClick={() => setDemoOpen(true)}>
            ▶ Play demo
          </button>
          <button className="btn btn-ghost" onClick={handleExport}>
            Export
          </button>
          <button className="btn btn-ghost" onClick={() => fileInputRef.current?.click()}>
            Import
          </button>
          <button className="btn btn-ghost" onClick={handleReset}>
            Reset demo crew
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImportFile(f);
              e.target.value = '';
            }}
          />
        </div>
      </nav>

      {notice && (
        <div className="toast" role="status">
          {notice}
        </div>
      )}

      <main>
        {state.agents.length === 0 && state.tasks.length === 0 ? (
          <div className="empty-state">
            <h2>No crew yet</h2>
            <p>Your office is empty. Load the demo MINOKATSU crew to see CrewForge in action.</p>
            <button className="btn btn-primary" onClick={handleReset}>
              Load the demo crew
            </button>
          </div>
        ) : view === 'office' ? (
          <OfficeView
            state={state}
            onAssign={handleAssign}
            onMove={handleMove}
            onUnblock={handleUnblock}
            onSetRunning={setRunning}
            onSetSpeed={setSpeed}
            onSelectDivision={() => setView('forge')}
            doingCount={doingCount}
            doneCount={doneCount}
          />
        ) : (
          <ForgeView
            state={state}
            divisions={DIVISIONS}
            onAddAgent={addAgent}
            onUpdateAgent={updateAgent}
            onDeleteAgent={deleteAgent}
            onAddTask={addTask}
            onUpdateTask={updateTask}
            onDeleteTask={deleteTask}
            onAssign={handleAssign}
            onGoToOffice={() => setView('office')}
          />
        )}
      </main>

      <footer className="app-footer">
        <p>
          CrewForge simulates an AI crew locally in your browser — no accounts, no API keys, no real
          agents. Built with Kiro (spec-driven development) for Kiroween 2026 · Frankenstein.
        </p>
      </footer>

      <DemoTour
        open={demoOpen}
        onClose={() => setDemoOpen(false)}
        onGoToView={setView}
        onDemoAction={handleDemoAction}
      />
    </div>
  );
}
