import React from 'react';
import {
  Menu,
  Sun,
  Moon,
  Download,
  Command,
  List,
  History,
} from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useActiveDoc } from '@/store/selectors';
import { cn } from '@/lib/cn';

function SaveStatusChip() {
  const status = useWorkspaceStore((s) => s.saveStatus);
  if (status === 'idle') return null;

  const label = {
    saving: 'Saving…',
    saved: 'Saved',
    error: 'Save failed',
  }[status];

  return (
    <span
      className={cn(
        'text-xs px-2 py-0.5 rounded-full transition-opacity',
        status === 'saving' && 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        status === 'saved' && 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        status === 'error' && 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      )}
    >
      {label}
    </span>
  );
}

export function Header() {
  const toggleSidebar = useWorkspaceStore((s) => s.toggleSidebar);
  const theme = useWorkspaceStore((s) => s.theme);
  const setTheme = useWorkspaceStore((s) => s.setTheme);
  const setCommandPaletteOpen = useWorkspaceStore((s) => s.setCommandPaletteOpen);
  const setExportDialogOpen = useWorkspaceStore((s) => s.setExportDialogOpen);
  const toggleOutline = useWorkspaceStore((s) => s.toggleOutline);
  const outlineOpen = useWorkspaceStore((s) => s.outlineOpen);
  const setVersionHistoryOpen = useWorkspaceStore((s) => s.setVersionHistoryOpen);
  const activeDoc = useActiveDoc();

  return (
    <header className="header h-12 flex items-center gap-3 px-3 border-b border-surface-border bg-surface-primary shrink-0">
      <button
        onClick={toggleSidebar}
        className="p-1.5 rounded hover:bg-surface-hover transition-colors"
        title="Toggle sidebar"
        aria-label="Toggle sidebar"
      >
        <Menu className="w-4 h-4 text-text-secondary" />
      </button>

      <div className="flex-1 flex items-center gap-3 min-w-0">
        <span className="text-sm font-medium text-text-primary truncate">
          {activeDoc?.title || 'Obelisk'}
        </span>
        <SaveStatusChip />
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          className="p-1.5 rounded hover:bg-surface-hover transition-colors"
          title="Toggle theme"
          aria-label="Toggle theme"
        >
          {theme === 'light' ? (
            <Moon className="w-4 h-4 text-text-secondary" />
          ) : (
            <Sun className="w-4 h-4 text-text-secondary" />
          )}
        </button>

        <button
          onClick={() => setVersionHistoryOpen(true)}
          className="p-1.5 rounded hover:bg-surface-hover transition-colors"
          title="Version History"
          aria-label="Version History"
        >
          <History className="w-4 h-4 text-text-secondary" />
        </button>

        <button
          onClick={() => setExportDialogOpen(true)}
          className="p-1.5 rounded hover:bg-surface-hover transition-colors"
          title="Export"
          aria-label="Export"
        >
          <Download className="w-4 h-4 text-text-secondary" />
        </button>

        <button
          onClick={toggleOutline}
          className={cn('p-1.5 rounded hover:bg-surface-hover transition-colors', outlineOpen && 'bg-accent-500/10')}
          title="Toggle Outline"
          aria-label="Toggle Outline"
        >
          <List className="w-4 h-4 text-text-secondary" />
        </button>

        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="flex items-center gap-1 px-2 py-1 rounded hover:bg-surface-hover transition-colors text-xs text-text-tertiary"
          title="Command palette (⌘K)"
          aria-label="Command palette"
        >
          <Command className="w-3 h-3" />
          <span>K</span>
        </button>
      </div>
    </header>
  );
}
