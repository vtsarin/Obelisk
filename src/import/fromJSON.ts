import type { SerializedEditorState } from 'lexical';
import type { ObeliskJSONExport } from '@/features/export/toJSON';
import { CURRENT_SCHEMA_VERSION, migrateState } from '@/db/migrations';

export interface JSONImportResult {
  state: SerializedEditorState;
  title: string;
}

export function importFromJSON(jsonString: string): JSONImportResult {
  const data = JSON.parse(jsonString) as ObeliskJSONExport;

  if (!data.state || !data.schemaVersion) {
    throw new Error('Invalid Obelisk JSON format: missing state or schemaVersion');
  }

  let state = data.state;
  if (data.schemaVersion < CURRENT_SCHEMA_VERSION) {
    state = migrateState(state, data.schemaVersion);
  }

  return {
    state,
    title: data.doc?.title ?? 'Imported Document',
  };
}
