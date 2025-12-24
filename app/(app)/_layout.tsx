import { Stack } from 'expo-router';

const AppLayout = () => {
  return (
    <Stack initialRouteName="(tabs)" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="new-recipe" />
      <Stack.Screen name="settings" />
    </Stack>
  );
};

export default AppLayout;
