import { api } from '@/api';
import { MealType, IngredientDTO, IngredientFormData } from '@/api/schedules';
import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useOptimisticUpdate, tempId } from '@/api/optimistic';
import { omit } from 'remeda';
import { queryClient } from '@/query-client';

export type RecipeDTO = {
  id: string;
  name: string;
  meal_types: MealType[];
  ingredients: IngredientDTO[];
  time_in_minutes: number;
  liked: boolean;
  notes: string;
};

export type RecipeFormData = Omit<RecipeDTO, 'id' | 'ingredients'> & {
  ingredients: IngredientFormData[];
};

export const recipesOptions = queryOptions({
  queryKey: ['recipes'] as const,
  queryFn: api.recipes.getAll,
  staleTime: Infinity,
});

export const recipeOptions = (id: string) => {
  return queryOptions({
    queryKey: ['recipes', id] as const,
    queryFn: () => api.recipes.get(id),
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

queryClient.setMutationDefaults(['addRecipe'], { mutationFn: api.recipes.add });
export const useAddRecipe = () => {
  const { update, revert } = useOptimisticUpdate();
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['addRecipe'],
    mutationFn: api.recipes.add,
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

queryClient.setMutationDefaults(['editRecipe'], { mutationFn: api.recipes.edit });
export const useEditRecipe = () => {
  const { update, revert } = useOptimisticUpdate();
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['editRecipe'],
    mutationFn: api.recipes.edit,
    onMutate: async (newRecipeData) => {
      const optimisticUpdateRecipe = (recipe: RecipeDTO) => {
        Object.assign(recipe, omit(newRecipeData, ['ingredients']));

        if (newRecipeData.ingredients) {
          recipe.ingredients = newRecipeData.ingredients.map((ing) => ({
            ...ing,
            id: tempId(),
            quantity: +ing.quantity,
          }));
        }
      };

      const recipesContext = await update({
        queryKey: recipesOptions.queryKey,
        updateFn: (draft) => {
          const recipe = draft.find((r) => r.id === newRecipeData.id);
          if (recipe) optimisticUpdateRecipe(recipe);
        },
      });

      const recipeContext = await update({
        queryKey: recipeOptions(newRecipeData.id).queryKey,
        updateFn: (draft) => optimisticUpdateRecipe(draft),
      });

      return {
        recipesContext: { queryKey: recipesOptions.queryKey, previousData: recipesContext.previousData },
        recipeContext: { queryKey: recipeOptions(newRecipeData.id).queryKey, previousData: recipeContext.previousData },
      };
    },
    onError: (_err, _vars, context) => {
      if (context?.recipeContext) revert(context.recipeContext);
      if (context?.recipesContext) revert(context.recipesContext);
    },
    onSettled: () => queryClient.invalidateQueries(recipesOptions),
  });
};

queryClient.setMutationDefaults(['deleteRecipe'], { mutationFn: api.recipes.delete });
export const useDeleteRecipe = () => {
  const { update, revert } = useOptimisticUpdate();
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['deleteRecipe'],
    mutationFn: api.recipes.delete,
    onMutate: async ({ id }) => {
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
