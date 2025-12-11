import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { DevToolsBubble } from 'react-native-react-query-devtools';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { atom, useAtomValue, useSetAtom } from 'jotai';
import { useInvalidationChannel } from '@/hooks/useInvalidationChannel';
import { SessionProvider, useSession } from '@/contexts/session';

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

export const splashScreenRequirementsAtom = atom({
  queriesRestored: false,
  sessionLoaded: false,
});

const InvalidationChannel = () => {
  useInvalidationChannel();
  return null;
};

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
    <QueryClientProvider
      client={queryClient}
      // persistOptions={{
      //   persister: asyncStoragePersister,
      //   maxAge: WEEK_IN_MS,
      // }}
      onSuccess={() => setSplashScreenRequirements((r) => ({ ...r, queriesRestored: true }))}
    >
      <SessionProvider>
        <GestureHandlerRootView>
          <InvalidationChannel />
          <BottomSheetModalProvider>
            <RootLayout />
          </BottomSheetModalProvider>
          <DevToolsBubble queryClient={queryClient} />
        </GestureHandlerRootView>
      </SessionProvider>
    </QueryClientProvider>
  );
}

const RootLayout = () => {
  const [animationsEnabled, setAnimationsEnabled] = useState(false);
  const setSplashScreenRequirements = useSetAtom(splashScreenRequirementsAtom);
  const { token, isLoading } = useSession();

  useEffect(() => {
    if (!isLoading) setSplashScreenRequirements((r) => ({ ...r, sessionLoaded: true }));
    setTimeout(() => setAnimationsEnabled(true), 1000);
  }, [isLoading, setSplashScreenRequirements]);

  return (
    <Stack screenOptions={{ headerShown: false, animation: animationsEnabled ? 'default' : 'none' }}>
      <Stack.Protected guard={!!token}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={!token}>
        <Stack.Screen name="(auth)/index" options={{ animationTypeForReplace: 'pop' }} />
      </Stack.Protected>
    </Stack>
  );
};
