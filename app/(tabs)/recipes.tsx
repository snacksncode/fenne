import { Button } from '@/components/button';
import { MealType } from '@/components/menu/weekly-screen';
import { Recipe } from '@/components/recipe';
import { RouteTitle } from '@/components/RouteTitle';
import { Plus } from '@/components/svgs/plus';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useRef } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type RecipeDTO = {
  type: MealType;
  name: string;
  ingredients: string;
};

export const recipes: RecipeDTO[] = [
  {
    type: 'breakfast',
    name: 'Avocado Toast',
    ingredients: 'Bread, Avocado, Salt, Pepper',
  },
  {
    type: 'breakfast',
    name: 'Scrambled Eggs',
    ingredients: 'Eggs, Butter, Salt, Pepper',
  },
  {
    type: 'breakfast',
    name: 'Pancakes with Blueberries',
    ingredients: 'Flour, Eggs, Milk, Baking Powder, Blueberries, Maple Syrup',
  },
  {
    type: 'lunch',
    name: 'Caesar Salad',
    ingredients: 'Romaine, Parmesan, Croutons, Caesar Dressing, Chicken',
  },
  {
    type: 'lunch',
    name: 'Grilled Cheese Sandwich',
    ingredients: 'Bread, Cheddar, Butter',
  },
  {
    type: 'lunch',
    name: 'Spaghetti Carbonara',
    ingredients: 'Pasta, Eggs, Pancetta, Parmesan, Black Pepper',
  },
  {
    type: 'dinner',
    name: 'Salmon with Asparagus',
    ingredients: 'Salmon Fillet, Asparagus, Lemon, Olive Oil, Garlic',
  },
  {
    type: 'dinner',
    name: 'Beef Tacos',
    ingredients: 'Ground Beef, Tortillas, Lettuce, Tomato, Cheddar, Sour Cream',
  },
  {
    type: 'dinner',
    name: 'Chicken Stir Fry',
    ingredients: 'Chicken Breast, Bell Peppers, Broccoli, Soy Sauce, Garlic, Rice',
  },
  {
    type: 'breakfast',
    name: 'Oatmeal with Honey',
    ingredients: 'Oats, Milk, Honey, Almonds, Cinnamon',
  },
];

const GAP_SIZE = 16;

const Recipes = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: '#FEF7EA' }}>
      <RouteTitle text="Recipes" />
      <FlashList
        data={recipes}
        contentContainerStyle={{
          paddingTop: insets.top + 76,
          paddingBottom: insets.bottom + 152,
          paddingHorizontal: 20,
        }}
        renderItem={({ item }) => <Recipe recipe={item} onPress={() => alert(item.name)} />}
        ItemSeparatorComponent={() => <View style={{ height: GAP_SIZE }} />}
      />
      <Button
        variant="primary"
        onPress={() => router.push('/new-recipe')}
        text="New Recipe"
        leftIcon={{ Icon: Plus }}
        style={{
          position: 'absolute',
          bottom: insets.bottom + 88,
          right: 16,
        }}
      />
    </View>
  );
};

export default Recipes;
