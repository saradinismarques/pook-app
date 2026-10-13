import { useCallback, useEffect, useRef, useState } from 'react';

import { fetchPublicLists, searchLists } from '@/lib/hardcover';
import type { BookList } from '@/types/list';

const PAGE_SIZE = 25;

export type BookListsStatus = 'loading' | 'ready' | 'error';

type ListsState = {
  term: string;
  lists: BookList[];
  total: number;
  hasMore: boolean;
  status: BookListsStatus;
  error: string | null;
};

export type UseBookListsResult = {
  lists: BookList[];
  total: number;
  status: BookListsStatus;
  loadingMore: boolean;
  error: string | null;
  loadMoreError: string | null;
  hasMore: boolean;
  loadMore: () => void;
  retryLoadMore: () => void;
  retry: () => void;
};

export function useBookLists(searchInput: string): UseBookListsResult {
  const term = searchInput.trim();

  const [state, setState] = useState<ListsState>(() => ({
    term,
    lists: [],
    total: 0,
    hasMore: true,
    status: 'loading',
    error: null,
  }));
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);

  const seenIds = useRef<Set<number>>(new Set());
  const isFetchingRef = useRef(false);
  const offsetRef = useRef(0);
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
      if (mode === 'initial') {
        seenIds.current.clear();
        offsetRef.current = 0;
        pageRef.current = 1;
      } else if (isFetchingRef.current) {
        return;
      }

      const generation = generationRef.current;
      isFetchingRef.current = true;

      try {
        const searching = term.length > 0;
        const result = searching
          ? await searchLists({ query: term, page: pageRef.current, perPage: PAGE_SIZE }, signal)
          : await fetchPublicLists({ limit: PAGE_SIZE, offset: offsetRef.current }, signal);

        if (!mounted.current || generation !== generationRef.current) {
          return;
        }

        if (searching) {
          pageRef.current += 1;
        } else {
          offsetRef.current += result.lists.length;
        }

        const fresh = result.lists.filter((list) => !seenIds.current.has(list.id));
        fresh.forEach((list) => seenIds.current.add(list.id));

        const hasMore = searching
          ? (pageRef.current - 1) * PAGE_SIZE < result.total
          : result.lists.length >= PAGE_SIZE;

        setState((prev) => ({
          term,
          lists: mode === 'initial' ? fresh : [...prev.lists, ...fresh],
          total: result.total,
          hasMore,
          status: 'ready',
          error: null,
        }));
        setLoadMoreError(null);
      } catch (caught) {
        if (caught instanceof Error && caught.name === 'AbortError') {
          return;
        }
        if (!mounted.current || generation !== generationRef.current) {
          return;
        }
        const message = caught instanceof Error ? caught.message : 'Something went wrong.';
        if (mode === 'more') {
          setState((prev) => ({
            ...prev,
            hasMore: false,
          }));
          setLoadMoreError(message);
        } else {
          setState((prev) => ({
            ...prev,
            status: 'error',
            error: message,
          }));
        }
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
    generationRef.current += 1;
    const controller = new AbortController();
    void load('initial', controller.signal);
    return () => controller.abort();
  }, [load]);

  const isStale = state.term !== term;
  const lists = isStale ? [] : state.lists;
  const total = isStale ? 0 : state.total;
  const hasMore = isStale ? false : state.hasMore;
  const status: BookListsStatus = isStale ? 'loading' : state.status;
  const error = isStale ? null : state.error;
  const loadMoreErrorState = isStale ? null : loadMoreError;

  const loadMore = useCallback(() => {
    if (isFetchingRef.current || !hasMore) {
      return;
    }
    setLoadingMore(true);
    void load('more');
  }, [load, hasMore]);

  const retryLoadMore = useCallback(() => {
    if (isFetchingRef.current) {
      return;
    }
    setLoadMoreError(null);
    setState((prev) => ({ ...prev, hasMore: true }));
    setLoadingMore(true);
    void load('more');
  }, [load]);

  const retry = useCallback(() => {
    generationRef.current += 1;
    setLoadMoreError(null);
    setState((prev) => ({ ...prev, status: 'loading', error: null }));
    void load('initial');
  }, [load]);

  return {
    lists,
    total,
    status,
    loadingMore,
    error,
    loadMoreError: loadMoreErrorState,
    hasMore,
    loadMore,
    retryLoadMore,
    retry,
  };
}
