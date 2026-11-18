/**
 * CrewForge — persistence.
 * All state lives in localStorage. No server, no accounts, no network.
 */
import type { AppState } from './types';
import { buildSeedState } from './seed';

export const STORAGE_KEY = 'crewforge-state-v1';

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return buildSeedState();
    const parsed = JSON.parse(raw) as AppState;
    if (!Array.isArray(parsed.agents) || !Array.isArray(parsed.tasks)) {
      return buildSeedState();
    }
    return parsed;
  } catch {
    return buildSeedState();
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or unavailable (private mode) — the app keeps working
    // in memory for the session; nothing else to do.
  }
}

export function exportState(state: AppState): string {
  return JSON.stringify(state, null, 2);
}

export function importState(json: string): AppState | null {
  try {
    const parsed = JSON.parse(json) as AppState;
    if (!Array.isArray(parsed.agents) || !Array.isArray(parsed.tasks)) return null;
    if (!parsed.sim || typeof parsed.sim.tick !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}
