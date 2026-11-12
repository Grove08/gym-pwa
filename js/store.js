export const STORAGE_KEY = 'gympwa.v1';
const BACKUP_DAYS = 14;

export function defaultState() {
  return {
    version: 1,
    queue: ['A', 'B', 'C'],
    nextIndex: 0,
    daysPerWeek: 3,
    hidden: [],
    slotOverrides: {},
    weights: {},
    log: [],
    current: null,
    lastBackup: null,
  };
}

export function backupDue(state, now) {
  if (!state.log.length) return false;
  if (state.lastBackup == null) return true;
  return now - state.lastBackup > BACKUP_DAYS * 86400000;
}

const isObj = v => v !== null && typeof v === 'object' && !Array.isArray(v);

function validate(data) {
  if (!isObj(data)) return 'Файл не похож на копию данных приложения.';
  if (data.version !== 1) return 'Неподдерживаемая версия копии.';
  if (!Array.isArray(data.queue) || !data.queue.length || !data.queue.every(x => typeof x === 'string'))
    return 'Повреждено поле очереди тренировок.';
  if (!Array.isArray(data.hidden) || !data.hidden.every(x => typeof x === 'string'))
    return 'Повреждён список скрытых упражнений.';
  if (!isObj(data.weights)) return 'Повреждены рабочие веса.';
  if (!Array.isArray(data.log)) return 'Повреждена история.';
  if (data.slotOverrides !== undefined && !isObj(data.slotOverrides)) return 'Повреждены замены.';
  return null;
}

export function createStore(storage) {
  let persistent = !!storage;
  let state = defaultState();
  const listeners = new Set();

  if (storage) {
    try {
      const raw = storage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (!validate(parsed)) state = { ...defaultState(), ...parsed };
      }
    } catch { /* повреждённые данные: стартуем с чистого, ключ не трогаем до первой записи */ }
  }

  function save() {
    if (!storage) return;
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      persistent = false;
    }
  }

  const api = {
    get: () => state,
    update(fn) {
      state = fn(state);
      save();
      listeners.forEach(f => f(state));
    },
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    exportJson: () => JSON.stringify({ ...state, current: null }, null, 2),
    importJson(text) {
      let data;
      try { data = JSON.parse(text); } catch { return { ok: false, error: 'Файл не читается (не JSON).' }; }
      const err = validate(data);
      if (err) return { ok: false, error: err };
      api.update(() => ({ ...defaultState(), ...data, current: null }));
      return { ok: true };
    },
  };
  Object.defineProperty(api, 'persistent', { get: () => persistent });
  return api;
}
