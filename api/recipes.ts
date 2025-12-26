import { api } from '@/api';
import { MealType, IngredientDTO, IngredientFormData } from '@/api/schedules';
import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useOptimisticUpdate, tempId } from '@/api/optimistic';
import { omit } from 'remeda';

export type RecipeDTO = {
  id: string;
  name: string;
  meal_types: MealType[];
  ingredients: IngredientDTO[];
  time_in_minutes: number;
  liked: boolean;
};

export type RecipeFormData = Omit<RecipeDTO, 'id' | 'ingredients'> & {
  ingredients: IngredientFormData[];
};

export const recipesOptions = queryOptions({
  queryKey: ['recipes'] as const,
  queryFn: async () => {
    return api.get<RecipeDTO[]>('/recipes');
  },
  staleTime: Infinity,
});

export const recipeOptions = (id: string) => {
  return queryOptions({
    queryKey: ['recipes', id] as const,
    queryFn: async () => {
      return api.get<RecipeDTO>(`/recipes/${id}`);
    },
    staleTime: Infinity,
  });
};

export const useRecipes = () => {
  return useQuery(recipesOptions);
};

export const useRecipe = ({ id }: { id: string }) => {
  const recipes = useRecipes();

  return useQuery({
    ...recipeOptions(id),
    initialData: recipes.data?.find((recipe) => recipe.id === id),
  });
};

const recipeFormDataToDTO = (recipe: RecipeFormData): RecipeDTO => ({
  ...recipe,
  id: tempId(),
  ingredients: recipe.ingredients.map((ingredient) => ({
    ...omit(ingredient, ['_id']),
    id: tempId(),
    quantity: parseInt(ingredient.quantity),
  })),
});

export const useAddRecipe = () => {
  const { update, revert } = useOptimisticUpdate();
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['addRecipe'],
    mutationFn: async (newRecipeData: RecipeFormData) => {
      return api.post('/recipes', { data: newRecipeData });
    },
    onMutate: async (newRecipeData) => {
      const { previousData } = await update({
        queryKey: recipesOptions.queryKey,
        updateFn: (state) => {
          state.push(recipeFormDataToDTO(newRecipeData));
        },
      });

      return { previousData, queryKey: recipesOptions.queryKey };
    },
    onError: (_err, _vars, context) => {
      if (context) revert(context);
    },
    onSettled: () => queryClient.invalidateQueries(recipesOptions),
  });
};

export const useEditRecipe = ({ id }: { id: string | undefined }) => {
  const { update, revert } = useOptimisticUpdate();
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['editRecipe'],
    mutationFn: async (newRecipeData: Partial<RecipeFormData>) => {
      if (!id) return;
      return api.patch(`/recipes/${id}`, { data: newRecipeData });
    },
    onMutate: async (newRecipeData) => {
      const { previousData } = await update({
        queryKey: recipesOptions.queryKey,
        updateFn: (draft) => {
          const recipe = draft.find((r) => r.id === id);
          if (!recipe) return;

          Object.assign(recipe, omit(newRecipeData, ['ingredients']));

          if (newRecipeData.ingredients) {
            recipe.ingredients = newRecipeData.ingredients.map((ing) => ({
              ...ing,
              id: tempId(),
              quantity: +ing.quantity,
            }));
          }
        },
      });

      return { previousData, queryKey: recipesOptions.queryKey };
    },
    onError: (_err, _vars, context) => {
      if (context) revert(context);
    },
    onSettled: () => queryClient.invalidateQueries(recipesOptions),
  });
};

export const useDeleteRecipe = ({ id }: { id: string }) => {
  const { update, revert } = useOptimisticUpdate();
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['deleteRecipe'],
    mutationFn: async () => {
      return api.delete(`/recipes/${id}`);
    },
    onMutate: async () => {
      const { previousData } = await update({
        queryKey: recipesOptions.queryKey,
        updateFn: (state) => state.filter((r) => r.id !== id),
      });
      return { previousData, queryKey: recipesOptions.queryKey };
    },
    onError: (_err, _vars, context) => {
      if (context) revert(context);
    },
    onSettled: () => queryClient.invalidateQueries(recipesOptions),
  });
};
