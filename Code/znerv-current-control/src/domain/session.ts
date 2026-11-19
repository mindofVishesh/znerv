/** Planned session contract. Never infer physical output from this browser model. */
export const SESSION_SECONDS = Object.freeze({
  rampUp: 30,
  active: 20 * 60,
  rampDown: 30,
  total: 21 * 60,
});

import type { CurrentTargetMa } from './currentTargets.ts';

export type DeviceConnection = 'not-connected' | 'connecting' | 'connected' | 'stale' | 'fault';
export type SessionPhase =
  | 'idle' | 'start-pending' | 'safety-check' | 'ramp-up' | 'active'
  | 'ramp-down' | 'stop-pending' | 'completed' | 'interrupted'
  | 'fault' | 'unknown';

export type DataProvenance = 'unavailable' | 'simulated' | 'device-reported';

export interface DeviceStatus {
  connection: DeviceConnection;
  phase: SessionPhase;
  provenance: DataProvenance;
  lastUpdatedAt: string | null;
  remainingSeconds: number | null;
  faultMessage: string | null;
  /** User-requested target only; not measured or delivered current. */
  requestedCurrentMa: CurrentTargetMa | null;
}

/** Explicitly disconnected until a verified gateway is implemented. */
export const INITIAL_DEVICE_STATUS: DeviceStatus = {
  connection: 'not-connected',
  phase: 'unknown',
  provenance: 'unavailable',
  lastUpdatedAt: null,
  remainingSeconds: null,
  faultMessage: null,
  requestedCurrentMa: null,
};

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) throw new RangeError('Invalid duration');
  const rounded = Math.ceil(seconds);
  return `${String(Math.floor(rounded / 60)).padStart(2, '0')}:${String(rounded % 60).padStart(2, '0')}`;
}
