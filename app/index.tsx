import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { scrollTargetAtom, WeeklyScreen } from '@/components/WeeklyScreen';
import { MonthlyScreen } from '@/components/MonthlyScreen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TopTabBar } from '@/components/TopTabBar';
import { RouteTitle } from '@/components/RouteTitle';
import { View } from 'react-native';
import { Button } from '@/components/button';
import { Plus } from '@/components/svgs/plus';
import { useSetAtom } from 'jotai';

export type TabParamList = {
  Weekly: undefined;
  Monthly: undefined;
};

const Tab = createMaterialTopTabNavigator<TabParamList>();

const Index = () => {
  const insets = useSafeAreaInsets();
  const setScrollTarget = useSetAtom(scrollTargetAtom);

  return (
    <View
      style={{
        backgroundColor: '#FEF7EA',
        flex: 1,
      }}
    >
      <Tab.Navigator
        tabBar={(props) => (
          <RouteTitle
            text="Menu"
            footerSlot={
              <View style={{ marginTop: 12 }}>
                <TopTabBar {...props} />
              </View>
            }
          />
        )}
      >
        <Tab.Screen name="Weekly" component={WeeklyScreen} />
        <Tab.Screen name="Monthly" component={MonthlyScreen} />
      </Tab.Navigator>
      <Button
        onPress={() => setScrollTarget({ dateString: '2024-09-17', animated: true })}
        text="Schedule Meal"
        LeftIcon={Plus}
        style={{
          position: 'absolute',
          bottom: insets.bottom + 88,
          right: 16,
          width: 172,
        }}
      />
    </View>
  );
};

export default Index;
