import { ListLayoutView } from '@/components/list-layout-view';
import { AnimatedFlashList } from '@/components/animated-flash-list';
import { useActiveTabPress } from '@/hooks/use-active-tab-press';
import { Typography } from '@/components/Typography';
import { atom, useAtom } from 'jotai';
import React, { useCallback, useRef, useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  addDays,
  addWeeks,
  eachDayOfInterval,
  eachWeekOfInterval,
  endOfWeek,
  format,
  startOfToday,
  startOfWeek,
} from 'date-fns';

import Animated from 'react-native-reanimated';

import { difference, first, isEmpty, isTruthy } from 'remeda';
import { FlashListRef, ViewToken } from '@shopify/flash-list';
import { Button } from '@/components/button';
import { formatDateToISO, getDatesFromISOWeek, getISOWeekString, parseISO } from '@/date-tools';
import { useBackToToday } from '@/components/menu/shared';
import { useSheets } from '@/lib/sheet-context';
import { MealEntry } from '@/components/menu/meal-entry';
import { Plus, Soup } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { MealType, ScheduleDayDTO } from '@/api/types';
import { useSchedule } from '@/api/schedules';
import { PressableWithHaptics } from '@/components/pressable-with-feedback';
import { useMount } from '@/hooks/use-mount';
import { useOnAppActive } from '@/hooks/use-on-app-active';
import { useToday } from '@/hooks/use-today';

const GAP_SIZE = 16;
const HEADER_SIZE = 59;

const DayCardSkeleton = () => {
  return (
    <View
      style={{
        backgroundColor: '#FEF2DD',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
        borderColor: '#EEDBB9',
        borderWidth: 1,
        borderBottomWidth: 2,
        height: 116,
        gap: 8,
      }}
    >
      <View>
        <View style={{ width: '40%', height: 12, backgroundColor: '#EEDBB9', borderRadius: 4 }} />
        <View style={{ width: '80%', height: 18, backgroundColor: '#EEDBB9', borderRadius: 4, marginTop: 4 }} />
      </View>
      <View style={{ height: 1, backgroundColor: '#EEDBB9' }} />
      <View>
        <View style={{ width: '30%', height: 12, backgroundColor: '#EEDBB9', borderRadius: 4 }} />
        <View style={{ width: '60%', height: 18, backgroundColor: '#EEDBB9', borderRadius: 4, marginTop: 4 }} />
      </View>
    </View>
  );
};

const ItemSkeleton = ({ date }: { date: Date }) => {
  const today = useToday();
  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
        <Typography variant="heading-sm" weight="bold">
          {formatDateToISO(date) === today ? format(date, 'EEEE') : format(date, 'EEEE, d MMMM')}
        </Typography>
        {formatDateToISO(date) === today ? (
          <View
            style={{
              backgroundColor: colors.orange[500],
              borderColor: colors.orange[600],
              borderWidth: 1,
              borderBottomWidth: 2,
              borderRadius: 999,
              height: 24,
              paddingHorizontal: 12,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="body-xs" weight="bold" color="white">
              Today
            </Typography>
          </View>
        ) : null}
      </View>
      <DayCardSkeleton />
    </View>
  );
};

const WeeklyScreenSkeleton = () => {
  const insets = useSafeAreaInsets();
  const start = startOfToday();
  const end = addDays(start, 7);
  const days = eachDayOfInterval({ start, end });

  return (
    <View
      style={{
        paddingHorizontal: 20,
        paddingTop: insets.top + HEADER_SIZE + GAP_SIZE,
        paddingBottom: insets.bottom + 88,
        gap: GAP_SIZE,
      }}
    >
      {days.map((date, index) => (
        <ItemSkeleton date={date} key={index} />
      ))}
    </View>
  );
};

export function getThreeWeekSlice(today: Date) {
  const MONDAY = 1;
  const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: MONDAY });
  const startOfPrevWeek = addWeeks(startOfCurrentWeek, -1);
  const startOfNextWeek = addWeeks(startOfCurrentWeek, 1);

  const weekdays = (start: Date) => {
    return eachDayOfInterval({
      start,
      end: endOfWeek(start, { weekStartsOn: MONDAY }),
    });
  };

  return [...weekdays(startOfPrevWeek), ...weekdays(startOfCurrentWeek), ...weekdays(startOfNextWeek)];
}


export const getFirstMissingMealType = ({ breakfast, lunch, dinner }: ScheduleDayDTO) => {
  const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner'];
  const alreadyAddedMealTypes: MealType[] = [];
  if (breakfast) alreadyAddedMealTypes.push('breakfast');
  if (lunch) alreadyAddedMealTypes.push('lunch');
  if (dinner) alreadyAddedMealTypes.push('dinner');
  return first(difference(mealTypes, alreadyAddedMealTypes));
};

