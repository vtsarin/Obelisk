import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import type { LexicalEditor } from 'lexical';

/**
 * A tiny registry holding the currently-mounted Lexical editor so components
 * rendered OUTSIDE the LexicalComposer (Breadcrumb, Outline) can drive
 * selection / scrolling without a window-event hack.
 */
let active: LexicalEditor | null = null;

export function getActiveEditor(): LexicalEditor | null {
  return active;
}

/** Mount inside the composer to publish the active editor instance. */
export function ActiveEditorPlugin(): null {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    active = editor;
    return () => {
      if (active === editor) active = null;
    };
  }, [editor]);
  return null;
}
