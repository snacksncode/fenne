import { IngredientFormData } from '@/api/schedules';
import { BaseSheet } from '@/components/bottomSheets/base-sheet';
import { PressableWithHaptics } from '@/components/pressable-with-feedback';
import { Text } from '@/components/Text';
import { colors } from '@/constants/colors';
import { ensure } from '@/utils';
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { RefObject } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type SelectUnitSheetData = {
  ingredient: IngredientFormData;
};

type SheetProps = {
  ref: RefObject<BottomSheetModal<SelectUnitSheetData> | null>;
  onSelect: (unit: Unit) => void;
  onDismiss: () => void;
};

export type Unit = 'g' | 'kg' | 'ml' | 'l' | 'fl_oz' | 'cup' | 'tbsp' | 'tsp' | 'pt' | 'qt' | 'oz' | 'lb' | 'count';

type LabelFn = (data: { count: number }) => string;
export const UNITS: { value: Unit; label: LabelFn }[] = [
  { value: 'count', label: ({ count }) => (count === 1 ? 'Piece' : 'Pieces') },
  { value: 'g', label: () => 'Grams' },
  { value: 'kg', label: () => 'Kilograms' },
  { value: 'ml', label: () => 'Milliliters' },
  { value: 'l', label: () => 'Liters' },
  { value: 'fl_oz', label: () => 'Fluid ounces' },
  { value: 'cup', label: ({ count }) => (count === 1 ? 'Cup' : 'Cups') },
  { value: 'tbsp', label: ({ count }) => (count === 1 ? 'Tablespoon' : 'Tablespoons') },
  { value: 'tsp', label: ({ count }) => (count === 1 ? 'Teaspoon' : 'Teaspoons') },
  { value: 'pt', label: ({ count }) => (count === 1 ? 'Pint' : 'Pints') },
  { value: 'qt', label: ({ count }) => (count === 1 ? 'Quart' : 'Quarts') },
  { value: 'oz', label: () => 'Ounces' },
  { value: 'lb', label: () => 'Pounds' },
];

const UnitOption = ({
  isSelected,
  unit,
  onSelect,
}: {
  isSelected: boolean;
  unit: { value: Unit; label: LabelFn };
  onSelect: (unit: Unit) => void;
}) => (
  <PressableWithHaptics onPress={() => onSelect(unit.value)}>
    <View
      style={[
        styles.unitOption,
        isSelected && { borderColor: colors.orange[600], backgroundColor: colors.orange[500] },
      ]}
    >
      <Text style={[styles.unitText, isSelected && { color: colors.cream[100] }]}>{unit.label({ count: 1 })}</Text>
    </View>
  </PressableWithHaptics>
);

const Content = ({ ingredient, onSelect }: { onSelect: (unit: Unit) => void; ingredient: IngredientFormData }) => {
  const insets = useSafeAreaInsets();

  return (
    <BottomSheetScrollView>
      <View style={{ paddingHorizontal: 20 }}>
        <Text style={styles.header}>Select unit</Text>
      </View>
      <View style={{ paddingHorizontal: 20, gap: 12, paddingBottom: insets.bottom }}>
        {UNITS.map((unit) => (
          <UnitOption key={unit.value} isSelected={ingredient.unit === unit.value} unit={unit} onSelect={onSelect} />
        ))}
      </View>
    </BottomSheetScrollView>
  );
};

export const SelectUnitSheet = ({ ref, onSelect, onDismiss }: SheetProps) => {
  const windowDimensions = useWindowDimensions();
  return (
    <BaseSheet<SelectUnitSheetData>
      ref={ref}
      backdropDismissBehavior="dismissAll"
      snapPoints={['50%']}
      onDismiss={onDismiss}
      maxDynamicContentSize={windowDimensions.height * 0.9}
    >
      {({ data }) => <Content ingredient={ensure(data).ingredient} onSelect={onSelect} />}
    </BaseSheet>
  );
};

const styles = StyleSheet.create({
  header: {
    marginBottom: 16,
    color: '#4A3E36',
    fontFamily: 'Satoshi-Bold',
    fontSize: 20,
    lineHeight: 20 * 1.25,
  },
  unitOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#FEF2DD',
    borderWidth: 1,
    borderBottomWidth: 2,
    borderColor: '#4A3E36',
  },
  unitText: {
    color: '#4A3E36',
    fontFamily: 'Satoshi-Bold',
    fontSize: 14,
    lineHeight: 14 * 1.5,
  },
});
