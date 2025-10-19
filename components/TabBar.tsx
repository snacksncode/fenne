import React, { useCallback, useState } from 'react';
import { StyleSheet, View, LayoutChangeEvent, Pressable } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Animated, { useSharedValue, useDerivedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Text } from '@/components/Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PILL = '#F9954D';
const PILL_BORDER = '#EC8032';
const BAR_BG = '#493D34';
const TEXT = '#FEF7EA';
const R = 999;

type Props = BottomTabBarProps;

export const TabBar = ({ state, navigation, descriptors }: Props) => {
  const insets = useSafeAreaInsets();

  const [rowWidth, setRowWidth] = useState(0);
  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setRowWidth(e.nativeEvent.layout.width);
  }, []);

  const routes = state.routes.filter((r) => !['_sitemap', '+not-found'].includes(r.name));
  const tabWidth = rowWidth > 0 ? (rowWidth - 16) / routes.length : 0;

  const animatedIndex = useSharedValue(state.index);
  React.useEffect(() => {
    animatedIndex.value = withSpring(state.index, {
      stiffness: 1600,
      damping: 120,
      mass: 3,
    });
  }, [state.index, animatedIndex]);

  // Pill translateX derived from index
  const translateX = useDerivedValue(() => {
    return tabWidth * animatedIndex.value;
  }, [tabWidth]);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={[styles.wrapper, { bottom: insets.bottom }]} pointerEvents="box-none">
      <View onLayout={onLayout} style={styles.tabBar}>
        {tabWidth > 0 && <Animated.View pointerEvents="none" style={[styles.pill, { width: tabWidth }, pillStyle]} />}

        {routes.map((route) => {
          const { options } = descriptors[route.key];
          const label = typeof options.tabBarLabel === 'string' ? options.tabBarLabel : options.title ?? route.name;

          // const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({ type: 'tabLongPress', target: route.key });
          };

          return (
            <Pressable
              key={route.key}
              testID={options.tabBarButtonTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tab}
            >
              <Animated.View style={[styles.tabInner]}>
                {options.tabBarIcon
                  ? options.tabBarIcon({
                      focused: false,
                      size: 28,
                      color: TEXT,
                    })
                  : null}
                <Text style={styles.tabText}>{label}</Text>
              </Animated.View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  tabBar: {
    marginHorizontal: 16,
    backgroundColor: BAR_BG,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: R,
    padding: 8,
  },
  pill: {
    position: 'absolute',
    left: 8,
    top: 8,
    bottom: 8,
    borderRadius: R,
    backgroundColor: PILL,
    borderWidth: 1,
    borderBottomWidth: 2,
    borderColor: PILL_BORDER,
  },
  tab: {
    flex: 1,
    height: 56,
    borderRadius: R,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabInner: {
    height: 56,
    paddingHorizontal: 8,
    borderRadius: R,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabText: {
    color: TEXT,
    fontFamily: 'Satoshi-Bold',
    fontSize: 12,
    includeFontPadding: false,
  },
});
