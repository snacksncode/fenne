import React, { useCallback, useState } from 'react';
import { StyleSheet, View, LayoutChangeEvent } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Animated, { useSharedValue, useDerivedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Typography } from '@/components/Typography';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOnPressWithFeedback } from '@/hooks/use-tap-feedback-gesture';
import { NavigationRoute, ParamListBase } from '@react-navigation/native';
import { GestureDetector } from 'react-native-gesture-handler';
import { colors } from '@/constants/colors';

type Props = BottomTabBarProps;

const Tab = ({
  route,
  navigation,
  descriptors,
}: {
  route: NavigationRoute<ParamListBase, string>;
  navigation: BottomTabBarProps['navigation'];
  descriptors: BottomTabBarProps['descriptors'];
}) => {
  const { options } = descriptors[route.key];
  const label = typeof options.tabBarLabel === 'string' ? options.tabBarLabel : (options.title ?? route.name);

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

  const { gesture, scaleStyle } = useOnPressWithFeedback({ onPress, scaleTo: 0.9, feedbackStyle: null });

  return (
    <GestureDetector gesture={gesture}>
      <View key={route.key} testID={options.tabBarButtonTestID} style={styles.tab}>
        <Animated.View style={[styles.tabInner, scaleStyle]}>
          {options.tabBarIcon
            ? options.tabBarIcon({
                focused: false,
                size: 28,
                color: colors.cream[100],
              })
            : null}
          <Typography variant="body-xs" weight="bold" color={colors.cream[100]}>
            {label}
          </Typography>
        </Animated.View>
      </View>
    </GestureDetector>
  );
};

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
        {routes.map((route) => (
          <Tab key={route.name} route={route} navigation={navigation} descriptors={descriptors} />
        ))}
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
    backgroundColor: colors.brown[900],
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    padding: 8,
  },
  pill: {
    position: 'absolute',
    left: 8,
    top: 8,
    bottom: 8,
    borderRadius: 999,
    backgroundColor: colors.orange[500],
    borderWidth: 1,
    borderBottomWidth: 2,
    borderColor: colors.orange[600],
  },
  tab: {
    flex: 1,
    height: 56,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabInner: {
    height: 56,
    paddingHorizontal: 8,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
});
