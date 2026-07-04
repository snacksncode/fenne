import { useAddRecipe, useEditRecipe } from '@/api/recipes';
import { RecipeDTO, RecipeFormData, recipeFromFormData, recipeToFormData, IngredientFormData, MealType } from '@/api/types';
import { Button } from '@/components/button';
import { useAppForm } from '@/components/form/app-form';
import { Pancake } from '@/components/svgs/pancake';
import { useNavigation } from 'expo-router/react-navigation';
import { ChevronLeft, Ham, Salad, CirclePlus, CookingPot, Trash2, Save } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import { View, StyleSheet, Pressable, Keyboard, StyleProp, ViewStyle } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Typography } from '@/components/Typography';
import { TextInput as TextInputType } from 'react-native-gesture-handler';
import { NotesEditor } from '@/components/notes-editor';
import { EnrichedTextInputInstance } from 'react-native-enriched-html';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSheets } from '@/lib/sheet-context';
import Animated, {
  Extrapolation,
  FadeOut,
  FadeIn,
  interpolate,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  SharedValue,
} from 'react-native-reanimated';
import ReanimatedSwipeable, { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import { scheduleOnUI } from 'react-native-worklets';
import { isEmpty, isEmptyish } from 'remeda';
import { colors } from '@/constants/colors';
import { useMount } from '@/hooks/use-mount';
import { UNITS } from '@/components/bottomSheets/select-unit-sheet';
import { PressableWithHaptics } from '@/components/pressable-with-feedback';
import { parseLocaleFloat } from '@/utils';
import { tempId } from '@/api/optimistic';
import { z } from 'zod';

const SCREEN_TRANSITION_DURATION_MS = 600;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const RightActions = (props: { progress: SharedValue<number>; onDelete: () => void }) => {
  const [width, setWidth] = useState(0);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(props.progress.value, [0, 1], [width, 0], Extrapolation.CLAMP) }],
  }));

  return (
    <Animated.View
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={[styles.deleteActionContainer, animatedStyle]}
    >
      <Button size="small" variant="secondary" onPress={props.onDelete} text="Delete" leftIcon={{ Icon: Trash2 }} />
    </Animated.View>
  );
};

