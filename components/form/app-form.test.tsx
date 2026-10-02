/** @jest-environment-options {"customExportConditions": ["node", "node-addons"]} */
import React from 'react';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { AnyFormApi } from '@tanstack/react-form';
import { InlineQuantityInput } from '@/components/inline-quantity-input';
import { Button } from '@/components/button';
import { useAppForm } from './app-form';

jest.mock('@/components/input', () => ({ NumberInput: 'NumberInput', TextInput: 'TextInput' }));
jest.mock('@/components/inline-quantity-input', () => ({ InlineQuantityInput: 'QuantityInput' }));
jest.mock('@/components/button', () => ({ Button: 'Button' }));
jest.mock('@/components/aisle-header', () => ({ AisleHeader: 'AisleHeader' }));
jest.mock('@/components/pack-size-fields', () => ({ PackSizeFields: 'PackSizeFields' }));
jest.mock('@/components/pressable-with-feedback', () => ({ PressableWithHaptics: 'Pressable' }));
jest.mock('@/components/product-behavior-selector', () => ({ ProductBehaviorSelector: 'Behavior', TrackingUnitSelect: 'TrackingUnit' }));
jest.mock('@/components/reminder-frequency-fields', () => ({ ReminderFrequencyFields: 'ReminderFrequency' }));
jest.mock('@/components/Typography', () => ({ Typography: 'Typography' }));

describe('registered form controls', () => {
  let renderer: ReactTestRenderer;
  let form: AnyFormApi;
  const onValueChange = jest.fn();
  let onSubmit: () => Promise<void>;
  const Harness = ({ displayValue }: { displayValue?: string }) => {
    const instance = useAppForm({
      defaultValues: { quantity: null as string | null },
      onSubmit: () => onSubmit(),
    });
    form = instance;
    return (
      <instance.AppForm>
        <instance.AppField name="quantity">
          {(field) => <field.InlineQuantityField unit="count" accessibilityLabel="Eggs to buy" displayValue={displayValue} onValueChange={onValueChange} />}
        </instance.AppField>
        <instance.Error />
        <instance.SubmitButton text="Save" variant="primary" />
      </instance.AppForm>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    onSubmit = async () => {};
  });

  afterEach(async () => { await act(async () => renderer?.unmount()); });

  it('keeps automatic quantities null until edited and binds changes, blur, and unit wording', async () => {
    await act(async () => { renderer = create(<Harness displayValue="1" />); });
    let input = renderer.root.findByType(InlineQuantityInput);
    expect(input.props.value).toBe('1');
    expect(input.props.unit).toBe('item');
    expect(form.state.values.quantity).toBeNull();
    await act(async () => { input.props.onChangeText('2,5'); input.props.onBlur(); });
    expect(form.state.values.quantity).toBe('2,5');
    expect(form.getFieldMeta('quantity')?.isTouched).toBe(true);
    expect(onValueChange).toHaveBeenCalledWith('2,5');
    await act(async () => renderer.update(<Harness />));
    input = renderer.root.findByType(InlineQuantityInput);
    expect(input.props.value).toBe('2,5');
    expect(input.props.unit).toBe('items');
  });

  it('renders structured field errors only once the field is touched', async () => {
    await act(async () => { renderer = create(<Harness />); });
    act(() => form.setFieldMeta('quantity', (meta) => ({ ...meta, errorMap: { onSubmit: { message: 'Enter a quantity' } } })));
    expect(JSON.stringify(renderer.toJSON())).not.toContain('Enter a quantity');
    act(() => form.setFieldMeta('quantity', (meta) => ({ ...meta, isTouched: true })));
    expect(JSON.stringify(renderer.toJSON())).toContain('Enter a quantity');
  });

  it('uses TanStack submission state for the shared save button', async () => {
    let resolve!: () => void;
    onSubmit = () => new Promise<void>((done) => { resolve = done; });
    await act(async () => { renderer = create(<Harness />); });
    let submission: Promise<void>;
    await act(async () => { submission = renderer.root.findByType(Button).props.onPress(); });
    expect(renderer.root.findByType(Button).props.isLoading).toBe(true);
    await act(async () => { resolve(); await submission; });
    expect(renderer.root.findByType(Button).props.isLoading).toBe(false);
  });
});
