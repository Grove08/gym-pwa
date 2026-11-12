import { getExercise } from '../data/exercises.js';
import { esc, fmtDate, fmtW } from './util.js';

// Максимальный рабочий вес по каждой тренировке.
export function weightSeries(log, exId) {
  const pts = [];
  for (const entry of log) {
    const it = entry.items.find(i => i.exId === exId);
    if (it && it.sets.length) pts.push({ t: entry.date, w: Math.max(...it.sets.map(s => s.w)) });
  }
  return pts;
}

function chart(pts) {
  if (pts.length < 2) return '<p class="muted">Для графика нужно хотя бы две тренировки с этим упражнением.</p>';
  const W = 300, H = 110, P = 16;
  const ws = pts.map(p => p.w);
  const lo = Math.min(...ws), hi = Math.max(...ws);
  const span = hi - lo || 1;
  const xy = (p, i) => [P + (i * (W - 2 * P)) / (pts.length - 1), H - P - ((p.w - lo) / span) * (H - 2 * P)];
  const line = pts.map((p, i) => xy(p, i).map(n => n.toFixed(1)).join(',')).join(' ');
  const dots = pts.map((p, i) => { const [x, y] = xy(p, i); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.5" fill="var(--accent)"/>`; }).join('');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="График веса">
    <polyline points="${line}" fill="none" stroke="var(--accent)" stroke-width="2"/>${dots}
    <text x="${P}" y="12" fill="var(--muted)" font-size="11">${fmtW(hi)} кг</text>
    <text x="${P}" y="${H - 2}" fill="var(--muted)" font-size="11">${fmtW(lo)} кг</text></svg>`;
}

export function mount(root, ctx, selected) {
  const log = ctx.store.get().log;
  const ids = [...new Set(log.flatMap(e => e.items.map(i => i.exId)))];
  const sel = ids.includes(selected) ? selected : ids[0];

  if (!log.length) {
    root.innerHTML = '<h1>История</h1><p class="muted">Пока пусто. Завершите первую тренировку — она появится здесь.</p>';
    return;
  }
  const options = ids.map(id => `<option value="${id}" ${id === sel ? 'selected' : ''}>${esc(getExercise(id)?.nameRu ?? id)}</option>`).join('');
  const items = [...log].reverse().map(e => `
    <div class="log-item"><b>День ${e.day}</b> · ${fmtDate(e.date)}
      <small>${e.items.map(i => `${esc(getExercise(i.exId)?.nameRu ?? i.exId)} — ${fmtW(Math.max(...i.sets.map(s => s.w)))} кг × ${i.sets.map(s => s.reps).join('/')}`).join('<br>')}</small>
    </div>`).join('');

  root.innerHTML = `<h1>История</h1>
    <h2>Рабочий вес</h2>
    <select aria-label="Упражнение">${options}</select>
    ${chart(weightSeries(log, sel))}
    <h2>Тренировки</h2>${items}`;
  root.onchange = e => { if (e.target.tagName === 'SELECT') mount(root, ctx, e.target.value); };
}
