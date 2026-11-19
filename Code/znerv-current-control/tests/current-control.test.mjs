import test from 'node:test';
import assert from 'node:assert/strict';
import { CURRENT_TARGETS_MA, DEFAULT_CURRENT_TARGET_MA, isCurrentTargetMa, formatCurrentTarget } from '../src/domain/currentTargets.ts';
import { MockGateway } from '../src/services/mockGateway.ts';
import { SessionRecordStore } from '../src/records/sessionRecords.ts';

test('exactly six current targets, range 1.5–4.0 mA in 0.5 steps', () => {
  assert.deepEqual([...CURRENT_TARGETS_MA], [1.5, 2, 2.5, 3, 3.5, 4]);
  assert.equal(DEFAULT_CURRENT_TARGET_MA,2.5);
  assert.equal(formatCurrentTarget(3),'3.0 mA');
  for (const v of CURRENT_TARGETS_MA) assert.equal(isCurrentTargetMa(v),true);
  for (const v of [1,1.75,2.25,4.5,NaN,'2.5',null]) assert.equal(isCurrentTargetMa(v),false);
});
test('mock gateway rejects invalid targets and does not start', async () => {
  const gateway = new MockGateway(); gateway.connectDemo();
  assert.equal(await gateway.requestStart(4.5),false);
  assert.equal(gateway.getSnapshot().phase,'idle');
  assert.equal(gateway.getSnapshot().requestedCurrentMa,null);
});
test('mock accepts each valid target and exposes requested not measured current', async () => {
  for (const target of CURRENT_TARGETS_MA) {
    const gateway=new MockGateway(); gateway.connectDemo();
    const pending=gateway.requestStart(target);
    assert.equal(gateway.getSnapshot().phase,'start-pending');
    assert.equal(gateway.getSnapshot().requestedCurrentMa,target);
    assert.equal(await pending,true);
    assert.equal(gateway.getSnapshot().requestedCurrentMa,target);
    gateway.disconnectDemo();
  }
});
test('record snapshots requested target on simulated start, preserving earlier records', () => {
  const storage={getItem:()=>null,setItem:()=>{}};
  const store=new SessionRecordStore(storage);
  const make=(phase, target)=>({phase,connection:'connected',provenance:'simulated',requestedCurrentMa:target,remainingSeconds:1260,lastUpdatedAt:'2026-11-15T12:00:00.000Z',faultMessage:null});
  store.ingest(make('idle',null));store.ingest(make('start-pending',3.5));store.ingest(make('ramp-up',3.5));
  assert.equal(store.getSnapshot().sessions[0].requestedCurrentMa,3.5);
});
