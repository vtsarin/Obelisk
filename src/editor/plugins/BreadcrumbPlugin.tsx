import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  $isElementNode,
  type ElementNode,
} from 'lexical';
import { $isHeadingNode } from '@lexical/rich-text';
import { create } from 'zustand';

export interface BreadcrumbItem {
  key: string;
  label: string;
  type: string;
}

interface BreadcrumbState {
  items: BreadcrumbItem[];
  setItems: (items: BreadcrumbItem[]) => void;
}

export const useBreadcrumbStore = create<BreadcrumbState>((set) => ({
  items: [],
  setItems: (items) => set({ items }),
}));

function getNodeLabel(node: ElementNode): string {
  if ($isHeadingNode(node)) {
    return `${node.getTag().toUpperCase()}: ${node.getTextContent().slice(0, 30)}`;
  }
  const type = node.getType();
  const typeLabels: Record<string, string> = {
    root: 'Document',
    paragraph: 'Paragraph',
    quote: 'Quote',
    'list-item': 'List Item',
    list: 'List',
    callout: 'Callout',
    toggle: 'Toggle',
    code: 'Code',
  };
  return typeLabels[type] ?? type;
}

export function BreadcrumbPlugin() {
  const [editor] = useLexicalComposerContext();
  const setItems = useBreadcrumbStore((s) => s.setItems);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
          setItems([]);
          return;
        }

        const anchor = selection.anchor.getNode();
        const crumbs: BreadcrumbItem[] = [];

        let current = $isElementNode(anchor) ? anchor : anchor.getParent();
        while (current) {
          const type = current.getType();
          if (type === 'root') {
            crumbs.unshift({ key: current.getKey(), label: 'Doc', type });
            break;
          }
          crumbs.unshift({
            key: current.getKey(),
            label: getNodeLabel(current as ElementNode),
            type,
          });
          current = current.getParent();
        }

        setItems(crumbs);
      });
    });
  }, [editor, setItems]);

  return null;
}
