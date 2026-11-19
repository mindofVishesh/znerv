import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const content = readFileSync(new URL('../src/domain/session.ts', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/styles/tokens.css', import.meta.url), 'utf8');
test('configured planned timing has 30s, 1200s, 30s and 1260s total', () => {
  assert.match(content, /rampUp: 30/);
  assert.match(content, /active: 20 \* 60/);
  assert.match(content, /rampDown: 30/);
  assert.match(content, /total: 21 \* 60/);
});
test('initial status is disconnected, unknown, and has no telemetry', () => {
  assert.match(content, /connection: 'not-connected'/);
  assert.match(content, /phase: 'unknown'/);
  assert.match(content, /remainingSeconds: null/);
});
test('separate green start and red stop tokens are defined', () => {
  assert.match(css, /--action-start: #176c3b/);
  assert.match(css, /--action-stop: #b42332/);
});
