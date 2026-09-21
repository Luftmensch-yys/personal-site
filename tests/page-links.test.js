import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const pages = (await readdir(root)).filter((file) => file.endsWith('.html'));
const pageSet = new Set(pages);
const renamedPages = [
  '个人页.html',
  '兴趣页.html',
  '手工页.html',
  '建模页.html',
  '音乐页.html',
  '留言页.html',
  '绘画摄影.html',
  '游戏页.html',
  '女神异闻录5皇家版.html',
];

function localHtmlLinks(source) {
  return [...source.matchAll(/\bhref=["']([^"']+\.html(?:#[^"']*)?)["']/g)]
    .map((match) => match[1].split('#')[0])
    .filter((href) => !href.startsWith('http'));
}

test('source HTML pages use valid local HTML links', async () => {
  for (const page of pages) {
    const source = await readFile(new URL(page, root), 'utf8');
    for (const href of localHtmlLinks(source)) {
      assert.ok(pageSet.has(href), `${page} links to missing page ${href}`);
    }
  }
});

test('old Chinese HTML filenames are no longer referenced in source files', async () => {
  const sourceFiles = [
    ...pages,
    'vite.config.js',
    'src/lib/routes.js',
    'src/lib/navigation.js',
    'public/site.js',
    'public/nav.js',
  ];

  for (const file of sourceFiles) {
    const source = await readFile(new URL(file, root), 'utf8');
    for (const name of renamedPages) {
      assert.ok(!source.includes(name), `${file} still references ${name}`);
    }
  }
});
