import type { SessionPhase } from './session.ts';
import { SESSION_SECONDS } from './session.ts';

/** A display-only timeline. Hardware must report authoritative phase and timing in production. */
export function getMockTimeline(elapsedMs: number): { phase: SessionPhase; remainingSeconds: number; elapsedSeconds: number } {
  const elapsedSeconds = Math.min(SESSION_SECONDS.total, Math.max(0, Math.floor(elapsedMs / 1000)));
  const remainingSeconds = SESSION_SECONDS.total - elapsedSeconds;
  const phase: SessionPhase = elapsedSeconds >= SESSION_SECONDS.total ? 'completed'
    : elapsedSeconds < SESSION_SECONDS.rampUp ? 'ramp-up'
    : elapsedSeconds < SESSION_SECONDS.rampUp + SESSION_SECONDS.active ? 'active' : 'ramp-down';
  return { phase, remainingSeconds, elapsedSeconds };
}
export function canRequestStart(phase: SessionPhase, connected: boolean): boolean {
  return connected && (phase === 'idle' || phase === 'completed' || phase === 'interrupted');
}
export function canRequestStop(phase: SessionPhase, connected: boolean): boolean {
  return connected && (phase === 'ramp-up' || phase === 'active' || phase === 'ramp-down');
}
export function phaseLabel(phase: SessionPhase): string {
  const names: Record<SessionPhase,string> = {
    idle:'Ready to begin', 'start-pending':'Start requested', 'safety-check':'Checking readiness', 'ramp-up':'Ramp up',
    active:'In progress · main session', 'ramp-down':'Ramp down', 'stop-pending':'Stop requested',
    completed:'Session completed', interrupted:'Session interrupted', fault:'Demo fault', unknown:'Status unknown',
  };
  return names[phase];
}
