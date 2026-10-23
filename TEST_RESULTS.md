# Markdown Studio BD -- Test Results

Date: 2026-10-23 (run #115, slot 15:00 Asia/Dhaka)
Tester: factory builder (subagent)

## Summary

- Node unit tests (`tests/unit.js`): **74/74 passing**
- Headless-Chrome smoke tests (`tests/smoke.js`): **40/40 passing**
- ASCII-source check: clean (`grep -rP '[^\x00-\x7F]'` over
  `index.html`, `css/`, `js/`, `tests/` returns nothing)

## Unit tests (node, no browser)

Covers `js/markdown.js` (parser/renderer/escaper) and `js/i18n.js`:

- Headings: h1/h2/h6, trailing-hash stripping, 7-hash and no-space rejections
- Emphasis: bold/italic (both marker styles), strikethrough, `***bold-italic***`,
  nesting in both directions (bold>italic, italic>bold, strike>bold)
- Inline code: basic, markdown-inside-code stays literal, HTML inside code escaped
- Fenced code: language label rendering, HTML escaping inside fences,
  unclosed fence consumes the rest of the document
- Links/images: basic, titles, relative URLs, bold link text, balanced
  parentheses in URLs (e.g. Wikipedia-style)
- XSS vectors: `<script>` tag inert, `<img onerror>` inert, `javascript:` /
  `data:` / case-mixed scheme URLs neutralized to `#`, quote-breakout in
  titles neutralized, escaped `<svg onload>` stays inert text
- Lists: ul/ol/paren markers, nesting to 3 levels, ordered-after-unordered
  splits into a separate list, task lists checked/unchecked, inline markdown
  inside items
- Blockquote (incl. nested formatting), hr (3 styles), GFM tables with
  left/center alignment and non-table rejection, paragraph merging/splitting
- Edge cases: empty input, whitespace-only, unclosed emphasis/backtick left
  literal, CRLF input, ampersand escaping
- i18n: EN/BN lookup, missing-key fallback, EN vs BN digit rendering,
  BN table covers every EN key

## Smoke tests (headless Chromium 152, puppeteer-core, file://)

40 checks, all passing:

1. Page loads with zero console errors and zero page errors
2. Typing `# Hello` renders an H1 with text "Hello"
3. Toolbar bold wraps the text selection (`**hello**`) and renders `<strong>`
4. XSS payload (`<script>`, `<img onerror>`, `javascript:` link) renders inert:
   no `<script>` element, tags escaped, href neutralized to `#`
5. Bangla toggle switches UI strings (e.g. "New" -> Bengali), sets
   `lang="bn"`, persists across reload via localStorage; numbers render in
   Bengali digits
6. Stats bar updates live (words/chars/lines/reading time verified)
7. Dark theme applies and persists across reload
8. Sample button loads the demo doc (H1 + table render)
9. "Download .md" produces `document.md` on disk with exact editor content
10. "Download .html" produces a standalone file with doctype, embedded styles,
    and the rendered H1
11. Opening a `.md` file via the file picker loads its content and renders it
12. Clear flow: modal opens, Confirm disabled until exactly `DELETE` is typed,
    then clears the editor and shows the empty state
13. Ctrl+B wraps the selection in `**...**`
14. Draft autosaves to localStorage and is restored after reload
15. New button clears the editor (with confirm dialog accepted)
16. At 390px viewport: `document.documentElement.scrollWidth <= 390`
    (no horizontal overflow, including with a wide table and long code line)
17. Zero HTTP(S) network requests during the whole session

## Repairs made

1. **Parser bug (app bug):** an ordered list following an unordered list was
   absorbed into one `<ul>`. Fixed `parseList` to end the block when a
   top-level marker switches ordered/unordered.
2. **Parser bug (app bug):** URLs containing balanced parentheses (e.g.
   `javascript:alert(1)`, Wikipedia links) left a stray `)` outside the link.
   Rewrote the URL pattern to accept one level of balanced parens; the
   `javascript:` case is still sanitized to `#`.
3. **Parser bug (app bug):** link/image titles never matched because `"` is
   escaped to `&quot;` before inline parsing. Title pattern now matches the
   escaped form.
4. **Test-side fix:** three unit-test expectations were wrong
   (link-title text, escaped `<svg onload>` treated as a failure, two
   pipe-lines merging into one paragraph is correct behavior). Corrected the
   expectations; parser unchanged.
5. **Test-side fix:** smoke test hung on `waitUntil: 'networkidle0'` over
   `file://` (never settles). Switched all navigations to `domcontentloaded`.
6. **Test-side fix:** one flaky run crashed with `TargetCloseError` when the
   native `confirm()` dialog from the New button raced the click without a
   dialog handler. Added `page.on('dialog', d => d.accept())`; suite is
   stable since (two consecutive 40/40 runs).
7. **Source hygiene:** literal Bengali characters that slipped into
   `js/i18n.js`, `tests/unit.js`, and `tests/smoke.js` were converted to
   ASCII `\uXXXX` escapes; a raw-U+0001 placeholder scheme in
   `js/markdown.js` was replaced with a plain-ASCII `@@MSBD<n>@@` token.

No repair cycle exceeded the 2-per-category budget; no category is failing.
