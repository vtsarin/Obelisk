import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot } from 'lexical';
import { create } from 'zustand';
import { debounce } from 'lodash-es';

interface EditorStats {
  words: number;
  chars: number;
  setStats: (words: number, chars: number) => void;
}

export const useEditorStats = create<EditorStats>((set) => ({
  words: 0,
  chars: 0,
  setStats: (words, chars) => set({ words, chars }),
}));

/** Maintains live word/character counts for the footer, debounced for big docs. */
export function StatsPlugin() {
  const [editor] = useLexicalComposerContext();
  const setStats = useEditorStats((s) => s.setStats);

  useEffect(() => {
    const compute = debounce(() => {
      editor.getEditorState().read(() => {
        const text = $getRoot().getTextContent();
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        setStats(words, text.length);
      });
    }, 250);

    compute();
    const unregister = editor.registerUpdateListener(({ dirtyElements, dirtyLeaves }) => {
      if (dirtyElements.size === 0 && dirtyLeaves.size === 0) return;
      compute();
    });

    return () => {
      unregister();
      compute.cancel();
    };
  }, [editor, setStats]);

  return null;
}
