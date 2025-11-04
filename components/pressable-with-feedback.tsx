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
};

export const PressableWithHaptics = ({ children, style, onPress, onLongPress, scaleTo }: Props) => {
  const scale = useSharedValue(1);
  const scaleStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const vibrate = () => {
    const style = Haptics.ImpactFeedbackStyle.Light;
    Haptics.impactAsync(style).catch(doNothing);
  };

  const handlePress = () => {
    if (!onPress) return;
    vibrate();
    onPress();
  };

  const handleLongPress = () => {
    if (!onLongPress) return;
    vibrate();
    onLongPress();
  };

  return (
    <AnimatedPressable
      onPressIn={() => scheduleOnUI(() => (scale.value = withSpring(scaleTo ?? 0.97)))}
      onPressOut={() => scheduleOnUI(() => (scale.value = withSpring(1)))}
      onPress={handlePress}
      onLongPress={handleLongPress}
      style={[style, scaleStyle]}
    >
      {children}
    </AnimatedPressable>
  );
};
