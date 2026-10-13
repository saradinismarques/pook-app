import { Ionicons } from '@expo/vector-icons';
import { ScrollView, Text, View } from 'react-native';

import { Fonts } from '@/constants/theme';
import { formatCompactCount, formatReleaseDate } from '@/lib/text';
import type { Book } from '@/types/book';

export type BookBackCardProps = {
  book: Book;
  onShowLess?: () => void;
};

function MetaChip({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View className="flex-row items-center gap-1.5 rounded-full border border-edge bg-paper px-3 py-1.5 dark:border-edge-dark dark:bg-night">
      <Ionicons name={icon} size={13} color="#7C6B5A" />
      <Text className="text-xs font-semibold text-taupe dark:text-fog">{label}</Text>
    </View>
  );
}

export function BookBackCard({ book, onShowLess }: BookBackCardProps) {
  const chips: { icon: keyof typeof Ionicons.glyphMap; label: string }[] = [];

  const published = formatReleaseDate(book.publishedDate);
  if (published) {
    chips.push({ icon: 'calendar-outline', label: published });
  }
  if (book.pageCount) {
    chips.push({ icon: 'book-outline', label: `${book.pageCount} pages` });
  }
  if (typeof book.rating === 'number') {
    chips.push({ icon: 'star', label: book.rating.toFixed(1) });
  }
  if (typeof book.usersCount === 'number' && book.usersCount > 0) {
    chips.push({ icon: 'people-outline', label: `${formatCompactCount(book.usersCount)} readers` });
  }

  return (
    <View
      className="h-full w-full flex-col overflow-hidden rounded-3xl border border-edge bg-sand px-5 pt-5 dark:border-edge-dark dark:bg-coal"
      accessibilityLabel={`Details of ${book.title}`}>
      <View className="shrink-0 gap-2 pb-4">
        <Text
          style={{ fontFamily: Fonts.serif }}
          className="text-center text-xl font-bold text-ink dark:text-haze">
          {book.title}
        </Text>
        {book.authors.length > 0 ? (
          <Text className="text-center text-xs font-medium text-taupe dark:text-fog">
            {book.authors.join(', ')}
          </Text>
        ) : null}
        {chips.length > 0 ? (
          <View className="flex-row flex-wrap justify-center gap-2 pt-1">
            {chips.map((chip) => (
              <MetaChip key={chip.label} icon={chip.icon} label={chip.label} />
            ))}
          </View>
        ) : null}
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 12 }}>
        <Text className="text-[11px] font-bold uppercase tracking-wide text-taupe dark:text-fog">
          About this book
        </Text>
        <Text className="pt-2 text-sm leading-6 text-ink dark:text-haze">
          {book.description?.trim() || 'No description available for this book.'}
          {onShowLess ? (
            <Text
              accessibilityRole="link"
              accessibilityLabel="Show less"
              onPress={onShowLess}
              className="font-semibold text-ember underline">
              {' Show less'}
            </Text>
          ) : null}
        </Text>
      </ScrollView>
    </View>
  );
}
