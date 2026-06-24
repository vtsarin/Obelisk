import React from 'react';
import { Menu, Sun, Moon, Download, List, History, Search, PanelTop } from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useActiveDoc } from '@/store/selectors';
import { cn } from '@/lib/cn';
import { Tooltip } from './Tooltip';
import { ObeliskMark } from './ObeliskMark';
import { AccentPicker } from './AccentPicker';

function SaveStatusChip() {
  const status = useWorkspaceStore((s) => s.saveStatus);
  if (status === 'idle') return null;

  const config = {
    saving: { label: 'Saving', dot: 'bg-amber-500', text: 'text-text-tertiary' },
    saved: { label: 'Saved', dot: 'bg-emerald-500', text: 'text-text-tertiary' },
    error: { label: 'Save failed', dot: 'bg-red-500', text: 'text-red-500' },
  }[status];

  return (
    <span className={cn('flex items-center gap-1.5 text-xs', config.text)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', config.dot, status === 'saving' && 'animate-pulse')} />
      {config.label}
    </span>
  );
}

function IconButton({
  onClick,
  label,
  shortcut,
  active,
  children,
}: {
  onClick: () => void;
  label: string;
  shortcut?: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Tooltip content={label} shortcut={shortcut} side="bottom">
      <button
        onClick={onClick}
        aria-label={label}
        className={cn(
          'flex items-center justify-center w-8 h-8 rounded-md transition-colors',
          active
            ? 'bg-accent-soft text-accent-fg'
            : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
        )}
      >
        {children}
      </button>
    </Tooltip>
  );
}

export function Header() {
  const toggleSidebar = useWorkspaceStore((s) => s.toggleSidebar);
  const sidebarOpen = useWorkspaceStore((s) => s.sidebarOpen);
  const theme = useWorkspaceStore((s) => s.theme);
  const setTheme = useWorkspaceStore((s) => s.setTheme);
  const setCommandPaletteOpen = useWorkspaceStore((s) => s.setCommandPaletteOpen);
  const setExportDialogOpen = useWorkspaceStore((s) => s.setExportDialogOpen);
  const toggleOutline = useWorkspaceStore((s) => s.toggleOutline);
  const outlineOpen = useWorkspaceStore((s) => s.outlineOpen);
  const toggleEditorToolbar = useWorkspaceStore((s) => s.toggleEditorToolbar);
  const editorToolbarOpen = useWorkspaceStore((s) => s.editorToolbarOpen);
  const setVersionHistoryOpen = useWorkspaceStore((s) => s.setVersionHistoryOpen);
  const activeDoc = useActiveDoc();

  return (
    <header className="h-12 flex items-center gap-2 px-3 border-b border-surface-border bg-surface-primary shrink-0">
      <IconButton onClick={toggleSidebar} label="Toggle sidebar" active={sidebarOpen}>
        <Menu className="w-4 h-4" />
      </IconButton>

      <div className="flex items-center gap-1.5 shrink-0 pl-0.5 pr-1">
        <ObeliskMark className="w-5 h-5" />
        <span className="text-sm font-semibold text-text-primary tracking-tight hidden sm:inline">Obelisk</span>
      </div>

      <div className="flex-1 flex items-center gap-3 min-w-0">
        <span className="w-px h-4 bg-surface-border shrink-0" />
        <span className="text-sm font-medium text-text-secondary truncate">
          {activeDoc?.title || 'Untitled workspace'}
        </span>
        <SaveStatusChip />
      </div>

      <button
        onClick={() => setCommandPaletteOpen(true)}
        aria-label="Search and commands"
        className="hidden sm:flex items-center gap-2 h-8 pl-2.5 pr-1.5 mr-1 rounded-lg border border-surface-border bg-surface-secondary text-text-tertiary hover:bg-surface-hover hover:text-text-secondary transition-colors text-xs"
      >
        <Search className="w-3.5 h-3.5" />
        <span>Search</span>
        <kbd className="ml-2 rounded bg-surface-primary border border-surface-border px-1.5 py-0.5 text-[10px] font-medium text-text-secondary">⌘K</kbd>
      </button>

      <div className="flex items-center gap-0.5">
        <IconButton
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          label={theme === 'light' ? 'Dark mode' : 'Light mode'}
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </IconButton>
        <AccentPicker />
        <IconButton onClick={() => setVersionHistoryOpen(true)} label="Version history">
          <History className="w-4 h-4" />
        </IconButton>
        <IconButton onClick={() => setExportDialogOpen(true)} label="Export">
          <Download className="w-4 h-4" />
        </IconButton>
        <IconButton onClick={toggleEditorToolbar} label="Toggle formatting toolbar" active={editorToolbarOpen}>
          <PanelTop className="w-4 h-4" />
        </IconButton>
        <IconButton onClick={toggleOutline} label="Toggle outline" active={outlineOpen}>
          <List className="w-4 h-4" />
        </IconButton>
      </div>
    </header>
  );
}
