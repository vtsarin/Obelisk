import {
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  type LexicalEditor,
} from 'lexical';
import { $createHeadingNode, $createQuoteNode } from '@lexical/rich-text';
import { $createListNode, $createListItemNode } from '@lexical/list';
import { $createCodeNode } from '@lexical/code';
import { $createTableNodeWithDimensions } from '@lexical/table';
import { $createCalloutNode, type CalloutVariant } from '../nodes/CalloutNode';
import { $createToggleNode } from '../nodes/ToggleNode';
import { $createDividerNode } from '../nodes/DividerNode';
import { $createImageNode } from '../nodes/ImageNode';
import { $createEmbedNode } from '../nodes/EmbedNode';
import { $createMermaidNode } from '../nodes/MermaidNode';
import { $createMathNode } from '../nodes/MathNode';
import { $createMathBlockNode } from '../nodes/MathBlockNode';
import { $createMentionNode } from '../nodes/MentionNode';
import { $createDatabaseReferenceNode } from '../nodes/DatabaseReferenceNode';
import { $insertNodeToNearestRoot } from '@lexical/utils';

export type BlockType =
  | 'paragraph'
  | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  | 'bullet-list' | 'numbered-list'
  | 'quote'
  | 'code'
  | 'table'
  | 'callout-info' | 'callout-warning' | 'callout-tip' | 'callout-danger' | 'callout-note'
  | 'toggle'
  | 'divider'
  | 'image'
  | 'embed'
  | 'mermaid'
  | 'math-inline'
  | 'math-block'
  | 'mention'
  | 'database-reference';

export interface BlockPaletteItem {
  type: BlockType;
  label: string;
  description: string;
  icon: string;
  aliases: string[];
  group: 'basic' | 'media' | 'advanced' | 'inline';
}

export const blockPalette: BlockPaletteItem[] = [
  { type: 'paragraph', label: 'Text', description: 'Plain text block', icon: 'Type', aliases: ['text', 'paragraph', 'p'], group: 'basic' },
  { type: 'h1', label: 'Heading 1', description: 'Large heading', icon: 'Heading1', aliases: ['h1', 'heading1', 'title'], group: 'basic' },
  { type: 'h2', label: 'Heading 2', description: 'Medium heading', icon: 'Heading2', aliases: ['h2', 'heading2', 'subtitle'], group: 'basic' },
  { type: 'h3', label: 'Heading 3', description: 'Small heading', icon: 'Heading3', aliases: ['h3', 'heading3'], group: 'basic' },
  { type: 'h4', label: 'Heading 4', description: 'Tiny heading', icon: 'Heading4', aliases: ['h4', 'heading4'], group: 'basic' },
  { type: 'bullet-list', label: 'Bullet List', description: 'Unordered list', icon: 'List', aliases: ['ul', 'bullet', 'unordered'], group: 'basic' },
  { type: 'numbered-list', label: 'Numbered List', description: 'Ordered list', icon: 'ListOrdered', aliases: ['ol', 'numbered', 'ordered'], group: 'basic' },
  { type: 'quote', label: 'Quote', description: 'Block quote', icon: 'Quote', aliases: ['blockquote', 'quote'], group: 'basic' },
  { type: 'code', label: 'Code Block', description: 'Syntax-highlighted code', icon: 'Code', aliases: ['code', 'codeblock', 'pre'], group: 'basic' },
  { type: 'table', label: 'Table', description: '3×3 table', icon: 'Table', aliases: ['table', 'grid'], group: 'basic' },
  { type: 'divider', label: 'Divider', description: 'Horizontal rule', icon: 'Minus', aliases: ['hr', 'divider', 'separator', 'line'], group: 'basic' },
  { type: 'callout-info', label: 'Callout (Info)', description: 'Info callout block', icon: 'Info', aliases: ['callout', 'info', 'note'], group: 'advanced' },
  { type: 'callout-warning', label: 'Callout (Warning)', description: 'Warning callout', icon: 'AlertTriangle', aliases: ['warning', 'caution'], group: 'advanced' },
  { type: 'callout-tip', label: 'Callout (Tip)', description: 'Tip callout', icon: 'Lightbulb', aliases: ['tip', 'hint'], group: 'advanced' },
  { type: 'callout-danger', label: 'Callout (Danger)', description: 'Danger callout', icon: 'AlertOctagon', aliases: ['danger', 'error'], group: 'advanced' },
  { type: 'callout-note', label: 'Callout (Note)', description: 'Note callout', icon: 'StickyNote', aliases: ['note'], group: 'advanced' },
  { type: 'toggle', label: 'Toggle', description: 'Collapsible section', icon: 'ChevronRight', aliases: ['toggle', 'collapse', 'accordion', 'details'], group: 'advanced' },
  { type: 'image', label: 'Image', description: 'Upload an image', icon: 'Image', aliases: ['image', 'img', 'picture', 'photo'], group: 'media' },
  { type: 'embed', label: 'Embed', description: 'Embed a URL (YouTube, Vimeo, Figma)', icon: 'ExternalLink', aliases: ['embed', 'iframe', 'youtube', 'vimeo', 'figma'], group: 'media' },
  { type: 'mermaid', label: 'Mermaid Diagram', description: 'Create a Mermaid diagram', icon: 'GitBranch', aliases: ['mermaid', 'diagram', 'flowchart', 'chart'], group: 'media' },
  { type: 'math-inline', label: 'Inline Math', description: 'Inline LaTeX formula', icon: 'Sigma', aliases: ['math', 'latex', 'formula', 'equation'], group: 'inline' },
  { type: 'math-block', label: 'Math Block', description: 'Display-mode LaTeX', icon: 'Sigma', aliases: ['mathblock', 'displaymath', 'equation'], group: 'advanced' },
  { type: 'mention', label: 'Mention', description: 'Mention a doc or user', icon: 'AtSign', aliases: ['mention', 'at', '@'], group: 'inline' },
  { type: 'database-reference', label: 'Database', description: 'Linked database (coming soon)', icon: 'Database', aliases: ['database', 'db', 'linked'], group: 'advanced' },
];

