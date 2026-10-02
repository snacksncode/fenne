/** @jest-environment-options {"customExportConditions": ["node", "node-addons"]} */
import React from 'react';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { notifyManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useGenerationAmounts } from './use-generation-amounts';

const mockFetchPantry = jest.fn();
const mockAdd = jest.fn();
const mockEdit = jest.fn();
const mockProject = jest.fn();
const mockDismiss = jest.fn();
jest.mock('@/components/form/app-form', () => ({ useAppForm: jest.requireActual('@tanstack/react-form').useForm }));
jest.mock('@/api/client', () => ({ APIError: class extends Error {} }));
jest.mock('@/api/pantry', () => ({
  pantryQuery: { queryKey: ['pantry'], queryFn: () => mockFetchPantry() },
  useAddPantryEntry: () => ({ mutateAsync: mockAdd }),
  useEditPantryEntry: () => ({ mutateAsync: mockEdit }),
}));
jest.mock('@/api/products', () => ({ purchaseSuggestionQuery: (id: string, needed: number, pantry: number) => ({
  queryKey: ['projection', id, needed, pantry], queryFn: () => mockProject(id, needed, pantry),
}) }));
jest.mock('@/lib/sheet-context', () => ({ useSheets: () => ({ dismiss: mockDismiss }) }));

const purchase = { needed: 200, pantry: 50, shortage: 150, suggested_quantity: 190, packs: [{ size: 190, count: 1 }] };
const product = { id: 'product', name: 'Pesto', unit: 'g' as const, pack_sizes: [190] };

describe('Generation quantity workflow', () => {
  let renderer: ReactTestRenderer;
  let client: QueryClient;
  let editor: ReturnType<typeof useGenerationAmounts>;
  const Harness = () => {
    editor = useGenerationAmounts({ sheetId: 'generation-amounts-sheet', data: { product, purchase, quantity: 190 } });
    return editor.ready ? <><editor.form.Field name="pantry">{() => null}</editor.form.Field><editor.form.Field name="quantity">{() => null}</editor.form.Field></> : null;
  };
  const mount = async () => { await act(async () => { renderer = create(<QueryClientProvider client={client}><Harness /></QueryClientProvider>); }); };
  beforeEach(() => {
    jest.clearAllMocks();
    notifyManager.setScheduler((callback) => callback());
    client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
    mockFetchPantry.mockResolvedValue([{ id: 'entry', product_id: product.id, quantity_remaining: 50 }]);
    mockProject.mockImplementation(async (_id, needed, pantry) => ({ ...purchase, needed, pantry }));
    mockEdit.mockResolvedValue(undefined);
    mockDismiss.mockResolvedValue(undefined);
  });
  afterEach(async () => {
    await act(async () => renderer?.unmount());
    client.clear();
    notifyManager.setScheduler((callback) => setTimeout(callback, 0));
  });

  it('waits for fresh Pantry stock before starting a draft, then preserves it across refreshes', async () => {
    client.setQueryData(['pantry'], [{ id: 'entry', product_id: product.id, quantity_remaining: 10 }]);
    let resolve!: (value: unknown) => void;
    mockFetchPantry.mockReturnValueOnce(new Promise((done) => { resolve = done; }));
    await mount();
    expect(editor.ready).toBe(false);
    await act(async () => resolve([{ id: 'entry', product_id: product.id, quantity_remaining: 50 }]));
    expect(editor.ready).toBe(true);
    expect(editor.form.state.values.pantry).toBe('50');
    act(() => editor.form.setFieldValue('pantry', '75'));
    await act(async () => { client.setQueryData(['pantry'], [{ id: 'entry', product_id: product.id, quantity_remaining: 99 }]); });
    expect(editor.form.state.values.pantry).toBe('75');
  });

  it('resolves the exact automatic draft before saving rather than the debounced preview', async () => {
    await mount();
    act(() => editor.form.setFieldValue('pantry', '80'));
    await act(async () => { await editor.form.handleSubmit(); });
    expect(mockProject).toHaveBeenCalledWith(product.id, 200, 80);
    expect(mockEdit).toHaveBeenCalledWith({ id: 'entry', quantity_remaining: 80 });
    expect(mockDismiss).toHaveBeenCalledWith('generation-amounts-sheet', { quantity: null });
  });

  it('saves explicit zero and leaves the draft open if the Pantry write fails', async () => {
    await mount();
    act(() => { editor.form.setFieldValue('pantry', '80'); editor.form.setFieldValue('quantity', '0'); });
    mockEdit.mockRejectedValueOnce(new Error('Unavailable'));
    await act(async () => { await editor.form.handleSubmit(); });
    expect(mockDismiss).not.toHaveBeenCalled();
    expect(editor.feedback.error).toBe('Could not save amounts. Try again.');
    await act(async () => { await editor.form.handleSubmit(); });
    expect(mockDismiss).toHaveBeenCalledWith('generation-amounts-sheet', { quantity: 0 });
  });
});
