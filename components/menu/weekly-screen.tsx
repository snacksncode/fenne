import { Text } from '@/components/Text';
import { atom, useAtom, useAtomValue } from 'jotai';
import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  addDays,
  addWeeks,
  eachDayOfInterval,
  eachWeekOfInterval,
  endOfWeek,
  format,
  getUnixTime,
  isAfter,
  isBefore,
  isToday,
  startOfToday,
  startOfWeek,
} from 'date-fns';

import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  FadeOutDown,
  LayoutAnimationConfig,
  LayoutAnimationsValues,
  withSpring,
} from 'react-native-reanimated';

import { difference, filter, first, isEmpty, isTruthy } from 'remeda';
import { Tag } from '@/components/svgs/tag';
import { FlashList, FlashListRef, ViewToken } from '@shopify/flash-list';
import { Button } from '@/components/button';
import { formatDateToISO, getDatesFromISOWeek, getISOWeekString, parseISO } from '@/date-tools';
import { Sheets, useBackToToday } from '@/components/menu/shared';
import { MealTypeKicker } from '@/components/menu/meal-type-kicker';
import { Plus, Soup } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { RecipeDTO } from '@/api/recipes';
import { ScheduleDayDTO, MealType, useSchedule } from '@/api/schedules';
import { PressableWithHaptics } from '@/components/pressable-with-feedback';
import { useMount } from '@/hooks/use-mount';

const GAP_SIZE = 16;
const HEADER_SIZE = 105;

const LayoutTransition = (values: LayoutAnimationsValues) => {
  'worklet';

  const deltaX = Math.abs(values.targetOriginX - values.currentOriginX);
  const deltaY = Math.abs(values.targetOriginY - values.currentOriginY);
  const shouldAnimate = deltaX < 200 && deltaY < 200;

  return {
    initialValues: {
      originX: values.currentOriginX,
      originY: values.currentOriginY,
      width: values.currentWidth,
      height: values.currentHeight,
    },
    animations: {
      originX: shouldAnimate ? withSpring(values.targetOriginX) : values.targetOriginX,
      originY: shouldAnimate ? withSpring(values.targetOriginY) : values.targetOriginY,
      width: withSpring(values.targetWidth),
      height: withSpring(values.targetHeight),
    },
  };
};

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

const Meal = ({
  meal,
  sheets,
  dateString,
}: {
  meal: RecipeDTO & { type: MealType };
  sheets: Sheets;
  dateString: string;
}) => (
  <PressableWithHaptics
    onLongPress={() => sheets.editMealSheetRef.current?.present({ meal, mealType: meal.type, dateString })}
    style={{ gap: 2 }}
    scaleTo={0.985}
  >
    <MealTypeKicker type={meal.type} />
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
  </PressableWithHaptics>
);

const DayCard = ({ data, sheets }: { data: ScheduleDayDTO; sheets: Sheets }) => {
  const hasLoaded = useAtomValue(hasWeeklyScreenLoadedAtom);
  const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner'];
  const meals = filter(
    [
      data.breakfast ? { ...data.breakfast, type: 'breakfast' as const } : null,
      data.lunch ? { ...data.lunch, type: 'lunch' as const } : null,
      data.dinner ? { ...data.dinner, type: 'dinner' as const } : null,
    ],
    isTruthy
  );

  const onPress = () => {
    const alreadyAddedMealTypes = filter(
      [data.breakfast && 'breakfast', data.lunch && 'lunch', data.dinner && 'dinner'] satisfies (MealType | null)[],
      isTruthy
    );
    sheets.scheduleMealSheetRef.current?.present({
      dateString: data.date,
      mealType: first(difference(mealTypes, alreadyAddedMealTypes)),
    });
  };

  return (
    <Animated.View
      exiting={FadeOut}
      entering={FadeIn}
      layout={hasLoaded ? LayoutTransition : undefined}
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
      <LayoutAnimationConfig skipEntering>
        {meals.map((meal, index) => {
          return (
            <Animated.View key={meal.type + meal.id} entering={FadeIn} exiting={FadeOut} layout={LayoutTransition}>
              <View>
                <Meal meal={meal} dateString={data.date} sheets={sheets} />
                {index !== meals.length - 1 ? (
                  <View
                    style={{
                      height: 1,
                      backgroundColor: '#EEDBB9',
                      marginVertical: 8,
                    }}
                  />
                ) : null}
              </View>
            </Animated.View>
          );
        })}
        <LayoutAnimationConfig skipExiting>
          {meals.length !== 3 ? (
            <Animated.View
              entering={FadeInDown.springify()}
              exiting={FadeOutDown.springify()}
              layout={LayoutTransition}
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
              <View
                style={{
                  position: 'relative',
                  top: 0,
                  borderTopWidth: 1,
                  borderStyle: 'dashed',
                  borderColor: '#EEDBB9',
                }}
              />
              <PressableWithHaptics
                style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}
                onPress={onPress}
              >
                <Animated.View style={[{ flexDirection: 'row', gap: 4 }]}>
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
              </PressableWithHaptics>
            </Animated.View>
          ) : null}
        </LayoutAnimationConfig>
      </LayoutAnimationConfig>
    </Animated.View>
  );
};

const EmptyDayCard = ({ onPress }: { onPress: () => void }) => {
  const hasLoaded = useAtomValue(hasWeeklyScreenLoadedAtom);

  return (
    <Animated.View layout={hasLoaded ? LayoutTransition : undefined} exiting={FadeOut} entering={FadeIn}>
      <PressableWithHaptics onPress={onPress}>
        <View
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
        </View>
      </PressableWithHaptics>
    </Animated.View>
  );
};

