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
import { Database } from 'lucide-react';

export type SerializedDatabaseReferenceNode = Spread<
  { title: string },
  SerializedLexicalNode
>;

export class DatabaseReferenceNode extends DecoratorNode<React.ReactElement> {
  __title: string;

  static getType(): string {
    return 'database-reference';
  }

  static clone(node: DatabaseReferenceNode): DatabaseReferenceNode {
    return new DatabaseReferenceNode(node.__title, node.__key);
  }

  constructor(title: string = 'Untitled Database', key?: NodeKey) {
    super(key);
    this.__title = title;
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const dom = document.createElement('div');
    dom.style.display = 'contents';
    return dom;
  }

  updateDOM(): boolean {
    return false;
  }

  static importJSON(serializedNode: SerializedDatabaseReferenceNode): DatabaseReferenceNode {
    return new DatabaseReferenceNode(serializedNode.title);
  }

  exportJSON(): SerializedDatabaseReferenceNode {
    return {
      type: 'database-reference',
      version: 1,
      title: this.__title,
    };
  }

  exportDOM(_editor: LexicalEditor): DOMExportOutput {
    const div = document.createElement('div');
    div.className = 'database-reference';
    div.textContent = `Linked Database: ${this.__title} (coming soon)`;
    return { element: div };
  }

  decorate(): React.ReactElement {
    return <DatabaseReferenceComponent title={this.__title} />;
  }

  isInline(): boolean {
    return false;
  }
}

export function $createDatabaseReferenceNode(title?: string): DatabaseReferenceNode {
  return new DatabaseReferenceNode(title);
}

export function $isDatabaseReferenceNode(
  node: LexicalNode | null | undefined
): node is DatabaseReferenceNode {
  return node instanceof DatabaseReferenceNode;
}

function DatabaseReferenceComponent({ title }: { title: string }) {
  return (
    <div
      className="my-4 flex items-center gap-3 p-4 rounded-lg border border-dashed border-surface-border bg-surface-secondary"
      contentEditable={false}
    >
      <Database className="w-6 h-6 text-text-tertiary shrink-0" />
      <div>
        <p className="text-sm font-medium text-text-primary">{title}</p>
        <p className="text-xs text-text-tertiary">Linked database — coming soon</p>
      </div>
    </div>
  );
}
