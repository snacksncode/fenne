import { BaseSheet } from '@/components/bottomSheets/base-sheet';
import { Option, SegmentedSelect } from '@/components/Select';
import { Pancake } from '@/components/svgs/pancake';
import { Text } from '@/components/Text';
import { parseISO } from '@/date-tools';
import { ensure } from '@/utils';
import { BottomSheetModal, BottomSheetScrollView, useBottomSheetModal } from '@gorhom/bottom-sheet';
import { format } from 'date-fns';
import { CalendarClock, ChefHat, Ham, Salad } from 'lucide-react-native';
import { RefObject, useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';
import { RecipeDTO, recipesOptions, useRecipes } from '@/api/recipes';
import { useQueryClient } from '@tanstack/react-query';
import { useMount } from '@/hooks/use-mount';
import { Recipe } from '@/components/recipe';
import { colors } from '@/constants/colors';
import { MealType } from '@/api/schedules';
import { sort } from 'remeda';
import { PressableWithHaptics } from '@/components/pressable-with-feedback';

export type ScheduleMealSheetData = {
  dateString: string;
  mealType?: MealType;
};

type SheetProps = {
  ref: RefObject<BottomSheetModal<ScheduleMealSheetData> | null>;
  onMealSelect: (params: { meal: RecipeDTO; dateString: string; mealType: MealType }) => void;
  handleSwitchToRestaurant: (params: { dateString: string; defaultMealType: MealType }) => void;
};

type ContentProps = {
  dateString: string;
  defaultMealType: MealType | undefined;
  onMealSelect: (params: { meal: RecipeDTO; mealType: MealType }) => void;
  handleSwitchToRestaurant: (params: { dateString: string; defaultMealType: MealType }) => void;
};

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

const ScheduleMealSheetContent = ({
  dateString,
  defaultMealType,
  onMealSelect,
  handleSwitchToRestaurant,
}: ContentProps) => {
  const recipes = useRecipes();
  const insets = useSafeAreaInsets();
  const [mealType, setMealType] = useState<MealType>(defaultMealType ?? 'breakfast');
  const sortedRecipes = sort(
    recipes.data ?? [],
    (a, b) => getRecipeSortRank(b, mealType) - getRecipeSortRank(a, mealType)
  );

  return (
    <BottomSheetScrollView stickyHeaderIndices={[0]}>
      <View style={{ backgroundColor: colors.cream[100] }}>
        <View style={{ paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 16 }}>
          <CalendarClock color="#4A3E36" size={20} strokeWidth={2.5} />
          <Text
            style={{
              color: '#4A3E36',
              fontFamily: 'Satoshi-Bold',
              fontSize: 20,
              lineHeight: 20 * 1.25,
            }}
          >
            {format(parseISO(dateString), 'EEEE, MMM d')}
          </Text>
          <PressableWithHaptics
            onPress={() => handleSwitchToRestaurant({ dateString, defaultMealType: mealType })}
            style={{ marginLeft: 'auto' }}
            scaleTo={0.9}
          >
            <ChefHat color={colors.brown[900]} />
          </PressableWithHaptics>
        </View>
        <View style={[{ paddingHorizontal: 20, paddingBottom: 12 }]}>
          <SegmentedSelect value={mealType} options={mealTypeOptions} onValueChange={setMealType} />
        </View>
      </View>
      <View style={{ paddingHorizontal: 20, gap: 8, paddingBottom: insets.bottom }}>
        {sortedRecipes.map((recipe) => (
          <Animated.View
            layout={LinearTransition.springify()}
            key={recipe.id}
            entering={FadeInDown.springify()}
            exiting={FadeOut}
          >
            <Recipe recipe={recipe} onPress={() => onMealSelect({ meal: recipe, mealType })} />
          </Animated.View>
        ))}
      </View>
    </BottomSheetScrollView>
  );
};

export const ScheduleMealSheet = ({ ref, onMealSelect, handleSwitchToRestaurant }: SheetProps) => {
  const { dismissAll } = useBottomSheetModal();
  const queryClient = useQueryClient();
  const windowDimensions = useWindowDimensions();
  useMount(() => void queryClient.prefetchQuery(recipesOptions));

  return (
    <>
      <BaseSheet<ScheduleMealSheetData>
        ref={ref}
        backdropDismissBehavior="dismissAll"
        snapPoints={['60%']}
        maxDynamicContentSize={windowDimensions.height * 0.9}
      >
        {(props) => {
          const { dateString, mealType } = ensure(props.data);
          return (
            <ScheduleMealSheetContent
              dateString={dateString}
              defaultMealType={mealType}
              onMealSelect={({ meal, mealType: selectedMealType }) => {
                dismissAll();
                onMealSelect({ meal, dateString, mealType: selectedMealType });
              }}
              handleSwitchToRestaurant={handleSwitchToRestaurant}
            />
          );
        }}
      </BaseSheet>
    </>
  );
};
