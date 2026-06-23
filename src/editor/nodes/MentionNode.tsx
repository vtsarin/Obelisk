import React from 'react';
import {
  DecoratorNode,
  type LexicalNode,
  type NodeKey,
  type SerializedLexicalNode,
  type Spread,
  type EditorConfig,
  type DOMExportOutput,
  type LexicalEditor,
} from 'lexical';
import { AtSign } from 'lucide-react';

export type MentionRefType = 'doc' | 'user' | 'block';

export type SerializedMentionNode = Spread<
  { refType: MentionRefType; refId: string; label: string },
  SerializedLexicalNode
>;

export class MentionNode extends DecoratorNode<React.ReactElement> {
  __refType: MentionRefType;
  __refId: string;
  __label: string;

  static getType(): string {
    return 'mention';
  }

  static clone(node: MentionNode): MentionNode {
    return new MentionNode(node.__refType, node.__refId, node.__label, node.__key);
  }

  constructor(refType: MentionRefType, refId: string, label: string, key?: NodeKey) {
    super(key);
    this.__refType = refType;
    this.__refId = refId;
    this.__label = label;
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const dom = document.createElement('span');
    dom.className = 'mention-node';
    return dom;
  }

  updateDOM(): boolean {
    return false;
  }

  static importJSON(serializedNode: SerializedMentionNode): MentionNode {
    return new MentionNode(serializedNode.refType, serializedNode.refId, serializedNode.label);
  }

  exportJSON(): SerializedMentionNode {
    return {
      type: 'mention',
      version: 1,
      refType: this.__refType,
      refId: this.__refId,
      label: this.__label,
    };
  }

  exportDOM(_editor: LexicalEditor): DOMExportOutput {
    const span = document.createElement('span');
    span.className = 'mention';
    span.setAttribute('data-ref-type', this.__refType);
    span.setAttribute('data-ref-id', this.__refId);
    span.textContent = `@${this.__label}`;
    return { element: span };
  }

  decorate(): React.ReactElement {
    return (
      <MentionComponent
        refType={this.__refType}
        refId={this.__refId}
        label={this.__label}
      />
    );
  }

  isInline(): boolean {
    return true;
  }

  getTextContent(): string {
    return `@${this.__label}`;
  }
}

export function $createMentionNode(
  refType: MentionRefType,
  refId: string,
  label: string
): MentionNode {
  return new MentionNode(refType, refId, label);
}

export function $isMentionNode(node: LexicalNode | null | undefined): node is MentionNode {
  return node instanceof MentionNode;
}

function MentionComponent({
  refType,
  refId,
  label,
}: {
  refType: MentionRefType;
  refId: string;
  label: string;
}) {
  return (
    <span
      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-accent-500/10 text-accent-600 text-sm font-medium cursor-pointer hover:bg-accent-500/20 transition-colors"
      contentEditable={false}
      title={`${refType}: ${label}`}
    >
      <AtSign className="w-3 h-3" />
      {label}
    </span>
  );
}
