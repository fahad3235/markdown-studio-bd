# Markdown Studio BD

An offline, bilingual (English / Bangla) markdown editor with a live split-pane
preview. Everything runs locally in the browser: no servers, no network
requests, no accounts. Your text is autosaved to the browser's localStorage and
never leaves the device.

## Problem

Writers, students, and developers in Bangladesh often need a quick markdown
editor that works without an internet connection and feels native in both
English and Bangla. Existing online editors require connectivity and accounts;
this project is a single static site that works from a file or any static host.

## Features

1. **Live split editor** -- textarea on the left, rendered preview on the right
   (stacked vertically on mobile), with proportional synchronized scrolling.
2. **Hand-rolled markdown parser** (`js/markdown.js`) -- ATX headings,
   bold/italic/strikethrough, inline code, fenced code blocks with language
   labels, links, images, nested ordered/unordered lists, task lists,
   blockquotes, horizontal rules, GFM tables, and paragraphs. Also runs under
   node so it is covered by unit tests.
3. **XSS-safe by construction** -- raw HTML is escaped before any markdown
   token is processed; link/image URL schemes are restricted to
   http/https/mailto/relative. A pasted `<script>` tag renders as inert text.
4. **Formatting toolbar** -- bold, italic, inline code, link, image, bullet
   list, numbered list, quote, code block, table, H1/H2/H3, with keyboard
   shortcuts Ctrl+B / Ctrl+I / Ctrl+K. Inserts or wraps at the cursor.
5. **Document stats bar** -- live word, character, and line counts plus
   estimated reading time.
6. **Document management** -- New, Open (.md/.txt via file picker), autosave
   draft to localStorage (restored on load), Clear behind a typed-DELETE
   confirmation modal, Download .md, Download standalone styled .html, Print
   stylesheet, and a Load Sample button.
7. **Bilingual UI + themes** -- full English/Bangla interface toggle
   (persisted; Bangla digit rendering for numbers when Bangla is active) and a
   light/dark theme toggle (persisted).
8. **Responsive mobile layout** -- panes stack at small widths; verified with
   no horizontal overflow at 390px.

## Stack

- Plain HTML, CSS, and JavaScript. No frameworks, no build step, no CDN.
- `js/markdown.js` -- the parser (browser global `Markdown`, node
  `module.exports`).
- `js/i18n.js` -- English/Bangla string tables (Bengali stored as ASCII
  `\uXXXX` escapes so every source file is pure ASCII).
- `js/app.js` -- editor wiring.

## Prerequisites

Any modern browser (Chrome, Edge, Firefox, Safari). For running the tests:
node.js 16+.

## Install

No install step. Open `index.html` directly, or serve the folder with any
static server:

```sh
cd markdown-studio-bd
python3 -m http.server 8080
# then open http://localhost:8080/
```

## Dev commands

```sh
node tests/unit.js    # parser + i18n unit tests (node, no browser needed)
node tests/smoke.js   # headless-Chrome smoke tests (needs puppeteer-core and a Chrome binary)
```

The smoke test expects `puppeteer-core` resolvable from `/tmp/qatest/node_modules`
and Chrome at `/opt/meta-chromium/chrome`; adjust the two constants at the top
of `tests/smoke.js` for your machine.

## Testing

- **Node unit tests:** 74/74 passing. Cover headings, emphasis nesting, inline
  code escaping, fenced code (incl. unclosed fence), links/images/titles,
  XSS vectors (`<script>`, `<img onerror>`, `javascript:`/`data:` URLs,
  case-mixed schemes, quote breakouts), nested and mixed lists, task lists,
  blockquotes, horizontal rules, GFM tables with alignment, paragraphs, and
  edge cases (empty input, unclosed emphasis, CRLF).
- **Headless-Chrome smoke tests:** 40/40 passing. Cover clean load with zero
  console/page errors, live H1 rendering, toolbar bold wrapping, XSS payload
  rendering inert, Bangla toggle + persistence across reload, live stats,
  dark-theme toggle + persistence, sample document, .md and standalone-.html
  downloads (file content verified), .md file open, typed-DELETE clear flow,
  Ctrl+B shortcut, draft autosave restore, New button, 390px viewport with no
  horizontal overflow, and zero HTTP(S) network requests.
- Full details in `TEST_RESULTS.md`.

## Deployment

Copy the folder to any static host (GitHub Pages, Netlify, nginx, or a USB
stick). There is no backend and no environment configuration. For GitHub
Pages: push the folder contents to the `main` branch of a public repo and
enable Pages on `main` / root.

## Limitations

- The parser is a pragmatic subset of markdown: no setext headings, no
  reference-style links, no footnotes, no definition lists, no math.
- Tables need a delimiter row; list items support inline markdown plus nested
  lists but not nested code blocks or multi-paragraph items.
- Autosave keeps a single draft in localStorage (per browser/device); there is
  no multi-document library or cloud sync.
- Print output uses the browser's print dialog and styling.

## Status

Complete MVP. Built, tested (74/74 unit + 40/40 smoke), and documented.
