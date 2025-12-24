import { useMount } from '@/hooks/use-mount';
import { useRef } from 'react';

export function useIsFirstRender() {
  const isFirstRender = useRef(true);

  useMount(() => {
    isFirstRender.current = false;
  });

  return { isFirstRender: isFirstRender.current };
}
