import React, { useCallback, useMemo, useState } from 'react';
import { View, TouchableOpacity, Platform, StyleSheet, LayoutChangeEvent, Animated as RNAnimated } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import type { MaterialTopTabBarProps } from '@react-navigation/material-top-tabs';

const PILL = '#4A3E36';
const TEXT_ACTIVE = '#FEF7EA';
const TEXT_INACTIVE = '#4A3E36';
const BORDER = '#4A3E36';
const R = 999;

type Props = MaterialTopTabBarProps;

export function TopTabBar({ state, descriptors, navigation, position }: Props) {
  const [rowWidth, setRowWidth] = useState(0);
  const onRowLayout = useCallback((e: LayoutChangeEvent) => {
    setRowWidth(e.nativeEvent.layout.width);
  }, []);

  const tabCount = state.routes.length || 2;
  const tabWidth = rowWidth > 0 ? rowWidth / tabCount : 0;

  const translateX = useMemo(() => {
    if (!tabWidth) return new RNAnimated.Value(0);

    const inputRange = state.routes.map((_, i) => i);
    const outputRange = state.routes.map((_, i) => i * tabWidth);

    return position.interpolate({
      inputRange,
      outputRange,
    });
  }, [position, tabWidth, state.routes]);

  const labels = state.routes.map((route) => {
    const { options } = descriptors[route.key];
    const label = typeof options.tabBarLabel === 'string' ? options.tabBarLabel : options.title ?? route.name;
    return { key: route.key, name: route.name, params: route.params, label };
  });

  return (
    <View style={styles.container}>
      <View pointerEvents="none" style={styles.borderOverlay} />

      {/* Base row defines geometry and is measured */}
      <View style={styles.row} onLayout={onRowLayout}>
        {/* 1) Dark layer: always visible everywhere */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <View style={styles.rowInner}>
            {labels.map((l) => (
              <View key={l.key} style={styles.item}>
                <RNAnimated.Text style={[styles.itemText, { color: TEXT_INACTIVE }]} numberOfLines={1}>
                  {l.label}
                </RNAnimated.Text>
              </View>
            ))}
          </View>
        </View>

        {/* 2) Light layer: shown only where the mask (pill) overlaps */}
        {tabWidth > 0 && (
          <MaskedView
            style={StyleSheet.absoluteFill}
            maskElement={
              <RNAnimated.View style={[styles.pillMask, { width: tabWidth, transform: [{ translateX }] }]} />
            }
          >
            {/* Fill the pill color under the light text so the pill is visible */}
            <View style={styles.pillBg} />
            <View style={styles.rowInner}>
              {labels.map((l) => (
                <View key={l.key} style={styles.item}>
                  <RNAnimated.Text style={[styles.itemText, { color: TEXT_ACTIVE }]} numberOfLines={1}>
                    {l.label}
                  </RNAnimated.Text>
                </View>
              ))}
            </View>
          </MaskedView>
        )}
      </View>

      {/* Touch targets */}
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        <View style={styles.rowTouch}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            const onLongPress = () => {
              navigation.emit({ type: 'tabLongPress', target: route.key });
            };

            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole={Platform.OS === 'web' ? 'link' : 'button'}
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                testID={options.tabBarButtonTestID}
                onPress={onPress}
                onLongPress={onLongPress}
                style={styles.itemTouch}
                activeOpacity={0.85}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    height: 34,
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
    height: 34,
    borderRadius: R,
    overflow: 'hidden',
  },

  rowTouch: { flexDirection: 'row', height: 34 },

  item: {
    flex: 1,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: R,
  },

  itemTouch: { flex: 1, height: 34 },

  itemText: { fontFamily: 'Satoshi-Bold', fontSize: 12 },

  pillMask: {
    position: 'absolute',
    left: 2,
    right: 2,
    top: 2,
    bottom: 3,
    borderRadius: R,
    backgroundColor: 'black', // alpha drives the mask
  },

  pillBg: {
    position: 'absolute',
    right: 2,
    left: 2,
    top: 2,
    bottom: 3,
    borderRadius: R,
    backgroundColor: PILL,
  },
});
