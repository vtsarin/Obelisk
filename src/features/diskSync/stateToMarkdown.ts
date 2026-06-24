import { createEditor, $getRoot, type SerializedEditorState } from 'lexical';
import { $convertToMarkdownString, TRANSFORMERS } from '@lexical/markdown';
import { registeredNodes } from '@/editor/nodes';

/**
 * Convert a stored Lexical editor state to Markdown without a mounted editor
 * (used by the on-disk sync). Custom blocks without Markdown transformers fall
 * back to their text content; on any failure we degrade to plain text.
 */
export function stateToMarkdown(state: SerializedEditorState): string {
  const root = (state as { root?: { children?: unknown[] } })?.root;
  if (!root || !Array.isArray(root.children) || root.children.length === 0) return '';

  const editor = createEditor({
    namespace: 'obelisk-disk-export',
    nodes: registeredNodes,
    onError: () => {},
  });

  try {
    editor.setEditorState(editor.parseEditorState(JSON.stringify(state)));
  } catch {
    return '';
  }

  try {
    return editor.getEditorState().read(() => $convertToMarkdownString(TRANSFORMERS));
  } catch {
    try {
      return editor.getEditorState().read(() => $getRoot().getTextContent());
    } catch {
      return '';
    }
  }
}
