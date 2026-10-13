import { forwardRef, useCallback, useEffect, useImperativeHandle, useState } from 'react';
import { Dimensions, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { BookBackCard } from '@/components/discover/book-back-card';
import { BookCard } from '@/components/ui/book-card';
import type { Book, SwipeDirection } from '@/types/book';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;
const EXIT_DISTANCE = SCREEN_WIDTH * 1.4;
const EXIT_DURATION = 240;
const FLIP_DURATION = 320;

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
    const flip = useSharedValue(0);
    const [showBack, setShowBack] = useState(false);
    const [isFlipping, setIsFlipping] = useState(false);

    useEffect(() => {
      translateX.value = 0;
      translateY.value = 0;
      flip.value = 0;
      setShowBack(false);
      setIsFlipping(false);
    }, [book.id, flip, translateX, translateY]);

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

    const flipTo = useCallback(
      (toBack: boolean) => {
        if (isFlipping || toBack === showBack) {
          return;
        }
        setIsFlipping(true);
        flip.value = 0;
        flip.value = withTiming(180, { duration: FLIP_DURATION }, (finished) => {
          if (finished) {
            runOnJS(setShowBack)(toBack);
            runOnJS(setIsFlipping)(false);
          }
        });
      },
      [flip, isFlipping, showBack]
    );

    const handleShowMore = useCallback(() => flipTo(true), [flipTo]);
    const handleShowLess = useCallback(() => flipTo(false), [flipTo]);

    const pan = Gesture.Pan()
      .activeOffsetX([-15, 15])
      .failOffsetY([-15, 15])
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

    const cardStyle = useAnimatedStyle(() => ({
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
      ],
    }));

    const flipStyle = useAnimatedStyle(() => ({
      transform: [{ perspective: 1200 }, { rotateY: `${flip.value}deg` }],
    }));

    const slotAStyle = useAnimatedStyle(() => ({
      opacity: flip.value <= 90 ? 1 : 0,
    }));

    const slotBStyle = useAnimatedStyle(() => ({
      opacity: flip.value > 90 ? 1 : 0,
      transform: [{ rotateY: '180deg' }],
    }));

    const currentFace = showBack ? (
      <BookBackCard book={book} onShowLess={handleShowLess} />
    ) : (
      <BookCard book={book} onShowMore={handleShowMore} />
    );
    const otherFace = showBack ? (
      <BookCard book={book} onShowMore={handleShowMore} />
    ) : (
      <BookBackCard book={book} onShowLess={handleShowLess} />
    );

    return (
      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.card, cardStyle, style]}>
          {isFlipping ? (
            <Animated.View style={[styles.face, flipStyle]}>
              <Animated.View style={[styles.face, slotAStyle]}>{currentFace}</Animated.View>
              <Animated.View style={[styles.face, slotBStyle]}>{otherFace}</Animated.View>
            </Animated.View>
          ) : (
            <View style={styles.face}>{currentFace}</View>
          )}
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
  face: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
