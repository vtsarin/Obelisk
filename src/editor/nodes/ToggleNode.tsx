import React, { useCallback } from 'react';
import {
  ElementNode,
  $applyNodeReplacement,
  type LexicalNode,
  type NodeKey,
  type SerializedElementNode,
  type Spread,
  type EditorConfig,
  type DOMExportOutput,
  type LexicalEditor,
} from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';

export type SerializedToggleNode = Spread<
  { collapsed: boolean; summary: string },
  SerializedElementNode
>;

export class ToggleNode extends ElementNode {
  __collapsed: boolean;
  __summary: string;

  static getType(): string {
    return 'toggle';
  }

  static clone(node: ToggleNode): ToggleNode {
    return new ToggleNode(node.__collapsed, node.__summary, node.__key);
  }

  constructor(collapsed: boolean = false, summary: string = 'Toggle', key?: NodeKey) {
    super(key);
    this.__collapsed = collapsed;
    this.__summary = summary;
  }

  isCollapsed(): boolean {
    return this.__collapsed;
  }

  setCollapsed(collapsed: boolean): void {
    const writable = this.getWritable();
    writable.__collapsed = collapsed;
  }

  getSummary(): string {
    return this.__summary;
  }

  setSummary(summary: string): void {
    const writable = this.getWritable();
    writable.__summary = summary;
  }

  createDOM(config: EditorConfig): HTMLElement {
    const dom = document.createElement('div');
    dom.classList.add('toggle-block');
    return dom;
  }

  updateDOM(prevNode: ToggleNode): boolean {
    return prevNode.__collapsed !== this.__collapsed || prevNode.__summary !== this.__summary;
  }

  static importJSON(serializedNode: SerializedToggleNode): ToggleNode {
    const node = $createToggleNode(serializedNode.collapsed, serializedNode.summary);
    node.setFormat(serializedNode.format);
    node.setIndent(serializedNode.indent);
    node.setDirection(serializedNode.direction);
    return node;
  }

  exportJSON(): SerializedToggleNode {
    return {
      ...super.exportJSON(),
      type: 'toggle',
      collapsed: this.__collapsed,
      summary: this.__summary,
      version: 1,
    };
  }

  exportDOM(editor: LexicalEditor): DOMExportOutput {
    const details = document.createElement('details');
    if (!this.__collapsed) details.setAttribute('open', '');
    const summary = document.createElement('summary');
    summary.textContent = this.__summary;
    details.appendChild(summary);
    return { element: details };
  }

  canIndent(): boolean {
    return true;
  }
}

export function $createToggleNode(collapsed = false, summary = 'Toggle'): ToggleNode {
  return $applyNodeReplacement(new ToggleNode(collapsed, summary));
}

export function $isToggleNode(node: LexicalNode | null | undefined): node is ToggleNode {
  return node instanceof ToggleNode;
}

export function ToggleComponent({
  collapsed,
  summary,
  children,
  nodeKey,
}: {
  collapsed: boolean;
  summary: string;
  children: React.ReactNode;
  nodeKey: NodeKey;
}) {
  const [editor] = useLexicalComposerContext();

  const toggleCollapsed = useCallback(() => {
    editor.update(() => {
      const node = editor.getEditorState()._nodeMap.get(nodeKey);
      if (node && node instanceof ToggleNode) {
        node.setCollapsed(!node.isCollapsed());
      }
    });
  }, [editor, nodeKey]);

  return (
    <div className="toggle-block my-2 rounded-lg border border-surface-border">
      <button
        className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-surface-hover transition-colors rounded-t-lg"
        onClick={toggleCollapsed}
      >
        <ChevronRight
          className={cn('w-4 h-4 transition-transform text-text-tertiary', !collapsed && 'rotate-90')}
        />
        <span className="font-medium text-sm">{summary}</span>
      </button>
      {!collapsed && (
        <div className="px-3 pb-3 pl-9">{children}</div>
      )}
    </div>
  );
}
