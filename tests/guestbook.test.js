import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { webcrypto } from 'node:crypto';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
import { createDatabase, restFetch, legacyId } from './database.js';

const html = await readFile(new URL('../contact.html', import.meta.url), 'utf8');
const bundled = await build({
  stdin: { contents: "import * as api from './public/guestbook.js'; window.guestbookApi = api; import './src/message-main.js';", resolveDir: process.cwd() },
  bundle: true, write: false, format: 'iife',
  define: { 'import.meta.env': JSON.stringify({ VITE_SUPABASE_URL: 'https://guestbook.test', VITE_SUPABASE_ANON_KEY: 'test-only' }) },
});
const script = bundled.outputFiles[0].text;
const deferred = () => { let resolve; const promise = new Promise((r) => { resolve = r; }); return { promise, resolve }; };

function openPage(fetch, storage = {}, { early = false } = {}) {
  const dom = new JSDOM(html, { url: 'https://site.test/contact.html', runScripts: 'outside-only' });
  const { window } = dom;
  Object.defineProperty(window, 'crypto', { value: webcrypto });
  Object.defineProperty(window.document, 'readyState', { configurable: true, value: early ? 'loading' : 'complete' });
  window.fetch = fetch;
  for (const [key, value] of Object.entries(storage)) window.localStorage.setItem(key, value);
  window.eval(script);
  if (early) window.document.dispatchEvent(new window.Event('DOMContentLoaded'));
  return dom;
}

function until(window, condition) {
  if (condition()) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const observer = new window.MutationObserver(() => {
      if (condition()) { clearTimeout(timeout); observer.disconnect(); resolve(); }
    });
    observer.observe(window.document, { attributes: true, childList: true, subtree: true, characterData: true });
    const timeout = setTimeout(() => { observer.disconnect(); reject(new Error('DOM condition not reached')); }, 5000);
  });
}
const ready = (w) => until(w, () => !w.document.querySelector('[type=submit]').disabled);
const notes = (w) => w.document.querySelectorAll('.sticky-note');
const storageOf = (w) => Object.fromEntries(Object.keys(w.localStorage).map((key) => [key, w.localStorage.getItem(key)]));
function post(w, content = '我的新便签') {
  w.document.getElementById('noteName').value = '我';
  w.document.getElementById('noteContent').value = content;
  w.document.querySelector('[type=submit]').click();
}

test('original code reproducibly overwrites a newly created note when initial GET finishes late', async () => {
  const source = await readFile(new URL('./fixtures/legacy-message-main.js', import.meta.url), 'utf8');
  const originalHtml = html.replace('type="submit" disabled', 'type="submit"');
  const dom = new JSDOM(originalHtml, { url: 'https://site.test', runScripts: 'outside-only' });
  const pending = deferred();
  const note = { id: 'new', name: 'me', content: 'new', color: 'pink', createdAt: Date.now(), left: 20, top: 20 };
  dom.window.testApi = { isGuestbookConfigured: () => true, listNotes: () => pending.promise, createNote: async () => note, updatePosition: async () => {}, pickColor: () => 'pink', randomPosition: () => ({left:20,top:20}) };
  dom.window.eval(source.replace(/import\s*\{([\s\S]*?)\}\s*from[^;]+;/, 'const {$1} = window.testApi;'));
  post(dom.window);
  await until(dom.window, () => notes(dom.window).length === 1);
  pending.resolve([{ ...note, id: 'old', content: 'old' }]);
  await until(dom.window, () => !!dom.window.document.querySelector('[data-id="old"]'));
  assert.equal(dom.window.document.querySelector('[data-id="new"]'), null);
  dom.window.close();
});

test('first entry waits for GET, renders existing notes, and does not allow create to race loading', async () => {
  const db = await createDatabase(); const gate = deferred(); const fetch = restFetch(db);
  let calls = 0;
  const dom = openPage(async (url, options) => { calls++; assert.equal(options.cache, 'no-store'); await gate.promise; return fetch(url, options); }, {}, { early: true });
  const w = dom.window;
  try {
    assert.match(w.document.getElementById('emptyMessage').textContent, /正在加载/);
    post(w); assert.equal(calls, 1); assert.equal(notes(w).length, 0);
    gate.resolve(); await ready(w);
    assert.equal(notes(w).length, 1);
    assert.match(notes(w)[0].textContent, /历史便签/);
    assert.equal(w.document.querySelector('.sticky-delete'), null);
    assert.equal(w.document.getElementById('emptyMessage').style.display, 'none');
    post(w); await until(w, () => notes(w).length === 2); assert.equal(calls, 2);
  } finally { w.close(); await db.close(); }
});

