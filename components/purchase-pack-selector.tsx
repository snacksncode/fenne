import { Unit } from '@/lib/quantity';
import { Button } from '@/components/button';
import { formatGroceryQuantity } from '@/components/grocery-quantity';
import { Typography } from '@/components/Typography';
import { PackCounts } from '@/hooks/use-pack-selection';
import { StyleSheet, View } from 'react-native';

export const PurchasePackSelector = ({ sizes, unit, counts, onChange, disabled = false }: {
  sizes: number[];
  unit: Unit;
  counts: PackCounts;
  onChange: (size: number, delta: number) => void;
  disabled?: boolean;
}) => (
  <View style={styles.list}>
    {sizes.map((size) => (
      <View key={size} style={styles.row}>
        <Typography variant="body-sm" weight="medium" style={{ flex: 1 }}>{formatGroceryQuantity(size, unit)}</Typography>
        <Button text="−" size="small" variant="outlined" disabled={disabled || !counts[size]}
          accessibilityLabel={`Remove one ${formatGroceryQuantity(size, unit)} pack`} onPress={() => onChange(size, -1)} />
        <Typography variant="body-base" weight="bold">{counts[size] ?? 0}</Typography>
        <Button text="+" size="small" variant="outlined" disabled={disabled}
          accessibilityLabel={`Add one ${formatGroceryQuantity(size, unit)} pack`} onPress={() => onChange(size, 1)} />
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  list: { gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
