import { BaseSheet } from '@/components/bottomSheets/base-sheet';
import { Typography } from '@/components/Typography';
import { colors } from '@/constants/colors';
import { SheetProps, useSheets } from '@/lib/sheet-context';
import { ScrollView, View } from 'react-native';
import { Button } from '@/components/button';

export type Unit = 'g' | 'kg' | 'ml' | 'l' | 'fl_oz' | 'cup' | 'tbsp' | 'tsp' | 'qt' | 'oz' | 'lb' | 'count';

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
  { value: 'qt', label: ({ count }) => (count === 1 ? 'Quart' : 'Quarts') },
  { value: 'oz', label: () => 'Ounces' },
  { value: 'lb', label: () => 'Pounds' },
];

type SelectUnitSheetData = SheetProps<'select-unit-sheet'>['data'];

const SelectUnitSheetContent = ({
  sheetId,
  data,
}: {
  sheetId: SheetProps<'select-unit-sheet'>['sheetId'];
  data: SelectUnitSheetData;
}) => {
  const sheets = useSheets();
  const selectedUnit = data.unit;

  const handleSelect = (unit: Unit) => {
    sheets.dismiss(sheetId, unit);
  };

  return (
    <BaseSheet id={sheetId}>
      <ScrollView>
        <View style={{ backgroundColor: colors.cream[100] }}>
          <Typography variant="heading-sm" weight="bold" style={{ marginBottom: 16 }}>
            Select unit
          </Typography>
        </View>
        <View style={{ gap: 8, paddingBottom: 12, flexDirection: 'row', flexWrap: 'wrap' }}>
          {UNITS.map((unit) => (
            <Button
              key={unit.value}
              variant={unit.value === selectedUnit ? 'primary' : 'outlined'}
              onPress={() => handleSelect(unit.value)}
              text={unit.label({ count: 1 })}
              size="small"
            />
          ))}
        </View>
      </ScrollView>
    </BaseSheet>
  );
};

export const SelectUnitSheet = (props: SheetProps<'select-unit-sheet'>) => {
  return <SelectUnitSheetContent sheetId={props.sheetId} data={props.data} />;
};
