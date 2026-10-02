/// <reference types="jest" />
import React from 'react';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { QueryClient, QueryClientProvider, notifyManager, defaultScheduler } from '@tanstack/react-query';
import { client as transport } from '@/api/client';
import { productCatalogQuery, useProductSuggestions } from './products';
import { queryKeys } from './query-keys';
import type { ProductSearchContext } from './products';

let mockFamilyId = 'family-1';

beforeAll(() => notifyManager.setScheduler(queueMicrotask));
afterAll(() => notifyManager.setScheduler(defaultScheduler));

jest.mock('@/api/client', () => ({ client: { get: jest.fn() } }));
jest.mock('@/api/auth', () => ({ useCurrentUser: () => ({ data: { family: { id: mockFamilyId } } }) }));
jest.mock('@/api/pantry', () => ({ pantryQuery: { queryKey: ['pantry'] } }));
jest.mock('@/api/groceries', () => ({ groceriesQuery: { queryKey: ['groceries'] } }));

it('fetches once across query/context changes and refetches after product invalidation', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  const fetchCatalog = jest.mocked(transport.get);
  fetchCatalog.mockResolvedValue({ products: [], suggestions: [{ id: '1', name: 'Chicken', aisle: 'meat' }] });
  let latest: ReturnType<typeof useProductSuggestions>;
  let renderer: ReactTestRenderer;
  const Picker = ({ query, context }: { query: string; context: ProductSearchContext }) => {
    latest = useProductSuggestions(query, context);
    return null;
  };
  const view = (query: string, context: ProductSearchContext) => (
    <QueryClientProvider client={client}><Picker query={query} context={context} /></QueryClientProvider>
  );
  try {
    await act(async () => { renderer = create(view('', 'recipe')); });
    await act(async () => { renderer.update(view('chiken', 'shopping')); });
    expect(latest!.data?.results[0].name).toBe('Chicken');
    await act(async () => { renderer.update(view('chiken', 'pantry')); });
    expect(latest!.data?.results).toEqual([]);
    expect(fetchCatalog).toHaveBeenCalledTimes(1);

    fetchCatalog.mockResolvedValue({ products: [], suggestions: [{ id: '2', name: 'Chicken Wings', aisle: 'meat' }] });
    await act(async () => { await client.invalidateQueries({ queryKey: queryKeys.products.all() }); });
    await act(async () => { renderer.update(view('chiken', 'recipe')); });
    expect(fetchCatalog).toHaveBeenCalledTimes(2);
    expect(latest!.data?.results[0].name).toBe('Chicken Wings');
  } finally {
    act(() => renderer!.unmount());
    client.clear();
  }
});


it('uses separate family caches and never displays the previous family while loading', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  client.setQueryData(productCatalogQuery('family-1').queryKey, {
    products: [], suggestions: [{ id: '1', name: 'Chicken', aisle: 'meat' }],
  });
  const fetchCatalog = jest.mocked(transport.get);
  fetchCatalog.mockClear();
  let resolveCatalog!: (data: { products: []; suggestions: [] }) => void;
  fetchCatalog.mockReturnValue(new Promise((resolve) => { resolveCatalog = resolve; }));
  let latest: ReturnType<typeof useProductSuggestions>;
  let renderer: ReactTestRenderer;
  const Picker = () => {
    latest = useProductSuggestions('chiken', 'recipe');
    return null;
  };
  const view = () => <QueryClientProvider client={client}><Picker /></QueryClientProvider>;
  try {
    await act(async () => { renderer = create(view()); });
    expect(latest!.data?.results[0].name).toBe('Chicken');
    expect(fetchCatalog).not.toHaveBeenCalled();
    mockFamilyId = 'family-2';
    await act(async () => { renderer.update(view()); });
    expect(latest!.data).toBeUndefined();
    expect(fetchCatalog).toHaveBeenCalledTimes(1);
    await act(async () => { resolveCatalog({ products: [], suggestions: [] }); });
    expect(latest!.data?.results).toEqual([]);
  } finally {
    mockFamilyId = 'family-1';
    act(() => renderer!.unmount());
    client.clear();
  }
});
