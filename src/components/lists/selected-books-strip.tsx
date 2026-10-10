import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { Fonts } from '@/constants/theme';
import type { Book } from '@/types/book';

export type SelectedBooksStripProps = {
  books: Book[];
  onRemove: (book: Book) => void;
};

function Cover({ book }: { book: Book }) {
  if (book.thumbnail) {
    return (
      <Image
        source={{ uri: book.thumbnail }}
        contentFit="cover"
        transition={200}
        style={{ width: 48, height: 72 }}
        className="rounded-md bg-edge dark:bg-edge-dark"
      />
    );
  }

  return (
    <View className="h-[72px] w-12 items-center justify-center rounded-md bg-edge dark:bg-edge-dark">
      <Text
        style={{ fontFamily: Fonts.serif }}
        className="text-base font-bold text-taupe dark:text-fog">
        {book.title.charAt(0).toUpperCase()}
      </Text>
    </View>
  );
}

export function SelectedBooksStrip({ books, onRemove }: SelectedBooksStripProps) {
  const [expanded, setExpanded] = useState(false);

  if (books.length === 0) {
    return null;
  }

  return (
    <View className="gap-2">
      <View className="flex-row items-center justify-between">
        <Text className="text-[11px] font-bold uppercase tracking-wide text-taupe dark:text-fog">
          In your list · {books.length}
        </Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={expanded ? 'Collapse selected books' : 'Show all selected books'}
          accessibilityState={{ expanded }}
          onPress={() => setExpanded((prev) => !prev)}
          hitSlop={8}
          className="flex-row items-center gap-1">
          <Text className="text-xs font-semibold text-ember">
            {expanded ? 'Show less' : 'Show all'}
          </Text>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={14}
            color="#C0562F"
          />
        </Pressable>
      </View>

      {expanded ? (
        <View className="flex-row flex-wrap gap-2">
          {books.map((book) => (
            <Pressable
              key={book.id}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${book.title}`}
              onPress={() => onRemove(book)}
              className="relative active:opacity-70">
              <Cover book={book} />
              <View className="absolute right-1 top-1 h-5 w-5 items-center justify-center rounded-full bg-ember">
                <Ionicons name="close" size={11} color="#FFFFFF" />
              </View>
            </Pressable>
          ))}
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingRight: 8 }}>
          {books.map((book) => (
            <Pressable
              key={book.id}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${book.title}`}
              onPress={() => onRemove(book)}
              className="relative active:opacity-70">
              <Cover book={book} />
              <View className="absolute right-1 top-1 h-5 w-5 items-center justify-center rounded-full bg-ember">
                <Ionicons name="close" size={11} color="#FFFFFF" />
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
