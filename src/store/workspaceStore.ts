import { create } from 'zustand';
import type { ID, FolderRecord, DocRecord } from '@/types/models';
import { workspaceStore as db } from '@/db/workspaceStore.impl';
import { type Accent, DEFAULT_ACCENT, isAccent } from '@/lib/accents';

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

  init: async () => {
    await db.init();
    const meta = await db.getMeta();
    const { folders, docs } = await db.listTree();

    const theme = getStoredTheme();
    document.documentElement.setAttribute('data-theme', theme);
    const accent = getStoredAccent();
    document.documentElement.setAttribute('data-accent', accent);

    set({
      folders,
      docs,
      activeDocId: meta.lastOpenDocId,
      initialized: true,
      theme,
      accent,
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
    return doc;
  },

  createFolder: async (name = 'New Folder', parentId = null) => {
    const folder = await db.createFolder(name, parentId);
    await get().refreshTree();
    return folder;
  },

  renameItem: async (id, name) => {
    await db.rename(id, name);
    await get().refreshTree();
  },

  moveItem: async (id, newParentId, newOrder) => {
    await db.move(id, newParentId, newOrder);
    await get().refreshTree();
  },

  removeItem: async (id) => {
    const { activeDocId } = get();
    await db.remove(id);
    if (activeDocId === id) {
      set({ activeDocId: null });
      await db.setLastOpenDoc(null);
    }
    await get().refreshTree();
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
}));
