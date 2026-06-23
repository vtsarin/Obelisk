import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { exportToMarkdownZip } from '@/features/export/toMarkdown';
import { exportToHTML } from '@/features/export/toHTML';
import { insertBlock, type BlockType } from '../commands/insertBlock';
import type { DocRecord } from '@/types/models';

export function ExportBridgePlugin({ docId }: { docId: string }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const handleMarkdown = async (e: Event) => {
      const doc = (e as CustomEvent).detail?.doc as DocRecord;
      if (doc) {
        await exportToMarkdownZip(editor, doc);
      }
    };

    const handleHTML = async (e: Event) => {
      const doc = (e as CustomEvent).detail?.doc as DocRecord;
      if (doc) {
        await exportToHTML(editor, doc);
      }
    };

    const handleInsertBlock = (e: Event) => {
      const blockType = (e as CustomEvent).detail?.type as BlockType;
      if (blockType) {
        insertBlock(editor, blockType);
      }
    };

    const handleRestoreVersion = (e: Event) => {
      const state = (e as CustomEvent).detail?.state;
      if (state) {
        const editorState = editor.parseEditorState(JSON.stringify(state));
        editor.setEditorState(editorState);
      }
    };

    window.addEventListener('obelisk:export-markdown', handleMarkdown);
    window.addEventListener('obelisk:export-html', handleHTML);
    window.addEventListener('obelisk:insert-block', handleInsertBlock);
    window.addEventListener('obelisk:restore-version', handleRestoreVersion);

    return () => {
      window.removeEventListener('obelisk:export-markdown', handleMarkdown);
      window.removeEventListener('obelisk:export-html', handleHTML);
      window.removeEventListener('obelisk:insert-block', handleInsertBlock);
      window.removeEventListener('obelisk:restore-version', handleRestoreVersion);
    };
  }, [editor]);

  return null;
}
