import { Text } from '@/components/Text';
import { FunctionComponent } from 'react';
import { Pressable, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';
import * as Haptics from 'expo-haptics';
import { doNothing, filter, isTruthy } from 'remeda';

type Props = {
  onPress: () => void;
  text: string;
  LeftIcon?: FunctionComponent<{ size: number; color: string }>;
  style?: StyleProp<ViewStyle>;
  size?: 'base' | 'small';
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const Button = ({ onPress, LeftIcon, text, style, size }: Props) => {
  const scale = useSharedValue(1);

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onTapGestureSuccess = () => {
    const style = Haptics.ImpactFeedbackStyle.Light;
    Haptics.impactAsync(style).catch(doNothing);
    onPress();
  };

  const tap = Gesture.Tap()
    .onBegin(() => (scale.value = withSpring(0.97)))
    .onFinalize((_event, success) => {
      scale.value = withSpring(1);
      if (success) scheduleOnRN(onTapGestureSuccess);
    });

  return (
    <GestureDetector gesture={tap}>
      <AnimatedPressable
        style={filter([styles.container, size === 'small' && styles.small, style, scaleStyle], isTruthy)}
      >
        {LeftIcon ? <LeftIcon size={24} color="#FEF7EA" /> : null}
        <Text style={styles.text}>{text}</Text>
      </AnimatedPressable>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    height: 48,
    paddingHorizontal: 24,
    backgroundColor: '#F9954D',
    borderColor: '#EC8032',
    borderWidth: 1,
    borderBottomWidth: 2,
  },
  small: {
    height: 36,
    paddingHorizontal: 16,
  },
  text: {
    color: '#FEF7EA',
    fontFamily: 'Satoshi-Bold',
    fontSize: 14,
    lineHeight: 14 * 1.5,
  },
});
