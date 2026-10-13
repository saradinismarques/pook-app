import { fetchBookBatch, fetchListPreviews, searchBooks } from '@/lib/hardcover';

const mockFetch = jest.fn();

function ok(data: unknown) {
  return { ok: true, status: 200, json: async () => ({ data }) };
}

function httpError(status: number) {
  return { ok: false, status, json: async () => ({}) };
}

function graphQlBook(id: number, title: string) {
  return {
    id,
    title,
    subtitle: null,
    description: 'A book.',
    pages: 100,
    release_date: '2000-01-01',
    rating: 4.334035656401945,
    users_count: 14537,
    image: { url: `https://example.com/${id}.jpg` },
    contributions: [{ author: { name: 'Author' } }],
  };
}

describe('hardcover client', () => {
  beforeAll(() => {
    globalThis.fetch = mockFetch as unknown as typeof fetch;
  });

  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('maps 401 responses to a token error', async () => {
    mockFetch.mockResolvedValueOnce(httpError(401));
    await expect(fetchBookBatch()).rejects.toThrow('The API token was rejected');
  });

  it('maps 429 responses to a rate limit error', async () => {
    mockFetch.mockResolvedValueOnce(httpError(429));
    await expect(fetchBookBatch()).rejects.toThrow('Rate limit reached');
  });

  it('maps network failures to a connection error', async () => {
    mockFetch.mockRejectedValueOnce(new TypeError('Network request failed'));
    await expect(fetchBookBatch()).rejects.toThrow('Could not reach the server');
  });

  it('rethrows AbortError untouched', async () => {
    const abortError = new Error('aborted');
    abortError.name = 'AbortError';
    mockFetch.mockRejectedValueOnce(abortError);
    const controller = new AbortController();
    controller.abort();
    await expect(fetchBookBatch(controller.signal)).rejects.toMatchObject({
      name: 'AbortError',
    });
  });

  it('surfaces GraphQL errors from the payload', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ errors: [{ message: 'field not found' }] }),
    });
    await expect(fetchBookBatch()).rejects.toThrow('field not found');
  });

  it('keeps search rank order after hydration', async () => {
    mockFetch
      .mockResolvedValueOnce(
        ok({
          search: {
            error: null,
            results: {
              found: 3,
              hits: [
                { document: { id: '3' } },
                { document: { id: '1' } },
                { document: { id: '2' } },
              ],
            },
          },
        })
      )
      .mockResolvedValueOnce(
        ok({
          books: [graphQlBook(1, 'One'), graphQlBook(2, 'Two'), graphQlBook(3, 'Three')],
        })
      );

    const { books, total } = await searchBooks({ query: 'test' });

    expect(books.map((book) => book.id)).toEqual(['3', '1', '2']);
    expect(total).toBe(3);
  });

  it('skips search hits that fail to hydrate', async () => {
    mockFetch
      .mockResolvedValueOnce(
        ok({
          search: {
            error: null,
            results: {
              found: 2,
              hits: [{ document: { id: '1' } }, { document: { id: '999' } }],
            },
          },
        })
      )
      .mockResolvedValueOnce(ok({ books: [graphQlBook(1, 'One')] }));

    const { books } = await searchBooks({ query: 'test' });

    expect(books.map((book) => book.id)).toEqual(['1']);
  });

  it('returns an empty result when the search term has no hits', async () => {
    mockFetch.mockResolvedValueOnce(
      ok({ search: { error: null, results: { found: 0, hits: [] } } })
    );

    const { books, total } = await searchBooks({ query: 'zzz' });

    expect(books).toEqual([]);
    expect(total).toBe(0);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});

describe('fetchListPreviews', () => {
  beforeAll(() => {
    globalThis.fetch = mockFetch as unknown as typeof fetch;
  });

  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('chunks requests and caches results across calls', async () => {
    const ids = [11, 12, 13, 14, 15, 16, 17];
    mockFetch.mockImplementation(async (_url: string, init: { body: string }) => {
      const { query } = JSON.parse(init.body) as { query: string };
      const count = (query.match(/q\d+:/g) ?? []).length;
      const data: Record<string, unknown[]> = {};
      for (let index = 0; index < count; index += 1) {
        data[`q${index}`] = [{ book: graphQlBook(index, `Book ${index}`) }];
      }
      return ok(data);
    });

    const first = await fetchListPreviews(ids, 6);
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(first.books.size).toBe(7);
    expect(first.failedIds).toEqual([]);

    mockFetch.mockClear();
    const second = await fetchListPreviews(ids, 6);
    expect(mockFetch).not.toHaveBeenCalled();
    expect(second.books.get(11)).toHaveLength(1);
  });

  it('retries once after a rate limit', async () => {
    jest.useFakeTimers();
    try {
      mockFetch
        .mockResolvedValueOnce(httpError(429))
        .mockResolvedValueOnce(ok({ q0: [{ book: graphQlBook(1, 'Retry Book') }] }));

      const promise = fetchListPreviews([21], 6);
      await jest.advanceTimersByTimeAsync(2000);
      const result = await promise;

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result.books.get(21)?.[0]?.title).toBe('Retry Book');
    } finally {
      jest.useRealTimers();
    }
  });

  it('leaves failed chunks out of the result and reports their ids', async () => {
    mockFetch.mockRejectedValueOnce(new TypeError('Network request failed'));
    const result = await fetchListPreviews([31], 6);
    expect(result.books.size).toBe(0);
    expect(result.failedIds).toEqual([31]);
  });
});
