import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  INDENT_CONTENT_COMMAND,
  COMMAND_PRIORITY_HIGH,
  $getSelection,
  $isRangeSelection,
  $isElementNode,
} from 'lexical';

const MAX_DEPTH = 3;

const LEAF_BLOCK_TYPES = new Set([
  'code',
  'image',
  'divider',
  'table',
  'embed',
  'mermaid',
  'math-block',
  'database-reference',
]);

function getNodeDepth(node: { getParent: () => { getType: () => string; getParent: () => unknown } | null }): number {
  let depth = 0;
  let current = node.getParent();
  while (current && typeof current === 'object' && 'getParent' in current) {
    const type = (current as { getType: () => string }).getType();
    if (type === 'root') break;
    depth++;
    current = (current as { getParent: () => unknown }).getParent() as typeof current;
  }
  return depth;
}

export function IndentRulesPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      INDENT_CONTENT_COMMAND,
      () => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return false;

        const nodes = selection.getNodes();
        for (const node of nodes) {
          const element = $isElementNode(node) ? node : node.getParent();
          if (!element || !$isElementNode(element)) continue;

          const type = element.getType();

          // Don't allow indenting leaf blocks
          if (LEAF_BLOCK_TYPES.has(type)) {
            return true; // Consume the command (no-op)
          }

          // Check depth limit
          const depth = getNodeDepth(element);
          if (depth >= MAX_DEPTH) {
            return true; // Consume the command (no-op)
          }
        }

        return false; // Let default indent behavior proceed
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [editor]);

  return null;
}
