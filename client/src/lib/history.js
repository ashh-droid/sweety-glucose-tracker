export function dailyAverage(readings) {
  if (!Array.isArray(readings) || readings.length === 0) return null;
  const values = readings.map((reading) => Number(reading.value));
  if (values.some((value) => !Number.isFinite(value))) return null;
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  return average.toFixed(1);
}
