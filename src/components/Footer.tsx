import React from 'react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useActiveDoc } from '@/store/selectors';
import { format } from 'date-fns';

export function Footer() {
  const activeDoc = useActiveDoc();
  const saveStatus = useWorkspaceStore((s) => s.saveStatus);

  return (
    <footer className="footer h-7 flex items-center justify-between px-4 text-xs text-text-tertiary border-t border-surface-border bg-surface-secondary shrink-0">
      <div className="flex items-center gap-4">
        {activeDoc && (
          <span>
            Last saved:{' '}
            {format(activeDoc.updatedAt, 'HH:mm:ss')}
          </span>
        )}
      </div>
      <div className="flex items-center gap-4">
        {saveStatus === 'error' && (
          <span className="text-red-500">Save error — check console</span>
        )}
      </div>
    </footer>
  );
}
