import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStore, defaultState, backupDue, STORAGE_KEY } from '../js/store.js';

const fake = () => {
  const m = new Map();
  return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, v), m };
};
const DAY = 86400000;

test('defaultState when empty', () => {
  const s = createStore(fake());
  assert.deepEqual(s.get(), defaultState());
  assert.equal(s.get().version, 1);
});

test('update persists and get returns it', () => {
  const st = fake();
  const s = createStore(st);
  s.update(x => ({ ...x, hidden: ['plank'] }));
  assert.deepEqual(s.get().hidden, ['plank']);
  assert.deepEqual(JSON.parse(st.m.get(STORAGE_KEY)).hidden, ['plank']);
  assert.deepEqual(createStore(st).get().hidden, ['plank']);
});

test('export then import round trip', () => {
  const a = createStore(fake());
  a.update(x => ({ ...x, weights: { leg_press: { weight: 120, failStreak: 1 } }, nextIndex: 2 }));
  const json = a.exportJson();
  const b = createStore(fake());
  assert.deepEqual(b.importJson(json), { ok: true });
  assert.equal(b.get().weights.leg_press.weight, 120);
  assert.equal(b.get().nextIndex, 2);
});

test('import rejects invalid JSON without changing state', () => {
  const s = createStore(fake());
  s.update(x => ({ ...x, hidden: ['plank'] }));
  const r = s.importJson('{not json');
  assert.equal(r.ok, false);
  assert.ok(r.error.length > 0);
  assert.deepEqual(s.get().hidden, ['plank']);
});

test('import rejects wrong version', () => {
  const s = createStore(fake());
  const r = s.importJson(JSON.stringify({ ...defaultState(), version: 99 }));
  assert.equal(r.ok, false);
});

test('import rejects wrong field types and non-objects', () => {
  const s = createStore(fake());
  assert.equal(s.importJson(JSON.stringify({ ...defaultState(), hidden: 'x' })).ok, false);
  assert.equal(s.importJson(JSON.stringify({ ...defaultState(), weights: [] })).ok, false);
  assert.equal(s.importJson(JSON.stringify({ ...defaultState(), log: {} })).ok, false);
  assert.equal(s.importJson('null').ok, false);
  assert.equal(s.importJson('[]').ok, false);
});

test('storage null -> works in memory, persistent=false', () => {
  const s = createStore(null);
  s.update(x => ({ ...x, nextIndex: 1 }));
  assert.equal(s.get().nextIndex, 1);
  assert.equal(s.persistent, false);
});

test('storage.setItem throwing -> no crash, persistent=false', () => {
  const st = { getItem: () => null, setItem: () => { throw new Error('quota'); } };
  const s = createStore(st);
  s.update(x => ({ ...x, nextIndex: 1 }));
  assert.equal(s.get().nextIndex, 1);
  assert.equal(s.persistent, false);
});

test('corrupt stored JSON falls back to default and does not erase before write', () => {
  const st = fake();
  st.m.set(STORAGE_KEY, '{broken');
  const s = createStore(st);
  assert.deepEqual(s.get(), defaultState());
  assert.equal(st.m.get(STORAGE_KEY), '{broken');
});

test('backupDue cases', () => {
  const now = 100 * DAY;
  assert.equal(backupDue({ ...defaultState(), log: [] }, now), false);
  assert.equal(backupDue({ ...defaultState(), log: [{}] }, now), true);
  assert.equal(backupDue({ ...defaultState(), log: [{}], lastBackup: now - 15 * DAY }, now), true);
  assert.equal(backupDue({ ...defaultState(), log: [{}], lastBackup: now - 3 * DAY }, now), false);
});
