import { Unit, UNITS } from '@/lib/quantity';
import { ProductBehaviorHelpModal } from '@/components/product-behavior-help-modal';
import { PressableWithHaptics } from '@/components/pressable-with-feedback';
import { Typography } from '@/components/Typography';
import { colors } from '@/constants/colors';
import { BellRing, ChevronRight, CircleHelp, CookingPot, LucideIcon, Scale } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

export type ProductBehavior = 'tracked' | 'timed' | 'kitchen_basic';

const options: {
  value: ProductBehavior;
  title: string;
  description: string;
  Icon: LucideIcon;
}[] = [
  {
    value: 'tracked',
    title: 'Track stock',
    description: 'Keep track of how much I have left.',
    Icon: Scale,
  },
  {
    value: 'timed',
    title: 'Reminder',
    description: 'Remind me to buy more every so often.',
    Icon: BellRing,
  },
  {
    value: 'kitchen_basic',
    title: 'Kitchen basic',
    description: 'Assume I always have this at home.',
    Icon: CookingPot,
  },
];

export const ProductBehaviorSelector = ({
  value,
  onChange,
}: {
  value: ProductBehavior;
  onChange: (value: ProductBehavior) => void;
}) => {
  const [helpVisible, setHelpVisible] = useState(false);

  return (
    <>
      <View style={styles.container} accessibilityRole="radiogroup">
        <View style={styles.labelRow}>
          <Typography variant="body-sm" weight="bold" style={styles.label}>
            How should Fenne handle it?
          </Typography>
          <PressableWithHaptics
            accessibilityRole="button"
            accessibilityLabel="Learn how shopping item modes work"
            hitSlop={8}
            onPress={() => setHelpVisible(true)}
            style={styles.helpButton}
          >
            <CircleHelp size={20} strokeWidth={2.25} color={colors.brown[700]} />
          </PressableWithHaptics>
        </View>
        {options.map(({ value: optionValue, title, description, Icon }) => {
          const selected = value === optionValue;
          return (
            <PressableWithHaptics
              key={optionValue}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              onPress={() => onChange(optionValue)}
              style={[styles.card, selected && styles.selectedCard]}
            >
              <View style={[styles.icon, selected && styles.selectedIcon]}>
                <Icon size={24} strokeWidth={2.25} color={colors.orange[600]} />
              </View>
              <View style={styles.copy}>
                <Typography
                  variant="body-sm"
                  weight="bold"
                  color={selected ? colors.orange[600] : colors.brown[900]}
                >
                  {title}
                </Typography>
                <Typography variant="body-xs" weight="medium" color={colors.brown[700]}>
                  {description}
                </Typography>
              </View>
            </PressableWithHaptics>
          );
        })}
      </View>
      <ProductBehaviorHelpModal visible={helpVisible} onClose={() => setHelpVisible(false)} />
    </>
  );
};

export const TrackingUnitSelect = ({ unit, onPress }: { unit: Unit; onPress: () => void }) => (
  <View>
    <Typography variant="body-sm" weight="bold" style={styles.fieldLabel}>
      Tracking unit
    </Typography>
    <PressableWithHaptics onPress={onPress} style={styles.unitButton}>
      <Typography variant="body-sm" weight="medium" style={{ flex: 1 }}>
        {UNITS.find((option) => option.value === unit)?.label({ count: 2 })}
      </Typography>
      <ChevronRight size={20} color={colors.brown[900]} />
    </PressableWithHaptics>
    <Typography variant="body-xs" weight="medium" color={colors.brown[700]} style={styles.helper}>
      Choose the unit printed on the package. If it’s a 500 g pack, choose grams; if it’s 16 oz,
      choose ounces. Buying items one by one? Choose pieces.
    </Typography>
  </View>
);

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  labelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 2,
  },
  label: {
    flex: 1,
  },
  helpButton: {
    alignItems: 'center',
    backgroundColor: colors.cream[50],
    borderColor: colors.border.muted,
    borderRadius: 16,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  card: {
    alignItems: 'center',
    backgroundColor: colors.cream[50],
    borderColor: colors.brown[900],
    borderRadius: 12,
    borderWidth: 1,
    borderBottomWidth: 2,
    flexDirection: 'row',
    gap: 12,
    minHeight: 76,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  selectedCard: {
    backgroundColor: colors.surface.raised,
    borderColor: colors.orange[600],
    borderWidth: 2,
  },
  icon: {
    alignItems: 'center',
    backgroundColor: colors.orange[600] + '1A',
    borderRadius: 10,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  selectedIcon: {
    backgroundColor: colors.orange[600] + '1A',
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  fieldLabel: {
    marginBottom: 4,
  },
  unitButton: {
    alignItems: 'center',
    borderColor: colors.brown[900],
    borderRadius: 8,
    borderWidth: 1,
    borderBottomWidth: 2,
    flexDirection: 'row',
    height: 52,
    paddingHorizontal: 16,
  },
  helper: {
    marginTop: 6,
  },
});
