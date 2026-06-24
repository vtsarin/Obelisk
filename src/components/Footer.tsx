import React from 'react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useActiveDoc } from '@/store/selectors';
import { useEditorStats } from '@/editor/plugins/StatsPlugin';
import { useBreadcrumbStore } from '@/editor/plugins/BreadcrumbPlugin';
import { format } from 'date-fns';
import { AlertCircle } from 'lucide-react';

function Dot() {
  return <span className="text-surface-border-strong">•</span>;
}

export function Footer() {
  const activeDoc = useActiveDoc();
  const saveStatus = useWorkspaceStore((s) => s.saveStatus);
  const words = useEditorStats((s) => s.words);
  const chars = useEditorStats((s) => s.chars);
  const crumbs = useBreadcrumbStore((s) => s.items);
  const depth = Math.max(0, crumbs.length - 1);

  return (
    <footer className="h-7 flex items-center justify-between px-4 text-xs text-text-tertiary border-t border-surface-border bg-surface-secondary shrink-0 select-none">
      <div className="flex items-center gap-2.5">
        {activeDoc ? (
          <>
            <span>{words.toLocaleString()} words</span>
            <Dot />
            <span>{chars.toLocaleString()} characters</span>
            {depth > 0 && (
              <>
                <Dot />
                <span>nesting depth {depth}/3</span>
              </>
            )}
          </>
        ) : (
          <span>Obelisk</span>
        )}
      </div>
      <div className="flex items-center gap-2.5">
        {saveStatus === 'error' && (
          <span className="flex items-center gap-1 text-red-500">
            <AlertCircle className="w-3 h-3" />
            Save error — check console
          </span>
        )}
        {activeDoc && (
          <span>Saved {format(activeDoc.updatedAt, 'HH:mm')}</span>
        )}
      </div>
    </footer>
  );
}
