// Load domain defaults before persisted mutations are hydrated, including unopened screens.
import '@/api/groceries';
import '@/api/recipes';
import '@/api/pantry';
import '@/api/products';
import '@/api/schedules';
import '@/api/consumption-logs';
import '@/api/invitations';
import { createSessionPersister } from '@/lib/session';
import { SheetHost } from '@/lib/sheet-context';
import { Sheets } from '@/sheets';
import { DefaultTheme, SplashScreen, Stack, ThemeProvider } from 'expo-router';
import { colors } from '@/constants/colors';
import { AppState, StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { useEffect, useMemo } from 'react';
import { focusManager, useIsRestoring } from '@tanstack/react-query';
import { useInvalidationChannel } from '@/hooks/useInvalidationChannel';
import { useSession } from '@/contexts/session';
import { QueryErrorBoundary } from '@/components/QueryErrorBoundary';
import { queryClient, shouldPersistMutation, WEEK_IN_MS } from '@/query-client';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { refreshFamilyData } from '@/lib/family-data';

SplashScreen.preventAutoHideAsync();

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.surface.canvas,
    card: colors.surface.canvas,
    text: colors.brown[900],
    primary: colors.orange[500],
    border: colors.border.subtle,
    notification: colors.red[500],
  },
};

export default function Layout() {
  return (
    <ThemeProvider value={navigationTheme}>
      <QueryErrorBoundary>
        <SessionLayout />
        <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      </QueryErrorBoundary>
    </ThemeProvider>
  );
}

function SessionLayout() {
  const { token, cacheScope, isLoading } = useSession();
  const persister = useMemo(() => createSessionPersister(cacheScope), [cacheScope]);
  // Secure credentials determine which persisted cache may be restored.
  if (isLoading) return null;
  return (
    <PersistQueryClientProvider
      key={cacheScope}
      client={queryClient}
      persistOptions={{
        persister,
        buster: cacheScope,
        maxAge: WEEK_IN_MS,
        dehydrateOptions: { shouldDehydrateMutation: shouldPersistMutation },
      }}
      onSuccess={() => {
        if (!token) { queryClient.clear(); return; }
        // Offline replay can wait for connectivity; it must not hold the splash screen open.
        void queryClient.resumePausedMutations().then(() => refreshFamilyData(queryClient, { resource: 'reconnect' }));
      }}
    >
      <GestureHandlerRootView>
        <KeyboardProvider>
          <SheetHost>
            <Sheets />
            <RootLayout />
          </SheetHost>
        </KeyboardProvider>
      </GestureHandlerRootView>
    </PersistQueryClientProvider>
  );
}

function RootLayout() {
  const { token } = useSession();
  const isRestoring = useIsRestoring();
  useInvalidationChannel();

  useEffect(() => {
    if (!isRestoring) SplashScreen.hide();
  }, [isRestoring]);

  useEffect(() => {
    focusManager.setFocused(AppState.currentState === 'active');
    const subscription = AppState.addEventListener('change', (state) => {
      focusManager.setFocused(state === 'active');
      if (state === 'active' && token) void refreshFamilyData(queryClient, { resource: 'reconnect' });
    });
    return () => subscription.remove();
  }, [token]);

  return (
    <Stack screenOptions={{ headerShown: false, animation: isRestoring ? 'none' : 'default' }}>
      <Stack.Protected guard={!!token}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={!token}>
        <Stack.Screen name="(auth)/index" options={{ animationTypeForReplace: 'pop' }} />
      </Stack.Protected>
    </Stack>
  );
}
