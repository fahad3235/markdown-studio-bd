'use strict';
/* markdown-studio-bd -- node unit tests for js/markdown.js (and js/i18n.js). */
var assert = require('assert');
var M = require('../js/markdown.js');
var I18N = require('../js/i18n.js');

var passed = 0;
function check(name, actual, expected) {
  try {
    assert.strictEqual(actual, expected);
    passed++;
  } catch (e) {
    console.error('FAIL: ' + name);
    console.error('  expected: ' + JSON.stringify(expected));
    console.error('  actual:   ' + JSON.stringify(actual));
    process.exitCode = 1;
  }
}
function contains(name, actual, needle) {
  try {
    assert.ok(actual.indexOf(needle) !== -1, 'missing ' + needle);
    passed++;
  } catch (e) {
    console.error('FAIL: ' + name + ' -- missing: ' + JSON.stringify(needle));
    console.error('  actual: ' + JSON.stringify(actual));
    process.exitCode = 1;
  }
}
function notContains(name, actual, needle) {
  try {
    assert.ok(actual.indexOf(needle) === -1, 'unexpected ' + needle);
    passed++;
  } catch (e) {
    console.error('FAIL: ' + name + ' -- unexpected: ' + JSON.stringify(needle));
    console.error('  actual: ' + JSON.stringify(actual));
    process.exitCode = 1;
  }
}

/* --- headings --- */
check('h1', M.parseMarkdown('# Hello'), '<h1>Hello</h1>');
check('h2', M.parseMarkdown('## Hi'), '<h2>Hi</h2>');
check('h6', M.parseMarkdown('###### Deep'), '<h6>Deep</h6>');
check('h trailing hashes', M.parseMarkdown('## Hi ##'), '<h2>Hi</h2>');
check('7 hashes not heading', M.parseMarkdown('####### x'), '<p>####### x</p>');
check('heading needs space', M.parseMarkdown('#nope'), '<p>#nope</p>');

/* --- emphasis nesting --- */
check('bold', M.inline('**b**'), '<strong>b</strong>');
check('italic star', M.inline('*i*'), '<em>i</em>');
check('italic under', M.inline('_i_'), '<em>i</em>');
check('bold under', M.inline('__b__'), '<strong>b</strong>');
check('strike', M.inline('~~s~~'), '<del>s</del>');
check('bold-italic', M.inline('***bi***'), '<strong><em>bi</em></strong>');
check('nested bold>italic', M.inline('**a *b* c**'), '<strong>a <em>b</em> c</strong>');
check('nested italic>bold', M.inline('*a **b** c*'), '<em>a <strong>b</strong> c</em>');
check('nested strike>bold', M.inline('~~a **b**~~'), '<del>a <strong>b</strong></del>');

/* --- inline code --- */
check('inline code', M.inline('`x`'), '<code>x</code>');
check('code keeps markdown literal', M.inline('`**not bold**`'), '<code>**not bold**</code>');
check('code escapes html', M.inline('`<b>`'), '<code>&lt;b&gt;</code>');

/* --- fenced code --- */
contains('fence lang label', M.parseMarkdown('```js\nvar x = 1;\n```'), '<span class="code-lang">js</span>');
contains('fence escapes', M.parseMarkdown('```\n<a>&\n```'), '&lt;a&gt;&amp;');
contains('fence no lang', M.parseMarkdown('```\nplain\n```'), '<pre><code>');
check('unclosed fence consumes rest', M.parseMarkdown('```js\nvar x = 1;'),
  '<div class="codeblock"><span class="code-lang">js</span><pre><code class="language-js">var x = 1;</code></pre></div>');

/* --- links / images --- */
check('link', M.inline('[t](https://x.com)'), '<a href="https://x.com">t</a>');
check('link title', M.inline('[a](https://x.com "t")'), '<a href="https://x.com" title="t">a</a>');
check('link relative', M.inline('[a](/path)'), '<a href="/path">a</a>');
check('link bold text', M.inline('[**b**](https://x.com)'), '<a href="https://x.com"><strong>b</strong></a>');
check('image', M.inline('![p](https://x.com/a.png)'), '<img src="https://x.com/a.png" alt="p">');
check('image title', M.inline('![p](https://x.com/a.png "c")'), '<img src="https://x.com/a.png" alt="p" title="c">');
check('link balanced parens', M.inline('[w](https://en.wikipedia.org/wiki/A_(b))'),
  '<a href="https://en.wikipedia.org/wiki/A_(b)">w</a>');

/* --- XSS vectors --- */
check('script tag inert', M.parseMarkdown('<script>alert(1)</script>'),
  '<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>');
notContains('no script element', M.parseMarkdown('<script>alert(1)</script>'), '<script>');
check('img onerror inert', M.parseMarkdown('<img src=x onerror=alert(1)>'),
  '<p>&lt;img src=x onerror=alert(1)&gt;</p>');
