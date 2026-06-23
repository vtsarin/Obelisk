import React from 'react';
import {
  ElementNode,
  $applyNodeReplacement,
  type LexicalNode,
  type NodeKey,
  type SerializedElementNode,
  type Spread,
  type EditorConfig,
  type DOMConversionMap,
  type DOMExportOutput,
  type LexicalEditor,
} from 'lexical';
import { Info, AlertTriangle, Lightbulb, AlertOctagon, StickyNote } from 'lucide-react';

export type CalloutVariant = 'info' | 'warning' | 'tip' | 'danger' | 'note';

export type SerializedCalloutNode = Spread<
  { variant: CalloutVariant },
  SerializedElementNode
>;

export class CalloutNode extends ElementNode {
  __variant: CalloutVariant;

  static getType(): string {
    return 'callout';
  }

  static clone(node: CalloutNode): CalloutNode {
    return new CalloutNode(node.__variant, node.__key);
  }

  constructor(variant: CalloutVariant = 'info', key?: NodeKey) {
    super(key);
    this.__variant = variant;
  }

  getVariant(): CalloutVariant {
    return this.__variant;
  }

  setVariant(variant: CalloutVariant): void {
    const writable = this.getWritable();
    writable.__variant = variant;
  }

  createDOM(config: EditorConfig): HTMLElement {
    const dom = document.createElement('div');
    dom.classList.add('callout-block', `callout-${this.__variant}`);
    return dom;
  }

  updateDOM(prevNode: CalloutNode): boolean {
    return prevNode.__variant !== this.__variant;
  }

  static importJSON(serializedNode: SerializedCalloutNode): CalloutNode {
    const node = $createCalloutNode(serializedNode.variant);
    node.setFormat(serializedNode.format);
    node.setIndent(serializedNode.indent);
    node.setDirection(serializedNode.direction);
    return node;
  }

  exportJSON(): SerializedCalloutNode {
    return {
      ...super.exportJSON(),
      type: 'callout',
      variant: this.__variant,
      version: 1,
    };
  }

  exportDOM(editor: LexicalEditor): DOMExportOutput {
    const element = document.createElement('div');
    element.classList.add('callout-block', `callout-${this.__variant}`);
    element.setAttribute('data-callout-variant', this.__variant);
    return { element };
  }

  static importDOM(): DOMConversionMap | null {
    return null;
  }

  canIndent(): boolean {
    return true;
  }

  isShadowRoot(): boolean {
    return false;
  }
}

export function $createCalloutNode(variant: CalloutVariant = 'info'): CalloutNode {
  return $applyNodeReplacement(new CalloutNode(variant));
}

export function $isCalloutNode(node: LexicalNode | null | undefined): node is CalloutNode {
  return node instanceof CalloutNode;
}

const variantIcons: Record<CalloutVariant, React.FC<{ className?: string }>> = {
  info: Info,
  warning: AlertTriangle,
  tip: Lightbulb,
  danger: AlertOctagon,
  note: StickyNote,
};

const variantStyles: Record<CalloutVariant, string> = {
  info: 'bg-[var(--callout-info-bg)] border-[var(--callout-info-border)]',
  warning: 'bg-[var(--callout-warning-bg)] border-[var(--callout-warning-border)]',
  tip: 'bg-[var(--callout-tip-bg)] border-[var(--callout-tip-border)]',
  danger: 'bg-[var(--callout-danger-bg)] border-[var(--callout-danger-border)]',
  note: 'bg-[var(--callout-note-bg)] border-[var(--callout-note-border)]',
};

export function CalloutComponent({
  variant,
  children,
  nodeKey,
}: {
  variant: CalloutVariant;
  children: React.ReactNode;
  nodeKey: NodeKey;
}) {
  const Icon = variantIcons[variant];
  return (
    <div className={`callout-block flex gap-3 p-4 my-2 rounded-lg border-l-4 ${variantStyles[variant]}`}>
      <div className="shrink-0 mt-0.5">
        <Icon className="w-5 h-5 opacity-70" />
      </div>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
