<div align="center">

<img src="docs/assets/logo.svg" alt="Obelisk" width="280" />

<br />
<br />

**The block-based document studio — offline-first, keyboard-driven, endlessly extensible.**

[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React 18](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Lexical](https://img.shields.io/badge/Lexical-0.27-000000?logo=meta&logoColor=white)](https://lexical.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-14B8A6)](LICENSE)

[Features](#-features) · [Quick Start](#-quick-start) · [Architecture](#-architecture) · [Keyboard Shortcuts](#-keyboard-shortcuts) · [Contributing](#-contributing) · [Roadmap](#-roadmap)

</div>

---

## Overview

Obelisk is a local-first, block-based rich-text editor that runs entirely in your browser. No accounts, no servers, no telemetry — your documents live in IndexedDB and never leave your machine.

Built on [Lexical](https://lexical.dev/) for surgical control over the editing experience, with a plugin architecture that makes every feature composable and every block type extensible.

---

## ✨ Features

### Editor Core

| Feature | Description |
| :--- | :--- |
| **Rich text** | Headings (H1–H6), bold, italic, strikethrough, highlight, superscript, subscript, inline code |
| **Lists** | Bullet, numbered, with nesting up to 3 levels |
| **Code blocks** | Syntax-highlighted fenced blocks with language detection |
| **Tables** | Full row/column editing via `@lexical/table` |
| **Links** | Inline links with URL editing via floating toolbar |
| **Quotes** | Block quotes with Markdown shortcut (`>`) |

### Custom Blocks

| Block | Description |
| :--- | :--- |
| **Callout** | Info, Warning, Tip, Danger, Note — with variant icons and themed colors |
| **Toggle** | Collapsible `<details>`-style sections |
| **Divider** | Visual horizontal rule separator |
| **Image** | Paste, drop, or pick files — stored as blobs in IndexedDB |
| **Embed** | YouTube, Vimeo, Figma — auto-detected iframe rendering |
| **Mermaid** | Live-rendered diagrams with split source/preview editor |
| **Math (inline)** | KaTeX-rendered LaTeX within text flow |
| **Math (block)** | Display-mode LaTeX equations |
| **Mention** | `@`-reference to documents, users, or blocks |
| **Database Ref** | Placeholder for linked databases (coming soon) |

### Workspace & Navigation

| Feature | Description |
| :--- | :--- |
| **Multi-document** | Create, rename, delete documents and folders |
| **Tree sidebar** | Hierarchical folder/doc tree with drag-and-drop ordering |
| **Full-text search** | Fuzzy search across all documents in the workspace |
| **Command palette** | `⌘K` — navigate, insert blocks, toggle theme, export |
| **Outline panel** | Heading-based TOC with filter and click-to-scroll |
| **Breadcrumb bar** | Live cursor position within the document structure |

### Persistence & History

| Feature | Description |
| :--- | :--- |
| **Auto-save** | Debounced (1s) save to IndexedDB with status chip |
| **Version snapshots** | Last 10 automatic snapshots — restore, rename, or delete |
| **Search index** | Automatically updated full-text index per document |
| **Asset storage** | Images stored as blobs, served via cached `objectURL`s |

### Export & Import

| Format | Export | Import | Notes |
| :--- | :---: | :---: | :--- |
| **JSON** | ✅ | ✅ | Lossless — canonical Lexical state + metadata |
| **Markdown** | ✅ | ✅ | Zip bundle with `/images` folder |
| **HTML** | ✅ | — | Self-contained, base64-inlined images, offline-ready |
| **PDF** | ✅ | — | Print-based with dedicated `@media print` styles |

### Theming & Accessibility

- **Light & Dark mode** — CSS custom properties with system preference detection
- **Keyboard-first** — every action reachable via shortcuts
- **Responsive layout** — collapsible sidebar, flexible 3-pane shell
- **Accessible** — Radix UI primitives, ARIA labels, focus management

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9

### Install & Run

```bash
git clone https://github.com/your-org/obelisk.git
cd obelisk
npm install
npm run dev
```

Open **http://localhost:5173** — that's it. No env vars, no API keys, no backend.

### Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Type-check + production build to `dist/` |
| `npm run preview` | Serve production build locally |
| `npx tsc --noEmit` | Type-check without emitting |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         App Shell (React)                        │
├──────────┬──────────────────────────────────┬───────────────────┤
│ Sidebar  │         Editor (Lexical)         │  Outline Panel    │
│          │                                  │                   │
│ • Tree   │  ┌─ TopToolbar ──────────────┐   │  • Heading TOC    │
│ • Search │  │ Breadcrumb                │   │  • Filter         │
│ • CRUD   │  │ ┌────────────────────────┐│   │  • Click-to-nav   │
│          │  │ │   ContentEditable      ││   │                   │
│          │  │ │                        ││   │                   │
│          │  │ │   (Lexical Nodes)      ││   │                   │
│          │  │ └────────────────────────┘│   │                   │
│          │  │ FloatingToolbar  SlashMenu│   │                   │
│          │  └───────────────────────────┘   │                   │
├──────────┴──────────────────────────────────┴───────────────────┤
│                     Footer (save status + time)                  │
└─────────────────────────────────────────────────────────────────┘
         │                    │                         │
    ┌────▼────┐       ┌──────▼──────┐          ┌──────▼──────┐
    │ Zustand │       │   Lexical   │          │  IndexedDB  │
    │  Store  │       │  EditorState│          │   (via idb) │
    │         │       │             │          │             │
    │ • UI    │       │ • Nodes     │          │ • docs      │
    │ • Tree  │       │ • Plugins   │          │ • content   │
    │ • Theme │       │ • Commands  │          │ • versions  │
    └─────────┘       └─────────────┘          │ • assets    │
                                               │ • search    │
                                               └─────────────┘
```

### Project Structure

```text
src/
├── App.tsx                        Main 3-pane shell
├── main.tsx                       ReactDOM entry
├── index.css                      Theme tokens + Tailwind + globals
│
├── components/                    Header, Footer
├── db/                            IndexedDB layer
│   ├── idb.ts                     Schema + openDB
│   ├── interfaces.ts              Store contracts
│   ├── workspaceStore.impl.ts     Docs/folders/versions CRUD
│   ├── assetStore.impl.ts         Blob storage
│   └── migrations.ts              State schema versioning
│
├── editor/
│   ├── Editor.tsx                 LexicalComposer + plugin tree
│   ├── theme.ts                   CSS class → Lexical theme map
│   ├── nodes/                     10 custom node types
│   ├── plugins/                   12 editor plugins
│   └── commands/                  Block insert registry + palette data
│
├── features/
│   ├── workspace/                 Sidebar, TreeItem, WorkspaceSearch
│   ├── commandPalette/            ⌘K dialog
│   ├── outline/                   Heading TOC panel
│   ├── breadcrumb/                Cursor path bar
│   ├── versions/                  Snapshot history dialog
│   └── export/                    Export dialog + format modules
│
├── import/                        JSON + Markdown import
├── lib/                           Utility functions
├── store/                         Zustand store + selectors
├── styles/                        editor.css, print.css
└── types/                         TypeScript interfaces
```

### Tech Stack

| Layer | Choice | Why |
| :--- | :--- | :--- |
| **UI** | React 18 | Mature ecosystem, concurrent features |
| **Editor** | Lexical | Extensible, performant, Meta-backed |
| **State** | Zustand | Minimal, no boilerplate, outside-React access |
| **Storage** | IndexedDB (`idb`) | Offline-first, structured, blob-capable |
| **Styling** | TailwindCSS | Utility-first, tree-shakeable, CSS vars for theming |
| **Primitives** | Radix UI | Accessible, unstyled, composable |
| **Build** | Vite | Sub-second HMR, optimized chunks |
| **Math** | KaTeX | Fast, accurate LaTeX rendering (lazy-loaded) |
| **Diagrams** | Mermaid | Declarative diagrams (lazy-loaded) |
| **Icons** | Lucide | Consistent, tree-shakeable SVG icons |
| **Search** | Fuse.js | Client-side fuzzy search |

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `⌘ K` | Open command palette |
| `⌘ B` | Bold |
| `⌘ I` | Italic |
| `⌘ ⇧ S` | Strikethrough |
| `⌘ E` | Inline code |
| `⌘ Z` | Undo |
| `⌘ ⇧ Z` | Redo |
| `Tab` | Indent |
| `⇧ Tab` | Outdent |
| `/` | Open slash menu (at line start) |

### Markdown Shortcuts (auto-convert on space/enter)

| Input | Result |
| :--- | :--- |
| `# ` … `###### ` | Heading 1–6 |
| `> ` | Block quote |
| `- ` or `* ` | Bullet list |
| `1. ` | Numbered list |
| `` ``` `` | Code block |
| `**text**` | **Bold** |
| `_text_` | *Italic* |
| `~~text~~` | ~~Strikethrough~~ |
| `` `code` `` | `Inline code` |

---

## 🧩 Design Decisions

| Decision | Rationale |
| :--- | :--- |
| **Lexical JSON as canonical format** | Lossless serialization; enables deep equality tests on import/export round-trips |
| **Editor state NOT in Zustand** | Avoids 60fps update storms; Lexical manages its own reactivity |
| **Blob URLs cached & revoked** | Prevents memory leaks from orphaned object URLs |
| **KaTeX/Mermaid lazy-loaded** | 900KB+ combined — only loaded when a math/diagram node exists |
| **Export bridge via events** | Editor-dependent exports need Lexical instance without prop-drilling through React tree |
| **Max 3-level nesting** | Prevents deeply nested content that degrades readability and accessibility |
| **No backend in v1** | Simplifies deployment to zero; collaboration planned for v2 |

---

## 🗺 Roadmap

- [ ] **Drag handle** — reorder blocks via drag-and-drop
- [ ] **Linked databases** — Notion-style relational views embedded in docs
- [ ] **Real-time collaboration** — CRDT-based with WebRTC or WebSocket
- [ ] **PWA support** — installable, offline, service worker caching
- [ ] **Plugin API** — third-party block types and plugins
- [ ] **Mobile layout** — responsive editor with touch gestures
- [ ] **Keyboard shortcuts overlay** — visual shortcut reference panel
- [ ] **Template system** — pre-built document templates
- [ ] **Backlinks** — bi-directional document references

---

## 🤝 Contributing

Contributions are welcome! Please read the guidelines before submitting.

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feat/my-feature`
3. **Commit** with conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`
4. **Push** and open a Pull Request

### Development Notes

- Run `npx tsc --noEmit` before committing — zero errors required
- All custom nodes must implement `exportJSON()` / `importJSON()` for lossless persistence
- Heavy dependencies (KaTeX, Mermaid) must be lazy-loaded via dynamic `import()`
- CSS uses theme variables (`var(--*)`) — never hardcode colors

---

## 📄 License

MIT © Obelisk Contributors

---

<div align="center">

<img src="docs/assets/icon.svg" alt="Obelisk" width="32" />

<sub>Built with Lexical, React, and an unhealthy obsession with block editors.</sub>

</div>
