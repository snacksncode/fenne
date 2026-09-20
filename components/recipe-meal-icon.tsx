import { MealType } from '@/api/types';
import { Pancake } from '@/components/svgs/pancake';
import { colors } from '@/constants/colors';
import { CookingPot, Ham, Salad } from 'lucide-react-native';
import { View } from 'react-native';

export const RecipeMealIcon = ({ mealType, compact = false }: { mealType?: MealType; compact?: boolean }) => {
  const Icon = mealType === 'breakfast' ? Pancake : mealType === 'lunch' ? Salad : mealType === 'dinner' ? Ham : CookingPot;
  return <View style={{ padding: compact ? 3 : 4, backgroundColor: colors.orange[100], borderRadius: compact ? 5 : 8 }}>
    <Icon size={compact ? 16 : 24} color={colors.orange[600]} />
  </View>;
};
