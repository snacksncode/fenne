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
  Shrimp,
  Snowflake,
  Wheat,
} from 'lucide-react-native';

import { bottleSpray, bottleToothbrushComb, pepperChilli } from '@lucide/lab';
import { View } from 'react-native';
import { Text } from '@/components/Text';
import { AisleCategory } from '@/api/groceries';
import { colors } from '@/constants/colors';

export const AisleHeader = ({ type }: { type: AisleCategory }) => {
  const getText = () => {
    if (type === 'produce') return 'Produce';
    if (type === 'bakery') return 'Bakery';
    if (type === 'dairy_eggs') return 'Dairy & Eggs';
    if (type === 'meat') return 'Meat';
    if (type === 'seafood') return 'Seafood';
    if (type === 'pantry') return 'Pantry';
    if (type === 'frozen_foods') return 'Frozen Foods';
    if (type === 'beverages') return 'Beverages';
    if (type === 'snacks') return 'Snacks';
    if (type === 'condiments_sauces') return 'Condiments & Sauces';
    if (type === 'spices_baking') return 'Spices & Baking';
    if (type === 'household') return 'Household';
    if (type === 'personal_care') return 'Personal Care';
    if (type === 'pet_supplies') return 'Pet Supplies';
    if (type === 'other') return 'Other';
  };

  const renderIcon = () => {
    const iconProps = { color: '#CD7E34', size: 24 };
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

  return (
    <View style={{ gap: 8, flexDirection: 'row', alignItems: 'center' }}>
      <View style={{ padding: 4, backgroundColor: colors.orange[100], borderRadius: 8 }}>{renderIcon()}</View>
      <Text style={{ color: '#795339', fontFamily: 'Satoshi-Bold', fontSize: 20, lineHeight: 20 * 1.25 }}>
        {getText()}
      </Text>
    </View>
  );
};
