import { useEffect } from 'react';
import { ParamListBase, useNavigation } from 'expo-router/react-navigation';
import { BottomTabNavigationProp } from 'expo-router/js-tabs';

export function useActiveTabPress(onPress: () => void) {
  const navigation = useNavigation<BottomTabNavigationProp<ParamListBase>>();
  useEffect(
    () => navigation.addListener('tabPress', (event) => {
      if (!navigation.isFocused()) return;
      event.preventDefault();
      onPress();
    }),
    [navigation, onPress]
  );
}
