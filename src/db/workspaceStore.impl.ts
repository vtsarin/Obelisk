import type { SerializedEditorState } from 'lexical';
import { getDB } from './idb';
import { CURRENT_SCHEMA_VERSION, migrateState } from './migrations';
import { newId } from '@/lib/ids';
import type { WorkspaceStore } from './interfaces';
import type {
  ID,
  FolderRecord,
  DocRecord,
  DocContent,
  VersionSnapshot,
  WorkspaceMeta,
} from '@/types/models';
import { format } from 'date-fns';

const MAX_VERSIONS = 10;

class WorkspaceStoreImpl implements WorkspaceStore {
  async init(): Promise<void> {
    const db = await getDB();
    const existing = await db.get('meta', 'singleton');
    if (!existing) {
      await db.put('meta', {
        id: 'singleton',
        lastOpenDocId: null,
        schemaVersion: CURRENT_SCHEMA_VERSION,
      });
    }
  }

  async getMeta(): Promise<WorkspaceMeta> {
    const db = await getDB();
    const meta = await db.get('meta', 'singleton');
    return (meta as WorkspaceMeta) ?? {
      id: 'singleton' as const,
      lastOpenDocId: null,
      schemaVersion: CURRENT_SCHEMA_VERSION,
    };
  }

  async setLastOpenDoc(id: ID | null): Promise<void> {
    const db = await getDB();
    const meta = await this.getMeta();
    await db.put('meta', { ...meta, lastOpenDocId: id });
  }

  async listTree(): Promise<{ folders: FolderRecord[]; docs: DocRecord[] }> {
    const db = await getDB();
    const [folders, docs] = await Promise.all([
      db.getAll('folders'),
      db.getAll('docs'),
    ]);
    return {
      folders: folders as FolderRecord[],
      docs: docs as DocRecord[],
    };
  }

  async createFolder(name: string, parentId: ID | null): Promise<FolderRecord> {
    const db = await getDB();
    const now = Date.now();
    const siblings = await db.getAllFromIndex('folders', 'by-parent', parentId);
    const folder: FolderRecord = {
      id: newId(),
      type: 'folder',
      name,
      parentId,
      order: siblings.length,
      createdAt: now,
      updatedAt: now,
    };
    await db.put('folders', folder);
    return folder;
  }

  async createDoc(title: string, parentId: ID | null): Promise<DocRecord> {
    const db = await getDB();
    const now = Date.now();
    const siblingDocs = await db.getAllFromIndex('docs', 'by-parent', parentId);
    const doc: DocRecord = {
      id: newId(),
      type: 'doc',
      title,
      parentId,
      order: siblingDocs.length,
      createdAt: now,
      updatedAt: now,
    };
    await db.put('docs', doc);

    // Create empty content
    const emptyState: SerializedEditorState = {
      root: {
        children: [],
        direction: null,
        format: '',
        indent: 0,
        type: 'root',
        version: 1,
      },
    };
    await db.put('content', {
      docId: doc.id,
      state: emptyState,
      schemaVersion: CURRENT_SCHEMA_VERSION,
    });

    // Create empty search index
    await db.put('searchIndex', {
      docId: doc.id,
      title,
      plainText: '',
    });

    return doc;
  }

  async rename(id: ID, name: string): Promise<void> {
    const db = await getDB();
    const now = Date.now();

    const folder = await db.get('folders', id);
    if (folder) {
      await db.put('folders', { ...folder, name, updatedAt: now });
      return;
    }

    const doc = await db.get('docs', id);
    if (doc) {
      await db.put('docs', { ...doc, title: name, updatedAt: now });
      // Update search index title
      const idx = await db.get('searchIndex', id);
      if (idx) {
        await db.put('searchIndex', { ...idx, title: name });
      }
    }
  }

  async move(id: ID, newParentId: ID | null, newOrder: number): Promise<void> {
    const db = await getDB();
    const now = Date.now();

    const folder = await db.get('folders', id);
    if (folder) {
      await db.put('folders', {
        ...folder,
        parentId: newParentId,
        order: newOrder,
        updatedAt: now,
      });
      return;
    }

    const doc = await db.get('docs', id);
    if (doc) {
      await db.put('docs', {
        ...doc,
        parentId: newParentId,
        order: newOrder,
        updatedAt: now,
      });
    }
  }

