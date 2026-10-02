import { BaseSheet } from '@/components/bottomSheets/base-sheet';
import { Pancake } from '@/components/svgs/pancake';
import { Typography } from '@/components/Typography';
import { parseISO } from '@/date-tools';
import { SheetProps, useSheets } from '@/lib/sheet-context';
import { format } from 'date-fns';
import { BookMarked, CalendarClock, Check, ChefHat, ChevronLeft, Funnel, Ham, Plus, Salad } from 'lucide-react-native';
import { FunctionComponent, useRef, useState } from 'react';
import { Keyboard, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { useRecipes } from '@/api/recipes';
import { Recipe } from '@/components/recipe';
import { colors } from '@/constants/colors';
import { RecipeDTO, MealType, ScheduleMealEntry } from '@/api/types';
import { useUpdateScheduleDay } from '@/api/schedules';
import { isEmpty } from 'remeda';
import { PressableWithHaptics } from '@/components/pressable-with-feedback';
import { ensure } from '@/utils';
import { useRouter } from 'expo-router';
import { Button } from '@/components/button';
import { useRecipeSearch } from '@/hooks/use-recipe-search';
import { TextInput } from '@/components/input';
import { MealFilter } from '@/components/bottomSheets/recipe-filter-sheet';
import { useKeyboardOpen } from '@/hooks/use-keyboard-open';
import { useAppForm } from '@/components/form/app-form';
import { z } from 'zod';
import { useFormFeedback } from '@/components/form/use-form-feedback';
import { requestErrorMessage } from '@/api/errors';

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

const diningOutSchema = z.object({
  restaurant: z.string().trim().min(1, 'Place is required'),
});

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

export const ScheduleMealSheet = ({ sheetId, data: sheetData }: SheetProps<'schedule-meal-sheet'>) => {
  const sheets = useSheets();
  const recipes = useRecipes();
  const updateScheduleDay = useUpdateScheduleDay();
  const router = useRouter();
  const [mode, setMode] = useState<'meal' | 'restaurant'>(sheetData.type);
  const feedback = useFormFeedback(['restaurant'] as const);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const saving = useRef(false);

  const initialMealType = sheetData.type === 'meal' ? sheetData.mealType : sheetData.defaultMealType;

  const [mealType, setMealType] = useState(initialMealType);
  const originalMealType = useRef(initialMealType);

  const [step, setStep] = useState<'select-type' | 'select-meal'>(() => {
    return initialMealType ? 'select-meal' : 'select-type';
  });

  const scrollRef = useRef<ScrollView>(null);
  const [search, setSearch] = useState('');
  const [mealFilter, setMealFilter] = useState<MealFilter>('all');
  const { isKeyboardOpen } = useKeyboardOpen();

  const saveMeal = async (entry: ScheduleMealEntry) => {
    if (saving.current) return;
    saving.current = true;
    try {
      const type = ensure(mealType);
      await updateScheduleDay.mutateAsync({
        dateString: sheetData.dateString,
        [type]: entry,
        ...(originalMealType.current && originalMealType.current !== type && { [originalMealType.current]: null }),
      });
      Keyboard.dismiss();
      await sheets.dismissAll();
    } finally {
      saving.current = false;
    }
  };

  const restaurantForm = useAppForm({
    defaultValues: {
      restaurant: sheetData.type === 'restaurant' ? (sheetData.defaultRestaurant ?? '') : '',
    },
    validators: { onSubmit: diningOutSchema },
    listeners: { onChange: ({ formApi }) => feedback.clearServerErrors(formApi) },
    onSubmitInvalid: ({ formApi }) => feedback.focusInvalid(formApi),
    onSubmit: async ({ value, formApi }) => {
      feedback.clearServerErrors(formApi);
      try {
        await saveMeal({ type: 'dining_out', name: value.restaurant.trim() });
      } catch (error) {
        feedback.reportError(formApi, error, 'Could not save this meal. Try again.', { name: 'restaurant', breakfast: 'restaurant', lunch: 'restaurant', dinner: 'restaurant' });
      }
    },
  });

  const isEditingRestaurant = sheetData.type === 'restaurant' && !!sheetData.defaultRestaurant;

  const handleMealSelect = async (meal: RecipeDTO) => {
    setSelectionError(null);
    try {
      await saveMeal({ type: 'recipe', recipe_id: meal.id });
    } catch (error) {
      setSelectionError(requestErrorMessage(error, 'Could not schedule this recipe. Try again.'));
    }
  };

  const handleGoToRecipes = async () => {
    await sheets.dismiss(sheetId);
    router.push('/recipes');
  };

  const handleNewRecipe = async () => {
    await sheets.dismiss(sheetId);
    router.push('/new-recipe');
  };

  const openFilterSheet = async () => {
    const filter = await sheets.present('recipe-filter-sheet', {
      data: {
        current: mealFilter,
      },
    });
    if (filter != null) {
      setMealFilter(filter);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  const handleMealTypePick = (type: MealType) => {
    setMealType(type);
    setStep('select-meal');
  };

  const sortedRecipes = useRecipeSearch(recipes.data, { search, mealFilter, mealType: mealType ?? undefined });
  const hasRecipes = !isEmpty(recipes.data ?? []);
  const isRecipeListStep = step === 'select-meal' && mode === 'meal' && hasRecipes;

  return (
    <BaseSheet
      id={sheetId}
      dismissible={!updateScheduleDay.isPending}
      draggable={!updateScheduleDay.isPending}
      sizing={isRecipeListStep ? { type: 'scrollable', detents: [0.5, 1] } : { type: 'auto' }}
      footer={
        isRecipeListStep
          ? (
              <View style={styles.toolbar}>
                <TextInput
                  variant="search"
                  editable={!updateScheduleDay.isPending}
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search recipes..."
                  style={styles.searchInput}
                />
                <Button
                  accessibilityLabel="Filter recipes"
                  disabled={updateScheduleDay.isPending}
                  onPress={openFilterSheet}
                  variant={mealFilter !== 'all' ? 'primary' : 'outlined'}
                  leftIcon={{ Icon: Funnel }}
                  style={{ paddingHorizontal: 0, width: 48 }}
                />
                {isKeyboardOpen ? (
                  <Button
                    accessibilityLabel="Close keyboard"
                    onPress={() => Keyboard.dismiss()}
                    variant="secondary"
                    leftIcon={{ Icon: Check }}
                  />
                ) : (
                  <Button
                    accessibilityLabel="Add recipe"
                    disabled={updateScheduleDay.isPending}
                    onPress={handleNewRecipe}
                    variant="primary"
                    leftIcon={{ Icon: Plus }}
                  />
                )}
              </View>
            )
          : undefined
      }
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 16 }}>
        {step === 'select-meal' && (
          <PressableWithHaptics
            disabled={updateScheduleDay.isPending}
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
            <CalendarClock color={colors.brown[900]} size={20} strokeWidth={2.5} />
            <Typography variant="heading-sm" weight="bold">
              {format(parseISO(sheetData.dateString), 'EEEE, MMM d')}
            </Typography>
            <PressableWithHaptics disabled={updateScheduleDay.isPending} onPress={() => setMode('restaurant')} style={{ marginLeft: 'auto' }} scaleTo={0.9}>
              <ChefHat color={colors.brown[900]} />
            </PressableWithHaptics>
          </>
        ) : (
          <>
            <ChefHat color={colors.brown[900]} size={20} strokeWidth={2.5} />
            <Typography variant="heading-sm" weight="bold">
              {isEditingRestaurant ? 'Edit dining out?' : 'Dining out?'}
            </Typography>
            <PressableWithHaptics disabled={updateScheduleDay.isPending} onPress={() => setMode('meal')} style={{ marginLeft: 'auto' }} scaleTo={0.9}>
              <BookMarked color={colors.brown[900]} />
            </PressableWithHaptics>
          </>
        )}
      </View>

      {mode === 'meal' && selectionError && (
        <View accessible accessibilityRole="alert" style={{ marginBottom: 12 }}>
          <Typography variant="body-sm" weight="medium" color={colors.red[500]}>{selectionError}</Typography>
        </View>
      )}
      {updateScheduleDay.isPending && (
        <Typography variant="body-sm" weight="medium" accessibilityLiveRegion="polite" style={{ marginBottom: 12 }}>Saving meal…</Typography>
      )}

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
          >
            <View style={{ gap: 8, paddingBottom: hasRecipes ? 88 : 0 }} pointerEvents={updateScheduleDay.isPending ? 'none' : 'auto'}>
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
          <restaurantForm.AppForm>
            <View style={{ gap: 16 }}>
              <restaurantForm.AppField name="restaurant">
                {(field) => <field.TextField ref={feedback.inputRef('restaurant')} editable={!updateScheduleDay.isPending} placeholder="What's the place?" accessibilityLabel="Place" />}
              </restaurantForm.AppField>
              <restaurantForm.Error message={feedback.error} />
              <restaurantForm.SubmitButton variant="primary" text={isEditingRestaurant ? 'Update' : 'Confirm'} />
            </View>
          </restaurantForm.AppForm>
        ))}
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
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    color: colors.brown[900],
  },
});
