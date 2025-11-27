import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { DevToolsBubble } from 'react-native-react-query-devtools';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { EventProvider } from 'react-native-outside-press';

import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect } from 'react';
import { atom, useAtomValue, useSetAtom } from 'jotai';

const WEEK_IN_MS = 1000 * 60 * 60 * 24 * 7;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: WEEK_IN_MS,
    },
  },
});

const asyncStoragePersister = createAsyncStoragePersister({ storage: AsyncStorage });

SplashScreen.preventAutoHideAsync();

export const splashScreenRequirementsAtom = atom({ queriesRestored: false, weeklyLayoutCommitted: false });

export default function Layout() {
  const splashScreenRequirements = useAtomValue(splashScreenRequirementsAtom);
  const setSplashScreenRequirements = useSetAtom(splashScreenRequirementsAtom);

  // do these things static-ly later -- start
  const [fontsHaveLoaded] = useFonts({
    'Satoshi-Black': require('../assets/fonts/Satoshi-Black.otf'),
    'Satoshi-Bold': require('../assets/fonts/Satoshi-Bold.otf'),
    'Satoshi-Medium': require('../assets/fonts/Satoshi-Medium.otf'),
    'Satoshi-Regular': require('../assets/fonts/Satoshi-Regular.otf'),
  });
  StatusBar.setBarStyle('dark-content');
  // -- end

  useEffect(() => {
    const checks = Object.values({ ...splashScreenRequirements, fontsHaveLoaded });
    const allCompleted = checks.every((value) => value === true);
    if (!allCompleted) return;
    SplashScreen.hide();
  }, [fontsHaveLoaded, splashScreenRequirements]);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: asyncStoragePersister,
        maxAge: WEEK_IN_MS,
      }}
      onSuccess={() => setSplashScreenRequirements((r) => ({ ...r, queriesRestored: true }))}
    >
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
      <DevToolsBubble queryClient={queryClient} />
    </PersistQueryClientProvider>
  );
}
