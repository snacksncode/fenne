import { useKeyboardState } from 'react-native-keyboard-controller';

export const useKeyboardOpen = () => ({
  isKeyboardOpen: useKeyboardState((state) => state.isVisible),
});
