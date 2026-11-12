import { EXERCISES, getExercise } from '../data/exercises.js';

const MAX = 6;

// Варианты замены: та же мышца → та же станция, что у соседа → проверенные → тот же тип нагрузки.
export function rankSwaps(slot, currentExId, neighborExId, state, catalog = EXERCISES, usedInDay = []) {
  const hidden = new Set(state.hidden ?? []);
  const excluded = new Set([currentExId, ...usedInDay]);
  const byId = id => catalog.find(e => e.id === id) ?? getExercise(id);
  const neighbor = neighborExId ? byId(neighborExId) : null;
  const current = byId(currentExId);

  return catalog
    .filter(e => !hidden.has(e.id) && !excluded.has(e.id) && e.primary === slot.primary)
    .map(e => ({
      e,
      key: [
        neighbor && e.station === neighbor.station ? 0 : 1,
        e.verified ? 0 : 1,
        current && e.kind === current.kind ? 0 : 1,
      ],
    }))
    .sort((a, b) => {
      for (let i = 0; i < a.key.length; i++) if (a.key[i] !== b.key[i]) return a.key[i] - b.key[i];
      return 0;
    })
    .slice(0, MAX)
    .map(x => x.e);
}

// Пресс стоит на другой станции, чем сосед, хотя есть вариант на станции соседа.
export function absStationMismatch(absExId, neighborExId, state, catalog = EXERCISES) {
  if (!neighborExId) return false;
  const find = id => catalog.find(e => e.id === id) ?? getExercise(id);
  const abs = find(absExId);
  const neighbor = find(neighborExId);
  if (!abs || !neighbor || abs.station === neighbor.station) return false;
  const hidden = new Set(state.hidden ?? []);
  return catalog.some(e => e.primary === 'abs' && !hidden.has(e.id) && e.station === neighbor.station);
}
