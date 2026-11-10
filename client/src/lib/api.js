export async function api(path, options = {}) {
  let response;
  try {
    response = await fetch(`/api${path}`, {
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options
    });
  } catch {
    throw new Error('Unable to reach the server. Check that the API is running.');
  }
  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 && path !== '/auth/me' && path !== '/auth/login' &&
        typeof window !== 'undefined') {
      window.dispatchEvent(new Event('sweety:session-expired'));
    }
    throw new Error(data.error || 'Something went wrong.');
  }
  return data;
}

// Match the server's APP_TIMEZONE=Asia/Kolkata for date-only readings.
// This prevents local browser timezone differences from enabling future dates.
export function localDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(now);
  const part = (name) => parts.find((piece) => piece.type === name).value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function prettyDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(y, m - 1, d));
}

export const SLOTS = [
  { value: 'morning_fasting', label: 'Morning (fasting)', short: 'Fasting' },
  { value: 'after_breakfast', label: 'After breakfast', short: 'Breakfast' },
  { value: 'after_lunch', label: 'After lunch', short: 'Lunch' },
  { value: 'after_dinner', label: 'After dinner', short: 'Dinner' }
];
export const slotLabel = (value) => SLOTS.find((slot) => slot.value === value)?.label ?? value;
