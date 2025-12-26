import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient, onlineManager } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Network from 'expo-network';

export const WEEK_IN_MS = 1000 * 60 * 60 * 24 * 7;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { gcTime: WEEK_IN_MS },
  },
});

onlineManager.setEventListener((setOnline) => {
  const eventSubscription = Network.addNetworkStateListener((state) => {
    setOnline(!!state.isConnected);
  });
  return eventSubscription.remove;
});

export const TANSTACK_QUERY_CACHE_KEY = 'TANSTACK_QUERY_CACHE_KEY';
export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: TANSTACK_QUERY_CACHE_KEY,
});
