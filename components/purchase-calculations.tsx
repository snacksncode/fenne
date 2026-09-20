import { PurchaseSuggestionDTO } from '@/api/types';
import { Unit } from '@/components/bottomSheets/select-unit-sheet';
import { formatGroceryQuantity } from '@/components/grocery-quantity';
import { Typography } from '@/components/Typography';
import { colors } from '@/constants/colors';
import { Archive, CookingPot } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

export const PurchaseCalculations = ({ purchase, unit }: { purchase: PurchaseSuggestionDTO; unit: Unit }) => {
  const empty = purchase.pantry === 0;
  const pantryColor = colors.green[700];
  return (
    <View style={styles.row}>
      <View style={[styles.pill, { backgroundColor: colors.orange[500] + '20' }]}>
        <View style={styles.label}>
          <CookingPot size={18} color={colors.orange[600]} />
          <Typography variant="body-sm" weight="medium" color={colors.orange[600]}>Recipes need</Typography>
        </View>
        <Typography variant="body-base" weight="bold" color={colors.brown[900]}>
          {formatGroceryQuantity(purchase.needed, unit)}
        </Typography>
      </View>
      <View style={[styles.pill, { backgroundColor: colors.green[600] + '18' }]}>
        <View style={styles.label}>
          <Archive size={18} color={pantryColor} />
          <Typography variant="body-sm" weight="medium" color={pantryColor}>In pantry</Typography>
        </View>
        <Typography variant="body-base" weight="bold" color={colors.brown[900]}>
          {empty ? 'None' : formatGroceryQuantity(purchase.pantry, unit)}
        </Typography>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  pill: { flex: 1, minWidth: 0, alignItems: 'center', paddingHorizontal: 8, paddingVertical: 10, gap: 4, borderRadius: 16 },
  label: { flexDirection: 'row', alignItems: 'center', gap: 5 },
});
