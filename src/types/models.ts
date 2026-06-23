import type { SerializedEditorState } from 'lexical';

export type ID = string; // uuid v4

export interface FolderRecord {
  id: ID;
  type: 'folder';
  name: string;
  parentId: ID | null;
  order: number;
  createdAt: number;
  updatedAt: number;
}

export interface DocRecord {
  id: ID;
  type: 'doc';
  title: string;
  parentId: ID | null;
  order: number;
  createdAt: number;
  updatedAt: number;
}

export interface DocContent {
  docId: ID;
  state: SerializedEditorState;
  schemaVersion: number;
}

export interface VersionSnapshot {
  id: ID;
  docId: ID;
  label: string | null;
  state: SerializedEditorState;
  createdAt: number;
  bytes: number;
}

export interface AssetRecord {
  path: string;
  docId: ID;
  blob: Blob;
  mime: string;
  createdAt: number;
}

export interface WorkspaceMeta {
  id: 'singleton';
  lastOpenDocId: ID | null;
  schemaVersion: number;
}

export interface SearchIndexRecord {
  docId: ID;
  title: string;
  plainText: string;
}
