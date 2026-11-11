// Mirror the API's value checks for immediate inline feedback.
// Server validation remains authoritative for every saved reading.
export function glucoseValueError(value) {
  if (value === undefined || value === null || value === '') {
    return 'Please enter a glucose value.';
  }

  const wholeNumber = typeof value === 'number'
    ? Number.isSafeInteger(value)
    : typeof value === 'string' && /^\d+$/.test(value.trim());
  const numeric = Number(value);

  if (!wholeNumber || numeric < 40 || numeric > 600) {
    return 'Value must be between 40 and 600 mg/dl.';
  }
  return null;
}
