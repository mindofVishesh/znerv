import test from 'node:test';
import assert from 'node:assert/strict';
import { MockGateway } from '../src/services/mockGateway.ts';

test('mock adapter starts disconnected and does not invent physical status', () => {
  const gateway = new MockGateway();
  assert.equal(gateway.getSnapshot().phase,'unknown');
  assert.equal(gateway.getSnapshot().provenance,'unavailable');
  assert.equal(gateway.getSnapshot().remainingSeconds,null);
});
test('demo start is pending before a simulated confirmation', async () => {
  const gateway = new MockGateway();
  gateway.connectDemo();
  const request = gateway.requestStart(2.5);
  assert.equal(gateway.getSnapshot().phase,'start-pending');
  assert.equal(await request,true);
  assert.equal(gateway.getSnapshot().phase,'ramp-up');
  gateway.disconnectDemo();
  assert.equal(gateway.getSnapshot().phase,'unknown');
  assert.equal(gateway.getSnapshot().remainingSeconds,null);
});
test('stop confirmation is explicit and produces interrupted, never completed', async () => {
  const gateway = new MockGateway();
  gateway.connectDemo();
  assert.equal(await gateway.requestStart(2.5),true);
  const stopped = gateway.requestStop();
  assert.equal(gateway.getSnapshot().phase,'stop-pending');
  assert.equal(await stopped,true);
  assert.equal(gateway.getSnapshot().phase,'interrupted');
});
test('disconnect during pending start invalidates the acknowledgement', async () => {
  const gateway = new MockGateway();
  gateway.connectDemo();
  const pending = gateway.requestStart(2.5);
  gateway.disconnectDemo();
  assert.equal(await pending,false);
  assert.equal(gateway.getSnapshot().phase,'unknown');
});
test('fault interrupts mock reporting without asserting physical shutdown', () => {
  const gateway = new MockGateway();
  gateway.connectDemo(); gateway.injectFault();
  assert.equal(gateway.getSnapshot().phase,'fault');
  assert.equal(gateway.getSnapshot().connection,'fault');
  assert.match(gateway.getSnapshot().faultMessage,/No physical shutdown is verified/);
});