const IngredientItem = ({
  ingredient,
  onEdit,
  onDelete,
  style,
}: {
  ingredient: IngredientFormData;
  style: StyleProp<ViewStyle>;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  const swipeRef = useRef<SwipeableMethods>(null);
  const scale = useSharedValue(1);
  const scaleStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const displayName = ingredient.name_override?.trim() || ingredient.product?.name || ingredient.productDraft?.name || ingredient.name;

  const closeSwipeable = () => swipeRef.current?.close();

  const handleEdit = () => {
    closeSwipeable();
    onEdit();
  };

  return (
    <AnimatedPressable
      onPressIn={() => scheduleOnUI(() => (scale.value = withSpring(0.95)))}
      onPressOut={() => scheduleOnUI(() => (scale.value = withSpring(1)))}
      onPress={handleEdit}
      layout={LinearTransition.springify()}
      exiting={FadeOut}
      entering={FadeIn}
      style={style}
    >
      <ReanimatedSwipeable
        ref={swipeRef}
        friction={1.5}
        rightThreshold={20}
        renderRightActions={(progress) => <RightActions progress={progress} onDelete={onDelete} />}
        childrenContainerStyle={{
          flexDirection: 'row',
          gap: 12,
          paddingHorizontal: 16,
          paddingVertical: 12,
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Animated.View style={scaleStyle}>
          <Typography variant="body-base" weight="bold" color={colors.brown[900]}>
            {displayName}
          </Typography>
          {ingredient.product && ingredient.product.name !== displayName && (
            <Typography variant="body-xs" weight="medium" color="#867a6e" style={{ marginTop: 2 }}>
              Item: {ingredient.product.name}
            </Typography>
          )}
          {ingredient.quantity && (
            <Typography variant="body-xs" weight="medium" color="#867a6e" style={{ marginTop: 2 }}>
              {ingredient.quantity}{' '}
              {UNITS.find((u) => u.value === ingredient.unit)?.label({ count: parseLocaleFloat(ingredient.quantity) })}
            </Typography>
          )}
        </Animated.View>
      </ReanimatedSwipeable>
    </AnimatedPressable>
  );
};

const EmptyIngredientsList = () => (
  <View
    style={{
      backgroundColor: '#FEF4E2',
      padding: 16,
      paddingBottom: 20,
      borderRadius: 8,
      borderColor: '#D1C5B3',
      borderStyle: 'dashed',
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
      height: 125,
    }}
  >
    <CookingPot size={24} color="#4A3E36" />
    <Typography variant="body-base" weight="black" color={colors.brown[900]} style={{ marginTop: 8 }}>
      No ingredients
    </Typography>
    <Typography variant="body-sm" weight="bold" color={colors.brown[800]}>
      Tap to add one
    </Typography>
  </View>
);

const IngredientsList = ({
  ingredients,
  handleAddIngredient,
  onIngredientEdit,
  onIngredientDelete,
}: {
  ingredients: IngredientFormData[];
  handleAddIngredient: () => void;
  onIngredientEdit: (ingredient: IngredientFormData) => void;
  onIngredientDelete: (ingredient: IngredientFormData) => void;
}) => {
  if (isEmpty(ingredients)) {
    return (
      <PressableWithHaptics onPress={handleAddIngredient}>
        <EmptyIngredientsList />
      </PressableWithHaptics>
    );
  }

  return (
    <View>
      {!isEmpty(ingredients) ? (
        <Animated.View
          style={{
            backgroundColor: '#FEF2DD',
            borderWidth: 1,
            borderBottomWidth: 2,
            borderColor: colors.brown[900],
            borderRadius: 8,
            overflow: 'hidden',
          }}
          layout={LinearTransition.springify()}
          exiting={FadeOut}
          entering={FadeIn}
        >
          {ingredients.map((ingredient, index) => (
            <React.Fragment key={ingredient.id}>
              <IngredientItem
                style={index > 0 ? { borderColor: colors.brown[900], borderTopWidth: 1 } : undefined}
                ingredient={ingredient}
                onEdit={() => onIngredientEdit(ingredient)}
                onDelete={() => onIngredientDelete(ingredient)}
              />
            </React.Fragment>
          ))}
        </Animated.View>
      ) : null}
    </View>
  );
};

const emptyRecipeFormData: RecipeFormData = {
  id: tempId(),
  name: '',
  ingredients: [],
  liked: false,
  meal_types: [],
  notes: '',
  time_in_minutes: '',
};

const validIngredient = (ingredient: IngredientFormData) => {
  if (parseLocaleFloat(ingredient.quantity) <= 0) return false;
  if (ingredient.product_id || ingredient.productDraft) return true;
  return false;
};

const recipeSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1, 'Name is required'),
  ingredients: z.custom<IngredientFormData[]>().refine((ingredients) => ingredients.length > 0, 'Add at least one ingredient')
    .refine((ingredients) => ingredients.every(validIngredient), 'Every ingredient needs an item and quantity'),
  liked: z.boolean(),
  meal_types: z.custom<MealType[]>().refine((mealTypes) => mealTypes.length > 0, 'Pick at least one meal type'),
  notes: z.string(),
  time_in_minutes: z.string().refine((value) => {
    const time = parseLocaleFloat(value);
    return Number.isFinite(time) && time > 0;
  }, 'Cooking time is required'),
});

