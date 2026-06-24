import React, { useCallback, useEffect, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  $isElementNode,
  FORMAT_TEXT_COMMAND,
  UNDO_COMMAND,
  REDO_COMMAND,
  INDENT_CONTENT_COMMAND,
  OUTDENT_CONTENT_COMMAND,
  type TextFormatType,
} from 'lexical';
import { $isHeadingNode } from '@lexical/rich-text';
import { $isListNode } from '@lexical/list';
import { $isCodeNode } from '@lexical/code';
import { $getNearestNodeOfType } from '@lexical/utils';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Undo2,
  Redo2,
  Indent,
  Outdent,
  Image,
  Table,
  Minus,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { insertBlock } from '../commands/insertBlock';

export function TopToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [blockType, setBlockType] = useState('paragraph');
  const [activeFormats, setActiveFormats] = useState<Set<TextFormatType>>(new Set());

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return;

        const anchorNode = selection.anchor.getNode();
        const element = $isElementNode(anchorNode)
          ? anchorNode
          : anchorNode.getParentOrThrow();

        if ($isHeadingNode(element)) {
          setBlockType(element.getTag());
        } else if ($isListNode(element)) {
          setBlockType(element.getListType() === 'bullet' ? 'bullet-list' : 'numbered-list');
        } else if ($isCodeNode(element)) {
          setBlockType('code');
        } else {
          setBlockType(element.getType());
        }

        const formats = new Set<TextFormatType>();
        if (selection.hasFormat('bold')) formats.add('bold');
        if (selection.hasFormat('italic')) formats.add('italic');
        if (selection.hasFormat('strikethrough')) formats.add('strikethrough');
        if (selection.hasFormat('code')) formats.add('code');
        setActiveFormats(formats);
      });
    });
  }, [editor]);

  const toggleFormat = useCallback(
    (format: TextFormatType) => {
      editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
    },
    [editor]
  );

  type BlockOption = { value: string; label: string };
  const blockOptions: BlockOption[] = [
    { value: 'paragraph', label: 'Paragraph' },
    { value: 'h1', label: 'Heading 1' },
    { value: 'h2', label: 'Heading 2' },
    { value: 'h3', label: 'Heading 3' },
    { value: 'h4', label: 'Heading 4' },
    { value: 'bullet-list', label: 'Bullet List' },
    { value: 'numbered-list', label: 'Numbered List' },
    { value: 'quote', label: 'Quote' },
    { value: 'code', label: 'Code' },
  ];

  return (
    <div className="toolbar flex items-center gap-0.5 px-3 py-1.5 border-b border-surface-border bg-transparent shrink-0 overflow-x-auto">
      {/* Block type selector */}
      <select
        value={blockType}
        onChange={(e) => {
          insertBlock(editor, e.target.value as Parameters<typeof insertBlock>[1]);
        }}
        className="h-8 px-2.5 text-xs font-medium rounded-lg border border-surface-border bg-surface-primary text-text-secondary outline-none cursor-pointer hover:bg-surface-hover hover:text-text-primary transition-colors"
        aria-label="Block type"
      >
        {blockOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <div className="w-px h-5 bg-surface-border mx-1" />

      {/* Inline format buttons */}
      {([
        { format: 'bold' as TextFormatType, icon: Bold, label: 'Bold (⌘B)' },
        { format: 'italic' as TextFormatType, icon: Italic, label: 'Italic (⌘I)' },
        { format: 'strikethrough' as TextFormatType, icon: Strikethrough, label: 'Strikethrough' },
        { format: 'code' as TextFormatType, icon: Code, label: 'Inline Code' },
      ]).map(({ format, icon: Icon, label }) => (
        <button
          key={format}
          className={cn(
            'flex items-center justify-center w-8 h-8 rounded-lg transition-colors',
            activeFormats.has(format)
              ? 'bg-accent-soft text-accent-fg'
              : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
          )}
          onClick={() => toggleFormat(format)}
          title={label}
          aria-label={label}
        >
          <Icon className="w-4 h-4" />
        </button>
      ))}

      <div className="w-px h-5 bg-surface-border mx-1" />

      {/* Insert buttons */}
      <button
        className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-surface-hover transition-colors"
        onClick={() => insertBlock(editor, 'image')}
        title="Insert Image"
        aria-label="Insert Image"
      >
        <Image className="w-4 h-4 text-text-secondary" />
      </button>
      <button
        className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-surface-hover transition-colors"
        onClick={() => insertBlock(editor, 'table')}
        title="Insert Table"
        aria-label="Insert Table"
      >
        <Table className="w-4 h-4 text-text-secondary" />
      </button>
      <button
        className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-surface-hover transition-colors"
        onClick={() => insertBlock(editor, 'divider')}
        title="Insert Divider"
        aria-label="Insert Divider"
      >
        <Minus className="w-4 h-4 text-text-secondary" />
      </button>

      <div className="w-px h-5 bg-surface-border mx-1" />

      {/* Indent/Outdent */}
      <button
        className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-surface-hover transition-colors"
        onClick={() => editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined)}
        title="Indent"
        aria-label="Indent"
      >
        <Indent className="w-4 h-4 text-text-secondary" />
      </button>
      <button
        className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-surface-hover transition-colors"
        onClick={() => editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined)}
        title="Outdent"
        aria-label="Outdent"
      >
        <Outdent className="w-4 h-4 text-text-secondary" />
      </button>

      <div className="w-px h-5 bg-surface-border mx-1" />

      {/* Undo/Redo */}
      <button
        className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-surface-hover transition-colors"
        onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
        title="Undo (⌘Z)"
        aria-label="Undo"
      >
        <Undo2 className="w-4 h-4 text-text-secondary" />
      </button>
      <button
        className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-surface-hover transition-colors"
        onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
        title="Redo (⌘⇧Z)"
        aria-label="Redo"
      >
        <Redo2 className="w-4 h-4 text-text-secondary" />
      </button>
    </div>
  );
}
