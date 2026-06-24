import React, { useEffect, useState } from 'react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useActiveDoc } from '@/store/selectors';
import { workspaceStore } from '@/db/workspaceStore.impl';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Sidebar } from '@/features/workspace/Sidebar';
import { Editor } from '@/editor/Editor';
import { Outline } from '@/features/outline/Outline';
import { Breadcrumb } from '@/features/breadcrumb/Breadcrumb';
import { CommandPalette } from '@/features/commandPalette/CommandPalette';
import { VersionHistory } from '@/features/versions/VersionHistory';
import { ExportDialog } from '@/features/export/ExportDialog';
import { cn } from '@/lib/cn';
import type { SerializedEditorState } from 'lexical';
import { FileText } from 'lucide-react';

function EditorArea() {
  const activeDoc = useActiveDoc();
  const activeDocId = useWorkspaceStore((s) => s.activeDocId);
  const createDoc = useWorkspaceStore((s) => s.createDoc);
  const [initialState, setInitialState] = useState<SerializedEditorState | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);
  const [loadedDocId, setLoadedDocId] = useState<string | null>(null);

  useEffect(() => {
    if (!activeDocId) {
      setInitialState(null);
      setLoadedDocId(null);
      return;
    }

    let cancelled = false;
    setLoadingContent(true);

    workspaceStore.loadContent(activeDocId).then((content) => {
      if (cancelled) return;
      setInitialState(content?.state ?? null);
      setLoadedDocId(activeDocId);
      setLoadingContent(false);
    });

    return () => {
      cancelled = true;
    };
  }, [activeDocId]);

  if (!activeDocId || !activeDoc) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-surface-canvas px-6">
        <div className="flex flex-col items-center gap-5 max-w-sm text-center animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-surface-primary border border-surface-border shadow-sm flex items-center justify-center">
            <FileText className="w-7 h-7 text-accent-fg" />
          </div>
          <div>
            <p className="text-lg font-semibold text-text-primary">Nothing open yet</p>
            <p className="text-sm mt-1.5 text-text-secondary leading-relaxed">
              Pick a document from the sidebar, or start a fresh page. Press{' '}
              <kbd className="px-1.5 py-0.5 rounded bg-surface-tertiary text-text-secondary text-xs font-medium">⌘K</kbd>{' '}
              anytime to jump around.
            </p>
          </div>
          <button
            onClick={() => createDoc()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-text-inverse text-sm font-medium shadow-sm hover:bg-accent-hover transition-colors"
          >
            <FileText className="w-4 h-4" />
            New document
          </button>
        </div>
      </div>
    );
  }

  if (loadingContent || loadedDocId !== activeDocId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-surface-canvas text-text-tertiary">
        <div className="flex items-center gap-2.5 animate-fade-in">
          <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Loading document…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-surface-canvas">
      <Editor docId={activeDocId} initialState={initialState} />
    </div>
  );
}

export default function App() {
  const init = useWorkspaceStore((s) => s.init);
  const initialized = useWorkspaceStore((s) => s.initialized);
  const sidebarOpen = useWorkspaceStore((s) => s.sidebarOpen);
  const outlineOpen = useWorkspaceStore((s) => s.outlineOpen);
  const activeDocId = useWorkspaceStore((s) => s.activeDocId);
  const setCommandPaletteOpen = useWorkspaceStore((s) => s.setCommandPaletteOpen);

  useEffect(() => {
    init();
  }, [init]);

  // Global Cmd/Ctrl+K handler
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setCommandPaletteOpen]);

  if (!initialized) {
    return (
      <div className="h-full flex items-center justify-center bg-surface-canvas">
        <div className="flex flex-col items-center gap-3 animate-fade-in">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-text-tertiary">Loading Obelisk…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell h-full flex flex-col bg-surface-canvas">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        {sidebarOpen && (
          <aside className="sidebar w-[264px] shrink-0">
            <Sidebar />
          </aside>
        )}
        <main className="flex-1 flex flex-col overflow-hidden min-w-0">
          <Breadcrumb />
          <EditorArea />
        </main>
        {outlineOpen && activeDocId && (
          <aside className="outline-sidebar w-60 shrink-0">
            <Outline />
          </aside>
        )}
      </div>
      <Footer />
      <CommandPalette />
      <VersionHistory />
      <ExportDialog />
    </div>
  );
}
