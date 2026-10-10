import { router } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/app-button';
import { BookLogo } from '@/components/ui/book-logo';
import { Fonts } from '@/constants/theme';

export default function HomeScreen() {
  const handlePickBooks = () => {
    router.push('/lists');
  };
  const handleMyBooks = () => {};

  return (
    <View className="flex-1 flex-row justify-center bg-paper dark:bg-night">
      <SafeAreaView className="flex-1 w-full max-w-content px-6 pb-6">
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerClassName="grow pt-6 gap-6">
          <View className="grow items-center justify-center gap-4">
            <BookLogo />
            <Text
              accessibilityRole="header"
              style={{ fontFamily: Fonts.serif }}
              className="text-wordmark font-bold text-center text-ink dark:text-haze">
              Pook
            </Text>
            <Text className="text-tagline font-medium text-center text-taupe dark:text-fog">
              Pick your next book.
            </Text>
          </View>

          <View className="w-full max-w-actions self-center gap-4">
            <AppButton label="Pick books" onPress={handlePickBooks} />
            <AppButton label="My Books" variant="secondary" onPress={handleMyBooks} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
