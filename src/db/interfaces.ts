import type { SerializedEditorState } from 'lexical';
import type {
  ID,
  FolderRecord,
  DocRecord,
  DocContent,
  VersionSnapshot,
  AssetRecord,
  WorkspaceMeta,
} from '@/types/models';

export interface WorkspaceStore {
  init(): Promise<void>;
  getMeta(): Promise<WorkspaceMeta>;
  setLastOpenDoc(id: ID | null): Promise<void>;

  listTree(): Promise<{ folders: FolderRecord[]; docs: DocRecord[] }>;
  createFolder(name: string, parentId: ID | null): Promise<FolderRecord>;
  createDoc(title: string, parentId: ID | null): Promise<DocRecord>;
  rename(id: ID, name: string): Promise<void>;
  move(id: ID, newParentId: ID | null, newOrder: number): Promise<void>;
  remove(id: ID): Promise<void>;

  loadContent(docId: ID): Promise<DocContent | null>;
  saveContent(
    docId: ID,
    state: SerializedEditorState,
    plainText: string,
    title: string
  ): Promise<void>;

  listVersions(docId: ID): Promise<VersionSnapshot[]>;
  snapshot(
    docId: ID,
    state: SerializedEditorState,
    label?: string
  ): Promise<void>;
  restoreVersion(versionId: ID): Promise<SerializedEditorState>;
  labelVersion(versionId: ID, label: string): Promise<void>;
  deleteVersion(versionId: ID): Promise<void>;
}

export interface AssetStore {
  put(docId: ID, file: File | Blob, filename?: string): Promise<string>;
  getURL(path: string): Promise<string>;
  getBlob(path: string): Promise<Blob | null>;
  list(docId: ID): Promise<AssetRecord[]>;
  remove(path: string): Promise<void>;
  destroy(): void;
}
