import React, { useEffect, useState, useCallback } from 'react';
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
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { assetStore } from '@/db/assetStore.impl';
import { cn } from '@/lib/cn';

export type SerializedImageNode = Spread<
  {
    assetPath: string;
    alt: string;
    caption?: string;
    width?: number;
  },
  SerializedLexicalNode
>;

export class ImageNode extends DecoratorNode<React.ReactElement> {
  __assetPath: string;
  __alt: string;
  __caption: string;
  __width: number | undefined;

  static getType(): string {
    return 'image';
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(node.__assetPath, node.__alt, node.__caption, node.__width, node.__key);
  }

  constructor(
    assetPath: string,
    alt: string = '',
    caption: string = '',
    width?: number,
    key?: NodeKey
  ) {
    super(key);
    this.__assetPath = assetPath;
    this.__alt = alt;
    this.__caption = caption;
    this.__width = width;
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const dom = document.createElement('figure');
    dom.style.display = 'contents';
    return dom;
  }

  updateDOM(): boolean {
    return false;
  }

  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    return new ImageNode(
      serializedNode.assetPath,
      serializedNode.alt,
      serializedNode.caption ?? '',
      serializedNode.width
    );
  }

  exportJSON(): SerializedImageNode {
    return {
      type: 'image',
      version: 1,
      assetPath: this.__assetPath,
      alt: this.__alt,
      caption: this.__caption || undefined,
      width: this.__width,
    };
  }

  exportDOM(_editor: LexicalEditor): DOMExportOutput {
    const figure = document.createElement('figure');
    const img = document.createElement('img');
    img.setAttribute('alt', this.__alt);
    img.setAttribute('data-asset-path', this.__assetPath);
    if (this.__width) img.style.width = `${this.__width}px`;
    figure.appendChild(img);
    if (this.__caption) {
      const figcaption = document.createElement('figcaption');
      figcaption.textContent = this.__caption;
      figure.appendChild(figcaption);
    }
    return { element: figure };
  }

  decorate(): React.ReactElement {
    return (
      <ImageComponent
        assetPath={this.__assetPath}
        alt={this.__alt}
        caption={this.__caption}
        width={this.__width}
        nodeKey={this.__key}
      />
    );
  }

  isInline(): boolean {
    return false;
  }

  getAssetPath(): string {
    return this.__assetPath;
  }
}

export function $createImageNode(
  assetPath: string,
  alt: string = '',
  caption: string = '',
  width?: number
): ImageNode {
  return new ImageNode(assetPath, alt, caption, width);
}

export function $isImageNode(node: LexicalNode | null | undefined): node is ImageNode {
  return node instanceof ImageNode;
}

function ImageComponent({
  assetPath,
  alt,
  caption,
  width,
  nodeKey,
}: {
  assetPath: string;
  alt: string;
  caption: string;
  width?: number;
  nodeKey: NodeKey;
}) {
  const [src, setSrc] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    assetStore.getURL(assetPath).then((url) => {
      if (!cancelled) {
        setSrc(url);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [assetPath]);

  if (loading) {
    return (
      <div className="my-4 flex items-center justify-center h-32 bg-surface-tertiary rounded-lg" contentEditable={false}>
        <span className="text-sm text-text-tertiary">Loading image…</span>
      </div>
    );
  }

  return (
    <figure className="my-4" contentEditable={false}>
      <img
        src={src}
        alt={alt}
        className={cn('max-w-full rounded-lg mx-auto block')}
        style={width ? { width: `${width}px` } : undefined}
        draggable={false}
      />
      {caption && (
        <figcaption className="text-center text-sm text-text-tertiary mt-2">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
