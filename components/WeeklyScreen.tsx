import { Text } from '@/components/Text';
import { atom, useAtom } from 'jotai';
import React, { RefObject, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  addWeeks,
  differenceInSeconds,
  eachDayOfInterval,
  endOfWeek,
  format,
  formatISO,
  getUnixTime,
  isAfter,
  isBefore,
  isToday,
  isTomorrow,
  startOfToday,
  startOfWeek,
} from 'date-fns';
import { Pancake } from '@/components/svgs/pancake';
import { Ham } from 'lucide-react-native';
import { Salad } from '@/components/svgs/salad';
import { Soup } from '@/components/svgs/soup';

import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { scheduleOnRN } from 'react-native-worklets';
import { doNothing, isEmpty } from 'remeda';
import { Tag } from '@/components/svgs/tag';
import { TestBottomSheetModal } from '@/components/TestBottomSheetModal';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { FlashList, FlashListRef, ViewToken } from '@shopify/flash-list';
import { Button } from '@/components/button';
import { dateToString, parseDateString } from '@/date-tools';

const GAP_SIZE = 16;
const HEADER_SIZE = 105;
const LOCK_TIMEOUT_SECONDS = 2;

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

export const MealTypeKicker = ({ type }: { type: 'breakfast' | 'lunch' | 'dinner' }) => (
  <View style={{ gap: 4, flexDirection: 'row', alignItems: 'center' }}>
    {type === 'breakfast' ? (
      <Pancake size={16} color="#CF9E7D" />
    ) : type === 'lunch' ? (
      <Salad size={16} color="#CF9E7D" />
    ) : (
      <Ham size={16} color="#CF9E7D" />
    )}
    <Text
      style={{
        color: '#CF9E7D',
        fontFamily: 'Satoshi-Bold',
        fontSize: 12,
        lineHeight: 12 * 1.5,
      }}
    >
      {type.toUpperCase()}
    </Text>
  </View>
);

const MockedFullDay = () => {
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
      <View style={{ gap: 2 }}>
        <MealTypeKicker type="breakfast" />
        <Text
          style={{
            color: '#4A3E36',
            fontFamily: 'Satoshi-Black',
            fontSize: 20,
            lineHeight: 20 * 1.25,
          }}
        >
          Oatmeal
        </Text>
      </View>
      <View
        style={{
          height: 1,
          backgroundColor: '#4A3E36',
          opacity: 0.1,
          marginVertical: 8,
        }}
      />
      <View style={{ gap: 2 }}>
        <MealTypeKicker type="lunch" />
        <Text
          style={{
            color: '#4A3E36',
            fontFamily: 'Satoshi-Black',
            fontSize: 20,
            lineHeight: 20 * 1.25,
          }}
        >
          Extraordinary Pizza
        </Text>
      </View>
      <View
        style={{
          height: 1,
          backgroundColor: '#4A3E36',
          opacity: 0.1,
          marginVertical: 8,
        }}
      />
      <View style={{ gap: 2 }}>
        <MealTypeKicker type="dinner" />
        <Text
          style={{
            color: '#4A3E36',
            fontFamily: 'Satoshi-Black',
            fontSize: 20,
            lineHeight: 20 * 1.25,
          }}
        >
          Cottage Cheese Supreme
        </Text>
      </View>
    </View>
  );
};

const MockedEmptyDay = ({ onPress }: { onPress: () => void }) => {
  const scale = useSharedValue(1);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const vibrate = () => {
    const style = Haptics.ImpactFeedbackStyle.Light;
    Haptics.impactAsync(style).catch(doNothing);
  };

  const onTapGestureSuccess = () => {
    onPress();
  };

  const onLongPressGestureSuccess = () => {
    alert('Long press');
  };

  const tap = Gesture.Tap()
    .onBegin(() => (scale.value = withSpring(0.97)))
    .onEnd((_event, success) => {
      if (success) {
        scale.value = withSpring(1);
        scheduleOnRN(vibrate);
        scheduleOnRN(onTapGestureSuccess);
      }
    });

  const longPress = Gesture.LongPress()
    .onStart(() => {
      scale.value = withSpring(0.97);
      scheduleOnRN(vibrate);
      scheduleOnRN(onLongPressGestureSuccess);
    })
    .onFinalize(() => (scale.value = withSpring(1)));

  const gesture = Gesture.Exclusive(longPress, tap);

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
          style,
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

const Day = ({ date, sheet }: { date: Date; sheet: RefObject<BottomSheetModal | null> }) => {
  if (isToday(date)) return <MockedFullDay />;

  if (isTomorrow(date)) {
    return <MockedEmptyDay onPress={() => sheet.current?.present()} />;
  }

  return (
    <View
      style={{
        borderRadius: 4,
        padding: 8,
        borderWidth: 1,
        borderColor: 'black',
      }}
    >
      <Text style={{ ...(isToday(date) && { color: 'red' }) }}>{formatISO(date)}</Text>
    </View>
  );
};

const Item = ({ dateString, sheet }: { dateString: string; sheet: RefObject<BottomSheetModal | null> }) => {
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
      <Day date={date} sheet={sheet} />
    </View>
  );
};

