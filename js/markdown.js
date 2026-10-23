'use strict';
/*
 * markdown-studio-bd -- hand-rolled markdown parser.
 * Supports: ATX headings, bold/italic/strikethrough, inline code, fenced code
 * blocks (with language label), links, images, nested unordered/ordered lists,
 * task lists, blockquotes, horizontal rules, GFM tables, paragraphs.
 *
 * XSS-safe by construction: the raw input is HTML-escaped BEFORE any markdown
 * tokens are processed, and only whitelisted generated markup is emitted.
 * URL schemes are restricted to http/https/mailto/relative.
 *
 * Works in the browser (global `Markdown`) and under node (module.exports).
 */

/* Stash placeholders: plain ASCII tokens that cannot collide with
 * escaped user text (user input is HTML-escaped before any token exists). */
var PH_OPEN = '@@MSBD';
var PH_CLOSE = '@@';


function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* Allow http, https, mailto, and relative/fragment URLs only. */
function sanitizeUrl(url) {
  var u = String(url).trim();
  var m = u.match(/^([a-zA-Z][a-zA-Z0-9+.\-]*):/);
  if (m) {
    var scheme = m[1].toLowerCase();
    if (scheme !== 'http' && scheme !== 'https' && scheme !== 'mailto') return '#';
  }
  return u;
}

/* ------------------------------------------------------------------ */
/* Inline parsing (operates on already-escaped text)                   */
/* ------------------------------------------------------------------ */
function inline(src) {
  var store = [];
  function stash(html) {
    store.push(html);
    return PH_OPEN + (store.length - 1) + PH_CLOSE;
  }
  var restoreRe = new RegExp(PH_OPEN + '(\\d+)' + PH_CLOSE, 'g');
  function restore(s) {
    return s.replace(restoreRe, function (_, n) { return store[+n]; });
  }

  function run(s) {
    /* inline code spans (processed first so markdown inside is literal) */
    s = s.replace(/`([^`\n]+?)`/g, function (_, code) {
      return stash('<code>' + code + '</code>');
    });
    /* images */
    s = s.replace(/!\[([^\]\n]*)\]\(((?:[^()\s\n]|\([^()\s\n]*\))+)(?:\s+&quot;([^&]*?)&quot;)?\)/g, function (_, alt, src2, title) {
      return stash('<img src="' + sanitizeUrl(src2) + '" alt="' + alt + '"' +
        (title ? ' title="' + title + '"' : '') + '>');
    });
    /* links (recursively format the link text) */
    s = s.replace(/\[([^\]\n]+)\]\(((?:[^()\s\n]|\([^()\s\n]*\))+)(?:\s+&quot;([^&]*?)&quot;)?\)/g, function (_, text, href, title) {
      return stash('<a href="' + sanitizeUrl(href) + '"' +
        (title ? ' title="' + title + '"' : '') + '>' + run(text) + '</a>');
    });
    /* strikethrough */
    s = s.replace(/~~([^~\n]+?)~~/g, function (_, t) {
      return stash('<del>' + run(t) + '</del>');
    });
    /* bold+italic combined */
    s = s.replace(/\*\*\*([^*]+?)\*\*\*/g, function (_, t) {
      return stash('<strong><em>' + run(t) + '</em></strong>');
    });
    /* bold */
    s = s.replace(/(\*\*|__)(.+?)\1/g, function (_, d, t) {
      return stash('<strong>' + run(t) + '</strong>');
    });
    /* italic */
    s = s.replace(/(\*|_)([^*_\n]+?)\1/g, function (_, d, t) {
      return stash('<em>' + run(t) + '</em>');
    });
    return restore(s);
  }

  return run(escapeHtml(src));
}

/* ------------------------------------------------------------------ */
/* Block parsing                                                       */
/* ------------------------------------------------------------------ */
function isBlank(l) { return /^\s*$/.test(l); }

function splitRow(line) {
  var t = line.trim();
  if (t.charAt(0) === '|') t = t.slice(1);
  if (t.charAt(t.length - 1) === '|') t = t.slice(0, -1);
  return t.split('|').map(function (c) { return c.trim(); });
}

function isTableDelim(line) {
  var cells = splitRow(line);
  if (cells.length === 0) return false;
  return cells.every(function (c) { return /^:?-+:?$/.test(c); });
}

function cellAlign(cell) {
  var left = cell.charAt(0) === ':';
  var right = cell.charAt(cell.length - 1) === ':';
  if (left && right) return 'center';
  if (right) return 'right';
  return 'left';
}

function isBlockStart(line, nextLine) {
  if (/^ {0,3}```/.test(line)) return true;
  if (/^ {0,3}#{1,6}\s/.test(line)) return true;
  if (/^ {0,3}([-*_])(?:\s*\1){2,}\s*$/.test(line)) return true;
  if (/^ {0,3}>/.test(line)) return true;
  if (/^(\s*)([-*+]|\d+[.)])\s+/.test(line)) return true;
  if (line.indexOf('|') !== -1 && nextLine && isTableDelim(nextLine)) return true;
  return false;
}

function parseList(lines, start) {
  var items = [];
  var topOrdered = /^\s*\d/.test(lines[start]);
  var stack = [{ indent: -1, bucket: items }];
  var i = start;
  while (i < lines.length) {
    var m = lines[i].match(/^(\s*)([-*+]|\d+[.)])\s+(.*)$/);
    if (!m) break;
    var indent = m[1].replace(/\t/g, '    ').length;
    var ordered = /^\d/.test(m[2]);
    if (indent === 0 && i > start && ordered !== topOrdered) break;
    var text = m[3];
    var task = false, checked = false;
    var tm = text.match(/^\[([ xX])\]\s+(.*)$/);
    if (tm) { task = true; checked = tm[1].toLowerCase() === 'x'; text = tm[2]; }
    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) stack.pop();
    var item = { text: text, task: task, checked: checked, ordered: ordered, children: [] };
    stack[stack.length - 1].bucket.push(item);
    stack.push({ indent: indent, bucket: item.children });
    i++;
  }
  return { block: { type: 'list', ordered: topOrdered, items: items }, next: i };
}

