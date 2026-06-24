# Obelisk — Complete Build Specification (v1)

> **Obelisk** — the block-based document studio.
> Single source of truth for building Obelisk. Every architectural decision
> below is final and was reasoned through with the product owner. Build to this spec.
> Audience: an AI coding agent (Claude in VS Code) generating a multi-file project.
>
> Naming note: this product is a **block-based rich-text editor** (Notion/Loop-style), not a
> Markdown editor. Markdown appears only as one import/export format among several. A separate,
> unrelated project — a split-pane Markdown source editor with live preview — is intentionally
> out of scope here.

---

## 0. One-paragraph summary

Obelisk is an **offline-first, desktop-primary, block-based rich-text editor** with a
Notion/Loop-style writing experience, built on **Lexical**. It runs entirely in the browser
with **no backend** and **no real-time collaboration in v1**. Documents live in a local
**multi-document workspace with folders**, persisted in **IndexedDB**. The editor supports
nested blocks (max 3 levels), a rich block palette (callouts, toggles, tables, code, Mermaid
diagrams, images, embeds, mentions, database-reference placeholders), and semantic inline
formatting (highlight, super/subscript, inline LaTeX, mentions). It auto-saves on idle, keeps
the last 10 labeled version snapshots per document, and exports to **Markdown (zipped bundle),
JSON (lossless), HTML (self-contained), and PDF (print-based, vector text)**. It can **import
JSON (lossless) and Markdown (lossy into advanced blocks)**. A global **Cmd/Ctrl-K command
palette** complements the in-editor **slash menu**.

---

