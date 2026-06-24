import React from 'react';
import { Plus, FolderPlus, FileText } from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useRootItems } from '@/store/selectors';
import { TreeItem } from './TreeItem';
import { WorkspaceSearch } from './WorkspaceSearch';
import { Tooltip } from '@/components/Tooltip';

export function Sidebar() {
  const createDoc = useWorkspaceStore((s) => s.createDoc);
  const createFolder = useWorkspaceStore((s) => s.createFolder);
  const moveItem = useWorkspaceStore((s) => s.moveItem);
  const draggingId = useWorkspaceStore((s) => s.draggingId);
  const setDraggingId = useWorkspaceStore((s) => s.setDraggingId);
  const allFolders = useWorkspaceStore((s) => s.folders);
  const allDocs = useWorkspaceStore((s) => s.docs);
  const { folders, docs } = useRootItems();

  // Dropping on empty tree space moves an item to the workspace root.
  const handleRootDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (draggingId) e.preventDefault();
  };

  const handleRootDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain') || draggingId;
    if (!id) return;
    const dragged = allFolders.find((f) => f.id === id) ?? allDocs.find((d) => d.id === id);
    if (!dragged || dragged.parentId === null) {
      setDraggingId(null);
      return;
    }
    const sibs = (dragged.type === 'folder' ? allFolders : allDocs).filter((x) => x.parentId === null);
    const order = sibs.reduce((m, s) => Math.max(m, s.order), -1) + 1;
    moveItem(id, null, order);
    setDraggingId(null);
  };

  return (
    <div className="h-full flex flex-col bg-surface-secondary border-r border-surface-border">
      {/* Header */}
      <div className="flex items-center justify-between px-3 h-12 shrink-0 border-b border-surface-border">
        <span className="text-[13px] font-semibold text-text-secondary uppercase tracking-wider">
          Workspace
        </span>
        <div className="flex items-center gap-0.5">
          <Tooltip content="New document" side="bottom">
            <button
              onClick={() => createDoc()}
              aria-label="New document"
              className="flex items-center justify-center w-7 h-7 rounded-md text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </Tooltip>
          <Tooltip content="New folder" side="bottom">
            <button
              onClick={() => createFolder()}
              aria-label="New folder"
              className="flex items-center justify-center w-7 h-7 rounded-md text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
            >
              <FolderPlus className="w-4 h-4" />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-2.5">
        <WorkspaceSearch />
      </div>

      {/* Tree */}
      <div
        className="flex-1 overflow-y-auto px-2 pb-2"
        onDragOver={handleRootDragOver}
        onDrop={handleRootDrop}
      >
        {folders.length === 0 && docs.length === 0 ? (
          <div className="px-3 py-10 text-center">
            <div className="mx-auto w-10 h-10 rounded-xl bg-surface-tertiary flex items-center justify-center mb-3">
              <FileText className="w-5 h-5 text-text-tertiary" />
            </div>
            <p className="text-sm text-text-secondary">No documents yet</p>
            <button
              onClick={() => createDoc()}
              className="mt-2 text-sm text-accent-fg hover:underline font-medium"
            >
              Create your first doc
            </button>
          </div>
        ) : (
          <div className="space-y-px">
            {folders.map((f) => (
              <TreeItem key={f.id} item={f} />
            ))}
            {docs.map((d) => (
              <TreeItem key={d.id} item={d} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
