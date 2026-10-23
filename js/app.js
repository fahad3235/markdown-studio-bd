'use strict';
/* markdown-studio-bd -- editor app: toolbar, preview, stats, i18n, persistence. */

(function () {
  var LS_DRAFT = 'msbd.draft';
  var LS_LANG = 'msbd.lang';
  var LS_THEME = 'msbd.theme';

  var editor = document.getElementById('editor');
  var preview = document.getElementById('preview');
  var emptyState = document.getElementById('empty-state');
  var fileInput = document.getElementById('file-input');
  var modal = document.getElementById('modal-overlay');
  var modalInput = document.getElementById('modal-input');
  var modalConfirm = document.getElementById('modal-confirm');
  var modalCancel = document.getElementById('modal-cancel');
  var toastEl = document.getElementById('toast');

  var lang = 'en';
  try {
    lang = localStorage.getItem(LS_LANG) || 'en';
    if (lang !== 'en' && lang !== 'bn') lang = 'en';
  } catch (e) { lang = 'en'; }

  function t(key) { return I18N.get(lang, key); }
  function num(v) { return I18N.digits(lang, v); }

  /* ---------------- sample document (ASCII + escaped Bengali) --------- */
  var SAMPLE = [
    '# Markdown Studio BD',
    '',
    'Welcome to **Markdown Studio BD** -- a fully offline, bilingual markdown editor.',
    '',
    '## Features',
    '',
    '- Live preview with *synchronized scrolling*',
    '- **XSS-safe** rendering: `<script>` tags are shown as harmless text',
    '- Tables, task lists, and fenced code blocks',
    '',
    '## Sample table',
    '',
    '| Feature | Status |',
    '|---------|:------:|',
    '| Editor  | Done   |',
    '| Preview | Done   |',
    '',
    '## Task list',
    '',
    '- [x] Write the spec',
    '- [ ] Ship the app',
    '',
    '## Code',
    '',
    '```js',
    'console.log("hello, world");',
    '```',
    '',
    '> Tip: press **Ctrl+B** for bold, **Ctrl+I** for italic, **Ctrl+K** for a link.',
    '',
    '---',
    '',
    '### \u09AC\u09BE\u0982\u09B2\u09BE \u09B2\u09C7\u0996\u09BE\u0993 \u09B8\u09AE\u09B0\u09CD\u09A5\u09BF\u09A4\u0964',
    '',
    'End of sample. Clear it and write your own!'
  ].join('\n');

  /* ---------------- toast -------------------------------------------- */
  var toastTimer = null;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 2200);
  }

  /* ---------------- rendering + stats -------------------------------- */
  function renderPreview() {
    var src = editor.value;
    if (!src.trim()) {
      preview.innerHTML = '';
      emptyState.style.display = '';
      preview.appendChild(emptyState);
      return;
    }
    emptyState.style.display = 'none';
    preview.innerHTML = Markdown.parseMarkdown(src);
  }

  function updateStats() {
    var src = editor.value;
    var words = src.trim() ? src.trim().split(/\s+/).length : 0;
    var chars = src.length;
    var lines = src ? src.split('\n').length : 0;
    var mins = Math.max(1, Math.ceil(words / 200));
    document.getElementById('stat-words').textContent = num(words);
    document.getElementById('stat-chars').textContent = num(chars);
    document.getElementById('stat-lines').textContent = num(lines);
    document.getElementById('stat-read').textContent = num(mins) + ' ' + t('minAbbr');
  }

  var renderTimer = null;
  function scheduleUpdate() {
    if (renderTimer) clearTimeout(renderTimer);
    renderTimer = setTimeout(function () {
      renderPreview();
      updateStats();
      saveDraft();
    }, 120);
  }

  function saveDraft() {
    try { localStorage.setItem(LS_DRAFT, editor.value); } catch (e) { /* storage full/blocked */ }
  }
  function loadDraft() {
    try { return localStorage.getItem(LS_DRAFT) || ''; } catch (e) { return ''; }
  }

  /* ---------------- scroll sync -------------------------------------- */
  var syncing = false;
  editor.addEventListener('scroll', function () {
    if (syncing) return;
    var eMax = editor.scrollHeight - editor.clientHeight;
    var pMax = preview.scrollHeight - preview.clientHeight;
    if (eMax <= 0 || pMax <= 0) return;
    syncing = true;
    preview.scrollTop = (editor.scrollTop / eMax) * pMax;
    syncing = false;
  });

  /* ---------------- toolbar insert/wrap ------------------------------ */
  function wrapOrInsert(before, after, placeholder, block) {
    var start = editor.selectionStart;
    var end = editor.selectionEnd;
    var sel = editor.value.slice(start, end) || placeholder;
    var pre = block && start > 0 && editor.value.charAt(start - 1) !== '\n' ? '\n\n' : '';
    var post = block ? '\n' : '';
    var replacement = pre + before + sel + after + post;
    editor.value = editor.value.slice(0, start) + replacement + editor.value.slice(end);
    var cursor = start + pre.length + before.length;
    editor.selectionStart = cursor;
    editor.selectionEnd = cursor + sel.length;
    editor.focus();
    scheduleUpdate();
  }

  var TOOLBAR = {
    bold: function () { wrapOrInsert('**', '**', t('boldText')); },
    italic: function () { wrapOrInsert('*', '*', t('italicText')); },
    code: function () { wrapOrInsert('`', '`', t('codeText')); },
    link: function () { wrapOrInsert('[', '](' + t('urlPlaceholder') + ')', t('linkText')); },
    image: function () { wrapOrInsert('![', '](' + t('urlPlaceholder') + ')', t('imageAlt')); },
    ul: function () { wrapOrInsert('- ', '', 'list item', true); },
    ol: function () { wrapOrInsert('1. ', '', 'list item', true); },
    quote: function () { wrapOrInsert('> ', '', t('quoteText'), true); },
    codeblock: function () { wrapOrInsert('```\n', '\n```', 'code here', true); },
    table: function () {
      var h = t('tableHeader');
      wrapOrInsert('', '', '', true);
      var start = editor.selectionStart;
      var tpl = '| ' + h + ' 1 | ' + h + ' 2 |\n|---|---|\n| a | b |\n';
      editor.value = editor.value.slice(0, start) + tpl + editor.value.slice(start);
      editor.selectionStart = editor.selectionEnd = start + tpl.length;
      editor.focus();
      scheduleUpdate();
    },
    h1: function () { wrapOrInsert('# ', '', t('tipH1'), true); },
    h2: function () { wrapOrInsert('## ', '', t('tipH2'), true); },
    h3: function () { wrapOrInsert('### ', '', t('tipH3'), true); }
  };

  document.querySelectorAll('[data-tool]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var fn = TOOLBAR[btn.getAttribute('data-tool')];
      if (fn) fn();
    });
  });

  document.addEventListener('keydown', function (e) {
    if (!(e.ctrlKey || e.metaKey)) return;
    var k = e.key.toLowerCase();
    if (k === 'b') { e.preventDefault(); TOOLBAR.bold(); }
    else if (k === 'i') { e.preventDefault(); TOOLBAR.italic(); }
    else if (k === 'k') { e.preventDefault(); TOOLBAR.link(); }
  });

  /* ---------------- document actions --------------------------------- */
  document.getElementById('btn-new').addEventListener('click', function () {
    if (editor.value.trim() && !window.confirm(t('confirmNew'))) return;
    editor.value = '';
    scheduleUpdate();
    toast(t('newCreated'));
  });

  document.getElementById('btn-open').addEventListener('click', function () {
    fileInput.click();
  });

  fileInput.addEventListener('change', function () {
    var f = fileInput.files && fileInput.files[0];
    fileInput.value = '';
    if (!f) return;
    if (!/\.(md|markdown|txt)$/i.test(f.name)) {
      toast(t('invalidFile'));
      return;
    }
    var reader = new FileReader();
    reader.onload = function () {
      editor.value = String(reader.result || '');
      scheduleUpdate();
      toast(t('fileOpened'));
    };
    reader.onerror = function () { toast(t('invalidFile')); };
    reader.readAsText(f);
  });

  document.getElementById('btn-sample').addEventListener('click', function () {
    editor.value = SAMPLE;
    scheduleUpdate();
    toast(t('sampleLoaded'));
  });

  document.getElementById('btn-clear').addEventListener('click', function () {
    modalInput.value = '';
    modalConfirm.disabled = true;
    modal.classList.add('open');
    setTimeout(function () { modalInput.focus(); }, 50);
  });
  modalInput.addEventListener('input', function () {
    modalConfirm.disabled = modalInput.value.trim() !== 'DELETE';
  });
  modalCancel.addEventListener('click', function () { modal.classList.remove('open'); });
  modal.addEventListener('click', function (e) {
    if (e.target === modal) modal.classList.remove('open');
  });
  modalConfirm.addEventListener('click', function () {
    if (modalInput.value.trim() !== 'DELETE') return;
    modal.classList.remove('open');
    editor.value = '';
    try { localStorage.removeItem(LS_DRAFT); } catch (e) {}
    renderPreview();
    updateStats();
    toast(t('cleared'));
  });

  function download(filename, content, mime) {
    var blob = new Blob([content], { type: mime });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 500);
  }

  function docTitle() {
    var m = editor.value.match(/^#{1,6}\s+(.+)$/m);
    return m ? m[1].trim().slice(0, 60) : 'Markdown Studio BD';
  }

  document.getElementById('btn-dl-md').addEventListener('click', function () {
    download('document.md', editor.value, 'text/markdown;charset=utf-8');
    toast(t('downloaded'));
  });

  document.getElementById('btn-dl-html').addEventListener('click', function () {
    var bodyHtml = Markdown.parseMarkdown(editor.value);
    var page = '<!DOCTYPE html>\n<html lang="' + lang + '">\n<head>\n<meta charset="utf-8">\n' +
      '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
      '<title>' + Markdown.escapeHtml(docTitle()) + '</title>\n<style>\n' +
      'body{font-family:system-ui,sans-serif;max-width:800px;margin:0 auto;padding:24px;line-height:1.65;color:#1d2430}\n' +
      'pre{background:#f1f3f6;padding:14px;border-radius:8px;overflow-x:auto}\n' +
      'code{background:#f1f3f6;padding:2px 6px;border-radius:4px}\n' +
      'pre code{background:none;padding:0}\n' +
      'blockquote{border-left:4px solid #1f6feb;margin:1em 0;padding:.2em 1em;color:#555}\n' +
      'table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:8px 12px}\n' +
      'img{max-width:100%}\n</style>\n</head>\n<body>\n' + bodyHtml + '\n</body>\n</html>\n';
    download('document.html', page, 'text/html;charset=utf-8');
    toast(t('downloaded'));
  });

  document.getElementById('btn-print').addEventListener('click', function () {
    window.print();
  });

  /* ---------------- theme -------------------------------------------- */
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.getElementById('theme-light').classList.toggle('active', theme === 'light');
    document.getElementById('theme-dark').classList.toggle('active', theme === 'dark');
    try { localStorage.setItem(LS_THEME, theme); } catch (e) {}
  }
  var theme = 'light';
  try { theme = localStorage.getItem(LS_THEME) || 'light'; } catch (e) {}
  document.getElementById('theme-light').addEventListener('click', function () { applyTheme('light'); });
  document.getElementById('theme-dark').addEventListener('click', function () { applyTheme('dark'); });
  applyTheme(theme === 'dark' ? 'dark' : 'light');

  /* ---------------- language ----------------------------------------- */
  function applyLang(next) {
    lang = next;
    document.documentElement.setAttribute('lang', lang);
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    document.querySelectorAll('[data-i18n-ph]').forEach(function (el) {
      el.setAttribute('placeholder', t(el.getAttribute('data-i18n-ph')));
    });
    document.querySelectorAll('[data-i18n-title]').forEach(function (el) {
      el.setAttribute('title', t(el.getAttribute('data-i18n-title')));
    });
    document.getElementById('lang-en').classList.toggle('active', lang === 'en');
    document.getElementById('lang-bn').classList.toggle('active', lang === 'bn');
    editor.setAttribute('placeholder', t('placeholder'));
    updateStats();
    try { localStorage.setItem(LS_LANG, lang); } catch (e) {}
  }
  document.getElementById('lang-en').addEventListener('click', function () { applyLang('en'); });
  document.getElementById('lang-bn').addEventListener('click', function () { applyLang('bn'); });

  /* ---------------- boot --------------------------------------------- */
  editor.value = loadDraft();
  applyLang(lang);
  renderPreview();
  updateStats();
  editor.addEventListener('input', scheduleUpdate);
})();