test('transient first GET retries; persistent failure offers explicit retry without reload', async () => {
  const db = await createDatabase(); const fetch = restFetch(db); let calls = 0;
  const dom = openPage((...args) => ++calls === 1 ? Promise.resolve(new Response('', {status:503})) : fetch(...args));
  try { await ready(dom.window); assert.equal(calls, 2); assert.equal(notes(dom.window).length, 1); }
  finally { dom.window.close(); }
  let fail = true;
  const failed = openPage((...args) => fail ? Promise.resolve(new Response('', {status:503})) : fetch(...args));
  try {
    await until(failed.window, () => !failed.window.document.getElementById('retryNotes').hidden);
    assert.equal(failed.window.document.querySelector('[type=submit]').disabled, true);
    fail = false; failed.window.document.getElementById('retryNotes').click();
    await ready(failed.window); assert.equal(notes(failed.window).length, 1);
  } finally { failed.window.close(); await db.close(); }
});

test('create, refresh, separate browser, forged storage, per-note deletion, and drag remain correct', async () => {
  const db = await createDatabase(); const fetch = restFetch(db); const windows = [];
  const open = (storage) => { const dom = openPage(fetch, storage); windows.push(dom.window); return dom.window; };
  try {
    const owner = open(); await ready(owner); post(owner); await until(owner, () => notes(owner).length === 2);
    post(owner, '第二张'); await until(owner, () => notes(owner).length === 3);
    const credentials = storageOf(owner); const tokens = Object.values(credentials);
    assert.equal(tokens.length, 2); assert.notEqual(tokens[0], tokens[1]); assert.ok(tokens.every((t) => /^[a-f0-9]{64}$/.test(t)));
    const refreshed = open(credentials); await ready(refreshed);
    assert.equal(notes(refreshed).length, 3); assert.equal(refreshed.document.querySelectorAll('.sticky-delete').length, 2);
    const stranger = open(); await ready(stranger);
    assert.equal(notes(stranger).length, 3); assert.equal(stranger.document.querySelectorAll('.sticky-delete').length, 0);

    const [key, token] = Object.entries(credentials)[0]; const id = key.slice(-36);
    const forged = open({ [key]: 'f'.repeat(64) }); await ready(forged);
    forged.document.querySelector('.sticky-delete').click();
    await until(forged, () => forged.document.querySelector('.sticky-compose-note').textContent.includes('删除失败'));
    assert.equal(notes(forged).length, 3);
    assert.equal((await db.query('select * from sticky_notes where id=$1', [id])).rows.length, 1);

    const button = refreshed.document.querySelector(`[data-id="${id}"] .sticky-delete`);
    button.dispatchEvent(new refreshed.MouseEvent('pointerdown', {bubbles:true,button:0}));
    assert.equal(refreshed.document.querySelector('.dragging'), null);
    button.click(); await until(refreshed, () => notes(refreshed).length === 2);
    assert.equal(refreshed.localStorage.getItem(key), null);
    assert.equal(refreshed.document.querySelector(`[data-id="${legacyId}"] .sticky-delete`), null);

    const positionSaved = deferred(); refreshed.fetch = async (...args) => { const result = await fetch(...args); if (args[0].includes('update_sticky_note_position')) positionSaved.resolve(); return result; };
    const legacy = refreshed.document.querySelector(`[data-id="${legacyId}"]`);
    legacy.dispatchEvent(new refreshed.MouseEvent('pointerdown', {bubbles:true,button:0,clientX:20,clientY:20}));
    assert.ok(legacy.classList.contains('dragging'));
    refreshed.document.dispatchEvent(new refreshed.MouseEvent('pointermove', {bubbles:true,clientX:0,clientY:0}));
    refreshed.document.dispatchEvent(new refreshed.MouseEvent('pointerup', {bubbles:true}));
    await positionSaved.promise;
    assert.equal((await db.query('select pos_left,pos_top from sticky_notes where id=$1', [legacyId])).rows[0].pos_left, 0);
    assert.ok(!legacy.classList.contains('dragging'));
    assert.equal(refreshed.document.getElementById('emptyMessage').style.display, 'none');
  } finally { windows.forEach((w) => w.close()); await db.close(); }
});

test('last deletion restores empty state; unavailable storage prevents orphaned creation', async () => {
  const db = await createDatabase({ fresh: true }); const fetch = restFetch(db);
  const dom = openPage(fetch); const w = dom.window;
  try {
    await ready(w); assert.equal(w.document.getElementById('emptyMessage').style.display, 'flex');
    post(w); await until(w, () => notes(w).length === 1);
    w.document.querySelector('.sticky-delete').click(); await until(w, () => notes(w).length === 0);
    assert.equal(w.document.getElementById('emptyMessage').style.display, 'flex');
    Object.defineProperty(w, 'localStorage', { get() { throw new Error('blocked'); } });
    post(w); await until(w, () => w.document.querySelector('.sticky-compose-note').textContent.includes('浏览器无法保存'));
    assert.equal((await db.query('select * from sticky_notes')).rows.length, 0);
  } finally { w.close(); await db.close(); }
});

test('CookieBanner is removed from the application', async () => {
  const interests = await readFile(new URL('../src/InterestsApp.jsx', import.meta.url), 'utf8');
  assert.doesNotMatch(interests, /CookieBanner|cookieAccepted/);
  await assert.rejects(readFile(new URL('../src/components/CookieBanner.jsx', import.meta.url)), { code: 'ENOENT' });
});
