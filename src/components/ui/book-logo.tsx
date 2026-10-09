import { View } from 'react-native';

export type BookLogoProps = {
  size?: number;
};

export function BookLogo({ size = 88 }: BookLogoProps) {
  const height = Math.round(size * 1.26);
  const radius = Math.round(size * 0.14);
  const spineWidth = Math.round(size * 0.16);
  const pagesWidth = Math.max(4, Math.round(size * 0.07));
  const ribbonWidth = Math.max(6, Math.round(size * 0.1));
  const ribbonHeight = Math.round(size * 0.36);
  const ribbonRight = Math.round(size * 0.22);

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel="Pook book logo"
      className="overflow-hidden bg-ember dark:bg-flame shadow-[0_10px_16px_rgba(74,42,24,0.25)]"
      style={{ width: size, height, borderRadius: radius }}>
      <View
        className="absolute top-0 bottom-0 left-0 bg-[rgba(0,0,0,0.18)]"
        style={{ width: spineWidth }}
      />
      <View
        className="absolute top-0 bottom-0 right-0 bg-[#FBF3E4]"
        style={{ width: pagesWidth }}
      />
      <View
        className="absolute top-0 rounded-b bg-[#E9B44C]"
        style={{ right: ribbonRight, width: ribbonWidth, height: ribbonHeight }}
      />
    </View>
  );
}