export function RecipeForm({ recipe, mode = recipe ? 'edit' : 'create' }: { recipe?: RecipeDTO; mode?: 'create' | 'edit' }) {
  const navigation = useNavigation();
  const sheets = useSheets();
  const nameInputRef = useRef<TextInputType>(null);
  const notesEditorRef = useRef<EnrichedTextInputInstance>(null);
  const insets = useSafeAreaInsets();
  const editRecipe = useEditRecipe();
  const addRecipe = useAddRecipe();
  const form = useAppForm({
    defaultValues: recipe ? recipeToFormData(recipe) : emptyRecipeFormData,
    validators: {
      onSubmit: recipeSchema,
    },
    onSubmit: async ({ value }) => {
      Keyboard.dismiss();
      const notes = ((await notesEditorRef.current?.getHTML()) ?? '')
        .replaceAll(/<h[456]>/g, '<p>')
        .replaceAll(/<\/h[456]>/g, '</p>');

      const handleSuccess = () => navigation.goBack();
      const recipeData = recipeFromFormData({ ...value, notes });
      if (recipe) return editRecipe.mutate({ ...recipeData, id: recipe.id }, { onSuccess: handleSuccess });
      addRecipe.mutate(recipeData, { onSuccess: handleSuccess });
    },
  });

  useMount(() => {
    const id = setTimeout(() => {
      if (isEmptyish(form.state.values.name)) nameInputRef.current?.focus();
    }, SCREEN_TRANSITION_DURATION_MS);
    return () => clearTimeout(id);
  });

  const handleSaveIngredient = (ingredient: IngredientFormData) => {
    const { ingredients } = form.state.values;
    const existingIngredient = ingredients.find((item) => item.id === ingredient.id);
    form.setFieldValue(
      'ingredients',
      existingIngredient ? ingredients.map((item) => (item.id !== ingredient.id ? item : ingredient)) : [...ingredients, ingredient]
    );
  };

  const handleAddIngredient = async () => {
    Keyboard.dismiss();
    notesEditorRef.current?.blur();
    const ingredient = await sheets.present('edit-ingredient-sheet', { data: { mode } });
    if (ingredient != null) handleSaveIngredient(ingredient);
  };

  const handleEditIngredient = async (ingredient: IngredientFormData) => {
    Keyboard.dismiss();
    notesEditorRef.current?.blur();
    const updatedIngredient = await sheets.present('edit-ingredient-sheet', { data: { mode, ingredient } });
    if (updatedIngredient != null) handleSaveIngredient(updatedIngredient);
  };

  const handleDeleteIngredient = (ingredient: IngredientFormData) => {
    form.setFieldValue(
      'ingredients',
      form.state.values.ingredients.filter((item) => item.id !== ingredient.id)
    );
  };

  const toggleMealType = (mealType: MealType) => {
    const { meal_types } = form.state.values;
    form.setFieldValue(
      'meal_types',
      meal_types.includes(mealType) ? meal_types.filter((type) => type !== mealType) : [...meal_types, mealType]
    );
  };

  const handleSubmit = async () => {
    await form.handleSubmit();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <Pressable
        onPress={() => navigation.goBack()}
        style={{
          marginBottom: 16,
          marginLeft: -8,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <ChevronLeft />
        <Typography variant="heading-sm" weight="bold" color="#4A3E36">
          {recipe ? 'Edit Recipe' : 'New Recipe'}
        </Typography>
      </Pressable>
      <KeyboardAwareScrollView
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ gap: 16, paddingBottom: 20 }}
        bottomOffset={150}
      >
        <form.AppForm>
          <form.AppField name="name">
            {(field) => <field.TextField ref={nameInputRef} label="Name" placeholder="e.g. Avocado Toast" />}
          </form.AppField>
          <form.AppField name="time_in_minutes">
            {(field) => <field.NumberField label="Cooking time (in minutes)" placeholder="e.g. 30" />}
          </form.AppField>
          <form.Subscribe selector={(state) => state.values.meal_types}>
            {(mealTypes) => (
              <View>
                <Typography variant="body-sm" weight="bold" color="#4A3E36" style={{ marginBottom: 4 }}>
                  Meal type
                </Typography>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Button
                    onPress={() => toggleMealType('breakfast')}
                    leftIcon={{ Icon: Pancake }}
                    text="Breakfast"
                    variant={mealTypes.includes('breakfast') ? 'primary' : 'outlined'}
                    size="small"
                    style={{ flex: 1 }}
                  />
                  <Button
                    onPress={() => toggleMealType('lunch')}
                    leftIcon={{ Icon: Salad }}
                    text="Lunch"
                    variant={mealTypes.includes('lunch') ? 'primary' : 'outlined'}
                    size="small"
                    style={{ flex: 1 }}
                  />
                  <Button
                    onPress={() => toggleMealType('dinner')}
                    leftIcon={{ Icon: Ham }}
                    text="Dinner"
                    variant={mealTypes.includes('dinner') ? 'primary' : 'outlined'}
                    size="small"
                    style={{ flex: 1 }}
                  />
                </View>
              </View>
            )}
          </form.Subscribe>
          <form.Subscribe selector={(state) => state.values.ingredients}>
            {(ingredients) => (
              <View>
                <Typography variant="body-sm" weight="bold" color="#4A3E36" style={{ marginBottom: 4 }}>
                  Ingredients
                </Typography>
                <IngredientsList
                  ingredients={ingredients}
                  handleAddIngredient={handleAddIngredient}
                  onIngredientEdit={handleEditIngredient}
                  onIngredientDelete={handleDeleteIngredient}
                />
                <Button
                  text="Add ingredient"
                  variant="outlined"
                  leftIcon={{ Icon: CirclePlus }}
                  onPress={handleAddIngredient}
                  style={{ marginTop: 8 }}
                />
              </View>
            )}
          </form.Subscribe>
          <View>
            <Typography variant="body-sm" weight="bold" color="#4A3E36" style={{ marginBottom: 4 }}>
              Notes
            </Typography>
            <NotesEditor ref={notesEditorRef} defaultValue={recipe?.notes} />
          </View>
        </form.AppForm>
      </KeyboardAwareScrollView>
      <View
        style={{
          marginTop: 'auto',
          paddingTop: 16,
          marginHorizontal: -20,
          paddingHorizontal: 20,
          borderTopWidth: 1,
          borderColor: colors.brown[800],
        }}
      >
        <Button
          text="Save recipe"
          variant="primary"
          leftIcon={{ Icon: Save }}
          onPress={handleSubmit}
          isLoading={addRecipe.isPending || editRecipe.isPending}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FEF7EA',
    flex: 1,
    paddingHorizontal: 20,
  },
  deleteActionContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    padding: 8,
  },
});
