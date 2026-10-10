import { Ionicons } from '@expo/vector-icons';
import { Pressable, TextInput, View } from 'react-native';

export type ListSearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  onClear: () => void;
};

export function ListSearchBar({ value, onChangeText, onClear }: ListSearchBarProps) {
  return (
    <View className="flex-row items-center gap-2 rounded-full bg-edge px-4 py-3 dark:bg-edge-dark">
      <Ionicons name="search" size={18} color="#7C6B5A" />

      <TextInput
        accessibilityLabel="Search lists"
        accessibilityRole="search"
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="never"
        onChangeText={onChangeText}
        placeholder="Search public lists"
        placeholderTextColor="#7C6B5A"
        returnKeyType="search"
        value={value}
        className="flex-1 p-0 text-base text-ink dark:text-haze"
      />

      {value.length > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          onPress={onClear}
          hitSlop={8}
          className="h-6 w-6 items-center justify-center rounded-full bg-paper dark:bg-night">
          <Ionicons name="close" size={14} color="#7C6B5A" />
        </Pressable>
      ) : null}
    </View>
  );
}
