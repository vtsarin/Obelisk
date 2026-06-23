import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'obelisk';
const DB_VERSION = 1;

export interface ObeliskDB {
  meta: {
    key: string;
    value: {
      id: string;
      lastOpenDocId: string | null;
      schemaVersion: number;
    };
  };
  folders: {
    key: string;
    value: {
      id: string;
      type: 'folder';
      name: string;
      parentId: string | null;
      order: number;
      createdAt: number;
      updatedAt: number;
    };
    indexes: {
      'by-parent': string | null;
    };
  };
  docs: {
    key: string;
    value: {
      id: string;
      type: 'doc';
      title: string;
      parentId: string | null;
      order: number;
      createdAt: number;
      updatedAt: number;
    };
    indexes: {
      'by-parent': string | null;
      'by-updated': number;
    };
  };
  content: {
    key: string;
    value: {
      docId: string;
      state: unknown;
      schemaVersion: number;
    };
  };
  versions: {
    key: string;
    value: {
      id: string;
      docId: string;
      label: string | null;
      state: unknown;
      createdAt: number;
      bytes: number;
    };
    indexes: {
      'by-doc': string;
      'by-doc-created': [string, number];
    };
  };
  assets: {
    key: string;
    value: {
      path: string;
      docId: string;
      blob: Blob;
      mime: string;
      createdAt: number;
    };
    indexes: {
      'by-doc': string;
    };
  };
  searchIndex: {
    key: string;
    value: {
      docId: string;
      title: string;
      plainText: string;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<ObeliskDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<ObeliskDB>> {
  if (!dbPromise) {
    dbPromise = openDB<ObeliskDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // meta store
        if (!db.objectStoreNames.contains('meta')) {
          db.createObjectStore('meta', { keyPath: 'id' });
        }

        // folders store
        if (!db.objectStoreNames.contains('folders')) {
          const folders = db.createObjectStore('folders', { keyPath: 'id' });
          folders.createIndex('by-parent', 'parentId');
        }

        // docs store
        if (!db.objectStoreNames.contains('docs')) {
          const docs = db.createObjectStore('docs', { keyPath: 'id' });
          docs.createIndex('by-parent', 'parentId');
          docs.createIndex('by-updated', 'updatedAt');
        }

        // content store
        if (!db.objectStoreNames.contains('content')) {
          db.createObjectStore('content', { keyPath: 'docId' });
        }

        // versions store
        if (!db.objectStoreNames.contains('versions')) {
          const versions = db.createObjectStore('versions', { keyPath: 'id' });
          versions.createIndex('by-doc', 'docId');
          versions.createIndex('by-doc-created', ['docId', 'createdAt']);
        }

        // assets store
        if (!db.objectStoreNames.contains('assets')) {
          const assets = db.createObjectStore('assets', { keyPath: 'path' });
          assets.createIndex('by-doc', 'docId');
        }

        // searchIndex store
        if (!db.objectStoreNames.contains('searchIndex')) {
          db.createObjectStore('searchIndex', { keyPath: 'docId' });
        }
      },
    });
  }
  return dbPromise;
}
