import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  COMMAND_PRIORITY_HIGH,
  PASTE_COMMAND,
  DROP_COMMAND,
  $getSelection,
  $isRangeSelection,
} from 'lexical';
import { $insertNodeToNearestRoot } from '@lexical/utils';
import { assetStore } from '@/db/assetStore.impl';
import { $createImageNode } from '../nodes/ImageNode';

export function ImagePastePlugin({ docId }: { docId: string }) {
  const [editor] = useLexicalComposerContext();

  // Handle file picker from slash menu / toolbar
  useEffect(() => {
    const handler = async (e: Event) => {
      const file = (e as CustomEvent).detail?.file as File | undefined;
      if (!file || !file.type.startsWith('image/')) return;

      const path = await assetStore.put(docId, file, file.name);
      editor.update(() => {
        const imageNode = $createImageNode(path, file.name);
        $insertNodeToNearestRoot(imageNode);
      });
    };

    window.addEventListener('obelisk:insert-image', handler);
    return () => window.removeEventListener('obelisk:insert-image', handler);
  }, [editor, docId]);

  // Handle paste
  useEffect(() => {
    return editor.registerCommand(
      PASTE_COMMAND,
      (event) => {
        const clipboardEvent = event as ClipboardEvent;
        const items = clipboardEvent.clipboardData?.items;
        if (!items) return false;

        for (const item of Array.from(items)) {
          if (item.type.startsWith('image/')) {
            clipboardEvent.preventDefault();
            const file = item.getAsFile();
            if (!file) continue;

            assetStore.put(docId, file).then((path) => {
              editor.update(() => {
                const imageNode = $createImageNode(path, 'Pasted image');
                const selection = $getSelection();
                if ($isRangeSelection(selection)) {
                  $insertNodeToNearestRoot(imageNode);
                }
              });
            });
            return true;
          }
        }
        return false;
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [editor, docId]);

  // Handle drop
  useEffect(() => {
    return editor.registerCommand(
      DROP_COMMAND,
      (event) => {
        const dragEvent = event as DragEvent;
        const files = dragEvent.dataTransfer?.files;
        if (!files || files.length === 0) return false;

        for (const file of Array.from(files)) {
          if (file.type.startsWith('image/')) {
            dragEvent.preventDefault();
            assetStore.put(docId, file, file.name).then((path) => {
              editor.update(() => {
                const imageNode = $createImageNode(path, file.name);
                $insertNodeToNearestRoot(imageNode);
              });
            });
            return true;
          }
        }
        return false;
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [editor, docId]);

  return null;
}
