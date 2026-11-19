import { useState } from 'react';
import { CURRENT_TARGETS_MA, DEFAULT_CURRENT_TARGET_MA, formatCurrentTarget, isCurrentTargetMa, type CurrentTargetMa } from '../domain/currentTargets';
import { formatDuration, SESSION_SECONDS } from '../domain/session';
import { canRequestStart, canRequestStop, phaseLabel } from '../domain/sessionLogic';
import { useMockStatus } from '../hooks/useMockStatus';
import { mockGateway } from '../services/mockGateway';
import { StopDialog } from '../components/StopDialog';
import { MoodCheckIn } from '../components/MoodCheckIn';
import { useSessionRecords } from '../hooks/useSessionRecords';

const activePhases = new Set(['ramp-up','active','ramp-down','stop-pending']);
export function SessionPage() {
  const status = useMockStatus();
  const records = useSessionRecords();
  const latest = records.sessions[0];
  const [selectedCurrentMa, setSelectedCurrentMa] = useState<CurrentTargetMa>(DEFAULT_CURRENT_TARGET_MA);
  const [showStopDialog, setShowStopDialog] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const [commandMessage, setCommandMessage] = useState('');
  const connected = status.connection === 'connected';
  const startEnabled = canRequestStart(status.phase, connected);
  const stopEnabled = canRequestStop(status.phase, connected);
  const isActive = activePhases.has(status.phase);
  const selectionLocked = !['idle','completed','interrupted'].includes(status.phase) || showStopDialog;
  const reportedTarget = status.requestedCurrentMa;
  const seconds = status.remainingSeconds;
  const hasTime = seconds !== null;
  const elapsed = hasTime ? SESSION_SECONDS.total - seconds : 0;
  const percent = hasTime ? Math.max(0, Math.min(100, elapsed / SESSION_SECONDS.total * 100)) : 0;
  const humanPhase = phaseLabel(status.phase);
  const isPending = status.phase === 'start-pending' || status.phase === 'stop-pending';
  const isUnknown = status.phase === 'unknown' || status.connection !== 'connected';

  async function startDemo() {
    setCommandMessage('Start request pending — waiting for the mock adapter.');
    const confirmed = await mockGateway.requestStart(selectedCurrentMa);
    setCommandMessage(confirmed ? `Mock start acknowledged for a ${formatCurrentTarget(selectedCurrentMa)} target; actual current is unmeasured.` : 'Mock start was not confirmed. Status may have changed.');
    setAnnouncement(confirmed ? 'Simulated ramp up started.' : 'Start not confirmed.');
  }
  async function stopDemo() {
    setShowStopDialog(false);
    setCommandMessage('Stop request pending — simulation has not yet confirmed it.');
    const confirmed = await mockGateway.requestStop();
    setCommandMessage(confirmed ? 'Stop confirmed by mock adapter only; no physical output is verified.' : 'Stop was not confirmed; the actual device state remains unknown.');
    setAnnouncement(confirmed ? 'Simulated session interrupted.' : 'Stop not confirmed.');
  }
  function connect() { mockGateway.connectDemo(); setCommandMessage('Demo adapter connected. No physical device is connected.'); setAnnouncement('Demo adapter ready.'); }
  function disconnect() { mockGateway.disconnectDemo(); setShowStopDialog(false); setCommandMessage('Demo disconnected. Physical status and output are unknown.'); setAnnouncement('Demo connection lost. Status unknown.'); }
  function fault() { mockGateway.injectFault(); setShowStopDialog(false); setCommandMessage('Simulated fault injected. No physical shutdown confirmation exists.'); setAnnouncement('Demo fault.'); }
  return <main id="main-content" className="page-shell" tabIndex={-1}>
    <div className="page-heading"><p className="eyebrow">SESSION CARE</p><h1>Your session</h1><p>One 21-minute program with a selectable simulated current target.</p></div>
    <div className="demo-banner" role="note"><strong>SIMULATION ONLY</strong><span>Interactive frontend demo. No BLE, hardware control, electrical measurements, or verified stimulation output.</span></div>
    <div className="content-grid">
      <section className="session-card" aria-labelledby="session-overview">
        <div className="card-topline"><span className="phase-pill" data-phase={status.phase}>{humanPhase}</span><span className="mode-pill">Mock adapter</span></div>
        <h2 className="section-title" id="session-overview">Session overview</h2>
        <fieldset className="current-control" disabled={selectionLocked}>
          <legend>Requested current target</legend>
          <p id="current-control-help">Select a simulation target from 1.5 to 4.0 mA in 0.5 mA steps. This is not a measured or delivered current. Changes are disabled once a start is requested.</p>
          <div className="current-options" role="group" aria-describedby="current-control-help">
            {CURRENT_TARGETS_MA.map(value => <label className={`current-option ${selectedCurrentMa === value ? 'current-option-selected' : ''}`} key={value}>
              <input type="radio" name="requested-current" value={value} checked={selectedCurrentMa === value} onChange={() => setSelectedCurrentMa(value)} />
              <span>{formatCurrentTarget(value)}</span>
            </label>)}
          </div>
        </fieldset>
        <div className="target-feedback" role="status">{reportedTarget !== null && status.phase !== 'idle' && status.phase !== 'unknown'
          ? `Mock session target requested: ${formatCurrentTarget(reportedTarget)}. Actual output: not measured.`
          : `Next simulated session target: ${formatCurrentTarget(selectedCurrentMa)}. No electrical output is commanded.`}</div>
        <div className="timer" role="timer" aria-label={hasTime ? `Simulated time remaining ${formatDuration(seconds)}` : 'Time unavailable'}>{hasTime ? formatDuration(seconds) : '--:--'}</div>
        <p className="timer-caption">{hasTime ? (isActive || isPending ? 'Simulated time remaining' : 'Preset session duration / last simulated value') : 'Device-backed time unavailable'}</p>
        <div className="phase-track" role="progressbar" aria-label="Simulated session progress" aria-valuenow={hasTime ? Math.round(percent) : undefined} aria-valuemin={0} aria-valuemax={100} aria-valuetext={hasTime ? `${formatDuration(seconds)} remaining in simulation` : 'Unavailable'}>
          <span className="phase-track-up" /><span className="phase-track-active" /><span className="phase-track-down" />
          {hasTime && <span className="progress-mask" style={{ left: `${percent}%` }} aria-hidden="true" />}
        </div>
        <div className="phase-labels"><span>30s ramp up</span><span>20m active</span><span>30s ramp down</span></div>
        <div className="session-actions">
          {startEnabled && <button type="button" className="button button-start" onClick={startDemo}>Start session <span className="sr-only">in demo</span></button>}
          {stopEnabled && <button type="button" className="button button-stop" onClick={() => setShowStopDialog(true)}>Stop session <span className="sr-only">in demo</span></button>}
          {isPending && <button type="button" className="button button-secondary" disabled>{status.phase === 'start-pending' ? 'Start pending…' : 'Stop pending…'}</button>}
          {status.phase === 'completed' && <p className="result-message" role="status">The mock timeline finished. This does not confirm physical device output.</p>}
          {status.phase === 'interrupted' && <p className="result-message" role="status">The demo session was interrupted. See History for the saved simulated record.</p>}
          {isUnknown && <p className="result-message">Controls unavailable while reporting is unknown or disconnected.</p>}
        </div>
        <p className="control-helper">{isActive ? 'Stop requires confirmation. The clock reflects a mock timeline, not device telemetry.' : 'One fixed 21-minute program. Current target may be selected before a simulated start only.'}</p>
        {commandMessage && <div className="command-feedback" role="status">{commandMessage}</div>}
        <div className="sr-only" aria-live="polite" aria-atomic="true">{announcement}</div>
      </section>
      <aside className="side-card" aria-labelledby="device-heading">
        <div className="side-icon" aria-hidden="true">⌁</div>
        <h2 id="device-heading">Connection &amp; safety</h2>
        <div className="status-line"><span className="status-dot" data-connection={status.connection} aria-hidden="true"/><strong>{connected ? 'Demo connected' : status.connection === 'fault' ? 'Demo fault' : 'Not connected'}</strong></div>
        <p>{connected ? 'Mock telemetry only. Electrical output cannot be inferred.' : 'Physical stimulation status is unknown. The app is not connected to hardware.'}</p>
        <div className="status-detail"><span>Adapter</span><strong>Simulation</strong></div>
        <div className="status-detail"><span>Reported phase</span><strong>{humanPhase}</strong></div>
        <div className="status-detail"><span>Data source</span><strong>{status.provenance}</strong></div>
        <div className="status-detail"><span>Requested target</span><strong>{reportedTarget !== null && isCurrentTargetMa(reportedTarget) ? formatCurrentTarget(reportedTarget) : 'Not requested'}</strong></div>
        <div className="status-detail"><span>Measured current</span><strong>Unavailable</strong></div>
        <div className="status-detail"><span>Physical output</span><strong>Unknown</strong></div>
        {status.faultMessage && <div className="fault-notice" role="alert">{status.faultMessage}</div>}
        <div className="demo-controls"><h3>Demo tools</h3><p>These affect the mock adapter only.</p>
          {connected ? <button className="button button-secondary" type="button" onClick={disconnect}>Simulate disconnect</button> : <button className="button button-secondary" type="button" onClick={connect}>{status.connection === 'fault' ? 'Reset mock adapter' : 'Connect demo adapter'}</button>}
          {connected && <button className="button button-secondary" type="button" onClick={fault}>Inject demo fault</button>}
        </div>
      </aside>
    </div>
    <div className="session-checkin">
      {connected && (status.phase === 'idle' || status.phase === 'completed' || status.phase === 'interrupted') && <MoodCheckIn kind="before" key={`before-${latest?.id ?? 'new'}`}/>}
      {latest && latest.outcome !== 'in-progress' && status.phase !== 'idle' && <MoodCheckIn kind="after" sessionId={latest.id} key={`after-${latest.id}`}/>}
    </div>
    <p className="disclaimer">ZNERV is an unvalidated engineering prototype, not a clinically approved treatment. Do not connect experimental stimulation hardware to a person.</p>
    {showStopDialog && <StopDialog onCancel={() => setShowStopDialog(false)} onConfirm={stopDemo}/>}
  </main>;
}
