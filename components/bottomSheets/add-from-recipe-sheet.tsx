import { BaseSheet } from '@/components/bottomSheets/base-sheet';
import { Typography } from '@/components/Typography';
import { SheetProps, useSheets } from '@/lib/sheet-context';
import { BookMarked, CookingPot, SlidersHorizontal } from 'lucide-react-native';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';
import { useRecipes } from '@/api/recipes';
import { RecipeDTO } from '@/api/types';
import { useQueryClient } from '@tanstack/react-query';
import { useMount } from '@/hooks/use-mount';
import { Recipe } from '@/components/recipe';
import { colors } from '@/constants/colors';
import { isEmpty, isEmptyish } from 'remeda';
import { useAddRecipeToGroceries } from '@/api/groceries';
import { Button } from '@/components/button';
import { useRouter } from 'expo-router';
import { filterRecipes } from '@/utils/recipe-utils';
import { useState } from 'react';
import { MealFilter } from '@/components/bottomSheets/recipe-filter-sheet';
import { TextInput } from '@/components/input';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { queryKeys } from '@/api/query-keys';

export const AddFromRecipeSheet = (props: SheetProps<'add-from-recipe-sheet'>) => {
  const sheets = useSheets();
  const recipes = useRecipes();
  const queryClient = useQueryClient();
  const addRecipeToGroceries = useAddRecipeToGroceries();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const [mealFilter, setMealFilter] = useState<MealFilter>('all');
  const [search, setSearch] = useState('');

  useMount(() => void queryClient.prefetchQuery({ queryKey: queryKeys.recipes.all() }));

  const handleRecipeSelect = (recipe: RecipeDTO) => {
    if (addRecipeToGroceries.isPending) return;

    addRecipeToGroceries.mutate({ recipe_id: recipe.id }, {
      onSuccess: () => sheets.dismiss(props.sheetId),
    });
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
  const filtered = hasRecipes ? filterRecipes(recipes.data!, { mealFilter, search }) : [];

  return (
    <BaseSheet id={props.sheetId}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 }}>
          <CookingPot color="#4A3E36" size={20} strokeWidth={2.5} />
          <Typography variant="heading-sm" weight="bold">
            Add from Recipe
          </Typography>
        </View>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          style={{ maxHeight: 0.5 * windowHeight }}
          contentContainerStyle={{ paddingBottom: hasRecipes ? 96 : 0 }}
        >
          <View style={{ gap: 8 }}>
            {!hasRecipes ? (
              <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 12 }}>
                <BookMarked size={48} color={colors.brown[900]} strokeWidth={1.5} />
                <View style={{ alignItems: 'center', gap: 4 }}>
                  <Typography variant="body-lg" weight="bold" style={{ textAlign: 'center' }}>
                    No recipes found
                  </Typography>
                  <Typography variant="body-sm" weight="medium" style={{ textAlign: 'center', marginBottom: 8 }}>
                    Add some recipes to start adding ingredients
                  </Typography>
                </View>
                <Button variant="primary" text="Go to Recipes" onPress={handleGoToRecipes} />
              </View>
            ) : isEmpty(filtered) ? (
              <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 4 }}>
                <Typography variant="body-lg" weight="bold" style={{ textAlign: 'center' }}>
                  No matches
                </Typography>
                <Typography variant="body-sm" weight="medium" style={{ textAlign: 'center' }}>
                  Try a different search or filter
                </Typography>
              </View>
            ) : (
              filtered.map((recipe) => (
                <Animated.View
                  layout={LinearTransition.springify()}
                  key={recipe.id}
                  entering={FadeInDown.springify()}
                  exiting={FadeOut}
                >
                  <Recipe recipe={recipe} onPress={() => handleRecipeSelect(recipe)} />
                </Animated.View>
              ))
            )}
          </View>
      </ScrollView>
      {hasRecipes && (
        <Animated.View style={[styles.toolbar, { bottom: insets.bottom, left: 12, right: 12 }]}>
          <TextInput
            variant="search"
            value={search}
            onChangeText={setSearch}
            placeholder="Search recipes..."
            style={styles.searchInput}
          />
          <Button
            accessibilityLabel="Filter recipes"
            onPress={openFilterSheet}
            variant={mealFilter !== 'all' ? 'primary' : 'outlined'}
            leftIcon={{ Icon: SlidersHorizontal }}
            style={{ paddingHorizontal: 0, width: 48 }}
          />
        </Animated.View>
      )}
    </BaseSheet>
  );
};

const styles = StyleSheet.create({
  toolbar: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
  },
});
