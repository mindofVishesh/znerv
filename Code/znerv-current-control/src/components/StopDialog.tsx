import { useEffect, useRef } from 'react';

interface StopDialogProps { onCancel: () => void; onConfirm: () => void; }
export function StopDialog({ onCancel, onConfirm }: StopDialogProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    element.showModal();
    return () => { if (element.open) element.close(); };
  }, []);
  return <dialog ref={dialog} className="confirm-dialog" aria-labelledby="stop-dialog-title" aria-describedby="stop-dialog-details" onCancel={event => { event.preventDefault(); onCancel(); }}>
    <h2 id="stop-dialog-title">Stop this demo session?</h2>
    <p id="stop-dialog-details">The simulated session will end early. This command does not control or verify any physical device.</p>
    <div className="dialog-actions">
      <button type="button" className="button button-secondary" onClick={onCancel}>Keep session running</button>
      <button type="button" className="button button-stop" onClick={onConfirm}>Confirm stop</button>
    </div>
  </dialog>;
}
