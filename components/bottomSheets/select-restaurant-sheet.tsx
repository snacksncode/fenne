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

  const handleSwitchToRecipesPress = async () => {
    await SheetManager.hide(props.sheetId);
    SheetManager.show('schedule-meal-sheet', { payload: { dateString, mealType } });
  };

  return (
    <BaseSheet id={props.sheetId}>
      <View style={{ backgroundColor: colors.cream[100] }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 16 }}>
          <ChefHat color="#4A3E36" size={20} strokeWidth={2.5} />
          <Text
            style={{
              color: '#4A3E36',
              fontFamily: 'Satoshi-Bold',
              fontSize: 20,
              lineHeight: 20 * 1.25,
            }}
          >
            {defaultRestaurant ? 'Edit dining out?' : 'Dining out?'}
          </Text>
          <PressableWithHaptics onPress={handleSwitchToRecipesPress} style={{ marginLeft: 'auto' }} scaleTo={0.9}>
            <BookMarked color={colors.brown[900]} />
          </PressableWithHaptics>
        </View>
        <View style={[{ paddingBottom: 12 }]}>
          <SegmentedSelect value={mealType} options={mealTypeOptions} onValueChange={setMealType} />
        </View>
      </View>
      <TextInput placeholder="What's the place?" value={restaurant} onChangeText={setRestaurant} />
      <Button
        variant="primary"
        text={defaultRestaurant ? 'Update' : 'Confirm'}
        style={{ marginTop: 16 }}
        onPress={handleRestaurantSelect}
      />
    </BaseSheet>
  );
};
