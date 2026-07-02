import { useEffect, useState } from 'react';
import { Keyboard } from 'react-native';

export const useKeyboardOpen = () => {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardWillShow', () => setIsKeyboardOpen(true));
    const hideSub = Keyboard.addListener('keyboardWillHide', () => setIsKeyboardOpen(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return { isKeyboardOpen };
};
