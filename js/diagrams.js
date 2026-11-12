// Схемы техники: боковой вид, палочная фигура из углов суставов.
// Угол сегмента — от направления «вниз», положительный вперёд (вправо):
// 0 = вниз, 90 = вперёд, 180 = вверх, -90 = назад.
// Поза: [pelvisX, pelvisY, torso, upperArm, forearm, thigh, shin]; торс — от таза к шее.

const LEN = { torso: 34, head: 7, ua: 20, fa: 19, th: 26, sh: 26 };
const FLOOR = 132;

const vec = a => [Math.sin(a * Math.PI / 180), Math.cos(a * Math.PI / 180)];
const add = (p, a, len) => { const v = vec(a); return [p[0] + v[0] * len, p[1] + v[1] * len]; };

export function joints(pose) {
  const [px, py, t, u, f, th, sh] = pose;
  const pelvis = [px, py];
  const neck = add(pelvis, t, LEN.torso);
  const head = add(neck, t, LEN.head + 2);
  const elbow = add(neck, u, LEN.ua);
  const wrist = add(elbow, f, LEN.fa);
  const knee = add(pelvis, th, LEN.th);
  const ankle = add(knee, sh, LEN.sh);
  const toe = [ankle[0] + 9, Math.min(ankle[1] + 4, FLOOR + 2)];
  return { pelvis, neck, head, elbow, wrist, knee, ankle, toe };
}

