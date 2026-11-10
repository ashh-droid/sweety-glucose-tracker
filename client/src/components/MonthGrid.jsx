import { Fragment, useState } from 'react';
import { ChevronLeft, ChevronRight, Printer } from 'lucide-react';
import { SLOTS, localDate } from '../lib/api.js';
import { bandFor, bandLabel } from './DayEntries.jsx';
import { weekdayDate, visibleDates, monthRows } from '../lib/monthGrid.js';

function shiftMonth(iso, offset) {
  const [year, month] = iso.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1 + offset, 1)).toISOString().slice(0, 7);
}

function labelMonth(iso) {
  const [year, month] = iso.split('-').map(Number);
  return new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(new Date(year, month - 1, 1));
}

export default function MonthGrid({ month, onChange, readings = [], loading, error, onSelectDate, onSelectCell }) {
  const [expanded, setExpanded] = useState([]);
  const today = localDate();
  const dates = visibleDates(month, today);
  const groups = monthRows(dates, readings, today);
  const byCell = new Map(readings.map((r) => [`${r.date}|${r.slot}`, r]));

  function renderDay(date, extraClass = '') {
    const values = SLOTS.map((s) => byCell.get(`${date}|${s.value}`)).filter(Boolean);
    const avg = values.length ? (values.reduce((sum, r) => sum + r.value, 0) / values.length).toFixed(1) : '';
    return (
      <tr key={date} className={`${date === today ? 'current-day-row' : ''} ${extraClass}`}>
        <th scope="row">
          <button className="day-link no-print" type="button" onClick={() => onSelectDate(date)} aria-label={`View ${date}`}>{weekdayDate(date)}</button>
          <span className="print-only">{weekdayDate(date)}</span>
        </th>
        {SLOTS.map((slot) => {
          const reading = byCell.get(`${date}|${slot.value}`);
          const name = `${slot.label} for ${date}`;
          return (
            <td key={slot.value}>
              <button className={`cell-button no-print ${reading ? `band-${bandFor(reading.value)}` : 'cell-empty'}`}
                type="button" onClick={() => onSelectCell(date, slot.value)}
                aria-label={reading ? `Edit ${name}, ${reading.value} mg/dl, ${bandLabel[bandFor(reading.value)]}` : `Add ${name}`}>
                {reading ? reading.value : <span className="table-dot" aria-hidden="true">·</span>}
              </button>
              <span className="print-only">{reading ? reading.value : '·'}</span>
            </td>
          );
        })}
        <td className="day-average">{avg || <span className="table-dot" aria-label="No average">·</span>}</td>
      </tr>
    );
  }

  return (
    <section className="section month-section" aria-labelledby="month-title">
      <div className="section-head month-heading">
        <h2 id="month-title">{labelMonth(month)}</h2>
        <div className="month-tools no-print">
          <button type="button" className="icon-button" onClick={() => onChange(shiftMonth(month, -1))} aria-label="Previous month"><ChevronLeft size={18}/></button>
          <button type="button" className="icon-button" disabled={month >= today.slice(0, 7)} onClick={() => onChange(shiftMonth(month, 1))} aria-label="Next month"><ChevronRight size={18}/></button>
          <button type="button" className="button outline print-button" onClick={() => window.print()}><Printer size={16}/> Print</button>
        </div>
      </div>
      <div className="band-key band-key-top" aria-label="Illustrative value bands">
        <span><i className="legend-dot low"/> Below 70</span>
        <span><i className="legend-dot in-range"/> 70 to 180</span>
        <span><i className="legend-dot high"/> 181 to 250</span>
        <span><i className="legend-dot very-high"/> Above 250</span>
      </div>
      <p className="month-note">Select any value or empty dot to edit that slot. Empty stretches can be expanded.</p>
      {error && <div role="alert" className="alert error">{error}</div>}
      {loading ? <div className="month-loading" role="status">Loading month...</div> : (
        <div className="table-scroll" role="region" aria-label="Monthly glucose log" tabIndex="0">
          <table className="month-table">
            <thead><tr><th scope="col">Day</th>{SLOTS.map((s) => <th scope="col" key={s.value}>{s.short === 'Fasting' ? 'Fast' : s.short === 'Breakfast' ? 'Bkfst' : s.short}</th>)}<th scope="col">Avg.</th></tr></thead>
            <tbody>
              {groups.map((group) => {
                if (group.type === 'day') return renderDay(group.dates[0]);
                const key = group.dates[0] + group.dates[group.dates.length - 1];
                const opened = expanded.includes(key);
                return (
                  <Fragment key={key}>
                    <tr className="empty-group-row no-print"><td colSpan={6}>
                      <button type="button" className="expand-stretch" onClick={() => setExpanded((old) => opened ? old.filter((id) => id !== key) : [...old, key])}>
                        {weekdayDate(group.dates[0])} to {weekdayDate(group.dates[group.dates.length - 1])}: no readings
                        <span>{opened ? 'Collapse' : 'Show dates'}</span>
                      </button>
                    </td></tr>
                    {group.dates.map((date) => renderDay(date, opened ? 'collapsed-day expanded-day' : 'collapsed-day'))}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="disclaimer">These bands are illustrative reference categories, not individual treatment goals. Values differ by meal timing and person; Sweety is a record-keeping tool, not medical guidance.</p>
    </section>
  );
}
