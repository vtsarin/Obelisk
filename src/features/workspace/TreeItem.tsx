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

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const msg = isFolder
      ? `Delete folder "${label}" and all its contents?`
      : `Delete "${label}"?`;
    if (confirm(msg)) {
      await removeItem(item.id);
    }
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
          'group flex items-center gap-1.5 px-2 py-1 rounded-md cursor-pointer text-sm',
          'hover:bg-surface-hover transition-colors',
          isActive && 'bg-accent-500/10 text-accent-600 font-medium'
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={handleClick}
        onDoubleClick={handleRename}
      >
        {isFolder && (
          <ChevronRight
            className={cn(
              'w-3.5 h-3.5 text-text-tertiary transition-transform shrink-0',
              expanded && 'rotate-90'
            )}
          />
        )}
        {!isFolder && <div className="w-3.5" />}

        {isFolder ? (
          expanded ? (
            <FolderOpen className="w-4 h-4 text-accent-500 shrink-0" />
          ) : (
            <Folder className="w-4 h-4 text-accent-500 shrink-0" />
          )
        ) : (
          <FileText className="w-4 h-4 text-text-tertiary shrink-0" />
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
    </div>
  );
}
