import type { Book } from '@/types/book';

const mockGetItem = jest.fn();
const mockSetItem = jest.fn();

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: (...args: unknown[]) => mockGetItem(...args),
    setItem: (...args: unknown[]) => mockSetItem(...args),
  },
}));

const STORAGE_KEY = 'pook.liked-books.v1';

declare const require: (id: string) => typeof import('@/lib/liked-books');

type LikedBooksStore = typeof import('@/lib/liked-books');

function book(id: string, title = `Book ${id}`): Book {
  return { id, title, authors: ['Author'], categories: [] };
}

describe('liked-books store', () => {
  beforeEach(() => {
    jest.resetModules();
    mockGetItem.mockReset();
    mockSetItem.mockReset();
    mockGetItem.mockResolvedValue(null);
    mockSetItem.mockResolvedValue(undefined);
  });

  function loadStore(): LikedBooksStore {
    return require('@/lib/liked-books');
  }

  it('loads an empty list when storage is empty', async () => {
    const store = loadStore();
    await store.loadLikedBooks();
    expect(store.getLikedBooksSnapshot()).toEqual([]);
    expect(store.getLikedBooksLoadedSnapshot()).toBe(true);
  });

  it('adds a book and persists it', async () => {
    const store = loadStore();
    await store.loadLikedBooks();
    await store.addLikedBook(book('1'));
    expect(store.getLikedBooksSnapshot().map((b) => b.id)).toEqual(['1']);
    expect(mockSetItem).toHaveBeenCalledWith(STORAGE_KEY, JSON.stringify([book('1')]));
  });

  it('dedupes books by id', async () => {
    const store = loadStore();
    await store.loadLikedBooks();
    await store.addLikedBook(book('1'));
    await store.addLikedBook(book('1', 'Renamed'));
    expect(store.getLikedBooksSnapshot()).toHaveLength(1);
    expect(store.getLikedBooksSnapshot()[0]?.title).toBe('Book 1');
    expect(mockSetItem).toHaveBeenCalledTimes(1);
  });

  it('notifies subscribers when a book is added', async () => {
    const store = loadStore();
    await store.loadLikedBooks();
    const listener = jest.fn();
    const unsubscribe = store.subscribeLikedBooks(listener);
    await store.addLikedBook(book('2'));
    expect(listener).toHaveBeenCalled();
    unsubscribe();
  });

  it('removes a book by id and persists the change', async () => {
    const store = loadStore();
    await store.loadLikedBooks();
    await store.addLikedBook(book('1'));
    await store.addLikedBook(book('2'));
    await store.removeLikedBook('1');
    expect(store.getLikedBooksSnapshot().map((b) => b.id)).toEqual(['2']);
  });

  it('does nothing when removing an unknown id', async () => {
    const store = loadStore();
    await store.loadLikedBooks();
    await store.addLikedBook(book('1'));
    mockSetItem.mockClear();
    await store.removeLikedBook('999');
    expect(store.getLikedBooksSnapshot().map((b) => b.id)).toEqual(['1']);
    expect(mockSetItem).not.toHaveBeenCalled();
  });

  it('filters invalid entries when loading', async () => {
    mockGetItem.mockResolvedValueOnce(
      JSON.stringify([book('1'), { id: 42, title: 'Bad' }, null, 'nope'])
    );
    const store = loadStore();
    await store.loadLikedBooks();
    expect(store.getLikedBooksSnapshot().map((b) => b.id)).toEqual(['1']);
  });
});
