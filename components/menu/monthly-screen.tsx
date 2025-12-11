import { TabParamList } from '@/app/(app)/(tabs)';
import { Button } from '@/components/button';
import { Text } from '@/components/Text';
import { scrollTargetAtom } from './weekly-screen';
import { ScheduleDayDTO, useSchedule } from '@/api/schedules';
import { formatDateToISO, getISOWeekString, parseISO } from '@/date-tools';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
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
import { useSetAtom } from 'jotai';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { isEmpty, pipe } from 'remeda';
import { Sheets, useBackToToday } from '@/components/menu/shared';
import { Month } from '@/components/menu/month';
import { colors } from '@/constants/colors';

const HEADER_SIZE = 105;

type Navigation = BottomTabNavigationProp<TabParamList, 'Monthly'>;

const Item = memo(function Item({
  scheduleMap,
  dateString,
  sheets,
}: {
  scheduleMap: Record<string, ScheduleDayDTO>;
  dateString: string;
  sheets: Sheets;
}) {
  const navigation = useNavigation<Navigation>();
  const setScrollTarget = useSetAtom(scrollTargetAtom);
  const startOfMonthDate = startOfMonth(parseISO(dateString));

  return (
    <View>
      <View style={{ alignSelf: 'center', marginBottom: 12 }}>
        <Text
          style={{
            color: '#4A3E36',
            fontSize: 20,
            lineHeight: 20 * 1.25,
            fontFamily: 'Satoshi-Bold',
            textAlign: 'center',
          }}
        >
          {format(startOfMonthDate, 'MMMM yyyy')}
        </Text>
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
          sheets.editCalendarDaySheetRef.current?.present({ dateString });
        }}
      />
    </View>
  );
});

const GAP_SIZE = 24;

type Props = {
  sheets: Sheets;
};

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

export const MonthlyScreen = ({ sheets }: Props) => {
  const monthlyListRef = useRef<FlashListRef<string>>(null);
  const hasScrolledRef = useRef(false);
  const backToToday = useBackToToday();
  const [hasCommitted, setHasCommitted] = useState(false);
  const insets = useSafeAreaInsets();
  const { weeks, months, expandIntoFuture, expandIntoPast } = useDateRange();
  const { scheduleMap } = useSchedule({ weeks });

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
        renderItem={({ item }) => <Item scheduleMap={scheduleMap} dateString={item} sheets={sheets} />}
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
