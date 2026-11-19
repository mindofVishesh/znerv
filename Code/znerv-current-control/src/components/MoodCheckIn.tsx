import { useId, useState, type FormEvent } from 'react';
import type { MoodChoice } from '../records/sessionRecords';
import { sessionRecordStore } from '../records/sessionRecords';
import { useSessionRecords } from '../hooks/useSessionRecords';

const CHOICES: MoodChoice[] = ['Calm','Okay','Anxious','Prefer not to say'];
interface Props { kind: 'before' | 'after'; sessionId?: string; }
export function MoodCheckIn({kind, sessionId}: Props) {
  const id = useId();
  const records = useSessionRecords();
  const current = kind === 'before' ? records.pendingBeforeMood : records.sessions.find(s => s.id === sessionId)?.afterMood ?? null;
  const [selected, setSelected] = useState<MoodChoice | ''>(current ?? '');
  const [saved, setSaved] = useState(false);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (kind === 'before') sessionRecordStore.setBeforeMood(selected || null);
    else if (sessionId) sessionRecordStore.setAfterMood(sessionId, selected || null);
    setSaved(true);
  }
  return <section className="mood-panel" aria-labelledby={`${id}-title`}>
    <div><p className="eyebrow">OPTIONAL · DEMO DATA</p><h2 id={`${id}-title`}>{kind === 'before' ? 'Before your session' : 'After your session'}</h2><p>How are you feeling? You can skip this. No health outcome is inferred.</p></div>
    <form onSubmit={submit}>
      <fieldset><legend>Choose one response</legend><div className="mood-choices">
        {CHOICES.map(mood => <label key={mood} className={`mood-option ${selected === mood ? 'mood-selected' : ''}`}><input type="radio" name={`${id}-mood`} value={mood} checked={selected === mood} onChange={() => { setSelected(mood); setSaved(false); }}/><span>{mood}</span></label>)}
      </div></fieldset>
      <div className="mood-actions"><button className="button button-secondary" type="submit">{selected ? 'Save check-in' : 'Skip check-in'}</button>{current && <button className="button button-plain" type="button" onClick={() => { if (kind === 'before') sessionRecordStore.setBeforeMood(null); else if (sessionId) sessionRecordStore.setAfterMood(sessionId, null); setSelected(''); setSaved(false); }}>Clear response</button>}</div>
      {saved && <p className="mood-saved" role="status">{selected ? 'Check-in saved in this browser as simulation data.' : 'Check-in skipped.'}</p>}
    </form>
  </section>;
}
