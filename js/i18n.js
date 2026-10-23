'use strict';
/*
 * markdown-studio-bd \u2014 bilingual UI strings (EN + BN).
 * All Bengali strings use ASCII \uXXXX escapes so the source stays pure ASCII.
 * Works in the browser (global `I18N`) and under node (module.exports).
 */

var I18N = (function () {
  var STRINGS = {
    en: {
      tagline: 'Offline bilingual markdown editor',
      editorLabel: 'Editor',
      previewLabel: 'Preview',
      new: 'New',
      open: 'Open',
      sample: 'Sample',
      clear: 'Clear',
      downloadMd: 'Download .md',
      downloadHtml: 'Download .html',
      print: 'Print',
      light: 'Light',
      dark: 'Dark',
      words: 'Words',
      chars: 'Characters',
      lines: 'Lines',
      readingTime: 'Reading time',
      minAbbr: 'min',
      placeholder: '# Start writing markdown here...',
      emptyTitle: 'Start writing here',
      emptyHint: 'Write markdown in the editor on the left and see the preview on the right.',
      confirmClearTitle: 'Clear document',
      confirmClearBody: 'All text will be permanently deleted. To confirm, type DELETE below.',
      typeDeleteLabel: 'Type DELETE to confirm',
      confirm: 'Confirm',
      cancel: 'Cancel',
      sampleLoaded: 'Sample document loaded',
      fileOpened: 'File opened',
      downloaded: 'Download started',
      cleared: 'Document cleared',
      newCreated: 'New document started',
      confirmNew: 'Start a new document? The current text will be replaced.',
      invalidFile: 'Only .md / .txt files can be opened',
      tipBold: 'Bold',
      tipItalic: 'Italic',
      tipCode: 'Inline code',
      tipLink: 'Link',
      tipImage: 'Image',
      tipBullets: 'Bulleted list',
      tipNumbers: 'Numbered list',
      tipQuote: 'Quote',
      tipCodeBlock: 'Code block',
      tipTable: 'Table',
      tipH1: 'Heading 1',
      tipH2: 'Heading 2',
      tipH3: 'Heading 3',
      tableHeader: 'Header',
      urlPlaceholder: 'https://example.com',
      imageAlt: 'alt text',
      boldText: 'bold text',
      italicText: 'italic text',
      codeText: 'code',
      linkText: 'link text',
      quoteText: 'quote'
    },
    bn: {
      tagline: '\u0985\u09AB\u09B2\u09BE\u0987\u09A8 \u09A6\u09CD\u09AC\u09BF\u09AD\u09BE\u09B7\u09BF\u0995 \u09AE\u09BE\u09B0\u09CD\u0995\u09A1\u09BE\u0989\u09A8 \u098F\u09A1\u09BF\u099F\u09B0',
      editorLabel: '\u098F\u09A1\u09BF\u099F\u09B0',
      previewLabel: '\u09AA\u09CD\u09B0\u09BF\u09AD\u09BF\u0989',
      new: '\u09A8\u09A4\u09C1\u09A8',
      open: '\u0996\u09C1\u09B2\u09C1\u09A8',
      sample: '\u09A8\u09AE\u09C1\u09A8\u09BE',
      clear: '\u09AE\u09C1\u099B\u09C1\u09A8',
      downloadMd: '\u09A1\u09BE\u0989\u09A8\u09B2\u09CB\u09A1 .md',
      downloadHtml: '\u09A1\u09BE\u0989\u09A8\u09B2\u09CB\u09A1 .html',
      print: '\u09AA\u09CD\u09B0\u09BF\u09A8\u09CD\u099F',
      light: '\u0986\u09B2\u09CB',
      dark: '\u0985\u09A8\u09CD\u09A7\u0995\u09BE\u09B0',
      words: '\u09B6\u09AC\u09CD\u09A6',
      chars: '\u0985\u0995\u09CD\u09B7\u09B0',
      lines: '\u09B2\u09BE\u0987\u09A8',
      readingTime: '\u09AA\u09A1\u09BC\u09BE\u09B0 \u09B8\u09AE\u09AF\u09BC',
      minAbbr: '\u09AE\u09BF\u09A8\u09BF\u099F',
      placeholder: '# \u098F\u0996\u09BE\u09A8\u09C7 \u09AE\u09BE\u09B0\u09CD\u0995\u09A1\u09BE\u0989\u09A8 \u09B2\u09BF\u0996\u09C1\u09A8...',
      emptyTitle: '\u098F\u0996\u09BE\u09A8\u09C7 \u09B2\u09C7\u0996\u09BE \u09B6\u09C1\u09B0\u09C1 \u0995\u09B0\u09C1\u09A8',
      emptyHint: '\u09AC\u09BE\u09AE \u09AA\u09BE\u09B6\u09C7\u09B0 \u098F\u09A1\u09BF\u099F\u09B0\u09C7 \u09AE\u09BE\u09B0\u09CD\u0995\u09A1\u09BE\u0989\u09A8 \u09B2\u09BF\u0996\u09C1\u09A8, \u09A1\u09BE\u09A8 \u09AA\u09BE\u09B6\u09C7 \u09AA\u09CD\u09B0\u09BF\u09AD\u09BF\u0989 \u09A6\u09C7\u0996\u09C1\u09A8\u0964',
      confirmClearTitle: '\u09A1\u0995\u09C1\u09AE\u09C7\u09A8\u09CD\u099F \u09AE\u09C1\u099B\u09C1\u09A8',
      confirmClearBody: '\u09B8\u09AC \u09B2\u09C7\u0996\u09BE \u09B8\u09CD\u09A5\u09BE\u09AF\u09BC\u09C0\u09AD\u09BE\u09AC\u09C7 \u09AE\u09C1\u099B\u09C7 \u09AF\u09BE\u09AC\u09C7\u0964 \u09A8\u09BF\u09B6\u09CD\u099A\u09BF\u09A4 \u0995\u09B0\u09A4\u09C7 \u09A8\u09BF\u099A\u09C7 DELETE \u09B2\u09BF\u0996\u09C1\u09A8\u0964',
      typeDeleteLabel: '\u09A8\u09BF\u09B6\u09CD\u099A\u09BF\u09A4 \u0995\u09B0\u09A4\u09C7 DELETE \u09B2\u09BF\u0996\u09C1\u09A8',
      confirm: '\u09A8\u09BF\u09B6\u09CD\u099A\u09BF\u09A4 \u0995\u09B0\u09C1\u09A8',
      cancel: '\u09AC\u09BE\u09A4\u09BF\u09B2',
      sampleLoaded: '\u09A8\u09AE\u09C1\u09A8\u09BE \u09B2\u09CB\u09A1 \u09B9\u09AF\u09BC\u09C7\u099B\u09C7',
      fileOpened: '\u09AB\u09BE\u0987\u09B2 \u0996\u09CB\u09B2\u09BE \u09B9\u09AF\u09BC\u09C7\u099B\u09C7',
      downloaded: '\u09A1\u09BE\u0989\u09A8\u09B2\u09CB\u09A1 \u09B6\u09C1\u09B0\u09C1 \u09B9\u09AF\u09BC\u09C7\u099B\u09C7',
      cleared: '\u09AE\u09C1\u099B\u09C7 \u09AB\u09C7\u09B2\u09BE \u09B9\u09AF\u09BC\u09C7\u099B\u09C7',
      newCreated: '\u09A8\u09A4\u09C1\u09A8 \u09A1\u0995\u09C1\u09AE\u09C7\u09A8\u09CD\u099F \u09B6\u09C1\u09B0\u09C1 \u09B9\u09AF\u09BC\u09C7\u099B\u09C7',
      confirmNew: '\u09A8\u09A4\u09C1\u09A8 \u09A1\u0995\u09C1\u09AE\u09C7\u09A8\u09CD\u099F \u09B6\u09C1\u09B0\u09C1 \u0995\u09B0\u09AC\u09C7\u09A8? \u09AC\u09B0\u09CD\u09A4\u09AE\u09BE\u09A8 \u09B2\u09C7\u0996\u09BE \u09AE\u09C1\u099B\u09C7 \u09AF\u09BE\u09AC\u09C7.',
      invalidFile: '\u09B6\u09C1\u09A7\u09C1\u09AE\u09BE\u09A4\u09CD\u09B0 .md / .txt \u09AB\u09BE\u0987\u09B2 \u0996\u09CB\u09B2\u09BE \u09AF\u09BE\u09AC\u09C7',
      tipBold: '\u09AC\u09CB\u09B2\u09CD\u09A1',
      tipItalic: '\u0987\u099F\u09BE\u09B2\u09BF\u0995',
      tipCode: '\u0987\u09A8\u09B2\u09BE\u0987\u09A8 \u0995\u09CB\u09A1',
      tipLink: '\u09B2\u09BF\u0982\u0995',
      tipImage: '\u099B\u09AC\u09BF',
      tipBullets: '\u09AC\u09C1\u09B2\u09C7\u099F \u09A4\u09BE\u09B2\u09BF\u0995\u09BE',
      tipNumbers: '\u09B8\u0982\u0996\u09CD\u09AF\u09BE \u09A4\u09BE\u09B2\u09BF\u0995\u09BE',
      tipQuote: '\u0989\u09A6\u09CD\u09A7\u09C3\u09A4\u09BF',
      tipCodeBlock: '\u0995\u09CB\u09A1 \u09AC\u09CD\u09B2\u0995',
      tipTable: '\u099F\u09C7\u09AC\u09BF\u09B2',
      tipH1: '\u09B6\u09BF\u09B0\u09CB\u09A8\u09BE\u09AE \u09E7',
      tipH2: '\u09B6\u09BF\u09B0\u09CB\u09A8\u09BE\u09AE \u09E8',
      tipH3: '\u09B6\u09BF\u09B0\u09CB\u09A8\u09BE\u09AE \u09E9',
      tableHeader: '\u09B9\u09C7\u09A1\u09BE\u09B0',
      urlPlaceholder: 'https://example.com',
      imageAlt: 'alt text',
      boldText: '\u09AC\u09CB\u09B2\u09CD\u09A1 \u09B2\u09C7\u0996\u09BE',
      italicText: '\u0987\u099F\u09BE\u09B2\u09BF\u0995 \u09B2\u09C7\u0996\u09BE',
      codeText: '\u0995\u09CB\u09A1',
      linkText: '\u09B2\u09BF\u0982\u0995 \u09B2\u09C7\u0996\u09BE',
      quoteText: '\u0989\u09A6\u09CD\u09A7\u09C3\u09A4\u09BF'
    }
  };

  var BN_DIGITS = ['\u09E6', '\u09E7', '\u09E8', '\u09E9', '\u09EA', '\u09EB', '\u09EC', '\u09ED', '\u09EE', '\u09EF'];

  function get(lang, key) {
    if (STRINGS[lang] && STRINGS[lang][key] !== undefined) return STRINGS[lang][key];
    return STRINGS.en[key] || key;
  }

  /* Render ASCII digits as Bengali digits when BN is active. */
  function digits(lang, value) {
    var s = String(value);
    if (lang !== 'bn') return s;
    return s.replace(/[0-9]/g, function (d) { return BN_DIGITS[+d]; });
  }

  function keys() { return Object.keys(STRINGS.en); }

  return { get: get, digits: digits, keys: keys };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = I18N;
} else if (typeof window !== 'undefined') {
  window.I18N = I18N;
}
