import { TabBar } from '@/components/TabBar';
import { Tabs } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BookMarked, Coffee, NotepadText } from 'lucide-react-native';
import { useCurrentUser } from '@/api/auth';

export default function Layout() {
  useCurrentUser();

  return (
    <SafeAreaProvider>
      <Tabs tabBar={(props) => <TabBar {...props} />} initialRouteName="index">
        <Tabs.Screen
          name="index"
          options={{
            title: 'Menu',
            headerShown: false,
            tabBarIcon: (props) => <Coffee {...props} />,
          }}
        />
        <Tabs.Screen
          name="groceries"
          options={{
            title: 'Groceries',
            headerShown: false,
            tabBarIcon: (props) => <NotepadText {...props} />,
          }}
        />
        <Tabs.Screen
          name="recipes"
          options={{
            title: 'Recipes',
            headerShown: false,
            tabBarIcon: (props) => <BookMarked {...props} />,
          }}
        />
        {/* <StatusBar barStyle="dark-content" /> */}
      </Tabs>
    </SafeAreaProvider>
  );
}
