import { BaseSheet } from '@/components/bottomSheets/base-sheet';
import { PressableWithHaptics } from '@/components/pressable-with-feedback';
import { Typography } from '@/components/Typography';
import { SheetManager, SheetProps } from 'react-native-actions-sheet';
import { View } from 'react-native';
import { MealType } from '@/api/types';
import { Pancake } from '@/components/svgs/pancake';
import { Ham, Salad, UtensilsCrossed, Check } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { FunctionComponent } from 'react';

export type MealFilter = MealType | 'all';

const options: { value: MealFilter; label: string; icon: FunctionComponent<{ size: number; color: string }> }[] = [
  { value: 'all', label: 'All Recipes', icon: UtensilsCrossed },
  { value: 'breakfast', label: 'Breakfast', icon: Pancake },
  { value: 'lunch', label: 'Lunch', icon: Ham },
  { value: 'dinner', label: 'Dinner', icon: Salad },
];

export const RecipeFilterSheet = (props: SheetProps<'recipe-filter-sheet'>) => {
  const current: MealFilter = props.payload?.current ?? 'all';

  const handleSelect = (value: MealFilter) => {
    SheetManager.hide(props.sheetId, { payload: value });
  };

  return (
    <BaseSheet id={props.sheetId}>
      <Typography variant="heading-sm" weight="bold" style={{ marginBottom: 12 }}>
        Filter by meal type
      </Typography>
      <View style={{ gap: 4, paddingBottom: 8 }}>
        {options.map((option) => {
          const isSelected = current === option.value;
          return (
            <PressableWithHaptics
              key={option.value}
              scaleTo={0.97}
              onPress={() => handleSelect(option.value)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingVertical: 14,
                paddingHorizontal: 16,
                borderRadius: 8,
                backgroundColor: isSelected ? colors.brown[900] : 'transparent',
              }}
            >
              <option.icon size={20} color={isSelected ? colors.cream[100] : colors.brown[900]} />
              <Typography
                variant="body-base"
                weight="bold"
                color={isSelected ? colors.cream[100] : colors.brown[900]}
                style={{ flex: 1 }}
              >
                {option.label}
              </Typography>
              {isSelected && <Check size={20} color={colors.cream[100]} strokeWidth={2.5} />}
            </PressableWithHaptics>
          );
        })}
      </View>
    </BaseSheet>
  );
};
