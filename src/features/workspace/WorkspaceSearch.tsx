import React, { useState, useMemo, useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Search, FileText } from 'lucide-react';
import Fuse from 'fuse.js';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { getDB } from '@/db/idb';
import { cn } from '@/lib/cn';
import type { SearchIndexRecord } from '@/types/models';

export function WorkspaceSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchIndexRecord[]>([]);
  const [allRecords, setAllRecords] = useState<SearchIndexRecord[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const setActiveDoc = useWorkspaceStore((s) => s.setActiveDoc);

  const loadSearchIndex = useCallback(async () => {
    const db = await getDB();
    const records = await db.getAll('searchIndex');
    setAllRecords(records as SearchIndexRecord[]);
  }, []);

  const fuse = useMemo(() => new Fuse(allRecords, {
    keys: ['title', 'plainText'],
    threshold: 0.3,
    includeMatches: true,
  }), [allRecords]);

  const handleSearch = useCallback((q: string) => {
    setQuery(q);
    if (!q.trim()) {
      setResults(allRecords.slice(0, 20));
    } else {
      setResults(fuse.search(q).map((r) => r.item).slice(0, 20));
    }
    setSelectedIndex(0);
  }, [allRecords, fuse]);

  const handleOpen = useCallback(() => {
    loadSearchIndex().then(() => {
      setOpen(true);
      setQuery('');
      setResults([]);
    });
  }, [loadSearchIndex]);

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md bg-surface-tertiary text-text-tertiary text-sm cursor-pointer hover:bg-surface-hover transition-colors"
      >
        <Search className="w-3.5 h-3.5" />
        <span>Search…</span>
      </button>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/30 z-50" />
          <Dialog.Content className="fixed top-[20%] left-1/2 -translate-x-1/2 w-[500px] max-h-[50vh] bg-surface-primary border border-surface-border rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-surface-border">
              <Search className="w-4 h-4 text-text-tertiary" />
              <Dialog.Title className="sr-only">Search Documents</Dialog.Title>
              <input
                className="flex-1 bg-transparent outline-none text-sm text-text-primary placeholder:text-text-tertiary"
                placeholder="Search all documents…"
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setSelectedIndex((i) => Math.max(i - 1, 0));
                  } else if (e.key === 'Enter' && results[selectedIndex]) {
                    e.preventDefault();
                    setActiveDoc(results[selectedIndex].docId);
                    setOpen(false);
                  }
                }}
              />
            </div>

            <div className="flex-1 overflow-y-auto py-1">
              {results.length === 0 && query && (
                <div className="px-4 py-6 text-center text-sm text-text-tertiary">
                  No results found
                </div>
              )}
              {results.map((record, index) => (
                <button
                  key={record.docId}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-2 text-left text-sm transition-colors',
                    index === selectedIndex
                      ? 'bg-accent-500/10 text-accent-600'
                      : 'text-text-primary hover:bg-surface-hover'
                  )}
                  onMouseEnter={() => setSelectedIndex(index)}
                  onClick={() => {
                    setActiveDoc(record.docId);
                    setOpen(false);
                  }}
                >
                  <FileText className="w-4 h-4 text-text-tertiary shrink-0" />
                  <div className="min-w-0">
                    <div className="font-medium truncate">{record.title || 'Untitled'}</div>
                    <div className="text-xs text-text-tertiary truncate">
                      {record.plainText.slice(0, 80)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
