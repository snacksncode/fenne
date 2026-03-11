import { useEffect } from 'react';
import { colors } from '@/constants/colors';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  SharedValue,
} from 'react-native-reanimated';

const AnimatedPath = Animated.createAnimatedComponent(Path);

export const useCheckbox = (isChecked: boolean) => {
  const progress = useSharedValue(isChecked ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(isChecked ? 1 : 0);
  }, [isChecked, progress]);

  return { progress };
};

export const Checkbox = ({ progress }: { progress: SharedValue<number> }) => {
  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 0.5], ['#FEF2DD', '#FEF2DD']),
  }));

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: interpolate(progress.value, [0, 1], [24, 0]),
    opacity: interpolate(progress.value, [0, 0.1, 1], [0, 1, 1]),
  }));

  return (
    <Animated.View
      style={[
        {
          width: 24,
          height: 24,
          borderRadius: 5,
          borderWidth: 1,
          borderBottomWidth: 2,
          borderColor: colors.orange[600],
          alignItems: 'center',
          justifyContent: 'center',
        },
        animatedStyle,
      ]}
    >
      <Svg width={16} height={16} viewBox="0 0 24 24">
        <AnimatedPath
          d="M4 12 9 17 20 6"
          stroke={colors.orange[500]}
          strokeWidth={4}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          strokeDasharray={24}
          animatedProps={animatedProps}
        />
      </Svg>
    </Animated.View>
  );
};
