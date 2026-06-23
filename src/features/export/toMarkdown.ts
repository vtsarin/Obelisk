import type { LexicalEditor } from 'lexical';
import { $convertToMarkdownString, TRANSFORMERS } from '@lexical/markdown';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { slug } from '@/lib/slug';
import { format } from 'date-fns';
import { assetStore } from '@/db/assetStore.impl';
import type { DocRecord } from '@/types/models';

export async function exportToMarkdownZip(
  editor: LexicalEditor,
  doc: DocRecord
): Promise<void> {
  // Get markdown string
  const markdown = editor.getEditorState().read(() => {
    return $convertToMarkdownString(TRANSFORMERS);
  });

  const zip = new JSZip();

  // Add markdown file
  zip.file('document.md', markdown);

  // Collect and add images
  const assets = await assetStore.list(doc.id);
  const imagesFolder = zip.folder('images');
  for (const asset of assets) {
    const blob = await assetStore.getBlob(asset.path);
    if (blob && imagesFolder) {
      const filename = asset.path.split('/').pop() ?? 'image';
      imagesFolder.file(filename, blob);
    }
  }

  // Add README
  zip.file(
    'README.txt',
    `Exported from Obelisk on ${format(Date.now(), 'yyyy-MM-dd HH:mm')}\n\n` +
    `Note: This Markdown export may have simplified some advanced blocks\n` +
    `(callouts, toggles, Mermaid diagrams, math, embeds, etc.)\n` +
    `that don't have standard Markdown equivalents.\n\n` +
    `For a lossless export, use the JSON format.`
  );

  const blob = await zip.generateAsync({ type: 'blob' });
  const filename = `${slug(doc.title)}-${format(Date.now(), 'yyyyMMdd')}.zip`;
  saveAs(blob, filename);
}
