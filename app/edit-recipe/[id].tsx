import React from 'react';
import { RecipeForm } from '@/components/recipe-form';
import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useRecipe } from '@/api/recipes';
import { colors } from '@/constants/colors';

export default function NewRecipe() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const recipe = useRecipe({ id: parseInt(id) });

  if (!recipe.data) {
    return (
      <View
        style={{
          backgroundColor: '#FEF7EA',
          flex: 1,
          paddingHorizontal: 20,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator size="small" color={colors.brown[900]} />
      </View>
    );
  }

  return <RecipeForm recipe={recipe.data} />;
}
