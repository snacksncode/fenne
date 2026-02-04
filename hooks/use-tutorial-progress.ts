import { useGroceries } from '@/api/groceries';
import { useRecipes } from '@/api/recipes';
import { useSchedule } from '@/api/schedules';
import { useCurrentUser } from '@/api/auth';
import { isGuest } from '@/utils/is-guest';
import { formatDateToISO, getISOWeekString } from '@/date-tools';
import { startOfTomorrow } from 'date-fns';

export const useTutorialProgress = () => {
  const { data: currentUser } = useCurrentUser();
  const { data: recipes } = useRecipes();
  const { data: groceries } = useGroceries();

  const tomorrowISO = formatDateToISO(startOfTomorrow());
  const tomorrowWeek = getISOWeekString(tomorrowISO);
  const schedule = useSchedule({ weeks: [tomorrowWeek] });

  const hasRecipes = (recipes?.length ?? 0) > 0;
  const tomorrowSchedule = schedule.scheduleMap[tomorrowISO];
  const hasSchedule = !!(tomorrowSchedule?.breakfast || tomorrowSchedule?.lunch || tomorrowSchedule?.dinner);
  const hasGroceries = (groceries?.length ?? 0) > 0;

  const steps = [hasRecipes, hasSchedule, hasGroceries];
  const totalSteps = steps.length;
  const completedSteps = steps.filter(Boolean).length;
  const isComplete = completedSteps === totalSteps;

  return {
    totalSteps,
    completedSteps,
    isComplete,
    hasRecipes,
    hasSchedule,
    hasGroceries,
    isGuest: isGuest(currentUser?.user),
  };
};
