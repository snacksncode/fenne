import { first, isDefined, last, pickBy } from 'remeda';
import { client } from '@/api/client';
import { getDatesFromISOWeek } from '@/date-tools';
import { ensure } from '@/utils';
import { AisleCategory, GroceryItemDTO, PreviewRecipeDTO, RecipeDTO, MealType, ScheduleDayDTO, ScheduleDayInput } from '@/api/types';
import { AuthResponse, CurrentUserDTO, UnitPreference } from '@/api/auth';
import { InvitationsDTO } from '@/api/invitations';
import { IngredientOption } from '@/api/food-items';

export const api = {
  auth: {
    login: (data: { email: string; password: string }) => {
      return client.post<AuthResponse>('/login', data);
    },
    loginAsGuest: () => {
      return client.post<AuthResponse>('/guest');
    },
    convertGuest: (data: { name: string; email: string; password: string }) => {
      return client.post('/convert_guest', data);
    },
    getCurrentUser: () => {
      return client.get<CurrentUserDTO>('/me');
    },
    changePassword: (data: { current_password: string; new_password: string }) => {
      return client.post('/change_password', data);
    },
    changeDetails: (data: { name?: string; email?: string }) => {
      return client.post('/change_details', { data });
    },
    deleteAccount: () => {
      return client.delete('/delete_account');
    },
  },
  groceries: {
    getAll: () => {
      return client.get<GroceryItemDTO[]>('/grocery_items');
    },
    add: (itemData: Omit<GroceryItemDTO, 'id'>) => {
      return client.post('/grocery_items', { data: itemData });
    },
    edit: (data: Partial<GroceryItemDTO>) => {
      const { id, ...itemData } = data;
      return client.patch(`/grocery_items/${id}`, { data: itemData });
    },
    delete: (data: { id: string }) => {
      return client.delete(`/grocery_items/${data.id}`);
    },
    generate: (data: { start: string; end: string; ingredients: Record<string, number> }) => {
      return client.post('/grocery_items/generate', data);
    },
    preview: (data: { start: string; end: string }) => {
      const params = new URLSearchParams({ start: data.start, end: data.end });
      return client.get<PreviewRecipeDTO[]>(`/grocery_items/preview?${params}`);
    },
    checkout: () => {
      return client.post('/grocery_items/checkout');
    },
  },
  recipes: {
    getAll: () => {
      return client.get<RecipeDTO[]>('/recipes');
    },
    get: (id: string) => {
      return client.get<RecipeDTO>(`/recipes/${id}`);
    },
    add: (recipe: RecipeDTO) => {
      return client.post('/recipes', { data: recipe });
    },
    edit: (recipe: Partial<RecipeDTO> & { id: string }) => {
      return client.patch(`/recipes/${recipe.id}`, { data: pickBy(recipe, isDefined) });
    },
    delete: (data: { id: string }) => {
      return client.delete(`/recipes/${data.id}`);
    },
  },
  schedules: {
    get: (weekKey: string) => {
      const weekDates = getDatesFromISOWeek(weekKey);
      const searchParams = new URLSearchParams();
      searchParams.append('start', ensure(first(weekDates)));
      searchParams.append('end', ensure(last(weekDates)));
      return client.get<ScheduleDayDTO[]>(`/schedule?${searchParams.toString()}`);
    },
    updateDay: (data: ScheduleDayInput) => {
      const { dateString, ...requestData } = data;
      return client.put(`/schedule/${dateString}`, requestData);
    },
    deleteEntry: (data: { dateString: string; mealType: MealType }) => {
      const { dateString, mealType } = data;
      return client.put(`/schedule/${dateString}`, {
        ...(mealType === 'breakfast' && { breakfast: null }),
        ...(mealType === 'lunch' && { lunch: null }),
        ...(mealType === 'dinner' && { dinner: null }),
      });
    },
  },
  invitations: {
    getAll: () => {
      return client.get<InvitationsDTO>('/invitations');
    },
    post: (data: { email: string }) => {
      return client.post('/invitations', data);
    },
    accept: (data: { id: string }) => {
      return client.post(`/invitations/${data.id}/accept`);
    },
    decline: (data: { id: string }) => {
      return client.post(`/invitations/${data.id}/decline`);
    },
    remove: (data: { id: string }) => {
      return client.delete(`/invitations/${data.id}`);
    },
    leaveFamily: () => {
      return client.post('/leave_family');
    },
  },
  family: {
    updatePreferences: (data: { unit_preference: UnitPreference }) => {
      return client.patch('/family/preferences', { data });
    },
  },
  foodItems: {
    byQuery: (query: string) => {
      return client.get<IngredientOption[]>(`/food_items?q=${encodeURIComponent(query)}`);
    },
    createIfNeeded: (body: { name: string; aisle: AisleCategory }) => {
      return client.post<IngredientOption>('/food_items', body);
    },
    delete: (id: string) => {
      return client.delete(`/food_items/${id}`);
    },
  },
};
