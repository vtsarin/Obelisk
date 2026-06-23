import type { LexicalEditor } from 'lexical';
import { $convertFromMarkdownString, TRANSFORMERS } from '@lexical/markdown';

export function importFromMarkdown(editor: LexicalEditor, markdownString: string): void {
  editor.update(() => {
    $convertFromMarkdownString(markdownString, TRANSFORMERS);
  });
}

export const MARKDOWN_IMPORT_NOTICE =
  'Markdown import maps to basic blocks. Advanced formatting (callouts, toggles, Mermaid diagrams, math, embeds) may be simplified. For lossless import, use the JSON format.';
