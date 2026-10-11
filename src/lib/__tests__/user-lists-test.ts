import type { Book } from '@/types/book';

jest.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map<string, string>();
  return {
    __esModule: true,
    default: {
      getItem: jest.fn((key: string) =>
        Promise.resolve(store.has(key) ? (store.get(key) as string) : null)
      ),
      setItem: jest.fn((key: string, value: string) => {
        store.set(key, value);
        return Promise.resolve();
      }),
      removeItem: jest.fn((key: string) => {
        store.delete(key);
        return Promise.resolve();
      }),
    },
  };
});

type UserListsModule = typeof import('@/lib/user-lists');
type AsyncStorageModule = typeof import('@react-native-async-storage/async-storage');

declare const require: (id: string) => unknown;

const STORAGE_KEY = 'pook.user-lists.v1';

function book(id: string, title: string): Book {
  return { id, title, authors: ['Author'], categories: [] };
}

function loadModule<T>(path: string): T {
  return require(path) as T;
}

function freshStore(): UserListsModule {
  jest.resetModules();
  return loadModule<UserListsModule>('@/lib/user-lists');
}

function currentAsyncStorage(): AsyncStorageModule['default'] {
  return loadModule<AsyncStorageModule>('@react-native-async-storage/async-storage').default;
}

describe('user-lists store', () => {
  it('loads an empty store by default', async () => {
    const store = freshStore();
    await store.loadUserLists();
    expect(store.getUserListsSnapshot()).toEqual([]);
    expect(store.getUserListsLoadedSnapshot()).toBe(true);
  });

  it('creates a list at the front and persists it', async () => {
    const store = freshStore();
    await store.loadUserLists();
    const created = await store.createUserList('Sci-Fi', [book('1', 'Dune')]);

    const snapshot = store.getUserListsSnapshot();
    expect(snapshot).toHaveLength(1);
    expect(snapshot[0]).toMatchObject({ name: 'Sci-Fi', books: [{ id: '1' }] });
    expect(created.id).toBeTruthy();

    const raw = await currentAsyncStorage().getItem(STORAGE_KEY);
    expect(raw).toContain('Sci-Fi');
  });

  it('updates name and books and bumps updatedAt', async () => {
    const store = freshStore();
    await store.loadUserLists();
    const created = await store.createUserList('Old Name', [book('1', 'Dune')]);
    await new Promise((resolve) => setTimeout(resolve, 5));
    await store.updateUserList(created.id, { name: 'New Name', books: [book('2', 'Emma')] });

    const [updated] = store.getUserListsSnapshot();
    expect(updated.name).toBe('New Name');
    expect(updated.books[0]?.id).toBe('2');
    expect(updated.updatedAt).toBeGreaterThanOrEqual(updated.createdAt);
  });

  it('deletes a list', async () => {
    const store = freshStore();
    await store.loadUserLists();
    const created = await store.createUserList('Doomed', [book('1', 'Dune')]);
    await store.deleteUserList(created.id);
    expect(store.getUserListsSnapshot()).toEqual([]);
  });

  it('recovers from corrupted storage', async () => {
    jest.resetModules();
    await currentAsyncStorage().setItem(STORAGE_KEY, '{not json');
    const store = loadModule<UserListsModule>('@/lib/user-lists');
    await store.loadUserLists();
    expect(store.getUserListsSnapshot()).toEqual([]);
  });

  it('filters entries that are not valid lists', async () => {
    jest.resetModules();
    await currentAsyncStorage().setItem(
      STORAGE_KEY,
      JSON.stringify([
        { id: 'a', name: 'Valid', books: [book('1', 'Dune')] },
        { id: 'b', name: 'NoBooks' },
        'not-a-list',
        { id: 'c', name: 'BadBook', books: [{ id: 1, title: 'Numeric id' }] },
      ])
    );
    const store = loadModule<UserListsModule>('@/lib/user-lists');
    await store.loadUserLists();
    const snapshot = store.getUserListsSnapshot();
    expect(snapshot).toHaveLength(1);
    expect(snapshot[0]?.name).toBe('Valid');
  });

  it('notifies subscribers when lists change', async () => {
    const store = freshStore();
    await store.loadUserLists();
    const listener = jest.fn();
    const unsubscribe = store.subscribeUserLists(listener);
    await store.createUserList('Notified', []);
    expect(listener).toHaveBeenCalled();
    unsubscribe();
  });
});
