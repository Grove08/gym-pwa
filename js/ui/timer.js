// Таймер отдыха на абсолютном времени окончания (переживает троттлинг фоновых вкладок).
export function createTimer({ onTick, onDone }) {
  let endAt = 0;
  let id = null;

  const remaining = () => Math.max(0, (endAt - Date.now()) / 1000);

  function loop() {
    const r = remaining();
    onTick(r);
    if (r <= 0) { stop(); onDone(); }
  }
  function stop() { if (id) { clearInterval(id); id = null; } endAt = 0; }

  return {
    start(sec) { stop(); endAt = Date.now() + sec * 1000; id = setInterval(loop, 250); loop(); },
    add(sec) { if (endAt) { endAt += sec * 1000; loop(); } },
    reset() { stop(); onTick(-1); },
    active: () => endAt > 0,
  };
}

export function beep() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    const ctx = new AC();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.frequency.value = 880; g.gain.value = 0.15;
    o.start(); o.stop(ctx.currentTime + 0.35);
  } catch { /* звук недоступен */ }
  try { navigator.vibrate?.([200, 100, 200]); } catch { /* вибрация недоступна */ }
}
