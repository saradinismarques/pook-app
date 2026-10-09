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
