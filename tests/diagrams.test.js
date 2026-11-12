import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderDiagram, DIAGRAM_IDS } from '../js/diagrams.js';
import { EXERCISES } from '../js/data/exercises.js';

test('every exercise diagram id has a pose', () => {
  for (const e of EXERCISES) assert.ok(DIAGRAM_IDS.includes(e.diagram), `${e.id} -> ${e.diagram}`);
});

test('renderDiagram returns svg string for each id', () => {
  for (const id of DIAGRAM_IDS) {
    const s = renderDiagram(id);
    assert.ok(s.startsWith('<svg'), id);
    assert.ok(s.includes('Старт') && s.includes('Конец'), id);
    assert.ok(!s.includes('NaN') && !s.includes('undefined'), id);
  }
});

test('unknown id returns fallback svg without throwing', () => {
  const s = renderDiagram('zzz');
  assert.ok(s.startsWith('<svg'));
});

test('no external references in svg', () => {
  for (const id of DIAGRAM_IDS) assert.ok(!/https?:|href=/.test(renderDiagram(id)), id);
});
