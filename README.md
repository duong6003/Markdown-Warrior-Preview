# Markdown Warrior Preview

A modern, beautiful markdown preview extension for VS Code with presentation mode, smooth animations, and rich features.

## Features

### Beautiful Preview
- Modern typography with VS Code theme sync
- Smooth fade-in animations and hover effects
- Syntax highlighting powered by Shiki (same engine as VS Code)
- Table of Contents sidebar with click navigation
- Collapsible headings (click h2/h3 to collapse)

### Rich Content Support
- **Mermaid diagrams** — render flowcharts, sequence diagrams, and more
- **KaTeX math** — inline `$E=mc^2$` and block `$$...$$` equations
- **Frontmatter** — display YAML metadata beautifully
- **Interactive checkboxes** — click to toggle task list items in source

### Presentation Mode
- Split slides with `---` (horizontal rules)
- Keyboard navigation (arrows, space, escape)
- Speaker notes with `<!-- notes: Your notes -->`
- Dot navigation and slide counter
- Smooth fade transitions

### Developer Experience
- Two-way scroll sync between editor and preview
- Local image support (relative and absolute paths)
- State persistence (scroll position, collapsed headings)
- Live preview with 200ms debounce
- Export to HTML and PDF

## Commands

| Command | Description |
|---------|-------------|
| `Markdown Warrior: Open Preview` | Open preview panel beside editor |
| `Markdown Warrior: Toggle Presentation Mode` | Switch to/from slide mode |
| `Markdown Warrior: Export as HTML` | Export standalone HTML file |
| `Markdown Warrior: Export as PDF (via Browser)` | Open in browser for PDF print |

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `markdownWarrior.scrollSync` | `true` | Enable two-way scroll sync |
| `markdownWarrior.fontSize` | `16` | Preview font size (px) |
| `markdownWarrior.lineHeight` | `1.6` | Preview line height |
| `markdownWarrior.showTOC` | `true` | Show table of contents |
| `markdownWarrior.presentationTransition` | `fade` | Slide transition effect |

## Presentation Mode

Write your markdown normally, using `---` to separate slides:

```markdown
# My Presentation

Welcome to my talk!

---

## Slide 2

- Point one
- Point two

<!-- notes: Remember to explain point two in detail -->

---

## Conclusion

Thank you!
```

Press **▶ Slides** button or run the toggle command to enter presentation mode.

## Requirements

- VS Code 1.80+

## License

MIT
