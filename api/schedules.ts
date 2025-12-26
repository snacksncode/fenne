import { queryOptions, useMutation, useQueries, useQueryClient } from '@tanstack/react-query';
import { first, indexBy, isNullish, last, omitBy } from 'remeda';
import { getDatesFromISOWeek, getISOWeekString } from '@/date-tools';
import { ensure } from '@/utils';
import { Unit } from '@/components/bottomSheets/select-unit-sheet';
import { RecipeDTO, recipesOptions } from '@/api/recipes';
import { api } from '@/api';
import { useRef } from 'react';
import { AisleCategory } from '@/api/groceries';
import { useOptimisticUpdate } from '@/api/optimistic';

export type MealType = 'breakfast' | 'lunch' | 'dinner';

export type IngredientDTO = {
  id: string;
  name: string;
  unit: Unit;
  quantity: number;
  aisle: AisleCategory;
};

export type IngredientFormData = {
  _id: string;
  name: string;
  unit: Unit;
  quantity: string;
  aisle: AisleCategory;
};

export type ScheduleDayDTO = {
  date: string;
  breakfast: RecipeDTO | null;
  lunch: RecipeDTO | null;
  dinner: RecipeDTO | null;
  is_shopping_day: boolean;
};

export type ScheduleDayInput = {
  date: string;
  breakfast_recipe_id?: string | null;
  lunch_recipe_id?: string | null;
  dinner_recipe_id?: string | null;
  is_shopping_day?: boolean;
};

export const scheduleOptions = (weekKey: string) => {
  return queryOptions({
    queryKey: ['schedule', weekKey] as const,
    queryFn: async () => {
      const weekDates = getDatesFromISOWeek(weekKey);
      const searchParams = new URLSearchParams();
      searchParams.append('start', ensure(first(weekDates)));
      searchParams.append('end', ensure(last(weekDates)));
      return api.get<ScheduleDayDTO[]>(`/schedule?${searchParams.toString()}`);
    },
    staleTime: Infinity,
  });
};

export const useSchedule = ({ weeks, enabled }: { weeks: string[]; enabled?: boolean }) => {
  const queryClient = useQueryClient();
  const initialWeeks = useRef(weeks);
  const queries = useQueries({ queries: weeks.map((weekKey) => ({ ...scheduleOptions(weekKey), enabled })) });
  const isInitialLoading = initialWeeks.current.some((weekKey) => {
    const queryState = queryClient.getQueryState(scheduleOptions(weekKey).queryKey);
    if (!queryState) return false;
    const isPending = queryState.status === 'pending';
    const isFetching = queryState.fetchStatus === 'fetching';
    return isFetching && isPending;
  });
  const allDays = queries.flatMap((q) => q.data ?? []);
  const scheduleMap = indexBy(allDays, (item) => item.date);
  const isLoading = queries.some((q) => q.isLoading);
  return { scheduleMap, queries, isInitialLoading, isLoading };
};

export const useUpdateScheduleDay = () => {
  const { update, revert } = useOptimisticUpdate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['updateScheduleDay'],
    mutationFn: async ({ date, data }: { date: string; data: ScheduleDayInput }) => {
      return api.put(`/schedule/${date}`, { data });
    },
    onMutate: async ({ date, data }) => {
      const weekKey = getISOWeekString(date);
      const { queryKey } = scheduleOptions(weekKey);

      const { previousData } = await update({
        queryKey,
        updateFn: (state) => {
          const day = state.find((d) => d.date === date);
          const recipes = queryClient.getQueryData(recipesOptions.queryKey);
          if (!day || !recipes) return;

          const { breakfast_recipe_id, lunch_recipe_id, dinner_recipe_id, is_shopping_day } = data;
          const breakfast = recipes.find((r) => r.id === breakfast_recipe_id);
          const lunch = recipes.find((r) => r.id === lunch_recipe_id);
          const dinner = recipes.find((r) => r.id === dinner_recipe_id);

          Object.assign(day, omitBy({ breakfast, dinner, lunch, is_shopping_day }, isNullish));
        },
      });

      return { previousData, queryKey };
    },
    onError: (_err, _vars, context) => {
      if (context) revert(context);
    },
    onSettled: (_data, _error, { date }) => {
      return queryClient.invalidateQueries(scheduleOptions(getISOWeekString(date)));
    },
  });
};

export const useDeleteScheduleEntry = () => {
  const { update, revert } = useOptimisticUpdate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['deleteScheduleEntry'],
    mutationFn: async ({ date, mealType }: { date: string; mealType: MealType }) => {
      return api.put(`/schedule/${date}`, {
        data: {
          ...(mealType === 'breakfast' && { breakfast_recipe_id: null }),
          ...(mealType === 'lunch' && { lunch_recipe_id: null }),
          ...(mealType === 'dinner' && { dinner_recipe_id: null }),
        },
      });
    },
    onMutate: async ({ date, mealType }) => {
      const weekKey = getISOWeekString(date);
      const { queryKey } = scheduleOptions(weekKey);

      const { previousData } = await update({
        queryKey,
        updateFn: (draft) => {
          const day = draft.find((d) => d.date === date);
          if (!day) return;

          if (mealType === 'breakfast') day.breakfast = null;
          if (mealType === 'lunch') day.lunch = null;
          if (mealType === 'dinner') day.dinner = null;
        },
      });

      return { previousData, queryKey };
    },
    onError: (_err, _vars, context) => {
      if (context) revert(context);
    },
    onSettled: (_data, _error, { date }) => {
      queryClient.invalidateQueries({ queryKey: scheduleOptions(getISOWeekString(date)).queryKey });
    },
  });
};
