import { DAYS } from '../data/program.js';
import { getExercise } from '../data/exercises.js';
import { nextDay } from '../engine/plan.js';
import { ensureCurrent, selectDay, finishWorkout, regenerateDay } from '../engine/session.js';
import { esc, fmtW } from './util.js';

const DAY_LABEL = { A: 'А', B: 'Б', C: 'В' };

function itemHtml(it, slot) {
  const ex = getExercise(it.exId);
  const stepAbs = Math.abs(ex.step) || 2.5;
  const sets = it.sets.map((s, i) => {
    const shown = s.reps ?? ex.reps;
    return `<div class="set ${s.done ? 'isdone' : ''}" data-i="${i}">
      <span class="n">${i + 1}</span>
      <button type="button" data-act="r-" aria-label="Меньше повторов">−</button>
      <span class="reps ${s.reps == null ? 'ph' : ''}">${shown}</span>
      <button type="button" data-act="r+" aria-label="Больше повторов">+</button>
      <button type="button" class="done" data-act="done" aria-pressed="${s.done}" aria-label="Подход выполнен">✓</button>
    </div>`;
  }).join('');
  return `<article class="card" data-slot="${slot}" data-step="${stepAbs}">
    <div class="top">
      <div><a class="name" href="#exercise/${slot}">${esc(ex.nameRu)}</a>
        <div class="meta">${slot.endsWith('B') ? '' : ''}3 × ${it.repsLabel} · ${esc(ex.settingLabel)}</div></div>
      <a class="badge" href="#swap/${slot}">Заменить</a>
    </div>
    <div class="wt"><button type="button" data-act="w-" aria-label="Меньше вес">−</button>
      <span class="val">${fmtW(it.weight)} кг</span>
      <button type="button" data-act="w+" aria-label="Больше вес">+</button></div>
    ${sets}
  </article>`;
}

export function mount(root, ctx) {
  const { store, timer, toast } = ctx;
  store.update(ensureCurrent);
  const state = store.get();
  const cur = state.current;
  const day = DAYS[cur.day];
  const total = cur.items.reduce((n, i) => n + i.sets.length, 0);
  const done = cur.items.reduce((n, i) => n + i.sets.filter(s => s.done).length, 0);

  const chips = Object.keys(DAYS).map(k =>
    `<button type="button" class="chip ${k === cur.day ? 'on' : ''}" data-day="${k}">${DAY_LABEL[k]}</button>`).join('');
  const bySuper = [1, 2, 3].map(n => {
    const items = cur.items.filter(i => i.superset === n);
    return `<h2>Суперсет ${n} · отдых ${items[0].rest} с</h2>${items.map(i => itemHtml(i, i.slotId)).join('')}`;
  }).join('');

  root.innerHTML = `
    <h1>${esc(day.title)}</h1>
    <p class="muted">Следующая по очереди: ${DAY_LABEL[nextDay(state)]} · подходов ${done}/${total}</p>
    <div class="chips" role="group" aria-label="День">${chips}</div>
    ${bySuper}
    <div class="actions">
      <button type="button" data-act="regen">Перегенерировать день</button>
      <button type="button" class="primary" data-act="finish">Завершить</button>
    </div>`;

  const save = fn => { store.update(s => ({ ...s, current: fn(s.current) })); mount(root, ctx); };
  const mapItem = (slot, fn) => cur => ({ ...cur, items: cur.items.map(i => (i.slotId === slot ? fn(i) : i)) });

  root.onclick = e => {
    const dayBtn = e.target.closest('[data-day]');
    if (dayBtn) {
      const hasDone = cur.items.some(i => i.sets.some(s => s.done));
      if (dayBtn.dataset.day !== cur.day && (!hasDone || confirm('Сбросить текущую тренировку и открыть другой день?'))) {
        store.update(s => selectDay(s, dayBtn.dataset.day));
        mount(root, ctx);
      }
      return;
    }
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    const act = btn.dataset.act;
    const card = btn.closest('[data-slot]');
    const slot = card?.dataset.slot;

    if (act === 'finish') {
      const r = finishWorkout(store.get(), Date.now());
      if (!r.logged) return toast('Нет выполненных подходов');
      store.update(() => r.state);
      toast('Тренировка сохранена. Веса обновлены.');
      timer.reset();
      return mount(root, ctx);
    }
    if (act === 'regen') {
      const hasDone = cur.items.some(i => i.sets.some(s => s.done));
      if (hasDone && !confirm('Подходы текущей тренировки сбросятся. Продолжить?')) return;
      store.update(s => selectDay(regenerateDay(s, cur.day), cur.day));
      return mount(root, ctx);
    }
    if (!slot) return;
    const step = Number(card.dataset.step);
    const setIdx = Number(btn.closest('.set')?.dataset.i);
    const item = cur.items.find(i => i.slotId === slot);
    const ex = getExercise(item.exId);

    if (act === 'w+' || act === 'w-') {
      const w = Math.max(0, item.weight + (act === 'w+' ? step : -step));
      save(mapItem(slot, i => ({
        ...i, weight: w, sets: i.sets.map(s => (s.done ? s : { ...s, w })),
      })));
    } else if (act === 'r+' || act === 'r-') {
      save(mapItem(slot, i => ({
        ...i,
        sets: i.sets.map((s, k) => (k === setIdx
          ? { ...s, reps: Math.max(0, (s.reps ?? ex.reps) + (act === 'r+' ? 1 : -1)) } : s)),
      })));
    } else if (act === 'done') {
      const turningOn = !item.sets[setIdx].done;
      save(mapItem(slot, i => ({
        ...i,
        sets: i.sets.map((s, k) => (k === setIdx ? { ...s, done: turningOn, reps: s.reps ?? ex.reps } : s)),
      })));
      if (turningOn) timer.start(item.rest);
    }
  };
}
