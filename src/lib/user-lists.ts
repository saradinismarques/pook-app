import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Book } from '@/types/book';
import type { UserList } from '@/types/list';

const STORAGE_KEY = 'pook.user-lists.v1';

const EMPTY: UserList[] = [];

let cache: UserList[] | null = null;
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

function isUserList(value: unknown): value is UserList {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const list = value as Partial<UserList>;
  return (
    typeof list.id === 'string' &&
    typeof list.name === 'string' &&
    Array.isArray(list.books) &&
    list.books.every(isBook)
  );
}

export function subscribeUserLists(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getUserListsSnapshot(): UserList[] {
  return cache ?? EMPTY;
}

export function getUserListsLoadedSnapshot(): boolean {
  return cache !== null;
}

export async function loadUserLists(): Promise<UserList[]> {
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
        cache = Array.isArray(parsed) ? parsed.filter(isUserList) : [];
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

async function persist(next: UserList[]): Promise<void> {
  cache = next;
  emit();
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export async function createUserList(name: string, books: Book[]): Promise<UserList> {
  const existing = await loadUserLists();
  const now = Date.now();
  const list: UserList = {
    id: `${now.toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    name: name.trim(),
    books,
    createdAt: now,
    updatedAt: now,
  };
  await persist([list, ...existing]);
  return list;
}

export async function updateUserList(
  id: string,
  patch: { name?: string; books?: Book[] }
): Promise<void> {
  const existing = await loadUserLists();
  const next = existing.map((list) =>
    list.id === id
      ? {
          ...list,
          name: patch.name !== undefined ? patch.name.trim() : list.name,
          books: patch.books ?? list.books,
          updatedAt: Date.now(),
        }
      : list
  );
  await persist(next);
}

export async function deleteUserList(id: string): Promise<void> {
  const existing = await loadUserLists();
  await persist(existing.filter((list) => list.id !== id));
}