  async remove(id: ID): Promise<void> {
    const db = await getDB();

    // Check if it's a folder — cascade delete children
    const folder = await db.get('folders', id);
    if (folder) {
      const { folders: allFolders, docs: allDocs } = await this.listTree();
      const idsToDelete = this.collectDescendants(id, allFolders, allDocs);

      const tx = db.transaction(
        ['folders', 'docs', 'content', 'versions', 'assets', 'searchIndex'],
        'readwrite'
      );

      for (const fid of idsToDelete.folderIds) {
        tx.objectStore('folders').delete(fid);
      }
      for (const did of idsToDelete.docIds) {
        tx.objectStore('docs').delete(did);
        tx.objectStore('content').delete(did);
        tx.objectStore('searchIndex').delete(did);
        // Delete versions for this doc
        const versionIndex = tx.objectStore('versions').index('by-doc');
        let versionCursor = await versionIndex.openCursor(did);
        while (versionCursor) {
          versionCursor.delete();
          versionCursor = await versionCursor.continue();
        }
        // Delete assets for this doc
        const assetIndex = tx.objectStore('assets').index('by-doc');
        let assetCursor = await assetIndex.openCursor(did);
        while (assetCursor) {
          assetCursor.delete();
          assetCursor = await assetCursor.continue();
        }
      }

      // Delete the folder itself
      tx.objectStore('folders').delete(id);
      await tx.done;
      return;
    }

    // It's a doc
    const tx = db.transaction(
      ['docs', 'content', 'versions', 'assets', 'searchIndex'],
      'readwrite'
    );
    tx.objectStore('docs').delete(id);
    tx.objectStore('content').delete(id);
    tx.objectStore('searchIndex').delete(id);

    const versionIndex = tx.objectStore('versions').index('by-doc');
    let versionCursor = await versionIndex.openCursor(id);
    while (versionCursor) {
      versionCursor.delete();
      versionCursor = await versionCursor.continue();
    }

    const assetIndex = tx.objectStore('assets').index('by-doc');
    let assetCursor = await assetIndex.openCursor(id);
    while (assetCursor) {
      assetCursor.delete();
      assetCursor = await assetCursor.continue();
    }

    await tx.done;
  }

  private collectDescendants(
    parentId: ID,
    allFolders: FolderRecord[],
    allDocs: DocRecord[]
  ): { folderIds: ID[]; docIds: ID[] } {
    const folderIds: ID[] = [];
    const docIds: ID[] = [];

    const childFolders = allFolders.filter((f) => f.parentId === parentId);
    const childDocs = allDocs.filter((d) => d.parentId === parentId);

    for (const d of childDocs) {
      docIds.push(d.id);
    }

    for (const f of childFolders) {
      folderIds.push(f.id);
      const nested = this.collectDescendants(f.id, allFolders, allDocs);
      folderIds.push(...nested.folderIds);
      docIds.push(...nested.docIds);
    }

    return { folderIds, docIds };
  }

  async loadContent(docId: ID): Promise<DocContent | null> {
    const db = await getDB();
    const record = await db.get('content', docId);
    if (!record) return null;

    let state = record.state as SerializedEditorState;
    if (record.schemaVersion < CURRENT_SCHEMA_VERSION) {
      state = migrateState(state, record.schemaVersion);
      // Update to current version
      await db.put('content', {
        ...record,
        state,
        schemaVersion: CURRENT_SCHEMA_VERSION,
      });
    }

    return {
      docId: record.docId,
      state,
      schemaVersion: CURRENT_SCHEMA_VERSION,
    };
  }

  async saveContent(
    docId: ID,
    state: SerializedEditorState,
    plainText: string,
    title: string
  ): Promise<void> {
    const db = await getDB();
    const now = Date.now();

    const tx = db.transaction(['content', 'docs', 'searchIndex'], 'readwrite');

    tx.objectStore('content').put({
      docId,
      state,
      schemaVersion: CURRENT_SCHEMA_VERSION,
    });

    const doc = await tx.objectStore('docs').get(docId);
    if (doc) {
      tx.objectStore('docs').put({ ...doc, title, updatedAt: now });
    }

    tx.objectStore('searchIndex').put({ docId, title, plainText });

    await tx.done;
  }

  async listVersions(docId: ID): Promise<VersionSnapshot[]> {
    const db = await getDB();
    const versions = await db.getAllFromIndex('versions', 'by-doc', docId);
    return (versions as VersionSnapshot[]).sort(
      (a, b) => b.createdAt - a.createdAt
    );
  }

  async snapshot(
    docId: ID,
    state: SerializedEditorState,
    label?: string
  ): Promise<void> {
    const db = await getDB();
    const serialized = JSON.stringify(state);

    // Dedupe: check if latest snapshot is byte-identical
    const existing = await db.getAllFromIndex('versions', 'by-doc', docId);
    const sorted = existing.sort((a, b) => b.createdAt - a.createdAt);
    if (sorted.length > 0) {
      const latestBytes = JSON.stringify(sorted[0].state);
      if (latestBytes === serialized) return; // skip identical
    }

    const now = Date.now();
    const snap: VersionSnapshot = {
      id: newId(),
      docId,
      label: label ?? `Autosave ${format(now, 'HH:mm')}`,
      state,
      createdAt: now,
      bytes: new Blob([serialized]).size,
    };

    await db.put('versions', snap);

    // Prune to last MAX_VERSIONS
    if (sorted.length >= MAX_VERSIONS) {
      const toDelete = sorted.slice(MAX_VERSIONS - 1); // keep 9 + 1 new = 10
      const tx = db.transaction('versions', 'readwrite');
      for (const v of toDelete) {
        tx.store.delete(v.id);
      }
      await tx.done;
    }
  }

  async restoreVersion(versionId: ID): Promise<SerializedEditorState> {
    const db = await getDB();
    const version = await db.get('versions', versionId);
    if (!version) throw new Error(`Version ${versionId} not found`);
    return version.state as SerializedEditorState;
  }

  async labelVersion(versionId: ID, label: string): Promise<void> {
    const db = await getDB();
    const version = await db.get('versions', versionId);
    if (version) {
      await db.put('versions', { ...version, label });
    }
  }

  async deleteVersion(versionId: ID): Promise<void> {
    const db = await getDB();
    await db.delete('versions', versionId);
  }
}

export const workspaceStore = new WorkspaceStoreImpl();
