import test from 'node:test';
import assert from 'node:assert/strict';
import { getMockTimeline, canRequestStart, canRequestStop, phaseLabel } from '../src/domain/sessionLogic.ts';

test('mock timeline transitions exactly at phase boundaries', () => {
  assert.deepEqual(getMockTimeline(0), { phase:'ramp-up', remainingSeconds:1260, elapsedSeconds:0 });
  assert.equal(getMockTimeline(29_999).phase, 'ramp-up');
  assert.equal(getMockTimeline(30_000).phase, 'active');
  assert.equal(getMockTimeline(1_229_999).phase, 'active');
  assert.equal(getMockTimeline(1_230_000).phase, 'ramp-down');
  assert.deepEqual(getMockTimeline(1_260_000), { phase:'completed', remainingSeconds:0, elapsedSeconds:1260 });
});
test('mock timeline is clamped at zero and the end', () => {
  assert.equal(getMockTimeline(-20).remainingSeconds,1260);
  assert.equal(getMockTimeline(2_000_000).remainingSeconds,0);
});
test('commands are refused when unknown, disconnected, or pending', () => {
  assert.equal(canRequestStart('unknown',true),false);
  assert.equal(canRequestStart('idle',false),false);
  assert.equal(canRequestStart('idle',true),true);
  assert.equal(canRequestStop('ramp-up',true),true);
  assert.equal(canRequestStop('stop-pending',true),false);
  assert.equal(canRequestStop('active',false),false);
  assert.equal(phaseLabel('fault'),'Demo fault');
});
