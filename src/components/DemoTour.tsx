/**
 * CrewForge — guided demo tour (spec: .kiro/specs/demo-mode).
 *
 * Six steps that drive the app through the callbacks App provides
 * (onGoToView, onDemoAction). The tour never mutates state directly.
 *
 * Anchored overlay: instead of a centred card that covers the element it
 * explains, each step scrolls its target into view, cuts a hole in the
 * dim around the target (`.tour-dim` + clip-path) so the target stays
 * fully visible and undimmed, and anchors the card beside the target —
 * below first, then above, then to the side. For a target taller than
 * the viewport minus the card (the agent-cards grid), the page is
 * scrolled a little further so the card fits below the target's bottom
 * edge; only if nothing fits does the card shrink with an internal
 * scroll. The card never overlaps the target rect. A missing target
 * falls back to the old full dim + bottom-centred card.
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
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

type Placement = 'below' | 'above' | 'right' | 'left' | 'shifted' | 'shrunk';

interface ViewRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CardPos {
  top: number;
  left: number;
  maxHeight: number | null;
  placement: Placement;
  /** Pixels to scroll the page by so the card fits; applied once, then re-measured. */
  shiftY: number;
}

interface Anchor {
  rect: ViewRect;
  pos: CardPos;
}

const MARGIN = 16;
const GAP = 16;
const CARD_WIDTH = 560;
const MIN_VISIBLE_TARGET = 200;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

function toRect(r: DOMRect): ViewRect {
  return { x: r.x, y: r.y, width: r.width, height: r.height };
}

/**
 * Pick where the card goes for a target rect. Pure: no scrolling, no DOM.
 * Priority: below the target, above it, to either side, then — for a
 * target that leaves no room on any side — scroll the page so the card
 * fits below (or above) while at least MIN_VISIBLE_TARGET px of the
 * target stay on screen. Last resort: shrink the card with internal
 * scroll into the larger of the above/below gaps. Never overlaps the
 * target rect.
 */
function computePos(
  rect: ViewRect,
  cardW: number,
  cardH: number,
  vw: number,
  vh: number,
  allowShift: boolean,
): CardPos {
  const bottom = rect.y + rect.height;
  const right = rect.x + rect.width;
  const belowSpace = vh - bottom - MARGIN;
  const aboveSpace = rect.y - MARGIN;
  const leftBelow = clamp(rect.x, MARGIN, Math.max(MARGIN, vw - cardW - MARGIN));

  if (belowSpace >= cardH + GAP) {
    return { top: bottom + GAP, left: leftBelow, maxHeight: null, placement: 'below', shiftY: 0 };
  }
  if (aboveSpace >= cardH + GAP) {
    return { top: rect.y - GAP - cardH, left: leftBelow, maxHeight: null, placement: 'above', shiftY: 0 };
  }
  const topSide = clamp(rect.y, MARGIN, Math.max(MARGIN, vh - cardH - MARGIN));
  if (vw - right - MARGIN >= cardW + GAP && cardH <= vh - 2 * MARGIN) {
    return { top: topSide, left: right + GAP, maxHeight: null, placement: 'right', shiftY: 0 };
  }
  if (rect.x - MARGIN >= cardW + GAP && cardH <= vh - 2 * MARGIN) {
    return { top: topSide, left: rect.x - GAP - cardW, maxHeight: null, placement: 'left', shiftY: 0 };
  }
  if (allowShift && cardH + GAP + 2 * MARGIN <= vh) {
    // Room below once the target is scrolled up; keep part of it visible.
    const targetBottom = vh - MARGIN - cardH - GAP;
    if (targetBottom >= MIN_VISIBLE_TARGET) {
      return { top: targetBottom + GAP, left: leftBelow, maxHeight: null, placement: 'shifted', shiftY: bottom - targetBottom };
    }
    const targetTop = MARGIN + cardH + GAP;
    if (vh - targetTop >= MIN_VISIBLE_TARGET) {
      return { top: MARGIN, left: leftBelow, maxHeight: null, placement: 'shifted', shiftY: targetTop - rect.y };
    }
  }
  // Last resort: shrink the card into the larger gap, scrolling inside it.
  if (belowSpace >= aboveSpace) {
    return { top: bottom + GAP, left: leftBelow, maxHeight: Math.max(120, belowSpace - GAP), placement: 'shrunk', shiftY: 0 };
  }
  return { top: MARGIN, left: leftBelow, maxHeight: Math.max(120, aboveSpace - GAP), placement: 'shrunk', shiftY: 0 };
}

function clearHighlights(): void {
  document.querySelectorAll('.tour-highlight').forEach((el) => {
    el.classList.remove('tour-highlight');
  });
}

