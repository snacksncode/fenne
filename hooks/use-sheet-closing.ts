import { useState } from 'react';

export const useSheetClosing = () => {
  const [isClosing, setIsClosing] = useState(false);
  const onBeforeClose = () => setIsClosing(true);
  return { isClosing, onBeforeClose };
};
