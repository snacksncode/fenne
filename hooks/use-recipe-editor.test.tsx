/** @jest-environment-options {"customExportConditions": ["node", "node-addons"]} */
import React from 'react';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { APIError } from '@/api/client';
import { IngredientFormData, ProductDTO, RecipeFormData } from '@/api/types';
import { useRecipeEditor } from './use-recipe-editor';

const mockAdd = jest.fn();
const mockEdit = jest.fn();
const mockPresent = jest.fn();
const mockBack = jest.fn();
jest.mock('@/api/client', () => ({ APIError: class extends Error { data: unknown; constructor(value: unknown) { super(); this.data = value; } } }));
jest.mock('@/api/recipes', () => ({ useAddRecipe: () => ({ mutateAsync: mockAdd }), useEditRecipe: () => ({ mutateAsync: mockEdit }) }));
jest.mock('@/api/errors', () => ({ missingRecipeConversionsFromError: (error: { conversions?: unknown }) => error.conversions ?? null }));
jest.mock('@/api/optimistic', () => ({ tempId: () => 'new-recipe' }));
jest.mock('@/lib/sheet-context', () => ({ useSheets: () => ({ present: mockPresent }) }));
jest.mock('expo-router/react-navigation', () => ({ useNavigation: () => ({ goBack: mockBack }) }));
jest.mock('@/components/form/app-form', () => ({ useAppForm: jest.requireActual('@tanstack/react-form').useForm }));

const product: ProductDTO = { id: 'p1', name: 'Milk', aisle: 'dairy_eggs', unit: 'ml', shape: 'measured', conversions: {}, is_kitchen_basic: false, reminder_frequency_value: null, reminder_frequency_unit: null };
const ingredient = (id = 'i1'): IngredientFormData => ({ id, name: 'Milk', name_override: null, quantity: '2', unit: 'cup', aisle: 'dairy_eggs', selectedProduct: { type: 'existing', product } });
const draft = (): RecipeFormData => ({ id: 'r1', name: 'Soup', liked: false, ingredients: [ingredient()], meal_types: ['dinner'], time_in_minutes: '20', notes: '<p>Notes</p>' });
const requirement = (index: number, productId = product.id) => ({ ingredient_index: index, product_id: productId, ingredient_unit: 'cup', product_unit: 'ml', product_name: 'Milk' });
const repaired = () => ({ ...ingredient(), selectedProduct: { type: 'existing' as const, product: { ...product, conversions: { cup: 250 } } } });

describe('Recipe draft and save workflow', () => {
  let renderer: ReactTestRenderer;
  let editor: ReturnType<typeof useRecipeEditor>;
  let changeName: (name: string) => void;
  const Harness = () => {
    editor = useRecipeEditor();
    return <>
      <editor.form.Field name="name">{(field) => { changeName = field.handleChange; return null; }}</editor.form.Field>
      {(['ingredients', 'meal_types', 'time_in_minutes', 'notes'] as const).map((name) => <editor.form.Field key={name} name={name}>{() => null}</editor.form.Field>)}
    </>;
  };
  beforeEach(async () => {
    jest.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((callback) => { callback(0); return 0; });
    jest.clearAllMocks();
    mockAdd.mockReset().mockResolvedValue({});
    mockPresent.mockReset();
    await act(async () => { renderer = create(<Harness />); });
    act(() => editor.form.reset(draft()));
  });
  afterEach(async () => { await act(async () => renderer.unmount()); jest.restoreAllMocks(); });
  const save = async () => { await act(async () => editor.form.handleSubmit()); };

  it('saves the draft and keeps notes when the native editor is unavailable', async () => {
    await save();
    expect(mockAdd).toHaveBeenCalledWith(expect.objectContaining({ name: 'Soup', notes: '<p>Notes</p>', time_in_minutes: 20 }));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });
  it('rejects invalid quantities before sending a Recipe', async () => {
    act(() => editor.form.setFieldValue('ingredients', [{ ...ingredient(), quantity: 'invalid' }]));
    await save();
    expect(mockAdd).not.toHaveBeenCalled();
    expect(editor.form.getFieldMeta('ingredients')?.errors.length).toBeGreaterThan(0);
  });
  it('repairs duplicate Product requirements once and propagates the Product to every Ingredient', async () => {
    act(() => editor.form.setFieldValue('ingredients', [ingredient(), ingredient('i2')]));
    mockAdd.mockRejectedValueOnce({ conversions: [requirement(0), requirement(1)] });
    mockPresent.mockResolvedValueOnce(repaired());
    await save();
    expect(mockPresent).toHaveBeenCalledTimes(1);
    expect(mockAdd).toHaveBeenCalledTimes(2);
    expect(editor.form.state.values.ingredients[1].selectedProduct.product.conversions).toEqual({ cup: 250 });
    expect(mockBack).toHaveBeenCalledTimes(1);
  });
  it('keeps completed repairs when a later Conversion is cancelled', async () => {
    act(() => editor.form.setFieldValue('ingredients', [ingredient(), ingredient('i2')]));
    mockAdd.mockRejectedValueOnce({ conversions: [requirement(0), requirement(1, 'p2')] });
    mockPresent.mockResolvedValueOnce(repaired()).mockResolvedValueOnce(null);
    await save();
    expect(mockAdd).toHaveBeenCalledTimes(1);
    expect(mockBack).not.toHaveBeenCalled();
    expect(editor.form.state.values.ingredients[0].selectedProduct.product.conversions).toEqual({ cup: 250 });
    expect(editor.feedback.error).toContain('Recipe not saved');
  });
  it('bounds recovery when the server keeps requiring a Conversion', async () => {
    mockAdd.mockRejectedValue({ conversions: [requirement(0)] });
    mockPresent.mockResolvedValue(repaired());
    await save();
    expect(mockAdd).toHaveBeenCalledTimes(4);
    expect(mockPresent).toHaveBeenCalledTimes(3);
    expect(mockBack).not.toHaveBeenCalled();
    expect(editor.feedback.error).toContain('Could not resolve');
  });
  it('maps server fields and base errors and clears them on a successful retry', async () => {
    mockAdd.mockRejectedValueOnce(new APIError({ name: ['Already exists'], base: ['Try another name'] }));
    await save();
    expect(editor.form.getFieldMeta('name')?.errorMap.onServer).toBe('Already exists');
    expect(editor.feedback.error).toBe('Try another name');
    act(() => changeName('Different soup'));
    await save();
    expect(mockBack).toHaveBeenCalledTimes(1);
    expect(editor.feedback.error).toBeNull();
  });
});
