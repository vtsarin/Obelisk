import React, { useEffect, useState, useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { workspaceStore } from '@/db/workspaceStore.impl';
import type { VersionSnapshot } from '@/types/models';
import { format } from 'date-fns';
import { History, RotateCcw, Pencil, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/cn';

export function VersionHistory() {
  const open = useWorkspaceStore((s) => s.versionHistoryOpen);
  const setOpen = useWorkspaceStore((s) => s.setVersionHistoryOpen);
  const activeDocId = useWorkspaceStore((s) => s.activeDocId);

  const [versions, setVersions] = useState<VersionSnapshot[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');

  const loadVersions = useCallback(async () => {
    if (!activeDocId) return;
    const list = await workspaceStore.listVersions(activeDocId);
    setVersions(list);
  }, [activeDocId]);

  useEffect(() => {
    if (open && activeDocId) {
      loadVersions();
    }
  }, [open, activeDocId, loadVersions]);

  const handleRestore = useCallback(async (versionId: string) => {
    try {
      const state = await workspaceStore.restoreVersion(versionId);
      // Dispatch event to Editor to set state
      window.dispatchEvent(
        new CustomEvent('obelisk:restore-version', { detail: { state } })
      );
      setOpen(false);
    } catch (err) {
      console.error('Failed to restore version:', err);
    }
  }, [setOpen]);

  const handleLabel = useCallback(async (versionId: string) => {
    if (editLabel.trim()) {
      await workspaceStore.labelVersion(versionId, editLabel.trim());
      setEditingId(null);
      loadVersions();
    }
  }, [editLabel, loadVersions]);

  const handleDelete = useCallback(async (versionId: string) => {
    if (confirm('Delete this version snapshot?')) {
      await workspaceStore.deleteVersion(versionId);
      loadVersions();
    }
  }, [loadVersions]);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50 animate-overlay-show" />
        <Dialog.Content className="fixed top-[10%] right-4 w-[380px] max-h-[80vh] bg-surface-primary border border-surface-border rounded-2xl shadow-xl z-50 flex flex-col overflow-hidden animate-scale-fade">
          <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-text-tertiary" />
              <Dialog.Title className="text-sm font-semibold text-text-primary">
                Version History
              </Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <button className="p-1 rounded hover:bg-surface-hover">
                <X className="w-4 h-4 text-text-tertiary" />
              </button>
            </Dialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto">
            {versions.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-text-tertiary">
                No snapshots yet. Versions are created automatically as you edit.
              </div>
            )}
            {versions.map((v) => (
              <div
                key={v.id}
                className="px-4 py-3 border-b border-surface-border hover:bg-surface-hover transition-colors group"
              >
                <div className="flex items-center justify-between">
                  {editingId === v.id ? (
                    <input
                      className="flex-1 bg-surface-primary border border-surface-border rounded px-2 py-0.5 text-sm outline-none"
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      onBlur={() => handleLabel(v.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleLabel(v.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      autoFocus
                    />
                  ) : (
                    <span className="text-sm font-medium text-text-primary">
                      {v.label || 'Untitled snapshot'}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-text-tertiary">
                    {format(v.createdAt, 'MMM d, yyyy HH:mm')} · {(v.bytes / 1024).toFixed(1)}KB
                  </span>
                  <div className="hidden group-hover:flex items-center gap-1">
                    <button
                      onClick={() => handleRestore(v.id)}
                      className="p-1 rounded hover:bg-surface-tertiary"
                      title="Restore this version"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-text-tertiary" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(v.id);
                        setEditLabel(v.label ?? '');
                      }}
                      className="p-1 rounded hover:bg-surface-tertiary"
                      title="Rename"
                    >
                      <Pencil className="w-3.5 h-3.5 text-text-tertiary" />
                    </button>
                    <button
                      onClick={() => handleDelete(v.id)}
                      className="p-1 rounded hover:bg-surface-tertiary"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-text-tertiary hover:text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
