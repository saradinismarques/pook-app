export function shortenDescription(text: string | undefined, maxLength = 220): string | null {
  if (!text) {
    return null;
  }
  const normalized = text.trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }
  const slice = normalized.slice(0, maxLength);
  const lastSpace = slice.lastIndexOf(' ');
  return `${slice.slice(0, lastSpace > 0 ? lastSpace : maxLength).trimEnd()}…`;
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function formatReleaseDate(isoDate: string | undefined): string | null {
  if (!isoDate) {
    return null;
  }
  const match = /^(\d{4})-(\d{2})/.exec(isoDate);
  if (match) {
    const month = Number(match[2]);
    const monthName = MONTHS[month - 1];
    if (monthName) {
      return `${monthName} ${match[1]}`;
    }
    return match[1] ?? null;
  }
  const year = isoDate.slice(0, 4);
  return /^\d{4}$/.test(year) ? year : null;
}

export function formatCompactCount(count: number): string {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1).replace(/\.0$/, '')}k`;
  }
  return String(count);
}
