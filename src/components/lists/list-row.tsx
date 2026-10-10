import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Fonts } from '@/constants/theme';

export type ListRowProps = {
  name: string;
  meta?: string;
  description?: string;
  featured?: boolean;
  icon?: ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
};

export function ListRow({
  name,
  meta,
  description,
  featured = false,
  icon = 'list-outline',
  onPress,
}: ListRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={name}
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-2xl border border-edge bg-sand p-4 active:opacity-80 dark:border-edge-dark dark:bg-coal">
      <View className="h-11 w-11 items-center justify-center self-start rounded-full border border-edge bg-paper dark:border-edge-dark dark:bg-night">
        <Ionicons name={icon} size={22} color="#C0562F" />
      </View>

      <View className="flex-1 gap-1">
        <Text
          numberOfLines={3}
          style={{ fontFamily: Fonts.serif }}
          className="text-base font-bold text-ink dark:text-haze">
          {name}
        </Text>

        <View className="flex-row items-center gap-2">
          {featured ? (
            <View className="rounded-full bg-ember px-2 py-0.5">
              <Text className="text-[10px] font-bold uppercase tracking-wide text-on-ember">
                Featured
              </Text>
            </View>
          ) : null}
          {meta ? (
            <Text
              numberOfLines={1}
              className="flex-1 text-xs font-semibold text-taupe dark:text-fog">
              {meta}
            </Text>
          ) : null}
        </View>

        {description ? (
          <Text numberOfLines={2} className="text-xs text-taupe dark:text-fog">
            {description}
          </Text>
        ) : null}
      </View>

      <Ionicons name="chevron-forward" size={20} color="#AC9C8B" />
    </Pressable>
  );
}
