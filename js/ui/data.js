import { backupDue } from '../store.js';
import { fmtDate } from './util.js';

async function exportFile(ctx) {
  const json = ctx.store.exportJson();
  const name = `gym-backup-${new Date().toISOString().slice(0, 10)}.json`;
  const file = new File([json], name, { type: 'application/json' });
  try {
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: 'Копия тренировок' });
    } else {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(file);
      a.download = name;
      document.body.append(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    }
  } catch (err) {
    if (err?.name === 'AbortError') return false; // пользователь закрыл окно «Поделиться»
    throw err;
  }
  ctx.store.update(s => ({ ...s, lastBackup: Date.now() }));
  return true;
}

export function mount(root, ctx) {
  const s = ctx.store.get();
  const last = s.lastBackup ? `Последняя копия: ${fmtDate(s.lastBackup)}` : 'Копий ещё не было';
  root.innerHTML = `<h1>Данные</h1>
    <p class="muted">${last}${backupDue(s, Date.now()) ? ' · пора обновить' : ''}.<br>
    iOS может удалить данные неиспользуемого приложения, поэтому делайте копию раз в пару недель.</p>
    <div class="actions">
      <button type="button" class="primary" data-act="export">Экспорт</button>
      <button type="button" data-act="import">Импорт</button>
    </div>
    <input type="file" accept="application/json,.json" id="imp" hidden>
    <p id="msg" class="muted" role="status"></p>
    <p class="muted">Тренировок в истории: ${s.log.length}. Скрытых упражнений: ${s.hidden.length}.</p>`;

  const msg = root.querySelector('#msg');
  const input = root.querySelector('#imp');
  root.onclick = async e => {
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act === 'export') {
      try { if (await exportFile(ctx)) mount(root, ctx); } catch { msg.textContent = 'Не удалось сохранить файл.'; }
    } else if (act === 'import') input.click();
  };
  input.onchange = async () => {
    const f = input.files[0];
    if (!f) return;
    if (!confirm('Импорт заменит текущие данные. Продолжить?')) { input.value = ''; return; }
    const r = ctx.store.importJson(await f.text());
    input.value = '';
    if (r.ok) { ctx.toast('Данные восстановлены'); mount(root, ctx); } else msg.textContent = 'Ошибка импорта: ' + r.error;
  };
}
