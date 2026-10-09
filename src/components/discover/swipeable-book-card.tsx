import { forwardRef, useCallback, useEffect, useImperativeHandle } from 'react';
import { Dimensions, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { BookCard } from '@/components/ui/book-card';
import type { Book, SwipeDirection } from '@/types/book';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;
const EXIT_DISTANCE = SCREEN_WIDTH * 1.4;
const EXIT_DURATION = 240;

export type SwipeableBookCardHandle = {
  swipe: (direction: SwipeDirection) => void;
};

export type SwipeableBookCardProps = {
  book: Book;
  onSwiped: (direction: SwipeDirection) => void;
  style?: StyleProp<ViewStyle>;
};

export const SwipeableBookCard = forwardRef<SwipeableBookCardHandle, SwipeableBookCardProps>(
  function SwipeableBookCard({ book, onSwiped, style }, ref) {
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);

    useEffect(() => {
      translateX.value = 0;
      translateY.value = 0;
    }, [book.id, translateX, translateY]);

    const flyOut = useCallback(
      (direction: SwipeDirection) => {
        'worklet';
        const exitX = direction === 'right' ? EXIT_DISTANCE : -EXIT_DISTANCE;
        translateX.value = withTiming(exitX, { duration: EXIT_DURATION }, (finished) => {
          if (finished) {
            runOnJS(onSwiped)(direction);
          }
        });
        translateY.value = withTiming(translateY.value + 60, { duration: EXIT_DURATION });
      },
      [onSwiped, translateX, translateY]
    );

    useImperativeHandle(ref, () => ({ swipe: flyOut }), [flyOut]);

    const pan = Gesture.Pan()
      .onUpdate((event) => {
        translateX.value = event.translationX;
        translateY.value = event.translationY * 0.35;
      })
      .onEnd((event) => {
        const isFlung = Math.abs(event.velocityX) > 800;
        if (event.translationX > SWIPE_THRESHOLD || (isFlung && event.translationX > 0)) {
          flyOut('right');
        } else if (event.translationX < -SWIPE_THRESHOLD || (isFlung && event.translationX < 0)) {
          flyOut('left');
        } else {
          translateX.value = withSpring(0, { damping: 18, stiffness: 180 });
          translateY.value = withSpring(0, { damping: 18, stiffness: 180 });
        }
      });

    const cardStyle = useAnimatedStyle(() => {
      const rotate = interpolate(
        translateX.value,
        [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
        [-8, 0, 8],
        'clamp'
      );
      return {
        transform: [
          { translateX: translateX.value },
          { translateY: translateY.value },
          { rotate: `${rotate}deg` },
        ],
      };
    });

    const likeStyle = useAnimatedStyle(() => ({
      opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 1], 'clamp'),
    }));

    const nopeStyle = useAnimatedStyle(() => ({
      opacity: interpolate(translateX.value, [-SWIPE_THRESHOLD, 0], [1, 0], 'clamp'),
    }));

    return (
      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.card, cardStyle, style]}>
          <BookCard book={book} />
          <Animated.View style={[styles.likeBadge, likeStyle]}>
            <Text className="text-lg font-extrabold uppercase tracking-widest text-ember">Like</Text>
          </Animated.View>
          <Animated.View style={[styles.nopeBadge, nopeStyle]}>
            <Text className="text-lg font-extrabold uppercase tracking-widest text-taupe dark:text-fog">
              Nope
            </Text>
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    );
  }
);

const styles = StyleSheet.create({
  card: {
    width: '100%',
    height: '100%',
  },
  likeBadge: {
    position: 'absolute',
    top: 24,
    left: 24,
    borderWidth: 2,
    borderColor: '#C0562F',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    transform: [{ rotate: '-12deg' }],
  },
  nopeBadge: {
    position: 'absolute',
    top: 24,
    right: 24,
    borderWidth: 2,
    borderColor: '#7C6B5A',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    transform: [{ rotate: '12deg' }],
  },
});
