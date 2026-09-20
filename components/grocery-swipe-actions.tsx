import { PressableWithHaptics } from '@/components/pressable-with-feedback';
import { colors } from '@/constants/colors';
import { Pen, Trash2 } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import Animated, { SharedValue, useAnimatedReaction, useAnimatedStyle, useReducedMotion, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

const ACTION_WIDTH = 60;
const ACTION_GAP = 8;
const ACTION_PADDING = 10;
const ACTIONS_WIDTH = ACTION_PADDING * 2 + ACTION_WIDTH * 2 + ACTION_GAP;
const REVEAL_CLEARANCE = 2;
const CLOSE_FADE_DISTANCE = 12;

const SwipeAction = ({ kind, progress, name, onPress, disabled }: {
  kind: 'edit' | 'remove';
  progress: SharedValue<number>;
  name: string;
  onPress: () => void;
  disabled: boolean;
}) => {
  const reduceMotion = useReducedMotion();
  const visibility = useSharedValue(0);
  const removing = kind === 'remove';
  // The rightmost action fits first; Edit waits until its entire capsule is exposed.
  const revealThreshold = (ACTION_PADDING + ACTION_WIDTH + REVEAL_CLEARANCE
    + (removing ? 0 : ACTION_WIDTH + ACTION_GAP)) / ACTIONS_WIDTH;
  const label = removing ? 'Remove' : 'Edit';
  const Icon = removing ? Trash2 : Pen;
  useAnimatedReaction(
    () => progress.get() >= revealThreshold,
    (visible, previouslyVisible) => {
      if (visible === previouslyVisible) return;
      visibility.set(reduceMotion ? (visible ? 1 : 0) : visible
        ? withSpring(1, { damping: 15, stiffness: 280, mass: 0.65 })
        : withTiming(0, { duration: 100 }));
    },
  );
  const revealStyle = useAnimatedStyle(() => {
    const visible = visibility.get();
    const amount = Math.max(0, progress.get());
    // Fade over the closing distance, shrinking within the remaining space even on a fast swipe.
    const space = Math.min(1, Math.max(0,
      1 + (amount - revealThreshold) * ACTIONS_WIDTH / CLOSE_FADE_DISTANCE));
    const opacity = Math.min(1, Math.max(0, visible)) * space;
    if (reduceMotion) return { opacity };
    const stretch = Math.min(1, Math.max(0, amount - 1));
    return {
      opacity,
      transform: [
        { scale: (0.72 + visible * 0.28 + stretch * 0.035) * space },
      ],
    };
  });

  return <Animated.View style={revealStyle}>
    <PressableWithHaptics accessibilityRole="button" accessibilityLabel={`${label} ${name}`}
      disabled={disabled} onPress={onPress} scaleTo={0.92} style={styles.action}>
      <View style={[styles.capsule, removing ? styles.remove : styles.edit]}>
        <Icon size={18} strokeWidth={2.25} color={removing ? colors.red[600] : colors.cream[50]} />
      </View>
    </PressableWithHaptics>
  </Animated.View>;
};

export const GrocerySwipeActions = ({ progress, name, onEdit, onRemove, disabled }: {
  progress: SharedValue<number>;
  name: string;
  onEdit: () => void;
  onRemove: () => void;
  disabled: boolean;
}) => (
  <View style={styles.container}>
    <SwipeAction kind="edit" progress={progress} name={name} onPress={onEdit} disabled={disabled} />
    <SwipeAction kind="remove" progress={progress} name={name} onPress={onRemove} disabled={disabled} />
  </View>
);

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: ACTION_GAP, paddingHorizontal: ACTION_PADDING, backgroundColor: colors.surface.raised },
  action: { width: ACTION_WIDTH, alignItems: 'center', paddingVertical: 3 },
  capsule: { width: ACTION_WIDTH, height: 30, borderRadius: 999, borderWidth: 1.5, borderBottomWidth: 3, alignItems: 'center', justifyContent: 'center' },
  edit: { backgroundColor: colors.orange[500], borderColor: colors.orange[600] },
  remove: { backgroundColor: colors.red[50], borderColor: colors.red[500] },
});
