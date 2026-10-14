import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, useColorScheme, View } from 'react-native';

import { Fonts } from '@/constants/theme';

export type SwipeActionsProps = {
  onSkip: () => void;
  onLike: () => void;
  onDone: () => void;
  disabled?: boolean;
};

export function SwipeActions({ onSkip, onLike, onDone, disabled = false }: SwipeActionsProps) {
  const isDark = useColorScheme() === 'dark';

  return (
    <View className="flex-row items-center justify-center gap-8">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Skip this book"
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onSkip}
        className={`h-16 w-16 items-center justify-center rounded-full border border-edge bg-sand active:opacity-80 dark:border-edge-dark dark:bg-coal ${
          disabled ? 'opacity-50' : ''
        }`}>
        <Ionicons name="close" size={30} color={isDark ? '#AC9C8B' : '#7C6B5A'} />
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Like this book"
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onLike}
        className={`h-16 w-16 items-center justify-center rounded-full bg-ember active:opacity-80 dark:bg-flame ${
          disabled ? 'opacity-50' : ''
        }`}>
        <Ionicons name="heart" size={28} color={isDark ? '#2B1710' : '#FFFFFF'} />
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Done, go back to lists"
        onPress={onDone}
        className="absolute right-0 h-14 items-center justify-center rounded-full border border-ember px-5 active:opacity-80">
        <Text
          style={{ fontFamily: Fonts.rounded }}
          className="text-button font-semibold text-ember">
          Done
        </Text>
      </Pressable>
    </View>
  );
}
