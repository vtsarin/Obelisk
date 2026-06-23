import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import {
  DecoratorNode,
  type LexicalNode,
  type NodeKey,
  type SerializedLexicalNode,
  type Spread,
  type EditorConfig,
  type DOMExportOutput,
  type LexicalEditor,
  $getNodeByKey,
} from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection';

export type SerializedMathNode = Spread<
  { latex: string },
  SerializedLexicalNode
>;

export class MathNode extends DecoratorNode<React.ReactElement> {
  __latex: string;

  static getType(): string {
    return 'math';
  }

  static clone(node: MathNode): MathNode {
    return new MathNode(node.__latex, node.__key);
  }

  constructor(latex: string = '', key?: NodeKey) {
    super(key);
    this.__latex = latex;
  }

  getLatex(): string {
    return this.__latex;
  }

  setLatex(latex: string): void {
    const writable = this.getWritable();
    writable.__latex = latex;
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const dom = document.createElement('span');
    dom.className = 'math-inline';
    return dom;
  }

  updateDOM(): boolean {
    return false;
  }

  static importJSON(serializedNode: SerializedMathNode): MathNode {
    return new MathNode(serializedNode.latex);
  }

  exportJSON(): SerializedMathNode {
    return {
      type: 'math',
      version: 1,
      latex: this.__latex,
    };
  }

  exportDOM(_editor: LexicalEditor): DOMExportOutput {
    const span = document.createElement('span');
    span.className = 'math-inline';
    span.setAttribute('data-latex', this.__latex);
    return { element: span };
  }

  decorate(): React.ReactElement {
    return <InlineMathComponent latex={this.__latex} nodeKey={this.__key} />;
  }

  isInline(): boolean {
    return true;
  }
}

export function $createMathNode(latex: string = ''): MathNode {
  return new MathNode(latex);
}

export function $isMathNode(node: LexicalNode | null | undefined): node is MathNode {
  return node instanceof MathNode;
}

const InlineMathComponent = memo(function InlineMathComponent({
  latex,
  nodeKey,
}: {
  latex: string;
  nodeKey: NodeKey;
}) {
  const [editor] = useLexicalComposerContext();
  const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey);
  const [localLatex, setLocalLatex] = useState(latex);
  const [renderedHtml, setRenderedHtml] = useState('');
  const [renderError, setRenderError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalLatex(latex);
  }, [latex]);

  // Render KaTeX
  useEffect(() => {
    if (isSelected) return; // Don't render while editing
    let cancelled = false;
    (async () => {
      try {
        const katex = (await import('katex')).default;
        const html = katex.renderToString(latex, {
          throwOnError: false,
          displayMode: false,
        });
        if (!cancelled) {
          setRenderedHtml(html);
          setRenderError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setRenderError(err instanceof Error ? err.message : 'KaTeX error');
        }
      }
    })();
    return () => { cancelled = true; };
  }, [latex, isSelected]);

  useEffect(() => {
    if (isSelected && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSelected]);

  const commitLatex = useCallback(() => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if (node && node instanceof MathNode) {
        node.setLatex(localLatex);
      }
    });
    clearSelection();
  }, [editor, nodeKey, localLatex, clearSelection]);

  if (isSelected) {
    return (
      <span className="inline-flex items-center bg-accent-500/10 rounded px-1" contentEditable={false}>
        <span className="text-accent-500 text-xs mr-0.5">$</span>
        <input
          ref={inputRef}
          className="bg-transparent outline-none text-sm font-mono text-text-primary min-w-[40px]"
          style={{ width: `${Math.max(40, localLatex.length * 8)}px` }}
          value={localLatex}
          onChange={(e) => setLocalLatex(e.target.value)}
          onBlur={commitLatex}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === 'Escape') {
              e.preventDefault();
              commitLatex();
            }
          }}
        />
        <span className="text-accent-500 text-xs ml-0.5">$</span>
      </span>
    );
  }

  return (
    <span
      className="cursor-pointer hover:bg-accent-500/5 rounded px-0.5 inline"
      contentEditable={false}
      onClick={() => {
        clearSelection();
        setSelected(true);
      }}
      role="button"
      tabIndex={-1}
    >
      {renderError ? (
        <span className="text-red-500 text-sm font-mono">{latex || '?'}</span>
      ) : (
        <span dangerouslySetInnerHTML={{ __html: renderedHtml }} />
      )}
    </span>
  );
});
