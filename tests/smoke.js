'use strict';
/* markdown-studio-bd -- headless-Chrome smoke tests (puppeteer-core + CDP). */
const puppeteer = require('/tmp/qatest/node_modules/puppeteer-core');
const fs = require('fs');
const path = require('path');

const APP = 'file:///home/hatch/workspace/muse-project-factory/builds/markdown-studio-bd/index.html';
const DL_DIR = '/tmp/msbd-dl';

let passed = 0, failed = 0;
function check(name, cond) {
  if (cond) { passed++; }
  else { failed++; console.error('FAIL: ' + name); }
}
function step(n, label) { console.log('STEP ' + n + ': ' + label); }

(async () => {
  fs.rmSync(DL_DIR, { recursive: true, force: true });
  fs.mkdirSync(DL_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: '/opt/meta-chromium/chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  const page = await browser.newPage();
  const cdp = await page.createCDPSession();
  await cdp.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: DL_DIR });

  const consoleErrors = [];
  const pageErrors = [];
  const httpRequests = [];
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', e => pageErrors.push(String(e)));
  page.on('request', r => { if (/^https?:/.test(r.url())) httpRequests.push(r.url()); });
  page.on('dialog', d => d.accept());

  const setText = (sel, text) => page.evaluate((s, t) => {
    const el = document.querySelector(s);
    el.value = t;
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, sel, text);
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  // 1. load
  step(1, 'load');
  await page.goto(APP, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(400);
  check('load: zero console errors', consoleErrors.length === 0);
  check('load: zero page errors', pageErrors.length === 0);
  if (consoleErrors.length) console.error('  console:', consoleErrors.slice(0, 3));
  if (pageErrors.length) console.error('  page:', pageErrors.slice(0, 3));

  // 2. typing renders H1
  step(2, 'typing renders H1');
  await page.click('#editor');
  await page.type('#editor', '# Hello');
  await sleep(500);
  check('typing renders h1', await page.evaluate(() => {
    const h = document.querySelector('#preview h1');
    return h && h.textContent === 'Hello';
  }));

  // 3. toolbar bold wraps selection
  step(3, 'toolbar bold wraps selection');
  await setText('#editor', 'hello');
  await page.evaluate(() => {
    const e = document.querySelector('#editor');
    e.selectionStart = 0; e.selectionEnd = 5; e.focus();
  });
  await page.click('[data-tool="bold"]');
  await sleep(400);
  check('bold wraps selection', await page.evaluate(() =>
    document.querySelector('#editor').value === '**hello**'));
  check('bold renders strong', await page.evaluate(() => {
    const s = document.querySelector('#preview strong');
    return s && s.textContent === 'hello';
  }));

  // 4. XSS payload inert
  step(4, 'XSS payload inert');
  await setText('#editor', '<script>alert(1)</scr' + 'ipt>\n\n<img src=x onerror=alert(1)>\n\n[x](javascript:alert(1))');
  await sleep(400);
  check('xss: no script element', await page.evaluate(() =>
    document.querySelector('#preview script') === null));
  check('xss: script shown escaped', await page.evaluate(() =>
    document.querySelector('#preview').innerHTML.includes('&lt;script&gt;')));
  check('xss: img tag escaped', await page.evaluate(() =>
    document.querySelector('#preview').innerHTML.includes('&lt;img')));
  check('xss: javascript: url neutralized', await page.evaluate(() =>
    document.querySelector('#preview a').getAttribute('href') === '#'));

  // 5. BN toggle + persistence
  step(5, 'BN toggle + persistence');
  await page.click('#lang-bn');
  await sleep(300);
  check('bn: html lang', await page.evaluate(() => document.documentElement.lang === 'bn'));
  check('bn: button label', await page.evaluate(() =>
    document.querySelector('#btn-new').textContent === '\u09A8\u09A4\u09C1\u09A8'));
  await page.reload({ waitUntil: 'domcontentloaded' });
  await sleep(400);
  check('bn: persists across reload', await page.evaluate(() =>
    document.documentElement.lang === 'bn' &&
    localStorage.getItem('msbd.lang') === 'bn'));
  check('bn: digits render', await page.evaluate(async () => {
    const e = document.querySelector('#editor');
    e.value = 'one two three';
    e.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise(r => setTimeout(r, 400));
    return document.querySelector('#stat-words').textContent === '\u09E9';
  }));
  await page.click('#lang-en');
  await sleep(200);

  // 6. stats update live
  step(6, 'stats update live');
  await setText('#editor', 'hello world\nsecond line');
  await sleep(400);
  const stats = await page.evaluate(() => ({
    w: document.querySelector('#stat-words').textContent,
    c: document.querySelector('#stat-chars').textContent,
    l: document.querySelector('#stat-lines').textContent,
    r: document.querySelector('#stat-read').textContent
  }));
  check('stats words=4', stats.w === '4');
  check('stats lines=2', stats.l === '2');
  check('stats chars=23', stats.c === '23');
  check('stats read=1 min', stats.r === '1 min');

  // 7. dark theme + persistence
  step(7, 'dark theme + persistence');
  await page.click('#theme-dark');
  await sleep(200);
  check('dark theme applied', await page.evaluate(() =>
    document.documentElement.getAttribute('data-theme') === 'dark'));
  await page.reload({ waitUntil: 'domcontentloaded' });
  await sleep(300);
  check('dark theme persists', await page.evaluate(() =>
    document.documentElement.getAttribute('data-theme') === 'dark'));
  await page.click('#theme-light');

  // 8. sample loads
  step(8, 'sample loads');
  await page.click('#btn-sample');
  await sleep(400);
  check('sample renders h1', await page.evaluate(() => {
    const h = document.querySelector('#preview h1');
    return h && h.textContent === 'Markdown Studio BD';
  }));
  check('sample has table', await page.evaluate(() =>
    document.querySelector('#preview table') !== null));

  // 9. .md download produces a file
  step(9, '.md download produces a file');
  await setText('#editor', '# DL Test\n\nbody text');
  await sleep(300);
  await page.click('#btn-dl-md');
  await sleep(1200);
  const dlFile = path.join(DL_DIR, 'document.md');
  check('md download file exists', fs.existsSync(dlFile));
  check('md download content', fs.existsSync(dlFile) &&
    fs.readFileSync(dlFile, 'utf8') === '# DL Test\n\nbody text');

  // 10. .html download is standalone styled
  step(10, '.html download is standalone styled');
  await page.click('#btn-dl-html');
  await sleep(1200);
  const htmlFile = path.join(DL_DIR, 'document.html');
  const htmlBody = fs.existsSync(htmlFile) ? fs.readFileSync(htmlFile, 'utf8') : '';
  check('html download exists', fs.existsSync(htmlFile));
  check('html download has doctype+style', htmlBody.includes('<!DOCTYPE html>') && htmlBody.includes('<style>'));
  check('html download embeds render', htmlBody.includes('<h1>DL Test</h1>'));

  // 11. open .md via file input
  step(11, 'open .md via file input');
  const sampleMd = path.join(DL_DIR, 'open-me.md');
  fs.writeFileSync(sampleMd, '## Opened\n\nFile content here.');
  const input = await page.$('#file-input');
  await input.uploadFile(sampleMd);
  await sleep(600);
  check('open file loads content', await page.evaluate(() =>
    document.querySelector('#editor').value.includes('File content here.')));
  check('open file renders', await page.evaluate(() => {
    const h = document.querySelector('#preview h2');
    return h && h.textContent === 'Opened';
  }));

  // 12. clear modal typed confirmation
  step(12, 'clear modal typed confirmation');
  await page.click('#btn-clear');
  await sleep(300);
  check('clear modal opens', await page.evaluate(() =>
    document.querySelector('#modal-overlay').classList.contains('open')));
  await page.type('#modal-input', 'nope');
  await sleep(200);
  check('clear confirm disabled on wrong text', await page.evaluate(() =>
    document.querySelector('#modal-confirm').disabled === true));
  await page.evaluate(() => { document.querySelector('#modal-input').value = ''; });
  await page.type('#modal-input', 'DELETE');
  await sleep(200);
  check('clear confirm enabled on DELETE', await page.evaluate(() =>
    document.querySelector('#modal-confirm').disabled === false));
  await page.click('#modal-confirm');
  await sleep(400);
  check('clear empties editor', await page.evaluate(() =>
    document.querySelector('#editor').value === ''));
  check('clear shows empty state', await page.evaluate(() =>
    document.querySelector('#empty-state').style.display !== 'none' &&
    document.querySelector('#preview').textContent.includes('Start writing')));

  // 13. keyboard shortcut Ctrl+B
  step(13, 'keyboard shortcut Ctrl+B');
  await setText('#editor', 'shortcut');
  await page.evaluate(() => {
    const e = document.querySelector('#editor');
    e.selectionStart = 0; e.selectionEnd = 8; e.focus();
  });
  await page.keyboard.down('Control');
  await page.keyboard.press('b');
  await page.keyboard.up('Control');
  await sleep(400);
  check('ctrl+b wraps bold', await page.evaluate(() =>
    document.querySelector('#editor').value === '**shortcut**'));

  // 14. draft autosave restore
  step(14, 'draft autosave restore');
  await setText('#editor', 'draft persistence check');
  await sleep(600);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await sleep(400);
  check('draft restored after reload', await page.evaluate(() =>
    document.querySelector('#editor').value === 'draft persistence check'));

  // 15. empty editor placeholder state already verified in 12; new button
  step(15, 'empty editor placeholder state already verified in 12; new button');
  await page.click('#btn-new');
  await sleep(400);
  check('new clears editor', await page.evaluate(() =>
    document.querySelector('#editor').value === ''));

  // 16. mobile 390px: no horizontal overflow
  step(16, 'mobile 390px: no horizontal overflow');
  await setText('#editor', '# T\n\n| a | b | c | d | e |\n|---|---|---|---|---|\n| 1 | 2 | 3 | 4 | 5 |\n\n```js\nvar longLineOfCode = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";\n```');
  await sleep(400);
  await page.setViewport({ width: 390, height: 844 });
  await sleep(400);
  check('390px no horizontal overflow', await page.evaluate(() =>
    document.documentElement.scrollWidth <= 390));
  await page.setViewport({ width: 1280, height: 800 });

  // 17. zero network requests
  step(17, 'zero network requests');
  check('zero http(s) requests', httpRequests.length === 0);
  if (httpRequests.length) console.error('  requests:', httpRequests.slice(0, 5));

  // final error sweep
  check('final: zero console errors', consoleErrors.length === 0);
  check('final: zero page errors', pageErrors.length === 0);

  await browser.close();
  console.log('\nsmoke tests: ' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error('SMOKE CRASH:', e); process.exit(2); });
