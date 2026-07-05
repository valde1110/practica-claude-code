import { SCHEMA_VERSION } from "../types/models";
import type { AppState } from "../types/models";

/**
 * Each entry transforms the payload from the key's version to key+1.
 * Example for a future v1 -> v2 change (adding a `currency` field):
 *   1: (old) => ({ ...old, currency: "EUR" }),
 */
const MIGRATIONS: Record<number, (old: unknown) => unknown> = {};

export function runMigrations(fromVersion: number, state: unknown): AppState {
  let version = fromVersion;
  let payload = state;
  while (version < SCHEMA_VERSION) {
    const migrate = MIGRATIONS[version];
    if (!migrate) break;
    payload = migrate(payload);
    version++;
  }
  return payload as AppState;
}
