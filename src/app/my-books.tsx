import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/app-button';
import { Fonts } from '@/constants/theme';
import { useLikedBooks, useUnlikeBook } from '@/hooks/use-liked-books';
import type { Book } from '@/types/book';

function BookRow({ book, onRemove }: { book: Book; onRemove: (id: string) => void }) {
  const year = book.publishedDate?.slice(0, 4);
  const byline = [book.authors.join(', '), year].filter(Boolean).join(' · ');

  return (
    <View className="flex-row items-center gap-3 rounded-2xl border border-edge bg-sand p-3 dark:border-edge-dark dark:bg-coal">
      {book.thumbnail ? (
        <Image
          source={{ uri: book.thumbnail }}
          contentFit="cover"
          transition={200}
          style={{ width: 58, height: 87 }}
          className="shrink-0 rounded-md"
          accessibilityLabel={`Cover of ${book.title}`}
        />
      ) : (
        <View className="h-[87px] w-[58px] shrink-0 items-center justify-center rounded-md bg-edge dark:bg-edge-dark">
          <Text
            style={{ fontFamily: Fonts.serif }}
            className="text-2xl font-bold text-taupe dark:text-fog">
            {book.title.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}

      <View className="flex-1 gap-1">
        <Text
          numberOfLines={2}
          style={{ fontFamily: Fonts.serif }}
          className="text-base font-bold text-ink dark:text-haze">
          {book.title}
        </Text>
        {byline ? (
          <Text numberOfLines={1} className="text-sm text-taupe dark:text-fog">
            {byline}
          </Text>
        ) : null}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Remove ${book.title} from My Books`}
        onPress={() => onRemove(book.id)}
        hitSlop={8}
        className="h-10 w-10 shrink-0 items-center justify-center rounded-full bg-edge active:opacity-80 dark:bg-edge-dark">
        <Ionicons name="close" size={20} color="#7C6B5A" />
      </Pressable>
    </View>
  );
}

export default function MyBooksScreen() {
  const { books: likedBooks, loaded } = useLikedBooks();
  const removeLikedBook = useUnlikeBook();
  const isDark = useColorScheme() === 'dark';

  const books = useMemo(
    () => [...likedBooks].sort((a, b) => a.title.localeCompare(b.title)),
    [likedBooks]
  );

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  }, []);

  const handlePickBooks = useCallback(() => {
    router.push('/lists');
  }, []);

  const handleRemove = useCallback(
    (id: string) => {
      void removeLikedBook(id).catch(() => {});
    },
    [removeLikedBook]
  );

  const renderBody = () => {
    if (!loaded) {
      return (
        <View className="flex-1 items-center justify-center gap-4">
          <ActivityIndicator color="#C0562F" />
          <Text className="text-sm font-medium text-taupe dark:text-fog">Loading your books…</Text>
        </View>
      );
    }

    if (books.length === 0) {
      return (
        <View className="flex-1 items-center justify-center gap-5">
          <Ionicons name="book-outline" size={40} color="#7C6B5A" />
          <Text className="text-center text-tagline font-medium text-ink dark:text-haze">
            No books saved yet
          </Text>
          <Text className="text-center text-sm text-taupe dark:text-fog">
            Pick books in the library to add them to your collection.
          </Text>
          <AppButton label="Pick books" onPress={handlePickBooks} />
        </View>
      );
    }

    return (
      <FlatList
        data={books}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <BookRow book={item} onRemove={handleRemove} />}
        ItemSeparatorComponent={() => <View className="h-2" />}
        contentContainerStyle={{ paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Text className="pb-3 text-[11px] font-bold uppercase tracking-wide text-taupe dark:text-fog">
            {books.length === 1 ? '1 book' : `${books.length} books`}
          </Text>
        }
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
            numberOfLines={1}
            ellipsizeMode="tail"
            className="flex-1 px-2 text-center text-2xl font-bold text-ink dark:text-haze">
            My Books
          </Text>

          <View className="h-10 w-10" />
        </View>

        <View className="flex-1 pt-2">{renderBody()}</View>
      </SafeAreaView>
    </View>
  );
}
