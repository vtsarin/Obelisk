import type { SerializedEditorState } from 'lexical';

export const CURRENT_SCHEMA_VERSION = 1;

type MigrationFn = (state: SerializedEditorState) => SerializedEditorState;

const migrations: Record<number, MigrationFn> = {
  // Example: 1 → 2 migration
  // 2: (state) => { /* transform node shapes */ return state; },
};

export function migrateState(
  state: SerializedEditorState,
  fromVersion: number
): SerializedEditorState {
  let current = state;
  for (let v = fromVersion + 1; v <= CURRENT_SCHEMA_VERSION; v++) {
    const fn = migrations[v];
    if (fn) {
      current = fn(current);
    }
  }
  return current;
}
