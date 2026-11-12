import { EXERCISES, MUSCLES, MUSCLE_NAMES, STATION_NAMES } from '../data/exercises.js';
import { esc } from './util.js';

export function mount(root, ctx) {
  const hidden = new Set(ctx.store.get().hidden);
  const groups = MUSCLES.map(m => {
    const list = EXERCISES.filter(e => e.primary === m);
    if (!list.length) return '';
    const rows = list.map(e => `
      <label class="row">
        <div class="grow"><b>${esc(e.nameRu)}</b><br>
          <span class="badge">${esc(STATION_NAMES[e.station])}</span>
          ${e.verified ? '<span class="badge ok">✓ из программы</span>' : '<span class="badge warn">проверить в зале</span>'}</div>
        <span class="sw"><input type="checkbox" data-ex="${e.id}" ${hidden.has(e.id) ? '' : 'checked'}
          aria-label="${esc(e.nameRu)}: есть в зале"><i></i></span>
      </label>`).join('');
    return `<h2>${esc(MUSCLE_NAMES[m])}</h2><div class="card">${rows}</div>`;
  }).join('');

  root.innerHTML = `<h1>Зал</h1>
    <p class="muted">Включено — упражнение есть в зале и участвует в заменах. Выключите то, чего нет.</p>${groups}`;

  root.onchange = e => {
    const id = e.target.dataset?.ex;
    if (!id) return;
    ctx.store.update(s => ({
      ...s,
      hidden: e.target.checked ? s.hidden.filter(x => x !== id) : [...new Set([...s.hidden, id])],
    }));
  };
}
