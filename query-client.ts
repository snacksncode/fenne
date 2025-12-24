import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const WEEK_IN_MS = 1000 * 60 * 60 * 24 * 7;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { gcTime: WEEK_IN_MS },
  },
});

export const TANSTACK_QUERY_CACHE_KEY = 'TANSTACK_QUERY_CACHE_KEY';
export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: TANSTACK_QUERY_CACHE_KEY,
});
