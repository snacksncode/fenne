import { BaseSheet } from '@/components/bottomSheets/base-sheet';
import { Typography } from '@/components/Typography';
import { colors } from '@/constants/colors';
import { SheetProps, useSheets } from '@/lib/sheet-context';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button } from '@/components/button';
import { LucideIcon, Ruler, Shapes, Weight } from 'lucide-react-native';

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

type UnitGroup = {
  icon: LucideIcon;
  label: string;
  units: Unit[];
};

const UNIT_GROUPS: UnitGroup[] = [
  { label: 'Metric', icon: Ruler, units: ['g', 'kg', 'ml', 'l'] },
  { label: 'Imperial', icon: Weight, units: ['fl_oz', 'cup', 'qt', 'oz', 'lb'] },
  { label: 'Other', icon: Shapes, units: ['count', 'tbsp', 'tsp'] },
];

export const isUnit = (value: unknown): value is Unit =>
  typeof value === 'string' && UNITS.some((unit) => unit.value === value);

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
        <View style={styles.groups}>
          {UNIT_GROUPS.map(({ icon: Icon, label, units }) => (
            <View key={label} style={styles.group}>
              <View style={styles.groupHeader}>
                <View style={styles.iconTile}>
                  <Icon color={colors.orange[600]} size={20} strokeWidth={2.25} />
                </View>
                <Typography variant="body-base" weight="bold">
                  {label}
                </Typography>
              </View>
              <View style={styles.options}>
                {units.map((value) => {
                  const unit = UNITS.find((option) => option.value === value)!;
                  return (
                    <Button
                      key={unit.value}
                      variant={unit.value === selectedUnit ? 'primary' : 'outlined'}
                      onPress={() => handleSelect(unit.value)}
                      text={unit.label({ count: 1 })}
                      size="small"
                    />
                  );
                })}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </BaseSheet>
  );
};

export const SelectUnitSheet = (props: SheetProps<'select-unit-sheet'>) => {
  return <SelectUnitSheetContent sheetId={props.sheetId} data={props.data} />;
};

const styles = StyleSheet.create({
  group: {
    gap: 8,
  },
  groupHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  groups: {
    gap: 18,
    paddingBottom: 12,
  },
  iconTile: {
    alignItems: 'center',
    backgroundColor: colors.orange[100],
    borderRadius: 8,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
