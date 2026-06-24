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
import { computeDrop, type DropPosition } from '@/lib/tree';
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
  const [dropPos, setDropPos] = useState<DropPosition | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeDocId = useWorkspaceStore((s) => s.activeDocId);
  const setActiveDoc = useWorkspaceStore((s) => s.setActiveDoc);
  const renameItem = useWorkspaceStore((s) => s.renameItem);
  const removeItem = useWorkspaceStore((s) => s.removeItem);
  const moveItem = useWorkspaceStore((s) => s.moveItem);
  const folders = useWorkspaceStore((s) => s.folders);
  const docs = useWorkspaceStore((s) => s.docs);
  const draggingId = useWorkspaceStore((s) => s.draggingId);
  const setDraggingId = useWorkspaceStore((s) => s.setDraggingId);

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

  // ── Drag & drop reorder / move ──
  const findDragged = (id: string) =>
    folders.find((f) => f.id === id) ?? docs.find((d) => d.id === id);

  const positionFromEvent = (e: React.DragEvent<HTMLDivElement>): DropPosition => {
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const h = rect.height;
    if (isFolder) {
      if (y < h * 0.25) return 'before';
      if (y > h * 0.75) return 'after';
      return 'inside';
    }
    return y < h * 0.5 ? 'before' : 'after';
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', item.id);
    setDraggingId(item.id);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (!draggingId || draggingId === item.id) return;
    const dragged = findDragged(draggingId);
    if (!dragged) return;
    const pos = positionFromEvent(e);
    if (!computeDrop(dragged, item, pos, folders, docs)) {
      setDropPos(null);
      e.dataTransfer.dropEffect = 'none';
      return;
    }
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropPos(pos);
  };

  const handleDragLeave = () => setDropPos(null);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDropPos(null);
    const dragId = e.dataTransfer.getData('text/plain') || draggingId;
    if (!dragId || dragId === item.id) return;
    const dragged = findDragged(dragId);
    if (!dragged) return;
    const pos = positionFromEvent(e);
    const result = computeDrop(dragged, item, pos, folders, docs);
    if (!result) return;
    moveItem(dragId, result.parentId, result.order);
    setDraggingId(null);
    if (pos === 'inside') setExpanded(true);
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
            : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary',
          dropPos === 'inside' && 'ring-2 ring-inset ring-accent bg-accent-soft',
          draggingId === item.id && 'opacity-40'
        )}
        style={{ paddingLeft: `${depth * 14 + 8}px` }}
        draggable={!editing}
        onClick={handleClick}
        onDoubleClick={handleRename}
        onDragStart={handleDragStart}
        onDragEnd={() => {
          setDraggingId(null);
          setDropPos(null);
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {dropPos === 'before' && (
          <span className="absolute left-1 right-1 -top-px h-0.5 rounded-full bg-accent pointer-events-none" />
        )}
        {dropPos === 'after' && (
          <span className="absolute left-1 right-1 -bottom-px h-0.5 rounded-full bg-accent pointer-events-none" />
        )}
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
