import { ChevronLeft, ChevronRight } from 'lucide-react';
import { localDate, prettyDate } from '../lib/api.js';

function shiftDay(iso, delta) {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + delta)).toISOString().slice(0, 10);
}

export default function DateNav({ date, onChange }) {
  const today = localDate();
  const isToday = date === today;

  return (
    <nav className="date-nav" aria-label="Choose a logbook date">
      <button className="icon-button" type="button" aria-label="Previous day"
        onClick={() => onChange(shiftDay(date, -1))}>
        <ChevronLeft size={18} />
      </button>
      <label className="date-choice">
        <span className="sr-only">Selected date</span>
        <span className="selected-date">{prettyDate(date)}</span>
        <input aria-label="Choose date" type="date" value={date} max={today}
          onChange={(event) => onChange(event.target.value)} />
      </label>
      <button className="icon-button" type="button" aria-label="Next day"
        disabled={date >= today} onClick={() => onChange(shiftDay(date, 1))}>
        <ChevronRight size={18} />
      </button>
      {!isToday && <button type="button" className="today-link" onClick={() => onChange(today)}>Today</button>}
    </nav>
  );
}
