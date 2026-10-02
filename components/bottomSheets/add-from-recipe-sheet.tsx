import { BaseSheet } from '@/components/bottomSheets/base-sheet';
import { Typography } from '@/components/Typography';
import { SheetProps, useSheets } from '@/lib/sheet-context';
import { BookMarked, CookingPot, SlidersHorizontal } from 'lucide-react-native';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';
import { useRecipes } from '@/api/recipes';
import { RecipeDTO } from '@/api/types';
import { Recipe } from '@/components/recipe';
import { colors } from '@/constants/colors';
import { isEmpty, isEmptyish } from 'remeda';
import { useAddRecipeToGroceries } from '@/api/groceries';
import { Button } from '@/components/button';
import { useRouter } from 'expo-router';
import { useRecipeSearch } from '@/hooks/use-recipe-search';
import { useRef, useState } from 'react';
import { MealFilter } from '@/components/bottomSheets/recipe-filter-sheet';
import { TextInput } from '@/components/input';
import { requestErrorMessage } from '@/api/errors';

export const AddFromRecipeSheet = (props: SheetProps<'add-from-recipe-sheet'>) => {
  const sheets = useSheets();
  const recipes = useRecipes();
  const addRecipeToGroceries = useAddRecipeToGroceries();
  const router = useRouter();
  const { height: windowHeight } = useWindowDimensions();
  const [mealFilter, setMealFilter] = useState<MealFilter>('all');
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const saving = useRef(false);

  const handleRecipeSelect = async (recipe: RecipeDTO) => {
    if (saving.current) return;
    saving.current = true;
    setError(null);
    try {
      await addRecipeToGroceries.mutateAsync({ recipe_id: recipe.id });
      await sheets.dismiss(props.sheetId);
    } catch (error) {
      setError(requestErrorMessage(error, 'Could not add these ingredients. Try again.'));
    } finally {
      saving.current = false;
    }
  };

  const handleGoToRecipes = async () => {
    await sheets.dismiss(props.sheetId);
    router.push('/recipes');
  };

  const openFilterSheet = async () => {
    const filter = await sheets.present('recipe-filter-sheet', {
      data: {
        current: mealFilter,
      },
    });
    if (filter != null) setMealFilter(filter);
  };

  const hasRecipes = !isEmptyish(recipes.data);
  const filtered = useRecipeSearch(recipes.data, { mealFilter, search });

  return (
    <BaseSheet
      id={props.sheetId}
      dismissible={!addRecipeToGroceries.isPending}
      draggable={!addRecipeToGroceries.isPending}
      footer={hasRecipes ? (
        <View style={styles.toolbar}>
          <TextInput
            variant="search"
            editable={!addRecipeToGroceries.isPending}
            value={search}
            onChangeText={setSearch}
            placeholder="Search recipes..."
            style={styles.searchInput}
          />
          <Button
            accessibilityLabel="Filter recipes"
            disabled={addRecipeToGroceries.isPending}
            onPress={openFilterSheet}
            variant={mealFilter !== 'all' ? 'primary' : 'outlined'}
            leftIcon={{ Icon: SlidersHorizontal }}
            style={{ paddingHorizontal: 0, width: 48 }}
          />
        </View>
      ) : undefined}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 }}>
        <CookingPot color={colors.brown[900]} size={20} strokeWidth={2.5} />
        <Typography variant="heading-sm" weight="bold">Add from Recipe</Typography>
      </View>
      {error && (
        <View accessible accessibilityRole="alert" style={{ marginBottom: 12 }}>
          <Typography variant="body-sm" color={colors.red[500]}>{error}</Typography>
        </View>
      )}
      {addRecipeToGroceries.isPending && (
        <Typography variant="body-sm" accessibilityLiveRegion="polite" style={{ marginBottom: 12 }}>Adding ingredients…</Typography>
      )}
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        style={{ maxHeight: 0.5 * windowHeight }}
      >
        <View style={{ gap: 8 }} pointerEvents={addRecipeToGroceries.isPending ? 'none' : 'auto'}>
          {!hasRecipes ? (
            <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 12 }}>
              <BookMarked size={48} color={colors.brown[900]} strokeWidth={1.5} />
              <View style={{ alignItems: 'center', gap: 4 }}>
                <Typography variant="body-lg" weight="bold" style={{ textAlign: 'center' }}>No recipes found</Typography>
                <Typography variant="body-sm" weight="medium" style={{ textAlign: 'center', marginBottom: 8 }}>
                  Add some recipes to start adding ingredients
                </Typography>
              </View>
              <Button variant="primary" text="Go to Recipes" onPress={handleGoToRecipes} />
            </View>
          ) : isEmpty(filtered) ? (
            <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 4 }}>
              <Typography variant="body-lg" weight="bold" style={{ textAlign: 'center' }}>No matches</Typography>
              <Typography variant="body-sm" weight="medium" style={{ textAlign: 'center' }}>Try a different search or filter</Typography>
            </View>
          ) : (
            filtered.map((recipe) => (
              <Animated.View layout={LinearTransition.springify()} key={recipe.id} entering={FadeInDown.springify()} exiting={FadeOut}>
                <Recipe recipe={recipe} onPress={() => handleRecipeSelect(recipe)} />
              </Animated.View>
            ))
          )}
        </View>
      </ScrollView>
    </BaseSheet>
  );
};

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
  },
});
