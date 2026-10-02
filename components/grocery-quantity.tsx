import { Unit } from '@/lib/quantity';
import { Typography } from '@/components/Typography';
import { colors } from '@/constants/colors';
import { prettyUnit } from '@/lib/quantity';
import { StyleSheet, View } from 'react-native';

export const formatGroceryQuantity = (quantity: number, unit: Unit) =>
  `${Number(quantity.toFixed(3))} ${prettyUnit({ quantity, unit })}`;

export const GroceryQuantity = ({ quantity, unit, coveredByPantry = false }: {
  quantity: number; unit: Unit; coveredByPantry?: boolean;
}) => (
  <View style={[styles.badge, coveredByPantry && styles.covered]}>
    <Typography variant="body-sm" weight="bold" color={colors.cream[100]}>
      {coveredByPantry ? 'In pantry' : formatGroceryQuantity(quantity, unit)}
    </Typography>
  </View>
);

const styles = StyleSheet.create({
  covered: { backgroundColor: colors.green[600], borderColor: colors.green[700] },
  badge: {
    borderRadius: 999, paddingHorizontal: 6, backgroundColor: colors.orange[500],
    borderWidth: 2, borderBottomWidth: 3, borderColor: colors.orange[600],
  },
});
