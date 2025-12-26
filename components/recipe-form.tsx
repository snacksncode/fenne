import { EditIngredientSheet, EditIngredientSheetData } from '@/components/bottomSheets/edit-ingredient-sheet';
import { RecipeDTO, RecipeFormData, useAddRecipe, useEditRecipe } from '@/api/recipes';
import { IngredientFormData, MealType } from '@/api/schedules';
import { Button } from '@/components/button';
import { TextInput } from '@/components/input';
import { Ham } from '@/components/svgs/ham';
import { Pancake } from '@/components/svgs/pancake';
import { Salad } from '@/components/svgs/salad';
import { useNavigation } from '@react-navigation/native';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { ChevronLeft, CirclePlus, CookingPot, ListPlus, Pencil, Trash2 } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Keyboard, ScrollView, StyleProp, ViewStyle } from 'react-native';
import { TextInput as TextInputType } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import { isEmpty } from 'remeda';
import { colors } from '@/constants/colors';
import { useMount } from '@/hooks/use-mount';
import { nanoid } from 'nanoid/non-secure';
import { UNITS } from '@/components/bottomSheets/select-unit-sheet';
import { PressableWithHaptics } from '@/components/pressable-with-feedback';

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
          <Text style={styles.ingredientName}>{ingredient.name}</Text>
          {ingredient.quantity && (
            <Text style={styles.ingredientQuantity}>
              {ingredient.quantity}{' '}
              {UNITS.find((u) => u.value === ingredient.unit)?.label({ count: parseFloat(ingredient.quantity) })}
            </Text>
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
    <Text
      style={{
        marginTop: 8,
        fontFamily: 'Satoshi-Black',
        fontSize: 16,
        lineHeight: 16 * 1.25,
        color: '#4A3E36',
      }}
    >
      No ingredients
    </Text>
    <Text
      style={{
        marginTop: 2,
        fontFamily: 'Satoshi-Bold',
        fontSize: 14,
        lineHeight: 14,
        color: '#4A3E36',
      }}
    >
      Tap to add one
    </Text>
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
  onIngredientDelete: (id: string) => void;
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
            <React.Fragment key={ingredient._id}>
              <IngredientItem
                style={index > 0 ? { borderColor: colors.brown[900], borderTopWidth: 1 } : undefined}
                ingredient={ingredient}
                onEdit={() => onIngredientEdit(ingredient)}
                onDelete={() => onIngredientDelete(ingredient._id)}
              />
            </React.Fragment>
          ))}
        </Animated.View>
      ) : null}
    </View>
  );
};

const getIngredients = (recipe: RecipeDTO | undefined) => {
  if (!recipe) return [];
  return recipe.ingredients.map<IngredientFormData>((ingredient) => ({
    _id: nanoid(),
    name: ingredient.name,
    quantity: ingredient.quantity.toString(),
    unit: ingredient.unit,
    aisle: ingredient.aisle,
  }));
};

