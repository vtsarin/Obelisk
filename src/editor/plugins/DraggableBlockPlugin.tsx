import React, { useRef, useCallback, useState } from 'react';
import { DraggableBlockPlugin_EXPERIMENTAL } from '@lexical/react/LexicalDraggableBlockPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getRoot,
  $getNodeByKey,
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  $createNodeSelection,
  $setSelection,
  type LexicalEditor,
} from 'lexical';
import {
  $generateJSONFromSelectedNodes,
  $generateNodesFromSerializedNodes,
} from '@lexical/clipboard';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Plus, GripVertical, ArrowUp, ArrowDown, Copy, Trash2 } from 'lucide-react';

const MENU_CLASS = 'draggable-block-menu';

function isOnMenu(element: HTMLElement): boolean {
  return !!element.closest(`.${MENU_CLASS}`);
}

/** Find the top-level block whose vertical range contains clientY. */
function topBlockKeyAtY(editor: LexicalEditor, y: number): string | null {
  let found: string | null = null;
  editor.getEditorState().read(() => {
    const children = $getRoot().getChildren();
    for (const child of children) {
      const el = editor.getElementByKey(child.getKey());
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (r.top - 6 > y) break; // children are ordered top→bottom
      if (y >= r.top - 6 && y <= r.bottom + 6) {
        found = child.getKey();
        return;
      }
      found = child.getKey(); // remember last block above the cursor as fallback
    }
  });
  return found;
}

export function DraggableBlockPlugin({ anchorElem }: { anchorElem: HTMLElement }) {
  const [editor] = useLexicalComposerContext();
  const menuRef = useRef<HTMLDivElement>(null);
  const targetLineRef = useRef<HTMLDivElement>(null);
  const hoveredKeyRef = useRef<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // While the actions dropdown is open, freeze the handle's position so the
  // plugin's mousemove/mouseleave tracking can't move it (and its anchored
  // dropdown) offscreen. Inline !important beats the plugin's inline styles.
  const onMenuOpenChange = useCallback((open: boolean) => {
    setMenuOpen(open);
    const el = menuRef.current;
    if (!el) return;
    if (open) {
      el.style.setProperty('opacity', '1', 'important');
      el.style.setProperty('transform', el.style.transform, 'important');
    } else {
      el.style.removeProperty('opacity');
      el.style.removeProperty('transform');
    }
  }, []);

  // Mirror the plugin's hover tracking so the "+" and actions menu know the
  // block the handle is currently sitting on.
  const trackHover = useCallback(
    (e: MouseEvent) => {
      if (isOnMenu(e.target as HTMLElement)) return;
      hoveredKeyRef.current = topBlockKeyAtY(editor, e.clientY);
    },
    [editor]
  );

  React.useEffect(() => {
    const scroller = anchorElem.parentElement;
    if (!scroller) return;
    scroller.addEventListener('mousemove', trackHover);
    return () => scroller.removeEventListener('mousemove', trackHover);
  }, [anchorElem, trackHover]);

  const withBlock = useCallback(
    (fn: (key: string) => void) => {
      const key = hoveredKeyRef.current;
      if (key) fn(key);
    },
    []
  );

  // Insert an empty paragraph below and open the slash menu by seeding "/",
  // so the user picks a block type (matches the Notion mental model).
  const addBelow = () =>
    withBlock((key) =>
      editor.update(() => {
        const node = $getNodeByKey(key);
        if (!node) return;
        const p = $createParagraphNode();
        node.insertAfter(p);
        p.selectStart();
        const sel = $getSelection();
        if ($isRangeSelection(sel)) sel.insertText('/');
      })
    );

  const moveUp = () =>
    withBlock((key) =>
      editor.update(() => {
        const node = $getNodeByKey(key);
        const prev = node?.getPreviousSibling();
        if (node && prev) prev.insertBefore(node);
      })
    );

  const moveDown = () =>
    withBlock((key) =>
      editor.update(() => {
        const node = $getNodeByKey(key);
        const next = node?.getNextSibling();
        if (node && next) next.insertAfter(node);
      })
    );

  const duplicate = () =>
    withBlock((key) =>
      editor.update(() => {
        const node = $getNodeByKey(key);
        if (!node) return;
        const sel = $createNodeSelection();
        sel.add(key);
        $setSelection(sel);
        const { nodes } = $generateJSONFromSelectedNodes(editor, sel);
        const clones = $generateNodesFromSerializedNodes(nodes);
        let anchor = node;
        for (const clone of clones) {
          anchor.insertAfter(clone);
          anchor = clone;
        }
      })
    );

  const remove = () =>
    withBlock((key) =>
      editor.update(() => {
        $getNodeByKey(key)?.remove();
      })
    );

  return (
    <DraggableBlockPlugin_EXPERIMENTAL
      anchorElem={anchorElem}
      menuRef={menuRef as React.RefObject<HTMLDivElement>}
      targetLineRef={targetLineRef as React.RefObject<HTMLDivElement>}
      isOnMenu={isOnMenu}
      menuComponent={
        <div ref={menuRef} className={MENU_CLASS}>
          <button
            type="button"
            className="draggable-block-btn"
            aria-label="Insert block below"
            onClick={addBelow}
          >
            <Plus className="w-4 h-4" />
          </button>

          <DropdownMenu.Root open={menuOpen} onOpenChange={onMenuOpenChange}>
            <DropdownMenu.Trigger asChild>
              <button
                type="button"
                className="draggable-block-btn"
                aria-label="Block actions / drag to move"
              >
                <GripVertical className="w-4 h-4" />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="start"
                sideOffset={4}
                className="z-[60] min-w-[180px] rounded-lg border border-surface-border bg-surface-primary p-1 shadow-lg
                           data-[state=open]:animate-scale-fade"
              >
                <BlockMenuItem icon={<ArrowUp className="w-4 h-4" />} label="Move up" onSelect={moveUp} />
                <BlockMenuItem icon={<ArrowDown className="w-4 h-4" />} label="Move down" onSelect={moveDown} />
                <BlockMenuItem icon={<Copy className="w-4 h-4" />} label="Duplicate" onSelect={duplicate} />
                <DropdownMenu.Separator className="my-1 h-px bg-surface-border" />
                <BlockMenuItem
                  icon={<Trash2 className="w-4 h-4" />}
                  label="Delete"
                  onSelect={remove}
                  destructive
                />
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      }
      targetLineComponent={<div ref={targetLineRef} className="draggable-block-target-line" />}
    />
  );
}

function BlockMenuItem({
  icon,
  label,
  onSelect,
  destructive,
}: {
  icon: React.ReactNode;
  label: string;
  onSelect: () => void;
  destructive?: boolean;
}) {
  return (
    <DropdownMenu.Item
      onSelect={onSelect}
      className={`flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm cursor-pointer outline-none
        data-[highlighted]:bg-surface-hover ${
          destructive
            ? 'text-red-500 data-[highlighted]:text-red-500'
            : 'text-text-secondary data-[highlighted]:text-text-primary'
        }`}
    >
      <span className="shrink-0">{icon}</span>
      {label}
    </DropdownMenu.Item>
  );
}
