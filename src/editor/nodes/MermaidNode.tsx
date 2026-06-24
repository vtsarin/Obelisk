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

export type SerializedMermaidNode = Spread<
  { source: string },
  SerializedLexicalNode
>;

export class MermaidNode extends DecoratorNode<React.ReactElement> {
  __source: string;

  static getType(): string {
    return 'mermaid';
  }

  static clone(node: MermaidNode): MermaidNode {
    return new MermaidNode(node.__source, node.__key);
  }

  constructor(source: string = 'graph TD\n  A --> B', key?: NodeKey) {
    super(key);
    this.__source = source;
  }

  getSource(): string {
    return this.__source;
  }

  setSource(source: string): void {
    const writable = this.getWritable();
    writable.__source = source;
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const dom = document.createElement('div');
    dom.style.display = 'contents';
    return dom;
  }

  updateDOM(): boolean {
    return false;
  }

  static importJSON(serializedNode: SerializedMermaidNode): MermaidNode {
    return new MermaidNode(serializedNode.source);
  }

  exportJSON(): SerializedMermaidNode {
    return {
      type: 'mermaid',
      version: 1,
      source: this.__source,
    };
  }

  exportDOM(_editor: LexicalEditor): DOMExportOutput {
    const pre = document.createElement('pre');
    const code = document.createElement('code');
    code.className = 'language-mermaid';
    code.textContent = this.__source;
    pre.appendChild(code);
    return { element: pre };
  }

  decorate(): React.ReactElement {
    return <MermaidComponent source={this.__source} nodeKey={this.__key} />;
  }

  isInline(): boolean {
    return false;
  }
}

export function $createMermaidNode(source?: string): MermaidNode {
  return new MermaidNode(source);
}

export function $isMermaidNode(node: LexicalNode | null | undefined): node is MermaidNode {
  return node instanceof MermaidNode;
}

const MermaidComponent = memo(function MermaidComponent({
  source,
  nodeKey,
}: {
  source: string;
  nodeKey: NodeKey;
}) {
  const [editor] = useLexicalComposerContext();
  const [editing, setEditing] = useState(false);
  const [svgHtml, setSvgHtml] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [localSource, setLocalSource] = useState(source);
  const lastGoodSvg = useRef<string>('');
  const renderTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Render mermaid diagram
  useEffect(() => {
    let cancelled = false;

    async function render() {
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'loose' });
        const id = `mermaid-${nodeKey}-${Date.now()}`;
        const { svg } = await mermaid.render(id, source);
        if (!cancelled) {
          setSvgHtml(svg);
          lastGoodSvg.current = svg;
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Invalid Mermaid syntax');
          if (lastGoodSvg.current) {
            setSvgHtml(lastGoodSvg.current);
          }
        }
      }
    }

    if (renderTimer.current) clearTimeout(renderTimer.current);
    renderTimer.current = setTimeout(render, 300);

    return () => {
      cancelled = true;
    };
  }, [source, nodeKey]);

  // Sync local source with node source
  useEffect(() => {
    setLocalSource(source);
  }, [source]);

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [editing]);

  const handleSourceChange = useCallback(
    (newSource: string) => {
      setLocalSource(newSource);
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if (node && node instanceof MermaidNode) {
          node.setSource(newSource);
        }
      });
    },
    [editor, nodeKey]
  );

  if (editing) {
    return (
      <div className="my-4 border border-accent rounded-lg overflow-hidden" contentEditable={false}>
        <div className="flex items-center justify-between px-3 py-1.5 bg-surface-secondary border-b border-surface-border">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
            Mermaid · source &amp; preview
          </span>
          <button
            className="text-xs font-medium text-accent-fg hover:underline"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setEditing(false)}
          >
            Done
          </button>
        </div>
        <div className="flex min-h-[200px]">
          <div className="w-1/2 border-r border-surface-border">
            <textarea
              ref={textareaRef}
              className="w-full h-full min-h-[200px] p-3 bg-surface-primary text-sm font-mono resize-none outline-none text-text-primary"
              value={localSource}
              onChange={(e) => handleSourceChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.preventDefault();
                  setEditing(false);
                }
              }}
              spellCheck={false}
            />
          </div>
          <div className="relative w-1/2 p-3 flex items-center justify-center bg-surface-primary overflow-auto">
            {error && (
              <div className="absolute top-0 left-0 right-0 bg-red-500/10 text-red-500 text-xs px-3 py-1 z-10">
                {error}
              </div>
            )}
            <div
              className={error ? 'opacity-50' : ''}
              dangerouslySetInnerHTML={{ __html: svgHtml }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="group relative my-4 p-4 rounded-lg border border-surface-border bg-surface-primary cursor-pointer hover:border-accent transition-colors flex items-center justify-center min-h-[100px]"
      contentEditable={false}
      role="button"
      title="Click to edit"
      onClick={() => setEditing(true)}
    >
      <span className="absolute top-1.5 right-2 flex items-center gap-1 rounded-md border border-surface-border bg-surface-primary px-1.5 py-0.5 text-[11px] font-medium text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity">
        <Pencil className="w-3 h-3" /> Edit
      </span>
      {error && !svgHtml && (
        <div className="text-sm text-red-500">{error}</div>
      )}
      {svgHtml ? (
        <div
          className={error ? 'opacity-50' : ''}
          dangerouslySetInnerHTML={{ __html: svgHtml }}
        />
      ) : (
        <span className="text-sm text-text-tertiary">Mermaid diagram — click to edit</span>
      )}
    </div>
  );
});
