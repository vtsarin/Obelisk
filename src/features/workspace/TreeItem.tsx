import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  Folder,
  FolderOpen,
  ChevronRight,
  Trash2,
  Pencil,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import type { DocRecord, FolderRecord } from '@/types/models';

interface TreeItemProps {
  item: DocRecord | FolderRecord;
  depth?: number;
  childFolders?: FolderRecord[];
  childDocs?: DocRecord[];
}

export function TreeItem({
  item,
  depth = 0,
  childFolders = [],
  childDocs = [],
}: TreeItemProps) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeDocId = useWorkspaceStore((s) => s.activeDocId);
  const setActiveDoc = useWorkspaceStore((s) => s.setActiveDoc);
  const renameItem = useWorkspaceStore((s) => s.renameItem);
  const removeItem = useWorkspaceStore((s) => s.removeItem);
  const folders = useWorkspaceStore((s) => s.folders);
  const docs = useWorkspaceStore((s) => s.docs);

  const isFolder = item.type === 'folder';
  const isActive = !isFolder && activeDocId === item.id;
  const label = isFolder ? (item as FolderRecord).name : (item as DocRecord).title;

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const handleClick = () => {
    if (isFolder) {
      setExpanded((prev) => !prev);
    } else {
      setActiveDoc(item.id);
    }
  };

  const handleRename = () => {
    setEditValue(label);
    setEditing(true);
  };

  const commitRename = async () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== label) {
      await renameItem(item.id, trimmed);
    }
    setEditing(false);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmOpen(true);
  };

  const myChildFolders = isFolder
    ? folders.filter((f) => f.parentId === item.id).sort((a, b) => a.order - b.order)
    : [];
  const myChildDocs = isFolder
    ? docs.filter((d) => d.parentId === item.id).sort((a, b) => a.order - b.order)
    : [];

  return (
    <div>
      <div
        className={cn(
          'group relative flex items-center gap-1.5 pr-1.5 py-1.5 rounded-md cursor-pointer text-sm',
          'transition-colors',
          isActive
            ? 'bg-accent-soft text-accent-fg font-medium'
            : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
        )}
        style={{ paddingLeft: `${depth * 14 + 8}px` }}
        onClick={handleClick}
        onDoubleClick={handleRename}
      >
        {isActive && (
          <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-accent" />
        )}
        {isFolder && (
          <ChevronRight
            className={cn(
              'w-3.5 h-3.5 text-text-tertiary transition-transform shrink-0',
              expanded && 'rotate-90'
            )}
          />
        )}
        {!isFolder && <div className="w-3.5 shrink-0" />}

        {isFolder ? (
          expanded ? (
            <FolderOpen className="w-4 h-4 text-accent-fg shrink-0" />
          ) : (
            <Folder className="w-4 h-4 text-accent-fg shrink-0" />
          )
        ) : (
          <FileText className={cn('w-4 h-4 shrink-0', isActive ? 'text-accent-fg' : 'text-text-tertiary')} />
        )}

        {editing ? (
          <input
            ref={inputRef}
            className="flex-1 bg-surface-primary border border-surface-border rounded px-1 py-0.5 text-sm text-text-primary outline-none"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitRename();
              if (e.key === 'Escape') setEditing(false);
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="truncate flex-1">{label || 'Untitled'}</span>
        )}

        <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRename();
            }}
            className="p-0.5 rounded hover:bg-surface-tertiary"
            title="Rename"
          >
            <Pencil className="w-3 h-3 text-text-tertiary" />
          </button>
          <button
            onClick={handleDelete}
            className="p-0.5 rounded hover:bg-surface-tertiary"
            title="Delete"
          >
            <Trash2 className="w-3 h-3 text-text-tertiary hover:text-red-500" />
          </button>
        </div>
      </div>

      {isFolder && expanded && (
        <div>
          {myChildFolders.map((f) => (
            <TreeItem key={f.id} item={f} depth={depth + 1} />
          ))}
          {myChildDocs.map((d) => (
            <TreeItem key={d.id} item={d} depth={depth + 1} />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Delete "${label || 'Untitled'}"?`}
        description={
          isFolder
            ? 'This folder and everything inside it will be permanently deleted. This cannot be undone.'
            : 'This document and its version history will be permanently deleted. This cannot be undone.'
        }
        confirmLabel="Delete"
        destructive
        onConfirm={() => removeItem(item.id)}
      />
    </div>
  );
}
