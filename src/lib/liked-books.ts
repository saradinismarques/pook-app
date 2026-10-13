import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Book } from '@/types/book';

const STORAGE_KEY = 'pook.liked-books.v1';

const EMPTY: Book[] = [];

let cache: Book[] | null = null;
let loadPromise: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

function isBook(value: unknown): value is Book {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const book = value as Partial<Book>;
  return typeof book.id === 'string' && typeof book.title === 'string';
}

export function subscribeLikedBooks(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getLikedBooksSnapshot(): Book[] {
  return cache ?? EMPTY;
}

export function getLikedBooksLoadedSnapshot(): boolean {
  return cache !== null;
}

export async function loadLikedBooks(): Promise<Book[]> {
  if (cache) {
    return cache;
  }
  if (!loadPromise) {
    loadPromise = AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        let parsed: unknown = null;
        try {
          parsed = raw ? JSON.parse(raw) : [];
        } catch {
          parsed = [];
        }
        cache = Array.isArray(parsed) ? parsed.filter(isBook) : [];
      })
      .catch(() => {
        cache = [];
      })
      .finally(() => {
        emit();
      });
  }
  await loadPromise;
  return cache ?? EMPTY;
}

async function persist(next: Book[]): Promise<void> {
  cache = next;
  emit();
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export async function addLikedBook(book: Book): Promise<void> {
  const existing = await loadLikedBooks();
  if (existing.some((liked) => liked.id === book.id)) {
    return;
  }
  await persist([book, ...existing]);
}

export async function removeLikedBook(id: string): Promise<void> {
  const existing = await loadLikedBooks();
  const next = existing.filter((book) => book.id !== id);
  if (next.length === existing.length) {
    return;
  }
  await persist(next);
}
