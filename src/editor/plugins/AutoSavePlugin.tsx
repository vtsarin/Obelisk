import { useEffect, useRef, useCallback } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot } from 'lexical';
import { workspaceStore } from '@/db/workspaceStore.impl';
import { useWorkspaceStore } from '@/store/workspaceStore';

const SAVE_DEBOUNCE_MS = 1000;

export function AutoSavePlugin({ docId }: { docId: string }) {
  const [editor] = useLexicalComposerContext();
  const setSaveStatus = useWorkspaceStore((s) => s.setSaveStatus);
  const refreshTree = useWorkspaceStore((s) => s.refreshTree);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback(async () => {
    try {
      setSaveStatus('saving');
      const state = editor.getEditorState().toJSON();
      const plainText = editor.getEditorState().read(() => $getRoot().getTextContent());
      const title = editor.getEditorState().read(() => {
        const root = $getRoot();
        const first = root.getFirstChild();
        if (first) {
          const text = first.getTextContent().trim();
          if (text) return text;
        }
        return 'Untitled';
      });

      await workspaceStore.saveContent(docId, state, plainText, title);
      await workspaceStore.snapshot(docId, state);
      await refreshTree();
      setSaveStatus('saved');

      // Fade to idle after 2s
      setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
    } catch (err) {
      console.error('Save failed:', err);
      setSaveStatus('error');
    }
  }, [docId, editor, setSaveStatus, refreshTree]);

  useEffect(() => {
    const unregister = editor.registerUpdateListener(({ dirtyElements, dirtyLeaves }) => {
      if (dirtyElements.size === 0 && dirtyLeaves.size === 0) return;

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(save, SAVE_DEBOUNCE_MS);
    });

    return () => {
      unregister();
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [editor, save]);

  return null;
}
