import React from 'react';
import { useBreadcrumbStore } from '@/editor/plugins/BreadcrumbPlugin';
import { ChevronRight } from 'lucide-react';

export function Breadcrumb() {
  const items = useBreadcrumbStore((s) => s.items);

  if (items.length === 0) return null;

  return (
    <div className="flex items-center gap-1 px-4 py-1.5 text-xs text-text-tertiary border-b border-surface-border bg-surface-primary overflow-x-auto">
      {items.map((item, index) => (
        <React.Fragment key={item.key}>
          {index > 0 && <ChevronRight className="w-3 h-3 shrink-0" />}
          <span className="truncate max-w-[150px] hover:text-text-secondary cursor-default" title={item.label}>
            {item.label}
          </span>
        </React.Fragment>
      ))}
    </div>
  );
}
