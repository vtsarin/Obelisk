import type { Klass, LexicalNode } from 'lexical';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { CodeNode, CodeHighlightNode } from '@lexical/code';
import { LinkNode, AutoLinkNode } from '@lexical/link';
import { TableNode, TableRowNode, TableCellNode } from '@lexical/table';
import { CalloutNode } from './CalloutNode';
import { ToggleNode } from './ToggleNode';
import { DividerNode } from './DividerNode';
import { ImageNode } from './ImageNode';
import { EmbedNode } from './EmbedNode';
import { MermaidNode } from './MermaidNode';
import { MathNode } from './MathNode';
import { MathBlockNode } from './MathBlockNode';
import { MentionNode } from './MentionNode';
import { DatabaseReferenceNode } from './DatabaseReferenceNode';

export const registeredNodes: Array<Klass<LexicalNode>> = [
  HeadingNode,
  QuoteNode,
  ListNode,
  ListItemNode,
  CodeNode,
  CodeHighlightNode,
  LinkNode,
  AutoLinkNode,
  TableNode,
  TableRowNode,
  TableCellNode,
  CalloutNode,
  ToggleNode,
  DividerNode,
  ImageNode,
  EmbedNode,
  MermaidNode,
  MathNode,
  MathBlockNode,
  MentionNode,
  DatabaseReferenceNode,
];