const Day = ({
  dateString,
  data,
  sheets,
}: {
  dateString: string;
  data: ScheduleDayDTO | undefined;
  sheets: Sheets;
}) => {
  if (!data) return <DayCardSkeleton />;

  if (!data.breakfast && !data.lunch && !data.dinner) {
    const onPress = () => sheets.scheduleMealSheetRef.current?.present({ dateString });
    return <EmptyDayCard onPress={onPress} />;
  }

  return <DayCard sheets={sheets} data={data} />;
};

const Item = ({
  dateString,
  data,
  sheets,
}: {
  dateString: string;
  data: ScheduleDayDTO | undefined;
  sheets: Sheets;
}) => {
  const hasLoaded = useAtomValue(hasWeeklyScreenLoadedAtom);
  const date = parseISO(dateString);

  return (
    <View style={{ gap: 12 }}>
      <Animated.View
        style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}
        layout={hasLoaded ? LayoutTransition : undefined}
      >
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
        {data?.is_shopping_day ? (
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
      </Animated.View>
      <Day data={data} dateString={dateString} sheets={sheets} />
    </View>
  );
};

export const scrollTargetAtom = atom<{ dateString: string } | null>(null);

const useDateRange = () => {
  const [dateRange, setDateRange] = useState({
    start: formatDateToISO(addWeeks(startOfWeek(startOfToday(), { weekStartsOn: 1 }), -1)),
    end: formatDateToISO(addWeeks(endOfWeek(startOfToday(), { weekStartsOn: 1 }), 1)),
  });

  const expandRange = (dateString: string) => {
    const date = parseISO(dateString);

    if (isBefore(date, parseISO(dateRange.start))) {
      const newStart = addWeeks(startOfWeek(date, { weekStartsOn: 1 }), -1);
      setDateRange({ ...dateRange, start: formatDateToISO(newStart) });
    }

    if (isAfter(date, parseISO(dateRange.end))) {
      const newEnd = addWeeks(endOfWeek(date, { weekStartsOn: 1 }), 1);
      setDateRange({ ...dateRange, end: formatDateToISO(newEnd) });
    }
  };

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
    expandRange,
    expandWeekIntoPast,
    expandWeekIntoFuture,
  };
};

type Props = {
  sheets: Sheets;
};

export const hasWeeklyScreenLoadedAtom = atom(false);

export const WeeklyScreen = ({ sheets }: Props) => {
  const [hasLoaded, setHasWeeklyScreenLoaded] = useAtom(hasWeeklyScreenLoadedAtom);
  const weeklyListRef = useRef<FlashListRef<string>>(null);
  const insets = useSafeAreaInsets();
  const hasScrolledRef = useRef(false);
  const [scrollTarget, setScrollTarget] = useAtom(scrollTargetAtom);
  const { weeks, expandWeekIntoFuture, expandWeekIntoPast, expandRange } = useDateRange();
  const backToToday = useBackToToday();
  const { scheduleMap, isInitialLoading } = useSchedule({ weeks });
  const days = weeks.flatMap(getDatesFromISOWeek);

  useMount(() => {
    // unmount happens during logout
    return () => setHasWeeklyScreenLoaded(false);
  });

  const scrollToDate = ({
    dateString,
    animated,
    offset,
  }: {
    dateString: string;
    animated: boolean;
    offset?: number;
  }) => {
    setImmediate(() => {
      weeklyListRef.current?.scrollToItem({
        item: dateString,
        viewOffset: -1 * (insets.top + HEADER_SIZE + GAP_SIZE + (offset ?? 0)),
        animated,
      });
    });
  };

  useEffect(() => {
    if (!scrollTarget || !weeklyListRef.current) return;
    if (!days.includes(scrollTarget.dateString)) return expandRange(scrollTarget.dateString);
    scrollToDate({ dateString: scrollTarget.dateString, offset: 60, animated: true });
    setScrollTarget(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days, scrollTarget]);

  const scrollToToday = ({ animated }: { animated: boolean }) => {
    scrollToDate({ dateString: formatDateToISO(startOfToday()), animated });
  };

  const handleViewableItemsChanged = ({ viewableItems }: { viewableItems: ViewToken<string>[] }) => {
    if (isEmpty(viewableItems) || isInitialLoading) return;

    const today = formatDateToISO(startOfToday());
    if (viewableItems.find(({ item }) => item === today)) setHasWeeklyScreenLoaded(true);

    backToToday.handleViewableItemsChanged({
      viewableItems,
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
          onPress={() => {
            backToToday.setShow({ state: false, lock: Date.now() });
            scrollToToday({ animated: true });
          }}
        />
      </Animated.View>
      {!hasLoaded && (
        <View style={{ position: 'absolute', inset: 0, zIndex: 1, backgroundColor: '#FEF7EA' }}>
          <WeeklyScreenSkeleton />
        </View>
      )}
      {!isEmpty(scheduleMap) && (
        <FlashList
          maxItemsInRecyclePool={0}
          ref={weeklyListRef}
          data={days}
          renderItem={({ item }) => <Item dateString={item} data={scheduleMap[item]} sheets={sheets} />}
          style={{ backgroundColor: colors.cream[100], flex: 1 }}
          keyExtractor={(item) => getUnixTime(item).toString()}
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
