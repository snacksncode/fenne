import { Tag } from '@/components/svgs/tag';
import * as Haptics from 'expo-haptics';
import { Text } from '@/components/Text';
import { dateToString } from '@/date-tools';
import { eachDayOfInterval, endOfMonth, format, getUnixTime, isToday, isTomorrow } from 'date-fns';
import { View, Pressable } from 'react-native';
import Animated, { SharedValue, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { chunk, times } from 'remeda';
import { memo } from 'react';
import { scheduleOnUI } from 'react-native-worklets';

type Props = {
  startOfMonthDate: Date;
  onDaySelect: (day: { dateString: string; isEmpty: boolean }) => void;
};

function TEMPORARY_isPrime(num: number) {
  if (num <= 1) return false;
  if (num <= 3) return true;
  if (num % 2 === 0 || num % 3 === 0) return false;
  let i = 5;
  while (i * i <= num) {
    if (num % i === 0 || num % (i + 2) === 0) return false;
    i += 6;
  }
  return true;
}

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
  day,
  onDaySelect,
  pressedDayKey,
}: {
  day: Date;
  onDaySelect: (day: { dateString: string; isEmpty: boolean }) => void;
  pressedDayKey: SharedValue<string | null>;
}) {
  const isEmpty = TEMPORARY_isPrime(parseInt(format(day, 'd')));
  const dayKey = dateToString(day);

  const animatedStyle = useAnimatedStyle(() => {
    const isPressed = pressedDayKey.value === dayKey;
    return { transform: [{ scale: withSpring(isPressed ? 0.925 : 1) }] };
  });

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDaySelect({ dateString: dayKey, isEmpty });
  };

  return (
    <AnimatedPressable
      onPressIn={() => scheduleOnUI(() => (pressedDayKey.value = dayKey))}
      onPressOut={() => scheduleOnUI(() => (pressedDayKey.value = null))}
      onPress={() => handlePress()}
      onLongPress={() => alert('Long press')}
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
      {isTomorrow(day) ? <ShoppingDayTag /> : null}
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
          ...(isEmpty && !isToday(day) && { borderStyle: 'dashed', borderBottomWidth: 1 }),
          ...(isEmpty && !isToday(day) && { opacity: 0.7 }),
        }}
      />
      <View style={{ ...(isEmpty && !isToday(day) && { opacity: 0.7 }) }}>
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
      <View
        style={{
          flexDirection: 'row',
          gap: 2,
          height: 4,
          ...(isEmpty && !isToday(day) && { opacity: 0.7 }),
        }}
      >
        {!isEmpty ? (
          <>
            <View style={{ height: 4, width: 4, backgroundColor: '#61AA64', borderRadius: 999 }} />
            <View style={{ height: 4, width: 4, backgroundColor: '#F9954D', borderRadius: 999 }} />
            <View style={{ height: 4, width: 4, backgroundColor: '#987154', borderRadius: 999 }} />
          </>
        ) : null}
      </View>
    </AnimatedPressable>
  );
});

export const Month = memo(function Month({ startOfMonthDate, onDaySelect }: Props) {
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
                return <Day key={getUnixTime(day)} day={day} onDaySelect={onDaySelect} pressedDayKey={pressedDayKey} />;
              })}
            </View>
          );
        })}
      </View>
    </View>
  );
});
