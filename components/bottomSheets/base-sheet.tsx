import {
  BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetModalProps,
  BottomSheetView,
  useBottomSheetInternal,
  useBottomSheetModal,
} from '@gorhom/bottom-sheet';
import React, { ReactNode, Ref } from 'react';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { Keyboard, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type BaseSheetProps<T> = BottomSheetModalProps<T> & {
  ref: Ref<BottomSheetModal>;
  backdropDismissBehavior?: 'dismissAll';
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type BackdropProps = BottomSheetBackdropProps & {
  backdropDismissBehavior?: 'dismissAll';
};

const Backdrop = ({ animatedIndex, style, backdropDismissBehavior }: BackdropProps) => {
  const { dismiss, dismissAll } = useBottomSheetModal();

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(animatedIndex.value, [-1, 0], [0, 1], Extrapolation.CLAMP),
  }));

  return (
    <AnimatedPressable
      onPress={() => {
        if (Keyboard.isVisible()) return;
        if (backdropDismissBehavior === 'dismissAll') return dismissAll();
        return dismiss();
      }}
      style={[style, { backgroundColor: '#4A3E36BF' }, containerAnimatedStyle]}
    />
  );
};

const styles = StyleSheet.create({
  background: {
    backgroundColor: '#FEF7EA',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  handle: {
    width: 64,
    backgroundColor: '#766356',
  },
});

export const BaseSheet = <T,>({ children: Children, backdropDismissBehavior, ref, ...props }: BaseSheetProps<T>) => (
  <BottomSheetModal
    ref={ref}
    handleIndicatorStyle={styles.handle}
    handleStyle={{ paddingBottom: 16 }}
    backdropComponent={(props) => <Backdrop {...props} backdropDismissBehavior={backdropDismissBehavior} />}
    backgroundComponent={({ style, ...props }) => <View style={[style, styles.background]} {...props} />}
    keyboardBlurBehavior="restore"
    {...props}
  >
    {(renderProps) => <>{typeof Children === 'function' ? <Children {...renderProps} /> : Children}</>}
  </BottomSheetModal>
);

BaseSheet.Container = function Container(props: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <BottomSheetView style={{ paddingBottom: insets.bottom, paddingHorizontal: 20 }}>{props.children}</BottomSheetView>
  );
};
