import { create } from 'zustand';
import type { ID, FolderRecord, DocRecord } from '@/types/models';
import { workspaceStore as db } from '@/db/workspaceStore.impl';
import { assetStore } from '@/db/assetStore.impl';
import { loadDirHandle, saveDirHandle } from '@/db/fsHandle';
import { syncWorkspaceToDirectory } from '@/features/diskSync/syncToDirectory';
import { type Accent, DEFAULT_ACCENT, isAccent } from '@/lib/accents';

export type DiskStatus = 'idle' | 'syncing' | 'saved' | 'error' | 'denied';
const diskSupported = typeof window !== 'undefined' && 'showDirectoryPicker' in window;

async function ensureRWPermission(handle: FileSystemDirectoryHandle): Promise<boolean> {
  const opts = { mode: 'readwrite' as const };
  if ((await handle.queryPermission?.(opts)) === 'granted') return true;
  return (await handle.requestPermission?.(opts)) === 'granted';
}

export type Theme = 'light' | 'dark';
export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface WorkspaceState {
  // Data
  folders: FolderRecord[];
  docs: DocRecord[];
  activeDocId: ID | null;
  initialized: boolean;
  draggingId: ID | null;

  // UI
  theme: Theme;
  accent: Accent;
  sidebarOpen: boolean;
  outlineOpen: boolean;
  editorToolbarOpen: boolean;
  saveStatus: SaveStatus;
  commandPaletteOpen: boolean;
  versionHistoryOpen: boolean;
  exportDialogOpen: boolean;

  // Save-to-disk (File System Access)
  diskSupported: boolean;
  diskConnected: boolean;
  diskDirty: boolean;
  diskStatus: DiskStatus;

  // Actions
  init: () => Promise<void>;
  refreshTree: () => Promise<void>;
  setActiveDoc: (id: ID | null) => Promise<void>;
  createDoc: (title?: string, parentId?: ID | null) => Promise<DocRecord>;
  createFolder: (name?: string, parentId?: ID | null) => Promise<FolderRecord>;
  renameItem: (id: ID, name: string) => Promise<void>;
  moveItem: (id: ID, newParentId: ID | null, newOrder: number) => Promise<void>;
  removeItem: (id: ID) => Promise<void>;
  setTheme: (theme: Theme) => void;
  setAccent: (accent: Accent) => void;
  toggleSidebar: () => void;
  toggleOutline: () => void;
  toggleEditorToolbar: () => void;
  setSaveStatus: (status: SaveStatus) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setVersionHistoryOpen: (open: boolean) => void;
  setExportDialogOpen: (open: boolean) => void;
  setDraggingId: (id: ID | null) => void;
  markDiskDirty: () => void;
  saveToDisk: () => Promise<void>;
}

function getStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem('obelisk-theme');
    if (stored === 'dark' || stored === 'light') return stored;
  } catch {
    // ignore
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getStoredAccent(): Accent {
  try {
    const stored = localStorage.getItem('obelisk-accent');
    if (isAccent(stored)) return stored;
  } catch {
    // ignore
  }
  return DEFAULT_ACCENT;
}

function getStoredBool(key: string, fallback: boolean): boolean {
  try {
    const stored = localStorage.getItem(key);
    if (stored === 'true') return true;
    if (stored === 'false') return false;
  } catch {
    // ignore
  }
  return fallback;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  folders: [],
  docs: [],
  activeDocId: null,
  initialized: false,
  draggingId: null,

  theme: getStoredTheme(),
  accent: getStoredAccent(),
  sidebarOpen: true,
  outlineOpen: getStoredBool('obelisk-outline', false),
  editorToolbarOpen: getStoredBool('obelisk-toolbar', true),
  saveStatus: 'idle',
  commandPaletteOpen: false,
  versionHistoryOpen: false,
  exportDialogOpen: false,

  diskSupported,
  diskConnected: false,
  diskDirty: getStoredBool('obelisk-disk-dirty', false),
  diskStatus: 'idle',

  init: async () => {
    // Ask the browser to keep IndexedDB durable (never evicted under pressure).
    try {
      await navigator.storage?.persist?.();
    } catch {
      // best-effort
    }

    await db.init();
    const meta = await db.getMeta();
    const { folders, docs } = await db.listTree();

    const theme = getStoredTheme();
    document.documentElement.setAttribute('data-theme', theme);
    const accent = getStoredAccent();
    document.documentElement.setAttribute('data-accent', accent);

    // A previously-picked disk folder reconnects automatically (permission is
    // re-granted on the first save this session).
    let diskConnected = false;
    if (diskSupported) {
      try {
        diskConnected = !!(await loadDirHandle());
      } catch {
        diskConnected = false;
      }
    }

    set({
      folders,
      docs,
      activeDocId: meta.lastOpenDocId,
      initialized: true,
      theme,
      accent,
      diskConnected,
    });
  },

  refreshTree: async () => {
    const { folders, docs } = await db.listTree();
    set({ folders, docs });
  },

  setActiveDoc: async (id) => {
    set({ activeDocId: id });
    await db.setLastOpenDoc(id);
  },

  createDoc: async (title = 'Untitled', parentId = null) => {
    const doc = await db.createDoc(title, parentId);
    await get().refreshTree();
    await get().setActiveDoc(doc.id);
    get().markDiskDirty();
    return doc;
  },

  createFolder: async (name = 'New Folder', parentId = null) => {
    const folder = await db.createFolder(name, parentId);
    await get().refreshTree();
    get().markDiskDirty();
    return folder;
  },

  renameItem: async (id, name) => {
    await db.rename(id, name);
    await get().refreshTree();
    get().markDiskDirty();
  },

  moveItem: async (id, newParentId, newOrder) => {
    await db.move(id, newParentId, newOrder);
    await get().refreshTree();
    get().markDiskDirty();
  },

  removeItem: async (id) => {
    const { activeDocId } = get();
    await db.remove(id);
    if (activeDocId === id) {
      set({ activeDocId: null });
      await db.setLastOpenDoc(null);
    }
    await get().refreshTree();
    get().markDiskDirty();
  },

  setTheme: (theme) => {
    localStorage.setItem('obelisk-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    set({ theme });
  },

  setAccent: (accent) => {
    try { localStorage.setItem('obelisk-accent', accent); } catch { /* ignore */ }
    document.documentElement.setAttribute('data-accent', accent);
    set({ accent });
  },

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  toggleOutline: () =>
    set((s) => {
      const next = !s.outlineOpen;
      try { localStorage.setItem('obelisk-outline', String(next)); } catch { /* ignore */ }
      return { outlineOpen: next };
    }),
  toggleEditorToolbar: () =>
    set((s) => {
      const next = !s.editorToolbarOpen;
      try { localStorage.setItem('obelisk-toolbar', String(next)); } catch { /* ignore */ }
      return { editorToolbarOpen: next };
    }),
  setSaveStatus: (status) => set({ saveStatus: status }),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  setVersionHistoryOpen: (open) => set({ versionHistoryOpen: open }),
  setExportDialogOpen: (open) => set({ exportDialogOpen: open }),
  setDraggingId: (id) => set({ draggingId: id }),

  markDiskDirty: () => {
    if (!get().diskSupported) return;
    if (!get().diskDirty) {
      try { localStorage.setItem('obelisk-disk-dirty', 'true'); } catch { /* ignore */ }
      set({ diskDirty: true });
    }
    if (get().diskStatus === 'saved') set({ diskStatus: 'idle' });
  },

  saveToDisk: async () => {
    if (!diskSupported || get().diskStatus === 'syncing') return;
    set({ diskStatus: 'syncing' });
    try {
      let handle = await loadDirHandle();
      if (handle && !(await ensureRWPermission(handle))) {
        handle = null; // permission lost/denied — re-pick below
      }
      if (!handle) {
        // Picker + permission require a user gesture (this runs from a click).
        handle = await window.showDirectoryPicker!({ id: 'obelisk-workspace', mode: 'readwrite' });
        if (!(await ensureRWPermission(handle))) {
          set({ diskStatus: 'denied' });
          return;
        }
        await saveDirHandle(handle);
      }

      const { folders, docs } = get();
      await syncWorkspaceToDirectory(
        handle,
        {
          folders,
          docs,
          loadContent: (id) => db.loadContent(id),
          listAssets: (id) => assetStore.list(id),
          getBlob: (path) => assetStore.getBlob(path),
        },
        Date.now()
      );

      try { localStorage.setItem('obelisk-disk-dirty', 'false'); } catch { /* ignore */ }
      set({ diskConnected: true, diskDirty: false, diskStatus: 'saved' });
      setTimeout(() => {
        if (useWorkspaceStore.getState().diskStatus === 'saved') {
          useWorkspaceStore.setState({ diskStatus: 'idle' });
        }
      }, 2500);
    } catch (err) {
      // User dismissed the folder picker — not an error.
      if ((err as DOMException)?.name === 'AbortError') {
        set({ diskStatus: 'idle' });
        return;
      }
      console.error('Save to disk failed:', err);
      set({ diskStatus: 'error' });
    }
  },
}));
