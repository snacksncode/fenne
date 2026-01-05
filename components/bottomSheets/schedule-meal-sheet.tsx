import { BaseSheet } from '@/components/bottomSheets/base-sheet';
import { Option, SegmentedSelect } from '@/components/Select';
import { Pancake } from '@/components/svgs/pancake';
import { Text } from '@/components/Text';
import { TextInput } from '@/components/input';
import { parseISO } from '@/date-tools';
import { SheetManager, SheetProps, ScrollView } from 'react-native-actions-sheet';
import { format } from 'date-fns';
import { BookMarked, CalendarClock, ChefHat, Ham, Salad } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';
import { RecipeDTO, recipesOptions, useRecipes } from '@/api/recipes';
import { useQueryClient } from '@tanstack/react-query';
import { useMount } from '@/hooks/use-mount';
import { Recipe } from '@/components/recipe';
import { Button } from '@/components/button';
import { colors } from '@/constants/colors';
import { MealType, useUpdateScheduleDay } from '@/api/schedules';
import { sort } from 'remeda';
import { PressableWithHaptics } from '@/components/pressable-with-feedback';
import { ensure } from '@/utils';

const mealTypeOptions: Option<MealType>[] = [
  { value: 'breakfast', text: 'Breakfast', icon: Pancake },
  { value: 'lunch', text: 'Lunch', icon: Ham },
  { value: 'dinner', text: 'Dinner', icon: Salad },
];

const getRecipeSortRank = (r: RecipeDTO, mealType: MealType) => {
  if (r.meal_types.length === 1 && r.meal_types[0] === mealType) return 2;
  if (r.meal_types.includes(mealType)) return 1;
  return 0;
};

export const ScheduleMealSheet = (props: SheetProps<'schedule-meal-sheet'>) => {
  type RPayload = Extract<typeof props.payload, { type: 'restaurant' }>;
  const payload = ensure(props.payload);
  const recipes = useRecipes();
  const queryClient = useQueryClient();
  const updateScheduleDay = useUpdateScheduleDay();
  const [mealType, setMealType] = useState<MealType>(payload.mealType ?? 'breakfast');
  const [snapIndex, setSnapIndex] = useState(0);
  const [showRestaurant, setShowRestaurant] = useState(payload.type === 'restaurant');
  const [restaurantName, setRestaurantName] = useState((payload as RPayload).defaultRestaurant ?? '');

  useMount(() => void queryClient.prefetchQuery(recipesOptions));

  const sortedRecipes = sort(
    recipes.data ?? [],
    (a, b) => getRecipeSortRank(b, mealType) - getRecipeSortRank(a, mealType)
  );

  const handleMealSelect = (meal: RecipeDTO) => {
    updateScheduleDay.mutate({
      dateString: payload.dateString,
      [mealType]: { type: 'recipe', recipe_id: meal.id },
    });
    SheetManager.hideAll();
  };

  const handleRestaurantSwitch = () => {
    setShowRestaurant(true);
  };

  const handleBackToRecipes = () => {
    setShowRestaurant(false);
    setRestaurantName('');
  };

  const handleRestaurantConfirm = () => {
    updateScheduleDay.mutate({
      dateString: payload.dateString,
      [mealType]: { type: 'dining_out', name: restaurantName },
    });
    SheetManager.hideAll();
  };

  return (
    <BaseSheet onSnapIndexChange={setSnapIndex} id={props.sheetId} snapPoints={showRestaurant ? undefined : [60]}>
      {showRestaurant ? (
        <View>
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
                {(payload as RPayload).defaultRestaurant ? 'Edit dining out?' : 'Dining out?'}
              </Text>
              <PressableWithHaptics onPress={handleBackToRecipes} style={{ marginLeft: 'auto' }} scaleTo={0.9}>
                <BookMarked color={colors.brown[900]} />
              </PressableWithHaptics>
            </View>
            <View style={[{ paddingBottom: 12 }]}>
              <SegmentedSelect value={mealType} options={mealTypeOptions} onValueChange={setMealType} />
            </View>
          </View>
          <TextInput placeholder="What's the place?" value={restaurantName} onChangeText={setRestaurantName} />
          <Button
            variant="primary"
            text={(payload as RPayload).defaultRestaurant ? 'Update' : 'Confirm'}
            style={{ marginTop: 16 }}
            onPress={handleRestaurantConfirm}
          />
        </View>
      ) : (
        <ScrollView stickyHeaderIndices={[0]} scrollEnabled={snapIndex === 1}>
          <View style={{ backgroundColor: colors.cream[100] }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 16 }}>
              <CalendarClock color="#4A3E36" size={20} strokeWidth={2.5} />
              <Text
                style={{
                  color: '#4A3E36',
                  fontFamily: 'Satoshi-Bold',
                  fontSize: 20,
                  lineHeight: 20 * 1.25,
                }}
              >
                {format(parseISO(payload.dateString), 'EEEE, MMM d')}
              </Text>
              <PressableWithHaptics onPress={handleRestaurantSwitch} style={{ marginLeft: 'auto' }} scaleTo={0.9}>
                <ChefHat color={colors.brown[900]} />
              </PressableWithHaptics>
            </View>
            <View style={[{ paddingBottom: 12 }]}>
              <SegmentedSelect value={mealType} options={mealTypeOptions} onValueChange={setMealType} />
            </View>
          </View>
          <View style={{ gap: 8, paddingBottom: 20 }}>
            {sortedRecipes.map((recipe) => (
              <Animated.View
                layout={LinearTransition.springify()}
                key={recipe.id}
                entering={FadeInDown.springify()}
                exiting={FadeOut}
              >
                <Recipe recipe={recipe} onPress={() => handleMealSelect(recipe)} />
              </Animated.View>
            ))}
          </View>
        </ScrollView>
      )}
    </BaseSheet>
  );
};
