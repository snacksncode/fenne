import { Ham } from '@/components/svgs/ham';
import { Pancake } from '@/components/svgs/pancake';
import { Salad } from '@/components/svgs/salad';
import { Text } from '@/components/Text';
import { View } from 'react-native';

export const MealTypeKicker = ({ type }: { type: 'breakfast' | 'lunch' | 'dinner' }) => (
  <View style={{ gap: 4, flexDirection: 'row', alignItems: 'center' }}>
    {type === 'breakfast' ? (
      <Pancake size={16} color="#CF9E7D" />
    ) : type === 'lunch' ? (
      <Salad size={16} color="#CF9E7D" />
    ) : (
      <Ham size={16} color="#CF9E7D" />
    )}
    <Text
      style={{
        color: '#CF9E7D',
        fontFamily: 'Satoshi-Bold',
        fontSize: 12,
        lineHeight: 12 * 1.5,
      }}
    >
      {type.toUpperCase()}
    </Text>
  </View>
);
