import { Text } from '@/components/Text';
import { atom, useAtom } from 'jotai';
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  addDays,
  addWeeks,
  eachDayOfInterval,
  endOfWeek,
  format,
  getUnixTime,
  isAfter,
  isBefore,
  isSameDay,
  isToday,
  isTomorrow,
  startOfToday,
  startOfWeek,
} from 'date-fns';
import { Soup } from '@/components/svgs/soup';

import Animated from 'react-native-reanimated';

import { GestureDetector } from 'react-native-gesture-handler';
import { difference, first, isEmpty } from 'remeda';
import { Tag } from '@/components/svgs/tag';
import { FlashList, FlashListRef, ViewToken } from '@shopify/flash-list';
import { Button } from '@/components/button';
import { dateToString, parseDateString } from '@/date-tools';
import { Sheets, useBackToToday } from '@/components/menu/shared';
import { MealTypeKicker } from '@/components/menu/meal-type-kicker';
import { Plus } from '@/components/svgs/plus';
import { useOnPressWithFeedback } from '@/hooks/use-tap-feedback-gesture';
import { SplashScreen } from 'expo-router';

const GAP_SIZE = 16;
const HEADER_SIZE = 105;

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

const Meal = ({ meal, sheets }: { meal: MealDTO; sheets: Sheets }) => {
  const { gesture, scaleStyle } = useOnPressWithFeedback({
    onLongPress: () => sheets.editMealSheetRef.current?.present({ meal }),
    scaleTo: 0.985,
  });

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[{ gap: 2 }, scaleStyle]}>
        <MealTypeKicker type={meal.mealType} />
        <Text
          style={{
            color: '#4A3E36',
            fontFamily: 'Satoshi-Black',
            fontSize: 20,
            lineHeight: 20 * 1.25,
          }}
        >
          {meal.name}
        </Text>
      </Animated.View>
    </GestureDetector>
  );
};

export type MealType = 'breakfast' | 'lunch' | 'dinner';

export type MealDTO = {
  name: string;
  mealType: MealType;
};

const MockedFullDay = (props: { meals: MealDTO[]; sheets: Sheets; date: Date }) => {
  const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner'];
  const onPress = () => {
    const alreadyAddedMealTypes = props.meals.map((m) => m.mealType);
    props.sheets.scheduleMealSheetRef.current?.present({
      dateString: dateToString(props.date),
      mealType: first(difference(mealTypes, alreadyAddedMealTypes)),
    });
  };

  const addAnother = useOnPressWithFeedback({ onPress });

  return (
    <View
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
      {props.meals.map((meal, index) => {
        return (
          <View key={index}>
            <Meal meal={meal} sheets={props.sheets} />
            {index !== props.meals.length - 1 ? (
              <View
                style={{
                  height: 1,
                  backgroundColor: '#EEDBB9',
                  marginVertical: 8,
                }}
              />
            ) : null}
          </View>
        );
      })}
      {props.meals.length !== 3 ? (
        <GestureDetector gesture={addAnother.gesture}>
          <View
            style={{
              marginHorizontal: -16,
              marginBottom: -12,
              marginTop: 16,
              backgroundColor: '#FEEED2',
              borderBottomLeftRadius: 8,
              borderBottomRightRadius: 8,
              borderStyle: 'dashed',
              borderColor: '#EEDBB9',
              borderTopWidth: 1,
              height: 40,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Animated.View style={[{ flexDirection: 'row', gap: 4 }, addAnother.scaleStyle]}>
              <Plus color="#4A3E36" size={18} strokeWidth={2.5} />
              <Text
                style={{
                  color: '#4A3E36',
                  fontFamily: 'Satoshi-Bold',
                  fontSize: 14,
                }}
              >
                Another Meal?
              </Text>
            </Animated.View>
          </View>
        </GestureDetector>
      ) : null}
    </View>
  );
};

const MockedEmptyDay = ({ onPress }: { onPress: () => void }) => {
  const { gesture, scaleStyle } = useOnPressWithFeedback({ onPress });

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[
          {
            backgroundColor: '#FEF4E2',
            padding: 16,
            paddingBottom: 20,
            borderRadius: 8,
            borderColor: '#D1C5B3',
            borderStyle: 'dashed',
            borderWidth: 1,
            alignItems: 'center',
          },
          scaleStyle,
        ]}
      >
        <Soup size={24} color="#4A3E36" />
        <Text
          style={{
            marginTop: 8,
            fontFamily: 'Satoshi-Black',
            fontSize: 16,
            lineHeight: 16 * 1.25,
            color: '#4A3E36',
          }}
        >
          No meals planned
        </Text>
        <Text
          style={{
            marginTop: 2,
            fontFamily: 'Satoshi-Bold',
            fontSize: 14,
            lineHeight: 14,
            color: '#4A3E36',
          }}
        >
          Tap to add a meal
        </Text>
      </Animated.View>
    </GestureDetector>
  );
};

