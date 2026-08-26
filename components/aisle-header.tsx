import {
  Apple,
  Beer,
  Bone,
  BottleWine,
  Cookie,
  Croissant,
  Egg,
  Ghost,
  Ham,
  Icon,
  Pen,
  Shrimp,
  Snowflake,
  Wheat,
} from 'lucide-react-native';

import { bottleSpray, bottleToothbrushComb, pepperChilli } from '@lucide/lab';
import { StyleSheet, View } from 'react-native';
import { Typography } from '@/components/Typography';
import { AisleCategory } from '@/api/types';
import { colors } from '@/constants/colors';

export const AISLE_LABELS: Record<AisleCategory, string> = {
  produce: 'Produce',
  bakery: 'Bakery',
  dairy_eggs: 'Dairy & Eggs',
  meat: 'Meat',
  seafood: 'Seafood',
  pantry: 'Pantry',
  frozen_foods: 'Frozen Foods',
  beverages: 'Beverages',
  snacks: 'Snacks',
  condiments_sauces: 'Condiments & Sauces',
  spices_baking: 'Spices & Baking',
  household: 'Household',
  personal_care: 'Personal Care',
  pet_supplies: 'Pet Supplies',
  other: 'Other',
};

export const AISLE_CATEGORIES = Object.keys(AISLE_LABELS) as AisleCategory[];

const AISLE_ICON_COLOR = colors.orange[600];

export const AisleIcon = ({ type }: { type: AisleCategory }) => {
  const renderIcon = () => {
    const iconProps = { color: AISLE_ICON_COLOR, size: 24 };
    if (type === 'produce') return <Apple {...iconProps} />;
    if (type === 'bakery') return <Croissant {...iconProps} />;
    if (type === 'dairy_eggs') return <Egg {...iconProps} />;
    if (type === 'meat') return <Ham {...iconProps} />;
    if (type === 'seafood') return <Shrimp {...iconProps} />;
    if (type === 'pantry') return <Wheat {...iconProps} />;
    if (type === 'frozen_foods') return <Snowflake {...iconProps} />;
    if (type === 'beverages') return <Beer {...iconProps} />;
    if (type === 'snacks') return <Cookie {...iconProps} />;
    if (type === 'condiments_sauces') return <BottleWine {...iconProps} />;
    if (type === 'spices_baking') return <Icon iconNode={pepperChilli} {...iconProps} />;
    if (type === 'household') return <Icon iconNode={bottleSpray} {...iconProps} />;
    if (type === 'personal_care') return <Icon iconNode={bottleToothbrushComb} {...iconProps} />;
    if (type === 'pet_supplies') return <Bone {...iconProps} />;
    if (type === 'other') return <Ghost {...iconProps} />;
  };

  return <View style={{ padding: 4, backgroundColor: `${AISLE_ICON_COLOR}1A`, borderRadius: 8 }}>{renderIcon()}</View>;
};

export const AisleHeader = ({ type, showEditIndicator = false }: { type: AisleCategory; showEditIndicator?: boolean }) => {
  return (
    <View style={[styles.header, showEditIndicator && styles.editableHeader]}>
      <AisleIcon type={type} />
      <Typography
        variant="heading-sm"
        weight="bold"
        color={colors.brown[800]}
        style={showEditIndicator ? styles.editableLabel : undefined}
      >
        {AISLE_LABELS[type]}
      </Typography>
      {showEditIndicator ? (
        <View pointerEvents="none" style={styles.editIndicator}>
          <Pen color={colors.brown[900]} size={18} strokeWidth={2.4} />
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  editableHeader: {
    width: '100%',
  },
  editableLabel: {
    flex: 1,
  },
  editIndicator: {
    alignItems: 'center',
    borderColor: colors.brown[900],
    borderRadius: 999,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
});
