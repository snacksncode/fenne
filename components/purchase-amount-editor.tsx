import { PurchaseSuggestionDTO } from '@/api/types';
import { Unit } from '@/lib/quantity';
import { Button } from '@/components/button';
import { PurchasePackSelector } from '@/components/purchase-pack-selector';
import { Typography } from '@/components/Typography';
import { usePurchaseQuantity } from '@/hooks/use-purchase-quantity';
import { useStore } from '@tanstack/react-form';
import { View } from 'react-native';

/** The inline view shares editing behavior with the sheet, not its layout. */
export const PurchaseAmountEditor = ({ name, unit, quantity, packSizes = [], purchase, overridden,
  onSave, onCancel, onInvalid, disabled = false }: {
  name: string;
  unit: Unit;
  quantity: number;
  packSizes?: number[];
  purchase?: PurchaseSuggestionDTO | null;
  overridden?: boolean;
  onSave: (quantity: number) => Promise<unknown> | void;
  onCancel?: () => void;
  onInvalid?: () => void;
  disabled?: boolean;
}) => {
  const { form, feedback, counts, changePack, resetPacks } = usePurchaseQuantity({ quantity, purchase, overridden, onSave, onInvalid });
  const saving = useStore(form.store, (state) => state.isSubmitting);

  return (
    <form.AppForm>
      <View style={{ gap: 12 }}>
        <form.AppField name="quantity">{(field) => (
          <field.InlineQuantityField ref={feedback.inputRef('quantity')} label="Amount to buy" unit={unit}
            editable={!disabled && !saving} onValueChange={resetPacks}
            accessibilityLabel={`Amount of ${name} to buy in ${unit === 'count' ? 'items' : unit}`} />
        )}</form.AppField>
        {packSizes.length > 0 && <Typography variant="body-sm" weight="bold">Packs</Typography>}
        <PurchasePackSelector sizes={packSizes} unit={unit} counts={counts} onChange={changePack} disabled={disabled || saving} />
        <form.Error message={feedback.error} />
        {!disabled && <View style={{ flexDirection: 'row', gap: 8 }}>
          {onCancel && <Button text="Cancel" size="small" variant="outlined" disabled={saving} onPress={onCancel} />}
          <form.SubmitButton text="Save amount" size="small" variant="primary" disabled={saving} />
        </View>}
      </View>
    </form.AppForm>
  );
};
