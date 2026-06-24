import { openDB, type IDBPDatabase } from 'idb';

// The picked workspace directory handle is persisted in its own tiny IndexedDB
// (FileSystemDirectoryHandle is structured-cloneable) so the folder reconnects
// across reloads — the user only re-grants OS permission once per session.
const DB_NAME = 'obelisk-fs';
const STORE = 'handles';
const KEY = 'workspace-dir';

let dbPromise: Promise<IDBPDatabase> | null = null;
function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
      },
    });
  }
  return dbPromise;
}

export async function saveDirHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  const db = await getDB();
  await db.put(STORE, handle, KEY);
}

export async function loadDirHandle(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const db = await getDB();
    return ((await db.get(STORE, KEY)) as FileSystemDirectoryHandle | undefined) ?? null;
  } catch {
    return null;
  }
}

export async function clearDirHandle(): Promise<void> {
  const db = await getDB();
  await db.delete(STORE, KEY);
}
