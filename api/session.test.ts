import type * as SessionModule from '@/lib/session';
import type * as TransportModule from '@/api/client';

jest.mock('expo-secure-store', () => ({ getItemAsync: jest.fn(), setItemAsync: jest.fn(), deleteItemAsync: jest.fn() }));
jest.mock('@react-native-async-storage/async-storage', () => ({ getItem: jest.fn(), setItem: jest.fn(), removeItem: jest.fn() }));
jest.mock('@/query-client', () => ({
  queryClient: new (jest.requireActual('@tanstack/react-query').QueryClient)(),
  asyncStoragePersister: { removeClient: jest.fn().mockResolvedValue(undefined) },
  TANSTACK_QUERY_CACHE_KEY: 'query-cache',
}));

let session: typeof SessionModule;
let transport: typeof TransportModule;
let storage: typeof import('expo-secure-store');
let secure: Map<string, string>;

beforeEach(() => {
  jest.resetModules();
  storage = jest.requireMock('expo-secure-store');
  secure = new Map([['ee3ad6fddfadb72', 'old-token'], ['ff4f6ac0f731f', 'true'], ['session-cache-scope', 'old-scope']]);
  jest.mocked(storage.getItemAsync).mockImplementation(async (key) => secure.get(key) ?? null);
  jest.mocked(storage.setItemAsync).mockImplementation(async (key, value) => { secure.set(key, value); });
  jest.mocked(storage.deleteItemAsync).mockImplementation(async (key) => { secure.delete(key); });
  session = jest.requireActual('@/lib/session');
  transport = jest.requireActual('@/api/client');
  globalThis.fetch = jest.fn();
});

it('hydrates once and shares credentials with request transport without per-request secure reads', async () => {
  await session.hydrateSession();
  jest.mocked(fetch).mockResolvedValue({ status: 200, ok: true, json: async () => ({ status: 'success', data: [] }) } as Response);
  await transport.client.get('/products');
  await transport.client.get('/pantry_entries');
  expect(storage.getItemAsync).toHaveBeenCalledTimes(3);
  expect(fetch).toHaveBeenLastCalledWith(expect.any(String), expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer old-token' }) }));
});

it('settles simultaneous unauthorized requests and clears both secure and query state', async () => {
  await session.hydrateSession();
  const { queryClient, asyncStoragePersister } = jest.requireMock('@/query-client');
  queryClient.setQueryData(['groceries'], ['old family']);
  jest.mocked(fetch).mockResolvedValue({ status: 401, ok: false } as Response);
  const results = await Promise.allSettled([transport.client.get('/products'), transport.client.get('/pantry_entries')]);
  expect(results.every(({ status }) => status === 'rejected')).toBe(true);
  expect(session.getSession().token).toBeNull();
  expect(secure.has(session.TOKEN_KEY)).toBe(false);
  expect(queryClient.getQueryData(['groceries'])).toBeUndefined();
  expect(asyncStoragePersister.removeClient).toHaveBeenCalledTimes(1);
});

it.each([200, 401])('ignores an old request after signing into a different session (status %s)', async (status) => {
  await session.hydrateSession();
  let finish!: (response: Response) => void;
  jest.mocked(fetch).mockImplementation(() => new Promise((resolve) => { finish = resolve; }));
  const request = transport.client.get('/products');
  await Promise.resolve();
  await session.signOut();
  await session.setSessionToken('new-token');
  finish({ status, ok: status === 200, json: async () => ({ status: 'success', data: ['old family'] }) } as Response);
  await expect(request).rejects.toBeInstanceOf(transport.SessionChangedError);
  expect(session.getSession().token).toBe('new-token');
  expect(secure.get(session.TOKEN_KEY)).toBe('new-token');
});

it('orders logout and an immediately following login without losing the new credentials', async () => {
  await session.hydrateSession();
  const logout = session.signOut();
  const login = session.setSessionToken('new-token');
  await Promise.all([logout, login]);
  expect(session.getSession().token).toBe('new-token');
  expect(secure.get(session.TOKEN_KEY)).toBe('new-token');
  expect(session.getSession().cacheScope).not.toBe('old-scope');
});

it('fails closed when secure storage cannot hydrate', async () => {
  jest.mocked(storage.getItemAsync).mockRejectedValueOnce(new Error('Locked'));
  await session.hydrateSession();
  expect(session.getSession()).toMatchObject({ token: null, isLoading: false });
});

it('does not restore an old cache if logout happens while storage is being read', async () => {
  await session.hydrateSession();
  const cache = jest.requireMock('@react-native-async-storage/async-storage');
  let finish!: (value: string) => void;
  cache.getItem.mockImplementation(() => new Promise((resolve) => { finish = resolve; }));
  const persister = session.createSessionPersister('old-scope');
  const restoring = persister.restoreClient();
  await session.signOut();
  finish(JSON.stringify({ timestamp: Date.now(), buster: 'old-scope', clientState: { queries: [], mutations: [] } }));
  await expect(restoring).resolves.toBeUndefined();
});

it('rejects a failed credential write without publishing an authenticated Session', async () => {
  await session.hydrateSession();
  jest.mocked(storage.setItemAsync).mockRejectedValueOnce(new Error('Secure storage unavailable'));
  await expect(session.setSessionToken('new-token')).rejects.toThrow('Secure storage unavailable');
  expect(session.getSession().token).toBeNull();
  expect(secure.has(session.TOKEN_KEY)).toBe(false);
});

it('does not save a cache through an old persister after logout', async () => {
  await session.hydrateSession();
  const cache = jest.requireMock('@react-native-async-storage/async-storage');
  const persister = session.createSessionPersister('old-scope');
  await session.signOut();
  await persister.persistClient({ timestamp: Date.now(), buster: 'old-scope', clientState: { queries: [], mutations: [] } });
  expect(cache.setItem).not.toHaveBeenCalled();
});

it('adopts legacy paused writes for the existing authenticated session, then isolates the next login', async () => {
  secure.delete('session-cache-scope');
  const cache = jest.requireMock('@react-native-async-storage/async-storage');
  const legacy = {
    timestamp: Date.now(), buster: '',
    clientState: { queries: [], mutations: [{ mutationKey: ['addPantryEntry'], state: { isPaused: true, variables: { product_id: 'saved-product' } } }] },
  };
  cache.getItem.mockResolvedValue(JSON.stringify(legacy));
  await session.hydrateSession();
  expect(session.getSession()).toMatchObject({ token: 'old-token', cacheScope: '' });
  expect(secure.get('session-cache-scope')).toBe('');
  const existingSessionCache = session.createSessionPersister('');
  await expect(existingSessionCache.restoreClient()).resolves.toEqual(legacy);
  await session.signOut();
  await session.setSessionToken('new-token');
  expect(session.getSession().cacheScope).not.toBe('');
  await expect(existingSessionCache.restoreClient()).resolves.toBeUndefined();
});

it('does not adopt an unauthenticated legacy cache', async () => {
  secure.delete(session.TOKEN_KEY);
  secure.delete('session-cache-scope');
  await session.hydrateSession();
  const persister = session.createSessionPersister(session.getSession().cacheScope);
  await expect(persister.restoreClient()).resolves.toBeUndefined();
});
