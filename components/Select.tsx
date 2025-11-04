import React, { FunctionComponent, useEffect, useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { Text } from '@/components/Text';
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { findIndex } from 'remeda';

const BORDER = '#4A3E36';
const R = 999;

export type Option<TValue extends string> = {
  value: TValue;
  text: string;
  icon: FunctionComponent<{ size: number; color: string }>;
};

type Props<TValue extends string> = {
  options: Option<TValue>[];
  value: TValue;
  onValueChange: (newValue: TValue) => void;
};

type OptionsProps<TValue extends string> = {
  options: Option<TValue>[];
} & ({ variant: 'mask' } | { variant: 'back'; onValueChange: (value: TValue) => void });

const Options = <TValue extends string>(props: OptionsProps<TValue>) => {
  const isMask = props.variant === 'mask';

  const handlePress = (option: Option<TValue>) => {
    if (!('onValueChange' in props)) return;
    props.onValueChange(option.value);
  };

  return (
    <View style={styles.rowInner}>
      {props.options.map((option, index) => (
        <Pressable onPress={() => handlePress(option)} key={index} style={styles.item}>
          <option.icon color={isMask ? '#FEF7EA' : '#4A3E36'} size={16} />
          <Text style={[styles.itemText, { color: isMask ? '#FEF7EA' : '#4A3E36' }]}>{option.text}</Text>
        </Pressable>
      ))}
    </View>
  );
};

export function SegmentedSelect<TValue extends string>({ options, value, onValueChange }: Props<TValue>) {
  const [rowWidth, setRowWidth] = useState(0);
  const selectedOptionIndex = findIndex(options, (option) => option.value === value);
  const sharedIndex = useSharedValue(selectedOptionIndex);

  useEffect(() => {
    sharedIndex.value = withSpring(selectedOptionIndex, { duration: 300 });
  }, [sharedIndex, selectedOptionIndex]);

  const tabWidth = rowWidth / options.length;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(sharedIndex.value, [0, options.length], [0, options.length * tabWidth]) }],
  }));

  return (
    <View style={styles.container}>
      <View style={styles.borderOverlay} />
      <View style={styles.row} onLayout={(e) => setRowWidth(e.nativeEvent.layout.width)}>
        <View style={StyleSheet.absoluteFill}>
          <Options variant="back" options={options} onValueChange={onValueChange} />
        </View>
        <MaskedView
          pointerEvents="none"
          style={StyleSheet.absoluteFill}
          maskElement={<Animated.View style={[styles.pillMask, { width: tabWidth }, animatedStyle]} />}
        >
          <View style={styles.pillBg} />
          <Options variant="mask" options={options} />
        </MaskedView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    height: 40,
    backgroundColor: '#FEF7EA',
    borderRadius: 999,
  },

  borderOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: BORDER,
    borderBottomWidth: 2,
    padding: 1,
    borderRadius: R,
  },

  row: {
    flex: 1,
    borderRadius: R,
    overflow: 'hidden',
    paddingHorizontal: 1,
    paddingVertical: 1,
  },

  rowInner: {
    flexDirection: 'row',
    height: 35,
    borderRadius: R,
    overflow: 'hidden',
  },

  item: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: R,
  },

  itemText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 12,
  },

  pillMask: {
    position: 'absolute',
    left: 2,
    top: 2,
    bottom: 3,
    borderRadius: R,
    backgroundColor: 'black',
  },

  pillBg: {
    position: 'absolute',
    right: 2,
    left: 2,
    top: 2,
    bottom: 3,
    borderRadius: R,
    backgroundColor: '#4A3E36',
  },
});
