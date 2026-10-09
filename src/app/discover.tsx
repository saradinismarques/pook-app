import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useRef } from 'react';
import { ActivityIndicator, Pressable, Text, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SwipeActions } from '@/components/discover/swipe-actions';
import { SwipeableBookCard, SwipeableBookCardHandle } from '@/components/discover/swipeable-book-card';
import { AppButton } from '@/components/ui/app-button';
import { Fonts } from '@/constants/theme';
import { useDiscoverBooks } from '@/hooks/use-discover-books';
import type { SwipeDirection } from '@/types/book';

export default function DiscoverScreen() {
  const { current, status, error, hasMore, likedBooks, swipe, retry } = useDiscoverBooks();
  const cardRef = useRef<SwipeableBookCardHandle>(null);
  const pendingRef = useRef(false);
  const isDark = useColorScheme() === 'dark';

  const goHome = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  }, []);

  const handleSwiped = useCallback(
    (direction: SwipeDirection) => {
      pendingRef.current = false;
      swipe(direction);
    },
    [swipe]
  );

  const triggerSwipe = useCallback(
    (direction: SwipeDirection) => {
      if (pendingRef.current || !current) {
        return;
      }
      pendingRef.current = true;
      cardRef.current?.swipe(direction);
    },
    [current]
  );

  const renderBody = () => {
    if (current) {
      return (
        <SwipeableBookCard
          key={current.id}
          ref={cardRef}
          book={current}
          onSwiped={handleSwiped}
        />
      );
    }

    if (status === 'error') {
      return (
        <View className="w-full max-w-actions items-center gap-5 self-center">
          <Text className="text-center text-tagline font-medium text-ink dark:text-haze">
            Couldn&apos;t load books
          </Text>
          <Text className="text-center text-sm text-taupe dark:text-fog">
            {error ?? 'Something went wrong. Please try again.'}
          </Text>
          <AppButton label="Try again" onPress={retry} />
        </View>
      );
    }

    if (status === 'loading' || hasMore) {
      return (
        <View className="items-center gap-4">
          <ActivityIndicator color="#C0562F" />
          <Text className="text-sm font-medium text-taupe dark:text-fog">
            Finding books for you…
          </Text>
        </View>
      );
    }

    return (
      <View className="w-full max-w-actions items-center gap-5 self-center">
        <Text className="text-center text-tagline font-medium text-ink dark:text-haze">
          You&apos;re all caught up
        </Text>
        <Text className="text-center text-sm text-taupe dark:text-fog">
          You&apos;ve seen every book for now.
        </Text>
        <AppButton label="Start over" onPress={retry} />
      </View>
    );
  };

  return (
    <View className="flex-1 items-center bg-paper dark:bg-night">
      <SafeAreaView className="flex-1 w-full max-w-content px-6 pb-4">
        <View className="flex-row items-center justify-between py-2">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={goHome}
            className="h-10 w-10 items-center justify-center rounded-full border border-edge bg-sand active:opacity-80 dark:border-edge-dark dark:bg-coal">
            <Ionicons name="chevron-back" size={22} color={isDark ? '#F5EDE3' : '#2B211A'} />
          </Pressable>

          <Text
            style={{ fontFamily: Fonts.serif }}
            className="text-2xl font-bold text-ink dark:text-haze">
            Discover
          </Text>

          <View
            accessibilityLabel={`${likedBooks.length} books liked`}
            className="h-10 flex-row items-center gap-1 rounded-full border border-edge bg-sand px-3 dark:border-edge-dark dark:bg-coal">
            <Ionicons name="heart" size={14} color="#C0562F" />
            <Text className="text-sm font-bold text-ink dark:text-haze">{likedBooks.length}</Text>
          </View>
        </View>

        <View className="flex-1 justify-center py-2">
          <View className="w-full max-w-card flex-1 self-center">{renderBody()}</View>
        </View>

        <View className="pt-2">
          <SwipeActions
            onSkip={() => triggerSwipe('left')}
            onLike={() => triggerSwipe('right')}
            disabled={!current}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}
