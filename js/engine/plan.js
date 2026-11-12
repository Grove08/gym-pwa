import { DAYS } from '../data/program.js';
import { getExercise } from '../data/exercises.js';

export function nextDay(state) {
  const q = state.queue;
  return q[state.nextIndex % q.length];
}

export function advanceQueue(state) {
  return { ...state, nextIndex: (state.nextIndex + 1) % state.queue.length };
}

export function exerciseForSlot(slot, state) {
  return state.slotOverrides?.[slot.id] ?? slot.defaultEx;
}

export function buildWorkout(dayKey, state) {
  const day = DAYS[dayKey];
  const items = day.slots.map(slot => {
    const exId = exerciseForSlot(slot, state);
    const ex = getExercise(exId);
    const weight = state.weights?.[exId]?.weight ?? ex.start;
    return {
      slotId: slot.id,
      superset: slot.superset,
      exId,
      weight,
      rest: slot.rest,
      repsLabel: slot.repsLabel,
      sets: Array.from({ length: slot.sets }, () => ({ w: weight, reps: null, done: false })),
    };
  });
  return { day: dayKey, items };
}
