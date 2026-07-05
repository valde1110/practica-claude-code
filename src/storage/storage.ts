import { SCHEMA_VERSION } from "../types/models";
import type { AppState, PersistedEnvelope } from "../types/models";
import { runMigrations } from "./migrations";

const KEY = "fire-portfolio-v1";

export function load(): AppState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const envelope = JSON.parse(raw) as PersistedEnvelope;
    if (!envelope || typeof envelope.schemaVersion !== "number" || !envelope.state) return null;
    return runMigrations(envelope.schemaVersion, envelope.state);
  } catch {
    return null;
  }
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;

export function save(state: AppState): void {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const envelope: PersistedEnvelope = { schemaVersion: SCHEMA_VERSION, state };
    try {
      localStorage.setItem(KEY, JSON.stringify(envelope));
    } catch {
      /* storage unavailable (quota, private mode) — edits stay in memory for this session */
    }
  }, 300);
}

export function clear(): void {
  if (saveTimer) clearTimeout(saveTimer);
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
