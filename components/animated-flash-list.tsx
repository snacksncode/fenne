import { FlashList, FlashListProps, FlashListRef } from '@shopify/flash-list';
import { useIsFocused } from 'expo-router/react-navigation';
import { ForwardedRef, forwardRef, Ref, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, StyleSheet } from 'react-native';
import { scheduleOnRN } from 'react-native-worklets';
import { AnimatedListCell, ListAnimationContext, ListAnimationPhase } from './list-layout-view';
import Animated, { useAnimatedScrollHandler, useReducedMotion, useSharedValue } from 'react-native-reanimated';
import { isDeepEqual } from 'remeda';

const MAX_ANIMATED_CHANGES = 20;
const SCROLL_SETTLE_MS = 150;

// Reanimated supplies a style array, but FlashList spreads style as an object.
// Flatten after Reanimated processes props so background and sizing survive.
const StyledFlashList = forwardRef(function StyledFlashList<T>(
  { style, ...props }: FlashListProps<T>,
  ref: ForwardedRef<FlashListRef<T>>
) {
  return <FlashList {...props} ref={ref} style={StyleSheet.flatten(style)} />;
}) as typeof FlashList;

const ReanimatedFlashList = Animated.createAnimatedComponent(StyledFlashList) as typeof FlashList;

type Props<T> = FlashListProps<T> & {
  ref?: Ref<FlashListRef<T>>;
  keyExtractor: NonNullable<FlashListProps<T>['keyExtractor']>;
};

/** Stage data so recycling is paused before the animated commit reaches FlashList. */
export function AnimatedFlashList<T>({
  data,
  ref,
  onScroll,
  onScrollBeginDrag,
  onScrollEndDrag,
  keyExtractor,
  ...props
}: Props<T>) {
  const list = useRef<FlashListRef<T>>(null);
  const [{ data: displayedData, addedKeys, animateUntil }, setDisplayedData] = useState({ data, addedKeys: [] as string[], animateUntil: 0 });
  const dragging = useSharedValue(false);
  const lastScroll = useSharedValue(-Infinity);
  const lastOffset = useSharedValue({ x: 0, y: 0 });
  const phase = useSharedValue<ListAnimationPhase>({ until: 0, added: [], removed: [] });
  const focused = useIsFocused();
  const reduceMotion = useReducedMotion();

  useImperativeHandle(ref, () => list.current!);

  useLayoutEffect(() => {
    if (isDeepEqual(displayedData, data)) return;
    const previous = new Map(displayedData?.map((item, index) => [keyExtractor(item, index), item]));
    let changedItems = 0;
    const added: string[] = [];
    data?.forEach((item, index) => {
      const key = keyExtractor(item, index);
      if (!previous.has(key)) added.push(key);
      if (!isDeepEqual(previous.get(key), item)) changedItems++;
      previous.delete(key);
    });
    changedItems += previous.size;
    // Initial loading and updates during a drag, momentum, or programmatic scroll
    // should settle immediately. The next idle data update can animate normally.
    // Large replacements keep recycling; preparing them could mount too many cells.
    const animate =
      focused &&
      !reduceMotion &&
      displayedData != null &&
      changedItems <= MAX_ANIMATED_CHANGES &&
      !dragging.value &&
      Date.now() - lastScroll.value > SCROLL_SETTLE_MS;
    if (animate) {
      list.current?.prepareForLayoutAnimationRender();
      phase.set({ until: Date.now() + 500, added, removed: [...previous.keys()] });
    } else {
      phase.set({ until: 0, added: [], removed: [] });
    }
    // The old-data render arms the cell transitions first. Prepare FlashList
    // before this second commit applies the new data and changes native layout.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDisplayedData({ data, addedKeys: animate ? added : [], animateUntil: animate ? Date.now() + 500 : 0 });
  }, [data, displayedData, focused, reduceMotion, keyExtractor, dragging, lastScroll, phase]);

  useEffect(() => {
    if (!animateUntil) return;
    const timeout = setTimeout(() => setDisplayedData(current => ({ ...current, addedKeys: [], animateUntil: 0 })), Math.max(0, animateUntil - Date.now()));
    return () => clearTimeout(timeout);
  }, [animateUntil]);

  const stopAnimating = () => setDisplayedData(current => current.animateUntil === 0 ? current : { ...current, animateUntil: 0, addedKeys: [] });
  const forwardScroll = (event: NativeScrollEvent) => onScroll?.({ nativeEvent: event } as NativeSyntheticEvent<NativeScrollEvent>);
  const forwardBeginDrag = (event: NativeScrollEvent) => onScrollBeginDrag?.({ nativeEvent: event } as NativeSyntheticEvent<NativeScrollEvent>);
  const forwardEndDrag = (event: NativeScrollEvent) => onScrollEndDrag?.({ nativeEvent: event } as NativeSyntheticEvent<NativeScrollEvent>);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      const previous = lastOffset.value;
      lastOffset.set(event.contentOffset);
      // Content remeasurement can emit onScroll without moving the viewport.
      if (previous.x !== event.contentOffset.x || previous.y !== event.contentOffset.y) {
        lastScroll.set(Date.now());
        if (phase.value.until > 0) scheduleOnRN(stopAnimating);
        phase.set({ until: 0, added: [], removed: [] });
      }
      if (onScroll) scheduleOnRN(forwardScroll, event);
    },
    onBeginDrag: (event) => {
      dragging.set(true);
      if (phase.value.until > 0) scheduleOnRN(stopAnimating);
      phase.set({ until: 0, added: [], removed: [] });
      if (onScrollBeginDrag) scheduleOnRN(forwardBeginDrag, event);
    },
    onEndDrag: (event) => {
      dragging.set(false);
      lastScroll.set(Date.now());
      if (onScrollEndDrag) scheduleOnRN(forwardEndDrag, event);
    },
  });

  return (
    <ListAnimationContext value={{ phase, addedKeys, animate: animateUntil !== 0 || !isDeepEqual(displayedData, data), keys: displayedData?.map(keyExtractor) ?? [] }}>
      <ReanimatedFlashList
        {...props}
        ref={list}
        data={displayedData}
        keyExtractor={keyExtractor}
        CellRendererComponent={AnimatedListCell}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      />
    </ListAnimationContext>
  );
}
