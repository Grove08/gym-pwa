// Шаблон дней: 3 суперсета по 2 слота. defaultEx — упражнение по умолчанию.

function slot(day, superset, letter, kind, primary, defaultEx, rest, repsLabel) {
  return { id: `${day}_${superset}${letter}`, superset, kind, primary, defaultEx, rest, sets: 3, repsLabel };
}

export const DAYS = {
  A: {
    key: 'A', dayName: 'Понедельник',
    title: 'Тренировка А: грудь, спина, ноги',
    subtitle: '3 суперсета, около 35 минут',
    slots: [
      slot('A', 1, 'A', 'push', 'chest', 'chest_press', 90, '10–12'),
      slot('A', 1, 'B', 'pull', 'back', 'lat_pulldown', 90, '10–12'),
      slot('A', 2, 'A', 'legs', 'legs_quad', 'leg_press', 90, '10–12'),
      slot('A', 2, 'B', 'legs', 'legs_ham', 'seated_leg_curl', 90, '10–12'),
      slot('A', 3, 'A', 'push', 'shoulders', 'lateral_raise', 60, '12–15'),
      slot('A', 3, 'B', 'core', 'abs', 'decline_crunch', 60, '12–15'),
    ],
  },
  B: {
    key: 'B', dayName: 'Среда',
    title: 'Тренировка Б: спина, плечи, бёдра',
    subtitle: '3 суперсета, около 35 минут',
    slots: [
      slot('B', 1, 'A', 'pull', 'back', 'seated_row', 90, '10–12'),
      slot('B', 1, 'B', 'push', 'shoulders', 'shoulder_press', 90, '10–12'),
      slot('B', 2, 'A', 'legs', 'legs_ham', 'lying_leg_curl', 90, '10–12'),
      slot('B', 2, 'B', 'legs', 'legs_quad', 'leg_extension', 90, '10–12'),
      slot('B', 3, 'A', 'push', 'triceps', 'tricep_pushdown', 60, '12–15'),
      slot('B', 3, 'B', 'core', 'abs', 'captains_knee_raise', 60, '12–15'),
    ],
  },
  C: {
    key: 'C', dayName: 'Пятница',
    title: 'Тренировка В: грудь, руки, кор',
    subtitle: '3 суперсета, около 35 минут',
    slots: [
      slot('C', 1, 'A', 'push', 'chest', 'incline_press', 90, '10–12'),
      slot('C', 1, 'B', 'pull', 'back', 'assisted_pullup', 90, '10–12'),
      slot('C', 2, 'A', 'push', 'chest', 'pec_fly', 75, '12–15'),
      slot('C', 2, 'B', 'pull', 'lower_back', 'hyperextension', 75, '12–15'),
      slot('C', 3, 'A', 'pull', 'biceps', 'preacher_curl', 60, '10–12'),
      slot('C', 3, 'B', 'core', 'abs', 'captains_leg_raise', 60, '12–15'),
    ],
  },
};
