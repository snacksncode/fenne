import { Stack } from 'expo-router';

const AppLayout = () => {
  return (
    <Stack initialRouteName="(tabs)" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="new-recipe" />
      <Stack.Screen name="settings" options={{ presentation: 'pageSheet' }} />
    </Stack>
  );
};

export default AppLayout;
