import { IngredientFormData } from '@/api/schedules';
import { AisleHeader } from '@/components/aisle-header';
import { BaseSheet } from '@/components/bottomSheets/base-sheet';
import { SelectCategorySheet } from '@/components/bottomSheets/select-category-sheet';
import { SelectUnitSheet, SelectUnitSheetData, UNITS } from '@/components/bottomSheets/select-unit-sheet';
import { Button } from '@/components/button';
import { SheetTextInput } from '@/components/input';
import { PressableWithHaptics } from '@/components/pressable-with-feedback';
import { Text } from '@/components/Text';
import { ensure } from '@/utils';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { ArrowRight } from 'lucide-react-native';
import { nanoid } from 'nanoid/non-secure';
import { RefObject, useRef, useState } from 'react';
import { Keyboard, StyleSheet, View } from 'react-native';
import { TextInput } from 'react-native-gesture-handler';

export type EditIngredientSheetData = { ingredient?: IngredientFormData };

type SheetProps = {
  ref: RefObject<BottomSheetModal<EditIngredientSheetData> | null>;
  onSave: (ingredient: IngredientFormData) => void;
};

const Content = ({
  ingredient: initialIngredient,
  sheetRef,
  onOpenUnitSheet,
  onOpenCategorySheet,
  onSave,
}: {
  ingredient?: IngredientFormData;
  sheetRef: SheetProps['ref'];
  onOpenUnitSheet: (ingredient: IngredientFormData) => void;
  onOpenCategorySheet: (ingredient: IngredientFormData) => void;
  onSave: (ingredient: IngredientFormData) => void;
}) => {
  const [ingredient, setIngredient] = useState<IngredientFormData>(() => {
    return initialIngredient ?? { _id: nanoid(), name: '', quantity: '', aisle: 'other', unit: 'g' };
  });

  const handleSave = () => {
    if (!ingredient.name.trim()) return;
    onSave(ingredient);
    sheetRef.current?.dismiss();
    Keyboard.dismiss();
  };

  const maybeFocus = (node: TextInput | null | undefined) => {
    if (!ingredient.name) node?.focus();
  };

  return (
    <BaseSheet.Container>
      <Text style={styles.header}>{initialIngredient ? 'Edit Ingredient' : 'Add Ingredient'}</Text>
      <View style={{ gap: 16 }}>
        <View>
          <Text style={styles.label}>Name</Text>
          <SheetTextInput
            value={ingredient.name}
            onChangeText={(name) => setIngredient((prev) => ({ ...prev, name }))}
            placeholder="e.g. Avocado"
            ref={(node) => {
              setTimeout(() => maybeFocus(node), 500);
            }}
          />
        </View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Quantity</Text>
            <SheetTextInput
              value={ingredient.quantity.toString()}
              onChangeText={(quantity) => setIngredient((prev) => ({ ...prev, quantity }))}
              placeholder="e.g. 2"
              keyboardType="decimal-pad"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Unit</Text>
            <PressableWithHaptics onPress={() => onOpenUnitSheet(ingredient)}>
              <View style={styles.unitButton}>
                <Text style={styles.unitText}>
                  {UNITS.find((u) => u.value === ingredient.unit)?.label({ count: parseFloat(ingredient.quantity) })}
                </Text>
              </View>
            </PressableWithHaptics>
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Category</Text>
          <PressableWithHaptics onPress={() => onOpenCategorySheet(ingredient)}>
            <AisleHeader type={ingredient.aisle} />
          </PressableWithHaptics>
        </View>
      </View>
      <View style={{ marginTop: 32 }}>
        <Button text="Save ingredient" variant="primary" rightIcon={{ Icon: ArrowRight }} onPress={handleSave} />
      </View>
    </BaseSheet.Container>
  );
};

export const EditIngredientSheet = ({ ref, onSave }: SheetProps) => {
  const ingredientTempStorage = useRef<IngredientFormData>(null);
  const selectUnitSheetRef = useRef<BottomSheetModal<SelectUnitSheetData>>(null);
  const selectCategorySheetRef = useRef<BottomSheetModal>(null);

  return (
    <>
      <BaseSheet<EditIngredientSheetData> ref={ref}>
        {({ data }) => (
          <Content
            ingredient={data?.ingredient}
            sheetRef={ref}
            onOpenUnitSheet={(ingredient) => {
              ingredientTempStorage.current = ingredient;
              ref.current?.dismiss();
              Keyboard.dismiss();
              selectUnitSheetRef.current?.present({ ingredient });
            }}
            onOpenCategorySheet={(ingredient) => {
              ingredientTempStorage.current = ingredient;
              ref.current?.dismiss();
              Keyboard.dismiss();
              selectCategorySheetRef.current?.present();
            }}
            onSave={onSave}
          />
        )}
      </BaseSheet>
      <SelectUnitSheet
        ref={selectUnitSheetRef}
        onSelect={(unit) => {
          selectUnitSheetRef.current?.dismiss();
          ref.current?.present({ ingredient: { ...ensure(ingredientTempStorage.current), unit } });
        }}
        onDismiss={() => {
          ref.current?.present({ ingredient: ensure(ingredientTempStorage.current) });
        }}
      />
      <SelectCategorySheet
        ref={selectCategorySheetRef}
        onSelect={(aisle) => {
          selectCategorySheetRef.current?.dismiss();
          ref.current?.present({ ingredient: { ...ensure(ingredientTempStorage.current), aisle } });
        }}
        onDismiss={() => {
          ref.current?.present({ ingredient: ensure(ingredientTempStorage.current) });
        }}
      />
    </>
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
