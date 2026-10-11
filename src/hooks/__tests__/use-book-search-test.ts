import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useBookSearch, type UseBookSearchResult } from '@/hooks/use-book-search';
import { searchBooks } from '@/lib/hardcover';
import type { Book } from '@/types/book';

jest.mock('@/lib/hardcover', () => ({
  searchBooks: jest.fn(),
}));

const mockSearchBooks = searchBooks as jest.MockedFunction<typeof searchBooks>;

function book(id: string): Book {
  return { id, title: `Book ${id}`, authors: ['Author'], categories: [] };
}

describe('useBookSearch', () => {
  beforeEach(() => {
    mockSearchBooks.mockReset();
  });

  it('stays idle without a term', async () => {
    const { result } = await renderHook(() => useBookSearch(''));
    expect(result.current.status).toBe('idle');
    expect(mockSearchBooks).not.toHaveBeenCalled();
  });

  it('loads results for a term', async () => {
    mockSearchBooks.mockResolvedValue({ books: [book('1'), book('2')], total: 40 });
    const { result } = await renderHook(() => useBookSearch('dune'));

    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.books.map((b) => b.id)).toEqual(['1', '2']);
    expect(mockSearchBooks).toHaveBeenCalledWith(
      { query: 'dune', page: 1, perPage: 25 },
      expect.anything()
    );
  });

  it('resets to page 1 when the term changes', async () => {
    mockSearchBooks.mockResolvedValue({ books: [book('1')], total: 100 });
    const { result, rerender } = await renderHook<UseBookSearchResult, { term: string }>(
      ({ term }) => useBookSearch(term),
      { initialProps: { term: 'dune' } }
    );
    await waitFor(() => expect(result.current.status).toBe('ready'));

    await rerender({ term: 'harry potter' });
    await waitFor(() => expect(result.current.status).toBe('ready'));

    const lastCall = mockSearchBooks.mock.calls.at(-1);
    expect(lastCall?.[0]).toEqual({ query: 'harry potter', page: 1, perPage: 25 });
  });

  it('paginates with loadMore and drops duplicates', async () => {
    const firstPage = Array.from({ length: 25 }, (_, index) => book(String(index)));
    mockSearchBooks
      .mockResolvedValueOnce({ books: firstPage, total: 50 })
      .mockResolvedValueOnce({ books: [book('24'), book('25')], total: 50 });

    const { result } = await renderHook(() => useBookSearch('series'));
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.hasMore).toBe(true);

    await act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.books).toHaveLength(26));

    expect(mockSearchBooks.mock.calls.at(-1)?.[0]).toEqual({
      query: 'series',
      page: 2,
      perPage: 25,
    });
    expect(result.current.books.filter((b) => b.id === '24')).toHaveLength(1);
  });

  it('surfaces API errors and recovers on retry', async () => {
    mockSearchBooks.mockRejectedValueOnce(new Error('Rate limit reached'));
    const { result } = await renderHook(() => useBookSearch('x'));
    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error).toBe('Rate limit reached');

    mockSearchBooks.mockResolvedValueOnce({ books: [book('9')], total: 1 });
    await act(() => result.current.retry());
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.error).toBeNull();
  });
});
