import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BookGridTile } from '@/components/lists/book-grid-tile';
import { BookPickRow } from '@/components/lists/book-pick-row';
import { ListSearchBar } from '@/components/lists/list-search-bar';
import { SelectedBooksStrip } from '@/components/lists/selected-books-strip';
import { AppButton } from '@/components/ui/app-button';
import { Fonts } from '@/constants/theme';
import { useBookSearch } from '@/hooks/use-book-search';
import { usePopularBooks } from '@/hooks/use-popular-books';
import { useUserLists } from '@/hooks/use-user-lists';
import type { Book } from '@/types/book';

const SEARCH_DEBOUNCE_MS = 350;
const EMPTY_BOOKS: Book[] = [];

export default function CreateListScreen() {
  const { listId } = useLocalSearchParams<{ listId?: string }>();
  const { lists, loaded, createList, updateList, deleteList } = useUserLists();
  const isDark = useColorScheme() === 'dark';

  const [name, setName] = useState('');
  const [selected, setSelected] = useState<Book[]>([]);
  const [initializedFor, setInitializedFor] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { books, total, status, loadingMore, error, hasMore, loadMore, retry } =
    useBookSearch(debouncedSearch);
  const {
    books: popularBooks,
    loadingMore: popularLoadingMore,
    hasMore: popularHasMore,
    loadMore: popularLoadMore,
  } = usePopularBooks();
  const isIdle = status === 'idle';

  const isEditing = typeof listId === 'string' && listId.length > 0;
  const existing = isEditing ? lists.find((list) => list.id === listId) : undefined;

  if (loaded && existing && initializedFor !== existing.id) {
    setInitializedFor(existing.id);
    setName(existing.name);
    setSelected(existing.books);
  }

  const selectedIds = new Set(selected.map((book) => book.id));

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
      router.replace('/lists');
    }
  }, []);

  const handleAdd = useCallback((book: Book) => {
    setSelected((prev) => (prev.some((item) => item.id === book.id) ? prev : [...prev, book]));
  }, []);

  const handleRemove = useCallback((book: Book) => {
    setSelected((prev) => prev.filter((item) => item.id !== book.id));
  }, []);

  const trimmedName = name.trim();
  const canSave = trimmedName.length > 0 && selected.length > 0 && !saving;

  const handleSave = useCallback(async () => {
    if (!canSave) {
      return;
    }
    setSaving(true);
    setActionError(null);
    try {
      if (isEditing && listId) {
        await updateList(listId, { name: trimmedName, books: selected });
      } else {
        await createList(trimmedName, selected);
      }
      goBack();
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : 'Could not save the list.');
    } finally {
      setSaving(false);
    }
  }, [canSave, createList, goBack, isEditing, listId, selected, trimmedName, updateList]);

  const handleDelete = useCallback(() => {
    if (!isEditing || !listId) {
      return;
    }
    Alert.alert('Delete list', `Remove “${trimmedName || 'this list'}”?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void deleteList(listId).then(goBack);
        },
      },
    ]);
  }, [deleteList, goBack, isEditing, listId, trimmedName]);

  const renderFooter = () => {
    if (isIdle) {
      return popularLoadingMore ? (
        <View className="items-center py-4">
          <ActivityIndicator color="#C0562F" />
        </View>
      ) : null;
    }

    if (status === 'loading') {
      return (
        <View className="items-center gap-3 py-8">
          <ActivityIndicator color="#C0562F" />
          <Text className="text-sm text-taupe dark:text-fog">Searching books…</Text>
        </View>
      );
    }

    if (status === 'error') {
      return (
        <View className="items-center gap-4 py-8">
          <Text className="text-center text-sm text-taupe dark:text-fog">
            {error ?? 'Something went wrong.'}
          </Text>
          <AppButton label="Try again" variant="secondary" onPress={retry} />
        </View>
      );
    }

    if (books.length === 0) {
      return (
        <View className="items-center gap-2 py-8">
          <Text className="text-center text-sm text-taupe dark:text-fog">
            No books found for “{debouncedSearch.trim()}”.
          </Text>
        </View>
      );
    }

    if (loadingMore) {
      return (
        <View className="items-center py-4">
          <ActivityIndicator color="#C0562F" />
        </View>
      );
    }

    if (hasMore) {
      return (
        <View className="items-center py-4">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Load more books"
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
    }

    return null;
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
            numberOfLines={1}
            ellipsizeMode="tail"
            className="flex-1 px-2 text-center text-2xl font-bold text-ink dark:text-haze">
            {isEditing ? 'Edit list' : 'Create a list'}
          </Text>

          <View className="h-10 w-10" />
        </View>

        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={90}>
          <View className="gap-4 pb-4">
            <View className="h-12 justify-center rounded-full bg-edge px-4 dark:bg-edge-dark">
              <TextInput
                accessibilityLabel="List name"
                onChangeText={setName}
                placeholder="Name your list"
                placeholderTextColor="#7C6B5A"
                value={name}
                className="w-full p-0 text-base leading-tight text-ink dark:text-haze"
              />
            </View>

            <SelectedBooksStrip books={selected} onRemove={handleRemove} />

            <View className="gap-2">
              <ListSearchBar
                value={search}
                onChangeText={handleSearchChange}
                onClear={handleSearchClear}
                placeholder="Search all books"
                accessibilityLabel="Search books"
              />
              {isIdle ? (
                <Text className="text-[11px] font-bold uppercase tracking-wide text-taupe dark:text-fog">
                  Popular books
                </Text>
              ) : total > 0 && status === 'ready' ? (
                <Text className="text-[11px] font-bold uppercase tracking-wide text-taupe dark:text-fog">
                  Results · {total.toLocaleString()}
                </Text>
              ) : null}
            </View>

            {actionError ? (
              <Text className="text-center text-sm text-ember">{actionError}</Text>
            ) : null}
          </View>

          <FlatList
            key={isIdle ? 'grid' : 'list'}
            className="flex-1"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 16 }}
            data={isIdle ? popularBooks : status === 'ready' ? books : EMPTY_BOOKS}
            keyExtractor={(item) => item.id}
            numColumns={isIdle ? 3 : 1}
            columnWrapperStyle={isIdle ? { gap: 12 } : undefined}
            renderItem={
              isIdle
                ? ({ item }) => (
                    <BookGridTile
                      book={item}
                      added={selectedIds.has(item.id)}
                      onPress={() => handleAdd(item)}
                    />
                  )
                : ({ item }) => (
                    <BookPickRow
                      book={item}
                      action="add"
                      added={selectedIds.has(item.id)}
                      onPress={() => handleAdd(item)}
                    />
                  )
            }
            ItemSeparatorComponent={isIdle ? undefined : () => <View className="h-2" />}
            onEndReached={isIdle ? (popularHasMore ? popularLoadMore : undefined) : loadMore}
            onEndReachedThreshold={0.4}
            ListFooterComponent={renderFooter}
          />
        </KeyboardAvoidingView>

        <View className="gap-3 pt-3">
          <AppButton
            label={saving ? 'Saving…' : isEditing ? 'Save changes' : 'Create list'}
            onPress={handleSave}
            disabled={!canSave}
          />
          {isEditing ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Delete list"
              onPress={handleDelete}
              className="min-h-button items-center justify-center rounded-full px-6 py-4 active:opacity-80">
              <Text
                style={{ fontFamily: Fonts.rounded }}
                className="text-button font-semibold text-ember">
                Delete list
              </Text>
            </Pressable>
          ) : null}
        </View>
      </SafeAreaView>
    </View>
  );
}
