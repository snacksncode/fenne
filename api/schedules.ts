import { queryOptions, useMutation, useQueries, useQueryClient } from '@tanstack/react-query';
import { first, indexBy, last } from 'remeda';
import { getDatesFromISOWeek, getISOWeekString } from '@/date-tools';
import { ensure } from '@/utils';
import { Unit } from '@/components/bottomSheets/select-unit-sheet';
import { RecipeDTO } from '@/api/recipes';
import { api } from '@/api';
import { useRef } from 'react';
import { AisleCategory } from '@/api/groceries';
import { hoursToMilliseconds, minutesToMilliseconds } from 'date-fns';

// ============================================================================
// Types matching Rails backend
// ============================================================================

export type MealType = 'breakfast' | 'lunch' | 'dinner';

export type IngredientDTO = {
  id: number;
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
  date: string; // ISO date string YYYY-MM-DD
  breakfast: RecipeDTO | null;
  lunch: RecipeDTO | null;
  dinner: RecipeDTO | null;
  is_shopping_day: boolean;
};

export type ScheduleDayInput = {
  date: string;
  breakfast_recipe_id?: number | null;
  lunch_recipe_id?: number | null;
  dinner_recipe_id?: number | null;
  is_shopping_day?: boolean;
};

// ============================================================================
// Query Options
// ============================================================================

/**
 * Query options for fetching a week's schedule
 * @param weekKey - ISO week string (e.g., "2025-W12")
 */
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

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to fetch schedules for multiple weeks
 * Returns a map of dates to schedule days for easy lookup
 */
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
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['updateScheduleDay'],
    mutationFn: async ({ date, data }: { date: string; data: ScheduleDayInput }) => {
      return api.put(`/schedule/${date}`, { data });
    },
    onSettled: (_data, _error, { date }) => {
      return queryClient.invalidateQueries({ queryKey: ['schedule', getISOWeekString(date)] });
    },
  });
};

export const useDeleteScheduleEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['updateScheduleDay'],
    mutationFn: async ({ date, mealType }: { date: string; mealType: MealType }) => {
      return api.put(`/schedule/${date}`, {
        data: {
          ...(mealType === 'breakfast' && { breakfast_recipe_id: null }),
          ...(mealType === 'lunch' && { lunch_recipe_id: null }),
          ...(mealType === 'dinner' && { dinner_recipe_id: null }),
        },
      });
    },
    onSettled: (_data, _error, { date }) => {
      return queryClient.invalidateQueries({ queryKey: ['schedule', getISOWeekString(date)] });
    },
  });
};
