import {
  GroceryItemFormData,
  groceryItemFromFormData,
  groceryItemToFormData,
  useAddGroceryItem,
  useEditGroceryItem,
} from '@/api/groceries';
import { AisleHeader } from '@/components/aisle-header';
import { BaseSheet } from '@/components/bottomSheets/base-sheet';
import { UNITS } from '@/components/bottomSheets/select-unit-sheet';
import { QuantityShortcuts } from '@/components/quantity-shortcuts';
import { Button } from '@/components/button';
import { NumberInput } from '@/components/input';
import { PressableWithHaptics } from '@/components/pressable-with-feedback';
import { Typography } from '@/components/Typography';
import { nanoid } from 'nanoid/non-secure';
import { SheetManager, SheetProps } from 'react-native-actions-sheet';
import { ArrowRight } from 'lucide-react-native';
import { useState } from 'react';
import { Keyboard, StyleSheet, View } from 'react-native';
import { AutocompleteInput, IngredientOption } from '@/components/autocomplete-input';
import { useCreateCustomIngredient } from '@/api/food-items';
import { parseLocaleFloat } from '@/utils';

const emptyGroceryItem: GroceryItemFormData = {
  id: nanoid(),
  name: '',
  quantity: '1',
  unit: 'count',
  aisle: 'other',
  status: 'pending',
};

export const GroceryItemSheet = (props: SheetProps<'grocery-item-sheet'>) => {
  const createCustomIngredient = useCreateCustomIngredient();
  const initialGrocery = props.payload?.grocery;
  const [grocery, setGrocery] = useState<GroceryItemFormData>(() => {
    if (initialGrocery) return groceryItemToFormData(initialGrocery);
    return emptyGroceryItem;
  });

  const addGroceryItem = useAddGroceryItem();
  const editGroceryItem = useEditGroceryItem();
  const isEditing = !!initialGrocery;

  const handleSave = () => {
    if (!grocery.name.trim()) return;
    createCustomIngredient.mutate(grocery);
    if (isEditing) {
      editGroceryItem.mutate(groceryItemFromFormData(grocery));
    } else {
      addGroceryItem.mutate(groceryItemFromFormData(grocery));
    }
    SheetManager.hide(props.sheetId);
    Keyboard.dismiss();
  };

  const handleOpenUnitSheet = async () => {
    Keyboard.dismiss();
    const unit = await SheetManager.show('select-unit-sheet', { payload: { ...grocery, unit: grocery.unit } });
    if (unit) setGrocery((prev) => ({ ...prev, unit }));
  };

  const handleOpenCategorySheet = async () => {
    Keyboard.dismiss();
    const aisle = await SheetManager.show('select-category-sheet');
    if (aisle) setGrocery((prev) => ({ ...prev, aisle }));
  };

  const handleGrocerySelect = (option: IngredientOption) => {
    setGrocery((prev) => ({ ...prev, aisle: option.aisle }));
  };

  return (
    <BaseSheet id={props.sheetId}>
      <Typography variant="heading-sm" weight="bold" style={{ marginBottom: 24 }}>
        {initialGrocery ? 'Edit Item' : 'Add Item'}
      </Typography>
      <View style={{ gap: 16 }}>
        <View>
          <Typography variant="body-sm" weight="bold" style={{ marginBottom: 4 }}>
            Name
          </Typography>
          <AutocompleteInput
            value={grocery.name}
            onChangeText={(name) => setGrocery((prev) => ({ ...prev, name }))}
            onSelect={handleGrocerySelect}
            placeholder="e.g. Avocado"
          />
        </View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Typography variant="body-sm" weight="bold" style={{ marginBottom: 4 }}>
              Quantity
            </Typography>
            <NumberInput
              value={grocery.quantity}
              onChangeText={(quantity) => setGrocery((prev) => ({ ...prev, quantity }))}
              placeholder="e.g. 2"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Typography variant="body-sm" weight="bold" style={{ marginBottom: 4 }}>
              Unit
            </Typography>
            <PressableWithHaptics onPress={handleOpenUnitSheet}>
              <View style={styles.unitButton}>
                <Typography variant="body-sm" weight="bold">
                  {UNITS.find((u) => u.value === grocery.unit)?.label({ count: parseLocaleFloat(grocery.quantity) })}
                </Typography>
              </View>
            </PressableWithHaptics>
          </View>
        </View>
        <QuantityShortcuts
          unit={grocery.unit}
          currentValue={grocery.quantity}
          onSelect={(quantity) => setGrocery((prev) => ({ ...prev, quantity }))}
        />
        <View>
          <Typography variant="body-sm" weight="bold" style={{ marginBottom: 4 }}>
            Category
          </Typography>
          <PressableWithHaptics onPress={handleOpenCategorySheet}>
            <AisleHeader type={grocery.aisle} />
          </PressableWithHaptics>
        </View>
      </View>
      <View style={{ marginTop: 32 }}>
        <Button
          text={initialGrocery ? 'Save changes' : 'Save item'}
          variant="primary"
          rightIcon={{ Icon: ArrowRight }}
          onPress={handleSave}
          isLoading={addGroceryItem.isPending || editGroceryItem.isPending}
        />
      </View>
    </BaseSheet>
  );
};

const styles = StyleSheet.create({
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
