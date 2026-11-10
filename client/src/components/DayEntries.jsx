import { useEffect, useRef, useState } from 'react';
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import { SLOTS } from '../lib/api.js';

export function bandFor(value) {
  if (value < 70) return 'low';
  if (value <= 180) return 'in-range';
  if (value <= 250) return 'high';
  return 'very-high';
}

function SlotEntry({ slot, reading, date, busy, onSave, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    setEditing(false);
    setValue('');
    setError('');
  }, [date, slot.value, reading?.id]);

  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  function openEditor() {
    setValue(reading ? String(reading.value) : '');
    setError('');
    setEditing(true);
  }

  function cancel() {
    setEditing(false);
    setValue('');
    setError('');
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    try {
      await onSave({ date, slot: slot.value, value }, reading);
      cancel();
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove() {
    if (!reading) return;
    if (!window.confirm(`Delete the ${slot.label.toLowerCase()} reading?`)) return;
    setError('');
    try { await onDelete(reading); }
    catch (err) { setError(err.message); }
  }

  return (
    <article className={`slot-entry ${reading ? `is-filled band-${bandFor(reading.value)}` : 'is-empty'}`}>
      <div className="slot-label">{slot.label}</div>
      {editing ? (
        <form onSubmit={submit} className="slot-form" noValidate>
          <label className="sr-only" htmlFor={`entry-${slot.value}`}>Glucose in mg/dl for {slot.label}</label>
          <div className="slot-input-row">
            <input id={`entry-${slot.value}`} ref={inputRef} type="number" inputMode="numeric"
              min="40" max="600" step="1" placeholder="mg/dl" value={value}
              onChange={(event) => setValue(event.target.value)} disabled={busy} />
            <button type="submit" className="slot-commit" disabled={busy} aria-label={`Save ${slot.label}`}><Check size={18} /></button>
            <button type="button" className="slot-cancel" onClick={cancel} disabled={busy} aria-label="Cancel"><X size={17} /></button>
          </div>
          <span className="slot-hint">Whole number · 40–600</span>
          {error && <p className="slot-error" role="alert">{error}</p>}
        </form>
      ) : reading ? (
        <>
          <div className="slot-value"><strong>{reading.value}</strong><span>mg/dl</span></div>
          <div className="slot-actions">
            <button type="button" onClick={openEditor} disabled={busy} aria-label={`Edit ${slot.label}`}><Pencil size={15} /> Edit</button>
            <button type="button" onClick={remove} disabled={busy} aria-label={`Delete ${slot.label}`}><Trash2 size={15} /> Delete</button>
          </div>
          {error && <p className="slot-error" role="alert">{error}</p>}
        </>
      ) : (
        <button type="button" className="slot-add" onClick={openEditor} disabled={busy}>
          <Plus size={23} /><span>Add reading</span>
        </button>
      )}
    </article>
  );
}

export default function DayEntries({ date, readings, busy, onSave, onDelete }) {
  const bySlot = new Map(readings.map((reading) => [reading.slot, reading]));
  return (
    <section className="section day-section" aria-labelledby="day-title">
      <div className="section-head">
        <div>
          <p className="section-kicker">YOUR LOGBOOK</p>
          <h2 id="day-title">Day at a glance</h2>
        </div>
        <span className="completion-count">{readings.length} of 4 recorded</span>
      </div>
      <div className="slot-grid">
        {SLOTS.map((slot) => (
          <SlotEntry key={`${date}-${slot.value}`} slot={slot} reading={bySlot.get(slot.value)}
            date={date} busy={busy} onSave={onSave} onDelete={onDelete} />
        ))}
      </div>
      <p className="helper-note">Choose an empty box to record a reading, or edit a saved value.</p>
    </section>
  );
}