export function RecipeForm({ recipe }: { recipe?: RecipeDTO }) {
  const navigation = useNavigation();
  const nameInputRef = useRef<TextInputType>(null);
  const editIngredientSheetRef = useRef<BottomSheetModal<EditIngredientSheetData>>(null);
  const editRecipe = useEditRecipe();
  const addRecipe = useAddRecipe();
  const [recipeName, setRecipeName] = useState(recipe?.name ?? '');
  const [mealTypes, setMealTypes] = useState<MealType[]>(recipe?.meal_types ?? []);
  const [ingredients, setIngredients] = useState<IngredientFormData[]>(() => getIngredients(recipe));
  const [timeInMinutes, setTimeInMinutes] = useState(recipe?.time_in_minutes.toString() ?? '');

  useMount(() => {
    const id = setTimeout(() => {
      if (!recipeName) nameInputRef.current?.focus();
    }, SCREEN_TRANSITION_DURATION_MS);
    return () => clearTimeout(id);
  });

  const handleAddIngredient = () => editIngredientSheetRef.current?.present();

  const handleEditIngredient = (ingredient: IngredientFormData) => {
    editIngredientSheetRef.current?.present({ ingredient });
  };

  const handleDeleteIngredient = (id: string) => setIngredients((prev) => prev.filter((item) => item._id !== id));

  const handleSaveIngredient = (ingredient: IngredientFormData) => {
    setIngredients((prev) => {
      const _ingredient = prev.find((i) => i._id === ingredient._id);
      if (!_ingredient) return [...prev, ingredient];
      return prev.map((i) => (i._id !== ingredient._id ? i : ingredient));
    });
  };

  const handleSubmit = () => {
    Keyboard.dismiss();
    if (!recipeName.trim() || mealTypes.length === 0 || ingredients.length === 0 || !+timeInMinutes) {
      return alert('Please fill in all required fields');
    }

    const recipeData: RecipeFormData = {
      name: recipeName,
      meal_types: mealTypes,
      ingredients: ingredients,
      time_in_minutes: +timeInMinutes,
      liked: recipe?.liked ?? false,
    };
    const handleSuccess = () => navigation.goBack();
    if (recipe) return editRecipe.mutate({ id: recipe.id, ...recipeData }, { onSuccess: handleSuccess });
    addRecipe.mutate(recipeData, { onSuccess: handleSuccess });
  };

  return (
    <SafeAreaView style={styles.container}>
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
        <Text style={styles.header}>{recipe ? 'Edit Recipe' : 'New Recipe'}</Text>
      </Pressable>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingBottom: 20 }}>
        <View>
          <Text style={styles.label}>Name</Text>
          <TextInput
            ref={nameInputRef}
            placeholder="e.g. Avocado Toast"
            value={recipeName}
            onChangeText={setRecipeName}
          />
        </View>
        <View>
          <Text style={styles.label}>Cooking time (in minutes)</Text>
          <TextInput
            value={timeInMinutes}
            onChangeText={setTimeInMinutes}
            placeholder="e.g. 30"
            keyboardType="decimal-pad"
          />
        </View>
        <View>
          <Text style={styles.label}>Meal type</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button
              onPress={() => {
                setMealTypes((types) => {
                  return types.includes('breakfast') ? types.filter((t) => t !== 'breakfast') : [...types, 'breakfast'];
                });
              }}
              leftIcon={{ Icon: Pancake }}
              text="Breakfast"
              variant={mealTypes.includes('breakfast') ? 'primary' : 'outlined'}
              size="pill"
              style={{ flex: 1 }}
            />
            <Button
              onPress={() => {
                setMealTypes((types) => {
                  return types.includes('lunch') ? types.filter((t) => t !== 'lunch') : [...types, 'lunch'];
                });
              }}
              leftIcon={{ Icon: Salad }}
              text="Lunch"
              variant={mealTypes.includes('lunch') ? 'primary' : 'outlined'}
              size="pill"
              style={{ flex: 1 }}
            />
            <Button
              onPress={() => {
                setMealTypes((types) => {
                  return types.includes('dinner') ? types.filter((t) => t !== 'dinner') : [...types, 'dinner'];
                });
              }}
              leftIcon={{ Icon: Ham }}
              text="Dinner"
              variant={mealTypes.includes('dinner') ? 'primary' : 'outlined'}
              size="pill"
              style={{ flex: 1 }}
            />
          </View>
        </View>
        <View>
          <Text style={styles.label}>Ingredients</Text>
          <IngredientsList
            ingredients={ingredients}
            handleAddIngredient={handleAddIngredient}
            onIngredientEdit={handleEditIngredient}
            onIngredientDelete={handleDeleteIngredient}
          />
        </View>
      </ScrollView>
      <View
        style={{
          marginTop: 'auto',
          gap: 12,
          paddingTop: 20,
          marginHorizontal: -20,
          paddingHorizontal: 20,
          borderTopWidth: 1,
          borderColor: colors.brown[800],
        }}
      >
        <Button
          text="Add ingredient"
          variant="outlined"
          leftIcon={{ Icon: CirclePlus }}
          onPress={handleAddIngredient}
        />
        <Button
          text={recipe ? 'Edit recipe' : 'Add recipe'}
          variant="primary"
          leftIcon={{ Icon: recipe ? Pencil : ListPlus }}
          onPress={handleSubmit}
          isLoading={addRecipe.isPending || editRecipe.isPending}
        />
      </View>
      <EditIngredientSheet ref={editIngredientSheetRef} onSave={handleSaveIngredient} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FEF7EA',
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    color: '#4A3E36',
    fontFamily: 'Satoshi-Bold',
    fontSize: 20,
    lineHeight: 20 * 1.25,
  },
  label: {
    marginBottom: 4,
    color: '#4A3E36',
    fontFamily: 'Satoshi-Bold',
    fontSize: 14,
    lineHeight: 14 * 1.5,
  },
  ingredientName: {
    color: '#4A3E36',
    fontFamily: 'Satoshi-Bold',
    fontSize: 16,
    lineHeight: 16 * 1.5,
  },
  ingredientQuantity: {
    color: '#867a6e',
    fontFamily: 'Satoshi-Medium',
    fontSize: 12,
    lineHeight: 12 * 1.5,
    marginTop: 2,
  },
  deleteActionContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    padding: 8,
  },
});
