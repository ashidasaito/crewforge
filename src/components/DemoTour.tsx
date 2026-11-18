/**
 * CrewForge — guided demo tour (spec: .kiro/specs/demo-mode).
 *
 * Six steps that drive the app through the callbacks App provides
 * (onGoToView, onDemoAction). The tour never mutates state directly.
 * Targets are highlighted with .tour-highlight; a missing target is
 * skipped gracefully — the tour never crashes on a view that has not
 * rendered yet.
 */
import { useCallback, useEffect, useState } from 'react';
import type { View, DemoAction } from '../App';

export interface DemoTourProps {
  open: boolean;
  onClose: () => void;
  onGoToView: (view: View) => void;
  onDemoAction: (action: DemoAction) => void;
}

interface TourStep {
  title: string;
  body: string;
  view: View;
  targetId: string;
  action?: DemoAction;
}

const STEPS: TourStep[] = [
  {
    title: 'Meet the crew',
    body: 'This is the office crew — 14 agents across 6 divisions. Each card shows an agent’s role, skills, and what they are working on right now.',
    view: 'office',
    targetId: 'agent-cards',
  },
  {
    title: 'This is the office map',
    body: 'The map shows where everyone sits. Divisions group together, so you can see at a glance which part of the office is busy.',
    view: 'office',
    targetId: 'office-map',
  },
  {
    title: 'Forge a new agent',
    body: 'Need an extra pair of hands? Forge a new agent in seconds. Run this step to add Bolt, a demo agent in Product Development — no typing needed.',
    view: 'forge',
    targetId: 'agent-list',
    action: 'forge-agent',
  },
  {
    title: 'Give the crew work',
    body: 'Every task needs an owner. Run this step to create a small demo task and assign it to Bolt, so you can watch him work.',
    view: 'forge',
    targetId: 'task-form',
    action: 'assign-task',
  },
  {
    title: 'Speed up time',
    body: 'The office runs on a simulation clock. Run this step to switch to 4× speed and let the crew work faster.',
    view: 'office',
    targetId: 'sim-controls',
    action: 'speed-up',
  },
  {
    title: 'Watch it finish',
    body: 'Keep an eye on the task board and the activity feed. Bolt’s task will move from Doing to Done — the crew really does the work.',
    view: 'office',
    targetId: 'task-board',
  },
];

function clearHighlights(): void {
  document.querySelectorAll('.tour-highlight').forEach((el) => {
    el.classList.remove('tour-highlight');
  });
}

export default function DemoTour({ open, onClose, onGoToView, onDemoAction }: DemoTourProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [doneActions, setDoneActions] = useState<Set<DemoAction>>(new Set());

  // Opening the tour always starts from step 1 with a clean slate.
  useEffect(() => {
    if (open) {
      setStepIndex(0);
      setDoneActions(new Set());
    }
  }, [open ]);

  const closeTour = useCallback(() => {
    clearHighlights();
    onClose();
  }, [onClose]);

  // Navigate to the step's view, then highlight its target once the
  // view has rendered. A missing target is skipped, never an error.
  useEffect(() => {
    if (!open) return;
    const step = STEPS[stepIndex];
    onGoToView(step.view);
    const id = window.setTimeout(() => {
      const el = document.getElementById(step.targetId);
      if (el) el.classList.add('tour-highlight');
    }, 50);
    return () => {
      window.clearTimeout(id);
      document.getElementById(step.targetId)?.classList.remove('tour-highlight');
    };
  }, [open, stepIndex, onGoToView]);

  // Escape closes the tour at any time.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeTour();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, closeTour]);

  // Unmounting (or closing) must never leave a highlight behind.
  useEffect(() => clearHighlights, []);

  if (!open) return null;

  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;
  const actionDone = step.action !== undefined && doneActions.has(step.action);

  const runAction = () => {
    if (!step.action || actionDone) return;
    onDemoAction(step.action);
    setDoneActions((prev) => new Set(prev).add(step.action as DemoAction));
  };

  const goNext = () => {
    if (isLast) {
      closeTour();
    } else {
      setStepIndex((i) => i + 1);
    }
  };

  const goBack = () => {
    if (stepIndex > 0) setStepIndex((i) => i - 1);
  };

  return (
    <div className="tour-overlay" role="dialog" aria-modal="true" aria-label="Guided demo">
      <div className="tour-card">
        <h2>
          {step.title}
          <button
            type="button"
            className="btn btn-ghost"
            onClick={closeTour}
            aria-label="Close tour"
            style={{ float: 'right', padding: '2px 10px' }}
          >
            ×
          </button>
        </h2>
        <p>
          Step {stepIndex + 1} of {STEPS.length} — {step.body}
        </p>
        <div className="tour-steps" aria-label={`Step ${stepIndex + 1} of ${STEPS.length}`}>
          {STEPS.map((s, i) => (
            <span
              key={s.targetId}
              className={i === stepIndex ? 'tour-step-dot active' : 'tour-step-dot'}
              aria-hidden="true"
            />
          ))}
        </div>
        <div className="tour-actions">
          {step.action && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={runAction}
              disabled={actionDone}
            >
              {actionDone ? 'Done ✓' : 'Run this step'}
            </button>
          )}
          <button type="button" className="btn btn-ghost" onClick={goBack} disabled={stepIndex === 0}>
            Back
          </button>
          <button type="button" className="btn btn-primary" onClick={goNext}>
            {isLast ? 'Finish' : 'Next'}
          </button>
          <button type="button" className="btn btn-ghost" onClick={closeTour}>
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
