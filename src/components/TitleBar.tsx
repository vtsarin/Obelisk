import React, { useEffect, useRef, useState } from 'react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { debounce } from 'lodash-es';

/**
 * Large, inline-editable document title that sits at the top of the page,
 * above the Lexical body. This is the source of truth for `DocRecord.title`
 * (see AutoSavePlugin, which now reflects the stored title rather than
 * re-deriving it from the first body line).
 */
export function TitleBar({ docId }: { docId: string }) {
  const doc = useWorkspaceStore((s) => s.docs.find((d) => d.id === docId));
  const renameItem = useWorkspaceStore((s) => s.renameItem);
  // Treat the placeholder title "Untitled" as empty so the field shows the
  // hint rather than literal text the user has to delete.
  const titleOf = (t?: string) => (t && t !== 'Untitled' ? t : '');
  const [value, setValue] = useState(titleOf(doc?.title));
  const taRef = useRef<HTMLTextAreaElement>(null);

  // Keep local state in sync when the active doc changes externally
  useEffect(() => {
    setValue(titleOf(doc?.title));
  }, [docId]); // eslint-disable-line react-hooks/exhaustive-deps

  const commit = useRef(
    debounce((id: string, name: string) => {
      renameItem(id, name.trim() || 'Untitled');
    }, 350)
  ).current;

  useEffect(() => () => commit.flush(), [commit]);

  const autoGrow = (el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  };

  useEffect(() => {
    autoGrow(taRef.current);
  }, [value]);

  const focusBody = () => {
    const editable = document.querySelector<HTMLElement>(
      '.obelisk-editor-root[contenteditable="true"]'
    );
    editable?.focus();
  };

  return (
    <textarea
      ref={taRef}
      value={value}
      rows={1}
      spellCheck={false}
      placeholder="Untitled"
      aria-label="Document title"
      className="w-full resize-none overflow-hidden bg-transparent outline-none border-none
                 text-[2.4rem] leading-[1.15] font-bold tracking-tight text-text-primary
                 placeholder:text-text-tertiary mb-2"
      onChange={(e) => {
        setValue(e.target.value.replace(/\n/g, ''));
        commit(docId, e.target.value);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || (e.key === 'ArrowDown' && taRef.current?.selectionStart === value.length)) {
          e.preventDefault();
          commit.flush();
          focusBody();
        }
      }}
      onBlur={() => commit.flush()}
    />
  );
}
