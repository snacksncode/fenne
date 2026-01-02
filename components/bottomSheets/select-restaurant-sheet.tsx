import { BaseSheet } from '@/components/bottomSheets/base-sheet';
import { Option, SegmentedSelect } from '@/components/Select';
import { Text } from '@/components/Text';
import { colors } from '@/constants/colors';
import { MealType } from '@/api/schedules';
import { BottomSheetModal, useBottomSheetModal } from '@gorhom/bottom-sheet';
import { BookMarked, ChefHat, Ham, Salad } from 'lucide-react-native';
import { RefObject, useState } from 'react';
import { Keyboard, View } from 'react-native';
import { PressableWithHaptics } from '@/components/pressable-with-feedback';
import { Button } from '@/components/button';
import { SheetTextInput } from '@/components/input';
import { Pancake } from '@/components/svgs/pancake';
import { ensure } from '@/utils';

const mealTypeOptions: Option<MealType>[] = [
  { value: 'breakfast', text: 'Breakfast', icon: Pancake },
  { value: 'lunch', text: 'Lunch', icon: Ham },
  { value: 'dinner', text: 'Dinner', icon: Salad },
];

export type SelectRestaurantSheetData = {
  defaultMealType?: MealType;
  defaultRestaurant?: string;
  dateString: string;
};

type ContentProps = {
  defaultMealType: MealType | undefined;
  defaultRestaurant: string | undefined;
  onRestaurantSelect: (params: { restaurant: string; mealType: MealType }) => void;
  handleSwitchToRecipes: (params: { mealType: MealType }) => void;
};

export const SelectRestaurantSheetContent = ({
  defaultMealType,
  defaultRestaurant,
  onRestaurantSelect,
  handleSwitchToRecipes,
}: ContentProps) => {
  const [mealType, setMealType] = useState<MealType>(defaultMealType ?? 'breakfast');
  const [restaurant, setRestaurant] = useState(defaultRestaurant ?? '');

  return (
    <BaseSheet.Container>
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
          <PressableWithHaptics
            onPress={() => handleSwitchToRecipes({ mealType })}
            style={{ marginLeft: 'auto' }}
            scaleTo={0.9}
          >
            <BookMarked color={colors.brown[900]} />
          </PressableWithHaptics>
        </View>
        <View style={[{ paddingBottom: 12 }]}>
          <SegmentedSelect value={mealType} options={mealTypeOptions} onValueChange={setMealType} />
        </View>
      </View>
      <SheetTextInput placeholder="What's the place?" value={restaurant} onChangeText={setRestaurant} />
      <Button
        variant="primary"
        text={defaultRestaurant ? 'Update' : 'Confirm'}
        style={{ marginTop: 16 }}
        onPress={() => onRestaurantSelect({ restaurant, mealType })}
      />
    </BaseSheet.Container>
  );
};

type SheetProps = {
  ref: RefObject<BottomSheetModal<SelectRestaurantSheetData> | null>;
  onRestaurantSelect: (params: { restaurant: string; dateString: string; mealType: MealType }) => void;
  handleSwitchToRecipes: (params: { dateString: string; mealType: MealType }) => void;
};

export const SelectRestaurantSheet = ({ ref, onRestaurantSelect, handleSwitchToRecipes }: SheetProps) => {
  const { dismissAll } = useBottomSheetModal();

  return (
    <BaseSheet<SelectRestaurantSheetData> ref={ref}>
      {({ data }) => {
        const { dateString, defaultMealType, defaultRestaurant } = ensure(data);
        return (
          <SelectRestaurantSheetContent
            defaultMealType={defaultMealType}
            defaultRestaurant={defaultRestaurant}
            onRestaurantSelect={({ restaurant, mealType }) => {
              Keyboard.dismiss();
              dismissAll();
              onRestaurantSelect({ restaurant, dateString, mealType });
            }}
            handleSwitchToRecipes={({ mealType }) => {
              handleSwitchToRecipes({ dateString, mealType });
            }}
          />
        );
      }}
    </BaseSheet>
  );
};
