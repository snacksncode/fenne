import { useNavigation } from '@react-navigation/native';
import { useEffect, useRef } from 'react';
import { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

export const useTabFocusAnimation = () => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const isFirstFocus = useRef(true);
  const navigation = useNavigation();

  useEffect(() => {
    const unsubFocus = navigation.addListener('focus', () => {
      if (isFirstFocus.current) {
        isFirstFocus.current = false;
        return;
      }
      scale.value = withTiming(1, { duration: 200 });
      opacity.value = withTiming(1, { duration: 200 });
    });
    const unsubBlur = navigation.addListener('blur', () => {
      scale.value = 0.99;
      opacity.value = 0.9;
    });
    return () => {
      unsubFocus();
      unsubBlur();
    };
  }, [navigation, scale, opacity]);

  return useAnimatedStyle(() => ({
    flex: 1,
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));
};
