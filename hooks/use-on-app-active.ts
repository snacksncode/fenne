import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

export const useOnAppActive = (callback: () => void) => {
  const appState = useRef(AppState.currentState);
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    callbackRef.current();

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        callbackRef.current();
      }
      appState.current = nextAppState;
    });

    return () => subscription.remove();
  }, []);
};
