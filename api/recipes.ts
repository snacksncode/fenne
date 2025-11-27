import { api } from '@/api';
import { MealType, IngredientDTO, IngredientFormData } from '@/api/schedules';
import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export type RecipeDTO = {
  id: number;
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

export const recipeOptions = (id: number) => {
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

export const useRecipe = ({ id }: { id: number }) => {
  const recipes = useRecipes();

  return useQuery({
    ...recipeOptions(id),
    initialData: recipes.data?.find((recipe) => recipe.id === id),
  });
};

export const useAddRecipe = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['addRecipe'],
    mutationFn: async (newRecipeData: RecipeFormData) => {
      return api.post('/recipes', { data: newRecipeData });
    },
    onSettled: () => queryClient.invalidateQueries(recipesOptions),
  });
};

export const useEditRecipe = ({ id }: { id: number | undefined }) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['editRecipe'],
    mutationFn: async (newRecipeData: Partial<RecipeFormData>) => {
      if (!id) return;
      return api.patch(`/recipes/${id}`, { data: newRecipeData });
    },
    onSettled: () => queryClient.invalidateQueries(recipesOptions),
  });
};

export const useDeleteRecipe = ({ id }: { id: number }) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['deleteRecipe'],
    mutationFn: async () => {
      return api.delete(`/recipes/${id}`);
    },
    onSettled: () => queryClient.invalidateQueries(recipesOptions),
  });
};