function parse(src) {
  var lines = String(src).replace(/\r\n?/g, '\n').split('\n');
  var blocks = [];
  var i = 0, n = lines.length;

  while (i < n) {
    var line = lines[i];
    var m;

    if (isBlank(line)) { i++; continue; }

    /* fenced code block */
    m = line.match(/^ {0,3}```(\S*)\s*$/);
    if (m) {
      var lang = m[1] || '';
      var code = [];
      i++;
      while (i < n && !/^ {0,3}```\s*$/.test(lines[i])) { code.push(lines[i]); i++; }
      if (i < n) i++;
      blocks.push({ type: 'code', lang: lang, code: code.join('\n') });
      continue;
    }

    /* ATX heading */
    m = line.match(/^ {0,3}(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (m) { blocks.push({ type: 'heading', level: m[1].length, text: m[2] }); i++; continue; }

    /* horizontal rule */
    if (/^ {0,3}([-*_])(?:\s*\1){2,}\s*$/.test(line)) {
      blocks.push({ type: 'hr' }); i++; continue;
    }

    /* blockquote (recursive) */
    if (/^ {0,3}>/.test(line)) {
      var inner = [];
      while (i < n && /^ {0,3}>/.test(lines[i])) {
        inner.push(lines[i].replace(/^ {0,3}> ?/, ''));
        i++;
      }
      blocks.push({ type: 'quote', children: parse(inner.join('\n')) });
      continue;
    }

    /* GFM table */
    if (line.indexOf('|') !== -1 && i + 1 < n && isTableDelim(lines[i + 1])) {
      var head = splitRow(line);
      var aligns = splitRow(lines[i + 1]).map(cellAlign);
      var rows = [];
      i += 2;
      while (i < n && lines[i].indexOf('|') !== -1 && !isBlank(lines[i])) {
        rows.push(splitRow(lines[i])); i++;
      }
      blocks.push({ type: 'table', head: head, aligns: aligns, rows: rows });
      continue;
    }

    /* list */
    m = line.match(/^(\s*)([-*+]|\d+[.)])\s+(.*)$/);
    if (m) {
      var res = parseList(lines, i);
      blocks.push(res.block);
      i = res.next;
      continue;
    }

    /* paragraph: merge consecutive lines until blank or new block */
    var para = [];
    while (i < n && !isBlank(lines[i]) &&
           !isBlockStart(lines[i], i + 1 < n ? lines[i + 1] : '')) {
      para.push(lines[i].trim());
      i++;
    }
    if (para.length) blocks.push({ type: 'para', text: para.join(' ') });
    else i++;
  }
  return blocks;
}

/* ------------------------------------------------------------------ */
/* Rendering                                                           */
/* ------------------------------------------------------------------ */
function renderList(b) {
  var tag = b.ordered ? 'ol' : 'ul';
  var items = b.items.map(function (it) {
    var inner = '';
    if (it.task) {
      inner += '<input type="checkbox" disabled' + (it.checked ? ' checked' : '') + '> ';
    }
    inner += inline(it.text);
    if (it.children && it.children.length) {
      inner += renderList({ ordered: !!it.children[0].ordered, items: it.children });
    }
    return '<li>' + inner + '</li>';
  }).join('');
  return '<' + tag + '>' + items + '</' + tag + '>';
}

function renderBlock(b) {
  switch (b.type) {
    case 'heading':
      return '<h' + b.level + '>' + inline(b.text) + '</h' + b.level + '>';
    case 'para':
      return '<p>' + inline(b.text) + '</p>';
    case 'hr':
      return '<hr>';
    case 'code': {
      var langCls = b.lang ? ' class="language-' + escapeHtml(b.lang) + '"' : '';
      var label = b.lang ? '<span class="code-lang">' + escapeHtml(b.lang) + '</span>' : '';
      return '<div class="codeblock">' + label + '<pre><code' + langCls + '>' +
        escapeHtml(b.code) + '</code></pre></div>';
    }
    case 'quote':
      return '<blockquote>' + render(b.children) + '</blockquote>';
    case 'table': {
      var ths = b.head.map(function (h, k) {
        return '<th style="text-align:' + (b.aligns[k] || 'left') + '">' + inline(h) + '</th>';
      }).join('');
      var trs = b.rows.map(function (row) {
        var tds = row.map(function (c, k) {
          return '<td style="text-align:' + (b.aligns[k] || 'left') + '">' + inline(c) + '</td>';
        }).join('');
        return '<tr>' + tds + '</tr>';
      }).join('');
      return '<div class="tablewrap"><table><thead><tr>' + ths +
        '</tr></thead><tbody>' + trs + '</tbody></table></div>';
    }
    case 'list':
      return renderList(b);
    default:
      return '';
  }
}

function render(blocks) {
  return blocks.map(renderBlock).join('\n');
}

function parseMarkdown(src) {
  return render(parse(src));
}

/* node + browser compatibility */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    parse: parse,
    render: render,
    inline: inline,
    escapeHtml: escapeHtml,
    sanitizeUrl: sanitizeUrl,
    parseMarkdown: parseMarkdown
  };
} else if (typeof window !== 'undefined') {
  window.Markdown = {
    parse: parse,
    render: render,
    inline: inline,
    escapeHtml: escapeHtml,
    parseMarkdown: parseMarkdown
  };
}
