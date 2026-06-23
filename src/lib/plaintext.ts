import { $getRoot, type LexicalEditor } from 'lexical';

export function extractPlainText(editor: LexicalEditor): string {
  return editor.getEditorState().read(() => {
    return $getRoot().getTextContent();
  });
}

export function extractTitle(editor: LexicalEditor): string {
  return editor.getEditorState().read(() => {
    const root = $getRoot();
    const firstChild = root.getFirstChild();
    if (firstChild) {
      const text = firstChild.getTextContent().trim();
      if (text) return text;
    }
    return 'Untitled';
  });
}
