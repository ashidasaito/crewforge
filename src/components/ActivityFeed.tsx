/**
 * ActivityFeed — newest-first list of simulation events.
 * Each row shows the tick number (monospace), a kind icon, the event
 * text, and a relative time. The engine caps the feed at the newest
 * 200 events; the slice here is a defensive second guard.
 */
import type { FeedEvent, FeedKind } from '../lib/types';

export interface ActivityFeedProps {
  feed: FeedEvent[];
}

const KIND_ICON: Record<FeedKind, string> = {
  start: '▶',
  done: '✅',
  blocked: '⚠️',
  unblocked: '🔓',
  assign: '📌',
  system: 'ℹ️',
};

function relativeTime(at: number, now: number): string {
  const seconds = Math.max(0, Math.floor((now - at) / 1000));
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function ActivityFeed({ feed }: ActivityFeedProps) {
  const now = Date.now();
  const events = feed.slice(0, 200);

  return (
    <ul className="feed" id="activity-feed">
      {events.length === 0 ? (
        <li>
          <span className="feed-kind">ℹ️</span>
          <span>No activity yet — start the simulation to see the crew work.</span>
        </li>
      ) : (
        events.map((event) => (
          <li key={event.id}>
            <span className="feed-time">#{event.tick}</span>
            <span className="feed-kind" aria-hidden="true">
              {KIND_ICON[event.kind]}
            </span>
            <span>{event.text}</span>
            <span className="feed-time">{relativeTime(event.at, now)}</span>
          </li>
        ))
      )}
    </ul>
  );
}
