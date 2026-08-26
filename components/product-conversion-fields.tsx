import { Unit, UNITS } from '@/components/bottomSheets/select-unit-sheet';
import { NumberInput, TextInputRef } from '@/components/input';
import { Typography } from '@/components/Typography';
import { colors } from '@/constants/colors';
import { StyleSheet, View } from 'react-native';

type ProductConversionFieldsProps = {
  productName: string;
  productUnit: Unit;
  units: Unit[];
  values: Partial<Record<Unit, string>>;
  onChange: (unit: Unit, value: string) => void;
  error?: string | null;
  registerInput?: (unit: Unit, input: TextInputRef | null) => void;
};

const unitLabel = (unit: Unit, count: number) =>
  UNITS.find((option) => option.value === unit)?.label({ count }) ?? unit;

export const ProductConversionFields = ({
  productName,
  productUnit,
  units,
  values,
  onChange,
  error,
  registerInput,
}: ProductConversionFieldsProps) => (
  <View style={styles.container}>
    <Typography variant="body-base" weight="bold" color={colors.brown[900]}>
      Conversion needed
    </Typography>
    <Typography variant="body-xs" weight="medium" color={colors.brown[700]}>
      {productName} is tracked in {unitLabel(productUnit, 2).toLowerCase()}. Tell us how its recipe units convert.
    </Typography>

    {units.map((unit) => (
      <View key={unit} style={styles.field}>
        <Typography variant="body-sm" weight="bold" color={colors.brown[900]}>
          1 {unitLabel(unit, 1).toLowerCase()} of {productName} equals
        </Typography>
        <View style={styles.inputRow}>
          <NumberInput
            ref={(input) => registerInput?.(unit, input)}
            value={values[unit] ?? ''}
            onChangeText={(value) => onChange(unit, value)}
            placeholder="e.g. 15"
            style={{ flex: 1 }}
          />
          <View style={styles.unitLabel}>
            <Typography variant="body-sm" weight="medium" color={colors.brown[900]}>
              {unitLabel(productUnit, 2)}
            </Typography>
          </View>
        </View>
      </View>
    ))}

    {error ? (
      <Typography variant="body-xs" weight="bold" color={colors.red[500]}>
        {error}
      </Typography>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  container: {
    borderColor: colors.orange[600],
    borderTopWidth: 1,
    gap: 8,
    paddingTop: 12,
  },
  field: {
    gap: 4,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  unitLabel: {
    alignItems: 'center',
    borderColor: colors.brown[900],
    borderBottomWidth: 2,
    borderRadius: 8,
    borderWidth: 1,
    height: 48,
    justifyContent: 'center',
    minWidth: 100,
    paddingHorizontal: 12,
  },
});
