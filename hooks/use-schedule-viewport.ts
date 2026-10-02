import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { atom, useAtom } from 'jotai';
import { FlashListRef, ViewToken } from '@shopify/flash-list';
import { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useSchedule } from '@/api/schedules';
import { ScheduleDayDTO } from '@/api/types';
import { expandScheduleDateRange, getDatesFromISOWeek, getScheduleDateRange, getWeeksInDateRange,
  includeDateInScheduleRange } from '@/date-tools';
import { useActiveTabPress } from './use-active-tab-press';
import { useToday } from './use-today';

export const hasWeeklyScreenLoadedAtom = atom(false);
type ScheduleDay = { date: string; schedule: ScheduleDayDTO | undefined };

/** Owns list readiness, the visible date range, and return-to-today navigation. */
export const useScheduleViewport = (headerOffset: number) => {
  const today = useToday();
  const [range, setRange] = useState(() => getScheduleDateRange(today));
  const weeks = useMemo(() => getWeeksInDateRange(range), [range]);
  const { scheduleMap, isInitialLoading } = useSchedule({ weeks });
  const days = useMemo(() => weeks.flatMap(getDatesFromISOWeek)
    .map((date) => ({ date, schedule: scheduleMap[date] })), [weeks, scheduleMap]);
  const listRef = useRef<FlashListRef<ScheduleDay>>(null);
  const ready = useRef(false);
  const initialScrollDone = useRef(false);
  const returningToToday = useRef(false);
  const [hasLoaded, setHasLoaded] = useAtom(hasWeeklyScreenLoadedAtom);
  const [showBackToToday, setShowBackToToday] = useState(false);
  const frame = useRef<number | undefined>(undefined);

  useEffect(() => {
    setRange((current) => includeDateInScheduleRange(current, today));
  }, [today]);
  useEffect(() => () => {
    if (frame.current !== undefined) cancelAnimationFrame(frame.current);
    setHasLoaded(false);
  }, [setHasLoaded]);

  const scrollToToday = useCallback((animated: boolean) => {
    const index = days.findIndex((day) => day.date === today);
    if (index < 0 || !listRef.current || !ready.current) return;
    if (frame.current !== undefined) cancelAnimationFrame(frame.current);
    // Commit the updated data and native layout before asking FlashList to scroll.
    frame.current = requestAnimationFrame(() => {
      frame.current = undefined;
      void listRef.current?.scrollToIndex({ index, viewOffset: -headerOffset, animated });
    });
  }, [days, today, headerOffset]);

  const initializeViewport = useCallback(() => {
    if (!ready.current || isInitialLoading || initialScrollDone.current) return;
    initialScrollDone.current = true;
    returningToToday.current = true;
    scrollToToday(false);
  }, [isInitialLoading, scrollToToday]);
  useEffect(initializeViewport, [initializeViewport]);

  const returnToToday = useCallback(() => {
    returningToToday.current = true;
    setShowBackToToday(false);
    scrollToToday(true);
  }, [scrollToToday]);
  useActiveTabPress(returnToToday);

  const backToTodayStyle = useAnimatedStyle(() => ({
    opacity: withSpring(showBackToToday ? 1 : 0, { duration: 200 }),
    transform: [{ scale: withSpring(showBackToToday ? 1 : 0.8, { duration: 200 }) }],
  }));

  const onViewableItemsChanged = ({ viewableItems }: { viewableItems: ViewToken<ScheduleDay>[] }) => {
    if (!viewableItems.length || isInitialLoading) return;
    const todayVisible = viewableItems.some(({ item }) => item.date === today);
    if (todayVisible) {
      setHasLoaded(true);
      returningToToday.current = false;
    }
    if (!returningToToday.current) setShowBackToToday(!todayVisible);
  };

  return {
    days, listRef, hasLoaded, backToTodayStyle, returnToToday,
    hasSchedule: Object.keys(scheduleMap).length > 0,
    listProps: {
      onLoad: () => { ready.current = true; initializeViewport(); },
      onViewableItemsChanged,
      onScrollBeginDrag: () => { returningToToday.current = false; },
      ...(hasLoaded && {
        onStartReached: () => setRange((current) => expandScheduleDateRange(current, 'past')),
        onStartReachedThreshold: 0.2,
        onEndReachedThreshold: 0.2,
        onEndReached: () => setRange((current) => expandScheduleDateRange(current, 'future')),
      }),
    },
  };
};
