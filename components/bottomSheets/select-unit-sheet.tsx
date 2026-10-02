import { Unit, UNITS } from '@/lib/quantity';
import { BaseSheet } from '@/components/bottomSheets/base-sheet';
import { Typography } from '@/components/Typography';
import { colors } from '@/constants/colors';
import { SheetProps, useSheets } from '@/lib/sheet-context';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button } from '@/components/button';
import { LucideIcon, Ruler, Shapes, Weight } from 'lucide-react-native';

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

export const SelectUnitSheet = ({ sheetId, data }: SheetProps<'select-unit-sheet'>) => {
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
