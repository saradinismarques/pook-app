import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  useColorScheme,
  View,
  ViewToken,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BookPickRow } from '@/components/lists/book-pick-row';
import { ListPreviewCard } from '@/components/lists/list-preview-card';
import { ListRow } from '@/components/lists/list-row';
import { ListSearchBar } from '@/components/lists/list-search-bar';
import { AppButton } from '@/components/ui/app-button';
import { Fonts } from '@/constants/theme';
import { useBookLists } from '@/hooks/use-book-lists';
import { useBookSearch } from '@/hooks/use-book-search';
import { useLikedBooks } from '@/hooks/use-liked-books';
import { useUserLists } from '@/hooks/use-user-lists';
import { addLikedBook } from '@/lib/liked-books';
import { fetchListPreviews, fetchPopularBooks } from '@/lib/hardcover';
import type { Book } from '@/types/book';
import type { BookList, UserList } from '@/types/list';

const SEARCH_DEBOUNCE_MS = 350;
const PREVIEW_COUNT = 6;
const PREVIEW_RETRY_MS = 3000;

export default function ListsScreen() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    lists,
    total,
    status,
    loadingMore,
    error,
    loadMoreError,
    hasMore,
    loadMore,
    retryLoadMore,
    retry,
  } = useBookLists(debouncedSearch);
  const { lists: userLists } = useUserLists();
  const {
    books: searchResults,
    total: bookTotal,
    status: bookSearchStatus,
    error: bookSearchError,
  } = useBookSearch(debouncedSearch);
  const { books: likedBooks } = useLikedBooks();
  const isDark = useColorScheme() === 'dark';

  const likedIds = new Set(likedBooks.map((book) => book.id));

  const [previews, setPreviews] = useState<Record<number, Book[]>>({});
  const [allBooksPreview, setAllBooksPreview] = useState<Book[] | null>(null);
  const requestedPreviewIds = useRef<Set<number>>(new Set());
  const ensurePreviewsRef = useRef<(listIds: number[]) => void>(() => {});

  const isSearching = debouncedSearch.trim().length > 0;

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (allBooksPreview !== null) {
      return;
    }
    const controller = new AbortController();
    fetchPopularBooks({ limit: PREVIEW_COUNT }, controller.signal)
      .then(setAllBooksPreview)
      .catch(() => setAllBooksPreview([]));
    return () => controller.abort();
  }, [allBooksPreview]);

  const ensurePreviews = useCallback((listIds: number[]) => {
    const missing = listIds.filter((id) => !requestedPreviewIds.current.has(id));
    if (missing.length === 0) {
      return;
    }
    missing.forEach((id) => requestedPreviewIds.current.add(id));
    fetchListPreviews(missing, PREVIEW_COUNT)
      .then(({ books, failedIds }) => {
        if (failedIds.length > 0) {
          failedIds.forEach((id) => requestedPreviewIds.current.delete(id));
          setTimeout(() => {
            ensurePreviewsRef.current(failedIds);
          }, PREVIEW_RETRY_MS);
        }
        if (books.size === 0) {
          return;
        }
        const update: Record<number, Book[]> = {};
        books.forEach((previewBooks, id) => {
          update[id] = previewBooks;
        });
        setPreviews((prev) => ({ ...prev, ...update }));
      })
      .catch(() => {
        missing.forEach((id) => requestedPreviewIds.current.delete(id));
        setTimeout(() => {
          ensurePreviewsRef.current(missing);
        }, PREVIEW_RETRY_MS);
      });
  }, []);

  useEffect(() => {
    ensurePreviewsRef.current = ensurePreviews;
  }, [ensurePreviews]);

  useEffect(() => {
    ensurePreviews(lists.slice(0, PREVIEW_COUNT).map((list) => list.id));
  }, [lists, ensurePreviews]);

  const [viewabilityConfig] = useState({ itemVisiblePercentThreshold: 40 });
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const ids: number[] = [];
      for (const token of viewableItems) {
        if (token.item && typeof token.item === 'object' && 'id' in token.item) {
          const id = (token.item as { id: unknown }).id;
          if (typeof id === 'number') {
            ids.push(id);
          }
        }
      }
      ensurePreviews(ids);
    },
    [ensurePreviews]
  );

  const handleAddToMyBooks = useCallback((book: Book) => {
    void addLikedBook(book).catch(() => {});
  }, []);

  const handleSearchChange = useCallback((text: string) => {
    setSearch(text);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(text);
    }, SEARCH_DEBOUNCE_MS);
  }, []);

  const handleSearchClear = useCallback(() => {
    setSearch('');
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    setDebouncedSearch('');
  }, []);

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  }, []);

  const handleAllBooks = useCallback(() => {
    router.push('/discover');
  }, []);

  const handleCreateList = useCallback(() => {
    router.push('/lists/create');
  }, []);

  const handlePublicList = useCallback((list: BookList) => {
    router.push({
      pathname: '/discover',
      params: { listId: String(list.id), listName: list.name },
    });
  }, []);

  const handleUserList = useCallback((list: UserList) => {
    router.push({
      pathname: '/discover',
      params: { userListId: list.id, listName: list.name },
    });
  }, []);

  const handleEditUserList = useCallback((list: UserList) => {
    router.push({ pathname: '/lists/create', params: { listId: list.id } });
  }, []);

  const renderUserLists = () => {
    if (isSearching || userLists.length === 0) {
      return null;
    }

    return (
      <View className="gap-3 pb-4">
        <Text className="text-[11px] font-bold uppercase tracking-wide text-taupe dark:text-fog">
          Your lists · {userLists.length}
        </Text>
        {userLists.map((list) => (
          <ListPreviewCard
            key={list.id}
            name={list.name}
            books={list.books}
            onPress={() => handleUserList(list)}
            onEdit={() => handleEditUserList(list)}
          />
        ))}
      </View>
    );
  };

  const renderBookResults = () => {
    if (!isSearching) {
      return null;
    }

    if (bookSearchStatus === 'loading') {
      return (
        <View className="gap-3 pb-5">
          <Text className="text-[11px] font-bold uppercase tracking-wide text-taupe dark:text-fog">
            Books
          </Text>
          <View className="flex-row items-center gap-3">
            <ActivityIndicator color="#C0562F" />
            <Text className="text-sm font-medium text-taupe dark:text-fog">
              Searching books…
            </Text>
          </View>
        </View>
      );
    }

    if (bookSearchStatus === 'error') {
      return (
        <View className="gap-2 pb-5">
          <Text className="text-[11px] font-bold uppercase tracking-wide text-taupe dark:text-fog">
            Books
          </Text>
          <Text className="text-sm text-taupe dark:text-fog">
            {bookSearchError ?? 'Couldn’t search books. Try again in a moment.'}
          </Text>
        </View>
      );
    }

    if (searchResults.length === 0) {
      return (
        <View className="gap-2 pb-5">
          <Text className="text-[11px] font-bold uppercase tracking-wide text-taupe dark:text-fog">
            Books
          </Text>
          <Text className="text-sm text-taupe dark:text-fog">No books match your search.</Text>
        </View>
      );
    }

    return (
      <View className="gap-3 pb-5">
        <Text className="text-[11px] font-bold uppercase tracking-wide text-taupe dark:text-fog">
          Books · {bookTotal > 0 ? bookTotal.toLocaleString() : searchResults.length}
        </Text>
        {searchResults.map((book) => (
          <BookPickRow
            key={book.id}
            book={book}
            action="add"
            added={likedIds.has(book.id)}
            onPress={() => handleAddToMyBooks(book)}
          />
        ))}
      </View>
    );
  };

  const renderListHeader = () => (
    <View>
      {renderBookResults()}

      {!isSearching ? (
        <View className="gap-3 pb-4">
          <ListRow
            name="Create a list"
            meta="Search books and build your own"
            icon="add-circle-outline"
            onPress={handleCreateList}
          />
          <ListPreviewCard
            name="All Books"
            books={allBooksPreview ?? undefined}
            onPress={handleAllBooks}
          />
        </View>
      ) : null}

      {renderUserLists()}

      <Text className="pb-3 text-[11px] font-bold uppercase tracking-wide text-taupe dark:text-fog">
        {isSearching
          ? `Lists${total > 0 ? ` · ${total.toLocaleString()}` : ''}`
          : `Public lists${total > 0 ? ` · ${total.toLocaleString()}` : ''}`}
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (isSearching && lists.length === 0) {
      return null;
    }

    if (loadingMore) {
      return (
        <View className="items-center py-4">
          <ActivityIndicator color="#C0562F" />
        </View>
      );
    }

    if (loadMoreError) {
      return (
        <View className="items-center gap-2 py-4">
          <Text className="text-sm text-taupe dark:text-fog">
            Couldn’t load more lists. You’ve reached what we can load right now.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retry loading more lists"
            onPress={retryLoadMore}
            className="min-h-button items-center justify-center rounded-full border border-edge bg-sand px-6 py-3 active:opacity-80 dark:border-edge-dark dark:bg-coal">
            <Text
              style={{ fontFamily: Fonts.rounded }}
              className="text-button font-semibold text-ink dark:text-haze">
              Try again
            </Text>
          </Pressable>
        </View>
      );
    }

    if (!hasMore) {
      return (
        <View className="items-center py-4">
          <Text className="text-xs text-taupe dark:text-fog">
            {isSearching ? 'No more results' : 'You’ve seen every list'}
          </Text>
        </View>
      );
    }

    return (
      <View className="items-center py-4">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Load more lists"
          onPress={loadMore}
          className="min-h-button items-center justify-center rounded-full border border-edge bg-sand px-6 py-4 active:opacity-80 dark:border-edge-dark dark:bg-coal">
          <Text
            style={{ fontFamily: Fonts.rounded }}
            className="text-button font-semibold text-ink dark:text-haze">
            Load more
          </Text>
        </Pressable>
      </View>
    );
  };

  const renderSearchListsState = () => {
    if (status === 'loading') {
      return (
        <View className="flex-row items-center gap-3 pb-3">
          <ActivityIndicator color="#C0562F" />
          <Text className="text-sm font-medium text-taupe dark:text-fog">Searching lists…</Text>
        </View>
      );
    }

    if (status === 'error') {
      return (
        <View className="gap-2 pb-3">
          <Text className="text-sm text-ink dark:text-haze">Couldn’t search lists</Text>
          <Text className="text-sm text-taupe dark:text-fog">
            {error ?? 'Something went wrong. Please try again.'}
          </Text>
        </View>
      );
    }

    if (lists.length === 0) {
      return (
        <View className="gap-1 pb-3">
          <Text className="text-sm text-ink dark:text-haze">No lists match your search</Text>
          <Text className="text-sm text-taupe dark:text-fog">
            Try a different search.
          </Text>
        </View>
      );
    }

    return null;
  };

  const renderBody = () => {
    if (isSearching) {
      return (
        <FlatList
          className="flex-1"
          data={lists}
          keyExtractor={(item) => String(item.id)}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <ListPreviewCard
              name={item.name}
              books={previews[item.id]}
              onPress={() => handlePublicList(item)}
            />
          )}
          ItemSeparatorComponent={() => <View className="h-3" />}
          contentContainerStyle={{ paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          ListHeaderComponent={
            <View>
              {renderListHeader()}
              {renderSearchListsState()}
            </View>
          }
          ListFooterComponent={renderFooter}
        />
      );
    }

    if (status === 'loading') {
      return (
        <View className="flex-1 items-center justify-center gap-4">
          <ActivityIndicator color="#C0562F" />
          <Text className="text-sm font-medium text-taupe dark:text-fog">
            Finding lists for you…
          </Text>
        </View>
      );
    }

    if (status === 'error') {
      return (
        <View className="flex-1 items-center justify-center gap-5">
          <Text className="text-center text-tagline font-medium text-ink dark:text-haze">
            Couldn’t load lists
          </Text>
          <Text className="text-center text-sm text-taupe dark:text-fog">
            {error ?? 'Something went wrong. Please try again.'}
          </Text>
          <AppButton label="Try again" onPress={retry} />
        </View>
      );
    }

    if (lists.length === 0) {
      return (
        <View className="flex-1">
          {renderListHeader()}
          <View className="flex-1 items-center justify-center gap-4">
            <Text className="text-center text-tagline font-medium text-ink dark:text-haze">
              No public lists right now
            </Text>
            <Text className="text-center text-sm text-taupe dark:text-fog">
              New lists show up here.
            </Text>
            <AppButton label="Try again" variant="secondary" onPress={retry} />
          </View>
        </View>
      );
    }

    return (
      <FlatList
        className="flex-1"
        data={lists}
        keyExtractor={(item) => String(item.id)}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <ListPreviewCard
            name={item.name}
            books={previews[item.id]}
            onPress={() => handlePublicList(item)}
          />
        )}
        ItemSeparatorComponent={() => <View className="h-3" />}
        contentContainerStyle={{ paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        ListHeaderComponent={renderListHeader}
        ListFooterComponent={renderFooter}
      />
    );
  };

  return (
    <View className="flex-1 items-center bg-paper dark:bg-night">
      <SafeAreaView className="flex-1 w-full max-w-content px-6 pb-4">
        <View className="flex-row items-center justify-between py-2">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={goBack}
            className="h-10 w-10 items-center justify-center rounded-full border border-edge bg-sand active:opacity-80 dark:border-edge-dark dark:bg-coal">
            <Ionicons name="chevron-back" size={22} color={isDark ? '#F5EDE3' : '#2B211A'} />
          </Pressable>

          <Text
            style={{ fontFamily: Fonts.serif }}
            className="flex-1 px-2 text-center text-2xl font-bold text-ink dark:text-haze"
            numberOfLines={1}
            ellipsizeMode="tail">
            Choose a list
          </Text>

          <View className="h-10 w-10" />
        </View>

        <View className="pb-4">
          <ListSearchBar
            value={search}
            onChangeText={handleSearchChange}
            onClear={handleSearchClear}
          />
        </View>

        {renderBody()}
      </SafeAreaView>
    </View>
  );
}
