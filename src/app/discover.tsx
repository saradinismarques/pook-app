import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Pressable, Text, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SwipeActions } from '@/components/discover/swipe-actions';
import { SwipeableBookCard, SwipeableBookCardHandle } from '@/components/discover/swipeable-book-card';
import { AppButton } from '@/components/ui/app-button';
import { Fonts } from '@/constants/theme';
import { useDiscoverBooks } from '@/hooks/use-discover-books';
import { useUserLists } from '@/hooks/use-user-lists';
import type { Book, SwipeDirection } from '@/types/book';
type DiscoverParams = {
  listId?: string;
  listName?: string;
  userListId?: string;
};

type DiscoverContentProps = {
  title: string;
  caption?: string;
  isListMode: boolean;
  apiListId?: number;
  localBooks?: Book[];
};

function DiscoverContent({
  title,
  caption,
  isListMode,
  apiListId,
  localBooks,
}: DiscoverContentProps) {
  const { current, status, error, hasMore, likedBooks, sourceEmpty, total, seenCount, swipe, retry } =
    useDiscoverBooks({ listId: apiListId, books: localBooks });
  const cardRef = useRef<SwipeableBookCardHandle>(null);
  const pendingRef = useRef(false);
  const isDark = useColorScheme() === 'dark';
  const [countScale] = useState(() => new Animated.Value(1));
  const prevLikedCountRef = useRef(0);

  useEffect(() => {
    if (likedBooks.length > prevLikedCountRef.current) {
      countScale.setValue(1);
      Animated.sequence([
        Animated.timing(countScale, { toValue: 1.3, duration: 140, useNativeDriver: true }),
        Animated.spring(countScale, {
          toValue: 1,
          useNativeDriver: true,
          speed: 30,
          bounciness: 14,
        }),
      ]).start();
    }
    prevLikedCountRef.current = likedBooks.length;
  }, [likedBooks.length, countScale]);

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/lists');
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
        <SwipeableBookCard key={current.id} ref={cardRef} book={current} onSwiped={handleSwiped} />
      );
    }

    if (sourceEmpty) {
      return (
        <View className="w-full max-w-actions items-center gap-5 self-center">
          <Text className="text-center text-tagline font-medium text-ink dark:text-haze">
            No books in this list
          </Text>
          <Text className="text-center text-sm text-taupe dark:text-fog">
            This list doesn&apos;t have any books yet. Try another list or all books.
          </Text>
          <AppButton label="Pick another list" onPress={goBack} />
        </View>
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
            {isListMode ? 'Loading list…' : 'Finding books for you…'}
          </Text>
        </View>
      );
    }

    return (
      <View className="w-full max-w-actions flex-1 items-center justify-center gap-5 self-center">
        <Text className="text-center text-tagline font-medium text-ink dark:text-haze">
          {isListMode ? "You've seen them all" : "You're all caught up"}
        </Text>
        <Text className="text-center text-sm text-taupe dark:text-fog">
          {isListMode ? 'You have reached the end of this list.' : 'You’ve seen every book for now.'}
        </Text>
        <AppButton
          label={isListMode ? 'Return to lists' : 'Start over'}
          onPress={isListMode ? goBack : retry}
          variant="secondary"
        />
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
            onPress={goBack}
            className="h-10 w-10 items-center justify-center rounded-full border border-edge bg-sand active:opacity-80 dark:border-edge-dark dark:bg-coal">
            <Ionicons name="chevron-back" size={22} color={isDark ? '#F5EDE3' : '#2B211A'} />
          </Pressable>

          <Text
            style={{ fontFamily: Fonts.serif }}
            numberOfLines={1}
            ellipsizeMode="tail"
            className="flex-1 px-2 text-center text-2xl font-bold text-ink dark:text-haze">
            {title}
          </Text>

          <Animated.View
            accessibilityLabel={`${likedBooks.length} books liked`}
            style={{ transform: [{ scale: countScale }] }}
            className="h-10 flex-row items-center gap-1 rounded-full border border-edge bg-sand px-3 dark:border-edge-dark dark:bg-coal">
            <Ionicons name="heart" size={14} color="#C0562F" />
            <Text className="text-sm font-bold text-ink dark:text-haze">{likedBooks.length}</Text>
          </Animated.View>
        </View>

        <View className="flex-1 justify-center gap-3 py-2">
          {caption ? (
            <Text className="w-full px-1 text-center text-sm font-semibold text-taupe dark:text-fog">
              {caption}
            </Text>
          ) : null}
          {current && total !== null && total > 0 ? (
            <View className="w-full max-w-card gap-1.5 self-center">
              <View
                accessibilityRole="progressbar"
                accessibilityLabel={`${seenCount} of ${total} books seen`}
                className="h-[3px] w-full overflow-hidden rounded-full bg-edge dark:bg-edge-dark">
                <View
                  style={{ width: `${Math.min(seenCount / total, 1) * 100}%` }}
                  className="h-full rounded-full bg-ember"
                />
              </View>
              <Text className="text-center text-[11px] font-medium text-taupe dark:text-fog">
                Book {Math.min(seenCount + 1, total)} of {total}
              </Text>
            </View>
          ) : null}
          <View className="w-full max-w-card flex-1 self-center">{renderBody()}</View>
        </View>

        <View className="w-full max-w-card self-center pt-2">
          <SwipeActions
            onSkip={() => triggerSwipe('left')}
            onLike={() => triggerSwipe('right')}
            onDone={goBack}
            disabled={!current}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

export default function DiscoverScreen() {
  const { listId: listIdParam, listName, userListId } = useLocalSearchParams<DiscoverParams>();
  const { lists: userLists, loaded } = useUserLists();

  const apiListId = listIdParam ? Number(listIdParam) : undefined;
  const hasApiList = typeof apiListId === 'number' && Number.isFinite(apiListId);
  const hasUserList = typeof userListId === 'string' && userListId.length > 0;

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/lists');
    }
  }, []);

  if (hasUserList && !loaded) {
    return (
      <View className="flex-1 items-center justify-center bg-paper dark:bg-night">
        <ActivityIndicator color="#C0562F" />
      </View>
    );
  }

  if (hasUserList && !userLists.some((list) => list.id === userListId)) {
    return (
      <View className="flex-1 items-center justify-center gap-5 bg-paper dark:bg-night px-6">
        <Text className="text-center text-tagline font-medium text-ink dark:text-haze">
          List not found
        </Text>
        <Text className="text-center text-sm text-taupe dark:text-fog">
          This list may have been deleted.
        </Text>
        <AppButton label="Pick another list" onPress={goBack} />
      </View>
    );
  }

  const localBooks = hasUserList
    ? userLists.find((list) => list.id === userListId)?.books
    : undefined;

  const isListMode = hasApiList || hasUserList;

  return (
    <DiscoverContent
      key={userListId ?? (hasApiList ? String(apiListId) : 'all')}
      title={isListMode ? 'Picking books' : 'All Books'}
      caption={isListMode ? listName : undefined}
      isListMode={isListMode}
      apiListId={hasApiList ? apiListId : undefined}
      localBooks={localBooks}
    />
  );
}
