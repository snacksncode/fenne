import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { EventProvider } from 'react-native-outside-press';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

export default function Layout() {
  // do these things static-ly later -- start
  useFonts({
    'Satoshi-Black': require('../assets/fonts/Satoshi-Black.otf'),
    'Satoshi-Bold': require('../assets/fonts/Satoshi-Bold.otf'),
    'Satoshi-Medium': require('../assets/fonts/Satoshi-Medium.otf'),
    'Satoshi-Regular': require('../assets/fonts/Satoshi-Regular.otf'),
  });
  StatusBar.setBarStyle('dark-content');
  // -- end

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView>
        <EventProvider>
          <BottomSheetModalProvider>
            <Stack initialRouteName="(tabs)" screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="new-recipe" />
            </Stack>
          </BottomSheetModalProvider>
        </EventProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
