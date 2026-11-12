import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EXERCISES, getExercise, MUSCLES, STATIONS } from '../js/data/exercises.js';

const VERIFIED = ['chest_press', 'lat_pulldown', 'leg_press', 'seated_leg_curl', 'lateral_raise',
  'decline_crunch', 'seated_row', 'shoulder_press', 'lying_leg_curl', 'leg_extension',
  'tricep_pushdown', 'captains_knee_raise', 'incline_press', 'assisted_pullup', 'pec_fly',
  'hyperextension', 'preacher_curl', 'captains_leg_raise'];

test('ids unique', () => {
  const ids = EXERCISES.map(e => e.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('primary and station valid', () => {
  for (const e of EXERCISES) {
    assert.ok(MUSCLES.includes(e.primary), `${e.id} primary`);
    assert.ok(STATIONS.includes(e.station), `${e.id} station`);
    for (const m of e.secondary) assert.ok(MUSCLES.includes(m), `${e.id} secondary ${m}`);
  }
});

test('every exercise has 3 steps and at least 1 mistake', () => {
  for (const e of EXERCISES) {
    assert.equal(e.steps.length, 3, e.id);
    assert.ok(e.mistakes.length >= 1, e.id);
  }
});

test('verified exercises are exactly the 18 source ones', () => {
  const v = EXERCISES.filter(e => e.verified).map(e => e.id).sort();
  assert.equal(v.length, 18);
  assert.deepEqual(v, [...VERIFIED].sort());
});

test('assisted_pullup has negative step', () => {
  const e = getExercise('assisted_pullup');
  assert.equal(e.start, 20);
  assert.equal(e.step, -2.5);
});

test('every exercise has diagram id', () => {
  for (const e of EXERCISES) assert.ok(e.diagram && typeof e.diagram === 'string', e.id);
});

test('source values preserved', () => {
  const c = getExercise('chest_press');
  assert.deepEqual([c.start, c.step, c.reps], [42.5, 5, 12]);
  const l = getExercise('leg_press');
  assert.deepEqual([l.start, l.step, l.reps], [100, 10, 12]);
  assert.equal(getExercise('nope'), undefined);
});
