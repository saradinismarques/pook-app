import { useCallback, useEffect, useSyncExternalStore } from 'react';

import {
  createUserList,
  deleteUserList,
  getUserListsLoadedSnapshot,
  getUserListsSnapshot,
  loadUserLists,
  subscribeUserLists,
  updateUserList,
} from '@/lib/user-lists';
import type { Book } from '@/types/book';
import type { UserList } from '@/types/list';

export type UseUserListsResult = {
  lists: UserList[];
  loaded: boolean;
  createList: (name: string, books: Book[]) => Promise<UserList>;
  updateList: (id: string, patch: { name?: string; books?: Book[] }) => Promise<void>;
  deleteList: (id: string) => Promise<void>;
};

export function useUserLists(): UseUserListsResult {
  const lists = useSyncExternalStore(subscribeUserLists, getUserListsSnapshot, getUserListsSnapshot);
  const loaded = useSyncExternalStore(
    subscribeUserLists,
    getUserListsLoadedSnapshot,
    getUserListsLoadedSnapshot
  );

  useEffect(() => {
    void loadUserLists();
  }, []);

  const createList = useCallback(
    (name: string, books: Book[]) => createUserList(name, books),
    []
  );
  const updateList = useCallback(
    (id: string, patch: { name?: string; books?: Book[] }) => updateUserList(id, patch),
    []
  );
  const deleteList = useCallback((id: string) => deleteUserList(id), []);

  return { lists, loaded, createList, updateList, deleteList };
}
