import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rankSwaps, absStationMismatch } from '../js/engine/swap.js';
import { DAYS } from '../js/data/program.js';

const mk = (id, primary, station, kind, verified = true) =>
  ({ id, primary, secondary: [], station, kind, verified });

const cat = [
  mk('cur', 'chest', 'machine', 'push'),
  mk('c_bench', 'chest', 'bench', 'push'),
  mk('c_machine', 'chest', 'machine', 'push'),
  mk('c_cable_unv', 'chest', 'cable', 'push', false),
  mk('c_cable_ver', 'chest', 'cable', 'push', true),
  mk('b_row', 'back', 'machine', 'pull'),
];
const slot = { id: 'X', primary: 'chest', kind: 'push' };
const state = (hidden = []) => ({ hidden });

test('same primary first', () => {
  const r = rankSwaps(slot, 'cur', 'b_row', state(), cat);
  assert.ok(r.every(e => e.primary === 'chest'));
});

test('neighbor station preferred among same primary', () => {
  const r = rankSwaps(slot, 'cur', 'b_row', state(), cat);
  assert.equal(r[0].id, 'c_machine'); // сосед b_row на machine
});

test('hidden excluded', () => {
  const r = rankSwaps(slot, 'cur', 'b_row', state(['c_machine']), cat);
  assert.ok(!r.some(e => e.id === 'c_machine'));
});

test('current and usedInDay excluded', () => {
  const r = rankSwaps(slot, 'cur', null, state(), cat, ['c_bench']);
  assert.ok(!r.some(e => e.id === 'cur' || e.id === 'c_bench'));
});

test('verified before unverified when otherwise equal', () => {
  const r = rankSwaps(slot, 'cur', null, state(), cat);
  const ids = r.map(e => e.id);
  assert.ok(ids.indexOf('c_cable_ver') < ids.indexOf('c_cable_unv'));
});

test('returns at most 6', () => {
  const many = [mk('cur', 'chest', 'machine', 'push')];
  for (let i = 0; i < 12; i++) many.push(mk('e' + i, 'chest', 'bench', 'push'));
  assert.equal(rankSwaps(slot, 'cur', null, state(), many).length, 6);
});

test('returns empty array when everything hidden (no throw)', () => {
  const r = rankSwaps(slot, 'cur', null, state(cat.map(e => e.id)), cat);
  assert.deepEqual(r, []);
});

test('absStationMismatch true when better station exists, false otherwise', () => {
  const abs = [
    mk('a_captain', 'abs', 'captain', 'core'),
    mk('a_bench', 'abs', 'bench', 'core'),
    mk('n_bench', 'back', 'bench', 'pull'),
    mk('n_machine', 'back', 'machine', 'pull'),
  ];
  assert.equal(absStationMismatch('a_captain', 'n_bench', state(), abs), true);
  assert.equal(absStationMismatch('a_bench', 'n_bench', state(), abs), false);
  assert.equal(absStationMismatch('a_captain', 'n_machine', state(), abs), false); // нет abs на machine
  assert.equal(absStationMismatch('a_captain', 'n_bench', state(['a_bench']), abs), false); // скрыто
});

test('real catalog: Friday abs slot offers alternatives', async () => {
  const s = DAYS.C.slots.find(x => x.id === 'C_3B');
  const r = rankSwaps(s, s.defaultEx, 'preacher_curl', state());
  assert.ok(r.length > 0 && r.every(e => e.primary === 'abs'));
});
