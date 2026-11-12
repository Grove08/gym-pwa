import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function walk(dir, out = []) {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) walk(p, out); else out.push(p);
  }
  return out;
}

const sw = readFileSync(join(root, 'sw.js'), 'utf8');
const list = [...sw.matchAll(/'(\.\/[^']*)'/g)].map(m => m[1]);

test('every file in PRECACHE exists', () => {
  for (const f of list) {
    if (f === './') continue;
    assert.ok(existsSync(join(root, f)), f);
  }
});

test('every app file is in PRECACHE', () => {
  const app = [
    ...walk(join(root, 'js')),
    ...walk(join(root, 'icons')),
    join(root, 'index.html'), join(root, 'style.css'), join(root, 'manifest.webmanifest'),
  ].map(p => './' + p.slice(root.length + 1).replaceAll('\\', '/'));
  for (const f of app) assert.ok(list.includes(f), `${f} missing from PRECACHE`);
});

test('manifest is valid for standalone install', () => {
  const m = JSON.parse(readFileSync(join(root, 'manifest.webmanifest'), 'utf8'));
  assert.equal(m.display, 'standalone');
  assert.equal(m.start_url, './');
  assert.equal(m.scope, './');
  assert.ok(m.icons.length >= 2);
  for (const i of m.icons) assert.ok(existsSync(join(root, i.src)), i.src);
});

test('index.html wires manifest, touch icon and iOS meta', () => {
  const h = readFileSync(join(root, 'index.html'), 'utf8');
  assert.ok(h.includes('rel="manifest"'));
  assert.ok(h.includes('apple-touch-icon'));
  assert.ok(h.includes('apple-mobile-web-app-capable'));
});

test('sw cache name has a version and old caches are cleaned', () => {
  assert.match(sw, /const VERSION = 'v\d+'/);
  assert.ok(sw.includes('caches.delete'));
});
