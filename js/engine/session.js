// Чистые преобразования состояния для текущей тренировки.
import { DAYS } from '../data/program.js';
import { EXERCISES, getExercise } from '../data/exercises.js';
import { buildWorkout, nextDay, exerciseForSlot } from './plan.js';
import { nextWeight } from './progression.js';
import { rankSwaps } from './swap.js';

export function ensureCurrent(state) {
  if (state.current) return state;
  return { ...state, current: buildWorkout(nextDay(state), state) };
}

export function selectDay(state, day) {
  return { ...state, current: buildWorkout(day, state) };
}

const hasDone = item => item.sets.some(s => s.done);

// exId === null — вернуть упражнение по умолчанию.
export function setSlotExercise(state, slotId, exId) {
  const overrides = { ...state.slotOverrides };
  if (exId == null) delete overrides[slotId]; else overrides[slotId] = exId;
  let next = { ...state, slotOverrides: overrides };
  if (next.current) {
    const fresh = buildWorkout(next.current.day, next);
    next = {
      ...next,
      current: {
        ...next.current,
        items: next.current.items.map(it =>
          it.slotId === slotId && !hasDone(it) ? fresh.items.find(f => f.slotId === slotId) : it),
      },
    };
  }
  return next;
}

// Лучшие варианты по слотам среди проверенных, без повторов в дне.
export function regenerateDay(state, day) {
  let next = state;
  const used = new Set();
  for (const slot of DAYS[day].slots) {
    const cur = exerciseForSlot(slot, next);
    const mate = DAYS[day].slots.find(s => s.superset === slot.superset && s.id !== slot.id);
    const mateEx = mate ? exerciseForSlot(mate, next) : null;
    const pool = [getExercise(cur), ...rankSwaps(slot, cur, mateEx, next, EXERCISES, [...used])]
      .filter(e => e && e.verified && !used.has(e.id) && !(next.hidden ?? []).includes(e.id));
    const pick = pool[Math.floor(Math.random() * pool.length)] ?? getExercise(cur);
    used.add(pick.id);
    next = setSlotExercise(next, slot.id, pick.id === slot.defaultEx ? null : pick.id);
  }
  return next;
}

export function finishWorkout(state, now) {
  const cur = state.current;
  if (!cur || !cur.items.some(hasDone)) return { state, logged: false };

  const weights = { ...state.weights };
  const logItems = [];
  for (const it of cur.items) {
    const ex = getExercise(it.exId);
    const doneSets = it.sets.filter(s => s.done);
    if (!doneSets.length) continue;
    const prev = state.weights[it.exId] ?? { weight: ex.start, failStreak: 0 };
    const used = doneSets[doneSets.length - 1].w;
    const sets = it.sets.map(s => ({ reps: s.reps ?? 0, done: s.done }));
    weights[it.exId] = nextWeight(ex, sets, { weight: used, failStreak: prev.failStreak });
    logItems.push({ exId: it.exId, sets: doneSets.map(s => ({ w: s.w, reps: s.reps ?? 0 })) });
  }

  const idx = state.queue.indexOf(cur.day);
  return {
    logged: true,
    state: {
      ...state,
      weights,
      log: [...state.log, { date: now, day: cur.day, items: logItems }],
      current: null,
      nextIndex: idx >= 0 ? (idx + 1) % state.queue.length : state.nextIndex,
    },
  };
}
