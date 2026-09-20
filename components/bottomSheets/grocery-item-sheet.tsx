import { useAddGroceryItem, useEditGroceryItem } from '@/api/groceries';
import { GroceryItemFormData, groceryItemToFormData, GroceryItemInput } from '@/api/types';
import { AisleHeader, AisleIcon } from '@/components/aisle-header';
import { BaseSheet, sheetFooter } from '@/components/bottomSheets/base-sheet';
import { Unit, UNITS } from '@/components/bottomSheets/select-unit-sheet';
import { QuantityShortcuts } from '@/components/quantity-shortcuts';
import { Button } from '@/components/button';
import { useAppForm } from '@/components/form/app-form';
import { PressableWithHaptics } from '@/components/pressable-with-feedback';
import { ProductChoice, ProductSearchStep } from '@/components/product-search-step';
import { ShoppingItemIdentity } from '@/components/shopping-item-identity';
import { Typography } from '@/components/Typography';
import { colors } from '@/constants/colors';
import { nanoid } from 'nanoid/non-secure';
import { SheetProps, useSheets } from '@/lib/sheet-context';
import { ArrowLeft, ArrowRight } from 'lucide-react-native';
import { useState } from 'react';
import { Keyboard, StyleSheet, View } from 'react-native';
import { parseLocaleFloat } from '@/utils';
import { z } from 'zod';

type Phase = 'select' | 'details';

const emptyGroceryItem: GroceryItemFormData = {
  id: nanoid(),
  name: '',
  quantity: '1',
  unit: 'count',
  aisle: 'other',
  status: 'pending',
  product: null,
  source: 'manual',
  recipes: [],
};

const groceryItemSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1, 'Name is required'),
  quantity: z.string().refine((value) => {
    const quantity = parseLocaleFloat(value);
    return Number.isFinite(quantity) && quantity > 0;
  }, 'Quantity must be positive'),
  unit: z.custom<Unit>(),
  aisle: z.custom<GroceryItemFormData['aisle']>(),
  product: z.custom<GroceryItemFormData['product']>(),
  source: z.custom<GroceryItemFormData['source']>(),
  status: z.custom<GroceryItemFormData['status']>(),
  recipes: z.custom<GroceryItemFormData['recipes']>(),
});

export const GroceryItemSheet = (props: SheetProps<'grocery-item-sheet'>) => {
  const sheets = useSheets();
  const initialGrocery = props.data?.grocery;
  const isEditing = !!initialGrocery;
  const [query, setQuery] = useState(() => (initialGrocery ? groceryItemToFormData(initialGrocery).name : ''));
  const [phase, setPhase] = useState<Phase>(isEditing ? 'details' : 'select');

  const addGroceryItem = useAddGroceryItem();
  const editGroceryItem = useEditGroceryItem();
  const form = useAppForm({
    defaultValues: initialGrocery ? groceryItemToFormData(initialGrocery) : emptyGroceryItem,
    validators: {
      onSubmit: groceryItemSchema,
    },
    onSubmit: ({ value }) => {
      if (isEditing) {
        editGroceryItem.mutate({
          id: value.id,
          quantity: parseLocaleFloat(value.quantity),
          ...(value.product == null && { unit: value.unit }),
        });
      } else {
        const quantity = parseLocaleFloat(value.quantity);
        const input: GroceryItemInput = value.product
          ? {
              type: 'product',
              product_id: value.product.id,
              unit: value.unit,
              quantity,
            }
          : {
              type: 'custom',
              name: value.name.trim(),
              aisle: value.aisle,
              unit: value.unit,
              quantity,
            };
        addGroceryItem.mutate(input);
      }
      sheets.dismiss(props.sheetId);
      Keyboard.dismiss();
    },
  });

  const handleSave = () => {
    form.handleSubmit();
  };

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
    <BaseSheet
      containerStyle={{ minHeight: 210 }}
      id={props.sheetId}
      scrollableOptions={{ scrollingExpandsSheet: false }}
      footer={
        phase === 'details'
          ? sheetFooter.buttonRow(
              <Button
                text={initialGrocery ? 'Save changes' : 'Save grocery entry'}
                variant="primary"
                rightIcon={{ Icon: ArrowRight }}
                onPress={handleSave}
                isLoading={addGroceryItem.isPending || editGroceryItem.isPending}
              />
            )
          : phase === 'select'
            ? sheetFooter.buttonRow(
                <Button
                  text="Continue"
                  variant="primary"
                  rightIcon={{ Icon: ArrowRight }}
                  onPress={continueWithCustomItem}
                />
              )
            : undefined
      }
    >
      <form.AppForm>
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
                      {(field) => <field.NumberField label="Quantity" placeholder="e.g. 2" />}
                    </form.AppField>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Typography variant="body-sm" weight="bold" style={{ marginBottom: 4 }}>
                      Unit
                    </Typography>
                    <PressableWithHaptics onPress={handleOpenUnitSheet}>
                      <View style={styles.unitButton}>
                        <Typography variant="body-sm" weight="bold">
                          {UNITS.find((u) => u.value === grocery.unit)?.label({
                            count: parseLocaleFloat(grocery.quantity),
                          })}
                        </Typography>
                      </View>
                    </PressableWithHaptics>
                  </View>
                </View>
                <QuantityShortcuts
                  unit={grocery.unit}
                  currentValue={grocery.quantity}
                  onSelect={(quantity) => form.setFieldValue('quantity', quantity)}
                />
                <View>
                  <Typography variant="body-sm" weight="bold" style={{ marginBottom: 4 }}>
                    Category
                  </Typography>
                  <PressableWithHaptics onPress={handleOpenCategorySheet}>
                    <AisleHeader type={grocery.aisle} showEditIndicator />
                  </PressableWithHaptics>
                </View>
              </View>
            )}
          </form.Subscribe>
        )}
      </form.AppForm>
    </BaseSheet>
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
    backgroundColor: '#FEF2DD',
    borderColor: '#493D34',
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
  unitButton: {
    borderRadius: 8,
    fontSize: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderBottomWidth: 2,
    borderColor: '#493D34',
    height: 48,
    justifyContent: 'center',
  },
});
