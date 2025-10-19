import { Tag } from '@/components/svgs/tag';
import { Text } from '@/components/Text';
import { dateToString, parseDateString } from '@/date-tools';
import { FlashList, FlashListRef } from '@shopify/flash-list';
import {
  addMonths,
  eachDayOfInterval,
  eachMonthOfInterval,
  endOfMonth,
  format,
  getUnixTime,
  isToday,
  isTomorrow,
  startOfMonth,
  startOfToday,
} from 'date-fns';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { chunk, times } from 'remeda';

const HEADER_SIZE = 105;

type MonthProps = {
  startOfMonthDate: Date;
};

const Month = ({ startOfMonthDate }: MonthProps) => {
  const end = endOfMonth(startOfMonthDate);
  const frontOffset = parseInt(format(startOfMonthDate, 'i')) - 1;
  const days = [...times(frontOffset, () => null), ...eachDayOfInterval({ start: startOfMonthDate, end })];
  const weeks = chunk(days, 7).map((week) => {
    if (week.length === 7) return week;
    return [...week, ...times(7 - week.length, () => null)];
  });

  return (
    <View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          height: 18,
          marginBottom: 8,
        }}
      >
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((weekday) => (
          <Text
            style={{
              flex: 1,
              textAlign: 'center',
              fontFamily: 'Satoshi-Medium',
              color: '#4A3E36',
              fontSize: 12,
              lineHeight: 12,
            }}
            key={weekday}
          >
            {weekday}
          </Text>
        ))}
      </View>
      <View style={{ gap: 6 }}>
        {weeks.map((week, index) => {
          return (
            <View key={index} style={{ flexDirection: 'row', gap: 6 }}>
              {week.map((day, index) => {
                if (!day) return <View key={index} style={{ flex: 1 }} />;
                return (
                  <View
                    key={getUnixTime(day)}
                    style={{
                      flex: 1,
                      backgroundColor: '#FEF2DD',
                      borderRadius: 4,
                      aspectRatio: 0.92,
                      isolation: 'isolate',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 2,
                    }}
                  >
                    {isTomorrow(day) ? (
                      <View
                        style={{
                          zIndex: 3,
                          backgroundColor: '#61AA64',
                          borderWidth: 1,
                          width: 18,
                          height: 18,
                          padding: 4,
                          borderRadius: 999,
                          borderColor: '#5B8B5D',
                          position: 'absolute',
                          right: -4,
                          top: -4,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Tag color="white" size={11} />
                      </View>
                    ) : null}
                    <View
                      style={{
                        zIndex: 2,
                        position: 'absolute',
                        inset: 0,
                        borderRadius: 4,
                        borderColor: '#D1C5B3',
                        borderWidth: 1,
                        borderBottomWidth: 2,
                        ...(isToday(day) && {
                          borderWidth: 2,
                          borderBottomWidth: 3,
                          borderColor: '#EC8032',
                        }),
                      }}
                    />
                    <View>
                      <Text
                        style={{
                          zIndex: 1,
                          fontFamily: 'Satoshi-Black',
                          color: '#4A3E36',
                          fontSize: 15,
                          lineHeight: 15 * 1.5,
                        }}
                      >
                        {format(day, 'd')}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 2, height: 4 }}>
                      <View style={{ height: 4, width: 4, backgroundColor: '#61AA64', borderRadius: 999 }} />
                      <View style={{ height: 4, width: 4, backgroundColor: '#F9954D', borderRadius: 999 }} />
                      <View style={{ height: 4, width: 4, backgroundColor: '#987154', borderRadius: 999 }} />
                    </View>
                  </View>
                );
              })}
            </View>
          );
        })}
      </View>
    </View>
  );
};

const Item = ({ dateString }: { dateString: string }) => {
  const startOfMonthDate = startOfMonth(parseDateString(dateString));

  return (
    <View>
      <Text
        style={{
          color: '#4A3E36',
          fontSize: 20,
          lineHeight: 20 * 1.25,
          fontFamily: 'Satoshi-Bold',
          textAlign: 'center',
          marginBottom: 12,
        }}
      >
        {format(startOfMonthDate, 'MMMM yyyy')}
      </Text>
      <Month startOfMonthDate={startOfMonthDate} />
    </View>
  );
};

const GAP_SIZE = 24;

export const MonthlyScreen = () => {
  const monthlyListRef = useRef<FlashListRef<string>>(null);
  const hasScrolledRef = useRef(false);
  // const navigation = useNavigation<Navigation>();
  const insets = useSafeAreaInsets();
  // const setScrollTarget = useSetAtom(scrollTargetAtom);
  const [monthRange] = useState({
    start: dateToString(addMonths(startOfMonth(startOfToday()), -3)),
    end: dateToString(addMonths(startOfMonth(startOfToday()), 3)),
  });
  const months = eachMonthOfInterval({ ...monthRange }).map(dateToString);

  const scrollToMonth = useCallback(
    ({ dateString, animated, offset }: { dateString: string; animated: boolean; offset?: number }) => {
      setImmediate(() => {
        monthlyListRef.current?.scrollToItem({
          item: dateString,
          viewOffset: -1 * (insets.top + HEADER_SIZE + GAP_SIZE + (offset ?? 0)),
          animated,
        });
      });
    },
    [insets.top]
  );

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

  useLayoutEffect(() => {
    if (!monthlyListRef.current || hasScrolledRef.current) return;
    scrollToToday({ animated: false });
    hasScrolledRef.current = true;
  }, [scrollToToday]);

  return (
    <FlashList
      ref={monthlyListRef}
      data={months}
      renderItem={({ item }) => <Item dateString={item} />}
      style={{ backgroundColor: '#FEF7EA', flex: 1 }}
      keyExtractor={(item) => getUnixTime(item).toString()}
      ItemSeparatorComponent={() => <View style={{ height: GAP_SIZE }} />}
      contentContainerStyle={{
        paddingHorizontal: 20,
        marginTop: insets.top + HEADER_SIZE,
        paddingBottom: insets.bottom + 88,
      }}
      // onStartReached={expandWeekIntoPast}
      // onEndReached={expandWeekIntoFuture}
      // onViewableItemsChanged={handleViewableItemsChanged}
    />
  );
};
