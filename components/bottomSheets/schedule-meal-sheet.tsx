import { BaseSheet } from '@/components/bottomSheets/base-sheet';
import { Pancake } from '@/components/svgs/pancake';
import { Typography } from '@/components/Typography';
import { parseISO } from '@/date-tools';
import { SheetManager, SheetProps, ScrollView } from 'react-native-actions-sheet';
import { format } from 'date-fns';
import {
  BookMarked,
  CalendarClock,
  Check,
  ChefHat,
  ChevronLeft,
  Funnel,
  Ham,
  Plus,
  Salad,
} from 'lucide-react-native';
import { FunctionComponent, useEffect, useRef, useState } from 'react';
import { Keyboard, ScrollView as RNScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
  SlideInDown,
  SlideOutDown,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import { recipesOptions, useRecipes } from '@/api/recipes';
import { useQueryClient } from '@tanstack/react-query';
import { useMount } from '@/hooks/use-mount';
import { Recipe } from '@/components/recipe';
import { colors } from '@/constants/colors';
import { RecipeDTO, MealType } from '@/api/types';
import { useUpdateScheduleDay } from '@/api/schedules';
import { isEmpty } from 'remeda';
import { PressableWithHaptics } from '@/components/pressable-with-feedback';
import { ensure } from '@/utils';
import { useRouter } from 'expo-router';
import { Button } from '@/components/button';
import { sortRecipes, filterRecipes } from '@/utils/recipe-utils';
import { useSheetClosing } from '@/hooks/use-sheet-closing';
import { TextInput } from '@/components/input';
import { MealFilter } from '@/components/bottomSheets/recipe-filter-sheet';

type MealTypeOption = {
  value: MealType;
  label: string;
  icon: FunctionComponent<{ size: number; color: string }>;
};

const mealTypeOptions: MealTypeOption[] = [
  { value: 'breakfast', label: 'Breakfast', icon: Pancake },
  { value: 'lunch', label: 'Lunch', icon: Ham },
  { value: 'dinner', label: 'Dinner', icon: Salad },
];

const MealTypeButton = ({
  option,
  onPress,
  isSelected,
}: {
  option: MealTypeOption;
  onPress: () => void;
  isSelected: boolean;
}) => {
  const Icon = option.icon;
  return (
    <PressableWithHaptics onPress={onPress} scaleTo={0.95}>
      <View style={[styles.mealTypeButton, isSelected && styles.mealTypeButtonSelected]}>
        <Icon size={24} color={isSelected ? colors.cream[50] : colors.brown[900]} />
        <Typography variant="body-base" weight="bold" color={isSelected ? colors.cream[50] : colors.brown[900]}>
          {option.label}
        </Typography>
      </View>
    </PressableWithHaptics>
  );
};

export const ScheduleMealSheet = (props: SheetProps<'schedule-meal-sheet'>) => {
  const payload = ensure(props.payload);
  const recipes = useRecipes();
  const queryClient = useQueryClient();
  const updateScheduleDay = useUpdateScheduleDay();
  const router = useRouter();
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { height: keyboardHeight } = useReanimatedKeyboardAnimation();
  const toolbarStyle = useAnimatedStyle(() => ({
    bottom: Math.max(insets.bottom - 8, -keyboardHeight.value + 12),
  }));

  const [mode, setMode] = useState<'meal' | 'restaurant'>(payload.type);

  const initialMealType = (() => {
    if (payload.type === 'meal') return payload.mealType;
    return payload.defaultMealType;
  })();

  const [mealType, setMealType] = useState(initialMealType);
  const originalMealType = useRef(initialMealType);

  const [step, setStep] = useState<'select-type' | 'select-meal'>(() => {
    return initialMealType ? 'select-meal' : 'select-type';
  });

  const scrollRef = useRef<RNScrollView>(null);
  const [search, setSearch] = useState('');
  const [mealFilter, setMealFilter] = useState<MealFilter>('all');
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardWillShow', () => setKeyboardOpen(true));
    const hideSub = Keyboard.addListener('keyboardWillHide', () => setKeyboardOpen(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const [restaurant, setRestaurant] = useState(() => {
    return payload.type === 'restaurant' ? (payload.defaultRestaurant ?? '') : '';
  });

  const { isClosing, onBeforeClose } = useSheetClosing();

  useMount(() => void queryClient.prefetchQuery(recipesOptions));

  const isEditingRestaurant = payload.type === 'restaurant' && !!payload.defaultRestaurant;

  const getSwapCleanup = () => {
    if (originalMealType.current && originalMealType.current !== mealType) {
      return { [originalMealType.current]: null };
    }
    return {};
  };

  const handleMealSelect = (meal: RecipeDTO) => {
    const type = ensure(mealType);
    updateScheduleDay.mutate({
      dateString: payload.dateString,
      [type]: { type: 'recipe', recipe_id: meal.id },
      ...getSwapCleanup(),
    });
    SheetManager.hideAll();
  };

  const handleRestaurantConfirm = () => {
    const type = ensure(mealType);
    updateScheduleDay.mutate({
      dateString: payload.dateString,
      [type]: { type: 'dining_out', name: restaurant },
      ...getSwapCleanup(),
    });
    Keyboard.dismiss();
    SheetManager.hideAll();
  };

  const handleGoToRecipes = async () => {
    await SheetManager.hide(props.sheetId);
    router.push('/recipes');
  };

  const handleNewRecipe = async () => {
    await SheetManager.hide(props.sheetId);
    router.push('/new-recipe');
  };

  const openFilterSheet = async () => {
    const result = await SheetManager.show('recipe-filter-sheet', { payload: { current: mealFilter } });
    if (result != null) {
      setMealFilter(result);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  const handleMealTypePick = (type: MealType) => {
    setMealType(type);
    setStep('select-meal');
  };

  const filteredRecipes = filterRecipes(recipes.data ?? [], { search: search || undefined, mealFilter });
  const sortedRecipes = sortRecipes(filteredRecipes, mealType ?? undefined);
  const hasRecipes = !isEmpty(recipes.data ?? []);

  return (
    <BaseSheet
      id={props.sheetId}
      onBeforeClose={onBeforeClose}
      extraOverlay={
        hasRecipes && !isClosing && step === 'select-meal' && mode === 'meal' ? (
          <Animated.View
            entering={SlideInDown.springify()}
            exiting={SlideOutDown.springify()}
            style={[styles.toolbar, toolbarStyle]}
          >
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search recipes..."
              style={styles.searchInput}
            />
            <Button
              onPress={openFilterSheet}
              variant={mealFilter !== 'all' ? 'primary' : 'outlined'}
              leftIcon={{ Icon: Funnel }}
              style={{ paddingHorizontal: 0, width: 48 }}
            />
            {keyboardOpen ? (
              <Button onPress={() => Keyboard.dismiss()} variant="secondary" leftIcon={{ Icon: Check }} />
            ) : (
              <Button onPress={handleNewRecipe} variant="primary" leftIcon={{ Icon: Plus }} />
            )}
          </Animated.View>
        ) : undefined
      }
    >
      <BaseSheet.Container noBottomGutter={step === 'select-meal' && mode === 'meal'}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 16 }}>
          {step === 'select-meal' && (
            <PressableWithHaptics
              onPress={() => {
                setStep('select-type');
                setSearch('');
              }}
              scaleTo={0.85}
              style={{ marginRight: 4 }}
            >
              <ChevronLeft color={colors.brown[900]} size={22} />
            </PressableWithHaptics>
          )}
          {mode === 'meal' ? (
            <>
              <CalendarClock color="#4A3E36" size={20} strokeWidth={2.5} />
              <Typography variant="heading-sm" weight="bold">
                {format(parseISO(payload.dateString), 'EEEE, MMM d')}
              </Typography>
              <PressableWithHaptics onPress={() => setMode('restaurant')} style={{ marginLeft: 'auto' }} scaleTo={0.9}>
                <ChefHat color={colors.brown[900]} />
              </PressableWithHaptics>
            </>
          ) : (
            <>
              <ChefHat color="#4A3E36" size={20} strokeWidth={2.5} />
              <Typography variant="heading-sm" weight="bold">
                {isEditingRestaurant ? 'Edit dining out?' : 'Dining out?'}
              </Typography>
              <PressableWithHaptics onPress={() => setMode('meal')} style={{ marginLeft: 'auto' }} scaleTo={0.9}>
                <BookMarked color={colors.brown[900]} />
              </PressableWithHaptics>
            </>
          )}
        </View>

        {/* Step 1: Meal type selection */}
        {step === 'select-type' && (
          <View style={{ gap: 8 }}>
            {mealTypeOptions.map((option) => (
              <MealTypeButton
                key={option.value}
                option={option}
                isSelected={mealType === option.value}
                onPress={() => handleMealTypePick(option.value)}
              />
            ))}
          </View>
        )}

        {/* Step 2: Recipe list or restaurant input */}
        {step === 'select-meal' &&
          (mode === 'meal' ? (
            <ScrollView
              ref={scrollRef}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              style={{ maxHeight: windowHeight * 0.5 }}
            >
              <View style={{ gap: 8, paddingBottom: hasRecipes ? 88 : 0 }}>
                {isEmpty(sortedRecipes) ? (
                  <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 12 }}>
                    <BookMarked size={48} color={colors.brown[900]} strokeWidth={1.5} />
                    <View style={{ alignItems: 'center', gap: 4 }}>
                      <Typography variant="body-lg" weight="bold" style={{ textAlign: 'center' }}>
                        {search ? 'No recipes match your search' : 'No recipes found'}
                      </Typography>
                      <Typography variant="body-sm" weight="medium" style={{ textAlign: 'center', marginBottom: 8 }}>
                        {search ? 'Try a different search term' : 'Add some recipes to start planning your meals'}
                      </Typography>
                    </View>
                    {!search && <Button variant="primary" text="Go to Recipes" onPress={handleGoToRecipes} />}
                  </View>
                ) : (
                  sortedRecipes.map((recipe) => (
                    <Animated.View
                      layout={LinearTransition.springify()}
                      key={recipe.id}
                      entering={FadeIn}
                      exiting={FadeOut}
                    >
                      <Recipe recipe={recipe} onPress={() => handleMealSelect(recipe)} />
                    </Animated.View>
                  ))
                )}
              </View>
            </ScrollView>
          ) : (
            <View>
              <TextInput placeholder="What's the place?" value={restaurant} onChangeText={setRestaurant} />
              <Button
                variant="primary"
                text={isEditingRestaurant ? 'Update' : 'Confirm'}
                style={{ marginTop: 16 }}
                onPress={handleRestaurantConfirm}
              />
            </View>
          ))}
      </BaseSheet.Container>
    </BaseSheet>
  );
};

const styles = StyleSheet.create({
  mealTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderBottomWidth: 2,
    borderColor: colors.brown[900],
    backgroundColor: colors.cream[50],
  },
  mealTypeButtonSelected: {
    backgroundColor: colors.brown[900],
  },
  toolbar: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 2,
    borderBottomWidth: 3,
    color: colors.brown[900],
  },
});
