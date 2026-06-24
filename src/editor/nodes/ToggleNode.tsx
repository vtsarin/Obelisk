import {
  ElementNode,
  $applyNodeReplacement,
  $getNodeByKey,
  type LexicalNode,
  type NodeKey,
  type SerializedElementNode,
  type Spread,
  type EditorConfig,
  type DOMExportOutput,
  type LexicalEditor,
} from 'lexical';

export type SerializedToggleNode = Spread<
  { collapsed: boolean; summary: string },
  SerializedElementNode
>;

/**
 * A collapsible section. The FIRST child is the summary line; remaining
 * children are the collapsible content. Clicking the chevron gutter beside
 * the summary toggles `collapsed`; CSS hides non-first children when collapsed.
 * Kept as an ElementNode (children stay natively editable) — no React decorator.
 */
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
    this.getWritable().__collapsed = collapsed;
  }

  getSummary(): string {
    return this.__summary;
  }

  setSummary(summary: string): void {
    this.getWritable().__summary = summary;
  }

  createDOM(_config: EditorConfig, editor: LexicalEditor): HTMLElement {
    const dom = document.createElement('div');
    dom.classList.add('toggle-block');
    dom.setAttribute('data-collapsed', String(this.__collapsed));

    const key = this.__key;
    // Toggle when the click lands in the chevron gutter left of the summary.
    dom.addEventListener('mousedown', (e) => {
      const first = dom.firstElementChild as HTMLElement | null;
      if (!first) return;
      const r = first.getBoundingClientRect();
      if (e.clientX < r.left && e.clientY >= r.top - 2 && e.clientY <= r.bottom + 2) {
        e.preventDefault();
        editor.update(() => {
          const node = $getNodeByKey(key);
          if ($isToggleNode(node)) node.setCollapsed(!node.isCollapsed());
        });
      }
    });

    return dom;
  }

  updateDOM(prevNode: ToggleNode, dom: HTMLElement): boolean {
    if (prevNode.__collapsed !== this.__collapsed) {
      dom.setAttribute('data-collapsed', String(this.__collapsed));
    }
    return false;
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

  exportDOM(): DOMExportOutput {
    const element = document.createElement('div');
    element.classList.add('toggle-block');
    element.setAttribute('data-collapsed', String(this.__collapsed));
    return { element };
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
