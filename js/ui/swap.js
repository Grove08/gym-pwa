import { getExercise, STATION_NAMES, MUSCLE_NAMES } from '../data/exercises.js';
import { exerciseForSlot } from '../engine/plan.js';
import { rankSwaps, absStationMismatch } from '../engine/swap.js';
import { setSlotExercise } from '../engine/session.js';
import { findSlot } from './exercise.js';
import { esc } from './util.js';

export function mount(root, ctx, slotId) {
  const found = findSlot(slotId);
  if (!found) { root.innerHTML = '<p>Слот не найден.</p><a class="back" href="#today">← Назад</a>'; return; }
  const { day, slot } = found;
  const state = ctx.store.get();
  const curId = exerciseForSlot(slot, state);
  const cur = getExercise(curId);
  const mate = day.slots.find(s => s.superset === slot.superset && s.id !== slot.id);
  const mateId = mate ? exerciseForSlot(mate, state) : null;
  const mateEx = mateId ? getExercise(mateId) : null;
  const used = day.slots.map(s => exerciseForSlot(s, state));
  const options = rankSwaps(slot, curId, mateId, state, undefined, used);
  const mismatch = slot.primary === 'abs' && absStationMismatch(curId, mateId, state);

  const rows = options.map(e => `
    <div class="row pick" data-ex="${e.id}">
      <div class="grow"><b>${esc(e.nameRu)}</b><br>
        <span class="badge">${esc(STATION_NAMES[e.station])}</span>
        ${mateEx && e.station === mateEx.station ? '<span class="badge ok">рядом с парой</span>' : ''}
        ${e.verified ? '<span class="badge ok">✓ в зале</span>' : '<span class="badge warn">проверить в зале</span>'}</div>
      <button type="button" class="primary" data-act="pick">Выбрать</button>
      <button type="button" class="danger" data-act="hide" aria-label="Нет в зале">Нет в зале</button>
    </div>`).join('');

  root.innerHTML = `
    <a class="back" href="#exercise/${slotId}">← Назад</a>
    <h1>Заменить: ${esc(cur.nameRu)}</h1>
    <p class="muted">${esc(MUSCLE_NAMES[slot.primary])}${mateEx ? ` · пара: ${esc(mateEx.nameRu)} (${esc(STATION_NAMES[mateEx.station])})` : ''}</p>
    ${mismatch ? '<div class="warnbox">Пресс стоит на другой станции, чем соседнее упражнение. Ниже есть варианты рядом с парой.</div>' : ''}
    ${rows || '<p class="muted">Подходящих вариантов нет. Верните упражнения в разделе «Зал» или добавьте новые.</p>'}
    ${state.slotOverrides[slotId] ? '<div class="actions"><button type="button" data-act="reset">Вернуть исходное упражнение</button></div>' : ''}`;

  root.onclick = e => {
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    const exId = btn.closest('[data-ex]')?.dataset.ex;
    if (btn.dataset.act === 'pick') {
      ctx.store.update(s => setSlotExercise(s, slotId, exId === slot.defaultEx ? null : exId));
      ctx.toast('Упражнение заменено');
      ctx.go('#today');
    } else if (btn.dataset.act === 'hide') {
      ctx.store.update(s => ({ ...s, hidden: [...new Set([...s.hidden, exId])] }));
      ctx.toast('Скрыто. Вернуть можно в разделе «Зал».');
      mount(root, ctx, slotId);
    } else if (btn.dataset.act === 'reset') {
      ctx.store.update(s => setSlotExercise(s, slotId, null));
      ctx.go('#today');
    }
  };
}
