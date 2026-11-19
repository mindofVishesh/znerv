import { isCurrentTargetMa, type CurrentTargetMa } from '../domain/currentTargets.ts';
import { SESSION_SECONDS, type DeviceStatus, type SessionPhase } from '../domain/session.ts';
import { canRequestStart, canRequestStop, getMockTimeline } from '../domain/sessionLogic.ts';

/**
 * UI-only simulation adapter. It does not use BLE, serial, DAC, network, or electrical hardware.
 * All confirmations explicitly apply to the simulated adapter, NEVER physical output.
 */
export class MockGateway {
  private status: DeviceStatus = { connection: 'not-connected', phase: 'unknown', provenance: 'unavailable', lastUpdatedAt: null, remainingSeconds: null, faultMessage: null, requestedCurrentMa: null };
  private listeners = new Set<() => void>();
  private startedAt: number | null = null;
  private interval: ReturnType<typeof setInterval> | null = null;
  private revision = 0;
  private commandInFlight = false;
  private lastPhase: SessionPhase = 'unknown';
  getSnapshot = (): DeviceStatus => this.status;
  subscribe = (listener: () => void): (() => void) => { this.listeners.add(listener); return () => this.listeners.delete(listener); };
  private publish(status: DeviceStatus) { this.status = status; for (const listener of this.listeners) listener(); }
  private update(patch: Partial<DeviceStatus>) { this.publish({ ...this.status, ...patch, lastUpdatedAt: new Date().toISOString() }); }
  private clearClock() { if (this.interval) clearInterval(this.interval); this.interval = null; this.startedAt = null; }

  /** Connects a DEMO adapter only. It is not a physical device handshake. */
  connectDemo() {
    this.revision++;
    this.clearClock(); this.commandInFlight = false;
    this.lastPhase = 'idle';
    this.update({ connection:'connected', provenance:'simulated', phase:'idle', remainingSeconds:SESSION_SECONDS.total, faultMessage:null, requestedCurrentMa:null });
  }
  /** Loss of reporting makes control state unknown, not safely stopped. */
  disconnectDemo() {
    this.revision++;
    this.clearClock(); this.commandInFlight = false;
    this.lastPhase = 'unknown';
    this.update({ connection:'not-connected', provenance:'unavailable', phase:'unknown', remainingSeconds:null, faultMessage:'No demo status is available. Physical device state is unknown.' });
  }
  injectFault() {
    this.revision++;
    this.clearClock(); this.commandInFlight = false;
    this.lastPhase = 'fault';
    this.update({ connection:'fault', phase:'fault', remainingSeconds:null, faultMessage:'Simulated demo fault. No physical shutdown is verified.' });
  }
  resetDemo() { this.connectDemo(); }
  async requestStart(requestedCurrentMa: CurrentTargetMa): Promise<boolean> {
    if (!isCurrentTargetMa(requestedCurrentMa)) return false;
    if (this.commandInFlight || !canRequestStart(this.status.phase, this.status.connection === 'connected')) return false;
    const revision = ++this.revision;
    this.commandInFlight = true;
    this.update({ phase:'start-pending', remainingSeconds:SESSION_SECONDS.total, faultMessage:null, requestedCurrentMa });
    await new Promise<void>(resolve => setTimeout(resolve, 500));
    if (revision !== this.revision || this.status.connection !== 'connected') return false;
    this.commandInFlight = false;
    this.startedAt = Date.now(); this.lastPhase = 'ramp-up';
    this.update({ phase:'ramp-up', remainingSeconds:SESSION_SECONDS.total });
    this.interval = setInterval(() => this.tick(), 250);
    return true;
  }
  async requestStop(): Promise<boolean> {
    if (this.commandInFlight || !canRequestStop(this.status.phase, this.status.connection === 'connected')) return false;
    const revision = ++this.revision;
    this.commandInFlight = true;
    this.update({ phase:'stop-pending' });
    await new Promise<void>(resolve => setTimeout(resolve, 500));
    if (revision !== this.revision || this.status.connection !== 'connected') return false;
    this.commandInFlight = false;
    this.clearClock(); this.lastPhase = 'interrupted';
    this.update({ phase:'interrupted', faultMessage:'Stopped by user in the simulation. Physical output was never controlled.' });
    return true;
  }
  private tick() {
    if (this.startedAt === null || this.status.connection !== 'connected' || this.commandInFlight) return;
    const next = getMockTimeline(Date.now() - this.startedAt);
    if (next.phase !== this.lastPhase || next.remainingSeconds !== this.status.remainingSeconds) {
      this.lastPhase = next.phase;
      this.update({ phase:next.phase, remainingSeconds:next.remainingSeconds });
    }
    if (next.phase === 'completed') this.clearClock();
  }
}
/** Shared adapter survives navigation but not browser reload. No persistence is claimed. */
export const mockGateway = new MockGateway();
