import { useCallback, useEffect, useRef, useState } from 'react';

import { fetchBookBatch } from '@/lib/hardcover';
import type { Book, SwipeDirection } from '@/types/book';

const LOW_WATER_MARK = 4;
const MAX_EMPTY_BATCHES = 3;

export type DiscoverStatus = 'loading' | 'ready' | 'error';

export type UseDiscoverBooksResult = {
  current: Book | undefined;
  status: DiscoverStatus;
  error: string | null;
  hasMore: boolean;
  likedBooks: Book[];
  swipe: (direction: SwipeDirection) => void;
  retry: () => void;
};

export function useDiscoverBooks(): UseDiscoverBooksResult {
  const [books, setBooks] = useState<Book[]>([]);
  const [index, setIndex] = useState(0);
  const [status, setStatus] = useState<DiscoverStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [likedBooks, setLikedBooks] = useState<Book[]>([]);

  const seenIds = useRef<Set<string>>(new Set());
  const isFetchingRef = useRef(false);
  const emptyBatches = useRef(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const loadBatch = useCallback(async (mode: 'initial' | 'more', signal?: AbortSignal) => {
    if (isFetchingRef.current) {
      return;
    }
    isFetchingRef.current = true;

    try {
      const incoming = await fetchBookBatch(signal);
      if (!mounted.current) {
        return;
      }

      const fresh = incoming.filter((book) => !seenIds.current.has(book.id));
      fresh.forEach((book) => seenIds.current.add(book.id));

      emptyBatches.current = fresh.length === 0 ? emptyBatches.current + 1 : 0;
      if (incoming.length === 0 || emptyBatches.current >= MAX_EMPTY_BATCHES) {
        setHasMore(false);
      }

      setBooks((prev) => (mode === 'initial' ? fresh : [...prev, ...fresh]));
      setStatus('ready');
      setError(null);
    } catch (caught) {
      if (caught instanceof Error && caught.name === 'AbortError') {
        return;
      }
      if (!mounted.current) {
        return;
      }
      if (mode === 'initial') {
        setStatus('error');
        setError(caught instanceof Error ? caught.message : 'Something went wrong.');
      }
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async fetch; state updates run after the request resolves
    void loadBatch('initial', controller.signal);
    return () => controller.abort();
  }, [loadBatch]);

  const current = books[index];

  const swipe = useCallback(
    (direction: SwipeDirection) => {
      const book = books[index];
      if (!book) {
        return;
      }
      if (direction === 'right') {
        setLikedBooks((prev) =>
          prev.some((liked) => liked.id === book.id) ? prev : [...prev, book]
        );
      }
      const nextIndex = index + 1;
      setIndex(nextIndex);
      if (hasMore && books.length - nextIndex <= LOW_WATER_MARK) {
        void loadBatch('more');
      }
    },
    [books, index, hasMore, loadBatch]
  );

  const retry = useCallback(() => {
    seenIds.current.clear();
    emptyBatches.current = 0;
    setBooks([]);
    setIndex(0);
    setLikedBooks([]);
    setHasMore(true);
    setStatus('loading');
    setError(null);
    void loadBatch('initial');
  }, [loadBatch]);

  return {
    current,
    status,
    error,
    hasMore,
    likedBooks,
    swipe,
    retry,
  };
}
