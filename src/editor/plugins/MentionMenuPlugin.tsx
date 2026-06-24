import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  $createRangeSelection,
  $setSelection,
  KEY_ARROW_DOWN_COMMAND,
  KEY_ARROW_UP_COMMAND,
  KEY_ENTER_COMMAND,
  KEY_ESCAPE_COMMAND,
  COMMAND_PRIORITY_HIGH,
} from 'lexical';
import Fuse from 'fuse.js';
import { FileText, AtSign } from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { $createMentionNode } from '../nodes/MentionNode';
import { cn } from '@/lib/cn';

interface MentionCandidate {
  id: string;
  label: string;
}

export function MentionMenuPlugin() {
  const [editor] = useLexicalComposerContext();
  const docs = useWorkspaceStore((s) => s.docs);
  const activeDocId = useWorkspaceStore((s) => s.activeDocId);

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  const candidates = useMemo<MentionCandidate[]>(
    () =>
      docs
        .filter((d) => d.id !== activeDocId)
        .map((d) => ({ id: d.id, label: d.title || 'Untitled' })),
    [docs, activeDocId]
  );

  const fuse = useMemo(
    () => new Fuse(candidates, { keys: ['label'], threshold: 0.4, ignoreLocation: true }),
    [candidates]
  );

  const results = useMemo<MentionCandidate[]>(() => {
    if (!query) return candidates.slice(0, 8);
    return fuse.search(query).map((r) => r.item).slice(0, 8);
  }, [query, candidates, fuse]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  // Detect an "@" trigger at the cursor (start of line or after whitespace).
  useEffect(() => {
    const unregister = editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
          if (isOpen) setIsOpen(false);
          return;
        }

        const anchor = selection.anchor;
        if (anchor.type !== 'text') {
          if (isOpen) setIsOpen(false);
          return;
        }

        const node = anchor.getNode();
        if (!$isTextNode(node)) {
          if (isOpen) setIsOpen(false);
          return;
        }

        const textContent = node.getTextContent();
        const offset = anchor.offset;

        const atIdx = textContent.lastIndexOf('@', offset - 1);
        if (atIdx === -1 || atIdx >= offset) {
          if (isOpen) setIsOpen(false);
          return;
        }

        // "@" must be at start of line or after whitespace
        if (atIdx > 0 && textContent[atIdx - 1] !== ' ' && textContent[atIdx - 1] !== '\n') {
          if (isOpen) setIsOpen(false);
          return;
        }

        const queryText = textContent.slice(atIdx + 1, offset);
        // A mention query is a single token — bail once it hits whitespace.
        if (/[\s]/.test(queryText)) {
          if (isOpen) setIsOpen(false);
          return;
        }

        const domSelection = window.getSelection();
        if (domSelection && domSelection.rangeCount > 0) {
          const range = domSelection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          setPosition({ top: rect.bottom + 6, left: rect.left });
        }

        setQuery(queryText);
        setIsOpen(true);
      });
    });

    return unregister;
  }, [editor, isOpen]);

  const executeMention = useCallback(
    (candidate: MentionCandidate) => {
      editor.update(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return;
        const anchor = selection.anchor;
        if (anchor.type !== 'text') return;
        const node = anchor.getNode();
        if (!$isTextNode(node)) return;

        const text = node.getTextContent();
        const offset = anchor.offset;
        const atIdx = text.lastIndexOf('@', offset - 1);
        if (atIdx === -1 || atIdx >= offset) return;

        // Replace the "@query" range with the mention node.
        const replaceRange = $createRangeSelection();
        replaceRange.anchor.set(node.getKey(), atIdx, 'text');
        replaceRange.focus.set(node.getKey(), offset, 'text');
        $setSelection(replaceRange);
        replaceRange.insertNodes([$createMentionNode('doc', candidate.id, candidate.label)]);

        // Trailing space so the caret leaves the mention cleanly.
        const after = $getSelection();
        if ($isRangeSelection(after)) after.insertText(' ');
      });

      setIsOpen(false);
      setQuery('');
    },
    [editor]
  );

  // Keyboard navigation while the menu is open.
  useEffect(() => {
    if (!isOpen) return;

    const removeDown = editor.registerCommand(
      KEY_ARROW_DOWN_COMMAND,
      (event) => {
        if (results.length === 0) return false;
        event?.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
        return true;
      },
      COMMAND_PRIORITY_HIGH
    );

    const removeUp = editor.registerCommand(
      KEY_ARROW_UP_COMMAND,
      (event) => {
        if (results.length === 0) return false;
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
          executeMention(results[selectedIndex]);
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
  }, [editor, isOpen, results, selectedIndex, executeMention]);

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={menuRef}
      className="fixed z-50 w-72 max-h-72 overflow-y-auto bg-surface-primary border border-surface-border rounded-xl shadow-lg p-1.5 animate-scale-fade origin-top-left"
      style={{ top: position.top, left: position.left }}
    >
      <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
        Link a document
      </div>
      {results.length === 0 ? (
        <div className="px-2 py-3 text-sm text-text-tertiary flex items-center gap-2">
          <AtSign className="w-4 h-4 shrink-0" />
          No matching documents
        </div>
      ) : (
        results.map((item, index) => {
          const active = index === selectedIndex;
          return (
            <button
              key={item.id}
              className={cn(
                'w-full flex items-center gap-2.5 px-2 py-1.5 text-left rounded-lg transition-colors',
                active ? 'bg-accent-soft' : 'hover:bg-surface-hover'
              )}
              onMouseEnter={() => setSelectedIndex(index)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => executeMention(item)}
            >
              <span
                className={cn(
                  'flex items-center justify-center w-7 h-7 rounded-md shrink-0 border',
                  active
                    ? 'bg-surface-primary border-surface-border text-accent-fg'
                    : 'bg-surface-secondary border-surface-border text-text-tertiary'
                )}
              >
                <FileText className="w-3.5 h-3.5" />
              </span>
              <span
                className={cn(
                  'text-sm font-medium truncate',
                  active ? 'text-accent-fg' : 'text-text-primary'
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })
      )}
    </div>,
    document.body
  );
}
