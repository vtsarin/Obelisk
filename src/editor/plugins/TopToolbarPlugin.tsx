import React, { useCallback, useEffect, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  $isElementNode,
  $createParagraphNode,
  FORMAT_TEXT_COMMAND,
  UNDO_COMMAND,
  REDO_COMMAND,
  INDENT_CONTENT_COMMAND,
  OUTDENT_CONTENT_COMMAND,
  type TextFormatType,
} from 'lexical';
import { $isHeadingNode, $createHeadingNode, $createQuoteNode, type HeadingTagType } from '@lexical/rich-text';
import {
  $isListNode,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
} from '@lexical/list';
import { $isCodeNode, $createCodeNode } from '@lexical/code';
import { $setBlocksType } from '@lexical/selection';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
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
  ChevronDown,
  ChevronUp,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { insertBlock } from '../commands/insertBlock';
import { useWorkspaceStore } from '@/store/workspaceStore';

export function TopToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [blockType, setBlockType] = useState('paragraph');
  const [activeFormats, setActiveFormats] = useState<Set<TextFormatType>>(new Set());
  const toggleEditorToolbar = useWorkspaceStore((s) => s.toggleEditorToolbar);

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
    { value: 'paragraph', label: 'Text' },
    { value: 'h1', label: 'Heading 1' },
    { value: 'h2', label: 'Heading 2' },
    { value: 'h3', label: 'Heading 3' },
    { value: 'h4', label: 'Heading 4' },
    { value: 'bullet-list', label: 'Bullet List' },
    { value: 'numbered-list', label: 'Numbered List' },
    { value: 'quote', label: 'Quote' },
    { value: 'code', label: 'Code' },
  ];
  const currentLabel = blockOptions.find((o) => o.value === blockType)?.label ?? 'Text';

  // Real "turn into": convert the current block(s) in place rather than insert.
  const turnInto = useCallback(
    (value: string) => {
      if (value === 'bullet-list') {
        editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
        return;
      }
      if (value === 'numbered-list') {
        editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
        return;
      }
      editor.update(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return;
        if (value === 'paragraph') $setBlocksType(selection, () => $createParagraphNode());
        else if (value === 'quote') $setBlocksType(selection, () => $createQuoteNode());
        else if (value === 'code') $setBlocksType(selection, () => $createCodeNode());
        else $setBlocksType(selection, () => $createHeadingNode(value as HeadingTagType));
      });
    },
    [editor]
  );

  return (
    <div className="toolbar flex items-center gap-0.5 px-3 py-1.5 border-b border-surface-border bg-transparent shrink-0 overflow-x-auto">
      {/* Turn into — styled dropdown */}
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            className="flex items-center gap-1.5 h-8 pl-2.5 pr-2 min-w-[108px] text-xs font-medium rounded-lg border border-surface-border bg-surface-primary text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
            aria-label="Turn into"
          >
            <span className="flex-1 text-left">{currentLabel}</span>
            <ChevronDown className="w-3.5 h-3.5 shrink-0" />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="start"
            sideOffset={4}
            className="z-[60] min-w-[180px] rounded-lg border border-surface-border bg-surface-primary p-1 shadow-lg data-[state=open]:animate-scale-fade"
          >
            <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
              Turn into
            </div>
            {blockOptions.map((opt) => (
              <DropdownMenu.Item
                key={opt.value}
                onSelect={() => turnInto(opt.value)}
                className={cn(
                  'flex items-center gap-2 px-2 py-1.5 rounded-md text-sm cursor-pointer outline-none data-[highlighted]:bg-surface-hover',
                  blockType === opt.value ? 'text-accent-fg' : 'text-text-secondary data-[highlighted]:text-text-primary'
                )}
              >
                <span className="flex-1">{opt.label}</span>
                {blockType === opt.value && <Check className="w-3.5 h-3.5" />}
              </DropdownMenu.Item>
            ))}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

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

      {/* Collapse toolbar — the slash menu and selection toolbar cover most of this */}
      <div className="flex-1 min-w-2" />
      <button
        className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-surface-hover transition-colors shrink-0"
        onClick={toggleEditorToolbar}
        title="Hide toolbar"
        aria-label="Hide toolbar"
      >
        <ChevronUp className="w-4 h-4 text-text-tertiary" />
      </button>
    </div>
  );
}
