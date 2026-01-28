import { SheetProvider } from 'react-native-actions-sheet';
import { Sheets } from '@/sheets';
import { DevToolsBubble } from 'react-native-react-query-devtools';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { useEffect, useState } from 'react';
import { atom, useAtomValue, useSetAtom } from 'jotai';
import { useInvalidationChannel } from '@/hooks/useInvalidationChannel';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { SessionProvider, useSession } from '@/contexts/session';
import { QueryErrorBoundary } from '@/components/QueryErrorBoundary';
import { asyncStoragePersister, queryClient, WEEK_IN_MS } from '@/query-client';
import { useOnAppActive } from '@/hooks/use-on-app-active';
import { useQueryClient } from '@tanstack/react-query';
import { useLogout } from '@/hooks/use-logout';
import { authSignal } from '@/api/auth-event';

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
    <QueryErrorBoundary>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister: asyncStoragePersister,
          maxAge: WEEK_IN_MS,
        }}
        onSuccess={() => {
          setSplashScreenRequirements((r) => ({ ...r, queriesRestored: true }));
          queryClient.resumePausedMutations().then(() => queryClient.invalidateQueries());
        }}
      >
        <SessionProvider>
          <GestureHandlerRootView>
            <InvalidationChannel />
            {/* <ConnectionStatus /> */}
            <SheetProvider>
              <Sheets />
              <RootLayout />
            </SheetProvider>
            <DevToolsBubble queryClient={queryClient} />
          </GestureHandlerRootView>
        </SessionProvider>
      </PersistQueryClientProvider>
    </QueryErrorBoundary>
  );
}

const RootLayout = () => {
  const queryClient = useQueryClient();
  const [animationsEnabled, setAnimationsEnabled] = useState(false);
  const setSplashScreenRequirements = useSetAtom(splashScreenRequirementsAtom);
  const { token, isLoading } = useSession();

  // connect react-less API layer to react context via this "ping"
  const { logOut } = useLogout();
  authSignal.handleUnauthorized = logOut;

  useOnAppActive(() => {
    queryClient.invalidateQueries();
  });

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