const Day = ({ date, sheets }: { date: Date; sheets: Sheets }) => {
  if (isToday(date)) {
    return (
      <MockedFullDay
        sheets={sheets}
        date={date}
        meals={[
          { mealType: 'breakfast', name: 'Oatmeal' },
          { mealType: 'lunch', name: 'Extraordinary Pizza' },
          { mealType: 'dinner', name: 'Cottage Cheese Supreme' },
        ]}
      />
    );
  }

  if (isTomorrow(date)) {
    return (
      <MockedFullDay
        sheets={sheets}
        date={date}
        meals={[
          { mealType: 'breakfast', name: 'Oatmeal' },
          { mealType: 'lunch', name: 'Extraordinary Pizza' },
        ]}
      />
    );
  }

  if (isSameDay(date, addDays(startOfToday(), 2))) {
    return <MockedFullDay sheets={sheets} date={date} meals={[{ mealType: 'breakfast', name: 'Oatmeal' }]} />;
  }

  return (
    <MockedEmptyDay onPress={() => sheets.scheduleMealSheetRef.current?.present({ dateString: dateToString(date) })} />
  );
};

const Item = ({ dateString, sheets }: { dateString: string; sheets: Sheets }) => {
  const date = parseDateString(dateString);
  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
        <Text
          style={{
            fontFamily: 'Satoshi-Bold',
            fontSize: 20,
            lineHeight: 20 * 1.5,
            color: '#4A3E36',
          }}
        >
          {isToday(date) ? format(date, 'EEEE') : format(date, 'EEEE, d MMMM')}
        </Text>
        {isToday(date) ? (
          <View
            style={{
              backgroundColor: '#F9954D',
              borderColor: '#EC8032',
              borderWidth: 1,
              borderBottomWidth: 2,
              borderRadius: 999,
              height: 24,
              paddingHorizontal: 12,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                fontFamily: 'Satoshi-Bold',
                fontSize: 11,
                color: 'white',
              }}
            >
              Today
            </Text>
          </View>
        ) : null}

        {isTomorrow(date) ? (
          <View
            style={{
              backgroundColor: '#61AA64',
              borderColor: '#5B8B5D',
              borderWidth: 1,
              borderBottomWidth: 2,
              borderRadius: 999,
              height: 24,
              paddingHorizontal: 12,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Tag color="#FEF7EA" size={14} />
          </View>
        ) : null}
      </View>
      <Day date={date} sheets={sheets} />
    </View>
  );
};

export const scrollTargetAtom = atom<{ dateString: string; animated: boolean } | null>(null);

const useDateRange = () => {
  const [dateRange, setDateRange] = useState({
    start: dateToString(addWeeks(startOfWeek(startOfToday(), { weekStartsOn: 1 }), -1)),
    end: dateToString(addWeeks(endOfWeek(startOfToday(), { weekStartsOn: 1 }), 1)),
  });

  const expandRange = (dateString: string) => {
    const date = parseDateString(dateString);

    if (isBefore(date, parseDateString(dateRange.start))) {
      const newStart = addWeeks(startOfWeek(date, { weekStartsOn: 1 }), -1);
      setDateRange({ ...dateRange, start: dateToString(newStart) });
    }

    if (isAfter(date, parseDateString(dateRange.end))) {
      const newEnd = addWeeks(endOfWeek(date, { weekStartsOn: 1 }), 1);
      setDateRange({ ...dateRange, end: dateToString(newEnd) });
    }
  };

  const expandWeekIntoPast = () => {
    setDateRange((prev) => {
      const newStart = addWeeks(parseDateString(prev.start), -1);
      return { ...prev, start: dateToString(newStart) };
    });
  };

  const expandWeekIntoFuture = () => {
    setDateRange((prev) => {
      const newEnd = addWeeks(parseDateString(prev.end), 1);
      return { ...prev, end: dateToString(newEnd) };
    });
  };

  return {
    dateRange,
    setDateRange,
    expandRange,
    expandWeekIntoPast,
    expandWeekIntoFuture,
  };
};

type Props = {
  sheets: Sheets;
};

export const WeeklyScreen = ({ sheets }: Props) => {
  const weeklyListRef = useRef<FlashListRef<string>>(null);
  const insets = useSafeAreaInsets();
  const hasScrolledRef = useRef(false);
  const [hasCommitted, setHasCommitted] = useState(false);
  const [scrollTarget, setScrollTarget] = useAtom(scrollTargetAtom);
  const { dateRange, expandWeekIntoFuture, expandWeekIntoPast, expandRange } = useDateRange();
  const backToToday = useBackToToday();

  const days = useMemo(() => {
    const { start, end } = dateRange;
    return eachDayOfInterval({ start, end }).map(dateToString);
  }, [dateRange]);

  const scrollToDate = useCallback(
    ({ dateString, animated, offset }: { dateString: string; animated: boolean; offset?: number }) => {
      setImmediate(() => {
        weeklyListRef.current?.scrollToItem({
          item: dateString,
          viewOffset: -1 * (insets.top + HEADER_SIZE + GAP_SIZE + (offset ?? 0)),
          animated,
        });
      });
    },
    [insets.top]
  );

  useEffect(() => {
    if (!scrollTarget || !weeklyListRef.current) return;
    if (!days.includes(scrollTarget.dateString)) return expandRange(scrollTarget.dateString);
    scrollToDate({ dateString: scrollTarget.dateString, animated: scrollTarget.animated, offset: 60 });
    setScrollTarget(null);
  }, [days, expandRange, scrollTarget, scrollToDate, setScrollTarget]);

  const scrollToToday = useCallback(
    ({ animated }: { animated: boolean }) => {
      const today = days.find((day) => isToday(day));
      if (!today || !weeklyListRef.current) return;
      scrollToDate({ dateString: today, animated });
    },
    [days, scrollToDate]
  );

  useLayoutEffect(() => {
    if (!weeklyListRef.current || hasScrolledRef.current || !hasCommitted) return;
    scrollToToday({ animated: false });
    hasScrolledRef.current = true;
    SplashScreen.hide();
  }, [hasCommitted, scrollToToday]);

  const handleViewableItemsChanged = ({ viewableItems }: { viewableItems: ViewToken<string>[] }) => {
    if (isEmpty(viewableItems)) return;
    backToToday.handleViewableItemsChanged({
      viewableItems,
      todayItem: dateToString(startOfToday()),
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
          onPress={() => {
            backToToday.setShow({ state: false, lock: Date.now() });
            scrollToToday({ animated: true });
          }}
        />
      </Animated.View>
      <FlashList
        ref={weeklyListRef}
        data={days}
        renderItem={({ item }) => <Item dateString={item} sheets={sheets} />}
        style={{ backgroundColor: '#FEF7EA', flex: 1 }}
        keyExtractor={(item) => getUnixTime(item).toString()}
        ItemSeparatorComponent={() => <View style={{ height: GAP_SIZE }} />}
        contentContainerStyle={{
          paddingHorizontal: 20,
          marginTop: insets.top + HEADER_SIZE,
          paddingBottom: insets.bottom + 88,
        }}
        onStartReached={expandWeekIntoPast}
        onStartReachedThreshold={0.2}
        onEndReachedThreshold={0.2}
        onEndReached={expandWeekIntoFuture}
        onCommitLayoutEffect={() => setHasCommitted(true)}
        onViewableItemsChanged={handleViewableItemsChanged}
      />
    </>
  );
};
