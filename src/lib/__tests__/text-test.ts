import { formatCompactCount, formatReleaseDate, shortenDescription } from '@/lib/text';

describe('shortenDescription', () => {
  it('returns null for missing text', () => {
    expect(shortenDescription(undefined)).toBeNull();
    expect(shortenDescription('')).toBeNull();
  });

  it('trims and returns text within the limit', () => {
    expect(shortenDescription('  A short blurb.  ')).toBe('A short blurb.');
  });

  it('truncates at a word boundary and appends an ellipsis', () => {
    const text = 'hello hello hello hello hello';
    expect(shortenDescription(text, 10)).toBe('hello…');
  });

  it('hard-cuts when there is no space', () => {
    expect(shortenDescription('a'.repeat(20), 10)).toBe(`${'a'.repeat(10)}…`);
  });
});

describe('formatReleaseDate', () => {
  it('returns null for missing dates', () => {
    expect(formatReleaseDate(undefined)).toBeNull();
    expect(formatReleaseDate('')).toBeNull();
  });

  it('formats full ISO dates as month year', () => {
    expect(formatReleaseDate('1965-06-01')).toBe('June 1965');
    expect(formatReleaseDate('2001-09-01')).toBe('September 2001');
  });

  it('falls back to the year for year-only values', () => {
    expect(formatReleaseDate('1984')).toBe('1984');
  });

  it('returns null for unrecognized values', () => {
    expect(formatReleaseDate('unknown')).toBeNull();
    expect(formatReleaseDate('n/a')).toBeNull();
  });
});

describe('formatCompactCount', () => {
  it('returns small numbers as-is', () => {
    expect(formatCompactCount(0)).toBe('0');
    expect(formatCompactCount(42)).toBe('42');
    expect(formatCompactCount(999)).toBe('999');
  });

  it('formats thousands with a k suffix', () => {
    expect(formatCompactCount(1_400)).toBe('1.4k');
    expect(formatCompactCount(2_000)).toBe('2k');
    expect(formatCompactCount(14_537)).toBe('14.5k');
  });

  it('formats millions with an M suffix', () => {
    expect(formatCompactCount(2_500_000)).toBe('2.5M');
    expect(formatCompactCount(3_000_000)).toBe('3M');
  });
});