const DayCard = ({ data }: { data: ScheduleDayDTO }) => {
  const sheets = useSheets();
  const entries = [
    data.breakfast ? { ...data.breakfast, mealType: 'breakfast' as const } : null,
    data.lunch ? { ...data.lunch, mealType: 'lunch' as const } : null,
    data.dinner ? { ...data.dinner, mealType: 'dinner' as const } : null,
  ].filter(isTruthy);

  const onPress = () => {
    sheets.present('schedule-meal-sheet', {
      data: { type: 'meal', dateString: data.date },
    });
  };

  return (
    <ListLayoutView
      style={{
        backgroundColor: '#FEF2DD',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
        borderColor: '#4A3E36',
        borderWidth: 1,
        borderBottomWidth: 2,
      }}
    >
      {entries.map((entry, index) => (
        <ListLayoutView key={entry.mealType}>
          <MealEntry entry={entry} dateString={data.date} />
          {index !== entries.length - 1 ? (
            <ListLayoutView
              style={{
                height: 1,
                backgroundColor: '#EEDBB9',
                marginVertical: 8,
              }}
            />
          ) : null}
        </ListLayoutView>
      ))}
      {entries.length !== 3 ? (
        <ListLayoutView
          style={{
            marginHorizontal: -16,
            marginBottom: -12,
            marginTop: 16,
            borderBottomLeftRadius: 8,
            borderBottomRightRadius: 8,
            backgroundColor: '#FEEED2',
            height: 40,
          }}
        >
          <ListLayoutView
            style={{
              position: 'relative',
              top: 0,
              borderTopWidth: 1,
              borderStyle: 'dashed',
              borderColor: '#EEDBB9',
            }}
          />
          <PressableWithHaptics style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }} onPress={onPress}>
            <ListLayoutView style={{ flexDirection: 'row', gap: 4 }}>
              <Plus color="#4A3E36" size={18} strokeWidth={2.5} />
              <Typography variant="body-sm" weight="bold">
                Another Meal?
              </Typography>
            </ListLayoutView>
          </PressableWithHaptics>
        </ListLayoutView>
      ) : null}
    </ListLayoutView>
  );
};

const EmptyDayCard = ({ onPress }: { onPress: () => void }) => {
  return (
    <PressableWithHaptics onPress={onPress}>
      <ListLayoutView
        style={{
          backgroundColor: '#FEF4E2',
          padding: 16,
          paddingBottom: 20,
          borderRadius: 8,
          borderColor: '#D1C5B3',
          borderStyle: 'dashed',
          borderWidth: 1,
          alignItems: 'center',
          justifyContent: 'center',
          height: 116,
        }}
      >
        <Soup size={24} color="#4A3E36" />
        <Typography variant="body-base" weight="black" style={{ marginTop: 8 }}>
          No meals planned
        </Typography>
        <Typography variant="body-sm" weight="bold">
          Tap to add a meal
        </Typography>
      </ListLayoutView>
    </PressableWithHaptics>
  );
};

const Day = ({ dateString, data }: { dateString: string; data: ScheduleDayDTO | undefined }) => {
  const sheets = useSheets();
  if (!data) return <DayCardSkeleton />;

  if (!data.breakfast && !data.lunch && !data.dinner) {
    const onPress = () => {
      sheets.present('schedule-meal-sheet', { data: { type: 'meal', dateString } });
    };
    return <EmptyDayCard onPress={onPress} />;
  }

  return <DayCard data={data} />;
};

