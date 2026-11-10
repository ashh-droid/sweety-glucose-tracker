import { ChevronLeft, ChevronRight, Printer } from 'lucide-react';
import { SLOTS, localDate } from '../lib/api.js';
import { bandFor } from './DayEntries.jsx';

function shiftMonth(iso, offset) {
  const [year, month] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1 + offset, 1));
  return date.toISOString().slice(0, 7);
}

function labelMonth(iso) {
  const [year, month] = iso.split('-').map(Number);
  return new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(new Date(year, month - 1, 1));
}

export default function MonthGrid({ month, onChange, readings, loading, error, onSelectDate }) {
  const [year, monthNumber] = month.split('-').map(Number);
  const days = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const today = localDate();
  const byCell = new Map(readings.map((r) => [`${r.date}|${r.slot}`, r]));

  return (
    <section className="section month-section" aria-labelledby="month-title">
      <div className="section-head month-heading">
        <div><p className="section-kicker">MONTH AT A GLANCE</p><h2 id="month-title">{labelMonth(month)}</h2></div>
        <div className="month-tools no-print">
          <button type="button" className="icon-button" onClick={() => onChange(shiftMonth(month, -1))} aria-label="Previous month"><ChevronLeft size={18}/></button>
          <button type="button" className="icon-button" disabled={month >= today.slice(0, 7)} onClick={() => onChange(shiftMonth(month, 1))} aria-label="Next month"><ChevronRight size={18}/></button>
          <button type="button" className="button outline print-button" onClick={() => window.print()}><Printer size={16}/> Print</button>
        </div>
      </div>
      <p className="month-note">Four time slots per day. Select a date to return to its entry boxes.</p>
      {error && <div role="alert" className="alert error">{error}</div>}
      {loading ? <div className="month-loading" role="status">Loading month…</div> : (
        <div className="table-scroll">
          <table className="month-table">
            <thead><tr><th scope="col">Date</th>{SLOTS.map((slot) => <th scope="col" key={slot.value}>{slot.short}</th>)}</tr></thead>
            <tbody>
              {Array.from({ length: days }, (_, i) => {
                const date = `${month}-${String(i + 1).padStart(2, '0')}`;
                const future = date > today;
                return (
                  <tr key={date} className={date === today ? 'current-day-row' : ''}>
                    <th scope="row">
                      <button disabled={future} className="day-link no-print" type="button" onClick={() => onSelectDate(date)}>{i + 1}</button>
                      <span className="print-only">{i + 1}</span>
                    </th>
                    {SLOTS.map((slot) => {
                      const reading = byCell.get(`${date}|${slot.value}`);
                      return <td key={slot.value}>{reading
                        ? <span className={`table-reading band-${bandFor(reading.value)}`} aria-label={`${reading.value} mg/dl`}>{reading.value}</span>
                        : <span className="table-blank" aria-label="No reading">·</span>}</td>;
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <div className="band-key" aria-label="Illustrative value bands">
        <span><i className="legend-dot low"/> Below 70</span>
        <span><i className="legend-dot in-range"/> 70–180</span>
        <span><i className="legend-dot high"/> 181–250</span>
        <span><i className="legend-dot very-high"/> Above 250</span>
      </div>
      <p className="disclaimer">Color bands are illustrative reference categories only. Glucose goals vary by person and timing; this tracker does not provide medical advice.</p>
    </section>
  );
}
