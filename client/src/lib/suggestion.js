// Convenience suggestion based on the clock, not meal timing or medical advice.
export function suggestedSlot(now = new Date()) {
  const hour = Number(new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata', hour: '2-digit', hourCycle: 'h23'
  }).format(now));
  if (hour < 10) return 'morning_fasting';
  if (hour < 13) return 'after_breakfast';
  if (hour < 17) return 'after_lunch';
  return 'after_dinner';
}

