import React from 'react';
import { useBreadcrumbStore } from '@/editor/plugins/BreadcrumbPlugin';
import { getActiveEditor } from '@/editor/activeEditor';
import { ChevronRight } from 'lucide-react';
import { $getNodeByKey, $isElementNode } from 'lexical';
import { cn } from '@/lib/cn';

export function Breadcrumb() {
  const items = useBreadcrumbStore((s) => s.items);

  if (items.length === 0) return null;

  const selectAncestor = (key: string) => {
    const editor = getActiveEditor();
    if (!editor) return;
    editor.update(() => {
      const node = $getNodeByKey(key);
      if (!node) return;
      if ($isElementNode(node)) {
        node.selectStart();
      } else {
        node.selectNext();
      }
    });
    editor.focus();
  };

  return (
    <div className="flex items-center gap-0.5 px-4 h-9 shrink-0 text-xs text-text-tertiary border-b border-surface-border bg-surface-primary overflow-x-auto">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={item.key}>
            {index > 0 && <ChevronRight className="w-3 h-3 shrink-0 text-text-tertiary" />}
            <button
              onClick={() => selectAncestor(item.key)}
              title={item.label}
              className={cn(
                'truncate max-w-[180px] px-1.5 py-0.5 rounded transition-colors hover:bg-surface-hover hover:text-text-secondary',
                isLast && 'text-text-secondary font-medium'
              )}
            >
              {item.label}
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
}
