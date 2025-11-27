import { Tag } from '@/components/svgs/tag';
import * as Haptics from 'expo-haptics';
import { Text } from '@/components/Text';
import { formatDateToISO, parseISO } from '@/date-tools';
import { eachDayOfInterval, endOfMonth, format, getUnixTime, isToday } from 'date-fns';
import { View, Pressable, ActivityIndicator } from 'react-native';
import Animated, { SharedValue, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { chunk, times } from 'remeda';
import { memo } from 'react';
import { scheduleOnUI } from 'react-native-worklets';
import { colors } from '@/constants/colors';
import { ScheduleDayDTO } from '@/api/schedules';

type Props = {
  startOfMonthDate: Date;
  onDaySelect: (day: { dateString: string; isEmpty: boolean }) => void;
  onDayLongPress?: (day: { dateString: string }) => void;
  scheduleMap: Record<string, ScheduleDayDTO>;
};

const ShoppingDayTag = () => (
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
);

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const Day = memo(function Day({
  dateString,
  scheduleDay,
  onDaySelect,
  onDayLongPress,
  pressedDayKey,
}: {
  dateString: string;
  scheduleDay: ScheduleDayDTO | undefined;
  onDaySelect: (day: { dateString: string; isEmpty: boolean }) => void;
  onDayLongPress?: (day: { dateString: string }) => void;
  pressedDayKey: SharedValue<string | null>;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const isPressed = pressedDayKey.value === dateString;
    return { transform: [{ scale: withSpring(isPressed ? 0.925 : 1) }] };
  });

  if (!scheduleDay) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#FEF2DD',
          borderRadius: 4,
          aspectRatio: 0.92,
          isolation: 'isolate',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          borderColor: '#D1C5B3',
          borderWidth: 1,
          borderStyle: 'dashed',
          opacity: 0.7,
        }}
      >
        <ActivityIndicator />
      </View>
    );
  }

  const { breakfast, dinner, lunch } = scheduleDay;
  const date = parseISO(dateString);
  const isEmpty = breakfast == null && dinner == null && lunch == null;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDaySelect({ dateString, isEmpty });
  };

  const handleLongPress = () => {
    if (!onDayLongPress) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDayLongPress({ dateString });
  };

  return (
    <AnimatedPressable
      onPressIn={() => scheduleOnUI(() => (pressedDayKey.value = dateString))}
      onPressOut={() => scheduleOnUI(() => (pressedDayKey.value = null))}
      onPress={handlePress}
      onLongPress={handleLongPress}
      style={[
        {
          flex: 1,
          backgroundColor: '#FEF2DD',
          borderRadius: 4,
          aspectRatio: 0.92,
          isolation: 'isolate',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
        },
        animatedStyle,
      ]}
    >
      {scheduleDay.is_shopping_day ? <ShoppingDayTag /> : null}
      <View
        style={{
          zIndex: 2,
          position: 'absolute',
          inset: 0,
          borderRadius: 4,
          borderColor: '#D1C5B3',
          borderWidth: 1,
          borderBottomWidth: 2,
          ...(isToday(date) && {
            borderWidth: 2,
            borderBottomWidth: 3,
            borderColor: '#EC8032',
          }),
          ...(isEmpty && !isToday(date) && { borderStyle: 'dashed', borderBottomWidth: 1 }),
          ...(isEmpty && !isToday(date) && { opacity: 0.7 }),
        }}
      />
      <View style={{ ...(isEmpty && !isToday(date) && { opacity: 0.7 }) }}>
        <Text
          style={{
            zIndex: 1,
            fontFamily: 'Satoshi-Black',
            color: '#4A3E36',
            fontSize: 15,
            lineHeight: 15 * 1.5,
          }}
        >
          {format(date, 'd')}
        </Text>
      </View>
      <View
        style={{
          flexDirection: 'row',
          gap: 2,
          height: 4,
          ...(isEmpty && !isToday(date) && { opacity: 0.7 }),
        }}
      >
        {scheduleDay.breakfast ? (
          <View style={{ height: 4, width: 4, backgroundColor: colors.green[500], borderRadius: 999 }} />
        ) : null}
        {scheduleDay.lunch ? (
          <View style={{ height: 4, width: 4, backgroundColor: colors.orange[500], borderRadius: 999 }} />
        ) : null}
        {scheduleDay.dinner ? (
          <View style={{ height: 4, width: 4, backgroundColor: '#987154', borderRadius: 999 }} />
        ) : null}
      </View>
    </AnimatedPressable>
  );
});

export const Month = memo(function Month({ scheduleMap, startOfMonthDate, onDaySelect, onDayLongPress }: Props) {
  const pressedDayKey = useSharedValue<string | null>(null);
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
                const dateString = formatDateToISO(day);
                const scheduleDay = scheduleMap[dateString] as ScheduleDayDTO | undefined;
                return (
                  <Day
                    dateString={dateString}
                    key={getUnixTime(day)}
                    scheduleDay={scheduleDay}
                    onDaySelect={onDaySelect}
                    onDayLongPress={onDayLongPress}
                    pressedDayKey={pressedDayKey}
                  />
                );
              })}
            </View>
          );
        })}
      </View>
    </View>
  );
});
