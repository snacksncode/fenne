/** @jest-environment-options {"customExportConditions": ["node", "node-addons"]} */
import React, { useEffect } from 'react';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { QueryClient, QueryClientProvider, notifyManager, defaultScheduler } from '@tanstack/react-query';
import { client as transport } from './client';
import { groceriesQuery, useDeleteGroceryItem, useEditGroceryItem, useGroceryCheckout } from './groceries';
import { scheduleQuery, useUpdateScheduleDay } from './schedules';
import { GroceryItemDTO } from './types';
import { getISOWeekString } from '@/date-tools';

jest.mock('@/api/client', () => ({ client: { get: jest.fn(), patch: jest.fn(), delete: jest.fn(), post: jest.fn(), put: jest.fn() } }));
jest.mock('nanoid/non-secure', () => ({ nanoid: () => 'test-id' }));

const item = (id: string, status: GroceryItemDTO['status'] = 'pending'): GroceryItemDTO => ({
  id, status, name: id, product: null, quantity: 1, unit: 'count', aisle: 'pantry', source: 'manual', recipes: [],
});
const deferred = () => {
  let resolve!: (value?: unknown) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};

let client: QueryClient;
let renderer: ReactTestRenderer;
let edit: ReturnType<typeof useEditGroceryItem>;
let remove: ReturnType<typeof useDeleteGroceryItem>;
let checkout: ReturnType<typeof useGroceryCheckout>;
let schedule: ReturnType<typeof useUpdateScheduleDay>;
const Harness = () => {
  const editMutation = useEditGroceryItem();
  const removeMutation = useDeleteGroceryItem();
  const checkoutMutation = useGroceryCheckout();
  const scheduleMutation = useUpdateScheduleDay();
  useEffect(() => {
    edit = editMutation;
    remove = removeMutation;
    checkout = checkoutMutation;
    schedule = scheduleMutation;
  });
  return null;
};

beforeEach(async () => {
  jest.clearAllMocks();
  notifyManager.setScheduler(queueMicrotask);
  client = new QueryClient({ defaultOptions: { mutations: { retry: false, gcTime: Infinity } } });
  client.setQueryData(groceriesQuery.queryKey, [item('first'), item('second')]);
  await act(async () => { renderer = create(<QueryClientProvider client={client}><Harness /></QueryClientProvider>); });
});
afterEach(async () => {
  await act(async () => renderer.unmount());
  client.clear();
  notifyManager.setScheduler(defaultScheduler);
});

it('a failed quantity edit preserves another entry’s successful edit', async () => {
  const first = deferred();
  jest.mocked(transport.patch).mockImplementationOnce(() => first.promise as Promise<any>).mockResolvedValueOnce(item('second'));
  let failed!: Promise<unknown>;
  await act(async () => {
    failed = edit.mutateAsync({ id: 'first', quantity: 3 }).catch(() => {});
    await edit.mutateAsync({ id: 'second', quantity: 5 });
  });
  await act(async () => { first.reject(new Error('Rejected')); await failed; });
  expect(client.getQueryData(groceriesQuery.queryKey)?.map(({ quantity }) => quantity)).toEqual([1, 5]);
});

it('a failed deletion restores only that entry without resurrecting a successful deletion', async () => {
  const first = deferred();
  jest.mocked(transport.delete).mockImplementationOnce(() => first.promise as Promise<any>).mockResolvedValueOnce({});
  let failed!: Promise<unknown>;
  await act(async () => {
    failed = remove.mutateAsync({ id: 'first' }).catch(() => {});
    await remove.mutateAsync({ id: 'second' });
  });
  await act(async () => { first.reject(new Error('Rejected')); await failed; });
  expect(client.getQueryData(groceriesQuery.queryKey)?.map(({ id }) => id)).toEqual(['first']);
});

it('a failed Checkout preserves edits to unchecked entries', async () => {
  client.setQueryData(groceriesQuery.queryKey, [item('first', 'completed'), item('second')]);
  const purchase = deferred();
  jest.mocked(transport.post).mockImplementationOnce(() => purchase.promise as Promise<any>);
  jest.mocked(transport.patch).mockResolvedValueOnce(item('second'));
  let failed!: Promise<unknown>;
  await act(async () => {
    failed = checkout.mutateAsync().catch(() => {});
    await edit.mutateAsync({ id: 'second', quantity: 5 });
  });
  await act(async () => { purchase.reject(new Error('Rejected')); await failed; });
  expect(client.getQueryData(groceriesQuery.queryKey)?.find(({ id }) => id === 'second')?.quantity).toBe(5);
  expect(client.getQueryData(groceriesQuery.queryKey)?.find(({ id }) => id === 'first')?.status).toBe('completed');
});

it('does not republish old optimistic data into a replacement Session cache', async () => {
  const deletion = deferred();
  jest.mocked(transport.delete).mockImplementationOnce(() => deletion.promise as Promise<any>);
  let failed!: Promise<unknown>;
  await act(async () => { failed = remove.mutateAsync({ id: 'first' }).catch(() => {}); });
  client.clear();
  client.setQueryData(groceriesQuery.queryKey, [item('new-family-entry')]);
  await act(async () => { deletion.reject(new Error('Session changed')); await failed; });
  expect(client.getQueryData(groceriesQuery.queryKey)?.map(({ id }) => id)).toEqual(['new-family-entry']);
});

it('a failed Schedule edit restores only its meal slot', async () => {
  const dateString = '2026-09-30';
  const key = scheduleQuery(getISOWeekString(dateString)).queryKey;
  client.setQueryData(key, [{ date: dateString, breakfast: null, lunch: null, dinner: null }]);
  const breakfast = deferred();
  jest.mocked(transport.put).mockImplementationOnce(() => breakfast.promise as Promise<any>).mockResolvedValueOnce({});
  let failed!: Promise<unknown>;
  await act(async () => {
    failed = schedule.mutateAsync({ dateString, breakfast: { type: 'dining_out', name: 'Cafe' } }).catch(() => {});
    await schedule.mutateAsync({ dateString, dinner: { type: 'dining_out', name: 'Restaurant' } });
  });
  await act(async () => { breakfast.reject(new Error('Rejected')); await failed; });
  expect(client.getQueryData(key)?.[0]).toMatchObject({ breakfast: null, dinner: { name: 'Restaurant' } });
});
