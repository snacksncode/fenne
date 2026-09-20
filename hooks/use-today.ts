import { atom, useAtomValue } from 'jotai';
import { AppState } from 'react-native';
import { formatDateToISO, millisecondsUntilNextDay } from '@/date-tools';

const todayAtom = atom(formatDateToISO(new Date()));

// One clock and lifecycle subscription shared by all mounted date indicators.
todayAtom.onMount = (setToday) => {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const refresh = () => {
    clearTimeout(timer);
    const now = new Date();
    setToday(formatDateToISO(now));
    timer = setTimeout(refresh, millisecondsUntilNextDay(now));
  };

  const subscription = AppState.addEventListener('change', (state) => {
    if (state === 'active') refresh();
    else clearTimeout(timer);
  });
  refresh();

  return () => {
    clearTimeout(timer);
    subscription.remove();
  };
};

export const useToday = () => useAtomValue(todayAtom);
