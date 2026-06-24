import React, { useState } from 'react';
import { useOutlineStore } from '@/editor/plugins/OutlinePlugin';
import { getActiveEditor } from '@/editor/activeEditor';
import { cn } from '@/lib/cn';
import { List, Search } from 'lucide-react';

export function Outline() {
  const items = useOutlineStore((s) => s.items);
  const [filter, setFilter] = useState('');

  const filtered = filter
    ? items.filter((i) => i.text.toLowerCase().includes(filter.toLowerCase()))
    : items;

  const scrollToNode = (key: string) => {
    const editor = getActiveEditor();
    const element = editor?.getElementByKey(key);
    if (!element) return;
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // Brief highlight so the jump target is obvious
    element.classList.add('outline-flash');
    window.setTimeout(() => element.classList.remove('outline-flash'), 900);
  };

  return (
    <div className="h-full flex flex-col bg-surface-secondary border-l border-surface-border">
      <div className="flex items-center gap-2 px-3 h-12 shrink-0 border-b border-surface-border">
        <List className="w-4 h-4 text-text-tertiary" />
        <span className="text-[13px] font-semibold text-text-secondary uppercase tracking-wider">Outline</span>
      </div>

      <div className="px-3 py-2">
        <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-surface-tertiary">
          <Search className="w-3 h-3 text-text-tertiary" />
          <input
            className="flex-1 bg-transparent text-xs text-text-primary outline-none placeholder:text-text-tertiary"
            placeholder="Filter headings…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-1 py-1">
        {filtered.length === 0 && (
          <div className="px-3 py-4 text-center text-xs text-text-tertiary">
            {items.length === 0 ? 'No headings in document' : 'No matching headings'}
          </div>
        )}
        {filtered.map((item) => (
          <button
            key={item.key}
            className={cn(
              'w-full text-left px-2 py-1 rounded text-sm truncate hover:bg-surface-hover transition-colors',
              'text-text-secondary'
            )}
            style={{ paddingLeft: `${(item.level - 1) * 12 + 8}px` }}
            onClick={() => scrollToNode(item.key)}
            title={item.text}
          >
            <span className="text-text-tertiary text-xs mr-1.5">{item.tag.toUpperCase()}</span>
            {item.text || 'Untitled'}
          </button>
        ))}
      </div>
    </div>
  );
}
