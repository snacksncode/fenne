import * as Haptics from 'expo-haptics';
import { Gesture } from 'react-native-gesture-handler';
import { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { doNothing } from 'remeda';

type Props = {
  scaleTo?: number;
  feedbackStyle?: Haptics.ImpactFeedbackStyle | null;
} & ({ onPress: () => void } | { onLongPress: () => void });

export const useOnPressWithFeedback = (props: Props) => {
  const scale = useSharedValue(1);
  const scaleStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const vibrate = () => {
    if (props.feedbackStyle === null) return;
    const style = Haptics.ImpactFeedbackStyle.Light;
    Haptics.impactAsync(style).catch(doNothing);
  };

  const handlePress = () => {
    if (!('onPress' in props)) return;
    vibrate();
    props.onPress();
  };

  const handleLongPress = () => {
    if (!('onLongPress' in props)) return;
    vibrate();
    props.onLongPress();
  };

  const tap = Gesture.Tap()
    .onBegin(() => (scale.value = withSpring(props.scaleTo ?? 0.97)))
    .onTouchesCancelled(() => (scale.value = withSpring(1)))
    .onFinalize((_event, success) => {
      scale.value = withSpring(1);
      if (success) scheduleOnRN(handlePress);
    });

  const longPress = Gesture.LongPress()
    .onStart(() => {
      scale.value = withSpring(props.scaleTo ?? 0.97);
      scheduleOnRN(handleLongPress);
    })
    .onFinalize(() => (scale.value = withSpring(1)));

  const gesture = Gesture.Exclusive(tap, longPress);

  return { gesture, scaleStyle };
};
