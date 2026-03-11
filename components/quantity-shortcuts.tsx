import { ScrollView, View } from 'react-native';
import { Button } from '@/components/button';
import { Unit } from '@/components/bottomSheets/select-unit-sheet';
import { unitFormatters } from '@/utils/unit-formatters';

type Preset = { label: string; value: number };

const FRACTION_PRESETS: Preset[] = [
  { label: '1/4', value: 0.25 },
  { label: '1/3', value: 0.33 },
  { label: '1/2', value: 0.5 },
  { label: '2/3', value: 0.67 },
  { label: '3/4', value: 0.75 },
  { label: '1', value: 1 },
  { label: '1.5', value: 1.5 },
  { label: '2', value: 2 },
];

const SMALL_METRIC_PRESETS: Preset[] = [
  { label: '50', value: 50 },
  { label: '100', value: 100 },
  { label: '150', value: 150 },
  { label: '200', value: 200 },
  { label: '250', value: 250 },
  { label: '500', value: 500 },
];

const LARGE_METRIC_PRESETS: Preset[] = [
  { label: '0.5', value: 0.5 },
  { label: '1', value: 1 },
  { label: '1.5', value: 1.5 },
  { label: '2', value: 2 },
  { label: '3', value: 3 },
  { label: '5', value: 5 },
];

const OZ_PRESETS: Preset[] = [
  { label: '1', value: 1 },
  { label: '2', value: 2 },
  { label: '4', value: 4 },
  { label: '6', value: 6 },
  { label: '8', value: 8 },
  { label: '12', value: 12 },
];

const COUNT_PRESETS: Preset[] = [
  { label: '1', value: 1 },
  { label: '2', value: 2 },
  { label: '3', value: 3 },
  { label: '4', value: 4 },
  { label: '5', value: 5 },
  { label: '6', value: 6 },
];

export function getPresetsForUnit(unit: Unit): Preset[] {
  switch (unit) {
    case 'cup':
    case 'tbsp':
    case 'tsp':
    case 'fl_oz':
    case 'qt':
      return FRACTION_PRESETS;
    case 'g':
    case 'ml':
      return SMALL_METRIC_PRESETS;
    case 'kg':
    case 'l':
    case 'lb':
      return LARGE_METRIC_PRESETS;
    case 'oz':
      return OZ_PRESETS;
    default:
      return COUNT_PRESETS;
  }
}

type QuantityShortcutsProps = {
  unit: Unit;
  currentValue: number;
  onSelect: (value: number) => void;
};

export const QuantityShortcuts = ({ unit, currentValue, onSelect }: QuantityShortcutsProps) => {
  const presets = getPresetsForUnit(unit);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginHorizontal: -20 }}
      contentContainerStyle={{ gap: 8, paddingHorizontal: 20 }}
    >
      {presets.map((preset) => (
        <Button
          key={preset.label}
          text={`${preset.label} ${unitFormatters[unit]({ count: preset.value })}`}
          size="small"
          variant={currentValue === preset.value ? 'primary' : 'outlined'}
          onPress={() => onSelect(preset.value)}
        />
      ))}
    </ScrollView>
  );
};
