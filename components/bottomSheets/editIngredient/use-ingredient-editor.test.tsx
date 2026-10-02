/** @jest-environment-options {"customExportConditions": ["node", "node-addons"]} */
import React from 'react';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { ProductDTO } from '@/api/types';
import { useIngredientEditor } from './use-ingredient-editor';

const mockEdit = jest.fn();
const mockPresent = jest.fn();
const mockDismiss = jest.fn();
jest.mock('nanoid/non-secure', () => ({ nanoid: () => 'draft-id' }));
jest.mock('@/api/products', () => ({ useEditProduct: () => ({ mutateAsync: mockEdit }) }));
jest.mock('@/lib/sheet-context', () => ({ useSheets: () => ({ present: mockPresent, dismiss: mockDismiss }) }));
jest.mock('@/components/form/app-form', () => ({ useAppForm: jest.requireActual('@tanstack/react-form').useForm }));
const product: ProductDTO = { id: 'p1', name: 'Milk', aisle: 'dairy_eggs', unit: 'ml', shape: 'measured', conversions: {}, is_kitchen_basic: false, reminder_frequency_value: null, reminder_frequency_unit: null };

describe('Ingredient editor transitions', () => {
  let renderer: ReactTestRenderer;
  let editor: ReturnType<typeof useIngredientEditor>;
  const Harness = () => {
    editor = useIngredientEditor({ sheetId: 'edit-ingredient-sheet', data: { mode: 'create' } });
    if (editor.step.phase === 'product') return <editor.step.form.Field name="name">{() => null}</editor.step.form.Field>;
    if (editor.step.phase === 'ingredient') return <editor.step.form.Field name="quantity">{() => null}</editor.step.form.Field>;
    return null;
  };
  beforeEach(async () => {
    jest.clearAllMocks();
    mockEdit.mockReset(); mockPresent.mockReset();
    jest.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((callback) => { callback(0); return 0; });
    await act(async () => { renderer = create(<Harness />); });
  });
  afterEach(async () => { await act(async () => renderer.unmount()); jest.restoreAllMocks(); });
  const details = () => {
    if (editor.step.phase !== 'ingredient') throw new Error('Expected Ingredient details');
    return editor.step;
  };
  const selectProduct = () => act(() => {
    if (editor.step.phase === 'search') editor.step.onSelect({ kind: 'product', product });
  });

  it('carries the selected Product with the Ingredient phase and resets validation when selecting another', async () => {
    selectProduct();
    expect(details().selectedProduct.product.id).toBe('p1');
    act(() => details().form.setFieldValue('quantity', '0'));
    await act(async () => { await editor.action?.onPress(); });
    expect(details().form.getFieldMeta('quantity')?.errors.length).toBeGreaterThan(0);
    act(() => details().onClearProduct());
    expect(editor.step.phase).toBe('search');
    selectProduct();
    expect(details().form.state.values.quantity).toBe('1');
    expect(details().form.getFieldMeta('quantity')?.errors).toEqual([]);
  });
  it('preserves a new Ingredient quantity while editing its draft Product', async () => {
    act(() => { if (editor.step.phase === 'search') editor.step.onSelect({ kind: 'custom', name: 'Eggs' }); });
    await act(async () => { await editor.action?.onPress(); });
    act(() => details().form.setFieldValue('quantity', '3'));
    act(() => details().onEditProduct());
    expect(editor.step.phase).toBe('product');
    await act(async () => { await editor.action?.onPress(); });
    expect(details().form.state.values.quantity).toBe('3');
    expect(details().selectedProduct.product.name).toBe('Eggs');
  });
  it('requires a valid Conversion and waits for persistence before returning the Ingredient', async () => {
    selectProduct();
    mockPresent.mockResolvedValueOnce('cup');
    await act(async () => details().onSelectUnit());
    await act(async () => { await editor.action?.onPress(); });
    expect(details().conversionError).toContain('greater than 0');
    expect(mockDismiss).not.toHaveBeenCalled();
    act(() => details().onConversionChange('cup', '250'));
    mockEdit.mockResolvedValueOnce({ ...product, conversions: { cup: 250 } });
    await act(async () => { await editor.action?.onPress(); });
    expect(mockEdit).toHaveBeenCalledWith({ id: product.id, conversions: { cup: 250 } });
    expect(mockDismiss).toHaveBeenCalledWith('edit-ingredient-sheet', expect.objectContaining({ unit: 'cup', selectedProduct: expect.objectContaining({ product: expect.objectContaining({ conversions: { cup: 250 } }) }) }));
  });
});
