import { TabBar } from '@/components/TabBar';
import { Tabs } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BookMarked, ShoppingBasket, Utensils } from 'lucide-react-native';
import { useCurrentUser } from '@/api/auth';
import { useInvitations } from '@/api/invitations';

export default function Layout() {
  useCurrentUser();
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
