import { useEffect, useRef, useState } from 'react';
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import { SLOTS } from '../lib/api.js';

export function bandFor(value) {
  const n = Number(value);
  if (n < 70) return 'low';
  if (n <= 180) return 'in-range';
  if (n <= 250) return 'high';
  return 'very-high';
}

export const bandLabel = {
  low: 'Below reference band',
  'in-range': 'Within reference band',
  high: 'Above reference band',
  'very-high': 'Well above reference band'
};

function SlotEntry({ slot, reading, date, busy, onSave, onDelete, focusRequest }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef(null);
  const handledRequest = useRef(null);

  useEffect(() => {
    setEditing(false);
    setValue('');
    setError('');
  }, [date, slot.value, reading?.id]);

  useEffect(() => {
    if (focusRequest?.nonce != null && handledRequest.current !== focusRequest.nonce && focusRequest.slot === slot.value && focusRequest.date === date) {
      handledRequest.current = focusRequest.nonce;
      setValue(reading ? String(reading.value) : '');
      setError('');
      setEditing(true);
    }
  }, [focusRequest?.nonce, focusRequest?.slot, focusRequest?.date, date, slot.value, reading?.id]);

  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  function openEditor() {
    setValue(reading ? String(reading.value) : '');
    setError('');
    setEditing(true);
  }

  function cancel() { setEditing(false); setValue(''); setError(''); }

  async function submit(event) {
    event.preventDefault();
    setError('');
    try {
      await onSave({ date, slot: slot.value, value }, reading);
      cancel();
    } catch (err) { setError(err.message); }
  }

  async function remove() {
    if (!reading || !window.confirm(`Delete the reading for ${slot.label.toLowerCase()}?`)) return;
    setError('');
    try { await onDelete(reading); cancel(); }
    catch (err) { setError(err.message); }
  }

  return (
    <article className={`slot-entry ${reading ? `is-filled band-${bandFor(reading.value)}` : 'is-empty'}`}>
      {editing ? (
        <>
          <div className="slot-label">{slot.label}</div>
          <form onSubmit={submit} onKeyDown={(event) => { if (event.key === 'Escape') { event.preventDefault(); cancel(); } }} className="slot-form" noValidate>
            <label className="sr-only" htmlFor={`entry-${slot.value}`}>Glucose value in mg/dl for {slot.label}</label>
            <div className="slot-input-row">
              <input id={`entry-${slot.value}`} ref={inputRef} type="number" inputMode="numeric"
                min="40" max="600" step="1" placeholder="mg/dl" value={value}
                onChange={(event) => setValue(event.target.value)} disabled={busy} />
              <button type="submit" className="slot-commit" disabled={busy} aria-label={`Save ${slot.label}`}><Check size={18}/></button>
              <button type="button" className="slot-cancel" onClick={cancel} disabled={busy} aria-label="Cancel entry"><X size={17}/></button>
            </div>
            <span className="slot-hint">Whole number, 40 to 600. Enter to save, Esc to cancel.</span>
            {reading && <button type="button" className="slot-delete-edit" onClick={remove} disabled={busy}><Trash2 size={14}/> Delete this reading</button>}
            {error && <p className="slot-error" role="alert">{error}</p>}
          </form>
        </>
      ) : reading ? (
        <>
          <div className="slot-label">{slot.label}</div>
          <div className="slot-value"><strong>{reading.value}</strong><span>mg/dl</span></div>
          <div className="slot-band-label">{bandLabel[bandFor(reading.value)]}</div>
          <div className="slot-actions"><button type="button" onClick={openEditor} disabled={busy} aria-label={`Edit ${slot.label}`}><Pencil size={15}/> Edit</button></div>
          {error && <p className="slot-error" role="alert">{error}</p>}
        </>
      ) : (
        <button type="button" className="slot-add slot-add-full" onClick={openEditor} disabled={busy}
          aria-label={`Add a reading for ${slot.label}`}>
          <span className="slot-add-top"><span className="slot-label">{slot.label}</span></span>
          <span className="slot-add-center"><Plus size={24} aria-hidden="true"/><span>Enter reading</span></span>
          <span className="slot-add-foot">Tap or click anywhere in this box</span>
        </button>
      )}
    </article>
  );
}

export default function DayEntries({ date, readings, busy, onSave, onDelete, focusRequest }) {
  const bySlot = new Map((readings || []).map((reading) => [reading.slot, reading]));
  return (
    <section className="section day-section" aria-labelledby="day-title">
      <div className="section-head day-header">
        <h1 id="day-title">{new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(date + 'T12:00:00Z'))}</h1>
        <span className="completion-count">{readings.length} of 4 recorded</span>
      </div>
      <div className="slot-grid">
        {SLOTS.map((slot) => <SlotEntry key={`${date}-${slot.value}`} slot={slot}
          reading={bySlot.get(slot.value)} date={date} busy={busy} onSave={onSave} onDelete={onDelete}
          focusRequest={focusRequest}/>)}
      </div>
      <p className="helper-note">Choose a box to enter a reading.</p>
    </section>
  );
}
