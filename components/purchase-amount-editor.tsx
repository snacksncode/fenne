import { APIError } from '@/api/client';
import { PurchaseSuggestionDTO } from '@/api/types';
import { Unit } from '@/components/bottomSheets/select-unit-sheet';
import { Button } from '@/components/button';
import { formErrorMessage, useAppForm } from '@/components/form/app-form';
import { formatGroceryQuantity } from '@/components/grocery-quantity';
import { NumberInput, TextInputRef } from '@/components/input';
import { Typography } from '@/components/Typography';
import { colors } from '@/constants/colors';
import { parseLocaleFloat } from '@/utils';
import { useRef, useState } from 'react';
import { View } from 'react-native';
import { z } from 'zod';

const message = (value: unknown) => typeof value === 'string' ? value :
  Array.isArray(value) ? value.find((entry): entry is string => typeof entry === 'string') : undefined;

export const PurchaseAmountEditor = ({ name, unit, quantity, packSizes = [], purchase, overridden,
  onSave, onCancel, onInvalid, disabled = false }: {
  name: string; unit: Unit; quantity: number; packSizes?: number[];
  purchase?: PurchaseSuggestionDTO | null; overridden?: boolean;
  onSave: (quantity: number) => Promise<unknown> | void;
  onCancel?: () => void; onInvalid?: () => void; disabled?: boolean;
}) => {
  const inputRef = useRef<TextInputRef>(null);
  const [error, setError] = useState<string | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>(() =>
    !overridden && quantity === purchase?.suggested_quantity
      ? Object.fromEntries(purchase.packs.map((pack) => [pack.size, pack.count])) : {});
  const focusAmount = () => requestAnimationFrame(() => {
    inputRef.current?.focus();
    onInvalid?.();
  });
  const form = useAppForm({
    defaultValues: { quantity: String(quantity) },
    validators: { onSubmit: z.object({ quantity: z.string().refine((value) => {
      const amount = parseLocaleFloat(value);
      return Number.isFinite(amount) && (purchase ? amount >= 0 : amount > 0) && amount <= 1_000_000_000;
    }, purchase ? 'Enter an amount between 0 and 1,000,000,000.' : 'Enter an amount greater than 0, up to 1,000,000,000.') }) },
    onSubmitInvalid: focusAmount,
    onSubmit: async ({ value }) => {
      setError(null);
      form.setFieldMeta('quantity', (meta) => ({ ...meta, errorMap: { ...meta.errorMap, onServer: undefined } }));
      try {
        await onSave(parseLocaleFloat(value.quantity));
      } catch (caught) {
        const data = caught instanceof APIError && caught.data && typeof caught.data === 'object'
          ? caught.data as Record<string, unknown> : {};
        const quantityError = message(data.quantity);
        if (quantityError) {
          form.setFieldMeta('quantity', (meta) => ({ ...meta, isTouched: true, errorMap: { ...meta.errorMap, onServer: quantityError } }));
          focusAmount();
        } else {
          setError(message(data.base) ?? message(data.status) ?? message(data.unit) ?? 'Could not save the amount. Try again.');
        }
      }
    },
  });
  const changePack = (size: number, delta: number) => {
    const next: Record<string, number> = { ...counts, [size]: Math.max(0, (counts[size] ?? 0) + delta) };
    setCounts(next);
    const total = Object.entries(next).reduce((sum, [size, count]) => sum + Number(size) * count, 0);
    form.setFieldValue('quantity', String(Number(total.toFixed(3))));
  };

  return <form.AppForm><form.Subscribe selector={(state) => state.isSubmitting}>{(saving) => (
    <View style={{ gap: 12 }}>
      <Typography variant="body-sm" weight="bold">Amount to buy</Typography>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <form.AppField name="quantity">{(field) => (
          <View style={{ flex: 1 }}>
            <NumberInput ref={inputRef} value={field.state.value} editable={!disabled && !saving}
              accessibilityLabel={`Amount of ${name} to buy in ${unit}`}
              onBlur={field.handleBlur}
              onChangeText={(value) => { field.handleChange(value); setCounts({}); }} />
            {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
              <View accessibilityRole="alert" accessible>
                <Typography variant="body-xs" weight="medium" color={colors.red[600]}>
                  {formErrorMessage(field.state.meta.errors[0])}
                </Typography>
              </View>
            )}
          </View>
        )}</form.AppField>
        <Typography variant="body-base" weight="bold">{unit === 'count' ? 'pcs' : unit}</Typography>
      </View>
      {packSizes.length > 0 && <Typography variant="body-sm" weight="bold">Packs</Typography>}
      {packSizes.map((size) => <View key={size} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <Typography variant="body-sm" weight="medium">{formatGroceryQuantity(size, unit)}</Typography>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Button text="−" accessibilityLabel={`Remove one ${formatGroceryQuantity(size, unit)} pack`} size="small" variant="outlined" disabled={disabled || saving || !counts[size]} onPress={() => changePack(size, -1)} />
          <Typography variant="body-base" weight="bold">{counts[size] ?? 0}</Typography>
          <Button text="+" accessibilityLabel={`Add one ${formatGroceryQuantity(size, unit)} pack`} size="small" variant="outlined" disabled={disabled || saving} onPress={() => changePack(size, 1)} />
        </View>
      </View>)}
      {error && <View accessibilityRole="alert" accessible><Typography variant="body-sm" weight="medium" color={colors.red[600]}>{error}</Typography></View>}
      {!disabled && <View style={{ flexDirection: 'row', gap: 8 }}>
        {onCancel && <Button text="Cancel" size="small" variant="outlined" disabled={saving} onPress={onCancel} />}
        <Button text="Save amount" size="small" variant="primary" isLoading={saving} disabled={saving} onPress={() => form.handleSubmit()} />
      </View>}
    </View>
  )}</form.Subscribe></form.AppForm>;
};
