import { IngredientFormData } from '@/api/schedules';
import { AisleHeader } from '@/components/aisle-header';
import { AutocompleteInput, IngredientOption } from '@/components/autocomplete-input';
import { BaseSheet } from '@/components/bottomSheets/base-sheet';
import { UNITS } from '@/components/bottomSheets/select-unit-sheet';
import { Button } from '@/components/button';
import { NumberInput } from '@/components/input';
import { PressableWithHaptics } from '@/components/pressable-with-feedback';
import { Typography } from '@/components/Typography';
import { SheetManager, SheetProps } from 'react-native-actions-sheet';
import { ArrowRight } from 'lucide-react-native';
import { nanoid } from 'nanoid/non-secure';
import { useState } from 'react';
import { Keyboard, StyleSheet, View } from 'react-native';
import { useCreateCustomIngredient } from '@/api/food-items';
import { parseLocaleFloat } from '@/utils';
import { QuantityShortcuts } from '@/components/quantity-shortcuts';

export const EditIngredientSheet = (props: SheetProps<'edit-ingredient-sheet'>) => {
  const initialIngredient = props.payload?.ingredient;
  const createCustomIngredient = useCreateCustomIngredient();
  const [ingredient, setIngredient] = useState<IngredientFormData>(() => {
    return initialIngredient ?? { _id: nanoid(), name: '', quantity: '1', aisle: 'other', unit: 'count' };
  });

  const handleSave = () => {
    if (!ingredient.name.trim()) return;
    createCustomIngredient.mutate(ingredient);
    SheetManager.hide(props.sheetId, { payload: ingredient });
    Keyboard.dismiss();
  };

  const handleOpenUnitSheet = async () => {
    Keyboard.dismiss();
    const unit = await SheetManager.show('select-unit-sheet', {
      payload: { unit: ingredient.unit },
    });
    if (unit) {
      setIngredient((prev) => ({ ...prev, unit }));
    }
  };

  const handleOpenCategorySheet = async () => {
    Keyboard.dismiss();
    const aisle = await SheetManager.show('select-category-sheet');
    if (aisle) {
      setIngredient((prev) => ({ ...prev, aisle }));
    }
  };

  const handleIngredientSelect = (option: IngredientOption) => {
    setIngredient((prev) => ({ ...prev, name: option.name, aisle: option.aisle }));
  };

  return (
    <BaseSheet id={props.sheetId}>
      <Typography variant="heading-sm" weight="bold" style={{ marginBottom: 24 }}>
        {initialIngredient ? 'Edit Ingredient' : 'Add Ingredient'}
      </Typography>
      <View style={{ gap: 16 }}>
        <View>
          <Typography variant="body-sm" weight="bold" style={{ marginBottom: 4 }}>
            Name
          </Typography>
          <AutocompleteInput
            value={ingredient.name}
            onChangeText={(name) => setIngredient((prev) => ({ ...prev, name }))}
            onSelect={handleIngredientSelect}
            placeholder="e.g. Avocado"
          />
        </View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Typography variant="body-sm" weight="bold" style={{ marginBottom: 4 }}>
              Quantity
            </Typography>
            <NumberInput
              value={ingredient.quantity.toString()}
              onChangeText={(quantity) => setIngredient((prev) => ({ ...prev, quantity }))}
              placeholder="e.g. 2"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Typography variant="body-sm" weight="bold" style={{ marginBottom: 4 }}>
              Unit
            </Typography>
            <PressableWithHaptics onPress={handleOpenUnitSheet}>
              <View style={styles.unitButton}>
                <Typography variant="body-sm" weight="medium">
                  {UNITS.find((u) => u.value === ingredient.unit)?.label({
                    count: parseLocaleFloat(ingredient.quantity),
                  })}
                </Typography>
              </View>
            </PressableWithHaptics>
          </View>
        </View>
        <QuantityShortcuts
          unit={ingredient.unit}
          currentValue={parseLocaleFloat(ingredient.quantity)}
          onSelect={(value) => setIngredient((prev) => ({ ...prev, quantity: value.toString() }))}
        />
        <View>
          <Typography variant="body-sm" weight="bold" style={{ marginBottom: 4 }}>
            Category
          </Typography>
          <PressableWithHaptics onPress={handleOpenCategorySheet}>
            <AisleHeader type={ingredient.aisle} />
          </PressableWithHaptics>
        </View>
      </View>
      <View style={{ marginTop: 24 }}>
        <Button text="Save ingredient" variant="primary" rightIcon={{ Icon: ArrowRight }} onPress={handleSave} />
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
