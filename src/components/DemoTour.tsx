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
 * below first, then above, then to the side. Step 1 compacts the
 * agent-cards grid (`.tour-compact-grid`) so the whole grid and the card
 * both fit in a 720px viewport. When a step's target unmounts after its
 * action (step 4: the task form is gone once the view switches to the
 * Office), the card re-anchors to a fallback element instead of falling
 * back to the old bottom-centred card — for step 4 that is the newly
 * assigned task card (`data-task-title`). Step 6 follows that same task
 * card as the simulation moves it between columns, scrolling it into
 * view and re-anchoring while it is on screen. A missing target falls
 * back to the old full dim + bottom-centred card.
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
  /** Element to anchor to when the primary target is gone (step 4). */
  fallbackSelector?: string;
  /** Task-card title to follow while this step is active (step 6). */
  followTaskTitle?: string;
  /** Compact the target grid so it fits with the card (step 1). */
  compactGrid?: boolean;
}

/** The demo task the tour creates in step 4 and watches in step 6. */
const DEMO_TASK_TITLE = 'Ship the demo feature';

const STEPS: TourStep[] = [
  {
    title: 'Meet the crew',
    body: 'This is the office crew — 14 agents across 6 divisions. Each card shows an agent’s role, skills, and what they are working on right now.',
    view: 'office',
    targetId: 'agent-cards',
    compactGrid: true,
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
    fallbackSelector: `[data-task-title="${DEMO_TASK_TITLE}"]`,
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
    followTaskTitle: DEMO_TASK_TITLE,
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

function clearCompactGrids(): void {
  document.querySelectorAll('.tour-compact-grid').forEach((el) => {
    el.classList.remove('tour-compact-grid');
  });
}

/**
 * Resolve the element a step anchors to. A follow step (6) anchors to
 * the demo task card itself while it exists, falling back to the whole
 * board; a step whose target unmounts after its action (4) falls back
 * to its fallback selector. `centered` is true for a small card target,
 * which is scrolled to the middle of the viewport so the tour card
 * fits below it; full-size targets scroll to the top as before.
 */
function resolveTarget(step: TourStep): { el: HTMLElement; centered: boolean } | null {
  if (step.followTaskTitle) {
    const card = document.querySelector(
      `[data-task-title="${CSS.escape(step.followTaskTitle)}"]`,
    );
    if (card) return { el: card as HTMLElement, centered: true };
  }
  const primary = document.getElementById(step.targetId);
  if (primary) return { el: primary, centered: false };
  if (step.fallbackSelector) {
    const fallback = document.querySelector(step.fallbackSelector);
    if (fallback) return { el: fallback as HTMLElement, centered: true };
  }
  return null;
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
    clearCompactGrids();
    setAnchor(null);
    onClose();
  }, [onClose]);

  /**
   * Scroll the step's target into view, then anchor the card to it.
   * A missing target clears the anchor (fallback: full dim, bottom card).
   * Step 1 compacts the agent grid first so the whole grid fits above
   * the card; other steps remove the compact class.
   */
  const relayout = useCallback(
    (allowShift: boolean) => {
      if (!open) return;
      const step = STEPS[stepIndex];
      const found = resolveTarget(step);
      clearCompactGrids();
      if (!found) {
        setAnchor(null);
        return;
      }
      const el = found.el;
      if (step.compactGrid) el.classList.add('tour-compact-grid');
      clearHighlights();
      el.classList.add('tour-highlight');
      el.scrollIntoView({ behavior: 'auto', block: found.centered ? 'center' : 'start' });
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
    const found = resolveTarget(step);
    if (!found) {
      setAnchor(null);
      return;
    }
    const el = found.el;
    // The followed task card can be re-created by React as it moves
    // between columns; make sure the highlight sits on the live node.
    if (!el.classList.contains('tour-highlight')) {
      clearHighlights();
      el.classList.add('tour-highlight');
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
      clearHighlights();
      clearCompactGrids();
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

  // Step 6 follows the demo task card while the simulation moves it:
  // the card can jump from Doing to Done (or stall there if Bolt is
  // blocked), so keep it scrolled into view and re-anchor the tour
  // card to its live position. The card is kept near the middle of the
  // viewport, not just inside it: at 4x other tasks keep completing
  // above it in the Done column, and each one pushes it down a card
  // height — centred, one push still leaves it fully visible, and the
  // next tick (400ms) re-centres it. No page move when it is already
  // centred.
  useEffect(() => {
    if (!open || !STEPS[stepIndex].followTaskTitle) return;
    const id = window.setInterval(() => {
      const card = document.querySelector(
        `[data-task-title="${CSS.escape(DEMO_TASK_TITLE)}"]`,
      );
      if (!card) return;
      const rect = card.getBoundingClientRect();
      const vh = window.innerHeight;
      const centre = rect.top + rect.height / 2;
      if (rect.top < 0 || rect.bottom > vh || Math.abs(centre - vh / 2) > 80) {
        card.scrollIntoView({ behavior: 'auto', block: 'center' });
      }
      repositionRef.current();
    }, 400);
    return () => window.clearInterval(id);
  }, [open, stepIndex]);

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
  useEffect(
    () => () => {
      clearHighlights();
      clearCompactGrids();
    },
    [],
  );

  if (!open) return null;

  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;
  const actionDone = step.action !== undefined && doneActions.has(step.action);

  const runAction = () => {
    if (!step.action || actionDone) return;
    onDemoAction(step.action);
    setDoneActions((prev) => new Set(prev).add(step.action as DemoAction));
    // The action can change the view or grow the target (Bolt joins the
    // agent list), so re-anchor once the app has re-rendered. Step 4's
    // action switches the view to the Office and unmounts the task form,
    // so re-anchor repeatedly until the fallback task card is found and
    // settled — the card must never sit in the old bottom-centred spot.
    window.setTimeout(() => layoutRef.current(true), 120);
    window.setTimeout(() => layoutRef.current(true), 350);
    window.setTimeout(() => layoutRef.current(true), 800);
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