const SEAT = [['l', 46, 104, 78, 104], ['l', 50, 52, 50, 102]];
const ST = (py = 78) => [70, py, 180];
const LINES = { stroke: 'currentColor', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', fill: 'none' };

const f1 = n => Math.round(n * 10) / 10;
const pt = p => `${f1(p[0])},${f1(p[1])}`;

function figure(pose, eq, ox, floor) {
  const j = joints(pose);
  const g = [];
  if (floor) g.push(`<line x1="2" y1="${FLOOR}" x2="152" y2="${FLOOR}" class="d-floor"/>`);
  for (const e of eq) {
    if (e[0] === 'l') g.push(`<line x1="${e[1]}" y1="${e[2]}" x2="${e[3]}" y2="${e[4]}" class="d-eq"/>`);
    if (e[0] === 'k') g.push(`<line x1="${f1(j.wrist[0])}" y1="${f1(j.wrist[1])}" x2="${e[1]}" y2="${e[2]}" class="d-cable"/>`);
  }
  g.push(`<polyline points="${pt(j.toe)} ${pt(j.ankle)} ${pt(j.knee)} ${pt(j.pelvis)} ${pt(j.neck)}" class="d-body"/>`);
  g.push(`<polyline points="${pt(j.neck)} ${pt(j.elbow)} ${pt(j.wrist)}" class="d-arm"/>`);
  g.push(`<circle cx="${f1(j.head[0])}" cy="${f1(j.head[1])}" r="${LEN.head}" class="d-head"/>`);
  g.push(`<circle cx="${f1(j.wrist[0])}" cy="${f1(j.wrist[1])}" r="3.5" class="d-hand"/>`);
  return `<g transform="translate(${ox},4)">${g.join('')}</g>`;
}

// s — поза «старт», e — «конец», q — оборудование, n — пояснение, st — статичная поза, nf — без пола.
export const POSES = {
  chest_press: { s: [60, 100, 180, -70, 90, 90, 0], e: [60, 100, 180, 90, 90, 90, 0], q: SEAT },
  lat_pulldown: { s: [60, 100, 190, 170, 170, 90, 0], e: [60, 100, 190, -20, 160, 90, 0],
    q: [...SEAT, ['l', 70, 92, 92, 92], ['k', 84, 2]] },
  leg_press: { s: [70, 95, 235, 0, 60, 115, 30], e: [70, 95, 235, 0, 60, 110, 110],
    q: [['l', 48, 118, 74, 76], ['l', 100, 120, 130, 60]] },
  leg_curl_seated: { s: [60, 100, 180, 0, 70, 90, 80], e: [60, 100, 180, 0, 70, 90, -20], q: SEAT },
  lateral_raise: { s: [...ST(), 0, 0, 0, 0], e: [...ST(), 80, 80, 0, 0], n: 'Руки поднимаются в стороны до уровня плеч' },
  crunch_decline: { s: [70, 92, 280, 70, 250, 100, 20], e: [70, 92, 215, 70, 250, 100, 20],
    q: [['l', 76, 96, 22, 108], ['l', 102, 100, 110, 100]] },
  seated_row: { s: [60, 100, 180, 90, 90, 90, 0], e: [60, 100, 180, -85, 95, 90, 0],
    q: [...SEAT, ['l', 70, 56, 70, 86]] },
  shoulder_press: { s: [60, 100, 180, 0, 170, 90, 0], e: [60, 100, 180, 175, 175, 90, 0], q: SEAT },
  leg_curl_lying: { s: [60, 100, 270, 270, 270, 90, 90], e: [60, 100, 270, 270, 270, 90, 160],
    q: [['l', 18, 106, 92, 106]] },
  leg_extension: { s: [60, 100, 180, 30, 60, 90, 0], e: [60, 100, 180, 30, 60, 90, 85], q: SEAT },
  pushdown: { s: [...ST(), 0, 120, 0, 0], e: [...ST(), 0, 0, 0, 0], q: [['k', 82, 4]] },
  knee_raise: { s: [60, 80, 180, 0, 100, 0, 0], e: [60, 80, 180, 0, 100, 90, 10],
    q: [['l', 50, 38, 50, 92], ['l', 56, 68, 82, 68]] },
  incline_press: { s: [60, 100, 240, -10, 170, 80, 10], e: [60, 100, 240, 165, 165, 80, 10],
    q: [['l', 22, 88, 62, 108]] },
  assisted_pullup: { s: [70, 103, 180, 180, 180, 10, -70], e: [70, 71, 180, -60, 150, 10, -70],
    q: [['l', 46, 30, 100, 30], ['l', 62, 131, 92, 131]], nf: true },
  pec_fly: { s: [60, 100, 180, -70, 70, 90, 0], e: [60, 100, 180, 40, 90, 90, 0], q: SEAT,
    n: 'Руки сводятся перед грудью дугой' },
  hyperext: { s: [60, 70, 40, 60, 250, -45, -45], e: [60, 70, 140, 60, 250, -45, -45],
    q: [['l', 64, 74, 14, 124]] },
  preacher_curl: { s: [60, 100, 175, 40, 40, 90, 0], e: [60, 100, 175, 40, 150, 90, 0],
    q: [...SEAT, ['l', 60, 64, 90, 94]] },
  leg_raise: { s: [60, 80, 180, 0, 100, 0, 0], e: [60, 80, 180, 0, 100, 90, 90],
    q: [['l', 50, 38, 50, 92], ['l', 56, 68, 82, 68]] },
  db_bench: { s: [90, 100, 270, 0, 180, 80, -10], e: [90, 100, 270, 180, 180, 80, -10],
    q: [['l', 40, 104, 96, 104]] },
  cable_fly: { s: [...ST(), -80, 40, 0, 0], e: [...ST(), 50, 70, 0, 0], q: [['k', 18, 8]],
    n: 'Руки сводятся перед грудью по дуге' },
  one_arm_row: { s: [80, 80, 110, 0, 0, 15, -10], e: [80, 80, 110, -110, 10, 15, -10],
    q: [['l', 96, 96, 130, 96]] },
  straight_arm: { s: [...ST(), 150, 150, 0, 0], e: [...ST(), 10, 10, 0, 0], q: [['k', 104, 4]] },
  squat: { s: [...ST(), 30, 100, 0, 0], e: [55, 100, 150, 30, 100, 80, -20] },
  abduct: { s: [60, 100, 180, 30, 60, 90, 0], e: [60, 100, 180, 30, 60, 75, 0], q: SEAT,
    n: 'Ноги разводятся в стороны (вид сверху на колени)' },
  calf_raise: { s: [70, 78, 180, 0, 0, 0, 0], e: [70, 70, 180, 0, 0, 0, 0],
    n: 'Подъём на носки — до упора, пауза вверху' },
  bridge: { s: [84, 112, 270, 90, 90, 125, 20], e: [84, 92, 302, 100, 90, 95, 0],
    q: [['l', 14, 122, 138, 122]], nf: true },
  rear_fly: { s: [60, 100, 175, 95, 95, 90, 0], e: [60, 100, 175, 30, 60, 90, 0], q: SEAT,
    n: 'Руки разводятся назад и в стороны, лопатки сводятся' },
  curl_stand: { s: [...ST(), 0, 0, 0, 0], e: [...ST(), 0, 150, 0, 0] },
  dip: { s: [60, 94, 180, 0, 0, 10, -20], e: [60, 112, 180, -60, 57, 10, -20],
    q: [['l', 56, 99, 80, 99]] },
  overhead_ext: { s: [...ST(), 175, -30, 0, 0], e: [...ST(), 175, 175, 0, 0] },
  plank: { s: [62, 98, 95, 0, 90, -90, -90], e: [62, 98, 95, 0, 90, -90, -90], st: true,
    n: 'Держите тело прямой линией 30–60 секунд' },
  crunch_mat: { s: [84, 112, 272, -110, -20, 125, 20], e: [84, 112, 235, -110, -20, 125, 20],
    q: [['l', 14, 122, 138, 122]], nf: true },
  crunch_cable: { s: [60, 100, 165, 80, -130, 0, -90], e: [60, 100, 100, 80, -130, 0, -90], q: [['k', 40, 4]] },
  twist: { s: [60, 105, 215, 100, 100, 130, 40], e: [60, 105, 215, 60, 60, 130, 40],
    n: 'Корпус поворачивается влево и вправо' },
};

export const DIAGRAM_IDS = Object.keys(POSES);

const wrap = body =>
  `<svg viewBox="0 0 330 176" role="img" class="diagram">${body}</svg>`;

export function renderDiagram(id) {
  const d = POSES[id];
  if (!d) {
    return wrap(`<text x="165" y="86" text-anchor="middle" class="d-label">Старт — Конец</text>`);
  }
  const eq = d.q ?? [];
  const floor = !d.nf;
  const left = figure(d.s, eq, 4, floor);
  const right = d.st ? '' : figure(d.e, eq, 170, floor);
  const arrow = d.st ? '' : `<path d="M154 78 h18 m-6 -6 l6 6 l-6 6" class="d-arrow"/>`;
  const label = (x, t) => `<text x="${x}" y="14" class="d-label">${t}</text>`;
  const note = d.n ? `<text x="165" y="170" text-anchor="middle" class="d-note">${d.n}</text>` : '';
  return wrap(
    `${left}${right}${arrow}${label(8, 'Старт')}${label(174, d.st ? 'Конец' : 'Конец')}${note}`);
}

export const DIAGRAM_CSS = `
.diagram{width:100%;height:auto;color:var(--fg,#e8ecf3)}
.diagram .d-body,.diagram .d-arm{stroke:currentColor;stroke-width:4;stroke-linecap:round;stroke-linejoin:round;fill:none}
.diagram .d-arm{stroke:var(--accent,#9be15d)}
.diagram .d-head{fill:none;stroke:currentColor;stroke-width:3}
.diagram .d-hand{fill:var(--accent,#9be15d)}
.diagram .d-eq{stroke:var(--muted,#7d8aa3);stroke-width:5;stroke-linecap:round}
.diagram .d-cable{stroke:var(--muted,#7d8aa3);stroke-width:1.5;stroke-dasharray:3 3}
.diagram .d-floor{stroke:var(--muted,#7d8aa3);stroke-width:1.5}
.diagram .d-arrow{stroke:var(--accent,#9be15d);stroke-width:2.5;fill:none;stroke-linecap:round}
.diagram .d-label{fill:var(--muted,#7d8aa3);font:600 11px system-ui,sans-serif}
.diagram .d-note{fill:var(--muted,#7d8aa3);font:11px system-ui,sans-serif}
`;
