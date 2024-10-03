export function minutesFromNow(minutes: number) {
  const now = new Date();
  now.setMinutes(now.getMinutes() + minutes);
  return now;
}
