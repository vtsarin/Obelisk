import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  KEY_ARROW_DOWN_COMMAND,
  KEY_ARROW_UP_COMMAND,
  KEY_ENTER_COMMAND,
  KEY_ESCAPE_COMMAND,
  COMMAND_PRIORITY_HIGH,
  type TextNode,
  $isTextNode,
} from 'lexical';
import Fuse from 'fuse.js';
import { blockPalette, insertBlock, type BlockPaletteItem } from '../commands/insertBlock';
import * as Icons from 'lucide-react';
import { cn } from '@/lib/cn';

const fuse = new Fuse(blockPalette, {
  keys: ['label', 'aliases', 'description'],
  threshold: 0.4,
});

function getIcon(iconName: string): React.FC<{ className?: string }> {
  return (Icons as unknown as Record<string, React.FC<{ className?: string }>>)[iconName] ?? Icons.Plus;
}

export function SlashMenuPlugin() {
  const [editor] = useLexicalComposerContext();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  const results: BlockPaletteItem[] = useMemo(() => {
    if (!query) return blockPalette;
    return fuse.search(query).map((r) => r.item);
  }, [query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  // Listen for '/' typed at start of line or after whitespace
  useEffect(() => {
    const removeListener = editor.registerTextContentListener((text) => {
      // We handle this in the update listener below
    });
    return removeListener;
  }, [editor]);

  useEffect(() => {
    const unregister = editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
          if (isOpen) setIsOpen(false);
          return;
        }

        const anchor = selection.anchor;
        if (anchor.type !== 'text') return;

        const node = anchor.getNode();
        if (!$isTextNode(node)) return;

        const textContent = node.getTextContent();
        const offset = anchor.offset;

        // Check if there's a slash trigger
        const slashIdx = textContent.lastIndexOf('/', offset);
        if (slashIdx === -1) {
          if (isOpen) setIsOpen(false);
          return;
        }

        // Slash must be at start of line or after whitespace
        if (slashIdx > 0 && textContent[slashIdx - 1] !== ' ' && textContent[slashIdx - 1] !== '\n') {
          if (isOpen) setIsOpen(false);
          return;
        }

        const queryText = textContent.slice(slashIdx + 1, offset);

        // Position the menu
        const domSelection = window.getSelection();
        if (domSelection && domSelection.rangeCount > 0) {
          const range = domSelection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          setPosition({ top: rect.bottom + 4, left: rect.left });
        }

        setQuery(queryText);
        setIsOpen(true);
      });
    });

    return unregister;
  }, [editor, isOpen]);

  const executeInsert = useCallback(
    (item: BlockPaletteItem) => {
      editor.update(() => {
        // Remove the slash command text
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const anchor = selection.anchor;
          if (anchor.type === 'text') {
            const node = anchor.getNode();
            if ($isTextNode(node)) {
              const text = node.getTextContent();
              const offset = anchor.offset;
              const slashIdx = text.lastIndexOf('/', offset);
              if (slashIdx !== -1) {
                // Remove from slash to cursor
                const before = text.slice(0, slashIdx);
                const after = text.slice(offset);
                (node as TextNode).setTextContent(before + after);
                // If the node is now empty, we can insert the block
                if (!before && !after) {
                  node.remove();
                }
              }
            }
          }
        }
      });

      // Insert the block
      insertBlock(editor, item.type);
      setIsOpen(false);
      setQuery('');
    },
    [editor]
  );

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const removeDown = editor.registerCommand(
      KEY_ARROW_DOWN_COMMAND,
      (event) => {
        event?.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
        return true;
      },
      COMMAND_PRIORITY_HIGH
    );

    const removeUp = editor.registerCommand(
      KEY_ARROW_UP_COMMAND,
      (event) => {
        event?.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
        return true;
      },
      COMMAND_PRIORITY_HIGH
    );

    const removeEnter = editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event) => {
        if (results[selectedIndex]) {
          event?.preventDefault();
          executeInsert(results[selectedIndex]);
          return true;
        }
        return false;
      },
      COMMAND_PRIORITY_HIGH
    );

    const removeEscape = editor.registerCommand(
      KEY_ESCAPE_COMMAND,
      () => {
        setIsOpen(false);
        setQuery('');
        return true;
      },
      COMMAND_PRIORITY_HIGH
    );

    return () => {
      removeDown();
      removeUp();
      removeEnter();
      removeEscape();
    };
  }, [editor, isOpen, results, selectedIndex, executeInsert]);

  if (!isOpen || results.length === 0) return null;

  return createPortal(
    <div
      ref={menuRef}
      className="fixed z-50 w-80 max-h-80 overflow-y-auto bg-surface-primary border border-surface-border rounded-xl shadow-lg p-1.5 animate-scale-fade origin-top-left"
      style={{ top: position.top, left: position.left }}
    >
      <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
        {query ? 'Results' : 'Basic blocks'}
      </div>
      {results.map((item, index) => {
        const Icon = getIcon(item.icon);
        const active = index === selectedIndex;
        return (
          <button
            key={item.type}
            className={cn(
              'w-full flex items-center gap-3 px-2 py-1.5 text-left rounded-lg transition-colors',
              active ? 'bg-accent-soft' : 'hover:bg-surface-hover'
            )}
            onMouseEnter={() => setSelectedIndex(index)}
            onClick={() => executeInsert(item)}
          >
            <span
              className={cn(
                'flex items-center justify-center w-8 h-8 rounded-md shrink-0 border',
                active
                  ? 'bg-surface-primary border-surface-border text-accent-fg'
                  : 'bg-surface-secondary border-surface-border text-text-secondary'
              )}
            >
              <Icon className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <div className={cn('text-sm font-medium', active ? 'text-accent-fg' : 'text-text-primary')}>
                {item.label}
              </div>
              <div className="text-xs text-text-tertiary truncate">{item.description}</div>
            </div>
          </button>
        );
      })}
    </div>,
    document.body
  );
}
