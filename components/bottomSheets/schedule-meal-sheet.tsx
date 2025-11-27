import { BaseSheet } from '@/components/bottomSheets/base-sheet';
import { Option, SegmentedSelect } from '@/components/Select';
import { Ham } from '@/components/svgs/ham';
import { Pancake } from '@/components/svgs/pancake';
import { Salad } from '@/components/svgs/salad';
import { Text } from '@/components/Text';
import { parseISO } from '@/date-tools';
import { ensure } from '@/utils';
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { format } from 'date-fns';
import { CalendarClock } from 'lucide-react-native';
import { RefObject, useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Reanimated, { FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';
import { RecipeDTO, recipesOptions, useRecipes } from '@/api/recipes';
import { useQueryClient } from '@tanstack/react-query';
import { useMount } from '@/hooks/use-mount';
import { Recipe } from '@/components/recipe';
import { colors } from '@/constants/colors';
import { MealType } from '@/api/schedules';
import { sort } from 'remeda';

export type ScheduleMealSheetData = {
  dateString: string;
  mealType?: MealType;
};

type SheetProps = {
  ref: RefObject<BottomSheetModal<ScheduleMealSheetData> | null>;
  onMealSelect: (meal: RecipeDTO, date: string, meal_type: MealType) => void;
};

type ContentProps = {
  dateString: string;
  defaultMealType: MealType | undefined;
  onMealSelect: (meal: RecipeDTO, date: string, meal_type: MealType) => void;
};

const mealTypeOptions: Option<MealType>[] = [
  { value: 'breakfast', text: 'Breakfast', icon: Pancake },
  { value: 'lunch', text: 'Lunch', icon: Ham },
  { value: 'dinner', text: 'Dinner', icon: Salad },
];

const ScheduleMealSheetContent = ({ dateString, defaultMealType, onMealSelect }: ContentProps) => {
  const recipes = useRecipes();
  const insets = useSafeAreaInsets();
  const [mealType, setMealType] = useState<MealType>(defaultMealType ?? 'breakfast');

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
            {format(parseISO(dateString), 'EEEE, MMMM d')}
          </Text>
        </View>
        <View style={{ paddingHorizontal: 20, paddingBottom: 12 }}>
          <SegmentedSelect value={mealType} options={mealTypeOptions} onValueChange={setMealType} />
        </View>
      </View>
      <View style={{ paddingHorizontal: 20, gap: 8, paddingBottom: insets.bottom }}>
        {sort(recipes.data ?? [], (a, b) => {
          const aOnlyType = a.meal_types.length === 1 && a.meal_types.includes(mealType);
          const bOnlyType = b.meal_types.length === 1 && b.meal_types.includes(mealType);
          const aHasType = a.meal_types.includes(mealType);
          const bHasType = b.meal_types.includes(mealType);

          if (aOnlyType && !bOnlyType) return -1;
          if (!aOnlyType && bOnlyType) return 1;
          if (aHasType && !bHasType) return -1;
          if (!aHasType && bHasType) return 1;
          return 0;
        }).map((recipe) => (
          <Reanimated.View
            layout={LinearTransition.springify()}
            key={recipe.id}
            entering={FadeInDown.springify()}
            exiting={FadeOut}
          >
            <Recipe recipe={recipe} onPress={() => onMealSelect(recipe, dateString, mealType)} />
          </Reanimated.View>
        ))}
      </View>
    </BottomSheetScrollView>
  );
};

export const ScheduleMealSheet = ({ ref, onMealSelect }: SheetProps) => {
  const queryClient = useQueryClient();
  const windowDimensions = useWindowDimensions();
  useMount(() => void queryClient.prefetchQuery(recipesOptions));

  return (
    <BaseSheet<ScheduleMealSheetData>
      ref={ref}
      backdropDismissBehavior="dismissAll"
      snapPoints={['60%']}
      maxDynamicContentSize={windowDimensions.height * 0.9}
    >
      {(props) => (
        <ScheduleMealSheetContent
          dateString={ensure(props.data?.dateString)}
          defaultMealType={props.data?.mealType}
          onMealSelect={onMealSelect}
        />
      )}
    </BaseSheet>
  );
};
