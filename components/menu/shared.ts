import { ViewToken } from '@shopify/flash-list';
import { differenceInSeconds } from 'date-fns';
import { useEffect, useState } from 'react';
import { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

export const useBackToToday = () => {
  const [show, setShow] = useState({ state: false, lock: Date.now() });
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);

  useEffect(() => {
    opacity.value = withSpring(show.state ? 1 : 0, { duration: 200 });
    scale.value = withSpring(show.state ? 1 : 0.8, { duration: 200 });
  }, [opacity, scale, show.state]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const handleViewableItemsChanged = ({
    viewableItems,
    todayItem,
  }: {
    viewableItems: ViewToken<string>[];
    todayItem: string;
  }) => {
    const LOCK_TIMEOUT_SECONDS = 2;
    if (show.lock && differenceInSeconds(Date.now(), show.lock) < LOCK_TIMEOUT_SECONDS) return;
    const todayIsVisible = Boolean(viewableItems.find((i) => i.item === todayItem));
    setShow({ state: !todayIsVisible, lock: 0 });
  };

  return { setShow, style, handleViewableItemsChanged };
};
