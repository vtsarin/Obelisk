import type { ID, FolderRecord, DocRecord } from '@/types/models';

/**
 * True when `candidateId` is `ancestorId` itself or nested anywhere beneath it.
 * Used to stop a folder being dropped into itself or one of its descendants.
 */
export function isDescendantOf(
  folders: FolderRecord[],
  candidateId: ID,
  ancestorId: ID
): boolean {
  if (candidateId === ancestorId) return true;
  const byId = new Map(folders.map((f) => [f.id, f]));
  let cur = byId.get(candidateId);
  while (cur) {
    if (cur.parentId === ancestorId) return true;
    cur = cur.parentId ? byId.get(cur.parentId) : undefined;
  }
  return false;
}

export type DropPosition = 'before' | 'after' | 'inside';

type Item = FolderRecord | DocRecord;

/**
 * Resolve a drag/drop gesture into the `{ parentId, order }` the moved item
 * should adopt. Reordering uses fractional orders so only the dragged row is
 * rewritten; cross-type before/after gestures fall back to appending under the
 * target's parent (folders and docs keep independent order sequences).
 */
export function computeDrop(
  dragged: Item,
  target: Item,
  position: DropPosition,
  folders: FolderRecord[],
  docs: DocRecord[]
): { parentId: ID | null; order: number } | null {
  const draggedIsFolder = dragged.type === 'folder';
  const siblingsOfType = (parentId: ID | null) =>
    (draggedIsFolder ? folders : docs)
      .filter((x) => x.parentId === parentId)
      .sort((a, b) => a.order - b.order);

  const appendUnder = (parentId: ID | null) => {
    const sibs = siblingsOfType(parentId);
    const max = sibs.reduce((m, s) => Math.max(m, s.order), -1);
    return { parentId, order: max + 1 };
  };

  if (position === 'inside') {
    if (target.type !== 'folder') return null;
    if (draggedIsFolder && isDescendantOf(folders, target.id, dragged.id)) return null;
    return appendUnder(target.id);
  }

  // before / after — only meaningful within the same type sequence; otherwise
  // collapse to "move under the target's parent".
  if (target.type !== dragged.type) {
    const parentId = target.parentId;
    if (draggedIsFolder && parentId !== null && isDescendantOf(folders, parentId, dragged.id)) {
      return null;
    }
    return appendUnder(parentId);
  }

  if (draggedIsFolder && target.parentId !== null && isDescendantOf(folders, target.parentId, dragged.id)) {
    return null;
  }

  const sibs = siblingsOfType(target.parentId);
  const ti = sibs.findIndex((s) => s.id === target.id);
  if (ti === -1) return appendUnder(target.parentId);

  if (position === 'before') {
    const prev = sibs[ti - 1];
    const order = prev ? (prev.order + target.order) / 2 : target.order - 1;
    return { parentId: target.parentId, order };
  }
  const next = sibs[ti + 1];
  const order = next ? (target.order + next.order) / 2 : target.order + 1;
  return { parentId: target.parentId, order };
}
