import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DAYS } from '../js/data/program.js';
import { getExercise } from '../js/data/exercises.js';
import { buildWorkout, nextDay, advanceQueue } from '../js/engine/plan.js';

const state = () => ({ queue: ['A', 'B', 'C'], nextIndex: 0, slotOverrides: {}, weights: {} });

test('each day has 6 slots in 3 supersets', () => {
  for (const d of Object.values(DAYS)) {
    assert.equal(d.slots.length, 6);
    for (const n of [1, 2, 3]) assert.equal(d.slots.filter(s => s.superset === n).length, 2);
  }
});

test('every defaultEx exists in catalog', () => {
  for (const d of Object.values(DAYS)) for (const s of d.slots) {
    assert.ok(getExercise(s.defaultEx), s.id);
  }
});

test('each day has exactly one abs slot', () => {
  for (const d of Object.values(DAYS)) {
    assert.equal(d.slots.filter(s => s.primary === 'abs').length, 1, d.key);
  }
});

test('nextDay cycles A,B,C,A', () => {
  let s = state();
  const seen = [];
  for (let i = 0; i < 4; i++) { seen.push(nextDay(s)); s = advanceQueue(s); }
  assert.deepEqual(seen, ['A', 'B', 'C', 'A']);
});

test('advanceQueue is immutable', () => {
  const s = state();
  advanceQueue(s);
  assert.equal(s.nextIndex, 0);
});

test('buildWorkout uses override', () => {
  const s = state();
  s.slotOverrides['A_3B'] = 'plank';
  const w = buildWorkout('A', s);
  assert.equal(w.items.find(i => i.slotId === 'A_3B').exId, 'plank');
});

test('buildWorkout uses saved weight else start', () => {
  const s = state();
  s.weights.leg_press = { weight: 120, failStreak: 0 };
  const w = buildWorkout('A', s);
  assert.equal(w.items.find(i => i.exId === 'leg_press').weight, 120);
  assert.equal(w.items.find(i => i.exId === 'chest_press').weight, 42.5);
});

test('sets length is 3 and start undone', () => {
  const w = buildWorkout('B', state());
  for (const it of w.items) {
    assert.equal(it.sets.length, 3);
    assert.deepEqual(it.sets[0], { w: it.weight, reps: null, done: false });
  }
});

test('rest per superset 90/90/60', () => {
  const w = buildWorkout('A', state());
  assert.deepEqual([1, 2, 3].map(n => w.items.find(i => i.superset === n).rest), [90, 90, 60]);
});
