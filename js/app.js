import { createStore, backupDue } from './store.js';
import { DIAGRAM_CSS } from './diagrams.js';
import { createTimer, beep } from './ui/timer.js';
import { fmtTime } from './ui/util.js';
import * as today from './ui/today.js';
import * as exercise from './ui/exercise.js';
import * as swap from './ui/swap.js';
import * as gym from './ui/gym.js';
import * as history from './ui/history.js';
import * as data from './ui/data.js';

let storage = null;
try { storage = window.localStorage; storage.getItem('x'); } catch { storage = null; }
const store = createStore(storage);

const $ = id => document.getElementById(id);
const view = $('view');

// ── уведомление ──
let toastTimer;
function toast(msg) {
  const t = $('toast');
  t.textContent = msg; t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, 2600);
}

// ── таймер ──
const bar = $('timerbar');
const timer = createTimer({
  onTick(r) {
    if (r < 0) { bar.hidden = true; return; }
    bar.hidden = false;
    bar.classList.toggle('done', r <= 0);
    $('timer-time').textContent = r > 0 ? fmtTime(r) : 'Отдых закончен';
  },
  onDone() { beep(); setTimeout(() => { if (!timer.active()) bar.hidden = true; }, 4000); },
});
bar.addEventListener('click', e => {
  const b = e.target.closest('[data-timer]');
  if (!b) return;
  if (b.dataset.timer === 'reset') timer.reset(); else timer.add(15);
});

// ── навигация ──
const TABS = [
  ['#today', '🏋', 'Сегодня'], ['#gym', '🧰', 'Зал'], ['#history', '📈', 'История'], ['#data', '💾', 'Данные'],
];
$('nav').innerHTML = TABS.map(([h, i, t]) => `<a href="${h}"><b>${i}</b>${t}</a>`).join('');

const ctx = {
  store, timer, toast,
  go: hash => { if (location.hash === hash) route(); else location.hash = hash; },
  refresh: () => route(),
};

const ROUTES = { today, exercise, swap, gym, history, data };

function route() {
  const [name, ...args] = (location.hash.slice(1) || 'today').split('/');
  const screen = ROUTES[name] ?? today;
  const base = ROUTES[name] ? name : 'today';
  const tab = { exercise: 'today', swap: 'today' }[base] ?? base;
  document.querySelectorAll('#nav a').forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + tab));
  view.onclick = null;
  screen.mount(view, ctx, ...args.map(decodeURIComponent));
  updateBanner();
  window.scrollTo(0, 0);
}

function updateBanner() {
  const b = $('banner');
  const s = store.get();
  if (!store.persistent) {
    b.hidden = false;
    b.textContent = 'Данные не сохраняются на этом устройстве (приватный режим?). Сделайте экспорт после тренировки.';
  } else if (backupDue(s, Date.now())) {
    b.hidden = false;
    b.innerHTML = 'Давно не было копии данных. <a href="#data">Сделать копию</a>';
  } else b.hidden = true;
}

const style = document.createElement('style');
style.textContent = DIAGRAM_CSS;
document.head.append(style);

window.addEventListener('hashchange', route);
route();

navigator.storage?.persist?.().catch(() => {});
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
