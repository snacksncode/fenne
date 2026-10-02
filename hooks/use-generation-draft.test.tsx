/** @jest-environment-options {"customExportConditions": ["node", "node-addons"]} */
import React from 'react';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { Provider } from 'jotai';
import { GroceryPreviewDTO } from '@/api/types';
import { useGenerationDraftStore, useGenerationProductDraft, useGenerationSubmission } from './use-generation-draft';

const mockGenerate = jest.fn();
jest.mock('@/api/groceries', () => ({ useGenerateGroceryItems: () => ({ mutate: mockGenerate, isPending: false, isError: false }) }));
const preview = { products: [{ product_id: 'recipe', checked: true }, { product_id: 'timed', checked: false }], recipes: [] } as unknown as GroceryPreviewDTO;

describe('a scoped Generation draft', () => {
  let renderer: ReactTestRenderer;
  let recipe: ReturnType<typeof useGenerationProductDraft>;
  let timed: ReturnType<typeof useGenerationProductDraft>;
  let submission: ReturnType<typeof useGenerationSubmission>;
  const Content = () => {
    recipe = useGenerationProductDraft('recipe');
    timed = useGenerationProductDraft('timed');
    submission = useGenerationSubmission({ preview, start: '2026-09-30', end: '2026-10-01', onSuccess: jest.fn() });
    return null;
  };
  const Review = () => {
    const store = useGenerationDraftStore(preview);
    return <Provider store={store}><Content /></Provider>;
  };
  beforeEach(async () => { mockGenerate.mockClear(); await act(async () => { renderer = create(<Review />); }); });
  afterEach(async () => { await act(async () => renderer.unmount()); });

  it('starts from preview choices and excludes overrides for deselected Products', () => {
    expect(recipe.checked).toBe(true);
    expect(timed.checked).toBe(false);
    act(() => { recipe.setQuantity(0); timed.setQuantity(10); });
    act(() => submission.submit());
    expect(mockGenerate.mock.calls[0][0]).toEqual({
      start: '2026-09-30', end: '2026-10-01', checked_product_ids: ['recipe'],
      purchase_quantities: [{ product_id: 'recipe', quantity: 0 }],
    });
  });

  it('blocks submission during an edit and preserves an explicit reset to automatic quantity', () => {
    act(() => { recipe.setEditing(true); submission.submit(); });
    expect(mockGenerate).not.toHaveBeenCalled();
    act(() => { recipe.setQuantity(null); recipe.setEditing(false); });
    act(() => submission.submit());
    expect(mockGenerate.mock.calls[0][0].purchase_quantities).toEqual([{ product_id: 'recipe', quantity: null }]);
  });

  it('resets choices and overrides when a new review is mounted', async () => {
    act(() => { recipe.toggle(); timed.toggle(); timed.setQuantity(3); });
    await act(async () => renderer.update(<Review key="new-range" />));
    expect(recipe.checked).toBe(true);
    expect(timed.checked).toBe(false);
    expect(timed.override).toBeUndefined();
  });
});
