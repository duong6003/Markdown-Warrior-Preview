# Markdown Warrior Preview

Markdown Warrior Preview is a polished Markdown preview extension for VS Code. It turns plain `.md` files into a readable, presentation-ready document view with rich layouts, full theme packs, diagrams, math, syntax highlighting, and export tools.

It is built for people who write serious Markdown: technical notes, specs, project documentation, teaching material, internal docs, talks, and long-form knowledge bases.

## Why Use It

VS Code already has a Markdown preview, but it is intentionally simple. Markdown Warrior Preview is for moments when the preview should feel closer to a finished document:

- Your document needs structure, hierarchy, and breathing room.
- Code blocks, math, diagrams, and tables should look intentional.
- Long documents should remain comfortable to scan and read.
- Notes should become slides without leaving VS Code.
- Theme choice should belong to the document preview, not only to the editor.

## Highlights

### Rich Document Layouts

Switch between multiple layout modes from the toolbar:

- **Auto** - chooses a layout based on document shape.
- **Docs** - clean long-form reading with section navigation.
- **Magazine** - editorial layout for narrative or announcement-style content.
- **Story** - immersive section-by-section reading.
- **Dashboard** - card-based overview for dense structured documents.

Layouts are content-aware, use balanced cards, and avoid clipping important text by default.

### 12 Built-In Theme Packs

Pick a complete preview theme from the side panel. A theme pack changes:

- Preview colors
- Markdown UI colors
- Syntax highlighting theme
- Font stack
- Radius and surface styling

Included themes:

- Catppuccin Mocha
- GitHub Dark
- Dracula
- Tokyo Night
- Nord
- High Contrast Dark
- Vesper
- Pitch Black (OLED)
- Catppuccin Latte
- GitHub Light
- Sepia
- Solarized Light

Theme selection is saved globally with VS Code `globalState`, so it persists across files and sessions.

### Markdown That Feels Complete

Markdown Warrior Preview supports the content blocks common in real documentation:

- Mermaid diagrams
- KaTeX inline and block math
- Shiki syntax highlighting
- YAML frontmatter display
- Tables
- Images with local path resolution
- Task lists with clickable checkboxes
- Collapsible `h2` and `h3` sections
- Table of contents navigation
- Two-way editor/preview scroll sync

### Presentation Mode

Use Markdown as a lightweight slide format:

- Split slides with horizontal rules (`---`)
- Navigate with keyboard controls
- Add speaker notes in comments
- Exit quickly with `Esc`
- Keep source and presentation in one file

Example:

```markdown
# Project Review

What changed this week.

---

## Highlights

- Released a new preview theme system
- Improved long-document reading
- Packaged a clean VSIX

<!-- notes: Mention the theme persistence behavior. -->

---

## Next

- Collect user feedback
- Polish Marketplace listing
```

### Export

Export rendered Markdown when you need to share outside VS Code:

- Export as HTML
- Export as PDF through browser print flow

## Getting Started

1. Open a Markdown file in VS Code.
2. Run **Markdown Warrior: Open Preview** from the Command Palette.
3. Use the toolbar to change layout, open the theme panel, or enter presentation mode.

The preview updates as you edit the source file.

## Commands

| Command | What it does |
| --- | --- |
| `Markdown Warrior: Open Preview` | Opens the rich preview beside the editor |
| `Markdown Warrior: Toggle Presentation Mode` | Switches between document view and slides |
| `Markdown Warrior: Export as HTML` | Exports a standalone HTML file |
| `Markdown Warrior: Export as PDF (via Browser)` | Opens a browser print flow for PDF export |

## Settings

| Setting | Default | Description |
| --- | --- | --- |
| `markdownWarrior.scrollSync` | `true` | Syncs editor and preview scroll position |
| `markdownWarrior.fontSize` | `16` | Sets preview font size in pixels |
| `markdownWarrior.lineHeight` | `1.6` | Sets preview line height |
| `markdownWarrior.showTOC` | `true` | Shows table of contents where supported |
| `markdownWarrior.presentationTransition` | `fade` | Sets slide transition behavior |

## Frontmatter

Some layouts respond to document structure and metadata. You can guide layout selection with frontmatter:

```markdown
---
title: Quarterly Planning
layout: dashboard
---

# Quarterly Planning

...
```

Supported layout values:

- `magazine`
- `docs`
- `story`
- `dashboard`

If no layout is set, Auto mode chooses based on document content.

## Requirements

- VS Code 1.80 or newer

## Good Fits

Markdown Warrior Preview works well for:

- Engineering specs
- Architecture notes
- Product briefs
- Internal documentation
- Learning material
- Markdown-based presentations
- Personal knowledge bases
- Release notes and project reports

## License

MIT
