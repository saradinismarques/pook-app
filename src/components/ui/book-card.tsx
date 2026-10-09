import { Image } from 'expo-image';
import { StyleProp, Text, View, ViewStyle } from 'react-native';

import { Fonts } from '@/constants/theme';
import { shortenDescription } from '@/lib/text';
import type { Book } from '@/types/book';

export type BookCardProps = {
  book: Book;
  style?: StyleProp<ViewStyle>;
};

export function BookCard({ book, style }: BookCardProps) {
  const description = shortenDescription(book.description);
  const meta = [book.publishedDate?.slice(0, 4), book.pageCount ? `${book.pageCount} pages` : null]
    .filter(Boolean)
    .join(' · ');

  return (
    <View
      style={style}
      className="w-full h-full overflow-hidden rounded-3xl border border-edge bg-sand dark:border-edge-dark dark:bg-coal flex-col">
      <View className="flex-1 w-full min-h-0">
        {book.thumbnail ? (
          <Image
            source={{ uri: book.thumbnail }}
            contentFit="contain"
            transition={200}
            style={{ width: '100%', height: '100%' }}
            accessibilityLabel={`Cover of ${book.title}`}
          />
        ) : (
          <View className="flex-1 items-center justify-center gap-2 bg-ember dark:bg-flame">
            <Text
              style={{ fontFamily: Fonts.serif }}
              className="text-5xl font-bold text-on-ember dark:text-on-flame">
              {book.title.charAt(0).toUpperCase()}
            </Text>
            <Text className="text-xs font-semibold uppercase tracking-wide text-on-ember/80 dark:text-on-flame/80">
              No cover
            </Text>
          </View>
        )}
      </View>

      <View className="gap-2 p-4 shrink-0">
        <Text
          numberOfLines={1}
          style={{ fontFamily: Fonts.serif }}
          className="text-lg font-bold text-ink dark:text-haze">
          {book.title}
        </Text>
        <Text numberOfLines={1} className="text-xs font-semibold text-taupe dark:text-fog">
          {book.authors.join(', ')}
        </Text>
        {meta ? (
          <Text className="text-[10px] uppercase tracking-wide text-taupe/80 dark:text-fog/70">
            {meta}
          </Text>
        ) : null}
        <Text numberOfLines={2} className="text-xs text-taupe dark:text-fog">
          {description ?? 'No description available for this book.'}
        </Text>
      </View>
    </View>
  );
}