export const dateRangeAtom = atom({
  start: dateToString(addWeeks(startOfWeek(startOfToday(), { weekStartsOn: 1 }), -1)),
  end: dateToString(addWeeks(endOfWeek(startOfToday(), { weekStartsOn: 1 }), 1)),
});

export const scrollTargetAtom = atom<{ dateString: string; animated: boolean } | null>(null);

const useDateRange = () => {
  const [dateRange, setDateRange] = useAtom(dateRangeAtom);

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
    // console.log('load more past dates ↑');
    setDateRange((prev) => {
      const newStart = addWeeks(parseDateString(prev.start), -1);
      return { ...prev, start: dateToString(newStart) };
    });
  };

  const expandWeekIntoFuture = () => {
    // console.log('load more future dates ↓');
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

export const WeeklyScreen = () => {
  const weeklyListRef = useRef<FlashListRef<string>>(null);
  const sheet = useRef<BottomSheetModal>(null);
  const insets = useSafeAreaInsets();
  const hasScrolledRef = useRef(false);
  const [hasCommitted, setHasCommitted] = useState(false);
  const [showBackToToday, setShowBackToToday] = useState({ state: false, lock: Date.now() });
  const [scrollTarget, setScrollTarget] = useAtom(scrollTargetAtom);
  const { dateRange, expandWeekIntoFuture, expandWeekIntoPast, expandRange } = useDateRange();

  const backToTodayOpacity = useSharedValue(0);
  const backToTodayScale = useSharedValue(0.8);

  useEffect(() => {
    backToTodayOpacity.value = withSpring(showBackToToday.state ? 1 : 0, { duration: 200 });
    backToTodayScale.value = withSpring(showBackToToday.state ? 1 : 0.8, { duration: 200 });
  }, [backToTodayOpacity, backToTodayScale, showBackToToday.state]);

  const backToTodayStyle = useAnimatedStyle(() => ({
    opacity: backToTodayOpacity.value,
    transform: [{ scale: backToTodayScale.value }],
  }));

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
  }, [hasCommitted, scrollToToday]);

  const handleViewableItemsChanged = ({ viewableItems }: { viewableItems: ViewToken<string>[] }) => {
    if (isEmpty(viewableItems) || !hasCommitted) return;
    if (showBackToToday.lock && differenceInSeconds(Date.now(), showBackToToday.lock) < LOCK_TIMEOUT_SECONDS) return;
    const today = dateToString(startOfToday());
    const todayIsVisible = Boolean(viewableItems.find((i) => i.item === today));
    setShowBackToToday({ state: !todayIsVisible, lock: 0 });
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
          backToTodayStyle,
        ]}
      >
        <Button
          text="Back to today"
          size="small"
          onPress={() => {
            setShowBackToToday({ state: false, lock: Date.now() });
            scrollToToday({ animated: true });
          }}
        />
      </Animated.View>
      <FlashList
        ref={weeklyListRef}
        data={days}
        renderItem={({ item }) => <Item dateString={item} sheet={sheet} />}
        style={{ backgroundColor: '#FEF7EA', flex: 1 }}
        keyExtractor={(item) => getUnixTime(item).toString()}
        ItemSeparatorComponent={() => <View style={{ height: GAP_SIZE }} />}
        contentContainerStyle={{
          paddingHorizontal: 20,
          marginTop: insets.top + HEADER_SIZE,
          paddingBottom: insets.bottom + 88,
        }}
        onStartReached={expandWeekIntoPast}
        onEndReached={expandWeekIntoFuture}
        onCommitLayoutEffect={() => setHasCommitted(true)}
        onViewableItemsChanged={handleViewableItemsChanged}
      />
      <TestBottomSheetModal ref={sheet} onPress={doNothing} />
    </>
  );
};
