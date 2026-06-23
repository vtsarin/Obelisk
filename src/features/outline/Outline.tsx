import React, { useState } from 'react';
import { useOutlineStore } from '@/editor/plugins/OutlinePlugin';
import { cn } from '@/lib/cn';
import { List, Search } from 'lucide-react';

export function Outline() {
  const items = useOutlineStore((s) => s.items);
  const [filter, setFilter] = useState('');

  const filtered = filter
    ? items.filter((i) => i.text.toLowerCase().includes(filter.toLowerCase()))
    : items;

  const scrollToNode = (key: string) => {
    const element = document.querySelector(`[data-lexical-editor] [data-lexical-node-key="${key}"]`);
    if (!element) {
      // Fallback: try to find by content
      const editorRoot = document.querySelector('[data-lexical-editor]');
      if (editorRoot) {
        const headings = editorRoot.querySelectorAll('h1, h2, h3, h4, h5, h6');
        for (const h of headings) {
          if ((h as HTMLElement).dataset?.['lexicalNodeKey'] === key) {
            h.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
          }
        }
      }
      return;
    }
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div className="h-full flex flex-col bg-surface-secondary border-l border-surface-border">
      <div className="flex items-center gap-2 px-3 py-3 border-b border-surface-border">
        <List className="w-4 h-4 text-text-tertiary" />
        <span className="text-sm font-semibold text-text-primary">Outline</span>
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
