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
import { Pencil } from 'lucide-react';

export type SerializedMathBlockNode = Spread<
  { latex: string },
  SerializedLexicalNode
>;

export class MathBlockNode extends DecoratorNode<React.ReactElement> {
  __latex: string;

  static getType(): string {
    return 'math-block';
  }

  static clone(node: MathBlockNode): MathBlockNode {
    return new MathBlockNode(node.__latex, node.__key);
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
    const dom = document.createElement('div');
    dom.style.display = 'contents';
    return dom;
  }

  updateDOM(): boolean {
    return false;
  }

  static importJSON(serializedNode: SerializedMathBlockNode): MathBlockNode {
    return new MathBlockNode(serializedNode.latex);
  }

  exportJSON(): SerializedMathBlockNode {
    return {
      type: 'math-block',
      version: 1,
      latex: this.__latex,
    };
  }

  exportDOM(_editor: LexicalEditor): DOMExportOutput {
    const div = document.createElement('div');
    div.className = 'math-block';
    div.setAttribute('data-latex', this.__latex);
    return { element: div };
  }

  decorate(): React.ReactElement {
    return <MathBlockComponent latex={this.__latex} nodeKey={this.__key} />;
  }

  isInline(): boolean {
    return false;
  }
}

export function $createMathBlockNode(latex: string = ''): MathBlockNode {
  return new MathBlockNode(latex);
}

export function $isMathBlockNode(node: LexicalNode | null | undefined): node is MathBlockNode {
  return node instanceof MathBlockNode;
}

const MathBlockComponent = memo(function MathBlockComponent({
  latex,
  nodeKey,
}: {
  latex: string;
  nodeKey: NodeKey;
}) {
  const [editor] = useLexicalComposerContext();
  const [editing, setEditing] = useState(false);
  const [localLatex, setLocalLatex] = useState(latex);
  const [renderedHtml, setRenderedHtml] = useState('');
  const [renderError, setRenderError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setLocalLatex(latex);
  }, [latex]);

  useEffect(() => {
    if (editing) return;
    let cancelled = false;
    (async () => {
      try {
        const katex = (await import('katex')).default;
        const html = katex.renderToString(latex || '', {
          throwOnError: false,
          displayMode: true,
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
  }, [latex, editing]);

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [editing]);

  const commitLatex = useCallback(() => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if (node && node instanceof MathBlockNode) {
        node.setLatex(localLatex);
      }
    });
    setEditing(false);
  }, [editor, nodeKey, localLatex]);

  if (editing) {
    return (
      <div className="my-4 border border-accent rounded-lg overflow-hidden" contentEditable={false}>
        <div className="flex items-center justify-between px-3 py-1.5 bg-surface-secondary border-b border-surface-border">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
            LaTeX · display mode
          </span>
          <button
            className="text-xs font-medium text-accent-fg hover:underline"
            onMouseDown={(e) => e.preventDefault()}
            onClick={commitLatex}
          >
            Done
          </button>
        </div>
        <textarea
          ref={textareaRef}
          className="w-full min-h-[80px] p-3 bg-surface-primary font-mono text-sm resize-y outline-none text-text-primary"
          value={localLatex}
          onChange={(e) => setLocalLatex(e.target.value)}
          onBlur={commitLatex}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault();
              commitLatex();
            }
          }}
          spellCheck={false}
          placeholder="Enter LaTeX…  e.g. \int_0^\infty e^{-x}\,dx = 1"
        />
      </div>
    );
  }

  return (
    <div
      className="group relative my-4 py-4 flex justify-center cursor-pointer hover:bg-surface-secondary rounded-lg transition-colors"
      contentEditable={false}
      role="button"
      title="Click to edit"
      onClick={() => setEditing(true)}
    >
      <span className="absolute top-1.5 right-2 flex items-center gap-1 rounded-md border border-surface-border bg-surface-primary px-1.5 py-0.5 text-[11px] font-medium text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity">
        <Pencil className="w-3 h-3" /> Edit
      </span>
      {renderError ? (
        <div className="text-red-500 text-sm font-mono">{latex || 'Empty math block'}</div>
      ) : renderedHtml ? (
        <div dangerouslySetInnerHTML={{ __html: renderedHtml }} />
      ) : (
        <span className="text-text-tertiary text-sm">Empty math block — click to edit</span>
      )}
    </div>
  );
});
