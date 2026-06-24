import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  type TextFormatType,
} from 'lexical';
import { $patchStyleText, $getSelectionStyleValueForProperty } from '@lexical/selection';
import { TOGGLE_LINK_COMMAND } from '@lexical/link';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Link,
  Highlighter,
  Superscript,
  Subscript,
  Sigma,
  Palette,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { $createMathNode } from '../nodes/MathNode';

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

interface Swatch {
  name: string;
  value: string | null;
}

const TEXT_COLORS: Swatch[] = [
  { name: 'Default', value: null },
  { name: 'Gray', value: '#6b7280' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Amber', value: '#d97706' },
  { name: 'Green', value: '#16a34a' },
  { name: 'Teal', value: '#0d9488' },
  { name: 'Blue', value: '#2563eb' },
  { name: 'Purple', value: '#9333ea' },
  { name: 'Pink', value: '#db2777' },
];

const BG_COLORS: Swatch[] = [
  { name: 'None', value: null },
  { name: 'Gray', value: '#e5e7eb' },
  { name: 'Red', value: '#fecaca' },
  { name: 'Orange', value: '#fed7aa' },
  { name: 'Yellow', value: '#fef08a' },
  { name: 'Green', value: '#bbf7d0' },
  { name: 'Teal', value: '#99f6e4' },
  { name: 'Blue', value: '#bfdbfe' },
  { name: 'Purple', value: '#e9d5ff' },
  { name: 'Pink', value: '#fbcfe8' },
];

export function FloatingToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [activeFormats, setActiveFormats] = useState<Set<TextFormatType>>(new Set());
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [showColor, setShowColor] = useState(false);
  const [currentColor, setCurrentColor] = useState('');
  const [currentBg, setCurrentBg] = useState('');
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

    setCurrentColor($getSelectionStyleValueForProperty(selection, 'color', ''));
    setCurrentBg($getSelectionStyleValueForProperty(selection, 'background-color', ''));

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

  // Reset transient panels whenever the toolbar is dismissed.
  useEffect(() => {
    if (!isVisible) {
      setShowLinkInput(false);
      setShowColor(false);
      setLinkUrl('');
    }
  }, [isVisible]);

  const toggleFormat = useCallback(
    (format: TextFormatType) => {
      editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
    },
    [editor]
  );

  const applyStyle = useCallback(
    (styles: Record<string, string | null>) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $patchStyleText(selection, styles);
        }
      });
    },
    [editor]
  );

  const insertInlineMath = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      const text = selection.getTextContent().trim();
      const mathNode = $createMathNode(text || 'x');
      selection.insertNodes([mathNode]);
    });
    setIsVisible(false);
  }, [editor]);

  const insertLink = useCallback(() => {
    if (showLinkInput) {
      if (linkUrl) {
        editor.dispatchCommand(TOGGLE_LINK_COMMAND, linkUrl);
      }
      setShowLinkInput(false);
      setLinkUrl('');
    } else {
      setShowColor(false);
      setShowLinkInput(true);
      setTimeout(() => linkInputRef.current?.focus(), 50);
    }
  }, [editor, showLinkInput, linkUrl]);

  if (!isVisible) return null;

  const iconBtn = (active: boolean) =>
    cn(
      'flex items-center justify-center w-8 h-8 rounded-lg transition-colors',
      active
        ? 'bg-accent-soft text-accent-fg'
        : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
    );

  return createPortal(
    <div
      ref={toolbarRef}
      className="fixed z-50 -translate-x-1/2 animate-scale-fade"
      style={{ top: position.top, left: position.left }}
    >
      <div className="flex items-center gap-0.5 bg-surface-primary border border-surface-border rounded-xl shadow-lg px-1 py-1">
        {buttons.map(({ icon: Icon, format, label }) => (
          <button
            key={format}
            className={iconBtn(activeFormats.has(format))}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => toggleFormat(format)}
            title={label}
            aria-label={label}
          >
            <Icon className="w-4 h-4" />
          </button>
        ))}

        <div className="w-px h-5 bg-surface-border mx-0.5" />

        {/* Text / background color */}
        <button
          className={iconBtn(showColor || !!currentColor || !!currentBg)}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            setShowLinkInput(false);
            setShowColor((v) => !v);
          }}
          title="Color"
          aria-label="Color"
        >
          <Palette className="w-4 h-4" />
        </button>

        {/* Inline math */}
        <button
          className={iconBtn(false)}
          onMouseDown={(e) => e.preventDefault()}
          onClick={insertInlineMath}
          title="Inline math"
          aria-label="Inline math"
        >
          <Sigma className="w-4 h-4" />
        </button>

        {/* Link */}
        <button
          className={iconBtn(showLinkInput)}
          onMouseDown={(e) => e.preventDefault()}
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
      </div>

      {showColor && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 w-56 bg-surface-primary border border-surface-border rounded-xl shadow-lg p-2.5 animate-scale-fade">
          <ColorRow
            label="Text"
            swatches={TEXT_COLORS}
            current={currentColor}
            kind="text"
            onPick={(value) => applyStyle({ color: value })}
          />
          <ColorRow
            label="Background"
            swatches={BG_COLORS}
            current={currentBg}
            kind="bg"
            onPick={(value) => applyStyle({ 'background-color': value })}
          />
        </div>
      )}
    </div>,
    document.body
  );
}

function ColorRow({
  label,
  swatches,
  current,
  kind,
  onPick,
}: {
  label: string;
  swatches: Swatch[];
  current: string;
  kind: 'text' | 'bg';
  onPick: (value: string | null) => void;
}) {
  const normalized = current.replace(/\s/g, '').toLowerCase();
  return (
    <div className="mb-1.5 last:mb-0">
      <div className="px-0.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">
        {label}
      </div>
      <div className="flex flex-wrap gap-1">
        {swatches.map((swatch) => {
          const isActive =
            swatch.value === null
              ? normalized === ''
              : normalized === swatch.value.toLowerCase();
          // Background swatches fill the chip; text swatches stay neutral and tint the "A".
          const fill = kind === 'bg' && swatch.value ? { background: swatch.value } : undefined;
          return (
            <button
              key={swatch.name}
              className={cn(
                'w-6 h-6 rounded-md border flex items-center justify-center transition-transform hover:scale-110',
                kind === 'text' && 'bg-surface-secondary',
                isActive ? 'border-accent ring-1 ring-accent' : 'border-surface-border'
              )}
              style={fill}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onPick(swatch.value)}
              title={swatch.name}
              aria-label={`${label}: ${swatch.name}`}
            >
              {kind === 'text' && (
                <span
                  className="text-[11px] font-bold"
                  style={swatch.value ? { color: swatch.value } : { color: 'var(--text-tertiary)' }}
                >
                  A
                </span>
              )}
              {kind === 'bg' && swatch.value === null && (
                <span className="text-[11px] font-semibold text-text-tertiary">∅</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
