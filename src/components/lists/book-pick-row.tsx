import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, Text, View } from 'react-native';

import { Fonts } from '@/constants/theme';
import type { Book } from '@/types/book';

export type BookPickRowProps = {
  book: Book;
  action: 'add' | 'remove';
  added?: boolean;
  onPress: () => void;
};

export function BookPickRow({ book, action, added = false, onPress }: BookPickRowProps) {
  const isRemove = action === 'remove';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${isRemove ? 'Remove' : 'Add'} ${book.title}`}
      disabled={added}
      onPress={onPress}
      className={`flex-row items-center gap-3 rounded-2xl border p-3 active:opacity-80 ${
        added
          ? 'border-ember bg-sand dark:border-ember dark:bg-coal'
          : 'border-edge bg-sand dark:border-edge-dark dark:bg-coal'
      }`}>
      {book.thumbnail ? (
        <Image
          source={{ uri: book.thumbnail }}
          contentFit="cover"
          transition={200}
          style={{ width: 36, height: 52 }}
          className="shrink-0 rounded-md"
          accessibilityLabel={`Cover of ${book.title}`}
        />
      ) : (
        <View className="h-[52px] w-9 shrink-0 items-center justify-center rounded-md bg-edge dark:bg-edge-dark">
          <Text
            style={{ fontFamily: Fonts.serif }}
            className="text-lg font-bold text-taupe dark:text-fog">
            {book.title.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}

      <View className="flex-1 gap-0.5">
        <Text
          numberOfLines={2}
          style={{ fontFamily: Fonts.serif }}
          className="text-sm font-bold text-ink dark:text-haze">
          {book.title}
        </Text>
        <Text numberOfLines={1} className="text-xs text-taupe dark:text-fog">
          {book.authors.join(', ')}
        </Text>
      </View>

      <View
        className={`h-9 w-9 shrink-0 items-center justify-center rounded-full ${
          isRemove ? 'bg-edge dark:bg-edge-dark' : 'bg-ember dark:bg-flame'
        }`}>
        <Ionicons
          name={added ? 'checkmark' : isRemove ? 'close' : 'heart'}
          size={20}
          color={isRemove ? '#7C6B5A' : '#FFFFFF'}
        />
      </View>
    </Pressable>
  );
}
