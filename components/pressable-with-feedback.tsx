import * as Haptics from 'expo-haptics';
import { ReactNode, useEffect } from 'react';
import { GestureResponderEvent, Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { scheduleOnUI } from 'react-native-worklets';
import { doNothing } from 'remeda';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = Omit<PressableProps, 'children' | 'style'> & {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
};

export const PressableWithHaptics = ({
  children,
  style,
  onPress,
  onLongPress,
  onPressIn,
  onPressOut,
  scaleTo,
  disabled,
  ...pressableProps
}: Props) => {
  const scale = useSharedValue(1);
  const scaleStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  useEffect(() => {
    if (disabled) scheduleOnUI(() => (scale.value = 1));
  }, [disabled, scale]);

  const vibrate = () => {
    const style = Haptics.ImpactFeedbackStyle.Light;
    Haptics.impactAsync(style).catch(doNothing);
  };

  const handlePress = (event: GestureResponderEvent) => {
    if (!onPress || disabled) return;
    vibrate();
    onPress(event);
  };

  const handleLongPress = (event: GestureResponderEvent) => {
    if (!onLongPress || disabled) return;
    vibrate();
    onLongPress(event);
  };

  return (
    <AnimatedPressable
      {...pressableProps}
      disabled={disabled}
      onPressIn={(event) => {
        if (disabled) return;
        scheduleOnUI(() => (scale.value = withSpring(scaleTo ?? 0.97)));
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        if (disabled) return;
        scheduleOnUI(() => (scale.value = withSpring(1)));
        onPressOut?.(event);
      }}
      onPress={(event) => {
        event.stopPropagation();
        handlePress(event);
      }}
      onLongPress={handleLongPress}
      style={[style, scaleStyle]}
    >
      {children}
    </AnimatedPressable>
  );
};