export default function DemoTour({ open, onClose, onGoToView, onDemoAction }: DemoTourProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [doneActions, setDoneActions] = useState<Set<DemoAction>>(new Set());
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  // Last measured card height; the first layout uses this estimate.
  const cardHeightRef = useRef(240);
  // Caps the re-layout passes that follow a corrected card measurement.
  const correctionsRef = useRef(0);
  const layoutRef = useRef<(allowShift: boolean) => void>(() => undefined);
  const repositionRef = useRef<() => void>(() => undefined);

  // Opening the tour always starts from step 1 with a clean slate.
  useEffect(() => {
    if (open) {
      setStepIndex(0);
      setDoneActions(new Set());
      setAnchor(null);
    }
  }, [open ]);

  const closeTour = useCallback(() => {
    clearHighlights();
    setAnchor(null);
    onClose();
  }, [onClose]);

  /**
   * Scroll the step's target into view, then anchor the card to it.
   * A missing target clears the anchor (fallback: full dim, bottom card).
   */
  const relayout = useCallback(
    (allowShift: boolean) => {
      if (!open) return;
      const step = STEPS[stepIndex];
      const el = document.getElementById(step.targetId);
      if (!el) {
        setAnchor(null);
        return;
      }
      el.classList.add('tour-highlight');
      el.scrollIntoView({ behavior: 'auto', block: 'start' });
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const cardW = Math.min(CARD_WIDTH, vw - 2 * MARGIN);
      const cardH = cardRef.current?.offsetHeight ?? cardHeightRef.current;
      if (cardH > 0) cardHeightRef.current = cardH;
      let rect = toRect(el.getBoundingClientRect());
      let pos = computePos(rect, cardW, cardH, vw, vh, allowShift);
      if (pos.shiftY !== 0) {
        window.scrollBy({ top: pos.shiftY, behavior: 'auto' });
        rect = toRect(el.getBoundingClientRect());
        pos = computePos(rect, cardW, cardH, vw, vh, false);
      }
      setAnchor({ rect, pos });
    },
    [open, stepIndex],
  );

  /**
   * Re-place the card against the target's current rect without moving
   * the page. Used by the scroll/resize listeners: the page scroll that
   * relayout itself performs must never be undone by a listener firing
   * mid-layout (that used to re-scroll the target to the top and shrink
   * the card for the agent-cards step).
   */
  const reposition = useCallback(() => {
    if (!open) return;
    const step = STEPS[stepIndex];
    const el = document.getElementById(step.targetId);
    if (!el) {
      setAnchor(null);
      return;
    }
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const cardW = Math.min(CARD_WIDTH, vw - 2 * MARGIN);
    const cardH = cardRef.current?.offsetHeight ?? cardHeightRef.current;
    if (cardH > 0) cardHeightRef.current = cardH;
    const rect = toRect(el.getBoundingClientRect());
    setAnchor({ rect, pos: computePos(rect, cardW, cardH, vw, vh, false) });
  }, [open, stepIndex]);

  // Latest relayout/reposition, for listeners and timeouts that outlive a render.
  useEffect(() => {
    layoutRef.current = relayout;
    repositionRef.current = reposition;
  });

  // Navigate to the step's view, then highlight + anchor its target once
  // the view has rendered. A missing target is skipped, never an error.
  useEffect(() => {
    if (!open) return;
    const step = STEPS[stepIndex];
    onGoToView(step.view);
    correctionsRef.current = 0;
    const id = window.setTimeout(() => layoutRef.current(true), 80);
    return () => {
      window.clearTimeout(id);
      document.getElementById(step.targetId)?.classList.remove('tour-highlight');
    };
  }, [open, stepIndex, onGoToView]);

  // Re-anchor after the card's real height is known (it may differ from
  // the estimate used for the first layout), and when the user scrolls or
  // resizes while the tour is open. Re-layouts without shifting only
  // re-place the card; they never move the page.
  useLayoutEffect(() => {
    if (!open || !anchor) return;
    const h = cardRef.current?.offsetHeight ?? 0;
    if (h > 0 && Math.abs(h - cardHeightRef.current) > 8 && correctionsRef.current < 2) {
      correctionsRef.current += 1;
      cardHeightRef.current = h;
      layoutRef.current(true);
    }
  }, [open, anchor]);

  useEffect(() => {
    if (!open) return;
    const onMove = () => repositionRef.current();
    window.addEventListener('resize', onMove);
    window.addEventListener('scroll', onMove, true);
    return () => {
      window.removeEventListener('resize', onMove);
      window.removeEventListener('scroll', onMove, true);
    };
  }, [open ]);

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
    // The action can change the view or grow the target (Bolt joins the
    // agent list), so re-anchor once the app has re-rendered. If the
    // target is gone (the action navigated away), this clears the anchor
    // and the card falls back to the bottom-centred position.
    window.setTimeout(() => layoutRef.current(true), 120);
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

  // Cut a hole in the dim around the target (padded so the highlight
  // outline and glow stay undimmed). The hole ring is entered from the
  // outer ring's start corner and the path returns to that same corner,
  // so the two connecting edges retrace each other: with evenodd fill
  // they cancel out instead of cutting a diagonal wedge across the dim
  // (a single un-retraced edge flips the parity on one side of it).
  // No anchor: the dim covers all.
  const hole = anchor
    ? {
        x: Math.max(0, anchor.rect.x - 8),
        y: Math.max(0, anchor.rect.y - 8),
        w: Math.min(window.innerWidth, anchor.rect.width + 16),
        h: Math.min(window.innerHeight, anchor.rect.height + 16),
      }
    : null;
  const clipPath = hole
    ? `polygon(evenodd, 0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, ${hole.x}px ${hole.y}px, ${hole.x + hole.w}px ${hole.y}px, ${hole.x + hole.w}px ${hole.y + hole.h}px, ${hole.x}px ${hole.y + hole.h}px, ${hole.x}px ${hole.y}px, 0% 0%)`
    : undefined;

  return (
    <div className="tour-overlay" role="dialog" aria-modal="true" aria-label="Guided demo">
      <div className="tour-blocker" aria-hidden="true" />
      <div className="tour-dim" aria-hidden="true" style={clipPath ? { clipPath } : undefined} />
      <div
        ref={cardRef}
        className={anchor ? 'tour-card' : 'tour-card tour-card--fallback'}
        style={
          anchor
            ? {
                top: anchor.pos.top,
                left: anchor.pos.left,
                maxHeight: anchor.pos.maxHeight ?? undefined,
              }
            : undefined
        }
      >
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
