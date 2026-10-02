import type { QueryClient } from '@tanstack/react-query';
import type { CurrentUserDTO } from '@/api/auth';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { atom, createStore } from 'jotai';
import * as SecureStore from 'expo-secure-store';
import { asyncStoragePersister, queryClient, TANSTACK_QUERY_CACHE_KEY } from '@/query-client';

export const TOKEN_KEY = 'ee3ad6fddfadb72';
export const HAS_LOGGED_IN_KEY = 'ff4f6ac0f731f';
const CACHE_SCOPE_KEY = 'session-cache-scope';

type Session = {
  token: string | null;
  isLoading: boolean;
  hasEverLoggedIn: boolean;
  cacheScope: string;
  revision: number;
};

export const sessionStore = createStore();
export const sessionAtom = atom<Session>({ token: null, isLoading: true, hasEverLoggedIn: false, cacheScope: '', revision: 0 });
export const getSession = () => sessionStore.get(sessionAtom);

let hydration: Promise<void> | undefined;
let storageWrite: Promise<unknown> = Promise.resolve();
const newCacheScope = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

// Credentials and cached data share one write queue, so old saves finish before a Session transition removes them.
function serializeStorage(write: () => Promise<void>) {
  const result = storageWrite.then(write, write);
  storageWrite = result.catch(() => {});
  return result;
}

export function hydrateSession() {
  if (hydration) return hydration;
  const revision = getSession().revision;
  hydration = (async () => {
    try {
      const [token, hasLoggedIn, savedScope] = await Promise.all([
        SecureStore.getItemAsync(TOKEN_KEY),
        SecureStore.getItemAsync(HAS_LOGGED_IN_KEY),
        SecureStore.getItemAsync(CACHE_SCOPE_KEY),
      ]);
      // Upgrade the existing authenticated session in place: legacy persisted
      // queries and paused writes used the empty buster. A later login always
      // creates a fresh scope, so the adopted cache cannot follow another user.
      const cacheScope = savedScope ?? (token ? '' : newCacheScope());
      if (savedScope === null) await serializeStorage(() => SecureStore.setItemAsync(CACHE_SCOPE_KEY, cacheScope));
      if (getSession().revision === revision) {
        sessionStore.set(sessionAtom, { token, hasEverLoggedIn: !!hasLoggedIn, cacheScope, isLoading: false, revision });
      }
    } catch {
      // Fail closed when secure storage is unavailable, while allowing the sign-in screen to load.
      if (getSession().revision === revision) {
        sessionStore.set(sessionAtom, { ...getSession(), token: null, isLoading: false });
      }
    }
  })();
  return hydration;
}

export async function setSessionToken(token: string) {
  await hydrateSession();
  const revision = getSession().revision + 1;
  const cacheScope = newCacheScope();
  sessionStore.set(sessionAtom, { ...getSession(), token: null, revision });
  await serializeStorage(async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await asyncStoragePersister.removeClient();
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.setItemAsync(HAS_LOGGED_IN_KEY, 'true');
    await SecureStore.setItemAsync(CACHE_SCOPE_KEY, cacheScope);
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  });
  if (getSession().revision === revision) {
    sessionStore.set(sessionAtom, { token, cacheScope, revision, hasEverLoggedIn: true, isLoading: false });
  }
}

/** The expected token keeps an old request's 401 from signing out a newer session. */
export async function signOut(expectedToken?: string) {
  const current = getSession();
  if (expectedToken !== undefined && current.token !== expectedToken) return;
  sessionStore.set(sessionAtom, { ...current, token: null, cacheScope: '', isLoading: false, revision: current.revision + 1 });
  await serializeStorage(async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await Promise.all([
      asyncStoragePersister.removeClient(),
      SecureStore.deleteItemAsync(TOKEN_KEY),
      SecureStore.deleteItemAsync(CACHE_SCOPE_KEY),
    ]);
  });
}

export async function resetFamilyData(client: QueryClient, currentUser: CurrentUserDTO) {
  const current = getSession();
  const revision = current.revision + 1;
  const cacheScope = newCacheScope();
  sessionStore.set(sessionAtom, { ...current, revision });
  const familyQueries = { predicate: (query: { queryKey: readonly unknown[] }) => query.queryKey[0] !== 'currentUser' };
  await serializeStorage(async () => {
    await client.cancelQueries(familyQueries);
    client.getMutationCache().clear();
    client.removeQueries(familyQueries);
    await asyncStoragePersister.removeClient();
    await SecureStore.setItemAsync(CACHE_SCOPE_KEY, cacheScope);
  });
  if (getSession().revision !== revision) return;
  // Publish the new Family before remounting scoped query observers; otherwise
  // the new current-user fetch could discover the same transition again.
  client.setQueryData(['currentUser'], currentUser);
  sessionStore.set(sessionAtom, { ...getSession(), cacheScope });
}

/** Guard at the storage adapter, including writes delayed by the persister's throttle. */
export function createSessionPersister(cacheScope: string) {
  const revision = getSession().revision;
  const isCurrent = () => !!getSession().token && getSession().cacheScope === cacheScope && getSession().revision === revision;
  return createAsyncStoragePersister({
    key: TANSTACK_QUERY_CACHE_KEY,
    storage: {
      getItem: async (key) => {
        if (!isCurrent()) return null;
        const value = await AsyncStorage.getItem(key);
        return isCurrent() ? value : null;
      },
      setItem: (key, value) => serializeStorage(async () => { if (isCurrent()) await AsyncStorage.setItem(key, value); }),
      removeItem: (key) => serializeStorage(async () => { if (isCurrent()) await AsyncStorage.removeItem(key); }),
    },
  });
}
