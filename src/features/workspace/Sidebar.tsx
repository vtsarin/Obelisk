import React from 'react';
import { Plus, FolderPlus } from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useRootItems } from '@/store/selectors';
import { TreeItem } from './TreeItem';
import { WorkspaceSearch } from './WorkspaceSearch';

export function Sidebar() {
  const createDoc = useWorkspaceStore((s) => s.createDoc);
  const createFolder = useWorkspaceStore((s) => s.createFolder);
  const { folders, docs } = useRootItems();

  return (
    <div className="h-full flex flex-col bg-surface-secondary border-r border-surface-border">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-surface-border">
        <span className="text-sm font-semibold text-text-primary tracking-tight">
          Workspace
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => createDoc()}
            className="p-1 rounded hover:bg-surface-hover transition-colors"
            title="New document"
          >
            <Plus className="w-4 h-4 text-text-secondary" />
          </button>
          <button
            onClick={() => createFolder()}
            className="p-1 rounded hover:bg-surface-hover transition-colors"
            title="New folder"
          >
            <FolderPlus className="w-4 h-4 text-text-secondary" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <WorkspaceSearch />
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto px-1 py-1">
        {folders.length === 0 && docs.length === 0 && (
          <div className="px-3 py-8 text-center text-sm text-text-tertiary">
            <p>No documents yet.</p>
            <button
              onClick={() => createDoc()}
              className="mt-2 text-accent-500 hover:text-accent-600 font-medium"
            >
              Create your first doc
            </button>
          </div>
        )}
        {folders.map((f) => (
          <TreeItem key={f.id} item={f} />
        ))}
        {docs.map((d) => (
          <TreeItem key={d.id} item={d} />
        ))}
      </div>
    </div>
  );
}
