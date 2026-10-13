import { useCallback, useEffect, useRef, useState } from 'react';

import { addLikedBook } from '@/lib/liked-books';
import { fetchBookBatch, fetchListBooks } from '@/lib/hardcover';
import type { Book, SwipeDirection } from '@/types/book';

const LOW_WATER_MARK = 4;
const MAX_EMPTY_BATCHES = 3;
const LIST_BATCH_SIZE = 20;

export type DiscoverStatus = 'loading' | 'ready' | 'error';

export type UseDiscoverBooksOptions = {
  listId?: number;
  books?: Book[];
};

export type UseDiscoverBooksResult = {
  current: Book | undefined;
  status: DiscoverStatus;
  error: string | null;
  hasMore: boolean;
  likedBooks: Book[];
  sourceEmpty: boolean;
  swipe: (direction: SwipeDirection) => void;
  retry: () => void;
};

export function useDiscoverBooks({ listId, books: localBooks }: UseDiscoverBooksOptions = {}): UseDiscoverBooksResult {
  const [books, setBooks] = useState<Book[]>([]);
  const [index, setIndex] = useState(0);
  const [status, setStatus] = useState<DiscoverStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [likedBooks, setLikedBooks] = useState<Book[]>([]);
  const [sourceEmpty, setSourceEmpty] = useState(false);

  const seenIds = useRef<Set<string>>(new Set());
  const isFetchingRef = useRef(false);
  const emptyBatches = useRef(0);
  const listOffset = useRef(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const loadBatch = useCallback(
    async (mode: 'initial' | 'more', signal?: AbortSignal) => {
      if (isFetchingRef.current) {
        return;
      }
      isFetchingRef.current = true;

      try {
        let incoming: Book[];
        if (localBooks) {
          incoming = mode === 'initial' ? localBooks : [];
        } else if (listId !== undefined) {
          incoming = await fetchListBooks(
            { listId, limit: LIST_BATCH_SIZE, offset: listOffset.current },
            signal
          );
        } else {
          incoming = await fetchBookBatch(signal);
        }
        if (!mounted.current) {
          return;
        }

        if (!localBooks && listId !== undefined) {
          listOffset.current += incoming.length;
        }

        const fresh = incoming.filter((book) => !seenIds.current.has(book.id));
        fresh.forEach((book) => seenIds.current.add(book.id));

        emptyBatches.current = fresh.length === 0 ? emptyBatches.current + 1 : 0;
        const sourceExhausted =
          Boolean(localBooks) ||
          incoming.length === 0 ||
          (listId !== undefined && incoming.length < LIST_BATCH_SIZE) ||
          emptyBatches.current >= MAX_EMPTY_BATCHES;
        if (sourceExhausted) {
          setHasMore(false);
        }

        const isLocalSource = Boolean(localBooks) || listId !== undefined;
        if (mode === 'initial' && isLocalSource && incoming.length === 0) {
          setSourceEmpty(true);
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
    },
    [listId, localBooks]
  );

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
        void addLikedBook(book).catch(() => {});
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
    listOffset.current = 0;
    setBooks([]);
    setIndex(0);
    setLikedBooks([]);
    setHasMore(true);
    setSourceEmpty(false);
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
    sourceEmpty,
    swipe,
    retry,
  };
}