check('javascript: url neutralized', M.inline('[x](javascript:alert(1))'), '<a href="#">x</a>');
check('data: url neutralized', M.inline('[x](data:text/html,<b>)'), '<a href="#">x</a>');
check('JS scheme case-insensitive', M.inline('[x](JaVaScRiPt:alert(1))'), '<a href="#">x</a>');
contains('svg onload escaped inert', M.parseMarkdown('[a](https://x.com)\n\n<svg onload=alert(1)>'), '&lt;svg onload=alert(1)&gt;');
check('event handler in text escaped', M.inline('" onmouseover="alert(1)'),
  '&quot; onmouseover=&quot;alert(1)');
check('link href quote breakout', M.inline('[a](https://x.com "t")'), '<a href="https://x.com" title="t">a</a>');

/* --- lists --- */
check('ul basic', M.parseMarkdown('- a\n- b'), '<ul><li>a</li><li>b</li></ul>');
check('ol basic', M.parseMarkdown('1. a\n2. b'), '<ol><li>a</li><li>b</li></ol>');
check('ol paren marker', M.parseMarkdown('1) a\n2) b'), '<ol><li>a</li><li>b</li></ol>');
contains('nested ul', M.parseMarkdown('- a\n  - b'), '<li>a<ul><li>b</li></ul></li>');
contains('ordered after unordered splits', M.parseMarkdown('- a\n1. b'), '</ul>\n<ol>');
contains('deep nesting', M.parseMarkdown('- a\n  - b\n    - c'), '<li>b<ul><li>c</li></ul></li>');
contains('task unchecked', M.parseMarkdown('- [ ] t'), '<input type="checkbox" disabled>');
contains('task checked', M.parseMarkdown('- [x] t'), '<input type="checkbox" disabled checked>');
contains('list inline md', M.parseMarkdown('- **b** item'), '<li><strong>b</strong> item</li>');

/* --- blockquote --- */
check('quote', M.parseMarkdown('> hello'), '<blockquote><p>hello</p></blockquote>');
contains('quote bold', M.parseMarkdown('> **b**'), '<strong>b</strong>');
contains('quote multiline', M.parseMarkdown('> a\n> b'), 'a b');

/* --- hr --- */
check('hr dashes', M.parseMarkdown('---'), '<hr>');
check('hr stars', M.parseMarkdown('***'), '<hr>');
check('hr spaced', M.parseMarkdown('- - -'), '<hr>');

/* --- tables --- */
var tbl = M.parseMarkdown('| a | b |\n|---|:-:|\n| 1 | 2 |');
contains('table head', tbl, '<th style="text-align:left">a</th>');
contains('table align center', tbl, '<th style="text-align:center">b</th>');
contains('table cell', tbl, '<td style="text-align:left">1</td>');
contains('table wrap', tbl, '<div class="tablewrap">');
check('not a table without delim', M.parseMarkdown('| a | b |\n| 1 | 2 |'),
  '<p>| a | b | | 1 | 2 |</p>');

/* --- paragraphs --- */
check('para merge', M.parseMarkdown('line one\nline two'), '<p>line one line two</p>');
check('para split', M.parseMarkdown('one\n\ntwo'), '<p>one</p>\n<p>two</p>');

/* --- edge cases --- */
check('empty input', M.parseMarkdown(''), '');
check('whitespace only', M.parseMarkdown('   \n  '), '');
check('unclosed emphasis literal', M.parseMarkdown('**oops'), '<p>**oops</p>');
check('unclosed italic literal', M.parseMarkdown('*oops'), '<p>*oops</p>');
check('lone backtick literal', M.inline('`oops'), '`oops');
check('crlf handled', M.parseMarkdown('# T\r\n\r\np'), '<h1>T</h1>\n<p>p</p>');
check('heading with inline code', M.parseMarkdown('# `c`'), '<h1><code>c</code></h1>');
check('ampersand escaped', M.inline('a & b'), 'a &amp; b');

/* --- i18n --- */
check('i18n en', I18N.get('en', 'new'), 'New');
check('i18n bn new', I18N.get('bn', 'new'), '\u09A8\u09A4\u09C1\u09A8');
check('i18n fallback', I18N.get('bn', 'nope-key'), 'nope-key');
check('i18n digits en', I18N.digits('en', 123), '123');
check('i18n digits bn', I18N.digits('bn', 123), '\u09E7\u09E8\u09E9');
check('i18n bn keys match en', I18N.keys().every(function (k) { return I18N.get('bn', k) !== k; }), true);

console.log('\nnode unit tests: ' + passed + ' passed' + (process.exitCode ? ' (WITH FAILURES)' : ''));
