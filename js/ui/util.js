export const esc = s => String(s).replace(/[&<>"']/g,
  c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const fmtW = n => (Number.isInteger(n) ? String(n) : String(Math.round(n * 10) / 10));

export function fmtTime(sec) {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export const fmtDate = ts => new Date(ts).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
