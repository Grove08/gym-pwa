const clamp = w => Math.max(0, Math.round(w * 2) / 2);

// Возвращает новый вес и счётчик неудач после тренировки.
export function nextWeight(ex, sets, prev) {
  const performed = sets.filter(s => s.done && Number(s.reps) > 0);
  if (performed.length === 0) return { weight: prev.weight, failStreak: prev.failStreak };

  const success = sets.length > 0 && sets.every(s => s.done && Number(s.reps) >= ex.reps);
  if (success) return { weight: clamp(prev.weight + ex.step), failStreak: 0 };

  const streak = prev.failStreak + 1;
  if (streak >= 2) return { weight: clamp(prev.weight - ex.step), failStreak: 0 };
  return { weight: prev.weight, failStreak: streak };
}
