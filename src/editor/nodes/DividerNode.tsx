import React from 'react';
import {
  DecoratorNode,
  type LexicalNode,
  type NodeKey,
  type SerializedLexicalNode,
  type EditorConfig,
  type DOMExportOutput,
  type LexicalEditor,
} from 'lexical';

export interface SerializedDividerNode extends SerializedLexicalNode {
  type: 'divider';
}

export class DividerNode extends DecoratorNode<React.ReactElement> {
  static getType(): string {
    return 'divider';
  }

  static clone(node: DividerNode): DividerNode {
    return new DividerNode(node.__key);
  }

  constructor(key?: NodeKey) {
    super(key);
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const dom = document.createElement('div');
    dom.style.display = 'contents';
    return dom;
  }

  updateDOM(): boolean {
    return false;
  }

  static importJSON(_serializedNode: SerializedDividerNode): DividerNode {
    return $createDividerNode();
  }

  exportJSON(): SerializedDividerNode {
    return {
      type: 'divider',
      version: 1,
    };
  }

  exportDOM(_editor: LexicalEditor): DOMExportOutput {
    return { element: document.createElement('hr') };
  }

  decorate(): React.ReactElement {
    return <DividerComponent />;
  }

  isInline(): boolean {
    return false;
  }
}

export function $createDividerNode(): DividerNode {
  return new DividerNode();
}

export function $isDividerNode(node: LexicalNode | null | undefined): node is DividerNode {
  return node instanceof DividerNode;
}

function DividerComponent() {
  return (
    <div className="my-4 py-2" contentEditable={false}>
      <hr className="border-t border-surface-border" />
    </div>
  );
}
