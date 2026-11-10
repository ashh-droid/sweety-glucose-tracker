import { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import { SLOTS, localDate } from '../lib/api.js';

export default function ReadingForm({ editing, selectedDate, onSave, onCancel, busy, error }) {
  const [date, setDate] = useState(selectedDate);
  const [slot, setSlot] = useState(SLOTS[0].value);
  const [value, setValue] = useState('');
  useEffect(() => {
    setDate(editing?.date || selectedDate);
    setSlot(editing?.slot || SLOTS[0].value);
    setValue(editing ? String(editing.value) : '');
  }, [editing, selectedDate]);

  async function submit(event) {
    event.preventDefault();
    const saved = await onSave({ date, slot, value });
    if (saved && !editing) setValue('');
  }

  return (
    <form className="reading-form" onSubmit={submit} noValidate>
      <div className="form-grid">
        <label className="field">Date<input type="date" value={date} max={localDate()} onChange={(event) => setDate(event.target.value)} required /></label>
        <label className="field">Time slot<select value={slot} onChange={(event) => setSlot(event.target.value)} required>{SLOTS.map((entry) => <option key={entry.value} value={entry.value}>{entry.label}</option>)}</select></label>
        <label className="field">Glucose (mg/dl)<input type="number" min="40" max="600" step="1" inputMode="numeric" value={value} onChange={(event) => setValue(event.target.value)} placeholder="e.g. 110" required /></label>
      </div>
      <div className="form-footer">
        <p>Whole numbers from 40 to 600 mg/dl.</p>
        <div className="form-buttons">
          {editing && <button className="button secondary" type="button" onClick={onCancel}><X size={16}/> Cancel</button>}
          <button className="button primary" type="submit" disabled={busy}><Check size={17}/>{busy ? 'Saving…' : editing ? 'Save changes' : 'Add reading'}</button>
        </div>
      </div>
      {error && <div role="alert" className="alert error form-error">{error}</div>}
    </form>
  );
}
