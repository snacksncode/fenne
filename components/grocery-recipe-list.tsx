import { useRecipes } from '@/api/recipes';
import { Button } from '@/components/button';
import { Recipe } from '@/components/recipe';
import { Typography } from '@/components/Typography';
import { colors } from '@/constants/colors';
import { ActivityIndicator, View } from 'react-native';

export const GroceryRecipeList = ({ recipes, onPress, emptyMessage = 'No recipes are linked to this item.' }: {
  recipes: { id: string; name: string }[];
  onPress: (id: string) => void;
  emptyMessage?: string;
}) => {
  const saved = useRecipes();
  if (!recipes.length) return <Typography variant="body-sm" weight="medium" color={colors.brown[700]}>{emptyMessage}</Typography>;
  if (saved.isPending) return <ActivityIndicator color={colors.orange[600]} style={{ padding: 24 }} />;
  if (saved.isError && !saved.data) return (
    <View style={{ gap: 8 }}>
      <Typography variant="body-sm" weight="medium">Could not load the recipes.</Typography>
      <Button text="Try again" variant="outlined" onPress={() => saved.refetch()} />
    </View>
  );
  return <View style={{ gap: 8 }}>{recipes.map((reference) => {
    const recipe = saved.data?.find((item) => item.id === reference.id);
    return recipe ? <Recipe key={recipe.id} recipe={recipe} onPress={() => onPress(recipe.id)} /> : (
      <Typography key={reference.id} variant="body-sm" weight="medium" color={colors.brown[700]}>
        {reference.name} · Recipe no longer available
      </Typography>
    );
  })}</View>;
};
