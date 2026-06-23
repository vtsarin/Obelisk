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
  const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey);
  const [svgHtml, setSvgHtml] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [localSource, setLocalSource] = useState(source);
  const lastGoodSvg = useRef<string>('');
  const renderTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  if (isSelected) {
    return (
      <div className="my-4 border border-accent-500 rounded-lg overflow-hidden" contentEditable={false}>
        <div className="flex min-h-[200px]">
          <div className="w-1/2 border-r border-surface-border">
            <textarea
              className="w-full h-full min-h-[200px] p-3 bg-surface-secondary text-sm font-mono resize-none outline-none text-text-primary"
              value={localSource}
              onChange={(e) => handleSourceChange(e.target.value)}
              spellCheck={false}
            />
          </div>
          <div className="w-1/2 p-3 flex items-center justify-center bg-surface-primary overflow-auto">
            {error && (
              <div className="absolute top-0 left-0 right-0 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs px-3 py-1 z-10">
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
      className="my-4 p-4 rounded-lg border border-surface-border bg-surface-primary cursor-pointer hover:border-accent-400 transition-colors flex items-center justify-center min-h-[100px]"
      contentEditable={false}
      onClick={() => {
        clearSelection();
        setSelected(true);
      }}
    >
      {error && !svgHtml && (
        <div className="text-sm text-red-500">{error}</div>
      )}
      {svgHtml ? (
        <div
          className={error ? 'opacity-50' : ''}
          dangerouslySetInnerHTML={{ __html: svgHtml }}
        />
      ) : (
        <span className="text-sm text-text-tertiary">Mermaid diagram</span>
      )}
    </div>
  );
});
