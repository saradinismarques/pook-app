import { useCallback, useEffect, useSyncExternalStore } from 'react';

import {
  addLikedBook,
  getLikedBooksLoadedSnapshot,
  getLikedBooksSnapshot,
  loadLikedBooks,
  removeLikedBook,
  subscribeLikedBooks,
} from '@/lib/liked-books';
import type { Book } from '@/types/book';

export type UseLikedBooksResult = {
  books: Book[];
  loaded: boolean;
};

export function useLikedBooks(): UseLikedBooksResult {
  const books = useSyncExternalStore(
    subscribeLikedBooks,
    getLikedBooksSnapshot,
    getLikedBooksSnapshot
  );
  const loaded = useSyncExternalStore(
    subscribeLikedBooks,
    getLikedBooksLoadedSnapshot,
    getLikedBooksLoadedSnapshot
  );

  useEffect(() => {
    void loadLikedBooks();
  }, []);

  return { books, loaded };
}

export function useLikeBook(): (book: Book) => Promise<void> {
  return useCallback((book: Book) => addLikedBook(book), []);
}

export function useUnlikeBook(): (id: string) => Promise<void> {
  return useCallback((id: string) => removeLikedBook(id), []);
}
