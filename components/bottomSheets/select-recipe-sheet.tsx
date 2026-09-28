import { recipesOptions, useRecipes } from '@/api/recipes';
import { RecipeDTO } from '@/api/types';
import { BaseSheet, sheetFooter } from '@/components/bottomSheets/base-sheet';
import { MealFilter } from '@/components/bottomSheets/recipe-filter-sheet';
import { Button } from '@/components/button';
import { TextInput } from '@/components/input';
import { Recipe } from '@/components/recipe';
import { Typography } from '@/components/Typography';
import { colors } from '@/constants/colors';
import { useKeyboardOpen } from '@/hooks/use-keyboard-open';
import { useMount } from '@/hooks/use-mount';
import { SheetProps, useSheets } from '@/lib/sheet-context';
import { filterRecipes } from '@/utils/recipe-utils';
import { useQueryClient } from '@tanstack/react-query';
import { BookMarked, Check, Funnel } from 'lucide-react-native';
import { useState } from 'react';
import { Keyboard, ScrollView, View } from 'react-native';
import { isEmpty } from 'remeda';

export const SelectRecipeSheet = (props: SheetProps<'select-recipe-sheet'>) => {
  const sheets = useSheets();
  const recipes = useRecipes();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [mealFilter, setMealFilter] = useState<MealFilter>('all');
  const { isKeyboardOpen } = useKeyboardOpen();

  useMount(() => void queryClient.prefetchQuery(recipesOptions));

  const filteredRecipes = filterRecipes(recipes.data ?? [], { search, mealFilter });

  const openFilterSheet = async () => {
    const filter = await sheets.present('recipe-filter-sheet', { data: { current: mealFilter } });
    if (filter != null) setMealFilter(filter);
  };

  const handleSelect = (recipe: RecipeDTO) => {
    Keyboard.dismiss();
    sheets.dismiss(props.sheetId, recipe);
  };

  return (
    <BaseSheet
      id={props.sheetId}
      sizing={{ type: 'scrollable', detents: [0.5, 1] }}
      footer={sheetFooter.buttonRow(
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <TextInput
            variant="search"
            value={search}
            onChangeText={setSearch}
            placeholder="Search recipes..."
            style={{
              flex: 1,
              color: colors.brown[900],
            }}
          />
          <Button
            accessibilityLabel="Filter recipes"
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
          ) : null}
        </View>
      )}
    >
      <Typography variant="heading-sm" weight="bold" style={{ marginBottom: 16 }}>
        Select recipe
      </Typography>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={{ gap: 8, paddingBottom: 88 }}>
          {isEmpty(filteredRecipes) ? (
            <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 12 }}>
              <BookMarked size={48} color={colors.brown[900]} strokeWidth={1.5} />
              <View style={{ alignItems: 'center', gap: 4 }}>
                <Typography variant="body-lg" weight="bold" style={{ textAlign: 'center' }}>
                  {search ? 'No recipes match your search' : 'No recipes found'}
                </Typography>
                <Typography variant="body-sm" weight="medium" color={colors.brown[700]} style={{ textAlign: 'center' }}>
                  Pick a different filter or create recipes first.
                </Typography>
              </View>
            </View>
          ) : (
            filteredRecipes.map((recipe) => (
              <Recipe key={recipe.id} recipe={recipe} onPress={() => handleSelect(recipe)} />
            ))
          )}
        </View>
      </ScrollView>
    </BaseSheet>
  );
};
