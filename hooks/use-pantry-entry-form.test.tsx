/** @jest-environment-options {"customExportConditions": ["node", "node-addons"]} */
import React from 'react';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { APIError } from '@/api/client';
import { PantryEntryDTO, ProductDTO } from '@/api/types';
import { usePantryEntryForm } from './use-pantry-entry-form';

const mockAdd = jest.fn();
const mockEdit = jest.fn();
const mockSaved = jest.fn();
jest.mock('@/api/client', () => ({ APIError: class extends Error { data: unknown; constructor(value: unknown) { super(); this.data = value; } } }));
jest.mock('@/api/pantry', () => ({ useAddPantryEntry: () => ({ mutateAsync: mockAdd }), useEditPantryEntry: () => ({ mutateAsync: mockEdit }) }));
jest.mock('@/components/form/app-form', () => ({ useAppForm: jest.requireActual('@tanstack/react-form').useForm }));
const product: ProductDTO = { id: 'p1', name: 'Milk', aisle: 'dairy_eggs', unit: 'ml', shape: 'measured', conversions: {}, is_kitchen_basic: false, reminder_frequency_value: null, reminder_frequency_unit: null };

describe('Pantry Entry draft', () => {
  let renderer: ReactTestRenderer;
  let editor: ReturnType<typeof usePantryEntryForm>;
  const Harness = ({ selected = product, entry }: { selected?: ProductDTO; entry?: PantryEntryDTO }) => {
    editor = usePantryEntryForm({ product: selected, entry, onSaved: mockSaved });
    return <editor.form.Field name={editor.isTimed ? 'lastAcquired' : 'quantity'}>{() => null}</editor.form.Field>;
  };
  beforeEach(() => { jest.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((callback) => { callback(0); return 0; });
    jest.clearAllMocks(); mockAdd.mockReset().mockResolvedValue({}); mockEdit.mockReset().mockResolvedValue({}); });
  afterEach(async () => { await act(async () => renderer.unmount()); jest.restoreAllMocks(); });
  const mount = async (props = {}) => { await act(async () => { renderer = create(<Harness {...props} />); }); };
  const save = async () => { await act(async () => editor.form.handleSubmit()); };

  it('adds decimal stock with the Product identity', async () => {
    await mount();
    act(() => editor.form.setFieldValue('quantity', '2,5'));
    await save();
    expect(mockAdd).toHaveBeenCalledWith({ product_id: 'p1', quantity_remaining: 2.5 });
    expect(mockSaved).toHaveBeenCalledTimes(1);
  });
  it('edits through the existing Pantry Entry identity', async () => {
    await mount({ entry: { id: 'e1', product, quantity_remaining: 3, last_acquired: null } });
    await save();
    expect(mockEdit).toHaveBeenCalledWith({ id: 'e1', quantity_remaining: 3 });
    expect(mockAdd).not.toHaveBeenCalled();
  });
  it('rejects zero stock before mutation', async () => {
    await mount();
    act(() => editor.form.setFieldValue('quantity', '0'));
    await save();
    expect(mockAdd).not.toHaveBeenCalled();
    expect(editor.form.getFieldMeta('quantity')?.errors.length).toBeGreaterThan(0);
  });
  it('submits only Last Acquired for Timed Products and ignores hidden quantity', async () => {
    await mount({ selected: { ...product, shape: 'timed' } });
    act(() => { editor.form.setFieldValue('quantity', 'invalid'); editor.form.setFieldValue('lastAcquired', '2026-09-30'); });
    await save();
    expect(mockAdd).toHaveBeenCalledWith({ product_id: 'p1', last_acquired: '2026-09-30T00:00:00.000Z' });
  });
  it('rejects rollover dates instead of silently moving acquisition to another month', async () => {
    await mount({ selected: { ...product, shape: 'timed' } });
    act(() => editor.form.setFieldValue('lastAcquired', '2026-02-31'));
    await save();
    expect(mockAdd).not.toHaveBeenCalled();
    expect(editor.form.getFieldMeta('lastAcquired')?.errors.length).toBeGreaterThan(0);
  });
  it('keeps server feedback visible and the sheet open when saving fails', async () => {
    await mount();
    mockAdd.mockRejectedValueOnce(new APIError({ quantity_remaining: ['Too much stock'], base: ['Check the quantity'] }));
    await save();
    expect(editor.form.getFieldMeta('quantity')?.errorMap.onServer).toBe('Too much stock');
    expect(editor.feedback.error).toBe('Check the quantity');
    expect(mockSaved).not.toHaveBeenCalled();
  });
});
