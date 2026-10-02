/** @jest-environment-options {"customExportConditions": ["node", "node-addons"]} */
import React from 'react';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { APIError } from '@/api/client';
import { usePurchaseQuantity } from './use-purchase-quantity';

jest.mock('@/components/form/app-form', () => ({ useAppForm: jest.requireActual('@tanstack/react-form').useForm }));
jest.mock('@/api/client', () => ({ APIError: class extends Error { data: unknown; constructor(mockData: unknown) { super('Request failed'); this.data = mockData; } } }));

const purchase = { needed: 200, pantry: 0, shortage: 200, suggested_quantity: 250, packs: [{ size: 250, count: 1 }] };

describe('purchase quantity editing', () => {
  let renderer: ReactTestRenderer;
  let editor: ReturnType<typeof usePurchaseQuantity>;
  const save = jest.fn();
  const Harness = ({ automatic = true }: { automatic?: boolean }) => {
    editor = usePurchaseQuantity({ quantity: 250, purchase: automatic ? purchase : undefined, onSave: save });
    return <editor.form.Field name="quantity">{() => null}</editor.form.Field>;
  };
  beforeEach(() => { jest.useFakeTimers(); jest.clearAllMocks(); save.mockResolvedValue(undefined); });
  afterEach(async () => {
    await act(async () => { renderer.unmount(); jest.runOnlyPendingTimers(); });
    jest.useRealTimers();
  });

  it('preserves pack totals and switches to a manually typed decimal quantity', async () => {
    await act(async () => { renderer = create(<Harness />); });
    expect(editor.counts).toEqual({ 250: 1 });
    act(() => editor.changePack(250, 1));
    expect(editor.form.state.values.quantity).toBe('500');
    act(() => { editor.form.setFieldValue('quantity', '1,5'); editor.resetPacks(); });
    expect(editor.counts).toEqual({});
    await act(async () => { await editor.form.handleSubmit(); });
    expect(save).toHaveBeenCalledWith(1.5);
  });

  it('allows explicit zero only for calculated purchases and rejects unfinished numeric input', async () => {
    await act(async () => { renderer = create(<Harness />); });
    for (const invalid of ['', '-', '1.2.3', '1000000001']) {
      act(() => editor.form.setFieldValue('quantity', invalid));
      await act(async () => { await editor.form.handleSubmit(); });
    }
    expect(save).not.toHaveBeenCalled();
    act(() => editor.form.setFieldValue('quantity', '0'));
    await act(async () => { await editor.form.handleSubmit(); });
    expect(save).toHaveBeenCalledWith(0);
    save.mockClear();
    await act(async () => renderer.update(<Harness automatic={false} />));
    await act(async () => { await editor.form.handleSubmit(); });
    expect(save).not.toHaveBeenCalled();
  });

  it('keeps backend field feedback on the draft and can retry with a corrected value', async () => {
    save.mockRejectedValueOnce(new APIError({ quantity: ['Too many'] }));
    await act(async () => { renderer = create(<Harness />); });
    await act(async () => { await editor.form.handleSubmit(); });
    expect(editor.form.getFieldMeta('quantity')?.errorMap.onServer).toBe('Too many');
    expect(editor.form.getFieldMeta('quantity')?.isTouched).toBe(true);
    act(() => editor.form.setFieldValue('quantity', '2'));
    await act(async () => { await editor.form.handleSubmit(); });
    expect(save).toHaveBeenLastCalledWith(2);
    expect(editor.form.getFieldMeta('quantity')?.errorMap.onServer).toBeUndefined();
  });
});
