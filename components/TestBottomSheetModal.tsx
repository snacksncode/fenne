import { Button } from '@/components/button';
import { Text } from '@/components/Text';
import {
  BottomSheetBackdropProps,
  BottomSheetBackgroundProps,
  BottomSheetModal,
  BottomSheetView,
  useBottomSheetModal,
} from '@gorhom/bottom-sheet';
import { RefObject, useCallback, useMemo } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { identity, times } from 'remeda';

type Props = {
  ref: RefObject<BottomSheetModal | null>;
  onPress: () => void;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const TestBottomSheetModal = ({ ref, onPress }: Props) => {
  const insets = useSafeAreaInsets();
  const snapPoints = useMemo(() => [], []);

  const renderBackdrop = useCallback((props: BottomSheetBackdropProps) => {
    return <Backdrop {...props} />;
  }, []);

  const renderBackground = useCallback(
    ({ style, ...props }: BottomSheetBackgroundProps) => (
      <View
        style={[
          style,
          {
            backgroundColor: '#FEF7EA',
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
          },
        ]}
        {...props}
      />
    ),
    []
  );

  return (
    <BottomSheetModal
      ref={ref}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{ width: 64, backgroundColor: '#766356' }}
      backgroundComponent={renderBackground}
      snapPoints={snapPoints}
    >
      <BottomSheetView
        style={{
          paddingBottom: insets.bottom,
          paddingHorizontal: 20,
        }}
      >
        {times(5, identity()).map((i) => (
          <Text key={i}>Hello</Text>
        ))}
        <Button onPress={() => onPress()} text="Toggle" />
      </BottomSheetView>
    </BottomSheetModal>
  );
};

const Backdrop = ({ animatedIndex, style }: BottomSheetBackdropProps) => {
  const { dismiss } = useBottomSheetModal();
  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(animatedIndex.value, [-1, 0], [0, 1], Extrapolation.CLAMP),
  }));

  const containerStyle = useMemo(
    () => [style, { backgroundColor: '#4A3E36BF' }, containerAnimatedStyle],
    [style, containerAnimatedStyle]
  );

  return <AnimatedPressable onPress={() => dismiss()} style={containerStyle} />;
};
