import { useWorkspaceStore } from './workspaceStore';
import type { DocRecord, FolderRecord } from '@/types/models';

export function useActiveDoc(): DocRecord | undefined {
  const docs = useWorkspaceStore((s) => s.docs);
  const activeDocId = useWorkspaceStore((s) => s.activeDocId);
  return docs.find((d) => d.id === activeDocId);
}

export function useRootItems(): {
  folders: FolderRecord[];
  docs: DocRecord[];
} {
  const folders = useWorkspaceStore((s) => s.folders);
  const docs = useWorkspaceStore((s) => s.docs);
  return {
    folders: folders
      .filter((f) => f.parentId === null)
      .sort((a, b) => a.order - b.order),
    docs: docs
      .filter((d) => d.parentId === null)
      .sort((a, b) => a.order - b.order),
  };
}

export function useChildItems(parentId: string): {
  folders: FolderRecord[];
  docs: DocRecord[];
} {
  const folders = useWorkspaceStore((s) => s.folders);
  const docs = useWorkspaceStore((s) => s.docs);
  return {
    folders: folders
      .filter((f) => f.parentId === parentId)
      .sort((a, b) => a.order - b.order),
    docs: docs
      .filter((d) => d.parentId === parentId)
      .sort((a, b) => a.order - b.order),
  };
}
