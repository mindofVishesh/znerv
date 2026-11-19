import { useState } from 'react';
import { MoodCheckIn } from '../components/MoodCheckIn';
import { formatDuration } from '../domain/session';
import { formatCurrentTarget, isCurrentTargetMa } from '../domain/currentTargets';
import { useSessionRecords } from '../hooks/useSessionRecords';
import type { RecordOutcome, SessionRecord } from '../records/sessionRecords';

const outcomeLabels: Record<RecordOutcome,string> = {
  'in-progress':'In progress (simulated)', completed:'Completed (simulated)',
  'stopped-by-user':'Stopped by user', fault:'Demo fault', unknown:'Outcome unknown',
};
function displayDate(iso: string) {
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? 'Date unavailable' : new Intl.DateTimeFormat(undefined, { dateStyle:'medium', timeStyle:'short' }).format(parsed);
}
function Detail({record}: {record: SessionRecord}) {
  return <div className="record-details">
    <dl>
      <div><dt>Started</dt><dd>{displayDate(record.startedAt)}</dd></div>
      <div><dt>End time</dt><dd>{record.endedAt ? displayDate(record.endedAt) : 'Not confirmed'}</dd></div>
      <div><dt>Requested current target</dt><dd>{isCurrentTargetMa(record.requestedCurrentMa) ? formatCurrentTarget(record.requestedCurrentMa) : 'Not recorded (legacy demo)'}</dd></div>
      <div><dt>Observed demo duration</dt><dd>{formatDuration(record.observedDurationSeconds)}</dd></div>
      <div><dt>Outcome</dt><dd>{outcomeLabels[record.outcome]}</dd></div>
      <div><dt>Interruption reason</dt><dd>{record.reason ?? 'None recorded'}</dd></div>
      <div><dt>Before mood</dt><dd>{record.beforeMood ?? 'Not recorded'}</dd></div>
      <div><dt>After mood</dt><dd>{record.afterMood ?? 'Not recorded'}</dd></div>
      <div><dt>Source</dt><dd>Browser simulation, not device verified</dd></div>
    </dl>
    {record.outcome !== 'in-progress' && <MoodCheckIn key={record.id} kind="after" sessionId={record.id}/>}
  </div>;
}
export function HistoryPage() {
  const {sessions} = useSessionRecords();
  const [expanded, setExpanded] = useState<string | null>(null);
  return <main id="main-content" className="page-shell" tabIndex={-1}>
    <div className="page-heading"><p className="eyebrow">SESSION RECORDS</p><h1>Session history</h1><p>Review simulated sessions, timing, outcomes, and optional check-ins.</p></div>
    <div className="demo-banner" role="note"><strong>LOCAL DEMO RECORDS</strong><span>Stored only in this browser. Records are simulated and are not clinical records or verified device logs.</span></div>
    {sessions.length === 0 ? <section className="session-card empty-state" aria-labelledby="history-title"><div className="side-icon" aria-hidden="true">▤</div><h2 id="history-title">No sessions yet</h2><p>Connect the demo adapter on the Session page and start a simulated session. This page will show saved records once a start is confirmed.</p></section> :
    <section className="session-card history-card" aria-label="Recorded demo sessions"><p className="history-count">{sessions.length} demo {sessions.length === 1 ? 'session' : 'sessions'} recorded</p><ul className="record-list">{sessions.map(r => <li className="record-item" key={r.id}>
      <button type="button" aria-expanded={expanded === r.id} aria-controls={`details-${r.id}`} className="record-trigger" onClick={() => setExpanded(expanded === r.id ? null : r.id)}>
        <span><strong>{displayDate(r.startedAt)}</strong><span className="record-outcome" data-outcome={r.outcome}>{outcomeLabels[r.outcome]}</span></span>
        <span className="record-trailing"><span>{formatDuration(r.observedDurationSeconds)} observed</span><span aria-hidden="true">{expanded === r.id ? '−' : '+'}</span></span>
      </button>
      {expanded === r.id && <div id={`details-${r.id}`}><Detail record={r}/></div>}
    </li>)}</ul></section>}
    <p className="disclaimer">Duration reflects the latest reported mock timeline value, not measured stimulation time. An unknown outcome is not proof that physical output stopped.</p>
  </main>;
}
