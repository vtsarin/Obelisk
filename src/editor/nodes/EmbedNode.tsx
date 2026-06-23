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
import { ExternalLink } from 'lucide-react';

export type EmbedProvider = 'youtube' | 'vimeo' | 'figma' | 'generic';

export type SerializedEmbedNode = Spread<
  { url: string; provider?: EmbedProvider },
  SerializedLexicalNode
>;

function detectProvider(url: string): EmbedProvider {
  if (/youtube\.com|youtu\.be/i.test(url)) return 'youtube';
  if (/vimeo\.com/i.test(url)) return 'vimeo';
  if (/figma\.com/i.test(url)) return 'figma';
  return 'generic';
}

function getEmbedUrl(url: string, provider: EmbedProvider): string | null {
  if (provider === 'youtube') {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([^&?/]+)/);
    if (match) return `https://www.youtube.com/embed/${match[1]}`;
  }
  if (provider === 'vimeo') {
    const match = url.match(/vimeo\.com\/(\d+)/);
    if (match) return `https://player.vimeo.com/video/${match[1]}`;
  }
  if (provider === 'figma') {
    return `https://www.figma.com/embed?embed_host=obelisk&url=${encodeURIComponent(url)}`;
  }
  return null;
}

export class EmbedNode extends DecoratorNode<React.ReactElement> {
  __url: string;
  __provider: EmbedProvider;

  static getType(): string {
    return 'embed';
  }

  static clone(node: EmbedNode): EmbedNode {
    return new EmbedNode(node.__url, node.__provider, node.__key);
  }

  constructor(url: string, provider?: EmbedProvider, key?: NodeKey) {
    super(key);
    this.__url = url;
    this.__provider = provider ?? detectProvider(url);
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const dom = document.createElement('div');
    dom.style.display = 'contents';
    return dom;
  }

  updateDOM(): boolean {
    return false;
  }

  static importJSON(serializedNode: SerializedEmbedNode): EmbedNode {
    return new EmbedNode(serializedNode.url, serializedNode.provider);
  }

  exportJSON(): SerializedEmbedNode {
    return {
      type: 'embed',
      version: 1,
      url: this.__url,
      provider: this.__provider,
    };
  }

  exportDOM(_editor: LexicalEditor): DOMExportOutput {
    const div = document.createElement('div');
    const a = document.createElement('a');
    a.href = this.__url;
    a.textContent = this.__url;
    a.target = '_blank';
    div.appendChild(a);
    return { element: div };
  }

  decorate(): React.ReactElement {
    return <EmbedComponent url={this.__url} provider={this.__provider} />;
  }

  isInline(): boolean {
    return false;
  }
}

export function $createEmbedNode(url: string, provider?: EmbedProvider): EmbedNode {
  return new EmbedNode(url, provider);
}

export function $isEmbedNode(node: LexicalNode | null | undefined): node is EmbedNode {
  return node instanceof EmbedNode;
}

function EmbedComponent({ url, provider }: { url: string; provider: EmbedProvider }) {
  const embedUrl = getEmbedUrl(url, provider);

  if (embedUrl) {
    return (
      <div className="my-4 rounded-lg overflow-hidden border border-surface-border" contentEditable={false}>
        <iframe
          src={embedUrl}
          className="w-full aspect-video"
          sandbox="allow-scripts allow-same-origin allow-popups"
          allowFullScreen
          title="Embedded content"
        />
      </div>
    );
  }

  return (
    <div className="my-4 flex items-center gap-3 p-4 rounded-lg border border-surface-border bg-surface-secondary" contentEditable={false}>
      <ExternalLink className="w-5 h-5 text-text-tertiary shrink-0" />
      <div className="min-w-0">
        <p className="text-sm font-medium text-text-primary truncate">{url}</p>
        <p className="text-xs text-text-tertiary">Embedded link ({provider})</p>
      </div>
    </div>
  );
}
