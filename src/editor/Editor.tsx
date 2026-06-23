import React, { useEffect } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import type { SerializedEditorState } from 'lexical';

import { editorTheme } from './theme';
import { registeredNodes } from './nodes';
import { AutoSavePlugin } from './plugins/AutoSavePlugin';
import { SlashMenuPlugin } from './plugins/SlashMenuPlugin';
import { FloatingToolbarPlugin } from './plugins/FloatingToolbarPlugin';
import { TopToolbarPlugin } from './plugins/TopToolbarPlugin';
import { ImagePastePlugin } from './plugins/ImagePastePlugin';
import { MarkdownShortcutsPlugin } from './plugins/MarkdownShortcutsPlugin';
import { IndentRulesPlugin } from './plugins/IndentRulesPlugin';
import { OutlinePlugin } from './plugins/OutlinePlugin';
import { BreadcrumbPlugin } from './plugins/BreadcrumbPlugin';
import { ExportBridgePlugin } from './plugins/ExportBridgePlugin';

interface EditorProps {
  docId: string;
  initialState: SerializedEditorState | null;
}

function RestoreStatePlugin({
  docId,
  initialState,
}: {
  docId: string;
  initialState: SerializedEditorState | null;
}) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!initialState) return;

    // Validate that root has children before setting
    const root = (initialState as { root?: { children?: unknown[] } }).root;
    if (!root || !root.children || root.children.length === 0) {
      return; // Skip invalid/empty state, keep default paragraph
    }

    try {
      const parsed = editor.parseEditorState(JSON.stringify(initialState));
      editor.setEditorState(parsed);
    } catch (err) {
      console.warn('Failed to restore editor state, starting fresh:', err);
    }
  }, [docId, initialState, editor]);

  return null;
}

function EditorInner({ docId, initialState }: EditorProps) {
  return (
    <>
      <TopToolbarPlugin />
      <RichTextPlugin
        contentEditable={
          <div className="editor-scroller">
            <ContentEditable className="obelisk-editor-root outline-none min-h-[500px] px-12 py-8" />
          </div>
        }
        ErrorBoundary={LexicalErrorBoundary}
      />
      <HistoryPlugin />
      <ListPlugin />
      <LinkPlugin />
      <TabIndentationPlugin />
      <RestoreStatePlugin docId={docId} initialState={initialState} />
      <AutoSavePlugin docId={docId} />
      <SlashMenuPlugin />
      <FloatingToolbarPlugin />
      <ImagePastePlugin docId={docId} />
      <MarkdownShortcutsPlugin />
      <IndentRulesPlugin />
      <OutlinePlugin />
      <BreadcrumbPlugin />
      <ExportBridgePlugin docId={docId} />
    </>
  );
}

class EditorErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[EditorErrorBoundary]', error.message, error.stack, info.componentStack);
  }
  render() {
    if (this.state.error) {
      return (
        <div className="p-8 text-red-500 font-mono text-sm whitespace-pre-wrap">
          <p className="font-bold mb-2">Editor Error:</p>
          <p>{this.state.error.message}</p>
          <pre className="mt-2 text-xs opacity-60">{this.state.error.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export function Editor({ docId, initialState }: EditorProps) {
  const initialConfig = {
    namespace: 'Obelisk',
    theme: editorTheme,
    nodes: registeredNodes,
    onError: (error: Error) => {
      console.error('Lexical error:', error.message, error.stack);
    },
    // Never pass editorState directly - always use RestoreStatePlugin
    // to avoid "empty root" errors from stale/corrupted state
  };

  return (
    <EditorErrorBoundary>
      <LexicalComposer initialConfig={initialConfig} key={docId}>
        <EditorInner docId={docId} initialState={initialState} />
      </LexicalComposer>
    </EditorErrorBoundary>
  );
}
