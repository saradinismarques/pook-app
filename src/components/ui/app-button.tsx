import { Pressable, Text } from 'react-native';

import { Fonts } from '@/constants/theme';

export type AppButtonVariant = 'primary' | 'secondary';

export type AppButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: AppButtonVariant;
  disabled?: boolean;
};

const baseClass =
  'w-full min-h-button px-6 py-4 rounded-full items-center justify-center active:opacity-80';

const variantClass: Record<AppButtonVariant, string> = {
  primary: 'bg-ember dark:bg-flame',
  secondary: 'bg-sand dark:bg-coal border border-edge dark:border-edge-dark',
};

const labelClass: Record<AppButtonVariant, string> = {
  primary: 'text-on-ember dark:text-on-flame',
  secondary: 'text-ink dark:text-haze',
};

export function AppButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
}: AppButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      className={`${baseClass} ${variantClass[variant]} ${disabled ? 'opacity-50' : ''}`}>
      <Text
        style={{ fontFamily: Fonts.rounded }}
        className={`text-button font-semibold text-center ${labelClass[variant]}`}>
        {label}
      </Text>
    </Pressable>
  );
}
