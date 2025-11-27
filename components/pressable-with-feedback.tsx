import * as Haptics from 'expo-haptics';
import { ReactNode } from 'react';
import { Pressable, StyleProp, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { scheduleOnUI } from 'react-native-worklets';
import { doNothing } from 'remeda';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  onLongPress?: () => void;
  scaleTo?: number;
  disabled?: boolean;
  hitSlop?: number;
};

export const PressableWithHaptics = ({ children, style, onPress, onLongPress, scaleTo, disabled, hitSlop }: Props) => {
  const scale = useSharedValue(1);
  const scaleStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const vibrate = () => {
    const style = Haptics.ImpactFeedbackStyle.Light;
    Haptics.impactAsync(style).catch(doNothing);
  };

  const handlePress = () => {
    if (!onPress || disabled) return;
    vibrate();
    onPress();
  };

  const handleLongPress = () => {
    if (!onLongPress || disabled) return;
    vibrate();
    onLongPress();
  };

  return (
    <AnimatedPressable
      onPressIn={() => scheduleOnUI(() => (scale.value = withSpring(scaleTo ?? 0.97)))}
      onPressOut={() => scheduleOnUI(() => (scale.value = withSpring(1)))}
      onPress={(e) => {
        e.stopPropagation();
        handlePress();
      }}
      onLongPress={handleLongPress}
      style={[style, scaleStyle]}
      hitSlop={hitSlop}
    >
      {children}
    </AnimatedPressable>
  );
};
