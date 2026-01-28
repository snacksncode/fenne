import { IngredientFormData } from '@/api/schedules';
import { AisleHeader } from '@/components/aisle-header';
import { AutocompleteInput, IngredientOption } from '@/components/autocomplete-input';
import { BaseSheet } from '@/components/bottomSheets/base-sheet';
import { UNITS, Unit } from '@/components/bottomSheets/select-unit-sheet';
import { Button } from '@/components/button';
import { TextInput } from '@/components/input';
import { PressableWithHaptics } from '@/components/pressable-with-feedback';
import { Text } from '@/components/Text';
import { SheetManager, SheetProps } from 'react-native-actions-sheet';
import { ArrowRight } from 'lucide-react-native';
import { nanoid } from 'nanoid/non-secure';
import { useState } from 'react';
import { Keyboard, StyleSheet, View } from 'react-native';

export const EditIngredientSheet = (props: SheetProps<'edit-ingredient-sheet'>) => {
  const initialIngredient = props.payload?.ingredient;
  const [ingredient, setIngredient] = useState<IngredientFormData>(() => {
    return initialIngredient ?? { _id: nanoid(), name: '', quantity: '', aisle: 'other', unit: 'g' };
  });

  const handleSave = () => {
    if (!ingredient.name.trim()) return;
    SheetManager.hide(props.sheetId, { payload: ingredient });
    Keyboard.dismiss();
  };

  const handleOpenUnitSheet = async () => {
    const unit = await SheetManager.show('select-unit-sheet', {
      payload: { unit: ingredient.unit as Unit },
    });
    if (unit) {
      setIngredient((prev) => ({ ...prev, unit }));
    }
  };

  const handleOpenCategorySheet = async () => {
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
      <Text style={styles.header}>{initialIngredient ? 'Edit Ingredient' : 'Add Ingredient'}</Text>
      <View style={{ gap: 16 }}>
        <View>
          <Text style={styles.label}>Name</Text>
          <AutocompleteInput
            value={ingredient.name}
            onChangeText={(name) => setIngredient((prev) => ({ ...prev, name }))}
            onSelect={handleIngredientSelect}
            placeholder="e.g. Avocado"
          />
        </View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Quantity</Text>
            <TextInput
              value={ingredient.quantity.toString()}
              onChangeText={(quantity) => setIngredient((prev) => ({ ...prev, quantity }))}
              placeholder="e.g. 2"
              keyboardType="decimal-pad"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Unit</Text>
            <PressableWithHaptics onPress={handleOpenUnitSheet}>
              <View style={styles.unitButton}>
                <Text style={styles.unitText}>
                  {UNITS.find((u) => u.value === ingredient.unit)?.label({ count: parseFloat(ingredient.quantity) })}
                </Text>
              </View>
            </PressableWithHaptics>
          </View>
        </View>
        <View>
          <Text style={styles.label}>Category</Text>
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
  header: {
    marginBottom: 24,
    color: '#4A3E36',
    fontFamily: 'Satoshi-Bold',
    fontSize: 20,
    lineHeight: 20 * 1.25,
  },
  label: {
    marginBottom: 4,
    color: '#4A3E36',
    fontFamily: 'Satoshi-Bold',
    fontSize: 14,
    lineHeight: 14 * 1.5,
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
  unitText: {
    color: '#493D34',
    fontFamily: 'Satoshi-Bold',
    fontSize: 14,
    lineHeight: 14 * 1.25,
  },
});
