import { AisleIcon } from '@/components/aisle-header';
import { BaseSheet } from '@/components/bottomSheets/base-sheet';
import { QuantityShortcuts } from '@/components/quantity-shortcuts';
import { Button } from '@/components/button';
import { useGroceryItemForm } from '@/hooks/use-grocery-item-form';
import { ProductChoice, ProductSearchStep } from '@/components/product-search-step';
import { ShoppingItemIdentity } from '@/components/shopping-item-identity';
import { Typography } from '@/components/Typography';
import { colors } from '@/constants/colors';
import { SheetProps, useSheets } from '@/lib/sheet-context';
import { ArrowLeft, ArrowRight } from 'lucide-react-native';
import { useState } from 'react';
import { Keyboard, StyleSheet, View } from 'react-native';
import { parseLocaleFloat } from '@/lib/quantity';

type Phase = 'select' | 'details';

export const GroceryItemSheet = (props: SheetProps<'grocery-item-sheet'>) => {
  const sheets = useSheets();
  const initialGrocery = props.data?.grocery;
  const isEditing = !!initialGrocery;
  const [query, setQuery] = useState(initialGrocery?.name ?? '');
  const [phase, setPhase] = useState<Phase>(isEditing ? 'details' : 'select');

  const { form, feedback } = useGroceryItemForm(initialGrocery, async () => {
    Keyboard.dismiss();
    await sheets.dismiss(props.sheetId);
  });

  const handleOpenUnitSheet = async () => {
    Keyboard.dismiss();
    const unit = await sheets.present('select-unit-sheet', {
      data: {
        unit: form.state.values.unit,
      },
    });
    if (unit != null) form.setFieldValue('unit', unit);
  };

  const handleOpenCategorySheet = async () => {
    if (form.state.values.product) return;
    Keyboard.dismiss();
    const aisle = await sheets.present('select-category-sheet');
    if (aisle != null) form.setFieldValue('aisle', aisle);
  };

  const selectSearchOption = (choice: ProductChoice) => {
    if (choice.kind === 'product') {
      form.setFieldValue('product', choice.product);
      form.setFieldValue('name', choice.product.name);
      form.setFieldValue('aisle', choice.product.aisle);
      form.setFieldValue('unit', choice.product.unit);
      setQuery(choice.product.name);
    } else if (choice.kind === 'suggestion') {
      form.setFieldValue('product', null);
      form.setFieldValue('name', choice.suggestion.name);
      form.setFieldValue('aisle', choice.suggestion.aisle);
      setQuery(choice.suggestion.name);
    } else {
      form.setFieldValue('product', null);
      form.setFieldValue('name', choice.name);
      setQuery(choice.name);
    }
    setPhase('details');
    Keyboard.dismiss();
  };

  const continueWithCustomItem = () => {
    const name = form.state.values.name.trim();
    if (!name) return;
    form.setFieldValue('product', null);
    form.setFieldValue('name', name);
    setPhase('details');
    Keyboard.dismiss();
  };

  const handleBackToSelect = () => {
    if (isEditing) return;
    setPhase('select');
  };

  const title = isEditing ? 'Edit grocery entry' : 'Add grocery entry';

  return (
    <form.AppForm>
      <BaseSheet
        containerStyle={{ minHeight: 210 }}
        id={props.sheetId}
        scrollableOptions={{ scrollingExpandsSheet: false }}
        footer={phase === 'details' ? (
          <form.SubmitButton
            text={initialGrocery ? 'Save changes' : 'Save grocery entry'}
            variant="primary"
            rightIcon={{ Icon: ArrowRight }}
          />
        ) : (
          <Button text="Continue" variant="primary" rightIcon={{ Icon: ArrowRight }} onPress={continueWithCustomItem} />
        )}
      >
        <View ref={feedback.contentRef}>
          <View style={{ gap: 8 }}>
            <View style={styles.header}>
              {phase === 'details' && !isEditing && (
                <Button
                  accessibilityLabel="Go back"
                  size="small"
                  variant="outlined"
                  leftIcon={{ Icon: ArrowLeft }}
                  onPress={handleBackToSelect}
                  style={{ paddingHorizontal: 0, width: 42 }}
                />
              )}
              <Typography variant="heading-sm" weight="bold">
                {title}
              </Typography>
            </View>
          </View>

          {phase === 'select' && (
            <ProductSearchStep
              context="shopping"
              query={query}
              onQueryChange={(name) => {
                form.setFieldValue('name', name);
                form.setFieldValue('product', null);
                setQuery(name);
              }}
              onSelect={selectSearchOption}
              placeholder="e.g. Avocado"
              listStyle={{ maxHeight: 150 }}
            />
          )}

          {phase === 'details' && (
            <form.Subscribe selector={(state) => state.values}>
              {(grocery) => (
                <View style={{ gap: 16, marginTop: 8 }}>
                  <View style={styles.selectedItem}>
                    {grocery.product ? (
                      <ShoppingItemIdentity
                        name={grocery.name}
                        aisle={grocery.aisle}
                        description="Uses your saved shopping and pantry settings"
                        compact
                        style={styles.selectedItemIdentity}
                      />
                    ) : (
                      <>
                        <AisleIcon type={grocery.aisle} />
                        <View style={styles.selectedItemCopy}>
                          <Typography variant="body-xs" weight="bold" color={colors.brown[700]}>
                            Custom grocery entry
                          </Typography>
                          <Typography variant="body-base" weight="bold">
                            {grocery.name}
                          </Typography>
                          <Typography variant="body-sm" weight="medium" color={colors.brown[700]}>
                            Only appears on this grocery list
                          </Typography>
                        </View>
                      </>
                    )}
                  </View>
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ flex: 1 }}>
                      <form.AppField name="quantity">
                        {(field) => <field.NumberField ref={feedback.inputRef('quantity')} label="Quantity" placeholder="e.g. 2" />}
                      </form.AppField>
                    </View>
                    <View style={{ flex: 1 }}>
                      <form.AppField name="unit">{(field) => (
                        <field.UnitField ref={feedback.controlRef('unit')} quantity={parseLocaleFloat(grocery.quantity)}
                          onPress={handleOpenUnitSheet} />
                      )}</form.AppField>
                    </View>
                  </View>
                  <QuantityShortcuts
                    unit={grocery.unit}
                    currentValue={grocery.quantity}
                    onSelect={(quantity) => form.setFieldValue('quantity', quantity)}
                  />
                  <form.AppField name="aisle">{(field) => (
                    <field.AisleField ref={feedback.controlRef('aisle')} onPress={handleOpenCategorySheet} />
                  )}</form.AppField>
                </View>
              )}
            </form.Subscribe>
          )}
          <form.Error message={feedback.error} />
        </View>
      </BaseSheet>
    </form.AppForm>
  );
};

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  selectedItem: {
    alignItems: 'center',
    backgroundColor: colors.cream[100],
    borderColor: colors.brown[900],
    borderRadius: 8,
    borderWidth: 1,
    borderBottomWidth: 2,
    flexDirection: 'row',
    gap: 12,
    padding: 12,
  },
  selectedItemCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  selectedItemIdentity: {
    flex: 1,
  },
});
