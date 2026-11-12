import { test } from 'node:test';
import assert from 'node:assert/strict';
import { defaultState } from '../js/store.js';
import { ensureCurrent, selectDay, setSlotExercise, finishWorkout, regenerateDay } from '../js/engine/session.js';

const markAll = (state, reps = 12) => {
  const cur = state.current;
  return {
    ...state,
    current: { ...cur, items: cur.items.map(it => ({ ...it, sets: it.sets.map(s => ({ ...s, reps, done: true })) })) },
  };
};

test('ensureCurrent builds next day once', () => {
  const s = ensureCurrent(defaultState());
  assert.equal(s.current.day, 'A');
  assert.equal(ensureCurrent(s), s);
});

test('setSlotExercise stores override and rebuilds untouched item', () => {
  let s = ensureCurrent(defaultState());
  s = setSlotExercise(s, 'A_3B', 'plank');
  assert.equal(s.slotOverrides.A_3B, 'plank');
  assert.equal(s.current.items.find(i => i.slotId === 'A_3B').exId, 'plank');
  s = setSlotExercise(s, 'A_3B', null);
  assert.equal(s.slotOverrides.A_3B, undefined);
  assert.equal(s.current.items.find(i => i.slotId === 'A_3B').exId, 'decline_crunch');
});

test('setSlotExercise keeps item with done sets', () => {
  let s = ensureCurrent(defaultState());
  s = markAll(s);
  s = setSlotExercise(s, 'A_1A', 'db_bench_press');
  assert.equal(s.current.items.find(i => i.slotId === 'A_1A').exId, 'chest_press');
  assert.equal(s.slotOverrides.A_1A, 'db_bench_press');
});

test('finishWorkout raises weights, logs, advances queue', () => {
  let s = markAll(ensureCurrent(defaultState()));
  const r = finishWorkout(s, 1000);
  assert.equal(r.logged, true);
  assert.equal(r.state.weights.leg_press.weight, 110);
  assert.equal(r.state.weights.chest_press.weight, 47.5);
  assert.equal(r.state.log.length, 1);
  assert.equal(r.state.log[0].day, 'A');
  assert.equal(r.state.current, null);
  assert.equal(r.state.nextIndex, 1);
});

test('finishWorkout with nothing done does not log or advance', () => {
  const s = ensureCurrent(defaultState());
  const r = finishWorkout(s, 1000);
  assert.equal(r.logged, false);
  assert.equal(r.state.log.length, 0);
  assert.equal(r.state.nextIndex, 0);
});

test('finishing a manually chosen day moves queue after that day', () => {
  let s = selectDay(defaultState(), 'C');
  s = markAll(s);
  const r = finishWorkout(s, 1000);
  assert.equal(r.state.nextIndex, 0); // после В идёт А
});

test('failed reps keep weight and count failStreak', () => {
  let s = markAll(ensureCurrent(defaultState()), 8);
  const r = finishWorkout(s, 1000);
  assert.deepEqual(r.state.weights.leg_press, { weight: 100, failStreak: 1 });
});

test('regenerateDay picks verified alternatives without duplicates', () => {
  const s = regenerateDay(ensureCurrent(defaultState()), 'A');
  const ids = s.current.items.map(i => i.exId);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(ids.length, 6);
});
