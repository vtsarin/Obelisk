import type { LexicalEditor } from 'lexical';
import { $generateHtmlFromNodes } from '@lexical/html';
import { saveAs } from 'file-saver';
import { slug } from '@/lib/slug';
import { format } from 'date-fns';
import { assetStore } from '@/db/assetStore.impl';
import type { DocRecord } from '@/types/models';

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function exportToHTML(
  editor: LexicalEditor,
  doc: DocRecord
): Promise<void> {
  // Generate HTML from editor state
  let htmlContent = '';
  editor.getEditorState().read(() => {
    htmlContent = $generateHtmlFromNodes(editor);
  });

  // Replace asset paths with base64 inline
  const assets = await assetStore.list(doc.id);
  for (const asset of assets) {
    const blob = await assetStore.getBlob(asset.path);
    if (blob) {
      const base64 = await blobToBase64(blob);
      htmlContent = htmlContent.replace(
        new RegExp(`data-asset-path="${asset.path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'g'),
        `src="${base64}"`
      );
    }
  }

  const fullHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${doc.title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Fira+Code:wght@400;500&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', system-ui, sans-serif;
      color: #0f172a;
      background: #fff;
      line-height: 1.7;
      max-width: 720px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    h1 { font-size: 2em; font-weight: 700; margin: 1em 0 0.5em; }
    h2 { font-size: 1.5em; font-weight: 600; margin: 0.8em 0 0.4em; }
    h3 { font-size: 1.25em; font-weight: 600; margin: 0.6em 0 0.3em; }
    h4, h5, h6 { font-size: 1em; font-weight: 600; margin: 0.5em 0 0.25em; }
    p { margin: 4px 0; }
    blockquote { border-left: 3px solid #14b8a6; padding: 0.5em 1em; color: #475569; background: #f8fafc; margin: 0.5em 0; border-radius: 0 4px 4px 0; }
    ul, ol { padding-left: 1.5em; margin: 0.25em 0; }
    pre, code { font-family: 'Fira Code', monospace; }
    pre { background: #f1f5f9; padding: 1em; border-radius: 6px; margin: 0.5em 0; overflow-x: auto; font-size: 0.875em; }
    code { background: #f1f5f9; padding: 1px 4px; border-radius: 3px; font-size: 0.85em; }
    pre code { background: none; padding: 0; }
    table { border-collapse: collapse; width: 100%; margin: 0.5em 0; }
    th, td { border: 1px solid #e2e8f0; padding: 8px 12px; text-align: left; }
    th { background: #f8fafc; font-weight: 600; }
    img { max-width: 100%; border-radius: 8px; }
    figure { margin: 1em 0; }
    figcaption { text-align: center; font-size: 0.875em; color: #475569; margin-top: 0.5em; }
    hr { border: none; border-top: 1px solid #e2e8f0; margin: 1.5em 0; }
    a { color: #14b8a6; }
    strong { font-weight: 700; }
    em { font-style: italic; }
    del { text-decoration: line-through; }
    .mention { background: rgba(20,184,166,0.1); color: #0d9488; padding: 1px 6px; border-radius: 4px; font-weight: 500; }
    .callout-block { padding: 1em; border-left: 4px solid #3b82f6; background: #eff6ff; border-radius: 0 4px 4px 0; margin: 0.5em 0; }
    details { border: 1px solid #e2e8f0; border-radius: 6px; padding: 0.5em 1em; margin: 0.5em 0; }
    summary { font-weight: 500; cursor: pointer; }
  </style>
</head>
<body>
  <article>
    ${htmlContent}
  </article>
  <footer style="margin-top: 3em; padding-top: 1em; border-top: 1px solid #e2e8f0; font-size: 0.75em; color: #94a3b8;">
    Exported from Obelisk on ${format(Date.now(), 'yyyy-MM-dd HH:mm')}
  </footer>
</body>
</html>`;

  const blob = new Blob([fullHTML], { type: 'text/html' });
  const filename = `${slug(doc.title)}-${format(Date.now(), 'yyyyMMdd')}.html`;
  saveAs(blob, filename);
}
