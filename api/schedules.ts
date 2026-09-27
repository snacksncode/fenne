import { api } from '@/api';
import { queryOptions, useMutation, useQueries, useQueryClient } from '@tanstack/react-query';
import { indexBy, isDefined, isNullish, pickBy } from 'remeda';
import { getISOWeekString } from '@/date-tools';
import { MealEntryDTO, ScheduleMealEntry } from '@/api/types';
import { recipesOptions } from '@/api/recipes';
import { useState } from 'react';
import { tempId, useOptimisticUpdate } from '@/api/optimistic';
import { queryClient } from '@/query-client';
import { queryKeys } from '@/api/query-keys';

export const scheduleOptions = (weekKey: string) => {
  return queryOptions({
    queryKey: queryKeys.schedules.week(weekKey),
    queryFn: () => api.schedules.get(weekKey),
    staleTime: Infinity,
  });
};

export const useSchedule = ({ weeks, enabled }: { weeks: string[]; enabled?: boolean }) => {
  const queryClient = useQueryClient();
  const [initialWeeks] = useState(weeks);
  const queries = useQueries({ queries: weeks.map((weekKey) => ({ ...scheduleOptions(weekKey), enabled })) });
  const isInitialLoading = initialWeeks.some((weekKey) => {
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

queryClient.setMutationDefaults(['updateScheduleDay'], { mutationFn: api.schedules.updateDay });
export const useUpdateScheduleDay = () => {
  const { update, revert } = useOptimisticUpdate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['updateScheduleDay'],
    mutationFn: api.schedules.updateDay,
    onMutate: async ({ dateString, breakfast, dinner, lunch }) => {
      const weekKey = getISOWeekString(dateString);
      const { queryKey } = scheduleOptions(weekKey);

      const { previousData } = await update({
        queryKey,
        updateFn: (state) => {
          const day = state.find((d) => d.date === dateString);
          const recipes = queryClient.getQueryData(recipesOptions.queryKey);
          if (!day || !recipes) return;

          const processEntry = (entry: ScheduleMealEntry | null | undefined): MealEntryDTO | undefined | null => {
            if (isNullish(entry)) return entry;
            if (entry.type === 'dining_out') return { ...entry, id: tempId() };
            const recipe = recipes.find((r) => r.id === entry.recipe_id);
            if (!recipe) return undefined;
            return { id: tempId(), type: 'recipe', recipe };
          };

          const data = {
            breakfast: processEntry(breakfast),
            lunch: processEntry(lunch),
            dinner: processEntry(dinner),
          };

          Object.assign(day, pickBy(data, isDefined));
        },
      });

      return { previousData, queryKey };
    },
    onError: (_err, _vars, context) => {
      if (context) revert(context);
    },
    onSettled: (_data, _error, { dateString }) => {
      return queryClient.invalidateQueries(scheduleOptions(getISOWeekString(dateString)));
    },
  });
};

queryClient.setMutationDefaults(['deleteScheduleEntry'], { mutationFn: api.schedules.deleteEntry });
export const useDeleteScheduleEntry = () => {
  const { update, revert } = useOptimisticUpdate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['deleteScheduleEntry'],
    mutationFn: api.schedules.deleteEntry,
    onMutate: async ({ dateString, mealType }) => {
      const weekKey = getISOWeekString(dateString);
      const { queryKey } = scheduleOptions(weekKey);

      const { previousData } = await update({
        queryKey,
        updateFn: (draft) => {
          const day = draft.find((d) => d.date === dateString);
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
    onSettled: (_data, _error, { dateString }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.schedules.week(getISOWeekString(dateString)) });
    },
  });
};
