import { SLOTS } from '../lib/api.js';
import { bandFor, bandLabel } from './DayEntries.jsx';
import { dailyAverage } from '../lib/history.js';

function formatDay(date) {
  const [year, month, day] = date.split('-').map(Number);
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC'
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function DayRow({ date, readings, onSelectCell }) {
  const slotMap = new Map(readings.map((reading) => [reading.slot, reading]));
  const average = dailyAverage(readings);

  return (
    <li className="history-day">
      <div className="history-date">
        <span className="history-date-label">{formatDay(date)}</span>
        <span className="history-mobile-avg">{average ? `Avg ${average} mg/dl` : 'No readings'}</span>
      </div>
      <div className="history-chips" role="group" aria-label={`Readings for ${date}`}>
        {SLOTS.map((slot) => {
          const reading = slotMap.get(slot.value);
          const band = reading ? bandFor(reading.value) : null;
          return (
            <button key={slot.value} type="button"
              className={`history-chip ${band ? `band-${band}` : 'history-chip-empty'}`}
              onClick={() => onSelectCell(date, slot.value)}
              aria-label={reading
                ? `Edit ${slot.label} on ${date}: ${reading.value} mg/dl, ${bandLabel[band]}`
                : `Add ${slot.label} on ${date}`}>
              <span className="history-chip-name">{slot.short === 'Fasting' ? 'Fast' : slot.short === 'Breakfast' ? 'Bkfst' : slot.short}</span>
              <span className="history-chip-number">{reading ? reading.value : '·'}</span>
            </button>
          );
        })}
      </div>
      <div className="history-desktop-avg">
        <span>Day avg.</span>
        <strong>{average ?? '·'}</strong>
        <small>{average ? 'mg/dl' : ''}</small>
      </div>
    </li>
  );
}

export default function History({ days, hasMore, loading, loadingOlder, error, onLoadOlder, onSelectCell }) {
  return (
    <section className="section history-section" aria-labelledby="history-title">
      <div className="section-head history-heading">
        <h2 id="history-title">Reading history</h2>
        <span className="section-caption">Grouped by day</span>
      </div>
      {loading && days.length === 0 ? (
        <p className="history-empty" role="status">Loading history...</p>
      ) : days.length === 0 && !error ? (
        <p className="history-empty">No readings yet. Your daily entries will appear here.</p>
      ) : null}
      {days.length > 0 && <ul className="history-days">
        {days.map((day) => <DayRow key={day.date} date={day.date}
          readings={day.readings} onSelectCell={onSelectCell}/>)}
      </ul>}
      {error && <div role="alert" className="alert error history-error">{error}</div>}
      {hasMore && <div className="history-more">
        <button type="button" className="button outline" onClick={onLoadOlder}
          disabled={loading || loadingOlder}>
          {loadingOlder ? 'Loading...' : 'Show older days'}
        </button>
      </div>}
    </section>
  );
}
