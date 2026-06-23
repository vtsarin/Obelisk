import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { Search, FileText, FolderOpen, Plus, Download, Upload, Moon, Sun, History, Pencil } from 'lucide-react';
import Fuse from 'fuse.js';
import { cn } from '@/lib/cn';
import { blockPalette, insertBlock, type BlockPaletteItem } from '@/editor/commands/insertBlock';

interface CommandItem {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  group: 'navigate' | 'actions' | 'insert';
  action: () => void;
}

export function CommandPalette() {
  const open = useWorkspaceStore((s) => s.commandPaletteOpen);
  const setOpen = useWorkspaceStore((s) => s.setCommandPaletteOpen);
  const docs = useWorkspaceStore((s) => s.docs);
  const folders = useWorkspaceStore((s) => s.folders);
  const setActiveDoc = useWorkspaceStore((s) => s.setActiveDoc);
  const createDoc = useWorkspaceStore((s) => s.createDoc);
  const createFolder = useWorkspaceStore((s) => s.createFolder);
  const theme = useWorkspaceStore((s) => s.theme);
  const setTheme = useWorkspaceStore((s) => s.setTheme);
  const setVersionHistoryOpen = useWorkspaceStore((s) => s.setVersionHistoryOpen);
  const setExportDialogOpen = useWorkspaceStore((s) => s.setExportDialogOpen);

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands = useMemo<CommandItem[]>(() => {
    const items: CommandItem[] = [];

    // Navigate — open docs
    for (const doc of docs) {
      items.push({
        id: `nav-${doc.id}`,
        label: doc.title || 'Untitled',
        description: 'Open document',
        icon: <FileText className="w-4 h-4" />,
        group: 'navigate',
        action: () => {
          setActiveDoc(doc.id);
          setOpen(false);
        },
      });
    }

    // Actions
    items.push({
      id: 'action-new-doc',
      label: 'New Document',
      description: 'Create a new document',
      icon: <Plus className="w-4 h-4" />,
      group: 'actions',
      action: () => { createDoc(); setOpen(false); },
    });
    items.push({
      id: 'action-new-folder',
      label: 'New Folder',
      description: 'Create a new folder',
      icon: <FolderOpen className="w-4 h-4" />,
      group: 'actions',
      action: () => { createFolder(); setOpen(false); },
    });
    items.push({
      id: 'action-toggle-theme',
      label: `Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`,
      description: 'Toggle theme',
      icon: theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />,
      group: 'actions',
      action: () => { setTheme(theme === 'light' ? 'dark' : 'light'); setOpen(false); },
    });
    items.push({
      id: 'action-export',
      label: 'Export…',
      description: 'Export current document',
      icon: <Download className="w-4 h-4" />,
      group: 'actions',
      action: () => { setExportDialogOpen(true); setOpen(false); },
    });
    items.push({
      id: 'action-version-history',
      label: 'Version History',
      description: 'View document versions',
      icon: <History className="w-4 h-4" />,
      group: 'actions',
      action: () => { setVersionHistoryOpen(true); setOpen(false); },
    });

    // Insert — mirror block palette
    for (const block of blockPalette) {
      items.push({
        id: `insert-${block.type}`,
        label: `Insert ${block.label}`,
        description: block.description,
        icon: <Plus className="w-4 h-4" />,
        group: 'insert',
        action: () => {
          // Need editor reference — dispatch via window event
          window.dispatchEvent(new CustomEvent('obelisk:insert-block', { detail: { type: block.type } }));
          setOpen(false);
        },
      });
    }

    return items;
  }, [docs, folders, theme, setActiveDoc, setOpen, createDoc, createFolder, setTheme, setExportDialogOpen, setVersionHistoryOpen]);

  const fuse = useMemo(() => new Fuse(commands, {
    keys: ['label', 'description'],
    threshold: 0.4,
  }), [commands]);

  const results = useMemo(() => {
    if (!query) return commands;
    return fuse.search(query).map((r) => r.item);
  }, [query, commands, fuse]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      results[selectedIndex]?.action();
    }
  }, [results, selectedIndex]);

  const groupLabels: Record<string, string> = {
    navigate: 'Navigate',
    actions: 'Actions',
    insert: 'Insert Block',
  };

  // Group results
  const grouped = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};
    for (const item of results) {
      if (!groups[item.group]) groups[item.group] = [];
      groups[item.group].push(item);
    }
    return groups;
  }, [results]);

  let flatIndex = 0;

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/30 z-50" />
        <Dialog.Content
          className="fixed top-[20%] left-1/2 -translate-x-1/2 w-[560px] max-h-[60vh] bg-surface-primary border border-surface-border rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden"
          onKeyDown={handleKeyDown}
        >
          <div className="flex items-center gap-2 px-4 py-3 border-b border-surface-border">
            <Search className="w-4 h-4 text-text-tertiary shrink-0" />
            <Dialog.Title className="sr-only">Command Palette</Dialog.Title>
            <input
              ref={inputRef}
              className="flex-1 bg-transparent outline-none text-sm text-text-primary placeholder:text-text-tertiary"
              placeholder="Type a command…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <kbd className="text-xs text-text-tertiary bg-surface-tertiary px-1.5 py-0.5 rounded">Esc</kbd>
          </div>

          <div className="flex-1 overflow-y-auto py-1">
            {results.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-text-tertiary">
                No results found
              </div>
            )}
            {(['navigate', 'actions', 'insert'] as const).map((group) => {
              const items = grouped[group];
              if (!items || items.length === 0) return null;
              return (
                <div key={group}>
                  <div className="px-4 py-1.5 text-xs font-medium text-text-tertiary uppercase tracking-wider">
                    {groupLabels[group]}
                  </div>
                  {items.map((item) => {
                    const idx = flatIndex++;
                    return (
                      <button
                        key={item.id}
                        className={cn(
                          'w-full flex items-center gap-3 px-4 py-2 text-left text-sm transition-colors',
                          idx === selectedIndex
                            ? 'bg-accent-500/10 text-accent-600'
                            : 'text-text-primary hover:bg-surface-hover'
                        )}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        onClick={item.action}
                      >
                        <span className="text-text-tertiary shrink-0">{item.icon}</span>
                        <div className="min-w-0 flex-1">
                          <span className="font-medium">{item.label}</span>
                          <span className="ml-2 text-xs text-text-tertiary">{item.description}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
