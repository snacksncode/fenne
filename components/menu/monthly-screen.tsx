import { TabParamList } from '@/app/(tabs)';
import { Button } from '@/components/button';
import { Text } from '@/components/Text';
import { scrollTargetAtom } from './weekly-screen';
import { dateToString, parseDateString } from '@/date-tools';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { FlashList, FlashListRef, ViewToken } from '@shopify/flash-list';
import {
  addMonths,
  eachMonthOfInterval,
  format,
  getUnixTime,
  isThisMonth,
  isToday,
  startOfMonth,
  startOfToday,
} from 'date-fns';
import { useSetAtom } from 'jotai';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { isEmpty, pipe } from 'remeda';
import { Sheets, useBackToToday } from '@/components/menu/shared';
import { Month } from '@/components/menu/month';

const HEADER_SIZE = 105;

type Navigation = BottomTabNavigationProp<TabParamList, 'Monthly'>;

const Item = memo(function Item({ dateString, sheets }: { dateString: string; sheets: Sheets }) {
  const navigation = useNavigation<Navigation>();
  const setScrollTarget = useSetAtom(scrollTargetAtom);
  const startOfMonthDate = startOfMonth(parseDateString(dateString));

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
        {isThisMonth(parseDateString(dateString)) ? (
          <View
            style={{
              position: 'absolute',
              top: '50%',
              left: -16,
              transform: [{ translateY: '-50%' }],
              height: 6,
              width: 6,
              backgroundColor: '#F9954D',
              borderRadius: 999,
            }}
          />
        ) : null}
      </View>
      <Month
        startOfMonthDate={startOfMonthDate}
        onDaySelect={({ dateString, isEmpty }) => {
          if (isEmpty) return sheets.scheduleMealSheetRef.current?.present({ dateString });
          setScrollTarget({ dateString, animated: true });
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

export const MonthlyScreen = ({ sheets }: Props) => {
  const monthlyListRef = useRef<FlashListRef<string>>(null);
  const hasScrolledRef = useRef(false);
  const backToToday = useBackToToday();
  const [hasCommitted, setHasCommitted] = useState(false);
  const insets = useSafeAreaInsets();
  const [monthRange, setMonthRange] = useState({
    start: dateToString(addMonths(startOfMonth(startOfToday()), -3)),
    end: dateToString(addMonths(startOfMonth(startOfToday()), 3)),
  });

  const months = eachMonthOfInterval({ start: monthRange.start, end: monthRange.end }).map(dateToString);

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
        return dateString === dateToString(startOfMonth(startOfToday()));
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
      todayItem: pipe(startOfToday(), startOfMonth, dateToString),
    });
  };

  const expandIntoPast = () => {
    setMonthRange((prev) => {
      const newStart = addMonths(parseDateString(prev.start), -6);
      return { start: dateToString(newStart), end: prev.end };
    });
  };

  const expandIntoFuture = () => {
    setMonthRange((prev) => {
      const newEnd = addMonths(parseDateString(prev.end), 6);
      return { start: prev.start, end: dateToString(newEnd) };
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
        renderItem={({ item }) => <Item dateString={item} sheets={sheets} />}
        style={{ backgroundColor: '#FEF7EA', flex: 1 }}
        keyExtractor={(item) => getUnixTime(item).toString()}
        ItemSeparatorComponent={() => <View style={{ height: GAP_SIZE }} />}
        contentContainerStyle={{
          paddingHorizontal: 20,
          marginTop: insets.top + HEADER_SIZE,
          paddingBottom: insets.bottom + 88,
        }}
        onStartReachedThreshold={0.5}
        drawDistance={1000}
        onStartReached={expandIntoPast}
        onEndReached={expandIntoFuture}
        onCommitLayoutEffect={() => setHasCommitted(true)}
        onViewableItemsChanged={handleViewableItemsChanged}
      />
    </>
  );
};
