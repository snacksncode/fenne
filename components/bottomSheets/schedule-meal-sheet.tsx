import { recipes } from '@/app/(tabs)/recipes';
import { BaseSheet } from '@/components/bottomSheets/base-sheet';
import { Recipe, RecipeDTO } from '@/components/recipe';
import { Option, SegmentedSelect } from '@/components/Select';
import { Ham } from '@/components/svgs/ham';
import { Pancake } from '@/components/svgs/pancake';
import { Salad } from '@/components/svgs/salad';
import { Text } from '@/components/Text';
import { parseDateString } from '@/date-tools';
import { ensure } from '@/utils';
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { format } from 'date-fns';
import { CalendarClock } from 'lucide-react-native';
import { RefObject, useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Reanimated, { FadeInDown, FadeOut } from 'react-native-reanimated';
import { MealType } from '@/components/menu/weekly-screen';

export type ScheduleMealSheetData = {
  dateString: string;
  mealType?: MealType;
};

type SheetProps = {
  ref: RefObject<BottomSheetModal<ScheduleMealSheetData> | null>;
  onMealSelect: (meal: RecipeDTO) => void;
};

type ContentProps = {
  dateString: string;
  defaultMealType: MealType | undefined;
  onMealSelect: (meal: RecipeDTO) => void;
};

const mealTypeOptions: Option<MealType>[] = [
  { value: 'breakfast', text: 'Breakfast', icon: Pancake },
  { value: 'lunch', text: 'Lunch', icon: Ham },
  { value: 'dinner', text: 'Dinner', icon: Salad },
];

const ScheduleMealSheetContent = ({ dateString, defaultMealType, onMealSelect }: ContentProps) => {
  const insets = useSafeAreaInsets();
  const [mealType, setMealType] = useState<MealType>(defaultMealType ?? 'breakfast');

  return (
    <>
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
          {format(parseDateString(dateString), 'EEEE, MMMM d')}
        </Text>
      </View>
      <View style={{ paddingHorizontal: 20, paddingBottom: 12 }}>
        <SegmentedSelect value={mealType} options={mealTypeOptions} onValueChange={setMealType} />
      </View>
      <BottomSheetScrollView>
        <View style={{ paddingHorizontal: 20, gap: 8, paddingBottom: insets.bottom }}>
          {recipes
            .filter((recipe) => recipe.type === mealType)
            .map((recipe, index) => (
              <Reanimated.View
                key={recipe.name + recipe.type}
                entering={FadeInDown.springify().delay(index * 30)}
                exiting={FadeOut.duration(100)}
              >
                <Recipe recipe={recipe} onPress={() => onMealSelect(recipe)} />
              </Reanimated.View>
            ))}
        </View>
      </BottomSheetScrollView>
    </>
  );
};

export const ScheduleMealSheet = ({ ref, onMealSelect }: SheetProps) => {
  return (
    <BaseSheet<ScheduleMealSheetData>
      ref={ref}
      backdropDismissBehavior="dismissAll"
      enableDynamicSizing={false}
      snapPoints={[500]}
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
