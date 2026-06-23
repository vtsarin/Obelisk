import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, $isElementNode, type LexicalNode } from 'lexical';
import { $isHeadingNode } from '@lexical/rich-text';
import { create } from 'zustand';

export interface OutlineItem {
  key: string;
  text: string;
  tag: string;
  level: number;
}

interface OutlineState {
  items: OutlineItem[];
  setItems: (items: OutlineItem[]) => void;
}

export const useOutlineStore = create<OutlineState>((set) => ({
  items: [],
  setItems: (items) => set({ items }),
}));

function collectHeadings(node: LexicalNode): OutlineItem[] {
  const items: OutlineItem[] = [];

  if ($isHeadingNode(node)) {
    const tag = node.getTag();
    const level = parseInt(tag.replace('h', ''), 10);
    items.push({
      key: node.getKey(),
      text: node.getTextContent(),
      tag,
      level,
    });
  }

  if ($isElementNode(node)) {
    for (const child of node.getChildren()) {
      items.push(...collectHeadings(child));
    }
  }

  return items;
}

export function OutlinePlugin() {
  const [editor] = useLexicalComposerContext();
  const setItems = useOutlineStore((s) => s.setItems);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const root = $getRoot();
        const headings = collectHeadings(root);
        setItems(headings);
      });
    });
  }, [editor, setItems]);

  return null;
}
