import { TabBar } from '@/components/TabBar';
import { Tabs } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Archive, BookMarked, ShoppingBasket, Utensils } from 'lucide-react-native';
import { useEnsureFamilyTimezone } from '@/api/auth';
import { useInvitations } from '@/api/invitations';

export default function Layout() {
  useEnsureFamilyTimezone();
  useInvitations();

  return (
    <SafeAreaProvider>
      <Tabs tabBar={(props) => <TabBar {...props} />} initialRouteName="index">
        <Tabs.Screen
          name="index"
          options={{
            title: 'Menu',
            headerShown: false,
            tabBarIcon: (props) => <Utensils {...props} />,
          }}
        />
        <Tabs.Screen
          name="groceries"
          options={{
            title: 'Groceries',
            headerShown: false,
            tabBarIcon: (props) => <ShoppingBasket {...props} />,
          }}
        />
        <Tabs.Screen
          name="pantry"
          options={{
            title: 'Pantry',
            headerShown: false,
            tabBarIcon: (props) => <Archive {...props} />,
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
      </Tabs>
    </SafeAreaProvider>
  );
}
