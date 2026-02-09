import { TabParamList } from '@/app/(app)/(tabs)';
import { Button } from '@/components/button';
import { Typography } from '@/components/Typography';
import { hasWeeklyScreenLoadedAtom, scrollTargetAtom } from './weekly-screen';
import { ScheduleDayDTO, useSchedule } from '@/api/schedules';
import { formatDateToISO, getISOWeekString, parseISO } from '@/date-tools';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { FlashList, FlashListRef, ViewToken } from '@shopify/flash-list';
import {
  addMonths,
  eachMonthOfInterval,
  eachWeekOfInterval,
  format,
  getUnixTime,
  isThisMonth,
  startOfMonth,
  startOfToday,
} from 'date-fns';
import { useAtomValue, useSetAtom } from 'jotai';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { isEmpty, pipe } from 'remeda';
import { useBackToToday } from '@/components/menu/shared';
import { SheetManager } from 'react-native-actions-sheet';
import { Month } from '@/components/menu/month';
import { colors } from '@/constants/colors';

const HEADER_SIZE = 105;

type Navigation = BottomTabNavigationProp<TabParamList>;

const Item = memo(function Item({
  scheduleMap,
  dateString,
}: {
  scheduleMap: Record<string, ScheduleDayDTO>;
  dateString: string;
}) {
  const navigation = useNavigation<Navigation>();
  const setScrollTarget = useSetAtom(scrollTargetAtom);
  const startOfMonthDate = startOfMonth(parseISO(dateString));

  return (
    <View>
      <View style={{ alignSelf: 'center', marginBottom: 12 }}>
        <Typography variant="heading-sm" weight="bold" style={{ textAlign: 'center' }}>
          {format(startOfMonthDate, 'MMMM yyyy')}
        </Typography>
        {isThisMonth(parseISO(dateString)) ? (
          <View
            style={{
              position: 'absolute',
              top: '50%',
              left: -16,
              transform: [{ translateY: '-50%' }],
              height: 6,
              width: 6,
              backgroundColor: colors.orange[500],
              borderRadius: 999,
            }}
          />
        ) : null}
      </View>
      <Month
        scheduleMap={scheduleMap}
        startOfMonthDate={startOfMonthDate}
        onDaySelect={({ dateString }) => {
          setScrollTarget({ dateString });
          navigation.navigate('Weekly');
        }}
        onDayLongPress={({ dateString }) => {
          SheetManager.show('edit-calendar-day-sheet', { payload: { dateString, navigation } });
        }}
      />
    </View>
  );
});

const GAP_SIZE = 24;

const useDateRange = () => {
  const [monthRange, setMonthRange] = useState({
    start: formatDateToISO(addMonths(startOfMonth(startOfToday()), -3)),
    end: formatDateToISO(addMonths(startOfMonth(startOfToday()), 3)),
  });

  const months = eachMonthOfInterval(monthRange).map(formatDateToISO);
  const weeks = eachWeekOfInterval(monthRange, { weekStartsOn: 1 }).map(formatDateToISO).map(getISOWeekString);

  const expandIntoPast = () => {
    setMonthRange((prev) => {
      const newStart = addMonths(parseISO(prev.start), -6);
      return { start: formatDateToISO(newStart), end: prev.end };
    });
  };

  const expandIntoFuture = () => {
    setMonthRange((prev) => {
      const newEnd = addMonths(parseISO(prev.end), 6);
      return { start: prev.start, end: formatDateToISO(newEnd) };
    });
  };

  return { weeks, months, expandIntoPast, expandIntoFuture };
};

const Content = () => {
  const isScreenFocused = useIsFocused();
  const monthlyListRef = useRef<FlashListRef<string>>(null);
  const hasScrolledRef = useRef(false);
  const backToToday = useBackToToday();
  const [hasCommitted, setHasCommitted] = useState(false);
  const insets = useSafeAreaInsets();
  const { weeks, months, expandIntoFuture, expandIntoPast } = useDateRange();
  const { scheduleMap } = useSchedule({ weeks, enabled: isScreenFocused });

  const scrollToMonth = useCallback(({ dateString, animated }: { dateString: string; animated: boolean }) => {
    setImmediate(() => {
      monthlyListRef.current?.scrollToItem({
        item: dateString,
        viewPosition: 0.5,
        animated,
      });
    });
  }, []);

  const scrollToToday = useCallback(
    ({ animated }: { animated: boolean }) => {
      const today = months.find((dateString) => {
        return dateString === formatDateToISO(startOfMonth(startOfToday()));
      });
      if (!today || !monthlyListRef.current) return;
      scrollToMonth({ dateString: today, animated });
    },
    [months, scrollToMonth]
  );

  useEffect(() => {
    if (!monthlyListRef.current || hasScrolledRef.current || !hasCommitted) return;
    scrollToToday({ animated: false });
    hasScrolledRef.current = true;
  }, [hasCommitted, scrollToToday]);

  const handleViewableItemsChanged = ({ viewableItems }: { viewableItems: ViewToken<string>[] }) => {
    if (isEmpty(viewableItems)) return;
    backToToday.handleViewableItemsChanged({
      viewableItems,
      todayItem: pipe(startOfToday(), startOfMonth, formatDateToISO),
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
        ref={monthlyListRef}
        data={months}
        renderItem={({ item }) => <Item scheduleMap={scheduleMap} dateString={item} />}
        style={{ backgroundColor: '#FEF7EA', flex: 1 }}
        keyExtractor={(item) => getUnixTime(item).toString()}
        ItemSeparatorComponent={() => <View style={{ height: GAP_SIZE }} />}
        contentContainerStyle={{
          paddingHorizontal: 20,
          marginTop: insets.top + HEADER_SIZE,
          paddingBottom: insets.bottom + 88,
        }}
        onStartReachedThreshold={0.2}
        onEndReachedThreshold={0.2}
        onStartReached={expandIntoPast}
        onEndReached={expandIntoFuture}
        onCommitLayoutEffect={() => setHasCommitted(true)}
        onViewableItemsChanged={handleViewableItemsChanged}
      />
    </>
  );
};

export const MonthlyScreen = () => {
  const hasWeeklyScreenLoaded = useAtomValue(hasWeeklyScreenLoadedAtom);

  if (!hasWeeklyScreenLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', backgroundColor: colors.cream[100], justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return <Content />;
};
