import { BaseSheet } from '@/components/bottomSheets/base-sheet';
import { Option, SegmentedSelect } from '@/components/Select';
import { Text } from '@/components/Text';
import { colors } from '@/constants/colors';
import { MealType, useUpdateScheduleDay } from '@/api/schedules';
import { SheetManager, SheetProps } from 'react-native-actions-sheet';
import { BookMarked, ChefHat, Ham, Salad } from 'lucide-react-native';
import { useState } from 'react';
import { Keyboard, View } from 'react-native';
import { PressableWithHaptics } from '@/components/pressable-with-feedback';
import { Button } from '@/components/button';
import { TextInput } from '@/components/input';
import { Pancake } from '@/components/svgs/pancake';

const mealTypeOptions: Option<MealType>[] = [
  { value: 'breakfast', text: 'Breakfast', icon: Pancake },
  { value: 'lunch', text: 'Lunch', icon: Ham },
  { value: 'dinner', text: 'Dinner', icon: Salad },
];

export const SelectRestaurantSheet = (props: SheetProps<'select-restaurant-sheet'>) => {
  const { dateString, defaultMealType, defaultRestaurant } = props.payload ?? {};
  const updateScheduleDay = useUpdateScheduleDay();
  const [mealType, setMealType] = useState<MealType>(defaultMealType ?? 'breakfast');
  const [restaurant, setRestaurant] = useState(defaultRestaurant ?? '');

  if (!dateString) return null;

  const handleRestaurantSelect = () => {
    updateScheduleDay.mutate({
      dateString,
      [mealType]: { type: 'dining_out', name: restaurant },
    });
    Keyboard.dismiss();
    SheetManager.hideAll();
  };

  const handleSwitchToRecipesPress = () => {
    SheetManager.show('schedule-meal-sheet', {
      payload: {
        dateString,
        mealType,
      },
    });
    setTimeout(() => SheetManager.hide(props.sheetId), 100);
  };

  return <BaseSheet id={props.sheetId}></BaseSheet>;
};
