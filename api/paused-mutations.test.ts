import { QueryClient, dehydrate, hydrate, onlineManager } from '@tanstack/react-query';
import { client as transport } from '@/api/client';
import { addPantryEntryMutation } from './pantry';
import { queryClient, shouldPersistMutation } from '@/query-client';
import { queryKeys } from './query-keys';

jest.mock('@/api/client', () => ({ client: { post: jest.fn(), patch: jest.fn(), delete: jest.fn(), get: jest.fn(), put: jest.fn() } }));
jest.mock('@/lib/session', () => ({ resetFamilyData: jest.fn() }));
jest.mock('nanoid/non-secure', () => ({ nanoid: () => 'test-id' }));
jest.mock('expo-network', () => ({
  addNetworkStateListener: () => ({ remove: jest.fn() }),
  getNetworkStateAsync: async () => ({ isConnected: true, isInternetReachable: true }),
}));

afterEach(() => { onlineManager.setOnline(true); jest.clearAllMocks(); });

it('registers Pantry replay defaults when its domain module loads', () => {
  expect(queryClient.getMutationDefaults(addPantryEntryMutation.mutationKey)).toEqual(addPantryEntryMutation);
});

it.each([false, true])('restores and repairs an offline Pantry mutation without its screen (failure=%s)', async (fails) => {
  const original = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity }, mutations: { gcTime: Infinity } } });
  original.setMutationDefaults(addPantryEntryMutation.mutationKey, addPantryEntryMutation);
  onlineManager.setOnline(false);
  const mutation = original.getMutationCache().build(original, { mutationKey: ['addPantryEntry'] });
  void mutation.execute({ product_id: 'product-1', quantity_remaining: 3 });
  await Promise.resolve();
  const snapshot = dehydrate(original, { shouldDehydrateMutation: shouldPersistMutation });
  expect(snapshot.mutations).toHaveLength(1);
  original.clear();

  const restored = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity }, mutations: { gcTime: Infinity } } });
  restored.setMutationDefaults(addPantryEntryMutation.mutationKey, addPantryEntryMutation);
  restored.setQueryData(queryKeys.pantry.all(), []);
  restored.setQueryData(queryKeys.groceries.all(), []);
  restored.setQueryData(queryKeys.groceries.preview('start', 'end'), {});
  if (fails) jest.mocked(transport.post).mockRejectedValueOnce(new Error('Rejected'));
  else jest.mocked(transport.post).mockResolvedValueOnce({ id: 'entry-1' });
  hydrate(restored, snapshot);
  onlineManager.setOnline(true);
  await restored.resumePausedMutations();
  expect(transport.post).toHaveBeenCalledWith('/pantry_entries', { product_id: 'product-1', quantity_remaining: 3 });
  expect(restored.getQueryState(queryKeys.pantry.all())?.isInvalidated).toBe(true);
  expect(restored.getQueryState(queryKeys.groceries.all())?.isInvalidated).toBe(true);
  expect(restored.getQueryState(queryKeys.groceries.preview('start', 'end'))?.isInvalidated).toBe(true);
  expect(restored.getMutationCache().getAll()[0].state.status).toBe(fails ? 'error' : 'success');
  restored.clear();
});

it('never persists credentials or Family-changing actions', () => {
  const client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity }, mutations: { gcTime: Infinity } } });
  for (const key of ['logIn', 'changePassword', 'acceptInvite', 'leaveFamily']) {
    const mutation = client.getMutationCache().build<unknown, Error, unknown, unknown>(client, { mutationKey: [key] }, {
      context: undefined, data: undefined, error: null, failureCount: 0, failureReason: null,
      isPaused: true, status: 'pending', variables: { password: 'never save' }, submittedAt: Date.now(),
    });
    expect(shouldPersistMutation(mutation)).toBe(false);
  }
  client.clear();
});
