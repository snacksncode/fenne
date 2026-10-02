import { ProductDTO } from '@/api/types';
import { BaseSheet } from '@/components/bottomSheets/base-sheet';
import { Button } from '@/components/button';
import { ProductChoice, ProductSearchStep } from '@/components/product-search-step';
import { ShoppingItemIdentity } from '@/components/shopping-item-identity';
import { Typography } from '@/components/Typography';
import { colors } from '@/constants/colors';
import { formatDateToISO } from '@/date-tools';
import { usePantryEntryForm } from '@/hooks/use-pantry-entry-form';
import { SheetProps, useSheets } from '@/lib/sheet-context';
import { parseLocaleFloat } from '@/lib/quantity';
import { prettyUnit } from '@/lib/quantity';
import { ArrowLeft, ArrowRight } from 'lucide-react-native';
import { useState } from 'react';
import { Keyboard, StyleSheet, View } from 'react-native';

export const PantryAddSheet = (props: SheetProps<'pantry-add-sheet'>) => {
  const sheets = useSheets();
  const [query, setQuery] = useState('');
  const [product, setProduct] = useState<ProductDTO | null>(null);
  const { form, feedback, isTimed } = usePantryEntryForm({
    product,
    onSaved: async () => { Keyboard.dismiss(); await sheets.dismiss(props.sheetId); },
  });

  const selectProduct = (choice: ProductChoice) => {
    if (choice.kind !== 'product') return;
    form.reset({ quantity: '1', lastAcquired: formatDateToISO(new Date()) }, { keepDefaultValues: true });
    feedback.setError(null);
    setProduct(choice.product);
    Keyboard.dismiss();
  };

  return (
    <BaseSheet id={props.sheetId} footer={product ? (
      <form.AppForm><form.SubmitButton text="Add stock" variant="primary" rightIcon={{ Icon: ArrowRight }} /></form.AppForm>
    ) : undefined}>
      <View style={styles.header}>
        {product && <Button accessibilityLabel="Go back" size="small" variant="outlined"
          leftIcon={{ Icon: ArrowLeft }} onPress={() => setProduct(null)} style={{ paddingHorizontal: 0, width: 42 }} />}
        <Typography variant="heading-sm" weight="bold">Add Stock</Typography>
      </View>
      {product ? (
        <form.AppForm>
          <View ref={feedback.contentRef} style={{ gap: 16 }}>
            <View style={styles.selectedItem}>
              <ShoppingItemIdentity name={product.name} aisle={product.aisle} compact style={{ flex: 1 }} />
            </View>
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
                  unit={product.shape === 'counted' ? 'count' : prettyUnit({ quantity: parseLocaleFloat(field.state.value), unit: product.unit })} />
              )}</form.AppField>
            )}
            <form.Error message={feedback.error} />
          </View>
        </form.AppForm>
      ) : (
        <ProductSearchStep context="pantry" query={query} onQueryChange={setQuery} onSelect={selectProduct}
          placeholder="Search shopping items" autoFocus productLabel={() => null}
          listStyle={{ maxHeight: 240 }} listContentStyle={{ gap: 8, paddingBottom: 4 }} />
      )}
    </BaseSheet>
  );
};

const styles = StyleSheet.create({
  header: { alignItems: 'center', flexDirection: 'row', gap: 8, marginBottom: 16 },
  selectedItem: {
    alignItems: 'center', backgroundColor: colors.cream[100], borderColor: colors.brown[900],
    borderRadius: 8, borderWidth: 1, borderBottomWidth: 2, flexDirection: 'row', gap: 12, padding: 12,
  },
});
