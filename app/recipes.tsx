import { Button } from '@/components/button';
import { RouteTitle } from '@/components/RouteTitle';
import { Plus } from '@/components/svgs/plus';
import { Text } from '@/components/Text';
import { MealTypeKicker } from '@/components/WeeklyScreen';
import { FlashList } from '@shopify/flash-list';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Recipe = ({
  recipe: { type, name, ingredients },
}: {
  recipe: {
    type: 'breakfast' | 'lunch' | 'dinner';
    name: string;
    ingredients: string;
  };
}) => {
  return (
    <View
      style={{
        backgroundColor: '#FEF2DD',
        borderColor: '#4A3E36',
        borderWidth: 1,
        borderBottomWidth: 2,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
      }}
    >
      <View style={{ gap: 2 }}>
        <MealTypeKicker type={type} />
        <Text
          style={{
            color: '#4A3E36',
            fontFamily: 'Satoshi-Black',
            fontSize: 20,
            lineHeight: 20 * 1.25,
          }}
        >
          {name}
        </Text>
        <Text
          style={{
            color: '#807468',
            fontFamily: 'Satoshi-Medium',
            fontSize: 13,
            lineHeight: 13 * 1.3,
            marginTop: 4,
          }}
        >
          Ingredients: {ingredients}
        </Text>
      </View>
    </View>
  );
};

const recipes = [
  {
    type: 'breakfast' as const,
    name: 'Avocado Toast',
    ingredients: 'Bread, Avocado, Salt, Pepper',
  },
  {
    type: 'breakfast' as const,
    name: 'Scrambled Eggs',
    ingredients: 'Eggs, Butter, Salt, Pepper',
  },
  {
    type: 'breakfast' as const,
    name: 'Pancakes with Blueberries',
    ingredients: 'Flour, Eggs, Milk, Baking Powder, Blueberries, Maple Syrup',
  },
  {
    type: 'lunch' as const,
    name: 'Caesar Salad',
    ingredients: 'Romaine, Parmesan, Croutons, Caesar Dressing, Chicken',
  },
  {
    type: 'lunch' as const,
    name: 'Grilled Cheese Sandwich',
    ingredients: 'Bread, Cheddar, Butter',
  },
  {
    type: 'lunch' as const,
    name: 'Spaghetti Carbonara',
    ingredients: 'Pasta, Eggs, Pancetta, Parmesan, Black Pepper',
  },
  {
    type: 'dinner' as const,
    name: 'Salmon with Asparagus',
    ingredients: 'Salmon Fillet, Asparagus, Lemon, Olive Oil, Garlic',
  },
  {
    type: 'dinner' as const,
    name: 'Beef Tacos',
    ingredients: 'Ground Beef, Tortillas, Lettuce, Tomato, Cheddar, Sour Cream',
  },
  {
    type: 'dinner' as const,
    name: 'Chicken Stir Fry',
    ingredients: 'Chicken Breast, Bell Peppers, Broccoli, Soy Sauce, Garlic, Rice',
  },
  {
    type: 'breakfast' as const,
    name: 'Oatmeal with Honey',
    ingredients: 'Oats, Milk, Honey, Almonds, Cinnamon',
  },
];

const GAP_SIZE = 16;

const Recipes = () => {
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
        renderItem={({ item }) => <Recipe recipe={item} />}
        ItemSeparatorComponent={() => <View style={{ height: GAP_SIZE }} />}
      />
      <Button
        onPress={() => alert('BBB')}
        text="New Recipe"
        LeftIcon={Plus}
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
