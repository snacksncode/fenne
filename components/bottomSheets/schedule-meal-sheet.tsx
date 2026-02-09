import { BaseSheet } from '@/components/bottomSheets/base-sheet';
import { Option, SegmentedSelect } from '@/components/Select';
import { Pancake } from '@/components/svgs/pancake';
import { Typography } from '@/components/Typography';
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
import { colors } from '@/constants/colors';
import { MealType, useUpdateScheduleDay } from '@/api/schedules';
import { sort, isEmpty } from 'remeda';
import { PressableWithHaptics } from '@/components/pressable-with-feedback';
import { ensure } from '@/utils';
import { useRouter } from 'expo-router';
import { Button } from '@/components/button';

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
  const payload = ensure(props.payload);
  const recipes = useRecipes();
  const queryClient = useQueryClient();
  const updateScheduleDay = useUpdateScheduleDay();
  const router = useRouter();
  const [mealType, setMealType] = useState<MealType>(payload.mealType ?? 'breakfast');
  const [snapIndex, setSnapIndex] = useState(0);

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

  const handleRestaurantSwitch = async () => {
    await SheetManager.hide(props.sheetId);
    SheetManager.show('select-restaurant-sheet', { payload });
  };

  const handleGoToRecipes = async () => {
    await SheetManager.hide(props.sheetId);
    router.push('/recipes');
  };

  return (
    <BaseSheet onSnapIndexChange={setSnapIndex} id={props.sheetId} snapPoints={sortedRecipes.length > 4 ? [60] : [100]}>
      <ScrollView stickyHeaderIndices={[0]} scrollEnabled={snapIndex === 1}>
        <View style={{ backgroundColor: colors.cream[100] }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 16 }}>
            <CalendarClock color="#4A3E36" size={20} strokeWidth={2.5} />
            <Typography variant="heading-sm" weight="bold">
              {format(parseISO(payload.dateString), 'EEEE, MMM d')}
            </Typography>
            <PressableWithHaptics onPress={handleRestaurantSwitch} style={{ marginLeft: 'auto' }} scaleTo={0.9}>
              <ChefHat color={colors.brown[900]} />
            </PressableWithHaptics>
          </View>
          {!isEmpty(sortedRecipes) && (
            <View style={[{ paddingBottom: 12 }]}>
              <SegmentedSelect value={mealType} options={mealTypeOptions} onValueChange={setMealType} />
            </View>
          )}
        </View>
        <View style={{ gap: 8, paddingBottom: 20 }}>
          {isEmpty(sortedRecipes) ? (
            <View
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 40,
                gap: 12,
              }}
            >
              <BookMarked size={48} color={colors.brown[900]} strokeWidth={1.5} />
              <View style={{ alignItems: 'center', gap: 4 }}>
                <Typography variant="body-lg" weight="bold" style={{ textAlign: 'center' }}>
                  No recipes found
                </Typography>
                <Typography variant="body-sm" weight="medium" style={{ textAlign: 'center', marginBottom: 8 }}>
                  Add some recipes to start planning your meals
                </Typography>
              </View>
              <Button variant="primary" text="Go to Recipes" onPress={handleGoToRecipes} />
            </View>
          ) : (
            sortedRecipes.map((recipe) => (
              <Animated.View
                layout={LinearTransition.springify()}
                key={recipe.id}
                entering={FadeInDown.springify()}
                exiting={FadeOut}
              >
                <Recipe recipe={recipe} onPress={() => handleMealSelect(recipe)} />
              </Animated.View>
            ))
          )}
        </View>
      </ScrollView>
    </BaseSheet>
  );
};
