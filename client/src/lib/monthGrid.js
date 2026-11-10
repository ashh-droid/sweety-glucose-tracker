import { localDate } from './api.js';

export function weekdayDate(iso) {
  const [year, month, day] = iso.split('-').map(Number);
  const short = new Intl.DateTimeFormat('en-GB', { weekday: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(year, month - 1, day)));
  return `${short.slice(0, 2)} ${day}`;
}

export function visibleDates(month, today = localDate()) {
  const [year, number] = month.split('-').map(Number);
  const lastDay = new Date(Date.UTC(year, number, 0)).getUTCDate();
  if (month > today.slice(0, 7)) return [];
  const count = month === today.slice(0, 7) ? Math.min(lastDay, Number(today.slice(8))) : lastDay;
  return Array.from({ length: count }, (_, i) => `${month}-${String(i + 1).padStart(2, '0')}`);
}

export function monthRows(dates, readings, today = localDate()) {
  const active = new Set(readings.map((r) => r.date));
  const result = [];
  for (let i = 0; i < dates.length;) {
    if (active.has(dates[i]) || dates[i] === today) {
      result.push({ type: 'day', dates: [dates[i]] });
      i++;
      continue;
    }
    let end = i;
    while (end < dates.length && !active.has(dates[end]) && dates[end] !== today) end++;
    const group = dates.slice(i, end);
    if (group.length >= 3) result.push({ type: 'empty', dates: group });
    else group.forEach((date) => result.push({ type: 'day', dates: [date] }));
    i = end;
  }
  return result;
}

