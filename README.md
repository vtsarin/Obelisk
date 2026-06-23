# Obelisk

A block-based rich-text editor built with **Lexical**, **React 18**, and **IndexedDB**. Offline-first, no backend, no collaboration — just fast local editing with multi-document workspace management.

## Features

- **Rich-text editing** — headings, lists, quotes, code blocks, tables, links
- **Custom blocks** — callouts, toggles, dividers, images, embeds (YouTube/Vimeo/Figma), Mermaid diagrams, LaTeX math (inline + block), mentions, database references
- **Slash menu** — type `/` to insert any block type with fuzzy search
- **Floating toolbar** — select text to format (bold, italic, strikethrough, code, highlight, super/subscript, link)
- **Top toolbar** — block type selector, formatting, insert, indent, undo/redo
- **Markdown shortcuts** — `#`, `>`, `-`, `1.`, `` ` ``, `**`, `_`, `~~` auto-convert as you type
- **Command palette** — `⌘K` to navigate docs, run actions, or insert blocks
- **Workspace sidebar** — create/rename/delete documents and folders, tree view
- **Full-text search** — search across all documents
- **Outline panel** — heading-based TOC with click-to-scroll
- **Breadcrumb** — shows cursor position in document structure
- **Auto-save** — debounced persistence to IndexedDB with status indicator
- **Version history** — automatic snapshots (last 10), restore/rename/delete
- **Export** — JSON (lossless), Markdown (zip with images), HTML (self-contained), PDF (print-based)
- **Import** — JSON (lossless), Markdown (basic)
- **Dark/light theme** — CSS variables with system preference detection
- **Image handling** — paste, drag-and-drop, or file picker; stored as blobs in IndexedDB
- **Nesting rules** — max 3-level indent depth enforced
- **Keyboard-first** — all actions accessible via shortcuts

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript (strict) |
| Editor | Lexical |
| State | Zustand |
| Storage | IndexedDB via `idb` |
| Styling | TailwindCSS + CSS variables |
| UI primitives | Radix UI |
| Build | Vite |
| Math | KaTeX (lazy) |
| Diagrams | Mermaid (lazy) |
| Icons | Lucide React |

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Type-check
npx tsc --noEmit

# Production build
npm run build

# Preview production build
npm run preview
```

The app runs at `http://localhost:5173` by default.

## Project Structure

```
src/
├── App.tsx                    # Main shell (sidebar + editor + outline)
├── main.tsx                   # React entry point
├── index.css                  # Theme variables, Tailwind, global styles
├── components/                # Header, Footer
├── db/                        # IndexedDB schema, interfaces, implementations
│   ├── idb.ts                 # openDB + schema definition
│   ├── interfaces.ts          # WorkspaceStore, AssetStore interfaces
│   ├── workspaceStore.impl.ts # CRUD for docs, folders, versions, search index
│   └── assetStore.impl.ts     # Blob storage for images
├── editor/
│   ├── Editor.tsx             # LexicalComposer + plugin composition
│   ├── theme.ts               # Lexical theme class mapping
│   ├── nodes/                 # Custom node types (Callout, Toggle, etc.)
│   ├── plugins/               # Editor plugins (autosave, slash menu, etc.)
│   └── commands/              # insertBlock command + block palette registry
├── features/
│   ├── workspace/             # Sidebar, TreeItem, WorkspaceSearch
│   ├── commandPalette/        # ⌘K command palette
│   ├── outline/               # Heading TOC sidebar
│   ├── breadcrumb/            # Cursor breadcrumb bar
│   ├── versions/              # Version history dialog
│   └── export/                # Export dialogs + format implementations
├── import/                    # JSON and Markdown import
├── lib/                       # Utilities (ids, debounce, slug, cn, plaintext)
├── store/                     # Zustand workspace store + selectors
├── styles/                    # editor.css, print.css
└── types/                     # TypeScript models
```

## Key Design Decisions

- **Lexical JSON is canonical** — editor state stored as serialized JSON in IndexedDB
- **No editor state in Zustand** — only UI/workspace state lives in the store
- **Blob URLs cached + revoked** — images served via `URL.createObjectURL`, cleaned up on unmount
- **Lazy-loaded heavy deps** — KaTeX and Mermaid loaded via dynamic `import()` only when needed
- **Export bridge pattern** — editor-dependent exports (MD, HTML) use window events to access the Lexical editor instance without prop drilling

## License

Private — not yet open-sourced.
