import { Recipe } from '@/components/recipe';
import { RouteTitle } from '@/components/RouteTitle';
import { RecipeDTO, useRecipes } from '@/api/recipes';
import { useRouter } from 'expo-router';
import { View, StyleSheet, FlatList, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import Animated, { FadeIn, FadeOut, LinearTransition, useAnimatedStyle } from 'react-native-reanimated';
import { isEmpty, isEmptyish } from 'remeda';
import { filterRecipes, sortRecipes } from '@/utils/recipe-utils';
import { Typography } from '@/components/Typography';
import { SheetManager } from 'react-native-actions-sheet';
import { BookMarked, SlidersHorizontal, SquarePlus } from 'lucide-react-native';
import { useState } from 'react';
import { MealFilter } from '@/components/bottomSheets/recipe-filter-sheet';
import { colors } from '@/constants/colors';
import { Button } from '@/components/button';
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import { TextInput } from '@/components/input';

const EmptyList = () => {
  const router = useRouter();
  return (
    <Animated.View style={styles.emptyContainer} entering={FadeIn}>
      <View style={styles.iconContainer}>
        <BookMarked size={48} color="#FEF7EA" strokeWidth={3} absoluteStrokeWidth />
      </View>
      <Typography variant="heading-md" weight="black" style={{ marginTop: 10 }}>
        No recipes yet
      </Typography>
      <Typography variant="body-sm" weight="medium" style={{ textAlign: 'center', marginTop: 4 }}>
        Create your first recipe to get started
      </Typography>
      <View style={{ marginTop: 24, gap: 12 }}>
        <Button
          text="Add Recipe"
          variant="primary"
          leftIcon={{ Icon: SquarePlus }}
          onPress={() => router.push('/new-recipe')}
        />
      </View>
    </Animated.View>
  );
};

const RecipesSkeleton = () => {
  const insets = useSafeAreaInsets();
  return (
    <FlashList
      data={[1, 2, 3]}
      renderItem={() => (
        <View
          style={{
            backgroundColor: '#FEF2DD',
            borderRadius: 8,
            borderColor: '#EEDBB9',
            borderWidth: 1,
            borderBottomWidth: 2,
            height: 94,
            paddingHorizontal: 16,
            paddingVertical: 12,
            gap: 8,
          }}
        >
          <View style={{ width: '60%', height: 20, backgroundColor: '#EEDBB9', borderRadius: 4 }} />
          <View style={{ width: '30%', height: 16, backgroundColor: '#EEDBB9', borderRadius: 4 }} />
        </View>
      )}
      style={{ backgroundColor: '#FEF7EA', flex: 1 }}
      ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingTop: insets.top + 76,
        paddingBottom: insets.bottom + 152,
      }}
    />
  );
};

const RecipeItem = ({ recipe }: { recipe: RecipeDTO }) => {
  const router = useRouter();
  return (
    <Animated.View layout={LinearTransition.springify()} entering={FadeIn} exiting={FadeOut}>
      <Recipe
        recipe={recipe}
        onPress={() => router.push({ pathname: '/recipe/[id]', params: { id: recipe.id } })}
        onLongPress={() => SheetManager.show('recipe-options-sheet', { payload: { recipe } })}
      />
    </Animated.View>
  );
};

const GAP_SIZE = 16;

const PageContent = ({ mealFilter, search }: { mealFilter: MealFilter; search: string }) => {
  const insets = useSafeAreaInsets();
  const recipes = useRecipes();

  if (!recipes.data) return <RecipesSkeleton />;
  if (isEmpty(recipes.data)) return <EmptyList />;

  const filteredRecipes = sortRecipes(filterRecipes(recipes.data, { mealFilter, search }));

  return (
    <Animated.View style={{ flex: 1 }} entering={FadeIn}>
      <FlatList
        data={filteredRecipes}
        renderItem={({ item: recipe }) => <RecipeItem recipe={recipe} />}
        style={{ backgroundColor: '#FEF7EA', flex: 1 }}
        keyExtractor={(item) => item.id.toString()}
        keyboardDismissMode="on-drag"
        ItemSeparatorComponent={() => <View style={{ height: GAP_SIZE }} />}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: insets.top + 76,
          paddingBottom: insets.bottom + 152,
        }}
      />
    </Animated.View>
  );
};

const Recipes = () => {
  const router = useRouter();
  const recipes = useRecipes();
  const insets = useSafeAreaInsets();
  const [mealFilter, setMealFilter] = useState<MealFilter>('all');
  const [search, setSearch] = useState('');
  const { height: keyboardHeight } = useReanimatedKeyboardAnimation();
  const toolbarStyle = useAnimatedStyle(() => ({ bottom: Math.max(insets.bottom + 88, -keyboardHeight.value + 12) }));

  const openFilterSheet = async () => {
    const result = await SheetManager.show('recipe-filter-sheet', { payload: { current: mealFilter } });
    if (result != null) setMealFilter(result);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={{ flex: 1, backgroundColor: colors.cream[100] }}>
        <RouteTitle text="Recipes" />
        <PageContent mealFilter={mealFilter} search={search} />
        {!isEmptyish(recipes.data) ? (
          <Animated.View
            style={[
              {
                position: 'absolute',
                left: 16,
                right: 16,
                flexDirection: 'row',
                gap: 8,
                alignItems: 'center',
              },
              toolbarStyle,
            ]}
          >
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search recipes..."
              placeholderTextColor={colors.brown[800]}
              style={styles.searchInput}
              autoCorrect={false}
              spellCheck={false}
            />
            <Button
              onPress={openFilterSheet}
              variant={mealFilter !== 'all' ? 'primary' : 'outlined'}
              leftIcon={{ Icon: SlidersHorizontal }}
              style={{ paddingHorizontal: 0, width: 48 }}
            />
            <Button
              onPress={() => router.push('/new-recipe')}
              variant="primary"
              leftIcon={{ Icon: SquarePlus }}
              style={{ paddingHorizontal: 0, width: 48 }}
            />
          </Animated.View>
        ) : null}
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    backgroundColor: '#493D34',
    paddingHorizontal: 36,
    paddingVertical: 12,
    borderRadius: 999,
  },
  searchInput: {
    flex: 1,
    borderRadius: 999,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderBottomWidth: 3,
    color: colors.brown[900],
    height: 48,
    backgroundColor: colors.cream[100],
  },
});

export default Recipes;
