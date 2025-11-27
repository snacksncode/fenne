import { Button } from '@/components/button';
import { Recipe } from '@/components/recipe';
import { RouteTitle } from '@/components/RouteTitle';
import { Plus } from '@/components/svgs/plus';
import { RecipeDTO, useRecipes } from '@/api/recipes';
import { useRouter } from 'expo-router';
import { RefObject, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import Animated, { FadeIn, FadeOut, LinearTransition, useScrollOffset } from 'react-native-reanimated';
import { isEmpty } from 'remeda';
import { Text } from '@/components/Text';
import { RecipeOptionsSheet, RecipeOptionsSheetData } from '@/components/bottomSheets/recipe-options-sheet';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { ListPlus, SquarePlus } from 'lucide-react-native';

const EmptyList = () => (
  <Animated.View style={styles.emptyContainer} entering={FadeIn}>
    <Text style={styles.emptyHeading}>No recipes yet</Text>
    <Text style={styles.emptySubheading}>Create your first recipe to get started</Text>
  </Animated.View>
);

const RecipesSkeleton = () => {
  const insets = useSafeAreaInsets();
  return (
    <FlashList
      data={[1, 2, 3]}
      renderItem={() => (
        <View
          style={{
            backgroundColor: '#FEF2DD',
            borderWidth: 1,
            borderBottomWidth: 2,
            borderColor: '#4A3E36',
            borderRadius: 8,
            paddingHorizontal: 16,
            paddingVertical: 12,
            height: 120,
            opacity: 0.7,
          }}
        />
      )}
      style={{ backgroundColor: '#FEF7EA', flex: 1 }}
      keyExtractor={(_, i) => i.toString()}
      ItemSeparatorComponent={() => <View style={{ height: GAP_SIZE }} />}
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingTop: insets.top + 76,
        paddingBottom: insets.bottom + 152,
      }}
      scrollEnabled={false}
    />
  );
};

const RecipeItem = ({
  recipe,
  recipeOptionsSheetRef,
}: {
  recipe: RecipeDTO;
  recipeOptionsSheetRef: RefObject<BottomSheetModal<RecipeOptionsSheetData> | null>;
}) => {
  const router = useRouter();
  return (
    <Animated.View layout={LinearTransition.springify()} entering={FadeIn} exiting={FadeOut}>
      <Recipe
        recipe={recipe}
        onPress={() => router.push({ pathname: '/edit-recipe/[id]', params: { id: recipe.id } })}
        onLongPress={() => recipeOptionsSheetRef.current?.present({ recipe })}
      />
    </Animated.View>
  );
};

const GAP_SIZE = 16;

const PageContent = (props: { recipeOptionsSheetRef: RefObject<BottomSheetModal<RecipeOptionsSheetData> | null> }) => {
  const insets = useSafeAreaInsets();
  const recipes = useRecipes();
  const [enterAnimationsEnabled, setEnterAnimationsEnabled] = useState(false);

  useEffect(() => {
    if (!recipes.data) return;
    const id = setTimeout(() => setEnterAnimationsEnabled(true), 500);
    return () => clearTimeout(id);
  }, [recipes.data]);

  if (!recipes.data) return <RecipesSkeleton />;
  if (isEmpty(recipes.data)) return <EmptyList />;

  return (
    <Animated.View style={{ flex: 1 }} entering={FadeIn}>
      <FlatList
        data={recipes.data}
        renderItem={({ item: recipe }) => (
          <RecipeItem recipe={recipe} recipeOptionsSheetRef={props.recipeOptionsSheetRef} />
        )}
        style={{ backgroundColor: '#FEF7EA', flex: 1 }}
        keyExtractor={(item) => item.id.toString()}
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
  const insets = useSafeAreaInsets();
  const recipeOptionsSheetRef = useRef<BottomSheetModal<RecipeOptionsSheetData>>(null);

  return (
    <View style={{ flex: 1, backgroundColor: '#FEF7EA' }}>
      <RouteTitle text="Recipes" />
      <PageContent recipeOptionsSheetRef={recipeOptionsSheetRef} />
      <Button
        variant="primary"
        onPress={() => router.push('/new-recipe')}
        text="New Recipe"
        leftIcon={{ Icon: SquarePlus }}
        style={{
          position: 'absolute',
          bottom: insets.bottom + 88,
          right: 16,
        }}
      />
      <RecipeOptionsSheet ref={recipeOptionsSheetRef} />
    </View>
  );
};

const styles = StyleSheet.create({
  leftActionContainer: {
    flexDirection: 'row',
    gap: 8,
    padding: 8,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  emptyHeading: {
    fontFamily: 'Satoshi-Black',
    fontSize: 24,
    lineHeight: 24 * 1.5,
    color: '#4A3E36',
    marginTop: 10,
  },
  emptySubheading: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 12,
    lineHeight: 12 * 1.5,
    textAlign: 'center',
    color: '#4A3E36',
    marginTop: 4,
  },
});

export default Recipes;
