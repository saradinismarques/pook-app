import { useCallback, useEffect, useRef, useState } from 'react';

import { searchBooks } from '@/lib/hardcover';
import type { Book } from '@/types/book';

const PAGE_SIZE = 25;

export type BookSearchStatus = 'idle' | 'loading' | 'ready' | 'error';

type SearchState = {
  term: string;
  books: Book[];
  total: number;
  hasMore: boolean;
  status: BookSearchStatus;
  error: string | null;
};

export type UseBookSearchResult = {
  books: Book[];
  total: number;
  status: BookSearchStatus;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  retry: () => void;
};

export function useBookSearch(searchInput: string): UseBookSearchResult {
  const term = searchInput.trim();

  const [state, setState] = useState<SearchState>(() => ({
    term,
    books: [],
    total: 0,
    hasMore: false,
    status: 'idle',
    error: null,
  }));
  const [loadingMore, setLoadingMore] = useState(false);

  const seenIds = useRef<Set<string>>(new Set());
  const isFetchingRef = useRef(false);
  const pageRef = useRef(1);
  const generationRef = useRef(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const load = useCallback(
    async (mode: 'initial' | 'more', signal?: AbortSignal) => {
      if (term.length === 0) {
        return;
      }

      if (mode === 'initial') {
        seenIds.current.clear();
        pageRef.current = 1;
      } else if (isFetchingRef.current) {
        return;
      }

      const generation = generationRef.current;
      isFetchingRef.current = true;

      try {
        const result = await searchBooks(
          { query: term, page: pageRef.current, perPage: PAGE_SIZE },
          signal
        );

        if (!mounted.current || generation !== generationRef.current) {
          return;
        }

        pageRef.current += 1;

        const fresh = result.books.filter((book) => !seenIds.current.has(book.id));
        fresh.forEach((book) => seenIds.current.add(book.id));

        setState((prev) => ({
          term,
          books: mode === 'initial' ? fresh : [...prev.books, ...fresh],
          total: result.total,
          hasMore: (pageRef.current - 1) * PAGE_SIZE < result.total,
          status: 'ready',
          error: null,
        }));
      } catch (caught) {
        if (caught instanceof Error && caught.name === 'AbortError') {
          return;
        }
        if (!mounted.current || generation !== generationRef.current) {
          return;
        }
        setState((prev) => ({
          ...prev,
          status: 'error',
          error: caught instanceof Error ? caught.message : 'Something went wrong.',
        }));
      } finally {
        if (generation === generationRef.current) {
          isFetchingRef.current = false;
          if (mounted.current) {
            setLoadingMore(false);
          }
        }
      }
    },
    [term]
  );

  useEffect(() => {
    if (term.length === 0) {
      return;
    }
    generationRef.current += 1;
    const controller = new AbortController();
    void load('initial', controller.signal);
    return () => controller.abort();
  }, [load, term.length]);

  const isIdle = term.length === 0;
  const isStale = !isIdle && state.term !== term;

  const books = isIdle || isStale ? [] : state.books;
  const total = isIdle || isStale ? 0 : state.total;
  const hasMore = isIdle || isStale ? false : state.hasMore;
  const status: BookSearchStatus = isIdle ? 'idle' : isStale ? 'loading' : state.status;
  const error = isIdle || isStale ? null : state.error;

  const loadMore = useCallback(() => {
    if (isIdle || isFetchingRef.current || !hasMore) {
      return;
    }
    setLoadingMore(true);
    void load('more');
  }, [load, hasMore, isIdle]);

  const retry = useCallback(() => {
    generationRef.current += 1;
    setState((prev) => ({ ...prev, status: 'loading', error: null }));
    void load('initial');
  }, [load]);

  return {
    books,
    total,
    status,
    loadingMore,
    error,
    hasMore,
    loadMore,
    retry,
  };
}