export function insertBlock(editor: LexicalEditor, blockType: BlockType): void {
  editor.update(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return;

    switch (blockType) {
      case 'paragraph': {
        const node = $createParagraphNode();
        $insertNodeToNearestRoot(node);
        node.selectEnd();
        break;
      }
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6': {
        const tag = blockType as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
        const node = $createHeadingNode(tag);
        $insertNodeToNearestRoot(node);
        node.selectEnd();
        break;
      }
      case 'bullet-list': {
        const list = $createListNode('bullet');
        const item = $createListItemNode();
        list.append(item);
        $insertNodeToNearestRoot(list);
        item.selectEnd();
        break;
      }
      case 'numbered-list': {
        const list = $createListNode('number');
        const item = $createListItemNode();
        list.append(item);
        $insertNodeToNearestRoot(list);
        item.selectEnd();
        break;
      }
      case 'quote': {
        const quote = $createQuoteNode();
        $insertNodeToNearestRoot(quote);
        quote.selectEnd();
        break;
      }
      case 'code': {
        const code = $createCodeNode();
        $insertNodeToNearestRoot(code);
        code.selectEnd();
        break;
      }
      case 'table': {
        const table = $createTableNodeWithDimensions(3, 3, false);
        $insertNodeToNearestRoot(table);
        break;
      }
      case 'callout-info':
      case 'callout-warning':
      case 'callout-tip':
      case 'callout-danger':
      case 'callout-note': {
        const variant = blockType.replace('callout-', '') as CalloutVariant;
        const callout = $createCalloutNode(variant);
        const p = $createParagraphNode();
        callout.append(p);
        $insertNodeToNearestRoot(callout);
        p.selectEnd();
        break;
      }
      case 'toggle': {
        const toggle = $createToggleNode(false, 'Toggle');
        const p = $createParagraphNode();
        toggle.append(p);
        $insertNodeToNearestRoot(toggle);
        p.selectEnd();
        break;
      }
      case 'divider': {
        const divider = $createDividerNode();
        $insertNodeToNearestRoot(divider);
        const p = $createParagraphNode();
        divider.insertAfter(p);
        p.selectEnd();
        break;
      }
      case 'image': {
        // Trigger file picker
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async () => {
          const file = input.files?.[0];
          if (!file) return;
          // We'll handle this via the ImagePastePlugin flow
          // For now just dispatch a custom event
          window.dispatchEvent(new CustomEvent('obelisk:insert-image', { detail: { file } }));
        };
        input.click();
        break;
      }
      case 'embed': {
        const url = prompt('Enter URL to embed:');
        if (url) {
          const embed = $createEmbedNode(url);
          $insertNodeToNearestRoot(embed);
        }
        break;
      }
      case 'mermaid': {
        const mermaid = $createMermaidNode();
        $insertNodeToNearestRoot(mermaid);
        break;
      }
      case 'math-inline': {
        const math = $createMathNode('E = mc^2');
        selection.insertNodes([math]);
        break;
      }
      case 'math-block': {
        const mathBlock = $createMathBlockNode('\\int_0^\\infty e^{-x} dx = 1');
        $insertNodeToNearestRoot(mathBlock);
        break;
      }
      case 'mention': {
        const label = prompt('Document name to mention:');
        if (label) {
          const mention = $createMentionNode('doc', '', label);
          selection.insertNodes([mention]);
        }
        break;
      }
      case 'database-reference': {
        const title = prompt('Database title:') ?? 'Untitled Database';
        const dbRef = $createDatabaseReferenceNode(title);
        $insertNodeToNearestRoot(dbRef);
        break;
      }
    }
  });
}
