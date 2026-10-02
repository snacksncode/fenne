import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient, onlineManager, defaultShouldDehydrateMutation } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Network from 'expo-network';

export const WEEK_IN_MS = 1000 * 60 * 60 * 24 * 7;

// Persistence is opted into beside each domain's mutation defaults.
export const shouldPersistMutation: typeof defaultShouldDehydrateMutation = (mutation) =>
  defaultShouldDehydrateMutation(mutation) && mutation.meta?.persist === true;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: WEEK_IN_MS,
      retry: (count, error) => !['SessionChangedError', 'UnauthorizedError'].includes(error.name) && count < 3,
    },
  },
});

onlineManager.setEventListener((setOnline) => {
  let changed = false;
  let disposed = false;
  const eventSubscription = Network.addNetworkStateListener((state) => {
    changed = true;
    setOnline(!!state.isConnected && state.isInternetReachable !== false);
  });
  void Network.getNetworkStateAsync().then((state) => {
    if (!changed && !disposed) setOnline(!!state.isConnected && state.isInternetReachable !== false);
  }).catch(() => {});
  return () => { disposed = true; eventSubscription.remove(); };
});

export const TANSTACK_QUERY_CACHE_KEY = 'TANSTACK_QUERY_CACHE_KEY';
export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: TANSTACK_QUERY_CACHE_KEY,
});
