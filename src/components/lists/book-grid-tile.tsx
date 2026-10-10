import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, Text, View } from 'react-native';

import { Fonts } from '@/constants/theme';
import type { Book } from '@/types/book';

export type BookGridTileProps = {
  book: Book;
  added?: boolean;
  onPress: () => void;
};

export function BookGridTile({ book, added = false, onPress }: BookGridTileProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Add ${book.title}`}
      accessibilityState={{ disabled: added }}
      disabled={added}
      onPress={onPress}
      className={`flex-1 ${added ? 'opacity-70' : 'active:opacity-80'}`}>
      <View className="relative">
        {book.thumbnail ? (
          <Image
            source={{ uri: book.thumbnail }}
            contentFit="cover"
            transition={200}
            style={{ width: '100%', aspectRatio: 2 / 3 }}
            className="rounded-xl bg-edge dark:bg-edge-dark"
            accessibilityLabel={`Cover of ${book.title}`}
          />
        ) : (
          <View
            style={{ width: '100%', aspectRatio: 2 / 3 }}
            className="items-center justify-center rounded-xl bg-edge dark:bg-edge-dark">
            <Text
              style={{ fontFamily: Fonts.serif }}
              className="text-2xl font-bold text-taupe dark:text-fog">
              {book.title.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}

        {added ? (
          <View className="absolute right-1.5 top-1.5 h-7 w-7 items-center justify-center rounded-full bg-ember">
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
          </View>
        ) : null}
      </View>

      <Text
        numberOfLines={2}
        style={{ fontFamily: Fonts.serif }}
        className="mt-1.5 text-xs font-bold text-ink dark:text-haze">
        {book.title}
      </Text>
    </Pressable>
  );
}
