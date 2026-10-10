import { useCallback, useEffect, useRef, useState } from 'react';

import { fetchPopularBooks } from '@/lib/hardcover';
import type { Book } from '@/types/book';

const PAGE_SIZE = 12;

export type PopularBooksResult = {
  books: Book[];
  status: 'loading' | 'ready';
  hasMore: boolean;
  loadingMore: boolean;
  loadMore: () => void;
};

export function usePopularBooks(): PopularBooksResult {
  const [books, setBooks] = useState<Book[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready'>('loading');
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const seenIds = useRef<Set<string>>(new Set());
  const offsetRef = useRef(0);
  const isFetchingRef = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const load = useCallback(async (mode: 'initial' | 'more', signal?: AbortSignal) => {
    if (isFetchingRef.current) {
      return;
    }
    isFetchingRef.current = true;

    try {
      const incoming = await fetchPopularBooks(
        { limit: PAGE_SIZE, offset: offsetRef.current },
        signal
      );
      if (!mounted.current) {
        return;
      }

      offsetRef.current += incoming.length;
      if (incoming.length < PAGE_SIZE) {
        setHasMore(false);
      }

      const fresh = incoming.filter((book) => !seenIds.current.has(book.id));
      fresh.forEach((book) => seenIds.current.add(book.id));

      setBooks((prev) => (mode === 'initial' ? fresh : [...prev, ...fresh]));
      setStatus('ready');
    } catch (caught) {
      if (caught instanceof Error && caught.name === 'AbortError') {
        return;
      }
      if (!mounted.current) {
        return;
      }
      if (mode === 'initial') {
        setStatus('ready');
      }
    } finally {
      isFetchingRef.current = false;
      if (mounted.current) {
        setLoadingMore(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- setState only runs after the await inside load
    void load('initial', controller.signal);
    return () => controller.abort();
  }, [load]);

  const loadMore = useCallback(() => {
    if (isFetchingRef.current || !hasMore) {
      return;
    }
    setLoadingMore(true);
    void load('more');
  }, [load, hasMore]);

  return { books, status, hasMore, loadingMore, loadMore };
}