## 1. Locked decisions (do not re-litigate)

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| 1 | Rich-text engine | **Lexical** (`@lexical/react`) | Node-tree-native; clean serializable nested JSON; first-class custom nodes; built-in history. Better fit than ProseMirror/TipTap for arbitrary block-in-block nesting + custom block state. |
| 2 | Canonical document format | **Lexical serialized JSON** | The editor's `editor.getEditorState().toJSON()` IS the save format AND the JSON export. No parallel block tree, no two-way sync. |
| 3 | Editor architecture | **Single Lexical instance**, nesting via the node tree | 3-level cap + known block set means we don't need Notion's "one editor per block." Single instance keeps selection, undo, copy/paste working natively across blocks. |
| 4 | Nesting depth | **Max 3 levels**, enforced | Nestable: paragraph, heading, list, toggle, quote, callout. Non-nestable (leaf): code, image, divider, table, embed, mermaid, database_reference. |
| 5 | Persistence | **IndexedDB** (via a thin wrapper, see §5) | Offline-first. localStorage only used for tiny UI prefs (theme, last-open doc id). |
| 6 | Workspace scope | **Multiple documents + folders** (mini workspace) | Sidebar tree of folders/docs, create/rename/delete/move. |
| 7 | Undo/redo | **Lexical native history** (`HistoryPlugin`) | Don't hand-roll an undo stack. |
| 8 | Versioning | **Full-document snapshots on idle** (debounced 1000ms), keep **last 10 per doc** | Separate from undo. Dedupe: skip a snapshot if serialized state is byte-identical to the most recent one. |
| 9 | Images (storage) | **Virtual folder hierarchy inside IndexedDB**, Blobs keyed by path `assets/{docId}/images/{filename}`; runtime `blob:`/object URLs for `<img src>` | Works in every browser, no permission prompt, survives reload. URLs are session-scoped; regenerate on load. Behind an `AssetStore` interface so File System Access API or a desktop build can swap in later. |
| 10 | Images (export) | At export time, **re-inline actual bytes**: base64 for self-contained HTML; embedded for PDF; copied into `/images` for the Markdown zip bundle | Runtime blob URLs are not portable; never ship them in exports. |
| 11 | Search | **Full-text search** across all docs (titles + body text). **Tags/properties deferred to v2.** | |
| 12 | Command palette | **Cmd/Ctrl-K global palette**: open doc, run action, insert block — in addition to the in-editor `/` slash menu | |
| 13 | Markdown export | **.zip bundle**: `document.md` + `/images/*` + (optional) `assets/` | Portable, lossless for images. |
| 14 | Import | **JSON import = lossless** (it's the native format). **Markdown import = lossy** via `@lexical/markdown` transformers (advanced blocks have no MD form). | State this in the UI when importing MD. |
| 15 | PDF engine | **Browser print-to-PDF** via a hidden, fully-styled print view + `@page` CSS + `window.print()` | Vector (selectable/searchable) text, crisp KaTeX/Mermaid SVG, real page breaks. Not html2canvas (rasterizes, blurry, non-selectable). |
| 16 | Target environment | **Desktop-primary, keyboard-first.** Mobile = best-effort (layout shouldn't break, but touch drag/slash polish is not a v1 goal). | |
| 17 | Collaboration | **Out of scope for v1.** Architect cleanly so a CRDT (Yjs + `@lexical/yjs`) could be added later, but build none of it now. | |
| 18 | Diagrams | **Mermaid only** (flowchart, sequence, etc.). No PlantUML/Graphviz in v1. | |
| 19 | Math | **KaTeX**, inline (`$...$`) and block. Inline renders **on blur / on selection-exit**, editable as raw LaTeX when the node is selected. | |
| 20 | Syntax highlighting | **Lexical `CodeNode` + `@lexical/code`** (uses Prism under the hood) for code blocks. | |

---

## 2. Technology stack

**Core**
- React 18 + TypeScript (strict mode)
- Vite (build/dev)
- Lexical: `lexical`, `@lexical/react`, `@lexical/rich-text`, `@lexical/list`, `@lexical/code`, `@lexical/link`, `@lexical/markdown`, `@lexical/selection`, `@lexical/utils`, `@lexical/history`, `@lexical/table`
- Zustand (workspace/UI state OUTSIDE the editor — doc list, folders, active doc id, modals, theme). The *document content* lives in Lexical, not Zustand.

**Persistence**
- `idb` (Jake Archibald's tiny IndexedDB Promise wrapper) — do not hand-roll raw IndexedDB.

**Rendering / features**
- `katex` (math)
- `mermaid` (diagrams)
- Prism comes transitively via `@lexical/code`
- `fuse.js` (fuzzy search for command palette + workspace search)
- `jszip` (Markdown export bundle)
- `file-saver` (trigger downloads)
- `lucide-react` (icons)
- `clsx` + `tailwind-merge` (class composition)

**Styling**
- TailwindCSS + CSS variables for theming (light/dark). Radix UI primitives (`@radix-ui/react-dialog`, `react-dropdown-menu`, `react-popover`, `react-tooltip`, `react-context-menu`) for accessible menus/modals.

**Utilities**
- `uuid`, `date-fns`, `lodash-es` (use `debounce`, tree helpers)

> Do not add a state library for editor content. Lexical owns content; Zustand owns app shell.

---

## 3. Data model

### 3.1 Document content
The document body is **Lexical's `SerializedEditorState`** — a nested JSON tree of nodes.
This is what we persist and what JSON-export emits. No custom parallel block array.

```ts
import type { SerializedEditorState } from 'lexical';
```

### 3.2 Workspace / metadata records (these are ours, stored alongside content)

```ts
type ID = string; // uuid v4

interface FolderRecord {
  id: ID;
  type: 'folder';
  name: string;
  parentId: ID | null;        // null = workspace root
  order: number;              // sort position among siblings
  createdAt: number;          // epoch ms
  updatedAt: number;
}

interface DocRecord {
  id: ID;
  type: 'doc';
  title: string;              // mirrors the doc's H1/title field
  parentId: ID | null;        // folder id or null (root)
  order: number;
  createdAt: number;
  updatedAt: number;
  // content stored separately under contentKey to keep metadata light
}

interface DocContent {
  docId: ID;
  state: SerializedEditorState; // canonical Lexical JSON
  schemaVersion: number;        // bump when node shapes change; enables migrations
}

interface VersionSnapshot {
  id: ID;
  docId: ID;
  label: string | null;         // user-supplied or auto ("Autosave 14:32")
  state: SerializedEditorState;
  createdAt: number;
  bytes: number;                // serialized size, for the UI
}

interface AssetRecord {
  path: string;                 // e.g. "assets/{docId}/images/diagram-01.png"
  docId: ID;
  blob: Blob;
  mime: string;
  createdAt: number;
}

interface WorkspaceMeta {
  id: 'singleton';
  lastOpenDocId: ID | null;
  schemaVersion: number;
}
```

### 3.3 Custom Lexical nodes to implement
Each must implement `exportJSON`/`importJSON` (so it round-trips through save + JSON export)
and, where relevant, `exportDOM` (for HTML export) and a Markdown transformer (for MD export
where one exists).

- **CalloutNode** (block, nestable) — variant: `info | warning | tip | danger | note`; holds child nodes; renders icon + colored container.
- **ToggleNode** (block, nestable) — `collapsed: boolean`; summary line + collapsible children.
- **DividerNode** (leaf) — horizontal rule.
- **ImageNode** (leaf) — `{ assetPath: string; alt: string; caption?: string; width?: number }`. `src` resolved at render time from `AssetStore` to a blob URL. **Never stores base64 in the node** (export inlines bytes instead).
- **EmbedNode** (leaf) — `{ url: string; provider?: 'youtube'|'vimeo'|'figma'|'generic' }`; renders a sandboxed iframe or a safe placeholder card.
- **MermaidNode** (leaf) — `{ source: string }`; see §6.3 for edit/render/error behavior.
- **MathNode (inline)** — `{ latex: string }`; KaTeX render; see §6.4.
- **MathBlockNode (block)** — `{ latex: string }`; display-mode KaTeX.
- **MentionNode (inline)** — `{ refType: 'doc'|'user'|'block'; refId: string; label: string }`. v1: doc mentions link to another doc in the workspace; user/block are stored but render as a styled chip.
- **DatabaseReferenceNode (leaf)** — placeholder card `{ title: string }`. UI only; no data engine in v1. Renders a "linked database (coming soon)" card. Must still serialize/round-trip.

Built-in Lexical nodes to register: `HeadingNode`, `QuoteNode`, `ListNode`, `ListItemNode`,
`CodeNode`, `CodeHighlightNode`, `LinkNode`, `TableNode`/`TableRowNode`/`TableCellNode`,
and text with formats (bold/italic/strikethrough/code) plus custom text formats for
**highlight**, **superscript**, **subscript** (Lexical supports sub/super as text formats;
highlight is a custom format or a styled mark — implement highlight as a text style with a
color value).

---

## 4. IndexedDB schema (via `idb`)

Database name: `obelisk`. Bump `version` to trigger `upgrade` migrations.

Object stores:
- `meta` — keyPath `id` (the single `WorkspaceMeta`).
- `folders` — keyPath `id`; index `by-parent` on `parentId`.
- `docs` — keyPath `id`; index `by-parent` on `parentId`; index `by-updated` on `updatedAt`.
- `content` — keyPath `docId` (one `DocContent` per doc).
- `versions` — keyPath `id`; index `by-doc` on `docId`; index `by-doc-created` on `[docId, createdAt]`.
- `assets` — keyPath `path`; index `by-doc` on `docId`.
- `searchIndex` — keyPath `docId`; value `{ docId, title, plainText }` (denormalized plain text extracted from the doc on save, used by full-text search so we don't deserialize every doc to search).

**Migration policy:** `DocContent.schemaVersion` and `WorkspaceMeta.schemaVersion` let us run
node-shape migrations on load. On read, if a doc's schemaVersion is older, run registered
migration functions in sequence before handing state to Lexical.

---

## 5. Storage layer (interfaces — implement behind these)

Build a clean service layer so the UI never touches `idb` directly and so the asset backend is swappable.

```ts
interface WorkspaceStore {
  init(): Promise<void>;
  getMeta(): Promise<WorkspaceMeta>;
  setLastOpenDoc(id: ID | null): Promise<void>;

  listTree(): Promise<{ folders: FolderRecord[]; docs: DocRecord[] }>;
  createFolder(name: string, parentId: ID | null): Promise<FolderRecord>;
  createDoc(title: string, parentId: ID | null): Promise<DocRecord>;
  rename(id: ID, name: string): Promise<void>;
  move(id: ID, newParentId: ID | null, newOrder: number): Promise<void>;
  remove(id: ID): Promise<void>; // cascades: docs delete content+versions+assets+searchIndex

  loadContent(docId: ID): Promise<DocContent | null>;
  saveContent(docId: ID, state: SerializedEditorState, plainText: string, title: string): Promise<void>;

  listVersions(docId: ID): Promise<VersionSnapshot[]>;
  snapshot(docId: ID, state: SerializedEditorState, label?: string): Promise<void>; // enforces last-10 + dedupe
  restoreVersion(versionId: ID): Promise<SerializedEditorState>;
  labelVersion(versionId: ID, label: string): Promise<void>;
  deleteVersion(versionId: ID): Promise<void>;
}

interface AssetStore {            // swappable: IndexedDB now, FS Access / desktop later
  put(docId: ID, file: File | Blob, filename?: string): Promise<string>; // returns path
  getURL(path: string): Promise<string>;   // returns a blob: object URL (cache + revoke on unmount)
  getBlob(path: string): Promise<Blob | null>;
  list(docId: ID): Promise<AssetRecord[]>;
  remove(path: string): Promise<void>;
}
```

**Object-URL lifecycle:** maintain a small in-memory cache `path -> objectURL`. Create lazily on
first `getURL`, reuse across the session, and `URL.revokeObjectURL` on workspace teardown to avoid leaks.

---

## 6. Editor behavior details

### 6.1 Save / autosave / version pipeline
- On every editor change, debounce **1000ms** of idle, then:
  1. Serialize `editorState.toJSON()`.
  2. Extract `plainText` (Lexical `$getRoot().getTextContent()`).
  3. Derive `title` (first heading or first line; fallback "Untitled").
  4. `saveContent(...)` (writes `content`, `docs.updatedAt`, `searchIndex`).
  5. `snapshot(...)` — but **dedupe**: if serialized state equals the latest snapshot, skip; otherwise insert and prune to last 10.
- Show a transient status chip: `Saving…` → `Saved` (fade after ~2s). On write failure: persistent `Save failed — retry` with a manual retry button.
- **Crash/reload recovery:** on app load, read `lastOpenDocId` and `content`; the latest persisted state IS the recovery point (autosave already covers it). If `content` deserialization throws, offer "Restore from last good version" (most recent valid `VersionSnapshot`).

### 6.2 Undo/redo
- Use Lexical `HistoryPlugin`. `Ctrl/Cmd+Z` undo, `Ctrl/Cmd+Shift+Z` (and `Ctrl+Y`) redo.
- Versions are **independent** of undo. Restoring a version pushes a new history entry (so the restore itself is undoable) and does not clear future redo in a confusing way — implement restore as: set editor state to the snapshot via `editor.setEditorState(...)` wrapped so HistoryPlugin records it as one step.

### 6.3 Mermaid node behavior
- **Selected/focused:** show a two-pane mini view — left: editable `source` textarea (monospace); right: live render.
- **Deselected:** show only the rendered diagram.
- **Invalid syntax:** render the **last successful diagram** dimmed + an inline error banner with the Mermaid parse message. Never blank the block on a transient error.
- Render via `mermaid.render()` to SVG; debounce re-render ~300ms while typing source.

### 6.4 Math (KaTeX)
- **Inline MathNode:** when the node is selected, show raw `$latex$` editable text; on blur/selection-exit, render with KaTeX (`throwOnError: false`, show error in red inline on parse failure).
- **MathBlockNode:** display mode; same edit-on-select / render-on-blur pattern.

### 6.5 Slash menu (in-editor `/`)
- Trigger `/` at the start of an empty block or after whitespace. Opens a Radix popover anchored at the caret.
- Fuzzy filter (Fuse.js) over the block palette with icon + label + short description + aliases (e.g. `/h1`, `/heading1`, `/title`).
- Arrow keys navigate, Enter inserts, Esc closes, typing filters. Mouse hover/click selects.
- Commands map 1:1 to the block palette in §3.3 + built-ins (paragraph, h1–h3 (h4–h6 available but lower-priority in list), bullet/numbered list, code, quote, table, image, embed, mermaid, callout, toggle, divider, math block, mention, database reference).

### 6.6 Command palette (Cmd/Ctrl-K)
Global, three command groups (Fuse-searchable):
1. **Navigate** — open any doc (by title), jump to a folder.
2. **Actions** — new doc, new folder, export (each format), import, toggle theme, open version history, rename current doc.
3. **Insert** — insert any block into the current doc at selection (mirrors slash menu).

### 6.7 Floating selection toolbar
- Appears on non-empty text selection, positioned above the selection (Radix popover/manual portal).
- Buttons: Bold, Italic, Strikethrough, Inline Code, Link, Text Color, Highlight, Superscript, Subscript, Inline Math, Mention.
- Link button opens a small URL input; existing links show edit/remove.
- Dismiss on Esc, scroll, or selection collapse.

### 6.8 Top toolbar
- Current block-type dropdown (turn-into), inline mark toggles, insert buttons (image/table/code/divider), indent/outdent, undo/redo, and an "⋯ block actions" menu (duplicate, delete, move up/down).

### 6.9 Nesting / indent / drag
- `Tab` indents (nest under previous sibling if legal + within depth 3); `Shift+Tab` outdents. Reject (no-op + subtle shake/tooltip) if it would exceed depth 3 or nest into a leaf block.
- Drag handle on block hover (left gutter) to reorder; show drop indicators (between-block line; nest-zone highlight). Enforce the same legality rules on drop.

### 6.10 Outline sidebar + breadcrumb
- **Outline:** live tree of headings + top-level blocks; click to scroll-to; drag-to-reorder mirrors editor; filter box (matches heading/block text).
- **Breadcrumb:** above the editor, shows nesting path of the current selection (e.g. `Doc ▸ Heading 2 ▸ Callout`); click a crumb to select that ancestor.

---

## 7. Import / Export

### 7.1 JSON (lossless)
- **Export:** `{ schemaVersion, doc: DocRecord-lite, state: SerializedEditorState, assets?: manifest }`. Pretty-printed `.json`.
- **Import:** validate `schemaVersion`, run migrations if older, `editor.setEditorState(editor.parseEditorState(state))`. Lossless round-trip is a hard requirement — write a test that exports then imports and asserts deep-equality of serialized state.

### 7.2 Markdown
- **Export → .zip** (`jszip` + `file-saver`): `document.md` produced via `@lexical/markdown` `$convertToMarkdownString` extended with custom transformers; images written under `/images/<filename>` and referenced with relative paths in the MD; advanced blocks that have no MD equivalent are emitted as fenced HTML or a clearly-commented fallback (e.g. callouts as `> [!INFO]`, Mermaid as ```` ```mermaid ````). Include a `README.txt` noting any lossy conversions.
- **Import (lossy):** `$convertFromMarkdownString` with the standard transformer set. Map GitHub-style `> [!TYPE]` to CalloutNode and ```` ```mermaid ```` fences to MermaidNode where feasible; everything else falls back to standard blocks. Surface a non-blocking notice: "Markdown import maps to basic blocks; advanced formatting may be simplified."

### 7.3 HTML (self-contained, single file)
- Walk the editor state → semantic HTML (`article`, `h1–h6`, `p`, `ul/ol/li`, `blockquote`, `pre>code`, `table`, `figure>img+figcaption`, callout/toggle as styled `section`/`details`).
- **Inline everything:** images as base64 data URIs (read bytes from `AssetStore`), Mermaid pre-rendered to inline SVG, KaTeX rendered to HTML+inline CSS (or MathML), code highlighted with inlined Prism classes + embedded CSS. Embed a `<style>` block with the print/reading theme. Result must open standalone in any browser.

### 7.4 PDF (print-based, vector)
- Build a hidden **PrintView** React tree that renders the document with a dedicated print stylesheet:
  - `@page { size: A4; margin: 20mm; }`, page numbers via `@page` margin boxes where supported.
  - `break-inside: avoid` on code blocks, tables, figures, callouts; `break-after: avoid` on headings.
  - KaTeX as vector, Mermaid as inline SVG, images at natural resolution.
  - Optional auto-generated **table of contents** (from headings) and optional header/footer (title + page number).
- Trigger `window.print()` against this view (toggle a `printing` class on `<html>` so editor chrome is `display:none` and only PrintView shows). Provide an **export options modal** (include TOC? header/footer? page numbers?) before printing.

### 7.5 Export options modal
Format picker (MD-zip / JSON / HTML / PDF) → per-format options → small preview (first ~page or first 500 chars) → filename input (default `${slug(title)}-${yyyyMMdd}.${ext}`) → Export.

---

## 8. UI / layout / theming

```
┌───────────────────────────────────────────────────────────────────────────┐
│ Header: ☰  | Doc title (inline-editable) | Save status | Theme | Export | ⌘K │
├───────────┬─────────────────────────────────────────────┬───────────────────┤
│ Workspace │ Breadcrumb: Doc ▸ Heading ▸ Callout          │ Outline (toggle)  │
│ tree      │ ┌─ Top toolbar ───────────────────────────┐ │  • Heading 1      │
│ (folders  │ │ turn-into | B I S `code` link color … ⋯ │ │    • Toggle       │
│  + docs,  │ ├─────────────────────────────────────────┤ │    • Callout      │
│  search)  │ │  Lexical editor (single instance)        │ │  • Heading 2      │
│           │ │  blocks, nesting ≤3, slash menu, drag    │ │ [filter…]         │
│           │ └─────────────────────────────────────────┘ │                   │
├───────────┴─────────────────────────────────────────────┴───────────────────┤
│ Footer: word/char count • last saved time • version count • depth indicator   │
└───────────────────────────────────────────────────────────────────────────┘
```

- **Theme:** light/dark via CSS variables on `:root`/`[data-theme]`; persist choice in localStorage. Accent teal/blue. Inter for UI/body, a mono (Fira Code/JetBrains Mono fallback to system mono) for code.
- **Density:** comfortable line-height, generous block spacing; 20px indent per nesting level.
- **Hover affordances:** block drag handle + "+" (insert below) in left gutter on hover.
- **Accessibility:** Radix primitives for focus management; ARIA labels on all toolbar/menu items; full keyboard operability; WCAG AA contrast in both themes.
- **Responsive (best-effort):** below ~900px, collapse both sidebars into drawer toggles; editor remains usable; don't invest in touch-drag polish.

---

## 9. Project structure

```
obelisk/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
├── postcss.config.js
└── src/
    ├── main.tsx
    ├── App.tsx                       # 3-pane shell + routing of active doc
    ├── index.css                     # tailwind + CSS vars + print stylesheet entry
    ├── styles/print.css              # @page rules, break-inside, print theme
    │
    ├── types/
    │   └── models.ts                 # FolderRecord, DocRecord, DocContent, VersionSnapshot, AssetRecord, WorkspaceMeta
    │
    ├── store/
    │   ├── workspaceStore.ts         # Zustand: tree, activeDocId, modals, theme, search query
    │   └── selectors.ts
    │
    ├── db/
    │   ├── idb.ts                    # openDB(), upgrade/migrations, store names
    │   ├── workspaceStore.impl.ts    # implements WorkspaceStore over idb
    │   ├── assetStore.impl.ts        # implements AssetStore over idb (blob URLs + cache)
    │   ├── migrations.ts             # schemaVersion migrations
    │   └── interfaces.ts             # WorkspaceStore, AssetStore interfaces (§5)
    │
    ├── editor/
    │   ├── Editor.tsx                # LexicalComposer + plugins wiring
    │   ├── theme.ts                  # Lexical EditorThemeClasses
    │   ├── nodes/
    │   │   ├── index.ts              # node registration array
    │   │   ├── CalloutNode.tsx
    │   │   ├── ToggleNode.tsx
    │   │   ├── DividerNode.tsx
    │   │   ├── ImageNode.tsx
    │   │   ├── EmbedNode.tsx
    │   │   ├── MermaidNode.tsx
    │   │   ├── MathNode.tsx           # inline
    │   │   ├── MathBlockNode.tsx
    │   │   ├── MentionNode.tsx
    │   │   └── DatabaseReferenceNode.tsx
    │   ├── plugins/
    │   │   ├── AutoSavePlugin.tsx     # debounced save + snapshot + status
    │   │   ├── SlashMenuPlugin.tsx
    │   │   ├── FloatingToolbarPlugin.tsx
    │   │   ├── TopToolbarPlugin.tsx
    │   │   ├── DragHandlePlugin.tsx   # reorder + drop legality
    │   │   ├── IndentRulesPlugin.tsx  # enforce depth ≤3, leaf rules
    │   │   ├── OutlinePlugin.tsx      # emits heading/block tree to store
    │   │   ├── BreadcrumbPlugin.tsx
    │   │   ├── MentionPlugin.tsx      # @ trigger → doc picker
    │   │   ├── ImagePastePlugin.tsx   # paste/drop image → AssetStore.put → ImageNode
    │   │   └── MarkdownShortcutsPlugin.tsx # `#`, `-`, ``` etc. live transforms
    │   └── commands/
    │       └── insertBlock.ts        # shared by slash menu + command palette
    │
    ├── features/
    │   ├── workspace/
    │   │   ├── Sidebar.tsx            # folder/doc tree, create/rename/move/delete, search box
    │   │   ├── TreeItem.tsx
    │   │   └── WorkspaceSearch.tsx    # Fuse over searchIndex
    │   ├── outline/Outline.tsx
    │   ├── breadcrumb/Breadcrumb.tsx
    │   ├── commandPalette/CommandPalette.tsx   # Cmd/Ctrl-K
    │   ├── versions/VersionHistory.tsx          # list, label, restore, delete
    │   └── export/
    │       ├── ExportDialog.tsx
    │       ├── toJSON.ts
    │       ├── toMarkdown.ts          # + jszip bundle
    │       ├── toHTML.ts
    │       ├── PrintView.tsx          # hidden print tree
    │       └── printToPDF.ts          # window.print orchestration
    │
    ├── import/
    │   ├── fromJSON.ts                # lossless
    │   └── fromMarkdown.ts            # lossy, with notice
    │
    ├── components/                    # Header, StatusChip, ThemeToggle, Modal wrappers, Tooltip, etc.
    └── lib/
        ├── debounce.ts
        ├── slug.ts
        ├── plaintext.ts               # extract plain text for search index
        └── ids.ts
```

---

## 10. Build order (phased, each phase shippable & testable)

**Phase 1 — Foundation & core editing**
1. Vite + React + TS + Tailwind scaffold; theme tokens; app shell (3-pane, empty).
2. `idb` setup + `WorkspaceStore`/`AssetStore` implementations + interfaces.
3. Lexical composer with built-in nodes; rich-text basics (paragraph, headings, lists, quote, code, links) + bold/italic/strike/inline-code.
4. `AutoSavePlugin` (debounced save + status chip) writing to IndexedDB; load on open; reload-recovery.
5. Workspace sidebar: create/open/rename/delete **docs** (folders next phase). `lastOpenDocId`.
   *Test:* type → reload → content restored; create/switch docs.

**Phase 2 — Block palette & inline semantics**
6. Custom nodes: Callout, Toggle, Divider, Image (with `ImagePastePlugin` + AssetStore blob URLs), Table (Lexical table), Embed, Mermaid, MathNode/MathBlock, Mention, DatabaseReference.
7. Custom inline formats: highlight, superscript, subscript; color; inline math.
8. Nesting rules (`IndentRulesPlugin`: depth ≤3, leaf restrictions) + Tab/Shift+Tab.
9. `MarkdownShortcutsPlugin` live transforms.
   *Test:* every block inserts/edits/serializes; depth cap enforced; image paste persists & survives reload.

**Phase 3 — Discoverability & structure**
10. `SlashMenuPlugin` (Fuse) + `insertBlock` command.
11. `FloatingToolbarPlugin` + `TopToolbarPlugin`.
12. `DragHandlePlugin` (reorder + drop legality).
13. `OutlinePlugin` + Outline sidebar; `BreadcrumbPlugin` + Breadcrumb.
14. Folders in sidebar (create/move/nest docs & folders, drag-reorder).
15. `CommandPalette` (Cmd/Ctrl-K) — navigate/actions/insert.
16. `WorkspaceSearch` full-text over `searchIndex` (Fuse).
    *Test:* slash + palette insert identically; outline/breadcrumb track selection; search finds body text across docs.

**Phase 4 — Versions, import, export**
17. `VersionHistory`: snapshot-on-idle (dedupe, last 10), list/label/restore/delete.
18. `toJSON` (lossless) + `fromJSON`; round-trip equality test.
19. `fromMarkdown` (lossy + notice).
20. `toMarkdown` zip bundle (jszip + images + README).
21. `toHTML` self-contained (inline images/SVG/KaTeX/Prism).
22. `PrintView` + `printToPDF` + `ExportDialog` (options + preview).
    *Test:* JSON export→import deep-equal; HTML opens standalone offline; PDF text selectable, diagrams/math crisp, page breaks clean; MD zip re-imports basic structure.

**Phase 5 — Polish (best-effort)**
23. Responsive drawers <900px; keyboard-shortcut help overlay (`?`); empty states; error boundaries; performance pass (memoize node decorators, lazy-load mermaid/katex, virtualize outline >150 items).

---

## 11. Acceptance criteria (definition of done for v1)

- Create folders/docs; move, rename, delete (cascade) reliably.
- Type continuously in a ~10K-word doc with no perceptible lag; autosave fires on idle; reload restores exactly.
- All listed block types insert via both slash menu and Cmd-K, render correctly, and **round-trip losslessly through JSON export→import** (automated test passes).
- Nesting honors the 3-level cap and leaf rules in keyboard, drag, and paste paths.
- Mermaid: edits live-preview; invalid syntax keeps last good render + shows error.
- Inline math + math block render via KaTeX; editable as raw LaTeX on selection.
- Images: paste/drop stores a Blob, references by path, renders via blob URL, survives reload; exports inline real bytes (HTML base64 / PDF embed / MD zip `/images`).
- Version history keeps last 10 per doc, dedupes identical snapshots, restores as an undoable step.
- Full-text search returns matching docs by title and body.
- Exports: JSON (lossless), Markdown (.zip portable), HTML (self-contained, opens offline), PDF (vector/selectable text, clean pagination, optional TOC/header/footer).
- Keyboard-first: documented shortcuts all work; app fully operable without a mouse.
- Light/dark themes meet WCAG AA contrast; menus/dialogs are accessible (Radix).
- No backend calls; works fully offline after first load.

---

## 12. Explicit non-goals (v1)

- Real-time collaboration / multiplayer / presence (architect for Yjs later, build none).
- Tags & property filters (search by tags) — v2.
- PlantUML/Graphviz/D3 diagram blocks — Mermaid only.
- Word/EPUB export — only MD, JSON, HTML, PDF.
- Cloud sync / accounts / sharing links.
- Real on-disk folders (File System Access API) — keep behind `AssetStore` for a future swap.
- A working database engine behind DatabaseReferenceNode (placeholder card only).
- AI features (suggestions, autocompletion).

---

## 13. Guidance for the coding agent

- **Lexical owns content; Zustand owns the app shell.** Never mirror editor content into Zustand.
- Implement the **storage interfaces in §5 first** and code the UI against the interfaces, not `idb` directly.
- For each custom node, write `importJSON`/`exportJSON` **before** wiring its React decorator, and add a serialization round-trip test immediately.
- Keep nodes/plugins small and focused; prefer composition. Use `React.memo` on decorator components; lazy-load `mermaid` and `katex`.
- Enforce nesting legality in **one** place (`IndentRulesPlugin` helpers) and reuse it across keyboard, drag, and paste.
- Treat blob object URLs as session-scoped: resolve via `AssetStore.getURL`, cache, revoke on teardown; never serialize them.
- Write the JSON export→import deep-equality test and the depth-cap test as guardrails early; they catch most regressions.
- TypeScript strict; no `any` in node definitions or the storage layer.
```
