/** "30 Oct, 3:30 pm IST" — Indian market time, regardless of the viewer's timezone. */
export function formatMarketTime(value: string | Date | null | undefined) {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const text = date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  });

  return `${text} IST`;
}