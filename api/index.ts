import { first, isDefined, last, pickBy } from 'remeda';
import { client } from '@/api/client';
import { getDatesFromISOWeek } from '@/date-tools';
import { ensure } from '@/utils';
import { GroceryItemDTO } from '@/api/groceries';
import { RecipeDTO, RecipeFormData } from '@/api/recipes';
import { ScheduleDayDTO, ScheduleDayInput, MealType } from '@/api/schedules';
import { AuthResponse, CurrentUserDTO } from '@/api/auth';
import { InvitationsDTO } from '@/api/invitations';
import { IngredientOption } from '@/api/search';

export const api = {
  auth: {
    login: (data: { email: string; password: string }) => {
      return client.post<AuthResponse>('/login', data);
    },
    signup: (data: { name: string; email: string; password: string }) => {
      return client.post<AuthResponse>('/signup', data);
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
    generate: (range: { start: string; end: string }) => {
      return client.post('/grocery_items/generate', range);
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
    add: (recipeData: RecipeFormData) => {
      const { ingredients, ...data } = recipeData;
      const mappedIngredients = ingredients.map((ingredient) => ({ ...ingredient, quantity: +ingredient.quantity }));
      return client.post('/recipes', { data: { ...data, ingredients: mappedIngredients } });
    },
    edit: (data: { id: string } & Partial<RecipeFormData>) => {
      const { id, ingredients, ...recipeData } = data;
      const mappedIngredients = ingredients?.map((ingredient) => ({ ...ingredient, quantity: +ingredient.quantity }));
      return client.patch(`/recipes/${id}`, {
        data: pickBy({ ...recipeData, ingredients: mappedIngredients }, isDefined),
      });
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
  search: {
    byQuery: (query: string) => {
      return client.get<IngredientOption[]>(`/search?q=${encodeURIComponent(query)}`);
    },
    delete: (id: string) => {
      return client.delete(`/search/${id}`);
    },
  },
};
