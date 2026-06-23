import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  type TextFormatType,
} from 'lexical';
import { $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Link,
  Highlighter,
  Superscript,
  Subscript,
} from 'lucide-react';
import { cn } from '@/lib/cn';

interface ToolbarButton {
  icon: React.FC<{ className?: string }>;
  format: TextFormatType;
  label: string;
}

const buttons: ToolbarButton[] = [
  { icon: Bold, format: 'bold', label: 'Bold' },
  { icon: Italic, format: 'italic', label: 'Italic' },
  { icon: Strikethrough, format: 'strikethrough', label: 'Strikethrough' },
  { icon: Code, format: 'code', label: 'Inline Code' },
  { icon: Highlighter, format: 'highlight', label: 'Highlight' },
  { icon: Superscript, format: 'superscript', label: 'Superscript' },
  { icon: Subscript, format: 'subscript', label: 'Subscript' },
];

export function FloatingToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [activeFormats, setActiveFormats] = useState<Set<TextFormatType>>(new Set());
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const toolbarRef = useRef<HTMLDivElement>(null);
  const linkInputRef = useRef<HTMLInputElement>(null);

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection) || selection.isCollapsed()) {
      setIsVisible(false);
      return;
    }

    const formats = new Set<TextFormatType>();
    if (selection.hasFormat('bold')) formats.add('bold');
    if (selection.hasFormat('italic')) formats.add('italic');
    if (selection.hasFormat('strikethrough')) formats.add('strikethrough');
    if (selection.hasFormat('code')) formats.add('code');
    if (selection.hasFormat('highlight')) formats.add('highlight');
    if (selection.hasFormat('superscript')) formats.add('superscript');
    if (selection.hasFormat('subscript')) formats.add('subscript');
    setActiveFormats(formats);

    const domSelection = window.getSelection();
    if (domSelection && domSelection.rangeCount > 0) {
      const range = domSelection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      if (rect.width > 0) {
        setPosition({
          top: rect.top - 44,
          left: rect.left + rect.width / 2,
        });
        setIsVisible(true);
      }
    }
  }, []);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        updateToolbar();
      });
    });
  }, [editor, updateToolbar]);

  // Hide on scroll
  useEffect(() => {
    const handleScroll = () => setIsVisible(false);
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, []);

  const toggleFormat = useCallback(
    (format: TextFormatType) => {
      editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
    },
    [editor]
  );

  const insertLink = useCallback(() => {
    if (showLinkInput) {
      if (linkUrl) {
        editor.dispatchCommand(TOGGLE_LINK_COMMAND, linkUrl);
      }
      setShowLinkInput(false);
      setLinkUrl('');
    } else {
      setShowLinkInput(true);
      setTimeout(() => linkInputRef.current?.focus(), 50);
    }
  }, [editor, showLinkInput, linkUrl]);

  if (!isVisible) return null;

  return createPortal(
    <div
      ref={toolbarRef}
      className="fixed z-50 flex items-center gap-0.5 bg-surface-primary border border-surface-border rounded-lg shadow-lg px-1 py-1 -translate-x-1/2"
      style={{ top: position.top, left: position.left }}
    >
      {buttons.map(({ icon: Icon, format, label }) => (
        <button
          key={format}
          className={cn(
            'p-1.5 rounded hover:bg-surface-hover transition-colors',
            activeFormats.has(format) && 'bg-accent-500/10 text-accent-600'
          )}
          onClick={() => toggleFormat(format)}
          title={label}
          aria-label={label}
        >
          <Icon className="w-4 h-4" />
        </button>
      ))}

      <div className="w-px h-5 bg-surface-border mx-0.5" />

      <button
        className={cn(
          'p-1.5 rounded hover:bg-surface-hover transition-colors',
          showLinkInput && 'bg-accent-500/10 text-accent-600'
        )}
        onClick={insertLink}
        title="Link"
        aria-label="Link"
      >
        <Link className="w-4 h-4" />
      </button>

      {showLinkInput && (
        <input
          ref={linkInputRef}
          className="ml-1 px-2 py-1 text-xs border border-surface-border rounded bg-surface-primary text-text-primary outline-none w-40"
          placeholder="https://…"
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              insertLink();
            }
            if (e.key === 'Escape') {
              setShowLinkInput(false);
              setLinkUrl('');
            }
          }}
        />
      )}
    </div>,
    document.body
  );
}
