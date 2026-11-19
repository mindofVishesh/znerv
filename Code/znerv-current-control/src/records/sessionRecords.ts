import { isCurrentTargetMa, type CurrentTargetMa } from '../domain/currentTargets.ts';
import type { DeviceStatus } from '../domain/session.ts';
import { SESSION_SECONDS } from '../domain/session.ts';
import { mockGateway } from '../services/mockGateway.ts';

export type MoodChoice = 'Calm' | 'Okay' | 'Anxious' | 'Prefer not to say';
export type RecordOutcome = 'in-progress' | 'completed' | 'stopped-by-user' | 'fault' | 'unknown';
export interface SessionRecord {
  id: string;
  startedAt: string;
  endedAt: string | null;
  /** Simulated elapsed time sampled while reporting was available, not verified device runtime. */
  observedDurationSeconds: number;
  outcome: RecordOutcome;
  reason: string | null;
  beforeMood: MoodChoice | null;
  afterMood: MoodChoice | null;
  provenance: 'simulated';
  /** Requested simulated target; absent from older demo records. Not measured current. */
  requestedCurrentMa?: CurrentTargetMa | null;
}
interface RecordData { version: 1; sessions: SessionRecord[]; pendingBeforeMood: MoodChoice | null; }
export interface StoragePort { getItem(key: string): string | null; setItem(key: string, value: string): void; }
export const STORAGE_KEY = 'znerv.demo.records.v1';
const EMPTY: RecordData = { version: 1, sessions: [], pendingBeforeMood: null };
const allowedMoods = new Set<MoodChoice>(['Calm','Okay','Anxious','Prefer not to say']);
const allowedOutcomes = new Set<RecordOutcome>(['in-progress','completed','stopped-by-user','fault','unknown']);
function validRecord(value: unknown): value is SessionRecord {
  if (!value || typeof value !== 'object') return false;
  const r = value as Partial<SessionRecord>;
  return typeof r.id === 'string' && typeof r.startedAt === 'string' && !Number.isNaN(Date.parse(r.startedAt)) &&
    (r.endedAt === null || (typeof r.endedAt === 'string' && !Number.isNaN(Date.parse(r.endedAt)))) &&
    typeof r.observedDurationSeconds === 'number' && Number.isInteger(r.observedDurationSeconds) && r.observedDurationSeconds >= 0 && r.observedDurationSeconds <= SESSION_SECONDS.total &&
    allowedOutcomes.has(r.outcome as RecordOutcome) && (r.reason === null || typeof r.reason === 'string') &&
    (r.beforeMood === null || allowedMoods.has(r.beforeMood as MoodChoice)) &&
    (r.afterMood === null || allowedMoods.has(r.afterMood as MoodChoice)) && r.provenance === 'simulated' && (r.requestedCurrentMa === undefined || r.requestedCurrentMa === null || isCurrentTargetMa(r.requestedCurrentMa));
}
function load(storage?: StoragePort): RecordData {
  if (!storage) return { ...EMPTY, sessions: [] };
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY, sessions: [] };
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return { ...EMPTY, sessions: [] };
    const p = parsed as Partial<RecordData>;
    if (p.version !== 1 || !Array.isArray(p.sessions)) return { ...EMPTY, sessions: [] };
    return {
      version: 1,
      sessions: p.sessions.filter(validRecord).slice(0, 500),
      pendingBeforeMood: allowedMoods.has(p.pendingBeforeMood as MoodChoice) ? p.pendingBeforeMood! : null,
    };
  } catch { return { ...EMPTY, sessions: [] }; }
}
export class SessionRecordStore {
  private data: RecordData;
  private listeners = new Set<() => void>();
  private storage?: StoragePort;
  private previousPhase = 'unknown';
  private lastKnownElapsed = 0;
  constructor(storage?: StoragePort) {
    this.storage = storage;
    this.data = load(storage);
    // An earlier browser instance is not evidence that a session completed or stopped.
    let recovered = false;
    this.data = {
      ...this.data,
      sessions: this.data.sessions.map(r => {
        if (r.outcome !== 'in-progress') return r;
        recovered = true;
        return { ...r, outcome: 'unknown' as const, reason: 'Browser reloaded or reporting ended; final outcome is unknown.' };
      }),
    };
    if (recovered) this.save();
  }
  getSnapshot = (): RecordData => this.data;
  subscribe = (listener: () => void): (() => void) => { this.listeners.add(listener); return () => this.listeners.delete(listener); };
  private save() { try { this.storage?.setItem(STORAGE_KEY, JSON.stringify(this.data)); } catch { /* Storage can be disabled or full; state remains in memory. */ } }
  private update(next: RecordData) { this.data = next; this.save(); for (const fn of this.listeners) fn(); }
  setBeforeMood(mood: MoodChoice | null) {
    if (mood !== null && !allowedMoods.has(mood)) throw new RangeError('Invalid mood choice');
    this.update({ ...this.data, pendingBeforeMood: mood });
  }
  setAfterMood(id: string, mood: MoodChoice | null) {
    if (mood !== null && !allowedMoods.has(mood)) throw new RangeError('Invalid mood choice');
    if (!this.data.sessions.some(r => r.id === id && r.outcome !== 'in-progress')) return;
    this.update({ ...this.data, sessions: this.data.sessions.map(r => r.id === id ? { ...r, afterMood: mood } : r) });
  }
  /** Receives status transitions ONLY from the in-browser mock gateway. */
  ingest(status: DeviceStatus) {
    const phase = status.phase;
    const connected = status.connection === 'connected';
    const ongoing = this.data.sessions.find(r => r.outcome === 'in-progress');
    if (connected && phase === 'ramp-up' && this.previousPhase === 'start-pending' && !ongoing) {
      const startedAt = status.lastUpdatedAt ?? new Date().toISOString();
      const record: SessionRecord = {
        id: globalThis.crypto?.randomUUID?.() ?? `demo-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        startedAt, endedAt: null, observedDurationSeconds: 0, outcome: 'in-progress', reason: null,
        beforeMood: this.data.pendingBeforeMood, afterMood: null, provenance: 'simulated',
        requestedCurrentMa: isCurrentTargetMa(status.requestedCurrentMa) ? status.requestedCurrentMa : null,
      };
      this.lastKnownElapsed = 0;
      this.update({ version: 1, sessions: [record, ...this.data.sessions].slice(0, 500), pendingBeforeMood: null });
    } else if (ongoing) {
      if (status.remainingSeconds !== null && Number.isFinite(status.remainingSeconds)) {
        this.lastKnownElapsed = Math.max(this.lastKnownElapsed, Math.min(SESSION_SECONDS.total, Math.floor(SESSION_SECONDS.total - status.remainingSeconds)));
      }
      let outcome: RecordOutcome | null = null;
      let reason: string | null = null;
      if (phase === 'completed') outcome = 'completed';
      else if (phase === 'interrupted') { outcome = 'stopped-by-user'; reason = 'Stopped by user in mock simulation.'; }
      else if (phase === 'fault' || status.connection === 'fault') { outcome = 'fault'; reason = 'Mock fault; physical output status is unknown.'; }
      else if (phase === 'unknown' || !connected) { outcome = 'unknown'; reason = 'Mock connection lost or reporting unavailable; outcome cannot be confirmed.'; }
      const observedDurationSeconds = outcome === 'completed' ? SESSION_SECONDS.total : this.lastKnownElapsed;
      if (outcome || observedDurationSeconds !== ongoing.observedDurationSeconds) {
        this.update({ ...this.data, sessions: this.data.sessions.map(r => r.id === ongoing.id ? {
          ...r, observedDurationSeconds, outcome: outcome ?? r.outcome,
          reason: outcome ? reason : r.reason,
          endedAt: outcome && outcome !== 'unknown' ? (status.lastUpdatedAt ?? new Date().toISOString()) : r.endedAt,
        } : r) });
      }
    }
    this.previousPhase = phase;
  }
}
function browserStorage(): StoragePort | undefined {
  try { return typeof window === 'undefined' ? undefined : window.localStorage; } catch { return undefined; }
}
export const sessionRecordStore = new SessionRecordStore(browserStorage());
mockGateway.subscribe(() => sessionRecordStore.ingest(mockGateway.getSnapshot()));
