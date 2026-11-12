import { getExercise, STATION_NAMES, MUSCLE_NAMES } from '../data/exercises.js';
import { DAYS } from '../data/program.js';
import { exerciseForSlot } from '../engine/plan.js';
import { renderDiagram } from '../diagrams.js';
import { esc, fmtW } from './util.js';

export function findSlot(slotId) {
  for (const d of Object.values(DAYS)) {
    const s = d.slots.find(x => x.id === slotId);
    if (s) return { day: d, slot: s };
  }
  return null;
}

export function mount(root, ctx, slotId) {
  const found = findSlot(slotId);
  if (!found) { root.innerHTML = '<p>Упражнение не найдено.</p><a class="back" href="#today">← Назад</a>'; return; }
  const state = ctx.store.get();
  const ex = getExercise(exerciseForSlot(found.slot, state));
  const w = state.weights[ex.id]?.weight ?? ex.start;
  root.innerHTML = `
    <a class="back" href="#today">← К тренировке</a>
    <h1>${esc(ex.nameRu)}</h1>
    <p class="muted">${esc(MUSCLE_NAMES[ex.primary])} · ${esc(STATION_NAMES[ex.station])}
      · ${ex.verified ? '<span class="badge ok">✓ есть в зале</span>' : '<span class="badge warn">проверить в зале</span>'}</p>
    <div class="card">${renderDiagram(ex.diagram)}</div>
    <h2>Как делать</h2>
    <ul class="steps">${ex.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ul>
    <h2>Частые ошибки</h2>
    <ul class="steps">${ex.mistakes.map(s => `<li>${esc(s)}</li>`).join('')}</ul>
    <p class="muted">Темп: ${esc(ex.tempo)}<br>Настройка: ${esc(ex.settingLabel)}<br>Рабочий вес: ${fmtW(w)} кг · цель ${ex.reps} повт.</p>
    <div class="actions"><a href="#swap/${slotId}" style="text-decoration:none"><button type="button" class="primary" style="width:100%">Заменить упражнение</button></a></div>`;
}
