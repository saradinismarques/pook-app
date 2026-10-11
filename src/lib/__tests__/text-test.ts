import { shortenDescription } from '@/lib/text';

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
