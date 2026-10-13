import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { Fonts } from '@/constants/theme';
import type { Book } from '@/types/book';

const COVER_W = 80;
const COVER_H = 120;
const GAP = 8;

export type ListPreviewCardProps = {
  name: string;
  books?: Book[];
  onPress: () => void;
  onEdit?: () => void;
};

function CoverPlaceholder() {
  return (
    <View
      style={{ width: COVER_W, height: COVER_H }}
      className="rounded-md bg-edge dark:bg-edge-dark"
    />
  );
}

function Cover({ book }: { book: Book }) {
  return book.thumbnail ? (
    <Image
      source={{ uri: book.thumbnail }}
      contentFit="cover"
      transition={200}
      style={{ width: COVER_W, height: COVER_H }}
      className="rounded-md bg-edge dark:bg-edge-dark"
      accessibilityLabel={`Cover of ${book.title}`}
    />
  ) : (
    <View
      style={{ width: COVER_W, height: COVER_H }}
      className="items-center justify-center rounded-md bg-edge dark:bg-edge-dark">
      <Text
        style={{ fontFamily: Fonts.serif }}
        className="text-xl font-bold text-taupe dark:text-fog">
        {book.title.charAt(0).toUpperCase()}
      </Text>
    </View>
  );
}

export function ListPreviewCard({ name, books, onPress, onEdit }: ListPreviewCardProps) {
  const showPlaceholders = !books || books.length === 0;

  return (
    <View className="gap-3 rounded-2xl border border-edge bg-sand p-4 dark:border-edge-dark dark:bg-coal">
      <View className="flex-row items-center gap-2">
        <Text
          numberOfLines={2}
          style={{ fontFamily: Fonts.serif }}
          className="flex-1 text-base font-bold text-ink dark:text-haze">
          {name}
        </Text>

        {onEdit ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Edit ${name}`}
            onPress={onEdit}
            hitSlop={8}
            className="h-8 w-8 items-center justify-center rounded-full border border-edge bg-paper active:opacity-80 dark:border-edge-dark dark:bg-night">
            <Ionicons name="pencil" size={14} color="#7C6B5A" />
          </Pressable>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Show all books in ${name}`}
          onPress={onPress}
          hitSlop={8}
          className="flex-row items-center gap-1 rounded-full bg-ember px-3 py-1.5 active:opacity-80 dark:bg-flame">
          <Text className="text-[11px] font-bold text-on-ember dark:text-on-flame">
            Show all
          </Text>
          <Ionicons name="chevron-forward" size={12} color="#FFFFFF" />
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: GAP, paddingRight: GAP }}>
        {showPlaceholders
          ? [0, 1, 2, 3].map((index) => <CoverPlaceholder key={index} />)
          : books.map((book) => <Cover key={book.id} book={book} />)}
      </ScrollView>
    </View>
  );
}
