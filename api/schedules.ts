import { queryClient } from '@/query-client';
import type { MutationFunctionContext } from '@tanstack/react-query';
import { getDatesFromISOWeek, getISOWeekString } from '@/date-tools';
import { first, last, indexBy } from 'remeda';
import { refreshFamilyData } from '@/lib/family-data';
import { client } from '@/api/client';
import { ensure } from '@/utils';
import { MealType, ScheduleDayDTO, ScheduleDayInput } from '@/api/types';
import { QueryClient, queryOptions, useMutation, useQueries, useQueryClient } from '@tanstack/react-query';
import { recipesQuery } from '@/api/recipes';
import { useState } from 'react';
import { tempId } from '@/api/optimistic';
import { queryKeys } from '@/api/query-keys';

export const schedulesRequests = {
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
};

export const scheduleQuery = (weekKey: string) => {
  return queryOptions({
    queryKey: queryKeys.schedules.week(weekKey),
    queryFn: () => schedulesRequests.get(weekKey),
    staleTime: Infinity,
  });
};

export const useSchedule = ({ weeks, enabled }: { weeks: string[]; enabled?: boolean }) => {
  const queryClient = useQueryClient();
  const [initialWeeks] = useState(weeks);
  const queries = useQueries({ queries: weeks.map((weekKey) => ({ ...scheduleQuery(weekKey), enabled })) });
  const isInitialLoading = initialWeeks.some((weekKey) => {
    const queryState = queryClient.getQueryState(scheduleQuery(weekKey).queryKey);
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

type MealSlots = Partial<Pick<ScheduleDayDTO, 'breakfast' | 'lunch' | 'dinner'>>;

async function updateMealSlots(client: QueryClient, dateString: string, slots: MealSlots) {
  const options = scheduleQuery(getISOWeekString(dateString));
  await client.cancelQueries(options);
  const query = client.getQueryCache().find(options);
  const previous = client.getQueryData(options.queryKey)?.find((day) => day.date === dateString);
  client.setQueryData(options.queryKey, (days) => days?.map((day) => day.date === dateString ? { ...day, ...slots } : day));
  const optimistic = client.getQueryData(options.queryKey)?.find((day) => day.date === dateString);
  return { query, queryKey: options.queryKey, previous, optimistic, slots };
}

function restoreMealSlots(client: QueryClient, context: Awaited<ReturnType<typeof updateMealSlots>> | undefined) {
  if (!context?.previous || client.getQueryCache().find({ queryKey: context.queryKey }) !== context.query) return;
  const previous = context.previous;
  client.setQueryData(context.queryKey, (days) => days?.map((day) => {
    if (day.date !== previous.date) return day;
    const restored = { ...day };
    for (const slot of ['breakfast', 'lunch', 'dinner'] as const) {
      if (slot in context.slots && day[slot] === context.optimistic?.[slot]) restored[slot] = previous[slot];
    }
    return restored;
  }));
}

const refreshScheduleDay = (
  _data: unknown, _error: Error | null, { dateString }: { dateString: string },
  _result: unknown, { client }: MutationFunctionContext,
) => refreshFamilyData(client, { resource: 'schedules', data: { dates: [dateString] } });

export const updateScheduleDayMutation = {
  meta: { persist: true },
  mutationKey: ['updateScheduleDay'],
  mutationFn: schedulesRequests.updateDay,
  onSettled: refreshScheduleDay,
};

queryClient.setMutationDefaults(updateScheduleDayMutation.mutationKey, updateScheduleDayMutation);

export const useUpdateScheduleDay = () => {
  const queryClient = useQueryClient();
  return useMutation({
    ...updateScheduleDayMutation,
    onMutate: ({ dateString, ...entries }) => {
      const recipes = queryClient.getQueryData(recipesQuery.queryKey);
      const slots: MealSlots = {};
      for (const slot of ['breakfast', 'lunch', 'dinner'] as const) {
        const entry = entries[slot];
        if (entry === undefined) continue;
        if (entry === null) { slots[slot] = null; continue; }
        if (entry.type === 'dining_out') { slots[slot] = { ...entry, id: tempId() }; continue; }
        const recipe = recipes?.find(({ id }) => id === entry.recipe_id);
        if (recipe) slots[slot] = { id: tempId(), type: 'recipe', recipe };
      }
      return updateMealSlots(queryClient, dateString, slots);
    },
    onError: (_error, _variables, context) => restoreMealSlots(queryClient, context),
  });
};

export const deleteScheduleEntryMutation = {
  meta: { persist: true },
  mutationKey: ['deleteScheduleEntry'],
  mutationFn: schedulesRequests.deleteEntry,
  onSettled: refreshScheduleDay,
};

queryClient.setMutationDefaults(deleteScheduleEntryMutation.mutationKey, deleteScheduleEntryMutation);

export const useDeleteScheduleEntry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    ...deleteScheduleEntryMutation,
    onMutate: ({ dateString, mealType }) => updateMealSlots(queryClient, dateString, { [mealType]: null }),
    onError: (_error, _variables, context) => restoreMealSlots(queryClient, context),
  });
};