const Item = ({ dateString, data }: { dateString: string; data: ScheduleDayDTO | undefined }) => {
  const date = parseISO(dateString);
  const today = useToday();

  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
        <Typography variant="heading-sm" weight="bold">
          {format(date, 'EEEE')}
        </Typography>
        {dateString === today ? (
          <View
            style={{
              backgroundColor: colors.orange[500],
              borderColor: colors.orange[600],
              borderWidth: 1,
              borderBottomWidth: 2,
              borderRadius: 999,
              height: 24,
              paddingHorizontal: 12,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="body-xs" weight="bold" color="white">
              Today
            </Typography>
          </View>
        ) : null}
        <Typography variant="body-sm" weight="bold" color={colors.brown[700]} style={{ flex: 1, textAlign: 'right' }}>
          {format(date, 'd MMM')}
        </Typography>
      </View>
      <Day data={data} dateString={dateString} />
    </View>
  );
};

const useDateRange = () => {
  const [dateRange, setDateRange] = useState({
    start: formatDateToISO(addWeeks(startOfWeek(startOfToday(), { weekStartsOn: 1 }), -1)),
    end: formatDateToISO(addWeeks(endOfWeek(startOfToday(), { weekStartsOn: 1 }), 1)),
  });

  const expandWeekIntoPast = () => {
    setDateRange((prev) => {
      const newStart = addWeeks(parseISO(prev.start), -1);
      return { ...prev, start: formatDateToISO(newStart) };
    });
  };

  const expandWeekIntoFuture = () => {
    setDateRange((prev) => {
      const newEnd = addWeeks(parseISO(prev.end), 1);
      return { ...prev, end: formatDateToISO(newEnd) };
    });
  };

  const weeks = eachWeekOfInterval(dateRange, { weekStartsOn: 1 }).map(formatDateToISO).map(getISOWeekString);

  return {
    weeks,
    expandWeekIntoPast,
    expandWeekIntoFuture,
  };
};

export const hasWeeklyScreenLoadedAtom = atom(false);

type MenuDay = { date: string; schedule: ScheduleDayDTO | undefined };

export const WeeklyScreen = () => {
  const [hasLoaded, setHasWeeklyScreenLoaded] = useAtom(hasWeeklyScreenLoadedAtom);
  const [, setFocusCount] = useState(0);
  const weeklyListRef = useRef<FlashListRef<MenuDay>>(null);
  const insets = useSafeAreaInsets();
  const hasScrolledRef = useRef(false);
  const { weeks, expandWeekIntoFuture, expandWeekIntoPast } = useDateRange();
  const backToToday = useBackToToday();
  const { scheduleMap, isInitialLoading } = useSchedule({ weeks });
  const days = weeks.flatMap(getDatesFromISOWeek).map((date) => ({ date, schedule: scheduleMap[date] }));

  useOnAppActive(() => setFocusCount((c) => c + 1));

  useMount(() => {
    // unmount happens during logout
    return () => setHasWeeklyScreenLoaded(false);
  });

  const scrollToDate = useCallback(
    ({ dateString, animated }: { dateString: string; animated: boolean }) => {
      setImmediate(() => {
        const index = days.findIndex((day) => day.date === dateString);
        if (index < 0) return;
        weeklyListRef.current?.scrollToIndex({
          index,
          viewOffset: -1 * (insets.top + HEADER_SIZE + GAP_SIZE),
          animated,
        });
      });
    },
    [days, insets.top]
  );

  const scrollToToday = useCallback(
    ({ animated }: { animated: boolean }) => {
      scrollToDate({ dateString: formatDateToISO(startOfToday()), animated });
    },
    [scrollToDate]
  );

  const { setShow } = backToToday;
  const returnToToday = useCallback(() => {
    setShow({ state: false, lock: Date.now() });
    scrollToToday({ animated: true });
  }, [setShow, scrollToToday]);

  useActiveTabPress(returnToToday);

  const handleViewableItemsChanged = ({ viewableItems }: { viewableItems: ViewToken<MenuDay>[] }) => {
    if (isEmpty(viewableItems) || isInitialLoading) return;

    const today = formatDateToISO(startOfToday());
    if (viewableItems.find(({ item }) => item.date === today)) setHasWeeklyScreenLoaded(true);

    backToToday.handleViewableItemsChanged({
      viewableItems: viewableItems.map((token) => ({ ...token, item: token.item.date })),
      todayItem: formatDateToISO(startOfToday()),
    });
  };

  return (
    <>
      <Animated.View
        style={[
          {
            width: '100%',
            alignItems: 'center',
            position: 'absolute',
            zIndex: 10,
            top: insets.top + HEADER_SIZE + 16,
          },
          backToToday.style,
        ]}
      >
        <Button
          variant="primary"
          text="Back to today"
          size="small"
          onPress={returnToToday}
        />
      </Animated.View>
      {!hasLoaded && (
        <View style={{ position: 'absolute', inset: 0, zIndex: 1, backgroundColor: '#FEF7EA' }}>
          <WeeklyScreenSkeleton />
        </View>
      )}
      {!isEmpty(scheduleMap) && (
        <AnimatedFlashList
          ref={weeklyListRef}
          data={days}
          renderItem={({ item }) => <Item dateString={item.date} data={item.schedule} />}
          style={{ backgroundColor: colors.cream[100], flex: 1 }}
          keyExtractor={(item) => item.date}
          ItemSeparatorComponent={() => <View style={{ height: GAP_SIZE }} />}
          contentContainerStyle={{
            paddingHorizontal: 20,
            marginTop: insets.top + HEADER_SIZE,
            paddingBottom: insets.bottom + 88,
          }}
          {...(hasLoaded && {
            onStartReached: expandWeekIntoPast,
            onStartReachedThreshold: 0.2,
            onEndReachedThreshold: 0.2,
            onEndReached: expandWeekIntoFuture,
          })}
          onCommitLayoutEffect={() => {
            if (!isInitialLoading) {
              if (hasScrolledRef.current) return;
              scrollToToday({ animated: false });
              hasScrolledRef.current = true;
            }
          }}
          onViewableItemsChanged={handleViewableItemsChanged}
        />
      )}
    </>
  );
};
