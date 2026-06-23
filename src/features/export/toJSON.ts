import type { SerializedEditorState } from 'lexical';
import type { DocRecord } from '@/types/models';
import { CURRENT_SCHEMA_VERSION } from '@/db/migrations';
import { saveAs } from 'file-saver';
import { slug } from '@/lib/slug';
import { format } from 'date-fns';

export interface ObeliskJSONExport {
  schemaVersion: number;
  doc: {
    id: string;
    title: string;
    createdAt: number;
    updatedAt: number;
  };
  state: SerializedEditorState;
}

export function exportToJSON(
  doc: DocRecord,
  state: SerializedEditorState
): void {
  const payload: ObeliskJSONExport = {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    doc: {
      id: doc.id,
      title: doc.title,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    },
    state,
  };

  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const filename = `${slug(doc.title)}-${format(Date.now(), 'yyyyMMdd')}.json`;
  saveAs(blob, filename);
}
