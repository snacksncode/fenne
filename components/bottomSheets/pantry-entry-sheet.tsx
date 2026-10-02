import { useDeletePantryEntry } from '@/api/pantry';
import { BaseSheet } from '@/components/bottomSheets/base-sheet';
import { Button } from '@/components/button';
import { ShoppingItemIdentity } from '@/components/shopping-item-identity';
import { usePantryEntryForm } from '@/hooks/use-pantry-entry-form';
import { SheetProps, useSheets } from '@/lib/sheet-context';
import { parseLocaleFloat } from '@/lib/quantity';
import { prettyUnit } from '@/lib/quantity';
import { Pen, Trash2 } from 'lucide-react-native';
import { Keyboard, View } from 'react-native';

export const PantryEntrySheet = ({ sheetId, data: { entry } }: SheetProps<'pantry-entry-sheet'>) => {
  const sheets = useSheets();
  const deleteEntry = useDeletePantryEntry();
  const dismiss = async () => { Keyboard.dismiss(); await sheets.dismiss(sheetId); };
  const { form, feedback, isTimed } = usePantryEntryForm({ product: entry.product, entry, onSaved: dismiss });

  const remove = async () => {
    feedback.setError(null);
    try { await deleteEntry.mutateAsync({ id: entry.id }); await dismiss(); }
    catch { feedback.setError('Could not remove pantry stock'); }
  };

  return (
    <BaseSheet id={sheetId} footer={(
      <form.AppForm>
        <form.Subscribe selector={(state) => state.isSubmitting}>{(saving) => (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button text="Remove" variant="red-outlined" onPress={remove} leftIcon={{ Icon: Trash2 }}
              isLoading={deleteEntry.isPending} disabled={saving} style={{ flex: 1 }} />
            <form.SubmitButton text="Save" variant="primary" disabled={deleteEntry.isPending} style={{ flex: 1 }} />
          </View>
        )}</form.Subscribe>
      </form.AppForm>
    )}>
      <View style={{ alignItems: 'center', flexDirection: 'row', gap: 12, marginBottom: 20 }}>
        <ShoppingItemIdentity name={entry.product.name} aisle={entry.product.aisle} style={{ flex: 1 }} />
        <Button accessibilityLabel="Edit shopping item" variant="outlined" size="small" leftIcon={{ Icon: Pen }}
          onPress={async () => { await dismiss(); sheets.present('product-edit-sheet', { data: { product: entry.product } }); }}
          style={{ paddingHorizontal: 0, width: 42 }} />
      </View>
      <form.AppForm>
        <View ref={feedback.contentRef} style={{ gap: 12 }}>
          {isTimed ? (
            <form.AppField name="lastAcquired">{(field) => (
              <field.DateField label="Last acquired" ref={feedback.controlRef('lastAcquired')} onPress={async () => {
                const date = await sheets.present('select-date-sheet', { data: { mode: 'select', initialDate: field.state.value } });
                if (date) field.handleChange(date);
              }} />
            )}</form.AppField>
          ) : (
            <form.AppField name="quantity">{(field) => (
              <field.InlineQuantityField label="Quantity remaining" accessibilityLabel="Quantity remaining"
                ref={feedback.inputRef('quantity')}
                unit={entry.product.shape === 'counted' ? 'count' : prettyUnit({ quantity: parseLocaleFloat(field.state.value), unit: entry.product.unit })} />
            )}</form.AppField>
          )}
          <form.Error message={feedback.error} />
        </View>
      </form.AppForm>
    </BaseSheet>
  );
};
