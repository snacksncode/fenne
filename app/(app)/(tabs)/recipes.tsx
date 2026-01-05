import { Button } from '@/components/button';
import { Recipe } from '@/components/recipe';
import { RouteTitle } from '@/components/RouteTitle';
import { RecipeDTO, useRecipes } from '@/api/recipes';
import { useRouter } from 'expo-router';
import { View, StyleSheet, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { isEmpty } from 'remeda';
import { Text } from '@/components/Text';
import { SheetManager } from 'react-native-actions-sheet';
import { SquarePlus } from 'lucide-react-native';

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
        onPress={() => router.push({ pathname: '/edit-recipe/[id]', params: { id: recipe.id } })}
        onLongPress={() => SheetManager.show('recipe-options-sheet', { payload: { recipe } })}
      />
    </Animated.View>
  );
};

const GAP_SIZE = 16;

const PageContent = () => {
  const insets = useSafeAreaInsets();
  const recipes = useRecipes();

  if (!recipes.data) return <RecipesSkeleton />;
  if (isEmpty(recipes.data)) return <EmptyList />;

  return (
    <Animated.View style={{ flex: 1 }} entering={FadeIn}>
      <FlatList
        data={recipes.data}
        renderItem={({ item: recipe }) => <RecipeItem recipe={recipe} />}
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

  return (
    <View style={{ flex: 1, backgroundColor: '#FEF7EA' }}>
      <RouteTitle text="Recipes" />
      <PageContent />
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
    lineHeight: 24 * 1.25,
    color: '#4A3E36',
    marginBottom: 4,
  },
  emptySubheading: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 16,
    lineHeight: 16 * 1.25,
    color: '#766356',
  },
});

export default Recipes;
