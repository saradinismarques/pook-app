import { Image } from 'expo-image';
import { StyleProp, Text, View, ViewStyle } from 'react-native';

import { Fonts } from '@/constants/theme';
import { shortenDescription } from '@/lib/text';
import type { Book } from '@/types/book';

const DESCRIPTION_MAX_LENGTH = 110;

export type BookCardProps = {
  book: Book;
  onShowMore?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function BookCard({ book, onShowMore, style }: BookCardProps) {
  const description = shortenDescription(book.description, DESCRIPTION_MAX_LENGTH);
  const year = book.publishedDate?.slice(0, 4);
  const byline = [book.authors.join(', '), year].filter(Boolean).join(' · ');
  const showMore = Boolean(onShowMore) && Boolean(description?.endsWith('…'));

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

      <View className="gap-1.5 p-4 shrink-0">
        <Text
          numberOfLines={1}
          style={{ fontFamily: Fonts.serif }}
          className="text-lg font-bold text-ink dark:text-haze">
          {book.title}
        </Text>
        {byline ? (
          <Text numberOfLines={1} className="text-xs font-semibold text-taupe dark:text-fog">
            {byline}
          </Text>
        ) : null}
        {description ? (
          <Text className="text-sm leading-5 text-taupe dark:text-fog">
            {description}
            {showMore ? (
              <Text
                accessibilityRole="link"
                accessibilityLabel="Show more"
                onPress={onShowMore}
                className="font-semibold text-ember underline">
                {' Show more'}
              </Text>
            ) : null}
          </Text>
        ) : (
          <Text className="text-sm leading-5 text-taupe dark:text-fog">
            No description available for this book.
          </Text>
        )}
      </View>
    </View>
  );
}
