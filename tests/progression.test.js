import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nextWeight } from '../js/engine/progression.js';
import { getExercise } from '../js/data/exercises.js';

const done = (reps, n = 3) => Array.from({ length: n }, () => ({ reps, done: true }));

test('all sets done at target reps raises by step', () => {
  const r = nextWeight(getExercise('leg_press'), done(12), { weight: 100, failStreak: 0 });
  assert.deepEqual(r, { weight: 110, failStreak: 0 });
});

test('one failed set keeps weight, failStreak 1', () => {
  const sets = [...done(12, 2), { reps: 9, done: true }];
  const r = nextWeight(getExercise('leg_press'), sets, { weight: 100, failStreak: 0 });
  assert.deepEqual(r, { weight: 100, failStreak: 1 });
});

test('second consecutive fail lowers by step, resets streak', () => {
  const sets = [...done(12, 2), { reps: 9, done: true }];
  const r = nextWeight(getExercise('leg_press'), sets, { weight: 100, failStreak: 1 });
  assert.deepEqual(r, { weight: 90, failStreak: 0 });
});

test('assisted_pullup success lowers assistance: 20 -> 17.5', () => {
  const r = nextWeight(getExercise('assisted_pullup'), done(12), { weight: 20, failStreak: 0 });
  assert.equal(r.weight, 17.5);
});

test('assisted_pullup double fail raises assistance', () => {
  const sets = [{ reps: 6, done: true }];
  const r = nextWeight(getExercise('assisted_pullup'), sets, { weight: 20, failStreak: 1 });
  assert.equal(r.weight, 22.5);
});

test('weight never below 0', () => {
  const sets = [{ reps: 3, done: true }];
  const e = getExercise('decline_crunch'); // step 2.5, weight 0
  assert.equal(nextWeight(e, sets, { weight: 0, failStreak: 1 }).weight, 0);
  const a = getExercise('assisted_pullup');
  assert.equal(nextWeight(a, done(12), { weight: 0, failStreak: 0 }).weight, 0);
});

test('undone sets or reps 0 do not raise weight', () => {
  const e = getExercise('leg_press');
  const undone = [{ reps: 12, done: false }, { reps: 12, done: false }, { reps: 12, done: false }];
  assert.deepEqual(nextWeight(e, undone, { weight: 100, failStreak: 1 }), { weight: 100, failStreak: 1 });
  const zeros = [{ reps: 0, done: true }, { reps: null, done: true }];
  assert.deepEqual(nextWeight(e, zeros, { weight: 100, failStreak: 0 }), { weight: 100, failStreak: 0 });
  const partial = [{ reps: 12, done: true }, { reps: 12, done: false }, { reps: 12, done: false }];
  const r = nextWeight(e, partial, { weight: 100, failStreak: 0 });
  assert.equal(r.weight, 100);
});
