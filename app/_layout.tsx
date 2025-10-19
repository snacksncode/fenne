import { TabBar } from '@/components/TabBar';
import { useFonts } from 'expo-font';
import { Tabs } from 'expo-router';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BookMarked, Coffee, NotepadText } from 'lucide-react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

export default function Layout() {
  // do these things static-ly later -- start
  useFonts({
    'Satoshi-Black': require('../assets/fonts/Satoshi-Black.otf'),
    'Satoshi-Bold': require('../assets/fonts/Satoshi-Bold.otf'),
    'Satoshi-Medium': require('../assets/fonts/Satoshi-Medium.otf'),
    'Satoshi-Regular': require('../assets/fonts/Satoshi-Regular.otf'),
  });
  StatusBar.setBarStyle('dark-content');
  // -- end

  return (
    <GestureHandlerRootView>
      <BottomSheetModalProvider>
        <SafeAreaProvider>
          <Tabs tabBar={(props) => <TabBar {...props} />}>
            <Tabs.Screen
              name="groceries"
              options={{
                title: 'Groceries',
                headerShown: false,
                tabBarIcon: (props) => <NotepadText {...props} />,
              }}
            />
            <Tabs.Screen
              name="index"
              options={{
                title: 'Menu',
                headerShown: false,
                tabBarIcon: (props) => <Coffee {...props} />,
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
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
