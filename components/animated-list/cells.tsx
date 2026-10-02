// Private rendering adapter for FlashList's recycled cells. Context, cancellation,
// and frame-flush workarounds stay behind the animated-list module's public seam.
import { createContext, Ref, useContext, useEffect, useMemo } from 'react';
import { View, ViewProps } from 'react-native';
import Animated, {
  AnimationObject,
  EntryAnimationsValues,
  ExitAnimationsValues,
  LayoutAnimationConfig,
  LayoutAnimationsValues,
  SharedValue,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

export type ListAnimationPhase = { until: number; added: string[]; removed: string[] };
export const ListAnimationContext = createContext<{
  phase: SharedValue<ListAnimationPhase>;
  keys: string[];
  addedKeys?: string[];
  animate?: boolean;
} | null>(null);
const ItemAnimationContext = createContext<{
  phase: SharedValue<ListAnimationPhase>;
  itemKey: string;
  inserted?: boolean;
  animate?: boolean;
} | null>(null);

const SPRING = { damping: 24, stiffness: 240, mass: 1 };

function useItemAnimations(cell = false) {
  const context = useContext(ItemAnimationContext);
  const phase = context?.phase;
  const itemKey = context?.itemKey ?? '';
  const lastLayoutKey = useSharedValue(itemKey);
  const spring = useMemo(() => (target: number) => {
    'worklet';
    // Layout animations do not expose a cancelAnimation handle. Stop each spring
    // on the UI thread as soon as scrolling closes the transaction.
    const animation = withSpring(target, SPRING) as unknown as AnimationObject<number>;
    const onFrame = animation.onFrame;
    animation.onFrame = (state, timestamp) => {
      'worklet';
      if (!phase || phase.value.until === 0) {
        state.current = target;
        return true;
      }
      return onFrame(state, timestamp);
    };
    return animation as unknown as number;
  }, [phase]);
  useEffect(() => {
    // Idle recycling has no layout animation registered. Remember that identity
    // so the next real edit can animate, while an in-flight reassignment snaps.
    if (!phase || phase.value.until <= Date.now()) lastLayoutKey.set(itemKey);
  }, [itemKey, lastLayoutKey, phase]);

  return useMemo(() => ({
    layout: (values: LayoutAnimationsValues) => {
      'worklet';
      const animate = !!phase && phase.value.until > Date.now() && lastLayoutKey.value === itemKey;
      lastLayoutKey.set(itemKey);
      const target = {
        originX: values.targetOriginX, originY: values.targetOriginY,
        width: values.targetWidth, height: values.targetHeight,
      };
      // A nonzero clock is necessary for Reanimated to flush the final native
      // frame. Initial and target geometry match, so this has no visible motion.
      if (!animate) return {
        initialValues: target,
        animations: {
          originX: withTiming(target.originX, { duration: 1 }), originY: withTiming(target.originY, { duration: 1 }),
          width: withTiming(target.width, { duration: 1 }), height: withTiming(target.height, { duration: 1 }),
        },
      };
      return {
        initialValues: {
          originX: values.currentOriginX, originY: values.currentOriginY,
          width: values.currentWidth, height: values.currentHeight,
        },
        animations: {
          originX: spring(target.originX), originY: spring(target.originY),
          width: spring(target.width), height: spring(target.height),
        },
      };
    },
    entering: (_values: EntryAnimationsValues) => {
      'worklet';
      const animate = !!phase && phase.value.until > Date.now() && (!cell || phase.value.added.includes(itemKey));
      return { initialValues: { opacity: animate ? 0 : 1 }, animations: { opacity: withTiming(1, { duration: animate ? 220 : 16 }) } };
    },
    exiting: (_values: ExitAnimationsValues) => {
      'worklet';
      const animate = !!phase && phase.value.until > Date.now() && (!cell || phase.value.removed.includes(itemKey));
      return { initialValues: { opacity: animate ? 1 : 0 }, animations: { opacity: withTiming(0, { duration: animate ? 180 : 1 }) } };
    },
  }), [cell, itemKey, lastLayoutKey, phase, spring]);
}

/** A row/card transition that runs only inside a prepared list data transaction. */
export function ListLayoutView(props: ViewProps) {
  const animations = useItemAnimations();
  const context = useContext(ItemAnimationContext);
  return <Animated.View {...props} layout={context?.animate ? animations.layout : undefined} exiting={context?.animate ? animations.exiting : undefined}
    entering={context?.animate ? animations.entering : undefined} collapsable={false} />;
}

function CellBody({ ref, children, ...props }: ViewProps & { ref?: Ref<View> }) {
  const animations = useItemAnimations(true);
  const context = useContext(ItemAnimationContext);
  const inserted = context?.inserted;
  return (
    <Animated.View {...props} layout={context?.animate ? animations.layout : undefined} exiting={context?.animate ? animations.exiting : undefined} ref={ref} collapsable={false}>
      {/* FlashList owns the outer cell styling. Fade its content instead. */}
      <Animated.View entering={inserted ? animations.entering : undefined}>
        <LayoutAnimationConfig skipEntering skipExiting>
          <View collapsable={false}>{children}</View>
        </LayoutAnimationConfig>
      </Animated.View>
    </Animated.View>
  );
}

/** Stable component identity: never recreate the cell renderer in a screen render. */
export function AnimatedListCell({ index, ...props }: ViewProps & { index: number; ref?: Ref<View> }) {
  const context = useContext(ListAnimationContext)!;
  const value = useMemo(() => ({ phase: context.phase, itemKey: context.keys[index] ?? '', inserted: context.addedKeys?.includes(context.keys[index]), animate: context.animate }), [context, index]);
  return <ItemAnimationContext value={value}><CellBody {...props} /></ItemAnimationContext>;
}
