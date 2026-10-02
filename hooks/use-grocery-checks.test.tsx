/** @jest-environment-options {"customExportConditions": ["node", "node-addons"]} */
/// <reference types="jest" />
import React from 'react';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppState, AppStateStatus } from 'react-native';
import { groceriesRequests } from '@/api/groceries';
import { groceriesQuery, useDeleteGroceryItem } from '@/api/groceries';
import { GroceryItemDTO } from '@/api/types';
import { useGroceryChecks } from './use-grocery-checks';

jest.mock('nanoid/non-secure', () => ({ nanoid: () => 'test-id' }));
jest.mock('@/api/client', () => ({ client: {} }));
jest.mock('@/api/groceries', () => {
  const actual = jest.requireActual('@/api/groceries');
  Object.assign(actual.groceriesRequests, { edit: jest.fn(), delete: jest.fn(), getAll: jest.fn() });
  return actual;
});
jest.mock('@/query-client', () => ({ queryClient: new (jest.requireActual('@tanstack/react-query').QueryClient)() }));

const item = (id: string): GroceryItemDTO => ({
  id, name: id, product: null, quantity: 200, unit: 'g', status: 'pending',
  aisle: 'pantry', source: 'manual', recipes: [],
});

describe('grocery check bursts', () => {
  let client: QueryClient;
  let renderer: ReactTestRenderer;
  let checks: ReturnType<typeof useGroceryChecks>;
  let remove: ReturnType<typeof useDeleteGroceryItem>;
  let appState: (state: AppStateStatus) => void;
  const edit = jest.mocked(groceriesRequests.edit);
  const first = item('first');
  const second = item('second');
  const Harness = () => {
    checks = useGroceryChecks();
    remove = useDeleteGroceryItem();
    return null;
  };
  const rows = () => client.getQueryData(groceriesQuery.queryKey)!;
  const advance = async (ms: number) => {
    await act(async () => { jest.advanceTimersByTime(ms); });
  };

  beforeEach(async () => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    client = new QueryClient({ defaultOptions: { mutations: { retry: false }, queries: { retry: false } } });
    client.setQueryData(groceriesQuery.queryKey, [first, second]);
    edit.mockImplementation(async (change) => ({ ...item(change.id), ...change }));
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_, listener) => {
      appState = listener;
      return { remove: jest.fn() };
    });
    await act(async () => {
      renderer = create(<QueryClientProvider client={client}><Harness /></QueryClientProvider>);
    });
  });

  afterEach(async () => {
    await act(async () => renderer.unmount());
    client.clear();
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('checks immediately but moves the whole burst only 500 ms after its final tap', async () => {
    act(() => checks.toggle(first));
    expect(checks.checks.first.status).toBe('completed');
    expect(rows().map(({ status }) => status)).toEqual(['pending', 'pending']);
    await advance(400);
    act(() => checks.toggle(second));
    await advance(499);
    expect(edit).not.toHaveBeenCalled();
    expect(rows().map(({ status }) => status)).toEqual(['pending', 'pending']);

    const updates: string[][] = [];
    const unsubscribe = client.getQueryCache().subscribe((event) => {
      if (event.type === 'updated' && event.action.type === 'success') updates.push(rows().map(({ status }) => status));
    });
    await advance(1);
    unsubscribe();
    expect(updates).toEqual([['completed', 'completed']]);
    expect(edit.mock.calls.map(([change]) => change)).toEqual([
      { id: 'first', status: 'completed', quantity: 200 },
      { id: 'second', status: 'completed', quantity: 200 },
    ]);
    expect(checks.hasPending).toBe(false);
  });

  it('cancels a double tap and resets the shared wait for the remaining item', async () => {
    act(() => { checks.toggle(first); checks.toggle(second); });
    await advance(400);
    act(() => checks.toggle(first));
    expect(checks.checks.first).toBeUndefined();
    await advance(499);
    expect(edit).not.toHaveBeenCalled();
    await advance(1);
    expect(edit).toHaveBeenCalledTimes(1);
    expect(edit.mock.calls[0][0].id).toBe('second');
  });

  it('unchecks after the same delay without sending a purchase quantity', async () => {
    const bought = { ...first, status: 'completed' as const };
    client.setQueryData(groceriesQuery.queryKey, [bought]);
    act(() => checks.toggle(bought));
    expect(checks.checks.first.status).toBe('pending');
    expect(rows()[0].status).toBe('completed');
    await advance(500);
    expect(edit).toHaveBeenCalledWith({ id: 'first', status: 'pending' });
  });

  it('removes immediately and cancels that item without delaying other checks', async () => {
    act(() => { checks.toggle(first); checks.toggle(second); });
    await advance(200);
    await act(async () => { checks.cancel(first.id); remove.mutate({ id: first.id }); });
    expect(rows().map(({ id }) => id)).toEqual(['second']);
    expect(groceriesRequests.delete).toHaveBeenCalledWith({ id: 'first' }, expect.anything());
    expect(edit).not.toHaveBeenCalled();
    await advance(300);
    expect(edit).toHaveBeenCalledTimes(1);
    expect(edit.mock.calls[0][0].id).toBe('second');
  });

  it('rolls back only failed checks and reports the failure', async () => {
    edit.mockImplementation(async (change) => {
      if (change.id === first.id) throw new Error('Offline');
      return { ...second, ...change };
    });
    act(() => { checks.toggle(first); checks.toggle(second); });
    await advance(500);
    expect(rows().map(({ status }) => status)).toEqual(['pending', 'completed']);
    expect(checks.error).toBe(true);
    expect(checks.hasPending).toBe(false);
  });

  it('allows a new burst while an earlier save is pending without losing either batch', async () => {
    let finishFirst!: (value: GroceryItemDTO) => void;
    edit.mockImplementationOnce(() => new Promise((resolve) => { finishFirst = resolve; }));
    act(() => checks.toggle(first));
    await advance(500);
    expect(checks.isSaving(first.id)).toBe(true);
    expect(checks.hasPending).toBe(true);
    act(() => { checks.toggle(first); checks.toggle(second); });
    await advance(500);
    expect(edit).toHaveBeenCalledTimes(2);
    expect(checks.isSaving(first.id)).toBe(true);
    expect(checks.isSaving(second.id)).toBe(false);
    expect(checks.hasPending).toBe(true);
    await act(async () => finishFirst({ ...first, status: 'completed' }));
    expect(checks.hasPending).toBe(false);
    expect(rows().map(({ status }) => status)).toEqual(['completed', 'completed']);
  });

  it('flushes on background and unmount so queued taps are not lost', async () => {
    act(() => checks.toggle(first));
    await act(async () => appState('background'));
    expect(edit).toHaveBeenCalledTimes(1);
    act(() => checks.toggle(second));
    await act(async () => renderer.unmount());
    expect(edit).toHaveBeenCalledTimes(2);
    await advance(500);
    expect(edit).toHaveBeenCalledTimes(2);
  });
});
