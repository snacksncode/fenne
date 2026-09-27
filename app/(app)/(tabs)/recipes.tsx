import { ListLayoutView } from '@/components/list-layout-view';
import { AnimatedFlashList } from '@/components/animated-flash-list';
import { useActiveTabPress } from '@/hooks/use-active-tab-press';
import { BlurTargetView } from 'expo-blur';
import { Recipe } from '@/components/recipe';
import { RouteTitle } from '@/components/RouteTitle';
import { EmptyState } from '@/components/empty-state';
import { useRecipes } from '@/api/recipes';
import { RecipeDTO } from '@/api/types';
import { useRouter } from 'expo-router';
import { View, StyleSheet, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlashList, FlashListRef } from '@shopify/flash-list';
import Animated, { FadeIn, useAnimatedStyle } from 'react-native-reanimated';
import { isEmptyish } from 'remeda';
import { filterRecipes, sortRecipes } from '@/utils/recipe-utils';
import { useSheets } from '@/lib/sheet-context';
import { BookMarked, Check, Funnel, Plus } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { MealFilter } from '@/components/bottomSheets/recipe-filter-sheet';
import { colors } from '@/constants/colors';
import { Button } from '@/components/button';
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import { TextInput } from '@/components/input';
import { useTabFocusAnimation } from '@/hooks/use-tab-focus-animation';
import { useKeyboardOpen } from '@/hooks/use-keyboard-open';

const EmptyList = ({ isFiltering = false }: { isFiltering?: boolean }) => {
  const router = useRouter();
  return (
    <EmptyState
      icon={BookMarked}
      title={isFiltering ? 'No recipes found' : 'No recipes yet'}
      description={
        isFiltering ? 'Try a different search or adjust your filters.' : 'Create your first recipe to get started'
      }
      action={
        isFiltering ? null : (
          <Button
            text="Add Recipe"
            variant="primary"
            leftIcon={{ Icon: Plus }}
            onPress={() => router.push('/new-recipe')}
          />
        )
      }
    />
  );
};

const RecipesSkeleton = () => {
  const insets = useSafeAreaInsets();
  return (
    <FlashList
      maintainVisibleContentPosition={{ disabled: true }}
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
  const sheets = useSheets();
  return (
    <ListLayoutView>
      <Recipe
        recipe={recipe}
        onPress={() => router.push({ pathname: '/recipe/[id]', params: { id: recipe.id } })}
        onLongPress={() => sheets.present('recipe-options-sheet', { data: { recipe } })}
      />
    </ListLayoutView>
  );
};

const GAP_SIZE = 16;

const PageContent = ({ mealFilter, search }: { mealFilter: MealFilter; search: string }) => {
  const insets = useSafeAreaInsets();
  const recipes = useRecipes();
  const listRef = useRef<FlashListRef<RecipeDTO>>(null);
  useActiveTabPress(() => listRef.current?.scrollToOffset({ offset: 0, animated: true }));

  if (!recipes.data) return <RecipesSkeleton />;

  const filteredRecipes = sortRecipes(filterRecipes(recipes.data, { mealFilter, search }));
  const isFiltering = search.trim().length > 0 || mealFilter !== 'all';

  return (
    <Animated.View style={{ flex: 1 }} entering={FadeIn}>
      <AnimatedFlashList
        ref={listRef}
        maintainVisibleContentPosition={{ disabled: true }}
        data={filteredRecipes}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item: recipe }) => <RecipeItem recipe={recipe} />}
        ListEmptyComponent={<EmptyList isFiltering={isFiltering} />}
        style={{ backgroundColor: '#FEF7EA', flex: 1 }}
        keyExtractor={(item) => item.id.toString()}
        keyboardDismissMode="on-drag"
        ItemSeparatorComponent={() => <View style={{ height: GAP_SIZE }} />}
        contentContainerStyle={{
          ...(filteredRecipes.length === 0 && { flexGrow: 1 }),
          paddingHorizontal: 20,
          paddingTop: insets.top + 76,
          paddingBottom: insets.bottom + (filteredRecipes.length === 0 ? 72 : 152),
        }}
      />
    </Animated.View>
  );
};

const Recipes = () => {
  const blurTarget = useRef<View | null>(null);
  const router = useRouter();
  const sheets = useSheets();
  const recipes = useRecipes();
  const insets = useSafeAreaInsets();
  const [mealFilter, setMealFilter] = useState<MealFilter>('all');
  const [search, setSearch] = useState('');
  const { isKeyboardOpen } = useKeyboardOpen();
  const { height: keyboardHeight } = useReanimatedKeyboardAnimation();
  const toolbarStyle = useAnimatedStyle(() => ({ bottom: Math.max(insets.bottom + 88, -keyboardHeight.value + 12) }));

  const tabFocusStyle = useTabFocusAnimation();

  const openFilterSheet = async () => {
    const filter = await sheets.present('recipe-filter-sheet', { data: { current: mealFilter } });
    if (filter != null) setMealFilter(filter);
  };

  return (
    <Animated.View style={[{ flex: 1 }, tabFocusStyle]}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ flex: 1, backgroundColor: colors.cream[100] }}>
          <BlurTargetView ref={blurTarget} style={{ flex: 1 }}>
            <PageContent mealFilter={mealFilter} search={search} />
          </BlurTargetView>
          <RouteTitle blurTarget={blurTarget} icon={BookMarked} text="Recipes" />
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
                  onPress={() => router.push('/new-recipe')}
                  variant="primary"
                  leftIcon={{ Icon: Plus }}
                />
              )}
            </Animated.View>
          ) : null}
        </View>
      </TouchableWithoutFeedback>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  searchInput: {
    flex: 1,
    color: colors.brown[900],
  },
});

export default Recipes;
